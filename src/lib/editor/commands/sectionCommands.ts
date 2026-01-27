import { Choreo } from "../../../models/choreo"
import { ChoreoSection } from "../../../models/choreoSection"

export function addSection(state: Choreo, id: string, name: string): Choreo {
  const previousSection = state.sections[state.sections.length - 1];
  console.log("Adding section");

  return {
    ...state,
    sections: [
      ...state.sections,
      {
        id: id,
        name,
        formation: previousSection
          ? { ...previousSection.formation }
          : {}
      } as ChoreoSection
    ]
  };
}

export function duplicateSection(state: Choreo, section: ChoreoSection, index: number) {
  console.log("Duplicating section", section.id, section.name);
  var duplicatedSection = { ...section };
  duplicatedSection.id = crypto.randomUUID();
  const newSections = [ ...state.sections.slice(0, index), ...[duplicatedSection], ...state.sections.slice(index) ];
  return { ...state, sections: newSections };
}

export function removeSection(state: Choreo, id: string): Choreo {
  console.log("Removing the section", id);
  return { ...state, sections: state.sections.filter(s => s.id !== id) }
}

export function renameSection(state: Choreo, sectionId: string, newName: string): Choreo {
  console.log("Rename section", sectionId, newName);
  const newSections = state.sections.map(s =>
    s.id === sectionId ? { ...s, name: newName } : s
  )
  return { ...state, sections: newSections };
}

export function editSectionNote(state: Choreo, sectionId: string, newNote: string): Choreo {
  console.log("Edit section note", sectionId, newNote);
  const newSections = state.sections.map(s =>
    s.id === sectionId ? { ...s, note: newNote } : s
  )
  return { ...state, sections: newSections };
}

export function reorderSections() {

}