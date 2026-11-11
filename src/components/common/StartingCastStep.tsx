import { useMemo, useState } from "react";
import classNames from "classnames";
import { RosterList } from "../../models/roster";
import { sortRosterNames, toNameKey, formatPropSize } from "../../lib/helpers/rosterHelper";
import { SEARCH_NAME_LENGTH } from "../../lib/consts/consts";
import NumberInput from "../inputs/NumberInput";
import TextInput from "../inputs/TextInput";
import { ChipFilter } from "../inputs/Chips";
import Icon from "../basic/Icon";
import { IconLabelButton } from "../basic/Button";
import { useHelp } from "../help/HelpContext";

export const MAX_STARTING_DANCERS = 150;
export const MAX_STARTING_PER_PROP = 100;

export type RosterLoadState = "off" | "loading" | "failed" | "loaded";

type StartingCastStepProps = {
  dancerCount: number, // picked + unnamed, for the 150 limit
  rosterState: RosterLoadState,
  dancerList?: RosterList,
  propList?: RosterList,
  onRetry: () => void,
  pickedIds: string[], // 名簿 dancer ids, in pick order
  onPickedIdsChange: (ids: string[]) => void,
  unnamedCount: number,
  onUnnamedCountChange: (count: number) => void,
  propCounts: [string, number][], // 名簿 prop id and count, in first-pick order
  onPropCountsChange: (counts: [string, number][]) => void,
}

// Step 3 of 新規作成: the dancer count, or (with a 名簿) dancers and props to pick.
export default function StartingCastStep({
  dancerCount, rosterState, dancerList, propList, onRetry,
  pickedIds, onPickedIdsChange, unnamedCount, onUnnamedCountChange, propCounts, onPropCountsChange,
}: StartingCastStepProps) {
  const [tab, setTab] = useState<"dancer" | "prop">("dancer");
  const hasRoster = rosterState === "loaded" && dancerList !== undefined && propList !== undefined;

  const isFull = dancerCount >= MAX_STARTING_DANCERS;

  const unnamedField = <div className="flex items-center justify-between gap-2">
    <span className="font-semibold">{hasRoster ? "名前なしのダンサー" : "ダンサー数"}</span>
    <div className="w-36">
      <NumberInput
        compact
        defaultValue={unnamedCount}
        min={hasRoster ? 0 : 1}
        max={MAX_STARTING_DANCERS - pickedIds.length}
        baseStep={1}
        buttonStep={1}
        onChange={(value) => onUnnamedCountChange(value ?? 0)}/>
    </div>
  </div>;

  // Without a 名簿 (not logged in, a viewer, or it couldn't load): just the dancer count, as before.
  if (!hasRoster) {
    return <div className="flex flex-col h-full gap-2 pt-2">
      <div className="w-full space-y-2">
        {unnamedField}
        <p className="text-sm text-muted">舞台に自動で配置されます。位置は編集モードで変更できます。</p>
        {
          rosterState === "loading" &&
          <p className="text-sm text-muted">名簿を読み込んでいます…</p>
        }
        {
          rosterState === "failed" &&
          <div className="flex items-center justify-between gap-2 text-sm text-muted">
            名簿を読み込めませんでした
            <IconLabelButton icon="refresh" label="もう一度" onClick={onRetry}/>
          </div>
        }
      </div>
    </div>;
  }

  // With a 名簿: dancers and props on two tabs.
  return <div className="flex flex-col h-full min-h-0 gap-2">
    <div role="tablist" aria-label="ダンサー・道具" className="flex overflow-hidden border rounded-md shrink-0 border-primary">
      {
        ([["dancer", "ダンサー"], ["prop", "道具"]] as const).map(([kind, label]) =>
          <button
            key={kind}
            type="button"
            role="tab"
            aria-selected={tab === kind}
            onClick={() => setTab(kind)}
            className={classNames("flex-1 py-1 text-sm font-semibold", {
              "bg-primary-fill text-white": tab === kind,
              "bg-surface text-primary": tab !== kind,
            })}>
            {label}
          </button>)
      }
    </div>
    {/* Only the list of names scrolls; search, filters and 名前なし stay put. */}
    <div className="flex flex-col flex-1 min-h-0">
      {
        tab === "dancer"
          ? <DancerList
            list={dancerList!}
            pickedIds={pickedIds}
            isFull={isFull}
            room={Math.max(0, MAX_STARTING_DANCERS - dancerCount)}
            unnamedField={unnamedField}
            onChange={onPickedIdsChange}/>
          : <PropList list={propList!} counts={propCounts} onChange={onPropCountsChange}/>
      }
    </div>
  </div>;
}

// "picked" shows only what's been picked.
function useFilteredNames(list: RosterList, filter: string, search: string, picked: Set<string>) {
  return useMemo(() => {
    const searchKey = toNameKey(search);
    return sortRosterNames(list.names.filter(n =>
      (filter === "all" ||
        (filter === "picked" ? picked.has(n.id) : filter === "none" ? n.categoryIds.length === 0 : n.categoryIds.includes(filter))) &&
      (searchKey === "" || n.name.includes(search.trim()) || toNameKey(n.name).includes(searchKey))
    ));
  }, [list, filter, search, picked]);
}

function NameFilters({ list, allLabel, placeholder, pickedCount, filter, onFilterChange, onSearchChange }: {
  list: RosterList, allLabel: string, placeholder: string, pickedCount: number,
  filter: string, onFilterChange: (value: string) => void, onSearchChange: (value: string) => void,
}) {
  const uncategorised = list.names.filter(n => n.categoryIds.length === 0).length;
  return <div className="pt-1 space-y-1">
    <TextInput placeholder={placeholder} onContentChange={onSearchChange} search clearable maxLength={SEARCH_NAME_LENGTH}/>
    {
      <ChipFilter
        label="表示する区分"
        value={filter}
        onChange={onFilterChange}
        options={[
          { value: "all", label: allLabel, count: list.names.length },
          { value: "picked", label: "選択中", count: pickedCount },
          ...list.categories.map(c => ({ value: c.id, label: c.name, count: list.names.filter(n => n.categoryIds.includes(c.id)).length })),
          ...(uncategorised > 0 ? [{ value: "none", label: "未分類", count: uncategorised }] : []),
        ]}/>
    }
  </div>;
}

function DancerList({ list, pickedIds, isFull, room, unnamedField, onChange }: {
  list: RosterList, pickedIds: string[], isFull: boolean, room: number, unnamedField: React.ReactNode, onChange: (ids: string[]) => void,
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const picked = useMemo(() => new Set(pickedIds), [pickedIds]);
  const names = useFilteredNames(list, filter, search, picked);
  const unpickedShown = names.filter(n => !picked.has(n.id));

  return <div className="flex flex-col flex-1 min-h-0 gap-1">
    {
      list.names.length === 0
        ? <div className="flex-1 py-6 space-y-1 text-center text-muted"><p>名簿にダンサーがいません</p><RosterHelpLink/></div>
        : <>
          <NameFilters list={list} allLabel="全員" placeholder="名前を探す" pickedCount={pickedIds.length} filter={filter} onFilterChange={setFilter} onSearchChange={setSearch}/>
          {isFull && <p className="text-sm font-semibold text-primary">{MAX_STARTING_DANCERS}名までです</p>}
          {
            // As on the 名簿 page: selects everything shown, or clears it when it's all selected.
            names.length > 0 && (() => {
              const state = unpickedShown.length === 0 ? "all" : unpickedShown.length === names.length ? "none" : "some";
              return <button
                type="button"
                role="checkbox"
                aria-checked={state === "all" ? true : state === "some" ? "mixed" : false}
                disabled={state !== "all" && room === 0}
                onClick={() => {
                  if (state === "all") {
                    const shown = new Set(names.map(n => n.id));
                    onChange(pickedIds.filter(id => !shown.has(id)));
                  } else {
                    onChange([...pickedIds, ...unpickedShown.slice(0, room).map(n => n.id)]);
                  }
                }}
                className="flex items-center w-full gap-2 px-1 py-2 text-sm text-left border-b border-line text-muted disabled:opacity-50">
                <SelectBox state={state}/>
                すべて選択（表示中の{names.length}名）
              </button>;
            })()
          }
          <ul className="flex-1 min-h-0 overflow-y-auto">
            {
              names.map(n => {
                const isPicked = picked.has(n.id);
                const isDisabled = !isPicked && isFull;
                return <li key={n.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isPicked}
                    disabled={isDisabled}
                    onClick={() => onChange(isPicked ? pickedIds.filter(id => id !== n.id) : [...pickedIds, n.id])}
                    className={classNames("flex items-center w-full gap-2 px-1 py-2.5 text-left border-b border-subtle", {
                      "bg-subtle": isPicked,
                      "opacity-50": isDisabled,
                    })}>
                    <SelectBox state={isPicked ? "all" : "none"}/>
                    <span className="font-semibold break-all">{n.name}</span>
                  </button>
                </li>;
              })
            }
            {names.length === 0 && <li className="py-6 text-center text-muted">{filter === "picked" ? "まだ選択していません" : "該当する名前はありません"}</li>}
          </ul>
        </>
    }
    <div className="pt-2 border-t border-line">{unnamedField}</div>
  </div>;
}

function PropList({ list, counts, onChange }: { list: RosterList, counts: [string, number][], onChange: (counts: [string, number][]) => void }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const countById = useMemo(() => new Map(counts), [counts]);
  const picked = useMemo(() => new Set(counts.map(([id]) => id)), [counts]);
  const names = useFilteredNames(list, filter, search, picked);

  const setCount = (id: string, count: number) => {
    if (count <= 0) {
      onChange(counts.filter(([c]) => c !== id));
    } else if (countById.has(id)) {
      onChange(counts.map(([c, n]) => c === id ? [c, count] : [c, n]));
    } else {
      onChange([...counts, [id, count]]);
    }
  };

  if (list.names.length === 0) {
    return <div className="py-6 space-y-1 text-center text-muted"><p>名簿に道具がありません</p><RosterHelpLink/></div>;
  }
  return <div className="flex flex-col flex-1 min-h-0 gap-1">
    <NameFilters list={list} allLabel="すべて" placeholder="道具名を探す" pickedCount={counts.length} filter={filter} onFilterChange={setFilter} onSearchChange={setSearch}/>
    <ul className="flex-1 min-h-0 overflow-y-auto">
      {
        names.map(n => {
          const count = countById.get(n.id);
          const details = <>
            <span aria-hidden className="inline-block border rounded-full shrink-0 size-3 border-line" style={{ backgroundColor: n.color }}/>
            <span className="font-semibold break-all">{n.name}</span>
            <span className="text-xs text-muted whitespace-nowrap">{formatPropSize(n)}</span>
          </>;
          return <li key={n.id} className={classNames("border-b border-subtle", { "bg-subtle": count !== undefined })}>
            {
              count === undefined
                // Before it's picked, the whole row adds one.
                ? <button type="button" onClick={() => setCount(n.id, 1)} className="flex items-center w-full gap-2 px-1 py-2.5 text-left">
                  {details}
                  <span className="flex items-center ml-auto text-sm font-semibold text-primary whitespace-nowrap"><Icon src="add" size="xs" colour="primary"/>追加</span>
                </button>
                // After, only the counter changes it.
                : <div className="flex items-center w-full gap-2 px-1 py-1">
                  {details}
                  <div className="ml-auto w-36">
                    <NumberInput
                      compact
                      defaultValue={count}
                      min={0}
                      max={MAX_STARTING_PER_PROP}
                      baseStep={1}
                      buttonStep={1}
                      onChange={(value) => setCount(n.id, value ?? 0)}/>
                  </div>
                </div>
            }
          </li>;
        })
      }
      {names.length === 0 && <li className="py-6 text-center text-muted">{filter === "picked" ? "まだ追加していません" : "該当する道具はありません"}</li>}
    </ul>
  </div>;
}

// The same checkbox as selection mode on the 名簿 page: empty, ticked, or a dash when only some are selected.
function SelectBox({ state }: { state: "none" | "some" | "all" }) {
  return <span aria-hidden className={classNames("flex items-center justify-center rounded shrink-0 size-5 border-2", {
    "border-line-strong": state === "none",
    "border-primary bg-primary": state === "all",
    "border-primary": state === "some",
  })}>
    {state === "all" && <Icon src="check" size="2xs" colour="white"/>}
    {state === "some" && <span className="w-2.5 h-0.5 bg-primary"/>}
  </span>;
}

// Opens help over the form, so nothing typed so far is lost.
function RosterHelpLink() {
  const openHelp = useHelp();
  return <button type="button" onClick={() => openHelp({ article: "roster-add" })} className="text-sm font-semibold text-primary">
    名簿の使い方を見る
  </button>;
}
