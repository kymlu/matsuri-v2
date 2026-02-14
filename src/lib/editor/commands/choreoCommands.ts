import { Choreo, StageGeometry, StageType } from "../../../models/choreo";

export function renameChoreo(state: Choreo, newName: string): Choreo {
  console.log("Editing choreo info", newName);
  return {
    ...state,
    name: newName,
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