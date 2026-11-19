import { useEffect, useMemo, useState } from "react";
import { Choreo, StageGeometry, StageType } from "../../models/choreo";
import BaseEditDialog from "./BaseEditDialog";
import StageSizeFields from "../common/StageSizeFields";
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
    title="舞台サイズ変更"
    actionButtonText={overflowMessage ? "移動して保存" : undefined}
    onClose={() => {
      setForm(getForm(currentChoreo));
    }}
    onSubmit={() => {onSave(stageGeometry, form.stageType)}}
    >
      <StageSizeFields
        stageType={form.stageType}
        stageWidth={form.stageWidth}
        stageLength={form.stageLength}
        xMargin={form.xMargin}
        yMargin={form.yMargin}
        onChange={handleChange}
        stageTypeField={
          <p>
            <span className="mr-2 text-sm font-medium">舞台の種類</span>
            {form.stageType === "parade" ? "パレード" : "ステージ"}
            <span className="text-sm text-muted">（変更不可）</span>
          </p>
        }
      />
      {
        overflowMessage &&
        <p className="flex items-start gap-1 mt-2 text-sm text-primary">
          <Icon src="warning" colour="primary" size="xs"/>
          {overflowMessage}
        </p>
      }
  </BaseEditDialog>
}