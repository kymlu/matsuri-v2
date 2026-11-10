import { useState } from "react";
import { RosterDefaultsResult, RosterList } from "../../models/roster";
import { updateRosterDefaults } from "../../lib/helpers/apiHelper";
import { BulkLookField, getSharedLook } from "../../lib/helpers/rosterHelper";
import { DEFAULT_PROP_LENGTH, DEFAULT_PROP_WIDTH, MAX_PROP_DIMENSION, MIN_PROP_DIMENSION } from "../../lib/consts/consts";
import BaseEditDialog from "./BaseEditDialog";
import NumberInput from "../inputs/NumberInput";
import ColorSwatchGrid from "../inputs/ColorSwatchGrid";

type BulkPropLookDialogProps = {
  teamId: string,
  list: RosterList, // the prop list
  selectedIds: Set<string>,
  field: BulkLookField,
  onApplied: (result: RosterDefaultsResult) => void,
}

const SAVE_FAILED = "保存できませんでした。もう一度お試しください";

// 大きさを設定 / 色を設定 for every selected prop name at once. Changes only that one field.
// Starts from the value they share; when they differ, size starts from a new prop's size and colour from nothing.
export default function BulkPropLookDialog({ teamId, list, selectedIds, field, onApplied }: BulkPropLookDialogProps) {
  const selectedNames = list.names.filter(n => selectedIds.has(n.id));
  const [sharedSize] = useState(() => getSharedLook(selectedNames, "size"));
  const [sharedColor] = useState(() => getSharedLook(selectedNames, "color"));
  const startSize = typeof sharedSize === "object" ? sharedSize : undefined;
  const [length, setLength] = useState(startSize?.length ?? DEFAULT_PROP_LENGTH);
  const [width, setWidth] = useState(startSize?.width ?? DEFAULT_PROP_WIDTH);
  const [color, setColor] = useState(typeof sharedColor === "string" && sharedColor !== "mixed" ? sharedColor : undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const isMixed = (field === "size" ? sharedSize : sharedColor) === "mixed";
  const count = `${selectedNames.length}件`;

  const apply = () => {
    setIsSaving(true);
    const items = selectedNames.map(n => field === "size" ? { id: n.id, length, width } : { id: n.id, color });
    updateRosterDefaults(teamId, items,
      onApplied,
      () => {
        setError(SAVE_FAILED);
        setIsSaving(false);
      });
  };

  return <BaseEditDialog
    title={field === "size" ? "大きさを設定" : "色を設定"}
    actionButtonText={`${count}に設定`}
    fullWidth={true}
    isActionButtonDisabled={isSaving || (field === "color" && color === undefined)}
    onSubmit={apply}>
    <div className="space-y-3">
      <p className="text-sm text-muted">
        選択中の{count}の{field === "size" ? "大きさ" : "色"}を変えます。
        {isMixed && "今はばらばらです。設定すると、すべて同じになります。"}
        隊列表の道具は変わりません。
      </p>
      {
        field === "size"
          ? <div className="flex gap-1">
            <NumberInput
              label="縦"
              compact
              defaultValue={length}
              min={MIN_PROP_DIMENSION}
              max={MAX_PROP_DIMENSION}
              baseStep={0.1}
              buttonStep={0.5}
              onChange={(value) => setLength(value ?? MIN_PROP_DIMENSION)}/>
            <NumberInput
              label="幅"
              compact
              defaultValue={width}
              min={MIN_PROP_DIMENSION}
              max={MAX_PROP_DIMENSION}
              baseStep={0.1}
              buttonStep={0.5}
              onChange={(value) => setWidth(value ?? MIN_PROP_DIMENSION)}/>
          </div>
          : <ColorSwatchGrid value={color} onChange={(value) => {
            setColor(value);
            setError(undefined);
          }}/>
      }
      {error && <p aria-live="polite" className="font-bold text-center text-primary">{error}</p>}
    </div>
  </BaseEditDialog>
}
