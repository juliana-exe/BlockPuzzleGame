// Puzzle pieces: array of [row, col] offsets (top-left origin)
// Ordered by size / complexity for gradual difficulty
import { canPieceBePlaced } from './puzzleLogic';

export const PUZZLE_PIECES = [
  // 1-cell
  { id: 'mono',     cells: [[0,0]],                                    colorKey: 'p0' },

  // 2-cells (dominó)
  { id: 'domH',     cells: [[0,0],[0,1]],                              colorKey: 'p1' },
  { id: 'domV',     cells: [[0,0],[1,0]],                              colorKey: 'p1' },

  // 3-cells
  { id: 'tri3H',    cells: [[0,0],[0,1],[0,2]],                        colorKey: 'p2' },
  { id: 'tri3V',    cells: [[0,0],[1,0],[2,0]],                        colorKey: 'p2' },
  { id: 'triLa',    cells: [[0,0],[1,0],[1,1]],                        colorKey: 'p2' },
  { id: 'triLb',    cells: [[0,1],[1,0],[1,1]],                        colorKey: 'p2' },

  // 4-cells
  { id: 'tet4H',    cells: [[0,0],[0,1],[0,2],[0,3]],                  colorKey: 'p3' },
  { id: 'tet4V',    cells: [[0,0],[1,0],[2,0],[3,0]],                  colorKey: 'p3' },
  { id: 'tet2x2',   cells: [[0,0],[0,1],[1,0],[1,1]],                  colorKey: 'p3' },
  { id: 'tetLa',    cells: [[0,0],[1,0],[2,0],[2,1]],                  colorKey: 'p4' },
  { id: 'tetLb',    cells: [[0,1],[1,1],[2,0],[2,1]],                  colorKey: 'p4' },
  { id: 'tetT',     cells: [[0,0],[0,1],[0,2],[1,1]],                  colorKey: 'p4' },
  { id: 'tetS',     cells: [[0,1],[0,2],[1,0],[1,1]],                  colorKey: 'p5' },
  { id: 'tetZ',     cells: [[0,0],[0,1],[1,1],[1,2]],                  colorKey: 'p5' },

  // 5-cells
  { id: 'pent5H',   cells: [[0,0],[0,1],[0,2],[0,3],[0,4]],            colorKey: 'p6' },
  { id: 'pent5V',   cells: [[0,0],[1,0],[2,0],[3,0],[4,0]],            colorKey: 'p6' },
  { id: 'pentLa',   cells: [[0,0],[1,0],[2,0],[2,1],[2,2]],            colorKey: 'p7' },
  { id: 'pentLb',   cells: [[0,2],[1,2],[2,0],[2,1],[2,2]],            colorKey: 'p7' },
  { id: 'pentJa',   cells: [[0,0],[0,1],[0,2],[1,0],[2,0]],            colorKey: 'p7' },
  { id: 'pentJb',   cells: [[0,0],[0,1],[0,2],[1,2],[2,2]],            colorKey: 'p7' },
  { id: 'pentPlus', cells: [[0,1],[1,0],[1,1],[1,2],[2,1]],            colorKey: 'p8' },
  { id: 'pentU',    cells: [[0,0],[0,2],[1,0],[1,1],[1,2]],            colorKey: 'p8' },

  // 6-cells
  { id: 'hex3x2',   cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]],      colorKey: 'p9' },
  { id: 'hex2x3',   cells: [[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]],      colorKey: 'p9' },

  // 9-cell (3x3 square - hard)
  { id: 'sq3x3',    cells: [
    [0,0],[0,1],[0,2],
    [1,0],[1,1],[1,2],
    [2,0],[2,1],[2,2],
  ], colorKey: 'p9' },
];

export const EASY_POOL   = PUZZLE_PIECES.filter(p => p.cells.length <= 3);
export const MEDIUM_POOL = PUZZLE_PIECES.filter(p => p.cells.length <= 4);
export const HARD_POOL   = PUZZLE_PIECES.filter(p => p.cells.length <= 5);
export const EXPERT_POOL = PUZZLE_PIECES;

export function getPoolForLevel(level) {
  if (level <= 5)  return EASY_POOL;
  if (level <= 15) return MEDIUM_POOL;
  if (level <= 25) return HARD_POOL;
  return EXPERT_POOL;
}

function getPoolWithBias(level) {
  if (level <= 10) return MEDIUM_POOL;
  if (level <= 30) return HARD_POOL;
  return EXPERT_POOL;
}

export function getRandomPieces(level, count = 3, board = null) {
  const pool = getPoolForLevel(level);
  const richPool = getPoolWithBias(level);
  const generated = Array.from({ length: count }, (_, idx) => ({
    ...(idx === 0 ? richPool[Math.floor(Math.random() * richPool.length)] : pool[Math.floor(Math.random() * pool.length)]),
  }));

  if (!board) return generated;
  if (generated.some(piece => canPieceBePlaced(board, piece))) return generated;

  const fallback = pool.find(piece => canPieceBePlaced(board, piece));
  if (fallback) {
    generated[0] = { ...fallback };
  }
  return generated;
}
