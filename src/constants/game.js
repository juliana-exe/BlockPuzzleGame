import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SCREEN_W = SCREEN_WIDTH;
export const SCREEN_H = SCREEN_HEIGHT;

// Clássico (Tetris)
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const CLASSIC_CELL = Math.floor((SCREEN_WIDTH - 80) / BOARD_WIDTH);

// Puzzle (Block Puzzle)
export const PUZZLE_SIZE = 9;
export const PUZZLE_CELL = Math.floor((SCREEN_WIDTH - 32) / PUZZLE_SIZE);

// Speeds per level (ms): 20 levels
export const LEVEL_SPEEDS = [
  800, 720, 640, 560, 490,
  430, 370, 310, 260, 220,
  190, 160, 140, 120, 110,
  100,  95,  90,  85,  80,
];

// Score for clearing N lines at once
export const LINE_SCORES = [0, 100, 300, 500, 800];

// Lines needed to advance one level
export const LINES_PER_LEVEL = 10;
