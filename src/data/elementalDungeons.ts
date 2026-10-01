/**
 * Monster Realms - 6 Elemental Awakening Dungeons
 * 
 * 6 Elemental Dungeons:
 * - Hall of Fire
 * - Hall of Water
 * - Hall of Grass (Wind)
 * - Hall of Light
 * - Hall of Dark
 * - Hall of Magic (Arcane Universal)
 * 
 * 10 Difficulty Levels per dungeon (Floor 1 / B1 to Floor 10 / B10).
 * Each level has 3 fights in a row (Wave 1, Wave 2, Wave 3: Boss + Crystals) without healing.
 * 
 * Summoners War Boss Mechanics:
 * - Water Boss: Immense Colossal HP pool; high damage from Continuous Damage (DoTs/Poison/Burn)
 * - Fire Boss: Bomb & Burn Crystal stacking; must cleanse before bomb detonation
 * - Grass Boss: Miraculous Recovery Tower heals 40% HP; requires Heal Block or high burst
 * - Light Boss: Colossal Ironclad Defense; requires Defense Break or True Damage
 * - Dark Boss: Continuous Poison & execute damage; requires Cleanse & Immunity
 * - Magic Boss: Arcane Buff Conduits & Turn Meter disruption; drops universal Magic Stones
 */

import { ElementalDungeonType, PvEEnemyVariant, PvEStage, Rarity, ElementType } from '../types';
export type { ElementalDungeonType };

export interface ElementalDungeonInfo {
  id: ElementalDungeonType;
  name: string;
  subtitle: string;
  element: ElementType | 'MAGIC';
  bossName: string;
  bossVariantId: string;
  bossTitle: string;
  bossMechanicTitle: string;
  bossMechanicDescription: string;
  leftTowerName: string;
  leftTowerDescription: string;
  rightTowerName: string;
  rightTowerDescription: string;
  strategyTips: string;
  stoneName: string;
  colorHex: string;
  accentHex: string;
  bgGradient: string;
  icon: string;
}

export const ELEMENTAL_DUNGEONS: Record<ElementalDungeonType, ElementalDungeonInfo> = {
  FIRE: {
    id: 'FIRE',
    name: 'Hall of Fire',
    subtitle: '10 Floors • Fire Awakening Stones',
    element: 'FIRE',
    bossName: 'Guardian of Fire',
    bossVariantId: 'var_boss_elemental_fire',
    bossTitle: 'Ignis Sovereign',
    bossMechanicTitle: 'Volcanic Bomb & Stacking Burns',
    bossMechanicDescription: 'The Right Tower plants lethal ticking Bombs and Burns on your entire party, while the Boss incinerates afflicted units for +50% bonus damage!',
    leftTowerName: 'Tower of Ignition',
    leftTowerDescription: 'Bestows Attack Up (+50%) and Speed Up on all allies.',
    rightTowerName: 'Tower of Bombs',
    rightTowerDescription: 'Inflicts ticking death Bombs and Continuous Burn damage across your squad.',
    strategyTips: 'Bring cleansers (Cleanse/Immunity) or high Water DPS to eliminate the Boss before bombs detonate!',
    stoneName: 'Fire Stone',
    colorHex: '#ef4444',
    accentHex: '#f97316',
    bgGradient: 'from-red-950 via-amber-950 to-stone-950',
    icon: 'Flame',
  },
  WATER: {
    id: 'WATER',
    name: 'Hall of Water',
    subtitle: '10 Floors • Water Awakening Stones',
    element: 'WATER',
    bossName: 'Guardian of Water',
    bossVariantId: 'var_boss_elemental_water',
    bossTitle: 'Abyssal Leviathan',
    bossMechanicTitle: 'Colossal HP & Continuous Damage Weakness',
    bossMechanicDescription: 'Possesses a gargantuan HP pool (500% normal HP!). Takes 70% reduced damage from direct attacks, but takes 300% amplified damage from Continuous Damage (Poison/Burn)!',
    leftTowerName: 'Tower of Frost',
    leftTowerDescription: 'Freezes player targets and reduces Turn Meter by 30%.',
    rightTowerName: 'Tower of Fortification',
    rightTowerDescription: 'Cleanses the Water Guardian and grants Defense Up and massive Shields.',
    strategyTips: 'Standard attacks will take forever! Stack Continuous Damage (DoTs/Poison/Burn) or Max HP% scaling attacks to melt its titanic HP pool!',
    stoneName: 'Water Stone',
    colorHex: '#0284c7',
    accentHex: '#38bdf8',
    bgGradient: 'from-cyan-950 via-blue-950 to-slate-950',
    icon: 'Droplets',
  },
  GRASS: {
    id: 'GRASS',
    name: 'Hall of Grass',
    subtitle: '10 Floors • Grass Awakening Stones',
    element: 'GRASS',
    bossName: 'Guardian of Nature',
    bossVariantId: 'var_boss_elemental_grass',
    bossTitle: 'Verdant Yggdrasil',
    bossMechanicTitle: 'Miraculous Recovery Totem (Wind Hall Healing)',
    bossMechanicDescription: 'The Left Tower casts Miraculous Restoration, healing the Boss for 40% Max HP and cleansing debuffs! The Boss naturally regenerates 15% HP every turn.',
    leftTowerName: 'Tower of Recovery',
    leftTowerDescription: 'Heals the lowest HP ally for 40% Max HP and grants a protective barrier.',
    rightTowerName: 'Tower of Withering',
    rightTowerDescription: 'Inflicts Attack Down (-50%) and Speed Down (-30%) on your squad.',
    strategyTips: 'Use Heal Block / Recovery Block, or apply Defense Break and burst down the Boss before the Tower of Recovery can act!',
    stoneName: 'Grass Stone',
    colorHex: '#16a34a',
    accentHex: '#4ade80',
    bgGradient: 'from-emerald-950 via-green-950 to-stone-950',
    icon: 'Leaf',
  },
  LIGHT: {
    id: 'LIGHT',
    name: 'Hall of Light',
    subtitle: '10 Floors • Light Awakening Stones',
    element: 'LIGHT',
    bossName: 'Guardian of Light',
    bossVariantId: 'var_boss_elemental_light',
    bossTitle: 'Archon of Radiance',
    bossMechanicTitle: 'Ironclad Defense & Holy Judgment',
    bossMechanicDescription: 'Endowed with colossal +400% Ironclad Defense! Regular physical blows deal almost negligible damage unless shattered by Defense Break or Defense-Ignoring attacks.',
    leftTowerName: 'Tower of Sanctuary',
    leftTowerDescription: 'Grants the Light Guardian Immunity and Defense Up for 2 turns.',
    rightTowerName: 'Tower of Judgement',
    rightTowerDescription: 'Blasts your squad with holy beams, inflicting Defense Down (-70%).',
    strategyTips: 'Defense Break is non-negotiable! Alternatively, bring True Damage or Defense-Ignoring nukers to pierce straight through its iron carapace.',
    stoneName: 'Light Stone',
    colorHex: '#eab308',
    accentHex: '#fef08a',
    bgGradient: 'from-amber-950 via-yellow-950 to-stone-950',
    icon: 'Sun',
  },
  DARK: {
    id: 'DARK',
    name: 'Hall of Dark',
    subtitle: '10 Floors • Dark Awakening Stones',
    element: 'DARK',
    bossName: 'Guardian of Darkness',
    bossVariantId: 'var_boss_elemental_dark',
    bossTitle: 'Abyssal Voidlord',
    bossMechanicTitle: 'Necrotic Agony & Poison Stacking',
    bossMechanicDescription: 'Inflicts heavy stacking Continuous Poison on all invaders. Gains +30% execute damage against poisoned units and immediately claims an Extra Turn if any player dies!',
    leftTowerName: 'Tower of Miasma',
    leftTowerDescription: 'Spews concentrated venom, inflicting 2 stacks of Continuous Damage (Poison) on all enemies.',
    rightTowerName: 'Tower of Torment',
    rightTowerDescription: 'Drains enemy Turn Meters by 25% and inflicts Blind for 2 turns.',
    strategyTips: 'Bring multi-target Cleanse or Immunity buffers. Focus down the Boss before Poison stacks accumulate and cause a chain execution!',
    stoneName: 'Dark Stone',
    colorHex: '#9333ea',
    accentHex: '#c084fc',
    bgGradient: 'from-purple-950 via-fuchsia-950 to-slate-950',
    icon: 'Moon',
  },
  MAGIC: {
    id: 'MAGIC',
    name: 'Hall of Magic',
    subtitle: '10 Floors • Universal Magic Awakening Stones',
    element: 'LIGHT', // Universal arcane element
    bossName: 'Guardian of Magic',
    bossVariantId: 'var_boss_elemental_magic',
    bossTitle: 'Arcane Sovereign',
    bossMechanicTitle: 'Arcane Conduits & Leyline Resonance',
    bossMechanicDescription: 'The central trial of all Summoners. The Left Crystal grants massive Attack power, while the Right Crystal siphons Turn Meters and dispels your buffs. Drops universal Magic Stones needed for all monsters!',
    leftTowerName: 'Crystal of Power',
    leftTowerDescription: 'Channels arcane leylines, granting +50% Attack and Crit Rate to the Guardian of Magic.',
    rightTowerName: 'Crystal of Ruin',
    rightTowerDescription: 'Drains 30% Turn Meter from the player team and dispels beneficial buffs.',
    strategyTips: 'A balanced tactical showdown. Dispel the boss buffs, defeat the towers, and manage your squad cooldowns!',
    stoneName: 'Magic Stone',
    colorHex: '#8b5cf6',
    accentHex: '#d8b4fe',
    bgGradient: 'from-violet-950 via-indigo-950 to-slate-950',
    icon: 'Sparkles',
  },
};

/**
 * Minion variant configurations per element for Wave 1 and Wave 2
 */
const ELEMENTAL_MINIONS: Record<ElementalDungeonType, { wave1: string[]; wave2: string[] }> = {
  FIRE: {
    wave1: ['var_pyrosaur_fire', 'var_porky_fire', 'var_doggo_fire'],
    wave2: ['var_pyrosaur_fire', 'var_tideguard_fire', 'var_floraweaver_fire', 'var_nekohime_fire'],
  },
  WATER: {
    wave1: ['var_tideguard_water', 'var_fishter_water', 'var_doggo_water'],
    wave2: ['var_tideguard_water', 'var_nekohime_water', 'var_pyrosaur_water', 'var_fishter_water'],
  },
  GRASS: {
    wave1: ['var_floraweaver_grass', 'var_nekohime_grass', 'var_doggo_grass'],
    wave2: ['var_floraweaver_grass', 'var_luminary_grass', 'var_pyrosaur_grass', 'var_porky_grass'],
  },
  LIGHT: {
    wave1: ['var_luminary_light', 'var_birdunno_light', 'var_doggo_light'],
    wave2: ['var_luminary_light', 'var_pyrosaur_light', 'var_nekohime_light', 'var_tideguard_light'],
  },
  DARK: {
    wave1: ['var_shadowstalker_dark', 'var_porky_dark', 'var_birdunno_dark'],
    wave2: ['var_shadowstalker_dark', 'var_pyrosaur_dark', 'var_nekohime_dark', 'var_floraweaver_dark'],
  },
  MAGIC: {
    wave1: ['var_luminary_light', 'var_birdunno_light', 'var_floraweaver_water'],
    wave2: ['var_luminary_light', 'var_shadowstalker_dark', 'var_pyrosaur_fire', 'var_nekohime_grass'],
  },
};

/**
 * Helper to build 3 waves for any Elemental Dungeon Floor
 * Wave 1: 3-4 elemental minions
 * Wave 2: 3-4 stronger elemental guardians
 * Wave 3: Left Crystal, Sentinel, Boss, Sentinel, Right Crystal!
 */
function buildElementalDungeonWaves(
  element: ElementalDungeonType,
  floor: number
): { waves: PvEEnemyVariant[][]; bossWave: PvEEnemyVariant[] } {
  // Scaling levels: B1 = 12, B5 = 32, B10 = 60
  const minionLevel = Math.min(60, 10 + floor * 5);
  const bossLevel = Math.min(65, 12 + floor * 5 + (floor === 10 ? 5 : 0));
  const bossStars = floor <= 3 ? 4 : floor <= 7 ? 5 : 6;
  const isAwakened = floor >= 6;

  const minionPool = ELEMENTAL_MINIONS[element];
  const bossVariantId = ELEMENTAL_DUNGEONS[element].bossVariantId;

  const leftCrystalVariant = `var_crystal_${element.toLowerCase()}_left`;
  const rightCrystalVariant = `var_crystal_${element.toLowerCase()}_right`;

  // Wave 1: 4 Minions
  const wave1: PvEEnemyVariant[] = [
    { variantId: minionPool.wave1[0] || 'var_pyrosaur_fire', level: minionLevel - 2, slotIndex: 0, awakeningStage: 'BASE' },
    { variantId: minionPool.wave1[1] || 'var_porky_fire', level: minionLevel - 2, slotIndex: 1, awakeningStage: 'BASE' },
    { variantId: minionPool.wave1[0] || 'var_pyrosaur_fire', level: minionLevel - 1, slotIndex: 2, awakeningStage: isAwakened ? 'AWAKENED' : 'BASE' },
    { variantId: minionPool.wave1[2] || 'var_doggo_fire', level: minionLevel - 2, slotIndex: 3, awakeningStage: 'BASE' },
  ];

  // Wave 2: 4 Stronger Minions
  const wave2: PvEEnemyVariant[] = [
    { variantId: minionPool.wave2[0] || 'var_pyrosaur_fire', level: minionLevel, slotIndex: 0, awakeningStage: isAwakened ? 'AWAKENED' : 'BASE' },
    { variantId: minionPool.wave2[1] || 'var_nekohime_fire', level: minionLevel, slotIndex: 1, awakeningStage: isAwakened ? 'AWAKENED' : 'BASE' },
    { variantId: minionPool.wave2[2] || 'var_floraweaver_fire', level: minionLevel + 1, slotIndex: 2, awakeningStage: isAwakened ? 'AWAKENED' : 'BASE' },
    { variantId: minionPool.wave2[3] || 'var_tideguard_fire', level: minionLevel, slotIndex: 3, awakeningStage: isAwakened ? 'AWAKENED' : 'BASE' },
  ];

  // Wave 3: The Summoners War Boss Encounter!
  // Slot 0: Left Crystal (Tower 1)
  // Slot 1: Vanguard Minion / Sentinel
  // Slot 2: BOSS (Guardian)
  // Slot 3: Vanguard Minion / Sentinel
  // Slot 4: Right Crystal (Tower 2)
  const bossWave: PvEEnemyVariant[] = [
    {
      variantId: leftCrystalVariant,
      level: minionLevel,
      slotIndex: 0,
      awakeningStage: 'BASE',
      stars: 4,
    },
    {
      variantId: minionPool.wave2[0] || 'var_pyrosaur_fire',
      level: minionLevel + 1,
      slotIndex: 1,
      awakeningStage: isAwakened ? 'AWAKENED' : 'BASE',
    },
    {
      variantId: bossVariantId,
      level: bossLevel,
      slotIndex: 2,
      awakeningStage: isAwakened ? 'AWAKENED' : 'BASE',
      isBoss: true,
      stars: bossStars,
    },
    {
      variantId: minionPool.wave2[1] || 'var_nekohime_fire',
      level: minionLevel + 1,
      slotIndex: 3,
      awakeningStage: isAwakened ? 'AWAKENED' : 'BASE',
    },
    {
      variantId: rightCrystalVariant,
      level: minionLevel,
      slotIndex: 4,
      awakeningStage: 'BASE',
      stars: 4,
    },
  ];

  return {
    waves: [wave1, wave2, bossWave],
    bossWave,
  };
}

/**
 * Generate all 60 Elemental Dungeon Stages (6 elements x 10 floors)
 */
export function generateElementalDungeonStages(): PvEStage[] {
  const elements: ElementalDungeonType[] = ['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK', 'MAGIC'];
  const stages: PvEStage[] = [];

  elements.forEach((elem, elemIdx) => {
    const info = ELEMENTAL_DUNGEONS[elem];

    for (let floor = 1; floor <= 10; floor++) {
      const stageId = `dungeon_${elem.toLowerCase()}_${floor}`;
      const energyCost = Math.min(8, 3 + Math.floor((floor - 1) * 0.5)); // 3, 3, 4, 4, 5, 5, 6, 6, 7, 8
      const recommendedPower = 1200 + (floor - 1) * 2800; // 1,200 to 26,400+

      const { waves, bossWave } = buildElementalDungeonWaves(elem, floor);

      stages.push({
        stageId,
        chapter: 200 + elemIdx + 1,
        stageNumber: floor,
        continentId: `dungeon_${elem.toLowerCase()}`,
        element: info.element === 'MAGIC' ? 'LIGHT' : (info.element as ElementType),
        isBossStage: true,
        isBoss: true,
        bossTitle: `${info.name} • Floor B${floor}`,
        name: `${info.name} (B${floor})`,
        description: `Floor B${floor}: 3 Fights in a row without healing! 2 Vanguard Waves followed by ${info.bossName} and Dual Crystals.`,
        energyCost,
        recommendedPower,
        elementalDungeonType: elem,
        dungeonLevel: floor,
        bossMechanicDescription: info.bossMechanicDescription,
        waves,
        enemyVariants: bossWave,
        firstClearRewards: {
          gold: 2000 + floor * 1000,
          gems: 25 + floor * 10,
          summonPoints: 10 + floor * 2,
        },
        repeatRewards: {
          gold: 500 + floor * 150,
          exp: 250 + floor * 90,
        },
      });
    }
  });

  return stages;
}

export const ELEMENTAL_DUNGEON_STAGES: PvEStage[] = generateElementalDungeonStages();

/**
 * Roll elemental stone drops based on dungeon element and floor (1 to 10).
 * Rule:
 * - Low floors (B1-B3): mostly Small stones, rare Medium.
 * - Mid floors (B4-B6): Small and Medium stones.
 * - High floors (B7-B9): Medium and Huge stones.
 * - Floor 10 (Last level!): Small, Medium, AND Huge stones guaranteed!
 */
export function rollElementalStoneDrops(
  element: ElementalDungeonType,
  floor: number
): {
  element: ElementalDungeonType;
  elemental: { small: number; medium: number; huge: number };
  magic: { small: number; medium: number; huge: number };
} {
  let elementalSmall = 0;
  let elementalMedium = 0;
  let elementalHuge = 0;

  let magicSmall = 0;
  let magicMedium = 0;
  let magicHuge = 0;

  if (floor <= 3) {
    // B1 - B3: Small stones focused
    elementalSmall = 2 + Math.floor(Math.random() * 3); // 2 - 4
    elementalMedium = floor >= 2 && Math.random() < 0.25 ? 1 : 0;
    magicSmall = 1 + Math.floor(Math.random() * 2); // 1 - 2
  } else if (floor <= 6) {
    // B4 - B6: Small & Medium
    elementalSmall = 3 + Math.floor(Math.random() * 3); // 3 - 5
    elementalMedium = 1 + Math.floor(Math.random() * 3); // 1 - 3
    elementalHuge = floor === 6 && Math.random() < 0.15 ? 1 : 0;
    magicSmall = 2 + Math.floor(Math.random() * 2); // 2 - 3
    magicMedium = Math.random() < 0.5 ? 1 : 0;
  } else if (floor <= 9) {
    // B7 - B9: Medium & Huge
    elementalSmall = 2 + Math.floor(Math.random() * 3); // 2 - 4
    elementalMedium = 2 + Math.floor(Math.random() * 3); // 2 - 4
    elementalHuge = 1 + (Math.random() < 0.4 ? 1 : 0); // 1 - 2
    magicSmall = 2 + Math.floor(Math.random() * 2);
    magicMedium = 1 + Math.floor(Math.random() * 2);
    magicHuge = Math.random() < 0.35 ? 1 : 0;
  } else {
    // B10 (LAST LEVEL): Drops Small, Medium, Huge!
    elementalSmall = 3 + Math.floor(Math.random() * 3); // 3 - 5
    elementalMedium = 3 + Math.floor(Math.random() * 3); // 3 - 5
    elementalHuge = 2 + Math.floor(Math.random() * 3); // 2 - 4 Huge Stones!
    magicSmall = 2 + Math.floor(Math.random() * 3); // 2 - 4
    magicMedium = 2 + Math.floor(Math.random() * 3); // 2 - 4
    magicHuge = 1 + Math.floor(Math.random() * 2); // 1 - 2
  }

  // If Magic Dungeon, all drops are Magic Stones
  if (element === 'MAGIC') {
    magicSmall += elementalSmall;
    magicMedium += elementalMedium;
    magicHuge += elementalHuge;
    elementalSmall = 0;
    elementalMedium = 0;
    elementalHuge = 0;
  }

  return {
    element,
    elemental: { small: elementalSmall, medium: elementalMedium, huge: elementalHuge },
    magic: { small: magicSmall, medium: magicMedium, huge: magicHuge },
  };
}

/**
 * Calculates Awakening stone requirements by monster tier:
 * User rule:
 * "low tier monsters only need small and medium stones while high tier monsters epic and legendary need huge stones."
 */
export interface AwakeningCost {
  element: ElementalDungeonType;
  elementalStones: { small: number; medium: number; huge: number };
  magicStones: { small: number; medium: number; huge: number };
  gold: number;
}

/**
 * In-memory map of custom per-variant awakening cost overrides.
 * Keyed by variantId (e.g. 'var_pyrosaur_fire').
 */
export const AWAKENING_COST_OVERRIDES: Record<string, AwakeningCost> = {};

export function setAwakeningCostOverride(variantId: string, cost: AwakeningCost | null): void {
  if (!variantId) return;
  if (cost === null || cost === undefined) {
    delete AWAKENING_COST_OVERRIDES[variantId];
  } else {
    AWAKENING_COST_OVERRIDES[variantId] = {
      element: cost.element,
      elementalStones: {
        small: Math.max(0, Math.floor(Number(cost.elementalStones?.small || 0))),
        medium: Math.max(0, Math.floor(Number(cost.elementalStones?.medium || 0))),
        huge: Math.max(0, Math.floor(Number(cost.elementalStones?.huge || 0))),
      },
      magicStones: {
        small: Math.max(0, Math.floor(Number(cost.magicStones?.small || 0))),
        medium: Math.max(0, Math.floor(Number(cost.magicStones?.medium || 0))),
        huge: Math.max(0, Math.floor(Number(cost.magicStones?.huge || 0))),
      },
      gold: Math.max(0, Math.floor(Number(cost.gold || 0))),
    };
  }
}

export function setAllAwakeningCostOverrides(overrides: Record<string, AwakeningCost>): void {
  for (const k in AWAKENING_COST_OVERRIDES) {
    delete AWAKENING_COST_OVERRIDES[k];
  }
  if (overrides && typeof overrides === 'object') {
    for (const [id, cost] of Object.entries(overrides)) {
      setAwakeningCostOverride(id, cost);
    }
  }
}

export function getAllAwakeningCostOverrides(): Record<string, AwakeningCost> {
  return { ...AWAKENING_COST_OVERRIDES };
}

export function getDefaultAwakeningCost(variant: { element: ElementType; rarity: Rarity; stars?: number }): AwakeningCost {
  const elem = (variant.element as ElementalDungeonType) || 'FIRE';
  const rarity = variant.rarity || 'RARE';

  switch (rarity) {
    case 'COMMON':
      // 1-star: Low tier (only small stones)
      return {
        element: elem,
        elementalStones: { small: 5, medium: 0, huge: 0 },
        magicStones: { small: 5, medium: 0, huge: 0 },
        gold: 5000,
      };

    case 'UNCOMMON':
      // 2-star: Low tier (small and medium stones)
      return {
        element: elem,
        elementalStones: { small: 10, medium: 2, huge: 0 },
        magicStones: { small: 5, medium: 1, huge: 0 },
        gold: 10000,
      };

    case 'RARE':
      // 3-star: Low tier (small and medium stones, 0 huge stones)
      return {
        element: elem,
        elementalStones: { small: 15, medium: 5, huge: 0 },
        magicStones: { small: 10, medium: 2, huge: 0 },
        gold: 20000,
      };

    case 'EPIC':
      // 4-star: High tier (REQUIRES HUGE STONES)
      return {
        element: elem,
        elementalStones: { small: 10, medium: 10, huge: 5 },
        magicStones: { small: 5, medium: 5, huge: 2 },
        gold: 50000,
      };

    case 'LEGENDARY':
    default:
      // 5-star: High tier (REQUIRES HUGE STONES)
      return {
        element: elem,
        elementalStones: { small: 15, medium: 15, huge: 10 },
        magicStones: { small: 10, medium: 10, huge: 5 },
        gold: 100000,
      };
  }
}

export function getAwakeningCost(variant: { variantId?: string; element: ElementType; rarity: Rarity; stars?: number }): AwakeningCost {
  if (variant.variantId && AWAKENING_COST_OVERRIDES[variant.variantId]) {
    const custom = AWAKENING_COST_OVERRIDES[variant.variantId];
    const elem = (variant.element as ElementalDungeonType) || 'FIRE';
    return {
      element: custom.element || elem,
      elementalStones: {
        small: Math.max(0, Math.floor(Number(custom.elementalStones?.small ?? 0))),
        medium: Math.max(0, Math.floor(Number(custom.elementalStones?.medium ?? 0))),
        huge: Math.max(0, Math.floor(Number(custom.elementalStones?.huge ?? 0))),
      },
      magicStones: {
        small: Math.max(0, Math.floor(Number(custom.magicStones?.small ?? 0))),
        medium: Math.max(0, Math.floor(Number(custom.magicStones?.medium ?? 0))),
        huge: Math.max(0, Math.floor(Number(custom.magicStones?.huge ?? 0))),
      },
      gold: Math.max(0, Math.floor(Number(custom.gold ?? 0))),
    };
  }
  return getDefaultAwakeningCost(variant);
}
