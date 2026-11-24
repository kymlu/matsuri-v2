import CustomSelect from "../inputs/CustomSelect";
import { RosterSong, RosterSongSection } from "../../models/song";
import { formatCounts, sortSongs } from "../../lib/helpers/songHelper";

const NONE = "なし";

export function SongSelect({ songs, songId, onChange }: { songs: RosterSong[], songId?: string, onChange: (songId: string | undefined) => void }) {
  // Song id → name; song names are unique, so the select can show names.
  const items: Record<string, string> = { "": NONE };
  sortSongs(songs).forEach(s => { items[s.id] = s.name; });
  return <CustomSelect
    label="曲"
    items={items}
    defaultValue={songId && items[songId] ? items[songId] : NONE}
    setSelectValue={(value) => onChange(value || undefined)}/>;
}

export function SongActionsCheckbox({ section, checked, onChange }: { section: RosterSongSection, checked: boolean, onChange: (checked: boolean) => void }) {
  return <label className="flex items-start gap-2 mt-3 text-sm">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 accent-primary"/>
    <span className="min-w-0">
      「{section.name}」の振りとカウントも追加
      {
        section.actions.map(a =>
          <span key={a.id} className="block break-all text-muted">{a.name}　{formatCounts(a.counts)}</span>
        )
      }
    </span>
  </label>;
}
