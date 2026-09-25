import React, { useState } from 'react';
import {
  HelpCircle,
  Flame,
  Layers,
  ChevronDown,
  ChevronUp,
  MapPin,
  Circle,
  Activity,
  Compass,
  Zap
} from 'lucide-react';
import { ColorPalette, HeatmapMetric } from './D3SeismicHeatmap';

interface MapDescriptiveLegendProps {
  currentMode: 'd3' | 'grid';
  d3Palette?: ColorPalette;
  d3Metric?: HeatmapMetric;
  defaultExpanded?: boolean;
}

export const MapDescriptiveLegend: React.FC<MapDescriptiveLegendProps> = ({
  currentMode,
  d3Palette = 'inferno',
  d3Metric = 'energy',
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [activeTab, setActiveTab] = useState<'d3' | 'grid'>(currentMode);

  // Synchronize tab when active mode changes unless user explicitly switched
  React.useEffect(() => {
    setActiveTab(currentMode);
  }, [currentMode]);

  // Color schemes for D3 Heatmap palette
  const getPaletteGradient = (pal: ColorPalette) => {
    switch (pal) {
      case 'turbo':
        return {
          css: 'linear-gradient(to right, #30123b, #466be3, #28bbec, #a2fc3c, #fb8022, #7a0403)',
          stops: [
            { color: '#30123b', label: 'Baseline (0–25%)', desc: 'Minimal background seismicity' },
            { color: '#28bbec', label: 'Moderate (25–50%)', desc: 'Occasional light tremors' },
            { color: '#a2fc3c', label: 'Elevated (50–75%)', desc: 'Concentrated seismic activity' },
            { color: '#7a0403', label: 'Severe (75–100%)', desc: 'Historical high-magnitude fault zones' }
          ]
        };
      case 'ylorrd':
        return {
          css: 'linear-gradient(to right, #ffffcc, #fed976, #feb24c, #fd8d3c, #f03b20, #bd0026)',
          stops: [
            { color: '#fed976', label: 'Baseline (0–25%)', desc: 'Low tremor density' },
            { color: '#feb24c', label: 'Moderate (25–50%)', desc: 'Clustered minor quakes' },
            { color: '#fd8d3c', label: 'High (50–75%)', desc: 'Active fault deformation' },
            { color: '#bd0026', label: 'Severe (75–100%)', desc: 'Critical seismic stress corridor' }
          ]
        };
      case 'inferno':
      default:
        return {
          css: 'linear-gradient(to right, #000004, #3b0f70, #8c2981, #de4968, #fe9f6d, #fcfdbf)',
          stops: [
            { color: '#3b0f70', label: 'Baseline (0–25%)', desc: 'Stable background crust' },
            { color: '#8c2981', label: 'Moderate (25–50%)', desc: 'Scattered intermediate events' },
            { color: '#de4968', label: 'High (50–75%)', desc: 'Intense energy dissipation' },
            { color: '#fcfdbf', label: 'Severe (75–100%)', desc: 'Peak rupture hazard & fault trenches' }
          ]
        };
    }
  };

  const paletteData = getPaletteGradient(d3Palette);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden transition-all duration-200">
      {/* Legend Header & Collapse Toggle */}
      <div className="px-4 py-3 bg-zinc-50/80 border-b border-zinc-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-zinc-900 tracking-tight">
                Map Interpretation & Scientific Legend
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Cartographic Guide
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Decoding continuous density contours, grid classifications, and seismic markers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Tab Switcher */}
          <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('d3');
                setIsExpanded(true);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
                activeTab === 'd3'
                  ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Flame className="w-3 h-3 text-rose-600" />
              <span>D3 Heatmap</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('grid');
                setIsExpanded(true);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
                activeTab === 'grid'
                  ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Layers className="w-3 h-3 text-indigo-600" />
              <span>Grid System</span>
            </button>
          </div>

          {/* Toggle Expand / Collapse */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 rounded-lg transition-colors"
            title={isExpanded ? 'Collapse Legend' : 'Expand Detailed Legend'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-5 animate-in fade-in duration-150">
          {activeTab === 'd3' ? (
            /* ========================================================================= */
            /* TAB 1: D3 GEOGRAPHIC HEATMAP EXPLANATION                                  */
            /* ========================================================================= */
            <div className="space-y-4">
              {/* Section 1: Continuous Spectrum Interpretation */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <span>Continuous Risk Intensity Scale ({d3Palette.toUpperCase()})</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Model: {d3Metric === 'energy' ? 'Seismic Energy (10^1.5M)' : d3Metric === 'magnitude' ? 'Magnitude (M^2.5)' : 'Frequency'}
                  </span>
                </div>

                {/* Color Gradient Ribbon */}
                <div
                  className="h-3 w-full rounded-md shadow-2xs overflow-hidden border border-zinc-300"
                  style={{ background: paletteData.css }}
                />

                {/* 4 Color Stop Swatches */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
                  {paletteData.stops.map((stop, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-2xs border border-black/20 shrink-0"
                          style={{ backgroundColor: stop.color }}
                        />
                        <span className="text-xs font-semibold text-zinc-800 leading-tight">
                          {stop.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-normal">{stop.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: D3 Elements & Mathematical Models */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-zinc-100">
                {/* Weighting Models */}
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Weighting Algorithm</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    Uses <strong>2D Kernel Density Estimation</strong> (<code className="text-indigo-600">d3.contourDensity</code>)
                    weighted exponentially by Gutenberg-Richter radiated seismic energy ($E \propto 10^{'{1.5M}'}$).
                  </p>
                </div>

                {/* Contour Isolines */}
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                    <Activity className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Contour Isolines</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    Each contour loop demarcates an equipotential boundary of equal seismic hazard density.
                    Denser rings represent steep gradients in fault slip concentration.
                  </p>
                </div>

                {/* Subduction Zone Line */}
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                    <Compass className="w-3.5 h-3.5 text-rose-500" />
                    <span>Japan Trench Fault</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    The red dashed line marks the Pacific–North American plate boundary where megathrust
                    subduction generates high-magnitude shallow hypocenters.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* TAB 2: GRID SYSTEM MARKERS EXPLANATION                                    */
            /* ========================================================================= */
            <div className="space-y-4">
              {/* Section 1: Grid Cell Risk Levels */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Spatial Grid Cell Classifications</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">1.0° × 1.0° Geographic Bins</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Extreme */}
                  <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/50 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3.5 h-3.5 rounded bg-rose-600 border border-rose-700 shadow-2xs shrink-0" />
                      <span className="text-xs font-bold text-rose-900">Extreme Risk (&ge;75%)</span>
                    </div>
                    <p className="text-[11px] text-rose-800 leading-normal">
                      Critical danger zone. High frequency of M &ge; 6.0 historical earthquakes and intense cluster density.
                    </p>
                  </div>

                  {/* High */}
                  <div className="p-2.5 rounded-lg border border-orange-200 bg-orange-50/50 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3.5 h-3.5 rounded bg-orange-500 border border-orange-600 shadow-2xs shrink-0" />
                      <span className="text-xs font-bold text-orange-900">High Risk (50–74%)</span>
                    </div>
                    <p className="text-[11px] text-orange-800 leading-normal">
                      Frequent M 5.0+ events. Active fault stress corridors with regular seismic shaking.
                    </p>
                  </div>

                  {/* Moderate */}
                  <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3.5 h-3.5 rounded bg-amber-400 border border-amber-500 shadow-2xs shrink-0" />
                      <span className="text-xs font-bold text-amber-900">Moderate (25–49%)</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-normal">
                      Moderate background activity with occasional felt earthquakes.
                    </p>
                  </div>

                  {/* Low */}
                  <div className="p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/40 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3.5 h-3.5 rounded bg-indigo-500/70 border border-indigo-600 shadow-2xs shrink-0" />
                      <span className="text-xs font-bold text-indigo-900">Low Risk (&lt;25%)</span>
                    </div>
                    <p className="text-[11px] text-indigo-800 leading-normal">
                      Minor localized crustal release with minimal large-magnitude rupture history.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Cell Information & Annotations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-zinc-100">
                {/* Cell Numbers */}
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                    <span className="font-mono bg-white px-1.5 py-0.2 rounded border border-zinc-300 text-zinc-800 text-[10px]">
                      1,248
                    </span>
                    <span>Cell Number Meaning</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    The number centered inside each grid cell displays the <strong>total verified earthquake count</strong> recorded within that coordinate bounding box.
                  </p>
                </div>

                {/* Hotspot Badge */}
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono">
                      HOTSPOT
                    </span>
                    <span>Dataset Hotspot</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    Identifies the single highest-risk grid sector across all records in Japan, combining density, average magnitude, and peak historical slip.
                  </p>
                </div>

                {/* Click to Predict */}
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Interactive Targeting</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    Clicking any colored grid cell automatically loads that cell's center coordinates into the K-NN and Linear regression prediction models.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* COMMON SECTION: EPICENTER SCATTER MARKERS & MAP ANNOTATIONS              */}
          {/* ========================================================================= */}
          <div className="pt-3 border-t border-zinc-200">
            <div className="text-xs font-semibold text-zinc-900 mb-2 flex items-center gap-1.5">
              <Circle className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />
              <span>Epicenter Markers & Map Symbols</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* M >= 6.0 */}
              <div className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-900 text-white flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-white ring-2 ring-white/50 shadow-md shrink-0" />
                <div className="text-[11px] leading-tight">
                  <strong className="block text-white">M &ge; 6.0 (Major)</strong>
                  <span className="text-zinc-400">Severe shaking & potential tsunamis</span>
                </div>
              </div>

              {/* M 5.0 - 5.9 */}
              <div className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-900 text-white flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/40 shadow-sm shrink-0" />
                <div className="text-[11px] leading-tight">
                  <strong className="block text-amber-300">M 5.0 – 5.9 (Strong)</strong>
                  <span className="text-zinc-400">Moderate structural damage</span>
                </div>
              </div>

              {/* M < 5.0 */}
              <div className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-900 text-white flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                <div className="text-[11px] leading-tight">
                  <strong className="block text-sky-300">M &lt; 5.0 (Minor)</strong>
                  <span className="text-zinc-400">Felt tremors; localized crustal slip</span>
                </div>
              </div>

              {/* Target Crosshair */}
              <div className="p-2.5 rounded-lg border border-zinc-200 bg-white flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full border-2 border-sky-500 border-dashed flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                </div>
                <div className="text-[11px] leading-tight">
                  <strong className="block text-zinc-900">Selected Target</strong>
                  <span className="text-zinc-500">Active prediction coordinate pin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
