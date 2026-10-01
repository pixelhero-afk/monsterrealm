/**
 * Monster Realms - Arena & Rating System Types
 * Defines data structures for asynchronous PvP:
 * Defense teams, matchmaking, rating tiers, Elo calculations, and highscores.
 */

import { AwakeningStage, ElementType } from './index';

export type ArenaTier =
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'DIAMOND'
  | 'MASTER'
  | 'GRANDMASTER';

export interface ArenaTierConfig {
  tier: ArenaTier;
  title: string;
  minRating: number;
  maxRating: number;
  colorHex: string;
  badgeBg: string;
  borderHex: string;
  iconName: string;
}

export const ARENA_TIERS: Record<ArenaTier, ArenaTierConfig> = {
  BRONZE: {
    tier: 'BRONZE',
    title: 'Bronze Gladiator',
    minRating: 1000,
    maxRating: 1199,
    colorHex: '#B45309',
    badgeBg: 'bg-amber-900/40 text-amber-300 border-amber-700',
    borderHex: '#D97706',
    iconName: 'Shield',
  },
  SILVER: {
    tier: 'SILVER',
    title: 'Silver Centurion',
    minRating: 1200,
    maxRating: 1399,
    colorHex: '#94A3B8',
    badgeBg: 'bg-slate-800/60 text-slate-200 border-slate-500',
    borderHex: '#CBD5E1',
    iconName: 'Shield',
  },
  GOLD: {
    tier: 'GOLD',
    title: 'Gold Paragon',
    minRating: 1400,
    maxRating: 1599,
    colorHex: '#F59E0B',
    badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-400',
    borderHex: '#FBBF24',
    iconName: 'Crown',
  },
  PLATINUM: {
    tier: 'PLATINUM',
    title: 'Platinum Vanguard',
    minRating: 1600,
    maxRating: 1799,
    colorHex: '#2DD4BF',
    badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-400',
    borderHex: '#5EEAD4',
    iconName: 'Star',
  },
  DIAMOND: {
    tier: 'DIAMOND',
    title: 'Diamond Warlord',
    minRating: 1800,
    maxRating: 1999,
    colorHex: '#38BDF8',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400',
    borderHex: '#7DD3FC',
    iconName: 'Sparkles',
  },
  MASTER: {
    tier: 'MASTER',
    title: 'Master Conqueror',
    minRating: 2000,
    maxRating: 2299,
    colorHex: '#A855F7',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400',
    borderHex: '#C084FC',
    iconName: 'Trophy',
  },
  GRANDMASTER: {
    tier: 'GRANDMASTER',
    title: 'Grandmaster Sovereign',
    minRating: 2300,
    maxRating: 99999,
    colorHex: '#F43F5E',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400',
    borderHex: '#FB7185',
    iconName: 'Crown',
  },
};

export function getArenaTier(rating: number): ArenaTierConfig {
  const safeRating = Math.max(1000, rating || 1000);
  if (safeRating >= 2300) return ARENA_TIERS.GRANDMASTER;
  if (safeRating >= 2000) return ARENA_TIERS.MASTER;
  if (safeRating >= 1800) return ARENA_TIERS.DIAMOND;
  if (safeRating >= 1600) return ARENA_TIERS.PLATINUM;
  if (safeRating >= 1400) return ARENA_TIERS.GOLD;
  if (safeRating >= 1200) return ARENA_TIERS.SILVER;
  return ARENA_TIERS.BRONZE;
}

export interface ArenaDefenseMonster {
  variantId: string;
  level: number;
  awakeningStage: AwakeningStage;
  stars?: number;
  slotIndex: number;
  name?: string;
  element?: ElementType;
  power?: number;
}

export interface ArenaSummoner {
  userId: string;
  displayName: string;
  avatarVariantId: string;
  level: number;
  rating: number;
  tier: ArenaTier;
  defensePower: number;
  defenseMonsters: ArenaDefenseMonster[];
  wins: number;
  losses: number;
  rank?: number;
  isNpc?: boolean;
  lastActive?: string;
}

export interface ArenaProfile {
  rating: number;
  tier: ArenaTier;
  rank: number;
  wins: number;
  losses: number;
  defenseWins: number;
  defenseLosses: number;
  tickets: number; // Current Arena wings (default 10)
  maxTickets: number; // 10
  nextTicketInSeconds: number;
  defenseTeam: ArenaDefenseMonster[];
  defensePower: number;
}

export interface ArenaBattleLog {
  id: string;
  type: 'ATTACK' | 'DEFENSE';
  opponentName: string;
  opponentAvatarVariantId: string;
  opponentRating: number;
  isVictory: boolean;
  ratingDelta: number; // e.g. +24 or -12
  timestamp: number;
}

export interface ArenaMatchResult {
  success: boolean;
  isVictory: boolean;
  ratingDelta: number;
  newRating: number;
  newTier: ArenaTier;
  rewards: {
    gold: number;
    summonPoints: number;
    gems: number;
  };
  opponent: {
    userId: string;
    displayName: string;
    oldRating: number;
    newRating: number;
  };
}
