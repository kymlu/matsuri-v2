import { useState } from "react";
import { Dialog } from "@base-ui/react";
import CustomDialog from "../basic/CustomDialog";
import classNames from "classnames";
import BaseEditDialog from "./BaseEditDialog";
import SelectBox from "../basic/SelectBox";
import Icon from "../basic/Icon";
import { DndContext } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { StackSpot } from "../../lib/helpers/stackHelper";

export type StackMember = { id: string, label: string, color?: string };

const Dot = ({ color }: { color?: string }) =>
  color ? <span aria-hidden className="border rounded-full size-4 shrink-0 border-line" style={{ backgroundColor: color }}/> : null;

const tierLabel = (i: number, count: number) => i === 0 ? "上" : i === count - 1 ? "下" : "中";

// The order of a stack, top first, changed by dragging the handle (same as the app's other sortable lists).
function OrderList({ members, setMembers }: { members: StackMember[], setMembers: (m: StackMember[]) => void }) {
  return <DndContext
    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    onDragEnd={({ active, over }) => {
      if (over && active.id !== over.id) {
        const oldIndex = members.findIndex(m => m.id === active.id);
        const newIndex = members.findIndex(m => m.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) setMembers(arrayMove(members, oldIndex, newIndex));
      }
    }}>
    <SortableContext items={members.map(m => m.id)}>
      <ol className="p-px space-y-1" aria-label="上から順">
        {members.map((m, i) => <SortableMember key={m.id} member={m} tier={tierLabel(i, members.length)}/>)}
      </ol>
    </SortableContext>
  </DndContext>;
}

function SortableMember({ member, tier }: { member: StackMember, tier: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: member.id });
  return <li
    ref={setNodeRef}
    style={{ transform: CSS.Transform.toString(transform), transition }}
    className="flex items-center gap-2 px-3 border rounded-md min-h-11 border-line bg-surface">
    {/* touch-none so dragging the handle on a phone doesn't scroll the dialog instead */}
    <div {...attributes} {...listeners} aria-label={`${member.label}を並べ替え`} className="flex items-center justify-center self-stretch cursor-grab touch-none">
      <Icon src="dragHandle" size="sm" colour="grey"/>
    </div>
    <Dot color={member.color}/>
    <span className="font-semibold break-all">{member.label}</span>
    <span className="ml-auto text-sm text-muted shrink-0">{tier}</span>
  </li>;
}

// 重ねる順: confirm the order (and where) before stacking. Always shown, from the button or after a drop.
export function StackOrderDialog({ initial, onSubmit, onBack }: {
  initial: StackMember[],
  onSubmit: (topFirst: string[], spot: StackSpot) => void,
  onBack?: () => void,
}) {
  const [members, setMembers] = useState(initial);
  const [spot, setSpot] = useState<StackSpot>("bottom");
  return <BaseEditDialog
    title="重ねる順"
    actionButtonText="重ねる"
    noDetachedTrigger
    fullWidth
    backButton={onBack ? { label: "戻る", onClick: onBack } : undefined}
    onSubmit={() => onSubmit(members.map(m => m.id), spot)}>
    <p className="mb-2 text-sm text-muted">上から順。ドラッグで並べ替えます。</p>
    <OrderList members={members} setMembers={setMembers}/>
    <p className="mt-3 mb-1 text-sm font-semibold text-muted">位置</p>
    <div className="flex gap-2" role="radiogroup" aria-label="位置">
      {
        ([["bottom", "一番下の人の位置"], ["middle", "真ん中"]] as [StackSpot, string][]).map(([value, label]) =>
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={spot === value}
            onClick={() => setSpot(value)}
            className={classNames("flex-1 px-2 text-sm border rounded-md min-h-9",
              spot === value ? "border-primary bg-primary/5 text-primary font-bold" : "border-line")}>
            {label}
          </button>
        )
      }
    </div>
  </BaseEditDialog>;
}

// 並べ替え: new order for an existing stack. Nobody moves.
export function ReorderStackDialog({ initial, onSubmit }: { initial: StackMember[], onSubmit: (topFirst: string[]) => void }) {
  const [members, setMembers] = useState(initial);
  return <BaseEditDialog title="並べ替え" noDetachedTrigger fullWidth onSubmit={() => onSubmit(members.map(m => m.id))}>
    <p className="mb-2 text-sm text-muted">上から順。ドラッグで並べ替えます。</p>
    <OrderList members={members} setMembers={setMembers}/>
  </BaseEditDialog>;
}

// 外す人を選ぶ: for stacks of three or more. Taken-out members stay where they are.
export function UnstackDialog({ members, onSubmit }: { members: StackMember[], onSubmit: (ids: string[]) => void }) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id); else next.add(id);
    setPicked(next);
  };
  // Who ends up on whom, said in a line, for the cases that aren't obvious.
  const remaining = members.filter(m => !picked.has(m.id));
  const note = picked.size === 0 ? undefined
    : remaining.length < 2 ? "重なりがなくなります。"
    : `${remaining.map(m => m.label).join("・")}の重なりになります。`;
  return <BaseEditDialog title="外す人を選ぶ" actionButtonText="外す" noDetachedTrigger fullWidth
    isActionButtonDisabled={picked.size === 0}
    onSubmit={() => onSubmit([...picked])}>
    <div className="flex items-center justify-between gap-2 mb-2">
      <p className="text-sm text-muted">上から順。外した人はその場に残ります。</p>
      <button
        type="button"
        className="px-2 text-sm font-semibold rounded-md text-primary min-h-8 shrink-0"
        onClick={() => setPicked(picked.size === members.length ? new Set() : new Set(members.map(m => m.id)))}>
        {picked.size === members.length ? "すべて解除" : "すべて選択"}
      </button>
    </div>
    <ul className="p-px space-y-1">
      {
        members.map((m, i) => {
          const on = picked.has(m.id);
          return <li key={m.id}>
            <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(m.id)}
              className={classNames("flex items-center w-full gap-2 px-3 text-left border rounded-md min-h-11",
                on ? "border-primary bg-primary/5" : "border-line")}>
              <SelectBox state={on ? "all" : "none"}/>
              <Dot color={m.color}/>
              <span className={classNames("break-all", on ? "text-primary font-bold" : "font-semibold")}>{m.label}</span>
              <span className="ml-auto text-sm text-muted shrink-0">{tierLabel(i, members.length)}</span>
            </button>
          </li>;
        })
      }
    </ul>
    {note && <p className="px-3 py-2 mt-3 text-sm rounded-md bg-subtle text-muted">{note}</p>}
  </BaseEditDialog>;
}

// 重ねますか？: after dropping one thing almost exactly onto another. 次へ always goes on to 重ねる順.
export function StackPromptDialog({ text, onNext, onKeep }: { text: string, onNext: () => void, onKeep: () => void }) {
  return <BaseEditDialog title="重ねますか？" actionButtonText="次へ" fullWidth
    backButton={{ label: "そのまま", onClick: onKeep }}
    onSubmit={onNext}>
    <p>{text}</p>
    <p className="mt-2 text-sm text-muted">次に順番を確認します。</p>
  </BaseEditDialog>;
}

// View mode: tapping a stack lists who is there, top first. Picking one selects them.
export function StackListDialog({ members, onPick, kind = "dancers" }: { members: StackMember[], onPick?: (id: string) => void, kind?: "dancers" | "props" }) {
  // Dancers can be picked to see their details; a prop stack is only shown, as props can't be selected in view mode.
  const rowClass = "flex items-center w-full gap-2 px-3 text-left border rounded-md min-h-11 border-line";
  const row = (m: StackMember, i: number) => <>
    <Dot color={m.color}/>
    <span className="font-semibold break-all">{m.label}</span>
    <span className="ml-auto text-sm text-muted shrink-0">{tierLabel(i, members.length)}</span>
  </>;
  return <CustomDialog title={kind === "dancers" ? "重なっている人" : "重なっている道具"} hasX fullWidth focusDialogOnOpen>
    <ul className="p-px space-y-1">
      {
        members.map((m, i) =>
          <li key={m.id}>
            {
              onPick ?
              <Dialog.Close onClick={() => onPick(m.id)} className={`${rowClass} hover:bg-line/40`}>{row(m, i)}</Dialog.Close> :
              <div className={rowClass}>{row(m, i)}</div>
            }
          </li>
        )
      }
    </ul>
  </CustomDialog>;
}
