import { BaseModel, BasePosition } from "./base";

export interface Dancer extends BaseModel {
  
}

export interface DancerPosition extends BasePosition {
  dancerId: string,
  color: string,
}