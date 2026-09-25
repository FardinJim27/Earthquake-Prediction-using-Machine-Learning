import React, { useState } from 'react';
import {
  Scale,
  TrendingUp,
  Cpu,
  Calculator,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart2,
  BarChart3
} from 'lucide-react';
import { PredictionResult } from '../lib/knn';
import { LinearPredictionResult, LinearRegressionModel } from '../lib/linearRegression';

interface ModelComparisonCardProps {
  knnResult: PredictionResult;
  linearResult: LinearPredictionResult;
  linearModel: LinearRegressionModel;
}

export const ModelComparisonCard: React.FC<ModelComparisonCardProps> = ({
  knnResult,
  linearResult,
  linearModel
}) => {
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  const delta = Math.abs(knnResult.magnitude - linearResult.magnitude);
  const percentDiff =
    Math.min(knnResult.magnitude, linearResult.magnitude) > 0
      ? (delta / ((knnResult.magnitude + linearResult.magnitude) / 2)) * 100
      : 0;

  const ensembleMean = (knnResult.magnitude + linearResult.magnitude) / 2;

  // Agreement level
  let agreementBadge = {
    text: 'Strong Agreement',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2
  };
  if (delta > 0.6) {
    agreementBadge = {
      text: 'Model Divergence',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: AlertCircle
    };
  } else if (delta > 0.3) {
    agreementBadge = {
      text: 'Moderate Agreement',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: HelpCircle
    };
  }

  // Feature display labels
  const featureNames: Record<string, string> = {
    latitude: 'Latitude (°N)',
    longitude: 'Longitude (°E)',
    depth: 'Depth (km)',
    gap: 'Azimuthal Gap (°)',
    rms: 'RMS Travel Time (s)'
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-100 bg-zinc-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 shadow-2xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-zinc-900">
                Model Comparison: K-NN vs. Linear Regression
              </h3>
              <span
                className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${agreementBadge.color}`}
              >
                <agreementBadge.icon className="w-3 h-3" />
                {agreementBadge.text}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Side-by-side predictions evaluating non-parametric local clustering against parametric global regression
            </p>
          </div>
        </div>

        {/* Delta Callout */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Model Difference</span>
            <span className="text-sm font-mono font-bold text-zinc-900">
              Δ M {delta.toFixed(2)}{' '}
              <span className="text-xs font-normal text-zinc-500 font-sans">({percentDiff.toFixed(1)}%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Dual Model Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
        {/* Model 1: K-Nearest Neighbors */}
        <div className="space-y-4 md:pr-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-900">K-Nearest Neighbors (k={knnResult.k})</h4>
                <span className="text-[11px] text-zinc-500">Non-linear local neighborhood regression</span>
              </div>
            </div>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
              Primary Model
            </span>
          </div>

          {/* Large Predicted Magnitude */}
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider block">
                Predicted Magnitude
              </span>
              <div className="text-3xl sm:text-4xl font-bold text-indigo-950 font-mono tracking-tight mt-0.5">
                M {knnResult.magnitude.toFixed(2)}
              </div>
              <span className="text-[11px] text-indigo-600 font-medium">
                Confidence Interval: {(knnResult.magnitude - knnResult.uncertainty).toFixed(2)} –{' '}
                {(knnResult.magnitude + knnResult.uncertainty).toFixed(2)}
              </span>
            </div>

            <div className="text-right pl-3 border-l border-indigo-200/80">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">
                Uncertainty
              </span>
              <div className="text-2xl font-bold text-amber-900 font-mono">
                ±{knnResult.uncertainty.toFixed(2)}
              </div>
              <span className="text-[10px] text-amber-700/80">Std Dev (σ of {knnResult.k})</span>
            </div>
          </div>

          {/* Neighbors List */}
          <div className="text-xs space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="font-medium text-zinc-700">Neighbor Matches (k={knnResult.k}):</span>
              <span className="text-[11px] text-zinc-400">Euclidean distance</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {knnResult.neighborMagnitudes.map((m, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-white border border-zinc-200 rounded text-xs font-mono font-medium text-zinc-800 shadow-2xs"
                  title={`Neighbor #${i + 1} actual magnitude`}
                >
                  M {m.toFixed(1)}
                </span>
              ))}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 leading-relaxed">
            <strong className="text-zinc-800">Mechanism:</strong> Normalizes feature values and averages the magnitude
            of the 5 closest historical seismic events in multidimensional feature space.
          </div>
        </div>

        {/* Model 2: Multiple Linear Regression */}
        <div className="space-y-4 md:pl-4 pt-5 md:pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-900">Multiple Linear Regression</h4>
                <span className="text-[11px] text-zinc-500">Ordinary Least Squares (OLS) Plane</span>
              </div>
            </div>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
              Benchmark Model
            </span>
          </div>

          {/* Large Predicted Magnitude */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
                Predicted Magnitude
              </span>
              <div className="text-3xl sm:text-4xl font-bold text-emerald-950 font-mono tracking-tight mt-0.5">
                M {linearResult.magnitude.toFixed(2)}
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">
                Confidence Interval: {(linearResult.magnitude - linearResult.uncertainty).toFixed(2)} –{' '}
                {(linearResult.magnitude + linearResult.uncertainty).toFixed(2)}
              </span>
            </div>

            <div className="text-right pl-3 border-l border-emerald-200/80">
              <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider block">
                Residual RMSE
              </span>
              <div className="text-2xl font-bold text-zinc-900 font-mono">
                ±{linearResult.uncertainty.toFixed(2)}
              </div>
              <span className="text-[10px] text-zinc-500">Standard Error</span>
            </div>
          </div>

          {/* Goodness of Fit Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] text-zinc-400 font-medium block">R² Score</span>
              <span className="font-mono font-bold text-zinc-800">{linearModel.r2.toFixed(3)}</span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] text-zinc-400 font-medium block">RMSE</span>
              <span className="font-mono font-bold text-zinc-800">{linearModel.rmse.toFixed(3)}</span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] text-zinc-400 font-medium block">MAE</span>
              <span className="font-mono font-bold text-zinc-800">{linearModel.mae.toFixed(3)}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 leading-relaxed">
            <strong className="text-zinc-800">Mechanism:</strong> Fits a global linear hyperplane across all {linearModel.sampleCount.toLocaleString()} training
            observations, assigning fixed slope coefficients ($\beta_j$) to each input feature.
          </div>
        </div>
      </div>

      {/* Comparison Summary & Visual Magnitude Bar */}
      <div className="px-5 py-4 bg-zinc-50 border-t border-zinc-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-zinc-900">Ensemble Mean:</span>
            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              M {ensembleMean.toFixed(2)}
            </span>
            <span className="text-zinc-400">|</span>
            <span className="text-zinc-600">
              Variance between models: <strong>{delta.toFixed(2)} units</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('feature-importance-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
              title="Jump to ranked Feature Importance analysis"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Feature Importance</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <span>{showFormulaDetails ? 'Hide Weights & Formula' : 'View Weights & Formula'}</span>
              {showFormulaDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Visual Dual Magnitude Ranges */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center text-xs">
            <span className="w-32 font-medium text-zinc-600 truncate">K-NN (k=5):</span>
            <div className="flex-1 bg-zinc-200 rounded-full h-3 relative overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, ((knnResult.magnitude - 3.0) / 5.0) * 100))}%`
                }}
              />
            </div>
            <span className="w-14 text-right font-mono font-bold text-indigo-900 text-xs">
              M {knnResult.magnitude.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center text-xs">
            <span className="w-32 font-medium text-zinc-600 truncate">Linear Regression:</span>
            <div className="flex-1 bg-zinc-200 rounded-full h-3 relative overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, ((linearResult.magnitude - 3.0) / 5.0) * 100))}%`
                }}
              />
            </div>
            <span className="w-14 text-right font-mono font-bold text-emerald-900 text-xs">
              M {linearResult.magnitude.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Mathematical Formula & Feature Contribution Table */}
      {showFormulaDetails && (
        <div className="p-5 border-t border-zinc-200 bg-white space-y-4 animate-in fade-in duration-200">
          <div>
            <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Linear Regression Formula & Fitted Coefficients</span>
            </h4>
            <div className="p-3 bg-zinc-900 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto shadow-inner border border-zinc-800">
              {linearResult.formula}
            </div>
          </div>

          {/* Feature Contribution Breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 font-semibold bg-zinc-50/80">
                  <th className="py-2 px-3">Feature</th>
                  <th className="py-2 px-3 text-right">Input Value</th>
                  <th className="py-2 px-3 text-right">OLS Coefficient (β)</th>
                  <th className="py-2 px-3 text-right">Feature Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-mono">
                <tr className="bg-zinc-50/40">
                  <td className="py-2 px-3 font-sans font-medium text-zinc-800">Base Intercept (β₀)</td>
                  <td className="py-2 px-3 text-right text-zinc-400">1.00</td>
                  <td className="py-2 px-3 text-right text-zinc-600">{linearModel.intercept.toFixed(4)}</td>
                  <td className="py-2 px-3 text-right font-bold text-zinc-900">
                    +{linearModel.intercept.toFixed(4)}
                  </td>
                </tr>

                {linearResult.contributions.map((c) => {
                  const isPositive = c.contribution >= 0;
                  return (
                    <tr key={c.feature} className="hover:bg-zinc-50/60">
                      <td className="py-2 px-3 font-sans font-medium text-zinc-700">
                        {featureNames[c.feature] || c.feature}
                      </td>
                      <td className="py-2 px-3 text-right text-zinc-900">{c.inputValue.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-zinc-600">
                        {c.coefficient >= 0 ? '+' : ''}
                        {c.coefficient.toFixed(5)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-bold ${
                          isPositive ? 'text-indigo-600' : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {c.contribution.toFixed(4)}
                      </td>
                    </tr>
                  );
                })}

                <tr className="border-t-2 border-zinc-300 font-bold bg-zinc-50/80">
                  <td className="py-2 px-3 font-sans text-zinc-900">Summed Linear Prediction</td>
                  <td className="py-2 px-3 text-right text-zinc-400">—</td>
                  <td className="py-2 px-3 text-right text-zinc-400">—</td>
                  <td className="py-2 px-3 text-right text-emerald-700 text-sm font-bold">
                    M {linearResult.magnitude.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
