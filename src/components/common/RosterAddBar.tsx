import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import { Roster } from "../../models/roster";
import { addRosterNames } from "../../lib/helpers/apiHelper";
import { getAddBarState, getAddedSummary, splitNames, toNameKey } from "../../lib/helpers/rosterHelper";
import { SHORT_NAME_LENGTH } from "../../lib/consts/consts";
import { ChipToggles } from "../inputs/Chips";
import Icon from "../basic/Icon";

type RosterAddBarProps = {
  teamId: string,
  roster: Roster,
  filter: string, // the page's filter: a category id, "all" or "none"
  onRosterChange: (roster: Roster) => void,
}

// Fixed to the bottom of the 名簿 page. One name per line, so a single name and a pasted list
// are the same action; names already in the roster just get the selected categories.
export default function RosterAddBar({ teamId, roster, filter, onRosterChange }: RosterAddBarProps) {
  const [text, setText] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  // Shown until the next edit: the result of the last add, or why it failed.
  const [lastResult, setLastResult] = useState<{ message: string, isError: boolean }>();
  // The roster this bar last received from the server, to tell its own changes from edits elsewhere on the page.
  const ownRoster = useRef<Roster | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filtering to a category pre-selects it here; after that the two are independent.
  useEffect(() => {
    if (filter === "none") {
      setCategoryIds([]);
    } else if (filter !== "all") {
      setCategoryIds([filter]);
    }
  }, [filter]);

  // Drop selections for categories deleted in the meantime.
  useEffect(() => {
    setCategoryIds(prev => prev.filter(id => roster.categories.some(c => c.id === id)));
  }, [roster.categories]);

  // A summary of the last add would be stale once the roster was changed by something else.
  useEffect(() => {
    if (roster !== ownRoster.current) {
      setLastResult(undefined);
    }
  }, [roster]);

  // Grow with the content, including long lines that wrap; max-h caps it at about four lines, then it scrolls.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight + textarea.offsetHeight - textarea.clientHeight}px`;
    }
  }, [text]);

  const state = useMemo(() => getAddBarState(text, categoryIds, roster), [text, categoryIds, roster]);
  const lineCount = text.split("\n").length;

  const submit = () => {
    if (isSaving || state.toSend.length === 0) {
      return;
    }
    setIsSaving(true);
    const categoryNames = roster.categories.filter(c => categoryIds.includes(c.id)).map(c => c.name);
    addRosterNames(teamId, state.toSend, categoryIds,
      (result) => {
        ownRoster.current = result.roster;
        onRosterChange(result.roster);
        // Leave only the names that still need fixing.
        const leftOver = new Set([...state.tooLong, ...result.skipped.filter(s => s.reason === "too_long").map(s => s.name)].map(toNameKey));
        setText(splitNames(text).filter(n => leftOver.has(toNameKey(n))).join("\n"));
        setLastResult({ message: getAddedSummary(result.added, result.updated, categoryNames), isError: false });
        setIsSaving(false);
      },
      () => {
        setLastResult({ message: "保存できませんでした。もう一度お試しください", isError: true });
        setIsSaving(false);
      });
  };

  const message = text.trim() !== "" && state.error
    ? { message: state.error, isError: true }
    : lastResult;

  const buttonClasses = classNames("row-span-2 flex flex-col items-center justify-center w-14 rounded-md font-semibold text-xs gap-0.5", {
    "bg-primary text-white": state.toSend.length > 0 && !isSaving,
    "bg-subtle text-faint border border-line": state.toSend.length === 0 || isSaving,
  });

  return <div className="px-4 pt-3 pb-5 border-t bg-surface border-line">
    <div className="grid grid-cols-[1fr,auto] gap-x-1.5 gap-y-1.5">
      <div className="relative">
        {/* Enter adds a new line rather than submitting: the IME also uses Enter to confirm. */}
        <textarea
          ref={textareaRef}
          aria-label="名前を追加"
          value={text}
          rows={1}
          // Read-only while saving: the box is reset from what was sent, so anything typed meanwhile would be lost.
          readOnly={isSaving}
          placeholder="名前を追加（1行に1名）"
          onChange={(e) => {
            setText(e.target.value);
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
        disabled={state.toSend.length === 0 || isSaving}
        onClick={submit}
        className={buttonClasses}>
        <Icon src="add" size="xs" colour={state.toSend.length > 0 && !isSaving ? "white" : "grey"}/>
        {state.toSend.length > 1 ? `${state.toSend.length}名` : "追加"}
      </button>
      {
        roster.categories.length > 0
          ? <ChipToggles
              label="追加する区分"
              options={roster.categories.map(c => ({ value: c.id, label: c.name }))}
              values={categoryIds}
              onChange={(values) => {
                setCategoryIds(values);
                setLastResult(undefined);
              }}/>
          : <p className="self-center text-xs text-muted">区分を作ると、ここで選べます</p>
      }
    </div>
    <p aria-live="polite" className={classNames("mt-1.5 text-sm truncate min-h-5", message?.isError ? "font-semibold text-primary" : "text-muted")}>
      {message?.message}
    </p>
  </div>
}
