import { useMemo, useState } from "react";
import BaseEditDialog from "./BaseEditDialog";
import TextInput from "../inputs/TextInput";
import Icon from "../basic/Icon";
import { PatternChooser } from "./ActionManagerDialog";
import { RosterSongAction, RosterSongs } from "../../models/song";
import { removeSongAction, saveSongAction } from "../../lib/helpers/apiHelper";
import { toNameKey } from "../../lib/helpers/rosterHelper";
import { ACTION_NAME_LENGTH, COUNT_NAME_LENGTH, MAX_COUNTS } from "../../lib/consts/consts";

const SAVE_FAILED = "保存できませんでした。もう一度お試しください。";

type SongActionDialogProps = {
  teamId: string,
  sectionId: string,
  action?: RosterSongAction, // left out to add a new one
  otherNames: string[], // the section's other 振り, which this one can't share a name with
  onSaved: (result: RosterSongs) => void,
}

export default function SongActionDialog({ teamId, sectionId, action, otherNames, onSaved }: SongActionDialogProps) {
  const [name, setName] = useState(action?.name ?? "");
  // undefined: still choosing a count pattern.
  const [counts, setCounts] = useState<string[] | undefined>(action?.counts);
  // Keys for the count fields, so removing one doesn't shift the others' text.
  const [countKeys, setCountKeys] = useState<number[]>(() => (action?.counts ?? []).map((_, i) => i));
  const [nextKey, setNextKey] = useState(action?.counts.length ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const setAllCounts = (values: string[] | undefined) => {
    setCounts(values);
    setCountKeys((values ?? []).map((_, i) => nextKey + i));
    setNextKey(k => k + (values?.length ?? 0));
    setError(undefined);
  };

  const errors = useMemo(() => {
    const list: string[] = [];
    const key = toNameKey(name);
    if (key && otherNames.some(n => toNameKey(n) === key)) list.push("振り名が重複");
    if (counts) {
      const keys = counts.map(toNameKey).filter(Boolean);
      if (counts.length === 0) list.push("カウントがありません");
      else if (new Set(keys).size !== keys.length) list.push("カウント名が重複");
      else if (keys.length !== counts.length) list.push("カウント名が空");
    }
    return list;
  }, [name, counts, otherNames]);

  const canSave = !isSaving && toNameKey(name) !== "" && counts !== undefined && errors.length === 0;

  const save = () => {
    if (!canSave || !counts) return;
    setIsSaving(true);
    saveSongAction(teamId, sectionId, action?.id, name.trim(), counts.map(c => c.trim()),
      onSaved,
      (status) => {
        setError(status === 409 ? "同じ名前の振りがすでにあります" : SAVE_FAILED);
        setIsSaving(false);
      });
  };

  const remove = () => {
    if (!action) return;
    setIsSaving(true);
    removeSongAction(teamId, action.id,
      onSaved,
      () => {
        setError(SAVE_FAILED);
        setIsSaving(false);
      });
  };

  if (isConfirmingDelete && action) {
    return <BaseEditDialog
      title={`「${action.name}」を削除しますか？`}
      actionButtonText="削除"
      isActionButtonDisabled={isSaving}
      backButton={{ label: "キャンセル", onClick: () => setIsConfirmingDelete(false) }}
      onSubmit={remove}>
      <div className="space-y-3">
        <p className="text-muted">この振りを使っている隊列表は変わりません。</p>
        {error && <p aria-live="polite" className="font-bold text-center text-primary">{error}</p>}
      </div>
    </BaseEditDialog>;
  }

  const messages = error ? [...errors, error] : errors;

  return <BaseEditDialog
    title={action ? "振りを編集" : "振り追加"}
    actionButtonText={action ? "保存" : "追加"}
    isActionButtonDisabled={!canSave}
    onSubmit={save}>
    <div className="space-y-2">
      <TextInput
        defaultValue={name}
        placeholder="振り名"
        maxLength={ACTION_NAME_LENGTH}
        showLength
        hasError={errors.includes("振り名が重複")}
        onContentChange={(value) => {
          setName(value);
          setError(undefined);
        }}/>
      {
        counts === undefined
          ? <>
            <p className="text-sm font-semibold">カウント</p>
            <PatternChooser onPick={(pattern) => setAllCounts(pattern.counts)} onOwn={() => setAllCounts(["", ""])}/>
          </>
          : <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-sm font-semibold whitespace-nowrap">カウント <span className="font-normal text-muted">{counts.length}/{MAX_COUNTS}</span></p>
              {
                !action &&
                <button type="button" onClick={() => setAllCounts(undefined)} className="ml-auto text-sm font-semibold whitespace-nowrap text-primary">パターンを選び直す</button>
              }
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 pr-2">
              {
                counts.map((count, i) =>
                  <div key={countKeys[i]} className="relative min-w-0">
                    <TextInput
                      defaultValue={count}
                      maxLength={COUNT_NAME_LENGTH}
                      onContentChange={(value) => {
                        setCounts(prev => prev?.map((c, j) => j === i ? value : c));
                        setError(undefined);
                      }}/>
                    {
                      counts.length > 1 &&
                      <button
                        type="button"
                        aria-label="カウントを削除"
                        onClick={() => {
                          setCounts(prev => prev?.filter((_, j) => j !== i));
                          setCountKeys(prev => prev.filter((_, j) => j !== i));
                        }}
                        className="absolute flex items-center justify-center border rounded-full -top-2 -right-2 size-5 bg-surface border-line">
                        <Icon src="clear" size="2xs" colour="grey"/>
                      </button>
                    }
                  </div>
                )
              }
              {
                counts.length < MAX_COUNTS &&
                <button
                  type="button"
                  onClick={() => {
                    setCounts(prev => [...(prev ?? []), ""]);
                    setCountKeys(prev => [...prev, nextKey]);
                    setNextKey(k => k + 1);
                  }}
                  className="flex items-center justify-center h-10 gap-0.5 text-sm border border-dashed rounded-md border-line-strong text-muted">
                  <Icon src="add" size="xs" colour="grey"/>カウント
                </button>
              }
            </div>
          </>
      }
      {
        messages.length > 0 &&
        <div aria-live="polite" className="space-y-0.5 text-sm font-semibold text-primary">
          {messages.map(m => <p key={m}>{m}</p>)}
        </div>
      }
      {
        action &&
        <button type="button" onClick={() => setIsConfirmingDelete(true)} className="flex items-center gap-0.5 pt-2 text-sm font-semibold text-primary">
          <Icon src="delete" size="xs" colour="primary"/>振りを削除
        </button>
      }
    </div>
  </BaseEditDialog>;
}
