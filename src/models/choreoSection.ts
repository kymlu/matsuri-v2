import { BaseModel } from "./base";
import { DancerPosition } from "./dancer";
import { DancerAction } from "./dancerAction";
import { PropPosition } from "./prop";

export interface ChoreoSection extends BaseModel {
  order: number,
  head?: number,
  note?: string,
  formation: Formation,
}

export interface Formation {
  dancerPositions: Record<string, DancerPosition>,
  dancerActions: DancerAction[],
  propPositions: Record<string, PropPosition>,
}