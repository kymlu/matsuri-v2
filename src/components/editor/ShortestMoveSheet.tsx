import { useRef } from "react";
import { Checkbox } from "@base-ui/react";
import classNames from "classnames";
import Button from "../basic/Button";
import SelectBox from "../basic/SelectBox";

export type ShortestMoveView = "now" | "after";

type ShortestMoveSheetProps = {
  previousSectionName: string,
  totalBefore: number,
  totalAfter: number,
  // The current choice shortens the moves (otherwise 入れ替える is disabled).
  hasGain: boolean,
  view: ShortestMoveView,
  onChangeView: (view: ShortestMoveView) => void,
  sameColour: boolean,
  onChangeSameColour: (sameColour: boolean) => void,
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

// 移動を短く: takes the toolbar's place while previewing, so the stage above stays visible and can be
// panned and zoomed (no backdrop). The stage itself can't be edited until this closes.
export default function ShortestMoveSheet({
  previousSectionName, totalBefore, totalAfter, hasGain, view, onChangeView,
  sameColour, onChangeSameColour, showCountsOption, countsFollowPerson, onChangeCountsFollowPerson,
  skippedStacked, onCancel, onApply,
}: ShortestMoveSheetProps) {
  const dragStart = useRef<number | undefined>(undefined);
  // Nothing to compare: only crossing colours would help, and the box is still ticked.
  const crossColourOnly = sameColour && !hasGain;

  return <div
    role="dialog"
    aria-label="移動を短く"
    className="z-10 w-screen shrink-0 max-h-[45svh] overflow-y-auto bg-surface border-t-2 border-line rounded-t-2xl shadow-[0_-8px_24px_rgb(0_0_0/0.08)]">
    <div className="flex flex-col w-full max-w-lg gap-2 px-4 pt-2 pb-6 mx-auto">
      {/* Swipe the handle down to cancel, like the app's other bottom sheets. */}
      <div
        className="self-center w-full py-1 cursor-grab touch-none"
        onPointerDown={e => { dragStart.current = e.clientY; e.currentTarget.setPointerCapture?.(e.pointerId); }}
        onPointerUp={e => {
          if (dragStart.current !== undefined && e.clientY - dragStart.current > SWIPE_TO_CLOSE_PX) onCancel();
          dragStart.current = undefined;
        }}
        onPointerCancel={() => { dragStart.current = undefined; }}>
        <div className="w-24 h-1 mx-auto rounded-full bg-primary"/>
      </div>

      <div className="flex items-center gap-3">
        <h2 className="text-base font-bold">移動を短く</h2>
        {
          !crossColourOnly &&
          <div className="flex ml-auto" role="radiogroup" aria-label="表示">
            {([["now", "今"], ["after", "入れ替え後"]] as [ShortestMoveView, string][]).map(([value, label], i) =>
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

      <p className="flex items-baseline gap-2 text-sm">
        <span className="text-muted">{shortName(previousSectionName)}からの移動（合計）</span>
        {
          hasGain
            ? <>
                <span className="line-through text-muted">{formatMetres(totalBefore)}</span>
                <span aria-hidden>→</span>
                <span className="text-xl font-bold">{formatMetres(totalAfter)}</span>
              </>
            : <span className="text-lg font-bold">{formatMetres(totalBefore)}</span>
        }
      </p>

      {crossColourOnly && <p className="px-2 py-1 text-sm rounded-md bg-subtle text-muted">同じ色どうしでは、これ以上短くなりません</p>}
      {skippedStacked && <p className="px-2 py-1 text-sm rounded-md bg-subtle text-muted">重なっている人は動かしません</p>}

      <label className="flex items-center gap-2 text-sm min-h-9">
        <Checkbox.Root checked={sameColour} onCheckedChange={onChangeSameColour} className="shrink-0">
          <SelectBox state={sameColour ? "all" : "none"}/>
        </Checkbox.Root>
        <span>同じ色どうしで入れ替える</span>
      </label>
      {
        showCountsOption &&
        <label className="flex items-center gap-2 text-sm min-h-9">
          <Checkbox.Root checked={countsFollowPerson} onCheckedChange={onChangeCountsFollowPerson} className="shrink-0">
            <SelectBox state={countsFollowPerson ? "all" : "none"}/>
          </Checkbox.Root>
          <span>カウントも人と一緒に入れ替える</span>
        </label>
      }

      <div className="grid w-full grid-flow-col gap-2 mt-1 auto-cols-fr">
        <Button full onClick={onCancel}><span className="font-semibold text-nowrap">キャンセル</span></Button>
        <Button full primary disabled={!hasGain} onClick={hasGain ? onApply : undefined}>
          <span className="font-semibold text-nowrap">入れ替える</span>
        </Button>
      </div>
    </div>
  </div>;
}
