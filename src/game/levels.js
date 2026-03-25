// Nível clássico: velocidade aumenta a cada nível
export const CLASSIC_LEVELS = Array.from({ length: 60 }, (_, i) => ({
  level: i + 1,
  name: `Nível ${i + 1}`,
  speed: Math.max(55, 820 - i * 22),
  linesTarget: (i + 1) * 10,
  badge: i < 10 ? '🟢 Iniciante' : i < 25 ? '🟡 Médio' : i < 45 ? '🟠 Difícil' : '🔴 Expert',
}));

function puzzleMeta(levelIndex) {
  if (levelIndex < 20) {
    return {
      badge: '🟢 Iniciante',
      hint: 'Conserve espaços centrais para peças maiores.',
      movesBase: 28,
      movesDecay: 0.3,
      scoreBase: 900,
      scoreStep: 260,
    };
  }
  if (levelIndex < 50) {
    return {
      badge: '🟡 Estratégico',
      hint: 'Busque limpar 2 linhas no mesmo lance para ganhar ritmo.',
      movesBase: 25,
      movesDecay: 0.16,
      scoreBase: 6500,
      scoreStep: 330,
    };
  }
  if (levelIndex < 90) {
    return {
      badge: '🟠 Mestre',
      hint: 'Evite cantos mortos e jogue pensando 2-3 peças à frente.',
      movesBase: 22,
      movesDecay: 0.08,
      scoreBase: 16000,
      scoreStep: 390,
    };
  }
  return {
    badge: '🔴 Lendário',
    hint: 'Cada peça importa: maximize combo e eficiência por movimento.',
    movesBase: 20,
    movesDecay: 0.05,
    scoreBase: 32000,
    scoreStep: 460,
  };
}

// Nível puzzle: campanha longa com meta de pontuação e limite de movimentos
export const PUZZLE_LEVELS = Array.from({ length: 120 }, (_, i) => {
  const meta = puzzleMeta(i);
  return {
    level: i + 1,
    name: `Nível ${i + 1}`,
    scoreTarget: meta.scoreBase + i * meta.scoreStep,
    maxMoves: Math.max(14, Math.round(meta.movesBase - i * meta.movesDecay)),
    badge: meta.badge,
    hint: meta.hint,
  };
});
