import { BaseModel, Coordinates } from "../../models/base";
import { Choreo, EventDetails, StageGeometry } from "../../models/choreo";
import { ChoreoSection, Movement } from "../../models/choreoSection";
import { DancerPosition } from "../../models/dancer";
import { DancerAction } from "../../models/dancerAction";
import { indexByKey, roundToTenth } from "./globalHelper";

// Compares two versions of a choreo for the dancer change log.
// Only returns data; all wording is done by the dialog.

export type ListChanges = {
  added: string[],
  removed: string[],
  renamed: [string, string][],
};

export type DancerSectionChanges = {
  sectionId: string,
  oldSectionName?: string,
  isNew: boolean,
  position?: { from?: DancerPosition, to: DancerPosition },
  counts: { actionName: string, from: string[], to: string[] }[],
  pathChanged: boolean, // path from this section to the next
};

export type DancerChangeEntry =
  | { kind: "new" }
  | { kind: "changed", sections: DancerSectionChanges[] };

export type ActionLine = {
  sectionId: string,
  actionName: string,
  countName?: string, // set when the change is to a count in the action
  change: "added" | "removed" | "renamed",
  oldName?: string,
};

export type PropLine = {
  name: string,
  moved: string[], // section IDs
  nowInUse: string[],
  nowUnused: string[],
};

export type ObstacleLine = {
  name: string,
  fields: ("position" | "size" | "rotation")[],
};

export type ChangeLog = {
  overall: {
    event: {
      name?: [string, string],
      dates?: [EventDetails, EventDetails],
    },
    stage?: [StageGeometry, StageGeometry],
    sections: ListChanges & { reordered: boolean },
    memos: string[], // section IDs
    dancers: ListChanges,
    actions: ActionLine[],
    props: ListChanges & { lines: PropLine[] },
    obstacles: ListChanges & { lines: ObstacleLine[] },
  },
  dancers: Record<string, DancerChangeEntry>,
};

type Match<T> = {
  oldOf: Record<string, T>, // keyed by new ID
  added: T[],
  removed: T[],
};

// Blank and missing text are the same (e.g. dates are saved as either).
const sameText = (a?: string, b?: string) => (a ?? "").trim() === (b ?? "").trim();
const samePoint = (a: Coordinates, b: Coordinates) =>
  roundToTenth(a.x) === roundToTenth(b.x) && roundToTenth(a.y) === roundToTenth(b.y);
// Compares an old position with a new one, each against its own version's stage.
type SamePosition = (oldPosition: Coordinates, newPosition: Coordinates) => boolean;
const sameRotation = (a?: number, b?: number) => Math.round(a ?? 0) === Math.round(b ?? 0);

function matchById<T extends BaseModel>(oldItems: T[], newItems: T[]): Match<T> {
  const oldById = indexByKey(oldItems, "id");
  const newById = indexByKey(newItems, "id");
  const oldOf: Record<string, T> = {};
  newItems.filter(x => oldById[x.id]).forEach(x => oldOf[x.id] = oldById[x.id]);
  return {
    oldOf,
    added: newItems.filter(x => !oldById[x.id]),
    removed: oldItems.filter(x => !newById[x.id]),
  };
}

// Matches by ID, then pairs a leftover removed and added item when each is the only one with that name.
function matchByIdThenName<T extends BaseModel>(oldItems: T[], newItems: T[]): Match<T> {
  const { oldOf, added, removed } = matchById(oldItems, newItems);
  const withName = (items: T[], name: string) => items.filter(x => sameText(x.name, name));
  added.forEach(x => {
    const candidates = withName(removed, x.name);
    if (candidates.length === 1 && withName(added, x.name).length === 1) {
      oldOf[x.id] = candidates[0];
    }
  });
  const pairedOldIds = new Set(Object.values(oldOf).map(x => x.id));
  return {
    oldOf,
    added: added.filter(x => !oldOf[x.id]),
    removed: removed.filter(x => !pairedOldIds.has(x.id)),
  };
}

function getListChanges<T extends BaseModel>(match: Match<T>, newItems: T[]): ListChanges {
  return {
    added: match.added.map(x => x.name),
    removed: match.removed.map(x => x.name),
    renamed: newItems
      .filter(x => match.oldOf[x.id] && !sameText(match.oldOf[x.id].name, x.name))
      .map(x => [match.oldOf[x.id].name, x.name]),
  };
}

// A missing movement is drawn curved. With no midpoints the path is straight whatever the tension.
function samePath(samePosition: SamePosition, a?: Movement, b?: Movement) {
  const pointsA = a?.points ?? [];
  const pointsB = b?.points ?? [];
  return pointsA.length === pointsB.length &&
    pointsA.every((p, i) => samePosition(p, pointsB[i])) &&
    (pointsA.length === 0 || (a?.tension ?? "curved") === (b?.tension ?? "curved"));
}

// Count IDs and names this dancer is in, per action ID.
function getCounts(actions: DancerAction[], dancerId: string) {
  const result: Record<string, { actionName: string, counts: BaseModel[] }> = {};
  actions.forEach(action => {
    const counts = action.timings.filter(t => t.dancerIds.includes(dancerId));
    if (counts.length > 0) {
      result[action.id] = { actionName: action.name, counts };
    }
  });
  return result;
}

function compareCounts(oldActions: DancerAction[], newActions: DancerAction[], oldDancerId: string, newDancerId: string) {
  const oldCounts = getCounts(oldActions, oldDancerId);
  const newCounts = getCounts(newActions, newDancerId);
  const countIds = (entry?: { counts: BaseModel[] }) => (entry?.counts.map(x => x.id) ?? []).sort().join();
  const actionIds = Array.from(new Set([...Object.keys(newCounts), ...Object.keys(oldCounts)]));
  return actionIds
    .filter(id => countIds(oldCounts[id]) !== countIds(newCounts[id]))
    .map(id => ({
      actionName: (newCounts[id] ?? oldCounts[id]).actionName,
      from: oldCounts[id]?.counts.map(x => x.name) ?? [],
      to: newCounts[id]?.counts.map(x => x.name) ?? [],
    }));
}

function compareDancer(
  newChoreo: Choreo, samePosition: SamePosition, sectionMatch: Match<ChoreoSection>, oldDancerId: string, newDancerId: string
): DancerSectionChanges[] {
  const changes: DancerSectionChanges[] = newChoreo.sections.map(section => {
    const oldSection = sectionMatch.oldOf[section.id];
    const newPosition = section.formation.dancerPositions[newDancerId];
    const oldPosition = oldSection?.formation.dancerPositions[oldDancerId];
    return {
      sectionId: section.id,
      oldSectionName: oldSection && !sameText(oldSection.name, section.name) ? oldSection.name : undefined,
      isNew: !oldSection,
      position: !newPosition ? undefined :
        !oldPosition ? { to: newPosition } :
        samePosition(oldPosition, newPosition) ? undefined :
        { from: oldPosition, to: newPosition },
      counts: compareCounts(oldSection?.formation.dancerActions ?? [], section.formation.dancerActions, oldDancerId, newDancerId),
      pathChanged: false,
    };
  });

  // Paths are stored on the section they lead to, but listed under the section they start from.
  newChoreo.sections.forEach((section, i) => {
    const oldSection = sectionMatch.oldOf[section.id];
    if (i > 0 && oldSection && !samePath(samePosition, oldSection.formation.dancerMovements?.[oldDancerId], section.formation.dancerMovements?.[newDancerId])) {
      changes[i - 1].pathChanged = true;
    }
  });

  return changes.filter(x => x.isNew || x.position || x.counts.length > 0 || x.pathChanged);
}

function compareActions(oldSection: ChoreoSection, newSection: ChoreoSection): ActionLine[] {
  const sectionId = newSection.id;
  const actionMatch = matchById(oldSection.formation.dancerActions, newSection.formation.dancerActions);
  const lines: ActionLine[] = [];
  newSection.formation.dancerActions.forEach(action => {
    const oldAction = actionMatch.oldOf[action.id];
    if (!oldAction) {
      lines.push({ sectionId, actionName: action.name, change: "added" });
      return;
    }
    if (!sameText(oldAction.name, action.name)) {
      lines.push({ sectionId, actionName: action.name, change: "renamed", oldName: oldAction.name });
    }
    const countChanges = getListChanges(matchById(oldAction.timings, action.timings), action.timings);
    countChanges.added.forEach(name => lines.push({ sectionId, actionName: action.name, countName: name, change: "added" }));
    countChanges.removed.forEach(name => lines.push({ sectionId, actionName: action.name, countName: name, change: "removed" }));
    countChanges.renamed.forEach(([oldName, name]) => lines.push({ sectionId, actionName: action.name, countName: name, change: "renamed", oldName }));
  });
  actionMatch.removed.forEach(action => lines.push({ sectionId, actionName: action.name, change: "removed" }));
  return lines;
}

function compareProps(newChoreo: Choreo, samePosition: SamePosition, sectionMatch: Match<ChoreoSection>, propMatch: Match<BaseModel>): PropLine[] {
  return Object.values(newChoreo.props)
    .filter(prop => propMatch.oldOf[prop.id])
    .map(prop => {
      const oldPropId = propMatch.oldOf[prop.id].id;
      const line: PropLine = { name: prop.name, moved: [], nowInUse: [], nowUnused: [] };
      newChoreo.sections.forEach(section => {
        const oldPosition = sectionMatch.oldOf[section.id]?.formation.propPositions[oldPropId];
        const newPosition = section.formation.propPositions[prop.id];
        if (!oldPosition || !newPosition) return;
        if (!samePosition(oldPosition, newPosition) || !sameRotation(oldPosition.rotation, newPosition.rotation)) line.moved.push(section.id);
        if (!oldPosition.inUse && newPosition.inUse) line.nowInUse.push(section.id);
        if (oldPosition.inUse && !newPosition.inUse) line.nowUnused.push(section.id);
      });
      return line;
    })
    .filter(x => x.moved.length + x.nowInUse.length + x.nowUnused.length > 0);
}

function compareObstacles(oldChoreo: Choreo, newChoreo: Choreo, samePosition: SamePosition, obstacleMatch: Match<BaseModel>): ObstacleLine[] {
  const oldObstacles = oldChoreo.obstacles ?? {};
  return Object.values(newChoreo.obstacles ?? {})
    .filter(obstacle => obstacleMatch.oldOf[obstacle.id])
    .map(obstacle => {
      const old = oldObstacles[obstacleMatch.oldOf[obstacle.id].id];
      const fields: ObstacleLine["fields"] = [];
      if (!samePosition(old, obstacle)) fields.push("position");
      if (roundToTenth(old.length) !== roundToTenth(obstacle.length) || roundToTenth(old.width) !== roundToTenth(obstacle.width)) fields.push("size");
      if (!sameRotation(old.rotation, obstacle.rotation)) fields.push("rotation");
      return { name: obstacle.name, fields };
    })
    .filter(x => x.fields.length > 0);
}

function isReordered(oldSections: ChoreoSection[], newSections: ChoreoSection[], sectionMatch: Match<ChoreoSection>) {
  const oldIndexes = newSections
    .filter(x => sectionMatch.oldOf[x.id])
    .map(x => oldSections.indexOf(sectionMatch.oldOf[x.id]));
  return oldIndexes.some((index, i) => i > 0 && index < oldIndexes[i - 1]);
}

export function buildChangeLog(oldChoreo: Choreo, newChoreo: Choreo): ChangeLog {
  // x is compared from the stage centre, as displayed, so a resize that keeps everyone centred isn't a move.
  const fromCentre = (position: Coordinates, geometry: StageGeometry) => ({ x: position.x - geometry.stageWidth / 2, y: position.y });
  const samePosition: SamePosition = (oldPosition, newPosition) =>
    samePoint(fromCentre(oldPosition, oldChoreo.stageGeometry), fromCentre(newPosition, newChoreo.stageGeometry));
  const sectionMatch = matchByIdThenName(oldChoreo.sections, newChoreo.sections);
  const newDancers = Object.values(newChoreo.dancers);
  const dancerMatch = matchByIdThenName(Object.values(oldChoreo.dancers), newDancers);
  const newProps = Object.values(newChoreo.props);
  const propMatch = matchByIdThenName(Object.values(oldChoreo.props), newProps);
  const newObstacles = Object.values(newChoreo.obstacles ?? {});
  const obstacleMatch = matchByIdThenName(Object.values(oldChoreo.obstacles ?? {}), newObstacles);

  const dancers: Record<string, DancerChangeEntry> = {};
  newDancers.forEach(dancer => {
    const oldDancer = dancerMatch.oldOf[dancer.id];
    if (!oldDancer) {
      dancers[dancer.id] = { kind: "new" };
      return;
    }
    const sections = compareDancer(newChoreo, samePosition, sectionMatch, oldDancer.id, dancer.id);
    if (sections.length > 0) {
      dancers[dancer.id] = { kind: "changed", sections };
    }
  });

  const oldGeometry = oldChoreo.stageGeometry;
  const newGeometry = newChoreo.stageGeometry;
  const matchedSections = newChoreo.sections.filter(x => sectionMatch.oldOf[x.id]);

  return {
    overall: {
      event: {
        name: !sameText(oldChoreo.event, newChoreo.event) ? [oldChoreo.event, newChoreo.event] : undefined,
        dates: !sameText(oldChoreo.startDate, newChoreo.startDate) || !sameText(oldChoreo.endDate, newChoreo.endDate) ?
          [
            { startDate: oldChoreo.startDate, endDate: oldChoreo.endDate },
            { startDate: newChoreo.startDate, endDate: newChoreo.endDate },
          ] :
          undefined,
      },
      stage: oldGeometry.stageWidth !== newGeometry.stageWidth || oldGeometry.stageLength !== newGeometry.stageLength ?
        [oldGeometry, newGeometry] :
        undefined,
      sections: {
        ...getListChanges(sectionMatch, newChoreo.sections),
        reordered: isReordered(oldChoreo.sections, newChoreo.sections, sectionMatch),
      },
      memos: matchedSections
        .filter(x => !sameText(sectionMatch.oldOf[x.id].note, x.note))
        .map(x => x.id),
      dancers: getListChanges(dancerMatch, newDancers),
      actions: matchedSections.flatMap(x => compareActions(sectionMatch.oldOf[x.id], x)),
      props: {
        ...getListChanges(propMatch, newProps),
        lines: compareProps(newChoreo, samePosition, sectionMatch, propMatch),
      },
      obstacles: {
        ...getListChanges(obstacleMatch, newObstacles),
        lines: compareObstacles(oldChoreo, newChoreo, samePosition, obstacleMatch),
      },
    },
    dancers,
  };
}

export function hasShownChanges(log: ChangeLog): boolean {
  const { event, stage, sections, memos, dancers, actions, props, obstacles } = log.overall;
  const changeCount = (x: ListChanges) => x.added.length + x.removed.length + x.renamed.length;
  return !!event.name || !!event.dates || !!stage || sections.reordered ||
    changeCount(sections) + changeCount(dancers) + changeCount(props) + changeCount(obstacles) +
    memos.length + actions.length + props.lines.length + obstacles.lines.length +
    Object.keys(log.dancers).length > 0;
}
