import { Checkbox } from "@base-ui/react";
import classNames from "classnames";
import Button from "../basic/Button";
import BottomDrawer, { BottomDrawerClose } from "../basic/BottomDrawer";
import SelectBox from "../basic/SelectBox";
import PersonOrSpotSwitch from "../inputs/PersonOrSpotSwitch";
import { colorPalette } from "../../lib/consts/colors";

export type ShortestMoveView = "now" | "after";

type ShortestMoveSheetProps = {
  previousSectionName: string,
  totalBefore: number,
  totalAfter: number,
  movedCount: number, // people who change spot
  hasGain: boolean,
  noGainMessage?: string,
  // Colours taking part; off keeps that colour in place.
  colours: string[],
  excludedColours: ReadonlySet<string>,
  onToggleColour: (colour: string) => void,
  view: ShortestMoveView,
  onChangeView: (view: ShortestMoveView) => void,
  sameColour: boolean,
  onChangeSameColour: (sameColour: boolean) => void,
  // Shown only when colours can mix.
  colourFollowsPerson: boolean,
  onChangeColourFollowsPerson: (follow: boolean) => void,
  // Shown only when a mover has counts here.
  showCountsOption: boolean,
  countsFollowPerson: boolean,
  onChangeCountsFollowPerson: (follow: boolean) => void,
  skippedStacked: boolean,
  onCancel: () => void,
  onApply: () => void,
  onHeightChange?: (height: number) => void,
};

// Whole metres from 10 m, one decimal below.
export const formatMetres = (m: number) => `${m >= 10 ? Math.round(m) : Math.round(m * 10) / 10}m`;
const shortName = (name: string) => name.length > 8 ? name.slice(0, 8) + "…" : name;

// 最短距離 preview in the shared bottom drawer: full or peek. Closing cancels; the stage can be panned but not edited.
export default function ShortestMoveSheet({
  previousSectionName, totalBefore, totalAfter, movedCount, hasGain, noGainMessage, colours, excludedColours, onToggleColour, view, onChangeView,
  sameColour, onChangeSameColour, colourFollowsPerson, onChangeColourFollowsPerson, showCountsOption, countsFollowPerson, onChangeCountsFollowPerson,
  skippedStacked, onCancel, onApply, onHeightChange,
}: ShortestMoveSheetProps) {
  return <BottomDrawer
    label="最短距離"
    layerClassName="z-20"
    onClose={onCancel}
    snapPoints={["75px", 1]}
    defaultSnapPoint={1}
    popupClassName="max-h-[calc(100svh-8rem)]"
    onVisibleHeightChange={onHeightChange}
    header={
      <div className="flex items-center w-full max-w-lg gap-3 mx-auto mb-2">
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
    }
    footer={
      <div className="flex flex-col w-full max-w-lg gap-2 px-4 pt-3 mx-auto border-t border-line">
      {
        hasGain &&
        <p className="flex flex-wrap items-baseline justify-center gap-2 text-sm">
          <span className="text-muted">「{shortName(previousSectionName)}」からの移動（合計）</span>
          <span className="line-through text-muted">{formatMetres(totalBefore)}</span>
          <span aria-hidden>→</span>
          <span className="text-xl font-bold">{formatMetres(totalAfter)}</span>
        </p>
      }
      {hasGain && <p className="-mt-1 text-sm text-center text-muted">{movedCount}人が入れ替わります</p>}
      {skippedStacked && <p className="text-sm text-center text-muted">重なっている人は動かしません</p>}
      {noGainMessage && <p className="font-bold text-center text-wrap text-primary">{noGainMessage}</p>}
      <div className="grid w-full grid-flow-col gap-2 auto-cols-fr">
        <BottomDrawerClose className="w-full">
          <Button asDiv full><span className="font-semibold text-nowrap">キャンセル</span></Button>
        </BottomDrawerClose>
        <Button full primary disabled={!hasGain} onClick={hasGain ? onApply : undefined}>
          <span className="font-semibold text-nowrap">入れ替える</span>
        </Button>
      </div>
      </div>
    }>
    <div className="flex flex-col w-full max-w-lg gap-2 py-1 mx-auto">
      {
        colours.length > 0 &&
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
        (!sameColour || showCountsOption) &&
        <>
          <span className="text-sm text-muted">入れ替えたあと、どちらに合わせますか？</span>
          {
            !sameColour &&
            <div className="flex items-center justify-between gap-2 text-sm min-h-9">
              <span>色</span>
              <PersonOrSpotSwitch label="色" withPerson={colourFollowsPerson} onChange={onChangeColourFollowsPerson} compact/>
            </div>
          }
          {
            showCountsOption &&
            <div className="flex items-center justify-between gap-2 text-sm min-h-9">
              <span>カウント</span>
              <PersonOrSpotSwitch label="カウント" withPerson={countsFollowPerson} onChange={onChangeCountsFollowPerson} compact/>
            </div>
          }
        </>
      }
    </div>
  </BottomDrawer>;
}
