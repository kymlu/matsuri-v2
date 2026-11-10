import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@base-ui/react";
import { Oval } from "react-loader-spinner";
import classNames from "classnames";
import { Team } from "../models/team";
import { Roster, RosterKind, RosterName, rosterListOf } from "../models/roster";
import { getRoster } from "../lib/helpers/apiHelper";
import { formatPropSize, sortRosterNames, toNameKey } from "../lib/helpers/rosterHelper";
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
import { SEARCH_NAME_LENGTH } from "../lib/consts/consts";

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
  const [roster, setRoster] = useState<Roster>();
  const [loadFailed, setLoadFailed] = useState(false);
  const [filter, setFilter] = useState("all"); // a category id, "all" or "none" (未分類)
  const [search, setSearch] = useState("");
  const [editingName, setEditingName] = useState<RosterName>();
  const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState(false);

  const list = roster && rosterListOf(roster, tab);

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
              {/* In the header rather than a row of their own, to leave the list room on a phone. */}
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
            </div>
          </div>
          <IconLabelButton
            icon="sell"
            label="区分"
            primaryText
            disabled={!roster}
            onClick={() => setIsCategoriesDialogOpen(true)}/>
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
            <ChipFilter label="表示する区分" options={filterOptions} value={filter} onChange={setFilter}/>
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
          </div>
        }
        {
          list && list.names.length > 0 && visibleNames.length === 0 &&
          <p className="py-10 text-center text-muted">該当する名前はありません</p>
        }
        <ul>
          {
            visibleNames.map(n =>
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => setEditingName(n)}
                  className="flex items-center w-full gap-2 px-1 py-2.5 text-left border-b border-subtle">
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
                  <Icon src="chevronForward" size="xs" colour="grey"/>
                </button>
              </li>
            )
          }
        </ul>
      </div>

      {/* One bar per tab, so a half-typed list on one tab survives a look at the other. */}
      {
        roster && TABS.map(t =>
          <div key={t.kind} hidden={tab !== t.kind}>
            <RosterAddBar
              teamId={team.id}
              kind={t.kind}
              isVisible={tab === t.kind}
              list={rosterListOf(roster, t.kind)}
              filter={tab === t.kind ? filter : "all"}
              onRosterChange={setRoster}/>
          </div>
        )
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
  </div>;
}
