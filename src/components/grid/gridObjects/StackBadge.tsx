import { Group, Rect, Text } from "react-konva";
import { colorPalette } from "../../../lib/consts/colors";

// "×3" on the top member of a stack: how many are here. Grey normally; red when the stack is selected
// (editor), or when someone hidden in it acts at the chosen count (view).
export default function StackBadge({ x, y, radius, red, count }: { x: number, y: number, radius: number, red?: boolean, count: number }) {
  // Large text in a tight pill so it reads on a phone; grows with the digits so "×12" fits as well as "×2".
  const w = radius * (1.7 + 0.95 * String(count).length), h = radius * 2;
  return <Group x={x} y={y} listening={false}>
    <Rect x={-w / 2} y={-h / 2} width={w} height={h} cornerRadius={h / 2} fill={red ? colorPalette.primary : colorPalette.grey}/>
    <Text x={-w / 2} y={-h / 2} width={w} height={h} align="center" verticalAlign="middle"
      text={`×${count}`} fontSize={radius * 1.55} fontStyle="bold" fill={red ? "#FFFFFF" : colorPalette.white}
      fontFamily="'Hiragino Sans','Noto Sans JP','Yu Gothic',sans-serif"/>
  </Group>;
}
