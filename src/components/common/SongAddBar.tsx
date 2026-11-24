import { useLayoutEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import Icon from "../basic/Icon";
import { SHORT_NAME_LENGTH } from "../../lib/consts/consts";
import { getSongAddBarState } from "../../lib/helpers/songHelper";
import { toNameKey } from "../../lib/helpers/rosterHelper";

type SongAddBarProps = {
  label: string, // also the placeholder
  noun: "曲" | "セクション", // for 「N件の曲を追加しました」
  where: "名簿" | "曲", // for 「…はすでに曲にあります」
  existingNames: string[],
  multiline?: boolean, // one name per line (sections); otherwise a single name (songs)
  // Sends the names; resolves with how many were added, or undefined if it failed.
  onAdd: (names: string[]) => Promise<number | undefined>,
}

export default function SongAddBar({ label, noun, where, existingNames, multiline, onAdd }: SongAddBarProps) {
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastResult, setLastResult] = useState<{ message: string, isError: boolean }>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const state = useMemo(() => getSongAddBarState(text, existingNames, where, !!multiline), [text, existingNames, where, multiline]);
  const lineCount = text.split("\n").length;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight + textarea.offsetHeight - textarea.clientHeight}px`;
    }
  }, [text]);

  const submit = async () => {
    if (isSaving || state.toSend.length === 0) return;
    setIsSaving(true);
    const added = await onAdd(state.toSend);
    if (added === undefined) {
      setLastResult({ message: "保存できませんでした。もう一度お試しください。", isError: true });
    } else {
      const leftOver = new Set(state.tooLong.map(toNameKey));
      setText(text.split("\n").filter(n => leftOver.has(toNameKey(n))).join("\n"));
      setLastResult({ message: `${added}件の${noun}を追加しました`, isError: false });
    }
    setIsSaving(false);
  };

  const message = text.trim() !== "" && state.error ? { message: state.error, isError: true } : lastResult;
  const canAdd = state.toSend.length > 0 && !isSaving;

  return <div className="px-4 pt-3 pb-6 border-t bg-surface border-line">
    <div className="grid grid-cols-[minmax(0,1fr),auto] gap-x-1.5">
      <div className="relative">
        <textarea
          ref={textareaRef}
          aria-label={label}
          value={text}
          rows={1}
          readOnly={isSaving}
          placeholder={label}
          onChange={(e) => {
            setText(multiline ? e.target.value : e.target.value.replace(/\n/g, ""));
            setLastResult(undefined);
          }}
          className={classNames("block w-full max-h-[7.125rem] pl-2 py-2 border rounded-md resize-none bg-surface text-body border-line focus:border-primary focus:outline-none placeholder:text-faint",
            lineCount === 1 && text !== "" ? "pr-14" : "pr-2")}/>
        {
          lineCount === 1 && text !== "" &&
          <span className="absolute text-sm pointer-events-none select-none right-2 bottom-2 text-muted">
            {`${text.trim().length}/${SHORT_NAME_LENGTH}`}
          </span>
        }
      </div>
      <button
        type="button"
        disabled={!canAdd}
        onClick={submit}
        className={classNames("flex flex-col items-center justify-center w-14 rounded-md font-semibold text-xs gap-0.5", {
          "bg-primary-fill text-white": canAdd,
          "bg-subtle text-faint border border-line": !canAdd,
        })}>
        <Icon src="add" size="xs" colour={canAdd ? "white" : "grey"}/>
        {state.toSend.length > 1 ? `${state.toSend.length}件` : "追加"}
      </button>
    </div>
    <p aria-live="polite" className={classNames("mt-1.5 text-sm truncate min-h-5", message?.isError ? "font-semibold text-primary" : "text-muted")}>
      {message?.message}
    </p>
  </div>;
}
