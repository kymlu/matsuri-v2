// Up to 3 full-width characters per line, 2 lines. Splits evenly, avoids starting
// line 2 with ー or a small kana, and cuts long names with "…". Names with spaces
// (e.g. romaji) are left to Konva's word wrap.
const NO_LINE_START = "ーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎ、。・）」』";
const MAX_PER_LINE = 3;
export function formatDancerName(name: string): string {
  if (/\s/.test(name)) return name;
  let chars = [...name];
  if (chars.length <= MAX_PER_LINE) return name;
  if (chars.length > MAX_PER_LINE * 2) chars = [...chars.slice(0, MAX_PER_LINE * 2 - 1), "…"];
  let cut = Math.ceil(chars.length / 2);
  if (NO_LINE_START.includes(chars[cut])) {
    // Move the break forward if line 1 has room, else back if line 2 has room.
    if (cut < MAX_PER_LINE) cut++;
    else if (chars.length - (cut - 1) <= MAX_PER_LINE) cut--;
  }
  return chars.slice(0, cut).join("") + "\n" + chars.slice(cut).join("");
}
