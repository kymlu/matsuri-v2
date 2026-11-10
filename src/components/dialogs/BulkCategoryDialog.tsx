import { useMemo, useState } from "react";
import { RosterKind, RosterLinksResult, RosterList } from "../../models/roster";
import { updateRosterLinks } from "../../lib/helpers/apiHelper";
import { getBulkCategoryOptions, getPairs, rosterCounter } from "../../lib/helpers/rosterHelper";
import BaseEditDialog from "./BaseEditDialog";
import { ChipToggles } from "../inputs/Chips";

type BulkCategoryDialogProps = {
  teamId: string,
  kind: RosterKind,
  list: RosterList,
  selectedIds: Set<string>,
  mode: "add" | "remove",
  onApplied: (result: RosterLinksResult) => void,
}

const SAVE_FAILED = "保存できませんでした。もう一度お試しください";

// 区分を追加 / 区分を外す for every selected name at once. Starts with nothing ticked.
export default function BulkCategoryDialog({ teamId, kind, list, selectedIds, mode, onApplied }: BulkCategoryDialogProps) {
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const options = useMemo(() => getBulkCategoryOptions(list, selectedIds, mode, kind), [list, selectedIds, mode, kind]);
  const selectedNames = list.names.filter(n => selectedIds.has(n.id));
  const count = `${selectedNames.length}${rosterCounter(kind)}`;

  const apply = () => {
    setIsSaving(true);
    const pairs = getPairs(selectedNames.map(n => n.id), categoryIds);
    updateRosterLinks(teamId, mode === "add" ? pairs : [], mode === "remove" ? pairs : [],
      onApplied,
      () => {
        setError(SAVE_FAILED);
        setIsSaving(false);
      });
  };

  return <BaseEditDialog
    title={mode === "add" ? "区分を追加" : "区分を外す"}
    actionButtonText={mode === "add" ? `${count}に追加` : `${count}から外す`}
    isActionButtonDisabled={categoryIds.length === 0 || isSaving}
    onSubmit={apply}>
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {
          mode === "add"
            ? `選択中の${count}（${selectedNames.slice(0, 3).map(n => n.name).join("・")}${selectedNames.length > 3 ? `、他${selectedNames.length - 3}${rosterCounter(kind)}` : ""}）`
            : `選択中の${count}から外します（名前は名簿に残ります）`
        }
      </p>
      <ChipToggles
        label="区分"
        wrap
        options={options.map(o => ({ value: o.id, label: o.name, note: o.note, disabled: o.isDisabled }))}
        values={categoryIds}
        onChange={(values) => {
          setCategoryIds(values);
          setError(undefined);
        }}/>
      {error && <p aria-live="polite" className="font-bold text-center text-primary">{error}</p>}
    </div>
  </BaseEditDialog>
}
