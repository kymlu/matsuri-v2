import { Layer, Shape } from "react-konva";
import { StageGeometry } from "../../../models/choreo";
import { DancerPosition } from "../../../models/dancer";
import DancerGridObject from "../gridObjects/DancerGridObject";
import { Prop, PropPosition } from "../../../models/prop";
import { colorPalette } from "../../../lib/consts/colors";
import React, { useDeferredValue, useMemo } from "react";
import { PathSvgCacheByObjectIdBySectionId } from "../../../models/choreoSection";
import PropGridObject from "../gridObjects/PropGridObject";
import { getAnimationKey } from "../../../lib/helpers/editorCalculationHelper";
import { PATH_DASH } from "../../../lib/consts/consts";

type GhostLayerProps = {
  dancerIds: string[],
  prevDancerPositions?: Record<string, DancerPosition>,
  dancerSvgCache: PathSvgCacheByObjectIdBySectionId,
  props: Record<string, Prop>,
  prevPropPositions?: Record<string, PropPosition>,
  propSvgCache: PathSvgCacheByObjectIdBySectionId,
  geometry: StageGeometry,
  selectedId?: string,
  isEditingPaths?: boolean
  prevSectionId?: string,
  sectionId?: string,
};

function invertPathMap(dancerPathMap: PathSvgCacheByObjectIdBySectionId): PathSvgCacheByObjectIdBySectionId {
  const sectionPathMap: PathSvgCacheByObjectIdBySectionId = {};

  for (const [objId, sections] of Object.entries(dancerPathMap)) {
    if (!sections) continue;

    for (const [sectionId, path] of Object.entries(sections)) {
      if (!path) continue;

      if (!sectionPathMap[sectionId]) {
        sectionPathMap[sectionId] = {};
      }

      sectionPathMap[sectionId][objId] = path;
    }
  }

  return sectionPathMap;
}

const GhostLayer = React.memo(function GhostLayer({
  dancerIds,
  prevDancerPositions,
  dancerSvgCache,
  props,
  prevPropPositions,
  propSvgCache,
  geometry,
  selectedId,
  isEditingPaths,
  prevSectionId,
  sectionId,
}: GhostLayerProps) {
  const sectionDancerPathMap = useMemo(
    () => invertPathMap(dancerSvgCache),
    [dancerSvgCache]
  );
  
  const sectionPropPathMap = useMemo(
    () => invertPathMap(propSvgCache),
    [propSvgCache]
  );

  const sectionPaths = useMemo(() => {
    const key = getAnimationKey(prevSectionId ?? "", sectionId ?? "");
    const entries: { objId: string; path: string }[] = [];

    const dancerPaths = sectionDancerPathMap[key];
    if (dancerPaths) {
      for (const objId of Object.keys(dancerPaths)) {
        const path = dancerPaths[objId]?.path;
        if (path) entries.push({ objId, path });
      }
    }

    const propPaths = sectionPropPathMap[key];
    if (propPaths) {
      for (const objId of Object.keys(propPaths)) {
      const path = propPaths[objId]?.path;
        if (path) entries.push({ objId, path });
      }
    }

    return entries;
  }, [sectionDancerPathMap, sectionPropPathMap, prevSectionId, sectionId]);

  const allPaths = useMemo(() => {
    if (!isEditingPaths || !selectedId) {
      return sectionPaths.map(e => e.path);
    }
    const filtered: string[] = [];
    for (const entry of sectionPaths) {
      if (entry.objId !== selectedId) filtered.push(entry.path);
    }
    return filtered;
  }, [sectionPaths, isEditingPaths, selectedId]);

  const ghostData = useMemo(
    () => ({
      prevDancerPositions,
      prevPropPositions,
    }),
    [prevDancerPositions, prevPropPositions]
  );

  const deferredGhostData = useDeferredValue(ghostData);
  const { prevDancerPositions: syncPrevDancers, prevPropPositions: syncPrevProps } =
    deferredGhostData;

  const propKeys = useMemo(() => Object.keys(props), [props]);

  return ( 
    <Layer
      listening={false}
      opacity={0.5}
      >
      <BatchedPath2D allPaths={allPaths}/>
      {
        propKeys.map((id) => {
          const prev = syncPrevProps?.[id];
          if (!prev) return null;
          return (
            <PropMovement
              key={id}
              prop={props[id]}
              prev={syncPrevProps[id]}
              geometry={geometry}
            />
          );
        })
      }
      {
        dancerIds.map((id) => {
          const prev = syncPrevDancers?.[id];
          if (!prev) return null;
          return <DancerMovement
            key={id}
            prev={syncPrevDancers[id]}
            geometry={geometry}
          />
        })
      }
    </Layer>
  );
});

export default GhostLayer;

type DancerMovementProps = {
  prev?: DancerPosition,
  geometry: StageGeometry,
}
const PREV_DANCER_BASE = { name: "", id: "" };

const DancerMovement = React.memo(function DancerMovement ({
  prev, geometry
}: DancerMovementProps) {
  return <>
    {
      prev && <>
        <DancerGridObject
          dancer={PREV_DANCER_BASE}
          position={prev}
          stageGeometry={geometry}
          isSelected={false}
          canEdit={false}
          dancerDisplayType={"small"}
          animate={false}
        />
      </>
    }
  </>
});

type PropMovementProps = {
  prop: Prop,
  prev?: PropPosition,
  geometry: StageGeometry,
}

const PropMovement = React.memo(function PropMovement ({
  prop, prev, geometry
}: PropMovementProps) {
  const prevPropObj = useMemo<Prop>(
    () => ({...prop, name: ""}),
    [prop]
  );
  return <>
    {
      prev && <>
        <PropGridObject
          prop={prevPropObj}
          position={prev}
          stageGeometry={geometry}
          isSelected={false}
          canEdit={false}
          animate={false}
          canSelect={false}
        />
      </>
    }
  </>
});

const path2dCache = new Map<string, Path2D>();

function getOrCreatePath2D(svgString: string): Path2D {
  let cached = path2dCache.get(svgString);
  if (!cached) {
    cached = new Path2D(svgString);
    path2dCache.set(svgString, cached);
  }
  return cached;
}

export const BatchedPath2D = React.memo(function BatchedPath2D({
  allPaths,
}: {
  allPaths: string[];
}) {
  const combinedPath = useMemo(() => {
    if (!allPaths.length) return null;

    const merged = new Path2D();
    for (let i = 0; i < allPaths.length; i++) {
      const str = allPaths[i];
      if (str) {
        merged.addPath(getOrCreatePath2D(str));
      }
    }
    return merged;
  }, [allPaths]);

  if (!combinedPath) return null;

  return (
    <Shape
      listening={false}
      perfectDrawEnabled={false}
      sceneFunc={(context) => {
        context.strokeStyle = colorPalette.primary;
        context.lineWidth = 2;
        context.setLineDash(PATH_DASH);
        context.stroke(combinedPath);
      }}
    />
  );
});
