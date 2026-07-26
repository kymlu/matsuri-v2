import { Layer, Transformer } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { Dancer, DancerPosition } from "../../../models/dancer";
import DancerGridObject from "../gridObjects/DancerGridObject";
import Konva from "konva";
import { memo, SetStateAction, useEffect, useMemo, useRef } from "react";
import { colorPalette } from "../../../lib/consts/colors";
import { DancerDisplayType } from "../../../models/appSettings";
import { Obstacle, Prop, PropPosition } from "../../../models/prop";
import PropGridObject from "../gridObjects/PropGridObject";
import { StageEntities } from "../../../models/history";
import { pxToStageMeters } from "../../../lib/helpers/editorCalculationHelper";
import { MAX_PROP_DIMENSION, METER_PX, MIN_PROP_DIMENSION, PROP_SNAP_SIZE } from "../../../lib/consts/consts";
import ObstacleGridObject from "../gridObjects/ObstacleGridObject";
import { PathSvgCacheByDancerIdBySectionId } from "../../../models/choreoSection";

type FormationLayerProps = {
  canEdit: boolean,
  canSelectDancers: boolean,
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
  dancerAnimationCache: PathSvgCacheByDancerIdBySectionId;
};

const FormationLayer = memo(function FormationLayer({
  canEdit,
  canSelectDancers,
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
  dancerAnimationCache,
}: FormationLayerProps) {
	const transformerRef = useRef<Konva.Transformer>(null);

  const nodeMap = useRef<Map<string, Konva.Node>>(new Map());

	function refreshTransformer() {
		transformerRef.current?.forceUpdate();
	}

  const registerNode = (id: string, node: Konva.Node | null) => {
    if (node) {
      nodeMap.current.set(id, node);
    } else {
      nodeMap.current.delete(id);
    }
  };

  const toggleDancerSelect = (id: string, isAdditive: boolean = true) => {
    if(canSelectDancers && !isDraggingOnEmpty) {
      setSelectedIds((prev) => ({
        props: isAdditive ? [...prev.props] : [],
        dancers: (canToggleSelection && isAdditive) ?
          (prev.dancers.includes(id) ?
            prev.dancers.filter((x) => x !== id) :
            [...prev.dancers, id]) :
          [id],
        obstacles: isAdditive ? [...prev.obstacles] : [],
      }));
    }
  }
  const togglePropSelect = (id: string, isAdditive: boolean = true) => {
    if(canSelectProps && !isDraggingOnEmpty) {
      setSelectedIds((prev) => ({
        dancers: isAdditive ? [...prev.dancers] : [],
        props: (canToggleSelection && isAdditive) ?
          (prev.props.includes(id) ?
            prev.props.filter((x) => x !== id) :
            [...prev.props, id]) :
          [id],
        obstacles: isAdditive ? [...prev.obstacles] : [],
      }));
    }
  }
  const toggleObstacleSelect = (id: string, isAdditive: boolean = true) => {
    if(canSelectObstacles && !isDraggingOnEmpty) {
      setSelectedIds((prev) => ({
        dancers: isAdditive ? [...prev.dancers] : [],
        props: isAdditive ? [...prev.props] : [],
        obstacles: (canToggleSelection && isAdditive) ?
          (prev.obstacles.includes(id) ?
            prev.obstacles.filter((x) => x !== id) :
            [...prev.obstacles, id]) :
          [id],
      }));
    }
  }
    
  useEffect(() => {
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

  return ( 
    <Layer>
      {obstacleList.map((obstacle) => {
        return (
          <ObstacleGridObject
            key={obstacle.id}
            obstacle={obstacle}
            stageGeometry={geometry}
            updatePosition={(x, y) => updateObstaclePosition?.(x, y, obstacle.id)}
            onClick={(isAdditive) => {toggleObstacleSelect(obstacle.id, isAdditive)}}
            isSelected={selectedIds.obstacles.includes(obstacle.id)}
            isTransformerActive={isTransformerActive}
            registerNode={registerNode}
            canEdit={canEdit && canSelectObstacles}
            snapToGrid={snapToGrid}
            canSelect={canSelectObstacles}
            animate
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
            updatePosition={(x, y) => updatePropPosition?.(x, y, propPosition.propId)}
            onClick={(isAdditive) => {togglePropSelect(propPosition.propId, isAdditive)}}
            isSelected={selectedIds.props.includes(propPosition.propId)}
            isTransformerActive={isTransformerActive}
            registerNode={registerNode}
            canEdit={canEdit && canSelectProps}
            snapToGrid={snapToGrid}
            canSelect={canSelectProps}
            animate
            isZooming={isZooming}
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
            updatePosition={(x, y) => updateDancerPosition?.(x, y, dancerPosition.dancerId)}
            onClick={(isAdditive) => {
              toggleDancerSelect(dancerPosition.dancerId, isAdditive);
              onDancerSelected?.();
            }}
            isSelected={selectedIds.dancers.includes(dancerPosition.dancerId)}
            registerNode={registerNode}
            canEdit={canEdit}
            snapToGrid={snapToGrid}
            dancerDisplayType={dancerDisplayType}
            animate
            isZooming={isZooming}
            sectionId={sectionId}
            dancerAnimationCache={dancerAnimationCache[dancerPosition.dancerId]}
          />
        );
      })}
      {
        (selectedIds.dancers.length > 0 || selectedIds.props.length > 0 || selectedIds.obstacles.length > 0) && (
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