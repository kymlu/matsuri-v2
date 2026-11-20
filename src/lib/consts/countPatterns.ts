export type CountPattern = { name: string, counts: string[] };

// In pairs, two to a row. Each fits 16 counts and COUNT_NAME_LENGTH.
export const COUNT_PATTERNS: CountPattern[] = [
  { name: "奇数", counts: ["1", "3", "5", "7"] },
  { name: "偶数", counts: ["2", "4", "6", "8"] },
  { name: "1〜4", counts: ["1", "2", "3", "4"] },
  { name: "5〜8", counts: ["5", "6", "7", "8"] },
  { name: "1〜8", counts: ["1", "2", "3", "4", "5", "6", "7", "8"] },
  { name: "1〜8と", counts: ["1", "1と", "2", "2と", "3", "3と", "4", "4と", "5", "5と", "6", "6と", "7", "7と", "8", "8と"] },
];

// 「1 1と … 8と」, so a button stays on one line.
export const patternPreview = (pattern: CountPattern) => pattern.counts.length > 5
  ? [pattern.counts[0], pattern.counts[1], "…", pattern.counts[pattern.counts.length - 1]].join(" ")
  : pattern.counts.join(" ");

// Re-picking loses nothing: the counts are exactly a pattern, or all blank.
export const isPatternOrBlank = (names: string[]) => {
  const trimmed = names.map(n => n.trim());
  return trimmed.every(n => !n)
    || COUNT_PATTERNS.some(p => p.counts.length === trimmed.length && p.counts.every((c, i) => c === trimmed[i]));
};
