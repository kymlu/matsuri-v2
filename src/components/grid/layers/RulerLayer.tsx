import { StageGeometry } from "../../../models/choreo";
import { METER_PX } from "../../../lib/consts/consts";
import { ReactNode, useMemo } from "react";
import { Coordinates } from "../../../models/base";

interface RulerLayerProps {
  stageGeometry: StageGeometry,
  gridSize?: number,
  position: Coordinates,
  verticalGridIncrement: number,
  scale: Coordinates,
  isSelectingNewSection: boolean,
}

export default function RulerLayer({
  stageGeometry,
  gridSize,
  position,
  verticalGridIncrement,
  scale,
  isSelectingNewSection,
}: RulerLayerProps) {
  const {
    gridSizePx,
    width,
    length,
    margins,
    yAxis,
    stageTopPx,
    center,
    totalMeters,
    gridOffsetMeters
  } = useMemo(() => {
    const gridSizePx = gridSize ?? METER_PX;
    const width = stageGeometry.stageWidth;
    const length = stageGeometry.stageLength;
    const margins = stageGeometry.margin;
    const yAxis = stageGeometry.yAxis;

    const stageTopPx = margins.topMargin * gridSizePx;

    const center = width / 2;

    const totalMeters = margins.leftMargin + width + margins.rightMargin;
    const isOddTotal = totalMeters % 2 === 1;
    const gridOffsetMeters = isOddTotal ? 0.5 : 0;

    return {
      gridSizePx, width, length, margins, yAxis,
      stageTopPx, center, totalMeters, gridOffsetMeters,
    };
  }, [stageGeometry, gridSize]);
  
  const showVerticalMarks = useMemo(() => {
    return position.x + (totalMeters * gridSizePx) * scale.x > window.innerWidth;
  }, [position.x, scale.x]);

  const verticalMarks = useMemo(() => {
    const elements: ReactNode[] = [];

    const pushElement = (meterFromTop: number) => {
      elements.push(
        <div key={`v${meterFromTop}`} className="h-0">
          <div className={`rounded-full h-[2px] -translate-y-1/2 bg-lightGrey ${meterFromTop % verticalGridIncrement === 0 ? "w-1" : "w-1.5"}`
          }/>
          {
            meterFromTop % verticalGridIncrement === 0 &&
            <div className={`h-fit pl-2 py-0.5 -translate-y-1/2 text-xs font-bold ${(meterFromTop >= 0 && meterFromTop <= length ? "text-gray-600" :  "text-gray-400")}`}>
              {meterFromTop}
            </div>
          }
        </div>
      );
    }

    if (yAxis === "top-down") {
      for (let m = -(margins.topMargin); m <= length + margins.bottomMargin; m++) {
        pushElement(m);
      }
    } else {
      for (let m = length + margins.bottomMargin; m >= -(margins.topMargin) ; m--) {
        pushElement(m);
      }
    }
    return elements;
  }, [stageGeometry, verticalGridIncrement]);

  const showHorizontalMarks = useMemo(() => {
    return position.y + (stageTopPx - gridSizePx) * scale.y < 0;
  }, [position.y, scale.y]);

  const horizontalMarks = useMemo(() => {
    const elements = [];
    
    for (let m = -(margins.leftMargin); m <= width + margins.rightMargin; m++) {
      const meterFromCenter = Math.abs(center - m - gridOffsetMeters);
      if (meterFromCenter > center + margins.rightMargin) continue;

      elements.push(
        <div key={`h${m}`} className="relative w-0">
          <div className={
            "absolute rounded-full w-[2px] -translate-x-1/2 bg-lightGrey "
            + (meterFromCenter % 2 === 0 ? "translate-y-[20px] h-1" : "translate-y-4 h-1.5")}/>
          {
            meterFromCenter % 2 === 0 &&
            <div className="absolute top-0.5 left-0 px-0.5 -translate-x-1/2 text-xs font-bold">
              {meterFromCenter}
            </div>
          }
        </div>
      );
    }
    return elements;
  }, [stageGeometry, scale]);

  return <>
    {
      showVerticalMarks && <div
        className="fixed border-gray-200 border-l top-[88px] w-8 right-0 flex flex-col h-full text-sm bg-white pointer-events-none overflow-hidden"
      >
        <div
          className="flex flex-col"
          style={{
            opacity: showVerticalMarks ? 100 : 0,
            transition: [
              'opacity 0.2s ease-in-out',
              isSelectingNewSection ? 'transform 1s ease-in-out' : null,
            ].filter(Boolean).join(', '),
            transform: `translateY(${position.y}px)`,
            gap: gridSizePx * scale.y,
          }}
        >
          {verticalMarks}
        </div>
      </div>
    }
    {
      showHorizontalMarks &&
      <div
        className="text-gray-600 border-b-gray-200 border-b fixed top-[88px] h-6 left-0 flex flex-col w-full text-sm bg-white pointer-events-none overflow-hidden"
      >
        <div
          className="flex items-end h-0"
          style={{
            transform: `translateX(${position.x + gridOffsetMeters * gridSizePx * scale.y}px)`,
            gap: gridSizePx * scale.x,
          }}
        >
          {horizontalMarks}
        </div>
      </div>
    }
    {
      (showVerticalMarks || showHorizontalMarks) && 
      <div className="flex border-l border-b border-gray-200 justify-center items-center h-6 font-bold fixed text-sm text-center px-1 w-8 top-[88px] right-0 bg-gray-200"/>
    }
  </>
}