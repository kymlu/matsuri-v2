import { useCallback, useEffect, useMemo, useState } from "react";
import { Choreo, StageGeometry } from "../../models/choreo";
import { ChoreoSection } from "../../models/choreoSection";
import { changeStageGeometryAndType, getObjectsOutsideStage } from "../editor/commands/choreoCommands";
import StageSizeSheet from "../../components/editor/StageSizeSheet";
import { StageSize, StageSizeField } from "../../components/common/StageSizeInputs";

type Options = {
  state: Choreo,
  section: ChoreoSection,
  commitState: (newState: Choreo) => void,
};

export type StageResizePreview = {
  choreo: Choreo,
  section: ChoreoSection,
  halfFadedDancerIds: ReadonlySet<string>,
};

const sizeOf = (choreo: Choreo): StageSize => ({
  stageWidth: choreo.stageGeometry.stageWidth,
  stageLength: choreo.stageGeometry.stageLength,
  xMargin: choreo.stageGeometry.margin.leftMargin,
  yMargin: choreo.stageGeometry.margin.topMargin,
});

const geometryOf = (size: StageSize, yAxis: StageGeometry["yAxis"]): StageGeometry => ({
  stageWidth: size.stageWidth,
  stageLength: size.stageLength,
  margin: { topMargin: size.yMargin, bottomMargin: size.yMargin, leftMargin: size.xMargin, rightMargin: size.xMargin },
  yAxis,
});

export function overflowWarning(dancers: number, props: number, obstacles: number) {
  const counts = [
    dancers > 0 ? `${dancers}人` : "",
    props > 0 ? `道具${props}個` : "",
    obstacles > 0 ? `障害物${obstacles}個` : "",
  ].filter(Boolean);
  return counts.length > 0 ? `${counts.join("・")}が舞台の外に出ます。保存すると端に移動します。` : undefined;
}

// 舞台サイズ: the stage shows the result while editing; saving commits it as one undo step.
export function useStageResize({ state, section, commitState }: Options) {
  const [draft, setDraft] = useState<StageSize | undefined>(undefined);
  const [base, setBase] = useState<Choreo | undefined>(undefined);
  const [sheetHeight, setSheetHeight] = useState<number | undefined>(undefined);

  const startStageResize = useCallback(() => {
    setBase(state);
    setDraft(sizeOf(state));
  }, [state]);

  const close = useCallback(() => {
    setDraft(undefined);
    setBase(undefined);
    setSheetHeight(undefined);
  }, []);

  // Closes once the saved state arrives, so the old size doesn't flash.
  useEffect(() => {
    if (base && state !== base) close();
  }, [base, state, close]);

  const geometry = useMemo(
    () => draft && base && geometryOf(draft, base.stageGeometry.yAxis),
    [draft, base]);

  const overflow = useMemo(() => base && geometry && getObjectsOutsideStage(base, geometry), [base, geometry]);

  const stageResizePreview = useMemo((): StageResizePreview | undefined => {
    if (!base || !geometry || !overflow) return undefined;
    const choreo = changeStageGeometryAndType(base, geometry, base.stageType);
    const shown = choreo.sections.find(s => s.id === section.id);
    if (!shown) return undefined;
    const moved = new Set(overflow.dancerIdsBySection[section.id] ?? []);
    return {
      choreo,
      section: shown,
      halfFadedDancerIds: new Set(moved.size > 0 ? Object.keys(shown.formation.dancerPositions).filter(id => !moved.has(id)) : []),
    };
  }, [base, geometry, overflow, section.id]);

  const save = useCallback(() => {
    if (!base || !geometry) return;
    const next = changeStageGeometryAndType(base, geometry, base.stageType);
    if (next.stageGeometry.stageWidth === base.stageGeometry.stageWidth &&
      next.stageGeometry.stageLength === base.stageGeometry.stageLength &&
      next.stageGeometry.margin.leftMargin === base.stageGeometry.margin.leftMargin &&
      next.stageGeometry.margin.topMargin === base.stageGeometry.margin.topMargin) {
      close();
      return;
    }
    commitState(next);
  }, [base, geometry, commitState, close]);

  const onChange = useCallback((field: StageSizeField, value: number) => {
    if (!Number.isFinite(value)) return;
    setDraft(prev => prev && { ...prev, [field]: value });
  }, []);

  const stageSizeSheet = draft && base
    ? <StageSizeSheet
        stageType={base.stageType}
        size={draft}
        onChange={onChange}
        warning={overflow && overflowWarning(overflow.dancerIds.length, overflow.propIds.length, overflow.obstacleIds.length)}
        onCancel={close}
        onSave={save}
        onHeightChange={h => setSheetHeight(prev => prev ?? h)}/>
    : undefined;

  return {
    isResizingStage: draft !== undefined,
    startStageResize,
    stageResizePreview,
    stageResizeSheetHeight: draft ? sheetHeight : undefined,
    stageSizeSheet,
  };
}
