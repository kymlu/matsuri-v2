import { Stage } from "react-konva";
import GridLayer from "./layers/GridLayer";
import { useState, useCallback, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { Choreo, StageGeometry } from "../../models/choreo";
import FormationLayer from "./layers/FormationLayer";
import { ChoreoSection } from "../../models/choreoSection";
import { DancerPosition } from "../../models/dancer";
import { pxToStageMeters, snapToGrid } from "../../lib/helpers/editorCalculationHelper";
import { METER_PX } from "../../lib/consts/consts";
import { AppSetting } from "../../models/appSettings";

export default function MainStage(props: {
  canEdit: boolean,
  isAddingDancer?: boolean,
  currentChoreo: Choreo,
  currentSection: ChoreoSection,
  updateDancerPosition?: (x: number, y: number, dancerId: string) => void,
  updateDancerPositions?: (dx: number, dy: number) => void,
  selectedIds: string[],
  setSelectedIds: Dispatch<SetStateAction<string[]>>,
  addDancer?: (x: number, y: number) => void,
  appSettings: AppSetting,
}) {
  const [dancerPositions, setDancerPositions] = useState<DancerPosition[]>([]);
  const [stageGeometry, setStageGeometry] = useState<StageGeometry>();

  useEffect(() => {
    var newGeometry = props.currentChoreo.stageGeometry;
    if (stageGeometry !== undefined &&
      stageGeometry.stageWidth === newGeometry.stageWidth &&
      stageGeometry.stageLength === newGeometry.stageLength &&
      stageGeometry.margin.topMargin === newGeometry.margin.topMargin &&
      stageGeometry.margin.bottomMargin === newGeometry.margin.bottomMargin &&
      stageGeometry.margin.leftMargin === newGeometry.margin.leftMargin &&
      stageGeometry.margin.rightMargin === newGeometry.margin.rightMargin &&
      stageGeometry.yAxis === newGeometry.yAxis) return;
    setStageGeometry(newGeometry);
  }, [props.currentChoreo]);
  
  useEffect(() => {
    setDancerPositions(Object.values(props.currentSection.formation.dancerPositions ?? []));
  }, [props.currentSection.formation.dancerPositions]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({
        width: Math.floor(width),
        height: Math.floor(height),
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const [stagePos, setStagePos] = useState<any>({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState<any>({ x: 1, y: 1 });
  const [lastCenter, setLastCenter] = useState<any>(null);
  const [lastDist, setLastDist] = useState(0);
  const [dragStopped, setDragStopped] = useState(false);

  const getDistance = (p1: any, p2: any) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const getCenter = (p1: any, p2: any) => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    const oldScale = stageScale.x;
    // const pointer = stage.getPointerPosition();

    // const mousePointTo = {
    //   x: (pointer.x - stage.x()) / oldScale,
    //   y: (pointer.y - stage.y()) / oldScale,
    // };

    // how to scale? Zoom in? Or zoom out?
    let direction = e.evt.deltaY > 0 ? 1 : -1;

    // when we zoom on trackpad, e.evt.ctrlKey is true
    // in that case lets revert direction
    if (e.evt.ctrlKey) {
      direction = -direction;
    }

    const scaleBy = 1.01;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setStageScale({ x: newScale, y: newScale });

    // const newPos = {
    //   x: pointer.x - mousePointTo.x * newScale,
    //   y: pointer.y - mousePointTo.y * newScale,
    // };
    // stage.position(newPos);
  };

  const handleTouchMove = useCallback((e: any) => {
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];
    const stage = e.target.getStage();

    // we need to restore dragging, if it was cancelled by multi-touch
    if (touch1 && !touch2 && !stage.isDragging() && dragStopped) {
      stage.startDrag();
      setDragStopped(false);
    }

    if (touch1 && touch2) {
      // if the stage was under Konva's drag&drop
      // we need to stop it, and implement our own pan logic with two pointers
      if (stage.isDragging()) {
        stage.stopDrag();
        setDragStopped(true);
      }

      const rect = stage.container().getBoundingClientRect();

      const p1 = {
        x: touch1.clientX - rect.left,
        y: touch1.clientY - rect.top,
      };
      const p2 = {
        x: touch2.clientX - rect.left,
        y: touch2.clientY - rect.top,
      };

      if (!lastCenter) {
        setLastCenter(getCenter(p1, p2));
        return;
      }
      const newCenter = getCenter(p1, p2);

      const dist = getDistance(p1, p2);

      if (!lastDist) {
        setLastDist(dist);
        return;
      }

      // local coordinates of center point
      const pointTo = {
        x: (newCenter.x - stagePos.x) / stageScale.x,
        y: (newCenter.y - stagePos.y) / stageScale.x,
      };

      const scale = stageScale.x * (dist / lastDist);

      setStageScale({ x: scale, y: scale });

      // calculate new position of the stage
      const dx = newCenter.x - lastCenter.x;
      const dy = newCenter.y - lastCenter.y;

      setStagePos({
        x: newCenter.x - pointTo.x * scale + dx,
        y: newCenter.y - pointTo.y * scale + dy,
      });

      setLastDist(dist);
      setLastCenter(newCenter);
    }
  }, [dragStopped, lastCenter, lastDist, stagePos, stageScale]);

  const handleTouchEnd = () => {
    setLastDist(0);
    setLastCenter(null);
  };

  const handleDragEnd = (e: any) => {
    setDragStopped(false);
    // Ensure stage position is synchronized with our reactive state
    const stage = e.target.getStage();
    setStagePos({ x: stage.x(), y: stage.y() });
  };
  
  return <div ref={containerRef} className="flex items-center justify-center w-full h-full overflow-scroll">
    {
      stageGeometry && 
      <Stage
        onPointerDown={(e) => {
          const stagePosition = e.target.getStage();
          const clickedOnEmpty = e.target === stagePosition;

          if (clickedOnEmpty) {
            props.setSelectedIds([]);
            if (props.isAddingDancer && stagePosition) {
              var position = {
                x: (e.evt.x - stagePosition.attrs.x)/stagePosition.attrs.scaleX,
                y: (e.evt.y - stagePosition.attrs.y)/stagePosition.attrs.scaleY
              }

              if (props.appSettings.snapToGrid) {
                position = snapToGrid(position, METER_PX/2)
              }

              var positionM = pxToStageMeters(position, stageGeometry, METER_PX);
              
              if (
                positionM.x >= -(stageGeometry.margin.leftMargin) &&
                positionM.x <= (stageGeometry.margin.rightMargin + stageGeometry.stageWidth) &&
                positionM.y >= -(stageGeometry.margin.topMargin) &&
                positionM.y <= (stageGeometry.margin.bottomMargin + stageGeometry.stageLength)
              ) {
                props.addDancer?.(positionM.x, positionM.y);
              }
            }
          }
        }}
        width={size.width}
        height={size.height}
        draggable
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale.x}
        scaleY={stageScale.y}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDragEnd={handleDragEnd}>
        <GridLayer
          stageGeometry={stageGeometry}
          showGridLines={props.appSettings.showGrid}
          />
        <FormationLayer
          canEdit={props.canEdit}
          geometry={stageGeometry}
          dancers={props.currentChoreo.dancers}
          dancerPositions={dancerPositions}
          updateDancerPosition={props.updateDancerPosition}
          updateDancerPositions={props.updateDancerPositions}
          selectedIds={props.selectedIds}
          setSelectedIds={props.setSelectedIds}
          snapToGrid={props.appSettings.snapToGrid}
          dancerDisplayType={props.appSettings.dancerDisplayType}
          />
      </Stage>
    }
  </div>
}