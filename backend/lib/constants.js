/**
 * Game Constants
 * Central location for all game configuration values
 */

// Board configuration
const ROWS = 12;
const BINS = ROWS + 1;

// Peg bias range [0.4, 0.6]
const BIAS_MIN = 0.4;
const BIAS_MAX = 0.6;
const BIAS_RANGE = 0.2;

// Drop column adjustment factor
const DROP_COLUMN_ADJUSTMENT = 0.01;

// Decimal precision for stable hashing
const BIAS_DECIMAL_PLACES = 6;

// Symmetric payout multipliers (edges pay more, center pays less)
const PAYOUT_TABLE = Object.freeze([
  16,   // bin 0  - far left
  9,    // bin 1
  2,    // bin 2
  1.4,  // bin 3
  1.4,  // bin 4
  1.2,  // bin 5
  1.1,  // bin 6  - center
  1.2,  // bin 7
  1.4,  // bin 8
  1.4,  // bin 9
  2,    // bin 10
  9,    // bin 11
  16    // bin 12 - far right
]);

// Round status enum
const RoundStatus = Object.freeze({
  CREATED: 'CREATED',
  STARTED: 'STARTED',
  REVEALED: 'REVEALED'
});

module.exports = {
  ROWS,
  BINS,
  BIAS_MIN,
  BIAS_MAX,
  BIAS_RANGE,
  DROP_COLUMN_ADJUSTMENT,
  BIAS_DECIMAL_PLACES,
  PAYOUT_TABLE,
  RoundStatus
};
