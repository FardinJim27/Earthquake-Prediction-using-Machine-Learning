export interface NotificationSettings {
  enabled: boolean;
  threshold: number; // User-defined threshold, default 5.0
  soundEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  threshold: 5.0,
  soundEnabled: true
};

const STORAGE_KEY = 'earthquake_alert_settings';

export function loadNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
        threshold: typeof parsed.threshold === 'number' && !isNaN(parsed.threshold) ? parsed.threshold : 5.0,
        soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true
      };
    }
  } catch (e) {
    console.error('Failed to load notification settings:', e);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

export function saveNotificationSettings(settings: NotificationSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save notification settings:', e);
  }
}

/**
 * Checks if the browser Notification API is available
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns current permission state ('granted' | 'denied' | 'default' | 'unsupported')
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests permission from the user for the browser Notification API
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Plays an alert chime using Web Audio API
 */
export function playAlertChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    // Two-tone warning chime: 587.33Hz (D5) -> 880Hz (A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.setValueAtTime(880, now + 0.12);

    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.45);
  } catch {
    // Audio may be blocked by browser autoplay policy before user gesture
  }
}

export interface AlertDetails {
  magnitude: number;
  uncertainty: number;
  threshold: number;
  latitude?: number;
  longitude?: number;
  depth?: number;
  isTest?: boolean;
}

/**
 * Dispatches a native browser notification using the Notification API
 * if permission is granted and settings allow it.
 */
export function sendBrowserNotification(details: AlertDetails): boolean {
  if (!isNotificationSupported()) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const title = details.isTest
      ? `🔔 Test Notification: Seismic Alert System Active`
      : `🚨 High Seismic Alert: Predicted M ${details.magnitude.toFixed(2)} (Exceeds M ${details.threshold.toFixed(1)})`;

    const locText = details.latitude !== undefined && details.longitude !== undefined
      ? ` at ${details.latitude.toFixed(2)}°N, ${details.longitude.toFixed(2)}°E`
      : '';

    const depthText = details.depth !== undefined ? ` (Depth: ${details.depth.toFixed(1)} km)` : '';

    const body = details.isTest
      ? `Real-time browser alert notifications are working. You will receive immediate alerts whenever a prediction exceeds M ${details.threshold.toFixed(1)}.`
      : `Predicted magnitude M ${details.magnitude.toFixed(2)} ±${details.uncertainty.toFixed(2)}${locText}${depthText} exceeds your safety threshold of M ${details.threshold.toFixed(1)}.`;

    const notification = new Notification(title, {
      body,
      tag: 'earthquake-hazard-alert',
      requireInteraction: true
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.error('Failed to trigger browser notification:', err);
    return false;
  }
}
