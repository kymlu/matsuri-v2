import { useRef, useState, useEffect, useMemo } from "react";
import { Layer, Line, Stage } from "react-konva";
import { METER_PX } from "../../lib/consts/consts";
import GridLayer from "./layers/GridLayer";
import { StageGeometry, StageType } from "../../models/choreo";
import { useTheme } from "../../lib/helpers/themeHelper";
import { StartingLayout } from "../../lib/helpers/startingLayoutHelper";
import BasicDancerGridObject from "./gridObjects/BasicDancerGridObject";
import BasicPropGridObject from "./gridObjects/BasicPropGridObject";
import { colorPalette } from "../../lib/consts/colors";

type GridPreviewProps = {
  stageLength: number,
  stageWidth: number,
  xMargin: number,
  yMargin: number,
  stageType: StageType,
  layout?: StartingLayout, // dancers and props to draw on the stage (新規作成 step 3)
  visibleLength?: number,  // parade only: metres of the course to show, from the front
  className?: string,      // replaces the container's default size classes
  label?: string,          // text equivalent for screen readers
}

export default function GridPreview ({
  stageLength, stageWidth, xMargin, yMargin, stageType, layout, visibleLength, className, label,
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

  const [theme] = useTheme();
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

  // A parade shows only its front part: the same drawing, shifted up so the front (bottom) stays in view.
  const isCropped = stageType === "parade" && visibleLength !== undefined && visibleLength < stageLength;
  const shownLength = isCropped ? visibleLength! : stageLength;
  const hiddenPx = isCropped ? (stageLength - shownLength) * METER_PX : 0;

  const scale = useMemo<number>(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 1;
    return Math.min(
      containerSize.width / ((stageWidth + xMargin * 2) * METER_PX),
      containerSize.height / ((shownLength + yMargin * (isCropped ? 1 : 2)) * METER_PX),
    );
  }, [containerSize, stageWidth, shownLength, xMargin, yMargin, isCropped]);

  return <div ref={containerRef} role={label ? "img" : undefined} aria-label={label} className={className ?? "flex-1 min-h-[300px] overflow-hidden"}>
    <Stage key={theme} width={containerSize.width} height={containerSize.height} scaleX={scale} scaleY={scale} offsetY={hiddenPx + (isCropped ? yMargin * METER_PX : 0)}>
      {
        stageGeometry &&
        <GridLayer
          stageGeometry={stageGeometry}
          showGridLines
          showBorder
          verticalGridIncrement={1}
        />
      }
      {
        layout &&
        <Layer listening={false}>
          {
            Object.values(layout.propPositions).map(position =>
              <BasicPropGridObject key={position.propId} prop={layout.props[position.propId]} position={position} geometry={stageGeometry}/>)
          }
          {
            Object.values(layout.dancerPositions).map(position =>
              <BasicDancerGridObject key={position.dancerId} position={position} geometry={stageGeometry}/>)
          }
          {
            // Marks where the course continues past what's shown.
            isCropped &&
            <Line
              points={[0, (yMargin + stageLength - shownLength) * METER_PX, (stageWidth + xMargin * 2) * METER_PX, (yMargin + stageLength - shownLength) * METER_PX]}
              stroke={colorPalette.primary}
              strokeWidth={2}
              dash={[8, 6]}/>
          }
        </Layer>
      }
    </Stage>
  </div>
}
