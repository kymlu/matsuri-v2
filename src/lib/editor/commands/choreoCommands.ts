import { Coordinates } from "../../../models/base";
import { Choreo, StageGeometry, StageType } from "../../../models/choreo";
import { PropPosition } from "../../../models/prop";
import { Movement } from "../../../models/choreoSection";
import { clampToAnchorRange, getAnchorRange } from "../../helpers/editorCalculationHelper";

export function renameChoreo(state: Choreo, newName: string, newEvent?: string, newStartDate?: string, newEndDate?: string): Choreo {
  return {
    ...state,
    name: newName,
    event: newEvent ?? state.event,
    startDate: newStartDate,
    endDate: newEndDate,
  }
}

type ObjectSize = { rotation?: number, width?: number, length?: number };

// Screen y from the stage's top edge. Bottom-up y is measured to the object's far edge, so it works both ways.
const toScreenY = (y: number, { yAxis, stageLength }: StageGeometry, length = 0) =>
  yAxis === "top-down" ? y : stageLength - y - length;

// Moves a position the least distance so all of the object stays within the stage plus its margins, as when dragging.
function fitInside<T extends Coordinates>(position: T, geometry: StageGeometry, { rotation, width, length }: ObjectSize = {}): T {
  const screen = { x: position.x, y: toScreenY(position.y, geometry, length) };
  const fitted = clampToAnchorRange(screen, getAnchorRange(geometry, rotation, width, length));
  // Only converted back when moved, so a position that fits stays exactly as it was.
  return { ...position, x: fitted.x, y: fitted.y === screen.y ? position.y : toScreenY(fitted.y, geometry, length) };
}

const mapValues = <T,>(record: Record<string, T>, map: (value: T) => T): Record<string, T> =>
  Object.fromEntries(Object.entries(record).map(([key, value]) => [key, map(value)]));

// Shifts x so everything stays centred when the width changes. y is measured from the front, so it stays.
const getCentringShift = (state: Choreo, newGeometry: StageGeometry) =>
  (newGeometry.stageWidth - state.stageGeometry.stageWidth) / 2;

// Centres a position on the new stage, and moves it to the edge if any of the object would be outside.
function getFitter(state: Choreo, newGeometry: StageGeometry) {
  const shift = getCentringShift(state, newGeometry);
  return <T extends Coordinates>(position: T, size?: ObjectSize): T =>
    fitInside({ ...position, x: position.x + shift }, newGeometry, size);
}

const propSize = (state: Choreo, position: PropPosition): ObjectSize =>
  ({ ...state.props[position.propId], rotation: position.rotation });

// Moves the given props back inside the stage in every section, the least distance, e.g. after they grow.
export function fitPropsInside(state: Choreo, propIds: Set<string>): Choreo {
  if (propIds.size === 0) {
    return state;
  }
  return {
    ...state,
    sections: state.sections.map(section => ({
      ...section,
      formation: {
        ...section.formation,
        propPositions: mapValues(section.formation.propPositions, position => propIds.has(position.propId)
          ? fitInside(position, state.stageGeometry, propSize(state, position))
          : position),
      },
    })),
  };
}

export type StageOverflow = { dancerIds: string[], propIds: string[], obstacleIds: string[], sectionIds: string[] };

// What a resize would move to the edge, so the user can be told before saving.
export function getObjectsOutsideStage(state: Choreo, newGeometry: StageGeometry): StageOverflow {
  const shift = getCentringShift(state, newGeometry);
  const fit = getFitter(state, newGeometry);
  const isOutside = (position: Coordinates, size?: ObjectSize) => {
    const fitted = fit(position, size);
    return fitted.x !== position.x + shift || fitted.y !== position.y;
  };

  const dancerIds = new Set<string>();
  const propIds = new Set<string>();
  const sectionIds: string[] = [];
  state.sections.forEach(section => {
    const dancers = Object.values(section.formation.dancerPositions).filter(x => isOutside(x));
    const props = Object.values(section.formation.propPositions).filter(x => isOutside(x, propSize(state, x)));
    dancers.forEach(x => dancerIds.add(x.dancerId));
    props.forEach(x => propIds.add(x.propId));
    if (dancers.length + props.length > 0) {
      sectionIds.push(section.id);
    }
  });

  return {
    dancerIds: Array.from(dancerIds),
    propIds: Array.from(propIds),
    obstacleIds: Object.values(state.obstacles ?? {}).filter(x => isOutside(x, x)).map(x => x.id),
    sectionIds,
  };
}

// Keeps everything centred, and moves anything that would be outside the new stage to the nearest edge.
export function changeStageGeometryAndType(state: Choreo, newGeometry: StageGeometry, stageType: StageType): Choreo {
  const fit = getFitter(state, newGeometry);
  // Path midpoints are where the object's centre passes, so they're kept inside as points.
  const fitPaths = (movements?: Record<string, Movement>) =>
    movements && mapValues(movements, movement => ({ ...movement, points: movement.points.map(point => fit(point)) }));

  return {
    ...state,
    stageType: stageType,
    stageGeometry: {...newGeometry},
    sections: state.sections.map(section => ({
      ...section,
      formation: {
        ...section.formation,
        dancerPositions: mapValues(section.formation.dancerPositions, position => fit(position)),
        propPositions: mapValues(section.formation.propPositions, position => fit(position, propSize(state, position))),
        dancerMovements: fitPaths(section.formation.dancerMovements),
        propMovements: fitPaths(section.formation.propMovements),
      },
    })),
    obstacles: state.obstacles && mapValues(state.obstacles, obstacle => fit(obstacle, obstacle)),
  }
}
