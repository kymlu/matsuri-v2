import { useEffect, useRef, useState } from "react";
import { Checkbox } from "@base-ui/react";
import classNames from "classnames";
import Button from "../basic/Button";
import SelectBox from "../basic/SelectBox";
import { colorPalette } from "../../lib/consts/colors";

export type ShortestMoveView = "now" | "after";

type ShortestMoveSheetProps = {
  previousSectionName: string,
  totalBefore: number,
  totalAfter: number,
  // The current choice shortens the moves (otherwise 入れ替える is disabled).
  hasGain: boolean,
  // Why nothing would get shorter, when that is the case.
  noGainMessage?: string,
  // Every colour among the people taking part, as toggles: off keeps that colour in place.
  colours: string[],
  excludedColours: ReadonlySet<string>,
  onToggleColour: (colour: string) => void,
  view: ShortestMoveView,
  onChangeView: (view: ShortestMoveView) => void,
  sameColour: boolean,
  onChangeSameColour: (sameColour: boolean) => void,
  // People keep their colour when they swap (otherwise the colour stays with the spot). Only shown when colours can mix.
  colourFollowsPerson: boolean,
  onChangeColourFollowsPerson: (follow: boolean) => void,
  // Only shown when someone who would change spot has counts in this section.
  showCountsOption: boolean,
  countsFollowPerson: boolean,
  onChangeCountsFollowPerson: (follow: boolean) => void,
  skippedStacked: boolean,
  onCancel: () => void,
  onApply: () => void,
};

// Whole metres from 10 m, one decimal below.
export const formatMetres = (m: number) => `${m >= 10 ? Math.round(m) : Math.round(m * 10) / 10}m`;
// Long section names would push the figure off a phone screen.
const shortName = (name: string) => name.length > 8 ? name.slice(0, 8) + "…" : name;

const SWIPE_TO_CLOSE_PX = 60;
const SWIPE_TO_RESIZE_PX = 40;
// Same motion as BottomDrawer.
const SLIDE_MS = 450;
const SLIDE_EASING = "cubic-bezier(0.32,0.72,0,1)";
// Normal height, and the most it can grow to (as tall as its content, leaving the top of the stage visible).
const COLLAPSED_MAX = "45svh";
const EXPANDED_MAX = "calc(100svh - 8rem)";

// 最短距離: takes the toolbar's place while previewing, so the stage above stays visible and can be
// panned and zoomed (no backdrop). The stage itself can't be edited until this closes.
export default function ShortestMoveSheet({
  previousSectionName, totalBefore, totalAfter, hasGain, noGainMessage, colours, excludedColours, onToggleColour, view, onChangeView,
  sameColour, onChangeSameColour, colourFollowsPerson, onChangeColourFollowsPerson, showCountsOption, countsFollowPerson, onChangeCountsFollowPerson,
  skippedStacked, onCancel, onApply,
}: ShortestMoveSheetProps) {
  // Dragging the handle: up grows the sheet to its content's height; down shrinks it back, and from the normal
  // height slides it away and closes (キャンセル). It follows the finger and springs back if let go early.
  // While the finger is down the page layout never changes (the sheet grows over the stage, or slides), so the
  // stage isn't resized and redrawn on every move; the layout changes once, on release.
  const sheetRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ y: number, height: number, fullHeight: number } | undefined>(undefined);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(onCancel, SLIDE_MS);
    return () => clearTimeout(timer);
  }, [closing, onCancel]);
  const endDrag = (cancelled: boolean) => {
    if (dragStart.current === undefined) return;
    dragStart.current = undefined;
    setDragging(false);
    setDragY(0);
    if (cancelled) return;
    if (dragY < -SWIPE_TO_RESIZE_PX) setExpanded(true);
    else if (expanded && dragY > SWIPE_TO_RESIZE_PX) setExpanded(false);
    else if (!expanded && dragY > SWIPE_TO_CLOSE_PX) setClosing(true);
  };
  // Growing: as tall as the finger says, up to the content's full height, overlapping the stage (negative margin
  // keeps the space it takes in the page the same). Everything else while dragging only slides the sheet.
  const growing = dragging && dragY < 0 && !expanded;
  const grownHeight = growing ? Math.min(dragStart.current!.height - dragY, dragStart.current!.fullHeight) : 0;
  const maxHeight = growing ? `${grownHeight}px` : expanded ? EXPANDED_MAX : COLLAPSED_MAX;
  const marginTop = growing ? dragStart.current!.height - grownHeight : 0;
  const offset = closing ? "100%" : dragging && dragY > 0 ? `${dragY}px` : "0px";

  return <div
    ref={sheetRef}
    role="dialog"
    aria-label="最短距離"
    style={{
      maxHeight,
      marginTop,
      transform: `translateY(${offset})`,
      // Only the slide animates: animating the height would resize the stage on every frame.
      transition: dragging ? "none" : `transform ${SLIDE_MS}ms ${SLIDE_EASING}`,
    }}
    className="z-10 flex flex-col w-screen shrink-0 bg-surface rounded-t-2xl shadow-[0_-2px_16px_rgba(0,0,0,0.15)] motion-reduce:!transition-none">
    {/* Header and footer (result and buttons) stay put; only the options in between scroll on a short screen. */}
    <div className="flex flex-col w-full max-w-lg gap-2 px-4 mx-auto shrink-0">
      {/* Drag the handle up to see every option, or down to cancel. */}
      <div
        className="self-center w-full pt-5 pb-3 -mb-2 cursor-grab touch-none"
        onPointerDown={e => {
          if (closing) return;
          const sheet = sheetRef.current, options = optionsRef.current;
          const height = sheet?.getBoundingClientRect().height ?? 0;
          // Everything showing, without scrolling, but leaving the top of the stage visible (as EXPANDED_MAX).
          const fullHeight = Math.min(
            height - (options?.clientHeight ?? 0) + (options?.scrollHeight ?? 0),
            window.innerHeight - 8 * 16);
          dragStart.current = { y: e.clientY, height, fullHeight: Math.max(height, fullHeight) };
          setDragging(true);
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={e => {
          if (dragStart.current !== undefined) setDragY(e.clientY - dragStart.current.y);
        }}
        onPointerUp={() => endDrag(false)}
        onPointerCancel={() => endDrag(true)}>
        <div className="w-[33.333vw] h-1 mx-auto rounded-full bg-primary"/>
      </div>

      <div className="flex items-center gap-3">
        <h2 className="text-base font-bold">最短距離</h2>
        {
          hasGain &&
          <div className="flex ml-auto" role="radiogroup" aria-label="表示">
            {([["now", "今"], ["after", "最短"]] as [ShortestMoveView, string][]).map(([value, label], i) =>
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={view === value}
                onClick={() => onChangeView(value)}
                className={classNames("px-3 text-sm border min-h-8",
                  i === 0 ? "rounded-l-md" : "rounded-r-md -ml-px",
                  view === value ? "relative border-primary bg-primary/5 text-primary font-bold" : "border-line")}>
                {label}
              </button>
            )}
          </div>
        }
      </div>

    </div>
    <div ref={optionsRef} className="flex flex-col w-full max-w-lg min-h-0 gap-2 px-4 py-2 mx-auto overflow-y-auto">

      {
        colours.length > 0 &&
        // Which colours take part. Off keeps that colour's people where they are.
        <div className="flex items-center gap-3">
          <span className="text-sm shrink-0">対象の色</span>
          <div className="flex flex-wrap gap-2 p-1" role="group" aria-label="対象の色">
          {colours.map(colour => {
            const on = !excludedColours.has(colour);
            return <button
              key={colour}
              type="button"
              aria-pressed={on}
              aria-label={colour}
              onClick={() => onToggleColour(colour)}
              style={{ backgroundColor: colour, color: colorPalette.textContrast[colour] }}
              className={classNames("grid font-bold rounded-full place-items-center size-8 min-h-8 min-w-8",
                on ? "ring-2 ring-primary ring-offset-2 ring-offset-surface" : "opacity-30")}>
              {on && <span className="text-lg leading-none font-icon" aria-hidden>check</span>}
            </button>;
          })}
          </div>
        </div>
      }
      <label className="flex items-center gap-2 text-sm min-h-9">
        <Checkbox.Root checked={sameColour} onCheckedChange={onChangeSameColour} className="shrink-0">
          <SelectBox state={sameColour ? "all" : "none"}/>
        </Checkbox.Root>
        <span>同じ色どうしで入れ替える</span>
      </label>
      {
        // Like the counts option below: only shown when it can make a difference.
        !sameColour &&
        <label className="flex items-center gap-2 text-sm min-h-9">
          <Checkbox.Root checked={colourFollowsPerson} onCheckedChange={onChangeColourFollowsPerson} className="shrink-0">
            <SelectBox state={colourFollowsPerson ? "all" : "none"}/>
          </Checkbox.Root>
          <span>色も人と一緒に入れ替える</span>
        </label>
      }
      {
        showCountsOption &&
        <label className="flex items-center gap-2 text-sm min-h-9">
          <Checkbox.Root checked={countsFollowPerson} onCheckedChange={onChangeCountsFollowPerson} className="shrink-0">
            <SelectBox state={countsFollowPerson ? "all" : "none"}/>
          </Checkbox.Root>
          <span>カウントも人と一緒に入れ替える</span>
        </label>
      }

    </div>
    <div className="flex flex-col w-full max-w-lg gap-2 px-4 pt-3 pb-6 mx-auto border-t shrink-0 border-line">
      {/* The result sits with the buttons that act on it; no gain is shown like the app's other errors. */}
      {
        // Only worth showing when there is a saving; otherwise the error below says it all.
        hasGain &&
        <p className="flex flex-wrap items-baseline justify-center gap-2 text-sm">
          <span className="text-muted">「{shortName(previousSectionName)}」からの移動（合計）</span>
          <span className="line-through text-muted">{formatMetres(totalBefore)}</span>
          <span aria-hidden>→</span>
          <span className="text-xl font-bold">{formatMetres(totalAfter)}</span>
        </p>
      }
      {skippedStacked && <p className="text-sm text-center text-muted">重なっている人は動かしません</p>}
      {noGainMessage && <p className="font-bold text-center text-wrap text-primary">{noGainMessage}</p>}
      <div className="grid w-full grid-flow-col gap-2 auto-cols-fr">
        <Button full onClick={onCancel}><span className="font-semibold text-nowrap">キャンセル</span></Button>
        <Button full primary disabled={!hasGain} onClick={hasGain ? onApply : undefined}>
          <span className="font-semibold text-nowrap">入れ替える</span>
        </Button>
      </div>
    </div>
  </div>;
}
