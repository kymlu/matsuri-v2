import { useEffect, useMemo, useState } from "react";
import Button from "../basic/Button";
import { DancerAction, DancerActionTiming } from "../../models/dancerAction";
import { DndContext } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import TextInput from "../inputs/TextInput";
import { strEquals } from "../../lib/helpers/globalHelper";
import Icon from "../basic/Icon";
import { ICON } from "../../lib/consts/consts";
import IconButton from "../basic/IconButton";
import BaseEditDialog from "./BaseEditDialog";
import { ChoreoSection } from "../../models/choreoSection";

export function ActionManagerDialog(props: {
  section: ChoreoSection,
  onSubmit: (actions: DancerAction[]) => void,
}) {
  const [actions, setActions] = useState<DancerAction[]>([]);

  useEffect(() => {
    setActions([...props.section.formation.dancerActions]);
  }, [props.section]);

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

  const canSubmit = useMemo(() => {
    if (actions.length === 0) return true;
    
    const names = actions.map(x => x.name);
    const nameSet = new Set(names);
    if (names.length !== nameSet.size || nameSet.has("")) {
      return false;
    }

    for (const action of actions) {
      const timingNames = action.timings.map(x => x.name);
      const timingNameSet = new Set(timingNames);
      if (timingNames.length !== timingNameSet.size || timingNameSet.has("")) {
        return false;
      }
    }

    return true;
  }, [actions]);

  return <BaseEditDialog
    title={`カウント管理 - ${props.section.name}`}
    full
    isActionButtonDisabled={!canSubmit}
    actionButtonText="保存"
    onSubmit={() => {props.onSubmit(actions)}}>
    <div className="space-y-4">
      <button onClick={addAction} className="flex flex-row items-center justify-center p-4 bg-white border-2 rounded-md border-primary">
        <Icon src={ICON.add} size="sm"/>アクション追加
      </button>
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
                  onRenameAction={(name) => {
                    var newActions = [...actions];
                    newActions[i].name = name;
                    setActions(newActions);
                  }}
                  onDeleteAction={() => {
                    var newActions = [...actions.slice(0, i), ...actions.slice(i + 1)];
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
  </BaseEditDialog>
}

function SortableActionSection (props: {
  action: DancerAction,
  onRenameAction: (name: string) => void,
  onDeleteAction: () => void,
  onAddTiming: () => void,
  onRenameTiming: (newTimings: DancerActionTiming[]) => void,
  onDeleteTiming: (newTimings: DancerActionTiming[]) => void,
}) {
  const {action, onRenameAction, onDeleteAction, onAddTiming, onRenameTiming, onDeleteTiming} = props;
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

  return <div className="relative flex flex-row items-start gap-2 p-4 bg-white border-2 rounded-md border-primary" style={style} ref={setNodeRef}>
    <div {...attributes} {...listeners}>
      <Icon src={ICON.dragHandle}/>
    </div>
    <div className="flex-1">
      <TextInput label="アクション名" default={action.name} onContentChange={(newName) => {onRenameAction(newName)}}/>
      <span className="font-bold">カウント（重複不可）</span>
      <div className="flex flex-wrap gap-2">
        {
          action.timings.map((timing, i) => 
            <TimingItem
              key={timing.id}
              timing={timing}
              onRenameTiming={(name) => {
                var newTimings = [...action.timings];
                newTimings[i].name = name;
                onRenameTiming(newTimings);
              }}
              onDeleteTiming={() => {onDeleteTiming([...action.timings.slice(0, i), ...action.timings.slice(i + 1)])}}
              showDeleteButton={action.timings.length > 2}
              />
          )
        }
        <IconButton onClick={onAddTiming} src={ICON.add} size="sm"/>
      </div>
    </div>
    <div className="absolute top-2 right-2">
      <IconButton size="sm" noBorder src={ICON.delete} onClick={() => onDeleteAction()}/>
    </div>
  </div>
}

function TimingItem (props: {
  timing: DancerActionTiming,
  onRenameTiming: (name: string) => void,
  onDeleteTiming: () => void,
  showDeleteButton: boolean,
}) {
  const {timing, onRenameTiming, onDeleteTiming, showDeleteButton} = props;
  
  return <div className="flex items-center">
    <TextInput maxLength={5} compact short default={timing.name} onContentChange={(newName) => {onRenameTiming(newName)}}/>
    <Icon size="sm" src={ICON.person}/>
    <span>{timing.dancerIds.length}</span>
    {showDeleteButton && <IconButton size="sm" noBorder src={ICON.delete} onClick={() => {onDeleteTiming()}}/>}
  </div>
}