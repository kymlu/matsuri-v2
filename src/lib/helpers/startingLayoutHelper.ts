import { Dancer, DancerPosition } from "../../models/dancer";
import { Prop, PropPosition } from "../../models/prop";
import { colorPalette } from "../consts/colors";

// The starting layout for a new choreo: where step 3 of 新規作成 puts each dancer and prop.

export const PROP_GAP_FROM_DANCERS = 1; // metres between the last row of dancers and the first props
const PROP_GAP = 0.5;                   // metres between props
export const OVERFLOW_OFFSET = 0.15;    // each pass after the stage is full shifts by this, so stacked items aren't hidden in the editor

export type StartingLayout = {
  dancers: Record<string, Dancer>,
  dancerPositions: Record<string, DancerPosition>,
  props: Record<string, Prop>,
  propPositions: Record<string, PropPosition>,
}

type Size = { stageWidth: number, stageLength: number };

// Dancers go one per 1m grid point, row by row from y = 0, as before.
// When the stage is full, placement starts again from the first spot, offset slightly.
export function placeDancers(count: number, { stageWidth, stageLength }: Size) {
  const perRow = Math.floor(stageWidth) + 1;
  const capacity = perRow * (Math.floor(stageLength) + 1);
  return Array.from({ length: count }, (_, i) => {
    const pass = Math.floor(i / capacity);
    const k = i % capacity;
    return {
      x: (k % perRow) + pass * OVERFLOW_OFFSET,
      y: Math.floor(k / perRow) + pass * OVERFLOW_OFFSET,
    };
  });
}

// Props are packed row by row after the dancers, at least 1m from the last row of dancers.
// y is a prop's front edge and x its left edge, as stored. When they no longer fit, placement
// starts again from the first prop spot (or the front, if the dancers fill the stage), offset slightly.
export function placeProps(sizes: { width: number, length: number }[], dancerCount: number, { stageWidth, stageLength }: Size) {
  const perRow = Math.floor(stageWidth) + 1;
  const dancerRows = Math.ceil(Math.min(dancerCount, perRow * (Math.floor(stageLength) + 1)) / perRow);
  const firstRowStart = dancerRows === 0 ? 0 : dancerRows - 1 + PROP_GAP_FROM_DANCERS;
  const startY = firstRowStart < stageLength ? firstRowStart : 0;

  let pass = 0;
  let x = 0;
  let rowY = startY;
  let rowDepth = 0;
  let placedInPass = 0;
  return sizes.map(({ width, length }) => {
    if (placedInPass > 0 && x + width > stageWidth) {
      rowY += rowDepth + PROP_GAP;
      x = 0;
      rowDepth = 0;
    }
    if (placedInPass > 0 && rowY + length > stageLength) {
      pass += 1;
      rowY = startY;
      x = 0;
      rowDepth = 0;
      placedInPass = 0;
    }
    const position = { x: x + pass * OVERFLOW_OFFSET, y: rowY + pass * OVERFLOW_OFFSET };
    x += width + PROP_GAP;
    rowDepth = Math.max(rowDepth, length);
    placedInPass += 1;
    return position;
  });
}

export type StartingProp = { name: string, width: number, length: number, color: string };

// named: dancers picked from the 名簿, in pick order. unnamedCount: dancers named 1, 2, 3 … after them.
// props: one entry per prop to create, in placement order.
export function buildStartingLayout(
  named: string[],
  unnamedCount: number,
  props: StartingProp[],
  size: Size,
  sectionId: string,
  newId: () => string = () => crypto.randomUUID(),
): StartingLayout {
  const names = [...named, ...Array.from({ length: unnamedCount }, (_, i) => (i + 1).toString())];
  const dancerSpots = placeDancers(names.length, size);
  const propSpots = placeProps(props, names.length, size);

  const layout: StartingLayout = { dancers: {}, dancerPositions: {}, props: {}, propPositions: {} };
  names.forEach((name, i) => {
    const id = newId();
    layout.dancers[id] = { id, name };
    layout.dancerPositions[id] = {
      sectionId,
      dancerId: id,
      ...dancerSpots[i],
      z: i,
      color: colorPalette.rainbow.blue[0],
      type: "dancer",
      rotation: 0,
    };
  });
  props.forEach((prop, i) => {
    const id = newId();
    layout.props[id] = { id, name: prop.name, width: prop.width, length: prop.length, color: prop.color };
    layout.propPositions[id] = {
      sectionId,
      propId: id,
      ...propSpots[i],
      z: i,
      type: "prop",
      rotation: 0,
    };
  });
  return layout;
}
