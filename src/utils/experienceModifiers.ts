/**
 * Monster Realms - Party Size Experience Multiplier System
 *
 * Requirements:
 * 1 unit  -> 200% (2.00x) -> Solo Bonus: +100%
 * 2 units -> 175% (1.75x) -> Party Bonus: +75%
 * 3 units -> 150% (1.50x) -> Party Bonus: +50%
 * 4 units -> 125% (1.25x) -> Party Bonus: +25%
 * 5 units -> 100% (1.00x) -> Party Bonus: +0%
 */

export interface PartyXpBreakdown {
  partySize: number;
  multiplier: number;
  bonusPercentText: string;
  bonusLabel: string;
  baseExp: number;
  totalExp: number;
}

export const PARTY_SIZE_XP_MULTIPLIERS: Record<number, number> = {
  1: 2.0,
  2: 1.75,
  3: 1.5,
  4: 1.25,
  5: 1.0,
};

export function getPartySizeXpMultiplier(partySize: number): number {
  const safeSize = Math.max(1, Math.min(5, Math.floor(partySize || 1)));
  return PARTY_SIZE_XP_MULTIPLIERS[safeSize] ?? 1.0;
}

export function calculatePartyXpReward(baseExp: number, partySize: number): PartyXpBreakdown {
  const safeSize = Math.max(1, Math.min(5, Math.floor(partySize || 1)));
  const multiplier = getPartySizeXpMultiplier(safeSize);
  const totalExp = Math.round(baseExp * multiplier);

  const bonusPercent = Math.round((multiplier - 1.0) * 100);
  const bonusLabel = safeSize === 1 ? 'Solo Bonus' : 'Party Bonus';
  const bonusPercentText = `+${bonusPercent}%`;

  return {
    partySize: safeSize,
    multiplier,
    bonusPercentText,
    bonusLabel,
    baseExp,
    totalExp,
  };
}
