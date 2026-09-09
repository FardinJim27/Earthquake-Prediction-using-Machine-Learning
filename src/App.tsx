import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Activity, Search, ChevronRight, BarChart3, Database } from 'lucide-react';
import { predictMagnitude } from './lib/knn';

export default function App() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [inputs, setInputs] = useState({
    latitude: 36.12,
    longitude: 141.59,
    depth: 41.8,
    gap: 64.9,
    rms: 0.88
  });
  const [prediction, setPrediction] = useState<number | null>(null);

  useEffect(() => {
    // Fetch and parse the CSV
    fetch('/query2.csv')
      .then(res => res.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Filter valid numerical rows for charting
            const validData = results.data.filter((row: any) => 
              row.depth && !isNaN(parseFloat(row.depth)) && 
              row.mag && !isNaN(parseFloat(row.mag))
            ).map((row: any) => ({
              ...row,
              depth: parseFloat(row.depth),
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
    const mag = predictMagnitude(data, inputs, features, 5);
    setPrediction(mag);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs({
      ...inputs,
      [e.target.name]: parseFloat(e.target.value) || 0
    });
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
        
        {/* Left Column: Stats & Chart */}
        <div className="lg:col-span-2 space-y-8">
          
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
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Run K-NN Predictor
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            {prediction !== null && (
              <div className="mt-6 p-5 bg-indigo-50 border border-indigo-100 rounded-lg text-center animate-in fade-in zoom-in duration-200">
                <div className="text-sm text-indigo-600 font-medium mb-1">Predicted Magnitude</div>
                <div className="text-4xl font-bold text-indigo-900">{prediction.toFixed(2)}</div>
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}
