import { MAX_STAGE_DIMENSION, MAX_STAGE_MARGIN, MIN_STAGE_DIMENSION, MIN_STAGE_MARGIN } from "../../lib/consts/consts";
import { stageDepthLabel } from "../../lib/helpers/stageGridHelper";
import { StageType } from "../../models/choreo";
import NumberInput from "../inputs/NumberInput";

export type StageSizeField = "stageWidth" | "stageLength" | "xMargin" | "yMargin";

export type StageSize = Record<StageSizeField, number>;

type StageSizeInputsProps = {
  stageType: StageType,
  size: StageSize,
  onChange: (field: StageSizeField, value: number) => void,
}

export default function StageSizeInputs({ stageType, size, onChange }: StageSizeInputsProps) {
  const fields: [StageSizeField, string, boolean][] = [
    ["stageWidth", "幅", false],
    ["stageLength", stageDepthLabel(stageType), false],
    ["xMargin", "左右の余白", true],
    ["yMargin", "前後の余白", true],
  ];

  return <div className="grid grid-cols-2 gap-x-2 gap-y-1">
    {
      fields.map(([name, label, isMargin]) =>
        <NumberInput
          key={name}
          name={name}
          label={`${label} (m)`}
          defaultValue={size[name]}
          min={isMargin ? MIN_STAGE_MARGIN : MIN_STAGE_DIMENSION}
          max={isMargin ? MAX_STAGE_MARGIN : MAX_STAGE_DIMENSION}
          baseStep={1}
          buttonStep={1}
          onChange={(newValue) => onChange(name, Number(newValue))}
        />)
    }
  </div>;
}
