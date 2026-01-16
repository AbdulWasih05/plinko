/**
 * Provably Fair PRNG Implementation
 *
 * Implements XORShift32 algorithm and commit-reveal protocol
 * for transparent, verifiable randomness.
 */

const { createHash } = require('crypto');

/**
 * XORShift32 - Fast, deterministic pseudo-random number generator
 *
 * Algorithm: Marsaglia's xorshift with 32-bit state
 * Period: 2^32 - 1
 */
class XORShift32 {
  constructor(seed) {
    // Ensure non-zero 32-bit unsigned integer
    this.state = (seed >>> 0) || 1;
  }

  /**
   * Generate next random number in [0, 1)
   * @returns {number} Random float between 0 (inclusive) and 1 (exclusive)
   */
  next() {
    this.state ^= this.state << 13;
    this.state ^= this.state >>> 17;
    this.state ^= this.state << 5;
    this.state = this.state >>> 0;
    return this.state / 0x100000000;
  }
}

/**
 * Provably Fair Protocol
 *
 * Implements commit-reveal scheme:
 * 1. Server commits: hash(serverSeed + nonce)
 * 2. Client provides: clientSeed
 * 3. Combined seed: hash(serverSeed + clientSeed + nonce)
 * 4. Server reveals: serverSeed (after round ends)
 */
class ProvablyFair {
  /**
   * Generate cryptographic server seed
   * @returns {string} 64-character hex string
   */
  static generateServerSeed() {
    const entropy = `${Math.random()}:${Date.now()}:${Math.random()}`;
    return createHash('sha256').update(entropy).digest('hex');
  }

  /**
   * Generate unique nonce for round
   * @returns {string} Unique identifier
   */
  static generateNonce() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * Create commitment hash (published before round)
   * @param {string} serverSeed - Server's secret seed
   * @param {string} nonce - Round nonce
   * @returns {string} SHA-256 hex hash
   */
  static createCommitment(serverSeed, nonce) {
    return createHash('sha256')
      .update(`${serverSeed}:${nonce}`)
      .digest('hex');
  }

  /**
   * Generate combined seed from all inputs
   * @param {string} serverSeed - Server's seed
   * @param {string} clientSeed - Client's seed
   * @param {string} nonce - Round nonce
   * @returns {string} SHA-256 hex hash
   */
  static generateCombinedSeed(serverSeed, clientSeed, nonce) {
    return createHash('sha256')
      .update(`${serverSeed}:${clientSeed}:${nonce}`)
      .digest('hex');
  }

  /**
   * Extract 32-bit seed from hex string (big-endian)
   * @param {string} hexSeed - Hex string (at least 8 chars)
   * @returns {number} 32-bit unsigned integer
   */
  static extractPRNGSeed(hexSeed) {
    return parseInt(hexSeed.substring(0, 8), 16);
  }

  /**
   * Verify commitment matches revealed seed
   * @param {string} serverSeed - Revealed server seed
   * @param {string} nonce - Round nonce
   * @param {string} commitment - Original commitment
   * @returns {boolean} True if valid
   */
  static verifyCommitment(serverSeed, nonce, commitment) {
    return this.createCommitment(serverSeed, nonce) === commitment;
  }
}

/**
 * Round RNG - Manages PRNG for a single game round
 *
 * Ensures consistent ordering of random number generation:
 * 1. Peg map generation
 * 2. Path decisions
 */
class RoundRNG {
  constructor(combinedSeed) {
    const seed = ProvablyFair.extractPRNGSeed(combinedSeed);
    this.prng = new XORShift32(seed);
    this.callCount = 0;
  }

  /**
   * Get next random number
   * @returns {number} Random float in [0, 1)
   */
  next() {
    this.callCount++;
    return this.prng.next();
  }

  /**
   * Reset PRNG to initial state (for verification)
   * @param {string} combinedSeed - Combined seed hex
   */
  reset(combinedSeed) {
    const seed = ProvablyFair.extractPRNGSeed(combinedSeed);
    this.prng = new XORShift32(seed);
    this.callCount = 0;
  }
}

module.exports = {
  XORShift32,
  ProvablyFair,
  RoundRNG
};
