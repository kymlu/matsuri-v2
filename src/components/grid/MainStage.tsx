import { Stage } from "react-konva";
import GridLayer from "./layers/GridLayer";
import { memo, useState, useCallback, useEffect, useRef, SetStateAction, useMemo } from "react";
import { Choreo, StageGeometry } from "../../models/choreo";
import FormationLayer from "./layers/FormationLayer";
import { ChoreoSection, Movement, MovementCacheBySectionIdByObjectId, PathSvgCacheByObjectIdBySectionId } from "../../models/choreoSection";
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
import PreviewRoutesLayer, { PreviewRoute } from "./layers/PreviewRoutesLayer";
import { useTheme } from "../../lib/helpers/themeHelper";

Konva.hitOnDragEnabled = true;

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

type MainStageProps = {
  canEdit: boolean,
  canToggleSelection: boolean,
  canSelectDancers: boolean,
  dimDancers?: boolean,
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
  openNoteDialog?: () => void,
  openChangeLog?: () => void,
  // Shows the 🔰 help button at the top left.
  openHelp?: () => void,
  openFind?: () => void,
  // Toggle for fading the dancers out to see props; under the centre button in both edit and view mode.
  dimDancersToggle?: { dimmed: boolean, onToggle: () => void },
  // Bump to centre the selection at the current zoom, e.g. after finding it by name.
  focusSelectionRequest?: number,
  showPaths?: boolean,
  isEditingMovement?: boolean,
  mutedGhostPaths?: boolean, // ghost paths in grey (the editor), so the path being edited is the red one
  dancerMovementCache: MovementCacheBySectionIdByObjectId,
  propMovementCache?: MovementCacheBySectionIdByObjectId,
  onMidpointEdit?: (newMovement: Movement) => void;
  currentMovement?: Movement,
  dancerAnimationCache: PathSvgCacheByObjectIdBySectionId,
  propAnimationCache: PathSvgCacheByObjectIdBySectionId,
  // 最短距離 preview: left-out people faint, routes underneath.
  fadedDancerIds?: ReadonlySet<string>,
  halfFadedDancerIds?: ReadonlySet<string>,
  previewRoutes?: { routes: PreviewRoute[], kind: "now" | "after" },
  instantMoves?: boolean, // jump to new positions instead of animating
  dimPropsAndObstacles?: boolean, // props and obstacles faint, so routes drawn underneath show through
  // Height of a sheet over the bottom; the camera fits the routes above it.
  bottomOverlayHeight?: number,
}

function MainStage({
  canEdit, canToggleSelection,
  canSelectDancers, canSelectProps, canSelectObstacles, dimDancers,
  isAddingDancer, isAddingProp, isAddingObstacles,
  hideTransformerBorder, currentChoreo, currentSection,
  updateDancerPosition, updatePropPosition, updateObstaclePosition,
  updatePropSizeAndRotate, updateObstacleSizeAndRotate,
  selectedIds, setSelectedIds, selectedObjects,
  addDancer, addProp, addObstacle, appSettings, previousSection, selectedDancerMovement,
  onDancerSelected, bottomMarginPercent = 0, canResizeProps, editEnabled, toggleEditEnabled, openNoteDialog, openChangeLog, openHelp, openFind, dimDancersToggle, focusSelectionRequest,
  showPaths = false, isEditingMovement = false, mutedGhostPaths = false, dancerMovementCache, propMovementCache, onMidpointEdit, currentMovement,
  dancerAnimationCache, propAnimationCache, fadedDancerIds, halfFadedDancerIds, previewRoutes, instantMoves, dimPropsAndObstacles, bottomOverlayHeight,
}: MainStageProps) {
  // Konva reads colours from the (non-reactive) colorPalette, so remount the
  // whole Stage subtree when the theme flips to force every layer to redraw.
  const [theme] = useTheme();
  // Derived in the same render as the section, so settings never lag a frame.
  const dancerPositions = useMemo<DancerPosition[]>(
    () => currentSection.formation.dancerPositions ? sortDancers(Object.values(currentSection.formation.dancerPositions)) : [],
    [currentSection.formation.dancerPositions]);
  const propPositions = useMemo<PropPosition[]>(
    () => currentSection.formation.propPositions ? sortProps(Object.values(currentSection.formation.propPositions)) : [],
    [currentSection.formation.propPositions]);
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
  
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  // Width left for the stage once centred: the vertical ruler shows whenever the stage runs past the right edge,
  // which a centred stage does exactly when it's wider than the screen.
  const centringWidth = useMemo(() => {
    if (!stageGeometry) return size.width;
    const totalWidthPx = (stageGeometry.stageWidth + stageGeometry.margin.leftMargin + stageGeometry.margin.rightMargin) * pixelsPerMeter;
    return size.width - (totalWidthPx > size.width ? 32 : 0);
  }, [size.width, stageGeometry, pixelsPerMeter]);
  // Camera x that puts this stage x (metres) in the middle of the screen; the whole stage's middle when omitted.
  const centredX = useCallback((xMetres?: number) => {
    if (!stageGeometry) return 0;
    if (xMetres !== undefined) return centringWidth/2 - stageMetersToPx({x: xMetres, y: 0}, stageGeometry, pixelsPerMeter).x;
    const totalWidthPx = (stageGeometry.stageWidth + stageGeometry.margin.leftMargin + stageGeometry.margin.rightMargin) * pixelsPerMeter;
    return (centringWidth - totalWidthPx)/2;
  }, [stageGeometry, centringWidth, pixelsPerMeter]);

  const allDancerIds = useMemo(() => {
    return Object.keys(currentChoreo.dancers);
  }, [currentChoreo.dancers]);

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
  const setStagePosition = useCallback((newValue: Coordinates) => {
    stagePositionRef.current = newValue;
    setStagePos(newValue);
  }, []);
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
    if (size.width === 0) return;
    const firstView = stagePosSectionId === "";
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
    
    // On opening, centre on the selected person, or on the stage; later, keep the stage centred until it's moved by hand.
    const nothingSelected = selectedIds.dancers.length + selectedIds.props.length + selectedIds.obstacles.length === 0;
    if (firstView || (nothingSelected && !isManualMovement)) {
      newPosition.x = centredX(selectedIds.dancers.length === 1 ? selectedObjects.dancers[0].x : undefined);
    }
    if (firstView) {
      setRulerPos(newPosition);
      setStagePosition(newPosition);
      setIsSelectingNewSection(false);
    } else if (newPosition.x !== stagePositionRef.current.x || newPosition.y !== stagePositionRef.current.y) {
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
  }, [stageRef, currentSection, selectedIds, selectedObjects, stagePositionRef.current, stageGeometry, bottomMarginPercent, size.width]);

  // Keep an untouched stage centred when the screen changes size (rotation, rulers appearing).
  useEffect(() => {
    if (!stageGeometry || stagePosSectionId === "" || isManualMovement || bottomOverlayHeight !== undefined) return;
    if (selectedIds.dancers.length + selectedIds.props.length + selectedIds.obstacles.length > 0) return;
    const x = centredX();
    if (x === stagePositionRef.current.x) return;
    const position = { x, y: stagePositionRef.current.y };
    setStagePosition(position);
    setRulerPos(position);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centredX]);

  const [overlayRefit, setOverlayRefit] = useState(0);
  const resetCamera = useCallback(() => {
    if (bottomOverlayHeight !== undefined) {
      setOverlayRefit(n => n + 1);
      return;
    }
    setIsManualMovement(false);
    if (!stageGeometry) return;
    
    let newPosition = {x: stagePositionRef.current.x, y: stagePositionRef.current.y};

    newPosition.x = centredX(selectedIds.dancers.length === 1 ? selectedObjects.dancers[0].x : undefined);

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
  }, [stageGeometry, selectedIds.dancers, selectedObjects.dancers, size.height, centredX, bottomMarginM, pixelsPerMeter, currentSection.formation.dancerPositions, setStagePosition, bottomOverlayHeight]);

  // Fit the routes above the sheet by moving the camera only (zooming out if needed); restore it after.
  const cameraBeforeOverlay = useRef<{ scale: Coordinates, position: Coordinates, manual: boolean } | undefined>(undefined);
  const overlayFit = useRef<{ height: number, refit: number, geometry: StageGeometry } | undefined>(undefined);
  useEffect(() => {
    if (!stageGeometry || size.width === 0) return;
    if (bottomOverlayHeight === undefined) {
      overlayFit.current = undefined;
      const before = cameraBeforeOverlay.current;
      if (!before) return;
      cameraBeforeOverlay.current = undefined;
      setStageScale(before.scale);
      setStagePosition(before.position);
      setRulerPos(before.position);
      setIsManualMovement(before.manual);
      return;
    }
    // Resizing under the sheet: keep the zoom and the front centre where they are instead of refitting.
    const fitted = overlayFit.current;
    if (fitted && fitted.height === bottomOverlayHeight && fitted.refit === overlayRefit) {
      if (fitted.geometry === stageGeometry) return;
      const anchor = (g: StageGeometry) => ({ x: (g.margin.leftMargin + g.stageWidth / 2) * pixelsPerMeter, y: g.margin.topMargin * pixelsPerMeter });
      const from = anchor(fitted.geometry), to = anchor(stageGeometry);
      const position = { x: stagePositionRef.current.x + from.x - to.x, y: stagePositionRef.current.y + from.y - to.y };
      overlayFit.current = { height: bottomOverlayHeight, refit: overlayRefit, geometry: stageGeometry };
      setStagePosition(position);
      setRulerPos(position);
      return;
    }
    overlayFit.current = { height: bottomOverlayHeight, refit: overlayRefit, geometry: stageGeometry };
    if (!cameraBeforeOverlay.current) {
      cameraBeforeOverlay.current = { scale: stageScale, position: stagePositionRef.current, manual: isManualMovement };
    }
    const containerBottom = containerRef.current?.getBoundingClientRect().bottom ?? window.innerHeight;
    const covered = Math.max(0, containerBottom - (window.innerHeight - bottomOverlayHeight));
    const visible = { width: size.width - (isShowingVerticalRuler ? 32 : 0), height: Math.max(1, size.height - covered) };
    const ends = (previewRoutes?.routes ?? []).flatMap(r => [r.from, r.to]);
    const box = ends.length > 0
      ? {
          left: Math.min(...ends.map(p => p.x)) - 1, right: Math.max(...ends.map(p => p.x)) + 1,
          top: Math.min(...ends.map(p => p.y)) - 1, bottom: Math.max(...ends.map(p => p.y)) + 1,
        }
      : { left: 0, right: stageGeometry.stageWidth, top: 0, bottom: stageGeometry.stageLength };
    const scale = clampScale(Math.min(
      cameraBeforeOverlay.current.scale.x,
      visible.width / ((box.right - box.left) * METER_PX),
      visible.height / ((box.bottom - box.top) * METER_PX)));
    const a = stageMetersToPx({ x: box.left, y: box.top }, stageGeometry, METER_PX * scale);
    const b = stageMetersToPx({ x: box.right, y: box.bottom }, stageGeometry, METER_PX * scale);
    const position = {
      x: visible.width / 2 - (a.x + b.x) / 2,
      y: visible.height / 2 - (a.y + b.y) / 2,
    };
    setIsManualMovement(true);
    setStageScale({ x: scale, y: scale });
    setStagePosition(position);
    setRulerPos(position);
  // Fit when the sheet height is given (once per opening), not when flipping 今／最短.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bottomOverlayHeight, size.width, size.height, stageGeometry, overlayRefit]);

  // Declared after the selection-following effect so its pan wins when both run together.
  // The bottom panel grows once a dancer is selected, so the pan is redone while it settles.
  const focusUntil = useRef(0);
  useEffect(() => {
    if (focusSelectionRequest) focusUntil.current = Date.now() + 1500;
  }, [focusSelectionRequest]);
  useEffect(() => {
    if (Date.now() > focusUntil.current || !stageGeometry) return;
    // The middle of everything selected (dancers by centre, props by their box), kept at the current zoom.
    const points = [
      ...selectedObjects.dancers.map(d => [{x: d.x, y: d.y}]),
      ...selectedObjects.props.map(pos => {
        const prop = currentChoreo.props[pos.propId];
        return [{x: pos.x, y: pos.y}, {x: pos.x + (prop?.width ?? 0), y: pos.y + (prop?.length ?? 0)}];
      }),
    ].flat();
    if (points.length === 0) return;
    const centre = {
      x: (Math.min(...points.map(p => p.x)) + Math.max(...points.map(p => p.x))) / 2,
      y: (Math.min(...points.map(p => p.y)) + Math.max(...points.map(p => p.y))) / 2,
    };
    const dancerPx = stageMetersToPx(centre, stageGeometry, pixelsPerMeter);
    // Centre in the part of the stage the bottom panel doesn't cover, measured from the page.
    const drawerTop = document.querySelector("[data-bottom-drawer]")?.getBoundingClientRect().top;
    const containerTop = containerRef.current?.getBoundingClientRect().top;
    const visibleHeight = drawerTop !== undefined && containerTop !== undefined
      ? Math.max(0, Math.min(size.height, drawerTop - containerTop))
      : size.height - bottomMarginM * pixelsPerMeter;
    const newPosition = {
      x: (size.width - (isShowingVerticalRuler ? 32 : 0)) / 2 - dancerPx.x,
      y: visibleHeight / 2 - dancerPx.y,
    };
    setIsManualMovement(true); // keeps the reset-camera button, so the usual view is one tap away
    setRulerPos(newPosition);
    stageRef?.current?.to({
      x: newPosition.x,
      y: newPosition.y,
      duration: 0.6,
      easing: Konva.Easings.EaseInOut,
      onFinish: () => setStagePosition(newPosition),
    });
  // Runs on a new request, and again if the visible area changes while it settles.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSelectionRequest, bottomMarginM, size.height]);

  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();

    const oldScale = stageScale.x;

    // zoom in on up and out on down
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
  }, [stageScale.x, isManualMovement]);

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
  }, [dragStopped, lastCenter, lastDist, stagePos, stageScale, isZooming, setStagePosition]);

  const handleTouchEnd = useCallback(() => {
    setLastDist(0);
    setLastCenter(null);
    if (isZooming.current) isZooming.current = false;
  }, [isZooming]);

  const handleDragEnd = useCallback((e: any) => {
    setDragStopped(false);
    // Ensure stage position is synchronized with our reactive state
    const stage = e.target.getStage();
    setStagePosition({ x: stage.x(), y: stage.y() });
  }, [setStagePosition]);

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
  }, [pixelsPerMeter])

  const onStagePointerDown = useCallback((e: any) => {
    setClickedOnEmpty(e.target === e.target.getStage());
  }, []);

  const onStageDragStart = useCallback(() => {
    setIsDraggingOnEmpty(clickedOnEmpty);
  }, [clickedOnEmpty]);

  const onStageDragMove = useCallback((e: any) => {
    if (e.target === e.target.getStage()) {
      setRulerPos({x: e.target.x(), y: e.target.y()})
      if (!isManualMovement) {
        setIsManualMovement(true);
      }
    }
  }, [isManualMovement]);

  const onStagePointerUp = useCallback((e: any) => {
    if (clickedOnEmpty && isDraggingOnEmpty === undefined) {
      if (canEdit) {
        setSelectedIds({props: [], dancers: [], obstacles: []});
      }
      const stagePosition = e.target.getStage();

      if ((isAddingDancer || isAddingProp || isAddingObstacles) && stagePosition && stageGeometry) {
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
  }, [clickedOnEmpty, isDraggingOnEmpty, canEdit, isAddingDancer, isAddingProp, isAddingObstacles, stageGeometry, appSettings.snapToGrid, addDancer, addProp, addObstacle, setSelectedIds]);

  const handleMidpointEdit = useCallback((newMovement: Movement) => {
    onMidpointEdit?.(newMovement);
  }, [onMidpointEdit]);

  return <div ref={containerRef} className="w-full h-full overflow-auto">
    {
      stageGeometry && 
      <Stage
        key={theme}
        ref={stageRef}
        onPointerDown={onStagePointerDown}
        onDragStart={onStageDragStart}
        onDragMove={onStageDragMove}
        onPointerUp={onStagePointerUp}
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
          (showPaths || isEditingMovement) && dancerMovementCache && propMovementCache &&
          <GhostLayer
            dancerIds={allDancerIds}
            prevDancerPositions={previousSection?.formation.dancerPositions}
            dancerSvgCache={dancerAnimationCache}
            propSvgCache={propAnimationCache}
            props={currentChoreo.props}
            prevPropPositions={previousSection?.formation.propPositions}
            geometry={stageGeometry}
            selectedId={selectedIds.dancers[0]}
            isEditingPaths={isEditingMovement}
            mutedPaths={mutedGhostPaths}
            prevSectionId={previousSection?.id}
            sectionId={currentSection.id}
          />
        }
        {
          previewRoutes &&
          <PreviewRoutesLayer geometry={stageGeometry} routes={previewRoutes.routes} kind={previewRoutes.kind} largeDancers={appSettings.dancerDisplayType === "large"}/>
        }
        <FormationLayer
          canEdit={canEdit && editEnabled === true}
          hideTransformerBorder={hideTransformerBorder}
          canSelectDancers={canSelectDancers && !dimDancers}
          dimDancers={dimDancers}
          fadedDancerIds={fadedDancerIds}
          halfFadedDancerIds={halfFadedDancerIds}
          instantMoves={instantMoves}
          dimPropsAndObstacles={dimPropsAndObstacles}
          canSelectProps={canSelectProps}
          canSelectObstacles={canSelectObstacles}
          canToggleSelection={canToggleSelection}
          geometry={stageGeometry}
          dancers={currentChoreo.dancers}
          dancerPositions={dancerPositions}
          props={currentChoreo.props}
          propPositions={propPositions}
          obstacles={currentChoreo.obstacles}
          dancerStacks={currentSection.formation.dancerStacks}
          propStacks={currentSection.formation.propStacks}
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
          sectionId={currentSection.id}
          isEditingMovement={isEditingMovement}
          dancerAnimationCache={dancerAnimationCache}
          propAnimationCache={propAnimationCache}
          />
        {
          selectedDancerMovement &&
          <NextDirectionLayer
            geometry={stageGeometry}
            currentPosition={selectedDancerMovement.current}
            nextPosition={selectedDancerMovement.next}
            dancerMovementCache={dancerMovementCache[currentSection.id]}
            dimmed={dimDancers}
          />
        }
        {
          isEditingMovement &&
          <MovementEditLayer
            prevPosition={
              selectedIds.dancers[0] ?
              previousSection?.formation.dancerPositions[selectedIds.dancers[0]] :
              previousSection?.formation.propPositions[selectedIds.props[0]]}
            currentPosition={
              selectedIds.dancers[0] ?
              currentSection?.formation.dancerPositions[selectedIds.dancers[0]] :
              currentSection?.formation.propPositions[selectedIds.props[0]]
            }
            onMidpointEdit={handleMidpointEdit}
            movement={currentMovement}
            geometry={stageGeometry}
            prop={selectedObjects.props[0] ? currentChoreo.props[selectedObjects.props[0].propId] : undefined}
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
        viewWidth={size.width}
        isSelectingNewSection={isSelectingNewSection}
        setIsShowingHorizontalRuler={setIsShowingHorizontalRuler}
        setIsShowingVerticalRuler={setIsShowingVerticalRuler}
      />
    }
    {
      ((canEdit && openNoteDialog) || openChangeLog || openHelp || openFind) &&
      <div className={`absolute space-y-1 left-2 ${isShowingHorizontalRuler ? "top-7" : "top-1"}`}>
        {
          openHelp &&
          <IconButton
            size="sm"
            imgSrc={theme === "dark" ? "beginnerDark" : "beginner"}
            colour="primary"
            onClick={openHelp}
          />
        }
        {
          openChangeLog &&
          <IconButton
            size="sm"
            src="releaseAlert"
            colour="primary"
            onClick={openChangeLog}
          />
        }
        {
          openFind &&
          <IconButton
            size="sm"
            src="search"
            colour="black"
            onClick={openFind}
          />
        }
        {
          canEdit && openNoteDialog &&
          <IconButton
            size="sm"
            src="speakerNotes"
            colour="black"
            onClick={openNoteDialog}
          />
        }
      </div>
    }
    {
      (isManualMovement || canEdit || dimDancersToggle) &&
      <div className={`absolute space-y-1 ${isShowingVerticalRuler ? "right-9" : "right-2"} ${isShowingHorizontalRuler ? "top-7" : "top-1"}`}>
        {
          isManualMovement &&
          <IconButton
            size="sm"
            src="centerFocusStrong"
            colour="black"
            onClick={resetCamera}
          />
        }
        {
          dimDancersToggle &&
          <IconButton
            size="sm"
            src="person"
            crossedOut={dimDancersToggle.dimmed}
            colour="black"
            onClick={dimDancersToggle.onToggle}
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

export default memo(MainStage);
