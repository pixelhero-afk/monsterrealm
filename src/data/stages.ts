/**
 * PvE Continents & Stages Configuration
 * 5 distinct elemental continents with 10 sequential stages each (1-1 to 5-10).
 * Enforces strict progression: 1-1 -> 1-2 -> ... -> 1-10 Boss -> 2-1 -> ... -> 5-10 Final Boss.
 */

import { Continent, PvEStage } from '../types';

export const CONTINENTS: Continent[] = [
  {
    continentId: 'continent_1',
    chapter: 1,
    name: 'Ignis Caldera',
    subtitle: 'The Volcanic Highlands',
    element: 'FIRE',
    description:
      'A smoldering realm of obsidian ridges, molten rivers, and fierce volcanic predators ruled by the Pyrosaur draconic lineage.',
    bossName: 'Ignis Sovereign (Pyrosaur Overlord)',
    bossStageId: 'stage_1_10',
    totalStages: 10,
    colorHex: '#ef4444',
    accentHex: '#f97316',
    bgGradient: 'from-amber-950 via-rose-950 to-slate-950',
    coordinates: { x: 22, y: 35 },
  },
  {
    continentId: 'continent_2',
    chapter: 2,
    name: 'Azure Archipelago',
    subtitle: 'The Sunken Spires',
    element: 'WATER',
    description:
      'A luminous oceanic haven of coral spires, deep-sea trenches, and surging tidal vortexes guarded by the ancient Tideguard order.',
    bossName: 'Leviathan Sovereign (Tideguard Primordial)',
    bossStageId: 'stage_2_10',
    totalStages: 10,
    colorHex: '#0ea5e9',
    accentHex: '#38bdf8',
    bgGradient: 'from-cyan-950 via-blue-950 to-slate-950',
    coordinates: { x: 50, y: 65 },
  },
  {
    continentId: 'continent_3',
    chapter: 3,
    name: 'Sylvan Canopy',
    subtitle: 'The Primeval Dominion',
    element: 'GRASS',
    description:
      'An ancient bioluminescent forest where colossal ironwood trees touch the clouds and floral spirits wield nature’s revitalizing wrath.',
    bossName: 'Yggdrasil Ancient (Floraweaver Elder)',
    bossStageId: 'stage_3_10',
    totalStages: 10,
    colorHex: '#22c55e',
    accentHex: '#4ade80',
    bgGradient: 'from-emerald-950 via-teal-950 to-slate-950',
    coordinates: { x: 75, y: 30 },
  },
  {
    continentId: 'continent_4',
    chapter: 4,
    name: 'Astral Citadel',
    subtitle: 'The Celestial Spires',
    element: 'LIGHT',
    description:
      'A floating sanctuary of crystalline temples, radiant sun prisms, and celestial seraphs bathed in perpetual dawn.',
    bossName: 'Solar Archon (Luminary Seraphic)',
    bossStageId: 'stage_4_10',
    totalStages: 10,
    colorHex: '#eab308',
    accentHex: '#fde047',
    bgGradient: 'from-yellow-950 via-amber-950 to-slate-950',
    coordinates: { x: 38, y: 18 },
  },
  {
    continentId: 'continent_5',
    chapter: 5,
    name: 'The Abyssal Rift',
    subtitle: 'The Shattered Void',
    element: 'DARK',
    description:
      'A fractured dimensional rift hanging in twilight space where gravitational singularities and void panthers bend darkness itself.',
    bossName: 'Void Sovereign (Shadowstalker Primordial)',
    bossStageId: 'stage_5_10',
    totalStages: 10,
    colorHex: '#a855f7',
    accentHex: '#c084fc',
    bgGradient: 'from-purple-950 via-violet-950 to-slate-950',
    coordinates: { x: 78, y: 72 },
  },
];

// Helper to generate custom Chapter 1 stages: Fire-based enemies and balanced onboarding difficulty
function generateChapter1Stages(): PvEStage[] {
  const stageConfigs = [
    {
      stageNumber: 1,
      name: 'Ember Foothills',
      description: 'Scout the smoking foothills of Ignis Caldera. Pack of wild Pyrosaurs and Molten Tideguards roam the volcanic ash.',
      level: 1,
      recommendedPower: 500,
      energyCost: 5,
      isMidBoss: false,
      isBoss: false,
      enemies: [
        { variantId: 'var_pyrosaur_fire', level: 1, slotIndex: 0, awakeningStage: 'BASE' as const },
        { variantId: 'var_nekohime_grass', level: 1, slotIndex: 1, awakeningStage: 'BASE' as const },
        { variantId: 'var_tideguard_fire', level: 1, slotIndex: 2, awakeningStage: 'BASE' as const },
        { variantId: 'var_pyrosaur_fire', level: 1, slotIndex: 3, awakeningStage: 'BASE' as const },
        { variantId: 'var_tideguard_fire', level: 1, slotIndex: 4, awakeningStage: 'BASE' as const },
      ],
    },
    {
      stageNumber: 2,
      name: 'Scorched Defile',
      description: 'Navigate narrow basalt canyons where Solar Luminaries and fire saurians ambush travelers from the ridges.',
      level: 2,
      recommendedPower: 700,
      energyCost: 5,
      isMidBoss: false,
      isBoss: false,
      enemies: [
        { variantId: 'var_pyrosaur_fire', level: 2, slotIndex: 0, awakeningStage: 'BASE' as const },
        { variantId: 'var_tideguard_fire', level: 2, slotIndex: 1, awakeningStage: 'BASE' as const },
        { variantId: 'var_luminary_fire', level: 2, slotIndex: 2, awakeningStage: 'BASE' as const },
        { variantId: 'var_pyrosaur_fire', level: 2, slotIndex: 3, awakeningStage: 'BASE' as const },
        { variantId: 'var_tideguard_fire', level: 2, slotIndex: 4, awakeningStage: 'BASE' as const },
      ],
    },
    {
      stageNumber: 3,
      name: 'Basalt Crossing',
      description: 'A perilous bridge across a molten river guarded by flame sentinels and prowling infernal hellhounds.',
      level: 3,
      recommendedPower: 950,
      energyCost: 5,
      isMidBoss: false,
      isBoss: false,
      enemies: [
        { variantId: 'var_pyrosaur_fire', level: 3, slotIndex: 0, awakeningStage: 'BASE' as const },
        { variantId: 'var_tideguard_fire', level: 2, slotIndex: 1, awakeningStage: 'BASE' as const },
        { variantId: 'var_luminary_fire', level: 3, slotIndex: 2, awakeningStage: 'BASE' as const },
        { variantId: 'var_shadowstalker_fire', level: 2, slotIndex: 3, awakeningStage: 'BASE' as const },
        { variantId: 'var_pyrosaur_fire', level: 3, slotIndex: 4, awakeningStage: 'BASE' as const },
      ],
    },
    {
      stageNumber: 4,
      name: 'Sulfur Steppes',
      description: 'Choking sulfur geysers empower fierce fire beasts. Water elemental affinities grant decisive tactical advantages.',
      level: 4,
      recommendedPower: 1150,
      energyCost: 5,
      isMidBoss: false,
      isBoss: false,
      enemies: [
        { variantId: 'var_pyrosaur_fire', level: 4, slotIndex: 0, awakeningStage: 'BASE' as const },
        { variantId: 'var_tideguard_fire', level: 3, slotIndex: 1, awakeningStage: 'BASE' as const },
        { variantId: 'var_luminary_fire', level: 4, slotIndex: 2, awakeningStage: 'BASE' as const },
        { variantId: 'var_shadowstalker_fire', level: 3, slotIndex: 3, awakeningStage: 'BASE' as const },
        { variantId: 'var_tideguard_fire', level: 4, slotIndex: 4, awakeningStage: 'BASE' as const },
      ],
    },
    {
      stageNumber: 5,
      name: 'Ashen Stronghold',
      description: 'A fortified obsidian garrison guarding the inner caldera. Defeat the elite Vanguard Commander and its fire garrison.',
      level: 5,
      recommendedPower: 1400,
      energyCost: 6,
      isMidBoss: true,
      isBoss: false,
      enemies: [
        { variantId: 'var_pyrosaur_fire', level: 5, slotIndex: 0, awakeningStage: 'AWAKENED' as const },
        { variantId: 'var_tideguard_fire', level: 4, slotIndex: 1, awakeningStage: 'BASE' as const },
        { variantId: 'var_luminary_fire', level: 4, slotIndex: 2, awakeningStage: 'BASE' as const },
        { variantId: 'var_shadowstalker_fire', level: 4, slotIndex: 3, awakeningStage: 'BASE' as const },
        { variantId: 'var_tideguard_fire', level: 4, slotIndex: 4, awakeningStage: 'BASE' as const },
      ],
    },
    {
      stageNumber: 6,
      name: 'Obsidian Caverns',
      description: 'Deep subterranean lava tubes teeming with molten carapace defenders and swift fire predators.',
      level: 5,
      recommendedPower: 1600,
      energyCost: 6,
      isMidBoss: false,
      isBoss: false,
      enemies: [
        { variantId: 'var_tideguard_fire', level: 5, slotIndex: 0, awakeningStage: 'BASE' as const },
        { variantId: 'var_pyrosaur_fire', level: 5, slotIndex: 1, awakeningStage: 'BASE' as const },
        { variantId: 'var_luminary_fire', level: 5, slotIndex: 2, awakeningStage: 'BASE' as const },
        { variantId: 'var_shadowstalker_fire', level: 5, slotIndex: 3, awakeningStage: 'BASE' as const },
        { variantId: 'var_pyrosaur_fire', level: 5, slotIndex: 4, awakeningStage: 'BASE' as const },
      ],
    },
    {
      stageNumber: 7,
      name: 'Lava Tube Tunnels',
      description: 'Intense thermal heat pulses through volcanic corridors. Radiant Solar Luminaries bathe the battlefield in fiery solar flares.',
      level: 6,
      recommendedPower: 1800,
      energyCost: 6,
      isMidBoss: false,
      isBoss: false,
      enemies: [
        { variantId: 'var_luminary_fire', level: 6, slotIndex: 0, awakeningStage: 'BASE' as const },
        { variantId: 'var_tideguard_fire', level: 6, slotIndex: 1, awakeningStage: 'BASE' as const },
        { variantId: 'var_pyrosaur_fire', level: 6, slotIndex: 2, awakeningStage: 'BASE' as const },
        { variantId: 'var_shadowstalker_fire', level: 5, slotIndex: 3, awakeningStage: 'BASE' as const },
        { variantId: 'var_luminary_fire', level: 6, slotIndex: 4, awakeningStage: 'BASE' as const },
      ],
    },
    {
      stageNumber: 8,
      name: 'Cinder Spire Trail',
      description: 'Scale the treacherous ridge toward the volcano rim. Pack of lethal Infernal Hellhounds attack with deadly fury.',
      level: 7,
      recommendedPower: 2050,
      energyCost: 6,
      isMidBoss: false,
      isBoss: false,
      enemies: [
        { variantId: 'var_shadowstalker_fire', level: 7, slotIndex: 0, awakeningStage: 'BASE' as const },
        { variantId: 'var_pyrosaur_fire', level: 6, slotIndex: 1, awakeningStage: 'BASE' as const },
        { variantId: 'var_tideguard_fire', level: 6, slotIndex: 2, awakeningStage: 'BASE' as const },
        { variantId: 'var_luminary_fire', level: 6, slotIndex: 3, awakeningStage: 'BASE' as const },
        { variantId: 'var_shadowstalker_fire', level: 7, slotIndex: 4, awakeningStage: 'BASE' as const },
      ],
    },
    {
      stageNumber: 9,
      name: 'Dragoncrest Ramparts',
      description: 'The final bastion before the Caldera Core. Elite Magma Dreadnoughts and Solar Archons hold the line.',
      level: 8,
      recommendedPower: 2300,
      energyCost: 6,
      isMidBoss: false,
      isBoss: false,
      enemies: [
        { variantId: 'var_pyrosaur_fire', level: 8, slotIndex: 0, awakeningStage: 'BASE' as const },
        { variantId: 'var_tideguard_fire', level: 7, slotIndex: 1, awakeningStage: 'BASE' as const },
        { variantId: 'var_luminary_fire', level: 8, slotIndex: 2, awakeningStage: 'BASE' as const },
        { variantId: 'var_shadowstalker_fire', level: 7, slotIndex: 3, awakeningStage: 'BASE' as const },
        { variantId: 'var_tideguard_fire', level: 8, slotIndex: 4, awakeningStage: 'BASE' as const },
      ],
    },
    {
      stageNumber: 10,
      name: 'Caldera Core',
      description: 'Confront Ignis Sovereign (Continent Overlord Boss) and its Fire court in an epic 5v5 Continent Boss confrontation!',
      level: 10,
      recommendedPower: 2850,
      energyCost: 8,
      isMidBoss: false,
      isBoss: true,
      enemies: [
        { variantId: 'var_boss_pyrosaur_ignis', level: 10, slotIndex: 0, awakeningStage: 'AWAKENED' as const },
        { variantId: 'var_tideguard_fire', level: 9, slotIndex: 1, awakeningStage: 'AWAKENED' as const },
        { variantId: 'var_luminary_fire', level: 9, slotIndex: 2, awakeningStage: 'BASE' as const },
        { variantId: 'var_shadowstalker_fire', level: 9, slotIndex: 3, awakeningStage: 'BASE' as const },
        { variantId: 'var_pyrosaur_fire', level: 9, slotIndex: 4, awakeningStage: 'AWAKENED' as const },
      ],
    },
  ];

  return stageConfigs.map((cfg) => {
    const stageId = `stage_1_${cfg.stageNumber}`;
    return {
      stageId,
      chapter: 1,
      stageNumber: cfg.stageNumber,
      continentId: 'continent_1',
      element: 'FIRE' as const,
      isBossStage: cfg.isBoss,
      bossTitle: cfg.isBoss
        ? 'Ignis Sovereign (Pyrosaur Overlord)'
        : cfg.isMidBoss
        ? 'Ashen Vanguard Commander'
        : undefined,
      name: cfg.name,
      description: cfg.description,
      energyCost: cfg.energyCost,
      recommendedPower: cfg.recommendedPower,
      enemyVariants: cfg.enemies,
      firstClearRewards: {
        gold: cfg.isBoss ? 25000 : cfg.isMidBoss ? 15000 : 5000 + cfg.stageNumber * 800,
        gems: cfg.isBoss ? 350 : cfg.isMidBoss ? 150 : 60,
        summonPoints: cfg.isBoss ? 500 : cfg.isMidBoss ? 250 : 120,
      },
      repeatRewards: {
        gold: 600 + cfg.stageNumber * 100,
        exp: 200 + cfg.stageNumber * 60,
      },
    };
  });
}

// Helper to generate the 10 stages for each continent
function generateContinentStages(
  chapter: number,
  continentId: string,
  baseLevel: number,
  primaryVariant: string,
  element: string
): PvEStage[] {
  const stageNamesByChapter: Record<number, string[]> = {
    1: [
      'Ember Foothills',
      'Scorched Defile',
      'Basalt Crossing',
      'Sulfur Steppes',
      'Ashen Stronghold', // Mid-boss 1-5
      'Obsidian Caverns',
      'Lava Tube Tunnels',
      'Cinder Spire Trail',
      'Dragoncrest Ramparts',
      'Caldera Core', // Final Boss 1-10
    ],
    2: [
      'Coral Shallows',
      'Mist Veil Atoll',
      'Tidecaller Shoals',
      'Pearl Grotto',
      'Barrier Reef Citadel', // Mid-boss 2-5
      'Siren Trench Descent',
      'Sunken Amphitheater',
      'Whirlpool Crucible',
      'Abyssal Trench Gate',
      'Poseidon Trench Apex', // Final Boss 2-10
    ],
    3: [
      'Verdant Outskirts',
      'Emerald Thicket',
      'Luminescent Glade',
      'Bramble Hollow',
      'Heartwood Bastion', // Mid-boss 3-5
      'Canopy Walkways',
      'Whispering Pines',
      'Ancient Grove Spire',
      'Fey Dragon Run',
      'Yggdrasil Root Apex', // Final Boss 3-10
    ],
    4: [
      'Starlight Ascent',
      'Crystal Promenade',
      'Radiant Cloudfields',
      'Solar Gatehouse',
      'Silver Seraph Tower', // Mid-boss 4-5
      'Prism Sanctum',
      'Celestial Courtyard',
      'Nova Colosseum',
      'Dawn Spire Throne Gate',
      'Citadel Apex of Radiance', // Final Boss 4-10
    ],
    5: [
      'Void Horizon Edge',
      'Singularity Shallows',
      'Eclipsed Ruins',
      'Dark Nebula Caverns',
      'Event Horizon Citadel', // Mid-boss 5-5
      'Graviton Rift Path',
      'Nether Bastion',
      'Abyssal Abyss Vault',
      'Chasm of Despair',
      'The Shattered Singularity Core', // Grand Boss 5-10
    ],
  };

  const names = stageNamesByChapter[chapter] || [];

  return Array.from({ length: 10 }, (_, idx) => {
    const stageNumber = idx + 1;
    const stageId = `stage_${chapter}_${stageNumber}`;
    const isBoss = stageNumber === 10;
    const isMidBoss = stageNumber === 5;
    const level = baseLevel + idx * 2 + (isBoss ? 4 : isMidBoss ? 1 : 0);

    const chapterBossVariantId =
      chapter === 2
        ? 'var_boss_tideguard_leviathan'
        : chapter === 3
        ? 'var_boss_floraweaver_yggdrasil'
        : chapter === 4
        ? 'var_boss_luminary_archon'
        : chapter === 5
        ? 'var_boss_shadowstalker_void'
        : 'var_boss_pyrosaur_ignis';

    // Enemy roster creation
    const enemyVariants = [
      {
        variantId: isBoss ? chapterBossVariantId : primaryVariant,
        level: isBoss ? level + 2 : level,
        slotIndex: 0,
        awakeningStage: (isBoss || (isMidBoss && chapter >= 3) ? 'AWAKENED' : 'BASE') as any,
      },
      {
        variantId: chapter === 1 ? 'var_tideguard_water' : 'var_pyrosaur_fire',
        level: Math.max(1, level - 1),
        slotIndex: 1,
        awakeningStage: (isBoss && chapter >= 2 ? 'AWAKENED' : 'BASE') as any,
      },
      {
        variantId: chapter === 3 ? 'var_luminary_light' : 'var_floraweaver_grass',
        level: Math.max(1, level - 1),
        slotIndex: 2,
        awakeningStage: (isBoss && chapter >= 3 ? 'AWAKENED' : 'BASE') as any,
      },
      {
        variantId: chapter === 4 ? 'var_shadowstalker_dark' : 'var_luminary_light',
        level: level,
        slotIndex: 3,
        awakeningStage: (isBoss && chapter >= 4 ? 'AWAKENED' : 'BASE') as any,
      },
      {
        variantId: isBoss ? (chapter === 5 ? 'var_boss_shadowstalker_void' : primaryVariant) : 'var_shadowstalker_dark',
        level: isBoss ? level + 1 : level,
        slotIndex: 4,
        awakeningStage: (isBoss ? 'AWAKENED' : 'BASE') as any,
      },
    ];

    return {
      stageId,
      chapter,
      stageNumber,
      continentId,
      element: element as any,
      isBossStage: isBoss,
      bossTitle: isBoss
        ? CONTINENTS.find((c) => c.continentId === continentId)?.bossName
        : isMidBoss
        ? 'Sector Gatekeeper'
        : undefined,
      name: names[idx] || `Sector ${chapter}-${stageNumber}`,
      description: isBoss
        ? `Defeat the Continent Sovereign in an epic 5v5 battle to conquer ${CONTINENTS.find((c) => c.continentId === continentId)?.name} and unlock the next continent!`
        : isMidBoss
        ? `A fortified outpost defending the inner continent. Defeat the vanguard to advance deeper.`
        : `Battle 5 strategic combatants through the terrain of ${CONTINENTS.find((c) => c.continentId === continentId)?.name}.`,
      energyCost: 5 + Math.floor(chapter * 1.5) + (isBoss ? 2 : 0),
      recommendedPower: Math.floor(1000 * chapter + idx * 450 + (isBoss ? 1500 : 0)),
      enemyVariants,
      firstClearRewards: {
        gold: isBoss ? 20000 * chapter : isMidBoss ? 12000 * chapter : 5000 + idx * 800,
        gems: isBoss ? 300 * chapter : isMidBoss ? 150 : 50,
        summonPoints: isBoss ? 400 : isMidBoss ? 200 : 100,
      },
      repeatRewards: {
        gold: 600 * chapter + idx * 100,
        exp: 200 * chapter + idx * 60,
      },
    };
  });
}

export const PVE_STAGES: PvEStage[] = [
  ...generateChapter1Stages(),
  ...generateContinentStages(2, 'continent_2', 12, 'var_tideguard_water', 'WATER'),
  ...generateContinentStages(3, 'continent_3', 20, 'var_floraweaver_grass', 'GRASS'),
  ...generateContinentStages(4, 'continent_4', 28, 'var_luminary_light', 'LIGHT'),
  ...generateContinentStages(5, 'continent_5', 36, 'var_shadowstalker_dark', 'DARK'),
];

export interface EquipmentDungeonInfo {
  id: 'WEAPON' | 'ARMOR' | 'HELM' | 'BOOTS';
  name: string;
  subtitle: string;
  slot: 'WEAPON' | 'ARMOR' | 'HELM' | 'BOOTS';
  slotName: string;
  element: 'FIRE' | 'GRASS' | 'LIGHT' | 'WATER';
  bossName: string;
  bossVariantId: string;
  bossMechanicTitle: string;
  bossMechanicDescription: string;
  colorHex: string;
  accentHex: string;
  bgGradient: string;
  lore: string;
  stages: PvEStage[];
}

// 4 Specialized Equipment Dungeons with 3 Levels each (2 normal fights then boss fight)
export const DUNGEON_STAGES: PvEStage[] = [
  // -------------------------------------------------------------
  // 1. WEAPON DUNGEON: Molten Foundry of Blades
  // Boss: Ignis Blade-Tyrant (Applies heavy Continuous Damage / Burn DoTs)
  // -------------------------------------------------------------
  {
    stageId: 'dungeon_weapon_1',
    chapter: 101,
    stageNumber: 1,
    continentId: 'dungeon_weapon',
    element: 'FIRE',
    name: 'Foundry Antechamber (Level 1)',
    description: 'Level 1: Fight > Fight > Boss! Overcome the forge scouts before challenging the young Ignis Blade-Tyrant.',
    energyCost: 6,
    recommendedPower: 1200,
    dungeonType: 'WEAPON',
    dungeonLevel: 1,
    droppedSlot: 'WEAPON',
    bossMechanicDescription: 'Fight 1 & 2: Forge scouts. Boss Wave: Ignis Blade-Tyrant with flame burns.',
    waves: [
      // Wave 1: Fight
      [
        { variantId: 'var_pyrosaur_fire', level: 8, slotIndex: 0, awakeningStage: 'BASE' },
        { variantId: 'var_porky_fire', level: 8, slotIndex: 1, awakeningStage: 'BASE' },
        { variantId: 'var_pyrosaur_fire', level: 9, slotIndex: 2, awakeningStage: 'BASE' },
        { variantId: 'var_doggo_fire', level: 8, slotIndex: 3, awakeningStage: 'BASE' },
        { variantId: 'var_porky_fire', level: 9, slotIndex: 4, awakeningStage: 'BASE' },
      ],
      // Wave 2: Fight
      [
        { variantId: 'var_pyrosaur_fire', level: 10, slotIndex: 0, awakeningStage: 'BASE' },
        { variantId: 'var_tideguard_fire', level: 10, slotIndex: 1, awakeningStage: 'BASE' },
        { variantId: 'var_pyrosaur_fire', level: 11, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_doggo_fire', level: 10, slotIndex: 3, awakeningStage: 'BASE' },
        { variantId: 'var_tideguard_fire', level: 11, slotIndex: 4, awakeningStage: 'BASE' },
      ],
      // Wave 3: Boss
      [
        { variantId: 'var_porky_fire', level: 10, slotIndex: 0, awakeningStage: 'BASE' },
        { variantId: 'var_pyrosaur_fire', level: 11, slotIndex: 1, awakeningStage: 'BASE' },
        { variantId: 'var_boss_dungeon_weapon', level: 14, slotIndex: 2, awakeningStage: 'BASE', isBoss: true, stars: 4 },
        { variantId: 'var_tideguard_fire', level: 11, slotIndex: 3, awakeningStage: 'BASE' },
        { variantId: 'var_doggo_fire', level: 10, slotIndex: 4, awakeningStage: 'BASE' },
      ],
    ],
    enemyVariants: [
      { variantId: 'var_porky_fire', level: 10, slotIndex: 0, awakeningStage: 'BASE' },
      { variantId: 'var_pyrosaur_fire', level: 11, slotIndex: 1, awakeningStage: 'BASE' },
      { variantId: 'var_boss_dungeon_weapon', level: 14, slotIndex: 2, awakeningStage: 'BASE', isBoss: true, stars: 4 },
      { variantId: 'var_tideguard_fire', level: 11, slotIndex: 3, awakeningStage: 'BASE' },
      { variantId: 'var_doggo_fire', level: 10, slotIndex: 4, awakeningStage: 'BASE' },
    ],
    firstClearRewards: { gold: 2000, gems: 50, summonPoints: 10 },
    repeatRewards: { gold: 800, exp: 300 },
  },
  {
    stageId: 'dungeon_weapon_2',
    chapter: 101,
    stageNumber: 2,
    continentId: 'dungeon_weapon',
    element: 'FIRE',
    name: 'Infernal Smelting Kiln (Level 2)',
    description: 'Level 2: Fight > Fight > Boss! 2 waves of flame sentinels before the awakened Ignis Blade-Tyrant.',
    energyCost: 8,
    recommendedPower: 2800,
    dungeonType: 'WEAPON',
    dungeonLevel: 2,
    droppedSlot: 'WEAPON',
    bossMechanicDescription: 'Fight 1 & 2: Elite flame sentinels. Boss Wave: Ignis Blade-Tyrant wielding dual burns.',
    waves: [
      // Wave 1: Fight
      [
        { variantId: 'var_pyrosaur_fire', level: 15, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_nekohime_fire', level: 15, slotIndex: 1, awakeningStage: 'BASE' },
        { variantId: 'var_tideguard_fire', level: 16, slotIndex: 2, awakeningStage: 'BASE' },
        { variantId: 'var_floraweaver_fire', level: 15, slotIndex: 3, awakeningStage: 'BASE' },
        { variantId: 'var_porky_fire', level: 16, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
      // Wave 2: Fight
      [
        { variantId: 'var_pyrosaur_fire', level: 17, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_nekohime_fire', level: 17, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_pyrosaur_fire', level: 18, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_floraweaver_fire', level: 17, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_tideguard_fire', level: 18, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
      // Wave 3: Boss
      [
        { variantId: 'var_floraweaver_fire', level: 18, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_nekohime_fire', level: 19, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_boss_dungeon_weapon', level: 22, slotIndex: 2, awakeningStage: 'AWAKENED', isBoss: true, stars: 5 },
        { variantId: 'var_tideguard_fire', level: 19, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_pyrosaur_fire', level: 18, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
    ],
    enemyVariants: [
      { variantId: 'var_floraweaver_fire', level: 18, slotIndex: 0, awakeningStage: 'AWAKENED' },
      { variantId: 'var_nekohime_fire', level: 19, slotIndex: 1, awakeningStage: 'AWAKENED' },
      { variantId: 'var_boss_dungeon_weapon', level: 22, slotIndex: 2, awakeningStage: 'AWAKENED', isBoss: true, stars: 5 },
      { variantId: 'var_tideguard_fire', level: 19, slotIndex: 3, awakeningStage: 'AWAKENED' },
      { variantId: 'var_pyrosaur_fire', level: 18, slotIndex: 4, awakeningStage: 'AWAKENED' },
    ],
    firstClearRewards: { gold: 3500, gems: 80, summonPoints: 15 },
    repeatRewards: { gold: 1400, exp: 550 },
  },
  {
    stageId: 'dungeon_weapon_3',
    chapter: 101,
    stageNumber: 3,
    continentId: 'dungeon_weapon',
    element: 'FIRE',
    isBossStage: true,
    isBoss: true,
    bossTitle: 'Tyrant of the Molten Core',
    name: 'Heart of the Bladewrought (Level 3 Boss)',
    description: 'Level 3: 2 normal fights then the Boss Fight! Ignis Blade-Tyrant afflicts your party with continuous stacking Burn DoTs.',
    energyCost: 10,
    recommendedPower: 5200,
    dungeonType: 'WEAPON',
    dungeonLevel: 3,
    droppedSlot: 'WEAPON',
    bossMechanicDescription: 'BOSS MECHANIC: Applies relentless stacking Damage-Over-Time (Burn) debuffs that tick for 5% max HP per turn each! Bring cleansers or burst him down fast.',
    waves: [
      // Wave 1: Normal Fight 1
      [
        { variantId: 'var_pyrosaur_fire', level: 22, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_nekohime_fire', level: 21, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_doggo_fire', level: 21, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_floraweaver_fire', level: 21, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_tideguard_fire', level: 22, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
      // Wave 2: Normal Fight 2
      [
        { variantId: 'var_porky_fire', level: 24, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_nekohime_fire', level: 23, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_pyrosaur_fire', level: 25, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_doggo_fire', level: 23, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_tideguard_fire', level: 24, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
      // Wave 3: Boss Fight
      [
        { variantId: 'var_tideguard_fire', level: 24, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_nekohime_fire', level: 24, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_boss_dungeon_weapon', level: 28, slotIndex: 2, awakeningStage: 'AWAKENED', isBoss: true, stars: 6 },
        { variantId: 'var_floraweaver_fire', level: 24, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_pyrosaur_fire', level: 25, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
    ],
    enemyVariants: [
      { variantId: 'var_tideguard_fire', level: 24, slotIndex: 0, awakeningStage: 'AWAKENED' },
      { variantId: 'var_nekohime_fire', level: 24, slotIndex: 1, awakeningStage: 'AWAKENED' },
      { variantId: 'var_boss_dungeon_weapon', level: 28, slotIndex: 2, awakeningStage: 'AWAKENED', isBoss: true, stars: 6 },
      { variantId: 'var_floraweaver_fire', level: 24, slotIndex: 3, awakeningStage: 'AWAKENED' },
      { variantId: 'var_pyrosaur_fire', level: 25, slotIndex: 4, awakeningStage: 'AWAKENED' },
    ],
    firstClearRewards: { gold: 6000, gems: 150, summonPoints: 30 },
    repeatRewards: { gold: 2400, exp: 900 },
  },

  // -------------------------------------------------------------
  // 2. ARMOR DUNGEON: Titan Bastion Vault
  // Boss: Aegis Colossus (Applies crushing Attack Down & Defense Down)
  // -------------------------------------------------------------
  {
    stageId: 'dungeon_armor_1',
    chapter: 102,
    stageNumber: 1,
    continentId: 'dungeon_armor',
    element: 'GRASS',
    name: 'Bastion Periphery (Level 1)',
    description: 'Level 1: Fight > Fight > Boss! Heavy stone golems defend the perimeter before the young Aegis Colossus.',
    energyCost: 6,
    recommendedPower: 1200,
    dungeonType: 'ARMOR',
    dungeonLevel: 1,
    droppedSlot: 'ARMOR',
    bossMechanicDescription: 'Fight 1 & 2: Sturdy shell beetles. Boss Wave: Aegis Colossus with bastion barrier.',
    waves: [
      // Wave 1: Fight
      [
        { variantId: 'var_rockman_grass', level: 8, slotIndex: 0, awakeningStage: 'BASE' },
        { variantId: 'var_floraweaver_grass', level: 8, slotIndex: 1, awakeningStage: 'BASE' },
        { variantId: 'var_rockman_grass', level: 9, slotIndex: 2, awakeningStage: 'BASE' },
        { variantId: 'var_doggo_grass', level: 8, slotIndex: 3, awakeningStage: 'BASE' },
        { variantId: 'var_nekohime_grass', level: 9, slotIndex: 4, awakeningStage: 'BASE' },
      ],
      // Wave 2: Fight
      [
        { variantId: 'var_rockman_grass', level: 10, slotIndex: 0, awakeningStage: 'BASE' },
        { variantId: 'var_porky_grass', level: 10, slotIndex: 1, awakeningStage: 'BASE' },
        { variantId: 'var_rockman_grass', level: 11, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_doggo_grass', level: 10, slotIndex: 3, awakeningStage: 'BASE' },
        { variantId: 'var_floraweaver_grass', level: 11, slotIndex: 4, awakeningStage: 'BASE' },
      ],
      // Wave 3: Boss
      [
        { variantId: 'var_floraweaver_grass', level: 10, slotIndex: 0, awakeningStage: 'BASE' },
        { variantId: 'var_rockman_grass', level: 11, slotIndex: 1, awakeningStage: 'BASE' },
        { variantId: 'var_boss_dungeon_armor', level: 14, slotIndex: 2, awakeningStage: 'BASE', isBoss: true, stars: 4 },
        { variantId: 'var_porky_grass', level: 11, slotIndex: 3, awakeningStage: 'BASE' },
        { variantId: 'var_nekohime_grass', level: 10, slotIndex: 4, awakeningStage: 'BASE' },
      ],
    ],
    enemyVariants: [
      { variantId: 'var_floraweaver_grass', level: 10, slotIndex: 0, awakeningStage: 'BASE' },
      { variantId: 'var_rockman_grass', level: 11, slotIndex: 1, awakeningStage: 'BASE' },
      { variantId: 'var_boss_dungeon_armor', level: 14, slotIndex: 2, awakeningStage: 'BASE', isBoss: true, stars: 4 },
      { variantId: 'var_porky_grass', level: 11, slotIndex: 3, awakeningStage: 'BASE' },
      { variantId: 'var_nekohime_grass', level: 10, slotIndex: 4, awakeningStage: 'BASE' },
    ],
    firstClearRewards: { gold: 2000, gems: 50, summonPoints: 10 },
    repeatRewards: { gold: 800, exp: 300 },
  },
  {
    stageId: 'dungeon_armor_2',
    chapter: 102,
    stageNumber: 2,
    continentId: 'dungeon_armor',
    element: 'GRASS',
    name: 'Ironclad Ramparts (Level 2)',
    description: 'Level 2: Fight > Fight > Boss! 2 waves of granite wardens before the awakened Aegis Colossus.',
    energyCost: 8,
    recommendedPower: 2800,
    dungeonType: 'ARMOR',
    dungeonLevel: 2,
    droppedSlot: 'ARMOR',
    bossMechanicDescription: 'Fight 1 & 2: Armored rampart wardens. Boss Wave: Aegis Colossus with sunder attack.',
    waves: [
      // Wave 1: Fight
      [
        { variantId: 'var_rockman_grass', level: 15, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_floraweaver_grass', level: 15, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_porky_grass', level: 16, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_nekohime_grass', level: 15, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_doggo_grass', level: 16, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
      // Wave 2: Fight
      [
        { variantId: 'var_rockman_grass', level: 17, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_tideguard_water', level: 17, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_rockman_grass', level: 18, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_floraweaver_grass', level: 17, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_porky_grass', level: 18, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
      // Wave 3: Boss
      [
        { variantId: 'var_floraweaver_grass', level: 18, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_rockman_grass', level: 19, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_boss_dungeon_armor', level: 22, slotIndex: 2, awakeningStage: 'AWAKENED', isBoss: true, stars: 5 },
        { variantId: 'var_porky_grass', level: 19, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_tideguard_water', level: 18, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
    ],
    enemyVariants: [
      { variantId: 'var_floraweaver_grass', level: 18, slotIndex: 0, awakeningStage: 'AWAKENED' },
      { variantId: 'var_rockman_grass', level: 19, slotIndex: 1, awakeningStage: 'AWAKENED' },
      { variantId: 'var_boss_dungeon_armor', level: 22, slotIndex: 2, awakeningStage: 'AWAKENED', isBoss: true, stars: 5 },
      { variantId: 'var_porky_grass', level: 19, slotIndex: 3, awakeningStage: 'AWAKENED' },
      { variantId: 'var_tideguard_water', level: 18, slotIndex: 4, awakeningStage: 'AWAKENED' },
    ],
    firstClearRewards: { gold: 3500, gems: 80, summonPoints: 15 },
    repeatRewards: { gold: 1400, exp: 550 },
  },
  {
    stageId: 'dungeon_armor_3',
    chapter: 102,
    stageNumber: 3,
    continentId: 'dungeon_armor',
    element: 'GRASS',
    isBossStage: true,
    isBoss: true,
    bossTitle: 'Titan of the Unbroken Bastion',
    name: 'Aegis Colossus Sanctum (Level 3 Boss)',
    description: 'Level 3: 2 normal fights then the Boss Fight! Aegis Colossus sunders party Attack (-50%) and Defense (-70%) while erecting bastion barriers.',
    energyCost: 10,
    recommendedPower: 5200,
    dungeonType: 'ARMOR',
    dungeonLevel: 3,
    droppedSlot: 'ARMOR',
    bossMechanicDescription: 'BOSS MECHANIC: Sunder slam afflicts all players with Attack Down (-50%) AND Defense Down (-70%) simultaneously, while fortifying himself with impenetrable shields!',
    waves: [
      // Wave 1: Normal Fight 1
      [
        { variantId: 'var_rockman_grass', level: 22, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_floraweaver_grass', level: 21, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_porky_grass', level: 21, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_doggo_grass', level: 21, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_nekohime_grass', level: 22, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
      // Wave 2: Normal Fight 2
      [
        { variantId: 'var_rockman_grass', level: 24, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_tideguard_water', level: 23, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_floraweaver_grass', level: 25, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_doggo_grass', level: 23, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_porky_grass', level: 24, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
      // Wave 3: Boss Fight
      [
        { variantId: 'var_rockman_grass', level: 24, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_floraweaver_grass', level: 24, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_boss_dungeon_armor', level: 28, slotIndex: 2, awakeningStage: 'AWAKENED', isBoss: true, stars: 6 },
        { variantId: 'var_porky_grass', level: 24, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_tideguard_water', level: 25, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
    ],
    enemyVariants: [
      { variantId: 'var_rockman_grass', level: 24, slotIndex: 0, awakeningStage: 'AWAKENED' },
      { variantId: 'var_floraweaver_grass', level: 24, slotIndex: 1, awakeningStage: 'AWAKENED' },
      { variantId: 'var_boss_dungeon_armor', level: 28, slotIndex: 2, awakeningStage: 'AWAKENED', isBoss: true, stars: 6 },
      { variantId: 'var_porky_grass', level: 24, slotIndex: 3, awakeningStage: 'AWAKENED' },
      { variantId: 'var_tideguard_water', level: 25, slotIndex: 4, awakeningStage: 'AWAKENED' },
    ],
    firstClearRewards: { gold: 6000, gems: 150, summonPoints: 30 },
    repeatRewards: { gold: 2400, exp: 900 },
  },

  // -------------------------------------------------------------
  // 3. HELMET DUNGEON: Chrono-Spire Sanctuary
  // Boss: Chrono-Seraph (Steals Turn Meter / Attack Bar)
  // -------------------------------------------------------------
  {
    stageId: 'dungeon_helm_1',
    chapter: 103,
    stageNumber: 1,
    continentId: 'dungeon_helm',
    element: 'LIGHT',
    name: 'Astral Atrium (Level 1)',
    description: 'Level 1: Fight > Fight > Boss! Celestial scouts and sun spirits hovering before the young Chrono-Seraph.',
    energyCost: 6,
    recommendedPower: 1200,
    dungeonType: 'HELM',
    dungeonLevel: 1,
    droppedSlot: 'HELM',
    bossMechanicDescription: 'Fight 1 & 2: Fast-flying astral birds. Boss Wave: Chrono-Seraph manipulates turn meters.',
    waves: [
      // Wave 1: Fight
      [
        { variantId: 'var_birdunno_light', level: 8, slotIndex: 0, awakeningStage: 'BASE' },
        { variantId: 'var_luminary_light', level: 8, slotIndex: 1, awakeningStage: 'BASE' },
        { variantId: 'var_birdunno_light', level: 9, slotIndex: 2, awakeningStage: 'BASE' },
        { variantId: 'var_doggo_light', level: 8, slotIndex: 3, awakeningStage: 'BASE' },
        { variantId: 'var_porky_light', level: 9, slotIndex: 4, awakeningStage: 'BASE' },
      ],
      // Wave 2: Fight
      [
        { variantId: 'var_birdunno_light', level: 10, slotIndex: 0, awakeningStage: 'BASE' },
        { variantId: 'var_luminary_light', level: 10, slotIndex: 1, awakeningStage: 'BASE' },
        { variantId: 'var_birdunno_light', level: 11, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_doggo_light', level: 10, slotIndex: 3, awakeningStage: 'BASE' },
        { variantId: 'var_porky_light', level: 11, slotIndex: 4, awakeningStage: 'BASE' },
      ],
      // Wave 3: Boss
      [
        { variantId: 'var_luminary_light', level: 10, slotIndex: 0, awakeningStage: 'BASE' },
        { variantId: 'var_birdunno_light', level: 11, slotIndex: 1, awakeningStage: 'BASE' },
        { variantId: 'var_boss_dungeon_helm', level: 14, slotIndex: 2, awakeningStage: 'BASE', isBoss: true, stars: 4 },
        { variantId: 'var_doggo_light', level: 11, slotIndex: 3, awakeningStage: 'BASE' },
        { variantId: 'var_porky_light', level: 10, slotIndex: 4, awakeningStage: 'BASE' },
      ],
    ],
    enemyVariants: [
      { variantId: 'var_luminary_light', level: 10, slotIndex: 0, awakeningStage: 'BASE' },
      { variantId: 'var_birdunno_light', level: 11, slotIndex: 1, awakeningStage: 'BASE' },
      { variantId: 'var_boss_dungeon_helm', level: 14, slotIndex: 2, awakeningStage: 'BASE', isBoss: true, stars: 4 },
      { variantId: 'var_doggo_light', level: 11, slotIndex: 3, awakeningStage: 'BASE' },
      { variantId: 'var_porky_light', level: 10, slotIndex: 4, awakeningStage: 'BASE' },
    ],
    firstClearRewards: { gold: 2000, gems: 50, summonPoints: 10 },
    repeatRewards: { gold: 800, exp: 300 },
  },
  {
    stageId: 'dungeon_helm_2',
    chapter: 103,
    stageNumber: 2,
    continentId: 'dungeon_helm',
    element: 'LIGHT',
    name: 'Hall of Hourglasses (Level 2)',
    description: 'Level 2: Fight > Fight > Boss! 2 waves of chrono-sentinels before the awakened Chrono-Seraph.',
    energyCost: 8,
    recommendedPower: 2800,
    dungeonType: 'HELM',
    dungeonLevel: 2,
    droppedSlot: 'HELM',
    bossMechanicDescription: 'Fight 1 & 2: Turn manipulation scouts. Boss Wave: Chrono-Seraph steals turn meter.',
    waves: [
      // Wave 1: Fight
      [
        { variantId: 'var_birdunno_light', level: 15, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_luminary_light', level: 15, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_doggo_light', level: 16, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_floraweaver_light', level: 15, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_porky_light', level: 16, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
      // Wave 2: Fight
      [
        { variantId: 'var_birdunno_light', level: 17, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_luminary_light', level: 17, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_birdunno_light', level: 18, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_doggo_light', level: 17, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_nekohime_light', level: 18, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
      // Wave 3: Boss
      [
        { variantId: 'var_floraweaver_light', level: 18, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_luminary_light', level: 19, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_boss_dungeon_helm', level: 22, slotIndex: 2, awakeningStage: 'AWAKENED', isBoss: true, stars: 5 },
        { variantId: 'var_birdunno_light', level: 19, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_nekohime_light', level: 18, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
    ],
    enemyVariants: [
      { variantId: 'var_floraweaver_light', level: 18, slotIndex: 0, awakeningStage: 'AWAKENED' },
      { variantId: 'var_luminary_light', level: 19, slotIndex: 1, awakeningStage: 'AWAKENED' },
      { variantId: 'var_boss_dungeon_helm', level: 22, slotIndex: 2, awakeningStage: 'AWAKENED', isBoss: true, stars: 5 },
      { variantId: 'var_birdunno_light', level: 19, slotIndex: 3, awakeningStage: 'AWAKENED' },
      { variantId: 'var_nekohime_light', level: 18, slotIndex: 4, awakeningStage: 'AWAKENED' },
    ],
    firstClearRewards: { gold: 3500, gems: 80, summonPoints: 15 },
    repeatRewards: { gold: 1400, exp: 550 },
  },
  {
    stageId: 'dungeon_helm_3',
    chapter: 103,
    stageNumber: 3,
    continentId: 'dungeon_helm',
    element: 'LIGHT',
    isBossStage: true,
    isBoss: true,
    bossTitle: 'Architect of Flowing Time',
    name: 'Chrono-Seraph Zenith (Level 3 Boss)',
    description: 'Level 3: 2 normal fights then the Boss Fight! Chrono-Seraph siphons 35% Attack Bar from your entire party to chain consecutive turns.',
    energyCost: 10,
    recommendedPower: 5200,
    dungeonType: 'HELM',
    dungeonLevel: 3,
    droppedSlot: 'HELM',
    bossMechanicDescription: 'BOSS MECHANIC: Steals 35% Attack Bar (Turn Meter) from ALL your monsters and boosts his own by +50%, starving your team of turns!',
    waves: [
      // Wave 1: Normal Fight 1
      [
        { variantId: 'var_birdunno_light', level: 22, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_luminary_light', level: 21, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_doggo_light', level: 21, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_porky_light', level: 21, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_nekohime_light', level: 22, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
      // Wave 2: Normal Fight 2
      [
        { variantId: 'var_birdunno_light', level: 24, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_floraweaver_light', level: 23, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_luminary_light', level: 25, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_doggo_light', level: 23, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_porky_light', level: 24, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
      // Wave 3: Boss Fight
      [
        { variantId: 'var_luminary_light', level: 24, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_birdunno_light', level: 24, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_boss_dungeon_helm', level: 28, slotIndex: 2, awakeningStage: 'AWAKENED', isBoss: true, stars: 6 },
        { variantId: 'var_nekohime_light', level: 24, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_floraweaver_light', level: 25, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
    ],
    enemyVariants: [
      { variantId: 'var_luminary_light', level: 24, slotIndex: 0, awakeningStage: 'AWAKENED' },
      { variantId: 'var_birdunno_light', level: 24, slotIndex: 1, awakeningStage: 'AWAKENED' },
      { variantId: 'var_boss_dungeon_helm', level: 28, slotIndex: 2, awakeningStage: 'AWAKENED', isBoss: true, stars: 6 },
      { variantId: 'var_nekohime_light', level: 24, slotIndex: 3, awakeningStage: 'AWAKENED' },
      { variantId: 'var_floraweaver_light', level: 25, slotIndex: 4, awakeningStage: 'AWAKENED' },
    ],
    firstClearRewards: { gold: 6000, gems: 150, summonPoints: 30 },
    repeatRewards: { gold: 2400, exp: 900 },
  },

  // -------------------------------------------------------------
  // 4. BOOTS DUNGEON: Zephyr Tempest Cavern
  // Boss: Stormgale Phantom (Extreme Speed, Speed Down & Stun/Freeze)
  // -------------------------------------------------------------
  {
    stageId: 'dungeon_boots_1',
    chapter: 104,
    stageNumber: 1,
    continentId: 'dungeon_boots',
    element: 'WATER',
    name: 'Windward Grotto (Level 1)',
    description: 'Level 1: Fight > Fight > Boss! Agile water sprites guard the rushing currents before the young Stormgale Phantom.',
    energyCost: 6,
    recommendedPower: 1200,
    dungeonType: 'BOOTS',
    dungeonLevel: 1,
    droppedSlot: 'BOOTS',
    bossMechanicDescription: 'Fight 1 & 2: Quick oceanic sprites. Boss Wave: Stormgale Phantom with water currents.',
    waves: [
      // Wave 1: Fight
      [
        { variantId: 'var_tideguard_water', level: 8, slotIndex: 0, awakeningStage: 'BASE' },
        { variantId: 'var_fishter_water', level: 8, slotIndex: 1, awakeningStage: 'BASE' },
        { variantId: 'var_tideguard_water', level: 9, slotIndex: 2, awakeningStage: 'BASE' },
        { variantId: 'var_doggo_water', level: 8, slotIndex: 3, awakeningStage: 'BASE' },
        { variantId: 'var_nekohime_water', level: 9, slotIndex: 4, awakeningStage: 'BASE' },
      ],
      // Wave 2: Fight
      [
        { variantId: 'var_tideguard_water', level: 10, slotIndex: 0, awakeningStage: 'BASE' },
        { variantId: 'var_fishter_water', level: 10, slotIndex: 1, awakeningStage: 'BASE' },
        { variantId: 'var_tideguard_water', level: 11, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_doggo_water', level: 10, slotIndex: 3, awakeningStage: 'BASE' },
        { variantId: 'var_nekohime_water', level: 11, slotIndex: 4, awakeningStage: 'BASE' },
      ],
      // Wave 3: Boss
      [
        { variantId: 'var_fishter_water', level: 10, slotIndex: 0, awakeningStage: 'BASE' },
        { variantId: 'var_tideguard_water', level: 11, slotIndex: 1, awakeningStage: 'BASE' },
        { variantId: 'var_boss_dungeon_boots', level: 14, slotIndex: 2, awakeningStage: 'BASE', isBoss: true, stars: 4 },
        { variantId: 'var_doggo_water', level: 11, slotIndex: 3, awakeningStage: 'BASE' },
        { variantId: 'var_nekohime_water', level: 10, slotIndex: 4, awakeningStage: 'BASE' },
      ],
    ],
    enemyVariants: [
      { variantId: 'var_fishter_water', level: 10, slotIndex: 0, awakeningStage: 'BASE' },
      { variantId: 'var_tideguard_water', level: 11, slotIndex: 1, awakeningStage: 'BASE' },
      { variantId: 'var_boss_dungeon_boots', level: 14, slotIndex: 2, awakeningStage: 'BASE', isBoss: true, stars: 4 },
      { variantId: 'var_doggo_water', level: 11, slotIndex: 3, awakeningStage: 'BASE' },
      { variantId: 'var_nekohime_water', level: 10, slotIndex: 4, awakeningStage: 'BASE' },
    ],
    firstClearRewards: { gold: 2000, gems: 50, summonPoints: 10 },
    repeatRewards: { gold: 800, exp: 300 },
  },
  {
    stageId: 'dungeon_boots_2',
    chapter: 104,
    stageNumber: 2,
    continentId: 'dungeon_boots',
    element: 'WATER',
    name: 'Vortex Chasm (Level 2)',
    description: 'Level 2: Fight > Fight > Boss! 2 waves of tempest striders before the awakened Stormgale Phantom.',
    energyCost: 8,
    recommendedPower: 2800,
    dungeonType: 'BOOTS',
    dungeonLevel: 2,
    droppedSlot: 'BOOTS',
    bossMechanicDescription: 'Fight 1 & 2: Speed reduction whirlpools. Boss Wave: Stormgale Phantom with freezing winds.',
    waves: [
      // Wave 1: Fight
      [
        { variantId: 'var_tideguard_water', level: 15, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_fishter_water', level: 15, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_nekohime_water', level: 16, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_floraweaver_water', level: 15, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_doggo_water', level: 16, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
      // Wave 2: Fight
      [
        { variantId: 'var_tideguard_water', level: 17, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_fishter_water', level: 17, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_tideguard_water', level: 18, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_nekohime_water', level: 17, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_porky_water', level: 18, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
      // Wave 3: Boss
      [
        { variantId: 'var_floraweaver_water', level: 18, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_fishter_water', level: 19, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_boss_dungeon_boots', level: 22, slotIndex: 2, awakeningStage: 'AWAKENED', isBoss: true, stars: 5 },
        { variantId: 'var_tideguard_water', level: 19, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_nekohime_water', level: 18, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
    ],
    enemyVariants: [
      { variantId: 'var_floraweaver_water', level: 18, slotIndex: 0, awakeningStage: 'AWAKENED' },
      { variantId: 'var_fishter_water', level: 19, slotIndex: 1, awakeningStage: 'AWAKENED' },
      { variantId: 'var_boss_dungeon_boots', level: 22, slotIndex: 2, awakeningStage: 'AWAKENED', isBoss: true, stars: 5 },
      { variantId: 'var_tideguard_water', level: 19, slotIndex: 3, awakeningStage: 'AWAKENED' },
      { variantId: 'var_nekohime_water', level: 18, slotIndex: 4, awakeningStage: 'AWAKENED' },
    ],
    firstClearRewards: { gold: 3500, gems: 80, summonPoints: 15 },
    repeatRewards: { gold: 1400, exp: 550 },
  },
  {
    stageId: 'dungeon_boots_3',
    chapter: 104,
    stageNumber: 3,
    continentId: 'dungeon_boots',
    element: 'WATER',
    isBossStage: true,
    isBoss: true,
    bossTitle: 'Tempest of the Glacial Zephyr',
    name: 'Eye of the Stormgale (Level 3 Boss)',
    description: 'Level 3: 2 normal fights then the Boss Fight! Stormgale Phantom slows and Freezes/Stuns slow targets while lapping the turn order.',
    energyCost: 10,
    recommendedPower: 5200,
    dungeonType: 'BOOTS',
    dungeonLevel: 3,
    droppedSlot: 'BOOTS',
    bossMechanicDescription: 'BOSS MECHANIC: Whirlwind slows the team (-33% Speed) and casts Glacial Gale to Freeze/Stun units while gaining bonus Extra Turns from critical hits!',
    waves: [
      // Wave 1: Normal Fight 1
      [
        { variantId: 'var_tideguard_water', level: 22, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_fishter_water', level: 21, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_nekohime_water', level: 21, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_doggo_water', level: 21, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_floraweaver_water', level: 22, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
      // Wave 2: Normal Fight 2
      [
        { variantId: 'var_tideguard_water', level: 24, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_porky_water', level: 23, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_fishter_water', level: 25, slotIndex: 2, awakeningStage: 'AWAKENED' },
        { variantId: 'var_nekohime_water', level: 23, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_doggo_water', level: 24, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
      // Wave 3: Boss Fight
      [
        { variantId: 'var_tideguard_water', level: 24, slotIndex: 0, awakeningStage: 'AWAKENED' },
        { variantId: 'var_fishter_water', level: 24, slotIndex: 1, awakeningStage: 'AWAKENED' },
        { variantId: 'var_boss_dungeon_boots', level: 28, slotIndex: 2, awakeningStage: 'AWAKENED', isBoss: true, stars: 6 },
        { variantId: 'var_nekohime_water', level: 24, slotIndex: 3, awakeningStage: 'AWAKENED' },
        { variantId: 'var_floraweaver_water', level: 25, slotIndex: 4, awakeningStage: 'AWAKENED' },
      ],
    ],
    enemyVariants: [
      { variantId: 'var_tideguard_water', level: 24, slotIndex: 0, awakeningStage: 'AWAKENED' },
      { variantId: 'var_fishter_water', level: 24, slotIndex: 1, awakeningStage: 'AWAKENED' },
      { variantId: 'var_boss_dungeon_boots', level: 28, slotIndex: 2, awakeningStage: 'AWAKENED', isBoss: true, stars: 6 },
      { variantId: 'var_nekohime_water', level: 24, slotIndex: 3, awakeningStage: 'AWAKENED' },
      { variantId: 'var_floraweaver_water', level: 25, slotIndex: 4, awakeningStage: 'AWAKENED' },
    ],
    firstClearRewards: { gold: 6000, gems: 150, summonPoints: 30 },
    repeatRewards: { gold: 2400, exp: 900 },
  },
];

export const ALL_STAGES: PvEStage[] = [...PVE_STAGES, ...DUNGEON_STAGES];

export const EQUIPMENT_DUNGEON_INFOS: Record<'WEAPON' | 'ARMOR' | 'HELM' | 'BOOTS', EquipmentDungeonInfo> = {
  WEAPON: {
    id: 'WEAPON',
    name: 'Molten Foundry of Blades',
    subtitle: 'Weapon Dungeon • 3 Levels',
    slot: 'WEAPON',
    slotName: 'Weapons',
    element: 'FIRE',
    bossName: 'Ignis Blade-Tyrant',
    bossVariantId: 'var_boss_dungeon_weapon',
    bossMechanicTitle: 'Incinerating Continuous Damage',
    bossMechanicDescription: 'Inflicts massive, stacking Continuous Damage (Burn DoTs) across your party that deal 5% max HP damage each turn!',
    colorHex: '#dc2626',
    accentHex: '#f97316',
    bgGradient: 'from-amber-950 via-red-950 to-slate-950',
    lore: 'An active magma forge where legendary weapons are forged in dragonfire. Its tyrant burns invaders alive with stacking infernal brands.',
    stages: DUNGEON_STAGES.filter((s) => s.dungeonType === 'WEAPON'),
  },
  ARMOR: {
    id: 'ARMOR',
    name: 'Titan Bastion Vault',
    subtitle: 'Armor Dungeon • 3 Levels',
    slot: 'ARMOR',
    slotName: 'Armors',
    element: 'GRASS',
    bossName: 'Aegis Colossus',
    bossVariantId: 'var_boss_dungeon_armor',
    bossMechanicTitle: 'Dual Attack & Defense Sunder',
    bossMechanicDescription: 'Hits your party with Attack Down (-50%) and Defense Down (-70%) simultaneously while erecting colossal fortress shields!',
    colorHex: '#16a34a',
    accentHex: '#84cc16',
    bgGradient: 'from-emerald-950 via-teal-950 to-slate-950',
    lore: 'Carved from monolithic basalt plates. The Aegis Colossus crushes attackers into dust by shattering both their offense and resilience.',
    stages: DUNGEON_STAGES.filter((s) => s.dungeonType === 'ARMOR'),
  },
  HELM: {
    id: 'HELM',
    name: 'Chrono-Spire Sanctuary',
    subtitle: 'Helmet Dungeon • 3 Levels',
    slot: 'HELM',
    slotName: 'Helmets',
    element: 'LIGHT',
    bossName: 'Chrono-Seraph',
    bossVariantId: 'var_boss_dungeon_helm',
    bossMechanicTitle: 'Party Attack Bar Drain',
    bossMechanicDescription: 'Bends the flow of time! Drains 35% Attack Bar from your entire squad and boosts its own by +50% to cycle turns effortlessly!',
    colorHex: '#eab308',
    accentHex: '#facc15',
    bgGradient: 'from-yellow-950 via-amber-950 to-slate-950',
    lore: 'A timeless sanctuary suspended above the clouds where ancient chronomancers forged enchanted helms to transcend mortality.',
    stages: DUNGEON_STAGES.filter((s) => s.dungeonType === 'HELM'),
  },
  BOOTS: {
    id: 'BOOTS',
    name: 'Zephyr Tempest Cavern',
    subtitle: 'Boots Dungeon • 3 Levels',
    slot: 'BOOTS',
    slotName: 'Boots',
    element: 'WATER',
    bossName: 'Stormgale Phantom',
    bossVariantId: 'var_boss_dungeon_boots',
    bossMechanicTitle: 'Supersonic Speed & Freeze Stun',
    bossMechanicDescription: 'Inflicts Speed Down, Stuns/Freezes slow targets, and gains rapid consecutive Extra Turns on critical hits!',
    colorHex: '#0284c7',
    accentHex: '#38bdf8',
    bgGradient: 'from-sky-950 via-blue-950 to-slate-950',
    lore: 'Gale-force hurricanes howl through these abyssal caverns. Only creatures with lightning reflexes can withstand the phantom winds.',
    stages: DUNGEON_STAGES.filter((s) => s.dungeonType === 'BOOTS'),
  },
};

export function getStageById(stageId: string): PvEStage | undefined {
  return ALL_STAGES.find((s) => s.stageId === stageId);
}

export function getStagesForContinent(continentId: string): PvEStage[] {
  return ALL_STAGES.filter((s) => s.continentId === continentId);
}

export function getContinentById(continentId: string): Continent | undefined {
  return CONTINENTS.find((c) => c.continentId === continentId);
}

/**
 * Validates whether a stage is unlocked for the player.
 * Rules:
 * 1. Stage 1-1 is always unlocked.
 * 2. Dungeon Level 1 is always unlocked.
 * 3. Dungeon Level 2 requires Dungeon Level 1.
 * 4. Dungeon Level 3 requires Dungeon Level 2.
 * 5. Campaign Stage X-N (N > 1) requires Stage X-(N-1) to be cleared.
 * 6. Campaign Stage X-1 (X > 1) requires Stage (X-1)-10 (previous continent boss) to be cleared.
 */
export function isStageUnlocked(stageId: string, completedStages: string[] = []): boolean {
  if (stageId === 'stage_1_1') return true;

  const safeCompleted = Array.isArray(completedStages) ? completedStages : [];

  // Dungeon stages progression - all equipment dungeon floors (Levels 1, 2, and 3 Boss) are unlocked for farming
  if (stageId.startsWith('dungeon_')) {
    return true;
  }

  const stage = getStageById(stageId);
  if (!stage) return false;

  const { chapter, stageNumber } = stage;

  if (stageNumber > 1) {
    const prevStageId = `stage_${chapter}_${stageNumber - 1}`;
    return safeCompleted.includes(prevStageId);
  }

  // stageNumber === 1, and chapter > 1
  const prevContinentBossId = `stage_${chapter - 1}_10`;
  return safeCompleted.includes(prevContinentBossId);
}

/**
 * Checks if a continent is unlocked.
 * Continent 1 is always unlocked.
 * Continent X (X > 1) is unlocked if Stage (X-1)-10 is completed.
 */
export function isContinentUnlocked(continentId: string, completedStages: string[] = []): boolean {
  const continent = getContinentById(continentId);
  if (!continent) return false;
  if (continent.chapter === 1) return true;

  const safeCompleted = Array.isArray(completedStages) ? completedStages : [];
  const prevBossStageId = `stage_${continent.chapter - 1}_10`;
  return safeCompleted.includes(prevBossStageId);
}

/**
 * Gets the next chronological stage in sequence
 */
export function getNextStage(stageId: string): PvEStage | undefined {
  if (stageId.startsWith('dungeon_')) {
    const idx = DUNGEON_STAGES.findIndex((s) => s.stageId === stageId);
    if (idx === -1 || idx >= DUNGEON_STAGES.length - 1) return undefined;
    return DUNGEON_STAGES[idx + 1];
  }
  const currentIndex = PVE_STAGES.findIndex((s) => s.stageId === stageId);
  if (currentIndex === -1 || currentIndex >= PVE_STAGES.length - 1) return undefined;
  return PVE_STAGES[currentIndex + 1];
}
