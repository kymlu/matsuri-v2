import { Layer } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { Dancer, DancerPosition } from "../../../models/dancer";
import DancerGridObject from "../gridObjects/DancerGridObject";
import { DancerDisplayType } from "../../../models/appSettings";
import { Prop, PropPosition } from "../../../models/prop";
import PropGridObject from "../gridObjects/PropGridObject";

type GhostLayerProps = {
  dancers: Record<string, Dancer>,
  dancerPositions?: DancerPosition[],
  props: Record<string, Prop>,
  propPositions?: PropPosition[],
  geometry: StageGeometry,
  dancerDisplayType: DancerDisplayType,
};

export default function GhostLayer({
  dancers,
  dancerPositions,
  props,
  propPositions,
  geometry,
  dancerDisplayType
}: GhostLayerProps) {
  return ( 
    <Layer
      listening={false}
      opacity={0.5}
      >
      {
        propPositions &&
        propPositions.map((propPosition) => {
          return (
            <PropGridObject
              key={propPosition.propId}
              prop={props[propPosition.propId]}
              position={propPosition}
              stageGeometry={geometry}
              isSelected={false}
              canEdit={false}
              canSelect={false}
              animate={false}
            />
          );
        })
      }
      {
        dancerPositions &&
        dancerPositions.map((dancerPosition) => {
          return (
            <DancerGridObject
              key={dancerPosition.dancerId}
              dancer={dancers[dancerPosition.dancerId]}
              position={dancerPosition}
              stageGeometry={geometry}
              isSelected={false}
              canEdit={false}
              dancerDisplayType={dancerDisplayType}
              animate={false}
            />
          );
        })
      }
    </Layer>
  );
}
