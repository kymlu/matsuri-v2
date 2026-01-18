export interface DancerAction {
  name: string,
  timings: Record<string, DancerActionTimings>,
}

export interface DancerActionTimings {
  timing: string,
  dancerIds: string[],
}