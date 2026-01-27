import { Choreo, StageGeometry } from "../../../models/choreo";

export function renameChoreo(state: Choreo, newName: string): Choreo {
  return {
    ...state,
    name: newName,
  }
}

export function changeStageGeometry(state: Choreo, newGeometry: StageGeometry): Choreo {
  return {
    ...state,
    stageGeometry: {...newGeometry},
  }
}