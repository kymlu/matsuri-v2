import { useMemo, useState } from "react";
import { PropDefaults, Roster, RosterKind, RosterList, RosterName } from "../../models/roster";
import { removeRosterName, updateRosterName } from "../../lib/helpers/apiHelper";
import { toNameKey } from "../../lib/helpers/rosterHelper";
import { DEFAULT_PROP_LENGTH, DEFAULT_PROP_WIDTH, MAX_PROP_DIMENSION, MIN_PROP_DIMENSION, SHORT_NAME_LENGTH } from "../../lib/consts/consts";
import ColorSwatchGrid from "../inputs/ColorSwatchGrid";
import { colorPalette } from "../../lib/consts/colors";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import NumberInput from "../inputs/NumberInput";
import { ChipToggles } from "../inputs/Chips";
import { IconLabelButton } from "../basic/Button";

type EditRosterNameDialogProps = {
  teamId: string,
  kind: RosterKind,
  rosterName: RosterName,
  list: RosterList, // the list the name is in, for categories and the duplicate check
  onSaved: (roster: Roster) => void,
}

const NAME_TAKEN = "この名前はすでに名簿にあります";
const SAVE_FAILED = "保存できませんでした。もう一度お試しください";

export default function EditRosterNameDialog({ teamId, kind, rosterName, list, onSaved }: EditRosterNameDialogProps) {
  const [name, setName] = useState(rosterName.name);
  const [categoryIds, setCategoryIds] = useState(rosterName.categoryIds);
  // Prop defaults, each switched on with its own checkbox. Size is set or cleared as a pair.
  // Both start from a new prop's defaults when ticked.
  const [hasSize, setHasSize] = useState(rosterName.length !== undefined || rosterName.width !== undefined);
  const [length, setLength] = useState(rosterName.length ?? DEFAULT_PROP_LENGTH);
  const [width, setWidth] = useState(rosterName.width ?? DEFAULT_PROP_WIDTH);
  const [hasColor, setHasColor] = useState(rosterName.color !== undefined);
  const [color, setColor] = useState(rosterName.color ?? colorPalette.rainbow.blue[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isTaken = useMemo(() => {
    const key = toNameKey(name);
    return list.names.some(n => n.id !== rosterName.id && toNameKey(n.name) === key);
  }, [name, list, rosterName.id]);

  const save = () => {
    setIsSaving(true);
    const defaults: PropDefaults | undefined = kind === "prop"
      ? { length: hasSize ? length : null, width: hasSize ? width : null, color: hasColor ? color : null }
      : undefined;
    updateRosterName(teamId, rosterName.id, name.trim(), categoryIds, defaults,
      onSaved,
      (status) => {
        setError(status === 409 ? NAME_TAKEN : SAVE_FAILED);
        setIsSaving(false);
      });
  };

  const remove = () => {
    setIsSaving(true);
    removeRosterName(teamId, rosterName.id,
      onSaved,
      () => {
        setError(SAVE_FAILED);
        setIsSaving(false);
      });
  };

  const message = isTaken ? NAME_TAKEN : error;

  // Deleting asks first, inside this dialog rather than in a second one on top.
  if (isConfirmingDelete) {
    return <BaseEditDialog
      title={`「${rosterName.name}」を名簿から削除しますか？`}
      actionButtonText="削除"
      isActionButtonDisabled={isSaving}
      onSubmit={remove}>
      <div className="space-y-3">
        <p className="text-muted">この名前を使っている隊列表は変わりません。</p>
        {error && <p aria-live="polite" className="font-bold text-center text-primary">{error}</p>}
      </div>
    </BaseEditDialog>;
  }

  return <BaseEditDialog
    title={kind === "dancer" ? "名前を編集" : "道具名を編集"}
    // Room for the size fields and colour grid, like the prop rename dialog.
    fullWidth={kind === "prop"}
    onSubmit={save}
    isActionButtonDisabled={toNameKey(name) === "" || isTaken || isSaving}>
    <div className="space-y-3">
      <TextInput
        defaultValue={name} // the current edit, so it survives a trip to the delete confirmation
        onContentChange={(value) => {
          setName(value);
          setError(undefined);
        }}
        maxLength={SHORT_NAME_LENGTH}
        required
        hasError={isTaken}
        showLength/>
      {
        list.categories.length > 0 && <div>
          <div className="mb-1 text-sm font-semibold">区分</div>
          <ChipToggles
            label="区分"
            wrap
            options={list.categories.map(c => ({ value: c.id, label: c.name }))}
            values={categoryIds}
            onChange={(values) => {
              setCategoryIds(values);
              setError(undefined);
            }}/>
        </div>
      }
      {
        kind === "prop" && <>
          <div>
            <label className="flex items-center gap-2 mb-1 text-sm font-semibold">
              <input type="checkbox" checked={hasSize} onChange={(e) => setHasSize(e.target.checked)} className="accent-primary"/>
              大きさ
            </label>
            {
              hasSize &&
              <div className="flex gap-1">
                <NumberInput
                  label="縦"
                  compact
                  defaultValue={length}
                  min={MIN_PROP_DIMENSION}
                  max={MAX_PROP_DIMENSION}
                  baseStep={0.1}
                  buttonStep={0.5}
                  onChange={(value) => setLength(value ?? MIN_PROP_DIMENSION)}/>
                <NumberInput
                  label="幅"
                  compact
                  defaultValue={width}
                  min={MIN_PROP_DIMENSION}
                  max={MAX_PROP_DIMENSION}
                  baseStep={0.1}
                  buttonStep={0.5}
                  onChange={(value) => setWidth(value ?? MIN_PROP_DIMENSION)}/>
              </div>
            }
          </div>
          <div>
            <label className="flex items-center gap-2 mb-1 text-sm font-semibold">
              <input type="checkbox" checked={hasColor} onChange={(e) => setHasColor(e.target.checked)} className="accent-primary"/>
              色
            </label>
            {
              hasColor &&
              <ColorSwatchGrid value={color} onChange={setColor}/>
            }
          </div>
        </>
      }
      <IconLabelButton
        icon="delete"
        label="名簿から削除"
        primaryText
        full
        disabled={isSaving}
        onClick={() => setIsConfirmingDelete(true)}/>
      {
        message && <p aria-live="polite" className="font-bold text-center text-primary">{message}</p>
      }
    </div>
  </BaseEditDialog>
}
