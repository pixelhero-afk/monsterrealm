/**
 * Server-Side Starter Team and Account Initialization
 * Deterministic, no RNG, guarantees balanced 5-monster starter team.
 */

import { PlayerMonster, PlayerProfile } from '../types';
import { STARTER_EQUIPMENT } from '../data/equipment';

export const STARTER_VARIANT_IDS = [
  'var_pyrosaur_fire',     // Fire Damage
  'var_tideguard_water',    // Water Tank
  'var_floraweaver_grass',  // Grass Healer/Support
  'var_luminary_light',     // Light Control/Speed
  'var_shadowstalker_dark', // Dark Assassin/Execute
];

export function createDeterministicStarterTeam(playerId: string): PlayerMonster[] {
  return STARTER_VARIANT_IDS.map((variantId, index) => {
    // Equip appropriate starter gear
    const eq = STARTER_EQUIPMENT[index] ? [STARTER_EQUIPMENT[index].id] : [];

    const baseStarsMap: Record<string, number> = {
      var_tideguard_water: 1,
      var_floraweaver_grass: 2,
      var_pyrosaur_fire: 3,
      var_luminary_light: 4,
      var_shadowstalker_dark: 5,
    };

    return {
      instanceId: `inst_${playerId}_starter_${index + 1}`,
      variantId,
      playerId,
      level: 5,
      stars: baseStarsMap[variantId] || 3,
      experience: 0,
      awakeningStage: 'BASE',
      equipmentIds: eq,
      skillLevels: {},
      locked: true,
      acquiredAt: Date.now(),
    };
  });
}

export function createInitialPlayerProfile(playerId: string, username: string = 'RealmWarden'): PlayerProfile {
  return {
    playerId,
    username,
    accountLevel: 1,
    experience: 0,
    avatarVariantId: 'var_pyrosaur_fire',
    currencies: {
      gold: 50000,
      energy: 100,
      maxEnergy: 100,
      summonPoints: 300,
      gems: 600,
      lastEnergyRegenTimestamp: Date.now(),
    },
    tutorialState: {
      isCompleted: false,
      isSkipped: false,
      currentStep: 1,
      stepName: 'INTRO_STARTERS',
    },
    completedStages: [],
    stageStars: {},
    highestUnlockedStage: 'stage_1_1',
    activeParty: [
      `inst_${playerId}_starter_1`,
      `inst_${playerId}_starter_2`,
      `inst_${playerId}_starter_3`,
      `inst_${playerId}_starter_4`,
      `inst_${playerId}_starter_5`,
    ],
    maxEquipmentSlots: 60,
    hasChangedName: false,
    nameChangesCount: 0,
    claimedLevelRewards: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createStarterAccount(username: string = 'RealmWarden') {
  const playerId = 'player_default';
  const monsters = createDeterministicStarterTeam(playerId);
  const profile = createInitialPlayerProfile(playerId, username);
  profile.activeParty = monsters.map((m) => m.instanceId);

  // Add NekoHime to the roster so she can be inspected in Party, Monster screen, and deployed into Battle
  const nekohimeGrass: PlayerMonster = {
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
  };
  monsters.push(nekohimeGrass);

  return {
    profile,
    monsters,
    equipment: STARTER_EQUIPMENT,
  };
}

