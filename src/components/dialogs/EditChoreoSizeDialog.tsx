import { useEffect, useMemo, useState } from "react";
import { MIN_STAGE_DIMENSION, MAX_STAGE_DIMENSION, MIN_STAGE_MARGIN, MAX_STAGE_MARGIN } from "../../lib/consts/consts";
import { Choreo, StageGeometry, StageType } from "../../models/choreo";
import NumberInput from "../inputs/NumberInput";
import BaseEditDialog from "./BaseEditDialog";
import GridPreview from "../grid/GridPreview";
import Button from "../basic/Button";
import Icon from "../basic/Icon";
import { getObjectsOutsideStage } from "../../lib/editor/commands/choreoCommands";

interface EditChoreoMetaForm {
  name: string;
  eventName: string;
  stageType: StageType;
  stageWidth: number;
  stageLength: number;
  xMargin: number;
  yMargin: number;
}

const getForm = (choreo: Choreo): EditChoreoMetaForm => ({
  name: choreo.name,
  eventName: choreo.event,
  stageType: choreo.stageType,
  stageLength: choreo.stageGeometry.stageLength,
  stageWidth: choreo.stageGeometry.stageWidth,
  xMargin: choreo.stageGeometry.margin.leftMargin,
  yMargin: choreo.stageGeometry.margin.topMargin,
});

type EditChoreoSizeDialogProps = {
  currentChoreo: Choreo;
  onSave: (geometry: StageGeometry, stageType: StageType) => void;
}

export default function EditChoreoSizeDialog({
  currentChoreo, onSave
}: EditChoreoSizeDialogProps) {
  const [form, setForm] = useState<EditChoreoMetaForm>(() => getForm(currentChoreo));

  useEffect(() => {
    setForm(getForm(currentChoreo));
  }, [currentChoreo]);

  const handleChange = (field: keyof EditChoreoMetaForm, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const stageGeometry = useMemo<StageGeometry>(() => {
    return {
      stageLength: form.stageLength,
      stageWidth: form.stageWidth,
      margin: {
        topMargin: form.yMargin,
        bottomMargin: form.yMargin,
        leftMargin: form.xMargin,
        rightMargin: form.xMargin,
      },
      yAxis: form.stageType === "parade" ? "bottom-up" : "top-down",
    };
  }, [form]);

  const overflowMessage = useMemo(() => {
    const overflow = getObjectsOutsideStage(currentChoreo, stageGeometry);
    const counts = [
      overflow.dancerIds.length > 0 ? `ダンサー${overflow.dancerIds.length}人` : "",
      overflow.propIds.length > 0 ? `道具${overflow.propIds.length}個` : "",
      overflow.obstacleIds.length > 0 ? `障害物${overflow.obstacleIds.length}個` : "",
    ].filter(Boolean);
    if (counts.length === 0) return undefined;
    const sectionNames = currentChoreo.sections.filter(x => overflow.sectionIds.includes(x.id)).map(x => x.name);
    return `${counts.join("・")}が範囲外になるため、端に移動します${sectionNames.length > 0 ? `（${sectionNames.join("、")}）` : ""}。`;
  }, [currentChoreo, stageGeometry]);

  return <BaseEditDialog
    full
    title="舞台サイズ変更"
    actionButtonText={overflowMessage ? "移動して保存" : undefined}
    onClose={() => {
      setForm(getForm(currentChoreo));
    }}
    onSubmit={() => {onSave(stageGeometry, form.stageType)}}
    >
      <div className="flex flex-col h-full gap-2 md:flex-row">
        <GridPreview
          stageLength={form.stageLength}
          stageWidth={form.stageWidth}
          stageType={form.stageType}
          xMargin={form.xMargin}
          yMargin={form.yMargin}
        />
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-col">
          <Button
            full
            disabled
            primary={form.stageType === 'parade'}
            onClick={() => handleChange("stageType", "parade")}
          >
            パレード
          </Button>
          <Button
            full
            disabled
            primary={form.stageType === 'stage'}
            onClick={() => handleChange("stageType", "stage")}
          >
            ステージ
          </Button>
          <NumberInput
            name="縦"
            defaultValue={form.stageLength}
            min={MIN_STAGE_DIMENSION}
            max={MAX_STAGE_DIMENSION}
            baseStep={1}
            buttonStep={1}
            onChange={(newValue) => {handleChange("stageLength", Number(newValue))}}
            label="縦 (m)"
          />
          <NumberInput
            name="幅"
            defaultValue={form.stageWidth}
            min={MIN_STAGE_DIMENSION}
            max={MAX_STAGE_DIMENSION}
            baseStep={1}
            buttonStep={1}
            onChange={(newValue) => {handleChange("stageWidth", Number(newValue))}}
            label="幅 (m)"
          />
          <NumberInput
            name="xMargin"
            defaultValue={form.xMargin}
            min={MIN_STAGE_MARGIN}
            max={MAX_STAGE_MARGIN}
            baseStep={1}
            buttonStep={1}
            onChange={(newValue) => {handleChange("xMargin", Number(newValue))}}
            label="左右余白 (m)"
          />
          <NumberInput
            name="yMargin"
            defaultValue={form.yMargin}
            min={MIN_STAGE_MARGIN}
            max={MAX_STAGE_MARGIN}
            baseStep={1}
            buttonStep={1}
            onChange={(newValue) => {handleChange("yMargin", Number(newValue))}}
            label="上下余白 (m)"
          />
          {
            overflowMessage &&
            <p className="flex items-start col-span-2 gap-1 text-sm text-primary">
              <Icon src="warning" colour="primary" size="xs"/>
              {overflowMessage}
            </p>
          }
        </div>
      </div>
  </BaseEditDialog>
}