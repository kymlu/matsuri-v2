import { Stage } from "react-konva";
import GridLayer from "./GridLayer";
import { useState, useCallback, useEffect, useRef } from "react";

export default function MainStage() {
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
    <Stage
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
        stageType="stage"
        length={10}
        width={14}
        margin={{
          leftMargin: 3,
          topMargin: 3,
          rightMargin: 3,
          bottomMargin: 3
        }}/>
    </Stage>
  </div>
}