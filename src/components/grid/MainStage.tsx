import { Stage } from "react-konva";
import GridLayer from "./layers/GridLayer";
import { useState, useCallback, useEffect, useRef, SetStateAction, useMemo } from "react";
import { Choreo, StageGeometry } from "../../models/choreo";
import FormationLayer from "./layers/FormationLayer";
import { ChoreoSection } from "../../models/choreoSection";
import { DancerPosition } from "../../models/dancer";
import { pxToStageMeters, snapCoordsToGrid, stageMetersToPx } from "../../lib/helpers/editorCalculationHelper";
import { DEFAULT_PROP_LENGTH, MAX_ZOOM, METER_PX, MIN_ZOOM } from "../../lib/consts/consts";
import { AppSetting } from "../../models/appSettings";
import Konva from "konva";
import { PropPosition } from "../../models/prop";
import { StageEntities } from "../../models/history";
import GhostLayer from "./layers/GhostLayer";
import NextDirectionLayer from "./layers/NextDirectionLayer";
import { Coordinates } from "../../models/base";
import { strEquals } from "../../lib/helpers/globalHelper";
import MarkingsLayer from "./layers/MarkingsLayer";
import RulerLayer from "./layers/RulerLayer";
import { sortDancers, sortProps } from "../../lib/editor/commands/objectCommands";

Konva.hitOnDragEnabled = true;

type MainStageProps = {
  canEdit: boolean,
  canToggleSelection: boolean,
  canSelectDancers: boolean,
  canSelectProps: boolean,
  canSelectObstacles: boolean,
  isAddingDancer?: boolean,
  isAddingProp?: boolean,
  isAddingObstacles?: boolean,
  hideTransformerBorder?: boolean,
  currentChoreo: Choreo,
  currentSection: ChoreoSection,
  updateDancerPosition?: (x: number, y: number, dancerId: string) => void,
  updatePropPosition?: (x: number, y: number, propId: string) => void,
  updateObstaclePosition?: (x: number, y: number, itemId: string) => void,
  updatePropSizeAndRotate?: (width: number, length: number, rotation: number, x: number, y: number, propId: string) => void
  updateObstacleSizeAndRotate?: (width: number, length: number, rotation: number, x: number, y: number, itemId: string) => void
  selectedIds: StageEntities<string[]>,
  setSelectedIds: (action: SetStateAction<StageEntities<string[]>>) => void,
  addDancer?: (x: number, y: number) => void,
  addProp?: (x: number, y: number) => void,
  addObstacle?: (x: number, y: number) => void,
  appSettings: AppSetting,
  previousSection?: ChoreoSection,
  selectedDancerMovement?: {current?: DancerPosition, next?: DancerPosition},
  onDancerSelected?: () => void,
}

export default function MainStage({
  canEdit, canToggleSelection,
  canSelectDancers, canSelectProps, canSelectObstacles,
  isAddingDancer, isAddingProp, isAddingObstacles,
  hideTransformerBorder, currentChoreo, currentSection,
  updateDancerPosition, updatePropPosition, updateObstaclePosition,
  updatePropSizeAndRotate, updateObstacleSizeAndRotate, selectedIds, setSelectedIds,
  addDancer, addProp, addObstacle, appSettings, previousSection, selectedDancerMovement,
  onDancerSelected,
}: MainStageProps) {
  const [dancerPositions, setDancerPositions] = useState<DancerPosition[]>([]);
  const [propPositions, setPropPositions] = useState<PropPosition[]>([]);
  const [stageGeometry, setStageGeometry] = useState<StageGeometry>();

  const [clickedOnEmpty, setClickedOnEmpty] = useState<boolean>(false);
  const [isDraggingOnEmpty, setIsDraggingOnEmpty] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    var newGeometry = currentChoreo.stageGeometry;
    if (stageGeometry !== undefined &&
      stageGeometry.stageWidth === newGeometry.stageWidth &&
      stageGeometry.stageLength === newGeometry.stageLength &&
      stageGeometry.margin.topMargin === newGeometry.margin.topMargin &&
      stageGeometry.margin.bottomMargin === newGeometry.margin.bottomMargin &&
      stageGeometry.margin.leftMargin === newGeometry.margin.leftMargin &&
      stageGeometry.margin.rightMargin === newGeometry.margin.rightMargin &&
      stageGeometry.yAxis === newGeometry.yAxis) return;
    setStageGeometry(newGeometry);
  }, [currentChoreo]);
  
  useEffect(() => {
    setDancerPositions(currentSection.formation.dancerPositions ? sortDancers(Object.values(currentSection.formation.dancerPositions)) : []);
  }, [currentSection.formation.dancerPositions]);

  useEffect(() => {
    setPropPositions(currentSection.formation.propPositions ? sortProps(Object.values(currentSection.formation.propPositions)) : []);
  }, [currentSection.formation.propPositions]);
  
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

  const [stagePos, setStagePos] = useState<Coordinates>({ x: 0, y: 0 });
  const stageRef = useRef<Konva.Stage>(null);
  useEffect(() => {
    return () => {
      stageRef.current?.destroy();
    };
  }, []);
  const [stagePosSectionId, setStagePosSectionId] = useState<string>("");

  const [rulerPos, setRulerPos] = useState<Coordinates>({x: 0, y: 0});
  const [isSelectingNewSection, setIsSelectingNewSection] = useState<boolean>(false);

  useEffect(() => {
    if (stageGeometry && stageGeometry.yAxis === "bottom-up" && !strEquals(stagePosSectionId, currentSection.id)) {
      setIsSelectingNewSection(true);
      setStagePosSectionId(currentSection.id);
      var frontmostY = Math.max(
        ...Object.values(currentSection.formation.dancerPositions).map(x => x.y),
        ...Object.values(currentSection.formation.propPositions).map(x => x.y)
      );
      var newPosition = {x: stagePos.x, y: -stageMetersToPx({x: 0, y: frontmostY + 2}, stageGeometry, METER_PX).y * stageScale.y + 24};
      setRulerPos(newPosition)
      if (newPosition.y !== stagePos.y) {
        stageRef?.current?.to({
          x: newPosition.x,
          y: newPosition.y,
          duration: 1,
          easing: Konva.Easings.EaseInOut,
          onFinish: () => {
            setIsSelectingNewSection(false);
            setStagePos(newPosition);
          }
        });
      }
    }
  }, [stageRef, currentSection, stageGeometry]);

  const [stageScale, setStageScale] = useState<Coordinates>({ x: 1, y: 1 });
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

  const clampScale = (scale: number) => {
    return Math.max(Math.min(scale, MAX_ZOOM), MIN_ZOOM);
  }

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
    const newScale = clampScale(direction > 0 ? oldScale * scaleBy : oldScale / scaleBy);

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

      const scale = clampScale(stageScale.x * (dist / lastDist));

      setStageScale({ x: scale, y: scale });

      // calculate new position of the stage
      const dx = newCenter.x - lastCenter.x;
      const dy = newCenter.y - lastCenter.y;
      const newPosition: Coordinates = {
        x: newCenter.x - pointTo.x * scale + dx,
        y: newCenter.y - pointTo.y * scale + dy,
      };

      setStagePos({...newPosition});
      setRulerPos({...newPosition});

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

  const verticalGridIncrement = useMemo(() => {
    const pixelsPerMeter = METER_PX * stageScale.y;
    
    if (pixelsPerMeter < 10) {
      return 10;
    } else if (pixelsPerMeter < 20) {
      return 5;
    } else if (pixelsPerMeter < 40) {
      return 2;
    } else {
      return 1;
    }
  }, [stageScale])
  
  return <div ref={containerRef} className="w-full h-full overflow-scroll">
    {
      stageGeometry && 
      <Stage
        ref={stageRef}
        onPointerDown={(e) => {
          setClickedOnEmpty(e.target === e.target.getStage());
        }}
        onDragStart={(e) => {
          setIsDraggingOnEmpty(clickedOnEmpty);
        }}
        onDragMove={(e) => {
          if (e.target === e.target.getStage()) {
            setRulerPos({x: e.target.x(), y: e.target.y()})
          }
        }}
        onPointerUp={(e) => {
          if (clickedOnEmpty && isDraggingOnEmpty === undefined) {
            if (canEdit) {
              setSelectedIds({props: [], dancers: [], obstacles: []});
            }
            const stagePosition = e.target.getStage();
            
            if ((isAddingDancer || isAddingProp || isAddingObstacles) && stagePosition) {
              var position = {
                x: (e.evt.x - stagePosition.attrs.x)/stagePosition.attrs.scaleX,
                y: (e.evt.y - stagePosition.attrs.y - stageGeometry.margin.topMargin * METER_PX) / stagePosition.attrs.scaleY
              }

              if (appSettings.snapToGrid) {
                position = snapCoordsToGrid(position, METER_PX/2)
              }

              var positionM = pxToStageMeters(position, stageGeometry, METER_PX, isAddingProp ? DEFAULT_PROP_LENGTH : 0);
              
              if (
                positionM.x >= -(stageGeometry.margin.leftMargin) &&
                positionM.x <= (stageGeometry.margin.rightMargin + stageGeometry.stageWidth) &&
                positionM.y >= -(stageGeometry.margin.topMargin) &&
                positionM.y <= (stageGeometry.margin.bottomMargin + stageGeometry.stageLength)
              ) {
                if (isAddingDancer) {
                  addDancer?.(positionM.x, positionM.y);
                } else if (isAddingProp) {
                  addProp?.(positionM.x, positionM.y);
                } else if (isAddingObstacles) {
                  addObstacle?.(positionM.x, positionM.y);
                }
              }
            }
          } else if (isDraggingOnEmpty !== undefined) setIsDraggingOnEmpty(undefined);
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
          showGridLines={appSettings.showGrid}
          verticalGridIncrement={verticalGridIncrement}
          />
        {
          appSettings.showPreviousSection &&
          <GhostLayer
            dancers={currentChoreo.dancers}
            dancerPositions={previousSection ? Object.values(previousSection?.formation.dancerPositions) : undefined}
            props={currentChoreo.props}
            propPositions={previousSection ? Object.values(previousSection?.formation.propPositions) : undefined}
            geometry={stageGeometry}
            dancerDisplayType={appSettings.dancerDisplayType}
          />
        }
        <FormationLayer
          canEdit={canEdit}
          hideTransformerBorder={hideTransformerBorder}
          canSelectDancers={canSelectDancers}
          canSelectProps={canSelectProps}
          canSelectObstacles={canSelectObstacles}
          canToggleSelection={canToggleSelection}
          geometry={stageGeometry}
          dancers={currentChoreo.dancers}
          dancerPositions={dancerPositions}
          props={currentChoreo.props}
          propPositions={propPositions}
          obstacles={currentChoreo.obstacles}
          updateDancerPosition={updateDancerPosition}
          updatePropPosition={updatePropPosition}
          updatePropSizeAndRotate={updatePropSizeAndRotate}
          updateObstaclePosition={updateObstaclePosition}
          updateObstacleSizeAndRotate={updateObstacleSizeAndRotate}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          snapToGrid={appSettings.snapToGrid}
          dancerDisplayType={appSettings.dancerDisplayType}
          isDraggingOnEmpty={isDraggingOnEmpty}
          onDancerSelected={onDancerSelected}
          />
        {
          selectedDancerMovement &&
          <NextDirectionLayer
            geometry={stageGeometry}
            currentPosition={selectedDancerMovement.current}
            nextPosition={selectedDancerMovement.next}
          />
        }
        <MarkingsLayer
          stageGeometry={stageGeometry}
          verticalGridIncrement={verticalGridIncrement}
          scale={stageScale}
        />
      </Stage>
    }
    {
      stageGeometry && 
      <RulerLayer
        stageGeometry={stageGeometry}
        position={rulerPos}
        verticalGridIncrement={verticalGridIncrement}
        scale={stageScale}
        isSelectingNewSection={isSelectingNewSection}
      />
    }
  </div>
}