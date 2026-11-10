import { useMemo, useRef, useState } from "react";
import classNames from "classnames";
import { RosterList } from "../../models/roster";
import { StageType } from "../../models/choreo";
import { getParadeWindow, StartingLayout } from "../../lib/helpers/startingLayoutHelper";
import { sortRosterNames, toNameKey, formatPropSize } from "../../lib/helpers/rosterHelper";
import { SEARCH_NAME_LENGTH } from "../../lib/consts/consts";
import GridPreview from "../grid/GridPreview";
import NumberInput from "../inputs/NumberInput";
import TextInput from "../inputs/TextInput";
import { ChipFilter } from "../inputs/Chips";
import Icon from "../basic/Icon";
import { IconLabelButton } from "../basic/Button";

export const MAX_STARTING_DANCERS = 150;
export const MAX_STARTING_PER_PROP = 100;

export type RosterLoadState = "off" | "loading" | "failed" | "loaded";

type Stage = { stageWidth: number, stageLength: number, xMargin: number, yMargin: number, stageType: StageType };

type StartingCastStepProps = {
  stage: Stage,
  layout: StartingLayout,
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

// Step 3 of 新規作成: a preview of the starting layout, then (with a 名簿) dancers and props to pick.
export default function StartingCastStep({
  stage, layout, rosterState, dancerList, propList, onRetry,
  pickedIds, onPickedIdsChange, unnamedCount, onUnnamedCountChange, propCounts, onPropCountsChange,
}: StartingCastStepProps) {
  const [tab, setTab] = useState<"dancer" | "prop">("dancer");
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const lastScrollTop = useRef(0);
  const hasRoster = rosterState === "loaded" && dancerList !== undefined && propList !== undefined;

  const dancerCount = Object.keys(layout.dancers).length;
  const propCount = Object.keys(layout.props).length;
  const isParade = stage.stageType === "parade";
  const visibleLength = isParade ? getParadeWindow(layout.depth, stage.stageLength) : undefined;

  // Scrolling the list down folds the preview away; reaching the top again, or tapping the bar, brings it back.
  const onListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    if (top <= 0) {
      setIsPreviewCollapsed(false);
    } else if (top > lastScrollTop.current + 4) {
      setIsPreviewCollapsed(true);
    }
    lastScrollTop.current = top;
  };

  const namesById = useMemo(() => new Map(dancerList?.names.map(n => [n.id, n.name]) ?? []), [dancerList]);
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

  return <div className="flex flex-col h-full min-h-0 gap-2">
    {
      isPreviewCollapsed
        ? <button
          type="button"
          onClick={() => setIsPreviewCollapsed(false)}
          className="flex items-center justify-between w-full px-3 py-1.5 text-sm border rounded-md bg-surface border-line">
          <b>プレビュー</b>
          <span className="text-muted">{stage.stageWidth} × {stage.stageLength}m</span>
          <Icon src="expandMore" size="sm" colour="primary"/>
        </button>
        : <div>
          <GridPreview
            stageWidth={stage.stageWidth}
            stageLength={stage.stageLength}
            stageType={stage.stageType}
            xMargin={stage.xMargin}
            yMargin={stage.yMargin}
            layout={layout}
            visibleLength={visibleLength}
            className="w-full h-[25svh] overflow-hidden"
            label={`舞台プレビュー：ダンサー${dancerCount}名${propCount > 0 ? `・道具${propCount}件` : ""}`}/>
          <div className="flex justify-end text-xs text-muted">
            {isParade && visibleLength! < stage.stageLength ? `先頭から${visibleLength}mを表示（${stage.stageWidth} × ${stage.stageLength}m）` : `${stage.stageWidth} × ${stage.stageLength}m`}
          </div>
        </div>
    }

    {
      hasRoster && pickedIds.length > 0 &&
      // The placement order. × takes a dancer out.
      <div className="flex gap-1 pb-1 overflow-x-auto shrink-0">
        {
          pickedIds.map((id, i) =>
            <button
              key={id}
              type="button"
              aria-label={`${namesById.get(id)}を外す`}
              onClick={() => onPickedIdsChange(pickedIds.filter(p => p !== id))}
              className="flex items-center gap-1 px-2 text-sm border rounded-full shrink-0 border-line bg-surface whitespace-nowrap">
              <span className="text-xs text-muted">{i + 1}</span>{namesById.get(id)}<Icon src="clear" size="xs" colour="grey"/>
            </button>)
        }
      </div>
    }

    {
      !hasRoster && <div className="pt-2 space-y-2">
        {unnamedField}
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
    }

    {
      hasRoster && <>
        <div role="tablist" aria-label="追加するもの" className="flex overflow-hidden border rounded-md shrink-0 border-primary">
          {
            ([["dancer", "ダンサー"], ["prop", "道具"]] as const).map(([kind, label]) =>
              <button
                key={kind}
                type="button"
                role="tab"
                aria-selected={tab === kind}
                onClick={() => setTab(kind)}
                className={classNames("flex-1 py-1 text-sm font-semibold", {
                  "bg-primary text-white": tab === kind,
                  "bg-surface text-primary": tab !== kind,
                })}>
                {label}
              </button>)
          }
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto" onScroll={onListScroll}>
          {
            tab === "dancer"
              ? <DancerList
                list={dancerList!}
                pickedIds={pickedIds}
                isFull={isFull}
                unnamedField={unnamedField}
                onChange={onPickedIdsChange}/>
              : <PropList list={propList!} counts={propCounts} onChange={onPropCountsChange}/>
          }
        </div>
      </>
    }
  </div>;
}

function useFilteredNames(list: RosterList, filter: string, search: string) {
  return useMemo(() => {
    const searchKey = toNameKey(search);
    return sortRosterNames(list.names.filter(n =>
      (filter === "all" || (filter === "none" ? n.categoryIds.length === 0 : n.categoryIds.includes(filter))) &&
      (searchKey === "" || n.name.includes(search.trim()) || toNameKey(n.name).includes(searchKey))
    ));
  }, [list, filter, search]);
}

function NameFilters({ list, allLabel, placeholder, filter, onFilterChange, onSearchChange }: {
  list: RosterList, allLabel: string, placeholder: string,
  filter: string, onFilterChange: (value: string) => void, onSearchChange: (value: string) => void,
}) {
  const uncategorised = list.names.filter(n => n.categoryIds.length === 0).length;
  return <div className="pt-1 space-y-1">
    <TextInput placeholder={placeholder} onContentChange={onSearchChange} search clearable maxLength={SEARCH_NAME_LENGTH}/>
    {
      list.categories.length > 0 &&
      <ChipFilter
        label="表示する区分"
        value={filter}
        onChange={onFilterChange}
        options={[
          { value: "all", label: allLabel, count: list.names.length },
          ...list.categories.map(c => ({ value: c.id, label: c.name, count: list.names.filter(n => n.categoryIds.includes(c.id)).length })),
          ...(uncategorised > 0 ? [{ value: "none", label: "未分類", count: uncategorised }] : []),
        ]}/>
    }
  </div>;
}

function DancerList({ list, pickedIds, isFull, unnamedField, onChange }: {
  list: RosterList, pickedIds: string[], isFull: boolean, unnamedField: React.ReactNode, onChange: (ids: string[]) => void,
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const names = useFilteredNames(list, filter, search);
  const picked = new Set(pickedIds);
  const unpickedShown = names.filter(n => !picked.has(n.id));

  return <div className="space-y-1">
    <div className="pt-1">{unnamedField}</div>
    {
      list.names.length === 0
        ? <p className="py-6 text-center text-muted">名簿にダンサーがいません</p>
        : <>
          <NameFilters list={list} allLabel="全員" placeholder="名前を探す" filter={filter} onFilterChange={setFilter} onSearchChange={setSearch}/>
          {isFull && <p className="text-sm font-semibold text-primary">{MAX_STARTING_DANCERS}名までです</p>}
          {
            unpickedShown.length > 0 && !isFull &&
            <button
              type="button"
              onClick={() => onChange([...pickedIds, ...unpickedShown.slice(0, MAX_STARTING_DANCERS - pickedIds.length).map(n => n.id)])}
              className="flex items-center w-full gap-2 px-1 py-2 text-sm text-left border-b border-line text-muted">
              <Icon src="checklist" size="xs" colour="grey"/>表示中の残り{unpickedShown.length}名をすべて選択
            </button>
          }
          <ul>
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
                    <span aria-hidden className={classNames("flex items-center justify-center rounded shrink-0 size-5 border-2", {
                      "border-line-strong": !isPicked,
                      "border-primary bg-primary": isPicked,
                    })}>
                      {isPicked && <Icon src="check" size="2xs" colour="white"/>}
                    </span>
                    <span className="font-semibold break-all">{n.name}</span>
                  </button>
                </li>;
              })
            }
          </ul>
          {names.length === 0 && <p className="py-6 text-center text-muted">該当する名前はありません</p>}
        </>
    }
  </div>;
}

function PropList({ list, counts, onChange }: { list: RosterList, counts: [string, number][], onChange: (counts: [string, number][]) => void }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const names = useFilteredNames(list, filter, search);
  const countById = new Map(counts);

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
    return <p className="py-6 text-center text-muted">名簿に道具がありません</p>;
  }
  return <div className="space-y-1">
    <NameFilters list={list} allLabel="すべて" placeholder="道具名を探す" filter={filter} onFilterChange={setFilter} onSearchChange={setSearch}/>
    <ul>
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
    </ul>
    {names.length === 0 && <p className="py-6 text-center text-muted">該当する道具はありません</p>}
  </div>;
}
