import { Layer, Transformer } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { Dancer, DancerPosition } from "../../../models/dancer";
import DancerGridObject from "../gridObjects/DancerGridObject";
import Konva from "konva";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { colorPalette } from "../../../lib/consts/colors";
import { DancerDisplayType } from "../../../models/appSettings";
import { Prop, PropPosition } from "../../../models/prop";
import PropGridObject from "../gridObjects/PropGridObject";
import { StageEntities } from "../../../models/history";
import { pxToStageMeters } from "../../../lib/helpers/editorCalculationHelper";
import { METER_PX, PROP_SNAP_SIZE } from "../../../lib/consts/consts";

type FormationLayerProps = {
  canEdit: boolean,
  canSelectDancers: boolean,
  canSelectProps: boolean,
  canToggleSelection: boolean,
  hideTransformerBorder?: boolean,
  dancers: Record<string, Dancer>,
  dancerPositions: DancerPosition[],
  props: Record<string, Prop>,
  propPositions: PropPosition[],
  geometry: StageGeometry,
  updateDancerPosition?: (x: number, y: number, dancerId: string) => void,
  updatePropPosition?: (x: number, y: number, propId: string) => void,
  updatePropSizeAndRotate?: (width: number, length: number, rotation: number, x: number, y: number, propId: string) => void
  selectedIds: StageEntities<string[]>,
  setSelectedIds: Dispatch<SetStateAction<StageEntities<string[]>>>,
  snapToGrid?: boolean,
  dancerDisplayType: DancerDisplayType,
};

export default function FormationLayer({
  canEdit,
  canSelectDancers,
  canSelectProps,
  canToggleSelection,
  dancers,
  dancerPositions,
  props,
  propPositions,
  geometry,
  updateDancerPosition,
  updatePropPosition,
  updatePropSizeAndRotate,
  selectedIds,
  setSelectedIds,
  snapToGrid,
  hideTransformerBorder,
  dancerDisplayType
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
    if(canSelectDancers) {
      setSelectedIds((prev) => ({
        props: isAdditive ? [...prev.props] : [],
        dancers: (canToggleSelection && isAdditive) ?
          (prev.dancers.includes(id) ?
            prev.dancers.filter((x) => x !== id) :
            [...prev.dancers, id]) :
          [id]
      }));
    }
  }
  const togglePropSelect = (id: string, isAdditive: boolean = true) => {
    if(canSelectDancers) {
      setSelectedIds((prev) => ({
        dancers: isAdditive ? [...prev.dancers] : [],
        props: (canToggleSelection && isAdditive) ?
          (prev.props.includes(id) ?
            prev.props.filter((x) => x !== id) :
            [...prev.props, id]) :
          [id]
      }));
    }
  }
    
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const nodes = [
      ...selectedIds.dancers.map((id) => nodeMap.current.get(id)).filter(Boolean),
      ...selectedIds.props.map((id) => nodeMap.current.get(id)).filter(Boolean)
    ] as Konva.Node[];

    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedIds]);

  return ( 
    <Layer>
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
            isTransformerActive={(selectedIds.dancers.length + selectedIds.props.length) > 1}
            registerNode={registerNode}
            canEdit={canEdit}
            snapToGrid={snapToGrid}
            canSelect={canSelectProps}
            animate
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
            onClick={(isAdditive) => {toggleDancerSelect(dancerPosition.dancerId, isAdditive)}}
            isSelected={selectedIds.dancers.includes(dancerPosition.dancerId)}
            isTransformerActive={(selectedIds.dancers.length + selectedIds.props.length) > 1}
            registerNode={registerNode}
            canEdit={canEdit}
            snapToGrid={snapToGrid}
            dancerDisplayType={dancerDisplayType}
            animate
          />
        );
      })}
      {
        (selectedIds.dancers.length > 0 || selectedIds.props.length > 0) && (
        <Transformer
          draggable
          flipEnabled={false}
          keepRatio={false}
          ref={transformerRef}
          resizeEnabled={selectedIds.dancers.length === 0 && selectedIds.props.length === 1}
          enabledAnchors={["middle-right", "middle-left", "top-center", "bottom-center"]}
          rotateEnabled={selectedIds.dancers.length === 0 && selectedIds.props.length === 1}
          borderStrokeWidth={2}
          borderEnabled={((selectedIds.dancers.length) > 1 || selectedIds.props.length > 0) && !hideTransformerBorder}
          borderStroke={colorPalette.primary}
          anchorStrokeWidth={2}
          anchorStroke={colorPalette.primary}
          rotationSnaps={[
            0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210,
            225, 240, 255, 270, 285, 300, 315, 330, 345, 360,
          ]}
          rotationSnapTolerance={10}
          onTransformEnd={(event) => {
              const prop = {...props[selectedIds.props[0]]};
              if (!prop) return;
              
              const group = event.target as Konva.Group;

              var width = Math.max(Math.round(prop.width * group.scaleX() / PROP_SNAP_SIZE) * PROP_SNAP_SIZE, 0.5);
              var length = Math.max(Math.round(prop.length * group.scaleY() / PROP_SNAP_SIZE) * PROP_SNAP_SIZE, 0.5);
              var newCoords = pxToStageMeters(
                {x: event.target.attrs.x, y: event.target.attrs.y},
                geometry,
                METER_PX,
                props[selectedIds.props[0]].length);

            	updatePropSizeAndRotate?.(
                width, length,
                event.target.attrs.rotation,
                newCoords.x, newCoords.y,
                selectedIds.props[0]);
              
              group.scale({ x: 1, y: 1 });

              requestAnimationFrame(() => {
            		refreshTransformer();
            	});
            }
          }
        />
      )}
    </Layer>
  );
}
