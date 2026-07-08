export interface HapticSettings {
  vibrateEnabled: boolean;
  visualEnabled: boolean;
  reduceMotion: boolean;
}

const DEFAULT_SETTINGS: HapticSettings = {
  vibrateEnabled: true,
  visualEnabled: true,
  reduceMotion: false,
};

// Rate-limiting helper (500ms spacing between physical vibrations)
let lastVibrationTime = 0;
const VIBRATION_THROTTLE_MS = 250; // Use 250ms spacing to prevent overlapping lightweight selection / tap patterns

function triggerVibration(pattern: number | number[]) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  
  // Load settings from localStorage
  let settings = DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem('grabpic_haptic_settings');
    if (stored) settings = JSON.parse(stored);
  } catch (e) {
    // Fail silently
  }

  if (!settings.vibrateEnabled) return;

  const now = Date.now();
  if (now - lastVibrationTime < VIBRATION_THROTTLE_MS) return;

  lastVibrationTime = now;
  navigator.vibrate(pattern);
}

export const haptic = {
  selection: () => triggerVibration(8),
  light: () => triggerVibration(10),
  medium: () => triggerVibration(20),
  heavy: () => triggerVibration(35),
  success: () => triggerVibration([20, 50, 20]),
  warning: () => triggerVibration([30, 40, 30]),
  error: () => triggerVibration([60, 50, 20, 50, 60]),
  drag: () => triggerVibration(6),
  drop: () => triggerVibration(15),
  snap: () => triggerVibration(5),
  attention: () => triggerVibration([10, 80, 10]),
  
  getSettings: (): HapticSettings => {
    try {
      const stored = localStorage.getItem('grabpic_haptic_settings');
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  
  updateSettings: (newSettings: Partial<HapticSettings>) => {
    try {
      const current = haptic.getSettings();
      const updated = { ...current, ...newSettings };
      localStorage.setItem('grabpic_haptic_settings', JSON.stringify(updated));
      // Dispatch custom event to notify components of changes
      window.dispatchEvent(new Event('haptic-settings-changed'));
    } catch (e) {}
  }
};
export default haptic;
