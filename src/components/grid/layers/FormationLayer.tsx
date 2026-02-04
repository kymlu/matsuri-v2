import { Layer, Transformer } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { Dancer, DancerPosition } from "../../../models/dancer";
import DancerGridObject from "../gridObjects/DancerGridObject";
import Konva from "konva";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { colorPalette } from "../../../lib/consts/colors";
import { METER_PX } from "../../../lib/consts/consts";
import { pxToStageMeters } from "../../../lib/helpers/editorCalculationHelper";
import { DancerDisplayType } from "../../../models/appSettings";

type FormationLayerProps = {
  canEdit: boolean,
  canSelectDancers: boolean,
  canToggleSelection: boolean,
  dancers: Record<string, Dancer>,
  dancerPositions: DancerPosition[],
  geometry: StageGeometry,
  updateDancerPosition?: (x: number, y: number, dancerId: string) => void,
  updateDancerPositions?: (dx: number, dy: number) => void,
  selectedIds: string[],
  setSelectedIds: Dispatch<SetStateAction<string[]>>,
  snapToGrid?: boolean,
  dancerDisplayType: DancerDisplayType,
};

export default function FormationLayer({
  canEdit,
  canSelectDancers,
  canToggleSelection,
  dancers,
  dancerPositions,
  geometry,
  updateDancerPosition,
  updateDancerPositions,
  selectedIds,
  setSelectedIds,
  snapToGrid,
  dancerDisplayType
}: FormationLayerProps) {
	const transformerRef = useRef<Konva.Transformer>(null);

  const transformerDragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isTransformerDraggingRef = useRef(false);
  const nodeMap = useRef<Map<string, Konva.Node>>(new Map());

  const registerNode = (id: string, node: Konva.Node | null) => {
    if (node) {
      nodeMap.current.set(id, node);
    } else {
      nodeMap.current.delete(id);
    }
  };

  const toggleSelect = (id: string, isAdditive: boolean = true) => {
    if(canSelectDancers) {
      setSelectedIds((prev) => {
        if (canToggleSelection && isAdditive) {
          return prev.includes(id)
            ? prev.filter((x) => x !== id)
            : [...prev, id];
        } else {
          return [id];
        }
      });
    }
  }
    
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const nodes = selectedIds
      .map((id) => nodeMap.current.get(id))
      .filter(Boolean) as Konva.Node[];

    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedIds]);

  return ( 
    <Layer>
      {dancerPositions.map((dancerPosition) => {
        return (
          <DancerGridObject
            key={dancerPosition.dancerId}
            dancer={dancers[dancerPosition.dancerId]}
            position={dancerPosition}
            stageGeometry={geometry}
            updatePosition={(x, y) => updateDancerPosition?.(x, y, dancerPosition.dancerId)}
            onClick={(isAdditive) => {toggleSelect(dancerPosition.dancerId, isAdditive)}}
            isSelected={selectedIds.includes(dancerPosition.dancerId)}
            isTransformerActive={selectedIds.length > 1}
            registerNode={registerNode}
            canEdit={canEdit}
            snapToGrid={snapToGrid}
            dancerDisplayType={dancerDisplayType}
          />
        );
      })}

      {
        selectedIds.length > 0 && (
        <Transformer
          draggable
          flipEnabled={false}
          keepRatio={false}
          ref={transformerRef}
          resizeEnabled={false}
          rotateEnabled={false}
          // resizeEnabled={isSingleNoteSelected}
          enabledAnchors={["bottom-right"]}
          // rotateEnabled={isSinglePropSelected}
          borderStrokeWidth={2}
          borderEnabled={false}
          borderStroke={colorPalette.primary}
          anchorStrokeWidth={2}
          anchorStroke={colorPalette.primary}
          rotationSnaps={[
            0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210,
            225, 240, 255, 270, 285, 300, 315, 330, 345, 360,
          ]}
          rotationSnapTolerance={10}
          onMouseDown={(e) => {
            console.log("mouse down transformer")
            transformerDragStartRef.current = {
              x: e.evt.clientX,
              y: e.evt.clientY,
            };
            isTransformerDraggingRef.current = false;
          }}
          onDragMove={(e) => {
            const start = transformerDragStartRef.current;
            if (!start) return;

            const dx = e.target.x() - start.x;
            const dy = e.target.y() - start.y;

            if (Math.hypot(dx, dy) > 0.01) {
              isTransformerDraggingRef.current = true;
            }
          }}
          onDragEnd={(e) => {
            if (!transformerDragStartRef.current) return;
    
            const dx =
              e.evt.clientX - transformerDragStartRef.current.x;
            const dy =
              e.evt.clientY - transformerDragStartRef.current.y;
    
            if (Math.hypot(dx, dy) > 4) {
              isTransformerDraggingRef.current = true;
            }
    
            if (isTransformerDraggingRef.current) {
              const node = transformerRef.current!!;
              console.log(node);
    
              const rawPx = {
                x: node.x(),
                y: node.y(),
              };

              const snapPx = METER_PX/2;

              const snappedPx = {
                x: Math.round(rawPx.x / snapPx) * snapPx,
                y: Math.round(rawPx.y / snapPx) * snapPx,
              };

              const dxPx = snappedPx.x - transformerDragStartRef.current.x;
              const dyPx = snappedPx.y - transformerDragStartRef.current.y;    
              node.to({
                x: snappedPx.x,
                y: snappedPx.y,
                onFinish: () => {
                  var snappedDeltaInM = pxToStageMeters({x: dxPx, y: dyPx}, geometry, METER_PX);
                  updateDancerPositions?.(snappedDeltaInM.x, snappedDeltaInM.y);
                }
              });
            }
          }}
          onTransformEnd={(event) => {
            // if(isSinglePropSelected) {
            // 	updatePropRotation(event.target.attrs.id,
            // 		event.target.attrs.rotation,
            // 		event.target.attrs.x,
            // 		event.target.attrs.y);
            // } else if (isSingleNoteSelected) {
            // 	const group = event.target as Konva.Group;
            // 	const scaleX = group.scaleX();
            // 	const scaleY = group.scaleY();
            // 	saveNoteSize(event.target.attrs.id, scaleX, scaleY);
              
            // 	group.scale({ x: 1, y: 1 });
            // 	requestAnimationFrame(() => {
            // 		refreshTransformer();
            // 	});
            // }
          }}
        />
      )}
    </Layer>
  );
}
