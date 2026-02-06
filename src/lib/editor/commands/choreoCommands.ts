import { Choreo, StageGeometry, StageType } from "../../../models/choreo";

export function editChoreoInfo(state: Choreo, newName: string, newEvent: string): Choreo {
  console.log("Editing choreo info", newName, newEvent);
  return {
    ...state,
    name: newName,
    event: newEvent,
  }
}

export function changeStageGeometryAndType(state: Choreo, newGeometry: StageGeometry, stageType: StageType): Choreo {
  console.log("Changing stage geometry", newGeometry);
  return {
    ...state,
    stageType: stageType,
    stageGeometry: {...newGeometry}, // TODO: handle dancers that would fall outside of this range
  }
}