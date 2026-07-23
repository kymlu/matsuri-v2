import { Stage } from "react-konva";
import GridLayer from "./layers/GridLayer";
import { useState, useCallback, useEffect, useRef, SetStateAction, useMemo } from "react";
import { Choreo, StageGeometry } from "../../models/choreo";
import FormationLayer from "./layers/FormationLayer";
import { ChoreoSection, MovementCacheRecord } from "../../models/choreoSection";
import { DancerPosition } from "../../models/dancer";
import { pxToStageMeters, snapCoordsToGrid, stageMetersToPx } from "../../lib/helpers/editorCalculationHelper";
import { DEFAULT_PROP_LENGTH, MAX_ZOOM, METER_PX, MIN_ZOOM } from "../../lib/consts/consts";
import { AppSetting } from "../../models/appSettings";
import Konva from "konva";
import { Obstacle, PropPosition } from "../../models/prop";
import { StageEntities } from "../../models/history";
import GhostLayer from "./layers/GhostLayer";
import NextDirectionLayer from "./layers/NextDirectionLayer";
import { Coordinates } from "../../models/base";
import { strEquals } from "../../lib/helpers/globalHelper";
import MarkingsLayer from "./layers/MarkingsLayer";
import RulerLayer from "./layers/RulerLayer";
import { sortDancers, sortProps } from "../../lib/editor/commands/objectCommands";
import IconButton from "../basic/IconButton";
import MovementEditLayer from "./layers/MovementEditLayer";

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
  selectedObjects: StageEntities<PropPosition[], DancerPosition[], Obstacle[]>,
  setSelectedIds: (action: SetStateAction<StageEntities<string[]>>) => void,
  addDancer?: (x: number, y: number) => void,
  addProp?: (x: number, y: number) => void,
  addObstacle?: (x: number, y: number) => void,
  appSettings: AppSetting,
  previousSection?: ChoreoSection,
  selectedDancerMovement?: {current?: DancerPosition, next?: DancerPosition},
  onDancerSelected?: () => void,
  bottomMarginPercent?: number,
  canResizeProps?: boolean,
  editEnabled?: boolean,
  toggleEditEnabled?: () => void,
  showPaths?: boolean,
  isEditingMovement?: boolean,
  movementCache: MovementCacheRecord
}

export default function MainStage({
  canEdit, canToggleSelection,
  canSelectDancers, canSelectProps, canSelectObstacles,
  isAddingDancer, isAddingProp, isAddingObstacles,
  hideTransformerBorder, currentChoreo, currentSection,
  updateDancerPosition, updatePropPosition, updateObstaclePosition,
  updatePropSizeAndRotate, updateObstacleSizeAndRotate,
  selectedIds, setSelectedIds, selectedObjects,
  addDancer, addProp, addObstacle, appSettings, previousSection, selectedDancerMovement,
  onDancerSelected, bottomMarginPercent = 0, canResizeProps, editEnabled, toggleEditEnabled,
  showPaths = false, isEditingMovement = false, movementCache,
}: MainStageProps) {
  const [dancerPositions, setDancerPositions] = useState<DancerPosition[]>([]);
  const [propPositions, setPropPositions] = useState<PropPosition[]>([]);
  const [stageGeometry, setStageGeometry] = useState<StageGeometry>();
  const [isShowingVerticalRuler, setIsShowingVerticalRuler] = useState<boolean>(false);
  const [isShowingHorizontalRuler, setIsShowingHorizontalRuler] = useState<boolean>(false);
  const [isManualMovement, setIsManualMovement] = useState<boolean>(false);
  const isZooming = useRef<boolean>(false);

  const [stageScale, setStageScale] = useState<Coordinates>({ x: 1, y: 1 });
  const pixelsPerMeter = useMemo(() => METER_PX * stageScale.y, [stageScale]);

  const [clickedOnEmpty, setClickedOnEmpty] = useState<boolean>(false);
  const [isDraggingOnEmpty, setIsDraggingOnEmpty] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    const newGeometry = currentChoreo.stageGeometry;
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
  const centerXPx = useMemo(() => stageGeometry ? 
    ((size.width - (isShowingVerticalRuler ? 32 : 0))/pixelsPerMeter/2
    -(stageGeometry.stageWidth + stageGeometry.margin.leftMargin + stageGeometry.margin.rightMargin)/2) * pixelsPerMeter :
    0
  , [size, stageGeometry, isShowingVerticalRuler, pixelsPerMeter]);

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
  const stagePositionRef = useRef(stagePos);
  const setStagePosition = (newValue: Coordinates) => {
    stagePositionRef.current = newValue;
    setStagePos(newValue);
  }
  const stageRef = useRef<Konva.Stage>(null);
  useEffect(() => {
    return () => {
      stageRef.current?.destroy();
    };
  }, []);
  const [stagePosSectionId, setStagePosSectionId] = useState<string>("");

  const [rulerPos, setRulerPos] = useState<Coordinates>({x: 0, y: 0});
  const [isSelectingNewSection, setIsSelectingNewSection] = useState<boolean>(false);

  const bottomMarginM = useMemo(() => {
    return bottomMarginPercent === 0 ? 100/pixelsPerMeter : ((size.height / pixelsPerMeter) * bottomMarginPercent);
  }, [bottomMarginPercent, size.height, pixelsPerMeter]);

  useEffect(() => {
    if (!stageGeometry || strEquals(stagePosSectionId, currentSection.id)) return;
    setIsSelectingNewSection(true);
    setStagePosSectionId(currentSection.id);
    // only consider the frontmost dancer within the app since dancers are the main
    // within the pdf it will still show props and dancers
    const newPosition = {x: stagePositionRef.current.x, y: stagePositionRef.current.y};
    if (selectedIds.dancers.length > 0) {
      let stageXMeters = pxToStageMeters({x: -stagePositionRef.current.x, y: 0}, stageGeometry, pixelsPerMeter).x;
      let leftThreshold = stageXMeters + 1;
      let rightThreshold = stageXMeters + (size.width/pixelsPerMeter) - 1;
      if (selectedIds.dancers.length === 1) {
        let x = selectedObjects.dancers[0].x;
        if (x < leftThreshold) {
          newPosition.x = -stageMetersToPx({x: x - 1, y: 0}, stageGeometry, pixelsPerMeter).x;
        } else if (x > rightThreshold) {
          newPosition.x = -stageMetersToPx({x: x - size.width/pixelsPerMeter, y: 0}, stageGeometry, pixelsPerMeter).x - pixelsPerMeter - (isShowingVerticalRuler ? 32 : 0); 
        }
      } else {
        const rightmostX = Math.max(
          ...Object.values(selectedObjects.dancers).map(x => x.x),
          ...Object.values(selectedObjects.props).map(x => x.x),
          ...Object.values(selectedObjects.obstacles).map(x => x.x)
        );
        const leftmostX = Math.min(
          ...Object.values(selectedObjects.dancers).map(x => x.x),
          ...Object.values(selectedObjects.props).map(x => x.x),
          ...Object.values(selectedObjects.obstacles).map(x => x.x)
        );
        if (leftmostX < leftThreshold) {
          newPosition.x = -stageMetersToPx({x: leftmostX - 1, y: 0}, stageGeometry, pixelsPerMeter).x;
        } else if (rightmostX > rightThreshold) {
          newPosition.x = -stageMetersToPx({x: rightmostX - size.width/pixelsPerMeter, y: 0}, stageGeometry, pixelsPerMeter).x - pixelsPerMeter - (isShowingVerticalRuler ? 32 : 0);
        }
      }
    }
    const totalSelected = selectedIds.dancers.length + selectedIds.props.length + selectedIds.obstacles.length;
    
    if (stageGeometry.yAxis === "bottom-up") {
      if (totalSelected > 0) {
        let stageYMeters = pxToStageMeters({x: 0, y: -stagePositionRef.current.y}, stageGeometry, pixelsPerMeter).y;
        let topThresholdM = stageYMeters - (METER_PX * 2)/pixelsPerMeter;
        let bottomThresholdM = stageYMeters - (size.height - 78)/pixelsPerMeter + bottomMarginM + 1;
        if (totalSelected === 1) {
          let y = 0;
          if (selectedObjects.dancers.length === 1) {
            y = selectedObjects.dancers[0].y;
          } else if (selectedObjects.props.length === 1) {
            const pos = selectedObjects.props[0];
            y = pos.y + currentChoreo.props[pos.propId].length;
          } else {
            const obstacle = selectedObjects.obstacles[0];
            y = obstacle.y + obstacle.length;
          }
          if (y > topThresholdM || y < bottomThresholdM) {
            const newYPx = -stageMetersToPx({x: 0, y: y}, stageGeometry, pixelsPerMeter).y;
            if (y > stageYMeters) {
              newPosition.y = newYPx + (size.height - bottomMarginM * pixelsPerMeter) / 2;
            } else if (y > topThresholdM) {
              newPosition.y = newYPx + METER_PX * 2;
            } else {
              newPosition.y = newYPx + (size.height - bottomMarginM * pixelsPerMeter) * 0.7;
            }
          }
        } else if (totalSelected > 1) {
          const frontmostY = Math.max(
            ...Object.values(selectedObjects.dancers).map(x => x.y),
            ...Object.values(selectedObjects.props).map(x => x.y - currentChoreo.props[x.propId].length),
            ...Object.values(selectedObjects.obstacles).map(x => x.y - x.length)
          );
          const backmostY = Math.min(
            ...Object.values(selectedObjects.dancers).map(x => x.y),
            ...Object.values(selectedObjects.props).map(x => x.y - currentChoreo.props[x.propId].length),
            ...Object.values(selectedObjects.obstacles).map(x => x.y - x.length)
          );

          if (frontmostY > stageYMeters) {
            const newYPx = -stageMetersToPx({x: 0, y: frontmostY}, stageGeometry, pixelsPerMeter).y;
            newPosition.y = newYPx + (size.height - bottomMarginM * pixelsPerMeter) / 2;
          } else if (frontmostY > topThresholdM) {
            const newYPx = -stageMetersToPx({x: 0, y: frontmostY}, stageGeometry, pixelsPerMeter).y;
            newPosition.y = newYPx + METER_PX * 2;
          } else if (backmostY < bottomThresholdM && (frontmostY - backmostY) < (size.height / pixelsPerMeter)) {
            const newYPx = -stageMetersToPx({x: 0, y: backmostY}, stageGeometry, pixelsPerMeter).y;
            newPosition.y = newYPx + (size.height - bottomMarginM * pixelsPerMeter);
          }
        }
      } else if (!isManualMovement) {
        const frontmostY = Math.max(
          ...Object.values(currentSection.formation.dancerPositions).map(x => x.y)
        );
        newPosition.y = -stageMetersToPx({x: 0, y: frontmostY + 2}, stageGeometry, pixelsPerMeter).y + METER_PX;
      }
    } else {
      if (totalSelected === 1) {
        let topY = 0;
        let bottomY = 0;
        if (selectedObjects.dancers.length === 1) {
          topY = bottomY = selectedObjects.dancers[0].y;
        } else if (selectedObjects.props.length === 1) {
          const pos = selectedObjects.props[0];
          topY = pos.y;
          bottomY = topY + currentChoreo.props[pos.propId].length
        } else {
          const obstacle = selectedObjects.obstacles[0];
          topY = obstacle.y;
          bottomY = topY + obstacle.length
        }
        // let y = [...selectedObjects.dancers, ...selectedObjects.props, ...selectedObjects.obstacles][0].y;
        let stageYMeters = pxToStageMeters({x: 0, y: -stagePositionRef.current.y}, stageGeometry, pixelsPerMeter).y;
        
        let topThresholdM = stageYMeters + 1;
        let bottomThresholdM = stageYMeters + (size.height - 78)/pixelsPerMeter;
        if (topY < topThresholdM || bottomY > bottomThresholdM) {
          if (topY < stageYMeters) {
            let newYPx = -stageMetersToPx({x: 0, y: topY}, stageGeometry, pixelsPerMeter).y;
            newPosition.y = newYPx + (size.height - bottomMarginM * pixelsPerMeter) / 2 - METER_PX * 2;
          } else if (topY < topThresholdM) {
            let newYPx = -stageMetersToPx({x: 0, y: topY}, stageGeometry, pixelsPerMeter).y;
            newPosition.y = newYPx + METER_PX * 2;
          } else {
            let newYPx = -stageMetersToPx({x: 0, y: bottomY}, stageGeometry, pixelsPerMeter).y;
            newPosition.y = newYPx + (size.height - bottomMarginM * pixelsPerMeter);
          }
        }
      }
    }
    
    if (newPosition.x !== stagePositionRef.current.x || newPosition.y !== stagePositionRef.current.y) {
      setRulerPos(newPosition);
      stageRef?.current?.to({
        x: newPosition.x,
        y: newPosition.y,
        duration: 1,
        easing: Konva.Easings.EaseInOut,
        onFinish: () => {
          setIsSelectingNewSection(false);
          setStagePosition(newPosition);
        }
      });
    }
  }, [stageRef, currentSection, selectedIds, selectedObjects, stagePositionRef.current, stageGeometry, bottomMarginPercent]);

  const resetCamera = () => {
    setIsManualMovement(false);
    if (!stageGeometry) return;
    
    let newPosition = {x: stagePositionRef.current.x, y: stagePositionRef.current.y};

    if (selectedIds.dancers.length === 1) {
      let x = selectedObjects.dancers[0].x;
      newPosition.x = (size.width - (isShowingVerticalRuler ? 32 : 0))/2 - stageMetersToPx({x: x, y: 0}, stageGeometry, pixelsPerMeter).x;
    } else {
      newPosition.x = centerXPx;
    }

    if (stageGeometry.yAxis === "bottom-up") {
      if (selectedIds.dancers.length === 1) {
        let y = selectedObjects.dancers[0].y;
        newPosition.y = -stageMetersToPx({x: 0, y: y}, stageGeometry, pixelsPerMeter).y + (size.height - bottomMarginM * pixelsPerMeter) / 2;
      } else if (selectedIds.dancers.length > 1) {
        let y = selectedObjects.dancers.reduce((sum, d) => sum + d.y, 0) / selectedObjects.dancers.length;
        newPosition.y = -stageMetersToPx({x: 0, y: y}, stageGeometry, pixelsPerMeter).y + (size.height - bottomMarginM * pixelsPerMeter) / 2;
      } else {
        let frontmostY = Math.max(
          ...Object.values(currentSection.formation.dancerPositions).map(x => x.y)
        );
        newPosition.y = -stageMetersToPx({x: 0, y: frontmostY + 2}, stageGeometry, pixelsPerMeter).y + METER_PX;
      }
    } else {
      newPosition.y = 0;
    }
    
    if (newPosition.y !== stagePositionRef.current.y) {
      setRulerPos(newPosition);
      stageRef?.current?.to({
        x: newPosition.x,
        y: newPosition.y,
        duration: 1,
        easing: Konva.Easings.EaseInOut,
        onFinish: () => {
          setIsSelectingNewSection(false);
          setStagePosition(newPosition);
        }
      });
    }
  };

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

    if (!isManualMovement) {
      setIsManualMovement(true);
    }
    setStageScale({ x: newScale, y: newScale });

    // const newPos = {
    //   x: pointer.x - mousePointTo.x * newScale,
    //   y: pointer.y - mousePointTo.y * newScale,
    // };
    // stage.position(newPos);
  };
  
  const [lastCenter, setLastCenter] = useState<any>(null);
  const [lastDist, setLastDist] = useState(0);
  const [dragStopped, setDragStopped] = useState(false);

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

      if (!isZooming.current) {
        isZooming.current = true;
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

      if (!isManualMovement) {
        setIsManualMovement(true);
      }

      setStagePosition({...newPosition});
      setRulerPos({...newPosition});

      setLastDist(dist);
      setLastCenter(newCenter);
    }
  }, [dragStopped, lastCenter, lastDist, stagePos, stageScale, isZooming]);

  const handleTouchEnd = () => {
    setLastDist(0);
    setLastCenter(null);
    if (isZooming.current) isZooming.current = false;
  };

  const handleDragEnd = (e: any) => {
    setDragStopped(false);
    // Ensure stage position is synchronized with our reactive state
    const stage = e.target.getStage();
    setStagePosition({ x: stage.x(), y: stage.y() });
  };

  const verticalGridIncrement = useMemo(() => {    
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
  
  return <div ref={containerRef} className="w-full h-full overflow-auto">
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
            if (!isManualMovement) {
              setIsManualMovement(true);
            }
          }
        }}
        onPointerUp={(e) => {
          if (clickedOnEmpty && isDraggingOnEmpty === undefined) {
            if (canEdit) {
              setSelectedIds({props: [], dancers: [], obstacles: []});
            }
            const stagePosition = e.target.getStage();
            
            if ((isAddingDancer || isAddingProp || isAddingObstacles) && stagePosition) {
              let position = {
                x: (e.evt.x - stagePosition.attrs.x)/stagePosition.attrs.scaleX,
                y: (e.evt.y - stagePosition.attrs.y - stageGeometry.margin.topMargin * METER_PX) / stagePosition.attrs.scaleY
              }

              if (appSettings.snapToGrid) {
                position = snapCoordsToGrid(position, METER_PX/2)
              }

              const positionM = pxToStageMeters(position, stageGeometry, METER_PX, isAddingProp ? DEFAULT_PROP_LENGTH : 0);
              
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
          (showPaths || isEditingMovement) && movementCache &&
          <GhostLayer
            dancers={currentChoreo.dancers}
            prevDancerPositions={previousSection?.formation.dancerPositions}
            movementCache={movementCache[currentSection.id]}
            props={currentChoreo.props}
            propPositions={previousSection ? Object.values(previousSection?.formation.propPositions) : undefined}
            geometry={stageGeometry}
            selectedDancerId={selectedIds.dancers[0]}
            isEditingPaths={isEditingMovement}
          />
        }
        <FormationLayer
          canEdit={canEdit && editEnabled === true}
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
          canResizeProps={canResizeProps}
          isZooming={isZooming}
          />
        {
          selectedDancerMovement &&
          <NextDirectionLayer
            geometry={stageGeometry}
            currentPosition={selectedDancerMovement.current}
            nextPosition={selectedDancerMovement.next}
          />
        }
        {
          isEditingMovement &&
          <MovementEditLayer
            prevPosition={previousSection?.formation.dancerPositions[selectedIds.dancers[0]]}
            currentPosition={currentSection?.formation.dancerPositions[selectedIds.dancers[0]]}
            onMidpointEdit={() => {}} // todo
            movement={currentSection?.formation.dancerMovements?.[selectedIds.dancers[0]]}
            dancer={currentChoreo.dancers[selectedIds.dancers[0]]}
            geometry={stageGeometry}
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
        setIsShowingHorizontalRuler={(value) => setIsShowingHorizontalRuler(value)}
        setIsShowingVerticalRuler={(value) => setIsShowingVerticalRuler(value)}
      />
    }
    {
      (isManualMovement || canEdit) &&
      <div className={`absolute space-y-1 ${isShowingVerticalRuler ? "right-9" : "right-2"} ${isShowingHorizontalRuler ? "top-7" : "top-1"}`}>
        {
          isManualMovement &&
          <IconButton
            size="sm"
            src="centerFocusStrong"
            colour="black"
            onClick={() => resetCamera()}
          />
        }
        {
          canEdit &&
          <IconButton
            size="sm"
            src={(canEdit && editEnabled) ? "edit" : "editOff"}
            colour="black"
            onClick={toggleEditEnabled}
          />
        }
      </div>
    }
  </div>
}
