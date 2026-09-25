import React, { useState, useMemo, useRef } from 'react';
import {
  Flame,
  Layers,
  Filter,
  Eye,
  EyeOff,
  Crosshair,
  MapPin,
  Info,
  Map as MapIcon,
  Grid,
  HelpCircle
} from 'lucide-react';
import {
  EarthquakeRecord,
  GridCell,
  RiskMetric,
  computeSeismicGrid,
  getRiskColor
} from '../lib/gridOverlay';
import { APIProvider, Map, Marker, MapMouseEvent } from '@vis.gl/react-google-maps';

interface SeismicGridMapProps {
  data: EarthquakeRecord[];
  selectedLat: number;
  selectedLng: number;
  onSelectCoordinates: (lat: number, lng: number) => void;
  showMapToggle?: boolean;
  onToggleMap?: () => void;
  isGoogleMapAvailable?: boolean;
}

export const SeismicGridMap: React.FC<SeismicGridMapProps> = ({
  data,
  selectedLat,
  selectedLng,
  onSelectCoordinates,
  showMapToggle,
  onToggleMap,
  isGoogleMapAvailable = false
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'google'>(
    isGoogleMapAvailable ? 'grid' : 'grid'
  );
  const [metric, setMetric] = useState<RiskMetric>('frequency');
  const [stepSize, setStepSize] = useState<number>(1.0);
  const [highRiskOnly, setHighRiskOnly] = useState<boolean>(false);
  const [showScatter, setShowScatter] = useState<boolean>(true);
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Compute grid analysis
  const gridAnalysis = useMemo(() => {
    return computeSeismicGrid(data, metric, stepSize);
  }, [data, metric, stepSize]);

  const { cells, gridBounds, highestRiskCell, highRiskCells, maxCount, maxAvgMag } = gridAnalysis;

  // Filter cells if "High Risk Only" is toggled
  const visibleCells = useMemo(() => {
    if (!highRiskOnly) return cells;
    return cells.filter(c => c.riskLevel === 'extreme' || c.riskLevel === 'high');
  }, [cells, highRiskOnly]);

  // Coordinate projection math
  const mapPadding = 48; // px
  const svgWidth = 800;
  const svgHeight = 440;

  const latSpan = Math.max(0.1, gridBounds.latMax - gridBounds.latMin);
  const lngSpan = Math.max(0.1, gridBounds.lngMax - gridBounds.lngMin);

  const projectLng = (lng: number) => {
    return mapPadding + ((lng - gridBounds.lngMin) / lngSpan) * (svgWidth - mapPadding * 2);
  };

  const projectLat = (lat: number) => {
    // Invert Y axis: higher latitude is at top
    return svgHeight - mapPadding - ((lat - gridBounds.latMin) / latSpan) * (svgHeight - mapPadding * 2);
  };

  const handleCellClick = (cell: GridCell) => {
    setSelectedCellId(cell.id);
    onSelectCoordinates(Number(cell.centerLat.toFixed(3)), Number(cell.centerLng.toFixed(3)));
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Scale to viewBox coordinates
    const scaleX = svgWidth / rect.width;
    const scaleY = svgHeight / rect.height;
    const svgX = clickX * scaleX;
    const svgY = clickY * scaleY;

    // Convert back to lat/lng
    const rawLng = gridBounds.lngMin + ((svgX - mapPadding) / (svgWidth - mapPadding * 2)) * lngSpan;
    const rawLat = gridBounds.latMin + ((svgHeight - mapPadding - svgY) / (svgHeight - mapPadding * 2)) * latSpan;

    if (rawLat >= gridBounds.latMin && rawLat <= gridBounds.latMax && rawLng >= gridBounds.lngMin && rawLng <= gridBounds.lngMax) {
      onSelectCoordinates(Number(rawLat.toFixed(3)), Number(rawLng.toFixed(3)));
    }
  };

  const handleGoogleMapClick = (e: MapMouseEvent) => {
    if (e.detail.latLng) {
      onSelectCoordinates(
        Number(e.detail.latLng.lat.toFixed(4)),
        Number(e.detail.latLng.lng.toFixed(4))
      );
    }
  };

  // Generate coordinate grid lines
  const latTicks = useMemo(() => {
    const ticks: number[] = [];
    const min = Math.ceil(gridBounds.latMin / 2) * 2;
    for (let l = min; l <= gridBounds.latMax; l += 2) {
      ticks.push(l);
    }
    return ticks;
  }, [gridBounds.latMin, gridBounds.latMax]);

  const lngTicks = useMemo(() => {
    const ticks: number[] = [];
    const min = Math.ceil(gridBounds.lngMin / 2) * 2;
    for (let l = min; l <= gridBounds.lngMax; l += 2) {
      ticks.push(l);
    }
    return ticks;
  }, [gridBounds.lngMin, gridBounds.lngMax]);

  // Selected Pin coordinates in SVG
  const pinX = projectLng(selectedLng);
  const pinY = projectLat(selectedLat);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Header with Title & Metric Controls */}
      <div className="p-4 sm:p-5 border-b border-zinc-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-50/50">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">
                  Seismic Risk Map Overlay
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {visibleCells.length} active zones
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Simplified spatial grid highlighting high-risk seismic zones based on dataset latitude & longitude
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle (if Google Maps API key available) */}
          {isGoogleMapAvailable && (
            <div className="flex items-center bg-white border border-zinc-200 p-0.5 rounded-lg text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="View Simplified Grid System Overlay"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Grid Overlay</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('google')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'google'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="View Interactive Google Map"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Google Map</span>
              </button>
            </div>
          )}

          {/* Metric Selector (Grid Mode) */}
          {viewMode === 'grid' && (
            <div className="flex items-center bg-white border border-zinc-200 p-0.5 rounded-lg text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setMetric('frequency')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  metric === 'frequency'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
                title="Highlight zones where earthquake frequency (count) is highest"
              >
                Frequency
              </button>
              <button
                type="button"
                onClick={() => setMetric('avgMagnitude')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  metric === 'avgMagnitude'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
                title="Highlight zones where average earthquake magnitude is highest"
              >
                Avg Magnitude
              </button>
              <button
                type="button"
                onClick={() => setMetric('composite')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  metric === 'composite'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
                title="Highlight zones using composite hazard (frequency × magnitude severity)"
              >
                Composite
              </button>
            </div>
          )}

          {/* Grid Resolution (Grid Mode) */}
          {viewMode === 'grid' && (
            <div className="flex items-center bg-white border border-zinc-200 rounded-lg text-xs px-2 py-1 gap-1.5 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={stepSize}
                onChange={(e) => setStepSize(parseFloat(e.target.value))}
                aria-label="Grid resolution"
                className="bg-transparent text-zinc-700 font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="1.0">1.0° Grid</option>
                <option value="0.75">0.75° Grid</option>
                <option value="0.5">0.5° Fine</option>
              </select>
            </div>
          )}

          {/* High-Risk Filter Toggle (Grid Mode) */}
          {viewMode === 'grid' && (
            <button
              type="button"
              onClick={() => setHighRiskOnly(!highRiskOnly)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                highRiskOnly
                  ? 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-300/40'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 border-zinc-200'
              }`}
              title="Toggle display of top high-risk zones only"
            >
              <Filter className="w-3.5 h-3.5 text-amber-600" />
              <span>{highRiskOnly ? 'High Risk Only' : 'All Zones'}</span>
            </button>
          )}

          {/* Epicenter Dots Toggle (Grid Mode) */}
          {viewMode === 'grid' && (
            <button
              type="button"
              onClick={() => setShowScatter(!showScatter)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                showScatter
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-zinc-500 border-zinc-200'
              }`}
              title="Toggle individual earthquake epicenter dots"
            >
              {showScatter ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Quakes</span>
            </button>
          )}

          {/* Legend Anchor Button */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('map-descriptive-legend');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs"
            title="Jump to comprehensive cartographic legend and interpretation guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Legend</span>
          </button>

          {/* Hide/Show Map Switcher (if prop provided) */}
          {showMapToggle && onToggleMap && (
            <button
              type="button"
              onClick={onToggleMap}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition-colors"
              title="Hide map component"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hide</span>
            </button>
          )}
        </div>
      </div>

      {/* Top High-Risk Hotspot Banner */}
      {highestRiskCell && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-b border-rose-100 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            </span>
            <span className="font-semibold text-rose-900">
              Peak High-Risk Zone:
            </span>
            <span className="text-zinc-700 font-mono">
              [{highestRiskCell.latMin.toFixed(1)}°–{highestRiskCell.latMax.toFixed(1)}°N, {highestRiskCell.lngMin.toFixed(1)}°–{highestRiskCell.lngMax.toFixed(1)}°E]
            </span>
            <span className="hidden md:inline text-zinc-400">|</span>
            <span className="hidden md:inline text-zinc-600">
              <strong className="text-rose-700">{highestRiskCell.count} quakes</strong> ({((highestRiskCell.count / data.length) * 100).toFixed(1)}%),
              Avg <strong className="text-zinc-900">M {highestRiskCell.avgMag.toFixed(2)}</strong> (Max M {highestRiskCell.maxMag.toFixed(1)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCellClick(highestRiskCell)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-medium text-[11px] shadow-2xs transition-all"
              title="Load the coordinates of the highest-risk earthquake zone into the prediction form"
            >
              <Crosshair className="w-3 h-3" />
              <span>Target Peak Hotspot</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Map Viewport */}
      {viewMode === 'grid' ? (
        <div
          ref={containerRef}
          className="relative w-full h-[420px] bg-slate-900 overflow-hidden cursor-crosshair select-none"
          onMouseLeave={() => {
            setHoveredCell(null);
            setTooltipPos(null);
          }}
        >
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            onClick={handleSvgClick}
          >
            <defs>
              {/* Grid Pattern Background */}
              <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
              </pattern>

              {/* Pulsing Hotspot Filter */}
              <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Map Baseplate */}
            <rect width={svgWidth} height={svgHeight} fill="#090d16" />
            <rect width={svgWidth} height={svgHeight} fill="url(#grid-pattern)" />

            {/* Coordinate Guide Lines */}
            {latTicks.map((lat) => {
              const y = projectLat(lat);
              if (y < mapPadding || y > svgHeight - mapPadding) return null;
              return (
                <g key={`lat-${lat}`}>
                  <line
                    x1={mapPadding}
                    y1={y}
                    x2={svgWidth - mapPadding}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={mapPadding - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {lat}°N
                  </text>
                </g>
              );
            })}

            {lngTicks.map((lng) => {
              const x = projectLng(lng);
              if (x < mapPadding || x > svgWidth - mapPadding) return null;
              return (
                <g key={`lng-${lng}`}>
                  <line
                    x1={x}
                    y1={mapPadding}
                    x2={x}
                    y2={svgHeight - mapPadding}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={svgHeight - mapPadding + 16}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {lng}°E
                  </text>
                </g>
              );
            })}

            {/* Approximate Japan Pacific Trench / Subduction Zone Guideline for geographic context */}
            <path
              d={`M ${projectLng(144)},${projectLat(43)} Q ${projectLng(142.5)},${projectLat(38)} ${projectLng(140.5)},${projectLat(33)}`}
              fill="none"
              stroke="rgba(244, 63, 94, 0.25)"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />
            <text
              x={projectLng(143.5)}
              y={projectLat(40)}
              fill="rgba(244, 63, 94, 0.5)"
              fontSize="9"
              fontFamily="sans-serif"
              fontStyle="italic"
              transform={`rotate(75, ${projectLng(143.5)}, ${projectLat(40)})`}
            >
              Japan Trench Subduction Zone
            </text>

            {/* Grid Cells Overlay */}
            {visibleCells.map((cell) => {
              const x1 = projectLng(cell.lngMin);
              const x2 = projectLng(cell.lngMax);
              const y1 = projectLat(cell.latMax);
              const y2 = projectLat(cell.latMin);

              const width = Math.max(1, Math.abs(x2 - x1));
              const height = Math.max(1, Math.abs(y2 - y1));
              const cellX = Math.min(x1, x2);
              const cellY = Math.min(y1, y2);

              const isTopHotspot = highestRiskCell && highestRiskCell.id === cell.id;
              const isHovered = hoveredCell && hoveredCell.id === cell.id;
              const isSelected = selectedCellId === cell.id;

              // Opacity & colors
              const opacity = isHovered ? 0.88 : isTopHotspot ? 0.78 : 0.62;
              const colorInfo = getRiskColor(cell.riskScore, opacity);

              return (
                <g
                  key={cell.id}
                  className="transition-all cursor-pointer"
                  onMouseEnter={(e) => {
                    setHoveredCell(cell);
                    if (containerRef.current) {
                      const rect = containerRef.current.getBoundingClientRect();
                      setTooltipPos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    if (containerRef.current) {
                      const rect = containerRef.current.getBoundingClientRect();
                      setTooltipPos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                      });
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(cell);
                  }}
                >
                  {/* Cell Rectangle */}
                  <rect
                    x={cellX}
                    y={cellY}
                    width={width}
                    height={height}
                    fill={colorInfo.fill}
                    stroke={
                      isSelected
                        ? '#38bdf8'
                        : isTopHotspot
                        ? '#f43f5e'
                        : isHovered
                        ? '#ffffff'
                        : colorInfo.stroke
                    }
                    strokeWidth={isSelected ? 2.5 : isTopHotspot ? 2 : isHovered ? 1.5 : 0.8}
                    strokeOpacity={isHovered || isSelected || isTopHotspot ? 1 : 0.7}
                    rx="2"
                    filter={isTopHotspot ? 'url(#glow-rose)' : undefined}
                  />

                  {/* Text summary inside cell if size permits */}
                  {width > 36 && height > 24 && (
                    <g pointerEvents="none">
                      <text
                        x={cellX + width / 2}
                        y={cellY + height / 2 - (height > 34 ? 2 : 0)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#ffffff"
                        fontSize={Math.min(10, width / 4.5)}
                        fontWeight="bold"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                      >
                        {metric === 'frequency'
                          ? cell.count
                          : metric === 'avgMagnitude'
                          ? `M${cell.avgMag.toFixed(1)}`
                          : `${cell.riskScore}`}
                      </text>
                      {height > 34 && (
                        <text
                          x={cellX + width / 2}
                          y={cellY + height / 2 + 10}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="rgba(255, 255, 255, 0.75)"
                          fontSize="8"
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                        >
                          {metric === 'frequency' ? `M${cell.avgMag.toFixed(1)}` : `${cell.count} q`}
                        </text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Individual Earthquake Scatter Dots */}
            {showScatter &&
              data.slice(0, 1500).map((q, idx) => {
                const qx = projectLng(q.longitude);
                const qy = projectLat(q.latitude);
                if (qx < mapPadding || qx > svgWidth - mapPadding || qy < mapPadding || qy > svgHeight - mapPadding) {
                  return null;
                }

                const r = q.mag >= 6.0 ? 3.5 : q.mag >= 5.0 ? 2.5 : 1.5;
                const fill = q.mag >= 6.0 ? '#ef4444' : q.mag >= 5.0 ? '#f59e0b' : '#38bdf8';

                return (
                  <circle
                    key={idx}
                    cx={qx}
                    cy={qy}
                    r={r}
                    fill={fill}
                    fillOpacity="0.45"
                    pointerEvents="none"
                  />
                );
              })}

            {/* User's Selected Coordinate Pin (Target) */}
            {pinX >= mapPadding && pinX <= svgWidth - mapPadding && pinY >= mapPadding && pinY <= svgHeight - mapPadding && (
              <g pointerEvents="none" className="animate-in zoom-in-75 duration-200">
                {/* Target Crosshairs */}
                <circle
                  cx={pinX}
                  cy={pinY}
                  r="16"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.8"
                />
                <circle
                  cx={pinX}
                  cy={pinY}
                  r="7"
                  fill="#4f46e5"
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                />
                <circle cx={pinX} cy={pinY} r="2" fill="#ffffff" />
              </g>
            )}

            {/* Bounding Box Border */}
            <rect
              x={mapPadding}
              y={mapPadding}
              width={svgWidth - mapPadding * 2}
              height={svgHeight - mapPadding * 2}
              fill="none"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1"
            />
          </svg>

          {/* Hover Tooltip Overlay */}
          {hoveredCell && tooltipPos && (
            <div
              className="absolute z-30 pointer-events-none bg-zinc-900/95 backdrop-blur-md text-white p-3 rounded-lg shadow-xl border border-zinc-700 text-xs w-64 animate-in fade-in zoom-in-95 duration-100"
              style={{
                left: Math.min(tooltipPos.x + 12, 520),
                top: Math.max(10, Math.min(tooltipPos.y - 120, 260))
              }}
            >
              <div className="flex items-center justify-between border-b border-zinc-700/80 pb-1.5 mb-2">
                <span className="font-semibold text-zinc-100 flex items-center gap-1.5">
                  <Flame className={`w-3.5 h-3.5 ${getRiskColor(hoveredCell.riskScore).text}`} />
                  <span>Zone Grid Cell</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    getRiskColor(hoveredCell.riskScore).badge
                  }`}
                >
                  {hoveredCell.riskLevel} Risk ({hoveredCell.riskScore}%)
                </span>
              </div>

              <div className="space-y-1 font-mono text-[11px] text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-sans">Bounds:</span>
                  <span>
                    {hoveredCell.latMin.toFixed(1)}°–{hoveredCell.latMax.toFixed(1)}°N, {hoveredCell.lngMin.toFixed(1)}°–{hoveredCell.lngMax.toFixed(1)}°E
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-sans">Total Events:</span>
                  <span className="font-bold text-white">
                    {hoveredCell.count.toLocaleString()} quakes ({((hoveredCell.count / data.length) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-sans">Avg Magnitude:</span>
                  <span className="font-bold text-amber-300">M {hoveredCell.avgMag.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-sans">Peak Magnitude:</span>
                  <span className="font-bold text-rose-400">M {hoveredCell.maxMag.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-sans">Avg Focal Depth:</span>
                  <span>{hoveredCell.avgDepth.toFixed(1)} km</span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-zinc-800 text-[10px] text-zinc-400 flex items-center justify-between font-sans">
                <span>Click cell to set coordinates</span>
                <span className="text-indigo-400 font-medium">One-click test</span>
              </div>
            </div>
          )}

          {/* Selected Coordinates Overlay Badge in Top-Right */}
          <div className="absolute top-3 right-3 bg-zinc-900/80 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-zinc-700/80 text-[11px] text-zinc-300 flex items-center gap-2 shadow-sm pointer-events-none">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Target: <strong className="text-white font-mono">{selectedLat.toFixed(2)}°N, {selectedLng.toFixed(2)}°E</strong>
            </span>
          </div>

          {/* Prompt in Bottom-Left */}
          <div className="absolute bottom-3 left-3 bg-zinc-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-zinc-700/80 text-[10px] text-zinc-400 hidden sm:flex items-center gap-1.5 pointer-events-none">
            <Info className="w-3 h-3 text-zinc-400" />
            <span>Click anywhere on the map or any colored grid cell to update prediction coordinates</span>
          </div>
        </div>
      ) : (
        /* Google Map Alternate View */
        <div className="h-[420px] w-full relative bg-zinc-100 flex items-center justify-center">
          {import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
            <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
              <Map
                defaultCenter={{
                  lat: selectedLat,
                  lng: selectedLng
                }}
                defaultZoom={5}
                onClick={handleGoogleMapClick}
                disableDefaultUI={false}
                zoomControl={true}
                gestureHandling={'greedy'}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              >
                <Marker
                  position={{
                    lat: selectedLat,
                    lng: selectedLng
                  }}
                />
              </Map>
            </APIProvider>
          )}
        </div>
      )}

      {/* Footer: Color Scale Legend & Top Hotspots List */}
      <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Color Gradient Legend */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
            <span>Seismic Risk Scale:</span>
            <span className="text-[11px] text-zinc-500">
              {metric === 'frequency'
                ? `Event Frequency (0 to ${maxCount} quakes)`
                : metric === 'avgMagnitude'
                ? `Mean Magnitude (to M ${maxAvgMag.toFixed(1)})`
                : 'Composite Hazard Index (0 to 100)'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-rose-600 inline-block border border-rose-700"></span>
              <span className="text-zinc-700 font-medium">Extreme (&ge;75%)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-orange-500 inline-block border border-orange-600"></span>
              <span className="text-zinc-700 font-medium">High (50–74%)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-amber-400 inline-block border border-amber-500"></span>
              <span className="text-zinc-700 font-medium">Moderate (25–49%)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-indigo-500/70 inline-block border border-indigo-600"></span>
              <span className="text-zinc-700 font-medium">Low (&lt;25%)</span>
            </div>
          </div>
        </div>

        {/* Quick High-Risk Zone Chips */}
        {highRiskCells.length > 0 && (
          <div className="flex flex-col md:items-end gap-1">
            <span className="text-xs font-medium text-zinc-600">High-Risk Zones (Click to Target):</span>
            <div className="flex flex-wrap gap-1.5">
              {highRiskCells.slice(0, 3).map((cell, idx) => (
                <button
                  key={cell.id}
                  type="button"
                  onClick={() => handleCellClick(cell)}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-all flex items-center gap-1 shadow-2xs ${
                    selectedCellId === cell.id
                      ? 'bg-rose-600 text-white border-rose-700 font-bold'
                      : 'bg-white hover:bg-rose-50 text-zinc-800 hover:text-rose-700 border-zinc-200 hover:border-rose-200'
                  }`}
                  title={`Target Zone #${idx + 1}: ${cell.count} events, Avg M ${cell.avgMag.toFixed(2)}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>
                    {cell.centerLat.toFixed(1)}°N, {cell.centerLng.toFixed(1)}°E
                  </span>
                  <span className="text-[10px] text-rose-600 font-sans font-medium">
                    (M{cell.avgMag.toFixed(1)})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
