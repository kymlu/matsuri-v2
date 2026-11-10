import { colorPalette } from "../../lib/consts/colors";

// A small drawing of a stage in the app's own style, for help articles: dashed grid,
// dashed centre line and ▼ at the front, red numbered markers, named dancer circles.
// Uses the theme-aware stage colours, so it follows dark mode.

type DiagramDancer = { name: string, x: number, y: number, colour: string };

const DANCERS: DiagramDancer[] = [
  { name: "あや", x: -2, y: 2, colour: colorPalette.rainbow.blue[1] },
  { name: "ゆい", x: -0.6, y: 2, colour: colorPalette.rainbow.red[1] },
  { name: "りく", x: 0.6, y: 2, colour: colorPalette.rainbow.blue[1] },
  { name: "そら", x: 2, y: 2, colour: colorPalette.rainbow.red[1] },
  { name: "はな", x: -1.3, y: 3.6, colour: colorPalette.browns[2] },
  { name: "けん", x: 0, y: 3.6, colour: colorPalette.rainbow.blue[1] },
  { name: "まお", x: 1.3, y: 3.6, colour: colorPalette.browns[2] },
];

const COUNT_OUTLINE = colorPalette.actionOutlineColours[0];

type StageDiagramProps = {
  // Name of the dancer to ring in red, as if selected.
  selected?: string,
  // Names to ring in a count's outline colour.
  counted?: string[],
  // Draw a movement path for the selected dancer to this grid offset.
  pathTo?: { x: number, y: number },
};

export default function StageDiagram({ selected, counted = [], pathTo }: StageDiagramProps) {
  const W = 300, H = 170;
  const sx = 18, sy = 26, sw = W - 36, sh = H - 40;
  const step = sw / 10;
  const cx = sx + sw / 2;
  const r = step * 0.42;
  const markers: [number, string][] = [[-3, "6"], [-2, "4"], [-1, "2"], [1, "2"], [2, "4"], [3, "6"]];
  const at = (d: { x: number, y: number }) => ({ x: cx + d.x * step, y: sy + d.y * step });
  const selectedDancer = DANCERS.find(d => d.name === selected);

  return <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto" role="img" aria-label="舞台の図">
    <rect x={0} y={0} width={W} height={H} fill={colorPalette.offWhite}/>
    <rect x={sx} y={sy} width={sw} height={sh} fill={colorPalette.white}/>
    {Array.from({ length: 9 }, (_, i) =>
      <line key={`v${i}`} x1={sx + (i + 1) * step} y1={sy} x2={sx + (i + 1) * step} y2={sy + sh} stroke={colorPalette.lightGrey} strokeDasharray="3 3"/>
    )}
    {Array.from({ length: Math.floor(sh / step) }, (_, j) =>
      <line key={`h${j}`} x1={sx} y1={sy + (j + 1) * step} x2={sx + sw} y2={sy + (j + 1) * step} stroke={colorPalette.lightGrey} strokeDasharray="3 3"/>
    )}
    <rect x={sx} y={sy} width={sw} height={sh} fill="none" stroke={colorPalette.primary} strokeWidth={1.5}/>
    <line x1={cx} y1={sy - 10} x2={cx} y2={sy + sh} stroke={colorPalette.primary} strokeWidth={1.5} strokeDasharray="6 4"/>
    <path d={`M${cx - 7},${sy - 20} L${cx + 7},${sy - 20} L${cx},${sy - 8} Z`} fill={colorPalette.primary}/>
    {markers.map(([k, n]) => {
      const x = cx + k * step * 1.4;
      return <g key={`${k}`}>
        <circle cx={x} cy={sy - 13} r={7} fill={colorPalette.primary}/>
        <text x={x} y={sy - 10} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff">{n}</text>
      </g>;
    })}
    {selectedDancer && pathTo && (() => {
      const from = at(selectedDancer);
      const to = at(pathTo);
      const mid = { x: (from.x + to.x) / 2 - step, y: (from.y + to.y) / 2 };
      return <>
        <path d={`M${from.x},${from.y} Q${mid.x},${mid.y} ${to.x},${to.y}`} fill="none" stroke={colorPalette.primary} strokeWidth={2} strokeDasharray="4 3"/>
        <circle cx={to.x} cy={to.y} r={r} fill="none" stroke={colorPalette.primary} strokeWidth={1.5} strokeDasharray="3 2"/>
      </>;
    })()}
    {DANCERS.map(d => {
      const p = at(d);
      return <g key={d.name}>
        {counted.includes(d.name) && <circle cx={p.x} cy={p.y} r={r + 4} fill="none" stroke={COUNT_OUTLINE} strokeWidth={3}/>}
        {selected === d.name && <circle cx={p.x} cy={p.y} r={r + 4} fill="none" stroke={colorPalette.primary} strokeWidth={3}/>}
        <circle cx={p.x} cy={p.y} r={r} fill={d.colour}/>
        <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#000">{d.name}</text>
      </g>;
    })}
  </svg>;
}
