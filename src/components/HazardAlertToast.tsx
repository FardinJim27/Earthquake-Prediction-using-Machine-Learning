import React, { useEffect } from 'react';
import { AlertTriangle, X, BellRing, MapPin } from 'lucide-react';
import { AlertDetails } from '../lib/notifications';

interface HazardAlertToastProps {
  alert: AlertDetails | null;
  onDismiss: () => void;
}

export const HazardAlertToast: React.FC<HazardAlertToastProps> = ({ alert, onDismiss }) => {
  useEffect(() => {
    if (!alert) return;
    // Auto-dismiss after 8 seconds if not dismissed manually
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000);
    return () => clearTimeout(timer);
  }, [alert, onDismiss]);

  if (!alert) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-rose-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl border-2 border-rose-500/80 p-4.5 overflow-hidden relative ring-4 ring-rose-500/20">
        {/* Glow effect */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 animate-pulse" />

        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-rose-600/80 text-white shrink-0 mt-0.5 shadow-md animate-bounce">
            {alert.isTest ? <BellRing className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-700 text-rose-100 border border-rose-500">
                {alert.isTest ? 'System Test' : 'Hazard Threshold Exceeded'}
              </span>
              <span className="text-xs text-rose-200 font-mono">
                &gt; M {alert.threshold.toFixed(1)}
              </span>
            </div>

            <h4 className="text-base font-bold text-white leading-tight">
              {alert.isTest ? (
                'Real-Time Alert System Active'
              ) : (
                <>
                  High Seismic Hazard: <span className="text-amber-300">M {alert.magnitude.toFixed(2)}</span>
                  <span className="text-xs font-normal text-rose-200 ml-1.5 font-mono">
                    (±{alert.uncertainty.toFixed(2)})
                  </span>
                </>
              )}
            </h4>

            <p className="text-xs text-rose-100 mt-1.5 leading-relaxed">
              {alert.isTest ? (
                `Browser alerts will trigger whenever predicted earthquake magnitude exceeds M ${alert.threshold.toFixed(1)}.`
              ) : (
                `Predicted magnitude M ${alert.magnitude.toFixed(2)} exceeds your alert threshold of M ${alert.threshold.toFixed(1)}.`
              )}
            </p>

            {alert.latitude !== undefined && alert.longitude !== undefined && (
              <div className="mt-2.5 pt-2 border-t border-rose-800/80 flex items-center gap-1.5 text-xs text-rose-200 font-mono">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {alert.latitude.toFixed(2)}°N, {alert.longitude.toFixed(2)}°E
                </span>
                {alert.depth !== undefined && (
                  <span className="text-rose-300 font-sans">
                    • Depth {alert.depth.toFixed(1)} km
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-3 right-3 p-1 rounded-lg text-rose-300 hover:text-white hover:bg-rose-800/60 transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
