import { useRef, useState, useEffect, useMemo } from "react";
import { Stage } from "react-konva";
import { METER_PX } from "../../lib/consts/consts";
import GridLayer from "./layers/GridLayer";
import { StageGeometry, StageType } from "../../models/choreo";

type GridPreviewProps = {
  stageLength: number,
  stageWidth: number,
  xMargin: number,
  yMargin: number,
  stageType: StageType,
}

export default function GridPreview ({
  stageLength, stageWidth, xMargin, yMargin, stageType
}: GridPreviewProps) {
  const stageGeometry = useMemo<StageGeometry>(() => {
    return {
      stageLength,
      stageWidth,
      margin: {
        topMargin: yMargin,
        bottomMargin: yMargin,
        leftMargin: xMargin,
        rightMargin: xMargin,
      },
      yAxis: stageType === "parade" ? "bottom-up" : "top-down",
    };
  }, [stageLength, stageWidth, xMargin, yMargin, stageType]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({
        width: Math.floor(width),
        height: Math.floor(height),
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const scale = useMemo<number>(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 1;
    return Math.min(
      containerSize.width / ((stageWidth + xMargin * 2) * METER_PX),
      containerSize.height / ((stageLength + yMargin * 2) * METER_PX),
    );
  }, [containerSize, stageWidth, stageLength, xMargin, yMargin]);

  return <div ref={containerRef} className="flex-1 min-h-[300px] overflow-hidden">
    <Stage width={containerSize.width} height={containerSize.height} scaleX={scale} scaleY={scale}>
      {
        stageGeometry &&
        <GridLayer
          stageGeometry={stageGeometry}
          showGridLines
          showBorder
          verticalGridIncrement={1}
        />
      }
    </Stage>
  </div>
}
