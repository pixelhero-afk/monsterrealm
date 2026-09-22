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

export function getStageById(stageId: string): PvEStage | undefined {
  return PVE_STAGES.find((s) => s.stageId === stageId);
}

export function getStagesForContinent(continentId: string): PvEStage[] {
  return PVE_STAGES.filter((s) => s.continentId === continentId);
}

export function getContinentById(continentId: string): Continent | undefined {
  return CONTINENTS.find((c) => c.continentId === continentId);
}

/**
 * Validates whether a stage is unlocked for the player.
 * Rules:
 * 1. Stage 1-1 is always unlocked.
 * 2. Stage X-N (N > 1) requires Stage X-(N-1) to be cleared.
 * 3. Stage X-1 (X > 1) requires Stage (X-1)-10 (previous continent boss) to be cleared.
 */
export function isStageUnlocked(stageId: string, completedStages: string[] = []): boolean {
  if (stageId === 'stage_1_1') return true;

  const stage = getStageById(stageId);
  if (!stage) return false;

  const safeCompleted = Array.isArray(completedStages) ? completedStages : [];
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
  const currentIndex = PVE_STAGES.findIndex((s) => s.stageId === stageId);
  if (currentIndex === -1 || currentIndex >= PVE_STAGES.length - 1) return undefined;
  return PVE_STAGES[currentIndex + 1];
}
