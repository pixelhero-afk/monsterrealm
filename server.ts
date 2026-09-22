/**
 * Monster Realms - Server-Authoritative Backend
 * Express API with server-side validation and Vite integration
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { createServer as createViteServer } from 'vite';
import {
  AwakeningStage,
  EquipmentItem,
  PlayerMonster,
  PlayerProfile,
  SummonBanner,
  SummonResult,
  isDevAccount,
} from './src/types';
import { MONSTER_VARIANTS, MONSTER_FAMILIES } from './src/data/monsters';
import { STARTER_EQUIPMENT, rollEquipmentPiece } from './src/data/equipment';
import { SUMMON_BANNERS } from './src/data/banners';
import { CONTINENTS, PVE_STAGES, isStageUnlocked, isContinentUnlocked, getNextStage } from './src/data/stages';
import {
  createDeterministicStarterTeam,
  createInitialPlayerProfile,
  STARTER_VARIANT_IDS,
} from './src/services/starterTeam';
import { getRewardForAccountLevel } from './src/services/accountProgression';
import { DeterministicRNG } from './src/engine/rng';
import {
  getMonsterStars,
  getSynthesisStarCost,
  MAX_MONSTER_STARS,
  validateSynthesisEligibility,
} from './src/utils/monsterStars';
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
loadCustomUnitsIntoMemory();
loadDisabledUnitsIntoMemory();

const PLAYER_STORE: Record<string, ServerPlayerState> = {};

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

  const now = Date.now();
  const elapsed = now - player.profile.currencies.lastEnergyRegenTimestamp;
  const regenInterval = 180000;
  if (elapsed >= regenInterval && player.profile.currencies.energy < player.profile.currencies.maxEnergy) {
    const gained = Math.floor(elapsed / regenInterval);
    player.profile.currencies.energy = Math.min(
      player.profile.currencies.maxEnergy,
      player.profile.currencies.energy + gained
    );
    player.profile.currencies.lastEnergyRegenTimestamp = now;
  }

  return player;
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

// Fetch complete player state
app.get('/api/player/profile', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const player = getOrCreatePlayer(playerId);
  res.json({
    profile: player.profile,
    monsters: player.monsters,
    equipment: player.equipment,
    banners: SUMMON_BANNERS,
    stages: PVE_STAGES,
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
  const costPerLevel = monster.level * 200;
  const totalCost = costPerLevel * actualLevels;

  if (player.profile.currencies.gold < totalCost) {
    return res.status(400).json({ error: 'Insufficient Gold for level up' });
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

  const awakenCost = 15000;
  if (player.profile.currencies.gold < awakenCost) {
    return res.status(400).json({ error: `Requires ${awakenCost} Gold to awaken` });
  }

  player.profile.currencies.gold -= awakenCost;
  monster.awakeningStage = 'AWAKENED';
  player.profile.updatedAt = Date.now();

  res.json({
    success: true,
    monster,
    remainingGold: player.profile.currencies.gold,
    message: `${MONSTER_VARIANTS[monster.variantId]?.name} has successfully awakened!`,
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

  const banner = SUMMON_BANNERS.find((b) => b.bannerId === bannerId) || SUMMON_BANNERS[0];
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

  const rng = new DeterministicRNG(Date.now());
  const results: SummonResult[] = [];
  const currentPity = player.bannerPity[banner.bannerId] || 0;

  for (let i = 0; i < count; i++) {
    const pullPity = currentPity + i + 1;
    const roll = rng.next();
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

    // If banner has featured variants and we rolled their rarity, give 50% chance to pick a featured variant
    if (
      banner.featuredVariantIds &&
      banner.featuredVariantIds.length > 0 &&
      (chosenRarity === 'LEGENDARY' || chosenRarity === 'EPIC') &&
      rng.next() < 0.5
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

    const variant =
      eligibleVariants.length > 0
        ? eligibleVariants[rng.nextInt(0, eligibleVariants.length - 1)]
        : fallbackVariants[0];

    // Check duplicate
    const isDuplicate = player.monsters.some((m) => m.variantId === variant.variantId);

    const newInstance: PlayerMonster = {
      instanceId: `inst_${playerId}_${Date.now()}_${rng.nextInt(100, 999)}`,
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
  player.profile.updatedAt = Date.now();

  res.json({
    success: true,
    results,
    currencies: player.profile.currencies,
    pityCount: player.bannerPity[banner.bannerId],
  });
});

// PvE Battle Start (Energy & Sequential Unlock Validation)
app.post('/api/battle/pve/start', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { stageId } = req.body;
  const player = getOrCreatePlayer(playerId);

  const stage = PVE_STAGES.find((s) => s.stageId === stageId) || PVE_STAGES[0];

  // Validate sequential unlock rules
  const unlocked = isStageUnlocked(stage.stageId, player.profile.completedStages);
  if (!unlocked) {
    return res.status(400).json({
      error: 'Stage Locked! You must clear previous stages and continent bosses in sequential order first.',
    });
  }

  if (player.profile.currencies.energy < stage.energyCost) {
    return res.status(400).json({ error: 'Insufficient Energy to start battle' });
  }

  // Validate that active party has at least 1 unit and contains no disabled units
  const partyInstanceIds = player.profile.activeParty || [];
  const partyMonsters = partyInstanceIds
    .map((id) => player.monsters.find((m) => m.instanceId === id))
    .filter((m): m is PlayerMonster => !!m);

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

  player.profile.currencies.energy -= stage.energyCost;
  player.profile.updatedAt = Date.now();

  res.json({
    success: true,
    stage,
    remainingEnergy: player.profile.currencies.energy,
  });
});

// PvE Battle Complete (Claim Rewards, Record Victory, Unlock Next Stage)
app.post('/api/battle/pve/complete', (req: Request, res: Response) => {
  const playerId = (req.headers['x-player-id'] as string) || 'player_default';
  const { stageId, isVictory } = req.body;
  const player = getOrCreatePlayer(playerId);

  const stage = PVE_STAGES.find((s) => s.stageId === stageId) || PVE_STAGES[0];

  if (!isVictory) {
    return res.json({
      success: true,
      isVictory: false,
      message: 'Battle recorded (Defeat). No rewards gained.',
    });
  }

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
      player.profile.experience -= expNeeded;
      player.profile.accountLevel = (player.profile.accountLevel || 1) + 1;
      didAccountLevelUp = true;
    } else {
      break;
    }
  }

  player.profile.updatedAt = Date.now();

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
  });
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

    case 'ADD_ACCOUNT_EXP': {
      const expAmount = Number(payload?.amount) || 500;
      player.profile.experience = (player.profile.experience || 0) + expAmount;
      while ((player.profile.accountLevel || 1) < 50) {
        const expNeeded = 100 + (player.profile.accountLevel || 1) * 50;
        if (player.profile.experience >= expNeeded) {
          player.profile.experience -= expNeeded;
          player.profile.accountLevel = (player.profile.accountLevel || 1) + 1;
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

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
