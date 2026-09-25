import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { LinearRegressionModel } from '../lib/linearRegression';

interface FeatureImportanceCardProps {
  linearModel: LinearRegressionModel;
  currentInputs?: Record<string, number | string>;
}

type MetricMode = 'standardized' | 'percentage' | 'raw';

export const FeatureImportanceCard: React.FC<FeatureImportanceCardProps> = ({
  linearModel,
  currentInputs
}) => {
  const [metricMode, setMetricMode] = useState<MetricMode>('standardized');
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const { featureImportance, r2, sampleCount } = linearModel;

  // Max score for relative bar scaling
  const maxScore = Math.max(...featureImportance.map((f) => f.importanceScore), 0.001);
  const maxRawAbs = Math.max(...featureImportance.map((f) => Math.abs(f.rawCoefficient)), 0.001);

  // Top driver
  const topDriver = featureImportance[0];

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden transition-all duration-200">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-100 bg-zinc-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 shadow-2xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-zinc-900">
                Feature Importance & Magnitude Drivers
              </h3>
              {topDriver && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  <Award className="w-3 h-3 text-rose-600" />
                  Primary Driver: {topDriver.displayName}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Ranked sensitivity analysis evaluating which seismic variables drive magnitude predictions most significantly
            </p>
          </div>
        </div>

        {/* Metric Selector Controls */}
        <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-lg text-xs self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setMetricMode('standardized')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              metricMode === 'standardized'
                ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
            title="Standardized Beta (|β*|): Unitless standardized effect size normalized by standard deviation"
          >
            Std Beta (|β*|)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('percentage')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              metricMode === 'percentage'
                ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
            title="Relative Share (%): Proportional relative influence contributing to prediction variance"
          >
            Relative Share (%)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('raw')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              metricMode === 'raw'
                ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
            title="Raw OLS Coefficient (β): Physical magnitude delta per unit change in input"
          >
            Raw Slope (β)
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 space-y-5">
        {/* Ranked Horizontal Bar Chart List */}
        <div className="space-y-3.5">
          {featureImportance.map((item) => {
            const isTop = item.rank === 1;
            const isPositive = item.direction === 'positive';
            const isSelected = selectedFeature === item.feature;

            // Bar fill percentage depending on selected metric mode
            let barWidthPct = 0;
            let displayValue = '';

            if (metricMode === 'standardized') {
              barWidthPct = (item.importanceScore / maxScore) * 100;
              displayValue = `|β*| = ${item.importanceScore.toFixed(3)}`;
            } else if (metricMode === 'percentage') {
              barWidthPct = item.relativePercentage;
              displayValue = `${item.relativePercentage.toFixed(1)}%`;
            } else {
              barWidthPct = (Math.abs(item.rawCoefficient) / maxRawAbs) * 100;
              displayValue = `${item.rawCoefficient >= 0 ? '+' : ''}${item.rawCoefficient.toFixed(5)} M/${item.unit || 'unit'}`;
            }

            // Current input value if provided
            const rawCurrentVal = currentInputs?.[item.feature];
            const numCurrentVal =
              rawCurrentVal !== undefined && rawCurrentVal !== '' ? Number(rawCurrentVal) : null;
            const hasCurrentVal = numCurrentVal !== null && !isNaN(numCurrentVal);

            // Compute input contribution relative to dataset mean
            const deltaFromMean = hasCurrentVal ? numCurrentVal - item.mean : 0;
            const impactOnMag = deltaFromMean * item.rawCoefficient;

            return (
              <div
                key={item.feature}
                onClick={() => setSelectedFeature(isSelected ? null : item.feature)}
                className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-300 bg-indigo-50/40 shadow-xs'
                    : isTop
                    ? 'border-rose-200 bg-rose-50/20 hover:bg-rose-50/40'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50/70'
                }`}
              >
                {/* Top Row: Rank, Title, Direction Badge, Value */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-2">
                    {/* Rank Badge */}
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-2xs ${
                        item.rank === 1
                          ? 'bg-rose-600 text-white'
                          : item.rank === 2
                          ? 'bg-orange-500 text-white'
                          : item.rank === 3
                          ? 'bg-amber-500 text-white'
                          : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      #{item.rank}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-zinc-900">
                        {item.displayName}
                      </span>
                      {item.unit && (
                        <span className="text-xs text-zinc-500 font-mono">({item.unit})</span>
                      )}
                    </div>

                    {/* Correlation / Slope Direction Indicator */}
                    <span
                      className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                        isPositive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                      title={
                        isPositive
                          ? `Positive correlation: Higher ${item.displayName} elevates predicted magnitude`
                          : `Inverse correlation: Higher ${item.displayName} decreases predicted magnitude`
                      }
                    >
                      {isPositive ? (
                        <>
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          <span>Direct (+)</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3 text-indigo-600" />
                          <span>Inverse (–)</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Quantitative Value Display */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-xs font-mono font-bold text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-md border border-zinc-200/80">
                      {displayValue}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      ({item.relativePercentage.toFixed(1)}% share)
                    </span>
                  </div>
                </div>

                {/* Horizontal Bar Chart Track */}
                <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.rank === 1
                        ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                        : item.rank === 2
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                        : item.rank === 3
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                        : 'bg-gradient-to-r from-indigo-400 to-indigo-500'
                    }`}
                    style={{ width: `${Math.max(4, Math.min(100, barWidthPct))}%` }}
                  />
                </div>

                {/* Subtext description & input sensitivity details */}
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-500 gap-1.5">
                  <p className="line-clamp-1 text-zinc-600">{item.description}</p>

                  {/* Live sensitivity insight based on user's current input */}
                  {hasCurrentVal && (
                    <div className="text-[11px] font-mono shrink-0 flex items-center gap-1.5 text-zinc-500">
                      <span>Input: <strong className="text-zinc-800">{Number(numCurrentVal).toFixed(1)}{item.unit}</strong></span>
                      <span>(Mean: {item.mean.toFixed(1)})</span>
                      <span
                        className={`font-semibold ${
                          impactOnMag >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {impactOnMag >= 0 ? '+' : ''}
                        {impactOnMag.toFixed(2)} M
                      </span>
                    </div>
                  )}
                </div>

                {/* Expandable Feature Drilldown (when clicked) */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-zinc-200/80 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in duration-150">
                    <div className="p-2 rounded-lg bg-white border border-zinc-200">
                      <span className="text-[10px] text-zinc-400 block font-sans">Raw Slope (β)</span>
                      <span className="font-mono font-bold text-zinc-800">
                        {item.rawCoefficient.toFixed(5)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-zinc-200">
                      <span className="text-[10px] text-zinc-400 block font-sans">Std Beta (|β*|)</span>
                      <span className="font-mono font-bold text-indigo-700">
                        {item.standardizedBeta.toFixed(4)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-zinc-200">
                      <span className="text-[10px] text-zinc-400 block font-sans">Feature Std Dev (σ)</span>
                      <span className="font-mono font-bold text-zinc-800">
                        {item.stdDev.toFixed(2)} {item.unit}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-zinc-200">
                      <span className="text-[10px] text-zinc-400 block font-sans">Dataset Mean (μ)</span>
                      <span className="font-mono font-bold text-zinc-800">
                        {item.mean.toFixed(2)} {item.unit}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Geological & Statistical Insights Footer */}
        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Scientific Modeling Takeaways</span>
            </div>

            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <span>{showExplanation ? 'Hide Methodology' : 'Why Standardized Beta (|β*|)?'}</span>
              {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <p className="text-xs text-zinc-600 leading-relaxed">
            In this seismological dataset of {sampleCount.toLocaleString()} earthquakes ($R^2 = {r2.toFixed(3)}$),
            magnitude predictions are governed primarily by{' '}
            <strong className="text-zinc-900">{topDriver?.displayName}</strong> (accounting for{' '}
            <strong className="text-rose-700">{topDriver?.relativePercentage.toFixed(1)}%</strong> of relative feature
            weight), followed by {featureImportance[1]?.displayName} and {featureImportance[2]?.displayName}.
          </p>

          {/* Expandable Explanation of Standardized Beta */}
          {showExplanation && (
            <div className="mt-2 pt-2 border-t border-zinc-200/80 text-xs text-zinc-600 space-y-2 animate-in fade-in duration-150">
              <p>
                <strong>The Unit Incommensurability Problem:</strong> Raw linear regression coefficients ($\beta$) cannot be
                directly compared because each feature is measured in different units (degrees of latitude vs. kilometers of
                depth vs. seconds of RMS travel time residual).
              </p>
              <div className="p-2.5 bg-white rounded-lg border border-zinc-200 font-mono text-[11px] text-zinc-800">
                Formula: β*ⱼ = βⱼ × (σₓⱼ / σᵧ)
              </div>
              <p>
                By multiplying raw slope $\beta_j$ by the ratio of standard deviations $\sigma(x_j)/\sigma(y)$, we obtain
                unitless <strong>Standardized Beta Coefficients ($\beta^*$)</strong>. A 1 standard deviation increase in a feature
                with $|\beta^*| = 0.40$ produces twice the predicted magnitude response compared to one with $|\beta^*| = 0.20$.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
