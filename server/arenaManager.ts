/**
 * Monster Realms - Server-Side Arena & Rating Manager
 * Authoritative management for asynchronous PvP:
 * - Defense lineups and power calculations
 * - Rating changes & Tier promotions
 * - Highscore Leaderboard with pre-seeded realm champions and dynamic player merging
 * - Smart matchmaking against opponent defense squads
 */

import {
  ArenaDefenseMonster,
  ArenaSummoner,
  ArenaTier,
  ArenaBattleLog,
  getArenaTier,
} from '../src/types/arena';
import { MONSTER_VARIANTS } from '../src/data/monsters';
import { calculateEffectiveStats } from '../src/engine/statCalculator';
import { AwakeningStage } from '../src/types';

// Pre-seeded highscore roster across Grandmaster down to Bronze
export const SEEDED_ARENA_RIVALS: ArenaSummoner[] = [
  {
    userId: 'rival_gm_valerie',
    displayName: 'Grandmaster Valerie',
    avatarVariantId: 'luminary_light',
    level: 50,
    rating: 2650,
    tier: 'GRANDMASTER',
    defensePower: 26800,
    wins: 142,
    losses: 12,
    isNpc: true,
    lastActive: 'Just now',
    defenseMonsters: [
      { variantId: 'luminary_light', level: 50, awakeningStage: 'AWAKENED', slotIndex: 0 },
      { variantId: 'pyrosaur_fire', level: 50, awakeningStage: 'AWAKENED', slotIndex: 1 },
      { variantId: 'tideguard_water', level: 50, awakeningStage: 'AWAKENED', slotIndex: 2 },
      { variantId: 'shadowstalker_dark', level: 48, awakeningStage: 'AWAKENED', slotIndex: 3 },
      { variantId: 'floraweaver_grass', level: 48, awakeningStage: 'AWAKENED', slotIndex: 4 },
    ],
  },
  {
    userId: 'rival_gm_ignis',
    displayName: 'Archmage Ignis',
    avatarVariantId: 'pyrosaur_fire',
    level: 48,
    rating: 2510,
    tier: 'GRANDMASTER',
    defensePower: 24500,
    wins: 128,
    losses: 16,
    isNpc: true,
    lastActive: '5m ago',
    defenseMonsters: [
      { variantId: 'pyrosaur_fire', level: 48, awakeningStage: 'AWAKENED', slotIndex: 0 },
      { variantId: 'shadowstalker_dark', level: 48, awakeningStage: 'AWAKENED', slotIndex: 1 },
      { variantId: 'luminary_light', level: 46, awakeningStage: 'AWAKENED', slotIndex: 2 },
      { variantId: 'floraweaver_grass', level: 46, awakeningStage: 'AWAKENED', slotIndex: 3 },
      { variantId: 'tideguard_water', level: 45, awakeningStage: 'AWAKENED', slotIndex: 4 },
    ],
  },
  {
    userId: 'rival_gm_cynthia',
    displayName: 'Sovereign Cynthia',
    avatarVariantId: 'luminary_light',
    level: 46,
    rating: 2380,
    tier: 'GRANDMASTER',
    defensePower: 22800,
    wins: 110,
    losses: 18,
    isNpc: true,
    lastActive: '12m ago',
    defenseMonsters: [
      { variantId: 'luminary_light', level: 46, awakeningStage: 'AWAKENED', slotIndex: 0 },
      { variantId: 'tideguard_water', level: 45, awakeningStage: 'AWAKENED', slotIndex: 1 },
      { variantId: 'pyrosaur_fire', level: 45, awakeningStage: 'AWAKENED', slotIndex: 2 },
      { variantId: 'floraweaver_grass', level: 44, awakeningStage: 'AWAKENED', slotIndex: 3 },
      { variantId: 'shadowstalker_dark', level: 44, awakeningStage: 'AWAKENED', slotIndex: 4 },
    ],
  },
  {
    userId: 'rival_master_ren',
    displayName: 'Shadow Weaver Ren',
    avatarVariantId: 'shadowstalker_dark',
    level: 44,
    rating: 2240,
    tier: 'MASTER',
    defensePower: 20400,
    wins: 95,
    losses: 20,
    isNpc: true,
    lastActive: '22m ago',
    defenseMonsters: [
      { variantId: 'shadowstalker_dark', level: 44, awakeningStage: 'AWAKENED', slotIndex: 0 },
      { variantId: 'pyrosaur_fire', level: 42, awakeningStage: 'AWAKENED', slotIndex: 1 },
      { variantId: 'tideguard_water', level: 42, awakeningStage: 'AWAKENED', slotIndex: 2 },
      { variantId: 'luminary_light', level: 41, awakeningStage: 'AWAKENED', slotIndex: 3 },
      { variantId: 'floraweaver_grass', level: 40, awakeningStage: 'AWAKENED', slotIndex: 4 },
    ],
  },
  {
    userId: 'rival_master_lyra',
    displayName: 'Frost Empress Lyra',
    avatarVariantId: 'tideguard_water',
    level: 42,
    rating: 2150,
    tier: 'MASTER',
    defensePower: 18900,
    wins: 88,
    losses: 22,
    isNpc: true,
    lastActive: '45m ago',
    defenseMonsters: [
      { variantId: 'tideguard_water', level: 42, awakeningStage: 'AWAKENED', slotIndex: 0 },
      { variantId: 'floraweaver_grass', level: 41, awakeningStage: 'AWAKENED', slotIndex: 1 },
      { variantId: 'luminary_light', level: 40, awakeningStage: 'AWAKENED', slotIndex: 2 },
      { variantId: 'pyrosaur_fire', level: 40, awakeningStage: 'AWAKENED', slotIndex: 3 },
      { variantId: 'shadowstalker_dark', level: 38, awakeningStage: 'AWAKENED', slotIndex: 4 },
    ],
  },
  {
    userId: 'rival_master_chloe',
    displayName: 'Astral Knight Chloe',
    avatarVariantId: 'luminary_light',
    level: 40,
    rating: 2040,
    tier: 'MASTER',
    defensePower: 17200,
    wins: 76,
    losses: 24,
    isNpc: true,
    lastActive: '1h ago',
    defenseMonsters: [
      { variantId: 'luminary_light', level: 40, awakeningStage: 'AWAKENED', slotIndex: 0 },
      { variantId: 'pyrosaur_fire', level: 38, awakeningStage: 'AWAKENED', slotIndex: 1 },
      { variantId: 'tideguard_water', level: 38, awakeningStage: 'AWAKENED', slotIndex: 2 },
      { variantId: 'floraweaver_grass', level: 36, awakeningStage: 'AWAKENED', slotIndex: 3 },
      { variantId: 'shadowstalker_dark', level: 36, awakeningStage: 'AWAKENED', slotIndex: 4 },
    ],
  },
  {
    userId: 'rival_dia_zephyr',
    displayName: 'Champion Zephyr',
    avatarVariantId: 'pyrosaur_fire',
    level: 38,
    rating: 1920,
    tier: 'DIAMOND',
    defensePower: 15600,
    wins: 65,
    losses: 26,
    isNpc: true,
    lastActive: '2h ago',
    defenseMonsters: [
      { variantId: 'pyrosaur_fire', level: 38, awakeningStage: 'AWAKENED', slotIndex: 0 },
      { variantId: 'shadowstalker_dark', level: 36, awakeningStage: 'AWAKENED', slotIndex: 1 },
      { variantId: 'floraweaver_grass', level: 36, awakeningStage: 'AWAKENED', slotIndex: 2 },
      { variantId: 'tideguard_water', level: 35, awakeningStage: 'AWAKENED', slotIndex: 3 },
      { variantId: 'luminary_light', level: 34, awakeningStage: 'AWAKENED', slotIndex: 4 },
    ],
  },
  {
    userId: 'rival_dia_roland',
    displayName: 'Warlord Roland',
    avatarVariantId: 'tideguard_water',
    level: 36,
    rating: 1840,
    tier: 'DIAMOND',
    defensePower: 14100,
    wins: 58,
    losses: 27,
    isNpc: true,
    lastActive: '3h ago',
    defenseMonsters: [
      { variantId: 'tideguard_water', level: 36, awakeningStage: 'AWAKENED', slotIndex: 0 },
      { variantId: 'pyrosaur_fire', level: 34, awakeningStage: 'AWAKENED', slotIndex: 1 },
      { variantId: 'luminary_light', level: 34, awakeningStage: 'AWAKENED', slotIndex: 2 },
      { variantId: 'floraweaver_grass', level: 32, awakeningStage: 'AWAKENED', slotIndex: 3 },
      { variantId: 'shadowstalker_dark', level: 32, awakeningStage: 'AWAKENED', slotIndex: 4 },
    ],
  },
  {
    userId: 'rival_plat_vance',
    displayName: 'Inquisitor Vance',
    avatarVariantId: 'luminary_light',
    level: 33,
    rating: 1740,
    tier: 'PLATINUM',
    defensePower: 12500,
    wins: 50,
    losses: 25,
    isNpc: true,
    lastActive: '4h ago',
    defenseMonsters: [
      { variantId: 'luminary_light', level: 33, awakeningStage: 'AWAKENED', slotIndex: 0 },
      { variantId: 'pyrosaur_fire', level: 30, awakeningStage: 'AWAKENED', slotIndex: 1 },
      { variantId: 'floraweaver_grass', level: 30, awakeningStage: 'AWAKENED', slotIndex: 2 },
      { variantId: 'tideguard_water', level: 28, awakeningStage: 'BASE', slotIndex: 3 },
      { variantId: 'shadowstalker_dark', level: 28, awakeningStage: 'BASE', slotIndex: 4 },
    ],
  },
  {
    userId: 'rival_plat_maya',
    displayName: 'Stormcaller Maya',
    avatarVariantId: 'floraweaver_grass',
    level: 30,
    rating: 1650,
    tier: 'PLATINUM',
    defensePower: 11200,
    wins: 44,
    losses: 22,
    isNpc: true,
    lastActive: '5h ago',
    defenseMonsters: [
      { variantId: 'floraweaver_grass', level: 30, awakeningStage: 'AWAKENED', slotIndex: 0 },
      { variantId: 'tideguard_water', level: 28, awakeningStage: 'AWAKENED', slotIndex: 1 },
      { variantId: 'pyrosaur_fire', level: 28, awakeningStage: 'BASE', slotIndex: 2 },
      { variantId: 'luminary_light', level: 26, awakeningStage: 'BASE', slotIndex: 3 },
      { variantId: 'shadowstalker_dark', level: 25, awakeningStage: 'BASE', slotIndex: 4 },
    ],
  },
  {
    userId: 'rival_gold_soren',
    displayName: 'Spellblade Soren',
    avatarVariantId: 'pyrosaur_fire',
    level: 27,
    rating: 1540,
    tier: 'GOLD',
    defensePower: 9800,
    wins: 38,
    losses: 20,
    isNpc: true,
    lastActive: '6h ago',
    defenseMonsters: [
      { variantId: 'pyrosaur_fire', level: 27, awakeningStage: 'AWAKENED', slotIndex: 0 },
      { variantId: 'shadowstalker_dark', level: 25, awakeningStage: 'AWAKENED', slotIndex: 1 },
      { variantId: 'tideguard_water', level: 24, awakeningStage: 'BASE', slotIndex: 2 },
      { variantId: 'luminary_light', level: 22, awakeningStage: 'BASE', slotIndex: 3 },
      { variantId: 'floraweaver_grass', level: 22, awakeningStage: 'BASE', slotIndex: 4 },
    ],
  },
  {
    userId: 'rival_gold_nadia',
    displayName: 'Tactician Nadia',
    avatarVariantId: 'floraweaver_grass',
    level: 24,
    rating: 1470,
    tier: 'GOLD',
    defensePower: 8500,
    wins: 32,
    losses: 18,
    isNpc: true,
    lastActive: '8h ago',
    defenseMonsters: [
      { variantId: 'floraweaver_grass', level: 24, awakeningStage: 'AWAKENED', slotIndex: 0 },
      { variantId: 'luminary_light', level: 22, awakeningStage: 'BASE', slotIndex: 1 },
      { variantId: 'tideguard_water', level: 22, awakeningStage: 'BASE', slotIndex: 2 },
      { variantId: 'pyrosaur_fire', level: 20, awakeningStage: 'BASE', slotIndex: 3 },
      { variantId: 'shadowstalker_dark', level: 20, awakeningStage: 'BASE', slotIndex: 4 },
    ],
  },
  {
    userId: 'rival_gold_ronald',
    displayName: 'Warden Ronald',
    avatarVariantId: 'tideguard_water',
    level: 22,
    rating: 1410,
    tier: 'GOLD',
    defensePower: 7600,
    wins: 28,
    losses: 16,
    isNpc: true,
    lastActive: '10h ago',
    defenseMonsters: [
      { variantId: 'tideguard_water', level: 22, awakeningStage: 'BASE', slotIndex: 0 },
      { variantId: 'pyrosaur_fire', level: 20, awakeningStage: 'BASE', slotIndex: 1 },
      { variantId: 'luminary_light', level: 19, awakeningStage: 'BASE', slotIndex: 2 },
      { variantId: 'floraweaver_grass', level: 18, awakeningStage: 'BASE', slotIndex: 3 },
      { variantId: 'shadowstalker_dark', level: 18, awakeningStage: 'BASE', slotIndex: 4 },
    ],
  },
  {
    userId: 'rival_silv_kael',
    displayName: 'Beastmaster Kael',
    avatarVariantId: 'pyrosaur_fire',
    level: 19,
    rating: 1340,
    tier: 'SILVER',
    defensePower: 6200,
    wins: 22,
    losses: 14,
    isNpc: true,
    lastActive: '12h ago',
    defenseMonsters: [
      { variantId: 'pyrosaur_fire', level: 19, awakeningStage: 'BASE', slotIndex: 0 },
      { variantId: 'tideguard_water', level: 17, awakeningStage: 'BASE', slotIndex: 1 },
      { variantId: 'floraweaver_grass', level: 16, awakeningStage: 'BASE', slotIndex: 2 },
      { variantId: 'luminary_light', level: 15, awakeningStage: 'BASE', slotIndex: 3 },
      { variantId: 'shadowstalker_dark', level: 15, awakeningStage: 'BASE', slotIndex: 4 },
    ],
  },
  {
    userId: 'rival_silv_tara',
    displayName: 'Runekeeper Tara',
    avatarVariantId: 'luminary_light',
    level: 16,
    rating: 1250,
    tier: 'SILVER',
    defensePower: 4800,
    wins: 16,
    losses: 12,
    isNpc: true,
    lastActive: '14h ago',
    defenseMonsters: [
      { variantId: 'luminary_light', level: 16, awakeningStage: 'BASE', slotIndex: 0 },
      { variantId: 'floraweaver_grass', level: 15, awakeningStage: 'BASE', slotIndex: 1 },
      { variantId: 'pyrosaur_fire', level: 14, awakeningStage: 'BASE', slotIndex: 2 },
      { variantId: 'tideguard_water', level: 14, awakeningStage: 'BASE', slotIndex: 3 },
    ],
  },
  {
    userId: 'rival_bronze_leo',
    displayName: 'Apprentice Leo',
    avatarVariantId: 'pyrosaur_fire',
    level: 12,
    rating: 1140,
    tier: 'BRONZE',
    defensePower: 3200,
    wins: 10,
    losses: 8,
    isNpc: true,
    lastActive: '1d ago',
    defenseMonsters: [
      { variantId: 'pyrosaur_fire', level: 12, awakeningStage: 'BASE', slotIndex: 0 },
      { variantId: 'tideguard_water', level: 11, awakeningStage: 'BASE', slotIndex: 1 },
      { variantId: 'floraweaver_grass', level: 10, awakeningStage: 'BASE', slotIndex: 2 },
      { variantId: 'luminary_light', level: 10, awakeningStage: 'BASE', slotIndex: 3 },
    ],
  },
  {
    userId: 'rival_bronze_finlay',
    displayName: 'Scout Finlay',
    avatarVariantId: 'tideguard_water',
    level: 9,
    rating: 1070,
    tier: 'BRONZE',
    defensePower: 2100,
    wins: 6,
    losses: 6,
    isNpc: true,
    lastActive: '1d ago',
    defenseMonsters: [
      { variantId: 'tideguard_water', level: 9, awakeningStage: 'BASE', slotIndex: 0 },
      { variantId: 'pyrosaur_fire', level: 8, awakeningStage: 'BASE', slotIndex: 1 },
      { variantId: 'floraweaver_grass', level: 8, awakeningStage: 'BASE', slotIndex: 2 },
    ],
  },
  {
    userId: 'rival_bronze_rowan',
    displayName: 'Novice Rowan',
    avatarVariantId: 'floraweaver_grass',
    level: 5,
    rating: 1010,
    tier: 'BRONZE',
    defensePower: 1200,
    wins: 2,
    losses: 4,
    isNpc: true,
    lastActive: '2d ago',
    defenseMonsters: [
      { variantId: 'floraweaver_grass', level: 5, awakeningStage: 'BASE', slotIndex: 0 },
      { variantId: 'pyrosaur_fire', level: 4, awakeningStage: 'BASE', slotIndex: 1 },
      { variantId: 'tideguard_water', level: 4, awakeningStage: 'BASE', slotIndex: 2 },
    ],
  },
];

// Persistent Battle Logs Store per player
export const ARENA_LOGS_STORE: Record<string, ArenaBattleLog[]> = {};

/**
 * Calculate Combat Power for a single monster based on effective combat stats.
 */
export function calculateMonsterCombatPower(
  variantId: string,
  level: number,
  awakeningStage: AwakeningStage = 'BASE'
): number {
  const variant = MONSTER_VARIANTS[variantId] || Object.values(MONSTER_VARIANTS)[0];
  if (!variant) return 200;

  const stats = calculateEffectiveStats({
    variant,
    level,
    awakeningStage,
  }).finalStats;

  const power =
    stats.hp * 0.2 +
    stats.attack * 1.5 +
    stats.defense * 1.2 +
    stats.speed * 2.0 +
    stats.critRate * 500 +
    stats.critDamage * 300;

  return Math.round(power);
}

/**
 * Calculate total Combat Power for an entire defense team.
 */
export function calculateTeamCombatPower(monsters: ArenaDefenseMonster[]): number {
  return monsters.reduce((sum, m) => {
    return sum + calculateMonsterCombatPower(m.variantId, m.level, m.awakeningStage);
  }, 0);
}

/**
 * Generates or retrieves 5 matched opponents for matchmaking.
 */
export function getMatchedOpponents(
  playerRating: number,
  playerId: string,
  allSummoners: ArenaSummoner[]
): ArenaSummoner[] {
  // Exclude current player
  const candidates = allSummoners.filter((s) => s.userId !== playerId);

  // Sort by rating distance
  candidates.sort(
    (a, b) => Math.abs(a.rating - playerRating) - Math.abs(b.rating - playerRating)
  );

  // Take top 5 closest candidates
  const opponents = candidates.slice(0, 5);

  // Enrich with display metadata (elements, names, individual monster powers)
  return opponents.map((opp) => {
    const enrichedMonsters = opp.defenseMonsters.map((m, idx) => {
      const v = MONSTER_VARIANTS[m.variantId];
      return {
        ...m,
        slotIndex: idx,
        name: v?.name || m.variantId,
        element: v?.element || 'FIRE',
        power: calculateMonsterCombatPower(m.variantId, m.level, m.awakeningStage),
      };
    });

    return {
      ...opp,
      defenseMonsters: enrichedMonsters,
      defensePower: calculateTeamCombatPower(enrichedMonsters),
    };
  });
}

/**
 * Calculates Elo rating delta for an Arena battle.
 */
export function calculateRatingDelta(
  playerRating: number,
  opponentRating: number,
  isVictory: boolean
): number {
  const ratingDiff = opponentRating - playerRating;

  if (isVictory) {
    // If defeating higher rated opponent: larger gain (+24 to +32)
    // If defeating lower rated opponent: smaller gain (+16 to +20)
    let gain = 20 + Math.round(ratingDiff / 25);
    return Math.max(14, Math.min(35, gain));
  } else {
    // Defeat: lose 8 to 15 rating
    let loss = 12 - Math.round(ratingDiff / 40);
    return -Math.max(6, Math.min(18, loss));
  }
}
