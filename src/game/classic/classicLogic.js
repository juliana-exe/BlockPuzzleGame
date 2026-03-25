import { BOARD_WIDTH, BOARD_HEIGHT } from '../../constants/game';
import { getPieceShape, PIECES } from './tetrominoes';

export function createEmptyBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

export function isValidPosition(board, name, rotIdx, row, col) {
  const shape = getPieceShape(name, rotIdx);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= BOARD_HEIGHT || nc < 0 || nc >= BOARD_WIDTH) return false;
        if (board[nr][nc] !== null) return false;
      }
    }
  }
  return true;
}

export function placePiece(board, name, rotIdx, row, col, color) {
  const newBoard = board.map(r => [...r]);
  const shape = getPieceShape(name, rotIdx);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        newBoard[row + r][col + c] = color;
      }
    }
  }
  return newBoard;
}

export function clearFullLines(board) {
  const kept = board.filter(row => row.some(cell => cell === null));
  const cleared = BOARD_HEIGHT - kept.length;
  const emptyRows = Array.from({ length: cleared }, () => Array(BOARD_WIDTH).fill(null));
  return { board: [...emptyRows, ...kept], lines: cleared };
}

export function getGhostRow(board, name, rotIdx, row, col) {
  let ghost = row;
  while (isValidPosition(board, name, rotIdx, ghost + 1, col)) ghost++;
  return ghost;
}

export function getSpawnCol(name) {
  const shape = getPieceShape(name, 0);
  return Math.floor((BOARD_WIDTH - shape[0].length) / 2);
}

export function tryRotate(board, name, rotIdx, row, col) {
  const rotCount = PIECES[name].shapes.length;
  const newRot = (rotIdx + 1) % rotCount;
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (isValidPosition(board, name, newRot, row, col + kick)) {
      return { rotIdx: newRot, col: col + kick };
    }
  }
  return null;
}
