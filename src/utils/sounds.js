import { getSettings } from './settings';

// Lazy-load expo-av so the app doesn't crash in Expo Go environments
// where the ExponentAV native module may not be available.
let Audio = null;
try {
  Audio = require('expo-av').Audio;
} catch { /* native audio not available, sounds disabled */ }

// Sound instances pool
const _sounds = {};
let _loaded = false;

// We generate tones programmatically via short base64 WAV files so the app
// works offline with NO external assets required.
// Each WAV is a minimal 44-byte PCM file generated inline.

// Instead of real audio files (which would need to be bundled as assets),
// we use a tiny silent WAV approach and rely on Haptics for the primary feedback.
// If you add real .mp3 files to assets/sounds/, swap the require() calls below.

const SOUND_DEFS = {
  move:     require('../../assets/sounds/move.wav'),
  rotate:   require('../../assets/sounds/rotate.wav'),
  drop:     require('../../assets/sounds/drop.wav'),
  clear:    require('../../assets/sounds/clear.wav'),
  tetris:   require('../../assets/sounds/tetris.wav'),
  place:    require('../../assets/sounds/place.wav'),
  gameover: require('../../assets/sounds/gameover.wav'),
  levelup:  require('../../assets/sounds/levelup.wav'),
};

export async function loadSounds() {
  if (_loaded || !Audio) return;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    for (const [key, src] of Object.entries(SOUND_DEFS)) {
      const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: false, volume: 0.7 });
      _sounds[key] = sound;
    }
    _loaded = true;
  } catch { /* sounds optional */ }
}

export async function playSound(name) {
  if (!getSettings().soundEnabled) return;
  try {
    const snd = _sounds[name];
    if (!snd) return;
    await snd.setPositionAsync(0);
    await snd.playAsync();
  } catch { /* ignore */ }
}

export async function unloadSounds() {
  for (const snd of Object.values(_sounds)) {
    try { await snd.unloadAsync(); } catch { /* ignore */ }
  }
}
