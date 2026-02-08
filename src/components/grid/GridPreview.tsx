import { useRef, useMemo } from "react";
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

export default function GridPreview (props: GridPreviewProps) {
  const stageGeometry = useMemo<StageGeometry>(() => {
    return {
      stageLength: props.stageLength,
      stageWidth: props.stageWidth,
      margin: {
        topMargin: props.yMargin,
        bottomMargin: props.yMargin,
        leftMargin: props.xMargin,
        rightMargin: props.xMargin,
      },
      yAxis: props.stageType === "parade" ? "bottom-up" : "top-down",
    };
  }, [props]);
  
  const ref = useRef<HTMLDivElement>(null);

  const scale = useMemo<number>(() => {
    var boundingClient = ref.current?.getBoundingClientRect();
    if (!boundingClient) return 1;
    return Math.min(
      boundingClient.width / ((props.stageWidth + props.xMargin * 2) * METER_PX), 
      boundingClient.height / ((props.stageLength + props.yMargin * 2) * METER_PX), 
    );
  }, [props]);

  return <div ref={ref} className="flex-1 overflow-hidden">
    <Stage width={1500} height={ref.current?.getBoundingClientRect().height ?? 300} scaleX={scale} scaleY={scale}>
      {
        stageGeometry &&
        <GridLayer
          stageGeometry={stageGeometry}
          showGridLines={true}
        />
      }
    </Stage>
  </div>
}