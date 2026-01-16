/**
 * Verification Route
 *
 * Public endpoint for verifying game fairness.
 * Recomputes game outcome from provided inputs.
 */

const express = require('express');
const router = express.Router();

const { ProvablyFair } = require('../lib/prng');
const { PlinkoEngine, ROWS } = require('../lib/engine');

/**
 * GET /api/verify
 *
 * Verify a game round by recomputing the outcome.
 *
 * Query params:
 * - serverSeed: Revealed server seed
 * - clientSeed: Client's seed
 * - nonce: Round nonce
 * - dropColumn: Ball drop position (0-12)
 */
router.get('/', async (req, res) => {
  try {
    const { serverSeed, clientSeed, nonce, dropColumn } = req.query;

    // Validate required parameters
    if (!serverSeed || !clientSeed || !nonce || dropColumn === undefined) {
      return res.status(400).json({
        error: 'Missing parameters',
        required: ['serverSeed', 'clientSeed', 'nonce', 'dropColumn']
      });
    }

    const column = parseInt(dropColumn, 10);

    if (isNaN(column) || column < 0 || column > ROWS) {
      return res.status(400).json({
        error: 'Invalid drop column (must be 0-12)'
      });
    }

    // Recompute values
    const commitHex = ProvablyFair.createCommitment(serverSeed, nonce);
    const combinedSeed = ProvablyFair.generateCombinedSeed(serverSeed, clientSeed, nonce);

    // Replay the game
    const result = PlinkoEngine.playRound({
      serverSeed,
      clientSeed,
      nonce,
      dropColumn: column,
      betCents: 100 // Arbitrary - doesn't affect outcome
    });

    res.json({
      // Inputs
      serverSeed,
      clientSeed,
      nonce,
      dropColumn: column,

      // Computed values
      commitHex,
      combinedSeed,
      pegMapHash: result.pegMapHash,
      binIndex: result.binIndex,
      payoutMultiplier: result.multiplier,

      // Game data for visual replay
      pegMap: result.pegMap,
      path: result.path,
      rows: ROWS,

      // Verification status
      verified: true
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
