import classNames from "classnames";
import { RosterTab } from "../../models/roster";

const TABS: { tab: RosterTab, label: string }[] = [
  { tab: "dancer", label: "ダンサー" },
  { tab: "prop", label: "道具" },
  { tab: "song", label: "曲" },
];

export default function RosterTabs({ tab, onChange }: { tab: RosterTab, onChange: (tab: RosterTab) => void }) {
  return <div role="tablist" aria-label="名簿の種類" className="flex self-end overflow-hidden border rounded-md shrink-0 border-primary">
    {
      TABS.map(t =>
        <button
          key={t.tab}
          type="button"
          role="tab"
          aria-selected={tab === t.tab}
          onClick={() => onChange(t.tab)}
          className={classNames("px-3 py-0.5 text-sm font-semibold", {
            "bg-primary-fill text-white": tab === t.tab,
            "bg-surface text-primary": tab !== t.tab,
          })}>
          {t.label}
        </button>
      )
    }
  </div>;
}
