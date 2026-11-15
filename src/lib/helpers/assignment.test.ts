import { assign } from "./assignment";

const total = (cost: number[][], a: number[]) => a.reduce((sum, j, i) => sum + cost[i][j], 0);

// Every permutation's total, for checking small cases against brute force.
function bestTotal(cost: number[][]): number {
  const n = cost.length;
  let best = Infinity;
  const go = (i: number, used: boolean[], sum: number) => {
    if (i === n) { best = Math.min(best, sum); return; }
    for (let j = 0; j < n; j++) if (!used[j]) { used[j] = true; go(i + 1, used, sum + cost[i][j]); used[j] = false; }
  };
  go(0, new Array(n).fill(false), 0);
  return best;
}

describe("assign", () => {
  it("handles empty and single matrices", () => {
    expect(assign([])).toEqual([]);
    expect(assign([[5]])).toEqual([0]);
  });

  it("finds the cheapest pairing", () => {
    expect(assign([[4, 1, 3], [2, 0, 5], [3, 2, 2]])).toEqual([1, 0, 2]);
  });

  it("matches brute force on random matrices", () => {
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let n = 2; n <= 6; n++) {
      for (let k = 0; k < 20; k++) {
        const cost = Array.from({ length: n }, () => Array.from({ length: n }, () => Math.round(rand() * 100) / 10));
        const a = assign(cost);
        expect(new Set(a).size).toBe(n);
        expect(total(cost, a)).toBeCloseTo(bestTotal(cost), 9);
      }
    }
  });

  it("is fast enough for 150 people", () => {
    const n = 150;
    const cost = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => Math.abs(Math.sin(i * 7 + j * 13)) * 20));
    const start = performance.now();
    assign(cost);
    expect(performance.now() - start).toBeLessThan(200);
  });
});
