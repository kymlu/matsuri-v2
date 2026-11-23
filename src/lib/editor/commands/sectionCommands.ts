import { Choreo } from "../../../models/choreo"
import { ChoreoSection } from "../../../models/choreoSection"
import { DancerAction } from "../../../models/dancerAction";
import { incrementBracketSuffix } from "../../helpers/globalHelper";

// Copies of a section's positions for another section: new objects with that section's id, so the
// source section (and the undo history that holds it) is never changed.
const copyPositions = <T extends { sectionId: string }>(positions: Record<string, T> | undefined, sectionId: string): Record<string, T> =>
  Object.fromEntries(Object.entries(positions ?? {}).map(([id, position]) => [id, { ...position, sectionId }]));

// What a new section copies its positions from: the one it goes after, or the last one.
const baseSection = (state: Choreo, afterIndex?: number) => state.sections[afterIndex ?? state.sections.length - 1];

// What a new section is called unless it's named when added.
export const newSectionName = (state: Choreo, afterIndex?: number) => {
  const base = baseSection(state, afterIndex);
  return base ? incrementBracketSuffix(base.name) : "セクション1";
}

// Starts from where everyone ended in the section before it, with no actions or paths. Goes at the end unless afterIndex is given.
// actions: the 振り it starts with, e.g. copied from the 隊列表's song.
export function addSection(state: Choreo, id: string, name?: string, afterIndex?: number, actions: DancerAction[] = []): Choreo {
  const previousSection = baseSection(state, afterIndex);
  const insertAt = afterIndex === undefined ? state.sections.length : afterIndex + 1;
  const newSection = {
    id: id,
    name: name ?? newSectionName(state, afterIndex),
    formation: {
      dancerPositions: copyPositions(previousSection?.formation.dancerPositions, id),
      propPositions: copyPositions(previousSection?.formation.propPositions, id),
      // Positions are copied, so stacks are too; otherwise the people on top would just overlap.
      dancerStacks: previousSection?.formation.dancerStacks?.map(s => [...s]),
      propStacks: previousSection?.formation.propStacks?.map(s => [...s]),
      dancerActions: actions,
    },
  } as ChoreoSection;

  return {
    ...state,
    sections: [...state.sections.slice(0, insertAt), newSection, ...state.sections.slice(insertAt)],
  };
}

// A copy of positions, actions, counts and the memo, inserted at index. Paths are left out: they lead in from the section before the original.
// Actions and counts get new ids so the two sections never share them.
export function duplicateSection(state: Choreo, section: ChoreoSection, index: number, newId: string = crypto.randomUUID()): Choreo {
  const duplicatedSection: ChoreoSection = {
    ...section,
    id: newId,
    formation: {
      ...section.formation,
      dancerPositions: copyPositions(section.formation.dancerPositions, newId),
      propPositions: copyPositions(section.formation.propPositions, newId),
      dancerMovements: undefined,
      propMovements: undefined,
      dancerActions: section.formation.dancerActions.map(action => ({
        ...action,
        id: crypto.randomUUID(),
        timings: action.timings.map(timing => ({ ...timing, id: crypto.randomUUID(), dancerIds: [...timing.dancerIds] })),
      })),
    },
  };
  const newSections = [ ...state.sections.slice(0, index), duplicatedSection, ...state.sections.slice(index) ];
  return { ...state, sections: newSections };
}

export function removeSection(state: Choreo, id: string): Choreo {
  return { ...state, sections: state.sections.filter(s => s.id !== id) }
}

export function renameSection(state: Choreo, sectionId: string, newName: string): Choreo {
  const newSections = state.sections.map(s =>
    s.id === sectionId ? { ...s, name: newName } : s
  )
  return { ...state, sections: newSections };
}

export function editSectionNote(state: Choreo, sectionId: string, newNote: string): Choreo {
  const newSections = state.sections.map(s =>
    s.id === sectionId ? { ...s, note: newNote } : s
  )
  return { ...state, sections: newSections };
}

export function reorderSections(state: Choreo, newSections: ChoreoSection[]): Choreo {
  return { ...state, sections: [...newSections] };
}

export function editDancerActions(state: Choreo, sectionId: string, newActions: DancerAction[]): Choreo {
  const newSections = state.sections.map(s =>
    s.id === sectionId ? { ...s, formation: {...s.formation, dancerActions: newActions} } : s
  )
  return { ...state, sections: newSections };
}

export function assignDancersToTiming(state: Choreo, sectionId: string, actionId: string, timingId: string, dancerIds: string[]): Choreo {
  const dancerIdSet = new Set(dancerIds);
  const newSections = state.sections.map(s => 
    s.id === sectionId ? {
      ...s,
      formation: {
        ...s.formation,
        dancerActions: [...s.formation.dancerActions.map(a => 
          a.id === actionId ? {
            ...a,
            timings: [...a.timings.map(t => 
              t.id === timingId ? {...t, dancerIds: [...dancerIds]} : {...t, dancerIds: [...t.dancerIds.filter(d => !dancerIdSet.has(d))]
            })]} as DancerAction : a
      )]} } : s
  ) as ChoreoSection[];
  return { ...state, sections: newSections };
}