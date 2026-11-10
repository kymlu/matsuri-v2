import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@base-ui/react";
import { Oval } from "react-loader-spinner";
import classNames from "classnames";
import { Team } from "../models/team";
import { Roster, RosterDefaultsItem, RosterDefaultsResult, RosterKind, RosterLinksResult, RosterName, rosterListOf } from "../models/roster";
import { getRoster, removeRosterNames, restoreRosterNames, updateRosterDefaults } from "../lib/helpers/apiHelper";
import { BulkLookField, countHidden, formatPropSize, getDefaultsSummary, getLinksSummary, getRemovedSummary, getSelectAllState, hasAnyDefaults, rosterCounter, sortRosterNames, toNameKey } from "../lib/helpers/rosterHelper";
import { colorPalette } from "../lib/consts/colors";
import IconButton from "../components/basic/IconButton";
import { IconLabelButton } from "../components/basic/Button";
import Icon from "../components/basic/Icon";
import { Tag } from "../components/common/Tag";
import TextInput from "../components/inputs/TextInput";
import { ChipFilter } from "../components/inputs/Chips";
import RosterAddBar from "../components/common/RosterAddBar";
import EditRosterNameDialog from "../components/dialogs/EditRosterNameDialog";
import RosterCategoriesDialog from "../components/dialogs/RosterCategoriesDialog";
import RosterSelectionBar from "../components/common/RosterSelectionBar";
import BulkCategoryDialog from "../components/dialogs/BulkCategoryDialog";
import BulkPropLookDialog from "../components/dialogs/BulkPropLookDialog";
import ConfirmDeletionDialog from "../components/dialogs/ConfirmDeletionDialog";
import BaseEditDialog from "../components/dialogs/BaseEditDialog";
import { SEARCH_NAME_LENGTH } from "../lib/consts/consts";
import { useHelp } from "../components/help/HelpContext";

type RosterPageProps = {
  goToHomePage: () => void,
  team: Team,
  // Kept by App, so the last tab is remembered for the session.
  tab: RosterKind,
  onTabChange: (tab: RosterKind) => void,
}

const TABS: { kind: RosterKind, label: string }[] = [
  { kind: "dancer", label: "ダンサー" },
  { kind: "prop", label: "道具" },
];

// 名簿: the team's lists of dancer and prop names and their categories, kept by editors and admins.
export default function RosterPage({ goToHomePage, team, tab, onTabChange }: RosterPageProps) {
  const openHelp = useHelp();
  const [roster, setRoster] = useState<Roster>();
  const [loadFailed, setLoadFailed] = useState(false);
  const [filter, setFilter] = useState("all"); // a category id, "all" or "none" (未分類)
  const [search, setSearch] = useState("");
  const [editingName, setEditingName] = useState<RosterName>();
  const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState(false);
  // Selection mode, for adding or removing categories on many names, or deleting them, at once.
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState<"add" | "remove">();
  const [lookField, setLookField] = useState<BulkLookField>();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  // The result of the last selection action. Only a delete can be undone.
  const [lastAction, setLastAction] = useState<{ message: string, isError?: boolean, undo?: () => void }>();
  // The roster the last selection action got back, to tell its changes from any other.
  const ownRoster = useRef<Roster | undefined>(undefined);

  const list = roster && rosterListOf(roster, tab);
  const counter = rosterCounter(tab);

  const loadRoster = () => {
    setLoadFailed(false);
    getRoster(team.id)
      .then(setRoster)
      .catch((e) => {
        console.error((e as Error)?.message);
        setLoadFailed(true);
      });
  };

  useEffect(() => {
    loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id]);

  // Search and filter belong to one tab's list, so they start over on the other tab.
  const changeTab = (kind: RosterKind) => {
    setFilter("all");
    setSearch("");
    onTabChange(kind);
  };

  // Names that disappear (deleted here or by someone else) drop out of the selection.
  useEffect(() => {
    if (list) {
      setSelectedIds(prev => {
        const ids = new Set(list.names.map(n => n.id));
        return [...prev].every(id => ids.has(id)) ? prev : new Set([...prev].filter(id => ids.has(id)));
      });
    }
  }, [list]);

  // Undo only reverses the last delete, so any other change to the roster ends it.
  useEffect(() => {
    if (roster !== ownRoster.current) {
      setLastAction(undefined);
    }
  }, [roster]);

  // Changes that came from a selection action, which keep the result line (and a delete's undo).
  const setOwnRoster = (newRoster: Roster) => {
    ownRoster.current = newRoster;
    setRoster(newRoster);
  };

  const failed = () => {
    setLastAction({ message: "保存できませんでした。もう一度お試しください", isError: true });
    setIsBusy(false);
  };

  const startSelecting = () => {
    setIsSelecting(true);
    setSelectedIds(new Set());
    setLastAction(undefined);
  };

  const stopSelecting = () => {
    setIsSelecting(false);
    setSelectedIds(new Set());
    setLastAction(undefined);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const onLinksApplied = (result: RosterLinksResult) => {
    setBulkMode(undefined);
    setOwnRoster(result.roster);
    setLastAction({ message: list ? getLinksSummary(result.added, result.removed, list, tab) : "" });
  };

  // Size, colour or clearing both. No undo: setting goes through a dialog and clearing is confirmed first.
  const onDefaultsApplied = (result: RosterDefaultsResult, change: BulkLookField | "clear") => {
    setLookField(undefined);
    setOwnRoster(result.roster);
    setLastAction({ message: getDefaultsSummary(result.changed.length, change) });
    setIsBusy(false);
  };

  const clearLook = () => {
    setIsConfirmingClear(false);
    setIsBusy(true);
    const items: RosterDefaultsItem[] = [...selectedIds].map(id => ({ id, length: null, width: null, color: null }));
    updateRosterDefaults(team.id, items, (result) => onDefaultsApplied(result, "clear"), failed);
  };

  const deleteSelected = () => {
    setIsConfirmingDelete(false);
    setIsBusy(true);
    removeRosterNames(team.id, [...selectedIds], (result) => {
      setOwnRoster(result.roster);
      setSelectedIds(new Set());
      setLastAction({
        message: getRemovedSummary(result.removed.length, tab),
        undo: result.removed.length > 0 ? () => {
          setIsBusy(true);
          restoreRosterNames(team.id, result.removed, (restored) => {
            setOwnRoster(restored.roster);
            setLastAction({
              message: restored.skipped.length > 0
                ? `${restored.skipped.length}${counter}は同じ名前がすでにあるため戻せませんでした`
                : "元に戻しました",
            });
            setIsBusy(false);
          }, failed);
        } : undefined,
      });
      setIsBusy(false);
    }, failed);
  };

  // A filter on a category that was just deleted falls back to everyone.
  useEffect(() => {
    if (list && filter !== "all" && filter !== "none" && !list.categories.some(c => c.id === filter)) {
      setFilter("all");
    }
  }, [list, filter]);

  const filterOptions = useMemo(() => {
    if (!list) {
      return [];
    }
    const uncategorised = list.names.filter(n => n.categoryIds.length === 0).length;
    return [
      { value: "all", label: tab === "dancer" ? "全員" : "すべて", count: list.names.length },
      ...list.categories.map(c => ({ value: c.id, label: c.name, count: list.names.filter(n => n.categoryIds.includes(c.id)).length })),
      ...(uncategorised > 0 || filter === "none" ? [{ value: "none", label: "未分類", count: uncategorised }] : []),
    ];
  }, [list, filter, tab]);

  const visibleNames = useMemo(() => {
    if (!list) {
      return [];
    }
    const searchKey = toNameKey(search);
    return sortRosterNames(list.names.filter(n =>
      (filter === "all" || (filter === "none" ? n.categoryIds.length === 0 : n.categoryIds.includes(filter))) &&
      (searchKey === "" || n.name.includes(search.trim()) || toNameKey(n.name).includes(searchKey))
    ));
  }, [list, filter, search]);

  const categoryName = (id: string) => list?.categories.find(c => c.id === id)?.name ?? "";

  return <div className="bg-app h-[100svh]">
    <div className="w-full max-w-full h-full grid grid-cols-[minmax(0,1fr)] grid-rows-[auto,minmax(0,1fr),auto] overflow-hidden">
      <div className="px-4 pt-10 space-y-2">
        <header className="flex items-center gap-2">
          <IconButton src="home" noBorder onClick={goToHomePage}/>
          <div className="flex-1 min-w-0 text-start">
            <div className="text-sm text-primary">
              <b>{team.name}</b><span>の</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-2xl font-bold text-nowrap">名簿</h2>
              {/* In the header rather than a row of their own, to leave the list room on a phone.
                  Hidden while selecting, so a selection never mixes dancers and props. */}
              {
                !isSelecting &&
                <div role="tablist" aria-label="名簿の種類" className="flex overflow-hidden border rounded-md border-primary">
                {
                  TABS.map(t =>
                    <button
                      key={t.kind}
                      type="button"
                      role="tab"
                      aria-selected={tab === t.kind}
                      onClick={() => changeTab(t.kind)}
                      className={classNames("px-3 py-0.5 text-sm font-semibold", {
                        "bg-primary text-white": tab === t.kind,
                        "bg-surface text-primary": tab !== t.kind,
                      })}>
                      {t.label}
                    </button>
                  )
                }
                </div>
              }
            </div>
          </div>
          {
            isSelecting
              ? <IconLabelButton icon="check" label="完了" primary onClick={stopSelecting}/>
              : <IconLabelButton
                  icon="sell"
                  label="区分"
                  primaryText
                  disabled={!roster}
                  onClick={() => setIsCategoriesDialogOpen(true)}/>
          }
        </header>
        {
          list && list.names.length > 0 && <>
            <TextInput
              key={tab}
              defaultValue={search}
              placeholder={tab === "dancer" ? "名前を探す" : "道具名を探す"}
              onContentChange={setSearch}
              search
              clearable
              maxLength={SEARCH_NAME_LENGTH}/>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <ChipFilter label="表示する区分" options={filterOptions} value={filter} onChange={setFilter}/>
              </div>
              {
                // At the end of the filter row, since it acts on the list; keeps the header as it was.
                !isSelecting &&
                <button type="button" onClick={startSelecting} className="flex items-center gap-0.5 pb-1 text-sm font-semibold text-primary whitespace-nowrap">
                  <Icon src="checklist" size="xs" colour="primary"/>選択
                </button>
              }
            </div>
          </>
        }
      </div>

      <div className="min-h-0 px-4 overflow-y-auto">
        {
          !roster && !loadFailed &&
          <Oval wrapperClass="mt-4 justify-center" color={colorPalette.primary} secondaryColor={colorPalette.rainbow.red[2]}/>
        }
        {
          loadFailed &&
          <div className="flex flex-col items-center gap-3 py-10 text-center text-muted">
            <p>名簿を読み込めませんでした</p>
            <IconLabelButton icon="refresh" label="もう一度" onClick={loadRoster}/>
          </div>
        }
        {
          list && list.names.length === 0 &&
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted">
            <Icon src={tab === "dancer" ? "patientList" : "flag"} size="lg" colour="grey"/>
            <p>
              {tab === "dancer" ? "まだ名前がありません。" : "まだ道具がありません。"}<br/>
              下から名前を追加してください。<br/>
              複数行を貼り付けると、まとめて追加できます。
            </p>
            <button type="button" onClick={() => openHelp({ article: "roster-add" })} className="text-sm font-semibold text-primary">
              使い方を見る
            </button>
          </div>
        }
        {
          list && list.names.length > 0 && visibleNames.length === 0 &&
          <p className="py-10 text-center text-muted">該当する名前はありません</p>
        }
        {
          isSelecting && visibleNames.length > 0 && (() => {
            const state = getSelectAllState(visibleNames.map(n => n.id), selectedIds);
            return <button
              type="button"
              role="checkbox"
              aria-checked={state === "all" ? true : state === "some" ? "mixed" : false}
              onClick={() => setSelectedIds(prev => {
                const next = new Set(prev);
                visibleNames.forEach(n => state === "all" ? next.delete(n.id) : next.add(n.id));
                return next;
              })}
              className="flex items-center w-full gap-2 px-1 py-2 text-sm text-left border-b border-line text-muted">
              <SelectBox state={state}/>
              すべて選択（表示中の{visibleNames.length}{counter}）
            </button>;
          })()
        }
        <ul>
          {
            visibleNames.map(n =>
              <li key={n.id}>
                <button
                  type="button"
                  role={isSelecting ? "checkbox" : undefined}
                  aria-checked={isSelecting ? selectedIds.has(n.id) : undefined}
                  onClick={() => isSelecting ? toggleSelected(n.id) : setEditingName(n)}
                  className={classNames("flex items-center w-full gap-2 px-1 py-2.5 text-left border-b border-subtle", {
                    "bg-subtle": isSelecting && selectedIds.has(n.id),
                  })}>
                  {isSelecting && <SelectBox state={selectedIds.has(n.id) ? "all" : "none"}/>}
                  <span className="font-semibold break-all">{n.name}</span>
                  {
                    (n.color || n.length !== undefined || n.width !== undefined) &&
                    <span className="flex items-center gap-1 text-xs text-muted whitespace-nowrap">
                      {n.color && <span aria-hidden className="inline-block border rounded-full size-3 border-line" style={{ backgroundColor: n.color }}/>}
                      {formatPropSize(n)}
                    </span>
                  }
                  <span className="flex flex-wrap justify-end flex-1 gap-1">
                    {
                      n.categoryIds.length === 0
                        ? <Tag type="grey" compact dottedLine text="未分類"/>
                        : n.categoryIds.map(id =>
                          <Tag key={id} type={id === filter ? "primary" : "grey"} compact text={categoryName(id)}/>)
                    }
                  </span>
                  {!isSelecting && <Icon src="chevronForward" size="xs" colour="grey"/>}
                </button>
              </li>
            )
          }
        </ul>
      </div>

      {/* One bar per tab, so a half-typed list on one tab survives a look at the other. */}
      {
        roster && TABS.map(t =>
          <div key={t.kind} hidden={isSelecting || tab !== t.kind}>
            <RosterAddBar
              teamId={team.id}
              kind={t.kind}
              isVisible={!isSelecting && tab === t.kind}
              list={rosterListOf(roster, t.kind)}
              // Filtering to pick names in selection mode shouldn't pre-select categories for adding.
              filter={!isSelecting && tab === t.kind ? filter : "all"}
              onRosterChange={setRoster}/>
          </div>
        )
      }
      {
        isSelecting && list &&
        <RosterSelectionBar
          kind={tab}
          selectedCount={selectedIds.size}
          hiddenCount={countHidden(selectedIds, visibleNames.map(n => n.id))}
          hasCategories={list.categories.length > 0}
          canRemoveCategories={list.names.some(n => selectedIds.has(n.id) && n.categoryIds.length > 0)}
          canClearLook={hasAnyDefaults(list.names.filter(n => selectedIds.has(n.id)))}
          isBusy={isBusy}
          onAddCategories={() => setBulkMode("add")}
          onRemoveCategories={() => setBulkMode("remove")}
          onSetSize={() => setLookField("size")}
          onSetColor={() => setLookField("color")}
          onClearLook={() => setIsConfirmingClear(true)}
          onDelete={() => setIsConfirmingDelete(true)}
          lastAction={lastAction}/>
      }
    </div>

    {
      roster &&
      <Dialog.Root open={editingName !== undefined} onOpenChange={(open) => { if (!open) setEditingName(undefined); }}>
        {
          editingName &&
          <EditRosterNameDialog
            key={editingName.id}
            teamId={team.id}
            kind={tab}
            rosterName={editingName}
            list={rosterListOf(roster, tab)}
            onSaved={(newRoster) => {
              setRoster(newRoster);
              setEditingName(undefined);
            }}/>
        }
      </Dialog.Root>
    }
    {
      roster &&
      <Dialog.Root open={isCategoriesDialogOpen} onOpenChange={setIsCategoriesDialogOpen}>
        {
          isCategoriesDialogOpen &&
          <RosterCategoriesDialog
            teamId={team.id}
            kind={tab}
            list={rosterListOf(roster, tab)}
            onSaved={(newRoster) => {
              setRoster(newRoster);
              setIsCategoriesDialogOpen(false);
            }}/>
        }
      </Dialog.Root>
    }
    {
      roster && list &&
      <Dialog.Root open={bulkMode !== undefined} onOpenChange={(open) => { if (!open) setBulkMode(undefined); }}>
        {
          bulkMode &&
          <BulkCategoryDialog
            teamId={team.id}
            kind={tab}
            list={list}
            selectedIds={selectedIds}
            mode={bulkMode}
            onApplied={onLinksApplied}/>
        }
      </Dialog.Root>
    }
    {
      list && tab === "prop" &&
      <Dialog.Root open={lookField !== undefined} onOpenChange={(open) => { if (!open) setLookField(undefined); }}>
        {
          lookField &&
          <BulkPropLookDialog
            teamId={team.id}
            list={list}
            selectedIds={selectedIds}
            field={lookField}
            onApplied={(result) => onDefaultsApplied(result, lookField)}/>
        }
      </Dialog.Root>
    }
    {
      list && tab === "prop" &&
      <Dialog.Root open={isConfirmingClear} onOpenChange={setIsConfirmingClear}>
        {
          isConfirmingClear &&
          <BaseEditDialog
            title={`${selectedIds.size}件の大きさと色を消しますか？`}
            actionButtonText="消す"
            onSubmit={clearLook}>
            <p className="text-muted">元に戻せません。隊列表の道具は変わりません。</p>
          </BaseEditDialog>
        }
      </Dialog.Root>
    }
    {
      list &&
      <Dialog.Root open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        {
          isConfirmingDelete && (() => {
            const names = list.names.filter(n => selectedIds.has(n.id)).map(n => n.name);
            return <ConfirmDeletionDialog
              name={`${names.length}${counter}`}
              note={`${names.slice(0, 3).join("・")}${names.length > 3 ? `、他${names.length - 3}${counter}` : ""}。この名前を使っている隊列表は変わりません。`}
              verb="削除"
              onSubmit={deleteSelected}/>;
          })()
        }
      </Dialog.Root>
    }
  </div>;
}

// A checkbox for selection mode: empty, ticked, or a dash when only some are selected.
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
