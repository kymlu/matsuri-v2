import { getPathLength, getPathLineOps } from "./editorCalculationHelper";

describe("getPathLength", () => {
  it("measures straight segments exactly", () => {
    expect(getPathLength([0, 0, 3, 0, 3, 4], 0)).toBeCloseTo(7);
    expect(getPathLength([0, 0, 6, 8])).toBeCloseTo(10);
  });

  it("measures a curve through its bend, close to a very fine measurement", () => {
    const points = [0, 0, 5, 5, 10, 0];
    const curve = getPathLength(points, 0.5);
    // The curve passes through the bend, so it is at least as long as the corner.
    expect(curve).toBeGreaterThanOrEqual(2 * Math.hypot(5, 5));
    // The same curves measured in 2,000 steps each.
    let fine = 0, x = 0, y = 0;
    getPathLineOps(points, 0.5).filter(o => o.op === "c").forEach(({ c }) => {
      const x0 = x, y0 = y;
      for (let i = 1; i <= 2000; i++) {
        const t = i / 2000, u = 1 - t;
        const nx = u * u * u * x0 + 3 * u * u * t * c[0] + 3 * u * t * t * c[2] + t * t * t * c[4];
        const ny = u * u * u * y0 + 3 * u * u * t * c[1] + 3 * u * t * t * c[3] + t * t * t * c[5];
        fine += Math.hypot(nx - x, ny - y);
        x = nx; y = ny;
      }
    });
    expect(Math.abs(curve - fine)).toBeLessThan(0.01);
  });
});
