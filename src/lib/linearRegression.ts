/**
 * Multiple Linear Regression implementation using Ordinary Least Squares (OLS)
 * with Tikhonov / Ridge regularization for numerical stability.
 */

export interface FeatureImportance {
  feature: string;
  displayName: string;
  unit: string;
  rawCoefficient: number;
  standardizedBeta: number;
  importanceScore: number; // |standardizedBeta|
  relativePercentage: number; // Percentage of total importance across all features
  rank: number;
  direction: 'positive' | 'negative';
  description: string;
  mean: number;
  stdDev: number;
}

export interface LinearRegressionModel {
  intercept: number;
  coefficients: Record<string, number>;
  r2: number;
  rmse: number;
  mae: number;
  sampleCount: number;
  featureMeans: Record<string, number>;
  featureStdDevs: Record<string, number>;
  targetStdDev: number;
  featureImportance: FeatureImportance[];
}

export interface LinearPredictionResult {
  magnitude: number;
  uncertainty: number; // Based on residual standard error
  formula: string;
  contributions: {
    feature: string;
    inputValue: number;
    coefficient: number;
    contribution: number;
  }[];
}

/**
 * Solve system of linear equations A * x = b using Gauss-Jordan elimination
 * with partial pivoting.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  // Create augmented matrix [A | b]
  const M: number[][] = A.map((row, i) => [...row, b[i]]);

  for (let i = 0; i < n; i++) {
    // Search for maximum in this column (partial pivoting)
    let maxEl = Math.abs(M[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > maxEl) {
        maxEl = Math.abs(M[k][i]);
        maxRow = k;
      }
    }

    // Swap maximum row with current row
    if (maxRow !== i) {
      const tmp = M[i];
      M[i] = M[maxRow];
      M[maxRow] = tmp;
    }

    // Check for singular matrix
    if (Math.abs(M[i][i]) < 1e-12) {
      return null;
    }

    // Normalize pivot row
    const pivot = M[i][i];
    for (let j = i; j <= n; j++) {
      M[i][j] /= pivot;
    }

    // Eliminate other rows
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = M[k][i];
        for (let j = i; j <= n; j++) {
          M[k][j] -= factor * M[i][j];
        }
      }
    }
  }

  return M.map(row => row[n]);
}

/**
 * Train a Multiple Linear Regression model on the dataset.
 */
export function trainLinearRegression(
  data: any[],
  features: string[],
  targetKey: string = 'mag'
): LinearRegressionModel | null {
  // Filter valid data rows
  const cleanData = data.filter(d => {
    const target = parseFloat(d[targetKey]);
    if (isNaN(target)) return false;
    for (const f of features) {
      const val = parseFloat(d[f]);
      if (isNaN(val)) return false;
    }
    return true;
  });

  const N = cleanData.length;
  if (N < features.length + 2) return null;

  const P = features.length;
  // Dimensions of X is N x (P + 1), where column 0 is intercept (1.0)
  // We want to solve (X^T * X + lambda * I) * beta = X^T * y
  const dim = P + 1;
  const XTX: number[][] = Array.from({ length: dim }, () => Array(dim).fill(0));
  const XTy: number[] = Array(dim).fill(0);

  // Compute means for reporting
  const featureMeans: Record<string, number> = {};
  for (const f of features) {
    featureMeans[f] = cleanData.reduce((sum, d) => sum + parseFloat(d[f]), 0) / N;
  }

  // Accumulate X^T * X and X^T * y in a single pass
  for (const row of cleanData) {
    const yVal = parseFloat(row[targetKey]);
    const xRow: number[] = [1.0]; // Intercept term
    for (const f of features) {
      xRow.push(parseFloat(row[f]));
    }

    for (let i = 0; i < dim; i++) {
      XTy[i] += xRow[i] * yVal;
      for (let j = 0; j < dim; j++) {
        XTX[i][j] += xRow[i] * xRow[j];
      }
    }
  }

  // Add small Ridge regularization to diagonal for numerical stability (avoid collinearity issues)
  const lambda = 1e-4;
  for (let i = 1; i < dim; i++) {
    XTX[i][i] += lambda;
  }

  const beta = solveLinearSystem(XTX, XTy);
  if (!beta) return null;

  const intercept = beta[0];
  const coefficients: Record<string, number> = {};
  features.forEach((f, idx) => {
    coefficients[f] = beta[idx + 1];
  });

  // Calculate goodness-of-fit metrics: R², RMSE, MAE
  let ssRes = 0;
  let absErrSum = 0;
  let ySum = 0;

  for (const row of cleanData) {
    const actual = parseFloat(row[targetKey]);
    ySum += actual;

    let pred = intercept;
    for (const f of features) {
      pred += coefficients[f] * parseFloat(row[f]);
    }

    const err = actual - pred;
    ssRes += err * err;
    absErrSum += Math.abs(err);
  }

  const yMean = ySum / N;
  let ssTot = 0;
  for (const row of cleanData) {
    const actual = parseFloat(row[targetKey]);
    ssTot += Math.pow(actual - yMean, 2);
  }

  const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
  const rmse = Math.sqrt(ssRes / N);
  const mae = absErrSum / N;
  const targetStdDev = Math.sqrt(ssTot / N);

  // Compute standard deviations for all features
  const featureStdDevs: Record<string, number> = {};
  for (const f of features) {
    const mean = featureMeans[f];
    const variance =
      cleanData.reduce((sum, d) => sum + Math.pow(parseFloat(d[f]) - mean, 2), 0) / N;
    featureStdDevs[f] = Math.sqrt(variance);
  }

  // Feature metadata dictionaries
  const featureMeta: Record<
    string,
    { name: string; unit: string; description: string }
  > = {
    latitude: {
      name: 'Latitude',
      unit: '°N',
      description: 'North-South position along tectonic subduction plates and island arc faults.'
    },
    longitude: {
      name: 'Longitude',
      unit: '°E',
      description: 'East-West position relative to oceanic trenches and megathrust rupture zones.'
    },
    depth: {
      name: 'Focal Depth',
      unit: 'km',
      description: 'Hypocenter depth beneath the crust (shallow brittle zone vs deep subduction slab).'
    },
    gap: {
      name: 'Azimuthal Gap',
      unit: '°',
      description: 'Station coverage gap around epicenter indicating seismic network observation angle.'
    },
    rms: {
      name: 'RMS Travel Time',
      unit: 's',
      description: 'Wave arrival-time residual fit assessing seismograph detection consistency.'
    }
  };

  // Compute standardized beta coefficients: beta* = beta * (sigma_x / sigma_y)
  const rawImportanceList = features.map(f => {
    const rawCoef = coefficients[f];
    const featStd = featureStdDevs[f] || 1;
    const standardizedBeta = targetStdDev > 0 ? rawCoef * (featStd / targetStdDev) : 0;
    const importanceScore = Math.abs(standardizedBeta);
    const meta = featureMeta[f] || {
      name: f.charAt(0).toUpperCase() + f.slice(1),
      unit: '',
      description: `Input variable ${f} used in regression modeling.`
    };

    return {
      feature: f,
      displayName: meta.name,
      unit: meta.unit,
      rawCoefficient: rawCoef,
      standardizedBeta,
      importanceScore,
      relativePercentage: 0, // Computed after summing
      rank: 0,
      direction: (rawCoef >= 0 ? 'positive' : 'negative') as 'positive' | 'negative',
      description: meta.description,
      mean: featureMeans[f],
      stdDev: featStd
    };
  });

  // Sort descending by absolute standardized importance score
  rawImportanceList.sort((a, b) => b.importanceScore - a.importanceScore);

  const totalImportance = rawImportanceList.reduce((acc, item) => acc + item.importanceScore, 0);

  const featureImportance: FeatureImportance[] = rawImportanceList.map((item, idx) => ({
    ...item,
    rank: idx + 1,
    relativePercentage: totalImportance > 0 ? (item.importanceScore / totalImportance) * 100 : 0
  }));

  return {
    intercept,
    coefficients,
    r2,
    rmse,
    mae,
    sampleCount: N,
    featureMeans,
    featureStdDevs,
    targetStdDev,
    featureImportance
  };
}

/**
 * Predict magnitude using trained Multiple Linear Regression model
 */
export function predictLinearRegression(
  model: LinearRegressionModel,
  input: Record<string, number>
): LinearPredictionResult {
  let magnitude = model.intercept;
  const contributions: LinearPredictionResult['contributions'] = [];

  for (const [feat, coef] of Object.entries(model.coefficients)) {
    const val = input[feat] ?? model.featureMeans[feat] ?? 0;
    const contribution = coef * val;
    magnitude += contribution;
    contributions.push({
      feature: feat,
      inputValue: val,
      coefficient: coef,
      contribution
    });
  }

  // Generate readable mathematical formula
  const formulaParts = [model.intercept.toFixed(2)];
  for (const [feat, coef] of Object.entries(model.coefficients)) {
    const sign = coef >= 0 ? '+' : '-';
    formulaParts.push(`${sign} ${Math.abs(coef).toFixed(4)} × ${feat}`);
  }

  return {
    magnitude: Math.max(0, magnitude),
    uncertainty: model.rmse, // Residual standard error serves as empirical uncertainty
    formula: `M = ${formulaParts.join(' ')}`,
    contributions
  };
}
