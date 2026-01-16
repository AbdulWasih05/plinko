/**
 * Round Management Routes
 *
 * Handles the complete round lifecycle:
 * 1. Commit - Create round with commitment hash
 * 2. Start - Begin round with client parameters
 * 3. Reveal - Expose server seed for verification
 */

const express = require('express');
const router = express.Router();

const prisma = require('../lib/db');
const { ProvablyFair } = require('../lib/prng');
const { PlinkoEngine, ROWS } = require('../lib/engine');
const { RoundStatus } = require('../lib/constants');

/**
 * POST /api/rounds/commit
 *
 * Create a new round with server commitment.
 * Returns commitment hash and nonce (not server seed).
 */
router.post('/commit', async (req, res) => {
  try {
    const serverSeed = ProvablyFair.generateServerSeed();
    const nonce = ProvablyFair.generateNonce();
    const commitHex = ProvablyFair.createCommitment(serverSeed, nonce);

    const round = await prisma.round.create({
      data: {
        status: RoundStatus.CREATED,
        nonce,
        commitHex,
        serverSeed,
        clientSeed: '',
        combinedSeed: '',
        pegMapHash: '',
        rows: ROWS,
        dropColumn: 0,
        binIndex: 0,
        payoutMultiplier: 0,
        betCents: 0,
        pathJson: '[]'
      }
    });

    res.json({
      roundId: round.id,
      commitHex,
      nonce
    });
  } catch (error) {
    console.error('Commit error:', error);
    res.status(500).json({ error: 'Failed to create round' });
  }
});

/**
 * POST /api/rounds/:id/start
 *
 * Start a round with client parameters.
 * Computes game outcome but does not reveal server seed.
 */
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { clientSeed, betCents, dropColumn } = req.body;

    // Validate inputs
    if (!clientSeed || typeof clientSeed !== 'string') {
      return res.status(400).json({ error: 'Client seed required' });
    }

    if (!betCents || betCents < 1) {
      return res.status(400).json({ error: 'Valid bet amount required' });
    }

    if (dropColumn < 0 || dropColumn > ROWS) {
      return res.status(400).json({ error: 'Invalid drop column (0-12)' });
    }

    // Find round
    const round = await prisma.round.findUnique({ where: { id } });

    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    if (round.status !== RoundStatus.CREATED) {
      return res.status(400).json({ error: 'Round already started' });
    }

    // Play the game
    const result = PlinkoEngine.playRound({
      serverSeed: round.serverSeed,
      clientSeed,
      nonce: round.nonce,
      dropColumn,
      betCents
    });

    // Update round
    const updated = await prisma.round.update({
      where: { id },
      data: {
        status: RoundStatus.STARTED,
        clientSeed,
        combinedSeed: result.combinedSeed,
        pegMapHash: result.pegMapHash,
        dropColumn,
        binIndex: result.binIndex,
        payoutMultiplier: result.multiplier,
        betCents,
        pathJson: JSON.stringify(result.path)
      }
    });

    res.json({
      roundId: updated.id,
      status: updated.status,
      nonce: updated.nonce,
      commitHex: updated.commitHex,
      clientSeed: updated.clientSeed,
      combinedSeed: updated.combinedSeed,
      pegMapHash: updated.pegMapHash,
      dropColumn: updated.dropColumn,
      binIndex: result.binIndex,
      payoutMultiplier: result.multiplier,
      betCents: updated.betCents,
      winAmount: result.payoutCents,
      pegMap: result.pegMap,
      path: result.path
    });
  } catch (error) {
    console.error('Start error:', error);
    res.status(500).json({ error: 'Failed to start round' });
  }
});

/**
 * POST /api/rounds/:id/reveal
 *
 * Reveal server seed for verification.
 * Only works after round has started.
 */
router.post('/:id/reveal', async (req, res) => {
  try {
    const { id } = req.params;

    const round = await prisma.round.findUnique({ where: { id } });

    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    if (round.status === RoundStatus.CREATED) {
      return res.status(400).json({ error: 'Round not started yet' });
    }

    // Update to revealed if not already
    const revealed = round.status === RoundStatus.REVEALED
      ? round
      : await prisma.round.update({
          where: { id },
          data: {
            status: RoundStatus.REVEALED,
            revealedAt: new Date()
          }
        });

    res.json({
      roundId: revealed.id,
      serverSeed: revealed.serverSeed,
      clientSeed: revealed.clientSeed,
      nonce: revealed.nonce,
      commitHex: revealed.commitHex,
      combinedSeed: revealed.combinedSeed,
      revealedAt: revealed.revealedAt
    });
  } catch (error) {
    console.error('Reveal error:', error);
    res.status(500).json({ error: 'Failed to reveal round' });
  }
});

/**
 * GET /api/rounds/:id
 *
 * Get full round details.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const round = await prisma.round.findUnique({ where: { id } });

    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    // Parse path JSON
    const response = {
      ...round,
      path: JSON.parse(round.pathJson || '[]')
    };

    // Hide server seed if not revealed
    if (round.status !== RoundStatus.REVEALED) {
      response.serverSeed = null;
    }

    res.json(response);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch round' });
  }
});

module.exports = router;
