/**
 * Plinko Game Engine
 *
 * Deterministic game logic for provably fair Plinko.
 * All randomness comes from seeded PRNG for reproducibility.
 */

const { createHash } = require('crypto');
const { RoundRNG, ProvablyFair } = require('./prng');
const {
  ROWS,
  BINS,
  BIAS_RANGE,
  DROP_COLUMN_ADJUSTMENT,
  BIAS_DECIMAL_PLACES,
  PAYOUT_TABLE
} = require('./constants');

/**
 * Plinko Engine - Core game mechanics
 */
class PlinkoEngine {
  /**
   * Generate peg map with random biases
   *
   * Each peg has a leftBias in [0.4, 0.6] that determines
   * the probability of the ball going left vs right.
   *
   * @param {RoundRNG} rng - Seeded random number generator
   * @param {number} rows - Number of rows (default: 12)
   * @returns {number[][]} 2D array of peg biases
   */
  static generatePegMap(rng, rows = ROWS) {
    const pegMap = [];

    for (let row = 0; row < rows; row++) {
      const pegRow = [];

      // Row r has (r + 1) pegs
      for (let peg = 0; peg <= row; peg++) {
        // Formula: leftBias = 0.5 + (rand - 0.5) * 0.2
        const rand = rng.next();
        const leftBias = 0.5 + (rand - 0.5) * BIAS_RANGE;

        // Round to 6 decimal places for stable hashing
        const rounded = Math.round(leftBias * 1e6) / 1e6;
        pegRow.push(rounded);
      }

      pegMap.push(pegRow);
    }

    return pegMap;
  }

  /**
   * Create deterministic hash of peg map
   * @param {number[][]} pegMap - Peg bias array
   * @returns {string} SHA-256 hex hash
   */
  static hashPegMap(pegMap) {
    return createHash('sha256')
      .update(JSON.stringify(pegMap))
      .digest('hex');
  }

  /**
   * Simulate ball drop through peg field
   *
   * Uses discrete model where ball position is tracked
   * as the number of rightward moves.
   *
   * @param {RoundRNG} rng - Seeded random number generator
   * @param {number[][]} pegMap - Peg bias array
   * @param {number} dropColumn - Starting column (0-12)
   * @returns {Object[]} Array of path steps
   */
  static simulateDrop(rng, pegMap, dropColumn) {
    const path = [];
    let position = 0; // Count of right moves

    // Calculate drop column adjustment
    const centerColumn = Math.floor(ROWS / 2);
    const adjustment = (dropColumn - centerColumn) * DROP_COLUMN_ADJUSTMENT;

    for (let row = 0; row < ROWS; row++) {
      // Get peg at current position (clamped to row bounds)
      const pegIndex = Math.min(position, row);
      const leftBias = pegMap[row][pegIndex];

      // Apply adjustment and clamp to [0, 1]
      const adjustedBias = Math.max(0, Math.min(1, leftBias + adjustment));

      // Make decision
      const rand = rng.next();
      const direction = rand < adjustedBias ? 'left' : 'right';

      if (direction === 'right') {
        position++;
      }

      path.push({
        row,
        column: position,
        direction,
        pegBias: leftBias,
        adjustedBias,
        randomValue: rand
      });
    }

    return path;
  }

  /**
   * Get payout multiplier for a bin
   * @param {number} binIndex - Bin index (0-12)
   * @returns {number} Payout multiplier
   */
  static getMultiplier(binIndex) {
    return PAYOUT_TABLE[binIndex] || 1;
  }

  /**
   * Get full payout table
   * @returns {number[]} Array of 13 multipliers
   */
  static getPayoutTable() {
    return [...PAYOUT_TABLE];
  }

  /**
   * Play a complete round
   *
   * @param {Object} params - Round parameters
   * @param {string} params.serverSeed - Server's seed
   * @param {string} params.clientSeed - Client's seed
   * @param {string} params.nonce - Round nonce
   * @param {number} params.dropColumn - Starting column (0-12)
   * @param {number} params.betCents - Bet amount in cents
   * @returns {Object} Complete round result
   */
  static playRound({ serverSeed, clientSeed, nonce, dropColumn, betCents }) {
    // Generate combined seed
    const combinedSeed = ProvablyFair.generateCombinedSeed(
      serverSeed,
      clientSeed,
      nonce
    );

    // Initialize RNG
    const rng = new RoundRNG(combinedSeed);

    // Generate peg map (first use of RNG)
    const pegMap = this.generatePegMap(rng, ROWS);
    const pegMapHash = this.hashPegMap(pegMap);

    // Simulate drop (continued use of RNG)
    const path = this.simulateDrop(rng, pegMap, dropColumn);

    // Calculate result
    const binIndex = path[path.length - 1].column;
    const multiplier = this.getMultiplier(binIndex);
    const payoutCents = Math.round(betCents * multiplier);

    return {
      combinedSeed,
      pegMap,
      pegMapHash,
      path,
      binIndex,
      multiplier,
      betCents,
      payoutCents,
      rows: ROWS
    };
  }
}

module.exports = {
  PlinkoEngine,
  ROWS,
  BINS
};
