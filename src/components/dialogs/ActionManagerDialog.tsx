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
    if (actions.length === 0) return;
    
    const names = actions.map(x => x.name.trim());
    const nameSet = new Set(names);
    setActionNames(Array.from(nameSet).reduce((acc, item) => {
      acc[item] = actions.filter(x => strEquals(x.name.trim(), item)).length;
      return acc;}
    , {} as Record<string, number>));
  }, [actions]);

  const canSubmit = useMemo(() => {
    if (actions.length === 0) return true;
    
    const names = actions.map(x => x.name.trim());
    const nameSet = new Set(names);
    if (names.length !== nameSet.size) {
      setErrorMessage("重複のアクション名があります。");
      return false;
    } else if (nameSet.has("")) {
      setErrorMessage("空のアクション名があります。");
      return false;
    }

    for (const action of actions) {
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
  }, [actions]);

  return <BaseEditDialog
    title={`カウント管理 - ${section.name}`}
    full
    isActionButtonDisabled={!canSubmit}
    actionButtonText="保存"
    onClose={() => {
      setActions([...section.formation.dancerActions]);
    }}
    onSubmit={() => {onSubmit(actions)}}>
    <div className="h-full max-h-full grid gap-2 grid-rows-[1fr,auto]">
      <div className="max-h-full space-y-4 overflow-auto">
        <IconLabelButton
          icon="add"
          full
          onClick={addAction}
          primary
          disabled={actions.length >= 5}
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
                    onRenameAction={(name) => {
                      const newActions = [...actions];
                      newActions[i].name = name;
                      setActions(newActions);
                    }}
                    onDeleteAction={() => {
                      const newActions = [...actions.slice(0, i), ...actions.slice(i + 1)];
                      setActions(newActions);
                    }}
                    onAddTiming={() => {addTiming(i)}}
                    onRenameTiming={(newTimings) => setNewTimings(i, newTimings)}
                    onDeleteTiming={(newTimings) => setNewTimings(i, newTimings)}/>
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
  onRenameAction: (name: string) => void,
  onDeleteAction: () => void,
  onAddTiming: () => void,
  onRenameTiming: (newTimings: DancerActionTiming[]) => void,
  onDeleteTiming: (newTimings: DancerActionTiming[]) => void,
}

function SortableActionSection ({
  action, actionNames, 
  onRenameAction, onDeleteAction, onAddTiming, onRenameTiming, onDeleteTiming
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

  useEffect(() => {
    if (action.timings.length === 0) return;
    
    const names = action.timings.map(x => x.name.trim());
    const nameSet = new Set(names);
    setTimingNames(Array.from(nameSet).reduce((acc, item) => {
      acc[item] = action.timings.filter(x => strEquals(x.name.trim(), item)).length;
      return acc;}
    , {} as Record<string, number>));
  }, [action]);

  return <div className="relative flex flex-row items-start gap-2 p-4 bg-white border border-gray-400 rounded-md" style={style} ref={setNodeRef}>
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
              onRenameTiming={(name) => {
                const newTimings = [...action.timings];
                newTimings[i].name = name;
                onRenameTiming(newTimings);
              }}
              onDeleteTiming={() => {onDeleteTiming([...action.timings.slice(0, i), ...action.timings.slice(i + 1)])}}
              showDeleteButton={action.timings.length > 1}
              />
          )
        }
        {
          action.timings.length < 16 &&
          <IconButton onClick={onAddTiming} src="add" size="sm"/>
        }
      </div>
    </div>
    <div className="absolute top-2 right-2">
      <IconButton size="sm" colour="primary" noBorder src="delete" onClick={() => onDeleteAction()}/>
    </div>
  </div>
}

type TimingItemProps = {
  timing: DancerActionTiming,
  timingNames: Record<string, number>,
  onRenameTiming: (name: string) => void,
  onDeleteTiming: () => void,
  showDeleteButton: boolean,
}

function TimingItem ({
  timing, timingNames, onRenameTiming, onDeleteTiming, showDeleteButton}: TimingItemProps
) {
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
    {showDeleteButton && <IconButton colour="primary" size="sm" noBorder src="delete" onClick={() => {onDeleteTiming()}}/>}
  </div>
}