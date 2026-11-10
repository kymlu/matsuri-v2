import { useEffect, useMemo, useRef, useState } from "react";
import TextInput from "../inputs/TextInput";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";
import BaseEditDialog from "./BaseEditDialog";
import { LONG_NAME_LENGTH, SHORT_NAME_LENGTH } from "../../lib/consts/consts";
import { RosterList, RosterName } from "../../models/roster";
import { formatPropSize, getPropDefaultsChange, PropLook } from "../../lib/helpers/rosterHelper";
import RosterPicker from "../inputs/RosterPicker";

type EditNameDialogProps = {
  name?: string,
  required?: boolean,
  type: "道具" | "隊列表" | "イベント" | "セクション" | "障害物",
  onSubmit: (name: string, look?: Partial<PropLook>) => void,
  onClose?: () => void,
  // Props only. This component stays mounted while closed, so it resets each time it opens.
  isOpen?: boolean,
  // 名簿 prop names; the picker is hidden without them. Its open state and filter are kept by the editor.
  roster?: RosterList,
  isPickerOpen?: boolean,
  onPickerOpenChange?: (isOpen: boolean) => void,
  pickerFilter?: string,
  onPickerFilterChange?: (filter: string) => void,
  prop?: PropLook, // the prop's current size and colour, to tell whether a picked name would change them
}

export default function EditNameDialog({
  name, required = true, type, onSubmit, onClose,
  isOpen, roster, isPickerOpen = true, onPickerOpenChange, pickerFilter = "all", onPickerFilterChange, prop,
}: EditNameDialogProps) {
  const [newName, setNewName] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  // The name last picked from 名簿; typing clears it, so a typed name never changes size or colour.
  const [pickedName, setPickedName] = useState<RosterName>();
  const [isApplyingLook, setIsApplyingLook] = useState(true);
  const inputRef = useRef<{ changeValue: (value: string) => void }>(null);

  // Otherwise a name picked or typed before キャンセル would be saved on the next open.
  useEffect(() => {
    if (isOpen !== false) {
      setNewName(name ?? "");
      setIsTyping(false);
      setPickedName(undefined);
      setIsApplyingLook(true);
    }
  }, [isOpen, name]);

  const showPicker = type === "道具" && roster !== undefined && roster.names.length > 0;
  const lookChange = useMemo(() =>
    prop && pickedName ? getPropDefaultsChange(prop, pickedName) : undefined,
  [prop, pickedName]);

  return <BaseEditDialog
    title={`${type}名`}
    fullWidth={showPicker}
    // On a phone, focusing the input would open the keyboard over the names you came to pick.
    initialFocus={showPicker && isPickerOpen ? (openType) => openType !== "touch" : undefined}
    onSubmit={() => { onSubmit(newName.trim(), lookChange && isApplyingLook ? lookChange : undefined) }}
    onClose={() => onClose?.()}
    isActionButtonDisabled={required && isNullOrUndefinedOrBlank(newName.trim())}
    >
    <TextInput
      ref={inputRef}
      required={required}
      defaultValue={name ?? ""}
      onContentChange={ (newName) => {
        setNewName(newName);
        setIsTyping(true);
        setPickedName(undefined);
      }}
      maxLength={type === "イベント" || type === "隊列表" ? LONG_NAME_LENGTH : SHORT_NAME_LENGTH}
      showLength/>
    {
      lookChange && pickedName &&
      <label className="flex items-center gap-2 mb-2 text-sm">
        <input type="checkbox" checked={isApplyingLook} onChange={(e) => setIsApplyingLook(e.target.checked)} className="accent-primary"/>
        <span>
          「{pickedName.name}」の大きさと色にする
          <span className="inline-flex items-center gap-1 ml-1 text-muted">
            （
            {formatPropSize(lookChange)}
            {lookChange.color && <span aria-label="色" className="inline-block border rounded-full size-3 border-line" style={{ backgroundColor: lookChange.color }}/>}
            ）
          </span>
        </span>
      </label>
    }
    {
      showPicker &&
      <RosterPicker
        list={roster}
        value={newName}
        isTyping={isTyping}
        allLabel="すべて"
        // Fills the input, and offers the name's size and colour; nothing changes until 保存.
        onPick={(n) => {
          inputRef.current?.changeValue(n.name);
          setNewName(n.name);
          setIsTyping(false);
          setPickedName(n);
          setIsApplyingLook(true);
        }}
        isOpen={isPickerOpen}
        onOpenChange={onPickerOpenChange}
        filter={pickerFilter}
        onFilterChange={onPickerFilterChange}/>
    }
  </BaseEditDialog>
}
