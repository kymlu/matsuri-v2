import { Circle, Layer, Line } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { colorPalette } from "../../../lib/consts/colors";
import { memo, useEffect, useMemo, useState, useRef } from "react";
import { Movement } from "../../../models/choreoSection";
import { BasePosition, Coordinates } from "../../../models/base";
import { cornerToCentreFromProp, pxToStageMeters, stageMetersToPx } from "../../../lib/helpers/editorCalculationHelper";
import { METER_PX, PATH_DASH } from "../../../lib/consts/consts";
import { Prop } from "../../../models/prop";

type MovementEditLayerProps = {
  geometry: StageGeometry
  prevPosition?: BasePosition;
  movement?: Movement;
  currentPosition?: BasePosition;
  prop?: Prop,
  onMidpointEdit: (newMovement: Movement) => void;
};

const MovementEditLayer = memo(function MovementEditLayer({
  geometry, prevPosition, currentPosition, movement, prop, onMidpointEdit
}: MovementEditLayerProps) {
  const [midPoints, setMidPoints] = useState<Coordinates[] | undefined>();

  const midPointsRef = useRef<Coordinates[] | undefined>(midPoints);
  useEffect(() => {
    midPointsRef.current = midPoints;
  }, [midPoints]);

  const prevCurrPx = useMemo(() => {
    if (!prevPosition || !currentPosition) return undefined;
    if (prevPosition.type === "prop" && currentPosition.type === "prop" && prop) {
      return {
        prev: stageMetersToPx(cornerToCentreFromProp(prevPosition, prop, geometry.yAxis), geometry, METER_PX),
        curr: stageMetersToPx(cornerToCentreFromProp(currentPosition, prop, geometry.yAxis), geometry, METER_PX),
      };
    }
    return {
      prev: stageMetersToPx(prevPosition, geometry, METER_PX),
      curr: stageMetersToPx(currentPosition, geometry, METER_PX),
    };
  }, [prevPosition, currentPosition, prop, geometry]);
  
  useEffect(() => {
    if (!prevCurrPx) {
      setMidPoints(undefined);
      return;
    }
    if (movement && movement.points.length > 0) {
      setMidPoints(movement.points.map(p => stageMetersToPx(p, geometry, METER_PX)));
    } else {
      const { prev, curr } = prevCurrPx;
      setMidPoints([{
        x: (curr.x + prev.x) / 2,
        y: (curr.y + prev.y) / 2,
      }]);
    }
  }, [movement, prevCurrPx, geometry]);

  const points = useMemo(() => {
    if (!prevCurrPx) return [];
    const { prev, curr } = prevCurrPx;
    return [prev.x, prev.y, ...(midPoints?.flatMap((p) => [p.x, p.y]) ?? []), curr.x, curr.y];
  }, [prevCurrPx, midPoints]);

  const tension = movement?.tension === "straight" ? 0 : 0.5;

  const sharedLineProps = {
    listening: false,
    points,
    lineJoin: "round" as const,
    tension,
  };

  const handleDragMove = useCallback((index: number, evt: KonvaEventObject<DragEvent>) => {
    const newPoint: Coordinates = { x: evt.currentTarget.x(), y: evt.currentTarget.y() };
    setMidPoints(prev => {
      if (!prev) return prev;
      const next = [...prev];
      next[index] = newPoint;
      return next;
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    const current = midPointsRef.current;
    if (!current) return;
    onMidpointEdit({
      points: current.map(p => pxToStageMeters(p, geometry, METER_PX)),
      tension: movement?.tension ?? "curved",
    });
  }, [geometry, movement?.tension, onMidpointEdit]);

  return (
    <Layer>
      {
        points.length > 0 && <>
          <Line
            {...sharedLineProps}
            opacity={0.7}
            strokeEnabled
            stroke={colorPalette.white}
            strokeWidth={6}
            fill={colorPalette.white}
            fillEnabled
          />
          <Line
            {...sharedLineProps}
            strokeEnabled
            stroke={colorPalette.primary}
            strokeWidth={3}
            fill={colorPalette.primary}
            fillEnabled
            dashEnabled
            pointerWidth={5}
            pointerLength={5}
            dash={PATH_DASH}
          />
        </>
      }
      {
        midPoints?.map((point, i) => {
          return <Circle
            key={point.id ?? i}
            draggable
            onDragMove={(evt) => handleDragMove(i, evt)}
            onDragEnd={handleDragEnd}
            x={point.x}
            y={point.y}
            strokeEnabled
            stroke={colorPalette.primary}
            strokeWidth={2}
            hitStrokeWidth={METER_PX * 0.75}
            fill={colorPalette.white}
            fillEnabled
            radius={METER_PX / 5}
          />
        })
      }
    </Layer>
  );
});

export default MovementEditLayer;
