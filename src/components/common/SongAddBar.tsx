import { useLayoutEffect, useRef, useState } from "react";
import classNames from "classnames";
import Icon from "../basic/Icon";
import { SHORT_NAME_LENGTH } from "../../lib/consts/consts";
import { splitNames } from "../../lib/helpers/rosterHelper";

type SongAddBarProps = {
  label: string, // also the placeholder
  multiline?: boolean, // one name per line (sections); otherwise a single name (songs)
  // Sends the names; resolves with the line to show, and the names to leave in the box.
  onAdd: (names: string[]) => Promise<{ message: string, isError: boolean, leftOver?: string[] }>,
}

// The 曲 lists' add bar, styled like the 名簿's but without categories.
export default function SongAddBar({ label, multiline, onAdd }: SongAddBarProps) {
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<{ message: string, isError: boolean }>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const names = multiline ? splitNames(text) : [text.trim()].filter(Boolean);
  const lineCount = text.split("\n").length;

  // Grow with the content, up to about four lines.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight + textarea.offsetHeight - textarea.clientHeight}px`;
    }
  }, [text]);

  const submit = async () => {
    if (isSaving || names.length === 0) return;
    setIsSaving(true);
    const outcome = await onAdd(names);
    setResult({ message: outcome.message, isError: outcome.isError });
    if (!outcome.isError) {
      setText((outcome.leftOver ?? []).join("\n"));
    }
    setIsSaving(false);
  };

  const canAdd = names.length > 0 && !isSaving;

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
            setResult(undefined);
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
        {names.length > 1 ? `${names.length}つ` : "追加"}
      </button>
    </div>
    <p aria-live="polite" className={classNames("mt-1.5 text-sm truncate min-h-5", result?.isError ? "font-semibold text-primary" : "text-muted")}>
      {result?.message}
    </p>
  </div>;
}
