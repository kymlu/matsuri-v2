import { ReactNode, useEffect, useMemo, useState } from "react";
import { Dialog, Menu } from "@base-ui/react";
import { Grid } from "react-loader-spinner";
import { DndContext } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Team } from "../models/team";
import { RosterTab } from "../models/roster";
import { RosterSong, RosterSongs } from "../models/song";
import {
  addSong, addSongSections, getSongs, removeSong, removeSongSection, renameSong, renameSongSection,
  reorderSongActions, reorderSongSections,
} from "../lib/helpers/apiHelper";
import { formatCounts, sortSongs } from "../lib/helpers/songHelper";
import { toNameKey } from "../lib/helpers/rosterHelper";
import { colorPalette } from "../lib/consts/colors";
import { MAX_ACTIONS, SHORT_NAME_LENGTH } from "../lib/consts/consts";
import IconButton from "../components/basic/IconButton";
import Icon from "../components/basic/Icon";
import { IconLabelButton } from "../components/basic/Button";
import CustomMenu from "../components/inputs/CustomMenu";
import TextInput from "../components/inputs/TextInput";
import BaseEditDialog from "../components/dialogs/BaseEditDialog";
import RosterTabs from "../components/common/RosterTabs";
import SongAddBar from "../components/common/SongAddBar";
import SongActionDialog from "../components/dialogs/SongActionDialog";

type SongRosterPageProps = {
  goToHomePage: () => void,
  team: Team,
  onTabChange: (tab: RosterTab) => void,
}

const SAVE_FAILED = "保存できませんでした。もう一度お試しください。";

export default function SongRosterPage({ goToHomePage, team, onTabChange }: SongRosterPageProps) {
  const [songs, setSongs] = useState<RosterSong[]>();
  const [loadFailed, setLoadFailed] = useState(false);
  const [songId, setSongId] = useState<string>();
  const [sectionId, setSectionId] = useState<string>();
  const [error, setError] = useState<string>();

  const load = () => {
    setLoadFailed(false);
    getSongs(team.id)
      .then(setSongs)
      .catch((e) => {
        console.error((e as Error)?.message);
        setLoadFailed(true);
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id]);

  const song = songs?.find(s => s.id === songId);
  const section = song?.sections.find(s => s.id === sectionId);

  const update = (result: RosterSongs) => {
    setSongs(result.songs);
    setError(undefined);
  };
  const failed = () => setError(SAVE_FAILED);

  if (song && section) {
    return <SectionPage
      teamId={team.id}
      song={song}
      section={section}
      error={error}
      onBack={() => { setSectionId(undefined); setError(undefined); }}
      onSaved={update}
      onFailed={failed}
      onRemoved={(result) => { update(result); setSectionId(undefined); }}/>;
  }

  if (song) {
    return <SongPage
      teamId={team.id}
      song={song}
      error={error}
      onBack={() => { setSongId(undefined); setError(undefined); }}
      onOpenSection={setSectionId}
      onSaved={update}
      onFailed={failed}
      onRemoved={(result) => { update(result); setSongId(undefined); }}/>;
  }

  return <PageFrame
    header={
      <header className="flex items-center gap-2">
        <IconButton src="home" noBorder onClick={goToHomePage}/>
        <div className="flex-1 min-w-0 text-start">
          <div className="text-sm text-primary"><b>{team.name}</b>{" "}<span>の</span></div>
          <h2 className="text-2xl font-bold text-nowrap">名簿</h2>
        </div>
        <RosterTabs tab="song" onChange={onTabChange}/>
      </header>
    }
    footer={songs &&
      <SongAddBar
        label="曲名を追加"
        noun="曲"
        where="名簿"
        existingNames={songs.map(s => s.name)}
        onAdd={([name]) => new Promise(resolve => addSong(team.id, name,
          (result) => {
            update(result);
            resolve(1);
          },
          () => resolve(undefined)))}/>
    }>
    {!songs && !loadFailed && <Grid height={44} width={44} wrapperClass="mt-4 justify-center" color={colorPalette.primary} ariaLabel="読み込み中"/>}
    {
      loadFailed &&
      <div className="flex flex-col items-center gap-3 py-10 text-center text-muted">
        <p>曲を読み込めませんでした</p>
        <IconLabelButton icon="refresh" label="もう一度" onClick={load}/>
      </div>
    }
    {
      songs && songs.length === 0 &&
      <div className="flex flex-col items-center gap-2 py-10 text-center text-muted">
        <Icon src="musicNote" size="lg" colour="grey"/>
        <p>まだ曲がありません。<br/>下から曲名を追加してください。</p>
      </div>
    }
    {
      songs && songs.length > 0 &&
      <ul>
        {
          sortSongs(songs).map(s =>
            <li key={s.id}>
              <button type="button" onClick={() => setSongId(s.id)} className="flex items-center w-full gap-2 py-2.5 border-b text-start border-subtle">
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold break-all">{s.name}</span>
                  <span className="block text-sm truncate text-muted">{s.sections.length > 0 ? s.sections.map(x => x.name).join("・") : "セクションなし"}</span>
                </span>
                <Icon src="chevronForward" size="xs" colour="grey"/>
              </button>
            </li>
          )
        }
      </ul>
    }
  </PageFrame>;
}

type SongPageProps = {
  teamId: string,
  song: RosterSong,
  error?: string,
  onBack: () => void,
  onOpenSection: (id: string) => void,
  onSaved: (result: RosterSongs) => void,
  onFailed: () => void,
  onRemoved: (result: RosterSongs) => void,
}

function SongPage({ teamId, song, error, onBack, onOpenSection, onSaved, onFailed, onRemoved }: SongPageProps) {
  const [dialog, setDialog] = useState<"rename" | "remove">();
  const [sections, setSections] = useState(song.sections);
  useEffect(() => setSections(song.sections), [song.sections]);

  return <PageFrame
    header={
      <SubPageHeader
        parent="曲"
        title={song.name}
        onBack={onBack}
        onRename={() => setDialog("rename")}
        onRemove={() => setDialog("remove")}/>
    }
    footer={
      <SongAddBar
        label="セクションを追加（1行に1つ）"
        noun="セクション"
        where="曲"
        existingNames={song.sections.map(s => s.name)}
        multiline
        onAdd={(names) => new Promise(resolve => addSongSections(teamId, song.id, names,
          (result) => {
            onSaved(result);
            resolve(result.added);
          },
          () => resolve(undefined)))}/>
    }>
    {error && <p aria-live="polite" className="py-2 text-sm font-semibold text-primary">{error}</p>}
    {
      sections.length === 0
        ? <div className="flex flex-col items-center gap-2 py-10 text-center text-muted">
            <Icon src="lists" size="lg" colour="grey"/>
            <p>まだセクションがありません。<br/>曲の順に、下からセクション名を追加してください。<br/>複数行を貼り付けると、まとめて追加できます。</p>
          </div>
        : <SortableRows
            ids={sections.map(s => s.id)}
            onReorder={(ids) => {
              setSections(ids.map(id => sections.find(s => s.id === id)!));
              reorderSongSections(teamId, song.id, ids, onSaved, () => { setSections(song.sections); onFailed(); });
            }}
            renderRow={(id, i) => {
              const s = sections.find(x => x.id === id)!;
              return <button type="button" onClick={() => onOpenSection(s.id)} className="flex items-center flex-1 min-w-0 gap-2 py-2.5 text-start">
                <span className="w-4 text-xs text-end text-muted">{i + 1}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold break-all">{s.name}</span>
                  <span className="block text-sm truncate text-muted">
                    {s.actions.length > 0 ? s.actions.map(a => `${a.name} ${formatCounts(a.counts)}`).join(" ／ ") : "振りなし"}
                  </span>
                </span>
                <Icon src="chevronForward" size="xs" colour="grey"/>
              </button>;
            }}/>
    }
    <NameDialog
      open={dialog === "rename"}
      title="曲名"
      takenMessage="同じ名前の曲がすでにあります"
      name={song.name}
      onClose={() => setDialog(undefined)}
      onSave={(name, done) => renameSong(teamId, song.id, name, (r) => { onSaved(r); done(); }, done)}/>
    <RemoveDialog
      open={dialog === "remove"}
      title={`「${song.name}」を削除しますか？`}
      note="この曲を選んでいる隊列表の曲は「なし」になります。"
      onClose={() => setDialog(undefined)}
      onRemove={(done) => removeSong(teamId, song.id, (r) => { done(); onRemoved(r); }, done)}/>
  </PageFrame>;
}

type SectionPageProps = {
  teamId: string,
  song: RosterSong,
  section: RosterSong["sections"][number],
  error?: string,
  onBack: () => void,
  onSaved: (result: RosterSongs) => void,
  onFailed: () => void,
  onRemoved: (result: RosterSongs) => void,
}

function SectionPage({ teamId, song, section, error, onBack, onSaved, onFailed, onRemoved }: SectionPageProps) {
  const [dialog, setDialog] = useState<"rename" | "remove">();
  // undefined: closed. "new": adding. Otherwise the 振り being edited.
  const [editingId, setEditingId] = useState<string>();
  const [actions, setActions] = useState(section.actions);
  useEffect(() => setActions(section.actions), [section.actions]);

  const editing = section.actions.find(a => a.id === editingId);
  const otherNames = useMemo(() => section.actions.filter(a => a.id !== editingId).map(a => a.name), [section.actions, editingId]);

  return <PageFrame
    header={
      <SubPageHeader
        parent={song.name}
        title={section.name}
        onBack={onBack}
        onRename={() => setDialog("rename")}
        onRemove={() => setDialog("remove")}/>
    }>
    <div className="pt-1 pb-2">
      <IconLabelButton icon="add" full primary label="振り追加" disabled={section.actions.length >= MAX_ACTIONS} onClick={() => setEditingId("new")}/>
      {section.actions.length >= MAX_ACTIONS && <p className="pt-1 text-sm text-center text-muted">振りは{MAX_ACTIONS}つまでです</p>}
    </div>
    {error && <p aria-live="polite" className="py-2 text-sm font-semibold text-primary">{error}</p>}
    {
      actions.length === 0
        ? <p className="py-10 text-center text-muted">振りがありません</p>
        : <SortableRows
            ids={actions.map(a => a.id)}
            onReorder={(ids) => {
              setActions(ids.map(id => actions.find(a => a.id === id)!));
              reorderSongActions(teamId, section.id, ids, onSaved, () => { setActions(section.actions); onFailed(); });
            }}
            renderRow={(id) => {
              const a = actions.find(x => x.id === id)!;
              return <button type="button" onClick={() => setEditingId(a.id)} className="flex items-center flex-1 min-w-0 gap-2 py-2.5 text-start">
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold break-all">{a.name}</span>
                  <span className="block text-sm text-muted">{a.counts.join("・")}</span>
                </span>
                <Icon src="chevronForward" size="xs" colour="grey"/>
              </button>;
            }}/>
    }
    <Dialog.Root open={editingId !== undefined} onOpenChange={(open) => { if (!open) setEditingId(undefined); }}>
      {
        editingId !== undefined &&
        <SongActionDialog
          key={editingId}
          teamId={teamId}
          sectionId={section.id}
          action={editing}
          otherNames={otherNames}
          onSaved={(result) => {
            onSaved(result);
            setEditingId(undefined);
          }}/>
      }
    </Dialog.Root>
    <NameDialog
      open={dialog === "rename"}
      title="セクション名"
      takenMessage="同じ名前のセクションがすでにあります"
      name={section.name}
      onClose={() => setDialog(undefined)}
      onSave={(name, done) => renameSongSection(teamId, section.id, name, (r) => { onSaved(r); done(); }, done)}/>
    <RemoveDialog
      open={dialog === "remove"}
      title={`「${section.name}」を削除しますか？`}
      note={section.actions.length > 0 ? "このセクションの振りも削除されます。" : undefined}
      onClose={() => setDialog(undefined)}
      onRemove={(done) => removeSongSection(teamId, section.id, (r) => { done(); onRemoved(r); }, done)}/>
  </PageFrame>;
}

function PageFrame({ header, footer, children }: { header: ReactNode, footer?: ReactNode, children: ReactNode }) {
  return <div className="bg-app h-[100svh]">
    <div className="w-full max-w-full h-full grid grid-cols-[minmax(0,1fr)] grid-rows-[auto,minmax(0,1fr),auto] overflow-hidden">
      <div className="px-4 pt-4 pb-2">{header}</div>
      <div className="min-h-0 px-4 overflow-y-auto">{children}</div>
      <div>{footer}</div>
    </div>
  </div>;
}

function SubPageHeader({ parent, title, onBack, onRename, onRemove }: { parent: string, title: string, onBack: () => void, onRename: () => void, onRemove: () => void }) {
  return <header className="flex items-center gap-2">
    <IconButton src="chevronBackward" noBorder onClick={onBack}/>
    <div className="flex-1 min-w-0 text-start">
      <div className="text-sm font-bold truncate text-primary">{parent}</div>
      <h2 className="text-2xl font-bold break-all">{title}</h2>
    </div>
    <CustomMenu trigger={<IconButton asDiv src="moreVert" colour="grey" noBorder/>}>
      <div className="space-y-2">
        <Menu.Item>
          <IconLabelButton full noBorder icon="edit" label="名前変更" alignment="left" onClick={onRename}/>
        </Menu.Item>
        <Menu.Item>
          <IconLabelButton full noBorder icon="delete" label="削除" alignment="left" primaryText onClick={onRemove}/>
        </Menu.Item>
      </div>
    </CustomMenu>
  </header>;
}

function SortableRows({ ids, onReorder, renderRow }: { ids: string[], onReorder: (ids: string[]) => void, renderRow: (id: string, index: number) => ReactNode }) {
  return <DndContext
    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    onDragEnd={({ active, over }) => {
      if (over && active.id !== over.id) {
        onReorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
      }
    }}>
    <SortableContext items={ids}>
      <ul>
        {ids.map((id, i) => <SortableRow key={id} id={id}>{renderRow(id, i)}</SortableRow>)}
      </ul>
    </SortableContext>
  </DndContext>;
}

function SortableRow({ id, children }: { id: string, children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="flex items-center gap-1 border-b bg-app border-subtle">
    <div {...attributes} {...listeners} aria-label="並べ替え" className="cursor-grab touch-none">
      <Icon src="dragHandle" size="sm" colour="grey"/>
    </div>
    {children}
  </li>;
}

function NameDialog({ open, title, takenMessage, name, onClose, onSave }: {
  open: boolean, title: string, takenMessage: string, name: string, onClose: () => void,
  onSave: (name: string, done: (status?: number) => void) => void,
}) {
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (open) {
      setValue(name);
      setError(undefined);
    }
  }, [open, name]);

  return <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
    {
      open &&
      <BaseEditDialog
        title={title}
        isActionButtonDisabled={toNameKey(value) === "" || isSaving}
        onSubmit={() => {
          setIsSaving(true);
          onSave(value.trim(), (status) => {
            setIsSaving(false);
            if (status === undefined) onClose();
            else setError(status === 409 ? takenMessage : SAVE_FAILED);
          });
        }}>
        <div className="space-y-2">
          <TextInput defaultValue={name} maxLength={SHORT_NAME_LENGTH} showLength required onContentChange={(v) => { setValue(v); setError(undefined); }}/>
          {error && <p aria-live="polite" className="text-sm font-semibold text-primary">{error}</p>}
        </div>
      </BaseEditDialog>
    }
  </Dialog.Root>;
}

function RemoveDialog({ open, title, note, onClose, onRemove }: {
  open: boolean, title: string, note?: string, onClose: () => void,
  onRemove: (done: (status?: number) => void) => void,
}) {
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  return <Dialog.Root open={open} onOpenChange={(o) => { if (!o) { setError(undefined); onClose(); } }}>
    {
      open &&
      <BaseEditDialog
        title={title}
        actionButtonText="削除"
        isActionButtonDisabled={isSaving}
        onSubmit={() => {
          setIsSaving(true);
          onRemove((status) => {
            setIsSaving(false);
            if (status === undefined) onClose();
            else setError(SAVE_FAILED);
          });
        }}>
        <div className="space-y-2">
          {note && <p className="text-muted">{note}</p>}
          {error && <p aria-live="polite" className="font-bold text-center text-primary">{error}</p>}
        </div>
      </BaseEditDialog>
    }
  </Dialog.Root>;
}
