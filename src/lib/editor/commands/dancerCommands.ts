import { Choreo } from "../../../models/choreo"
import { Formation } from "../../../models/choreoSection"
import { Dancer } from "../../../models/dancer"
import { colorPalette } from "../../consts/colors"

export function addDancer(state: Choreo, dancer: Dancer, x: number, y: number): Choreo {
  const newDancers = { ...state.dancers, [dancer.id]: dancer }

  const newSections = state.sections.map(section => ({
    ...section,
    formation: {
      ...section.formation,
      dancerPositions: {
        ...section.formation.dancerPositions,
        [dancer.id]: {
          dancerId: dancer.id,
          x: x,
          y: y,
          color: colorPalette.rainbow.blue[0],
        }
      }
    } as Formation
  }))

  return {
    ...state,
    dancers: newDancers,
    sections: newSections
  }
}

export function removeDancers(state: Choreo, ids: string[]): Choreo {
  const idSet = new Set(ids)
  const newDancers = Object.fromEntries(
    Object.entries(state.dancers).filter(([id]) => !idSet.has(id))
  )

  const newSections = state.sections.map(section => {
    const newPositions = Object.fromEntries(
      Object.entries(section.formation.dancerPositions).filter(
        ([id]) => !idSet.has(id)
      )
    )
    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: newPositions
      }
    }
  })

  return {
    ...state,
    dancers: newDancers,
    sections: newSections
  }
}

export function renameDancer(state: Choreo, id: string, newName: string): Choreo {
  const dancer = state.dancers[id]
  if (!dancer) return state

  const newDancers = { ...state.dancers, [id]: { ...dancer, name: newName } }

  // Sections don't need name update in dancerPositions, unless you store it there
  return {
    ...state,
    dancers: newDancers
  }
}