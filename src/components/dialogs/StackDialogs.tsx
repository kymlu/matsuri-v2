import { useState } from "react";
import classNames from "classnames";
import BaseEditDialog from "./BaseEditDialog";
import SelectBox from "../basic/SelectBox";
import Icon from "../basic/Icon";
import { StackSpot } from "../../lib/helpers/stackHelper";

export type StackMember = { id: string, label: string, color?: string };

const Dot = ({ color }: { color?: string }) =>
  color ? <span aria-hidden className="border rounded-full size-4 shrink-0 border-line" style={{ backgroundColor: color }}/> : null;

const ArrowButton = ({ src, label, disabled, onClick }: { src: "arrowUpward" | "arrowDownward", label: string, disabled: boolean, onClick: () => void }) =>
  <button type="button" aria-label={label} disabled={disabled} onClick={onClick}
    className="flex items-center justify-center rounded-full size-9 shrink-0 disabled:opacity-30">
    <Icon src={src} size="sm"/>
  </button>;

const tierLabel = (i: number, count: number) => i === 0 ? "上" : i === count - 1 ? "下" : "中";

// The order of a stack, top first, changed with ↑/↓. Used for 重ねる順 and 並べ替え.
function OrderList({ members, setMembers }: { members: StackMember[], setMembers: (m: StackMember[]) => void }) {
  const move = (i: number, by: number) => {
    const next = [...members];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    setMembers(next);
  };
  return <ol className="p-px space-y-1" aria-label="上から順">
    {
      members.map((m, i) =>
        <li key={m.id} className="flex items-center gap-2 px-3 border rounded-md min-h-11 border-line">
          <Dot color={m.color}/>
          <span className="font-semibold break-all">{m.label}</span>
          <span className="ml-auto text-sm text-muted shrink-0">{tierLabel(i, members.length)}</span>
          <ArrowButton src="arrowUpward" label={`${m.label}を上へ`} disabled={i === 0} onClick={() => move(i, -1)}/>
          <ArrowButton src="arrowDownward" label={`${m.label}を下へ`} disabled={i === members.length - 1} onClick={() => move(i, 1)}/>
        </li>
      )
    }
  </ol>;
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
    <p className="mb-2 text-sm text-muted">上から順。矢印で並べ替えます。</p>
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
    <p className="mb-2 text-sm text-muted">上から順。矢印で並べ替えます。</p>
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
    <p className="mb-2 text-sm text-muted">上から順。外した人はその場に残ります。</p>
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
