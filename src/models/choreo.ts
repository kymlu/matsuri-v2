import { BaseModel } from "./base";
import { ChoreoSection } from "./choreoSection";
import { Dancer } from "./dancer";
import { Prop } from "./prop";

export interface Choreo extends BaseModel {
  event: string,
  stageType: StageType,
  stageGeometry: StageGeometry,
  sections: ChoreoSection[],
  dancers: Record<string, Dancer>,
  props: Record<string, Prop>,
}

export type StageType = "stage" | "parade";

export type StageGeometry = {
  stageWidth: number;   // meters
  stageLength: number;  // meters
  margin: StageMargins;
  yAxis: YAxisDirection;
};

export type YAxisDirection = "top-down" | "bottom-up";

export interface StageMargins {
  topMargin: number,
  leftMargin: number,
  rightMargin: number,
  bottomMargin: number,
}
