import { useMemo, useRef, useState } from "react";
import { Dialog } from "@base-ui/react";
import { DndContext } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Roster, RosterKind, RosterList } from "../../models/roster";
import { saveRosterCategories } from "../../lib/helpers/apiHelper";
import { ROSTER_CATEGORY_LENGTH, toNameKey } from "../../lib/helpers/rosterHelper";
import BaseEditDialog from "./BaseEditDialog";
import ConfirmDeletionDialog from "./ConfirmDeletionDialog";
import TextInput from "../inputs/TextInput";
import IconButton from "../basic/IconButton";
import Icon from "../basic/Icon";

type CategoryRow = {
  rowId: string, // stable key for dragging; new rows have no id until saved
  id?: string,
  name: string,
  count: number, // names in this category
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
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const newNameRef = useRef<{ changeValue: (value: string) => void }>(null);
  const [pendingDelete, setPendingDelete] = useState<CategoryRow>();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const keyCounts = useMemo(() => rows.reduce((acc, row) => {
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

  const removeRow = (row: CategoryRow) => {
    setRows(prev => prev.filter(r => r.rowId !== row.rowId));
    if (row.id) {
      setDeletedIds(prev => [...prev, row.id!]);
    }
  };

  const save = () => {
    setIsSaving(true);
    saveRosterCategories(teamId, kind, rows.map(r => ({ id: r.id, name: r.name.trim() })), deletedIds,
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
    isActionButtonDisabled={isSaving || rows.some(r => isInvalid(r.name))}>
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
                  hasError={isInvalid(row.name)}
                  onRename={(name) => {
                    setRows(prev => prev.map(r => r.rowId === row.rowId ? { ...r, name } : r));
                    setError(undefined);
                  }}
                  onDelete={() => row.count > 0 ? setPendingDelete(row) : removeRow(row)}/>
              )
            }
          </div>
        </SortableContext>
      </DndContext>
      {
        rows.length === 0 && <p className="py-2 text-sm text-center text-muted">区分はまだありません</p>
      }
      <div className="flex items-center gap-2 pt-2">
        <div className="flex-1">
          <TextInput
            ref={newNameRef}
            placeholder="新しい区分"
            onContentChange={setNewName}
            maxLength={ROSTER_CATEGORY_LENGTH}
            compact
            showLength/>
        </div>
        <IconButton src="add" colour="primary" size="sm" disabled={!canAdd} onClick={addRow}/>
      </div>
      {
        error && <p aria-live="polite" className="font-bold text-center text-primary">{error}</p>
      }
    </div>
    <Dialog.Root open={pendingDelete !== undefined} onOpenChange={(open) => { if (!open) setPendingDelete(undefined); }}>
      {
        pendingDelete &&
        <ConfirmDeletionDialog
          name={`「${pendingDelete.name}」`}
          note={`${pendingDelete.count}名から外れます（名前は名簿に残ります）`}
          verb="削除"
          onSubmit={() => {
            removeRow(pendingDelete);
            setPendingDelete(undefined);
          }}/>
      }
    </Dialog.Root>
  </BaseEditDialog>
}

type SortableCategoryRowProps = {
  row: CategoryRow,
  hasError: boolean,
  onRename: (name: string) => void,
  onDelete: () => void,
}

function SortableCategoryRow({ row, hasError, onRename, onDelete }: SortableCategoryRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.rowId });

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
    <IconButton src="delete" colour="primary" size="sm" noBorder onClick={onDelete}/>
  </div>
}
