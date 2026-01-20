export interface BaseModel {
  id: string,
  name: string,
}

export interface Coordinates {
  x: number,
  y: number,
}

export interface BasePosition extends Coordinates{
  sectionId: string,
  rotation: number,
}