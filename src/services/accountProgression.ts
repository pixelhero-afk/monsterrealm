/**
 * Monster Realms - Account Level Progression & Rewards Engine
 *
 * Implements account leveling mechanics, experience curve,
 * and account level progression rewards (e.g. Level 2, 3, 4 -> 50 gems, Level 5 -> 100 gems).
 */

import { AccountLevelReward, PlayerProfile } from '../types';

export const MAX_ACCOUNT_LEVEL = 50;

/**
 * Calculates the exact gems awarded for reaching a specific account level.
 * Explicit progression milestones:
 * - Level 2, 3, 4: 50 Gems
 * - Level 5: 100 Gems
 * - Level 6, 7, 8, 9: 50 Gems
 * - Level 10: 200 Gems
 * - Level 15: 150 Gems
 * - Level 20: 300 Gems
 * - Level 25: 250 Gems
 * - Level 30: 500 Gems
 * - Every 10th level: Level * 20 Gems
 * - Every 5th level: 100-250 Gems
 * - All other levels: 50 Gems
 */
export function getRewardForAccountLevel(level: number): number {
  if (level < 2) return 0;
  if (level === 2 || level === 3 || level === 4) return 50;
  if (level === 5) return 100;
  if (level === 10) return 200;
  if (level === 15) return 150;
  if (level === 20) return 300;
  if (level === 25) return 250;
  if (level === 30) return 500;
  if (level === 40) return 750;
  if (level === 50) return 1000;

  if (level % 10 === 0) {
    return level * 20;
  }
  if (level % 5 === 0) {
    return 100;
  }
  return 50;
}

/**
 * Experience required to go from `level` to `level + 1`.
 */
export function getExpToNextAccountLevel(level: number): number {
  if (level >= MAX_ACCOUNT_LEVEL) return 999999;
  // Smooth curve: Lv 1 -> 150, Lv 2 -> 250, Lv 3 -> 350, Lv 10 -> 1200
  return 100 + level * 50;
}

/**
 * Generate reward list for all milestone levels up to max level.
 */
export function getAllAccountLevelRewards(maxLevel: number = 30): AccountLevelReward[] {
  const rewards: AccountLevelReward[] = [];
  for (let lvl = 2; lvl <= maxLevel; lvl++) {
    const gems = getRewardForAccountLevel(lvl);
    let description = `${gems} Gems for reaching Level ${lvl}`;
    if (lvl === 5) description = `Milestone Reward: ${gems} Gems!`;
    if (lvl % 10 === 0) description = `Major Milestone: ${gems} Celestial Gems!`;
    rewards.push({
      level: lvl,
      gems,
      description,
    });
  }
  return rewards;
}

/**
 * Returns all currently claimable rewards that the player has earned but not yet claimed.
 */
export function getUnclaimedRewards(profile: PlayerProfile): AccountLevelReward[] {
  const claimed = new Set(profile.claimedLevelRewards || []);
  const unclaimed: AccountLevelReward[] = [];

  for (let lvl = 2; lvl <= profile.accountLevel; lvl++) {
    if (!claimed.has(lvl)) {
      unclaimed.push({
        level: lvl,
        gems: getRewardForAccountLevel(lvl),
        description: `Level ${lvl} Progression Reward`,
      });
    }
  }

  return unclaimed;
}

/**
 * Total unclaimed gems available to claim right now.
 */
export function getTotalUnclaimedGems(profile: PlayerProfile): number {
  return getUnclaimedRewards(profile).reduce((sum, r) => sum + r.gems, 0);
}
