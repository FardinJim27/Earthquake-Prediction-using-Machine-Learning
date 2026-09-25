import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Activity, Search, ChevronRight, BarChart3, Database, Map as MapIcon, Info, RotateCcw, Flame } from 'lucide-react';
import { predictMagnitude, PredictionResult } from './lib/knn';
import { calculateCorrelationMatrix } from './lib/correlation';
import { CorrelationHeatmap } from './components/CorrelationHeatmap';
import { APIProvider, Map, Marker, MapMouseEvent } from '@vis.gl/react-google-maps';

const DEFAULT_INPUTS = {
  latitude: 36.12,
  longitude: 141.59,
  depth: 41.8,
  gap: 64.9,
  rms: 0.88
};

export default function App() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  useEffect(() => {
    // Fetch and parse the CSV
    fetch('/query2.csv')
      .then(res => res.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Filter valid numerical rows for charting and modeling
            const validData = results.data.filter((row: any) => 
              row.latitude && !isNaN(parseFloat(row.latitude)) &&
              row.longitude && !isNaN(parseFloat(row.longitude)) &&
              row.depth && !isNaN(parseFloat(row.depth)) && 
              row.mag && !isNaN(parseFloat(row.mag))
            ).map((row: any) => ({
              ...row,
              latitude: parseFloat(row.latitude),
              longitude: parseFloat(row.longitude),
              depth: parseFloat(row.depth),
              gap: row.gap && !isNaN(parseFloat(row.gap)) ? parseFloat(row.gap) : 0,
              rms: row.rms && !isNaN(parseFloat(row.rms)) ? parseFloat(row.rms) : 0,
              mag: parseFloat(row.mag)
            }));
            setData(validData);
            setLoading(false);
          }
        });
      })
      .catch(err => {
        console.error("Error loading data:", err);
        setLoading(false);
      });
  }, []);

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.length) return;
    
    const features = ['latitude', 'longitude', 'depth', 'gap', 'rms'];
    const result = predictMagnitude(data, inputs, features, 5);
    setPrediction(result);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs({
      ...inputs,
      [e.target.name]: parseFloat(e.target.value) || 0
    });
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setPrediction(null);
  };

  const handleMapClick = (e: MapMouseEvent) => {
    if (e.detail.latLng) {
      setInputs({
        ...inputs,
        latitude: Number(e.detail.latLng.lat.toFixed(4)),
        longitude: Number(e.detail.latLng.lng.toFixed(4))
      });
    }
  };

  // KPIs
  const maxMag = useMemo(() => {
    if (!data.length) return 0;
    return Math.max(...data.map(d => d.mag));
  }, [data]);
  
  const avgDepth = useMemo(() => {
    if (!data.length) return 0;
    return data.reduce((sum, d) => sum + d.depth, 0) / data.length;
  }, [data]);

  // Feature Correlation Matrix: latitude, longitude, depth, gap, rms vs magnitude
  const correlationData = useMemo(() => {
    if (!data.length) return null;
    const variables = [
      { key: 'latitude', label: 'Latitude' },
      { key: 'longitude', label: 'Longitude' },
      { key: 'depth', label: 'Depth' },
      { key: 'gap', label: 'Azimuthal Gap' },
      { key: 'rms', label: 'RMS' },
      { key: 'mag', label: 'Magnitude' }
    ];
    return calculateCorrelationMatrix(data, variables);
  }, [data]);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Earthquake Predictor</h1>
              <p className="text-sm text-zinc-500">Machine Learning Regression Pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
            <Database className="w-4 h-4" />
            {loading ? 'Loading dataset...' : `${data.length.toLocaleString()} records`}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats, Map & Chart */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-zinc-400" />
                <h2 className="text-lg font-medium text-zinc-900">Select Location</h2>
              </div>
              {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-md border border-amber-200">
                  <Info className="w-4 h-4" />
                  <span>Configure VITE_GOOGLE_MAPS_API_KEY for production</span>
                </div>
              )}
            </div>
            
            <div className="h-[400px] w-full rounded-lg overflow-hidden border border-zinc-200 relative bg-zinc-100 flex items-center justify-center">
              {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                  <Map
                    defaultCenter={{ lat: inputs.latitude, lng: inputs.longitude }}
                    defaultZoom={5}
                    onClick={handleMapClick}
                    disableDefaultUI={true}
                    zoomControl={true}
                    gestureHandling={'greedy'}
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  >
                    <Marker position={{ lat: inputs.latitude, lng: inputs.longitude }} />
                  </Map>
                </APIProvider>
              ) : (
                <div className="text-center px-6">
                  <MapIcon className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500 font-medium">Map Disabled</p>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                    Please configure VITE_GOOGLE_MAPS_API_KEY in your settings to enable the interactive location selector.
                  </p>
                </div>
              )}
            </div>
            <p className="mt-3 text-sm text-zinc-500">
              Click anywhere on the map to automatically populate the latitude and longitude in the prediction form.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
              <div className="text-zinc-500 text-sm font-medium mb-1">Total Datapoints</div>
              <div className="text-3xl font-semibold text-zinc-900">{data.length.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
              <div className="text-zinc-500 text-sm font-medium mb-1">Max Magnitude</div>
              <div className="text-3xl font-semibold text-rose-600">{maxMag.toFixed(1)}</div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
              <div className="text-zinc-500 text-sm font-medium mb-1">Avg Depth (km)</div>
              <div className="text-3xl font-semibold text-indigo-600">{avgDepth.toFixed(1)}</div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-zinc-400" />
              <h2 className="text-lg font-medium text-zinc-900">Depth vs Magnitude Distribution</h2>
            </div>
            
            {/* Depth vs Magnitude Chart */}
            {loading ? (
              <div className="h-[400px] flex items-center justify-center bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="animate-pulse flex items-center gap-2 text-zinc-400">
                  <Activity className="w-5 h-5 animate-spin" />
                  Processing dataset...
                </div>
              </div>
            ) : (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                    <XAxis 
                      type="number" 
                      dataKey="depth" 
                      name="Depth (km)" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#71717a' }}
                      label={{ value: 'Depth (km)', position: 'insideBottom', offset: -10, fill: '#71717a', fontSize: 13 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="mag" 
                      name="Magnitude" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#71717a' }}
                      label={{ value: 'Magnitude', angle: -90, position: 'insideLeft', offset: 10, fill: '#71717a', fontSize: 13 }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Scatter name="Earthquakes" data={data} fill="#6366f1" fillOpacity={0.4} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Feature Correlation Heatmap Card */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-medium text-zinc-900">Feature Correlation Matrix</h2>
              </div>
              <span className="text-xs text-zinc-500 font-medium">
                Pearson correlation coefficients (r)
              </span>
            </div>

            {loading || !correlationData ? (
              <div className="h-[280px] flex items-center justify-center bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="animate-pulse flex items-center gap-2 text-zinc-400">
                  <Activity className="w-5 h-5 animate-spin" />
                  Calculating feature correlations...
                </div>
              </div>
            ) : (
              <CorrelationHeatmap correlationData={correlationData} targetKey="mag" />
            )}
          </div>
        </div>

        {/* Right Column: Prediction Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 sticky top-8">
            <div className="flex items-center gap-2 mb-6">
              <Search className="w-5 h-5 text-zinc-400" />
              <h2 className="text-lg font-medium text-zinc-900">Predict Magnitude</h2>
            </div>
            
            <form onSubmit={handlePredict} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Latitude</label>
                <input 
                  type="number" 
                  step="any"
                  name="latitude"
                  value={inputs.latitude}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Longitude</label>
                <input 
                  type="number" 
                  step="any"
                  name="longitude"
                  value={inputs.longitude}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Depth (km)</label>
                <input 
                  type="number" 
                  step="any"
                  name="depth"
                  value={inputs.depth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Azimuthal Gap (°)</label>
                <input 
                  type="number" 
                  step="any"
                  name="gap"
                  value={inputs.gap}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">RMS (sec)</label>
                <input 
                  type="number" 
                  step="any"
                  name="rms"
                  value={inputs.rms}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Run K-NN Predictor
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-md font-medium text-sm transition-colors"
                  title="Reset input values to default starting coordinates"
                >
                  <RotateCcw className="w-4 h-4 text-zinc-500" />
                  Reset
                </button>
              </div>
            </form>

            {prediction !== null && (
              <div className="mt-6 p-5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="grid grid-cols-2 gap-3 divide-x divide-indigo-100">
                  <div className="text-center pr-2">
                    <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                      Predicted Magnitude
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-indigo-950">
                      {prediction.magnitude.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-indigo-500 mt-1 font-medium">
                      K-NN average (k={prediction.k})
                    </div>
                  </div>
                  <div className="text-center pl-2">
                    <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
                      Uncertainty
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-amber-900">
                      ±{prediction.uncertainty.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-amber-700/80 mt-1 font-medium">
                      Std Dev (σ of {prediction.k} neighbors)
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-indigo-100/80 flex items-center justify-between text-xs text-zinc-600">
                  <span className="font-medium text-zinc-700">Confidence Interval (±1σ):</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-100 text-indigo-900 font-semibold shadow-xs">
                    {Math.max(0, prediction.magnitude - prediction.uncertainty).toFixed(2)} – {(prediction.magnitude + prediction.uncertainty).toFixed(2)}
                  </span>
                </div>

                {prediction.neighborMagnitudes && prediction.neighborMagnitudes.length > 0 && (
                  <div className="pt-2.5 border-t border-indigo-100/60">
                    <div className="text-[11px] text-zinc-500 mb-1.5 flex items-center justify-between font-medium">
                      <span>Neighbor Magnitudes (k={prediction.k}):</span>
                      <span className="text-[10px] text-zinc-400">Closest matches</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {prediction.neighborMagnitudes.map((mag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-white text-zinc-700 border border-indigo-100 rounded text-xs font-mono font-medium"
                          title={`Neighbor #${idx + 1} magnitude`}
                        >
                          {mag.toFixed(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}
