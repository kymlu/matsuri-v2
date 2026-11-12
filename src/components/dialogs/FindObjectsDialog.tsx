import { Dialog } from "@base-ui/react";
import { useMemo, useState } from "react";
import classNames from "classnames";
import CustomDialog from "../basic/CustomDialog";
import Button from "../basic/Button";
import SelectBox from "../basic/SelectBox";
import TextInput from "../inputs/TextInput";
import { buildFindList } from "../../lib/helpers/myDancerHelper";

type Named = { id: string, name: string };

type FindObjectsDialogProps = {
  dancers: Named[],
  props: Named[],
  // What is selected on the stage when the dialog opens; those rows start ticked.
  initialDancerIds: string[],
  initialPropIds: string[],
  onConfirm: (dancerIds: string[], propIds: string[]) => void,
}

// Editor: find dancers and props by name and select any number of them on the stage.
export default function FindObjectsDialog({ dancers, props, initialDancerIds, initialPropIds, onConfirm }: FindObjectsDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dancerIds, setDancerIds] = useState<Set<string>>(() => new Set(initialDancerIds));
  const [propIds, setPropIds] = useState<Set<string>>(() => new Set(initialPropIds));

  const dancerItems = useMemo(() => buildFindList(dancers, searchTerm), [dancers, searchTerm]);
  const propItems = useMemo(() => buildFindList(props, searchTerm), [props, searchTerm]);
  const count = dancerIds.size + propIds.size;

  const toggle = (set: Set<string>, setSet: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSet(next);
  };

  const section = (title: string, items: { id: string, label: string }[], picked: Set<string>, setPicked: (s: Set<string>) => void) =>
    items.length > 0 &&
    <section aria-label={title}>
      <h3 className="mt-2 mb-1 text-sm font-semibold text-muted">{title}</h3>
      <ul className="p-px space-y-1">
        {
          items.map(item => {
            const isPicked = picked.has(item.id);
            return <li key={item.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isPicked}
                onClick={() => toggle(picked, setPicked, item.id)}
                className={classNames(
                  // Same as the current row in まとめ, with the roster's checkbox.
                  "flex items-center w-full gap-2 px-3 text-left rounded-md min-h-11 border",
                  isPicked ? "border-primary bg-primary/5" : "border-line hover:bg-line/40"
                )}>
                <SelectBox state={isPicked ? "all" : "none"}/>
                <span className={classNames("break-all", isPicked ? "text-primary font-bold" : "font-semibold")}>{item.label}</span>
              </button>
            </li>;
          })
        }
      </ul>
    </section>;

  return <CustomDialog
    title="探す"
    hasX
    full
    // On a phone, focusing the search box would raise the keyboard over the list.
    focusDialogOnOpen={window.matchMedia?.("(pointer: coarse)").matches}
    header={
      <div className="mb-1">
        <TextInput
          search
          clearable
          placeholder="名前で検索"
          onContentChange={setSearchTerm}/>
      </div>
    }
    footer={
      <div className="pt-3 mt-2 border-t border-line">
        <p className="mb-2 text-sm text-muted" aria-live="polite">{count > 0 ? `${count}件選択中` : "選ぶものをタップ"}</p>
        <div className="grid w-full grid-flow-col gap-2 auto-cols-fr">
          <Dialog.Close className="w-full">
            <Button asDiv full><span className="font-semibold text-nowrap">キャンセル</span></Button>
          </Dialog.Close>
          <Dialog.Close
            className="w-full"
            disabled={count === 0}
            onClick={() => { if (count > 0) onConfirm([...dancerIds], [...propIds]); }}>
            <Button asDiv full primary disabled={count === 0}><span className="font-semibold text-nowrap">選択する</span></Button>
          </Dialog.Close>
        </div>
      </div>
    }>
    {
      dancerItems.length === 0 && propItems.length === 0
        ? <p className="py-8 text-sm text-center text-muted">「{searchTerm.trim()}」は見つかりませんでした</p>
        : <>
            {section("ダンサー", dancerItems, dancerIds, setDancerIds)}
            {section("道具", propItems, propIds, setPropIds)}
          </>
    }
  </CustomDialog>
}
