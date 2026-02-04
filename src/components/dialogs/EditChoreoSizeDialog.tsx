import { useEffect, useMemo, useState } from "react";
import { MIN_STAGE_DIMENSION, MAX_STAGE_DIMENSION, MIN_STAGE_MARGIN, MAX_STAGE_MARGIN } from "../../lib/consts/consts";
import { Choreo, StageGeometry, StageType } from "../../models/choreo";
import NumberInput from "../inputs/NumberInput";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import GridPreview from "../grid/GridPreview";

interface EditChoreoMetaForm {
  name: string;
  eventName: string;
  stageType: StageType;
  stageWidth: number;
  stageLength: number;
  xMargin: number;
  yMargin: number;
}

export default function EditChoreoSizeDialog(props: {
  currentChoreo: Choreo;
  onSave: (geometry: StageGeometry) => void;
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
    });
  }, [props.currentChoreo]);

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

  return <BaseEditDialog
    full
    title="舞台サイズを変更"
    onClose={() => {
      setForm({
        name: props.currentChoreo.name,
        eventName: props.currentChoreo.event,
        stageType: props.currentChoreo.stageType,
        stageLength: props.currentChoreo.stageGeometry.stageLength,
        stageWidth: props.currentChoreo.stageGeometry.stageWidth,
        xMargin: props.currentChoreo.stageGeometry.margin.leftMargin,
        yMargin: props.currentChoreo.stageGeometry.margin.topMargin,
      });
    }}
    onSubmit={() => {props.onSave(stageGeometry)}}
    >
      <div className="flex flex-col gap-2 md:flex-row">
        <GridPreview
          stageLength={form.stageLength}
          stageWidth={form.stageWidth}
          stageType={form.stageType}
          xMargin={form.xMargin}
          yMargin={form.yMargin}
        />
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-col">
          <div className="col-span-2">
            <TextInput
              label="舞台類分"
              default={props.currentChoreo?.stageType === "parade" ? "パレード" : "ステージ"}
              onContentChange={() => {console.log("todo: verify change needed")}}
              disabled/>
          </div>
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
            label="左右余白 (m)"
          />
          <NumberInput
            name="yMargin"
            default={form.yMargin}
            min={MIN_STAGE_MARGIN}
            max={MAX_STAGE_MARGIN}
            step={1}
            buttonStep={1}
            onChange={(newValue) => {handleChange("yMargin", Number(newValue))}}
            label="上下余白 (m)"
          />
        </div>
      </div>
  </BaseEditDialog>
}