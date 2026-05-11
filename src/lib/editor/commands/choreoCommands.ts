import { Choreo, StageGeometry, StageType } from "../../../models/choreo";

export function renameChoreo(state: Choreo, newName: string, newEvent?: string, newStartDate?: string, newEndDate?: string): Choreo {
  return {
    ...state,
    name: newName,
    event: newEvent ?? state.event,
    startDate: newStartDate,
    endDate: newEndDate,
  }
}

export function changeStageGeometryAndType(state: Choreo, newGeometry: StageGeometry, stageType: StageType): Choreo {
  return {
    ...state,
    stageType: stageType,
    stageGeometry: {...newGeometry}, // TODO: handle dancers that would fall outside of this range
  }
}