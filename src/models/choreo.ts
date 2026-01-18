import { BaseModel } from "./base";
import { ChoreoSection } from "./choreoSection";
import { Dancer } from "./dancer";
import { Prop } from "./prop";

export interface Choreo extends BaseModel {
  event: string,
  stageType: StageType,
  length: number,
  width: number,
  margins: StageMargins,
  sections: ChoreoSection[],
  dancers: Record<string, Dancer>,
  props: Record<string, Prop>,
}

export type StageType = "stage" | "parade";

export interface StageMargins {
  topMargin: number,
  leftMargin: number,
  rightMargin: number,
  bottomMargin: number,
}
