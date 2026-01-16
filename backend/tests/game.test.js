/**
 * Plinko Game Tests
 *
 * Unit tests for provably fair protocol, PRNG, and game engine.
 */

const { PlinkoEngine, ROWS, BINS } = require('../lib/engine');
const { ProvablyFair, RoundRNG, XORShift32 } = require('../lib/prng');
const { PAYOUT_TABLE } = require('../lib/constants');

// =============================================================================
// Test Vectors from Assignment
// =============================================================================

const TEST_VECTORS = {
  serverSeed: 'b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc',
  nonce: '42',
  clientSeed: 'candidate-hello',
  expected: {
    commitHex: 'bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34',
    combinedSeed: 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0',
    prngValues: [0.1106166649, 0.7625129214, 0.0439292176, 0.4578678815, 0.3438999297],
    binIndex: 6
  }
};

// =============================================================================
// Provably Fair Protocol Tests
// =============================================================================

describe('Provably Fair Protocol', () => {
  test('generates correct commit hash', () => {
    const commitHex = ProvablyFair.createCommitment(
      TEST_VECTORS.serverSeed,
      TEST_VECTORS.nonce
    );
    expect(commitHex).toBe(TEST_VECTORS.expected.commitHex);
  });

  test('generates correct combined seed', () => {
    const combinedSeed = ProvablyFair.generateCombinedSeed(
      TEST_VECTORS.serverSeed,
      TEST_VECTORS.clientSeed,
      TEST_VECTORS.nonce
    );
    expect(combinedSeed).toBe(TEST_VECTORS.expected.combinedSeed);
  });

  test('verifies valid commitment', () => {
    const isValid = ProvablyFair.verifyCommitment(
      TEST_VECTORS.serverSeed,
      TEST_VECTORS.nonce,
      TEST_VECTORS.expected.commitHex
    );
    expect(isValid).toBe(true);
  });

  test('rejects invalid commitment', () => {
    const isValid = ProvablyFair.verifyCommitment(
      TEST_VECTORS.serverSeed,
      TEST_VECTORS.nonce,
      'invalid-hash'
    );
    expect(isValid).toBe(false);
  });
});

// =============================================================================
// PRNG (XORShift32) Tests
// =============================================================================

describe('PRNG (XORShift32)', () => {
  test('matches assignment test vectors', () => {
    const rng = new RoundRNG(TEST_VECTORS.expected.combinedSeed);

    for (const expected of TEST_VECTORS.expected.prngValues) {
      const actual = rng.next();
      expect(actual).toBeCloseTo(expected, 9);
    }
  });

  test('is deterministic with same seed', () => {
    const rng1 = new RoundRNG('test-seed-123');
    const rng2 = new RoundRNG('test-seed-123');

    for (let i = 0; i < 10; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  test('produces different sequences with different seeds', () => {
    const rng1 = new RoundRNG('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    const rng2 = new RoundRNG('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');

    const values1 = Array.from({ length: 5 }, () => rng1.next());
    const values2 = Array.from({ length: 5 }, () => rng2.next());

    expect(values1).not.toEqual(values2);
  });

  test('reset returns to initial state', () => {
    const seed = 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
    const rng = new RoundRNG(seed);

    const initial = Array.from({ length: 5 }, () => rng.next());
    rng.reset(seed);
    const afterReset = Array.from({ length: 5 }, () => rng.next());

    expect(afterReset).toEqual(initial);
  });
});

// =============================================================================
// Plinko Engine Tests
// =============================================================================

describe('Plinko Engine', () => {
  test('matches assignment test vector outcome', () => {
    const result = PlinkoEngine.playRound({
      serverSeed: TEST_VECTORS.serverSeed,
      clientSeed: TEST_VECTORS.clientSeed,
      nonce: TEST_VECTORS.nonce,
      dropColumn: 6,
      betCents: 100
    });

    expect(result.binIndex).toBe(TEST_VECTORS.expected.binIndex);
    expect(result.rows).toBe(12);
    expect(result.path).toHaveLength(12);
  });

  test('generates correct peg map format', () => {
    const rng = new RoundRNG('peg-map-test');
    const pegMap = PlinkoEngine.generatePegMap(rng, ROWS);

    expect(pegMap).toHaveLength(ROWS);

    for (let row = 0; row < ROWS; row++) {
      expect(pegMap[row]).toHaveLength(row + 1);

      for (const bias of pegMap[row]) {
        expect(bias).toBeGreaterThanOrEqual(0.4);
        expect(bias).toBeLessThanOrEqual(0.6);
        // Check 6 decimal precision
        const decimals = bias.toString().split('.')[1]?.length || 0;
        expect(decimals).toBeLessThanOrEqual(6);
      }
    }
  });

  test('produces deterministic path', () => {
    const params = {
      serverSeed: 'deterministic-test',
      clientSeed: 'client-seed',
      nonce: '123',
      dropColumn: 3,
      betCents: 50
    };

    const result1 = PlinkoEngine.playRound(params);
    const result2 = PlinkoEngine.playRound(params);

    expect(result1.binIndex).toBe(result2.binIndex);
    expect(result1.pegMapHash).toBe(result2.pegMapHash);
    expect(result1.path).toEqual(result2.path);
  });

  test('handles edge drop columns', () => {
    const params = {
      serverSeed: 'edge-test',
      clientSeed: 'edge-client',
      nonce: '999',
      betCents: 100
    };

    // Left edge
    const left = PlinkoEngine.playRound({ ...params, dropColumn: 0 });
    expect(left.binIndex).toBeGreaterThanOrEqual(0);
    expect(left.binIndex).toBeLessThanOrEqual(BINS - 1);

    // Right edge
    const right = PlinkoEngine.playRound({ ...params, dropColumn: 12 });
    expect(right.binIndex).toBeGreaterThanOrEqual(0);
    expect(right.binIndex).toBeLessThanOrEqual(BINS - 1);
  });
});

// =============================================================================
// Payout Table Tests
// =============================================================================

describe('Payout Table', () => {
  test('matches expected multipliers', () => {
    const expected = [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.2, 1.4, 1.4, 2, 9, 16];
    expect(PlinkoEngine.getPayoutTable()).toEqual(expected);
  });

  test('is symmetric', () => {
    const table = PlinkoEngine.getPayoutTable();

    for (let i = 0; i < table.length; i++) {
      const mirror = table.length - 1 - i;
      expect(table[i]).toBe(table[mirror]);
    }
  });

  test('has lowest multiplier at center', () => {
    const table = PlinkoEngine.getPayoutTable();
    const center = Math.floor(table.length / 2);

    expect(table[center]).toBe(1.1);
    expect(table[0]).toBe(16);
    expect(table[table.length - 1]).toBe(16);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Integration', () => {
  test('complete round workflow', () => {
    // 1. Generate server-side values
    const serverSeed = ProvablyFair.generateServerSeed();
    const nonce = ProvablyFair.generateNonce();
    const commitHex = ProvablyFair.createCommitment(serverSeed, nonce);

    expect(commitHex).toMatch(/^[a-f0-9]{64}$/);

    // 2. Play round with client seed
    const result = PlinkoEngine.playRound({
      serverSeed,
      clientSeed: 'integration-test',
      nonce,
      dropColumn: 6,
      betCents: 200
    });

    expect(result).toHaveProperty('binIndex');
    expect(result).toHaveProperty('pegMapHash');
    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('multiplier');
    expect(result).toHaveProperty('payoutCents');

    // 3. Verify commitment
    const isValid = ProvablyFair.verifyCommitment(serverSeed, nonce, commitHex);
    expect(isValid).toBe(true);

    // 4. Replay should produce same result
    const replay = PlinkoEngine.playRound({
      serverSeed,
      clientSeed: 'integration-test',
      nonce,
      dropColumn: 6,
      betCents: 200
    });

    expect(replay.binIndex).toBe(result.binIndex);
    expect(replay.pegMapHash).toBe(result.pegMapHash);
  });
});
