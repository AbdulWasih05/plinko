/**
 * Frontend Constants
 */

// Game configuration
export const ROWS = 12;
export const BINS = ROWS + 1;

// Payout multipliers (symmetric)
export const PAYOUT_TABLE = Object.freeze([
  16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.2, 1.4, 1.4, 2, 9, 16
]);

// Animation timing (ms)
export const ANIMATION = Object.freeze({
  STEP_DELAY: 300,
  STEP_DELAY_REDUCED: 50,
  START_DELAY: 500,
  START_DELAY_REDUCED: 100,
  RESULT_DELAY: 300,
  CONFETTI_DURATION: 2000
});

// Board dimensions
export const BOARD = Object.freeze({
  WIDTH: 600,
  HEIGHT: 500,
  PEG_SIZE: 8,
  BALL_SIZE: 12
});

// Audio frequencies
export const AUDIO = Object.freeze({
  PEG_BASE_FREQ: 800,
  PEG_VARIANCE: 200,
  WIN_CHORD: [523.25, 659.25, 783.99] // C5, E5, G5
});
