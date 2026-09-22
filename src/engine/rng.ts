/**
 * Seeded PRNG for Deterministic Battle Simulation
 * Mulberry32 implementation
 */

export class DeterministicRNG {
  private state: number;

  constructor(seed: number = Date.now()) {
    this.state = seed >>> 0;
  }

  /**
   * Returns a float in range [0, 1)
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns integer in range [min, max] inclusive
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns true if roll succeeds against a probability [0, 1]
   */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  getSeed(): number {
    return this.state;
  }
}
