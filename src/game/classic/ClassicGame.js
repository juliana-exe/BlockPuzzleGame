import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  PanResponder, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import {
  BOARD_WIDTH, BOARD_HEIGHT, CLASSIC_CELL,
  LINE_SCORES, LEVEL_SPEEDS, LINES_PER_LEVEL,
} from '../../constants/game';
import { getRandomPiece, getPieceShape, getPieceColor } from './tetrominoes';
import {
  createEmptyBoard, isValidPosition, placePiece,
  clearFullLines, getGhostRow, getSpawnCol, tryRotate,
} from './classicLogic';
import { playSound } from '../../utils/sounds';
import {
  hapticLight, hapticMedium, hapticHeavy,
  hapticSuccess, hapticError,
} from '../../utils/haptics';

const CELL        = CLASSIC_CELL;
const SWIPE_MIN   = 18;   // px — mínimo para considerar swipe
const SWIPE_FAST  = 0.4;  // velocidade px/ms para hard drop

export default function ClassicGame({ startLevel = 1, onGameOver }) {
  const [board, setBoard]         = useState(createEmptyBoard);
  const [piece, setPiece]         = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const [pos, setPos]             = useState({ row: 0, col: 0 });
  const [score, setScore]         = useState(0);
  const [lines, setLines]         = useState(0);
  const [level, setLevel]         = useState(startLevel);
  const [isPaused, setIsPaused]   = useState(false);
  const [gameOver, setGameOver]   = useState(false);
  const [clearAnim, setClearAnim] = useState([]); // rows being cleared
  const [scorePopup, setScorePopup] = useState(null); // {pts, key}

  // Refs para evitar closure stale em timers
  const boardRef    = useRef(createEmptyBoard());
  const pieceRef    = useRef(null);
  const posRef      = useRef({ row: 0, col: 0 });
  const scoreRef    = useRef(0);
  const linesRef    = useRef(0);
  const levelRef    = useRef(startLevel);
  const pausedRef   = useRef(false);
  const gameOverRef = useRef(false);
  const nextRef     = useRef(null);
  const timerRef    = useRef(null);
  const popupAnim   = useRef(new Animated.Value(0)).current;

  const getSpeed = (lvl) =>
    LEVEL_SPEEDS[Math.min(lvl - 1, LEVEL_SPEEDS.length - 1)];

  // ── Score popup ───────────────────────────────────────────────────────────
  const showPopup = useCallback((pts, label) => {
    setScorePopup({ pts, label, key: Date.now() });
    popupAnim.setValue(1);
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(popupAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [popupAnim]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const startTick = useCallback((speed) => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (pausedRef.current || gameOverRef.current) return;
      const p  = pieceRef.current;
      const ps = posRef.current;
      if (!p) return;
      if (isValidPosition(boardRef.current, p.name, p.rotationIndex, ps.row + 1, ps.col)) {
        posRef.current = { ...ps, row: ps.row + 1 };
        setPos({ ...ps, row: ps.row + 1 });
      } else {
        lockCurrentPiece();
      }
    }, speed);
  }, []); // eslint-disable-line

  // ── Lock & clear ──────────────────────────────────────────────────────────
  const lockCurrentPiece = useCallback(() => {
    const p  = pieceRef.current;
    const ps = posRef.current;
    if (!p) return;

    playSound('drop');
    hapticMedium();

    const color  = getPieceColor(p.name);
    const placed = placePiece(boardRef.current, p.name, p.rotationIndex, ps.row, ps.col, color);

    // Detect which rows will be cleared for animation
    const clearingRows = [];
    placed.forEach((row, ri) => { if (row.every(c => c !== null)) clearingRows.push(ri); });

    const { board: cleared, lines: count } = clearFullLines(placed);

    boardRef.current = cleared;

    const newLines = linesRef.current + count;
    const newLevel = Math.max(levelRef.current, Math.floor(newLines / LINES_PER_LEVEL) + startLevel);
    const pts      = (LINE_SCORES[count] || 0) * newLevel;
    const newScore = scoreRef.current + pts;

    linesRef.current = newLines;
    levelRef.current = newLevel;
    scoreRef.current = newScore;

    setBoard([...cleared]);
    setLines(newLines);
    setLevel(newLevel);
    setScore(newScore);

    if (count > 0) {
      setClearAnim(clearingRows);
      setTimeout(() => setClearAnim([]), 300);

      if (count === 4) {
        playSound('tetris'); hapticSuccess();
        showPopup(pts, 'TETRIS! 🔥');
      } else {
        playSound('clear'); hapticHeavy();
        const labels = ['', 'LINHA! +', 'DUPLA! +', 'TRIPLA! +'];
        showPopup(pts, `${labels[count]}${pts}`);
      }
    }

    if (newLevel > levelRef.current - 1) {
      playSound('levelup');
    }

    spawnNext();
    clearInterval(timerRef.current);
    if (!gameOverRef.current) startTick(getSpeed(newLevel));
  }, [startLevel, startTick, showPopup]); // eslint-disable-line

  const spawnNext = useCallback(() => {
    const next     = nextRef.current || getRandomPiece();
    const upcoming = getRandomPiece();
    nextRef.current = upcoming;
    setNextPiece(upcoming);

    const startCol = getSpawnCol(next.name);
    const startRow = 0;

    if (!isValidPosition(boardRef.current, next.name, 0, startRow, startCol)) {
      gameOverRef.current = true;
      setGameOver(true);
      clearInterval(timerRef.current);
      playSound('gameover'); hapticError();
      onGameOver && onGameOver(scoreRef.current, levelRef.current, linesRef.current);
      return;
    }

    pieceRef.current = next;
    posRef.current   = { row: startRow, col: startCol };
    setPiece(next);
    setPos({ row: startRow, col: startCol });
  }, [onGameOver]);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const first  = getRandomPiece();
    const second = getRandomPiece();
    nextRef.current = second;
    setNextPiece(second);
    const col = getSpawnCol(first.name);
    pieceRef.current = first;
    posRef.current   = { row: 0, col };
    setPiece(first);
    setPos({ row: 0, col });
    startTick(getSpeed(startLevel));
    return () => { clearInterval(timerRef.current); };
  }, []); // eslint-disable-line

  // ── Actions ───────────────────────────────────────────────────────────────
  const moveLeft = useCallback(() => {
    if (pausedRef.current || gameOverRef.current) return;
    const p = pieceRef.current; const ps = posRef.current;
    if (!p) return;
    if (isValidPosition(boardRef.current, p.name, p.rotationIndex, ps.row, ps.col - 1)) {
      posRef.current = { ...ps, col: ps.col - 1 };
      setPos(pr => ({ ...pr, col: pr.col - 1 }));
      playSound('move'); hapticLight();
    }
  }, []);

  const moveRight = useCallback(() => {
    if (pausedRef.current || gameOverRef.current) return;
    const p = pieceRef.current; const ps = posRef.current;
    if (!p) return;
    if (isValidPosition(boardRef.current, p.name, p.rotationIndex, ps.row, ps.col + 1)) {
      posRef.current = { ...ps, col: ps.col + 1 };
      setPos(pr => ({ ...pr, col: pr.col + 1 }));
      playSound('move'); hapticLight();
    }
  }, []);

  const rotate = useCallback(() => {
    if (pausedRef.current || gameOverRef.current) return;
    const p = pieceRef.current; const ps = posRef.current;
    if (!p) return;
    const result = tryRotate(boardRef.current, p.name, p.rotationIndex, ps.row, ps.col);
    if (result) {
      const np = { ...p, rotationIndex: result.rotIdx };
      pieceRef.current = np;
      posRef.current   = { ...ps, col: result.col };
      setPiece(np);
      setPos(pr => ({ ...pr, col: result.col }));
      playSound('rotate'); hapticLight();
    }
  }, []);

  const softDrop = useCallback(() => {
    if (pausedRef.current || gameOverRef.current) return;
    const p = pieceRef.current; const ps = posRef.current;
    if (!p) return;
    if (isValidPosition(boardRef.current, p.name, p.rotationIndex, ps.row + 1, ps.col)) {
      posRef.current = { ...ps, row: ps.row + 1 };
      setPos(pr => ({ ...pr, row: pr.row + 1 }));
      scoreRef.current += 1;
      setScore(s => s + 1);
    } else {
      lockCurrentPiece();
    }
  }, [lockCurrentPiece]);

  const hardDrop = useCallback(() => {
    if (pausedRef.current || gameOverRef.current) return;
    const p = pieceRef.current; const ps = posRef.current;
    if (!p) return;
    const ghost = getGhostRow(boardRef.current, p.name, p.rotationIndex, ps.row, ps.col);
    const dist  = ghost - ps.row;
    posRef.current = { ...ps, row: ghost };
    setPos(pr => ({ ...pr, row: ghost }));
    scoreRef.current += dist * 2;
    setScore(s => s + dist * 2);
    hapticHeavy();
    lockCurrentPiece();
  }, [lockCurrentPiece]);

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setIsPaused(p => !p);
    hapticLight();
  }, []);

  // ── Swipe PanResponder ────────────────────────────────────────────────────
  // Gesto padrão de jogos de Tetris mobile:
  // • Swipe horizontal => mover
  // • Swipe rápido para baixo => hard drop
  // • Swipe lento para baixo => soft drop contínuo
  // • Tap => rotacionar
  const swipeRef = useRef({ startX: 0, startY: 0, startTime: 0, moved: false, dropInterval: null });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4,

      onPanResponderGrant: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        swipeRef.current = {
          startX: pageX, startY: pageY,
          startTime: Date.now(),
          moved: false,
          lastCol: posRef.current?.col ?? 0,
          dropInterval: null,
        };
      },

      onPanResponderMove: (_, gs) => {
        const s = swipeRef.current;
        const absX = Math.abs(gs.dx);
        const absY = Math.abs(gs.dy);

        // Horizontal swipe — move coluna por coluna
        if (absX > SWIPE_MIN && absX > absY * 1.5) {
          s.moved = true;
          const targetCol = s.lastCol + Math.round(gs.dx / CELL);
          const p  = pieceRef.current;
          const ps = posRef.current;
          if (!p || !ps) return;
          if (targetCol !== ps.col) {
            const dir = targetCol > ps.col ? 1 : -1;
            if (isValidPosition(boardRef.current, p.name, p.rotationIndex, ps.row, ps.col + dir)) {
              posRef.current = { ...ps, col: ps.col + dir };
              setPos(pr => ({ ...pr, col: ps.col + dir }));
              playSound('move'); hapticLight();
            }
          }
        }

        // Soft drop — arrastar para baixo devagar
        if (absY > SWIPE_MIN && absY > absX * 1.5 && gs.vy > 0) {
          s.moved = true;
          if (!s.dropInterval) {
            s.dropInterval = setInterval(() => {
              softDropRef.current && softDropRef.current();
            }, 80);
          }
        } else {
          if (s.dropInterval) {
            clearInterval(s.dropInterval);
            s.dropInterval = null;
          }
        }
      },

      onPanResponderRelease: (evt, gs) => {
        const s = swipeRef.current;
        if (s.dropInterval) { clearInterval(s.dropInterval); s.dropInterval = null; }

        const elapsed = Date.now() - s.startTime;
        const absX    = Math.abs(gs.dx);
        const absY    = Math.abs(gs.dy);
        const vy      = gs.vy;

        // Hard drop: swipe rápido para baixo
        if (absY > 40 && vy > SWIPE_FAST && absY > absX) {
          hardDropRef.current && hardDropRef.current();
          return;
        }

        // Tap (pouco movimento, curta duração) => rotacionar
        if (!s.moved && absX < 10 && absY < 10 && elapsed < 350) {
          rotateRef.current && rotateRef.current();
        }
      },

      onPanResponderTerminate: (_, gs) => {
        const s = swipeRef.current;
        if (s.dropInterval) { clearInterval(s.dropInterval); s.dropInterval = null; }
      },
    })
  ).current;

  // Refs para as actions dentro do PanResponder (evita closure stale)
  const softDropRef = useRef(softDrop);
  const hardDropRef = useRef(hardDrop);
  const rotateRef   = useRef(rotate);
  useEffect(() => { softDropRef.current = softDrop; }, [softDrop]);
  useEffect(() => { hardDropRef.current = hardDrop; }, [hardDrop]);
  useEffect(() => { rotateRef.current   = rotate;   }, [rotate]);

  // ── Display board ─────────────────────────────────────────────────────────
  const buildDisplayBoard = () => {
    const display = board.map(row => [...row]);
    if (!piece || gameOver) return display;

    const shape = getPieceShape(piece.name, piece.rotationIndex);
    const color = getPieceColor(piece.name);
    const ghost = getGhostRow(boardRef.current, piece.name, piece.rotationIndex, pos.row, pos.col);

    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c]) {
          const gr = ghost + r, gc = pos.col + c;
          if (gr >= 0 && gr < BOARD_HEIGHT && gc >= 0 && gc < BOARD_WIDTH && !display[gr][gc])
            display[gr][gc] = '__ghost__';
        }

    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c]) {
          const pr = pos.row + r, pc = pos.col + c;
          if (pr >= 0 && pr < BOARD_HEIGHT && pc >= 0 && pc < BOARD_WIDTH)
            display[pr][pc] = color;
        }

    return display;
  };

  const display = buildDisplayBoard();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <StatChip label="PONTOS" value={score} accent />
        <StatChip label="NÍVEL"  value={level} />
        <StatChip label="LINHAS" value={lines} />
        <TouchableOpacity style={styles.pauseIconBtn} onPress={togglePause}>
          <Text style={styles.pauseIconTxt}>{isPaused ? '▶' : '⏸'}</Text>
        </TouchableOpacity>
      </View>

      {/* Game area: board + side panel */}
      <View style={styles.gameRow}>

        {/* ── Board (swipe zone) ── */}
        <View
          {...panResponder.panHandlers}
          style={[styles.board, { width: CELL * BOARD_WIDTH, height: CELL * BOARD_HEIGHT }]}
        >
          {display.map((row, ri) => (
            <View key={ri} style={styles.boardRow}>
              {row.map((cell, ci) => {
                const isClearing = clearAnim.includes(ri);
                const isGhost    = cell === '__ghost__';
                const cellColor  = (!isGhost && cell) ? COLORS[cell] : null;
                return (
                  <View
                    key={ci}
                    style={[
                      styles.cell,
                      { width: CELL, height: CELL },
                      isGhost    && styles.ghostCell,
                      isClearing && styles.clearingCell,
                      cellColor  && { borderRadius: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
                      cellColor  && { backgroundColor: cellColor },
                    ]}
                  >
                    {/* Inner shine on filled cells */}
                    {cellColor && !isGhost && (
                      <View style={styles.cellShine} />
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          {/* Score popup */}
          {scorePopup && (
            <Animated.View
              key={scorePopup.key}
              pointerEvents="none"
              style={[styles.popup, { opacity: popupAnim,
                transform: [{ translateY: Animated.multiply(popupAnim, -1) }] }]}
            >
              <Text style={styles.popupTxt}>{scorePopup.label}</Text>
            </Animated.View>
          )}
        </View>

        {/* ── Side panel ── */}
        <View style={styles.side}>
          <Text style={styles.sideLabel}>PRÓXIMA</Text>
          <LinearGradient
            colors={['#1e2d5a', '#0f1e3e']}
            style={styles.nextBox}
          >
            {nextPiece && <MiniPiece piece={nextPiece} />}
          </LinearGradient>

          <Text style={[styles.sideLabel, { marginTop: 16 }]}>GESTOS</Text>
          <View style={styles.hintsBox}>
            <Text style={styles.hint}>← → mover</Text>
            <Text style={styles.hint}>↓ descer</Text>
            <Text style={styles.hint}>⬇ dropar</Text>
            <Text style={styles.hint}>tap girar</Text>
          </View>
        </View>
      </View>

      {/* Bottom helper buttons (acessibilidade + fallback) */}
      <View style={styles.btnBar}>
        <GameBtn label="◀" onPress={moveLeft} flex />
        <GameBtn label="↺  GIRAR" onPress={rotate} flex2 />
        <GameBtn label="▶" onPress={moveRight} flex />
        <GameBtn label="⬇  DROP" onPress={hardDrop} flexDrop accent />
      </View>

      {/* Pause overlay */}
      {isPaused && !gameOver && (
        <View style={styles.overlay}>
          <LinearGradient colors={['rgba(0,0,0,0.92)','rgba(15,52,96,0.95)']} style={StyleSheet.absoluteFill} />
          <Text style={styles.overlayTitle}>⏸  PAUSADO</Text>
          <TouchableOpacity style={styles.overlayBtn} onPress={togglePause}>
            <Text style={styles.overlayBtnTxt}>▶  CONTINUAR</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatChip({ label, value, accent }) {
  return (
    <LinearGradient
      colors={accent ? ['#2a0a18','#3d1020'] : ['#1a1a2e','#16213e']}
      style={styles.statChip}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && { color: COLORS.accent }]}>{value}</Text>
    </LinearGradient>
  );
}

function MiniPiece({ piece }) {
  const shape = getPieceShape(piece.name, 0);
  const color = COLORS[getPieceColor(piece.name)];
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {shape.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((cell, c) => (
            <View key={c} style={{
              width: 16, height: 16, margin: 1,
              backgroundColor: cell ? color : 'transparent',
              borderRadius: cell ? 3 : 0,
              borderWidth: cell ? 1 : 0,
              borderColor: 'rgba(255,255,255,0.3)',
            }} />
          ))}
        </View>
      ))}
    </View>
  );
}

function GameBtn({ label, onPress, flex, flex2, flexDrop, accent }) {
  return (
    <TouchableOpacity
      style={[
        styles.gameBtn,
        flex      && { flex: 1 },
        flex2     && { flex: 2.2 },
        flexDrop  && { flex: 1.8 },
        accent    && { backgroundColor: COLORS.accent, borderColor: '#ff2244' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.gameBtnTxt}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', paddingHorizontal: 10, paddingVertical: 6, gap: 6,
  },
  statChip: {
    flex: 1, alignItems: 'center', paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: '#2a3a6a',
  },
  statLabel: { color: COLORS.textSecondary, fontSize: 9, fontWeight: 'bold', letterSpacing: 1.2 },
  statValue: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  pauseIconBtn: {
    backgroundColor: '#1e2d5a', borderRadius: 10, width: 40, height: 46,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a3a6a',
  },
  pauseIconTxt: { color: COLORS.text, fontSize: 18 },

  // Board area
  gameRow: { flexDirection: 'row', alignItems: 'flex-start' },

  board: {
    backgroundColor: COLORS.boardBg,
    borderWidth: 2, borderColor: '#1e2d5a',
    overflow: 'hidden',
  },
  boardRow: { flexDirection: 'row' },
  cell: {
    backgroundColor: COLORS.empty,
    borderWidth: 0.5, borderColor: COLORS.gridLine,
    overflow: 'hidden',
  },
  cellShine: {
    position: 'absolute', top: 1, left: 1,
    width: '45%', height: '38%',
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: 2,
  },
  ghostCell: {
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    borderStyle: 'dashed',
  },
  clearingCell: { backgroundColor: '#ffffff', opacity: 0.9 },

  popup: {
    position: 'absolute', alignSelf: 'center',
    top: '45%', backgroundColor: 'rgba(233,69,96,0.92)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10,
  },
  popupTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Side panel
  side: { marginLeft: 8, width: 76, paddingTop: 4 },
  sideLabel: { color: COLORS.textSecondary, fontSize: 8, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 5 },
  nextBox: {
    borderRadius: 10, padding: 8,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 68, borderWidth: 1, borderColor: '#1e2d5a',
  },
  hintsBox: { gap: 2, marginTop: 2 },
  hint: { color: '#3a5a8a', fontSize: 9 },

  // Bottom buttons
  btnBar: {
    flexDirection: 'row', width: '100%',
    paddingHorizontal: 8, paddingTop: 8, paddingBottom: 6, gap: 6,
  },
  gameBtn: {
    backgroundColor: '#0f3460',
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#1e4a8a',
  },
  gameBtnTxt: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },

  // Overlays
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', gap: 24,
  },
  overlayTitle: { color: COLORS.text, fontSize: 34, fontWeight: 'bold', letterSpacing: 4 },
  overlayBtn: {
    backgroundColor: COLORS.accent, paddingHorizontal: 40,
    paddingVertical: 14, borderRadius: 14,
  },
  overlayBtnTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
