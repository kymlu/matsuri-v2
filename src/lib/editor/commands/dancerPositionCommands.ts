import { Distribution, HorizontalAlignment, VerticalAlignment } from "../../../models/alignment"
import { Choreo } from "../../../models/choreo"
import { DancerPosition } from "../../../models/dancer"
import { indexByKey, roundToTenth, strEquals } from "../../helpers/globalHelper"

/**
 * Helper: update one or more dancers in a section
 */
function updateDancerPositions(
  dancerPositions: Record<string, any>,
  dancerIds: string[],
  updateFn: (dp: DancerPosition) => any
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
          dp => ({ ...dp, x: x, y: y })
        )
      }
    }
  });
  
  return { ...state, sections: newSections }
}

/**
 * Move one or more dancers in a section
 */
export function moveDancerPositionsDelta(
  state: Choreo,
  sectionId: string,
  dancerIds: string[],
  dx: number,
  dy: number
): Choreo {
  console.log("delta")
  const newSections = state.sections.map(section => {
    if (section.id !== sectionId) return section
    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: updateDancerPositions(
          section.formation.dancerPositions,
          dancerIds,
          dp => ({ ...dp, x: dp.x + dx, y: dp.y + dy })
        )
      }
    }
  });

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
  console.log("Changing dancer colors to", color, "for", dancerIds, "on section", sectionId);
  const newSections = state.sections.map(section => {
    if (!strEquals(section.id, sectionId)) return section
    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: updateDancerPositions(
          section.formation.dancerPositions,
          dancerIds,
          dp => ({ ...dp, color: color })
        )
      }
    }
  });

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
  console.log("Changing dancer colors to", color, "for", dancerIds, "on section and after", currentSectionIndex);
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
  });

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
  console.log("Changing dancer colors to", color, "for", dancerIds, "on all sections");
  
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
  }));

  return { ...state, sections: newSections }
}

export function pasteDancerPositions(
  state: Choreo,
  sectionId: string,
  dancePositions: Record<string, DancerPosition>,
): Choreo {
  console.log("Pasting positions");

  const newSections = state.sections.map(section => {
    if (!strEquals(section.id, sectionId)) return section;

    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: updateDancerPositions(
          section.formation.dancerPositions,
          Object.keys(dancePositions),
          dp => ({...dancePositions[dp.dancerId], sectionId: sectionId})
        ),
      }
    }
  })

  return { ...state, sections: newSections }
}


export function alignHorizontalPositions (
  state: Choreo,
  sectionId: string,
  dancePositions: DancerPosition[],
  type: HorizontalAlignment,
): Choreo {
  console.log("Aligning to", type);

  if (dancePositions.length === 0) return {...state};

  var newValue: number = 0;

  if (dancePositions.length === 1) {
    switch (type) {
      case "left":
        newValue = 0;
        break;
      case "centre":
        newValue = state.stageGeometry.stageWidth / 2;
        break;
      case "right":
        newValue = state.stageGeometry.stageWidth;
        break;
    }
  } else {
    var xValues = dancePositions.map(x => x.x);

    switch (type) {
      case "left":
        newValue = Math.min(...xValues);
        break;
      case "centre":
        newValue = (Math.min(...xValues) + Math.max(...xValues))/2;
        break;
      case "right":
        newValue = Math.max(...xValues);
        break;
    }
  }

  const newSections = state.sections.map(section => {
    if (!strEquals(section.id, sectionId)) return section
    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: updateDancerPositions(
          section.formation.dancerPositions,
          dancePositions.map(x => x.dancerId),
          dp => ({ ...dp, x: newValue })
        )
      }
    }
  });

  return { ...state, sections: newSections }
}

export function alignVerticalPositions (
  state: Choreo,
  sectionId: string,
  dancePositions: DancerPosition[],
  type: VerticalAlignment
): Choreo {
  console.log("Aligning to", type);

  if (dancePositions.length === 0) return {...state};

  var newValue: number = 0;

  if (dancePositions.length === 1) {
    switch (type) {
      case "top":
        newValue = 0;
        break;
      case "centre":
        newValue = state.stageGeometry.stageLength / 2;
        break;
      case "bottom":
        newValue = state.stageGeometry.stageLength;
        break;
    }
  } else {
    var yValues = dancePositions.map(x => x.y);
    switch (type) {
      case "top":
        newValue = Math.min(...yValues);
        break;
      case "centre":
        newValue = (Math.min(...yValues) + Math.max(...yValues))/2;
        break;
      case "bottom":
        newValue = Math.max(...yValues);
        break;
    }
  }
  const newSections = state.sections.map(section => {
    if (!strEquals(section.id, sectionId)) return section
    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: updateDancerPositions(
          section.formation.dancerPositions,
          dancePositions.map(x => x.dancerId),
          dp => ({ ...dp, y: newValue })
        )
      }
    }
  });

  return { ...state, sections: newSections }
}

export function distributePositions (
  state: Choreo,
  sectionId: string,
  dancePositions: DancerPosition[],
  type: Distribution
): Choreo {
  console.log("Distributing", type);

  if (dancePositions.length === 0) return {...state};

  var sortedItems = [...dancePositions.sort((a, b) => {return a[type] - b[type]})];
  var min = sortedItems[0][type];
  var max = sortedItems[sortedItems.length - 1][type]
  var interval = (max - min) / (sortedItems.length - 1);
  sortedItems.forEach((value, index) => {
    value[type] = roundToTenth(min + index * interval);
  });

  var newPositions = indexByKey(sortedItems, "dancerId");
  
  const newSections = state.sections.map(section => {
    if (!strEquals(section.id, sectionId)) return section
    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: updateDancerPositions(
          section.formation.dancerPositions,
          dancePositions.map(x => x.dancerId),
          dp => ({ ...dp, [type]: newPositions[dp.dancerId][type] })
        )
      }
    }
  });

  return { ...state, sections: newSections }
}