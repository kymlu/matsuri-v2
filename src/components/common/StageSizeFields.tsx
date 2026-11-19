import React from "react";
import { MAX_STAGE_DIMENSION, MAX_STAGE_MARGIN, MIN_STAGE_DIMENSION, MIN_STAGE_MARGIN } from "../../lib/consts/consts";
import { formatStageSize, stageDepthLabel } from "../../lib/helpers/stageGridHelper";
import { StageType } from "../../models/choreo";
import GridPreview from "../grid/GridPreview";
import NumberInput from "../inputs/NumberInput";

export type StageSizeField = "stageWidth" | "stageLength" | "xMargin" | "yMargin";

type StageSizeFieldsProps = {
  stageType: StageType,
  stageWidth: number,
  stageLength: number,
  xMargin: number,
  yMargin: number,
  onChange: (field: StageSizeField, value: number) => void,
  stageTypeField: React.ReactNode,
}

export default function StageSizeFields({
  stageType, stageWidth, stageLength, xMargin, yMargin, onChange, stageTypeField
}: StageSizeFieldsProps) {
  const isTall = stageLength + yMargin * 2 > stageWidth + xMargin * 2;

  const field = (name: StageSizeField, label: string, value: number, isMargin: boolean) =>
    <NumberInput
      name={name}
      label={`${label} (m)`}
      defaultValue={value}
      min={isMargin ? MIN_STAGE_MARGIN : MIN_STAGE_DIMENSION}
      max={isMargin ? MAX_STAGE_MARGIN : MAX_STAGE_DIMENSION}
      baseStep={1}
      buttonStep={1}
      onChange={(newValue) => onChange(name, Number(newValue))}
    />;

  return <div className="flex flex-col gap-3">
    <div className={isTall ? "flex items-center gap-3" : "flex flex-col gap-1"}>
      <GridPreview
        stageWidth={stageWidth}
        stageLength={stageLength}
        stageType={stageType}
        xMargin={xMargin}
        yMargin={yMargin}
      />
      <div className="flex flex-col">
        <span className="font-bold text-primary">{formatStageSize(stageWidth, stageLength, stageType)}</span>
        <span className="text-xs text-muted">左右の余白 {xMargin}m・前後の余白 {yMargin}m</span>
      </div>
    </div>
    {stageTypeField}
    <div>
      <span className="text-sm font-semibold">舞台</span>
      <div className="grid grid-cols-2 gap-2 mt-1">
        {field("stageWidth", "幅", stageWidth, false)}
        {field("stageLength", stageDepthLabel(stageType), stageLength, false)}
      </div>
    </div>
    <div>
      <span className="text-sm font-semibold">余白</span>
      <span className="ml-2 text-xs text-muted">舞台の外に立てる範囲</span>
      <div className="grid grid-cols-2 gap-2 mt-1">
        {field("xMargin", "左右", xMargin, true)}
        {field("yMargin", "前後", yMargin, true)}
      </div>
    </div>
  </div>;
}
