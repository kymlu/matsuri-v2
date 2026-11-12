import { Choreo } from "../../models/choreo";
import { ChoreoSection, Formation } from "../../models/choreoSection";
import { DancerPosition } from "../../models/dancer";
import { Prop, PropPosition } from "../../models/prop";
import { StageEntities } from "../../models/history";

// A stack is a list of ids, bottom first. Everyone in it is at the bottom member's spot,
// and their z values are consecutive in that order. Dancers and props stack separately.
export type StackKind = "dancers" | "props";
export type Stack = string[];

const stacksKey = (kind: StackKind) => kind === "dancers" ? "dancerStacks" : "propStacks";

export function getStacks(formation: Formation, kind: StackKind): Stack[] {
  return formation[stacksKey(kind)] ?? [];
}

export function findStack(formation: Formation, kind: StackKind, id: string): Stack | undefined {
  return getStacks(formation, kind).find(s => s.includes(id));
}

// In a stack, but not the one on top (so it can't be seen on the stage).
export function isHiddenInStack(formation: Formation, kind: StackKind, id: string): boolean {
  const stack = findStack(formation, kind, id);
  return stack !== undefined && stack[stack.length - 1] !== id;
}

export function stackBelow(formation: Formation, kind: StackKind, id: string): string | undefined {
  const stack = findStack(formation, kind, id);
  if (!stack) return undefined;
  const i = stack.indexOf(id);
  return i > 0 ? stack[i - 1] : undefined;
}

export function stackAbove(formation: Formation, kind: StackKind, id: string): string | undefined {
  const stack = findStack(formation, kind, id);
  if (!stack) return undefined;
  const i = stack.indexOf(id);
  return i < stack.length - 1 ? stack[i + 1] : undefined;
}

// ---- normalising ----

const sameStacks = (a?: Stack[], b?: Stack[]) =>
  JSON.stringify(a ?? []) === JSON.stringify(b ?? []);

// Ids that still have a position, each in one stack at most, stacks of two or more.
function cleanStacks(stacks: Stack[] | undefined, exists: (id: string) => boolean): Stack[] {
  const seen = new Set<string>();
  return (stacks ?? [])
    .map(s => s.filter(id => exists(id) && !seen.has(id) && (seen.add(id), true)))
    .filter(s => s.length >= 2);
}

// Members after the first get the bottom member's spot; z becomes consecutive in stack order,
// with everything else keeping its order. Returns the same record when nothing changes.
function applyStacks<T extends { x: number, y: number, z?: number }>(
  positions: Record<string, T>,
  stacks: Stack[],
  spotFor: (base: T, member: T, memberId: string) => { x: number, y: number },
): Record<string, T> {
  if (stacks.length === 0) return positions;
  let changed = false;
  const next: Record<string, T> = { ...positions };

  stacks.forEach(stack => {
    const base = next[stack[0]];
    stack.slice(1).forEach(id => {
      const spot = spotFor(base, next[id], id);
      if (next[id].x !== spot.x || next[id].y !== spot.y) {
        next[id] = { ...next[id], x: spot.x, y: spot.y };
        changed = true;
      }
    });
  });

  // Order by z, then pull each stack together at its bottom member's place, in stack order.
  const inStack = new Map<string, Stack>();
  stacks.forEach(s => s.forEach(id => inStack.set(id, s)));
  const ordered = Object.keys(next).sort((a, b) => (next[a].z ?? 0) - (next[b].z ?? 0));
  const result: string[] = [];
  ordered.forEach(id => {
    const stack = inStack.get(id);
    if (!stack) { result.push(id); return; }
    if (stack[0] === id) result.push(...stack);
  });
  result.forEach((id, i) => {
    if (next[id].z !== i) {
      next[id] = { ...next[id], z: i };
      changed = true;
    }
  });

  return changed ? next : positions;
}

const dancerSpot = (base: DancerPosition) => ({ x: base.x, y: base.y });

// Props are positioned by their top-left corner, so centre each on the bottom prop.
const propSpot = (props: Record<string, Prop>) => (base: PropPosition, member: PropPosition) => {
  const b = props[base.propId], m = props[member.propId];
  if (!b || !m) return { x: base.x, y: base.y };
  return { x: base.x + (b.width - m.width) / 2, y: base.y + (b.length - m.length) / 2 };
};

export function normalizeSection(section: ChoreoSection, props: Record<string, Prop>): ChoreoSection {
  const f = section.formation;
  if (!f.dancerStacks?.length && !f.propStacks?.length) return section;

  const dancerStacks = cleanStacks(f.dancerStacks, id => !!f.dancerPositions[id]);
  const propStacks = cleanStacks(f.propStacks, id => !!f.propPositions[id]);
  const dancerPositions = applyStacks(f.dancerPositions, dancerStacks, dancerSpot);
  const propPositions = applyStacks(f.propPositions, propStacks, propSpot(props));

  if (dancerPositions === f.dancerPositions && propPositions === f.propPositions &&
    sameStacks(dancerStacks, f.dancerStacks) && sameStacks(propStacks, f.propStacks)) {
    return section;
  }
  return {
    ...section,
    formation: {
      ...f,
      dancerPositions,
      propPositions,
      dancerStacks: dancerStacks.length ? dancerStacks : undefined,
      propStacks: propStacks.length ? propStacks : undefined,
    },
  };
}

// Restores the stack rules after any change. Returns the same object when nothing changes.
export function normalizeStacks(state: Choreo): Choreo {
  let changed = false;
  const sections = state.sections.map(s => {
    const n = normalizeSection(s, state.props);
    if (n !== s) changed = true;
    return n;
  });
  return changed ? { ...state, sections } : state;
}

// ---- commands ----

function updateSection(state: Choreo, sectionId: string, update: (f: Formation) => Formation): Choreo {
  return normalizeStacks({
    ...state,
    sections: state.sections.map(s => s.id === sectionId ? { ...s, formation: update(s.formation) } : s),
  });
}

export type StackSpot = "bottom" | "middle";

// Stacks the given ids into one flat stack, in the given order (top first, as shown to the editor).
// Any stacks they were in are merged in. "middle" puts the stack at the average of their spots.
export function stackObjects(state: Choreo, sectionId: string, kind: StackKind, topFirst: string[], spot: StackSpot = "bottom"): Choreo {
  if (topFirst.length < 2) return state;
  const bottomFirst = [...topFirst].reverse();
  return updateSection(state, sectionId, f => {
    const key = stacksKey(kind);
    const others = getStacks(f, kind).map(s => s.filter(id => !bottomFirst.includes(id)));
    let next: Formation = { ...f, [key]: [...others, bottomFirst] };
    if (spot === "middle") {
      next = moveToAverage(next, kind, bottomFirst);
    }
    return next;
  });
}

// Moves the bottom member to the average spot; the normaliser brings the rest along.
function moveToAverage(f: Formation, kind: StackKind, ids: string[]): Formation {
  const positions = kind === "dancers" ? f.dancerPositions : f.propPositions;
  const points = ids.map(id => positions[id]).filter(Boolean);
  if (points.length === 0) return f;
  const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const base = ids[0];
  if (kind === "dancers") {
    return { ...f, dancerPositions: { ...f.dancerPositions, [base]: { ...f.dancerPositions[base], x, y } } };
  }
  return { ...f, propPositions: { ...f.propPositions, [base]: { ...f.propPositions[base], x, y } } };
}

// Takes ids out of their stacks. They stay where they are; a stack left with one member ends.
export function unstackObjects(state: Choreo, sectionId: string, kind: StackKind, ids: string[]): Choreo {
  return updateSection(state, sectionId, f => ({
    ...f,
    [stacksKey(kind)]: getStacks(f, kind).map(s => s.filter(id => !ids.includes(id))),
  }));
}

// New order for an existing stack, top first. Nobody moves; only the order changes.
export function reorderStack(state: Choreo, sectionId: string, kind: StackKind, topFirst: string[]): Choreo {
  const bottomFirst = [...topFirst].reverse();
  return updateSection(state, sectionId, f => {
    const stacks = getStacks(f, kind);
    const i = stacks.findIndex(s => s.length === bottomFirst.length && s.every(id => bottomFirst.includes(id)));
    if (i < 0) return f;
    // The spot stays the old bottom member's, so moving someone else to the bottom doesn't move the stack.
    const oldBase = stacks[i][0];
    const next = stacks.map((s, j) => j === i ? bottomFirst : s);
    const positions = kind === "dancers" ? f.dancerPositions : f.propPositions;
    const newBase = bottomFirst[0];
    const moved = { ...positions, [newBase]: { ...positions[newBase], x: positions[oldBase].x, y: positions[oldBase].y } };
    return kind === "dancers"
      ? { ...f, dancerStacks: next, dancerPositions: moved as Formation["dancerPositions"] }
      : { ...f, propStacks: next, propPositions: moved as Formation["propPositions"] };
  });
}

// ---- selection ----

// Stage taps in the editor select whole stacks: anyone newly selected brings their stack,
// anyone newly unselected takes their stack out.
export function expandSelectionToStacks(
  formation: Formation,
  prev: StageEntities<string[]>,
  next: StageEntities<string[]>,
): StageEntities<string[]> {
  const expand = (kind: StackKind, before: string[], after: string[]) => {
    const added = after.filter(id => !before.includes(id));
    const removed = before.filter(id => !after.includes(id));
    let result = [...after];
    removed.forEach(id => {
      const s = findStack(formation, kind, id);
      if (s) result = result.filter(x => !s.includes(x));
    });
    added.forEach(id => {
      const s = findStack(formation, kind, id);
      if (s) s.forEach(x => { if (!result.includes(x)) result.push(x); });
    });
    return result;
  };
  return {
    dancers: expand("dancers", prev.dancers, next.dancers),
    props: expand("props", prev.props, next.props),
    obstacles: next.obstacles,
  };
}

// How many separate things are selected, counting a whole stack as one.
export function countUnits(formation: Formation, kind: StackKind, ids: string[]): number {
  const seen = new Set<string>();
  let count = 0;
  ids.forEach(id => {
    if (seen.has(id)) return;
    const s = findStack(formation, kind, id);
    (s ?? [id]).forEach(x => seen.add(x));
    count++;
  });
  return count;
}

// The one stack the selection is exactly made of, if it is one whole stack.
export function selectedWholeStack(formation: Formation, kind: StackKind, ids: string[]): Stack | undefined {
  if (ids.length < 2) return undefined;
  const s = findStack(formation, kind, ids[0]);
  return s && s.length === ids.length && s.every(id => ids.includes(id)) ? s : undefined;
}

// ---- dropping onto something ----

const DROP_DISTANCE = 0.2; // metres between centres that counts as "dropped onto"

function unitOf(formation: Formation, kind: StackKind, id: string): Stack {
  return findStack(formation, kind, id) ?? [id];
}

function centreOf(formation: Formation, kind: StackKind, id: string, props: Record<string, Prop>): { x: number, y: number } | undefined {
  if (kind === "dancers") {
    const p = formation.dancerPositions[id];
    return p && { x: p.x, y: p.y };
  }
  const p = formation.propPositions[id];
  const prop = props[id];
  return p && prop && { x: p.x + prop.width / 2, y: p.y + prop.length / 2 };
}

// When one thing (a person, a prop, or one whole stack) was just moved, the nearest other thing of the
// same kind whose centre is within DROP_DISTANCE, as its whole stack. Undefined otherwise.
export function findDropTarget(formation: Formation, kind: StackKind, movedIds: string[], props: Record<string, Prop>): Stack | undefined {
  if (movedIds.length === 0) return undefined;
  const moved = unitOf(formation, kind, movedIds[0]);
  if (moved.length !== movedIds.length || !movedIds.every(id => moved.includes(id))) return undefined;
  const from = centreOf(formation, kind, moved[0], props);
  if (!from) return undefined;

  const ids = Object.keys(kind === "dancers" ? formation.dancerPositions : formation.propPositions);
  let best: { unit: Stack, distance: number } | undefined;
  const checked = new Set<string>(moved);
  ids.forEach(id => {
    if (checked.has(id)) return;
    const unit = unitOf(formation, kind, id);
    unit.forEach(x => checked.add(x));
    const c = centreOf(formation, kind, unit[0], props);
    if (!c) return;
    const distance = Math.hypot(c.x - from.x, c.y - from.y);
    if (distance <= DROP_DISTANCE && (!best || distance < best.distance)) best = { unit, distance };
  });
  return best?.unit;
}
