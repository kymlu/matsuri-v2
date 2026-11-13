import { useMemo } from "react";
import Konva from "konva";
import { Group, Rect, Text } from "react-konva";
import { colorPalette } from "../../../lib/consts/colors";

const FONT_FAMILY = "'Hiragino Sans','Noto Sans JP','Yu Gothic',sans-serif";

// "×3" on the top member of a stack: how many are here. Grey normally; red when the stack is selected
// (editor), or when someone hidden in it acts at the chosen count (view).
export default function StackBadge({ x, y, radius, red, count }: { x: number, y: number, radius: number, red?: boolean, count: number }) {
  const text = `×${count}`;
  const fontSize = radius * 1.55;
  const h = radius * 2;
  // Sized to the text as the device's font actually draws it ("×" is much wider in some Japanese fonts),
  // and never wrapped, so the number can't drop onto a hidden second line.
  const w = useMemo(() => {
    const measured = new Konva.Text({ text, fontSize, fontStyle: "bold", fontFamily: FONT_FAMILY }).width();
    return Math.max(h, measured + h * 0.6);
  }, [text, fontSize, h]);
  return <Group x={x} y={y} listening={false}>
    <Rect x={-w / 2} y={-h / 2} width={w} height={h} cornerRadius={h / 2} fill={red ? colorPalette.primary : colorPalette.grey}/>
    <Text x={-w / 2} y={-h / 2} width={w} height={h} align="center" verticalAlign="middle" wrap="none"
      text={text} fontSize={fontSize} fontStyle="bold" fill={red ? "#FFFFFF" : colorPalette.white}
      fontFamily={FONT_FAMILY}/>
  </Group>;
}
