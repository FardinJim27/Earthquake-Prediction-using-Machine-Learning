/**
 * Computes Pearson correlation coefficient between two numeric arrays
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0 || n !== y.length) return 0;

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;
  return numerator / denominator;
}

export interface CorrelationMatrix {
  variables: { key: string; label: string }[];
  matrix: number[][]; // [row][col]
}

/**
 * Calculates symmetric correlation matrix for given variables from a dataset
 */
export function calculateCorrelationMatrix(
  data: any[],
  variables: { key: string; label: string }[]
): CorrelationMatrix {
  // Extract clean paired series where all requested variables are valid numbers
  const cleanedRows: Record<string, number>[] = [];

  for (const row of data) {
    let isValid = true;
    const cleanRow: Record<string, number> = {};
    for (const v of variables) {
      const val = parseFloat(row[v.key]);
      if (isNaN(val)) {
        isValid = false;
        break;
      }
      cleanRow[v.key] = val;
    }
    if (isValid) {
      cleanedRows.push(cleanRow);
    }
  }

  // Pre-extract series arrays
  const series: Record<string, number[]> = {};
  for (const v of variables) {
    series[v.key] = cleanedRows.map(r => r[v.key]);
  }

  const n = variables.length;
  const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
      } else if (j > i) {
        const r = pearsonCorrelation(series[variables[i].key], series[variables[j].key]);
        matrix[i][j] = Number(r.toFixed(3));
        matrix[j][i] = Number(r.toFixed(3));
      }
    }
  }

  return {
    variables,
    matrix
  };
}
