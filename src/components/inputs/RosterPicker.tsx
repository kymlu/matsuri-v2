import { useMemo } from "react";
import classNames from "classnames";
import { RosterList, RosterName } from "../../models/roster";
import { formatPropSize, sortRosterNames, toNameKey } from "../../lib/helpers/rosterHelper";
import ExpandableSection from "../basic/ExpandableSection";
import { ChipFilter } from "./Chips";

type RosterPickerProps = {
  list: RosterList,
  value: string, // the name input's current text; the matching name shows as selected
  isTyping: boolean, // only text typed since the dialog opened filters the grid
  onPick: (name: RosterName) => void,
  // Dancers only: names other dancers use go last, marked 使用中. Props often share a name, so they don't.
  isUsed?: (name: string) => boolean,
  allLabel: string, // 全員 or すべて
  // Kept by the editor, so they last between renames.
  isOpen: boolean,
  onOpenChange?: (isOpen: boolean) => void,
  filter: string, // a category id or "all"
  onFilterChange?: (filter: string) => void,
}

// 名簿から選ぶ: a collapsible grid of names from one 名簿 list, with category filters.
// Tapping a name only reports it; the dialog decides what that fills in.
export default function RosterPicker({
  list, value, isTyping, onPick, isUsed, allLabel, isOpen, onOpenChange, filter: chosenFilter, onFilterChange,
}: RosterPickerProps) {
  // A filter on a category deleted since it was chosen shows everyone.
  const filter = list.categories.some(c => c.id === chosenFilter) ? chosenFilter : "all";

  const names = useMemo(() => {
    const typedKey = isTyping ? toNameKey(value) : "";
    const sorted = sortRosterNames(list.names.filter(n =>
      (filter === "all" || n.categoryIds.includes(filter)) &&
      (typedKey === "" || toNameKey(n.name).includes(typedKey))));
    const used = (n: RosterName) => isUsed?.(n.name) ?? false;
    return [...sorted.filter(n => !used(n)), ...sorted.filter(used)].map(n => ({ ...n, isUsed: used(n) }));
  }, [list, filter, isTyping, value, isUsed]);

  return <ExpandableSection
    title={<span className="text-base">名簿から選ぶ</span>}
    level={2}
    expanded={isOpen}
    onExpandedChange={(open) => onOpenChange?.(open)}>
    <div className="mt-1 space-y-2">
      {
        list.categories.length > 0 &&
        <ChipFilter
          label="表示する区分"
          options={[{ value: "all", label: allLabel }, ...list.categories.map(c => ({ value: c.id, label: c.name }))]}
          value={filter}
          onChange={(v) => onFilterChange?.(v)}/>
      }
      <div className="grid grid-cols-3 gap-1.5 max-h-[40svh] overflow-y-auto pb-1">
        {
          names.map(n => {
            const isSelected = toNameKey(n.name) === toNameKey(value);
            const size = formatPropSize(n);
            return <button
              key={n.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onPick(n)}
              className={classNames("px-1 py-1.5 text-sm rounded-md border break-all", {
                "bg-primary-fill border-primary-fill text-white font-semibold": isSelected,
                "border-dashed border-line text-faint": !isSelected && n.isUsed,
                "bg-surface border-line text-body": !isSelected && !n.isUsed,
              })}>
              <span>{n.name}</span>
              {n.isUsed && <span className="block text-[10px] leading-tight">使用中</span>}
              {
                // Prop defaults, so 扇 (red) and 扇 (blue) are easy to tell apart.
                (n.color || size) &&
                <span className="flex items-center justify-center gap-1 text-[10px] leading-tight">
                  {n.color && <span aria-hidden className="inline-block border rounded-full size-2.5 border-line" style={{ backgroundColor: n.color }}/>}
                  {size}
                </span>
              }
            </button>
          })
        }
        {
          names.length === 0 &&
          <p className="col-span-3 py-2 text-sm text-center text-muted">名簿にない名前もそのまま保存できます</p>
        }
      </div>
    </div>
  </ExpandableSection>
}
