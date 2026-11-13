import { Layer, Transformer } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { Dancer, DancerPosition } from "../../../models/dancer";
import DancerGridObject from "../gridObjects/DancerGridObject";
import Konva from "konva";
import { memo, SetStateAction, useCallback, useEffect, useMemo, useRef } from "react";
import { colorPalette } from "../../../lib/consts/colors";
import { DancerDisplayType } from "../../../models/appSettings";
import { Obstacle, Prop, PropPosition } from "../../../models/prop";
import PropGridObject from "../gridObjects/PropGridObject";
import { StageEntities } from "../../../models/history";
import { pxToStageMeters } from "../../../lib/helpers/editorCalculationHelper";
import { MAX_PROP_DIMENSION, METER_PX, MIN_PROP_DIMENSION, PROP_SNAP_SIZE } from "../../../lib/consts/consts";
import ObstacleGridObject from "../gridObjects/ObstacleGridObject";
import { PathSvgCacheByObjectIdBySectionId } from "../../../models/choreoSection";

type FormationLayerProps = {
  canEdit: boolean,
  canSelectDancers: boolean,
  dimDancers?: boolean, // focusing on props: dancers faint and can't be touched
  canSelectProps: boolean,
  canSelectObstacles: boolean,
  canToggleSelection: boolean,
  hideTransformerBorder?: boolean,
  dancers: Record<string, Dancer>,
  dancerPositions: DancerPosition[],
  props: Record<string, Prop>,
  propPositions: PropPosition[],
  obstacles?: Record<string, Obstacle>,
  geometry: StageGeometry,
  updateDancerPosition?: (x: number, y: number, dancerId: string) => void,
  updatePropPosition?: (x: number, y: number, propId: string) => void,
  updatePropSizeAndRotate?: (width: number, length: number, rotation: number, x: number, y: number, propId: string) => void
  updateObstaclePosition?: (x: number, y: number, itemId: string) => void,
  updateObstacleSizeAndRotate?: (width: number, length: number, rotation: number, x: number, y: number, itemId: string) => void
  selectedIds: StageEntities<string[]>,
  setSelectedIds: (action: SetStateAction<StageEntities<string[]>>) => void,
  snapToGrid?: boolean,
  dancerDisplayType: DancerDisplayType,
  isDraggingOnEmpty?: boolean,
  onDancerSelected?: () => void,
  canResizeProps?: boolean,
  isZooming: React.RefObject<boolean>;
  sectionId: string;
  dancerAnimationCache: PathSvgCacheByObjectIdBySectionId;
  propAnimationCache: PathSvgCacheByObjectIdBySectionId;
  isEditingMovement?: boolean,
  dancerStacks?: string[][],
  propStacks?: string[][],
};

const FormationLayer = memo(function FormationLayer({
  canEdit,
  canSelectDancers,
  dimDancers,
  canSelectProps,
  canSelectObstacles,
  canToggleSelection,
  dancers,
  dancerPositions,
  props,
  propPositions,
  obstacles,
  geometry,
  updateDancerPosition,
  updatePropPosition,
  updatePropSizeAndRotate,
  updateObstaclePosition,
  updateObstacleSizeAndRotate,
  selectedIds,
  setSelectedIds,
  snapToGrid,
  hideTransformerBorder,
  dancerDisplayType,
  isDraggingOnEmpty,
  onDancerSelected,
  canResizeProps,
  isZooming,
  sectionId,
  dancerAnimationCache, propAnimationCache, isEditingMovement,
  dancerStacks, propStacks,
}: FormationLayerProps) {
	const transformerRef = useRef<Konva.Transformer>(null);

  const nodeMap = useRef<Map<string, Konva.Node>>(new Map());

	function refreshTransformer() {
		transformerRef.current?.forceUpdate();
	}

  const updateTransformer = useCallback(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const nodes = [
      ...selectedIds.dancers.map((id) => nodeMap.current.get(id)).filter(Boolean),
      ...selectedIds.props.map((id) => nodeMap.current.get(id)).filter(Boolean),
      ...selectedIds.obstacles.map((id) => nodeMap.current.get(id)).filter(Boolean)
    ] as Konva.Node[];

    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedIds]);

  const registerNode = useCallback((id: string, node: Konva.Node | null) => {
    if (node) {
      nodeMap.current.set(id, node);
    } else {
      nodeMap.current.delete(id);
    }
    updateTransformer();
  }, [updateTransformer]);

  const toggleDancerSelect = useCallback((id: string, isAdditive: boolean = true) => {
    if(canSelectDancers && !isDraggingOnEmpty) {
      setSelectedIds((prev) => ({
        props: isAdditive && canToggleSelection ? [...prev.props] : [],
        dancers: (canToggleSelection && isAdditive) ?
          (prev.dancers.includes(id) ?
            prev.dancers.filter((x) => x !== id) :
            [...prev.dancers, id]) :
          [id],
        obstacles: isAdditive && canToggleSelection ? [...prev.obstacles] : [],
      }));
    }
  }, [canSelectDancers, isDraggingOnEmpty, canToggleSelection, setSelectedIds]);

  const togglePropSelect = useCallback((id: string, isAdditive: boolean = true) => {
    if(canSelectProps && !isDraggingOnEmpty) {
      setSelectedIds((prev) => ({
        dancers: isAdditive && canToggleSelection ? [...prev.dancers] : [],
        props: (canToggleSelection && isAdditive) ?
          (prev.props.includes(id) ?
            prev.props.filter((x) => x !== id) :
            [...prev.props, id]) :
          [id],
        obstacles: isAdditive && canToggleSelection ? [...prev.obstacles] : [],
      }));
    }
  }, [canSelectProps, isDraggingOnEmpty, canToggleSelection, setSelectedIds]);

  const toggleObstacleSelect = useCallback((id: string, isAdditive: boolean = true) => {
    if(canSelectObstacles && !isDraggingOnEmpty) {
      setSelectedIds((prev) => ({
        dancers: isAdditive && canToggleSelection ? [...prev.dancers] : [],
        props: isAdditive && canToggleSelection ? [...prev.props] : [],
        obstacles: (canToggleSelection && isAdditive) ?
          (prev.obstacles.includes(id) ?
            prev.obstacles.filter((x) => x !== id) :
            [...prev.obstacles, id]) :
          [id],
      }));
    }
  }, [canSelectObstacles, isDraggingOnEmpty, canToggleSelection, setSelectedIds]);
    
  useEffect(() => {
    updateTransformer();
  }, [selectedIds]);

  // A resize changes the shapes inside a prop or obstacle, which the transformer doesn't notice on its own.
  // Refresh it once React has drawn the new size, so the frame fits the object again.
  useEffect(() => {
    refreshTransformer();
    transformerRef.current?.getLayer()?.batchDraw();
  }, [props, obstacles]);

  const obstacleList = useMemo(() => {
    if (obstacles) {
      return Object.values(obstacles);
    } else {
      return [];
    }
  }, [obstacles]);

  const isTransformerActive = useMemo(() => {
    return (selectedIds.dancers.length + selectedIds.props.length + selectedIds.obstacles.length) > 1
  }, [selectedIds]);

  // For the top member of each stack: whether to draw the mark, red, and the dashed "hidden one selected" ring.
  // Red is for view mode, where selecting means "acts at this count"; in the editor a whole stack is selected together.
  const stackDrawing = useCallback((stacks: string[][] | undefined, selected: string[]) => {
    const result: Record<string, { mark: "normal" | "red", hiddenSelected: boolean, count: number }> = {};
    (stacks ?? []).forEach(stack => {
      const hiddenSelected = stack.slice(0, -1).some(id => selected.includes(id));
      // Editor: red while any of the stack is selected. View: red when someone hidden is selected (acts at the count).
      const red = canEdit ? stack.some(id => selected.includes(id)) : hiddenSelected;
      result[stack[stack.length - 1]] = { mark: red ? "red" : "normal", hiddenSelected, count: stack.length };
    });
    return result;
  }, [canEdit]);
  const dancerStackDrawing = useMemo(() => stackDrawing(dancerStacks, selectedIds.dancers), [stackDrawing, dancerStacks, selectedIds.dancers]);
  const propStackDrawing = useMemo(() => stackDrawing(propStacks, selectedIds.props), [stackDrawing, propStacks, selectedIds.props]);
  const coveredDancers = useMemo(() => new Set((dancerStacks ?? []).flatMap(stack => stack.slice(0, -1))), [dancerStacks]);

  // Dragging one member of a stack brings the others along on every frame, so nothing jumps or slides into place
  // after the drop. Members the transformer already drags (the whole stack was selected when the drag began) are left to it.
  // The editor then saves the others at the same offset (moveStacksTogether), which lands exactly where they already are.
  const following = useRef<Map<string, { node: Konva.Node, x: number, y: number }[]>>(new Map());
  const followDrag = useCallback((id: string, phase: "start" | "move" | "end" | "cancel", dx = 0, dy = 0) => {
    if (phase === "start") {
      const stack = [...(dancerStacks ?? []), ...(propStacks ?? [])].find(s => s.includes(id));
      const leaderNode = nodeMap.current.get(id);
      const attached = transformerRef.current?.nodes() ?? [];
      const proxied = !!leaderNode && attached.includes(leaderNode);
      const nodes = (stack ?? [])
        .filter(member => member !== id)
        .map(member => nodeMap.current.get(member))
        .filter((node): node is Konva.Node => !!node && !(proxied && attached.includes(node)))
        .map(node => ({ node, x: node.x(), y: node.y() }));
      if (nodes.length > 0) following.current.set(id, nodes);
      else following.current.delete(id);
      return;
    }
    const nodes = following.current.get(id);
    if (!nodes) return;
    nodes.forEach(({ node, x, y }) => {
      if (phase === "end") node.to({ x: x + dx, y: y + dy }); // same 1s tween as the dragged one's snap
      else if (phase === "cancel") node.position({ x, y });
      else node.position({ x: x + dx, y: y + dy });
    });
    if (phase === "end" || phase === "cancel") following.current.delete(id);
    else nodes[0].node.getLayer()?.batchDraw();
  }, [dancerStacks, propStacks]);

  const handleDancerClick = useCallback((id: string, isAdditive?: boolean) => {
    toggleDancerSelect(id, isAdditive);
    onDancerSelected?.();
  }, [toggleDancerSelect, onDancerSelected]);

  return (
    <Layer>
      {obstacleList.map((obstacle) => {
        return (
          <ObstacleGridObject
            key={obstacle.id}
            obstacle={obstacle}
            stageGeometry={geometry}
            updatePosition={updateObstaclePosition}
            onClick={toggleObstacleSelect}
            isSelected={selectedIds.obstacles.includes(obstacle.id)}
            isTransformerActive={isTransformerActive}
            registerNode={registerNode}
            canEdit={canEdit && canSelectObstacles}
            snapToGrid={snapToGrid}
            canSelect={canSelectObstacles}
            animate={false}
            isZooming={isZooming}
          />
        );
      })}
      {propPositions.map((propPosition) => {
        return (
          <PropGridObject
            key={propPosition.propId}
            prop={props[propPosition.propId]}
            position={propPosition}
            stageGeometry={geometry}
            updatePosition={updatePropPosition}
            onClick={togglePropSelect}
            isSelected={selectedIds.props.includes(propPosition.propId)}
            isTransformerActive={isTransformerActive}
            registerNode={registerNode}
            canEdit={canEdit && canSelectProps}
            snapToGrid={snapToGrid}
            canSelect={canSelectProps}
            sectionId={sectionId}
            animate
            animationCache={propAnimationCache[propPosition.propId]}
            isZooming={isZooming}
            stackMark={propStackDrawing[propPosition.propId]?.mark}
            hiddenSelected={propStackDrawing[propPosition.propId]?.hiddenSelected}
            stackCount={propStackDrawing[propPosition.propId]?.count}
            onDragFollow={canEdit ? followDrag : undefined}
          />
        );
      })}
      {dancerPositions.map((dancerPosition) => {
        return (
          <DancerGridObject
            key={dancerPosition.dancerId}
            dancer={dancers[dancerPosition.dancerId]}
            position={dancerPosition}
            stageGeometry={geometry}
            updatePosition={updateDancerPosition}
            onClick={handleDancerClick}
            isSelected={selectedIds.dancers.includes(dancerPosition.dancerId)}
            registerNode={registerNode}
            canEdit={canEdit}
            snapToGrid={snapToGrid}
            dancerDisplayType={dancerDisplayType}
            animate
            isZooming={isZooming}
            sectionId={sectionId}
            animationCache={dancerAnimationCache[dancerPosition.dancerId]}
            stackMark={dancerStackDrawing[dancerPosition.dancerId]?.mark}
            hiddenSelected={dancerStackDrawing[dancerPosition.dancerId]?.hiddenSelected}
            stackCount={dancerStackDrawing[dancerPosition.dancerId]?.count}
            coveredInStack={coveredDancers.has(dancerPosition.dancerId)}
            dimmed={dimDancers}
            onDragFollow={canEdit ? followDrag : undefined}
          />
        );
      })}
      {
        (selectedIds.dancers.length + selectedIds.props.length + selectedIds.obstacles.length) > 0 && (
        <Transformer
          draggable
          flipEnabled={false}
          keepRatio={false}
          ref={transformerRef}
          resizeEnabled={
            selectedIds.dancers.length === 0 &&
            (selectedIds.props.length + selectedIds.obstacles.length) === 1 &&
            (canResizeProps && selectedIds.props.length === 1 ||
            selectedIds.obstacles.length === 1)
          }
          enabledAnchors={["middle-right", "middle-left", "top-center", "bottom-center"]}
          rotateEnabled={selectedIds.dancers.length === 0 && (selectedIds.props.length + selectedIds.obstacles.length) === 1}
          borderStrokeWidth={2}
          borderEnabled={(selectedIds.dancers.length > 1 || selectedIds.props.length > 0 || selectedIds.obstacles.length > 0) && !hideTransformerBorder}
          borderStroke={colorPalette.primary}
          anchorStrokeWidth={2}
          anchorStroke={colorPalette.primary}
          rotationSnaps={[
            0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210,
            225, 240, 255, 270, 285, 300, 315, 330, 345, 360,
          ]}
          rotationSnapTolerance={10}
          onTransformEnd={(event) => {
            let selectedItemType: "prop" | "obstacle" | undefined;
            let selectedItemId: string | undefined;
            let selectedWidth: number | undefined;
            let selectedLength: number | undefined;
            
            if (selectedIds.props.length === 1) {
              selectedItemId = selectedIds.props[0];
              const prop = {...props[selectedItemId]};
              if (!prop) return;
              selectedItemType = "prop";
              selectedWidth = prop.width;
              selectedLength = prop.length;
            } else if (selectedIds.obstacles.length === 1) {
              selectedItemId = selectedIds.obstacles[0];
              const obstacle = {...obstacles?.[selectedIds.obstacles[0]]};
              if (!obstacle) return;
              selectedItemType = "obstacle";
              selectedWidth = obstacle.width;
              selectedLength = obstacle.length;
            } else {
              return;
            }
            
            const group = event.target as Konva.Group;
            if (!group) return;

            const width = Math.min(Math.max(Math.round(selectedWidth!! * group.scaleX() / PROP_SNAP_SIZE) * PROP_SNAP_SIZE, MIN_PROP_DIMENSION), MAX_PROP_DIMENSION);
            const length = Math.min(Math.max(Math.round(selectedLength!! * group.scaleY() / PROP_SNAP_SIZE) * PROP_SNAP_SIZE, MIN_PROP_DIMENSION), MAX_PROP_DIMENSION);
            const newCoords = pxToStageMeters(
              {x: event.target.attrs.x, y: event.target.attrs.y},
              geometry,
              METER_PX,
              length);

            if (selectedItemType === "prop") {
              updatePropSizeAndRotate?.(
                width, length,
                event.target.attrs.rotation,
                newCoords.x, newCoords.y,
                selectedItemId);
            } else {
              updateObstacleSizeAndRotate?.(
                width, length,
                event.target.attrs.rotation,
                newCoords.x, newCoords.y,
                selectedItemId
              );
            }
            
            group.scale({ x: 1, y: 1 });

            requestAnimationFrame(() => {
              refreshTransformer();
            });
          }
        }/>
      )}
    </Layer>
  );
});

export default FormationLayer;
