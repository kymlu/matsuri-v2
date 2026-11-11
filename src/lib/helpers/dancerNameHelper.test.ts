import { formatDancerName } from "./dancerNameHelper";

describe("formatDancerName", () => {
  it("leaves names of up to 3 characters on one line", () => {
    expect(formatDancerName("一郎")).toBe("一郎");
    expect(formatDancerName("デルタ")).toBe("デルタ");
  });

  it("splits 4 to 6 characters evenly over two lines", () => {
    expect(formatDancerName("アルファ")).toBe("アル\nファ");
    expect(formatDancerName("山田花子")).toBe("山田\n花子");
    expect(formatDancerName("アレックス")).toBe("アレッ\nクス");
  });

  it("doesn't start the second line with ー or a small kana", () => {
    expect(formatDancerName("リョーコ")).toBe("リョー\nコ");
    expect(formatDancerName("ミッキーマ")).toBe("ミッ\nキーマ");
    expect(formatDancerName("ケイティー")).toBe("ケイ\nティー");
  });

  it("cuts names over 6 characters with an ellipsis", () => {
    expect(formatDancerName("アレクサンドラ")).toBe("アレク\nサン…");
  });

  it("leaves names with spaces to the canvas's own word wrap", () => {
    expect(formatDancerName("Alex Kim")).toBe("Alex Kim");
  });
});
