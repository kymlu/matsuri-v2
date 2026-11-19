import { formatStageSize } from "./stageGridHelper";

describe("formatStageSize", () => {
  it("puts width first and calls a stage's depth 奥行", () => {
    expect(formatStageSize(16, 8, "stage")).toBe("幅16m × 奥行8m");
  });

  it("calls a parade's depth 長さ", () => {
    expect(formatStageSize(6, 55, "parade")).toBe("幅6m × 長さ55m");
  });

  it("treats an unknown type as a stage", () => {
    expect(formatStageSize(16, 8)).toBe("幅16m × 奥行8m");
  });
});
