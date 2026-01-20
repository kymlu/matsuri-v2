import { useEffect, useState } from "react";
import { MIN_STAGE_DIMENSION, MAX_STAGE_DIMENSION, MIN_STAGE_MARGIN, MAX_STAGE_MARGIN } from "../../lib/consts/consts";
import { Choreo, StageType } from "../../models/choreo";
import CustomDialog from "../basic/CustomDialog";
import NumberInput from "../inputs/NumberInput";

interface EditChoreoMetaForm {
  name: string;
  eventName: string;
  stageType: StageType;
  stageWidth: number;
  stageLength: number;
  xMargin: number;
  yMargin: number;
}

export default function EditChoreoMetaDialog(props: {
  currentChoreo: Choreo;
}) {
  var [form, setForm] = useState<EditChoreoMetaForm>({
    name: "",
    eventName: "",
    stageType: "parade",
    stageLength: 0,
    stageWidth: 0,
    xMargin: 0,
    yMargin: 0,
  });

  useEffect(() => {
    setForm({
      name: props.currentChoreo.name,
      eventName: props.currentChoreo.event,
      stageType: props.currentChoreo.stageType,
      stageLength: props.currentChoreo.stageGeometry.stageLength,
      stageWidth: props.currentChoreo.stageGeometry.stageWidth,
      xMargin: props.currentChoreo.stageGeometry.margin.leftMargin,
      yMargin: props.currentChoreo.stageGeometry.margin.topMargin,
    })
  }, [props.currentChoreo]);

  const handleChange = (field: keyof EditChoreoMetaForm, value: any) => {
    setForm({ ...form, [field]: value });
  };

  return <CustomDialog
    hasX
    title="設定">
    <NumberInput
      name="幅"
      default={form.stageWidth}
      min={MIN_STAGE_DIMENSION}
      max={MAX_STAGE_DIMENSION}
      step={1}
      buttonStep={1}
      onChange={(newValue) => {handleChange("stageWidth", Number(newValue))}}
      label="幅 (m)"
    />
    <NumberInput
      name="縦"
      default={form.stageLength}
      min={MIN_STAGE_DIMENSION}
      max={MAX_STAGE_DIMENSION}
      step={1}
      buttonStep={1}
      onChange={(newValue) => {handleChange("stageLength", Number(newValue))}}
      label="縦 (m)"
    />
    <NumberInput
      name="xMargin"
      default={form.xMargin}
      min={MIN_STAGE_MARGIN}
      max={MAX_STAGE_MARGIN}
      step={1}
      buttonStep={1}
      onChange={(newValue) => {handleChange("xMargin", Number(newValue))}}
      label="幅 (m)"
    />
    <NumberInput
      name="yMargin"
      default={form.yMargin}
      min={MIN_STAGE_MARGIN}
      max={MAX_STAGE_MARGIN}
      step={1}
      buttonStep={1}
      onChange={(newValue) => {handleChange("yMargin", Number(newValue))}}
      label="縦 (m)"
    />
  </CustomDialog>
}