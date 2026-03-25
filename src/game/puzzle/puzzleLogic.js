import { PUZZLE_SIZE } from '../../constants/game';

export function createEmptyBoard() {
  return Array.from({ length: PUZZLE_SIZE }, () => Array(PUZZLE_SIZE).fill(null));
}

export function isValidPlacement(board, piece, startRow, startCol) {
  for (const [r, c] of piece.cells) {
    const row = startRow + r;
    const col = startCol + c;
    if (row < 0 || row >= PUZZLE_SIZE || col < 0 || col >= PUZZLE_SIZE) return false;
    if (board[row][col] !== null) return false;
  }
  return true;
}

export function placePiece(board, piece, startRow, startCol) {
  const newBoard = board.map(row => [...row]);
  for (const [r, c] of piece.cells) {
    newBoard[startRow + r][startCol + c] = piece.colorKey;
  }
  return newBoard;
}

export function clearFilledLines(board) {
  const newBoard = board.map(row => [...row]);

  const rowsToClear = [];
  for (let r = 0; r < PUZZLE_SIZE; r++) {
    if (newBoard[r].every(cell => cell !== null)) rowsToClear.push(r);
  }

  const colsToClear = [];
  for (let c = 0; c < PUZZLE_SIZE; c++) {
    if (newBoard.every(row => row[c] !== null)) colsToClear.push(c);
  }

  for (const r of rowsToClear) newBoard[r] = Array(PUZZLE_SIZE).fill(null);
  for (const c of colsToClear) {
    for (let r = 0; r < PUZZLE_SIZE; r++) newBoard[r][c] = null;
  }

  return { board: newBoard, clearedRows: rowsToClear.length, clearedCols: colsToClear.length };
}

export function calcScore(piece, clearedRows, clearedCols) {
  const cellScore = piece.cells.length * 10;
  const clearCount = clearedRows + clearedCols;
  const clearScore = clearCount * 100;
  const comboBonus = clearCount > 1 ? (clearCount - 1) * 50 : 0;
  return cellScore + clearScore + comboBonus;
}

export function canPieceBePlaced(board, piece) {
  for (let r = 0; r < PUZZLE_SIZE; r++) {
    for (let c = 0; c < PUZZLE_SIZE; c++) {
      if (isValidPlacement(board, piece, r, c)) return true;
    }
  }
  return false;
}

export function canAnyPieceBePlaced(board, pieces) {
  return pieces.some(p => p && canPieceBePlaced(board, p));
}
