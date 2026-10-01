/**
 * Monster Star & Transcendent Fusion Utilities
 *
 * Rules:
 * - 1 to 5 Stars: Standard / Gold Stars
 * - 6 to 10 Stars: Transcendent Purple Stars
 *   - 6★: 1 purple star + 4 gold stars (total 5 stars visible)
 *   - 7★: 2 purple stars + 3 gold stars
 *   - 8★: 3 purple stars + 2 gold stars
 *   - 9★: 4 purple stars + 1 gold star
 *   - 10★: 5 purple stars (All 5 stars are purple, indicating apex 10-star power!)
 * - Maximum star limit: 10 stars.
 * - Only the same kind of monsters can fuse (matching familyId, e.g. Nekohime + Nekohime).
 * - Host and catalyst must have the same star rating (e.g. 5★ + 5★ -> 6★, 6★ + 6★ -> 7★).
 * - The host monster is the result, retaining its element, level, equipment, and gaining +1 star.
 */

import { MonsterVariant, PlayerMonster, Rarity } from '../types';

export const MAX_MONSTER_STARS = 10;

export const BASE_RARITY_STARS: Record<Rarity, number> = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  EPIC: 4,
  LEGENDARY: 5,
};

/**
 * Returns the effective star count for a monster (1 to 10).
 */
export function getMonsterStars(
  monster?: Partial<PlayerMonster> | null,
  variant?: Partial<MonsterVariant> | null
): number {
  if (monster && typeof monster.stars === 'number' && monster.stars > 0) {
    return Math.min(MAX_MONSTER_STARS, Math.max(1, monster.stars));
  }
  if (variant && typeof variant.stars === 'number' && variant.stars > 0) {
    return Math.min(MAX_MONSTER_STARS, Math.max(1, variant.stars));
  }
  if (variant && variant.rarity && BASE_RARITY_STARS[variant.rarity]) {
    return BASE_RARITY_STARS[variant.rarity];
  }
  return 1;
}

export interface StarDisplayConfig {
  stars: number;
  isTranscendent: boolean; // stars >= 6
  isMaxApex: boolean;      // stars === 10
  purpleCount: number;     // number of purple stars (0 for <=5, stars - 5 for 6..10)
  goldCount: number;       // number of gold stars
  emptyCount: number;      // number of empty stars (for <=5)
  tierLabel: string;
}

/**
 * Calculates the exact purple, gold, and empty star counts for the 5-star display.
 * When a monster becomes 6-star, one star becomes purple, up until all 5 are purple at 10-star.
 */
export function getStarDisplayConfig(stars: number): StarDisplayConfig {
  const safeStars = Math.min(MAX_MONSTER_STARS, Math.max(1, Math.round(stars || 1)));
  const isTranscendent = safeStars >= 6;
  const isMaxApex = safeStars === 10;

  if (isTranscendent) {
    // 6★ -> 1 purple, 4 gold
    // 7★ -> 2 purple, 3 gold
    // 8★ -> 3 purple, 2 gold
    // 9★ -> 4 purple, 1 gold
    // 10★ -> 5 purple, 0 gold
    const purpleCount = safeStars - 5;
    const goldCount = 5 - purpleCount;
    return {
      stars: safeStars,
      isTranscendent: true,
      isMaxApex,
      purpleCount,
      goldCount,
      emptyCount: 0,
      tierLabel: isMaxApex
        ? '10★ Sovereign Apex'
        : `${safeStars}★ Transcendent`,
    };
  }

  // 1 to 5 Stars
  return {
    stars: safeStars,
    isTranscendent: false,
    isMaxApex: false,
    purpleCount: 0,
    goldCount: safeStars,
    emptyCount: 5 - safeStars,
    tierLabel: `${safeStars}★ Standard`,
  };
}

/**
 * Gold cost to synthesize a monster at currentStars into currentStars + 1.
 */
export function getSynthesisStarCost(currentStars: number): number {
  const costTable: Record<number, number> = {
    1: 2000,   // 1★ -> 2★
    2: 4000,   // 2★ -> 3★
    3: 8000,   // 3★ -> 4★
    4: 15000,  // 4★ -> 5★
    5: 30000,  // 5★ -> 6★ (Transcendent leap!)
    6: 50000,  // 6★ -> 7★
    7: 75000,  // 7★ -> 8★
    8: 100000, // 8★ -> 9★
    9: 150000, // 9★ -> 10★ (Apex Sovereign)
  };
  return costTable[currentStars] || 25000;
}

/**
 * Checks if two monsters can be synthesized together.
 */
export function validateSynthesisEligibility(
  host: PlayerMonster | null,
  catalyst: PlayerMonster | null,
  variantsMap: Record<string, MonsterVariant>
): { eligible: boolean; errorReason?: string; nextStars?: number; goldCost?: number } {
  if (!host || !catalyst) {
    return { eligible: false, errorReason: 'Please select both a Host Monster and a Catalyst Monster.' };
  }
  if (host.instanceId === catalyst.instanceId) {
    return { eligible: false, errorReason: 'Host and Catalyst must be two separate monsters.' };
  }
  if (host.locked) {
    return { eligible: false, errorReason: 'Host monster is locked. Unlock it before synthesizing.' };
  }
  if (catalyst.locked) {
    return { eligible: false, errorReason: 'Catalyst monster is locked. Unlock it before synthesizing.' };
  }

  const vHost = variantsMap[host.variantId];
  const vCat = variantsMap[catalyst.variantId];
  if (!vHost || !vCat) {
    return { eligible: false, errorReason: 'Invalid monster variants.' };
  }

  // Same kind check (matching species / familyId)
  if (vHost.familyId !== vCat.familyId) {
    return {
      eligible: false,
      errorReason: `Species mismatch: Only monsters of the same kind can fuse (e.g. Nekohime + Nekohime). Selected: ${vHost.name} and ${vCat.name}.`,
    };
  }

  const hostStars = getMonsterStars(host, vHost);
  const catStars = getMonsterStars(catalyst, vCat);

  // Same star rating check
  if (hostStars !== catStars) {
    return {
      eligible: false,
      errorReason: `Star mismatch: Both monsters must share the exact same star rating. Selected: ${hostStars}★ and ${catStars}★.`,
    };
  }

  // Maximum star limit check (10★)
  if (hostStars >= MAX_MONSTER_STARS) {
    return {
      eligible: false,
      errorReason: `Maximum star limit reached: ${vHost.name} is already a 10★ Sovereign and cannot be upgraded further.`,
    };
  }

  const nextStars = hostStars + 1;
  const goldCost = getSynthesisStarCost(hostStars);

  return {
    eligible: true,
    nextStars,
    goldCost,
  };
}
