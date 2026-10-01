/**
 * Monster Realms - Server-Authoritative Backend
 * Express API with server-side validation and Vite integration
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';
import { createServer as createViteServer } from 'vite';
import {
  AwakeningStage,
  EquipmentItem,
  PlayerMonster,
  PlayerProfile,
  PvEStage,
  SummonBanner,
  SummonResult,
  isDevAccount,
  ChatMessage,
  DirectConversation,
  MonsterVariant,
  Rarity,
  ElementType,
  NewsItem,
  EventGiftPayload,
  MailItem,
} from './src/types';
import {
  ArenaSummoner,
  ArenaProfile,
  ArenaBattleLog,
  ArenaDefenseMonster,
  getArenaTier,
} from './src/types/arena';
import {
  SEEDED_ARENA_RIVALS,
  ARENA_LOGS_STORE,
  calculateMonsterCombatPower,
  calculateTeamCombatPower,
  getMatchedOpponents,
  calculateRatingDelta,
} from './server/arenaManager';
import { MONSTER_VARIANTS, MONSTER_FAMILIES } from './src/data/monsters';
import { STARTER_EQUIPMENT, rollEquipmentPiece, rollDungeonEquipmentRarity } from './src/data/equipment';
import { SUMMON_BANNERS } from './src/data/banners';
import {
  CONTINENTS,
  PVE_STAGES,
  DUNGEON_STAGES,
  ALL_STAGES,
  getStageById,
  isStageUnlocked,
  isContinentUnlocked,
  getNextStage,
} from './src/data/stages';
import {
  ELEMENTAL_DUNGEONS,
  ELEMENTAL_DUNGEON_STAGES,
  rollElementalStoneDrops,
  getAwakeningCost,
  getDefaultAwakeningCost,
  setAwakeningCostOverride,
  setAllAwakeningCostOverrides,
  getAllAwakeningCostOverrides,
  AwakeningCost,
} from './src/data/elementalDungeons';
import {
  ElementalDungeonType,
  ElementalStonesInventory,
  ScrollType,
  ScrollsInventory,
  ShopItem,
} from './src/types';
import {
  syncRotatingShop,
  generateDailyShopItems,
  ROTATION_INTERVAL_MS,
} from './src/data/rotatingShop';
import {
  createDeterministicStarterTeam,
  createInitialPlayerProfile,
  STARTER_VARIANT_IDS,
} from './src/services/starterTeam';
import {
  syncDailyMissionsState,
  recordBattleWinProgress,
  recordSummonProgress,
  recordPlaytimeTick,
  createDefaultDailyMissions,
  claimDailyMission,
  claimAllClearBonus,
  claimAllAvailableDailyMissions,
  DAILY_MISSION_DEFINITIONS,
  ALL_CLEAR_REWARD_GEMS,
} from './src/services/dailyMissionsService';
import {
  createDefaultMailboxItems,
  claimMailItem,
  claimAllMail,
  deleteMailItem,
  clearClaimedMail,
  addFriendGiftMail,
  addGameGiftMail,
  syncMailboxState,
} from './src/services/mailboxService';
import { getRewardForAccountLevel } from './src/services/accountProgression';
import { DeterministicRNG } from './src/engine/rng';
import {
  getMonsterStars,
  getSynthesisStarCost,
  MAX_MONSTER_STARS,
  validateSynthesisEligibility,
} from './src/utils/monsterStars';
import { getMonsterLevelUpCost, getTotalLevelUpCost } from './src/utils/monsterLevelCost';
import { spriteStandardizer } from './server/spriteStandardizer';
import { spriteWatcher } from './server/spriteWatcher';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Serve canonical character assets directly from public/assets/characters
app.use('/assets/characters', express.static(path.join(process.cwd(), 'public/assets/characters')));

// Serve direct standardized assets path
app.use('/assets/standardized', express.static(path.join(process.cwd(), 'public/assets/standardized')));

// In-Memory Authoritative Data Store per session/player
interface ServerPlayerState {
  profile: PlayerProfile;
  monsters: PlayerMonster[];
  equipment: EquipmentItem[];
  bannerPity: Record<string, number>; // bannerId -> count
}

// Disabled Units Persistence & Startup loader
const DISABLED_UNITS: Set<string> = new Set();

function loadDisabledUnitsIntoMemory(): void {
  try {
    const disabledUnitsFile = path.join(process.cwd(), 'src', 'data', 'disabled_units.json');
    if (fs.existsSync(disabledUnitsFile)) {
      const data = JSON.parse(fs.readFileSync(disabledUnitsFile, 'utf8'));
      if (data.disabledVariantIds && Array.isArray(data.disabledVariantIds)) {
        DISABLED_UNITS.clear();
        data.disabledVariantIds.forEach((id: string) => {
          if (typeof id === 'string') {
            DISABLED_UNITS.add(id);
            if (MONSTER_VARIANTS[id]) {
              MONSTER_VARIANTS[id].disabled = true;
            }
          }
        });
        console.log(`[DisabledUnits] Loaded ${DISABLED_UNITS.size} disabled units into server memory.`);
      }
    }
  } catch (err) {
    console.warn('[DisabledUnits] Could not read disabled_units.json on startup:', err);
  }
}

function saveDisabledUnitsToFile(): void {
  try {
    const disabledUnitsFile = path.join(process.cwd(), 'src', 'data', 'disabled_units.json');
    const data = {
      disabledVariantIds: Array.from(DISABLED_UNITS),
    };
    fs.writeFileSync(disabledUnitsFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[DisabledUnits] Failed to write disabled_units.json:', err);
  }
}

// Custom Units Persistence & Startup loader
function loadCustomUnitsIntoMemory(): void {
  try {
    const customUnitsFile = path.join(process.cwd(), 'src', 'data', 'custom_units.json');
    if (fs.existsSync(customUnitsFile)) {
      const data = JSON.parse(fs.readFileSync(customUnitsFile, 'utf8'));
      if (data.families && Array.isArray(data.families)) {
        data.families.forEach((f: any) => {
          if (f && f.familyId) {
            MONSTER_FAMILIES[f.familyId] = f;
          }
        });
      }
      if (data.variants && Array.isArray(data.variants)) {
        data.variants.forEach((v: any) => {
          if (v && v.variantId) {
            MONSTER_VARIANTS[v.variantId] = v;
          }
        });
      }
      console.log(`[CustomUnits] Loaded ${data.families?.length || 0} custom families and ${data.variants?.length || 0} custom variants into server memory.`);
    }
  } catch (err) {
    console.warn('[CustomUnits] Could not read custom_units.json on startup:', err);
  }
}

// Awakening Cost Overrides Persistence & Startup loader
function loadAwakeningCostsIntoMemory(): void {
  try {
    const costsFile = path.join(process.cwd(), 'src', 'data', 'awakening_costs.json');
    if (fs.existsSync(costsFile)) {
      const data = JSON.parse(fs.readFileSync(costsFile, 'utf8'));
      if (data && typeof data === 'object') {
        const overrides = data.overrides || data;
        setAllAwakeningCostOverrides(overrides);
        console.log(`[AwakeningCosts] Loaded ${Object.keys(overrides).length} custom awakening costs into server memory.`);
      }
    }
  } catch (err) {
    console.warn('[AwakeningCosts] Could not read awakening_costs.json on startup:', err);
  }
}

function saveAwakeningCostsToFile(): void {
  try {
    const costsFile = path.join(process.cwd(), 'src', 'data', 'awakening_costs.json');
    const data = {
      overrides: getAllAwakeningCostOverrides(),
    };
    fs.writeFileSync(costsFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[AwakeningCosts] Failed to write awakening_costs.json:', err);
  }
}

loadCustomUnitsIntoMemory();
loadDisabledUnitsIntoMemory();
loadAwakeningCostsIntoMemory();

// ============================================================
// News & Updates Database Persistence
// ============================================================
const NEWS_DB_FILE = path.join(process.cwd(), 'src', 'data', 'news_database.json');
let NEWS_STORE: NewsItem[] = [];

function loadNewsDatabase(): void {
  try {
    if (fs.existsSync(NEWS_DB_FILE)) {
      const raw = fs.readFileSync(NEWS_DB_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        NEWS_STORE = data;
        console.log(`[NewsDatabase] Loaded ${NEWS_STORE.length} news announcements.`);
        return;
      }
    }
  } catch (err) {
    console.warn('[NewsDatabase] Could not read news_database.json on startup:', err);
  }
  NEWS_STORE = [];
}

function saveNewsDatabase(): void {
  try {
    fs.writeFileSync(NEWS_DB_FILE, JSON.stringify(NEWS_STORE, null, 2), 'utf8');
  } catch (err) {
    console.error('[NewsDatabase] Failed to write news_database.json:', err);
  }
}

// ============================================================
// Summon Banners Database Persistence
// ============================================================
const BANNER_DB_FILE = path.join(process.cwd(), 'src', 'data', 'banner_database.json');
let BANNER_STORE: SummonBanner[] = [];

function loadBannerDatabase(): void {
  try {
    if (fs.existsSync(BANNER_DB_FILE)) {
      const raw = fs.readFileSync(BANNER_DB_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        BANNER_STORE = data;
        console.log(`[BannerDatabase] Loaded ${BANNER_STORE.length} summon banners.`);
        return;
      }
    }
  } catch (err) {
    console.warn('[BannerDatabase] Could not read banner_database.json on startup:', err);
  }
  BANNER_STORE = [...SUMMON_BANNERS];
}

function saveBannerDatabase(): void {
  try {
    fs.writeFileSync(BANNER_DB_FILE, JSON.stringify(BANNER_STORE, null, 2), 'utf8');
  } catch (err) {
    console.error('[BannerDatabase] Failed to write banner_database.json:', err);
  }
}

loadNewsDatabase();
loadBannerDatabase();

/**
 * Cryptographically Secure Random Number Generation
 * Complies with strict server-side authority guidelines.
 * Never uses pseudo-random Math.random() or client-predictable RNGs.
 */
function secureRandomFloat(): number {
  const buf = crypto.randomBytes(4);
  return buf.readUInt32BE(0) / 0x100000000;
}

function secureRandomChoice<T>(items: T[]): T {
  if (items.length === 0) throw new Error('Cannot pick from empty list');
  const index = crypto.randomInt(0, items.length);
  return items[index];
}

// Persistent Server-Side Database File
const PLAYER_DB_FILE = path.join(process.cwd(), 'src', 'data', 'player_database.json');

const PLAYER_STORE: Record<string, ServerPlayerState> = {};

function loadPlayerDatabase(): void {
  try {
    if (fs.existsSync(PLAYER_DB_FILE)) {
      const raw = fs.readFileSync(PLAYER_DB_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([pId, pState]: [string, any]) => {
          if (pState && pState.profile && Array.isArray(pState.monsters)) {
            PLAYER_STORE[pId] = pState;
          }
        });
        console.log(`[PlayerDatabase] Restored ${Object.keys(PLAYER_STORE).length} player accounts from persistent database.`);
      }
    }
  } catch (err) {
    console.warn('[PlayerDatabase] Could not read player_database.json on startup:', err);
  }
}

function savePlayerToDatabase(playerId: string): void {
  try {
    const player = PLAYER_STORE[playerId];
    if (!player) return;
    let dbData: Record<string, any> = {};
    if (fs.existsSync(PLAYER_DB_FILE)) {
      try {
        dbData = JSON.parse(fs.readFileSync(PLAYER_DB_FILE, 'utf8')) || {};
      } catch (_) {
        dbData = {};
      }
    }
    dbData[playerId] = player;
    fs.writeFileSync(PLAYER_DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
  } catch (err) {
    console.error(`[PlayerDatabase] Failed writing player data for ${playerId}:`, err);
  }
}

loadPlayerDatabase();

/**
 * Server-Authoritative Stamina Regeneration Engine
 * 
 * Rules:
 * - Calculated strictly on the backend using server-authoritative Date.now().
 * - Never calculates or accepts elapsed time from the client side (protects against clock changes).
 * - Regenerates 1 energy point every 180 seconds (3 minutes) up to maxEnergy (default 100).
 * - Accurately carries over remainder milliseconds toward the next energy point.
 */
function calculateServerStaminaRegen(player: ServerPlayerState): {
  gained: number;
  currentEnergy: number;
  maxEnergy: number;
  nextRegenSeconds: number;
  serverTime: number;
} {
  const now = Date.now(); // SERVER TIME ONLY
  const cur = player.profile.currencies;
  const maxEnergy = cur.maxEnergy || 100;
  const regenIntervalMs = 180000; // 3 minutes = 180,000 ms per 1 Stamina point

  // Initialize or sanitize lastEnergyRegenTimestamp
  if (!cur.lastEnergyRegenTimestamp || cur.lastEnergyRegenTimestamp > now) {
    cur.lastEnergyRegenTimestamp = now;
  }

  let currentEnergy = cur.energy ?? 100;

  if (currentEnergy >= maxEnergy) {
    cur.lastEnergyRegenTimestamp = now;
    return {
      gained: 0,
      currentEnergy,
      maxEnergy,
      nextRegenSeconds: 0,
      serverTime: now,
    };
  }

  const elapsedMs = Math.max(0, now - cur.lastEnergyRegenTimestamp);
  let gained = 0;

  if (elapsedMs >= regenIntervalMs) {
    const potentialGain = Math.floor(elapsedMs / regenIntervalMs);
    const needed = Math.max(0, maxEnergy - currentEnergy);
    gained = Math.min(potentialGain, needed);

    currentEnergy = Math.min(maxEnergy, currentEnergy + gained);
    cur.energy = currentEnergy;

    if (currentEnergy >= maxEnergy) {
      cur.lastEnergyRegenTimestamp = now;
    } else {
      // Carry forward remainder ms so player never loses partial regen progress
      cur.lastEnergyRegenTimestamp += gained * regenIntervalMs;
    }

    savePlayerToDatabase(player.profile.playerId);
  }

  const timeSinceLastRegen = Math.max(0, now - cur.lastEnergyRegenTimestamp);
  const nextRegenSeconds =
    currentEnergy >= maxEnergy
      ? 0
      : Math.max(1, Math.ceil((regenIntervalMs - timeSinceLastRegen) / 1000));

  return {
    gained,
    currentEnergy,
    maxEnergy,
    nextRegenSeconds,
    serverTime: now,
  };
}

function getOrCreatePlayer(playerId: string = 'player_default'): ServerPlayerState {
  if (!PLAYER_STORE[playerId]) {
    const profile = createInitialPlayerProfile(playerId);
    const monsters = createDeterministicStarterTeam(playerId);
    const equipment = [...STARTER_EQUIPMENT];

    // Add NekoHime to the roster so she can be tested across Party, Monster screen, and Battle
    const nekohimeGrass: PlayerMonster = {
      instanceId: `inst_${playerId}_nekohime_grass`,
      variantId: 'var_nekohime_grass',
      playerId,
      level: 10,
      experience: 0,
      awakeningStage: 'BASE',
      equipmentIds: [],
      skillLevels: {},
      locked: false,
      acquiredAt: Date.now(),
    };
    monsters.push(nekohimeGrass);

    PLAYER_STORE[playerId] = {
      profile,
      monsters,
      equipment,
      bannerPity: {},
    };
    savePlayerToDatabase(playerId);
  }

  // Energy regeneration check: 1 energy every 3 minutes (180,000 ms)
  const player = PLAYER_STORE[playerId];

  // Ensure existing players also have NekoHime for immediate testing
  if (!player.monsters.some((m) => (m.variantId || '').includes('nekohime'))) {
    player.monsters.push({
      instanceId: `inst_${playerId}_nekohime_grass`,
      variantId: 'var_nekohime_grass',
      playerId,
      level: 10,
      stars: 5,
      experience: 0,
      awakeningStage: 'BASE',
      equipmentIds: [],
      skillLevels: {},
      locked: false,
      acquiredAt: Date.now(),
    });
  }

  // Ensure player has unlocked starter catalysts for immediate Synthesis testing (matching species pairs)
  if (!player.monsters.some((m) => m.instanceId.includes('neko_synth_pair'))) {
    player.monsters.push(
      // The exact example: Water Nekohime (Host) + Fire Nekohime (Catalyst) -> 6★ Water Nekohime!
      {
        instanceId: `inst_${playerId}_neko_synth_pair_water`,
        variantId: 'var_nekohime_water',
        playerId,
        level: 10,
        stars: 5,
        experience: 0,
        awakeningStage: 'BASE',
        equipmentIds: [],
        skillLevels: {},
        locked: false,
        acquiredAt: Date.now(),
      },
      {
        instanceId: `inst_${playerId}_neko_synth_pair_fire`,
        variantId: 'var_nekohime_fire',
        playerId,
        level: 10,
        stars: 5,
        experience: 0,
        awakeningStage: 'BASE',
        equipmentIds: [],
        skillLevels: {},
        locked: false,
        acquiredAt: Date.now(),
      }
    );
  }

  if (!player.monsters.some((m) => m.instanceId.includes('catalyst_synth'))) {
    player.monsters.push(
      {
        instanceId: `inst_${playerId}_catalyst_synth_tide1`,
        variantId: 'var_tideguard_water',
        playerId,
        level: 5,
        stars: 1,
        experience: 0,
        awakeningStage: 'BASE',
        equipmentIds: [],
        skillLevels: {},
        locked: false,
        acquiredAt: Date.now(),
      },
      {
        instanceId: `inst_${playerId}_catalyst_synth_tide2`,
        variantId: 'var_tideguard_fire',
        playerId,
        level: 5,
        stars: 1,
        experience: 0,
        awakeningStage: 'BASE',
        equipmentIds: [],
        skillLevels: {},
        locked: false,
        acquiredAt: Date.now(),
      },
      {
        instanceId: `inst_${playerId}_catalyst_synth_flora1`,
        variantId: 'var_floraweaver_grass',
        playerId,
        level: 5,
        stars: 2,
        experience: 0,
        awakeningStage: 'BASE',
        equipmentIds: [],
        skillLevels: {},
        locked: false,
        acquiredAt: Date.now(),
      },
      {
        instanceId: `inst_${playerId}_catalyst_synth_flora2`,
        variantId: 'var_floraweaver_water',
        playerId,
        level: 5,
        stars: 2,
        experience: 0,
        awakeningStage: 'BASE',
        equipmentIds: [],
        skillLevels: {},
        locked: false,
        acquiredAt: Date.now(),
      }
    );
  }

  // Populate stars on any existing monsters missing them
  player.monsters.forEach((m) => {
    if (typeof m.stars !== 'number' || m.stars < 1) {
      const v = MONSTER_VARIANTS[m.variantId];
      m.stars = getMonsterStars(m, v);
    }
  });
  if (!player.profile.completedStages) player.profile.completedStages = [];
  if (!player.profile.stageStars) player.profile.stageStars = {};
  if (!player.profile.highestUnlockedStage) player.profile.highestUnlockedStage = 'stage_1_1';
  player.profile = syncMailboxState(player.profile);

  // Ensure Elemental Stones inventory exists for all 6 elements
  if (!player.profile.elementalStones) {
    player.profile.elementalStones = {
      FIRE: { small: 20, medium: 5, huge: 0 },
      WATER: { small: 20, medium: 5, huge: 0 },
      GRASS: { small: 20, medium: 5, huge: 0 },
      LIGHT: { small: 15, medium: 3, huge: 0 },
      DARK: { small: 15, medium: 3, huge: 0 },
      MAGIC: { small: 30, medium: 10, huge: 0 },
    };
  } else {
    const allElems: ElementalDungeonType[] = ['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK', 'MAGIC'];
    allElems.forEach((elem) => {
      if (!player.profile.elementalStones![elem]) {
        player.profile.elementalStones![elem] = { small: 0, medium: 0, huge: 0 };
      }
    });
  }

  // Ensure Scrolls inventory exists (Normal, Epic, Legendary, Light & Dark)
  if (!player.profile.scrolls) {
    player.profile.scrolls = {
      normal: 5,
      epic: 1,
      legendary: 0,
      lightDark: 0,
    };
  } else {
    if (typeof player.profile.scrolls.normal !== 'number') player.profile.scrolls.normal = 5;
    if (typeof player.profile.scrolls.epic !== 'number') player.profile.scrolls.epic = 1;
    if (typeof player.profile.scrolls.legendary !== 'number') player.profile.scrolls.legendary = 0;
    if (typeof player.profile.scrolls.lightDark !== 'number') player.profile.scrolls.lightDark = 0;
  }

  // Ensure 24-Hour Rotating Magic Shop exists and is synchronized
  player.profile.shop = syncRotatingShop(player.profile.shop);

  // Sanitize player roster: Continent Bosses are strictly non-obtainable campaign entities
  player.monsters = player.monsters.filter((m) => {
    const v = MONSTER_VARIANTS[m.variantId];
    return v && !v.isBoss && v.familyId !== 'fam_boss' && !m.variantId.startsWith('var_boss_');
  });

  // Ensure activeParty is defined and valid (allow 1 to 5 units, excluding disabled units)
  const ownedIds = new Set(player.monsters.map((m) => m.instanceId));
  const isMonsterEnabled = (instanceId: string): boolean => {
    const m = player.monsters.find((mon) => mon.instanceId === instanceId);
    if (!m) return false;
    return !DISABLED_UNITS.has(m.variantId);
  };

  if (!player.profile.activeParty || player.profile.activeParty.length === 0) {
    player.profile.activeParty = player.monsters
      .filter((m) => !DISABLED_UNITS.has(m.variantId))
      .slice(0, 5)
      .map((m) => m.instanceId);
  } else {
    // Keep only currently owned and non-disabled monsters in their selected order
    player.profile.activeParty = player.profile.activeParty.filter((id) => ownedIds.has(id) && isMonsterEnabled(id));
    if (player.profile.activeParty.length === 0 && player.monsters.length > 0) {
      const firstEnabled = player.monsters.find((m) => !DISABLED_UNITS.has(m.variantId));
      if (firstEnabled) {
        player.profile.activeParty = [firstEnabled.instanceId];
      }
    }
  }

  // Ensure defenseTeam is defined and valid (1 to 5 units, excluding disabled units)
  if (!player.profile.defenseTeam || player.profile.defenseTeam.length === 0) {
    player.profile.defenseTeam = [...player.profile.activeParty];
  } else {
    player.profile.defenseTeam = player.profile.defenseTeam.filter(
      (id: string) => ownedIds.has(id) && isMonsterEnabled(id)
    );
    if (player.profile.defenseTeam.length === 0 && player.profile.activeParty.length > 0) {
      player.profile.defenseTeam = [...player.profile.activeParty];
    }
  }

  if (typeof player.profile.arenaRating !== 'number' || isNaN(player.profile.arenaRating)) {
    player.profile.arenaRating = 1000;
  }
  if (typeof player.profile.arenaWins !== 'number') player.profile.arenaWins = 0;
  if (typeof player.profile.arenaLosses !== 'number') player.profile.arenaLosses = 0;
  if (typeof player.profile.arenaDefenseWins !== 'number') player.profile.arenaDefenseWins = 0;
  if (typeof player.profile.arenaDefenseLosses !== 'number') player.profile.arenaDefenseLosses = 0;
  if (typeof player.profile.arenaTickets !== 'number') player.profile.arenaTickets = 10;

  // Apply server-authoritative stamina regeneration (calculated strictly on backend)
  calculateServerStaminaRegen(player);
  calculateArenaTicketsRegen(player);

  return player;
}

// Server-authoritative Arena ticket regeneration (1 ticket per 15 minutes, up to 10 max)
function calculateArenaTicketsRegen(player: any): void {
  const now = Date.now();
  if (!player.profile.lastArenaTicketRefill) {
    player.profile.lastArenaTicketRefill = now;
  }
  if ((player.profile.arenaTickets ?? 10) < 10) {
    const elapsedSeconds = Math.floor((now - player.profile.lastArenaTicketRefill) / 1000);
    const ticketsToAdd = Math.floor(elapsedSeconds / 900);
    if (ticketsToAdd > 0) {
      player.profile.arenaTickets = Math.min(10, (player.profile.arenaTickets ?? 0) + ticketsToAdd);
      player.profile.lastArenaTicketRefill = now - ((elapsedSeconds % 900) * 1000);
    }
  } else {
    player.profile.lastArenaTicketRefill = now;
  }
}

// Helper to construct player's ArenaSummoner card from their actual defense squad
function buildPlayerArenaSummoner(player: any): ArenaSummoner {
  const defenseIds = player.profile.defenseTeam || player.profile.activeParty || [];
  const defenseMonsters: ArenaDefenseMonster[] = defenseIds
    .map((instId: string, idx: number) => {
      const m = player.monsters.find((mon: any) => mon.instanceId === instId);
      if (!m) return null;
      const v = MONSTER_VARIANTS[m.variantId];
      return {
        variantId: m.variantId,
        level: m.level,
        awakeningStage: m.awakeningStage,
        stars: m.stars || 4,
        slotIndex: idx,
        name: v?.name || m.variantId,
        element: v?.element || 'FIRE',
        power: calculateMonsterCombatPower(m.variantId, m.level, m.awakeningStage),
      };
    })
    .filter(Boolean);

  const defensePower = calculateTeamCombatPower(defenseMonsters);
  const rating = player.profile.arenaRating || 1000;
  const tierConfig = getArenaTier(rating);

  return {
    userId: player.profile.playerId,
    displayName: player.profile.username || 'Summoner',
    avatarVariantId: player.profile.avatarVariantId || 'pyrosaur_fire',
    level: player.profile.accountLevel || 1,
    rating,
    tier: tierConfig.tier,
    defensePower,
    defenseMonsters,
    wins: player.profile.arenaWins || 0,
    losses: player.profile.arenaLosses || 0,
  };
}

// Helper to retrieve the combined global leaderboard (real summoners + seeded champions)
function getFullArenaLeaderboard(currentPlayerId?: string): {
  leaderboard: ArenaSummoner[];
  playerRank: number;
  playerEntry: ArenaSummoner;
} {
  const realSummoners: ArenaSummoner[] = Object.values(PLAYER_STORE).map((p: any) =>
    buildPlayerArenaSummoner(p)
  );

  const realIds = new Set(realSummoners.map((s) => s.userId));
  const combined: ArenaSummoner[] = [
    ...realSummoners,
    ...SEEDED_ARENA_RIVALS.filter((r) => !realIds.has(r.userId)),
  ];

  combined.sort((a, b) => (b.rating || 1000) - (a.rating || 1000));

  combined.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  const pId = currentPlayerId || 'player_default';
  const playerIndex = combined.findIndex((s) => s.userId === pId);
  const playerRank = playerIndex >= 0 ? playerIndex + 1 : combined.length;
  const playerEntry = combined[playerIndex] || realSummoners[0] || combined[0];

  return {
    leaderboard: combined.slice(0, 50),
    playerRank,
    playerEntry,
  };
}

// ============================================================
// API ROUTES (FIRST)
// ============================================================

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    game: 'Monster Realms',
    version: '1.0.0-foundation',
    timestamp: Date.now(),
  });
});

// Server-Authoritative Stamina Status (Protected against client device clock manipulation)
app.get('/api/player/stamina', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);
  const stamina = calculateServerStaminaRegen(player);
  res.json({
    energy: stamina.currentEnergy,
    maxEnergy: stamina.maxEnergy,
    nextRegenSeconds: stamina.nextRegenSeconds,
    serverTime: stamina.serverTime,
    regenIntervalSeconds: 180,
  });
});

// Fetch complete player state
app.get('/api/player/profile', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);
  player.profile = syncDailyMissionsState(player.profile);
  res.json({
    profile: player.profile,
    monsters: player.monsters,
    equipment: player.equipment,
    banners: BANNER_STORE,
    stages: ALL_STAGES,
    continents: CONTINENTS,
  });
});

// Alias for /api/profile
app.get('/api/profile', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);
  player.profile = syncDailyMissionsState(player.profile);
  res.json({
    profile: player.profile,
    monsters: player.monsters,
    equipment: player.equipment,
    banners: BANNER_STORE,
    stages: ALL_STAGES,
    continents: CONTINENTS,
  });
});

// Initialize / Reset starter account
app.post('/api/player/initialize', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const profile = createInitialPlayerProfile(playerId);
  const monsters = createDeterministicStarterTeam(playerId);
  const equipment = [...STARTER_EQUIPMENT];

  profile.activeParty = monsters.map((m) => m.instanceId);

  PLAYER_STORE[playerId] = {
    profile,
    monsters,
    equipment,
    bannerPity: {},
  };

  res.json({
    success: true,
    message: 'Starter account initialized with 5 starter monsters.',
    profile,
    monsters,
    equipment,
  });
});

// Restore / Hydrate player state from Cloud Save
app.post('/api/player/restore', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { profile, monsters, equipment } = req.body;
  if (!profile || !Array.isArray(monsters)) {
    return res.status(400).json({ error: 'Invalid save state data' });
  }

  PLAYER_STORE[playerId] = {
    profile,
    monsters,
    equipment: equipment || [],
    bannerPity: PLAYER_STORE[playerId]?.bannerPity || {},
  };

  res.json({
    success: true,
    message: 'Player state successfully restored into server memory.',
    profile: PLAYER_STORE[playerId].profile,
    monsters: PLAYER_STORE[playerId].monsters,
    equipment: PLAYER_STORE[playerId].equipment,
  });
});

// Update & Save Active 5-Monster Party
app.post('/api/player/party', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { party } = req.body;
  const player = getOrCreatePlayer(playerId);

  if (!Array.isArray(party)) {
    return res.status(400).json({ error: 'Party must be an array of monster instance IDs' });
  }

  // Strictly validate that each monster exists in player's owned collection and is not disabled
  const ownedInstanceIds = new Set(player.monsters.map((m) => m.instanceId));
  const validParty = party.filter((id) => {
    if (typeof id !== 'string' || !ownedInstanceIds.has(id)) return false;
    const monster = player.monsters.find((m) => m.instanceId === id);
    if (!monster) return false;
    return !DISABLED_UNITS.has(monster.variantId);
  });

  // Check if any provided monster was disabled
  const hadDisabled = party.some((id) => {
    const monster = player.monsters.find((m) => m.instanceId === id);
    return monster && DISABLED_UNITS.has(monster.variantId);
  });

  // Enforce uniqueness and cap at 5
  const uniqueParty: string[] = [];
  for (const id of validParty) {
    if (!uniqueParty.includes(id) && uniqueParty.length < 5) {
      uniqueParty.push(id);
    }
  }

  player.profile.activeParty = uniqueParty;
  player.profile.updatedAt = Date.now();

  res.json({
    success: true,
    message: 'Active party updated successfully.',
    activeParty: player.profile.activeParty,
  });
});

// Update Profile Username (1st change is Free, subsequent changes cost 500 Gems)
app.post('/api/player/change-name', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { newName } = req.body;
  const player = getOrCreatePlayer(playerId);

  if (!newName || typeof newName !== 'string') {
    return res.status(400).json({ error: 'Username must be a valid text string.' });
  }

  const trimmed = newName.trim();
  if (trimmed.length < 2 || trimmed.length > 20) {
    return res.status(400).json({ error: 'Username must be between 2 and 20 characters.' });
  }

  // Cost calculation: 1st change is FREE (0 gems), subsequent changes cost 500 gems
  const hasChangedName = !!player.profile.hasChangedName;
  const cost = hasChangedName ? 500 : 0;

  if (cost > 0) {
    if ((player.profile.currencies.gems || 0) < cost) {
      return res.status(400).json({
        error: `Insufficient gems! Changing your name again costs 500 gems. (Current: ${player.profile.currencies.gems} gems)`,
      });
    }
    player.profile.currencies.gems -= cost;
  }

  player.profile.username = trimmed;
  player.profile.hasChangedName = true;
  player.profile.nameChangesCount = (player.profile.nameChangesCount || 0) + 1;
  player.profile.updatedAt = Date.now();

  res.json({
    success: true,
    message:
      cost > 0
        ? `Name updated to "${trimmed}" for 500 gems.`
        : `First free name change applied! Welcome, ${trimmed}.`,
    username: trimmed,
    hasChangedName: true,
    nameChangesCount: player.profile.nameChangesCount,
    costGems: cost,
    currencies: player.profile.currencies,
    profile: player.profile,
  });
});

// Update Profile Avatar Picture (Selected from unlocked monster portraits)
app.post('/api/player/avatar', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { avatarVariantId } = req.body;
  const player = getOrCreatePlayer(playerId);

  if (!avatarVariantId || typeof avatarVariantId !== 'string') {
    return res.status(400).json({ error: 'Valid avatarVariantId is required.' });
  }

  if (!MONSTER_VARIANTS[avatarVariantId]) {
    return res.status(400).json({ error: 'Monster variant does not exist.' });
  }

  // Check if player has unlocked this portrait (owns at least one copy or starter)
  const isOwned = player.monsters.some((m) => m.variantId === avatarVariantId);
  const isStarter =
    STARTER_VARIANT_IDS.includes(avatarVariantId) || avatarVariantId === 'var_nekohime_grass';

  if (!isOwned && !isStarter) {
    return res.status(400).json({
      error: 'Portrait locked! You must obtain or unlock this monster before choosing it as your avatar.',
    });
  }

  player.profile.avatarVariantId = avatarVariantId;
  player.profile.updatedAt = Date.now();

  res.json({
    success: true,
    message: `Avatar updated to ${MONSTER_VARIANTS[avatarVariantId].name}.`,
    avatarVariantId,
    profile: player.profile,
  });
});

// Account Level Progression Reward Claiming (e.g. Lv 2, 3, 4 -> 50 gems, Lv 5 -> 100 gems)
app.post('/api/player/claim-level-reward', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { level, claimAll } = req.body;
  const player = getOrCreatePlayer(playerId);

  const claimedSet = new Set(player.profile.claimedLevelRewards || []);
  const currentAccountLevel = player.profile.accountLevel || 1;

  if (claimAll) {
    const newlyClaimedLevels: number[] = [];
    let totalGemsAwarded = 0;

    for (let lvl = 2; lvl <= currentAccountLevel; lvl++) {
      if (!claimedSet.has(lvl)) {
        const gems = getRewardForAccountLevel(lvl);
        totalGemsAwarded += gems;
        claimedSet.add(lvl);
        newlyClaimedLevels.push(lvl);
      }
    }

    if (newlyClaimedLevels.length === 0) {
      return res.status(400).json({ error: 'No unclaimed account level rewards available.' });
    }

    player.profile.currencies.gems += totalGemsAwarded;
    player.profile.claimedLevelRewards = Array.from(claimedSet).sort((a, b) => a - b);
    player.profile.updatedAt = Date.now();

    return res.json({
      success: true,
      message: `Claimed ${totalGemsAwarded} gems across ${newlyClaimedLevels.length} account level milestones!`,
      claimedLevels: newlyClaimedLevels,
      totalGemsAwarded,
      currencies: player.profile.currencies,
      profile: player.profile,
    });
  }

  const targetLevel = Number(level);
  if (!targetLevel || targetLevel < 2) {
    return res.status(400).json({ error: 'Invalid level specified. Rewards start at Level 2.' });
  }

  if (targetLevel > currentAccountLevel) {
    return res.status(400).json({
      error: `Account Level ${targetLevel} has not been reached yet. Current Level: ${currentAccountLevel}`,
    });
  }

  if (claimedSet.has(targetLevel)) {
    return res.status(400).json({
      error: `Level ${targetLevel} progression reward has already been claimed!`,
    });
  }

  const gemsAwarded = getRewardForAccountLevel(targetLevel);
  claimedSet.add(targetLevel);
  player.profile.currencies.gems += gemsAwarded;
  player.profile.claimedLevelRewards = Array.from(claimedSet).sort((a, b) => a - b);
  player.profile.updatedAt = Date.now();

  res.json({
    success: true,
    message: `Claimed Level ${targetLevel} progression reward: +${gemsAwarded} Gems!`,
    level: targetLevel,
    gemsAwarded,
    currencies: player.profile.currencies,
    profile: player.profile,
  });
});

// Daily Missions: Claim individual mission reward
app.post('/api/player/daily-missions/claim', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { missionId } = req.body;
  const player = getOrCreatePlayer(playerId);

  if (!missionId || !DAILY_MISSION_DEFINITIONS[missionId as keyof typeof DAILY_MISSION_DEFINITIONS]) {
    return res.status(400).json({ error: 'Invalid or missing mission ID.' });
  }

  try {
    const result = claimDailyMission(player.profile, missionId);
    player.profile = result.profile;
    player.profile.updatedAt = Date.now();

    res.json({
      success: true,
      message: `Claimed daily mission reward: ${DAILY_MISSION_DEFINITIONS[missionId as keyof typeof DAILY_MISSION_DEFINITIONS].title}`,
      missionId,
      claimedReward: result.claimedReward,
      profile: player.profile,
      currencies: player.profile.currencies,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to claim daily mission reward.' });
  }
});

// Daily Missions: Claim 100 Gems All-Clear Grand Bounty
app.post('/api/player/daily-missions/claim-all-clear', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);

  try {
    const result = claimAllClearBonus(player.profile);
    player.profile = result.profile;
    player.profile.updatedAt = Date.now();

    res.json({
      success: true,
      message: `Claimed 100 Gems All-Clear Grand Bounty!`,
      gemsClaimed: result.gemsClaimed,
      profile: player.profile,
      currencies: player.profile.currencies,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to claim all-clear bounty.' });
  }
});

// Daily Missions: Claim all completed unclaimed missions + all-clear bonus in one tap
app.post('/api/player/daily-missions/claim-all', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);

  try {
    const result = claimAllAvailableDailyMissions(player.profile);
    player.profile = result.profile;
    player.profile.updatedAt = Date.now();

    res.json({
      success: true,
      message: `Claimed ${result.claimedMissionsCount} daily missions and bonuses!`,
      claimedMissionsCount: result.claimedMissionsCount,
      totalEnergyClaimed: result.totalEnergyClaimed,
      totalSpClaimed: result.totalSpClaimed,
      totalGoldClaimed: result.totalGoldClaimed,
      totalGemsClaimed: result.totalGemsClaimed,
      allClearClaimed: result.allClearClaimed,
      profile: player.profile,
      currencies: player.profile.currencies,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to claim all available daily missions.' });
  }
});

// Daily Missions: Report active playtime heartbeat
app.post('/api/player/playtime', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { seconds = 5 } = req.body;
  const player = getOrCreatePlayer(playerId);

  const clampedSeconds = Math.max(1, Math.min(60, Number(seconds) || 5));
  player.profile = recordPlaytimeTick(player.profile, clampedSeconds);
  player.profile.updatedAt = Date.now();

  res.json({
    success: true,
    playtimeSeconds: player.profile.dailyMissions?.playtimeSeconds || 0,
    profile: player.profile,
  });
});

// ============================================================
// MAILBOX & GIFTS ENDPOINTS
// ============================================================

// Get Mailbox items
app.get('/api/player/mailbox', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);
  player.profile = syncMailboxState(player.profile);
  res.json({
    mailbox: player.profile.mailbox || [],
    unclaimedCount: (player.profile.mailbox || []).filter((m) => !m.isClaimed).length,
  });
});

// Claim a specific mail gift
app.post('/api/player/mailbox/claim', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { mailId } = req.body;
  const player = getOrCreatePlayer(playerId);

  try {
    const result = claimMailItem(player.profile, mailId);
    player.profile = result.updatedProfile;

    if (result.rewardsGained.monsters && Array.isArray(result.rewardsGained.monsters)) {
      result.rewardsGained.monsters.forEach((m) => {
        const variant = MONSTER_VARIANTS[m.variantId];
        if (variant) {
          const newInst: PlayerMonster = {
            instanceId: `inst_${playerId}_mail_${m.variantId}_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
            variantId: m.variantId,
            playerId,
            level: m.level || 15,
            stars: m.stars || variant.stars || 4,
            experience: 0,
            awakeningStage: 'BASE',
            equipmentIds: [],
            skillLevels: {},
            locked: false,
            acquiredAt: Date.now(),
          };
          player.monsters.push(newInst);
        }
      });
    }

    savePlayerToDatabase(playerId);

    res.json({
      success: true,
      claimedItem: result.claimedItem,
      rewardsGained: result.rewardsGained,
      profile: player.profile,
      currencies: player.profile.currencies,
      monsters: player.monsters,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to claim mail gift.' });
  }
});

// Claim all unclaimed mail gifts
app.post('/api/player/mailbox/claim-all', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);

  try {
    const unclaimed = (player.profile.mailbox || []).filter((m) => !m.isClaimed);
    const result = claimAllMail(player.profile);
    player.profile = result.updatedProfile;

    // Grant any monsters that were in the unclaimed items
    unclaimed.forEach((item) => {
      if (item.reward?.monsters && Array.isArray(item.reward.monsters)) {
        item.reward.monsters.forEach((m) => {
          const variant = MONSTER_VARIANTS[m.variantId];
          if (variant) {
            const newInst: PlayerMonster = {
              instanceId: `inst_${playerId}_mail_${m.variantId}_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
              variantId: m.variantId,
              playerId,
              level: m.level || 15,
              stars: m.stars || variant.stars || 4,
              experience: 0,
              awakeningStage: 'BASE',
              equipmentIds: [],
              skillLevels: {},
              locked: false,
              acquiredAt: Date.now(),
            };
            player.monsters.push(newInst);
          }
        });
      }
    });

    savePlayerToDatabase(playerId);

    res.json({
      success: true,
      claimedCount: result.claimedCount,
      totalRewardsGained: result.totalRewardsGained,
      profile: player.profile,
      currencies: player.profile.currencies,
      monsters: player.monsters,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to claim all mail gifts.' });
  }
});

// Delete a mail item
app.post('/api/player/mailbox/delete', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { mailId } = req.body;
  const player = getOrCreatePlayer(playerId);

  player.profile = deleteMailItem(player.profile, mailId);
  savePlayerToDatabase(playerId);

  res.json({
    success: true,
    mailbox: player.profile.mailbox || [],
    profile: player.profile,
  });
});

// Clear all claimed mail
app.post('/api/player/mailbox/clear-claimed', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);

  player.profile = clearClaimedMail(player.profile);
  savePlayerToDatabase(playerId);

  res.json({
    success: true,
    mailbox: player.profile.mailbox || [],
    profile: player.profile,
  });
});

// Send gift to a friend's mailbox
app.post('/api/player/mailbox/send-friend-gift', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { targetUserId, targetDisplayName, note, reward } = req.body;
  const senderPlayer = getOrCreatePlayer(playerId);

  // If the target player exists in local server store, add to their mailbox
  if (targetUserId && PLAYER_STORE[targetUserId]) {
    const targetPlayer = PLAYER_STORE[targetUserId];
    targetPlayer.profile = syncMailboxState(targetPlayer.profile);
    const added = addFriendGiftMail(
      targetPlayer.profile,
      senderPlayer.profile.username || 'Adventurer Friend',
      undefined,
      senderPlayer.profile.avatarVariantId,
      note,
      reward
    );
    targetPlayer.profile = added.updatedProfile;
    savePlayerToDatabase(targetUserId);
  }

  res.json({
    success: true,
    message: `Gift successfully sent to ${targetDisplayName || 'friend'}!`,
  });
});

// Dispatch / simulate a game supply gift
app.post('/api/player/mailbox/send-game-gift', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { title, message, reward, senderName } = req.body;
  const player = getOrCreatePlayer(playerId);

  const result = addGameGiftMail(
    player.profile,
    title || 'Realm Warden Supplies',
    message || 'High Council blessings upon your journey!',
    reward || { gold: 10000, gems: 100, energy: 30, summonPoints: 50 },
    senderName || 'Realm High Council'
  );

  player.profile = result.updatedProfile;
  savePlayerToDatabase(playerId);

  res.json({
    success: true,
    newMail: result.newMail,
    profile: player.profile,
  });
});

// ============================================================
// WORLD CHAT & PRIVATE DIRECT CHAT SYSTEM
// ============================================================

const WORLD_CHAT_STORE: ChatMessage[] = [
  {
    id: 'msg_sys_welcome',
    type: 'SYSTEM',
    senderId: 'system_grandmaster',
    senderName: 'Realm Grandmaster',
    senderAvatarVariantId: 'var_pyrosaur_fire',
    senderLevel: 99,
    text: 'Welcome to the Monster Realms World Chat! Coordinate tactical teams, share summon results, and forge alliances across the realm!',
    timestamp: Date.now() - 1000 * 60 * 10,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'msg_sys_tips',
    type: 'SYSTEM',
    senderId: 'system_valerie',
    senderName: 'Captain Valerie',
    senderAvatarVariantId: 'var_nekohime_grass',
    senderLevel: 50,
    text: 'Tip: Fire monsters excel against Nature, Water extinguishes Fire, and Nature absorbs Water! Light and Dark strike each other with devastating force.',
    timestamp: Date.now() - 1000 * 60 * 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
];

const DIRECT_MESSAGES_STORE: ChatMessage[] = [];

// Get World Chat Messages
app.get('/api/chat/world', (req: Request, res: Response) => {
  const limitParam = parseInt(req.query.limit as string, 10) || 50;
  const messages = WORLD_CHAT_STORE.slice(-limitParam);
  res.json({ messages });
});

// Post a World Chat Message
app.post('/api/chat/world', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);
  const { text, senderName, senderAvatarVariantId, senderLevel } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'Message text cannot be empty.' });
    return;
  }

  const cleanText = text.trim().slice(0, 500);
  const newMessage: ChatMessage = {
    id: `msg_w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: 'WORLD',
    senderId: playerId,
    senderName: senderName || player.profile.username || 'Adventurer',
    senderAvatarVariantId: senderAvatarVariantId || player.profile.avatarVariantId || 'var_pyrosaur_fire',
    senderLevel: typeof senderLevel === 'number' ? senderLevel : player.profile.accountLevel || 1,
    text: cleanText,
    timestamp: Date.now(),
    createdAt: new Date().toISOString(),
  };

  WORLD_CHAT_STORE.push(newMessage);
  if (WORLD_CHAT_STORE.length > 250) {
    WORLD_CHAT_STORE.shift();
  }

  res.json({ success: true, message: newMessage });
});

// Get Private Chat Messages with a specific user
app.get('/api/chat/private', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const withUserId = req.query.withUserId as string;

  if (!withUserId) {
    res.status(400).json({ error: 'withUserId query parameter is required.' });
    return;
  }

  const messages = DIRECT_MESSAGES_STORE.filter(
    (m) =>
      (m.senderId === playerId && m.recipientId === withUserId) ||
      (m.senderId === withUserId && m.recipientId === playerId)
  ).sort((a, b) => a.timestamp - b.timestamp);

  res.json({ messages });
});

// Send Private Direct Message
app.post('/api/chat/private', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);
  const {
    recipientId,
    recipientName,
    recipientAvatarVariantId,
    text,
    senderName,
    senderAvatarVariantId,
    senderLevel,
  } = req.body;

  if (!recipientId) {
    res.status(400).json({ error: 'recipientId is required.' });
    return;
  }

  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'Message text cannot be empty.' });
    return;
  }

  const cleanText = text.trim().slice(0, 500);
  const newMessage: ChatMessage = {
    id: `msg_p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: 'PRIVATE',
    senderId: playerId,
    senderName: senderName || player.profile.username || 'Adventurer',
    senderAvatarVariantId: senderAvatarVariantId || player.profile.avatarVariantId || 'var_pyrosaur_fire',
    senderLevel: typeof senderLevel === 'number' ? senderLevel : player.profile.accountLevel || 1,
    recipientId,
    recipientName: recipientName || 'Adventurer',
    recipientAvatarVariantId,
    text: cleanText,
    timestamp: Date.now(),
    createdAt: new Date().toISOString(),
  };

  DIRECT_MESSAGES_STORE.push(newMessage);
  if (DIRECT_MESSAGES_STORE.length > 500) {
    DIRECT_MESSAGES_STORE.shift();
  }

  res.json({ success: true, message: newMessage });
});

// List Direct Conversations for the current user
app.get('/api/chat/conversations', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const conversationMap = new Map<string, DirectConversation>();

  for (const msg of DIRECT_MESSAGES_STORE) {
    const isSender = msg.senderId === playerId;
    const isRecipient = msg.recipientId === playerId;
    if (!isSender && !isRecipient) continue;

    const otherId = isSender ? msg.recipientId! : msg.senderId;
    const otherName = isSender ? msg.recipientName || 'Adventurer' : msg.senderName;
    const otherAvatar = isSender ? msg.recipientAvatarVariantId : msg.senderAvatarVariantId;

    const existing = conversationMap.get(otherId);
    if (!existing || msg.timestamp > (existing.lastMessageTimestamp || 0)) {
      conversationMap.set(otherId, {
        userId: otherId,
        displayName: otherName,
        avatarVariantId: otherAvatar,
        lastMessage: msg.text,
        lastMessageTimestamp: msg.timestamp,
        unreadCount: 0,
      });
    }
  }

  const conversations = Array.from(conversationMap.values()).sort(
    (a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0)
  );

  res.json({ conversations });
});

// Tutorial: Step update
app.post('/api/player/tutorial/step', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { step, stepName } = req.body;
  const player = getOrCreatePlayer(playerId);

  player.profile.tutorialState.currentStep = step;
  player.profile.tutorialState.stepName = stepName || `STEP_${step}`;
  if (step >= 13) {
    player.profile.tutorialState.isCompleted = true;
  }
  player.profile.updatedAt = Date.now();

  res.json({ success: true, tutorialState: player.profile.tutorialState });
});

// Tutorial: Skip tutorial
app.post('/api/player/tutorial/skip', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);

  player.profile.tutorialState.isSkipped = true;
  player.profile.tutorialState.isCompleted = true;
  player.profile.tutorialState.currentStep = 13;
  player.profile.tutorialState.stepName = 'COMPLETED';
  player.profile.updatedAt = Date.now();

  res.json({
    success: true,
    message: 'Tutorial successfully skipped. Main game unlocked.',
    tutorialState: player.profile.tutorialState,
  });
});

// Monster Level Up
app.post('/api/monsters/level-up', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { instanceId, levelsToAdd = 1 } = req.body;
  const player = getOrCreatePlayer(playerId);

  const monster = player.monsters.find((m) => m.instanceId === instanceId);
  if (!monster) {
    return res.status(404).json({ error: 'Monster instance not found' });
  }

  const maxLevel = monster.awakeningStage === 'BASE' ? 30 : 40;
  if (monster.level >= maxLevel) {
    return res.status(400).json({ error: 'Monster already reached level cap' });
  }

  const actualLevels = Math.min(levelsToAdd, maxLevel - monster.level);
  const totalCost = getTotalLevelUpCost(monster.level, actualLevels);

  if (player.profile.currencies.gold < totalCost) {
    return res.status(400).json({
      error: `Insufficient Gold for level up. Required: ${totalCost.toLocaleString()} Gold, have: ${player.profile.currencies.gold.toLocaleString()} Gold.`
    });
  }

  player.profile.currencies.gold -= totalCost;
  monster.level += actualLevels;
  player.profile.updatedAt = Date.now();

  res.json({
    success: true,
    monster,
    remainingGold: player.profile.currencies.gold,
    levelsGained: actualLevels,
  });
});

// Monster Awakening
app.post('/api/monsters/awaken', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { instanceId } = req.body;
  const player = getOrCreatePlayer(playerId);

  const monster = player.monsters.find((m) => m.instanceId === instanceId);
  if (!monster) {
    return res.status(404).json({ error: 'Monster instance not found' });
  }

  if (monster.awakeningStage !== 'BASE') {
    return res.status(400).json({ error: 'Monster is already awakened' });
  }

  const variant = MONSTER_VARIANTS[monster.variantId] || Object.values(MONSTER_VARIANTS)[0];
  const cost = getAwakeningCost(variant);

  if (player.profile.currencies.gold < cost.gold) {
    return res.status(400).json({ error: `Requires ${cost.gold.toLocaleString()} Gold to awaken` });
  }

  if (!player.profile.elementalStones) {
    player.profile.elementalStones = {
      FIRE: { small: 0, medium: 0, huge: 0 },
      WATER: { small: 0, medium: 0, huge: 0 },
      GRASS: { small: 0, medium: 0, huge: 0 },
      LIGHT: { small: 0, medium: 0, huge: 0 },
      DARK: { small: 0, medium: 0, huge: 0 },
      MAGIC: { small: 0, medium: 0, huge: 0 },
    };
  }

  const elemInv = player.profile.elementalStones[cost.element] || { small: 0, medium: 0, huge: 0 };
  const magicInv = player.profile.elementalStones.MAGIC || { small: 0, medium: 0, huge: 0 };

  // Validate Elemental Stones
  if (elemInv.small < cost.elementalStones.small) {
    return res.status(400).json({
      error: `Not enough Small ${cost.element} Stones! Have ${elemInv.small}, need ${cost.elementalStones.small}. Clear Floor 1-5 in the Hall of ${cost.element}!`,
    });
  }
  if (elemInv.medium < cost.elementalStones.medium) {
    return res.status(400).json({
      error: `Not enough Medium ${cost.element} Stones! Have ${elemInv.medium}, need ${cost.elementalStones.medium}. Clear Floor 4-8 in the Hall of ${cost.element}!`,
    });
  }
  if (elemInv.huge < cost.elementalStones.huge) {
    return res.status(400).json({
      error: `Not enough Huge ${cost.element} Stones! Have ${elemInv.huge}, need ${cost.elementalStones.huge}. High tier monsters (${variant.rarity}) require Huge Stones from Floor 10 in the Hall of ${cost.element}!`,
    });
  }

  // Validate Magic Stones
  if (magicInv.small < cost.magicStones.small) {
    return res.status(400).json({
      error: `Not enough Small Magic Stones! Have ${magicInv.small}, need ${cost.magicStones.small}. Clear the Hall of Magic!`,
    });
  }
  if (magicInv.medium < cost.magicStones.medium) {
    return res.status(400).json({
      error: `Not enough Medium Magic Stones! Have ${magicInv.medium}, need ${cost.magicStones.medium}. Clear Floor 4-8 in the Hall of Magic!`,
    });
  }
  if (magicInv.huge < cost.magicStones.huge) {
    return res.status(400).json({
      error: `Not enough Huge Magic Stones! Have ${magicInv.huge}, need ${cost.magicStones.huge}. High tier monsters (${variant.rarity}) require Huge Stones from Floor 10 in the Hall of Magic!`,
    });
  }

  // Deduct resources
  player.profile.currencies.gold -= cost.gold;
  elemInv.small -= cost.elementalStones.small;
  elemInv.medium -= cost.elementalStones.medium;
  elemInv.huge -= cost.elementalStones.huge;

  magicInv.small -= cost.magicStones.small;
  magicInv.medium -= cost.magicStones.medium;
  magicInv.huge -= cost.magicStones.huge;

  monster.awakeningStage = 'AWAKENED';
  player.profile.updatedAt = Date.now();
  savePlayerToDatabase(playerId);

  res.json({
    success: true,
    monster,
    remainingGold: player.profile.currencies.gold,
    elementalStones: player.profile.elementalStones,
    message: `${variant.name} has successfully awakened!`,
  });
});

// Equipment Toggle (Equip / Unequip)
app.post('/api/monsters/equip', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { instanceId, equipmentId, action } = req.body; // action: 'EQUIP' | 'UNEQUIP'
  const player = getOrCreatePlayer(playerId);

  const monster = player.monsters.find((m) => m.instanceId === instanceId);
  const item = player.equipment.find((e) => e.id === equipmentId);

  if (!monster || !item) {
    return res.status(404).json({ error: 'Monster or equipment item not found' });
  }

  if (action === 'EQUIP') {
    // If another item is in the same slot on this monster, unequip it
    const existingSameSlot = player.equipment.find(
      (e) => e.slot === item.slot && monster.equipmentIds.includes(e.id)
    );
    if (existingSameSlot) {
      monster.equipmentIds = monster.equipmentIds.filter((id) => id !== existingSameSlot.id);
      existingSameSlot.equippedToInstanceId = undefined;
    }

    // Unequip from prior owner if equipped elsewhere
    if (item.equippedToInstanceId && item.equippedToInstanceId !== monster.instanceId) {
      const priorMonster = player.monsters.find((m) => m.instanceId === item.equippedToInstanceId);
      if (priorMonster) {
        priorMonster.equipmentIds = priorMonster.equipmentIds.filter((id) => id !== item.id);
      }
    }

    if (!monster.equipmentIds.includes(item.id)) {
      monster.equipmentIds.push(item.id);
    }
    item.equippedToInstanceId = monster.instanceId;
  } else {
    monster.equipmentIds = monster.equipmentIds.filter((id) => id !== item.id);
    item.equippedToInstanceId = undefined;
  }

  res.json({ success: true, monster, item });
});

// Expand Equipment Inventory: Buy +10 space with 500 gems up to 200 total slots
app.post('/api/equipment/expand-inventory', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);
  const currentMax = player.profile.maxEquipmentSlots || 60;

  if (currentMax >= 200) {
    return res.status(400).json({ error: 'Maximum equipment inventory capacity (200 slots) already reached!' });
  }

  if ((player.profile.currencies.gems || 0) < 500) {
    return res.status(400).json({
      error: `Insufficient gems! Expanding inventory costs 500 gems (you have ${player.profile.currencies.gems || 0}).`,
    });
  }

  // Deduct 500 gems and increase max equipment slots by 10 up to 200
  player.profile.currencies.gems -= 500;
  const newMax = Math.min(200, currentMax + 10);
  player.profile.maxEquipmentSlots = newMax;
  player.profile.updatedAt = Date.now();

  res.json({
    success: true,
    maxEquipmentSlots: newMax,
    currencies: player.profile.currencies,
    message: `Expanded inventory to ${newMax} slots!`,
  });
});

// Forge / Roll a new Equipment Piece
app.post('/api/equipment/forge', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);
  const maxSlots = player.profile.maxEquipmentSlots || 60;

  if (player.equipment.length >= maxSlots) {
    return res.status(400).json({
      error: `Equipment inventory full (${player.equipment.length}/${maxSlots})! Expand inventory with gems or dismantle unused gear.`,
    });
  }

  const { slot, set, rarity } = req.body || {};
  const cost = 1000;
  if ((player.profile.currencies.gold || 0) < cost) {
    return res.status(400).json({ error: `Insufficient gold to forge gear! Required: ${cost} gold.` });
  }

  player.profile.currencies.gold -= cost;
  const newItem = rollEquipmentPiece({ slot, set, rarity });
  player.equipment.push(newItem);
  player.profile.updatedAt = Date.now();

  res.json({
    success: true,
    item: newItem,
    equipment: player.equipment,
    currencies: player.profile.currencies,
    message: `Successfully forged ${newItem.name} [${newItem.slot}]!`,
  });
});

// Dismantle / Recycle unwanted unequipped equipment for Gold
app.post('/api/equipment/dismantle', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { equipmentId } = req.body;
  const player = getOrCreatePlayer(playerId);

  const itemIndex = player.equipment.findIndex((e) => e.id === equipmentId);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Equipment item not found' });
  }

  const item = player.equipment[itemIndex];
  if (item.equippedToInstanceId) {
    return res.status(400).json({ error: 'Cannot dismantle an item that is currently equipped! Unequip it first.' });
  }

  // Calculate gold return based on rarity
  const goldReturns: Record<string, number> = {
    COMMON: 500,
    UNCOMMON: 1000,
    RARE: 2000,
    EPIC: 4000,
    LEGENDARY: 8000,
  };
  const goldAwarded = goldReturns[item.rarity] || 1000;

  player.equipment.splice(itemIndex, 1);
  player.profile.currencies.gold = (player.profile.currencies.gold || 0) + goldAwarded;
  player.profile.updatedAt = Date.now();

  res.json({
    success: true,
    goldAwarded,
    equipment: player.equipment,
    currencies: player.profile.currencies,
    message: `Dismantled ${item.name} for +${goldAwarded.toLocaleString()} Gold.`,
  });
});

// Toggle Monster Lock Status
app.post('/api/monsters/toggle-lock', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { instanceId } = req.body;
  const player = getOrCreatePlayer(playerId);

  const monster = player.monsters.find((m) => m.instanceId === instanceId);
  if (!monster) {
    return res.status(404).json({ error: 'Monster not found' });
  }

  monster.locked = !monster.locked;
  player.profile.updatedAt = Date.now();

  res.json({ success: true, monster, locked: monster.locked });
});

// Monster Alchemical Synthesis: Fuse two monsters of the same species and star rating to advance host +1 Star (up to 10★)
app.post('/api/monsters/synthesize', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { instanceId1, instanceId2 } = req.body;
  const player = getOrCreatePlayer(playerId);

  if (!instanceId1 || !instanceId2 || instanceId1 === instanceId2) {
    return res.status(400).json({ error: 'Please select a Host Monster and a Catalyst Monster for synthesis' });
  }

  // Host is m1, Catalyst is m2
  const m1 = player.monsters.find((m) => m.instanceId === instanceId1);
  const m2 = player.monsters.find((m) => m.instanceId === instanceId2);

  if (!m1 || !m2) {
    return res.status(404).json({ error: 'One or both monsters were not found in your collection' });
  }

  const v1 = MONSTER_VARIANTS[m1.variantId];
  const v2 = MONSTER_VARIANTS[m2.variantId];
  if (!v1 || !v2) {
    return res.status(400).json({ error: 'Invalid monster variants' });
  }

  // Use validation helper
  const validation = validateSynthesisEligibility(m1, m2, MONSTER_VARIANTS);
  if (!validation.eligible) {
    return res.status(400).json({ error: validation.errorReason });
  }

  const currentStars = getMonsterStars(m1, v1);
  const nextStars = currentStars + 1;
  const goldCost = validation.goldCost || getSynthesisStarCost(currentStars);

  if (player.profile.currencies.gold < goldCost) {
    return res.status(400).json({
      error: `Insufficient Gold. Ascending ${v1.name} from ${currentStars}★ to ${nextStars}★ requires ${goldCost.toLocaleString()} Gold.`,
    });
  }

  // Deduct Gold
  player.profile.currencies.gold -= goldCost;

  // Safe equipment return: unequip items from catalyst monster so player retains all gear
  const catalystEquipIds = [...(m2.equipmentIds || [])];
  catalystEquipIds.forEach((eqId) => {
    const item = player.equipment.find((e) => e.id === eqId);
    if (item) {
      item.equippedToInstanceId = undefined;
    }
  });

  // Remove catalyst monster from active party if assigned
  player.profile.activeParty = player.profile.activeParty.filter((id) => id !== m2.instanceId);

  // Remove catalyst monster from player roster
  player.monsters = player.monsters.filter((m) => m.instanceId !== m2.instanceId);

  // Advance Host monster to next star rating (preserves variant, level, experience, awakening, equipment!)
  m1.stars = nextStars;
  player.profile.updatedAt = Date.now();

  res.json({
    success: true,
    newMonster: m1,
    variant: v1,
    sacrificedNames: [v2.name],
    previousStars: currentStars,
    targetStars: nextStars,
    goldSpent: goldCost,
    currencies: player.profile.currencies,
    unequippedItemsCount: catalystEquipIds.length,
    message: `Synthesis complete! ${v1.name} ascended to ${nextStars}★!`,
  });
});

// Server-Authoritative Summoning
app.post('/api/summon', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { bannerId = 'banner_standard_realm', count = 1 } = req.body;
  const player = getOrCreatePlayer(playerId);

  const banner = BANNER_STORE.find((b) => b.bannerId === bannerId) || SUMMON_BANNERS.find((b) => b.bannerId === bannerId) || BANNER_STORE[0] || SUMMON_BANNERS[0];
  const costPerPull = banner.cost.amount;
  const totalCost = costPerPull * count;

  // Validate Currency
  if (banner.cost.type === 'SUMMON_POINTS') {
    if (player.profile.currencies.summonPoints < totalCost) {
      return res.status(400).json({ error: 'Insufficient Summon Points' });
    }
    player.profile.currencies.summonPoints -= totalCost;
  } else {
    if (player.profile.currencies.gems < totalCost) {
      return res.status(400).json({ error: 'Insufficient Gems' });
    }
    player.profile.currencies.gems -= totalCost;
  }

  const results: SummonResult[] = [];
  const currentPity = player.bannerPity[banner.bannerId] || 0;

  for (let i = 0; i < count; i++) {
    const pullPity = currentPity + i + 1;
    // Roll drop rate using cryptographically secure random float in [0, 1)
    const roll = secureRandomFloat();
    let chosenRarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' = 'COMMON';

    const legRate = banner.rates.legendary;
    const epicRate = banner.rates.epic;
    const rareRate = banner.rates.rare;
    const uncRate = banner.rates.uncommon || 0;

    // Pity check
    if (pullPity >= banner.pityThreshold) {
      chosenRarity = 'LEGENDARY';
      player.bannerPity[banner.bannerId] = 0;
    } else if (roll < legRate) {
      chosenRarity = 'LEGENDARY';
      player.bannerPity[banner.bannerId] = 0;
    } else if (roll < legRate + epicRate) {
      chosenRarity = 'EPIC';
    } else if (roll < legRate + epicRate + rareRate) {
      chosenRarity = 'RARE';
    } else if (roll < legRate + epicRate + rareRate + uncRate) {
      chosenRarity = 'UNCOMMON';
    } else {
      chosenRarity = 'COMMON';
    }

    // Filter available variants for this rarity - strictly exclude Continent Bosses and Disabled units
    let eligibleVariants = Object.values(MONSTER_VARIANTS).filter(
      (v) =>
        v.rarity === chosenRarity &&
        !v.isBoss &&
        v.familyId !== 'fam_boss' &&
        !v.variantId.startsWith('var_boss_') &&
        v.isObtainable !== false &&
        !DISABLED_UNITS.has(v.variantId)
    );

    // If banner has featured variants and we rolled their rarity, give 50% chance to pick a featured variant using secure random
    if (
      banner.featuredVariantIds &&
      banner.featuredVariantIds.length > 0 &&
      (chosenRarity === 'LEGENDARY' || chosenRarity === 'EPIC') &&
      secureRandomFloat() < 0.5
    ) {
      const featuredPool = eligibleVariants.filter((v) => banner.featuredVariantIds.includes(v.variantId));
      if (featuredPool.length > 0) {
        eligibleVariants = featuredPool;
      }
    }

    const fallbackVariants = Object.values(MONSTER_VARIANTS).filter(
      (v) =>
        !v.isBoss &&
        v.familyId !== 'fam_boss' &&
        !v.variantId.startsWith('var_boss_') &&
        v.isObtainable !== false &&
        !DISABLED_UNITS.has(v.variantId)
    );

    // Pick variant securely
    const variant =
      eligibleVariants.length > 0
        ? secureRandomChoice(eligibleVariants)
        : secureRandomChoice(fallbackVariants);

    // Check duplicate
    const isDuplicate = player.monsters.some((m) => m.variantId === variant.variantId);

    const newInstance: PlayerMonster = {
      instanceId: `inst_${playerId}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      variantId: variant.variantId,
      playerId,
      level: 1,
      stars: getMonsterStars(null, variant),
      experience: 0,
      awakeningStage: 'BASE',
      equipmentIds: [],
      skillLevels: {},
      locked: false,
      acquiredAt: Date.now(),
    };

    player.monsters.push(newInstance);

    let duplicateCompensation;
    if (isDuplicate) {
      // Award duplicate bonus
      const shardBonus = chosenRarity === 'LEGENDARY' ? 20 : chosenRarity === 'EPIC' ? 10 : 5;
      const goldBonus = 2000;
      player.profile.currencies.gold += goldBonus;
      duplicateCompensation = { gold: goldBonus, shards: shardBonus };
    }

    results.push({
      instance: newInstance,
      variant,
      isNew: !isDuplicate,
      isDuplicate,
      duplicateCompensation,
    });
  }

  player.bannerPity[banner.bannerId] = (player.bannerPity[banner.bannerId] || 0) + count;
  player.profile = recordSummonProgress(player.profile, count);
  player.profile.updatedAt = Date.now();

  // Commit updated state to server database
  savePlayerToDatabase(playerId);

  res.json({
    success: true,
    results,
    currencies: player.profile.currencies,
    pityCount: player.bannerPity[banner.bannerId],
  });
});

// Helper for Summoning Scrolls RNG & Element/Tier Filtering
function rollScrollSummon(scrollType: ScrollType): { variant: MonsterVariant; chosenRarity: Rarity } {
  let chosenRarity: Rarity = 'COMMON';
  let allowedElements: ElementType[] = ['FIRE', 'WATER', 'GRASS'];

  if (scrollType === 'normal') {
    // 1-3 star Water, Fire, Grass
    allowedElements = ['FIRE', 'WATER', 'GRASS'];
    const roll = secureRandomFloat();
    if (roll < 0.10) {
      chosenRarity = 'RARE'; // 3-star (10%)
    } else if (roll < 0.45) {
      chosenRarity = 'UNCOMMON'; // 2-star (35%)
    } else {
      chosenRarity = 'COMMON'; // 1-star (55%)
    }
  } else if (scrollType === 'epic') {
    // 1-5 star Water, Fire, Grass (0.5% chance for a 5-star)
    allowedElements = ['FIRE', 'WATER', 'GRASS'];
    const roll = secureRandomFloat();
    if (roll < 0.005) {
      chosenRarity = 'LEGENDARY'; // 5-star (0.5%)
    } else if (roll < 0.005 + 0.085) {
      chosenRarity = 'EPIC'; // 4-star (8.5%)
    } else if (roll < 0.005 + 0.085 + 0.25) {
      chosenRarity = 'RARE'; // 3-star (25%)
    } else if (roll < 0.005 + 0.085 + 0.25 + 0.33) {
      chosenRarity = 'UNCOMMON'; // 2-star (33%)
    } else {
      chosenRarity = 'COMMON'; // 1-star (33%)
    }
  } else if (scrollType === 'legendary') {
    // 5 star monster Fire, Water, Grass (100% 5★)
    allowedElements = ['FIRE', 'WATER', 'GRASS'];
    chosenRarity = 'LEGENDARY';
  } else if (scrollType === 'lightDark') {
    // 1-5 star Dark or Light monster
    allowedElements = ['LIGHT', 'DARK'];
    const roll = secureRandomFloat();
    if (roll < 0.005) {
      chosenRarity = 'LEGENDARY'; // 5-star (0.5%)
    } else if (roll < 0.005 + 0.085) {
      chosenRarity = 'EPIC'; // 4-star (8.5%)
    } else if (roll < 0.005 + 0.085 + 0.25) {
      chosenRarity = 'RARE'; // 3-star (25%)
    } else if (roll < 0.005 + 0.085 + 0.25 + 0.33) {
      chosenRarity = 'UNCOMMON'; // 2-star (33%)
    } else {
      chosenRarity = 'COMMON'; // 1-star (33%)
    }
  }

  // Filter pool matching elements and rarity (excluding bosses and disabled units)
  let pool = Object.values(MONSTER_VARIANTS).filter(
    (v) =>
      allowedElements.includes(v.element) &&
      v.rarity === chosenRarity &&
      !v.isBoss &&
      v.familyId !== 'fam_boss' &&
      !v.variantId.startsWith('var_boss_') &&
      v.isObtainable !== false &&
      !DISABLED_UNITS.has(v.variantId)
  );

  if (pool.length === 0) {
    pool = Object.values(MONSTER_VARIANTS).filter(
      (v) =>
        allowedElements.includes(v.element) &&
        !v.isBoss &&
        v.familyId !== 'fam_boss' &&
        !v.variantId.startsWith('var_boss_') &&
        v.isObtainable !== false &&
        !DISABLED_UNITS.has(v.variantId)
    );
  }

  const variant = pool.length > 0 ? secureRandomChoice(pool) : Object.values(MONSTER_VARIANTS)[0];
  return { variant, chosenRarity };
}

// Summon using Mystic Scrolls (Normal, Epic, Legendary, Light & Dark)
app.post('/api/summon/scroll', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { scrollType = 'normal', count = 1 } = req.body;
  const player = getOrCreatePlayer(playerId);

  if (!player.profile.scrolls) {
    player.profile.scrolls = { normal: 5, epic: 1, legendary: 0, lightDark: 0 };
  }

  const validTypes: ScrollType[] = ['normal', 'epic', 'legendary', 'lightDark'];
  if (!validTypes.includes(scrollType)) {
    return res.status(400).json({ error: 'Invalid scroll type' });
  }

  const available = player.profile.scrolls[scrollType] || 0;
  if (available < count) {
    const scrollNames = {
      normal: 'Normal Mystical Scroll',
      epic: 'Epic Mystical Scroll',
      legendary: 'Legendary Sovereign Scroll',
      lightDark: 'Light and Dark Scroll',
    };
    return res.status(400).json({
      error: `Not enough ${scrollNames[scrollType as ScrollType]}s! You have ${available}, need ${count}.`,
    });
  }

  player.profile.scrolls[scrollType] -= count;
  const results: SummonResult[] = [];

  for (let i = 0; i < count; i++) {
    const { variant, chosenRarity } = rollScrollSummon(scrollType as ScrollType);
    const isDuplicate = player.monsters.some((m) => m.variantId === variant.variantId);

    const newInstance: PlayerMonster = {
      instanceId: `inst_${playerId}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      variantId: variant.variantId,
      playerId,
      level: 1,
      stars: getMonsterStars(null, variant),
      experience: 0,
      awakeningStage: 'BASE',
      equipmentIds: [],
      skillLevels: {},
      locked: false,
      acquiredAt: Date.now(),
    };

    player.monsters.push(newInstance);

    let duplicateCompensation;
    if (isDuplicate) {
      const shardBonus = chosenRarity === 'LEGENDARY' ? 20 : chosenRarity === 'EPIC' ? 10 : 5;
      const goldBonus = 2000;
      player.profile.currencies.gold += goldBonus;
      duplicateCompensation = { gold: goldBonus, shards: shardBonus };
    }

    results.push({
      instance: newInstance,
      variant,
      isNew: !isDuplicate,
      isDuplicate,
      duplicateCompensation,
    });
  }

  player.profile = recordSummonProgress(player.profile, count);
  player.profile.updatedAt = Date.now();
  savePlayerToDatabase(playerId);

  res.json({
    success: true,
    scrollType,
    count,
    results,
    scrolls: player.profile.scrolls,
    currencies: player.profile.currencies,
    monsters: player.monsters,
  });
});

// ============================================================
// 24-HOUR ROTATING DAILY SHOP ENDPOINTS
// ============================================================

// 1. Fetch current shop items and countdown
app.get('/api/shop', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);

  player.profile.shop = syncRotatingShop(player.profile.shop);
  savePlayerToDatabase(playerId);

  res.json({
    success: true,
    shop: player.profile.shop,
    currencies: player.profile.currencies,
    scrolls: player.profile.scrolls,
  });
});

// 2. Buy shop item
app.post('/api/shop/buy', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { itemId } = req.body;
  const player = getOrCreatePlayer(playerId);

  player.profile.shop = syncRotatingShop(player.profile.shop);
  const shop = player.profile.shop;
  const item = shop.items.find((it) => it.id === itemId);

  if (!item) {
    return res.status(404).json({ error: 'Shop item not found or has rotated.' });
  }

  if (item.isSold) {
    return res.status(400).json({ error: 'This item is already sold out!' });
  }

  const cost = item.cost.amount;
  const currency = item.cost.currency;

  if (currency === 'gold') {
    if ((player.profile.currencies.gold || 0) < cost) {
      return res.status(400).json({
        error: `Insufficient Gold! Requires ${cost.toLocaleString()} Gold (you have ${player.profile.currencies.gold.toLocaleString()}).`,
      });
    }
    player.profile.currencies.gold -= cost;
  } else {
    if ((player.profile.currencies.gems || 0) < cost) {
      return res.status(400).json({
        error: `Insufficient Gems! Requires ${cost} Gems (you have ${player.profile.currencies.gems}).`,
      });
    }
    player.profile.currencies.gems -= cost;
  }

  // Credit rewards
  if (!player.profile.scrolls) {
    player.profile.scrolls = { normal: 5, epic: 1, legendary: 0, lightDark: 0 };
  }

  if (item.reward.scrollType && item.reward.scrollCount) {
    player.profile.scrolls[item.reward.scrollType] =
      (player.profile.scrolls[item.reward.scrollType] || 0) + item.reward.scrollCount;
  }

  if (item.reward.stamina) {
    const maxStamina = player.profile.currencies.maxEnergy || 100;
    player.profile.currencies.energy = Math.min(
      maxStamina * 3,
      (player.profile.currencies.energy || 0) + item.reward.stamina
    );
  }

  if (item.reward.elementalStone) {
    const { element, size, count } = item.reward.elementalStone;
    if (!player.profile.elementalStones) {
      player.profile.elementalStones = {
        FIRE: { small: 0, medium: 0, huge: 0 },
        WATER: { small: 0, medium: 0, huge: 0 },
        GRASS: { small: 0, medium: 0, huge: 0 },
        LIGHT: { small: 0, medium: 0, huge: 0 },
        DARK: { small: 0, medium: 0, huge: 0 },
        MAGIC: { small: 0, medium: 0, huge: 0 },
      };
    }
    if (player.profile.elementalStones[element]) {
      player.profile.elementalStones[element][size] += count;
    }
  }

  let grantedEquipment: EquipmentItem | null = null;
  if (item.reward.equipmentItem || item.reward.equipmentSlot) {
    const newEq: EquipmentItem = item.reward.equipmentItem
      ? { ...item.reward.equipmentItem }
      : rollEquipmentPiece({
          slot: item.reward.equipmentSlot || 'WEAPON',
          rarity: 'COMMON',
          level: 1,
        });
    player.equipment.push(newEq);
    grantedEquipment = newEq;
  }

  item.isSold = true;
  player.profile.updatedAt = Date.now();
  savePlayerToDatabase(playerId);

  res.json({
    success: true,
    item,
    acquiredEquipment: grantedEquipment,
    shop: player.profile.shop,
    currencies: player.profile.currencies,
    scrolls: player.profile.scrolls,
    elementalStones: player.profile.elementalStones,
    equipment: player.equipment,
    message: grantedEquipment
      ? `Acquired ${grantedEquipment.name} (${grantedEquipment.mainStat.stat.toUpperCase()} +${grantedEquipment.mainStat.value}${grantedEquipment.mainStat.isPercent ? '%' : ''})!`
      : `Successfully purchased ${item.name}!`,
  });
});

// 3. Early refresh for 50 gems
app.post('/api/shop/refresh', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);
  const refreshCost = 50;

  if ((player.profile.currencies.gems || 0) < refreshCost) {
    return res.status(400).json({
      error: `Refreshing the Magic Shop requires ${refreshCost} Gems (you have ${player.profile.currencies.gems || 0}).`,
    });
  }

  player.profile.currencies.gems -= refreshCost;
  player.profile.shop = {
    lastRotationTimestamp: Date.now(),
    nextRotationTimestamp: Date.now() + ROTATION_INTERVAL_MS,
    items: generateDailyShopItems(),
  };

  player.profile.updatedAt = Date.now();
  savePlayerToDatabase(playerId);

  res.json({
    success: true,
    shop: player.profile.shop,
    currencies: player.profile.currencies,
    message: 'Magic Shop refreshed with 4 new wares!',
  });
});

// PvE Battle Start (Energy & Sequential Unlock Validation)
app.post('/api/battle/pve/start', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { stageId } = req.body;
  const player = getOrCreatePlayer(playerId);

  const isSparring = stageId?.startsWith('spar_') || stageId?.includes('sparring');
  const isPvP = stageId?.startsWith('pvp_') || stageId?.includes('pvp');

  let stage = getStageById(stageId) || PVE_STAGES.find((s) => s.stageId === stageId);
  if (!stage) {
    if (isSparring) {
      stage = {
        stageId,
        continentId: 'sparring_arena',
        chapter: 1,
        stageNumber: 1,
        name: 'Sparring Match',
        element: 'FIRE',
        energyCost: 0,
        recommendedPower: 1000,
        description: 'Friendly sparring match against friend formation.',
        enemyVariants: [],
        firstClearRewards: { gold: 0, gems: 0, summonPoints: 0 },
        repeatRewards: { gold: 0, exp: 0 },
      };
    } else if (isPvP) {
      stage = {
        stageId,
        continentId: 'pvp_arena',
        chapter: 1,
        stageNumber: 1,
        name: 'PvP Duel',
        element: 'FIRE',
        energyCost: 0,
        recommendedPower: 1000,
        description: 'Tactical PvP Arena duel.',
        enemyVariants: [],
        firstClearRewards: { gold: 800, gems: 5, summonPoints: 30 },
        repeatRewards: { gold: 800, exp: 0 },
      };
    } else {
      stage = PVE_STAGES[0];
    }
  }

  // Validate sequential unlock rules for campaign stages
  if (!isSparring && !isPvP) {
    const unlocked = isStageUnlocked(stage.stageId, player.profile.completedStages);
    if (!unlocked) {
      return res.status(400).json({
        error: 'Stage Locked! You must clear previous stages and continent bosses in sequential order first.',
      });
    }
  }

  // 1. Authoritative stamina regeneration calculation based strictly on server time
  calculateServerStaminaRegen(player);

  const energyCost = (isSparring || isPvP) ? 0 : (stage.energyCost || 0);
  if (player.profile.currencies.energy < energyCost) {
    return res.status(400).json({
      error: `Insufficient Energy (⚡ ${energyCost} required, you have ⚡ ${player.profile.currencies.energy}) to start battle`,
    });
  }

  // Validate that active party has at least 1 unit and contains no disabled units
  const partyInstanceIds = player.profile.activeParty || [];
  let partyMonsters = partyInstanceIds
    .map((id) => player.monsters.find((m) => m.instanceId === id))
    .filter((m): m is PlayerMonster => !!m);

  if (partyMonsters.length === 0) {
    partyMonsters = player.monsters.slice(0, 5);
  }

  const disabledMonster = partyMonsters.find((m) => DISABLED_UNITS.has(m.variantId));
  if (disabledMonster) {
    const vName = MONSTER_VARIANTS[disabledMonster.variantId]?.name || disabledMonster.variantId;
    return res.status(400).json({
      error: `Cannot start battle! ${vName} is currently disabled in DevTools. Please remove them from your party first.`,
    });
  }

  if (partyMonsters.length === 0) {
    return res.status(400).json({ error: 'Cannot start battle! Your active party has no available units.' });
  }

  player.profile.currencies.energy = Math.max(0, player.profile.currencies.energy - energyCost);
  player.profile.updatedAt = Date.now();

  // Commit updated state to server database
  savePlayerToDatabase(playerId);

  res.json({
    success: true,
    stage,
    remainingEnergy: player.profile.currencies.energy,
    currencies: player.profile.currencies,
  });
});

// PvE Battle Complete (Claim Rewards, Record Victory, Unlock Next Stage)
app.post('/api/battle/pve/complete', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { stageId, isVictory } = req.body;
  const player = getOrCreatePlayer(playerId);

  const isSparring = stageId?.startsWith('spar_') || stageId?.includes('sparring');
  const isArena = stageId?.startsWith('arena_') || stageId?.includes('pvp_');

  if (isArena) {
    const oppId = stageId?.startsWith('arena_match_')
      ? stageId.replace('arena_match_', '').split('_').slice(0, -1).join('_')
      : 'rival_starter_kai';
    const { leaderboard } = getFullArenaLeaderboard(playerId);
    const opponent = leaderboard.find((s) => s.userId === oppId) || SEEDED_ARENA_RIVALS[0];
    const oldPlayerRating = player.profile.arenaRating || 1000;
    const oldOpponentRating = opponent ? opponent.rating : 1000;
    const ratingDelta = calculateRatingDelta(oldPlayerRating, oldOpponentRating, Boolean(isVictory));
    const newRating = Math.max(1000, oldPlayerRating + ratingDelta);

    player.profile.arenaRating = newRating;
    if (isVictory) {
      player.profile.arenaWins = (player.profile.arenaWins || 0) + 1;
      player.profile.currencies.gold += 800;
      player.profile.currencies.summonPoints += 30;
      player.profile.currencies.gems += 5;
      player.profile = recordBattleWinProgress(player.profile);
    } else {
      player.profile.arenaLosses = (player.profile.arenaLosses || 0) + 1;
    }
    player.profile.updatedAt = Date.now();
    savePlayerToDatabase(playerId);

    const newTierConfig = getArenaTier(newRating);
    return res.json({
      success: true,
      isVictory: Boolean(isVictory),
      isArena: true,
      ratingDelta,
      newRating,
      newTier: newTierConfig.tier,
      currencies: player.profile.currencies,
      rewards: isVictory
        ? { gold: 800, summonPoints: 30, gems: 5 }
        : { gold: 0, summonPoints: 0, gems: 0 },
      message: 'Arena match concluded.',
    });
  }

  if (!isVictory) {
    return res.json({
      success: true,
      isVictory: false,
      isSparring,
      currencies: player.profile.currencies,
      message: 'Battle recorded (Defeat). No rewards gained.',
    });
  }

  // Friendly sparring matches grant no gold, no monster EXP, and no account EXP
  if (isSparring) {
    player.profile = recordBattleWinProgress(player.profile);
    return res.json({
      success: true,
      isVictory: true,
      isSparring: true,
      goldEarned: 0,
      expEarned: 0,
      accountExpEarned: 0,
      droppedEquipment: null,
      currencies: player.profile.currencies,
      message: 'Friendly sparring match completed. No gold or experience gained.',
    });
  }

  const stage = getStageById(stageId) || PVE_STAGES.find((s) => s.stageId === stageId) || PVE_STAGES[0];

  const isFirstClear = !player.profile.completedStages.includes(stageId);
  if (isFirstClear) {
    player.profile.completedStages.push(stageId);
    // Award first clear bonus
    player.profile.currencies.gold += stage.firstClearRewards.gold;
    player.profile.currencies.gems += stage.firstClearRewards.gems;
    player.profile.currencies.summonPoints += stage.firstClearRewards.summonPoints;
  }

  // Award repeat rewards
  const goldReward = stage.repeatRewards.gold;
  player.profile.currencies.gold += goldReward;

  // Record 3-star rating on victory
  const existingStars = player.profile.stageStars[stageId] || 0;
  player.profile.stageStars[stageId] = Math.max(existingStars, 3);

  // Roll Equipment Drop for Dungeon stages
  let droppedEquipment = null;
  if (stage.dungeonType || stage.droppedSlot) {
    const slot = stage.droppedSlot || (stage.dungeonType as any);
    // User requirement: Dungeon equipment drops should not be guaranteed rarity:
    // Level 1 = Common (50%), Uncommon (40%), Rare (10%)
    // Level 2 = Uncommon (50%), Rare (40%), Epic (10%)
    // Level 3 = Rare (50%), Epic (40%), Legendary (10%)
    const dungeonLevel = stage.dungeonLevel || stage.stageNumber || 1;
    const rarity = rollDungeonEquipmentRarity(dungeonLevel);
    const level = 1;
    const maxSlots = player.profile.maxEquipmentSlots || 60;
    if (player.equipment.length < maxSlots) {
      droppedEquipment = rollEquipmentPiece({ slot, rarity, level });
      player.equipment.push(droppedEquipment);
    }
  }

  // Roll Elemental Stone Drops for Elemental Dungeon stages (Hall of Fire, Water, Grass, Light, Dark, Magic)
  let droppedStones: any = null;
  const isElementalDungeon =
    Boolean(stage.elementalDungeonType) ||
    (stageId.startsWith('dungeon_') &&
      ['fire', 'water', 'grass', 'light', 'dark', 'magic'].some((el) => stageId.includes(`dungeon_${el}`)));

  if (isElementalDungeon) {
    const elemKey = (stage.elementalDungeonType || stageId.split('_')[1]?.toUpperCase()) as ElementalDungeonType;
    const floor = stage.dungeonLevel || parseInt(stageId.split('_')[2], 10) || 1;

    droppedStones = rollElementalStoneDrops(elemKey, floor);

    if (!player.profile.elementalStones) {
      player.profile.elementalStones = {
        FIRE: { small: 0, medium: 0, huge: 0 },
        WATER: { small: 0, medium: 0, huge: 0 },
        GRASS: { small: 0, medium: 0, huge: 0 },
        LIGHT: { small: 0, medium: 0, huge: 0 },
        DARK: { small: 0, medium: 0, huge: 0 },
        MAGIC: { small: 0, medium: 0, huge: 0 },
      };
    }

    if (droppedStones.element !== 'MAGIC' && player.profile.elementalStones[droppedStones.element]) {
      const inv = player.profile.elementalStones[droppedStones.element];
      inv.small += droppedStones.elemental.small;
      inv.medium += droppedStones.elemental.medium;
      inv.huge += droppedStones.elemental.huge;
    }

    if (player.profile.elementalStones.MAGIC) {
      const magicInv = player.profile.elementalStones.MAGIC;
      magicInv.small += droppedStones.magic.small;
      magicInv.medium += droppedStones.magic.medium;
      magicInv.huge += droppedStones.magic.huge;
    }
  }

  // Roll Summoning Scroll drops:
  // 1. Normal Scroll: Found in Campaign if lucky (1-3★ Water/Fire/Grass)
  // 2. Epic Scroll: Found in middle-to-high level Dungeons if lucky (Floor 4-10)
  let droppedScroll: { type: 'normal' | 'epic'; name: string; count: number } | null = null;
  const isCampaignStage = Boolean(stage.chapter && stage.chapter >= 1) || stageId.startsWith('stage_');
  const isDungeonStage = Boolean(stage.dungeonType || stage.elementalDungeonType || stageId.startsWith('dungeon_'));
  const currentFloor = stage.dungeonLevel || parseInt(stageId.split('_')[2], 10) || 1;

  if (!player.profile.scrolls) {
    player.profile.scrolls = { normal: 5, epic: 1, legendary: 0, lightDark: 0 };
  }

  if (isCampaignStage) {
    // Lucky drop chance in Campaign (25% on normal stages, 45% on chapter boss overlord stages)
    const luckyRoll = secureRandomFloat();
    const luckyThreshold = stage.isBossStage ? 0.45 : 0.25;
    if (luckyRoll < luckyThreshold) {
      player.profile.scrolls.normal = (player.profile.scrolls.normal || 0) + 1;
      droppedScroll = { type: 'normal', name: 'Normal Mystical Scroll', count: 1 };
    }
  } else if (isDungeonStage && currentFloor >= 4) {
    // Lucky drop chance in Middle to High Level Dungeons (Floor 4 - 10)
    // Floor 4-7: 12% chance; Floor 8-10: 20% chance
    const luckyRoll = secureRandomFloat();
    const luckyThreshold = currentFloor >= 8 ? 0.20 : 0.12;
    if (luckyRoll < luckyThreshold) {
      player.profile.scrolls.epic = (player.profile.scrolls.epic || 0) + 1;
      droppedScroll = { type: 'epic', name: 'Epic Mystical Scroll', count: 1 };
    }
  }

  // Party-size XP bonus calculation
  // 1 unit  -> 200% (2.00x) -> Solo Bonus: +100%
  // 2 units -> 175% (1.75x) -> Party Bonus: +75%
  // 3 units -> 150% (1.50x) -> Party Bonus: +50%
  // 4 units -> 125% (1.25x) -> Party Bonus: +25%
  // 5 units -> 100% (1.00x) -> Party Bonus: +0%
  const partySizeMultiplierMap: Record<number, number> = {
    1: 2.0,
    2: 1.75,
    3: 1.5,
    4: 1.25,
    5: 1.0,
  };

  const rawPartySize = Number(req.body.partySize) || player.profile.activeParty?.length || 1;
  const partySize = Math.max(1, Math.min(5, Math.floor(rawPartySize)));
  const expMultiplier = partySizeMultiplierMap[partySize] ?? 1.0;
  const baseExp = stage.repeatRewards.exp;
  const finalExp = Math.round(baseExp * expMultiplier);

  // Add EXP to active participating team
  const activePartyIds = player.profile.activeParty || [];
  let participatingMonsters = player.monsters.filter((m) => activePartyIds.includes(m.instanceId));
  if (participatingMonsters.length === 0) {
    participatingMonsters = player.monsters.slice(0, partySize);
  }

  for (const monster of participatingMonsters) {
    monster.experience += finalExp;
    while (monster.experience >= monster.level * 100 && monster.level < 30) {
      monster.experience -= monster.level * 100;
      monster.level += 1;
    }
  }

  // Calculate next unlocked stage
  const nextStage = getNextStage(stageId);
  if (nextStage) {
    player.profile.highestUnlockedStage = nextStage.stageId;
  }

  // Check if a continent boss was defeated
  const isBossDefeated = !!stage.isBossStage;
  let newContinentUnlocked = null;
  if (isBossDefeated) {
    const nextContinent = CONTINENTS.find((c) => c.chapter === stage.chapter + 1);
    if (nextContinent) {
      newContinentUnlocked = nextContinent;
    }
  }

  // Add Account Experience & Level-Up check
  const accountExpEarned = Math.max(25, Math.round(baseExp * 0.5));
  player.profile.experience = (player.profile.experience || 0) + accountExpEarned;
  let didAccountLevelUp = false;
  while ((player.profile.accountLevel || 1) < 50) {
    const expNeeded = 100 + (player.profile.accountLevel || 1) * 50;
    if (player.profile.experience >= expNeeded) {
      player.profile.accountLevel = (player.profile.accountLevel || 1) + 1;
      player.profile.experience = 0; // Profile experience is reset to 0 whenever you level up
      didAccountLevelUp = true;
    } else {
      break;
    }
  }

  player.profile = recordBattleWinProgress(player.profile);
  player.profile.updatedAt = Date.now();
  savePlayerToDatabase(playerId);

  res.json({
    success: true,
    isVictory: true,
    isFirstClear,
    firstClearRewards: isFirstClear ? stage.firstClearRewards : null,
    goldEarned: goldReward + (isFirstClear ? stage.firstClearRewards.gold : 0),
    gemsEarned: isFirstClear ? stage.firstClearRewards.gems : 0,
    summonPointsEarned: isFirstClear ? stage.firstClearRewards.summonPoints : 0,
    baseExp,
    partySize,
    expMultiplier,
    expEarned: finalExp,
    accountExpEarned,
    accountLevel: player.profile.accountLevel,
    accountExp: player.profile.experience,
    didAccountLevelUp,
    isBossDefeated,
    newContinentUnlocked,
    nextStageId: nextStage?.stageId,
    completedStages: player.profile.completedStages,
    stageStars: player.profile.stageStars,
    currencies: player.profile.currencies,
    monsters: player.monsters,
    profile: player.profile,
    droppedEquipment,
    droppedStones,
    droppedScroll,
    elementalStones: player.profile.elementalStones,
    scrolls: player.profile.scrolls,
    equipment: player.equipment,
  });
});

// ============================================================
// ASYNCHRONOUS PVP ARENA & RATING HIGHSCORES
// ============================================================

// 1. Fetch Player's Arena Profile & Defense Squad Status
app.get('/api/arena/profile', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);
  calculateArenaTicketsRegen(player);

  const { playerRank, playerEntry } = getFullArenaLeaderboard(playerId);
  const tierConfig = getArenaTier(player.profile.arenaRating || 1000);

  const nextRefillSeconds =
    (player.profile.arenaTickets ?? 10) < 10
      ? Math.max(
          0,
          900 - Math.floor((Date.now() - (player.profile.lastArenaTicketRefill || Date.now())) / 1000)
        )
      : 0;

  const profile: ArenaProfile = {
    rating: player.profile.arenaRating || 1000,
    tier: tierConfig.tier,
    rank: playerRank,
    wins: player.profile.arenaWins || 0,
    losses: player.profile.arenaLosses || 0,
    defenseWins: player.profile.arenaDefenseWins || 0,
    defenseLosses: player.profile.arenaDefenseLosses || 0,
    tickets: player.profile.arenaTickets ?? 10,
    maxTickets: 10,
    nextTicketInSeconds: nextRefillSeconds,
    defenseTeam: playerEntry.defenseMonsters,
    defensePower: playerEntry.defensePower,
  };

  res.json({ success: true, profile });
});

// 2. Save Player's 1-to-5 Monster Arena Defense Team
app.post('/api/arena/defense', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);
  const { monsterInstanceIds } = req.body;

  if (!Array.isArray(monsterInstanceIds) || monsterInstanceIds.length === 0) {
    return res.status(400).json({ error: 'Defense team must contain between 1 and 5 monsters.' });
  }

  const ownedIds = new Set(player.monsters.map((m) => m.instanceId));
  const validIds = monsterInstanceIds.filter((id) => ownedIds.has(id)).slice(0, 5);

  if (validIds.length === 0) {
    return res.status(400).json({ error: 'None of the chosen monsters exist in your squad.' });
  }

  // Check if any selected unit is disabled
  const disabledUnit = validIds.find((id) => {
    const mon = player.monsters.find((m) => m.instanceId === id);
    return mon && DISABLED_UNITS.has(mon.variantId);
  });
  if (disabledUnit) {
    return res.status(400).json({ error: 'One of your chosen defense monsters is currently disabled in DevTools.' });
  }

  player.profile.defenseTeam = validIds;
  player.profile.updatedAt = Date.now();
  savePlayerToDatabase(playerId);

  const summoner = buildPlayerArenaSummoner(player);
  const { playerRank } = getFullArenaLeaderboard(playerId);
  const tierConfig = getArenaTier(summoner.rating);

  res.json({
    success: true,
    message: 'Defense lineup successfully registered to the Grand Arena!',
    defenseTeam: summoner.defenseMonsters,
    defensePower: summoner.defensePower,
    summoner,
    profile: {
      rating: summoner.rating,
      tier: tierConfig.tier,
      rank: playerRank,
      wins: summoner.wins,
      losses: summoner.losses,
      defenseWins: player.profile.arenaDefenseWins || 0,
      defenseLosses: player.profile.arenaDefenseLosses || 0,
      tickets: player.profile.arenaTickets ?? 10,
      maxTickets: 10,
      nextTicketInSeconds: 0,
      defenseTeam: summoner.defenseMonsters,
      defensePower: summoner.defensePower,
    },
  });
});

// 3. Fetch Matched Opponents for Matchmaking
app.get('/api/arena/opponents', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);
  calculateArenaTicketsRegen(player);

  const { leaderboard } = getFullArenaLeaderboard(playerId);
  const opponents = getMatchedOpponents(player.profile.arenaRating || 1000, playerId, leaderboard);

  res.json({ success: true, opponents });
});

// 4. Initiate an Arena Match Against an Opponent's Defense Squad
app.post('/api/arena/match/start', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);
  calculateArenaTicketsRegen(player);

  const { opponentId } = req.body;
  const { leaderboard } = getFullArenaLeaderboard(playerId);
  const opponent = leaderboard.find((s) => s.userId === opponentId);

  if (!opponent) {
    return res.status(404).json({ error: 'Opponent summoner not found in Arena registry.' });
  }

  if ((player.profile.arenaTickets ?? 10) <= 0) {
    return res.status(400).json({
      error: 'No Arena duel tickets available! You need at least 1 ticket to challenge a rival.',
    });
  }

  // Consume 1 arena ticket
  player.profile.arenaTickets = Math.max(0, (player.profile.arenaTickets ?? 10) - 1);
  savePlayerToDatabase(playerId);

  const stageId = `arena_match_${opponent.userId}_${Date.now()}`;
  const stage: PvEStage = {
    stageId,
    continentId: 'pvp_arena',
    chapter: 1,
    stageNumber: 1,
    name: `Arena Duel: ${opponent.displayName}`,
    element: opponent.defenseMonsters[0]?.element || 'FIRE',
    energyCost: 0,
    recommendedPower: opponent.defensePower,
    description: `Tactical 5v5 Arena duel against ${opponent.displayName} (${opponent.tier} Tier). Vanquish their defense squad to claim rating and glory!`,
    enemyVariants: opponent.defenseMonsters.map((m, idx) => ({
      variantId: m.variantId,
      level: m.level,
      slotIndex: idx,
      awakeningStage: m.awakeningStage,
      stars: m.stars || 4,
    })),
    firstClearRewards: { gold: 1200, gems: 10, summonPoints: 30 },
    repeatRewards: { gold: 800, exp: 0 },
  };

  res.json({
    success: true,
    stage,
    remainingTickets: player.profile.arenaTickets,
  });
});

// 5. Conclude an Arena Battle: Update Ratings, Record Wins/Losses, and Award Rewards
app.post('/api/arena/match/complete', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);
  const { stageId, opponentId, isVictory } = req.body;

  const { leaderboard } = getFullArenaLeaderboard(playerId);
  const opponent = leaderboard.find((s) => s.userId === opponentId) || SEEDED_ARENA_RIVALS[0];

  const oldPlayerRating = player.profile.arenaRating || 1000;
  const oldOpponentRating = opponent ? opponent.rating : 1000;
  const ratingDelta = calculateRatingDelta(oldPlayerRating, oldOpponentRating, Boolean(isVictory));
  const newRating = Math.max(1000, oldPlayerRating + ratingDelta);

  player.profile.arenaRating = newRating;

  if (isVictory) {
    player.profile.arenaWins = (player.profile.arenaWins || 0) + 1;
    // Award arena triumph rewards
    player.profile.currencies.gold += 800;
    player.profile.currencies.summonPoints += 30;
    player.profile.currencies.gems += 5;
    player.profile = recordBattleWinProgress(player.profile);
  } else {
    player.profile.arenaLosses = (player.profile.arenaLosses || 0) + 1;
  }

  player.profile.updatedAt = Date.now();

  // If opponent is a real player stored on the server, update their defense win/loss record
  if (PLAYER_STORE[opponentId]) {
    if (isVictory) {
      PLAYER_STORE[opponentId].profile.arenaDefenseLosses =
        (PLAYER_STORE[opponentId].profile.arenaDefenseLosses || 0) + 1;
      PLAYER_STORE[opponentId].profile.arenaRating = Math.max(
        1000,
        (PLAYER_STORE[opponentId].profile.arenaRating || 1000) - Math.abs(Math.round(ratingDelta * 0.5))
      );
    } else {
      PLAYER_STORE[opponentId].profile.arenaDefenseWins =
        (PLAYER_STORE[opponentId].profile.arenaDefenseWins || 0) + 1;
      PLAYER_STORE[opponentId].profile.arenaRating =
        (PLAYER_STORE[opponentId].profile.arenaRating || 1000) + Math.round(Math.abs(ratingDelta) * 0.7);
    }
    PLAYER_STORE[opponentId].profile.updatedAt = Date.now();
    savePlayerToDatabase(opponentId);
  }

  savePlayerToDatabase(playerId);

  // Record battle log entry
  if (!ARENA_LOGS_STORE[playerId]) ARENA_LOGS_STORE[playerId] = [];
  const logEntry: ArenaBattleLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'ATTACK',
    opponentName: opponent.displayName,
    opponentAvatarVariantId: opponent.avatarVariantId,
    opponentRating: oldOpponentRating,
    isVictory: Boolean(isVictory),
    ratingDelta,
    timestamp: Date.now(),
  };
  ARENA_LOGS_STORE[playerId].unshift(logEntry);
  if (ARENA_LOGS_STORE[playerId].length > 30) {
    ARENA_LOGS_STORE[playerId].pop();
  }

  const newTierConfig = getArenaTier(newRating);

  res.json({
    success: true,
    isVictory: Boolean(isVictory),
    ratingDelta,
    newRating,
    newTier: newTierConfig.tier,
    rewards: isVictory
      ? { gold: 800, summonPoints: 30, gems: 5 }
      : { gold: 0, summonPoints: 0, gems: 0 },
    opponent: {
      userId: opponent.userId,
      displayName: opponent.displayName,
      oldRating: oldOpponentRating,
      newRating: Math.max(1000, oldOpponentRating - (isVictory ? Math.round(ratingDelta * 0.5) : 0)),
    },
  });
});

// 6. Highscore Leaderboard: Ranked Top Summoners Across the Realm
app.get('/api/arena/leaderboard', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const searchQuery = (req.query.search as string) || '';

  const { leaderboard, playerRank, playerEntry } = getFullArenaLeaderboard(playerId);

  let filtered = leaderboard;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = leaderboard.filter(
      (s) =>
        s.displayName.toLowerCase().includes(q) ||
        s.tier.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    leaderboard: filtered,
    totalSummoners: leaderboard.length,
    playerRank,
    playerEntry,
  });
});

// 7. Recent Battle Logs (Attacks & Defenses)
app.get('/api/arena/logs', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const logs = ARENA_LOGS_STORE[playerId] || [];
  res.json({ success: true, logs });
});

// Development Tools & Testing Sandbox Actions - Strictly restricted to Dean or deanvantessel@gmail.com
app.post('/api/devtools/action', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const playerEmail = (req.headers['x-player-email'] as string) || '';
  const { action, payload } = req.body;
  const player = getOrCreatePlayer(playerId);

  // Dev tools are strictly restricted to Dean or deanvantessel@gmail.com
  const isAuthorized = isDevAccount(player.profile?.username) || isDevAccount(playerEmail);
  if (!isAuthorized) {
    return res.status(403).json({
      error: 'Dev tools are disabled. Only the owner account (Dean / deanvantessel@gmail.com) has access to developer tools.',
    });
  }

  switch (action) {
    case 'ADD_CURRENCY':
      player.profile.currencies.gold += 100000;
      player.profile.currencies.gems += 2000;
      player.profile.currencies.summonPoints += 1000;
      player.profile.currencies.energy = player.profile.currencies.maxEnergy;
      break;

    case 'SET_ENERGY': {
      const targetEnergy = Math.max(0, Math.min(player.profile.currencies.maxEnergy, Number(payload?.energy) ?? 10));
      player.profile.currencies.energy = targetEnergy;
      break;
    }

    case 'COMPLETE_DAILY_MISSIONS': {
      let p = syncDailyMissionsState(player.profile);
      p = recordPlaytimeTick(p, 3600);
      p = recordBattleWinProgress(p);
      p = recordBattleWinProgress(p);
      p = recordBattleWinProgress(p);
      p = recordSummonProgress(p, 1);
      player.profile = p;
      break;
    }

    case 'FAST_FORWARD_PLAYTIME': {
      const seconds = Number(payload?.seconds) || 3600;
      player.profile = recordPlaytimeTick(player.profile, seconds);
      break;
    }

    case 'RESET_DAILY_MISSIONS': {
      player.profile.dailyMissions = createDefaultDailyMissions();
      break;
    }

    case 'ADD_ACCOUNT_EXP': {
      const expAmount = Number(payload?.amount) || 500;
      player.profile.experience = (player.profile.experience || 0) + expAmount;
      while ((player.profile.accountLevel || 1) < 50) {
        const expNeeded = 100 + (player.profile.accountLevel || 1) * 50;
        if (player.profile.experience >= expNeeded) {
          player.profile.accountLevel = (player.profile.accountLevel || 1) + 1;
          player.profile.experience = 0; // Profile experience is reset to 0 whenever you level up
        } else {
          break;
        }
      }
      break;
    }

    case 'SET_ACCOUNT_LEVEL': {
      const targetLvl = Math.max(1, Math.min(50, Number(payload?.level) || 5));
      player.profile.accountLevel = targetLvl;
      player.profile.experience = 0;
      break;
    }

    case 'RESET_NAME_CHANGE': {
      player.profile.hasChangedName = false;
      player.profile.nameChangesCount = 0;
      break;
    }

    case 'ADD_SYNTHESIS_CATALYSTS': {
      // Pairs of identical species (family) sharing the exact same star rating for immediate testing
      const testPairs: Array<{ variantId: string; stars: number; level: number }> = [
        // 5★ -> 6★ Test (Water Nekohime Host + Fire Nekohime Catalyst)
        { variantId: 'var_nekohime_water', stars: 5, level: 15 },
        { variantId: 'var_nekohime_fire', stars: 5, level: 10 },
        // 6★ -> 7★ Test (Grass Nekohime Host + Dark Nekohime Catalyst)
        { variantId: 'var_nekohime_grass', stars: 6, level: 20 },
        { variantId: 'var_nekohime_dark', stars: 6, level: 20 },
        // 9★ -> 10★ Apex Sovereign Test (Light Nekohime Host + Water Nekohime Catalyst)
        { variantId: 'var_nekohime_light', stars: 9, level: 30 },
        { variantId: 'var_nekohime_water', stars: 9, level: 25 },
        // 3★ -> 4★ Test (Pyrosaurs)
        { variantId: 'var_pyrosaur_fire', stars: 3, level: 10 },
        { variantId: 'var_pyrosaur_water', stars: 3, level: 10 },
        // 1★ -> 2★ Test (Tideguards)
        { variantId: 'var_tideguard_water', stars: 1, level: 5 },
        { variantId: 'var_tideguard_fire', stars: 1, level: 5 },
      ];

      testPairs.forEach((pair, idx) => {
        player.monsters.push({
          instanceId: `inst_${playerId}_testcat_${pair.variantId}_${pair.stars}s_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
          variantId: pair.variantId,
          playerId,
          level: pair.level,
          stars: pair.stars,
          experience: 0,
          awakeningStage: 'BASE',
          equipmentIds: [],
          skillLevels: {},
          locked: false,
          acquiredAt: Date.now(),
        });
      });
      player.profile.currencies.gold += 300000;
      break;
    }

    case 'MAX_ALL_MONSTERS':
      player.monsters.forEach((m) => {
        m.level = 30;
      });
      break;

    case 'AWAKEN_ALL_MONSTERS':
      player.monsters.forEach((m) => {
        m.awakeningStage = 'AWAKENED';
      });
      break;

    case 'GRANT_ELEMENTAL_STONES': {
      if (!player.profile.elementalStones) {
        player.profile.elementalStones = {
          FIRE: { small: 0, medium: 0, huge: 0 },
          WATER: { small: 0, medium: 0, huge: 0 },
          GRASS: { small: 0, medium: 0, huge: 0 },
          LIGHT: { small: 0, medium: 0, huge: 0 },
          DARK: { small: 0, medium: 0, huge: 0 },
          MAGIC: { small: 0, medium: 0, huge: 0 },
        };
      }
      const stoneElements: ElementalDungeonType[] = ['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK', 'MAGIC'];
      stoneElements.forEach((el) => {
        if (!player.profile.elementalStones[el]) {
          player.profile.elementalStones[el] = { small: 0, medium: 0, huge: 0 };
        }
        player.profile.elementalStones[el].small += 100;
        player.profile.elementalStones[el].medium += 50;
        player.profile.elementalStones[el].huge += 25;
      });
      player.profile.currencies.gold += 500000;
      savePlayerToDatabase(playerId);
      break;
    }

    case 'GRANT_SCROLLS': {
      if (!player.profile.scrolls) {
        player.profile.scrolls = { normal: 0, epic: 0, legendary: 0, lightDark: 0 };
      }
      player.profile.scrolls.normal = (player.profile.scrolls.normal || 0) + 10;
      player.profile.scrolls.epic = (player.profile.scrolls.epic || 0) + 5;
      player.profile.scrolls.legendary = (player.profile.scrolls.legendary || 0) + 3;
      player.profile.scrolls.lightDark = (player.profile.scrolls.lightDark || 0) + 3;
      savePlayerToDatabase(playerId);
      break;
    }

    case 'UNLOCK_ALL_VARIANTS': {
      const existingVariants = new Set(player.monsters.map((m) => m.variantId));
      for (const variant of Object.values(MONSTER_VARIANTS)) {
        // Skip un-obtainable Continent Bosses
        if (
          variant.isBoss ||
          variant.familyId === 'fam_boss' ||
          variant.variantId.startsWith('var_boss_') ||
          variant.isObtainable === false
        ) {
          continue;
        }
        if (!existingVariants.has(variant.variantId)) {
          player.monsters.push({
            instanceId: `inst_${playerId}_dev_${variant.variantId}`,
            variantId: variant.variantId,
            playerId,
            level: 15,
            experience: 0,
            awakeningStage: 'BASE',
            equipmentIds: [],
            skillLevels: {},
            locked: false,
            acquiredAt: Date.now(),
          });
        }
      }
      break;
    }

    case 'UNLOCK_STAGE_1_10': {
      // Clear stages 1-1 through 1-9 so player can directly fight the 1-10 Boss
      player.profile.completedStages = PVE_STAGES.filter(
        (s) => s.chapter === 1 && s.stageNumber < 10
      ).map((s) => s.stageId);
      player.profile.completedStages.forEach((id) => {
        player.profile.stageStars[id] = 3;
      });
      player.profile.highestUnlockedStage = 'stage_1_10';
      break;
    }

    case 'UNLOCK_CONTINENT_2': {
      // Defeat 1-10 Boss and unlock Stage 2-1
      player.profile.completedStages = PVE_STAGES.filter(
        (s) => s.chapter === 1
      ).map((s) => s.stageId);
      player.profile.completedStages.forEach((id) => {
        player.profile.stageStars[id] = 3;
      });
      player.profile.highestUnlockedStage = 'stage_2_1';
      break;
    }

    case 'UNLOCK_ALL_CAMPAIGN':
    case 'UNLOCK_ALL_STAGES': {
      player.profile.completedStages = PVE_STAGES.map((s) => s.stageId);
      player.profile.completedStages.forEach((id) => {
        player.profile.stageStars[id] = 3;
      });
      player.profile.highestUnlockedStage = 'stage_5_10';
      if (player.profile.tutorialState) {
        player.profile.tutorialState.isCompleted = true;
        player.profile.tutorialState.isSkipped = true;
      }
      break;
    }

    case 'UNLOCK_ALL_CONTINENTS': {
      const continentBosses = ['stage_1_10', 'stage_2_10', 'stage_3_10', 'stage_4_10'];
      continentBosses.forEach((id) => {
        if (!player.profile.completedStages.includes(id)) {
          player.profile.completedStages.push(id);
        }
        player.profile.stageStars[id] = 3;
      });
      player.profile.highestUnlockedStage = 'stage_5_1';
      if (player.profile.tutorialState) {
        player.profile.tutorialState.isCompleted = true;
        player.profile.tutorialState.isSkipped = true;
      }
      break;
    }

    case 'UNLOCK_CONTINENT_UP_TO': {
      const targetChapter = Number(payload?.chapter) || 2;
      const stagesToClear = PVE_STAGES.filter((s) => s.chapter < targetChapter).map((s) => s.stageId);
      stagesToClear.forEach((id) => {
        if (!player.profile.completedStages.includes(id)) {
          player.profile.completedStages.push(id);
        }
        player.profile.stageStars[id] = 3;
      });
      player.profile.highestUnlockedStage = `stage_${targetChapter}_1`;
      if (player.profile.tutorialState) {
        player.profile.tutorialState.isCompleted = true;
        player.profile.tutorialState.isSkipped = true;
      }
      break;
    }

    case 'RESET_CAMPAIGN': {
      player.profile.completedStages = [];
      player.profile.stageStars = {};
      player.profile.highestUnlockedStage = 'stage_1_1';
      break;
    }

    case 'RESET_ACCOUNT': {
      delete PLAYER_STORE[playerId];
      const fresh = getOrCreatePlayer(playerId);
      return res.json({ success: true, message: 'Account fully reset', state: fresh });
    }
  }

  player.profile.updatedAt = Date.now();
  res.json({ success: true, action, state: player });
});

// ============================================================
// CUSTOM UNITS & CREATOR ENDPOINTS
// ============================================================

app.get('/api/units/custom', (req: Request, res: Response) => {
  const customUnitsFile = path.join(process.cwd(), 'src', 'data', 'custom_units.json');
  let customData = { families: [], variants: [] };
  if (fs.existsSync(customUnitsFile)) {
    try {
      customData = JSON.parse(fs.readFileSync(customUnitsFile, 'utf8'));
    } catch (err) {
      console.warn('Failed reading custom_units.json', err);
    }
  }
  res.json({ success: true, ...customData });
});

app.post('/api/units/create', (req: Request, res: Response) => {
  try {
    const playerId = (req.headers['x-player-id'] as string) || 'player_default';
    const { family, variant, autoGrantToRoster = true, startingLevel = 15, startingStars } = req.body;

    if (!variant || !variant.variantId || !variant.name || !variant.element) {
      return res.status(400).json({ error: 'Missing required variant parameters (variantId, name, element)' });
    }

    // 1. Register family if provided
    if (family && family.familyId) {
      MONSTER_FAMILIES[family.familyId] = family;
    }

    // 2. Register variant
    MONSTER_VARIANTS[variant.variantId] = variant;

    // 3. Create asset folder: public/assets/characters/<unitSlug>/<elementSlug>/
    const rawUnit = variant.familyId ? variant.familyId.replace(/^fam_/, '') : variant.variantId.replace(/^var_/, '').split('_')[0];
    const unitSlug = rawUnit.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const elemSlug = String(variant.element).toLowerCase();
    const unitDir = path.join(process.cwd(), 'public', 'assets', 'characters', unitSlug, elemSlug);

    if (!fs.existsSync(unitDir)) {
      fs.mkdirSync(unitDir, { recursive: true });
      const readmeContent = `# ${variant.name} (${variant.element})\n\nCanonical asset folder for ${variant.name}.\n\nExpected character sprite files (PNG):\n- IDLE.png\n- ATTACK.png\n- HURT.png\n- DEAD.png (or DEFEATED.png)\n- VICTORY.png\n- PORTRAIT.png\n`;
      fs.writeFileSync(path.join(unitDir, 'README.md'), readmeContent);
    }

    // 4. Save to src/data/custom_units.json
    const customUnitsFile = path.join(process.cwd(), 'src', 'data', 'custom_units.json');
    let customData: { families: any[]; variants: any[] } = { families: [], variants: [] };
    if (fs.existsSync(customUnitsFile)) {
      try {
        customData = JSON.parse(fs.readFileSync(customUnitsFile, 'utf8'));
      } catch {
        customData = { families: [], variants: [] };
      }
    }

    // Upsert family
    if (family && family.familyId) {
      const existingFamIdx = customData.families.findIndex((f) => f.familyId === family.familyId);
      if (existingFamIdx >= 0) {
        customData.families[existingFamIdx] = family;
      } else {
        customData.families.push(family);
      }
    }

    // Upsert variant
    const existingVarIdx = customData.variants.findIndex((v) => v.variantId === variant.variantId);
    if (existingVarIdx >= 0) {
      customData.variants[existingVarIdx] = variant;
    } else {
      customData.variants.push(variant);
    }

    fs.writeFileSync(customUnitsFile, JSON.stringify(customData, null, 2));

    // 5. Auto-grant to player's roster if requested
    let newMonster = null;
    if (autoGrantToRoster) {
      const player = getOrCreatePlayer(playerId);
      const stars = startingStars || variant.stars || 3;
      newMonster = {
        instanceId: `inst_${playerId}_custom_${variant.variantId}_${Date.now()}`,
        variantId: variant.variantId,
        playerId,
        level: Number(startingLevel) || 15,
        stars,
        experience: 0,
        awakeningStage: 'BASE' as AwakeningStage,
        equipmentIds: [],
        skillLevels: {},
        locked: false,
        acquiredAt: Date.now(),
      };
      player.monsters.push(newMonster);
    }

    res.json({
      success: true,
      message: `Successfully created and registered ${variant.name}!`,
      family: MONSTER_FAMILIES[variant.familyId],
      variant,
      newMonster,
      directory: `public/assets/characters/${unitSlug}/${elemSlug}/`,
    });
  } catch (err: any) {
    console.error('Error creating custom unit:', err);
    res.status(500).json({ error: err.message || 'Internal server error creating unit' });
  }
});

app.post('/api/units/grant', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { variantId, level = 15, stars } = req.body;
  const variant = MONSTER_VARIANTS[variantId];
  if (!variant) {
    return res.status(404).json({ error: `Variant ${variantId} not found in database` });
  }
  const player = getOrCreatePlayer(playerId);
  const newMonster: PlayerMonster = {
    instanceId: `inst_${playerId}_grant_${variantId}_${Date.now()}`,
    variantId,
    playerId,
    level: Number(level) || 15,
    stars: stars || variant.stars || 3,
    experience: 0,
    awakeningStage: 'BASE',
    equipmentIds: [],
    skillLevels: {},
    locked: false,
    acquiredAt: Date.now(),
  };
  player.monsters.push(newMonster);
  res.json({ success: true, monster: newMonster, message: `Granted ${variant.name} to player roster.` });
});

app.delete('/api/units/custom/:variantId', (req: Request, res: Response) => {
  const { variantId } = req.params;
  delete MONSTER_VARIANTS[variantId];

  const customUnitsFile = path.join(process.cwd(), 'src', 'data', 'custom_units.json');
  if (fs.existsSync(customUnitsFile)) {
    try {
      const customData = JSON.parse(fs.readFileSync(customUnitsFile, 'utf8'));
      customData.variants = customData.variants.filter((v: any) => v.variantId !== variantId);
      fs.writeFileSync(customUnitsFile, JSON.stringify(customData, null, 2));
    } catch (err) {
      console.warn('Error updating custom_units.json during delete', err);
    }
  }
  res.json({ success: true, message: `Removed custom unit ${variantId}` });
});

// ============================================================
// DISABLED UNITS DEVTOOLS ENDPOINTS
// ============================================================

app.get('/api/units/disabled', (req: Request, res: Response) => {
  res.json({
    success: true,
    disabledVariantIds: Array.from(DISABLED_UNITS),
  });
});

app.post('/api/units/disabled/toggle', (req: Request, res: Response) => {
  const { variantId, disabled } = req.body;
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';

  if (!variantId || typeof variantId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid variantId' });
  }

  const shouldDisable = typeof disabled === 'boolean' ? disabled : !DISABLED_UNITS.has(variantId);

  if (shouldDisable) {
    DISABLED_UNITS.add(variantId);
    if (MONSTER_VARIANTS[variantId]) {
      MONSTER_VARIANTS[variantId].disabled = true;
    }
  } else {
    DISABLED_UNITS.delete(variantId);
    if (MONSTER_VARIANTS[variantId]) {
      MONSTER_VARIANTS[variantId].disabled = false;
    }
  }

  saveDisabledUnitsToFile();

  // If a unit was disabled, automatically purge them from player active parties to prevent invalid state
  if (shouldDisable) {
    const player = getOrCreatePlayer(playerId);
    const ownedOfVariant = new Set(
      player.monsters.filter((m) => m.variantId === variantId).map((m) => m.instanceId)
    );
    player.profile.activeParty = (player.profile.activeParty || []).filter((id) => !ownedOfVariant.has(id));
    if (player.profile.activeParty.length === 0 && player.monsters.length > 0) {
      const firstEnabled = player.monsters.find((m) => !DISABLED_UNITS.has(m.variantId));
      if (firstEnabled) {
        player.profile.activeParty = [firstEnabled.instanceId];
      }
    }
  }

  res.json({
    success: true,
    variantId,
    disabled: shouldDisable,
    disabledVariantIds: Array.from(DISABLED_UNITS),
  });
});

app.post('/api/units/disabled/bulk', (req: Request, res: Response) => {
  const { variantIds, disabled } = req.body;
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';

  if (!Array.isArray(variantIds)) {
    return res.status(400).json({ error: 'variantIds must be an array of strings' });
  }

  const shouldDisable = Boolean(disabled);

  variantIds.forEach((id: string) => {
    if (typeof id === 'string') {
      if (shouldDisable) {
        DISABLED_UNITS.add(id);
        if (MONSTER_VARIANTS[id]) MONSTER_VARIANTS[id].disabled = true;
      } else {
        DISABLED_UNITS.delete(id);
        if (MONSTER_VARIANTS[id]) MONSTER_VARIANTS[id].disabled = false;
      }
    }
  });

  saveDisabledUnitsToFile();

  // If disabling, sanitize player active party
  if (shouldDisable) {
    const player = getOrCreatePlayer(playerId);
    player.profile.activeParty = (player.profile.activeParty || []).filter((id) => {
      const m = player.monsters.find((mon) => mon.instanceId === id);
      return m && !DISABLED_UNITS.has(m.variantId);
    });
    if (player.profile.activeParty.length === 0 && player.monsters.length > 0) {
      const firstEnabled = player.monsters.find((m) => !DISABLED_UNITS.has(m.variantId));
      if (firstEnabled) {
        player.profile.activeParty = [firstEnabled.instanceId];
      }
    }
  }

  res.json({
    success: true,
    disabledVariantIds: Array.from(DISABLED_UNITS),
  });
});

// ============================================================
// AWAKENING TUNING DEVTOOLS ENDPOINTS
// ============================================================

app.get('/api/awakening/costs', (req: Request, res: Response) => {
  res.json({
    success: true,
    overrides: getAllAwakeningCostOverrides(),
  });
});

app.post('/api/awakening/cost', (req: Request, res: Response) => {
  try {
    const { variantId, cost } = req.body;
    if (!variantId || !cost) {
      return res.status(400).json({ error: 'Missing variantId or cost' });
    }

    setAwakeningCostOverride(variantId, cost);
    saveAwakeningCostsToFile();

    res.json({
      success: true,
      variantId,
      cost: getAwakeningCost({ variantId, element: cost.element, rarity: 'RARE' }),
      overrides: getAllAwakeningCostOverrides(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update awakening cost' });
  }
});

app.post('/api/awakening/cost/reset', (req: Request, res: Response) => {
  try {
    const { variantId } = req.body;
    if (!variantId) {
      return res.status(400).json({ error: 'Missing variantId' });
    }

    setAwakeningCostOverride(variantId, null);
    saveAwakeningCostsToFile();

    res.json({
      success: true,
      variantId,
      overrides: getAllAwakeningCostOverrides(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reset awakening cost' });
  }
});

app.post('/api/awakening/cost/reset-all', (req: Request, res: Response) => {
  try {
    setAllAwakeningCostOverrides({});
    saveAwakeningCostsToFile();

    res.json({
      success: true,
      overrides: {},
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reset all awakening costs' });
  }
});

app.post('/api/awakening/cost/bulk', (req: Request, res: Response) => {
  try {
    const { overrides } = req.body;
    if (!overrides || typeof overrides !== 'object') {
      return res.status(400).json({ error: 'Invalid overrides object' });
    }

    Object.entries(overrides).forEach(([id, cost]: [string, any]) => {
      setAwakeningCostOverride(id, cost);
    });
    saveAwakeningCostsToFile();

    res.json({
      success: true,
      overrides: getAllAwakeningCostOverrides(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to apply bulk awakening costs' });
  }
});

// ============================================================
// NEWS & ANNOUNCEMENTS LIVE OPERATIONS ENDPOINTS
// ============================================================

app.get('/api/news', (req: Request, res: Response) => {
  res.json({
    success: true,
    news: NEWS_STORE,
  });
});

app.post('/api/news', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const playerEmail = (req.headers['x-player-email'] as string) || '';
  const player = getOrCreatePlayer(playerId);

  const isAuthorized = isDevAccount(player.profile?.username) || isDevAccount(playerEmail);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Unauthorized: News editing is restricted to Dean / owner accounts.' });
  }

  try {
    const newsData = req.body as Partial<NewsItem>;
    if (!newsData.title || !newsData.title.trim()) {
      return res.status(400).json({ error: 'Announcement title is required' });
    }

    const now = Date.now();
    let updatedItem: NewsItem;

    if (newsData.id) {
      const idx = NEWS_STORE.findIndex((n) => n.id === newsData.id);
      if (idx !== -1) {
        updatedItem = {
          ...NEWS_STORE[idx],
          ...newsData,
          updatedAt: now,
        } as NewsItem;
        NEWS_STORE[idx] = updatedItem;
      } else {
        updatedItem = {
          id: newsData.id,
          title: newsData.title.trim(),
          tagline: newsData.tagline || 'Announcement',
          date: newsData.date || 'Updated recently',
          category: newsData.category || 'UPDATE',
          badgeText: newsData.badgeText || 'UPDATE',
          icon: newsData.icon || 'Megaphone',
          headline: newsData.headline,
          sections: newsData.sections || [],
          actionButton: newsData.actionButton,
          isPublished: newsData.isPublished !== false,
          createdAt: now,
          updatedAt: now,
        };
        NEWS_STORE.unshift(updatedItem);
      }
    } else {
      updatedItem = {
        id: `news_${now}`,
        title: newsData.title.trim(),
        tagline: newsData.tagline || 'Announcement',
        date: newsData.date || 'Updated today',
        category: newsData.category || 'UPDATE',
        badgeText: newsData.badgeText || 'UPDATE',
        icon: newsData.icon || 'Megaphone',
        headline: newsData.headline,
        sections: newsData.sections || [],
        actionButton: newsData.actionButton,
        isPublished: newsData.isPublished !== false,
        createdAt: now,
        updatedAt: now,
      };
      NEWS_STORE.unshift(updatedItem);
    }

    saveNewsDatabase();
    res.json({
      success: true,
      news: updatedItem,
      allNews: NEWS_STORE,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save news announcement' });
  }
});

app.delete('/api/news/:id', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const playerEmail = (req.headers['x-player-email'] as string) || '';
  const player = getOrCreatePlayer(playerId);

  const isAuthorized = isDevAccount(player.profile?.username) || isDevAccount(playerEmail);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Unauthorized: News deletion is restricted to Dean / owner accounts.' });
  }

  const { id } = req.params;
  NEWS_STORE = NEWS_STORE.filter((n) => n.id !== id);
  saveNewsDatabase();

  res.json({
    success: true,
    message: `Deleted news announcement ${id}`,
    allNews: NEWS_STORE,
  });
});

app.post('/api/news/reset', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const playerEmail = (req.headers['x-player-email'] as string) || '';
  const player = getOrCreatePlayer(playerId);

  const isAuthorized = isDevAccount(player.profile?.username) || isDevAccount(playerEmail);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Restore defaults
  NEWS_STORE = [
    {
      id: 'news_major_release_1_0',
      title: 'MAJOR RELEASE: 3-Wave Dungeons, PvP Arena & New Monsters!',
      tagline: 'Version 1.0 • Major Update',
      date: 'Version 1.0 • Updated today',
      category: 'MAJOR',
      badgeText: 'MAJOR RELEASE',
      icon: 'Megaphone',
      headline: {
        title: 'NEW UNITS ADDED, PVP & EQUIPMENT DUNGEONS RELEASED!',
        content: 'Welcome to the latest version of Monster Realms! We have rolled out 3-wave equipment dungeons, tiered substat equipment drops, the PvP Arena system, and enhanced Astral Portal banners.',
        badge: 'VERSION 1.0',
      },
      sections: [
        {
          title: '3-Wave Equipment Dungeons (Minion > Minion > Boss)',
          icon: 'Shield',
          content: 'Dungeons now feature consecutive 3-wave gauntlets. Vanquish the minions in waves 1 & 2 before facing off against the colossal stage Boss in wave 3! Drops include tiered gear with random substats.',
          bulletPoints: [
            'Common & Uncommon: 1 Main Stat.',
            'Rare Gear: 1 Main Stat + 1 Substat.',
            'Epic Gear: 1 Main Stat + 2 Substats.',
            'Legendary Gear: 1 Main Stat + 3 Substats.',
            'Stats roll both flat values and percentage bonuses (+% ATK, +% HP, +% DEF, SPD).',
          ],
        },
        {
          title: 'PvP Arena & Friendly Sparring',
          icon: 'Swords',
          content: 'Test your tactical compositions in the Grand PvP Arena. Climb the competitive ranks or spar with friends.',
          bulletPoints: [
            'Challenge 4 tiers of rival Summoners (Bronze, Silver, Gold, Master).',
            'Friendly sparring matches against friends with 0 energy cost for pure tactical testing.',
          ],
        },
        {
          title: 'New Monster Families: Silly Clown & Mage Student',
          icon: 'Sparkles',
          content: 'Added 4★ Silly Clown (wildcard AoE disruption, Turn Meter shuffling, and Confusion) and 3★ Mage Student (dedicated arcane healer and support). Both available across all 5 elements with full combat animations!',
        },
      ],
      actionButton: {
        label: 'SUMMON NEW MONSTERS',
        targetTab: 'SUMMON',
      },
      isPublished: true,
      createdAt: 1727670000000,
      updatedAt: 1727670000000,
    },
    {
      id: 'news_astral_carnival_event',
      title: 'Astral Carnival Event & Rate UP Celebration',
      tagline: 'Limited Time Event',
      date: 'Active Event',
      category: 'EVENT',
      badgeText: 'EVENT LIVE',
      icon: 'Sparkles',
      headline: {
        title: 'THE ASTRAL PORTAL HAS ALIGNED WITH THE HIGH ARCANUM!',
        content: 'During this event period, summoners enjoy increased rates and bonus mystical scrolls across all realm activities.',
        badge: 'SPECIAL RATES',
      },
      sections: [
        {
          title: 'Featured Banner Highlights',
          icon: 'Flame',
          content: 'Featured summon banners enjoy a 5x rate-up for featured legendary and epic variants with generous pity counters.',
          bulletPoints: [
            'Guaranteed Legendary at pity threshold.',
            'Duplicate pulls award bonus Summon Points and Awakening Essences.',
            'Collect all 5 elemental variants (Fire, Water, Grass, Light, Dark) in the Codex.',
          ],
        },
      ],
      actionButton: {
        label: 'OPEN ASTRAL PORTAL',
        targetTab: 'SUMMON',
      },
      isPublished: true,
      createdAt: 1727660000000,
      updatedAt: 1727660000000,
    },
  ];

  saveNewsDatabase();
  res.json({ success: true, allNews: NEWS_STORE });
});

// ============================================================
// SUMMON BANNERS LIVE OPERATIONS ENDPOINTS
// ============================================================

app.get('/api/banners', (req: Request, res: Response) => {
  res.json({
    success: true,
    banners: BANNER_STORE,
  });
});

app.post('/api/banners', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const playerEmail = (req.headers['x-player-email'] as string) || '';
  const player = getOrCreatePlayer(playerId);

  const isAuthorized = isDevAccount(player.profile?.username) || isDevAccount(playerEmail);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Unauthorized: Banner editing is restricted to Dean / owner accounts.' });
  }

  try {
    const bannerData = req.body as SummonBanner;
    if (!bannerData.name || !bannerData.bannerId) {
      return res.status(400).json({ error: 'Banner ID and Name are required' });
    }

    const idx = BANNER_STORE.findIndex((b) => b.bannerId === bannerData.bannerId);
    if (idx !== -1) {
      BANNER_STORE[idx] = {
        ...BANNER_STORE[idx],
        ...bannerData,
      };
    } else {
      BANNER_STORE.push(bannerData);
    }

    saveBannerDatabase();
    res.json({
      success: true,
      banner: bannerData,
      allBanners: BANNER_STORE,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update summon banner' });
  }
});

app.post('/api/banners/set-featured', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const playerEmail = (req.headers['x-player-email'] as string) || '';
  const player = getOrCreatePlayer(playerId);

  const isAuthorized = isDevAccount(player.profile?.username) || isDevAccount(playerEmail);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const { name, description, featuredVariantIds, costAmount, pityThreshold, rates } = req.body;
    let featuredBanner = BANNER_STORE.find((b) => b.bannerId === 'banner_featured_nekohime' || b.bannerId.includes('featured'));
    if (!featuredBanner) {
      featuredBanner = BANNER_STORE[0];
    }

    if (featuredBanner) {
      if (name) featuredBanner.name = name;
      if (description) featuredBanner.description = description;
      if (featuredVariantIds && Array.isArray(featuredVariantIds)) featuredBanner.featuredVariantIds = featuredVariantIds;
      if (costAmount) featuredBanner.cost.amount = Number(costAmount);
      if (pityThreshold) featuredBanner.pityThreshold = Number(pityThreshold);
      if (rates) featuredBanner.rates = rates;
    }

    saveBannerDatabase();
    res.json({
      success: true,
      banner: featuredBanner,
      allBanners: BANNER_STORE,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update featured banner' });
  }
});

app.delete('/api/banners/:id', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const playerEmail = (req.headers['x-player-email'] as string) || '';
  const player = getOrCreatePlayer(playerId);

  const isAuthorized = isDevAccount(player.profile?.username) || isDevAccount(playerEmail);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;
  if (BANNER_STORE.length <= 1) {
    return res.status(400).json({ error: 'Cannot delete the only remaining summon banner.' });
  }

  BANNER_STORE = BANNER_STORE.filter((b) => b.bannerId !== id);
  saveBannerDatabase();

  res.json({
    success: true,
    allBanners: BANNER_STORE,
  });
});

app.post('/api/banners/reset', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const playerEmail = (req.headers['x-player-email'] as string) || '';
  const player = getOrCreatePlayer(playerId);

  const isAuthorized = isDevAccount(player.profile?.username) || isDevAccount(playerEmail);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  BANNER_STORE = JSON.parse(JSON.stringify(SUMMON_BANNERS));
  saveBannerDatabase();

  res.json({
    success: true,
    allBanners: BANNER_STORE,
  });
});

// ============================================================
// ADMIN EVENT GIFTER & PLAYER DISTRIBUTION ENDPOINTS
// ============================================================

app.get('/api/admin/players', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const playerEmail = (req.headers['x-player-email'] as string) || '';
  const player = getOrCreatePlayer(playerId);

  const isAuthorized = isDevAccount(player.profile?.username) || isDevAccount(playerEmail);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Unauthorized: Player administration is restricted to Dean / owner accounts.' });
  }

  const list = Object.values(PLAYER_STORE).map((p) => ({
    playerId: p.profile.playerId,
    username: p.profile.username || 'Unnamed Summoner',
    accountLevel: p.profile.accountLevel || 1,
    avatarVariantId: p.profile.avatarVariantId || 'var_pyrosaur_fire',
    monstersCount: p.monsters?.length || 0,
    currencies: p.profile.currencies,
  }));

  res.json({
    success: true,
    players: list,
  });
});

app.post('/api/admin/gift', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const playerEmail = (req.headers['x-player-email'] as string) || '';
  const player = getOrCreatePlayer(playerId);

  const isAuthorized = isDevAccount(player.profile?.username) || isDevAccount(playerEmail);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Unauthorized: Event Gifting is restricted to Dean / owner accounts.' });
  }

  try {
    const payload = req.body as EventGiftPayload;
    const { target, targetPlayerId, deliveryMethod = 'MAILBOX', title, message, senderName, rewards } = payload;

    if (!rewards || typeof rewards !== 'object') {
      return res.status(400).json({ error: 'Rewards object is required' });
    }

    // Determine target recipient accounts
    let targetPlayers: ServerPlayerState[] = [];

    if (target === 'ALL') {
      targetPlayers = Object.values(PLAYER_STORE);
    } else if (target === 'SELF') {
      targetPlayers = [player];
    } else if (target === 'SPECIFIC') {
      if (targetPlayerId) {
        const found = PLAYER_STORE[targetPlayerId];
        if (found) {
          targetPlayers = [found];
        } else {
          // Check by username
          const byName = Object.values(PLAYER_STORE).find(
            (p) => p.profile.username?.toLowerCase() === targetPlayerId.toLowerCase()
          );
          if (byName) {
            targetPlayers = [byName];
          }
        }
      }
      if (targetPlayers.length === 0) {
        return res.status(404).json({ error: `Could not find player matching identifier "${targetPlayerId}"` });
      }
    } else {
      targetPlayers = Object.values(PLAYER_STORE);
    }

    const now = Date.now();
    const eventMailTitle = title?.trim() || '🌟 Special Realm Event Care Package';
    const eventMailMessage =
      message?.trim() ||
      'Greetings, Summoner! The High Council of Monster Realms grants you these provisions in celebration of the realm event. May fortune bless your summons and battles!';
    const eventSenderName = senderName?.trim() || 'The High Council';

    // Distribute rewards to all chosen players
    targetPlayers.forEach((targetPlayer) => {
      // 1. Deliver to Mailbox
      if (deliveryMethod === 'MAILBOX' || deliveryMethod === 'BOTH') {
        const mailItem: MailItem = {
          id: `mail_event_${now}_${crypto.randomBytes(3).toString('hex')}`,
          senderType: 'GAME',
          senderName: eventSenderName,
          senderAvatarVariantId: 'var_pyrosaur_fire',
          title: eventMailTitle,
          message: eventMailMessage,
          reward: rewards,
          isClaimed: deliveryMethod === 'BOTH', // If BOTH, delivered and immediately credited
          isRead: false,
          sentAt: now,
        };

        if (!targetPlayer.profile.mailbox) {
          targetPlayer.profile.mailbox = [];
        }
        targetPlayer.profile.mailbox.unshift(mailItem);
      }

      // 2. Direct Inject to inventory & currencies
      if (deliveryMethod === 'DIRECT' || deliveryMethod === 'BOTH') {
        if (rewards.gold) targetPlayer.profile.currencies.gold += rewards.gold;
        if (rewards.gems) targetPlayer.profile.currencies.gems += rewards.gems;
        if (rewards.energy) targetPlayer.profile.currencies.energy = Math.min(9999, targetPlayer.profile.currencies.energy + rewards.energy);
        if (rewards.summonPoints) targetPlayer.profile.currencies.summonPoints += rewards.summonPoints;

        // Scrolls
        if (rewards.scrolls) {
          if (!targetPlayer.profile.scrolls) {
            targetPlayer.profile.scrolls = { normal: 0, epic: 0, legendary: 0, lightDark: 0 };
          }
          if (rewards.scrolls.normal) targetPlayer.profile.scrolls.normal = (targetPlayer.profile.scrolls.normal || 0) + rewards.scrolls.normal;
          if (rewards.scrolls.epic) targetPlayer.profile.scrolls.epic = (targetPlayer.profile.scrolls.epic || 0) + rewards.scrolls.epic;
          if (rewards.scrolls.legendary) targetPlayer.profile.scrolls.legendary = (targetPlayer.profile.scrolls.legendary || 0) + rewards.scrolls.legendary;
          if (rewards.scrolls.lightDark) targetPlayer.profile.scrolls.lightDark = (targetPlayer.profile.scrolls.lightDark || 0) + rewards.scrolls.lightDark;
        }

        // Elemental Awakening Stones
        if (rewards.stones) {
          if (!targetPlayer.profile.elementalStones) {
            targetPlayer.profile.elementalStones = {
              FIRE: { small: 0, medium: 0, huge: 0 },
              WATER: { small: 0, medium: 0, huge: 0 },
              GRASS: { small: 0, medium: 0, huge: 0 },
              LIGHT: { small: 0, medium: 0, huge: 0 },
              DARK: { small: 0, medium: 0, huge: 0 },
              MAGIC: { small: 0, medium: 0, huge: 0 },
            };
          }
          Object.entries(rewards.stones).forEach(([el, amounts]) => {
            const stoneEl = el.toUpperCase() as ElementalDungeonType;
            if (!targetPlayer.profile.elementalStones[stoneEl]) {
              targetPlayer.profile.elementalStones[stoneEl] = { small: 0, medium: 0, huge: 0 };
            }
            if (amounts.small) targetPlayer.profile.elementalStones[stoneEl].small += amounts.small;
            if (amounts.medium) targetPlayer.profile.elementalStones[stoneEl].medium += amounts.medium;
            if (amounts.huge) targetPlayer.profile.elementalStones[stoneEl].huge += amounts.huge;
          });
        }

        // Monsters
        if (rewards.monsters && Array.isArray(rewards.monsters)) {
          rewards.monsters.forEach((m) => {
            const variant = MONSTER_VARIANTS[m.variantId];
            if (variant) {
              const newInst: PlayerMonster = {
                instanceId: `inst_${targetPlayer.profile.playerId}_event_${m.variantId}_${now}_${crypto.randomBytes(2).toString('hex')}`,
                variantId: m.variantId,
                playerId: targetPlayer.profile.playerId,
                level: m.level || 15,
                stars: m.stars || variant.stars || 4,
                experience: 0,
                awakeningStage: 'BASE',
                equipmentIds: [],
                skillLevels: {},
                locked: false,
                acquiredAt: now,
              };
              targetPlayer.monsters.push(newInst);
            }
          });
        }
      }

      // Persist each modified player
      savePlayerToDatabase(targetPlayer.profile.playerId);
    });

    // Record to persistent event gifts log
    const logFile = path.join(process.cwd(), 'src', 'data', 'event_gifts_log.json');
    try {
      let logs: any[] = [];
      if (fs.existsSync(logFile)) {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf8')) || [];
      }
      logs.unshift({
        id: `gift_log_${now}`,
        timestamp: now,
        sender: player.profile.username || 'Dean',
        target,
        recipientsCount: targetPlayers.length,
        recipientNames: targetPlayers.map((p) => p.profile.username || p.profile.playerId),
        deliveryMethod,
        title: eventMailTitle,
        rewards,
      });
      // Keep last 100 entries
      if (logs.length > 100) logs = logs.slice(0, 100);
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf8');
    } catch (logErr) {
      console.warn('Failed logging event gift:', logErr);
    }

    res.json({
      success: true,
      recipientsCount: targetPlayers.length,
      deliveryMethod,
      message: `Successfully gifted event rewards to ${targetPlayers.length} player(s)!`,
      gift: payload,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to distribute event gifts' });
  }
});

app.get('/api/admin/gifts/logs', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const playerEmail = (req.headers['x-player-email'] as string) || '';
  const player = getOrCreatePlayer(playerId);

  const isAuthorized = isDevAccount(player.profile?.username) || isDevAccount(playerEmail);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const logFile = path.join(process.cwd(), 'src', 'data', 'event_gifts_log.json');
  let logs: any[] = [];
  if (fs.existsSync(logFile)) {
    try {
      logs = JSON.parse(fs.readFileSync(logFile, 'utf8')) || [];
    } catch (_) {
      logs = [];
    }
  }

  res.json({ success: true, logs });
});

// ============================================================
// 2D CHARACTER SPRITE ASSET ENDPOINTS
// ============================================================

app.get('/api/sprites/status', (req: Request, res: Response) => {
  const families = ['nekohime', 'shadowstalker', 'freedancer', 'pyrosaur', 'tideguard', 'floraweaver', 'luminary', 'boss'];
  const states = ['idle', 'attack', 'hurt', 'dead', 'victory'];
  const statusMap: Record<string, Record<string, boolean>> = {};

  families.forEach((fam) => {
    statusMap[fam] = {};
    states.forEach((st) => {
      const filePath = path.join(process.cwd(), 'public', 'assets', 'characters', fam, `${st}.png`);
      statusMap[fam][st] = fs.existsSync(filePath);
    });
  });

  res.json({ success: true, status: statusMap });
});

app.post('/api/sprites/save', (req: Request, res: Response) => {
  try {
    const { familyId, unitId, state, dataUrl } = req.body;
    const targetId = String(unitId || familyId || '').toLowerCase().trim();
    if (!targetId || !state || !dataUrl) {
      return res.status(400).json({ error: 'Missing required parameters: targetId, state, dataUrl' });
    }

    const isVariant = targetId.startsWith('var_');
    const cleanId = isVariant ? targetId : targetId.replace(/^fam_/, '');
    const cleanState = String(state).toLowerCase();
    const dirPath = isVariant
      ? path.join(process.cwd(), 'public', 'assets', 'characters', 'variants', cleanId)
      : path.join(process.cwd(), 'public', 'assets', 'characters', cleanId);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const targetFile = path.join(dirPath, `${cleanState}.png`);

    fs.writeFileSync(targetFile, buffer);
    const returnUrl = isVariant
      ? `/assets/characters/variants/${cleanId}/${cleanState}.png`
      : `/assets/characters/${cleanId}/${cleanState}.png`;

    console.log(`[2D Sprites] Saved asset for ${cleanId}/${cleanState}.png (${buffer.length} bytes)`);
    res.json({ success: true, url: returnUrl });
  } catch (err) {
    console.error('[2D Sprites] Save error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/sprites/save-sheet', (req: Request, res: Response) => {
  try {
    const { familyId, unitId, states } = req.body;
    const targetId = String(unitId || familyId || '').toLowerCase().trim();
    if (!targetId || !states || typeof states !== 'object') {
      return res.status(400).json({ error: 'Missing targetId or states mapping' });
    }

    const isVariant = targetId.startsWith('var_');
    const cleanId = isVariant ? targetId : targetId.replace(/^fam_/, '');
    const dirPath = isVariant
      ? path.join(process.cwd(), 'public', 'assets', 'characters', 'variants', cleanId)
      : path.join(process.cwd(), 'public', 'assets', 'characters', cleanId);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const saved: string[] = [];
    for (const [st, dataUrl] of Object.entries(states)) {
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
        const cleanState = st.toLowerCase();
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const targetFile = path.join(dirPath, `${cleanState}.png`);
        fs.writeFileSync(targetFile, buffer);
        saved.push(cleanState);
      }
    }

    console.log(`[2D Sprites] Batch saved ${saved.length} states for ${cleanId}: ${saved.join(', ')}`);
    res.json({ success: true, savedStates: saved });
  } catch (err) {
    console.error('[2D Sprites] Batch save error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Map Background & Battleplatform Status & Asset Management
app.get('/api/maps/status', (req: Request, res: Response) => {
  const mapsDir = path.join(process.cwd(), 'public', 'assets', 'maps');
  const mapList = ['forest_shrine', 'volcanic_temple', 'ancient_ruins', 'crystal_cavern', 'moonlit_castle', 'floating_sanctuary'];
  const statusMap: Record<string, { background: boolean; platform: boolean }> = {};
  for (const m of mapList) {
    statusMap[m] = {
      background: fs.existsSync(path.join(mapsDir, `${m}.png`)),
      platform: fs.existsSync(path.join(mapsDir, `${m}_platform.png`)),
    };
  }
  res.json({ success: true, status: statusMap });
});

app.post('/api/maps/save', (req: Request, res: Response) => {
  try {
    const { mapId, dataUrl } = req.body;
    if (!mapId || !dataUrl) {
      return res.status(400).json({ error: 'Missing mapId or dataUrl' });
    }
    const cleanMap = String(mapId).toLowerCase();
    const dirPath = path.join(process.cwd(), 'public', 'assets', 'maps');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const targetFile = path.join(dirPath, `${cleanMap}.png`);
    fs.writeFileSync(targetFile, buffer);
    console.log(`[Maps] Saved map background for ${cleanMap}.png (${buffer.length} bytes)`);
    res.json({ success: true, url: `/assets/maps/${cleanMap}.png` });
  } catch (err) {
    console.error('[Maps] Save error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/maps/save-platform', (req: Request, res: Response) => {
  try {
    const { mapId, dataUrl } = req.body;
    if (!mapId || !dataUrl) {
      return res.status(400).json({ error: 'Missing mapId or dataUrl' });
    }
    const cleanMap = String(mapId).toLowerCase();
    const dirPath = path.join(process.cwd(), 'public', 'assets', 'maps');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const targetFile = path.join(dirPath, `${cleanMap}_platform.png`);
    fs.writeFileSync(targetFile, buffer);
    console.log(`[Maps] Saved battleplatform for ${cleanMap}_platform.png (${buffer.length} bytes)`);
    res.json({ success: true, url: `/assets/maps/${cleanMap}_platform.png` });
  } catch (err) {
    console.error('[Maps] Battleplatform save error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// ============================================================
// MONSTER PORTRAIT UPLOAD ENDPOINTS
// ============================================================

app.get('/api/portraits/status', (req: Request, res: Response) => {
  const statusMap: Record<string, boolean> = {};

  // Check canonical 5-element folders: /assets/characters/[unitName]/[element]/PORTRAIT.png
  const elements = ['dark', 'fire', 'grass', 'light', 'water'];
  const charsDir = path.join(process.cwd(), 'public', 'assets', 'characters');
  const knownUnits = new Set(['nekohime', 'pyrosaur', 'shadowstalker', 'tideguard', 'floraweaver', 'luminary', 'freedancer', 'boss']);
  
  if (fs.existsSync(charsDir)) {
    try {
      const items = fs.readdirSync(charsDir, { withFileTypes: true });
      items.filter(it => it.isDirectory() && it.name !== 'variants').forEach(it => knownUnits.add(it.name.toLowerCase()));
    } catch {
      // ignore
    }
  }

  const units = Array.from(knownUnits);

  units.forEach((u) => {
    elements.forEach((e) => {
      const dir = path.join(charsDir, u, e);
      const portFileUpper = path.join(dir, 'PORTRAIT.png');
      const portFileLower = path.join(dir, 'portrait.png');
      const statusFile = path.join(dir, 'status.png');
      const idleFileUpper = path.join(dir, 'IDLE.png');
      const idleFileLower = path.join(dir, 'idle.png');

      const hasPortrait = fs.existsSync(portFileUpper) || fs.existsSync(portFileLower);
      const hasIdle = fs.existsSync(idleFileUpper) || fs.existsSync(idleFileLower) || fs.existsSync(statusFile);

      if (hasPortrait) {
        statusMap[`${u}_${e}`] = true;
        statusMap[`var_${u}_${e}`] = true;
        statusMap[`/assets/characters/${u}/${e}/PORTRAIT.png`] = true;
        statusMap[`/assets/characters/${u}/${e}/portrait.png`] = true;
      }
      if (hasIdle) {
        statusMap[`/assets/characters/${u}/${e}/IDLE.png`] = true;
        statusMap[`/assets/characters/${u}/${e}/idle.png`] = true;
        statusMap[`/assets/characters/${u}/${e}/status.png`] = true;
      }
    });
  });

  res.json({ success: true, status: statusMap });
});

// Sprite Standardizer Status & Manifest API
app.get('/api/standardizer/status', (req: Request, res: Response) => {
  const manifest = spriteStandardizer.getManifest();
  const sprites = Object.values(manifest.sprites);
  res.json({
    success: true,
    manifest,
    total: sprites.length,
    readyCount: sprites.filter((s) => s.status === 'READY').length,
    warningCount: sprites.filter((s) => s.status === 'WARNING').length,
    errorCount: sprites.filter((s) => s.status === 'ERROR').length,
  });
});

// Sprite Standardizer Manual Reprocess API
app.post('/api/standardizer/reprocess', async (req: Request, res: Response) => {
  try {
    const results = await spriteStandardizer.scanAndStandardizeAll({ force: true });
    res.json({
      success: true,
      message: `Reprocessed ${results.length} character PNGs to 1024x1024 standard canvas.`,
      sprites: results,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get detailed file listing for a character's elemental sprite directory
app.get('/api/characters/sprites/:unit/:element', (req: Request, res: Response) => {
  try {
    const rawUnit = String(req.params.unit || '').toLowerCase().trim();
    const rawElement = String(req.params.element || '').toLowerCase().trim();
    const cleanUnit = rawUnit.replace(/[^a-z0-9_-]/g, '');
    const cleanElement = rawElement.replace(/[^a-z0-9_-]/g, '');

    const dir = path.join(process.cwd(), 'public', 'assets', 'characters', cleanUnit, cleanElement);
    if (!fs.existsSync(dir)) {
      return res.json({ success: true, unit: cleanUnit, element: cleanElement, dir: `public/assets/characters/${cleanUnit}/${cleanElement}/`, files: [] });
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.png'))
      .map((e) => {
        const filePath = path.join(dir, e.name);
        const stats = fs.statSync(filePath);
        const size = stats.size;
        const formattedSize = size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`;
        const stateMatch = e.name.replace(/\.[^/.]+$/, '').toUpperCase();
        return {
          filename: e.name,
          state: stateMatch,
          size,
          formattedSize,
          isZeroByte: size === 0,
          mtime: stats.mtimeMs,
          url: `/assets/characters/${cleanUnit}/${cleanElement}/${e.name}`,
        };
      })
      .sort((a, b) => a.filename.localeCompare(b.filename));

    res.json({
      success: true,
      unit: cleanUnit,
      element: cleanElement,
      dir: `public/assets/characters/${cleanUnit}/${cleanElement}/`,
      files,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a single character sprite file
app.post('/api/characters/sprites/delete-file', (req: Request, res: Response) => {
  try {
    const rawUnit = String(req.body.unit || '').toLowerCase().trim();
    const rawElement = String(req.body.element || '').toLowerCase().trim();
    const rawFilename = String(req.body.filename || '').trim();

    const cleanUnit = rawUnit.replace(/[^a-z0-9_-]/g, '');
    const cleanElement = rawElement.replace(/[^a-z0-9_-]/g, '');
    const cleanFilename = path.basename(rawFilename); // prevents any path traversal

    if (!cleanUnit || !cleanElement || !cleanFilename) {
      return res.status(400).json({ error: 'Missing unit, element, or filename' });
    }

    if (!cleanFilename.toLowerCase().endsWith('.png')) {
      return res.status(400).json({ error: 'Only .png character sprites can be deleted' });
    }

    const sourcePath = path.join(process.cwd(), 'public', 'assets', 'characters', cleanUnit, cleanElement, cleanFilename);
    const standardizedPath = path.join(process.cwd(), 'public', 'assets', 'standardized', 'characters', cleanUnit, cleanElement, cleanFilename);

    let deleted = false;
    if (fs.existsSync(sourcePath)) {
      fs.unlinkSync(sourcePath);
      deleted = true;
    }

    if (fs.existsSync(standardizedPath)) {
      try {
        fs.unlinkSync(standardizedPath);
      } catch {
        // ignore
      }
    }

    const relPath = `${cleanUnit}/${cleanElement}/${cleanFilename}`;
    spriteStandardizer.removeSprite(relPath);

    res.json({
      success: true,
      deleted,
      filename: cleanFilename,
      unit: cleanUnit,
      element: cleanElement,
      message: `Deleted sprite: ${cleanFilename} from ${cleanUnit}/${cleanElement}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset all sprites for a specific character unit
app.post('/api/characters/sprites/reset-character', (req: Request, res: Response) => {
  try {
    const rawUnit = String(req.body.unit || '').toLowerCase().trim();
    const rawElement = String(req.body.element || '').toLowerCase().trim();

    const cleanUnit = rawUnit.replace(/[^a-z0-9_-]/g, '');
    const cleanElement = rawElement.replace(/[^a-z0-9_-]/g, '');

    if (!cleanUnit || !cleanElement) {
      return res.status(400).json({ error: 'Missing unit or element' });
    }

    const dir = path.join(process.cwd(), 'public', 'assets', 'characters', cleanUnit, cleanElement);
    const deletedFiles: string[] = [];

    if (fs.existsSync(dir)) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item.toLowerCase().endsWith('.png')) {
          const filePath = path.join(dir, item);
          try {
            fs.unlinkSync(filePath);
            deletedFiles.push(item);
          } catch (e) {
            console.error(`Failed to delete ${filePath}:`, e);
          }
        }
      }
    }

    // Also remove standardized files for this unit & element
    const stdDir = path.join(process.cwd(), 'public', 'assets', 'standardized', 'characters', cleanUnit, cleanElement);
    if (fs.existsSync(stdDir)) {
      try {
        const stdItems = fs.readdirSync(stdDir);
        for (const item of stdItems) {
          if (item.toLowerCase().endsWith('.png')) {
            fs.unlinkSync(path.join(stdDir, item));
          }
        }
      } catch {
        // ignore
      }
    }

    // Clean manifest
    spriteStandardizer.removeCharacterSprites(cleanUnit, cleanElement);

    res.json({
      success: true,
      unit: cleanUnit,
      element: cleanElement,
      deletedFiles,
      count: deletedFiles.length,
      message: `Successfully reset ${deletedFiles.length} sprites for ${cleanUnit} ${cleanElement}.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Elemental 5-folder inspection endpoint
app.get('/api/characters/elemental-status', (req: Request, res: Response) => {
  const elements = ['dark', 'fire', 'grass', 'light', 'water'];
  const charsDir = path.join(process.cwd(), 'public', 'assets', 'characters');
  const knownUnits = new Set(['nekohime', 'pyrosaur', 'shadowstalker', 'tideguard', 'floraweaver', 'luminary', 'freedancer', 'boss']);

  if (fs.existsSync(charsDir)) {
    try {
      const items = fs.readdirSync(charsDir, { withFileTypes: true });
      items.filter(it => it.isDirectory() && it.name !== 'variants').forEach(it => knownUnits.add(it.name.toLowerCase()));
    } catch {
      // ignore
    }
  }

  const units = Array.from(knownUnits);
  const result: Record<string, Record<string, { portrait: boolean; status: boolean; idle: boolean; states: Record<string, boolean> }>> = {};

  units.forEach((u) => {
    result[u] = {};
    elements.forEach((e) => {
      const dir = path.join(charsDir, u, e);
      const portFileUpper = path.join(dir, 'PORTRAIT.png');
      const portFileLower = path.join(dir, 'portrait.png');
      const statusFile = path.join(dir, 'status.png');

      const idle = fs.existsSync(path.join(dir, 'IDLE.png')) || fs.existsSync(path.join(dir, 'idle.png'));
      const attack = fs.existsSync(path.join(dir, 'ATTACK.png')) || fs.existsSync(path.join(dir, 'attack.png'));
      const hurt = fs.existsSync(path.join(dir, 'HURT.png')) || fs.existsSync(path.join(dir, 'hurt.png'));
      const dead = fs.existsSync(path.join(dir, 'DEAD.png')) || fs.existsSync(path.join(dir, 'dead.png')) || fs.existsSync(path.join(dir, 'DEFEATED.png')) || fs.existsSync(path.join(dir, 'defeated.png'));
      const victory = fs.existsSync(path.join(dir, 'VICTORY.png')) || fs.existsSync(path.join(dir, 'victory.png'));

      const states = {
        idle,
        attack,
        hurt,
        dead,
        defeated: dead,
        victory,
      };

      const hasPortrait = fs.existsSync(portFileUpper) || fs.existsSync(portFileLower);
      const hasStatus = fs.existsSync(statusFile) || idle;

      result[u][e] = {
        portrait: hasPortrait,
        status: hasStatus,
        idle,
        states,
      };
    });
  });

  res.json({ success: true, units: result });
});

// Helper to convert white/near-white backgrounds into transparent PNG buffers
async function stripWhiteBackgroundBuffer(buffer: Buffer): Promise<Buffer> {
  try {
    const rawObj = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = rawObj.info;
    const data = rawObj.data;
    const totalPixels = width * height;

    function isWhite(idx: number): boolean {
      const a = data[idx + 3];
      if (a < 30) return true;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (r >= 205 && g >= 205 && b >= 205) return true;
      const avg = (r + g + b) / 3;
      const diff = Math.max(r, g, b) - Math.min(r, g, b);
      return avg >= 210 && diff < 32;
    }

    const visited = new Uint8Array(totalPixels);
    const queue = new Int32Array(totalPixels);
    let qHead = 0;
    let qTail = 0;

    // Perimeter seeds
    for (let x = 0; x < width; x++) {
      const t = x;
      const b = (height - 1) * width + x;
      if (isWhite(t * 4)) { visited[t] = 1; queue[qTail++] = t; }
      if (isWhite(b * 4)) { visited[b] = 1; queue[qTail++] = b; }
    }
    for (let y = 0; y < height; y++) {
      const l = y * width;
      const r = y * width + (width - 1);
      if (!visited[l] && isWhite(l * 4)) { visited[l] = 1; queue[qTail++] = l; }
      if (!visited[r] && isWhite(r * 4)) { visited[r] = 1; queue[qTail++] = r; }
    }

    // Flood fill background
    while (qHead < qTail) {
      const curr = queue[qHead++];
      const px = curr % width;
      const py = Math.floor(curr / width);
      data[curr * 4 + 3] = 0;

      if (px > 0) {
        const n = curr - 1;
        if (!visited[n] && isWhite(n * 4)) { visited[n] = 1; queue[qTail++] = n; }
      }
      if (px < width - 1) {
        const n = curr + 1;
        if (!visited[n] && isWhite(n * 4)) { visited[n] = 1; queue[qTail++] = n; }
      }
      if (py > 0) {
        const n = curr - width;
        if (!visited[n] && isWhite(n * 4)) { visited[n] = 1; queue[qTail++] = n; }
      }
      if (py < height - 1) {
        const n = curr + width;
        if (!visited[n] && isWhite(n * 4)) { visited[n] = 1; queue[qTail++] = n; }
      }
    }

    return await sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
  } catch (err) {
    console.warn('[Server] Could not strip background from buffer:', err);
    return buffer;
  }
}

// Save specifically to canonical /assets/characters/[unitName]/[element]/ folder
app.post('/api/characters/elemental-save', async (req: Request, res: Response) => {
  try {
    const unit = req.body.unit || req.body.unitName;
    const element = req.body.element;
    const type = req.body.type || req.body.state || 'status';
    const dataUrl = req.body.dataUrl;

    if (!unit || !element || !type || !dataUrl) {
      return res.status(400).json({ error: 'Missing required fields: unit, element, type, dataUrl' });
    }
    const cleanUnit = String(unit).toLowerCase().trim();
    const cleanElement = String(element).toLowerCase().trim();
    const cleanType = String(type).toLowerCase().trim();
    const dir = path.join(process.cwd(), 'public', 'assets', 'characters', cleanUnit, cleanElement);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const rawType = String(type).trim().toUpperCase();
    let filename = 'IDLE.png';
    if (rawType.includes('PORTRAIT')) filename = 'PORTRAIT.png';
    else if (rawType.includes('ATTACK')) filename = 'ATTACK.png';
    else if (rawType.includes('HURT')) filename = 'HURT.png';
    else if (rawType.includes('DEAD') || rawType.includes('DEFEAT')) filename = 'DEAD.png';
    else if (rawType.includes('VICTORY')) filename = 'VICTORY.png';
    else if (rawType.includes('IDLE') || rawType.includes('STATUS')) filename = 'IDLE.png';
    else filename = cleanType.endsWith('.png') ? cleanType : `${cleanType}.png`;

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const rawBuffer = Buffer.from(base64Data, 'base64');
    const buffer = await stripWhiteBackgroundBuffer(rawBuffer);
    fs.writeFileSync(path.join(dir, filename), buffer);

    res.json({ success: true, path: `/assets/characters/${cleanUnit}/${cleanElement}/${filename}` });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/portraits/save', async (req: Request, res: Response) => {
  try {
    const { variantId, dataUrl, unit, element } = req.body;
    if (!variantId || !dataUrl) {
      return res.status(400).json({ error: 'Missing variantId or dataUrl' });
    }
    const cleanId = String(variantId).toLowerCase();

    // Determine unit and element
    let u = unit ? String(unit).toLowerCase().trim() : '';
    let e = element ? String(element).toLowerCase().trim() : '';
    if (!u || !e) {
      const parts = cleanId.replace(/^var_/, '').replace(/^fam_/, '').split('_');
      u = parts[0] || 'pyrosaur';
      e = parts[1] || 'fire';
    }

    const dirPath = path.join(process.cwd(), 'public', 'assets', 'characters', u, e);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const rawBuffer = Buffer.from(base64Data, 'base64');
    const buffer = await stripWhiteBackgroundBuffer(rawBuffer);
    const targetFile = path.join(dirPath, 'PORTRAIT.png');
    fs.writeFileSync(targetFile, buffer);
    const canonicalUrl = `/assets/characters/${u}/${e}/PORTRAIT.png`;
    console.log(`[Portraits] Saved canonical portrait for ${u}/${e}/PORTRAIT.png (${buffer.length} bytes)`);
    res.json({ success: true, url: canonicalUrl });
  } catch (err) {
    console.error('[Portraits] Save error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/portraits/save-batch', async (req: Request, res: Response) => {
  try {
    const { portraits } = req.body; // Record<string, string> (variantId -> dataUrl)
    if (!portraits || typeof portraits !== 'object') {
      return res.status(400).json({ error: 'Missing portraits mapping object' });
    }
    const savedIds: string[] = [];
    for (const [id, dataUrl] of Object.entries(portraits)) {
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
        const cleanId = String(id).toLowerCase();
        const parts = cleanId.replace(/^var_/, '').replace(/^fam_/, '').split('_');
        const u = parts[0] || 'pyrosaur';
        const e = parts[1] || 'fire';
        const dirPath = path.join(process.cwd(), 'public', 'assets', 'characters', u, e);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const rawBuffer = Buffer.from(base64Data, 'base64');
        const buffer = await stripWhiteBackgroundBuffer(rawBuffer);
        fs.writeFileSync(path.join(dirPath, 'PORTRAIT.png'), buffer);
        savedIds.push(cleanId);
      }
    }
    console.log(`[Portraits] Batch saved ${savedIds.length} portraits`);
    res.json({ success: true, savedPortraits: savedIds });
  } catch (err) {
    console.error('[Portraits] Batch save error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Static public directory (models, textures, draco decoders)
app.use(express.static(path.join(process.cwd(), 'public')));

// ============================================================
// VITE MIDDLEWARE & SERVER STARTUP
// ============================================================

async function startServer() {
  // Start the background character PNG watcher in development mode only
  if (process.env.NODE_ENV !== 'production') {
    try {
      spriteWatcher.start();
    } catch (err) {
      console.warn('[SpriteWatcher] Non-fatal error starting watcher:', err);
    }
  }

  // 404 Handler for all unmatched /api/* routes to prevent falling through to HTML index.html
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `API endpoint not found: ${req.method} ${req.path}`,
      code: 404,
    });
  });

  // Global Express Error Handler
  app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('[Server Unhandled Error]:', err);
    if (res.headersSent) {
      return next(err);
    }
    const statusCode = typeof err.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal server error occurred',
      code: statusCode,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Monster Realms] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
