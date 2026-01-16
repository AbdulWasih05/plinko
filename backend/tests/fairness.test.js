/**
 * Provably Fair & Determinism Unit Tests
 */

const { PlinkoEngine } = require('../lib/engine');
const { ProvablyFair, RoundRNG } = require('../lib/prng');

describe('Specific Fairness & Determinism Tests', () => {
    // Test Vector From Documentation
    const testVector = {
        serverSeed: 'b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc',
        nonce: '42',
        clientSeed: 'candidate-hello',
        expectedCombined: 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0',
        expectedBin: 6
    };

    test('Combiner produces exact expected seed for test vector', () => {
        const combined = ProvablyFair.generateCombinedSeed(
            testVector.serverSeed,
            testVector.clientSeed,
            testVector.nonce
        );
        expect(combined).toBe(testVector.expectedCombined);
    });

    test('PRNG produces deterministic sequence from combined seed', () => {
        const rng = new RoundRNG(testVector.expectedCombined);
        const firstFive = [
            rng.next(),
            rng.next(),
            rng.next(),
            rng.next(),
            rng.next()
        ];

        // Re-initialize and check
        const rng2 = new RoundRNG(testVector.expectedCombined);
        const secondFive = [
            rng2.next(),
            rng2.next(),
            rng2.next(),
            rng2.next(),
            rng2.next()
        ];

        expect(firstFive).toEqual(secondFive);
        // Values match assignment spec
        expect(firstFive[0]).toBeCloseTo(0.1106166649, 9);
    });

    test('Full Game Replay Determinism', () => {
        const params = {
            serverSeed: 'replay-test-server-seed',
            clientSeed: 'replay-test-client-seed',
            nonce: 'replay-nonce',
            dropColumn: 5,
            betCents: 100
        };

        const firstRun = PlinkoEngine.playRound(params);
        const secondRun = PlinkoEngine.playRound(params);

        expect(firstRun.binIndex).toBe(secondRun.binIndex);
        expect(firstRun.path).toEqual(secondRun.path);
        expect(firstRun.pegMapHash).toBe(secondRun.pegMapHash);
        expect(firstRun.multiplier).toBe(secondRun.multiplier);
    });

    test('Bin result matches test vector exactly', () => {
        const result = PlinkoEngine.playRound({
            serverSeed: testVector.serverSeed,
            clientSeed: testVector.clientSeed,
            nonce: testVector.nonce,
            dropColumn: 6,
            betCents: 100
        });

        expect(result.binIndex).toBe(testVector.expectedBin);
    });
});
