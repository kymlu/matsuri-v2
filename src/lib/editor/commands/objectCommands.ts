import { Coordinates } from "@dnd-kit/utilities"
import { colourMode } from "../../../components/dialogs/EditDancerColourDialog"
import { HorizontalAlignment, VerticalAlignment, Distribution, Rearrangement } from "../../../models/alignment"
import { Choreo } from "../../../models/choreo"
import { Formation, Movement } from "../../../models/choreoSection"
import { Dancer, DancerPosition } from "../../../models/dancer"
import { StageEntities } from "../../../models/history"
import { Obstacle, Prop, PropPosition } from "../../../models/prop"
import { colorPalette } from "../../consts/colors"
import { strEquals, roundToTenth, indexByKey } from "../../helpers/globalHelper"
import { centreToCorner, centreToCornerFromProp, cornerToCentreFromProp } from "../../helpers/editorCalculationHelper"

export function addDancer(state: Choreo, dancer: Dancer, x: number, y: number, z: number): Choreo {
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
          z: z,
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

    const newDancerMovements = section.formation.dancerMovements ? Object.fromEntries(
      Object.entries(section.formation.dancerMovements).filter(([id]) => !deletedDancerIds.has(id))
    ) : undefined;

    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: newDancerPositions,
        dancerActions: newDancerActions,
        dancerMovements: newDancerMovements,
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

export function addProp(state: Choreo, prop: Prop, x: number, y: number, z: number): Choreo {
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
          z: z,
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
  const prop = state.props[id];
  if (!prop) return state;

  const newProps = { ...state.props, [id]: { ...prop, name: newName } };

  return {
    ...state,
    props: newProps
  }
}

export function addObstacle(state: Choreo, obstacle: Obstacle): Choreo {
  const newObstacles = { ...state.obstacles, [obstacle.id]: obstacle };

  return {
    ...state,
    obstacles: newObstacles,
  }
}

export function addObstacles(state: Choreo, obstacle: Obstacle[]): Choreo {
  const obstacleCount = Object.keys(state.obstacles ?? {}).length;
  const newObstacles = { ...state.obstacles };
  obstacle.reduce((acc, item, i) => {
    acc[item.id] = {...item, z: obstacleCount + i};
    return acc;
  }, newObstacles);

  return {
    ...state,
    obstacles: newObstacles,
  }
}


export function renameObstacle(state: Choreo, id: string, newName: string): Choreo {
  const item = state.obstacles?.[id];
  if (!item) return state;

  const newObstacles = { ...state.obstacles, [id]: { ...item, name: newName } };

  return {
    ...state,
    obstacles: newObstacles
  }
}

export function removeObjects(state: Choreo, ids: StageEntities<string[]>): Choreo {
  const dancerIds = new Set(ids.dancers);
  const propIds = new Set(ids.props);
  const obstacleIds = new Set(ids.obstacles);

  const newDancers = Object.fromEntries(
    Object.entries(state.dancers).filter(([id]) => !dancerIds.has(id))
  );
  const newProps = Object.fromEntries(
    Object.entries(state.props).filter(([id]) => !propIds.has(id))
  );
  const newObstacles = Object.fromEntries(
    Object.entries(state.obstacles ?? {}).filter(([id]) => !obstacleIds.has(id))
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
    obstacles: newObstacles,
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
 * Helper: update one or more fixed items in a section
 */
function updateObstacles(
  obstacles: Record<string, any>,
  itemIds: string[],
  updateFn: (f: Obstacle) => any
): Record<string, any> {
  for (const id of itemIds) {
    if (obstacles[id]) {
      obstacles[id] = updateFn({...obstacles[id], type: "obstacle"})
    }
  }
  return obstacles
}

/**
 * Move one or more dancers in a section
 */
export function moveObjectPositions(
  state: Choreo,
  sectionId: string,
  positions: StageEntities<Record<string, Coordinates>>,
): Choreo {

  const newObstacles = {...state.obstacles};
  for (const [id, item] of Object.entries(positions.obstacles)) {
    if (newObstacles[id]) {
      newObstacles[id] = {...newObstacles[id], x: item.x, y: item.y}
    }
  }

  const newSections = state.sections.map(section => {
    if (section.id !== sectionId) return section;

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
  
  return { ...state, obstacles: newObstacles, sections: newSections }
}

export function updatePropSizeAndRotate(
  state: Choreo,
  sectionId: string,
  width: number,
  length: number,
  rotation: number,
  x: number,
  y: number,
  propId: string): Choreo {
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

export function updateObstacleSizeAndRotate(
  state: Choreo,
  width: number,
  length: number,
  rotation: number,
  x: number,
  y: number,
  itemId: string): Choreo {

  const newObstacles = {...state.obstacles};
  newObstacles[itemId].width = width;
  newObstacles[itemId].length = length;
  newObstacles[itemId].rotation = rotation;
  newObstacles[itemId].x = x;
  newObstacles[itemId].y = y;
  
  return { ...state, obstacles: newObstacles }
}

export function changeObjectColours(
  state: Choreo,
  sectionIndex: number,
  mode: colourMode,
  ids: StageEntities<string[]>,
  color: string,
): Choreo {
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
    newProps[id] = {...newProps[id], color: color};
  });

  const newObstacles = {...state.obstacles};
  ids.obstacles.forEach(id => {
    newObstacles[id] = {...newObstacles[id], color: color};
  })

  return {
    ...state,
    obstacles: newObstacles,
    props: newProps,
    sections: newSections
  }
}

export function changePropInUse(
  state: Choreo,
  sectionId: string,
  ids: string[],
  inUse: boolean,
): Choreo {
  const newSections = state.sections.map(section => {
    if (!strEquals(section.id, sectionId)) return section;

    return {
      ...section,
      formation: {
        ...section.formation,
        propPositions: updatePropPositions(
          section.formation.propPositions,
          ids,
          dp => ({ ...dp, inUse: inUse })
        )
      }
    }
  });

  return {
    ...state,
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
  positions: StageEntities<PropPosition[], DancerPosition[], Obstacle[]>,
  type: HorizontalAlignment,
): Choreo {
  if ((positions.dancers.length + positions.props.length + positions.obstacles.length) === 0) return {...state};

  let newValue: number = 0;

  if ((positions.dancers.length + positions.props.length + positions.obstacles.length) === 1) {
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
    const xValues = [
      ...positions.dancers.map(x => x.x),
      ...positions.props.map(x => x.x),
      ...positions.props.map(x => x.x + state.props[x.propId].width / 2),
      ...positions.props.map(x => x.x + state.props[x.propId].width),
      ...positions.obstacles.map(x => x.x),
      ...positions.obstacles.map(x => x.x + ((state.obstacles ?? {})[x.id]?.width ?? 0) / 2),
      ...positions.obstacles.map(x => x.x + ((state.obstacles ?? {})[x.id]?.width ?? 0)),
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
  
  const newObstacles = state.obstacles ? updateObstacles(
    {...state.obstacles},
    positions.obstacles.map(x => x.id),
    f => ({
      ...f,
      x:  newValue -
        (type === "left" ? 0 :
          type === "centre" ? state.obstacles!![f.id].width / 2 :
          state.obstacles!![f.id].width
        ) }))
    : {};

  return { ...state, obstacles: newObstacles, sections: newSections }
}

export function alignVerticalPositions (
  state: Choreo,
  sectionId: string,
  positions: StageEntities<PropPosition[], DancerPosition[], Obstacle[]>,
  type: VerticalAlignment,
): Choreo {
  if ((positions.dancers.length + positions.props.length + positions.obstacles.length) === 0) return {...state};

  let newValue: number = 0;

  if ((positions.dancers.length + positions.props.length + positions.obstacles.length) === 1) {
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
    const yValues = [
      ...positions.dancers.map(x => x.y),
      ...positions.props.map(x => x.y + (
        type === "top" ? 0 :
        type === "centre" ? state.props[x.propId].length / 2 :
        (state.stageGeometry.yAxis === "top-down" ?
          state.props[x.propId].length :
          -state.props[x.propId].length))),
      ...positions.obstacles.map(x => x.y + (
        type === "top" ? 0 :
        type === "centre" ? state.obstacles!![x.id].length / 2 :
        (state.stageGeometry.yAxis === "top-down" ?
          (state.obstacles ?? {})[x.id]?.length :
          -(state.obstacles ?? {})[x.id]?.length)
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
  
  const newObstacles = state.obstacles ? updateObstacles(
    {...state.obstacles},
    positions.obstacles.map(x => x.id),
    f => ({
      ...f,
      y: newValue + 
        (type === "top" ? 0 :
          type === "centre" ? (state.obstacles!![f.id].length / 2 * (state.stageGeometry.yAxis === "top-down" ? -1 : 1)) :
          (state.stageGeometry.yAxis === "top-down" ? -state.obstacles!![f.id].length : state.obstacles!![f.id].length)
        ) }))
    : {};

  return { ...state, obstacles: newObstacles, sections: newSections }
}

export function distributePositions (
  state: Choreo,
  sectionId: string,
  positions: StageEntities<PropPosition[], DancerPosition[], Obstacle[]>,
  type: Distribution
): Choreo {
  if (positions.dancers.length === 0 && positions.props.length === 0 && positions.obstacles.length === 0) return {...state};

  const sortedItems = [...positions.dancers, ...positions.props, ...positions.obstacles].sort((a, b) => {return a[type] - b[type]});
  const allValues = [...positions.dancers.map(d => d[type]), ...positions.props.map(d => d[type]), ...positions.obstacles.map(d => d[type])]

  const min = Math.min(...sortedItems.map(x => x[type]));
  const max = Math.max(...sortedItems.map(x => x[type]));
  const interval = (max - min) / (allValues.length - 1);

  sortedItems.forEach((value, index) => {
    value[type] = roundToTenth(min + index * interval);
  });

  const dancerPositions = indexByKey(sortedItems.filter(x => x.type === "dancer") as DancerPosition[], "dancerId");
  const propPositions = indexByKey(sortedItems.filter(x => x.type === "prop") as PropPosition[], "propId");
  const obstaclePositions = indexByKey(sortedItems.filter(x => x.type === "obstacle") as Obstacle[], "id");

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

  const newObstacles = updateObstacles(
    {...state.obstacles},
    positions.obstacles.map(x => x.id),
    f => ({...f, [type]: obstaclePositions[f.id][type]}));

  return { ...state, obstacles: newObstacles, sections: newSections }
}

export function swapDancerPositions(
  state: Choreo,
  sectionId: string,
  dancerAId: string,
  dancerBId: string
): Choreo {
  const newSections = state.sections.map(section => {
    if (section.id !== sectionId) return section
    const dancerPositions = {...section.formation.dancerPositions};
    const originalA = section.formation.dancerPositions[dancerAId];
    const originalB = section.formation.dancerPositions[dancerBId];
    dancerPositions[dancerAId] = { ...originalA, x: originalB.x, y: originalB.y, z: originalB.z };
    dancerPositions[dancerBId] = { ...originalB, x: originalA.x, y: originalA.y, z: originalA.z };
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
export function swapPropPositions(
  state: Choreo,
  sectionId: string,
  propAId: string,
  propBId: string
): Choreo {
  const newSections = state.sections.map(section => {
    if (section.id !== sectionId) return section
    const propPositions = {...section.formation.propPositions};
    const propA = state.props[propAId];
    const propB = state.props[propBId];
    const originalA = (section.formation.propPositions[propAId]);
    const originalB = section.formation.propPositions[propBId];
    const originalACenter = cornerToCentreFromProp(section.formation.propPositions[propAId], state.props[propAId], state.stageGeometry.yAxis);
    const originalBCenter = cornerToCentreFromProp(section.formation.propPositions[propBId], state.props[propBId], state.stageGeometry.yAxis);
    const newAPosition = centreToCorner(originalBCenter.x, originalBCenter.y, originalA.rotation ?? 0, propA.width, propA.length, state.stageGeometry.yAxis);
    const newBPosition = centreToCorner(originalACenter.x, originalACenter.y, originalB.rotation ?? 0, propB.width, propB.length, state.stageGeometry.yAxis);
    propPositions[propAId] = { ...originalA, x: newAPosition.x, y: newAPosition.y };
    propPositions[propBId] = { ...originalB, x: newBPosition.x, y: newBPosition.y };
    return {
      ...section,
      formation: {
        ...section.formation,
        propPositions: propPositions
      }
    }
  });
  
  return { ...state, sections: newSections }
}
export function setZOnAllPositions(
  state: Choreo
): Choreo {
  // if there are z indices, ignore
  if (Object.values(state.sections[0].formation.dancerPositions)[0]?.z !== undefined) return state;

  const newObstacles = indexByKey(Object.values(state.obstacles ?? {}).map((o, i) => ({...o, z: i} as Obstacle)), "id");
  const newSections = state.sections.map(section => {
    const newDancerPositions: DancerPosition[] = Object.values(section.formation.dancerPositions).map((d, i) => ({...d, z: i} as DancerPosition));
    const newPropPositions: PropPosition[] = Object.values(section.formation.propPositions).map((d, i) => ({...d, z: i} as PropPosition));
    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: indexByKey(newDancerPositions, "dancerId"),
        propPositions: indexByKey(newPropPositions, "propId")
      } as Formation
    };
  });

  return { ...state, obstacles: newObstacles, sections: newSections }
}

export function rearrangePositions(
  state: Choreo,
  sectionId: string,
  selectedPositions: StageEntities<string[]>,
  rearrangement: Rearrangement,
): Choreo {
  let newObstacles: Obstacle[] = [];
  if (rearrangement === "toFront") {
    newObstacles = bringObstaclesToFront(Object.values(state.obstacles ?? {}), selectedPositions.obstacles);
  } else if (rearrangement === "forward") {
    newObstacles = bringForwardObstacles(Object.values(state.obstacles ?? {}), selectedPositions.obstacles);
  } else if (rearrangement === "backward") {
    newObstacles = sendBackwardObstacles(Object.values(state.obstacles ?? {}), selectedPositions.obstacles);
  } else {
    newObstacles = sendObstaclesToBack(Object.values(state.obstacles ?? {}), selectedPositions.obstacles);
  }

  const newSections = state.sections.map(section => {
    if (section.id !== sectionId) return section;
    let newDancerPositions: DancerPosition[] = [];
    let newPropPositions: PropPosition[] = [];
    if (rearrangement === "toFront") {
      newDancerPositions = bringDancersToFront(Object.values(section.formation.dancerPositions), selectedPositions.dancers);
      newPropPositions = bringPropsToFront(Object.values(section.formation.propPositions), selectedPositions.props);
    } else if (rearrangement === "forward") {
      newDancerPositions = bringForwardDancers(Object.values(section.formation.dancerPositions), selectedPositions.dancers);
      newPropPositions = bringForwardProps(Object.values(section.formation.propPositions), selectedPositions.props);
    } else if (rearrangement === "backward") {
      newDancerPositions = sendBackwardDancers(Object.values(section.formation.dancerPositions), selectedPositions.dancers);
      newPropPositions = sendBackwardProps(Object.values(section.formation.propPositions), selectedPositions.props);
    } else {
      newDancerPositions = sendDancersToBack(Object.values(section.formation.dancerPositions), selectedPositions.dancers);
      newPropPositions = sendPropsToBack(Object.values(section.formation.propPositions), selectedPositions.props);
    }

    return {
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: indexByKey(newDancerPositions, "dancerId"),
        propPositions: indexByKey(newPropPositions, "propId")
      } as Formation
    };
  });

  return { ...state, obstacles: indexByKey(newObstacles, "id"), sections: newSections }
}

export const sortDancers = (items: DancerPosition[]): DancerPosition[] => {
  return [...items].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
}
export const sortProps = (items: PropPosition[]): PropPosition[] => {
  return [...items].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
}
export const sortObstacles = (items: Obstacle[]): Obstacle[] => {
  return [...items].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
}

const normalizeDancers = (items: DancerPosition[]) : DancerPosition[] => {
  const sorted = sortDancers(items);
  return sorted.map((item, i) => ({ ...item, z: i }));
};

const normalizeProps = (items: PropPosition[]) : PropPosition[] => {
  const sorted = sortProps(items);
  return sorted.map((item, i) => ({ ...item, z: i }));
};

const normalizeObstacles = (items: Obstacle[]) : Obstacle[] => {
  const sorted = sortObstacles(items);
  return sorted.map((item, i) => ({ ...item, z: i }));
};

const bringDancersToFront = (items: DancerPosition[], ids: string[]): DancerPosition[] => {
  const maxZ = Math.max(...items.map(i => i.z ?? 0));
  const result = sortDancers(items).map((item, i) =>
    ids.includes(item.dancerId) ? { ...item, z: maxZ + i + 1 } : { ...item }
  );
  return normalizeDancers(result) as DancerPosition[];
};

const bringPropsToFront = (items: PropPosition[], ids: string[]): PropPosition[] => {
  const maxZ = Math.max(...items.map(i => i.z ?? 0));
  const result = sortProps(items).map((item, i) =>
    ids.includes(item.propId) ? { ...item, z: maxZ + i + 1 } : { ...item }
  );
  return normalizeProps(result) as PropPosition[];
};

const bringObstaclesToFront = (items: Obstacle[], ids: string[]): Obstacle[] => {
  const maxZ = Math.max(...items.map(i => i.z ?? 0));
  const result = sortObstacles(items).map((item, i) =>
    ids.includes(item.id) ? { ...item, z: maxZ + i + 1 } : { ...item }
  );
  return normalizeObstacles(result) as Obstacle[];
};

const sendDancersToBack = (items: DancerPosition[], ids: string[]): DancerPosition[] => {
  const result = items.map(item =>
    ids.includes(item.dancerId) ? { ...item, z: -(ids.length - ids.indexOf(item.dancerId)) } : { ...item }
  );
  return normalizeDancers(result) as DancerPosition[];
};

const sendPropsToBack = (items: PropPosition[], ids: string[]): PropPosition[] => {
  const result = items.map(item =>
    ids.includes(item.propId) ? { ...item, z: -(ids.length - ids.indexOf(item.propId)) } : { ...item }
  );
  return normalizeProps(result) as PropPosition[];
};

const sendObstaclesToBack = (items: Obstacle[], ids: string[]): Obstacle[] => {
  const result = items.map(item =>
    ids.includes(item.id) ? { ...item, z: -(ids.length - ids.indexOf(item.id)) } : { ...item }
  );
  return normalizeObstacles(result) as Obstacle[];
};

const bringForwardDancers = (items: DancerPosition[], ids: string[]): DancerPosition[] => {
  const sorted = sortDancers(items);
  const selected = sorted.filter(i => ids.includes(i.dancerId));
  const unselected = sorted.filter(i => !ids.includes(i.dancerId));

  const maxSelectedZ = Math.max(...selected.map(i => i.z ?? 0));
  const blockingIdx = unselected.findIndex(i => (i.z ?? 0) > maxSelectedZ);

  if (blockingIdx === -1) return items; // already at top

  const below = unselected.slice(0, blockingIdx + 1);
  const above = unselected.slice(blockingIdx + 1);
  const reordered = [...below, ...selected, ...above];

  return reordered.map((item, i) => ({ ...item, z: i }));
};

const bringForwardProps = (items: PropPosition[], ids: string[]): PropPosition[] => {
  const sorted = sortProps(items);
  const selected = sorted.filter(i => ids.includes(i.propId));
  const unselected = sorted.filter(i => !ids.includes(i.propId));

  const maxSelectedZ = Math.max(...selected.map(i => i.z ?? 0));
  const blockingIdx = unselected.findIndex(i => (i.z ?? 0) > maxSelectedZ);

  if (blockingIdx === -1) return items; // already at top

  const below = unselected.slice(0, blockingIdx + 1);
  const above = unselected.slice(blockingIdx + 1);
  const reordered = [...below, ...selected, ...above];

  return reordered.map((item, i) => ({ ...item, z: i }));
};

const bringForwardObstacles = (items: Obstacle[], ids: string[]): Obstacle[] => {
  const sorted = sortObstacles(items);
  const selected = sorted.filter(i => ids.includes(i.id));
  const unselected = sorted.filter(i => !ids.includes(i.id));

  const maxSelectedZ = Math.max(...selected.map(i => i.z ?? 0));
  const blockingIdx = unselected.findIndex(i => (i.z ?? 0) > maxSelectedZ);

  if (blockingIdx === -1) return items; // already at top

  const below = unselected.slice(0, blockingIdx + 1);
  const above = unselected.slice(blockingIdx + 1);
  const reordered = [...below, ...selected, ...above];

  return reordered.map((item, i) => ({ ...item, z: i }));
};

const sendBackwardDancers = (items: DancerPosition[], ids: string[]): DancerPosition[] => {
  const sorted = sortDancers(items);
  const selected = sorted.filter(i => ids.includes(i.dancerId));
  const unselected = sorted.filter(i => !ids.includes(i.dancerId));

  const minSelectedZ = Math.min(...selected.map(i => i.z ?? 0));
  const blockingIdx = [...unselected].reverse().findIndex(i => (i.z ?? 0) < minSelectedZ);
  const resolvedIdx = blockingIdx === -1 ? -1 : unselected.length - 1 - blockingIdx;

  if (resolvedIdx === -1) return items; // already at bottom

  const below = unselected.slice(0, resolvedIdx);
  const above = unselected.slice(resolvedIdx);
  const reordered = [...below, ...selected, ...above];

  return reordered.map((item, i) => ({ ...item, z: i }));
};

const sendBackwardProps = (items: PropPosition[], ids: string[]): PropPosition[] => {
  const sorted = sortProps(items);
  const selected = sorted.filter(i => ids.includes(i.propId));
  const unselected = sorted.filter(i => !ids.includes(i.propId));

  const minSelectedZ = Math.min(...selected.map(i => i.z ?? 0));
  const blockingIdx = [...unselected].reverse().findIndex(i => (i.z ?? 0) < minSelectedZ);
  const resolvedIdx = blockingIdx === -1 ? -1 : unselected.length - 1 - blockingIdx;

  if (resolvedIdx === -1) return items; // already at bottom

  const below = unselected.slice(0, resolvedIdx);
  const above = unselected.slice(resolvedIdx);
  const reordered = [...below, ...selected, ...above];

  return reordered.map((item, i) => ({ ...item, z: i }));
};

const sendBackwardObstacles = (items: Obstacle[], ids: string[]): Obstacle[] => {
  const sorted = sortObstacles(items);
  const selected = sorted.filter(i => ids.includes(i.id));
  const unselected = sorted.filter(i => !ids.includes(i.id));

  const minSelectedZ = Math.min(...selected.map(i => i.z ?? 0));
  const blockingIdx = [...unselected].reverse().findIndex(i => (i.z ?? 0) < minSelectedZ);
  const resolvedIdx = blockingIdx === -1 ? -1 : unselected.length - 1 - blockingIdx;

  if (resolvedIdx === -1) return items; // already at bottom

  const below = unselected.slice(0, resolvedIdx);
  const above = unselected.slice(resolvedIdx);
  const reordered = [...below, ...selected, ...above];

  return reordered.map((item, i) => ({ ...item, z: i }));
};

export function editDancerPath (state: Choreo, sectionId: string, dancerId: string, movement: Movement): Choreo {
  const newSections = state.sections.map(section => {
    if (!strEquals(section.id, sectionId)) return section;
    const newMovement = {...section.formation.dancerMovements ?? {}};
    newMovement[dancerId] = movement;

    return {
      ...section,
      formation: {
        ...section.formation,
        dancerMovements: newMovement,
      }
    }
  });

  return {
    ...state,
    sections: newSections,
  }
}

export function editPropPath (state: Choreo, sectionId: string, propId: string, movement: Movement): Choreo {
  const newSections = state.sections.map(section => {
    if (!strEquals(section.id, sectionId)) return section;
    const newMovement = {...section.formation.propMovements ?? {}};
    newMovement[propId] = movement;

    return {
      ...section,
      formation: {
        ...section.formation,
        propMovements: newMovement,
      }
    }
  });

  return {
    ...state,
    sections: newSections,
  }
}
