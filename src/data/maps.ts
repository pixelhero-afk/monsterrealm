/**
 * Monster Realms - Data-Driven Battle Map Definitions
 * Defines battlefield environments, elemental themes, visual assets, and ambient atmospheric effects.
 */

import { ElementType } from '../types';

export interface MapDefinition {
  id: string;
  continentId?: string;
  name: string;
  subtitle: string;
  element: ElementType;
  themeKey: 'IGNIS_CALDERA' | 'AZURE_ARCHIPELAGO' | 'FOREST_SHRINE' | 'ASTRAL_CITADEL' | 'ABYSSAL_RIFT';
  backgroundUrl: string;
  ambientEffect: 'FOREST_SPORES' | 'FIRE_EMBERS' | 'WATER_BUBBLES' | 'ANCIENT_GLYPHS' | 'CELESTIAL_STARS' | 'SKY_CLOUDS' | 'CHERRY_PETALS';
  description: string;
  palette: {
    skyTop: string;
    skyBottom: string;
    platformSurface: string;
    platformRim: string;
    conduitPlayer: string;
    conduitEnemy: string;
    dividerColor: string;
    glowHex: string;
  };
}

export const BATTLE_MAPS: Record<string, MapDefinition> = {
  // Chapter 1: Ignis Caldera (FIRE)
  ignis_caldera: {
    id: 'ignis_caldera',
    continentId: 'continent_1',
    name: 'Ignis Caldera',
    subtitle: 'The Smoldering Volcanic Battlefield',
    element: 'FIRE',
    themeKey: 'IGNIS_CALDERA',
    backgroundUrl: '/assets/maps/ignis_caldera.png',
    ambientEffect: 'FIRE_EMBERS',
    description: 'A dramatic anime volcanic arena of smoking obsidian ridges, cascading molten magma waterfalls, and incandescent lava rivers.',
    palette: {
      skyTop: '#2b0707',
      skyBottom: '#4a0e0e',
      platformSurface: '#1f1313',
      platformRim: '#ef4444',
      conduitPlayer: '#06b6d4',
      conduitEnemy: '#ef4444',
      dividerColor: '#f97316',
      glowHex: '#ef4444',
    },
  },

  // Chapter 2: Azure Archipelago (WATER)
  azure_archipelago: {
    id: 'azure_archipelago',
    continentId: 'continent_2',
    name: 'Azure Archipelago',
    subtitle: 'Sunken Coral Spire Sanctum',
    element: 'WATER',
    themeKey: 'AZURE_ARCHIPELAGO',
    backgroundUrl: '/assets/maps/azure_archipelago.png',
    ambientEffect: 'WATER_BUBBLES',
    description: 'A luminous anime oceanic dais submerged in crystal turquoise water with vibrant coral reefs, sea foam, and dancing sunlight caustics.',
    palette: {
      skyTop: '#041f38',
      skyBottom: '#073359',
      platformSurface: '#0d2847',
      platformRim: '#0284c7',
      conduitPlayer: '#38bdf8',
      conduitEnemy: '#f97316',
      dividerColor: '#0ea5e9',
      glowHex: '#0284c7',
    },
  },

  // Chapter 3: Forest Shrine / Sylvan Canopy (GRASS)
  forest_shrine: {
    id: 'forest_shrine',
    continentId: 'continent_3',
    name: 'Forest Shrine',
    subtitle: 'Pretty Sylvan Glade & Sacred Torii',
    element: 'GRASS',
    themeKey: 'FOREST_SHRINE',
    backgroundUrl: '/assets/maps/forest_shrine.png',
    ambientEffect: 'CHERRY_PETALS',
    description: 'A pretty Ghibli-inspired enchanted forest with a majestic sacred Torii shrine gate, drifting pink sakura petals, and mossy stone lanterns.',
    palette: {
      skyTop: '#042318',
      skyBottom: '#0a3828',
      platformSurface: '#0f3322',
      platformRim: '#10b981',
      conduitPlayer: '#10b981',
      conduitEnemy: '#f59e0b',
      dividerColor: '#34d399',
      glowHex: '#10b981',
    },
  },

  // Chapter 4: Astral Citadel (LIGHT)
  astral_citadel: {
    id: 'astral_citadel',
    continentId: 'continent_4',
    name: 'Astral Citadel',
    subtitle: 'High Empyrean Celestial Pavilion',
    element: 'LIGHT',
    themeKey: 'ASTRAL_CITADEL',
    backgroundUrl: '/assets/maps/astral_citadel.png',
    ambientEffect: 'SKY_CLOUDS',
    description: 'A floating celestial palace high above a sea of dawn clouds, with gleaming white marble columns, radiant sun prisms, and floating crystals.',
    palette: {
      skyTop: '#161329',
      skyBottom: '#282347',
      platformSurface: '#24203d',
      platformRim: '#f59e0b',
      conduitPlayer: '#38bdf8',
      conduitEnemy: '#e11d48',
      dividerColor: '#fbbf24',
      glowHex: '#f59e0b',
    },
  },

  // Chapter 5: The Abyssal Rift (DARK)
  abyssal_rift: {
    id: 'abyssal_rift',
    continentId: 'continent_5',
    name: 'The Abyssal Rift',
    subtitle: 'Dimensional Void & Umbral Moon',
    element: 'DARK',
    themeKey: 'ABYSSAL_RIFT',
    backgroundUrl: '/assets/maps/abyssal_rift.png',
    ambientEffect: 'CELESTIAL_STARS',
    description: 'A fractured twilight rift in cosmic space dominated by a giant glowing purple celestial moon, starry nebulas, and floating obsidian ruins.',
    palette: {
      skyTop: '#0d071a',
      skyBottom: '#180e2e',
      platformSurface: '#19112b',
      platformRim: '#9333ea',
      conduitPlayer: '#38bdf8',
      conduitEnemy: '#f43f5e',
      dividerColor: '#a855f7',
      glowHex: '#9333ea',
    },
  },
};

// Aliases for backward compatibility with previous map IDs
BATTLE_MAPS.volcanic_temple = BATTLE_MAPS.ignis_caldera;
BATTLE_MAPS.crystal_cavern = BATTLE_MAPS.azure_archipelago;
BATTLE_MAPS.ancient_ruins = BATTLE_MAPS.astral_citadel;
BATTLE_MAPS.floating_sanctuary = BATTLE_MAPS.astral_citadel;
BATTLE_MAPS.moonlit_castle = BATTLE_MAPS.abyssal_rift;

/**
 * Resolves map definition based on stage continent, stage element, or requested map ID
 */
export function getMapForStage(
  stageElement?: ElementType | string,
  mapId?: string,
  continentId?: string
): MapDefinition {
  if (mapId && BATTLE_MAPS[mapId]) {
    return BATTLE_MAPS[mapId];
  }

  // First priority: Campaign continent match
  if (continentId) {
    if (continentId === 'continent_1') return BATTLE_MAPS.ignis_caldera;
    if (continentId === 'continent_2') return BATTLE_MAPS.azure_archipelago;
    if (continentId === 'continent_3') return BATTLE_MAPS.forest_shrine;
    if (continentId === 'continent_4') return BATTLE_MAPS.astral_citadel;
    if (continentId === 'continent_5') return BATTLE_MAPS.abyssal_rift;
  }

  // Second priority: Element fallback
  switch (stageElement) {
    case 'FIRE':
      return BATTLE_MAPS.ignis_caldera;
    case 'WATER':
      return BATTLE_MAPS.azure_archipelago;
    case 'GRASS':
      return BATTLE_MAPS.forest_shrine;
    case 'LIGHT':
      return BATTLE_MAPS.astral_citadel;
    case 'DARK':
      return BATTLE_MAPS.abyssal_rift;
    default:
      return BATTLE_MAPS.forest_shrine;
  }
}
