import { Circle, Group, Line } from "react-konva";
import { colorPalette } from "../../../lib/consts/colors";

// The layers mark on the top member of a stack: "more than one here". Red when someone hidden in the
// stack is selected (in view mode, that means they act at the chosen count).
export default function StackBadge({ x, y, radius, red }: { x: number, y: number, radius: number, red?: boolean }) {
  const s = radius * 0.55;
  const ink = red ? "#FFFFFF" : colorPalette.black;
  return <Group x={x} y={y} listening={false}>
    <Circle radius={radius} fill={red ? colorPalette.primary : colorPalette.white} stroke={red ? colorPalette.primary : colorPalette.grey} strokeWidth={1.5}/>
    <Line points={[-s, -s * 0.15, 0, -s * 0.65, s, -s * 0.15, 0, s * 0.35]} closed fill={ink}/>
    <Line points={[-s, s * 0.3, 0, s * 0.8, s, s * 0.3]} stroke={ink} strokeWidth={1.4} lineCap="round" lineJoin="round"/>
  </Group>;
}
