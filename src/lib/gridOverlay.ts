export interface EarthquakeRecord {
  latitude: number;
  longitude: number;
  depth: number;
  mag: number;
  gap?: number;
  rms?: number;
  place?: string;
  [key: string]: any;
}

export type RiskMetric = 'frequency' | 'avgMagnitude' | 'composite';

export interface GridCell {
  id: string;
  row: number;
  col: number;
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
  centerLat: number;
  centerLng: number;
  count: number;
  avgMag: number;
  maxMag: number;
  minMag: number;
  avgDepth: number;
  riskScore: number; // 0 to 100 normalized score
  riskLevel: 'extreme' | 'high' | 'moderate' | 'low';
  percentile: number;
}

export interface GridAnalysisResult {
  cells: GridCell[];
  gridBounds: {
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
  };
  rows: number;
  cols: number;
  stepLat: number;
  stepLng: number;
  maxCount: number;
  minCount: number;
  maxAvgMag: number;
  minAvgMag: number;
  maxRiskScore: number;
  highestRiskCell: GridCell | null;
  highRiskCells: GridCell[];
  totalEvents: number;
}

/**
 * Computes a 2D spatial grid overlay over the dataset's geographic coordinates,
 * calculating earthquake frequency, average magnitude, maximum magnitude, and composite risk.
 */
export function computeSeismicGrid(
  data: EarthquakeRecord[],
  metric: RiskMetric = 'frequency',
  stepSizeDeg: number = 1.0,
  minEventsThreshold: number = 1
): GridAnalysisResult {
  if (!data || data.length === 0) {
    return {
      cells: [],
      gridBounds: { latMin: 0, latMax: 0, lngMin: 0, lngMax: 0 },
      rows: 0,
      cols: 0,
      stepLat: stepSizeDeg,
      stepLng: stepSizeDeg,
      maxCount: 0,
      minCount: 0,
      maxAvgMag: 0,
      minAvgMag: 0,
      maxRiskScore: 0,
      highestRiskCell: null,
      highRiskCells: [],
      totalEvents: 0
    };
  }

  // Find dataset geographic bounds
  const lats = data.map(d => d.latitude).filter(v => !isNaN(v));
  const lngs = data.map(d => d.longitude).filter(v => !isNaN(v));

  const minLat = Math.floor(Math.min(...lats));
  const maxLat = Math.ceil(Math.max(...lats));
  const minLng = Math.floor(Math.min(...lngs));
  const maxLng = Math.ceil(Math.max(...lngs));

  const stepLat = stepSizeDeg;
  const stepLng = stepSizeDeg;

  const rows = Math.max(1, Math.ceil((maxLat - minLat) / stepLat));
  const cols = Math.max(1, Math.ceil((maxLng - minLng) / stepLng));

  // Initialize cells matrix
  const cellMap = new Map<string, {
    row: number;
    col: number;
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
    quakes: EarthquakeRecord[];
  }>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellLatMin = minLat + r * stepLat;
      const cellLatMax = cellLatMin + stepLat;
      const cellLngMin = minLng + c * stepLng;
      const cellLngMax = cellLngMin + stepLng;
      const key = `${r}_${c}`;

      cellMap.set(key, {
        row: r,
        col: c,
        latMin: cellLatMin,
        latMax: cellLatMax,
        lngMin: cellLngMin,
        lngMax: cellLngMax,
        quakes: []
      });
    }
  }

  // Assign quakes to grid cells
  data.forEach(d => {
    const lat = d.latitude;
    const lng = d.longitude;
    if (isNaN(lat) || isNaN(lng)) return;

    let r = Math.floor((lat - minLat) / stepLat);
    let c = Math.floor((lng - minLng) / stepLng);

    if (r >= rows) r = rows - 1;
    if (r < 0) r = 0;
    if (c >= cols) c = cols - 1;
    if (c < 0) c = 0;

    const key = `${r}_${c}`;
    const cell = cellMap.get(key);
    if (cell) {
      cell.quakes.push(d);
    }
  });

  // Calculate statistics for cells with data
  const rawCells: Array<Omit<GridCell, 'riskScore' | 'riskLevel' | 'percentile'>> = [];

  let maxCount = 0;
  let minCount = Infinity;
  let maxAvgMag = 0;
  let minAvgMag = Infinity;

  cellMap.forEach((entry, key) => {
    const count = entry.quakes.length;
    if (count < minEventsThreshold) return;

    const mags = entry.quakes.map(q => q.mag).filter(m => !isNaN(m));
    const depths = entry.quakes.map(q => q.depth).filter(dp => !isNaN(dp));

    const avgMag = mags.reduce((a, b) => a + b, 0) / (mags.length || 1);
    const maxMag = Math.max(...mags, 0);
    const minMag = Math.min(...mags, 0);
    const avgDepth = depths.reduce((a, b) => a + b, 0) / (depths.length || 1);

    if (count > maxCount) maxCount = count;
    if (count < minCount) minCount = count;
    if (avgMag > maxAvgMag) maxAvgMag = avgMag;
    if (avgMag < minAvgMag) minAvgMag = avgMag;

    rawCells.push({
      id: `cell_${key}`,
      row: entry.row,
      col: entry.col,
      latMin: entry.latMin,
      latMax: entry.latMax,
      lngMin: entry.lngMin,
      lngMax: entry.lngMax,
      centerLat: (entry.latMin + entry.latMax) / 2,
      centerLng: (entry.lngMin + entry.lngMax) / 2,
      count,
      avgMag,
      maxMag,
      minMag,
      avgDepth
    });
  });

  if (minCount === Infinity) minCount = 0;
  if (minAvgMag === Infinity) minAvgMag = 0;

  // Compute Risk Scores and Risk Levels
  const countSpan = maxCount - minCount || 1;
  const magSpan = maxAvgMag - minAvgMag || 1;

  const cells: GridCell[] = rawCells.map(cell => {
    let rawScore = 0;

    if (metric === 'frequency') {
      // Frequency based: normalized 0 to 100
      rawScore = ((cell.count - minCount) / countSpan) * 100;
    } else if (metric === 'avgMagnitude') {
      // Average Magnitude based: normalized 0 to 100
      rawScore = ((cell.avgMag - minAvgMag) / magSpan) * 100;
    } else {
      // Composite Risk: 60% frequency weight + 40% magnitude severity weight
      const normFreq = (cell.count - minCount) / countSpan;
      const normMag = (cell.avgMag - minAvgMag) / magSpan;
      rawScore = (normFreq * 0.55 + normMag * 0.45) * 100;
    }

    const riskScore = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));

    // Qualitative category
    let riskLevel: 'extreme' | 'high' | 'moderate' | 'low' = 'low';
    if (riskScore >= 75) {
      riskLevel = 'extreme';
    } else if (riskScore >= 50) {
      riskLevel = 'high';
    } else if (riskScore >= 25) {
      riskLevel = 'moderate';
    }

    return {
      ...cell,
      riskScore,
      riskLevel,
      percentile: 0
    };
  });

  // Calculate percentiles
  cells.sort((a, b) => b.riskScore - a.riskScore);
  const totalCells = cells.length;
  cells.forEach((cell, idx) => {
    cell.percentile = Math.round(((totalCells - idx) / totalCells) * 100);
  });

  const highestRiskCell = cells.length > 0 ? cells[0] : null;
  const highRiskCells = cells.filter(c => c.riskLevel === 'extreme' || c.riskLevel === 'high').slice(0, 6);

  return {
    cells,
    gridBounds: {
      latMin: minLat,
      latMax: maxLat,
      lngMin: minLng,
      lngMax: maxLng
    },
    rows,
    cols,
    stepLat,
    stepLng,
    maxCount,
    minCount,
    maxAvgMag,
    minAvgMag,
    maxRiskScore: highestRiskCell ? highestRiskCell.riskScore : 0,
    highestRiskCell,
    highRiskCells,
    totalEvents: data.length
  };
}

/**
 * Returns color hex and tailwind styles corresponding to a normalized risk score
 */
export function getRiskColor(riskScore: number, opacity: number = 0.75): {
  fill: string;
  stroke: string;
  text: string;
  badge: string;
  bgLight: string;
} {
  if (riskScore >= 75) {
    // Extreme Risk - Red / Crimson
    return {
      fill: `rgba(225, 29, 72, ${opacity})`,
      stroke: '#be123c',
      text: 'text-rose-700',
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      bgLight: 'bg-rose-50'
    };
  } else if (riskScore >= 50) {
    // High Risk - Orange / Amber
    return {
      fill: `rgba(234, 88, 12, ${opacity})`,
      stroke: '#c2410c',
      text: 'text-amber-800',
      badge: 'bg-orange-100 text-orange-800 border-orange-300',
      bgLight: 'bg-orange-50'
    };
  } else if (riskScore >= 25) {
    // Moderate Risk - Yellow / Gold
    return {
      fill: `rgba(234, 179, 8, ${opacity})`,
      stroke: '#a16207',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      bgLight: 'bg-amber-50'
    };
  }
  // Low Risk - Indigo / Slate
  return {
    fill: `rgba(99, 102, 241, ${opacity * 0.7})`,
    stroke: '#6366f1',
    text: 'text-indigo-700',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    bgLight: 'bg-indigo-50'
  };
}
