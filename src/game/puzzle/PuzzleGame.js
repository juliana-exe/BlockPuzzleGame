import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, PanResponder,
  Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { PUZZLE_CELL, PUZZLE_SIZE } from '../../constants/game';
import { getRandomPieces } from './puzzlePieces';
import {
  createEmptyBoard, isValidPlacement, placePiece,
  clearFilledLines, calcScore, canAnyPieceBePlaced,
} from './puzzleLogic';
import { playSound } from '../../utils/sounds';
import { hapticLight, hapticMedium, hapticHeavy, hapticSuccess, hapticError } from '../../utils/haptics';

const CELL       = PUZZLE_CELL;
const TRAY_CELL  = Math.floor(CELL * 0.76);
const DRAG_SCALE = 1.15; // peça fica maior durante drag (feedback visual)

export default function PuzzleGame({ startLevel = 1, onGameOver }) {
  const [board, setBoard]       = useState(createEmptyBoard);
  const [pieces, setPieces]     = useState(() => getRandomPieces(startLevel));
  const [score, setScore]       = useState(0);
  const [combo, setCombo]       = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragIdx, setDragIdx]   = useState(-1);
  const [hoverCell, setHoverCell] = useState(null);
  const [scorePopup, setScorePopup] = useState(null);
  const [flashCells, setFlashCells] = useState(new Set()); // células piscando ao limpar

  const boardRef     = useRef(createEmptyBoard());
  const piecesRef    = useRef(pieces);
  const scoreRef     = useRef(0);
  const comboRef     = useRef(0);
  const levelRef     = useRef(startLevel);
  const boardOrigin  = useRef({ x: 0, y: 0 });
  const dragAnim     = useRef(new Animated.ValueXY()).current;
  const dragScale    = useRef(new Animated.Value(1)).current;
  const popupAnim    = useRef(new Animated.Value(0)).current;
  const boardViewRef = useRef(null);
  const activePiece  = useRef(null);

  useEffect(() => { piecesRef.current = pieces; }, [pieces]);

  // ── Score popup ───────────────────────────────────────────────────────────
  const showPopup = useCallback((label) => {
    setScorePopup({ label, key: Date.now() });
    popupAnim.setValue(1);
    Animated.sequence([
      Animated.delay(700),
      Animated.timing(popupAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [popupAnim]);

  // ── Flash cleared lines ───────────────────────────────────────────────────
  const flashLines = useCallback((rows, cols) => {
    const cells = new Set();
    rows.forEach(r => { for (let c = 0; c < PUZZLE_SIZE; c++) cells.add(`${r},${c}`); });
    cols.forEach(c => { for (let r = 0; r < PUZZLE_SIZE; r++) cells.add(`${r},${c}`); });
    setFlashCells(cells);
    setTimeout(() => setFlashCells(new Set()), 350);
  }, []);

  // ── Place piece ───────────────────────────────────────────────────────────
  const tryPlace = useCallback((pieceIdx, row, col) => {
    const p = piecesRef.current[pieceIdx];
    if (!p) return false;
    if (!isValidPlacement(boardRef.current, p, row, col)) return false;

    playSound('place'); hapticMedium();

    const placed = placePiece(boardRef.current, p, row, col);
    const { board: cleared, clearedRows, clearedCols } = clearFilledLines(placed);

    const pts        = calcScore(p, clearedRows, clearedCols);
    const newCombo   = (clearedRows + clearedCols) > 0 ? comboRef.current + 1 : 0;
    const comboBonus = newCombo > 1 ? newCombo * 30 : 0;
    const newScore   = scoreRef.current + pts + comboBonus;

    boardRef.current = cleared;
    scoreRef.current = newScore;
    comboRef.current = newCombo;

    if (clearedRows + clearedCols > 0) {
      flashLines(
        Array.from({ length: clearedRows }, (_, i) => i), // rows cleared (raw)
        Array.from({ length: clearedCols }, (_, i) => i), // cols cleared (raw)
      );
      playSound('clear');
      hapticHeavy();
      const totalCleared = clearedRows + clearedCols;
      if (newCombo > 1) {
        showPopup(`COMBO x${newCombo}! 🔥`);
      } else if (totalCleared >= 2) {
        showPopup(`DUPLO! +${pts}`);
      } else {
        showPopup(`+${pts}`);
      }
    }

    const newPieces   = [...piecesRef.current];
    newPieces[pieceIdx] = null;
    const allPlaced   = newPieces.every(x => x === null);
    const finalPieces = allPlaced ? getRandomPieces(levelRef.current) : newPieces;

    piecesRef.current = finalPieces;
    setBoard([...cleared]);
    setScore(newScore);
    setCombo(newCombo);
    setPieces([...finalPieces]);

    if (!canAnyPieceBePlaced(cleared, finalPieces.filter(Boolean))) {
      setTimeout(() => {
        playSound('gameover'); hapticError();
        onGameOver && onGameOver(newScore, levelRef.current);
      }, 300);
    }
    return true;
  }, [onGameOver, showPopup, flashLines]);

  // ── Preview cells ─────────────────────────────────────────────────────────
  const buildPreviewSet = () => {
    if (!dragging || dragIdx < 0 || !hoverCell) return new Set();
    const p = pieces[dragIdx];
    if (!p) return new Set();
    const valid = isValidPlacement(board, p, hoverCell.row, hoverCell.col);
    return new Set(p.cells.map(([r, c]) => `${hoverCell.row + r},${hoverCell.col + c}:${valid ? 'ok' : 'bad'}`));
  };
  const previewSet  = buildPreviewSet();
  const isValidHover = hoverCell && pieces[dragIdx] &&
    isValidPlacement(board, pieces[dragIdx], hoverCell.row, hoverCell.col);

  // ── Touch → cell ──────────────────────────────────────────────────────────
  const touchToCell = (absX, absY, idx) => {
    const p = piecesRef.current[idx];
    if (!p) return null;
    const maxR = Math.max(...p.cells.map(([r]) => r)) + 1;
    const maxC = Math.max(...p.cells.map(([, c]) => c)) + 1;
    const col = Math.floor((absX - boardOrigin.current.x - (maxC * CELL) / 2 + CELL / 2) / CELL);
    const row = Math.floor((absY - boardOrigin.current.y - (maxR * CELL) / 2 + CELL / 2) / CELL);
    return { row, col };
  };

  // ── Pan responders ────────────────────────────────────────────────────────
  const makePan = (idx) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => !!piecesRef.current[idx],
      onPanResponderGrant: (evt) => {
        activePiece.current = piecesRef.current[idx];
        dragAnim.setValue({ x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY });
        Animated.spring(dragScale, { toValue: DRAG_SCALE, useNativeDriver: true, speed: 30 }).start();
        setDragIdx(idx);
        setDragging(true);
        hapticLight();
      },
      onPanResponderMove: (_, gs) => {
        dragAnim.setValue({ x: gs.moveX, y: gs.moveY });
        setHoverCell(touchToCell(gs.moveX, gs.moveY, idx));
      },
      onPanResponderRelease: (_, gs) => {
        Animated.spring(dragScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
        const cell = touchToCell(gs.moveX, gs.moveY, idx);
        if (cell) tryPlace(idx, cell.row, cell.col);
        setDragging(false); setDragIdx(-1); setHoverCell(null);
        activePiece.current = null;
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
        setDragging(false); setDragIdx(-1); setHoverCell(null);
        activePiece.current = null;
      },
    });

  const panRefs = useRef([makePan(0), makePan(1), makePan(2)]);

  // Drag overlay dimensions
  const activeP    = pieces[dragIdx] || activePiece.current;
  const dragRows   = activeP ? Math.max(...activeP.cells.map(([r]) => r)) + 1 : 1;
  const dragCols   = activeP ? Math.max(...activeP.cells.map(([, c]) => c)) + 1 : 1;

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient colors={['#2a0a18','#3d1020']} style={styles.statChip}>
          <Text style={styles.statLabel}>PONTOS</Text>
          <Text style={[styles.statValue, { color: COLORS.accent }]}>{score}</Text>
        </LinearGradient>

        {combo > 1 ? (
          <LinearGradient colors={['#3d2000','#5a3000']} style={styles.statChip}>
            <Text style={styles.statLabel}>COMBO</Text>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>x{combo}</Text>
          </LinearGradient>
        ) : (
          <LinearGradient colors={['#1a1a2e','#16213e']} style={styles.statChip}>
            <Text style={styles.statLabel}>NÍVEL</Text>
            <Text style={styles.statValue}>{startLevel}</Text>
          </LinearGradient>
        )}
      </View>

      {/* Board */}
      <View
        ref={boardViewRef}
        onLayout={() => {
          boardViewRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
            boardOrigin.current = { x: pageX, y: pageY };
          });
        }}
        style={[styles.board, { width: CELL * PUZZLE_SIZE, height: CELL * PUZZLE_SIZE }]}
      >
        {board.map((row, ri) => (
          <View key={ri} style={styles.boardRow}>
            {row.map((cell, ci) => {
              const key   = `${ri},${ci}`;
              const pvKey = `${key}:ok`;
              const pvBad = `${key}:bad`;
              const isPvOk  = previewSet.has(pvKey);
              const isPvBad = previewSet.has(pvBad);
              const isFlash = flashCells.has(key);
              const color   = cell ? COLORS[cell] : null;
              return (
                <View
                  key={ci}
                  style={[
                    styles.cell, { width: CELL, height: CELL },
                    isPvOk  && styles.previewOk,
                    isPvBad && styles.previewBad,
                    isFlash && styles.flashCell,
                    color   && !isPvOk && !isFlash && { backgroundColor: color, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
                  ]}
                >
                  {color && !isPvOk && !isFlash && <View style={styles.cellShine} />}
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
            style={[styles.popup, { opacity: popupAnim }]}
          >
            <Text style={styles.popupTxt}>{scorePopup.label}</Text>
          </Animated.View>
        )}
      </View>

      {/* Piece tray */}
      <View style={styles.tray}>
        {pieces.map((p, idx) => (
          <View key={idx} style={styles.traySlot}>
            {p && (
              <View
                {...panRefs.current[idx].panHandlers}
                style={[styles.trayPiece, dragIdx === idx && { opacity: 0.2 }]}
              >
                <MiniPiece piece={p} cellSize={TRAY_CELL} />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Drag overlay */}
      {dragging && activeP && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.dragOverlay,
            { width: dragCols * CELL, height: dragRows * CELL },
            {
              transform: [
                { translateX: Animated.subtract(dragAnim.x, (dragCols * CELL) / 2) },
                { translateY: Animated.subtract(dragAnim.y, (dragRows * CELL) / 2 + 30) },
                { scale: dragScale },
              ],
            },
          ]}
        >
          <MiniPiece
            piece={activeP}
            cellSize={CELL}
            validHover={isValidHover}
          />
        </Animated.View>
      )}

      {/* Hint */}
      <Text style={styles.hintText}>
        Arraste as peças para encaixar · Preencha linhas e colunas!
      </Text>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MiniPiece({ piece, cellSize = 30, validHover }) {
  if (!piece) return null;
  const maxR   = Math.max(...piece.cells.map(([r]) => r));
  const maxC   = Math.max(...piece.cells.map(([, c]) => c));
  const grid   = Array.from({ length: maxR + 1 }, () => Array(maxC + 1).fill(0));
  piece.cells.forEach(([r, c]) => { grid[r][c] = 1; });
  const baseColor = COLORS[piece.colorKey] || '#888';
  const color = validHover === false
    ? '#ff4040'
    : validHover === true ? '#50ff80' : baseColor;
  return (
    <View>
      {grid.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((cell, c) => (
            <View key={c} style={{
              width: cellSize, height: cellSize,
              backgroundColor: cell ? color : 'transparent',
              borderRadius: cell ? 5 : 0,
              borderWidth: cell ? 1 : 0,
              borderColor: 'rgba(255,255,255,0.28)',
              margin: 1,
              overflow: 'hidden',
            }}>
              {!!cell && (
                <View style={{
                  position: 'absolute', top: 1, left: 1,
                  width: '40%', height: '36%',
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  borderRadius: 2,
                }} />
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center' },

  header: {
    flexDirection: 'row', width: '100%',
    paddingHorizontal: 16, paddingVertical: 8, gap: 10,
  },
  statChip: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, borderColor: '#2a3a6a',
  },
  statLabel: { color: COLORS.textSecondary, fontSize: 9, fontWeight: 'bold', letterSpacing: 1.2 },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: 'bold' },

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
    width: '42%', height: '36%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
  },
  previewOk: {
    backgroundColor: 'rgba(78,204,163,0.35)',
    borderWidth: 1.5, borderColor: COLORS.success,
    borderRadius: 4,
  },
  previewBad: {
    backgroundColor: 'rgba(255,50,50,0.25)',
    borderWidth: 1.5, borderColor: '#ff4040',
    borderRadius: 4,
  },
  flashCell: { backgroundColor: '#ffffff' },

  popup: {
    position: 'absolute', alignSelf: 'center', top: '40%',
    backgroundColor: 'rgba(78,204,163,0.92)',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 12,
  },
  popupTxt: { color: '#000', fontWeight: 'bold', fontSize: 17 },

  tray: {
    flexDirection: 'row', justifyContent: 'space-evenly',
    width: '100%', paddingHorizontal: 8, paddingTop: 20, paddingBottom: 8,
  },
  traySlot: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    minHeight: TRAY_CELL * 5 + 20,
  },
  trayPiece: { alignItems: 'center', justifyContent: 'center' },

  dragOverlay: {
    position: 'absolute', top: 0, left: 0, opacity: 0.95,
  },

  hintText: {
    color: '#2a4a6a', fontSize: 10, textAlign: 'center',
    marginTop: 4, letterSpacing: 0.5,
  },
});
