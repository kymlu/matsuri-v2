import { Choreo, StageGeometry } from "../../../models/choreo";

export function editChoreoInfo(state: Choreo, newName: string, newEvent: string): Choreo {
  console.log("Editing choreo info", newName, newEvent);
  return {
    ...state,
    name: newName,
    event: newEvent,
  }
}

export function changeStageGeometry(state: Choreo, newGeometry: StageGeometry): Choreo {
  console.log("Changing stage geometry", newGeometry);
  return {
    ...state,
    stageGeometry: {...newGeometry},
  }
}