import { useCallback, useEffect, useMemo, useState } from "react";
import { DancerAction, DancerActionTiming } from "../../models/dancerAction";
import { DndContext } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import TextInput from "../inputs/TextInput";
import { strEquals } from "../../lib/helpers/globalHelper";
import Icon from "../basic/Icon";
import { ACTION_NAME_LENGTH, COUNT_NAME_LENGTH } from "../../lib/consts/consts";
import IconButton from "../basic/IconButton";
import BaseEditDialog from "./BaseEditDialog";
import { ChoreoSection } from "../../models/choreoSection";
import { IconLabelButton } from "../basic/Button";
import classNames from "classnames";
import { COUNT_PATTERNS, CountPattern, patternPreview } from "../../lib/consts/countPatterns";

type ActionManagerDialogProps = {
  section: ChoreoSection,
  onSubmit: (actions: DancerAction[]) => void,
}

// How many times each trimmed name is used.
const countNames = (names: string[]) => names.reduce((acc, name) => {
  const key = name.trim();
  acc[key] = (acc[key] ?? 0) + 1;
  return acc;
}, {} as Record<string, number>);

type ActionErrors = { name?: string, counts?: string };

// Deleted actions and counts are left out: their names are free to reuse.
function getActionErrors(liveActions: DancerAction[]): Record<string, ActionErrors> {
  const actionNames = countNames(liveActions.map(a => a.name));
  return Object.fromEntries(liveActions.map(a => {
    const name = a.name.trim();
    const counts = countNames(a.timings.map(t => t.name));
    return [a.id, {
      name: !name ? "アクション名が空" : actionNames[name] > 1 ? "アクション名が重複" : undefined,
      counts: a.timings.length === 0 ? "カウントがありません"
        : counts[""] ? "カウント名が空"
        : Object.values(counts).some(n => n > 1) ? "カウント名が重複"
        : undefined,
    }];
  }));
}

const newTiming = (): DancerActionTiming => ({ id: crypto.randomUUID(), name: "", dancerIds: [] });

export function ActionManagerDialog({
  section, onSubmit
}: ActionManagerDialogProps) {
  const [actions, setActions] = useState<DancerAction[]>([]);
  // Marked for deletion; they stay, struck through, until 保存 so they can be brought back.
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  // One action open at a time keeps the list short enough to drag.
  const [openId, setOpenId] = useState<string | undefined>();
  // Unsaved actions added here; kept here because a closed card unmounts.
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const toggleDeleted = (id: string) => setDeletedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });

  // What 保存 would keep: actions and counts not marked for deletion.
  const liveActions = useMemo(() => actions
    .filter(a => !deletedIds.has(a.id))
    .map(a => ({ ...a, timings: a.timings.filter(t => !deletedIds.has(t.id)) })), [actions, deletedIds]);

  const errors = useMemo(() => getActionErrors(liveActions), [liveActions]);
  const canSubmit = Object.values(errors).every(e => !e.name && !e.counts);

  const reset = useCallback(() => {
    setDeletedIds(new Set());
    setNewIds(new Set());
    setActions([...section.formation.dancerActions]);
    setOpenId(section.formation.dancerActions[0]?.id);
  }, [section]);

  useEffect(reset, [reset]);

  const addAction = () => {
    const id = crypto.randomUUID();
    setOpenId(id);
    setNewIds(prev => new Set(prev).add(id));
    setActions(prev => [...prev, { id, name: "", timings: [] }]);
  }

  // New objects, never edits of the old ones: those belong to the chart's saved state.
  const updateAction = (id: string, change: (action: DancerAction) => DancerAction) => {
    setActions(prev => prev.map(a => a.id === id ? change(a) : a));
  };

  return <BaseEditDialog
    title={`カウント管理 - ${section.name}`}
    full
    isActionButtonDisabled={!canSubmit}
    actionButtonText="保存"
    onClose={reset}
    onSubmit={() => {onSubmit(liveActions)}}>
    <div className="max-h-full space-y-4 overflow-auto">
      <IconLabelButton
        icon="add"
        full
        onClick={addAction}
        primary
        disabled={liveActions.length >= 5}
        label="アクション追加"
        />
      <DndContext
        modifiers={[restrictToParentElement]}
        onDragEnd={(event) => {
          const { active, over } = event;

          if (over && active.id !== over.id) {
            const oldIndex = actions.findIndex((item) => strEquals(item.id, active.id.toString()));
            const newIndex = actions.findIndex((item) => strEquals(item.id, over.id.toString()));
            if (oldIndex !== -1 && newIndex !== -1) {
              setActions(arrayMove(actions, oldIndex, newIndex));
            }
          }
        }}>
          <SortableContext items={actions}>
            {
              actions.map(action =>
                <SortableActionSection
                  key={action.id}
                  action={action}
                  errors={errors[action.id] ?? {}}
                  deletedIds={deletedIds}
                  canRestoreAction={liveActions.length < 5}
                  isOpen={openId === action.id}
                  isNew={newIds.has(action.id)}
                  onOpen={() => setOpenId(action.id)}
                  onClose={() => setOpenId(undefined)}
                  onToggleDeleted={toggleDeleted}
                  onUpdate={(change) => updateAction(action.id, change)}/>
              )
            }
          </SortableContext>
      </DndContext>
    </div>
  </BaseEditDialog>
}

type SortableActionSectionProps = {
  action: DancerAction,
  errors: ActionErrors, // this action's, without its deleted counts
  deletedIds: Set<string>, // actions and counts marked for deletion
  canRestoreAction: boolean, // false at the 5-action limit
  isOpen: boolean,
  isNew: boolean, // added in this dialog: starts from a pattern
  onOpen: () => void,
  onClose: () => void,
  onToggleDeleted: (id: string) => void,
  onUpdate: (change: (action: DancerAction) => DancerAction) => void,
}

function SortableActionSection ({
  action, errors, deletedIds, canRestoreAction, isOpen, isNew, onOpen, onClose, onToggleDeleted, onUpdate,
}: SortableActionSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: action.id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const liveTimings = action.timings.filter(t => !deletedIds.has(t.id));
  const timingNames = countNames(liveTimings.map(t => t.name));
  const isChoosing = isNew && action.timings.length === 0;

  const setTimings = (names: string[]) =>
    onUpdate(a => ({ ...a, timings: names.map(name => ({ ...newTiming(), name })) }));
  const errorText = errors.name ?? errors.counts;

  const dragHandle = <div {...attributes} {...listeners} className="shrink-0">
    <Icon src="dragHandle"/>
  </div>;

  if (deletedIds.has(action.id)) {
    // Greyed and struck through, with undo in place of the trash icon.
    return <div className="relative flex flex-row items-center gap-2 px-4 py-3 border border-dashed rounded-md bg-surface border-line" style={style} ref={setNodeRef}>
      <span className="opacity-30"><Icon src="dragHandle"/></span>
      <span className="flex-1 min-w-0 line-through break-all text-muted">{action.name.trim() || "（名前なし）"}</span>
      <IconButton size="sm" colour="grey" noBorder src="undo" disabled={!canRestoreAction} onClick={() => onToggleDeleted(action.id)}/>
    </div>;
  }

  if (!isOpen) {
    // A closed card still shows its problems, so 保存 being greyed out can be traced.
    const name = action.name.trim();
    return <div
      className={classNames("flex items-center gap-1.5 px-3 py-2 border rounded-md bg-surface", errorText ? "border-primary" : "border-line")}
      style={style}
      ref={setNodeRef}>
      {dragHandle}
      <button type="button" onClick={onOpen} className="flex items-center flex-1 min-w-0 gap-2 text-start">
        <span className="flex-1 min-w-0">
          <span className="block font-semibold truncate">{name || "（名前なし）"}</span>
          {
            errorText
              ? <span className="block text-sm font-semibold truncate text-primary">{errorText}</span>
              : <span className="block text-sm truncate text-muted">{liveTimings.map(t => t.name.trim()).join("・")}</span>
          }
        </span>
        <Icon src="expandMore" size="sm" colour="grey"/>
      </button>
    </div>;
  }

  return <div className="px-2 py-3 border rounded-md bg-surface border-line" style={style} ref={setNodeRef}>
    <div className="flex items-center gap-1">
      {dragHandle}
      <div className="flex-1 min-w-0 space-y-2">
        <TextInput
          required
          hasError={!!errors.name}
          maxLength={ACTION_NAME_LENGTH}
          placeholder="アクション名"
          defaultValue={action.name}
          onContentChange={(name) => onUpdate(a => ({ ...a, name }))}/>
      </div>
      <IconButton size="sm" colour="primary" noBorder src="delete" onClick={() => onToggleDeleted(action.id)}/>
    </div>
    {errors.name && <p className="mt-1 text-sm font-semibold text-primary">{errors.name}</p>}
    {
      isChoosing
        ? <>
          <p className="mt-1.5 text-sm font-semibold">カウント</p>
          <PatternChooser onPick={(pattern) => setTimings(pattern.counts)} onOwn={() => setTimings(["", ""])}/>
        </>
        : <>
          <p className="mt-1.5 text-sm font-semibold">カウント <span className="font-normal text-muted">{liveTimings.length}/16</span></p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-x-2 gap-y-2 pt-1.5">
            {
              action.timings.map(timing =>
                <TimingItem
                  key={timing.id}
                  timing={timing}
                  timingNames={timingNames}
                  isDeleted={deletedIds.has(timing.id)}
                  canRestore={liveTimings.length < 16}
                  onRenameTiming={(name) => onUpdate(a => ({ ...a, timings: a.timings.map(t => t.id === timing.id ? { ...t, name } : t) }))}
                  onToggleDeleted={() => onToggleDeleted(timing.id)}
                  // An action keeps at least one count, but a deleted one can always come back.
                  showDeleteButton={liveTimings.length > 1}
                  />
              )
            }
            {
              liveTimings.length < 16 &&
              <button type="button" onClick={() => onUpdate(a => ({ ...a, timings: [...a.timings, newTiming()] }))} className="flex items-center justify-center h-10 gap-0.5 text-sm border border-dashed rounded-md border-line-strong text-muted">
                <Icon src="add" size="xs" colour="grey"/>カウント
              </button>
            }
          </div>
        </>
    }
    {errors.counts && !isChoosing && <p className="mt-1.5 text-sm font-semibold text-primary">{errors.counts}</p>}
    <button type="button" onClick={onClose} className="flex items-center justify-center w-full gap-0.5 pt-2 text-sm font-semibold text-primary">
      <Icon src="expandLess" size="xs" colour="primary"/>閉じる
    </button>
  </div>
}

function PatternChooser({ onPick, onOwn }: { onPick: (pattern: CountPattern) => void, onOwn: () => void }) {
  return <>
    <div className="grid grid-cols-2 gap-1.5 pt-1.5">
      {
        COUNT_PATTERNS.map(pattern =>
          <button
            type="button"
            key={pattern.name}
            aria-label={`${pattern.name}: ${pattern.counts.join(" ")}`}
            onClick={() => onPick(pattern)}
            className="flex flex-wrap items-baseline content-center min-w-0 px-2 py-1 border rounded-md text-start min-h-11 gap-x-1 bg-surface border-line-strong">
            <span className="font-semibold">{pattern.name}</span>
            <span className="text-xs whitespace-nowrap text-muted">{patternPreview(pattern)}</span>
          </button>
        )
      }
    </div>
    <button type="button" onClick={onOwn} className="flex items-center justify-center w-full gap-0.5 mt-1.5 text-sm border border-dashed rounded-md min-h-11 border-line-strong text-muted">
      <Icon src="add" size="xs" colour="grey"/>自分で入力
    </button>
  </>
}

type TimingItemProps = {
  timing: DancerActionTiming,
  timingNames: Record<string, number>,
  isDeleted: boolean,
  canRestore: boolean, // false at the 16-count limit
  onRenameTiming: (name: string) => void,
  onToggleDeleted: () => void,
  showDeleteButton: boolean,
}

function TimingItem ({
  timing, timingNames, isDeleted, canRestore, onRenameTiming, onToggleDeleted, showDeleteButton}: TimingItemProps
) {
  if (isDeleted) {
    return <div className="flex items-center min-w-0 gap-0.5">
      <span className="flex-1 min-w-0 px-2 py-2 truncate line-through border border-dashed rounded-md text-muted border-line">{timing.name.trim() || "（名前なし）"}</span>
      <IconButton colour="grey" size="sm" noBorder src="undo" disabled={!canRestore} onClick={onToggleDeleted}/>
    </div>;
  }
  return <div className="flex items-center min-w-0 gap-0.5">
    <div className="relative flex-1 min-w-0">
      <TextInput
        required
        hasError={timingNames[timing.name.trim()] > 1}
        maxLength={COUNT_NAME_LENGTH}
        defaultValue={timing.name}
        onContentChange={(newName) => {onRenameTiming(newName)}}/>
      {
        showDeleteButton &&
        <button
          type="button"
          aria-label="カウントを削除"
          onClick={onToggleDeleted}
          className="absolute flex items-center justify-center border rounded-full -top-2 -right-2 size-5 bg-surface border-line">
          <Icon src="clear" size="2xs" colour="grey"/>
        </button>
      }
    </div>
    <Icon size="2xs" src="group" colour="grey"/>
    <span className="text-sm">{timing.dancerIds.length}</span>
  </div>
}
