// Nível clássico: velocidade aumenta a cada nível
export const CLASSIC_LEVELS = Array.from({ length: 20 }, (_, i) => ({
  level: i + 1,
  name: `Nível ${i + 1}`,
  speed: Math.max(80, 800 - i * 38),
  linesTarget: (i + 1) * 10,
  badge: i < 5 ? '🟢 Iniciante' : i < 10 ? '🟡 Médio' : i < 15 ? '🟠 Difícil' : '🔴 Expert',
}));

// Nível puzzle: meta de pontuação aumenta
export const PUZZLE_LEVELS = Array.from({ length: 30 }, (_, i) => ({
  level: i + 1,
  name: `Nível ${i + 1}`,
  scoreTarget: (i + 1) * 800,
  badge: i < 10 ? '🟢 Iniciante' : i < 20 ? '🟡 Médio' : '🔴 Difícil',
  hint: i < 10
    ? 'Preencha linhas e colunas!'
    : i < 20
    ? 'Combine múltiplas limpezas!'
    : 'Domine o tabuleiro!',
}));
