import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  ShieldAlert,
  Check,
  X,
  Sliders,
  Send
} from 'lucide-react';
import {
  NotificationSettings,
  requestNotificationPermission,
  getNotificationPermission
} from '../lib/notifications';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onSaveSettings: (settings: NotificationSettings) => void;
  onTriggerTestAlert: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onTriggerTestAlert
}) => {
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    getNotificationPermission()
  );
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    try {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res === 'granted') {
        const updated = { ...localSettings, enabled: true };
        setLocalSettings(updated);
        onSaveSettings(updated);
      }
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleThresholdChange = (val: number) => {
    const clamped = Math.max(3.0, Math.min(8.5, Math.round(val * 10) / 10));
    const updated = { ...localSettings, threshold: clamped };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  const handleToggleEnabled = (enabled: boolean) => {
    const updated = { ...localSettings, enabled };
    setLocalSettings(updated);
    onSaveSettings(updated);
    if (enabled && permission !== 'granted') {
      handleRequestPermission();
    }
  };

  const handleToggleSound = (soundEnabled: boolean) => {
    const updated = { ...localSettings, soundEnabled };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  const presetThresholds = [4.5, 5.0, 5.5, 6.0, 6.5];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shadow-2xs">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900">Seismic Alert Notifications</h3>
              <p className="text-xs text-zinc-500">Real-time alerts for high-magnitude predictions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  localSettings.enabled ? 'bg-rose-100 text-rose-700' : 'bg-zinc-200 text-zinc-500'
                }`}
              >
                {localSettings.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-sm font-semibold text-zinc-900 block">Hazard Alert System</span>
                <span className="text-xs text-zinc-500">
                  {localSettings.enabled ? 'Active and monitoring predictions' : 'Alerts are currently paused'}
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.enabled}
                onChange={(e) => handleToggleEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          {/* Browser Permission Status */}
          <div className="p-3.5 rounded-xl border bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-700">Browser Notification API:</span>
              </div>

              {permission === 'granted' ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Granted
                </span>
              ) : permission === 'denied' ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  <X className="w-3 h-3 text-rose-600" />
                  Blocked in Browser
                </span>
              ) : permission === 'unsupported' ? (
                <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                  In-App Only
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Permission Required
                </span>
              )}
            </div>

            {permission !== 'granted' && (
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                <p className="text-[11px] text-zinc-500 max-w-[240px]">
                  Allow desktop alerts to receive real-time notifications even when tab is backgrounded.
                </p>
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  disabled={isRequestingPermission || permission === 'denied'}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRequestingPermission ? 'Requesting...' : 'Allow Alerts'}
                </button>
              </div>
            )}
          </div>

          {/* User-defined Magnitude Threshold */}
          <div className="space-y-3 p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <label className="text-xs font-semibold text-zinc-900">
                  Alert Trigger Threshold:
                </label>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-xs text-zinc-400">Trigger at:</span>
                <span className="text-base font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200 shadow-2xs">
                  M {localSettings.threshold.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Slider */}
            <div>
              <input
                type="range"
                min="3.0"
                max="7.5"
                step="0.1"
                value={localSettings.threshold}
                onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-1">
                <span>M 3.0 (Minor)</span>
                <span className="text-rose-600 font-bold">M 5.0 (Default)</span>
                <span>M 7.5 (Severe)</span>
              </div>
            </div>

            {/* Presets */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-[11px] text-zinc-500 font-medium">Quick Presets:</span>
              <div className="flex gap-1">
                {presetThresholds.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleThresholdChange(preset)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-all ${
                      Math.abs(localSettings.threshold - preset) < 0.05
                        ? 'bg-rose-600 text-white shadow-2xs font-bold'
                        : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {preset.toFixed(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sound Alert Toggle */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              {localSettings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-indigo-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-400" />
              )}
              <span className="text-xs font-medium text-zinc-700">Audio Chime Warning</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggleSound(!localSettings.soundEnabled)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                localSettings.soundEnabled
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-zinc-100 text-zinc-500 border-zinc-200'
              }`}
            >
              {localSettings.soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onTriggerTestAlert}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-100 border border-zinc-200 transition-all shadow-2xs active:scale-95"
            title="Dispatch a test alert to verify browser notifications and audio chime"
          >
            <Send className="w-3.5 h-3.5 text-indigo-600" />
            <span>Test Alert</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
