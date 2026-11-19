import { useEffect, useMemo, useState } from "react";
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

type ActionManagerDialogProps = {
  section: ChoreoSection,
  onSubmit: (actions: DancerAction[]) => void,
}

export function ActionManagerDialog({
  section, onSubmit
}: ActionManagerDialogProps) {
  const [actions, setActions] = useState<DancerAction[]>([]);
  const [actionNames, setActionNames] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>();
  // Marked for deletion; they stay, struck through, until 保存 so they can be brought back.
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    setActions([...section.formation.dancerActions]);
  }, [section]);

  const addAction = () => {
    setActions(prev => [...prev, {
      id: crypto.randomUUID(),
      name: "",
      timings: [
        {id: crypto.randomUUID(), name: "", dancerIds: []},
        {id: crypto.randomUUID(), name: "", dancerIds: []}
      ]}]);
  }

  const addTiming = (i: number) => {
    setActions(prev =>
      prev.map((action, index) =>
        index === i
          ? {
              ...action,
              timings: [
                ...action.timings,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  dancerIds: []
                },
              ],
            }
          : action
      )
    );
  };

  const setNewTimings = (i: number, newTimings: DancerActionTiming[]) => {
    setActions(prev =>
      prev.map((action, index) =>
        index === i
          ? {
              ...action,
              timings: newTimings,
            }
          : action
      )
    );
  };

  useEffect(() => {
    const names = liveActions.map(x => x.name.trim());
    const nameSet = new Set(names);
    setActionNames(Array.from(nameSet).reduce((acc, item) => {
      acc[item] = liveActions.filter(x => strEquals(x.name.trim(), item)).length;
      return acc;}
    , {} as Record<string, number>));
  }, [liveActions]);

  const canSubmit = useMemo(() => {
    if (liveActions.length === 0) return true;
    
    const names = liveActions.map(x => x.name.trim());
    const nameSet = new Set(names);
    if (names.length !== nameSet.size) {
      setErrorMessage("重複のアクション名があります。");
      return false;
    } else if (nameSet.has("")) {
      setErrorMessage("空のアクション名があります。");
      return false;
    }

    for (const action of liveActions) {
      const timingNames = action.timings.map(x => x.name.trim());
      const timingNameSet = new Set(timingNames);
      if (timingNames.length !== timingNameSet.size){
        setErrorMessage("重複のタイミング名があります。");
        return false;
      } else if (timingNameSet.has("")) {
        setErrorMessage("空のタイミング名があります。");
        return false;
      }
    }

    setErrorMessage(null);
    return true;
  }, [liveActions]);

  return <BaseEditDialog
    title={`カウント管理 - ${section.name}`}
    full
    isActionButtonDisabled={!canSubmit}
    actionButtonText="保存"
    onClose={() => {
      setDeletedIds(new Set());
      setActions([...section.formation.dancerActions]);
    }}
    onSubmit={() => {onSubmit(liveActions)}}>
    <div className="h-full max-h-full grid gap-2 grid-rows-[1fr,auto]">
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
                actions.map((action, i) => 
                  <SortableActionSection
                    key={action.id}
                    action={action}
                    actionNames={actionNames}
                    deletedIds={deletedIds}
                    canRestoreAction={liveActions.length < 5}
                    onToggleDeleted={toggleDeleted}
                    // New objects, never edits of the old ones: those belong to the chart's saved state.
                    onRenameAction={(name) => {
                      setActions(prev => prev.map((a, index) => index === i ? { ...a, name } : a));
                    }}
                    onAddTiming={() => {addTiming(i)}}
                    onRenameTiming={(newTimings) => setNewTimings(i, newTimings)}/>
                )
              }
            </SortableContext>
        </DndContext>
      </div>
      {
        errorMessage && <div className="font-bold text-center text-wrap text-primary">
        {errorMessage}
      </div>
      }
    </div>
  </BaseEditDialog>
}

type SortableActionSectionProps = {
  action: DancerAction,
  actionNames: Record<string, number>,
  deletedIds: Set<string>, // actions and counts marked for deletion
  canRestoreAction: boolean, // false at the 5-action limit
  onToggleDeleted: (id: string) => void,
  onRenameAction: (name: string) => void,
  onAddTiming: () => void,
  onRenameTiming: (newTimings: DancerActionTiming[]) => void,
}

function SortableActionSection ({
  action, actionNames, deletedIds, canRestoreAction, onToggleDeleted,
  onRenameAction, onAddTiming, onRenameTiming,
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

  const [timingNames, setTimingNames] = useState<Record<string, number>>({});

  const liveTimings = action.timings.filter(t => !deletedIds.has(t.id));

  // Deleted counts don't count: their names are free to reuse.
  useEffect(() => {
    const live = action.timings.filter(t => !deletedIds.has(t.id));
    const names = live.map(x => x.name.trim());
    const nameSet = new Set(names);
    setTimingNames(Array.from(nameSet).reduce((acc, item) => {
      acc[item] = live.filter(x => strEquals(x.name.trim(), item)).length;
      return acc;}
    , {} as Record<string, number>));
  }, [action, deletedIds]);

  if (deletedIds.has(action.id)) {
    // Greyed and struck through, with undo in place of the trash icon.
    return <div className="relative flex flex-row items-center gap-2 px-4 py-3 border border-dashed rounded-md bg-surface border-line" style={style} ref={setNodeRef}>
      <span className="opacity-30"><Icon src="dragHandle"/></span>
      <span className="flex-1 min-w-0 line-through break-all text-muted">{action.name.trim() || "（名前なし）"}</span>
      <span className="text-xs text-muted whitespace-nowrap">カウント{liveTimings.length}個</span>
      <IconButton size="sm" colour="grey" noBorder src="undo" disabled={!canRestoreAction} onClick={() => onToggleDeleted(action.id)}/>
    </div>;
  }

  return <div className="relative flex flex-row items-start gap-2 p-4 bg-surface border border-line rounded-md" style={style} ref={setNodeRef}>
    <div {...attributes} {...listeners}>
      <Icon src="dragHandle"/>
    </div>
    <div className="flex-1">
      <TextInput
        required
        hasError={actionNames[action.name.trim()] > 1}
        maxLength={ACTION_NAME_LENGTH}
        label="アクション名"
        defaultValue={action.name}
        onContentChange={(newName) => {onRenameAction(newName)}}/>
      <span className="font-semibold">カウント（重複不可）</span>
      <div className="flex flex-wrap gap-4">
        {
          action.timings.map((timing, i) => 
            <TimingItem
              key={timing.id}
              timing={timing}
              timingNames={timingNames}
              isDeleted={deletedIds.has(timing.id)}
              canRestore={liveTimings.length < 16}
              onRenameTiming={(name) => {
                onRenameTiming(action.timings.map((t, index) => index === i ? { ...t, name } : t));
              }}
              onToggleDeleted={() => onToggleDeleted(timing.id)}
              // An action keeps at least one count, but a deleted one can always come back.
              showDeleteButton={liveTimings.length > 1}
              />
          )
        }
        {
          liveTimings.length < 16 &&
          <IconButton onClick={onAddTiming} src="add" size="sm"/>
        }
      </div>
    </div>
    <div className="absolute top-2 right-2">
      <IconButton size="sm" colour="primary" noBorder src="delete" onClick={() => onToggleDeleted(action.id)}/>
    </div>
  </div>
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
    return <div className="flex items-center gap-0.5">
      <span className="px-2 py-1.5 line-through border border-dashed rounded-md text-muted border-line">{timing.name.trim() || "（名前なし）"}</span>
      <IconButton colour="grey" size="sm" noBorder src="undo" disabled={!canRestore} onClick={onToggleDeleted}/>
    </div>;
  }
  return <div className="flex items-center gap-0.5">
    <TextInput 
      required
      hasError={timingNames[timing.name.trim()] > 1}
      maxLength={COUNT_NAME_LENGTH}
      compact short
      defaultValue={timing.name}
      onContentChange={(newName) => {onRenameTiming(newName)}}/>
    <Icon size="sm" src="group"/>
    <span>{timing.dancerIds.length}</span>
    {showDeleteButton && <IconButton colour="primary" size="sm" noBorder src="delete" onClick={onToggleDeleted}/>}
  </div>
}