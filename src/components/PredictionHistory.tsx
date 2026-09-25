import React, { useState } from 'react';
import { History, Play, Trash2, X, ChevronDown, ChevronUp, Clock, Check } from 'lucide-react';
import { PredictionResult } from '../lib/knn';

export interface HistoryItem {
  id: string;
  timestamp: string;
  dateStr: string;
  inputs: {
    latitude: number;
    longitude: number;
    depth: number;
    gap: number;
    rms: number;
  };
  result: PredictionResult;
}

interface PredictionHistoryProps {
  history: HistoryItem[];
  activeScenarioId?: string | null;
  onSelectScenario: (item: HistoryItem) => void;
  onDeleteScenario: (id: string) => void;
  onClearHistory: () => void;
  currentInputs?: Record<string, string | number>;
}

export const PredictionHistory: React.FC<PredictionHistoryProps> = ({
  history,
  activeScenarioId,
  onSelectScenario,
  onDeleteScenario,
  onClearHistory,
  currentInputs
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [justLoadedId, setJustLoadedId] = useState<string | null>(null);

  const getMagnitudeBadge = (mag: number) => {
    if (mag >= 7.0) {
      return {
        bg: 'bg-rose-100 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
        label: 'Severe'
      };
    } else if (mag >= 5.5) {
      return {
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        label: 'Strong'
      };
    } else if (mag >= 4.5) {
      return {
        bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        dot: 'bg-indigo-500',
        label: 'Moderate'
      };
    }
    return {
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Light'
    };
  };

  const isCurrentActive = (item: HistoryItem) => {
    if (activeScenarioId === item.id) return true;
    if (!currentInputs) return false;
    return (
      Math.abs(Number(currentInputs.latitude) - item.inputs.latitude) < 0.0001 &&
      Math.abs(Number(currentInputs.longitude) - item.inputs.longitude) < 0.0001 &&
      Math.abs(Number(currentInputs.depth) - item.inputs.depth) < 0.01 &&
      Math.abs(Number(currentInputs.gap) - item.inputs.gap) < 0.01 &&
      Math.abs(Number(currentInputs.rms) - item.inputs.rms) < 0.01
    );
  };

  const handleItemClick = (item: HistoryItem) => {
    setJustLoadedId(item.id);
    onSelectScenario(item);
    setTimeout(() => {
      setJustLoadedId(null);
    }, 1500);
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden transition-all">
      {/* Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-zinc-900">Scenario History</h3>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-zinc-200/80 text-zinc-700">
                {history.length} / 5
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Click any scenario below to re-run
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors"
              title="Clear all saved history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            title={isCollapsed ? "Expand history list" : "Collapse history list"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-6 px-4 bg-zinc-50/70 border border-dashed border-zinc-200 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-2 text-indigo-500">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-zinc-700">No predictions saved yet</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[240px] mx-auto">
                Run a prediction using the form above. The last 5 successful runs will be preserved here for rapid re-testing.
              </p>
            </div>
          ) : (
            history.map((item, index) => {
              const active = isCurrentActive(item);
              const badge = getMagnitudeBadge(item.result.magnitude);
              const isJustLoaded = justLoadedId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group relative rounded-lg border p-3 text-left transition-all cursor-pointer ${
                    active
                      ? 'border-indigo-400 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-400/40'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60 hover:shadow-xs'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemClick(item);
                    }
                  }}
                  title="Click to load inputs and re-run this prediction scenario"
                >
                  {/* Top row: Magnitude & Actions */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-semibold text-zinc-400">
                        #{index + 1}
                      </span>
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-semibold ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                        <span>M {item.result.magnitude.toFixed(2)}</span>
                        <span className="text-[10px] font-normal opacity-80">
                          ±{item.result.uncertainty.toFixed(2)}
                        </span>
                      </div>

                      {active && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-600 text-white shadow-2xs">
                          Active
                        </span>
                      )}

                      {isJustLoaded && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded animate-in fade-in duration-150">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Re-run!
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {item.timestamp}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteScenario(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 rounded transition-all ml-1"
                        title="Remove this scenario from history"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Parameter chips */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-zinc-600 bg-zinc-50/80 p-2 rounded border border-zinc-100 font-mono">
                    <div className="truncate">
                      <span className="text-zinc-400 font-sans">Loc: </span>
                      {item.inputs.latitude.toFixed(2)}°, {item.inputs.longitude.toFixed(2)}°
                    </div>
                    <div className="truncate text-right">
                      <span className="text-zinc-400 font-sans">Depth: </span>
                      {item.inputs.depth.toFixed(1)} km
                    </div>
                    <div className="truncate">
                      <span className="text-zinc-400 font-sans">Gap: </span>
                      {item.inputs.gap.toFixed(1)}°
                    </div>
                    <div className="truncate text-right">
                      <span className="text-zinc-400 font-sans">RMS: </span>
                      {item.inputs.rms.toFixed(2)} s
                    </div>
                  </div>

                  {/* Re-run button footer */}
                  <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-500">
                      k={item.result.k} neighbors (avg M{item.result.magnitude.toFixed(1)})
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-indigo-600 group-hover:text-indigo-700 transition-colors">
                      <Play className="w-3 h-3 fill-current" />
                      <span>Re-run scenario</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {history.length > 0 && (
            <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-400 px-1">
              <span>Automatically keeps latest 5 runs</span>
              <span>Local browser session</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
