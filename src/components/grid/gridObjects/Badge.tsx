import { useMemo } from "react";
import Konva from "konva";
import { Group, Rect, Text } from "react-konva";
import { colorPalette } from "../../../lib/consts/colors";

const FONT_FAMILY = "'Hiragino Sans','Noto Sans JP','Yu Gothic',sans-serif";

// A pill on a stage object: a stack's "×3", or a count name. growLeft keeps long text clear of the right side.
export default function Badge({ x, y, radius, red, text, growLeft }: { x: number, y: number, radius: number, red?: boolean, text: string, growLeft?: boolean }) {
  const fontSize = radius * 1.4;
  const h = radius * 2;
  // Sized to the text as the device's font actually draws it ("×" is much wider in some Japanese fonts),
  // and never wrapped, so the number can't drop onto a hidden second line.
  const w = useMemo(() => {
    const measured = new Konva.Text({ text, fontSize, fontStyle: "bold", fontFamily: FONT_FAMILY }).width();
    return Math.max(h, measured + h * 0.6);
  }, [text, fontSize, h]);
  return <Group x={growLeft ? x + h / 2 - w / 2 : x} y={y} listening={false}>
    <Rect x={-w / 2} y={-h / 2} width={w} height={h} cornerRadius={h / 2} fill={red ? colorPalette.primary : colorPalette.grey}/>
    <Text x={-w / 2} y={-h / 2} width={w} height={h} align="center" verticalAlign="middle" wrap="none"
      text={text} fontSize={fontSize} fontStyle="bold" fill={red ? "#FFFFFF" : colorPalette.white}
      fontFamily={FONT_FAMILY}/>
  </Group>;
}
