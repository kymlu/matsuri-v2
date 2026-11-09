import { useMemo, useState } from "react";
import { Dialog } from "@base-ui/react";
import { Roster, RosterName } from "../../models/roster";
import { removeRosterName, updateRosterName } from "../../lib/helpers/apiHelper";
import { toNameKey } from "../../lib/helpers/rosterHelper";
import { SHORT_NAME_LENGTH } from "../../lib/consts/consts";
import BaseEditDialog from "./BaseEditDialog";
import ConfirmDeletionDialog from "./ConfirmDeletionDialog";
import TextInput from "../inputs/TextInput";
import { ChipToggles } from "../inputs/Chips";
import { IconLabelButton } from "../basic/Button";

type EditRosterNameDialogProps = {
  teamId: string,
  rosterName: RosterName,
  roster: Roster,
  onSaved: (roster: Roster) => void,
}

const NAME_TAKEN = "この名前はすでに名簿にあります";
const SAVE_FAILED = "保存できませんでした。もう一度お試しください";

export default function EditRosterNameDialog({ teamId, rosterName, roster, onSaved }: EditRosterNameDialogProps) {
  const [name, setName] = useState(rosterName.name);
  const [categoryIds, setCategoryIds] = useState(rosterName.categoryIds);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isTaken = useMemo(() => {
    const key = toNameKey(name);
    return roster.names.some(n => n.id !== rosterName.id && toNameKey(n.name) === key);
  }, [name, roster, rosterName.id]);

  const save = () => {
    setIsSaving(true);
    updateRosterName(teamId, rosterName.id, name.trim(), categoryIds,
      onSaved,
      (status) => {
        setError(status === 409 ? NAME_TAKEN : SAVE_FAILED);
        setIsSaving(false);
      });
  };

  const remove = () => {
    setIsConfirmingDelete(false);
    setIsSaving(true);
    removeRosterName(teamId, rosterName.id,
      onSaved,
      () => {
        setError(SAVE_FAILED);
        setIsSaving(false);
      });
  };

  const message = isTaken ? NAME_TAKEN : error;

  return <BaseEditDialog
    title="名前を編集"
    onSubmit={save}
    isActionButtonDisabled={toNameKey(name) === "" || isTaken || isSaving}>
    <div className="space-y-3">
      <TextInput
        defaultValue={rosterName.name}
        onContentChange={(value) => {
          setName(value);
          setError(undefined);
        }}
        maxLength={SHORT_NAME_LENGTH}
        required
        hasError={isTaken}
        showLength/>
      {
        roster.categories.length > 0 && <div>
          <div className="mb-1 text-sm font-semibold">区分</div>
          <ChipToggles
            label="区分"
            wrap
            options={roster.categories.map(c => ({ value: c.id, label: c.name }))}
            values={categoryIds}
            onChange={(values) => {
              setCategoryIds(values);
              setError(undefined);
            }}/>
        </div>
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
    <Dialog.Root open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
      <ConfirmDeletionDialog
        name={`「${rosterName.name}」`}
        note="この名前を使っている隊列表は変わりません。"
        verb="削除"
        onSubmit={remove}/>
    </Dialog.Root>
  </BaseEditDialog>
}
