import { Circle, Group, Line, Rect, Text } from "react-konva";
import { colorPalette } from "../../../lib/consts/colors";

// The layers mark on the top member of a stack: "more than one here". Red when someone hidden in the
// stack is selected (in view mode, that means they act at the chosen count).
// With a count (editor, stack selected), it becomes a "×3" pill so it's clear the selection is more than the one circle.
export default function StackBadge({ x, y, radius, red, count }: { x: number, y: number, radius: number, red?: boolean, count?: number }) {
  if (count && count > 1) {
    const w = radius * 2.8, h = radius * 2;
    return <Group x={x} y={y} listening={false}>
      <Rect x={-w / 2} y={-h / 2} width={w} height={h} cornerRadius={h / 2} fill={colorPalette.primary}/>
      <Text x={-w / 2} y={-h / 2} width={w} height={h} align="center" verticalAlign="middle"
        text={`×${count}`} fontSize={radius * 1.25} fontStyle="bold" fill="#FFFFFF"
        fontFamily="'Hiragino Sans','Noto Sans JP','Yu Gothic',sans-serif"/>
    </Group>;
  }
  const s = radius * 0.55;
  const ink = red ? "#FFFFFF" : colorPalette.black;
  return <Group x={x} y={y} listening={false}>
    <Circle radius={radius} fill={red ? colorPalette.primary : colorPalette.white} stroke={red ? colorPalette.primary : colorPalette.grey} strokeWidth={1.5}/>
    <Line points={[-s, -s * 0.15, 0, -s * 0.65, s, -s * 0.15, 0, s * 0.35]} closed fill={ink}/>
    <Line points={[-s, s * 0.3, 0, s * 0.8, s, s * 0.3]} stroke={ink} strokeWidth={1.4} lineCap="round" lineJoin="round"/>
  </Group>;
}
