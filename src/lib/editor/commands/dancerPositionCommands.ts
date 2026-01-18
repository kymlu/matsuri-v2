import { Choreo } from "../../../models/choreo"

/**
 * Helper: update one or more dancers in a section
 */
function updateDancerPositions(
  dancerPositions: Record<string, any>,
  dancerIds: string[],
  updateFn: (dp: any) => any
): Record<string, any> {
  const newPositions = { ...dancerPositions }
  for (const id of dancerIds) {
    if (newPositions[id]) {
      newPositions[id] = updateFn(newPositions[id])
    }
  }
  return newPositions
}

/**
 * Move one or more dancers in a section
 */
export function moveDancerPositions(
  state: Choreo,
  sectionId: string,
  dancerIds: string[],
  x: number,
  y: number
): Choreo {
  const newSections = state.sections.map(section => {
    if (section.id !== sectionId) return section
    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: updateDancerPositions(
          section.formation.dancerPositions,
          dancerIds,
          dp => ({ ...dp, x, y })
        )
      }
    }
  })
  return { ...state, sections: newSections }
}

/**
 * Change color for one or more dancers in a single section
 */
export function changeDancerColorCurrent(
  state: Choreo,
  sectionId: string,
  dancerIds: string[],
  color: string
): Choreo {
  const newSections = state.sections.map(section => {
    if (section.id !== sectionId) return section
    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: updateDancerPositions(
          section.formation.dancerPositions,
          dancerIds,
          dp => ({ ...dp, color })
        )
      }
    }
  })
  return { ...state, sections: newSections }
}

/**
 * Change color for one or more dancers in current + future sections
 */
export function changeDancerColorCurrentAndFuture(
  state: Choreo,
  currentSectionIndex: number,
  dancerIds: string[],
  color: string
): Choreo {
  const newSections = state.sections.map((section, i) => {
    if (i < currentSectionIndex) return section
    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: updateDancerPositions(
          section.formation.dancerPositions,
          dancerIds,
          dp => ({ ...dp, color })
        )
      }
    }
  })
  return { ...state, sections: newSections }
}

/**
 * Change color for one or more dancers in all sections
 */
export function changeDancerColorAll(
  state: Choreo,
  dancerIds: string[],
  color: string
): Choreo {
  const newSections = state.sections.map(section => ({
    ...section,
    formation: {
      ...section.formation,
      dancerPositions: updateDancerPositions(
        section.formation.dancerPositions,
        dancerIds,
        dp => ({ ...dp, color })
      )
    }
  }))
  return { ...state, sections: newSections }
}