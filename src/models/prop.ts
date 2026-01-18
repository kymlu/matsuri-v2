import { BaseModel, BasePosition } from "./base";

export interface Prop extends BaseModel {
  color: string,
  length: number,
  width: number,
}

export interface PropPosition extends BasePosition {
  propId: string,
}