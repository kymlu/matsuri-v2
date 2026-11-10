import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isNullOrUndefinedOrBlank, strEquals } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import { SHORT_NAME_LENGTH } from "../../lib/consts/consts";
import { RosterList } from "../../models/roster";
import RosterPicker from "../inputs/RosterPicker";

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
  roster?: RosterList,
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
  // Names used by other dancers go last, but stay pickable for swaps.
  const isUsed = useCallback((n: string) => (nameCounts[n] ?? 0) > 0, [nameCounts]);

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
      <RosterPicker
        list={roster}
        value={newName}
        isTyping={isTyping}
        isUsed={isUsed}
        allLabel="全員"
        // Only fills the input: nothing changes until 保存.
        onPick={(n) => {
          inputRef.current?.changeValue(n.name);
          setNewName(n.name);
          setIsTyping(false);
        }}
        isOpen={isPickerOpen}
        onOpenChange={onPickerOpenChange}
        filter={pickerFilter}
        onFilterChange={onPickerFilterChange}/>
    }
  </BaseEditDialog>
}
