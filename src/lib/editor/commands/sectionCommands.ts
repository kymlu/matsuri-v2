import { Choreo } from "../../../models/choreo"
import { ChoreoSection } from "../../../models/choreoSection"
import { DancerAction } from "../../../models/dancerAction";
import { incrementBracketSuffix } from "../../helpers/globalHelper";

// Copies of a section's positions for another section: new objects with that section's id, so the
// source section (and the undo history that holds it) is never changed.
const copyPositions = <T extends { sectionId: string }>(positions: Record<string, T> | undefined, sectionId: string): Record<string, T> =>
  Object.fromEntries(Object.entries(positions ?? {}).map(([id, position]) => [id, { ...position, sectionId }]));

const copyMovements = (movements: ChoreoSection["formation"]["dancerMovements"]) =>
  movements && Object.fromEntries(Object.entries(movements).map(([id, movement]) => [id, { ...movement, points: movement.points.map(p => ({ ...p })) }]));

// Starts from where everyone ended in the last section, with no actions or paths.
export function addSection(state: Choreo, id: string): Choreo {
  const previousSection = state.sections[state.sections.length - 1];

  return {
    ...state,
    sections: [
      ...state.sections,
      {
        id: id,
        name: previousSection ? incrementBracketSuffix(previousSection.name) : "セクション1",
        formation: {
          dancerPositions: copyPositions(previousSection?.formation.dancerPositions, id),
          propPositions: copyPositions(previousSection?.formation.propPositions, id),
          dancerActions: [],
        },
      } as ChoreoSection
    ]
  };
}

// A full copy, inserted before the original. Actions and counts get new ids so the two sections never share them.
export function duplicateSection(state: Choreo, section: ChoreoSection, index: number): Choreo {
  const newId = crypto.randomUUID();
  const duplicatedSection: ChoreoSection = {
    ...section,
    id: newId,
    formation: {
      ...section.formation,
      dancerPositions: copyPositions(section.formation.dancerPositions, newId),
      propPositions: copyPositions(section.formation.propPositions, newId),
      dancerMovements: copyMovements(section.formation.dancerMovements),
      propMovements: copyMovements(section.formation.propMovements),
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