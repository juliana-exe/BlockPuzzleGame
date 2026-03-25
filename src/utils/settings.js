import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@bp_settings';

const defaults = {
  soundEnabled: true,
  hapticEnabled: true,
};

let _cache = null;

export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    _cache = raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    _cache = { ...defaults };
  }
  return _cache;
}

export function getSettings() {
  return _cache || { ...defaults };
}

export async function saveSettings(patch) {
  try {
    _cache = { ...(getSettings()), ...patch };
    await AsyncStorage.setItem(KEY, JSON.stringify(_cache));
  } catch { /* ignore */ }
}
