import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Flame,
  Layers,
  Sliders,
  Eye,
  EyeOff,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  MapPin,
  Info
} from 'lucide-react';
import { EarthquakeRecord } from '../lib/gridOverlay';

interface D3SeismicHeatmapProps {
  data: EarthquakeRecord[];
  selectedLat: number;
  selectedLng: number;
  onSelectCoordinates: (lat: number, lng: number) => void;
  showMapToggle?: boolean;
  onToggleMap?: () => void;
}

export type HeatmapMetric = 'energy' | 'magnitude' | 'density';
export type ColorPalette = 'inferno' | 'turbo' | 'ylorrd';

export const D3SeismicHeatmap: React.FC<D3SeismicHeatmapProps> = ({
  data,
  selectedLat,
  selectedLng,
  onSelectCoordinates,
  showMapToggle,
  onToggleMap
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomGRef = useRef<SVGGElement>(null);

  // Heatmap configuration state
  const [metric, setMetric] = useState<HeatmapMetric>('energy');
  const [bandwidth, setBandwidth] = useState<number>(24);
  const [thresholdCount, setThresholdCount] = useState<number>(18);
  const [opacity, setOpacity] = useState<number>(0.75);
  const [palette, setPalette] = useState<ColorPalette>('inferno');
  const [showEpicenters, setShowEpicenters] = useState<boolean>(true);
  const [showContours, setShowContours] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<{
    lat: number;
    lng: number;
    x: number;
    y: number;
    estimatedRisk: string;
  } | null>(null);

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 440;
  const padding = 48;

  // Compute dataset geographic bounds
  const bounds = useMemo(() => {
    if (!data || data.length === 0) {
      return { minLat: 30, maxLat: 45, minLng: 135, maxLng: 150 };
    }
    const lats = data.map(d => d.latitude).filter(v => !isNaN(v));
    const lngs = data.map(d => d.longitude).filter(v => !isNaN(v));
    return {
      minLat: Math.floor(Math.min(...lats)),
      maxLat: Math.ceil(Math.max(...lats)),
      minLng: Math.floor(Math.min(...lngs)),
      maxLng: Math.ceil(Math.max(...lngs))
    };
  }, [data]);

  // D3 Scales for projection
  const xScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([bounds.minLng, bounds.maxLng])
      .range([padding, svgWidth - padding]);
  }, [bounds.minLng, bounds.maxLng, padding, svgWidth]);

  const yScale = useMemo(() => {
    // Invert Y: higher latitude is at top
    return d3
      .scaleLinear()
      .domain([bounds.minLat, bounds.maxLat])
      .range([svgHeight - padding, padding]);
  }, [bounds.minLat, bounds.maxLat, padding, svgHeight]);

  // Color interpolator selection
  const colorInterpolator = useMemo(() => {
    if (palette === 'turbo') return d3.interpolateTurbo;
    if (palette === 'ylorrd') return d3.interpolateYlOrRd;
    return d3.interpolateInferno;
  }, [palette]);

  // Coordinate grid ticks
  const latTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let l = Math.ceil(bounds.minLat / 2) * 2; l <= bounds.maxLat; l += 2) {
      ticks.push(l);
    }
    return ticks;
  }, [bounds.minLat, bounds.maxLat]);

  const lngTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let l = Math.ceil(bounds.minLng / 2) * 2; l <= bounds.maxLng; l += 2) {
      ticks.push(l);
    }
    return ticks;
  }, [bounds.minLng, bounds.maxLng]);

  // Generate D3 density contours
  const contours = useMemo(() => {
    if (!data || data.length === 0) return [];

    const getWeight = (d: EarthquakeRecord) => {
      const mag = d.mag || 4.5;
      if (metric === 'energy') {
        // Gutenberg-Richter seismic energy scaling: 10^(1.5 * M)
        return Math.pow(10, 0.6 * (mag - 4.0));
      }
      if (metric === 'magnitude') {
        // Quadratic magnitude weighting
        return Math.pow(mag, 2.5);
      }
      // Default: Uniform event frequency density
      return 1;
    };

    try {
      const density = d3
        .contourDensity<EarthquakeRecord>()
        .x(d => xScale(d.longitude))
        .y(d => yScale(d.latitude))
        .weight(d => getWeight(d))
        .size([svgWidth, svgHeight])
        .bandwidth(bandwidth)
        .thresholds(thresholdCount);

      const generated = density(data);
      return generated;
    } catch (err) {
      console.error('Error generating D3 contour density:', err);
      return [];
    }
  }, [data, xScale, yScale, bandwidth, thresholdCount, metric]);

  // Value extents for color scale
  const densityValues = useMemo(() => {
    return contours.map(c => c.value);
  }, [contours]);

  const maxDensity = useMemo(() => {
    return densityValues.length > 0 ? d3.max(densityValues) || 1 : 1;
  }, [densityValues]);

  const minDensity = useMemo(() => {
    return densityValues.length > 0 ? d3.min(densityValues) || 0 : 0;
  }, [densityValues]);

  // D3 Color Scale
  const colorScale = useMemo(() => {
    return d3
      .scaleSequential(colorInterpolator)
      .domain([minDensity, maxDensity]);
  }, [colorInterpolator, minDensity, maxDensity]);

  // Geo Path Generator
  const pathGenerator = useMemo(() => {
    return d3.geoPath();
  }, []);

  // Zoom behavior setup with D3
  const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 6])
      .translateExtent([[0, 0], [svgWidth, svgHeight]])
      .on('zoom', (event) => {
        setZoomTransform(event.transform);
      });

    svg.call(zoom);

    // Double-click resets zoom
    svg.on('dblclick.zoom', () => {
      svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
    });

    return () => {
      svg.on('.zoom', null);
    };
  }, [svgWidth, svgHeight]);

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy, 1.4
    );
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy, 0.7
    );
  };

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(400).call(
      d3.zoom<SVGSVGElement, unknown>().transform, d3.zoomIdentity
    );
  };

  // Click handler to select coordinates
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scaleX = svgWidth / rect.width;
    const scaleY = svgHeight / rect.height;

    // Invert zoom transform to find untransformed SVG coordinates
    const untransformedX = (clientX * scaleX - zoomTransform.x) / zoomTransform.k;
    const untransformedY = (clientY * scaleY - zoomTransform.y) / zoomTransform.k;

    const clickLng = xScale.invert(untransformedX);
    const clickLat = yScale.invert(untransformedY);

    if (
      clickLat >= bounds.minLat &&
      clickLat <= bounds.maxLat &&
      clickLng >= bounds.minLng &&
      clickLng <= bounds.maxLng
    ) {
      onSelectCoordinates(
        Number(clickLat.toFixed(3)),
        Number(clickLng.toFixed(3))
      );
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scaleX = svgWidth / rect.width;
    const scaleY = svgHeight / rect.height;

    const untransformedX = (clientX * scaleX - zoomTransform.x) / zoomTransform.k;
    const untransformedY = (clientY * scaleY - zoomTransform.y) / zoomTransform.k;

    const hoverLng = xScale.invert(untransformedX);
    const hoverLat = yScale.invert(untransformedY);

    if (
      hoverLat >= bounds.minLat &&
      hoverLat <= bounds.maxLat &&
      hoverLng >= bounds.minLng &&
      hoverLng <= bounds.maxLng
    ) {
      // Find nearest quake to give qualitative risk
      let nearestDist = Infinity;
      let nearestMag = 4.5;
      for (let i = 0; i < Math.min(data.length, 500); i++) {
        const q = data[i];
        const dist = Math.hypot(q.latitude - hoverLat, q.longitude - hoverLng);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestMag = q.mag;
        }
      }

      let risk = 'Low Baseline Risk';
      if (nearestDist < 0.4) {
        risk = nearestMag >= 6.0 ? 'Extreme Seismic Hazard' : nearestMag >= 5.0 ? 'High Hazard Zone' : 'Moderate Seismic Zone';
      } else if (nearestDist < 0.9) {
        risk = 'Moderate Hazard Zone';
      }

      setHoveredPoint({
        lat: hoverLat,
        lng: hoverLng,
        x: clientX,
        y: clientY,
        estimatedRisk: risk
      });
    } else {
      setHoveredPoint(null);
    }
  };

  // Selected Pin coordinates in SVG
  const pinX = xScale(selectedLng);
  const pinY = yScale(selectedLat);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Header with Title & Controls */}
      <div className="p-4 sm:p-5 border-b border-zinc-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-50/50">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 shadow-2xs">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">
                  D3 Geographic Risk Heatmap
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {contours.length} contour bands
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Continuous 2D kernel density estimation showing predicted earthquake risk intensity
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="flex items-center bg-white border border-zinc-200 p-0.5 rounded-lg text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setMetric('energy')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                metric === 'energy'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
              title="Weight by Gutenberg-Richter seismic energy release (10^1.5M)"
            >
              Energy ($10^{'{1.5M}'}$)
            </button>
            <button
              type="button"
              onClick={() => setMetric('magnitude')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                metric === 'magnitude'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
              title="Weight by magnitude intensity"
            >
              Magnitude
            </button>
            <button
              type="button"
              onClick={() => setMetric('density')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                metric === 'density'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
              title="Standard epicenter spatial frequency"
            >
              Frequency
            </button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center bg-white border border-zinc-200 rounded-lg text-xs px-2 py-1 gap-1.5 shadow-2xs">
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={palette}
              onChange={(e) => setPalette(e.target.value as ColorPalette)}
              aria-label="Color Palette"
              className="bg-transparent text-zinc-700 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="inferno">Inferno / Magma</option>
              <option value="turbo">Turbo Spectral</option>
              <option value="ylorrd">YlOrRd Thermal</option>
            </select>
          </div>

          {/* Contours Toggle */}
          <button
            type="button"
            onClick={() => setShowContours(!showContours)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              showContours
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-white text-zinc-500 border-zinc-200'
            }`}
            title="Toggle continuous D3 contour heatmap bands"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Contours</span>
          </button>

          {/* Epicenters Scatter Toggle */}
          <button
            type="button"
            onClick={() => setShowEpicenters(!showEpicenters)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              showEpicenters
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-zinc-500 border-zinc-200'
            }`}
            title="Toggle individual earthquake epicenter dots"
          >
            {showEpicenters ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Quakes</span>
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

      {/* Density Heatmap Viewport */}
      <div
        ref={containerRef}
        className="relative w-full h-[420px] bg-slate-950 overflow-hidden cursor-crosshair select-none"
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          onClick={handleSvgClick}
          onMouseMove={handleMouseMove}
        >
          <defs>
            {/* Dark Grid Pattern */}
            <pattern id="d3-grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            </pattern>

            {/* Glowing Rose Filter */}
            <filter id="d3-hotspot-glow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Canvas */}
          <rect width={svgWidth} height={svgHeight} fill="#090d16" />
          <rect width={svgWidth} height={svgHeight} fill="url(#d3-grid-pattern)" />

          {/* Coordinate Guide Lines (Static Frame) */}
          {latTicks.map((lat) => {
            const y = yScale(lat);
            if (y < padding || y > svgHeight - padding) return null;
            return (
              <g key={`d3-lat-${lat}`}>
                <line
                  x1={padding}
                  y1={y}
                  x2={svgWidth - padding}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding - 8}
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
            const x = xScale(lng);
            if (x < padding || x > svgWidth - padding) return null;
            return (
              <g key={`d3-lng-${lng}`}>
                <line
                  x1={x}
                  y1={padding}
                  x2={x}
                  y2={svgHeight - padding}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={svgHeight - padding + 16}
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

          {/* Subduction Zone Tectonic Trench Guideline */}
          <path
            d={`M ${xScale(144)},${yScale(43)} Q ${xScale(142.5)},${yScale(38)} ${xScale(140.5)},${yScale(33)}`}
            fill="none"
            stroke="rgba(244, 63, 94, 0.25)"
            strokeWidth="1.5"
            strokeDasharray="6 3"
          />
          <text
            x={xScale(143.5)}
            y={yScale(40)}
            fill="rgba(244, 63, 94, 0.45)"
            fontSize="9"
            fontFamily="sans-serif"
            fontStyle="italic"
            transform={`rotate(75, ${xScale(143.5)}, ${yScale(40)})`}
          >
            Japan Trench Subduction Zone
          </text>

          {/* Zoomable Container */}
          <g
            ref={zoomGRef}
            transform={`translate(${zoomTransform.x}, ${zoomTransform.y}) scale(${zoomTransform.k})`}
          >
            {/* D3 Contour Density Polygons (The Heatmap Layers) */}
            {showContours &&
              contours.map((contour, idx) => {
                const fill = colorScale(contour.value);
                const isHighIntensity = idx >= contours.length * 0.75;
                const pathStr = pathGenerator(contour) || '';

                return (
                  <path
                    key={`contour-${idx}`}
                    d={pathStr}
                    fill={fill}
                    fillOpacity={opacity * (0.4 + (idx / contours.length) * 0.6)}
                    stroke={fill}
                    strokeWidth={isHighIntensity ? 1.2 : 0.6}
                    strokeOpacity={0.8}
                    filter={isHighIntensity ? 'url(#d3-hotspot-glow)' : undefined}
                    className="transition-opacity duration-300"
                  />
                );
              })}

            {/* Individual Earthquake Epicenters */}
            {showEpicenters &&
              data.slice(0, 1600).map((q, idx) => {
                const qx = xScale(q.longitude);
                const qy = yScale(q.latitude);
                if (qx < padding || qx > svgWidth - padding || qy < padding || qy > svgHeight - padding) {
                  return null;
                }

                const r = q.mag >= 6.0 ? 3.0 : q.mag >= 5.0 ? 2.0 : 1.2;
                const fill = q.mag >= 6.0 ? '#ffffff' : q.mag >= 5.0 ? '#fbbf24' : '#60a5fa';

                return (
                  <circle
                    key={`point-${idx}`}
                    cx={qx}
                    cy={qy}
                    r={r}
                    fill={fill}
                    fillOpacity={q.mag >= 6.0 ? 0.9 : 0.4}
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth={0.5}
                    pointerEvents="none"
                  />
                );
              })}

            {/* User Selected Pin Target */}
            {pinX >= padding && pinX <= svgWidth - padding && pinY >= padding && pinY <= svgHeight - padding && (
              <g pointerEvents="none" className="animate-in zoom-in-75 duration-200">
                <circle
                  cx={pinX}
                  cy={pinY}
                  r="16"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.8"
                />
                <circle
                  cx={pinX}
                  cy={pinY}
                  r="6"
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))"
                />
                <circle cx={pinX} cy={pinY} r="2" fill="#ffffff" />
              </g>
            )}
          </g>

          {/* Bounding Outer Border */}
          <rect
            x={padding}
            y={padding}
            width={svgWidth - padding * 2}
            height={svgHeight - padding * 2}
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1"
            pointerEvents="none"
          />
        </svg>

        {/* Hover Risk Info Card */}
        {hoveredPoint && (
          <div
            className="absolute z-30 pointer-events-none bg-zinc-900/95 backdrop-blur-md text-white p-2.5 rounded-lg shadow-xl border border-zinc-700 text-xs w-56 animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: Math.min(hoveredPoint.x + 12, 540),
              top: Math.max(10, Math.min(hoveredPoint.y - 80, 290))
            }}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1 mb-1.5">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Seismic Density</span>
              </span>
              <span className="text-[10px] text-amber-300 font-bold uppercase">
                {hoveredPoint.estimatedRisk}
              </span>
            </div>
            <div className="font-mono text-[11px] text-zinc-300 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-zinc-400 font-sans">Coords:</span>
                <span>
                  {hoveredPoint.lat.toFixed(2)}°N, {hoveredPoint.lng.toFixed(2)}°E
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 font-sans">Weight Model:</span>
                <span className="text-rose-400 font-sans capitalize">{metric}</span>
              </div>
            </div>
            <div className="mt-1.5 pt-1 border-t border-zinc-800 text-[10px] text-indigo-400 font-sans">
              Click to run prediction for this point
            </div>
          </div>
        )}

        {/* Top-Right Target Badge */}
        <div className="absolute top-3 right-3 bg-zinc-900/80 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-zinc-700/80 text-[11px] text-zinc-300 flex items-center gap-2 shadow-sm pointer-events-none">
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <span>
            Target: <strong className="text-white font-mono">{selectedLat.toFixed(2)}°N, {selectedLng.toFixed(2)}°E</strong>
          </span>
        </div>

        {/* Zoom Controls Overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-zinc-900/80 backdrop-blur-xs p-1 rounded-lg border border-zinc-700/80 shadow-md">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="Zoom In (or scroll wheel)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="Zoom Out (or scroll wheel)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="Reset Zoom View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Prompt in Bottom-Left */}
        <div className="absolute bottom-3 left-3 bg-zinc-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-zinc-700/80 text-[10px] text-zinc-400 hidden sm:flex items-center gap-1.5 pointer-events-none">
          <Info className="w-3 h-3 text-zinc-400" />
          <span>Click anywhere to target coordinates • Scroll to zoom • Drag to pan</span>
        </div>
      </div>

      {/* Heatmap Settings Footer & Risk Gradient Legend */}
      <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Continuous Gradient Legend */}
        <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-700">
            <span>Predicted Seismic Risk Intensity:</span>
            <span className="text-[11px] text-zinc-500 font-mono">
              {metric === 'energy' ? 'Seismic Stress' : metric === 'magnitude' ? 'Magnitude Release' : 'Event Density'}
            </span>
          </div>

          {/* Color Gradient Bar */}
          <div className="h-3 w-full rounded-md shadow-2xs overflow-hidden border border-zinc-300"
            style={{
              background: palette === 'turbo'
                ? 'linear-gradient(to right, #30123b, #466be3, #28bbec, #a2fc3c, #fb8022, #7a0403)'
                : palette === 'ylorrd'
                ? 'linear-gradient(to right, #ffffcc, #fed976, #feb24c, #fd8d3c, #f03b20, #bd0026)'
                : 'linear-gradient(to right, #000004, #3b0f70, #8c2981, #de4968, #fe9f6d, #fcfdbf)'
            }}
          />

          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>Low (Baseline)</span>
            <span>Moderate</span>
            <span className="text-rose-600 font-bold">Severe Risk</span>
          </div>
        </div>

        {/* Heatmap Detail Sliders */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Smoothness / Bandwidth */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 font-medium">Kernel Bandwidth:</span>
            <input
              type="range"
              min="12"
              max="48"
              step="4"
              value={bandwidth}
              onChange={(e) => setBandwidth(parseInt(e.target.value))}
              className="w-20 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
              title={`Kernel bandwidth: ${bandwidth}px`}
            />
            <span className="font-mono text-zinc-500 w-6">{bandwidth}px</span>
          </div>

          {/* Contour Levels */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 font-medium">Bands:</span>
            <input
              type="range"
              min="10"
              max="30"
              step="2"
              value={thresholdCount}
              onChange={(e) => setThresholdCount(parseInt(e.target.value))}
              className="w-16 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
              title={`Number of contour threshold bands: ${thresholdCount}`}
            />
            <span className="font-mono text-zinc-500 w-5">{thresholdCount}</span>
          </div>

          {/* Opacity */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 font-medium">Opacity:</span>
            <input
              type="range"
              min="0.3"
              max="0.95"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
              title={`Heatmap opacity: ${Math.round(opacity * 100)}%`}
            />
            <span className="font-mono text-zinc-500 w-8">{Math.round(opacity * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
