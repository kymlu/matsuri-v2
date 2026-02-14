import { Coordinates } from "@dnd-kit/utilities"
import { colourMode } from "../../../components/dialogs/EditDancerColourDialog"
import { HorizontalAlignment, VerticalAlignment, Distribution } from "../../../models/alignment"
import { Choreo } from "../../../models/choreo"
import { Formation } from "../../../models/choreoSection"
import { Dancer, DancerPosition } from "../../../models/dancer"
import { StageEntities } from "../../../models/history"
import { Prop, PropPosition } from "../../../models/prop"
import { colorPalette } from "../../consts/colors"
import { strEquals, roundToTenth, indexByKey } from "../../helpers/globalHelper"

export function addDancer(state: Choreo, dancer: Dancer, x: number, y: number): Choreo {
  const newDancers = { ...state.dancers, [dancer.id]: dancer }

  const newSections = state.sections.map(section => ({
    ...section,
    formation: {
      ...section.formation,
      dancerPositions: {
        ...section.formation.dancerPositions,
        [dancer.id]: {
          sectionId: section.id,
          dancerId: dancer.id,
          type: "dancer",
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

export function renameDancer(state: Choreo, id: string, newName: string): Choreo {
  const dancer = state.dancers[id]
  if (!dancer) return state

  const newDancers = { ...state.dancers, [id]: { ...dancer, name: newName } }

  return {
    ...state,
    dancers: newDancers
  }
}

export function renameAndDeleteDancers(state: Choreo, renamedDancers: Record<string, Dancer>, deletedDancerIds: Set<string>): Choreo {
  const newSections = state.sections.map(section => {
    const newDancerPositions = Object.fromEntries(
      Object.entries(section.formation.dancerPositions).filter(
        ([id]) => !deletedDancerIds.has(id)
      )
    );
    const newDancerActions = section.formation.dancerActions.map(action => ({
      ...action,
      timings: action.timings.map(timing => ({
        ...timing,
        dancerIds: timing.dancerIds.filter(id => !deletedDancerIds.has(id)),
      })),
    }));

    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: newDancerPositions,
        dancerActions: newDancerActions,
      }
    }
  });

  return {
    ...state,
    dancers: renamedDancers,
    sections: newSections,
  }
}

export function editAndDeleteProps(state: Choreo, editedProps: Record<string, Prop>, deletedPropIds: Set<string>): Choreo {
  const newSections = state.sections.map(section => {
    const newPropPositions = Object.fromEntries(
      Object.entries(section.formation.propPositions).filter(
        ([id]) => !deletedPropIds.has(id)
      )
    );

    return {
      ...section,
      formation: {
        ...section.formation,
        propPositions: newPropPositions,
      }
    }
  });

  return {
    ...state,
    props: editedProps,
    sections: newSections,
  }
}

export function addProp(state: Choreo, prop: Prop, x: number, y: number): Choreo {
  const newProps = { ...state.props, [prop.id]: prop }

  const newSections = state.sections.map(section => ({
    ...section,
    formation: {
      ...section.formation,
      propPositions: {
        ...section.formation.propPositions ?? {},
        [prop.id]: {
          sectionId: section.id,
          propId: prop.id,
          type: "prop",
          x: x,
          y: y,
        }
      }
    } as Formation
  }))

  return {
    ...state,
    props: newProps,
    sections: newSections
  }
}

export function renameProp(state: Choreo, id: string, newName: string): Choreo {
  const prop = state.props[id]
  if (!prop) return state

  const newProps = { ...state.props, [id]: { ...prop, name: newName } }

  return {
    ...state,
    props: newProps
  }
}

export function removeObjects(state: Choreo, ids: StageEntities<string[]>): Choreo {
  const dancerIds = new Set(ids.dancers);
  const propIds = new Set(ids.props);

  const newDancers = Object.fromEntries(
    Object.entries(state.dancers).filter(([id]) => !dancerIds.has(id))
  );
  const newProps = Object.fromEntries(
    Object.entries(state.props).filter(([id]) => !propIds.has(id))
  );

  const newSections = state.sections.map(section => {
    const newDancerPositions = Object.fromEntries(
      Object.entries(section.formation.dancerPositions).filter(
        ([id]) => !dancerIds.has(id)
      )
    );
    const newDancerActions = section.formation.dancerActions.map(action => ({
      ...action,
      timings: action.timings.map(timing => ({
        ...timing,
        dancerIds: timing.dancerIds.filter(id => !dancerIds.has(id)),
      })),
    }));
    const newPropPositions = Object.fromEntries(
      Object.entries(section.formation.propPositions).filter(
        ([id]) => !propIds.has(id)
      )
    );
    return {
      ...section,
      formation: {
        ...section.formation,
        dancerActions: newDancerActions,
        dancerPositions: newDancerPositions,
        propPositions: newPropPositions,
      }
    }
  })

  return {
    ...state,
    dancers: newDancers,
    props: newProps,
    sections: newSections
  }
}


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
      newPositions[id] = updateFn({...newPositions[id], type: "dancer"})
    }
  }
  return newPositions
}

/**
 * Helper: update one or more props in a section
 */
function updatePropPositions(
  propPositions: Record<string, any>,
  propIds: string[],
  updateFn: (dp: PropPosition) => any
): Record<string, any> {
  const newPositions = { ...propPositions }
  for (const id of propIds) {
    if (newPositions[id]) {
      newPositions[id] = updateFn({...newPositions[id], type: "prop"})
    }
  }
  return newPositions
}

/**
 * Move one or more dancers in a section
 */
export function moveObjectPositions(
  state: Choreo,
  sectionId: string,
  positions: StageEntities<Record<string, Coordinates>>,
): Choreo {
  const newSections = state.sections.map(section => {
    if (section.id !== sectionId) return section
    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: updateDancerPositions(
          section.formation.dancerPositions,
          Object.keys(positions.dancers),
          dp => ({ ...dp, x: positions.dancers[dp.dancerId].x, y: positions.dancers[dp.dancerId].y })
        ),
        propPositions: updatePropPositions(
          section.formation.propPositions,
          Object.keys(positions.props),
          p => ({ ...p, x: positions.props[p.propId].x, y: positions.props[p.propId].y })
        )
      }
    }
  });
  
  return { ...state, sections: newSections }
}

export function updatePropSizeAndRotate(
  state: Choreo,
  sectionId: string,
  width: number,
  length: number,
  rotation: number,
  x: number,
  y: number,
  propId: string) {
  const newSections = state.sections.map(section => {
    if (section.id !== sectionId) return section
    return {
      ...section,
      formation: {
        ...section.formation,
        propPositions: updatePropPositions(
          section.formation.propPositions,
          [propId],
          p => ({ ...p, x: x, y: y, rotation: rotation })
        )
      }
    }
  });

  const newProps = {...state.props};
  newProps[propId].width = width;
  newProps[propId].length = length;
  
  return { ...state, sections: newSections }
}

export function changeObjectColours(
  state: Choreo,
  sectionIndex: number,
  mode: colourMode,
  ids: StageEntities<string[]>,
  color: string,
) {
  // update dancers
  const shouldUpdate = (i: number) => {
    switch (mode) {
      case "current":
        return i === sectionIndex;
      case "currentAndAfter":
        return i >= sectionIndex;
      case "all":
        return true;
    }
  };

  const newSections = state.sections.map((section, i) => {
    if (!shouldUpdate(i)) return section;

    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: updateDancerPositions(
          section.formation.dancerPositions,
          ids.dancers,
          dp => ({ ...dp, color: color })
        )
      }
    }
  });

  // update props
  const newProps = {...state.props};
  ids.props.forEach(id => {
    newProps[id].color = color;
  });

  return {
    ...state,
    props: newProps,
    sections: newSections
  }
}

export function pastePositions(
  state: Choreo,
  sectionId: string,
  positions: StageEntities<Record<string, PropPosition>, Record<string, DancerPosition>>,
): Choreo {
  const newSections = state.sections.map(section => {
    if (!strEquals(section.id, sectionId)) return section;

    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: updateDancerPositions(
          section.formation.dancerPositions,
          Object.keys(positions.dancers),
          d => ({...positions.dancers[d.dancerId], sectionId: sectionId})
        ),
        propPositions: updatePropPositions(
          section.formation.propPositions,
          Object.keys(positions.props),
          p => ({...positions.props[p.propId], sectionId: sectionId})
        ),
      }
    }
  })

  return { ...state, sections: newSections }
}


export function alignHorizontalPositions (
  state: Choreo,
  sectionId: string,
  positions: StageEntities<PropPosition[], DancerPosition[]>,
  type: HorizontalAlignment,
): Choreo {
  if (positions.dancers.length === 0 && positions.props.length === 0) return {...state};

  var newValue: number = 0;

  if ((positions.dancers.length + positions.props.length) === 1) {
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
    var xValues = [
      ...positions.dancers.map(x => x.x),
      ...positions.props.map(x => x.x),
      ...positions.props.map(x => x.x + state.props[x.propId].width / 2),
      ...positions.props.map(x => x.x + state.props[x.propId].width),
    ];

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
          positions.dancers.map(x => x.dancerId),
          dp => ({ ...dp, x: newValue })
        ),
        propPositions: updatePropPositions(
          section.formation.propPositions,
          positions.props.map(x => x.propId),
          dp => ({
            ...dp,
            x: newValue -
              (type === "left" ? 0 :
                type === "centre" ? state.props[dp.propId].width / 2 :
                state.props[dp.propId].width
              ) })
        )
      }
    }
  });

  return { ...state, sections: newSections }
}

export function alignVerticalPositions (
  state: Choreo,
  sectionId: string,
  positions: StageEntities<PropPosition[], DancerPosition[]>,
  type: VerticalAlignment,
): Choreo {
  if (positions.dancers.length === 0 && positions.props.length === 0) return {...state};

  var newValue: number = 0;

  if ((positions.dancers.length + positions.props.length) === 1) {
    switch (type) {
      case "top":
        newValue = state.stageGeometry.yAxis === "top-down" ? 0 : state.stageGeometry.stageLength;
        break;
      case "centre":
        newValue = state.stageGeometry.stageLength / 2;
        break;
      case "bottom":
        newValue = state.stageGeometry.yAxis === "top-down" ? state.stageGeometry.stageLength : 0;
        break;
    }
  } else {
    var yValues = [
      ...positions.dancers.map(x => x.y),
      ...positions.props.map(x => x.y + (
        type === "top" ? 0 :
        type === "centre" ? state.props[x.propId].length / 2 :
        (state.stageGeometry.yAxis === "top-down" ?
          state.props[x.propId].length :
          -state.props[x.propId].length)
      )),
    ];
    switch (type) {
      case "top":
        newValue = state.stageGeometry.yAxis === "top-down" ? Math.min(...yValues) : Math.max(...yValues);
        break;
      case "centre":
        newValue = (Math.min(...yValues) + Math.max(...yValues))/2;
        break;
      case "bottom":
        newValue = state.stageGeometry.yAxis === "top-down" ? Math.max(...yValues) : Math.min(...yValues);
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
          positions.dancers.map(x => x.dancerId),
          dp => ({ ...dp, y: newValue })
        ),
        propPositions: updatePropPositions(
          section.formation.propPositions,
          positions.props.map(x => x.propId),
          dp => ({
            ...dp,
            y: newValue + 
              (type === "top" ? 0 :
                type === "centre" ? (state.props[dp.propId].length / 2 * (state.stageGeometry.yAxis === "top-down" ? -1 : 1)) :
                (state.stageGeometry.yAxis === "top-down" ? -state.props[dp.propId].length : state.props[dp.propId].length)
              ) })
        )
      }
    }
  });

  return { ...state, sections: newSections }
}

export function distributePositions (
  state: Choreo,
  sectionId: string,
  positions: StageEntities<PropPosition[], DancerPosition[]>,
  type: Distribution
): Choreo {
  if (positions.dancers.length === 0 && positions.props.length === 0) return {...state};

  var sortedItems = [...positions.dancers, ...positions.props].sort((a, b) => {return a[type] - b[type]});
  var allValues = [...positions.dancers.map(d => d[type]), ...positions.props.map(d => d[type])]

  var min = Math.min(...sortedItems.map(x => x[type]));
  var max = Math.max(...sortedItems.map(x => x[type]));
  var interval = (max - min) / (allValues.length - 1);

  sortedItems.forEach((value, index) => {
    value[type] = roundToTenth(min + index * interval);
  });

  var dancerPositions = indexByKey(sortedItems.filter(x => x.type === "dancer") as DancerPosition[], "dancerId");
  var propPositions = indexByKey(sortedItems.filter(x => x.type === "prop") as PropPosition[], "propId");

  const newSections = state.sections.map(section => {
    if (!strEquals(section.id, sectionId)) return section
    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: updateDancerPositions(
          section.formation.dancerPositions,
          Object.keys(dancerPositions),
          dp => ({ ...dp, [type]: dancerPositions[dp.dancerId][type] })
        ),
        propPositions: updatePropPositions(
          section.formation.propPositions,
          Object.keys(propPositions),
          dp => ({ ...dp, [type]: propPositions[dp.propId][type] })
        )
      }
    }
  });

  return { ...state, sections: newSections }
}

export function swapPositions(
  state: Choreo,
  sectionId: string,
  dancerAId: string,
  dancerBId: string
) {
  const newSections = state.sections.map(section => {
    if (section.id !== sectionId) return section
    var dancerPositions = {...section.formation.dancerPositions};
    var originalA = section.formation.dancerPositions[dancerAId];
    var originalB = section.formation.dancerPositions[dancerBId];
    dancerPositions[dancerAId] = { ...originalA, x: originalB.x, y: originalB.y };
    dancerPositions[dancerBId] = { ...originalB, x: originalA.x, y: originalA.y };
    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: dancerPositions
      }
    }
  });
  
  return { ...state, sections: newSections }
}