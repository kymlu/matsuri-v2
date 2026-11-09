import { useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import { isNullOrUndefinedOrBlank, strEquals } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import { SHORT_NAME_LENGTH } from "../../lib/consts/consts";
import { Roster } from "../../models/roster";
import { sortRosterNames, toNameKey } from "../../lib/helpers/rosterHelper";
import ExpandableSection from "../basic/ExpandableSection";
import { ChipFilter } from "../inputs/Chips";

type EditDancerNameDialogProps = {
  // This component stays mounted while the dialog is closed, so it resets each time it opens.
  isOpen?: boolean,
  name?: string,
  required?: boolean,
  otherNames?: string[],
  onSubmit: (name: string) => void,
  onClose?: () => void,
  // 名簿 suggestions; the picker is hidden when there's no roster or it's empty.
  // Its open state and filter are kept by the editor, so they last between renames.
  roster?: Roster,
  isPickerOpen?: boolean,
  onPickerOpenChange?: (isOpen: boolean) => void,
  pickerFilter?: string, // a category id or "all"
  onPickerFilterChange?: (filter: string) => void,
}

export default function EditDancerNameDialog({
  isOpen, name, required = true, otherNames, onSubmit, onClose,
  roster, isPickerOpen = true, onPickerOpenChange, pickerFilter = "all", onPickerFilterChange,
}: EditDancerNameDialogProps) {
  const [newName, setNewName] = useState("");
  // The input starts with the dancer's current name, so only text typed since then filters the picker.
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<{ changeValue: (value: string) => void }>(null);

  // Otherwise a name picked or typed before キャンセル would be saved on the next open.
  useEffect(() => {
    if (isOpen !== false) {
      setNewName(name ?? "");
      setIsTyping(false);
    }
  }, [isOpen, name]);

  const nameCounts = useMemo(() => {
    if (!otherNames || otherNames?.length === 0) {
      return {};
    };

    const nameSet = new Set(otherNames);
    return Array.from(nameSet).reduce((acc, item) => {
      acc[item] = otherNames.filter(x => strEquals(x, item)).length - (strEquals(item, name) ? 1 : 0);
      return acc;
    }, {} as Record<string, number>);
  }, [otherNames]);

  const hasDuplicate = useMemo(() => {
    return nameCounts && nameCounts[newName.trim()] !== null && nameCounts[newName.trim()] > 0;
  }, [nameCounts, newName]);

  const showPicker = roster !== undefined && roster.names.length > 0;
  // A filter on a category deleted since it was chosen shows everyone.
  const filter = roster?.categories.some(c => c.id === pickerFilter) ? pickerFilter : "all";

  // Names used by other dancers go last, but stay pickable for swaps.
  const pickerNames = useMemo(() => {
    if (!roster) {
      return [];
    }
    const typedKey = isTyping ? toNameKey(newName) : "";
    const isUsed = (n: string) => (nameCounts[n] ?? 0) > 0;
    const names = sortRosterNames(roster.names.filter(n =>
      (filter === "all" || n.categoryIds.includes(filter)) &&
      (typedKey === "" || toNameKey(n.name).includes(typedKey))));
    return [...names.filter(n => !isUsed(n.name)), ...names.filter(n => isUsed(n.name))]
      .map(n => ({ ...n, isUsed: isUsed(n.name) }));
  }, [roster, filter, isTyping, newName, nameCounts]);

  return <BaseEditDialog
    title={`ダンサー名`}
    fullWidth={showPicker}
    // On a phone, focusing the input would open the keyboard over the names you came to pick.
    initialFocus={showPicker && isPickerOpen ? (openType) => openType !== "touch" : undefined}
    onSubmit={() => { onSubmit(newName.trim()) }}
    onClose={() => onClose?.()}
    isActionButtonDisabled={required && isNullOrUndefinedOrBlank(newName.trim())}
    >
    <TextInput
      ref={inputRef}
      defaultValue={name ?? ""}
      onContentChange={ (newName) => {
        setNewName(newName);
        setIsTyping(true);
      }}
      maxLength={SHORT_NAME_LENGTH}
      showLength
    />

    {
      hasDuplicate && <div className="font-bold text-center text-wrap text-primary">
        この名前がすでに使用されています
      </div>
    }

    {
      showPicker &&
      <ExpandableSection
        title={<span className="text-base">名簿から選ぶ</span>}
        level={2}
        expanded={isPickerOpen}
        onExpandedChange={(isOpen) => onPickerOpenChange?.(isOpen)}>
        <div className="mt-1 space-y-2">
          {
            roster.categories.length > 0 &&
            <ChipFilter
              label="表示する区分"
              options={[{ value: "all", label: "全員" }, ...roster.categories.map(c => ({ value: c.id, label: c.name }))]}
              value={filter}
              onChange={(value) => onPickerFilterChange?.(value)}/>
          }
          <div className="grid grid-cols-3 gap-1.5 max-h-[40svh] overflow-y-auto pb-1">
            {
              pickerNames.map(n => {
                const isSelected = toNameKey(n.name) === toNameKey(newName);
                return <button
                  key={n.id}
                  type="button"
                  aria-pressed={isSelected}
                  // Only fills the input: nothing changes until 保存.
                  onClick={() => {
                    inputRef.current?.changeValue(n.name);
                    setNewName(n.name);
                    setIsTyping(false);
                  }}
                  className={classNames("px-1 py-1.5 text-sm rounded-md border break-all", {
                    "bg-primary border-primary text-white font-semibold": isSelected,
                    "border-dashed border-line text-faint": !isSelected && n.isUsed,
                    "bg-surface border-line text-body": !isSelected && !n.isUsed,
                  })}>
                  {n.name}
                  {n.isUsed && <span className="block text-[10px] leading-tight">使用中</span>}
                </button>
              })
            }
            {
              pickerNames.length === 0 &&
              <p className="col-span-3 py-2 text-sm text-center text-muted">名簿にない名前もそのまま保存できます</p>
            }
          </div>
        </div>
      </ExpandableSection>
    }
  </BaseEditDialog>
}
