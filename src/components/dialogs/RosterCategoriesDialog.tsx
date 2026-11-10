import { useMemo, useRef, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Roster, RosterKind, RosterList } from "../../models/roster";
import { saveRosterCategories } from "../../lib/helpers/apiHelper";
import { ROSTER_CATEGORY_LENGTH, toNameKey } from "../../lib/helpers/rosterHelper";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import IconButton from "../basic/IconButton";
import Icon from "../basic/Icon";

type CategoryRow = {
  rowId: string, // stable key for dragging; new rows have no id until saved
  id?: string,
  name: string,
  count: number, // names in this category
  isDeleted?: boolean, // marked for deletion; stays in the list until 保存 so it can be undone
}

type RosterCategoriesDialogProps = {
  teamId: string,
  kind: RosterKind, // edits only this tab's categories
  list: RosterList,
  onSaved: (roster: Roster) => void,
}

// Add, rename, reorder and delete categories, saved together like ダンサー管理.
export default function RosterCategoriesDialog({ teamId, kind, list: roster, onSaved }: RosterCategoriesDialogProps) {
  const [rows, setRows] = useState<CategoryRow[]>(() => roster.categories.map(c => ({
    rowId: c.id,
    id: c.id,
    name: c.name,
    count: roster.names.filter(n => n.categoryIds.includes(c.id)).length,
  })));
  const [newName, setNewName] = useState("");
  const newNameRef = useRef<{ changeValue: (value: string) => void }>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  // Deleted rows don't count: their names are free to reuse.
  const keyCounts = useMemo(() => rows.filter(r => !r.isDeleted).reduce((acc, row) => {
    const key = toNameKey(row.name);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>), [rows]);

  const isInvalid = (name: string) => toNameKey(name) === "" || keyCounts[toNameKey(name)] > 1;
  const canAdd = toNameKey(newName) !== "" && keyCounts[toNameKey(newName)] === undefined;

  const addRow = () => {
    if (!canAdd) {
      return;
    }
    setRows(prev => [...prev, { rowId: crypto.randomUUID(), name: newName.trim(), count: 0 }]);
    setNewName("");
    newNameRef.current?.changeValue("");
  };

  // Nothing is deleted until 保存, so a row is only marked, and the same button brings it back.
  const toggleDeleted = (row: CategoryRow) => {
    setRows(prev => prev.map(r => r.rowId === row.rowId ? { ...r, isDeleted: !r.isDeleted } : r));
    setError(undefined);
  };

  const save = () => {
    setIsSaving(true);
    const live = rows.filter(r => !r.isDeleted);
    const deletedIds = rows.filter(r => r.isDeleted && r.id).map(r => r.id!);
    saveRosterCategories(teamId, kind, live.map(r => ({ id: r.id, name: r.name.trim() })), deletedIds,
      onSaved,
      (status) => {
        setError(status === 409 ? "同じ名前の区分がすでにあります" : "保存できませんでした。もう一度お試しください");
        setIsSaving(false);
      });
  };

  return <BaseEditDialog
    // Names the list, so nobody deletes a category from the wrong tab.
    title={kind === "dancer" ? "区分（ダンサー）" : "区分（道具）"}
    fullWidth
    onSubmit={save}
    isActionButtonDisabled={isSaving || rows.some(r => !r.isDeleted && isInvalid(r.name))}>
    <div className="space-y-1">
      <DndContext
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over.id) {
            const oldIndex = rows.findIndex(r => r.rowId === active.id);
            const newIndex = rows.findIndex(r => r.rowId === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
              setRows(arrayMove(rows, oldIndex, newIndex));
            }
          }
        }}>
        <SortableContext items={rows.map(r => r.rowId)}>
          <div>
            {
              rows.map(row =>
                <SortableCategoryRow
                  key={row.rowId}
                  row={row}
                  hasError={!row.isDeleted && isInvalid(row.name)}
                  onRename={(name) => {
                    setRows(prev => prev.map(r => r.rowId === row.rowId ? { ...r, name } : r));
                    setError(undefined);
                  }}
                  onToggleDeleted={() => toggleDeleted(row)}/>
              )
            }
          </div>
        </SortableContext>
      </DndContext>
      {
        rows.length === 0 && <p className="py-2 text-sm text-center text-muted">区分はまだありません</p>
      }
      <div className="flex items-center gap-2 pt-2">
        {/* Not compact: a compact input keeps its own width and ran under the ＋ button on narrow screens. */}
        <div className="flex-1 min-w-0">
          <TextInput
            ref={newNameRef}
            placeholder="新しい区分"
            onContentChange={setNewName}
            maxLength={ROSTER_CATEGORY_LENGTH}
            showLength/>
        </div>
        <IconButton src="add" colour="primary" size="sm" disabled={!canAdd} onClick={addRow}/>
      </div>
      {
        error && <p aria-live="polite" className="font-bold text-center text-primary">{error}</p>
      }
    </div>
  </BaseEditDialog>
}

type SortableCategoryRowProps = {
  row: CategoryRow,
  hasError: boolean,
  onRename: (name: string) => void,
  onToggleDeleted: () => void,
}

function SortableCategoryRow({ row, hasError, onRename, onToggleDeleted }: SortableCategoryRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.rowId, disabled: row.isDeleted });

  if (row.isDeleted) {
    // Greyed and struck through, saying what 保存 will do, with undo in place of the trash icon.
    return <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-2 py-1 bg-surface">
      <span className="opacity-30"><Icon src="dragHandle" size="sm" colour="grey"/></span>
      <span className="flex-1 min-w-0 px-2 py-1.5 line-through break-all text-muted">{row.name}</span>
      <span className="text-xs text-right text-muted whitespace-nowrap">{row.count > 0 ? `${row.count}名から外れます` : "削除"}</span>
      <IconButton src="undo" colour="grey" size="sm" noBorder onClick={onToggleDeleted}/>
    </div>;
  }

  return <div
    ref={setNodeRef}
    style={{ transform: CSS.Transform.toString(transform), transition }}
    className="flex items-center gap-2 py-1 bg-surface">
    {/* touch-none so dragging the handle on a phone doesn't scroll the dialog instead */}
    <div {...attributes} {...listeners} aria-label="並べ替え" className="cursor-grab touch-none">
      <Icon src="dragHandle" size="sm" colour="grey"/>
    </div>
    <div className="flex-1">
      <TextInput
        defaultValue={row.name}
        onContentChange={onRename}
        maxLength={ROSTER_CATEGORY_LENGTH}
        required
        hasError={hasError}
        compact/>
    </div>
    <span className="w-8 text-xs text-right text-muted">{row.count}名</span>
    <IconButton src="delete" colour="primary" size="sm" noBorder onClick={onToggleDeleted}/>
  </div>
}
