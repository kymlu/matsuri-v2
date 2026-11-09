import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@base-ui/react";
import { Oval } from "react-loader-spinner";
import { Team } from "../models/team";
import { Roster, RosterName } from "../models/roster";
import { getRoster } from "../lib/helpers/apiHelper";
import { sortRosterNames, toNameKey } from "../lib/helpers/rosterHelper";
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
}

// 名簿: the team's list of names and their categories, kept by editors and admins.
export default function RosterPage({ goToHomePage, team }: RosterPageProps) {
  const [roster, setRoster] = useState<Roster>();
  const [loadFailed, setLoadFailed] = useState(false);
  const [filter, setFilter] = useState("all"); // a category id, "all" or "none" (未分類)
  const [search, setSearch] = useState("");
  const [editingName, setEditingName] = useState<RosterName>();
  const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState(false);

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

  // A filter on a category that was just deleted falls back to everyone.
  useEffect(() => {
    if (roster && filter !== "all" && filter !== "none" && !roster.categories.some(c => c.id === filter)) {
      setFilter("all");
    }
  }, [roster, filter]);

  const filterOptions = useMemo(() => {
    if (!roster) {
      return [];
    }
    const uncategorised = roster.names.filter(n => n.categoryIds.length === 0).length;
    return [
      { value: "all", label: "全員", count: roster.names.length },
      ...roster.categories.map(c => ({ value: c.id, label: c.name, count: roster.names.filter(n => n.categoryIds.includes(c.id)).length })),
      ...(uncategorised > 0 || filter === "none" ? [{ value: "none", label: "未分類", count: uncategorised }] : []),
    ];
  }, [roster, filter]);

  const visibleNames = useMemo(() => {
    if (!roster) {
      return [];
    }
    const searchKey = toNameKey(search);
    return sortRosterNames(roster.names.filter(n =>
      (filter === "all" || (filter === "none" ? n.categoryIds.length === 0 : n.categoryIds.includes(filter))) &&
      (searchKey === "" || n.name.includes(search.trim()) || toNameKey(n.name).includes(searchKey))
    ));
  }, [roster, filter, search]);

  const categoryName = (id: string) => roster?.categories.find(c => c.id === id)?.name ?? "";

  return <div className="bg-app h-[100svh]">
    <div className="w-full h-full grid grid-rows-[auto,1fr,auto] overflow-hidden">
      <div className="px-4 pt-10 space-y-2">
        <header className="flex items-center gap-2">
          <IconButton src="home" noBorder onClick={goToHomePage}/>
          <div className="flex-1 text-start">
            <div className="text-sm text-primary">
              <b>{team.name}</b><span>の</span>
            </div>
            <h2 className="text-2xl font-bold text-nowrap">名簿</h2>
          </div>
          <IconLabelButton
            icon="sell"
            label="区分"
            primaryText
            disabled={!roster}
            onClick={() => setIsCategoriesDialogOpen(true)}/>
        </header>
        {
          roster && roster.names.length > 0 && <>
            <TextInput
              defaultValue={search}
              placeholder="名前を探す"
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
          roster && roster.names.length === 0 &&
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted">
            <Icon src="patientList" size="lg" colour="grey"/>
            <p>まだ名前がありません。<br/>下から名前を追加してください。<br/>複数行を貼り付けると、まとめて追加できます。</p>
          </div>
        }
        {
          roster && roster.names.length > 0 && visibleNames.length === 0 &&
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

      {
        roster &&
        <RosterAddBar teamId={team.id} roster={roster} filter={filter} onRosterChange={setRoster}/>
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
            rosterName={editingName}
            roster={roster}
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
            roster={roster}
            onSaved={(newRoster) => {
              setRoster(newRoster);
              setIsCategoriesDialogOpen(false);
            }}/>
        }
      </Dialog.Root>
    }
  </div>;
}
