import { useState, useMemo } from 'react';
import { CorrelationMatrix } from '../lib/correlation';
import { Info, HelpCircle } from 'lucide-react';

interface HeatmapProps {
  correlationData: CorrelationMatrix;
  targetKey?: string;
}

export function CorrelationHeatmap({ correlationData, targetKey = 'mag' }: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    rowIdx: number;
    colIdx: number;
  } | null>(null);

  const { variables, matrix } = correlationData;

  // Find index of target variable (magnitude)
  const targetIdx = useMemo(() => {
    return variables.findIndex(v => v.key === targetKey);
  }, [variables, targetKey]);

  // Sort features by absolute correlation with magnitude for quick insights
  const featureRankings = useMemo(() => {
    if (targetIdx === -1) return [];
    return variables
      .map((v, idx) => ({
        ...v,
        correlation: matrix[targetIdx][idx],
        absCorrelation: Math.abs(matrix[targetIdx][idx])
      }))
      .filter(v => v.key !== targetKey)
      .sort((a, b) => b.absCorrelation - a.absCorrelation);
  }, [variables, matrix, targetIdx, targetKey]);

  // Color generator for Pearson correlation [-1, 1]
  // Negative: Reddish / Coral / Amber
  // Near 0: Neutral zinc / Slate
  // Positive: Indigo / Blue
  const getCellColor = (value: number) => {
    // Map value from -1 to 1 into background color
    if (Math.abs(value - 1) < 0.001) {
      return {
        bg: 'bg-indigo-600',
        text: 'text-white font-semibold',
        border: 'border-indigo-700'
      };
    }

    if (value > 0) {
      const alpha = Math.min(1, Math.max(0.12, Math.abs(value)));
      if (alpha > 0.4) {
        return {
          style: { backgroundColor: `rgba(79, 70, 229, ${alpha})` }, // indigo-600
          text: alpha > 0.45 ? 'text-white font-medium' : 'text-indigo-950 font-medium',
          border: 'border-indigo-200/50'
        };
      }
      return {
        style: { backgroundColor: `rgba(99, 102, 241, ${alpha * 0.85})` },
        text: 'text-zinc-800',
        border: 'border-zinc-200/50'
      };
    } else {
      const alpha = Math.min(1, Math.max(0.12, Math.abs(value)));
      if (alpha > 0.4) {
        return {
          style: { backgroundColor: `rgba(225, 29, 72, ${alpha})` }, // rose-600
          text: alpha > 0.45 ? 'text-white font-medium' : 'text-rose-950 font-medium',
          border: 'border-rose-200/50'
        };
      }
      return {
        style: { backgroundColor: `rgba(244, 63, 94, ${alpha * 0.85})` },
        text: 'text-zinc-800',
        border: 'border-zinc-200/50'
      };
    }
  };

  const getInterpretation = (r: number) => {
    const abs = Math.abs(r);
    const direction = r > 0 ? 'positive' : r < 0 ? 'negative' : 'neutral';
    if (abs >= 0.7) return `Strong ${direction} relationship`;
    if (abs >= 0.4) return `Moderate ${direction} relationship`;
    if (abs >= 0.2) return `Weak ${direction} correlation`;
    if (abs >= 0.05) return `Slight / negligible correlation`;
    return 'Virtually uncorrelated';
  };

  return (
    <div className="space-y-6">
      {/* Top summary cards showing feature correlation against target (Magnitude) */}
      <div className="border border-zinc-200 bg-zinc-50/70 rounded-xl p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 uppercase tracking-wider">
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            Feature Correlation with Target (Magnitude)
          </div>
          <span className="text-[11px] text-zinc-500">Ranked by absolute strength</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {featureRankings.map((feat) => {
            const isPos = feat.correlation >= 0;
            return (
              <div
                key={feat.key}
                className="bg-white border border-zinc-200/80 rounded-lg p-2.5 shadow-xs flex flex-col justify-between"
              >
                <div className="text-xs font-medium text-zinc-600 truncate">{feat.label}</div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span
                    className={`text-base font-bold font-mono ${
                      feat.absCorrelation > 0.2
                        ? isPos
                          ? 'text-indigo-600'
                          : 'text-rose-600'
                        : 'text-zinc-700'
                    }`}
                  >
                    {feat.correlation > 0 ? `+${feat.correlation.toFixed(3)}` : feat.correlation.toFixed(3)}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {Math.round(feat.absCorrelation * 100)}%
                  </span>
                </div>
                <div className="mt-1.5 w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isPos ? 'bg-indigo-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, feat.absCorrelation * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatmap Matrix Display */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full align-middle">
          <div className="table border-collapse w-full text-center">
            {/* Table Header: Column Names */}
            <div className="table-row">
              <div className="table-cell p-2 w-28 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Features
              </div>
              {variables.map((col, cIdx) => (
                <div
                  key={col.key}
                  className={`table-cell p-2 text-xs font-semibold text-zinc-700 uppercase tracking-wider transition-colors ${
                    hoveredCell?.colIdx === cIdx ? 'text-indigo-600 bg-indigo-50/50 rounded-t' : ''
                  } ${col.key === targetKey ? 'text-indigo-900 bg-indigo-50/30' : ''}`}
                >
                  <div className="truncate max-w-[90px] mx-auto" title={col.label}>
                    {col.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            {variables.map((rowVar, rIdx) => {
              const isTargetRow = rowVar.key === targetKey;
              return (
                <div key={rowVar.key} className="table-row">
                  {/* Row Header */}
                  <div
                    className={`table-cell p-2 text-left text-xs font-medium text-zinc-700 transition-colors ${
                      hoveredCell?.rowIdx === rIdx ? 'text-indigo-600 bg-indigo-50/50 rounded-l' : ''
                    } ${isTargetRow ? 'font-semibold text-indigo-950 bg-indigo-50/30' : ''}`}
                  >
                    <span className="truncate block max-w-[110px]" title={rowVar.label}>
                      {rowVar.label}
                    </span>
                  </div>

                  {/* Row Cells */}
                  {variables.map((colVar, cIdx) => {
                    const value = matrix[rIdx][cIdx];
                    const isHovered =
                      hoveredCell?.rowIdx === rIdx && hoveredCell?.colIdx === cIdx;
                    const isRelated =
                      hoveredCell?.rowIdx === rIdx || hoveredCell?.colIdx === cIdx;
                    const cellColor = getCellColor(value);

                    return (
                      <div
                        key={colVar.key}
                        className="table-cell p-1"
                        onMouseEnter={() => setHoveredCell({ rowIdx: rIdx, colIdx: cIdx })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div
                          style={cellColor.style}
                          className={`h-11 sm:h-12 w-full flex items-center justify-center rounded-lg border text-xs transition-all cursor-pointer font-mono select-none ${
                            cellColor.bg || ''
                          } ${cellColor.text} ${
                            isHovered
                              ? 'ring-2 ring-zinc-900 shadow-md scale-105 z-10'
                              : isRelated
                              ? 'ring-1 ring-indigo-300'
                              : 'border-zinc-200/60'
                          }`}
                          title={`${rowVar.label} vs ${colVar.label}: r = ${value}`}
                        >
                          {value > 0 && value < 1 ? `+${value.toFixed(2)}` : value.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive cell inspection callout & Color Legend */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-zinc-200">
        {/* Cell inspect details */}
        <div className="flex-1 min-h-[36px] flex items-center text-xs text-zinc-600 bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-200/70">
          {hoveredCell !== null ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-zinc-900">
                {variables[hoveredCell.rowIdx].label}
              </span>
              <span className="text-zinc-400">↔</span>
              <span className="font-semibold text-zinc-900">
                {variables[hoveredCell.colIdx].label}:
              </span>
              <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-100">
                r = {matrix[hoveredCell.rowIdx][hoveredCell.colIdx].toFixed(3)}
              </span>
              <span className="text-zinc-500">
                ({getInterpretation(matrix[hoveredCell.rowIdx][hoveredCell.colIdx])})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-zinc-400">
              <HelpCircle className="w-3.5 h-3.5" />
              Hover over any cell in the heatmap matrix to view pair details and correlation interpretation.
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 shrink-0">
          <span className="text-rose-700 font-medium font-mono">-1.0 (Inverse)</span>
          <div className="h-3 w-28 rounded-full bg-gradient-to-r from-rose-500 via-zinc-200 to-indigo-600 border border-zinc-300 shadow-inner" />
          <span className="text-indigo-700 font-medium font-mono">+1.0 (Direct)</span>
        </div>
      </div>
    </div>
  );
}
