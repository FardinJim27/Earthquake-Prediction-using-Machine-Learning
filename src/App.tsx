import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Activity, Search, ChevronRight, BarChart3, Database, Map as MapIcon, RotateCcw, Flame, Download, Check, AlertCircle, MapPinOff, Eye, EyeOff, FileText, History, Bell, BellRing, AlertTriangle, Layers, Sparkles } from 'lucide-react';
import { predictMagnitude, PredictionResult } from './lib/knn';
import { calculateCorrelationMatrix } from './lib/correlation';
import { CorrelationHeatmap } from './components/CorrelationHeatmap';
import { generatePredictionReport } from './lib/pdfReport';
import { PredictionHistory, HistoryItem } from './components/PredictionHistory';
import { SeismicGridMap } from './components/SeismicGridMap';
import { D3SeismicHeatmap } from './components/D3SeismicHeatmap';
import {
  NotificationSettings,
  AlertDetails,
  loadNotificationSettings,
  saveNotificationSettings,
  sendBrowserNotification,
  playAlertChime
} from './lib/notifications';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { HazardAlertToast } from './components/HazardAlertToast';

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
  const [inputs, setInputs] = useState<Record<string, string | number>>({
    latitude: DEFAULT_INPUTS.latitude,
    longitude: DEFAULT_INPUTS.longitude,
    depth: DEFAULT_INPUTS.depth,
    gap: DEFAULT_INPUTS.gap,
    rms: DEFAULT_INPUTS.rms
  });
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [mapOverlayMode, setMapOverlayMode] = useState<'d3' | 'grid'>('d3');

  // Real-Time Notification State (User-defined threshold, default 5.0)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    loadNotificationSettings()
  );
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [activeAlert, setActiveAlert] = useState<AlertDetails | null>(null);

  const handleSaveNotificationSettings = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const checkAndNotifyHazard = (
    result: PredictionResult,
    numericInputs: Record<string, number>
  ) => {
    if (!notificationSettings.enabled) return;
    if (result.magnitude >= notificationSettings.threshold) {
      const details: AlertDetails = {
        magnitude: result.magnitude,
        uncertainty: result.uncertainty,
        threshold: notificationSettings.threshold,
        latitude: numericInputs.latitude,
        longitude: numericInputs.longitude,
        depth: numericInputs.depth
      };

      if (notificationSettings.soundEnabled) {
        playAlertChime();
      }

      sendBrowserNotification(details);
      setActiveAlert(details);
    }
  };

  const handleTriggerTestAlert = () => {
    const testDetails: AlertDetails = {
      magnitude: Math.max(5.8, notificationSettings.threshold + 0.5),
      uncertainty: 0.32,
      threshold: notificationSettings.threshold,
      latitude: Number(inputs.latitude) || DEFAULT_INPUTS.latitude,
      longitude: Number(inputs.longitude) || DEFAULT_INPUTS.longitude,
      depth: Number(inputs.depth) || DEFAULT_INPUTS.depth,
      isTest: true
    };

    if (notificationSettings.soundEnabled) {
      playAlertChime();
    }
    sendBrowserNotification(testDetails);
    setActiveAlert(testDetails);
  };

  // History State: saves the last 5 successful prediction inputs and their results
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('earthquake_prediction_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 5);
        }
      }
    } catch (e) {
      console.error('Failed to load prediction history from localStorage:', e);
    }
    return [];
  });
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  // Persist history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('earthquake_prediction_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save prediction history to localStorage:', e);
    }
  }, [history]);

  // Helper to add a successful prediction to history (keeps up to last 5 runs)
  const addToHistory = (numericInputs: Record<string, number>, result: PredictionResult) => {
    const newItem: HistoryItem = {
      id: `scenario_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      dateStr: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      inputs: {
        latitude: numericInputs.latitude,
        longitude: numericInputs.longitude,
        depth: numericInputs.depth,
        gap: numericInputs.gap,
        rms: numericInputs.rms
      },
      result
    };

    setHistory(prev => {
      // Remove any prior item with identical inputs to prevent duplicate consecutive scenarios
      const filtered = prev.filter(item => !(
        Math.abs(item.inputs.latitude - newItem.inputs.latitude) < 0.0001 &&
        Math.abs(item.inputs.longitude - newItem.inputs.longitude) < 0.0001 &&
        Math.abs(item.inputs.depth - newItem.inputs.depth) < 0.01 &&
        Math.abs(item.inputs.gap - newItem.inputs.gap) < 0.01 &&
        Math.abs(item.inputs.rms - newItem.inputs.rms) < 0.01
      ));
      return [newItem, ...filtered].slice(0, 5);
    });
    setActiveScenarioId(newItem.id);
  };

  const handleSelectScenario = (item: HistoryItem) => {
    setInputs({
      latitude: item.inputs.latitude,
      longitude: item.inputs.longitude,
      depth: item.inputs.depth,
      gap: item.inputs.gap,
      rms: item.inputs.rms
    });

    const numericInputs = {
      latitude: item.inputs.latitude,
      longitude: item.inputs.longitude,
      depth: item.inputs.depth,
      gap: item.inputs.gap,
      rms: item.inputs.rms
    };

    if (data.length > 0) {
      const features = ['latitude', 'longitude', 'depth', 'gap', 'rms'];
      const result = predictMagnitude(data, numericInputs, features, 5);
      setPrediction(result);
      checkAndNotifyHazard(result, numericInputs);
    } else {
      setPrediction(item.result);
      checkAndNotifyHazard(item.result, numericInputs);
    }
    setActiveScenarioId(item.id);
  };

  const handleDeleteScenario = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (activeScenarioId === id) {
      setActiveScenarioId(null);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    setActiveScenarioId(null);
  };

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
    if (Object.keys(validationErrors).length > 0) return;
    
    const numericInputs: Record<string, number> = {
      latitude: Number(inputs.latitude) || 0,
      longitude: Number(inputs.longitude) || 0,
      depth: Number(inputs.depth) || 0,
      gap: Number(inputs.gap) || 0,
      rms: Number(inputs.rms) || 0
    };

    const features = ['latitude', 'longitude', 'depth', 'gap', 'rms'];
    const result = predictMagnitude(data, numericInputs, features, 5);
    setPrediction(result);
    addToHistory(numericInputs, result);
    checkAndNotifyHazard(result, numericInputs);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs({
      ...inputs,
      [e.target.name]: e.target.value
    });
  };

  const handleReset = () => {
    setInputs({
      latitude: DEFAULT_INPUTS.latitude,
      longitude: DEFAULT_INPUTS.longitude,
      depth: DEFAULT_INPUTS.depth,
      gap: DEFAULT_INPUTS.gap,
      rms: DEFAULT_INPUTS.rms
    });
    setPrediction(null);
    setActiveScenarioId(null);
  };

  const handleExportCSV = () => {
    if (!data || !data.length) return;
    setIsExporting(true);
    try {
      // Unparse the processed data to CSV string
      const csvString = Papa.unparse(data);
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `earthquake_processed_dataset_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadReport = () => {
    if (!data || !data.length) return;
    setIsGeneratingPdf(true);
    try {
      let currentPrediction = prediction;
      // If user hasn't pressed Run Predictor yet but current form inputs are valid, compute prediction automatically
      if (!currentPrediction && Object.keys(validationErrors).length === 0) {
        const numericInputs: Record<string, number> = {
          latitude: Number(inputs.latitude) || 0,
          longitude: Number(inputs.longitude) || 0,
          depth: Number(inputs.depth) || 0,
          gap: Number(inputs.gap) || 0,
          rms: Number(inputs.rms) || 0
        };
        const features = ['latitude', 'longitude', 'depth', 'gap', 'rms'];
        currentPrediction = predictMagnitude(data, numericInputs, features, 5);
        setPrediction(currentPrediction);
        addToHistory(numericInputs, currentPrediction);
        checkAndNotifyHazard(currentPrediction, numericInputs);
      }

      generatePredictionReport({
        data,
        inputs,
        prediction: currentPrediction,
        featureRanges,
        maxMag,
        avgDepth
      });

      setPdfSuccess(true);
      setTimeout(() => {
        setPdfSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Observed valid feature ranges in the dataset
  const featureRanges = useMemo(() => {
    if (!data.length) return null;
    const calculateMinMax = (key: string) => {
      const vals = data
        .map(d => parseFloat(d[key]))
        .filter(v => !isNaN(v));
      if (!vals.length) return { min: 0, max: 0 };
      return {
        min: Math.min(...vals),
        max: Math.max(...vals)
      };
    };

    return {
      latitude: calculateMinMax('latitude'),
      longitude: calculateMinMax('longitude'),
      depth: calculateMinMax('depth'),
      gap: calculateMinMax('gap'),
      rms: calculateMinMax('rms')
    };
  }, [data]);

  // Validation errors for each field when entered value is outside the observed dataset range
  const validationErrors = useMemo(() => {
    if (!featureRanges) return {};
    const errors: Record<string, string> = {};

    const validateField = (name: string, label: string, unit: string = '') => {
      const rawVal = inputs[name];
      if (rawVal === '' || rawVal === undefined || rawVal === null) {
        errors[name] = `${label} is required`;
        return;
      }
      const val = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal);
      if (isNaN(val)) {
        errors[name] = `Must be a valid number`;
        return;
      }
      const range = featureRanges[name as keyof typeof featureRanges];
      if (range) {
        if (val < range.min || val > range.max) {
          const unitStr = unit ? ` ${unit}` : '';
          errors[name] = `Value ${val}${unitStr} is outside dataset range (${range.min.toFixed(2)} to ${range.max.toFixed(2)}${unitStr})`;
        }
      }
    };

    validateField('latitude', 'Latitude', '°');
    validateField('longitude', 'Longitude', '°');
    validateField('depth', 'Depth', 'km');
    validateField('gap', 'Azimuthal Gap', '°');
    validateField('rms', 'RMS', 'sec');

    return errors;
  }, [inputs, featureRanges]);

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
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Real-time Seismic Alerts Button */}
            <button
              type="button"
              onClick={() => setIsNotificationModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                notificationSettings.enabled
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                  : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-600 border-zinc-200'
              }`}
              title={`Real-Time Hazard Alert Notifications (Trigger threshold: M ${notificationSettings.threshold.toFixed(1)})`}
            >
              <div className="relative">
                {notificationSettings.enabled ? (
                  <>
                    <BellRing className="w-4 h-4 text-rose-600" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                  </>
                ) : (
                  <Bell className="w-4 h-4 text-zinc-500" />
                )}
              </div>
              <span className="hidden sm:inline">Alerts</span>
              <span className="text-xs font-mono font-bold bg-white/90 px-1.5 py-0.5 rounded border border-rose-200 text-rose-800">
                &ge;{notificationSettings.threshold.toFixed(1)}
              </span>
            </button>

            <button
              onClick={() => setShowMap(!showMap)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                showMap
                  ? 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border-zinc-200'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 ring-1 ring-indigo-200'
              }`}
              title={showMap ? "Hide interactive map to focus on data input" : "Show interactive map component"}
            >
              {showMap ? (
                <>
                  <EyeOff className="w-4 h-4 text-zinc-500" />
                  <span className="hidden sm:inline">Hide Map</span>
                </>
              ) : (
                <>
                  <MapIcon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Show Map</span>
                </>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-500 font-medium bg-zinc-50 border border-zinc-200/80 px-3 py-1.5 rounded-lg">
              <Database className="w-4 h-4 text-zinc-400" />
              {loading ? 'Loading dataset...' : `${data.length.toLocaleString()} records`}
            </div>

            <button
              onClick={handleDownloadReport}
              disabled={loading || !data.length || isGeneratingPdf}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all shadow-xs border ${
                pdfSuccess
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent active:scale-95'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Download prediction results, input parameters, and dataset summary statistics as a formatted PDF report"
            >
              {isGeneratingPdf ? (
                <>
                  <Activity className="w-4 h-4 animate-spin text-white" />
                  <span className="hidden sm:inline">Generating...</span>
                  <span className="sm:hidden">PDF...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 animate-in zoom-in-50" />
                  <span>Report Saved!</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-white" />
                  <span className="hidden sm:inline">Download Report</span>
                  <span className="sm:hidden">Report</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportCSV}
              disabled={loading || !data.length || isExporting}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all shadow-xs border ${
                exportSuccess
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 border-zinc-300 active:scale-95'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Download the analyzed earthquake dataset as a CSV file"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 animate-in zoom-in-50" />
                  <span>Exported!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-zinc-500" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">Export</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats, Map & Chart */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Map Overlay Mode Switcher Bar */}
          {showMap && (
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setMapOverlayMode('d3')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mapOverlayMode === 'd3'
                      ? 'bg-white text-rose-700 shadow-xs border border-zinc-200'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                  title="Continuous D3 geographic density heatmap overlay based on dataset distribution"
                >
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                  <span>D3 Geographic Heatmap</span>
                  <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-full font-mono border border-rose-200">
                    Density
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMapOverlayMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mapOverlayMode === 'grid'
                      ? 'bg-white text-indigo-700 shadow-xs border border-zinc-200'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                  title="Discrete spatial grid overlay with cell statistics"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Grid System Overlay</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full font-mono border border-indigo-200">
                    Cells
                  </span>
                </button>
              </div>

              <div className="text-xs text-zinc-500 hidden sm:flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Click map to target coordinates</span>
              </div>
            </div>
          )}

          {/* Map Component Card (D3 Heatmap or Seismic Grid Overlay) */}
          {showMap ? (
            mapOverlayMode === 'd3' ? (
              <D3SeismicHeatmap
                data={data}
                selectedLat={Number(inputs.latitude) || DEFAULT_INPUTS.latitude}
                selectedLng={Number(inputs.longitude) || DEFAULT_INPUTS.longitude}
                onSelectCoordinates={(lat, lng) => {
                  setInputs(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng
                  }));
                }}
                showMapToggle={true}
                onToggleMap={() => setShowMap(false)}
              />
            ) : (
              <SeismicGridMap
                data={data}
                selectedLat={Number(inputs.latitude) || DEFAULT_INPUTS.latitude}
                selectedLng={Number(inputs.longitude) || DEFAULT_INPUTS.longitude}
                onSelectCoordinates={(lat, lng) => {
                  setInputs(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng
                  }));
                }}
                showMapToggle={true}
                onToggleMap={() => setShowMap(false)}
                isGoogleMapAvailable={!!import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
              />
            )
          ) : (
            <div className="bg-white border border-dashed border-zinc-300 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-500">
                  <MapPinOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-900">Map Hidden (Data Input Focus Mode)</h3>
                  <p className="text-xs text-zinc-500">
                    Using direct form input for coordinates ({Number(inputs.latitude).toFixed(2)}°, {Number(inputs.longitude).toFixed(2)}°).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMap(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors shrink-0"
              >
                <Eye className="w-3.5 h-3.5" />
                Show Map
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-zinc-900">Dataset Overview</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadReport}
                disabled={loading || !data.length || isGeneratingPdf}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download formatted PDF report with prediction results and dataset summary"
              >
                <FileText className="w-3.5 h-3.5" />
                Download Report (.pdf)
              </button>
              <span className="text-zinc-300">|</span>
              <button
                onClick={handleExportCSV}
                disabled={loading || !data.length || isExporting}
                className="text-xs text-zinc-600 hover:text-zinc-800 font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download analyzed earthquake dataset as a CSV file"
              >
                <Download className="w-3.5 h-3.5" />
                Export Dataset (.csv)
              </button>
            </div>
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

        {/* Right Column: Prediction Form & History Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-zinc-400" />
                <h2 className="text-lg font-medium text-zinc-900">Predict Magnitude</h2>
              </div>
              <div className="flex items-center gap-1.5">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('history-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
                    title="Jump to Scenario History list"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>History ({history.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                    showMap
                      ? 'text-zinc-600 bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200'
                      : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
                  }`}
                  title={showMap ? "Hide map to focus on input form" : "Show interactive map component"}
                >
                  {showMap ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide Map</span>
                    </>
                  ) : (
                    <>
                      <MapIcon className="w-3.5 h-3.5" />
                      <span>Show Map</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <form onSubmit={handlePredict} className="space-y-4">
              {/* Latitude */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-700">Latitude</label>
                  {featureRanges?.latitude && (
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Valid: {featureRanges.latitude.min.toFixed(2)}° to {featureRanges.latitude.max.toFixed(2)}°
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    step="any"
                    name="latitude"
                    value={inputs.latitude}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 pr-9 border rounded-md shadow-sm text-sm transition-colors focus:outline-none focus:ring-2 ${
                      validationErrors.latitude
                        ? 'border-rose-300 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-zinc-300 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-900'
                    }`}
                  />
                  {validationErrors.latitude && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    </div>
                  )}
                </div>
                {validationErrors.latitude && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                    <span>{validationErrors.latitude}</span>
                  </p>
                )}
              </div>

              {/* Longitude */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-700">Longitude</label>
                  {featureRanges?.longitude && (
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Valid: {featureRanges.longitude.min.toFixed(2)}° to {featureRanges.longitude.max.toFixed(2)}°
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    step="any"
                    name="longitude"
                    value={inputs.longitude}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 pr-9 border rounded-md shadow-sm text-sm transition-colors focus:outline-none focus:ring-2 ${
                      validationErrors.longitude
                        ? 'border-rose-300 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-zinc-300 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-900'
                    }`}
                  />
                  {validationErrors.longitude && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    </div>
                  )}
                </div>
                {validationErrors.longitude && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                    <span>{validationErrors.longitude}</span>
                  </p>
                )}
              </div>

              {/* Depth */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-700">Depth (km)</label>
                  {featureRanges?.depth && (
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Valid: {featureRanges.depth.min.toFixed(1)} to {featureRanges.depth.max.toFixed(1)} km
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    step="any"
                    name="depth"
                    value={inputs.depth}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 pr-9 border rounded-md shadow-sm text-sm transition-colors focus:outline-none focus:ring-2 ${
                      validationErrors.depth
                        ? 'border-rose-300 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-zinc-300 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-900'
                    }`}
                  />
                  {validationErrors.depth && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    </div>
                  )}
                </div>
                {validationErrors.depth && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                    <span>{validationErrors.depth}</span>
                  </p>
                )}
              </div>

              {/* Azimuthal Gap */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-700">Azimuthal Gap (°)</label>
                  {featureRanges?.gap && (
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Valid: {featureRanges.gap.min.toFixed(1)}° to {featureRanges.gap.max.toFixed(1)}°
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    step="any"
                    name="gap"
                    value={inputs.gap}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 pr-9 border rounded-md shadow-sm text-sm transition-colors focus:outline-none focus:ring-2 ${
                      validationErrors.gap
                        ? 'border-rose-300 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-zinc-300 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-900'
                    }`}
                  />
                  {validationErrors.gap && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    </div>
                  )}
                </div>
                {validationErrors.gap && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                    <span>{validationErrors.gap}</span>
                  </p>
                )}
              </div>

              {/* RMS */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-700">RMS (sec)</label>
                  {featureRanges?.rms && (
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Valid: {featureRanges.rms.min.toFixed(2)} to {featureRanges.rms.max.toFixed(2)} s
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    step="any"
                    name="rms"
                    value={inputs.rms}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 pr-9 border rounded-md shadow-sm text-sm transition-colors focus:outline-none focus:ring-2 ${
                      validationErrors.rms
                        ? 'border-rose-300 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-zinc-300 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-900'
                    }`}
                  />
                  {validationErrors.rms && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    </div>
                  )}
                </div>
                {validationErrors.rms && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                    <span>{validationErrors.rms}</span>
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={loading || Object.keys(validationErrors).length > 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-xs"
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
                {/* Hazard Alert Banner */}
                {prediction.magnitude >= notificationSettings.threshold && (
                  <div className="p-3 rounded-lg bg-rose-100/90 border border-rose-300 text-rose-900 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        <strong className="font-semibold">Hazard Alert Triggered:</strong> M {prediction.magnitude.toFixed(2)} exceeds threshold (M {notificationSettings.threshold.toFixed(1)}).
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNotificationModalOpen(true)}
                      className="text-[11px] underline font-medium hover:text-rose-950 shrink-0 cursor-pointer"
                    >
                      Threshold
                    </button>
                  </div>
                )}

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

                <div className="pt-3 border-t border-indigo-100/80">
                  <button
                    type="button"
                    onClick={handleDownloadReport}
                    disabled={isGeneratingPdf}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm text-sm transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Export formatted PDF report including this prediction, coordinates, and full dataset summary statistics"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin text-white" />
                        <span>Generating PDF Report...</span>
                      </>
                    ) : pdfSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-200 animate-in zoom-in-50" />
                        <span>Report Downloaded!</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 text-white" />
                        <span>Download Prediction Report (PDF)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
          </div>

          {/* Scenario History Card (Last 5 Successful Predictions) */}
          <div id="history-section">
            <PredictionHistory
              history={history}
              activeScenarioId={activeScenarioId}
              onSelectScenario={handleSelectScenario}
              onDeleteScenario={handleDeleteScenario}
              onClearHistory={handleClearHistory}
              currentInputs={inputs}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-zinc-600">
            Developed & Maintained by{' '}
            <a
              href="https://fardinjim.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300 underline-offset-4 hover:decoration-indigo-600 transition-colors"
            >
              FJ
            </a>
          </p>
        </div>
      </footer>

      {/* Real-Time Hazard Alert Toast Notification */}
      <HazardAlertToast alert={activeAlert} onDismiss={() => setActiveAlert(null)} />

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        settings={notificationSettings}
        onSaveSettings={handleSaveNotificationSettings}
        onTriggerTestAlert={handleTriggerTestAlert}
      />
    </div>
  );
}
