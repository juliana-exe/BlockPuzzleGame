import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  CLASSIC_SCORES: '@bp_classic_scores',
  PUZZLE_SCORES:  '@bp_puzzle_scores',
  CLASSIC_LEVEL:  '@bp_classic_max_level',
  PUZZLE_LEVEL:   '@bp_puzzle_max_level',
};

// ─── Classic ─────────────────────────────────────────────────────────────────

export async function getClassicHighScores() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CLASSIC_SCORES);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveClassicScore(score, level, lines) {
  try {
    const scores = await getClassicHighScores();
    scores.push({ score, level, lines, date: new Date().toISOString() });
    scores.sort((a, b) => b.score - a.score);
    await AsyncStorage.setItem(KEYS.CLASSIC_SCORES, JSON.stringify(scores.slice(0, 10)));
  } catch { /* ignore */ }
}

// ─── Puzzle ──────────────────────────────────────────────────────────────────

export async function getPuzzleHighScores() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PUZZLE_SCORES);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function savePuzzleScore(score, level) {
  try {
    const scores = await getPuzzleHighScores();
    scores.push({ score, level, date: new Date().toISOString() });
    scores.sort((a, b) => b.score - a.score);
    await AsyncStorage.setItem(KEYS.PUZZLE_SCORES, JSON.stringify(scores.slice(0, 10)));
  } catch { /* ignore */ }
}

// ─── Max level unlocked ───────────────────────────────────────────────────────

export async function getMaxUnlockedLevel(mode) {
  try {
    const key = mode === 'classic' ? KEYS.CLASSIC_LEVEL : KEYS.PUZZLE_LEVEL;
    const raw = await AsyncStorage.getItem(key);
    return raw ? parseInt(raw, 10) : 1;
  } catch { return 1; }
}

export async function saveMaxUnlockedLevel(mode, level) {
  try {
    const key = mode === 'classic' ? KEYS.CLASSIC_LEVEL : KEYS.PUZZLE_LEVEL;
    const current = await getMaxUnlockedLevel(mode);
    if (level > current) {
      await AsyncStorage.setItem(key, String(level));
    }
  } catch { /* ignore */ }
}
