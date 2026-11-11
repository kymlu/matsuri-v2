import { Checkbox, Dialog } from "@base-ui/react";
import { useMemo, useState } from "react";
import classNames from "classnames";
import CustomDialog from "../basic/CustomDialog";
import Button from "../basic/Button";
import Icon from "../basic/Icon";
import TextInput from "../inputs/TextInput";
import { Dancer } from "../../models/dancer";
import { buildFindDancerList } from "../../lib/helpers/myDancerHelper";
import { isNullOrUndefinedOrBlank, strEquals } from "../../lib/helpers/globalHelper";

type FindDancerDialogProps = {
  dancers: Record<string, Dancer>,
  shownId?: string, // the dancer selected on the stage when the dialog opened
  myDancerId?: string,
  myDancerName: string | null,
  onConfirm: (dancerId: string, saveAsMe: boolean) => void,
}

// Viewer: find a dancer by name and select them on the stage, optionally saving them as "me".
export default function FindDancerDialog({ dancers, shownId, myDancerId, myDancerName, onConfirm }: FindDancerDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [chosenId, setPickedId] = useState<string | undefined>(shownId);
  const [saveAsMe, setSaveAsMe] = useState(false);

  const items = useMemo(
    () => buildFindDancerList(dancers, shownId, myDancerId, searchTerm),
    [dancers, shownId, myDancerId, searchTerm]
  );
  // A pick hidden by the search no longer counts, so the footer never acts on someone not in view.
  const pickedId = items.some(i => i.id === chosenId) ? chosenId : undefined;
  const picked = pickedId ? dancers[pickedId] : undefined;
  const pickedLabel = useMemo(
    () => buildFindDancerList(dancers, undefined, undefined, "").find(i => i.id === pickedId)?.label,
    [dancers, pickedId]
  );

  // Saving stores the name, so a dancer whose name is already "me" has nothing to save.
  const isAlreadyMe = picked !== undefined && strEquals(picked.name.trim(), myDancerName?.trim());
  const checkboxLabel = !picked
    ? "自分として登録"
    : isNullOrUndefinedOrBlank(myDancerName?.trim())
      ? `「${picked.name.trim()}」をこの端末の自分として登録`
      : `この端末の自分を「${myDancerName!.trim()}」から「${picked.name.trim()}」に変える`;

  const pick = (id: string) => {
    setPickedId(id);
    setSaveAsMe(false);
  };

  return <CustomDialog
    title="ダンサーを探す"
    hasX
    fullWidth
    // On a phone, focusing the search box would raise the keyboard over the list.
    focusDialogOnOpen={window.matchMedia?.("(pointer: coarse)").matches}
    header={
      <div className="mb-2">
        <TextInput
          search
          clearable
          placeholder="名前で検索"
          onContentChange={setSearchTerm}/>
      </div>
    }
    footer={
      <div className="pt-3 mt-2 border-t border-line">
        {
          isAlreadyMe
            ? <p className="text-sm text-muted min-h-9">この端末では自分として登録済み</p>
            : <label className={classNames("flex items-start gap-2 text-sm min-h-9", { "text-muted opacity-60": !picked })}>
                <Checkbox.Root
                  checked={saveAsMe}
                  disabled={!picked}
                  onCheckedChange={setSaveAsMe}
                  className="flex items-center justify-center mt-0.5 border rounded size-4 shrink-0 border-line data-[checked]:bg-primary-fill data-[checked]:border-primary-fill">
                  <Checkbox.Indicator>
                    <Icon src="check" size="xs" colour="white"/>
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <span>{checkboxLabel}</span>
              </label>
        }
        <div className="grid w-full grid-flow-col gap-2 mt-3 auto-cols-fr">
          <Dialog.Close className="w-full">
            <Button asDiv full><span className="font-semibold text-nowrap">キャンセル</span></Button>
          </Dialog.Close>
          <Dialog.Close
            className="w-full"
            disabled={!picked}
            onClick={() => { if (pickedId) onConfirm(pickedId, saveAsMe && !isAlreadyMe); }}>
            <Button asDiv full primary disabled={!picked}><span className="font-semibold text-nowrap">表示する</span></Button>
          </Dialog.Close>
        </div>
      </div>
    }>
    {
      items.length === 0
        ? <p className="py-8 text-sm text-center text-muted min-h-[40svh]">「{searchTerm.trim()}」は見つかりませんでした</p>
        : <ul className="space-y-1 min-h-[40svh]" aria-label="ダンサー">
            {
              items.map(item =>
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={item.id === pickedId}
                    onClick={() => pick(item.id)}
                    className={classNames(
                      "flex items-center w-full gap-2 px-3 text-left rounded-md min-h-11",
                      item.id === pickedId ? "outline outline-2 -outline-offset-2 outline-primary" : "hover:bg-line/40"
                    )}>
                    <span className="break-all">{item.label}</span>
                    {item.isMe && <span className="px-1 text-xs border rounded text-primary border-primary shrink-0">自分</span>}
                    {item.isShown && <span className="ml-auto text-xs text-muted shrink-0">表示中</span>}
                  </button>
                </li>
              )
            }
          </ul>
    }
    {pickedLabel && <span className="sr-only" aria-live="polite">{pickedLabel}を選択中</span>}
  </CustomDialog>
}
