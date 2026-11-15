// Minimum-cost assignment (the Hungarian algorithm, O(n³)).
// cost[i][j] is the cost of giving row i column j; the matrix must be square.
// Returns, for each row, the column it gets, so that the total cost is as small as possible.
export function assign(cost: number[][]): number[] {
  const n = cost.length;
  if (n === 0) return [];
  // 1-based arrays, as in the classic potentials formulation.
  const u = new Array<number>(n + 1).fill(0);
  const v = new Array<number>(n + 1).fill(0);
  const rowOfCol = new Array<number>(n + 1).fill(0);
  const way = new Array<number>(n + 1).fill(0);

  for (let row = 1; row <= n; row++) {
    rowOfCol[0] = row;
    let col0 = 0;
    const minv = new Array<number>(n + 1).fill(Infinity);
    const used = new Array<boolean>(n + 1).fill(false);
    do {
      used[col0] = true;
      const i0 = rowOfCol[col0];
      let delta = Infinity, col1 = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = col0; }
        if (minv[j] < delta) { delta = minv[j]; col1 = j; }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) { u[rowOfCol[j]] += delta; v[j] -= delta; }
        else minv[j] -= delta;
      }
      col0 = col1;
    } while (rowOfCol[col0] !== 0);
    do {
      const col1 = way[col0];
      rowOfCol[col0] = rowOfCol[col1];
      col0 = col1;
    } while (col0 !== 0);
  }

  const result = new Array<number>(n).fill(-1);
  for (let j = 1; j <= n; j++) if (rowOfCol[j] > 0) result[rowOfCol[j] - 1] = j - 1;
  return result;
}
