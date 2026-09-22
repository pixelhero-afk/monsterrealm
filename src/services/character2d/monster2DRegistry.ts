/**
 * 2D Monster Combat Asset Registry & Preloader
 * Manages dedicated 2D combat artwork states per monster unit/variant (all 5 elemental types)
 * as well as family-level fallbacks.
 * Strictly adheres to non-substitution rules and missing asset reporting.
 */

import { MonsterCombatVisualState, Monster2DConfig, Monster2DVisualStates } from './types';
import { MONSTER_VARIANTS } from '../../data/monsters';
import { ElementType, MonsterVariant } from '../../types';
import { getMonsterDisplayName } from '../../utils/monsterNames';
import {
  normalizeUnitName,
  normalizeElement,
  getElementalStatusPath,
  getElementalCombatStates,
  RECOGNIZED_UNITS,
  RECOGNIZED_ELEMENTS,
} from './elementalAssetHelper';
import { portraitRegistry } from './portraitRegistry';
import { CANONICAL_CHARACTER_ASSETS } from './monsterAssetManifest';

const FAMILY_SCALES: Record<string, number> = {
  fam_nekohime: 1.0,
  fam_shadowstalker: 1.05,
  fam_freedancer: 1.0,
  fam_pyrosaur: 1.1,
  fam_tideguard: 1.15,
  fam_floraweaver: 1.0,
  fam_luminary: 1.05,
  fam_boss: 1.25,
  fam_porky: 0.95,
  fam_fishter: 0.95,
  fam_rockman: 1.0,
  fam_doggo: 1.0,
  fam_birdunno: 1.0,
};

// Base family configurations with available combat artwork
const BASE_FAMILY_REGISTRY: Record<string, Monster2DConfig> = {
  fam_nekohime: {
    familyId: 'fam_nekohime',
    name: 'NekoHime Grass',
    states: {
      idle: '/assets/characters/nekohime/grass/IDLE.png',
      attack: '/assets/characters/nekohime/grass/ATTACK.png',
      hurt: '/assets/characters/nekohime/grass/HURT.png',
      defeated: '/assets/characters/nekohime/grass/DEAD.png',
      dead: '/assets/characters/nekohime/grass/DEAD.png',
      victory: '/assets/characters/nekohime/grass/VICTORY.png',
    },
    scale: 1.0,
  },
  fam_shadowstalker: {
    familyId: 'fam_shadowstalker',
    name: 'Shadowstalker',
    states: {
      idle: null,
      attack: null,
      hurt: null,
      defeated: null,
      dead: null,
      victory: null,
    },
    scale: 1.05,
  },
  fam_freedancer: {
    familyId: 'fam_freedancer',
    name: 'Free Dancer',
    states: {
      idle: null,
      attack: null,
      hurt: null,
      defeated: null,
      dead: null,
      victory: null,
    },
    scale: 1.0,
  },
  fam_pyrosaur: {
    familyId: 'fam_pyrosaur',
    name: 'Pyrosaur Fire',
    states: {
      idle: '/assets/characters/pyrosaur/fire/IDLE.png',
      attack: '/assets/characters/pyrosaur/fire/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/fire/HURT.png',
      defeated: '/assets/characters/pyrosaur/fire/DEAD.png',
      dead: '/assets/characters/pyrosaur/fire/DEAD.png',
      victory: '/assets/characters/pyrosaur/fire/VICTORY.png',
    },
    scale: 1.1,
  },
  var_pyrosaur_water: {
    familyId: 'fam_pyrosaur',
    name: 'Pyrosaur Water',
    element: 'WATER',
    states: {
      idle: '/assets/characters/pyrosaur/water/IDLE.png',
      attack: '/assets/characters/pyrosaur/water/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/water/HURT.png',
      defeated: '/assets/characters/pyrosaur/water/DEAD.png',
      dead: '/assets/characters/pyrosaur/water/DEAD.png',
      victory: '/assets/characters/pyrosaur/water/VICTORY.png',
    },
    scale: 1.1,
  },
  pyrosaur_water: {
    familyId: 'fam_pyrosaur',
    name: 'Pyrosaur Water',
    element: 'WATER',
    states: {
      idle: '/assets/characters/pyrosaur/water/IDLE.png',
      attack: '/assets/characters/pyrosaur/water/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/water/HURT.png',
      defeated: '/assets/characters/pyrosaur/water/DEAD.png',
      dead: '/assets/characters/pyrosaur/water/DEAD.png',
      victory: '/assets/characters/pyrosaur/water/VICTORY.png',
    },
    scale: 1.1,
  },
  var_pyrosaur_grass: {
    familyId: 'fam_pyrosaur',
    name: 'Pyrosaur Grass',
    element: 'GRASS',
    states: {
      idle: '/assets/characters/pyrosaur/grass/IDLE.png',
      attack: '/assets/characters/pyrosaur/grass/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/grass/HURT.png',
      defeated: '/assets/characters/pyrosaur/grass/DEAD.png',
      dead: '/assets/characters/pyrosaur/grass/DEAD.png',
      victory: '/assets/characters/pyrosaur/grass/VICTORY.png',
    },
    scale: 1.1,
  },
  pyrosaur_grass: {
    familyId: 'fam_pyrosaur',
    name: 'Pyrosaur Grass',
    element: 'GRASS',
    states: {
      idle: '/assets/characters/pyrosaur/grass/IDLE.png',
      attack: '/assets/characters/pyrosaur/grass/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/grass/HURT.png',
      defeated: '/assets/characters/pyrosaur/grass/DEAD.png',
      dead: '/assets/characters/pyrosaur/grass/DEAD.png',
      victory: '/assets/characters/pyrosaur/grass/VICTORY.png',
    },
    scale: 1.1,
  },
  var_pyrosaur_light: {
    familyId: 'fam_pyrosaur',
    name: 'Pyrosaur Light',
    element: 'LIGHT',
    states: {
      idle: '/assets/characters/pyrosaur/light/IDLE.png',
      attack: '/assets/characters/pyrosaur/light/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/light/HURT.png',
      defeated: '/assets/characters/pyrosaur/light/DEAD.png',
      dead: '/assets/characters/pyrosaur/light/DEAD.png',
      victory: '/assets/characters/pyrosaur/light/VICTORY.png',
    },
    scale: 1.1,
  },
  pyrosaur_light: {
    familyId: 'fam_pyrosaur',
    name: 'Pyrosaur Light',
    element: 'LIGHT',
    states: {
      idle: '/assets/characters/pyrosaur/light/IDLE.png',
      attack: '/assets/characters/pyrosaur/light/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/light/HURT.png',
      defeated: '/assets/characters/pyrosaur/light/DEAD.png',
      dead: '/assets/characters/pyrosaur/light/DEAD.png',
      victory: '/assets/characters/pyrosaur/light/VICTORY.png',
    },
    scale: 1.1,
  },
  var_pyrosaur_dark: {
    familyId: 'fam_pyrosaur',
    name: 'Pyrosaur Dark',
    element: 'DARK',
    states: {
      idle: '/assets/characters/pyrosaur/dark/IDLE.png',
      attack: '/assets/characters/pyrosaur/dark/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/dark/HURT.png',
      defeated: '/assets/characters/pyrosaur/dark/DEAD.png',
      dead: '/assets/characters/pyrosaur/dark/DEAD.png',
      victory: '/assets/characters/pyrosaur/dark/VICTORY.png',
    },
    scale: 1.1,
  },
  pyrosaur_dark: {
    familyId: 'fam_pyrosaur',
    name: 'Pyrosaur Dark',
    element: 'DARK',
    states: {
      idle: '/assets/characters/pyrosaur/dark/IDLE.png',
      attack: '/assets/characters/pyrosaur/dark/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/dark/HURT.png',
      defeated: '/assets/characters/pyrosaur/dark/DEAD.png',
      dead: '/assets/characters/pyrosaur/dark/DEAD.png',
      victory: '/assets/characters/pyrosaur/dark/VICTORY.png',
    },
    scale: 1.1,
  },
  var_nekohime_grass: {
    familyId: 'fam_nekohime',
    name: 'NekoHime Grass',
    element: 'GRASS',
    states: {
      idle: '/assets/characters/nekohime/grass/IDLE.png',
      attack: '/assets/characters/nekohime/grass/ATTACK.png',
      hurt: '/assets/characters/nekohime/grass/HURT.png',
      defeated: '/assets/characters/nekohime/grass/DEAD.png',
      dead: '/assets/characters/nekohime/grass/DEAD.png',
      victory: '/assets/characters/nekohime/grass/VICTORY.png',
    },
    scale: 1.0,
  },
  nekohime_grass: {
    familyId: 'fam_nekohime',
    name: 'NekoHime Grass',
    element: 'GRASS',
    states: {
      idle: '/assets/characters/nekohime/grass/IDLE.png',
      attack: '/assets/characters/nekohime/grass/ATTACK.png',
      hurt: '/assets/characters/nekohime/grass/HURT.png',
      defeated: '/assets/characters/nekohime/grass/DEAD.png',
      dead: '/assets/characters/nekohime/grass/DEAD.png',
      victory: '/assets/characters/nekohime/grass/VICTORY.png',
    },
    scale: 1.0,
  },
  var_nekohime_fire: {
    familyId: 'fam_nekohime',
    name: 'NekoHime Fire',
    element: 'FIRE',
    states: {
      idle: '/assets/characters/nekohime/fire/IDLE.png',
      attack: '/assets/characters/nekohime/fire/ATTACK.png',
      hurt: '/assets/characters/nekohime/fire/HURT.png',
      defeated: '/assets/characters/nekohime/fire/DEAD.png',
      dead: '/assets/characters/nekohime/fire/DEAD.png',
      victory: '/assets/characters/nekohime/fire/VICTORY.png',
    },
    scale: 1.0,
  },
  nekohime_fire: {
    familyId: 'fam_nekohime',
    name: 'NekoHime Fire',
    element: 'FIRE',
    states: {
      idle: '/assets/characters/nekohime/fire/IDLE.png',
      attack: '/assets/characters/nekohime/fire/ATTACK.png',
      hurt: '/assets/characters/nekohime/fire/HURT.png',
      defeated: '/assets/characters/nekohime/fire/DEAD.png',
      dead: '/assets/characters/nekohime/fire/DEAD.png',
      victory: '/assets/characters/nekohime/fire/VICTORY.png',
    },
    scale: 1.0,
  },
  var_nekohime_water: {
    familyId: 'fam_nekohime',
    name: 'NekoHime Water',
    element: 'WATER',
    states: {
      idle: '/assets/characters/nekohime/water/IDLE.png',
      attack: '/assets/characters/nekohime/water/ATTACK.png',
      hurt: '/assets/characters/nekohime/water/HURT.png',
      defeated: '/assets/characters/nekohime/water/DEAD.png',
      dead: '/assets/characters/nekohime/water/DEAD.png',
      victory: '/assets/characters/nekohime/water/VICTORY.png',
    },
    scale: 1.0,
  },
  nekohime_water: {
    familyId: 'fam_nekohime',
    name: 'NekoHime Water',
    element: 'WATER',
    states: {
      idle: '/assets/characters/nekohime/water/IDLE.png',
      attack: '/assets/characters/nekohime/water/ATTACK.png',
      hurt: '/assets/characters/nekohime/water/HURT.png',
      defeated: '/assets/characters/nekohime/water/DEAD.png',
      dead: '/assets/characters/nekohime/water/DEAD.png',
      victory: '/assets/characters/nekohime/water/VICTORY.png',
    },
    scale: 1.0,
  },
  var_nekohime_light: {
    familyId: 'fam_nekohime',
    name: 'NekoHime Light',
    element: 'LIGHT',
    states: {
      idle: '/assets/characters/nekohime/light/IDLE.png',
      attack: '/assets/characters/nekohime/light/ATTACK.png',
      hurt: '/assets/characters/nekohime/light/HURT.png',
      defeated: '/assets/characters/nekohime/light/DEAD.png',
      dead: '/assets/characters/nekohime/light/DEAD.png',
      victory: '/assets/characters/nekohime/light/VICTORY.png',
    },
    scale: 1.0,
  },
  nekohime_light: {
    familyId: 'fam_nekohime',
    name: 'NekoHime Light',
    element: 'LIGHT',
    states: {
      idle: '/assets/characters/nekohime/light/IDLE.png',
      attack: '/assets/characters/nekohime/light/ATTACK.png',
      hurt: '/assets/characters/nekohime/light/HURT.png',
      defeated: '/assets/characters/nekohime/light/DEAD.png',
      dead: '/assets/characters/nekohime/light/DEAD.png',
      victory: '/assets/characters/nekohime/light/VICTORY.png',
    },
    scale: 1.0,
  },
  var_nekohime_dark: {
    familyId: 'fam_nekohime',
    name: 'NekoHime Dark',
    element: 'DARK',
    states: {
      idle: '/assets/characters/nekohime/dark/IDLE.png',
      attack: '/assets/characters/nekohime/dark/ATTACK.png',
      hurt: '/assets/characters/nekohime/dark/HURT.png',
      defeated: '/assets/characters/nekohime/dark/DEAD.png',
      dead: '/assets/characters/nekohime/dark/DEAD.png',
      victory: '/assets/characters/nekohime/dark/VICTORY.png',
    },
    scale: 1.0,
  },
  nekohime_dark: {
    familyId: 'fam_nekohime',
    name: 'NekoHime Dark',
    element: 'DARK',
    states: {
      idle: '/assets/characters/nekohime/dark/IDLE.png',
      attack: '/assets/characters/nekohime/dark/ATTACK.png',
      hurt: '/assets/characters/nekohime/dark/HURT.png',
      defeated: '/assets/characters/nekohime/dark/DEAD.png',
      dead: '/assets/characters/nekohime/dark/DEAD.png',
      victory: '/assets/characters/nekohime/dark/VICTORY.png',
    },
    scale: 1.0,
  },
  fam_tideguard: {
    familyId: 'fam_tideguard',
    name: 'Tideguard',
    element: 'WATER',
    states: {
      idle: '/assets/characters/tideguard/water/IDLE.png',
      attack: '/assets/characters/tideguard/water/ATTACK.png',
      hurt: '/assets/characters/tideguard/water/HURT.png',
      defeated: '/assets/characters/tideguard/water/DEAD.png',
      dead: '/assets/characters/tideguard/water/DEAD.png',
      victory: '/assets/characters/tideguard/water/VICTORY.png',
    },
    scale: 1.15,
  },
  var_tideguard_water: {
    familyId: 'fam_tideguard',
    name: 'Tideguard Water',
    element: 'WATER',
    states: {
      idle: '/assets/characters/tideguard/water/IDLE.png',
      attack: '/assets/characters/tideguard/water/ATTACK.png',
      hurt: '/assets/characters/tideguard/water/HURT.png',
      defeated: '/assets/characters/tideguard/water/DEAD.png',
      dead: '/assets/characters/tideguard/water/DEAD.png',
      victory: '/assets/characters/tideguard/water/VICTORY.png',
    },
    scale: 1.15,
  },
  tideguard_water: {
    familyId: 'fam_tideguard',
    name: 'Tideguard Water',
    element: 'WATER',
    states: {
      idle: '/assets/characters/tideguard/water/IDLE.png',
      attack: '/assets/characters/tideguard/water/ATTACK.png',
      hurt: '/assets/characters/tideguard/water/HURT.png',
      defeated: '/assets/characters/tideguard/water/DEAD.png',
      dead: '/assets/characters/tideguard/water/DEAD.png',
      victory: '/assets/characters/tideguard/water/VICTORY.png',
    },
    scale: 1.15,
  },
  fam_floraweaver: {
    familyId: 'fam_floraweaver',
    name: 'Floraweaver',
    element: 'GRASS',
    states: {
      idle: '/assets/characters/floraweaver/grass/IDLE.png',
      attack: '/assets/characters/floraweaver/grass/ATTACK.png',
      hurt: '/assets/characters/floraweaver/grass/HURT.png',
      defeated: '/assets/characters/floraweaver/grass/DEAD.png',
      dead: '/assets/characters/floraweaver/grass/DEAD.png',
      victory: '/assets/characters/floraweaver/grass/VICTORY.png',
    },
    scale: 1.0,
  },
  var_floraweaver_grass: {
    familyId: 'fam_floraweaver',
    name: 'Floraweaver Grass',
    element: 'GRASS',
    states: {
      idle: '/assets/characters/floraweaver/grass/IDLE.png',
      attack: '/assets/characters/floraweaver/grass/ATTACK.png',
      hurt: '/assets/characters/floraweaver/grass/HURT.png',
      defeated: '/assets/characters/floraweaver/grass/DEAD.png',
      dead: '/assets/characters/floraweaver/grass/DEAD.png',
      victory: '/assets/characters/floraweaver/grass/VICTORY.png',
    },
    scale: 1.0,
  },
  floraweaver_grass: {
    familyId: 'fam_floraweaver',
    name: 'Floraweaver Grass',
    element: 'GRASS',
    states: {
      idle: '/assets/characters/floraweaver/grass/IDLE.png',
      attack: '/assets/characters/floraweaver/grass/ATTACK.png',
      hurt: '/assets/characters/floraweaver/grass/HURT.png',
      defeated: '/assets/characters/floraweaver/grass/DEAD.png',
      dead: '/assets/characters/floraweaver/grass/DEAD.png',
      victory: '/assets/characters/floraweaver/grass/VICTORY.png',
    },
    scale: 1.0,
  },
  var_floraweaver_fire: {
    familyId: 'fam_floraweaver',
    name: 'Floraweaver Fire',
    element: 'FIRE',
    states: {
      idle: '/assets/characters/floraweaver/fire/IDLE.png',
      attack: '/assets/characters/floraweaver/fire/ATTACK.png',
      hurt: '/assets/characters/floraweaver/fire/HURT.png',
      defeated: '/assets/characters/floraweaver/fire/DEAD.png',
      dead: '/assets/characters/floraweaver/fire/DEAD.png',
      victory: '/assets/characters/floraweaver/fire/VICTORY.png',
    },
    scale: 1.0,
  },
  floraweaver_fire: {
    familyId: 'fam_floraweaver',
    name: 'Floraweaver Fire',
    element: 'FIRE',
    states: {
      idle: '/assets/characters/floraweaver/fire/IDLE.png',
      attack: '/assets/characters/floraweaver/fire/ATTACK.png',
      hurt: '/assets/characters/floraweaver/fire/HURT.png',
      defeated: '/assets/characters/floraweaver/fire/DEAD.png',
      dead: '/assets/characters/floraweaver/fire/DEAD.png',
      victory: '/assets/characters/floraweaver/fire/VICTORY.png',
    },
    scale: 1.0,
  },
  var_floraweaver_water: {
    familyId: 'fam_floraweaver',
    name: 'Floraweaver Water',
    element: 'WATER',
    states: {
      idle: '/assets/characters/floraweaver/water/IDLE.png',
      attack: '/assets/characters/floraweaver/water/ATTACK.png',
      hurt: '/assets/characters/floraweaver/water/HURT.png',
      defeated: '/assets/characters/floraweaver/water/DEAD.png',
      dead: '/assets/characters/floraweaver/water/DEAD.png',
      victory: '/assets/characters/floraweaver/water/VICTORY.png',
    },
    scale: 1.0,
  },
  floraweaver_water: {
    familyId: 'fam_floraweaver',
    name: 'Floraweaver Water',
    element: 'WATER',
    states: {
      idle: '/assets/characters/floraweaver/water/IDLE.png',
      attack: '/assets/characters/floraweaver/water/ATTACK.png',
      hurt: '/assets/characters/floraweaver/water/HURT.png',
      defeated: '/assets/characters/floraweaver/water/DEAD.png',
      dead: '/assets/characters/floraweaver/water/DEAD.png',
      victory: '/assets/characters/floraweaver/water/VICTORY.png',
    },
    scale: 1.0,
  },
  var_floraweaver_dark: {
    familyId: 'fam_floraweaver',
    name: 'Floraweaver Dark',
    element: 'DARK',
    states: {
      idle: '/assets/characters/floraweaver/dark/IDLE.png',
      attack: '/assets/characters/floraweaver/dark/ATTACK.png',
      hurt: '/assets/characters/floraweaver/dark/HURT.png',
      defeated: '/assets/characters/floraweaver/dark/DEAD.png',
      dead: '/assets/characters/floraweaver/dark/DEAD.png',
      victory: '/assets/characters/floraweaver/dark/VICTORY.png',
    },
    scale: 1.0,
  },
  floraweaver_dark: {
    familyId: 'fam_floraweaver',
    name: 'Floraweaver Dark',
    element: 'DARK',
    states: {
      idle: '/assets/characters/floraweaver/dark/IDLE.png',
      attack: '/assets/characters/floraweaver/dark/ATTACK.png',
      hurt: '/assets/characters/floraweaver/dark/HURT.png',
      defeated: '/assets/characters/floraweaver/dark/DEAD.png',
      dead: '/assets/characters/floraweaver/dark/DEAD.png',
      victory: '/assets/characters/floraweaver/dark/VICTORY.png',
    },
    scale: 1.0,
  },
  var_floraweaver_light: {
    familyId: 'fam_floraweaver',
    name: 'Floraweaver Light',
    element: 'LIGHT',
    states: {
      idle: '/assets/characters/floraweaver/light/IDLE.png',
      attack: '/assets/characters/floraweaver/light/ATTACK.png',
      hurt: '/assets/characters/floraweaver/light/HURT.png',
      defeated: '/assets/characters/floraweaver/light/DEAD.png',
      dead: '/assets/characters/floraweaver/light/DEAD.png',
      victory: '/assets/characters/floraweaver/light/VICTORY.png',
    },
    scale: 1.0,
  },
  floraweaver_light: {
    familyId: 'fam_floraweaver',
    name: 'Floraweaver Light',
    element: 'LIGHT',
    states: {
      idle: '/assets/characters/floraweaver/light/IDLE.png',
      attack: '/assets/characters/floraweaver/light/ATTACK.png',
      hurt: '/assets/characters/floraweaver/light/HURT.png',
      defeated: '/assets/characters/floraweaver/light/DEAD.png',
      dead: '/assets/characters/floraweaver/light/DEAD.png',
      victory: '/assets/characters/floraweaver/light/VICTORY.png',
    },
    scale: 1.0,
  },
  fam_luminary: {
    familyId: 'fam_luminary',
    name: 'Luminary',
    states: {
      idle: null,
      attack: null,
      hurt: null,
      defeated: null,
      dead: null,
      victory: null,
    },
    scale: 1.05,
  },
  fam_boss: {
    familyId: 'fam_boss',
    name: 'Continent Boss',
    states: {
      idle: null,
      attack: null,
      hurt: null,
      defeated: null,
      dead: null,
      victory: null,
    },
    scale: 1.25,
  },
};

// Build dedicated 2D config registry for every individual monster variant across all 5 elements
// Each variant starts with clean, null visual slots (IDLE, ATTACK, HURT, DEAD, VICTORY)
function buildRegistry(): Record<string, Monster2DConfig> {
  const registry: Record<string, Monster2DConfig> = { ...BASE_FAMILY_REGISTRY };

  // Register each of the monster units with clean, independent visual slots
  Object.values(MONSTER_VARIANTS).forEach((v) => {
    const key = v.variantId.toLowerCase();
    const initialStates: Monster2DConfig['states'] = {
      idle: null,
      attack: null,
      hurt: null,
      defeated: null,
      dead: null,
      victory: null,
    };

    const pyrosaurElems = ['fire', 'water', 'grass', 'light', 'dark'];
    const nekohimeElems = ['grass', 'fire', 'water', 'light', 'dark'];
    const floraweaverElems = ['grass', 'fire', 'water', 'dark', 'light'];

    if (v.variantId.startsWith('var_nekohime_')) {
      const e = v.variantId.replace('var_nekohime_', '');
      if (nekohimeElems.includes(e)) {
        initialStates.idle = `/assets/characters/nekohime/${e}/IDLE.png`;
        initialStates.attack = `/assets/characters/nekohime/${e}/ATTACK.png`;
        initialStates.hurt = `/assets/characters/nekohime/${e}/HURT.png`;
        initialStates.defeated = `/assets/characters/nekohime/${e}/DEAD.png`;
        initialStates.dead = `/assets/characters/nekohime/${e}/DEAD.png`;
        initialStates.victory = `/assets/characters/nekohime/${e}/VICTORY.png`;
      }
    } else if (v.variantId.startsWith('var_pyrosaur_')) {
      const e = v.variantId.replace('var_pyrosaur_', '');
      if (pyrosaurElems.includes(e)) {
        initialStates.idle = `/assets/characters/pyrosaur/${e}/IDLE.png`;
        initialStates.attack = `/assets/characters/pyrosaur/${e}/ATTACK.png`;
        initialStates.hurt = `/assets/characters/pyrosaur/${e}/HURT.png`;
        initialStates.defeated = `/assets/characters/pyrosaur/${e}/DEAD.png`;
        initialStates.dead = `/assets/characters/pyrosaur/${e}/DEAD.png`;
        initialStates.victory = `/assets/characters/pyrosaur/${e}/VICTORY.png`;
      }
    } else if (v.variantId.startsWith('var_floraweaver_')) {
      const e = v.variantId.replace('var_floraweaver_', '');
      if (floraweaverElems.includes(e)) {
        initialStates.idle = `/assets/characters/floraweaver/${e}/IDLE.png`;
        initialStates.attack = `/assets/characters/floraweaver/${e}/ATTACK.png`;
        initialStates.hurt = `/assets/characters/floraweaver/${e}/HURT.png`;
        initialStates.defeated = `/assets/characters/floraweaver/${e}/DEAD.png`;
        initialStates.dead = `/assets/characters/floraweaver/${e}/DEAD.png`;
        initialStates.victory = `/assets/characters/floraweaver/${e}/VICTORY.png`;
      }
    } else if (v.variantId === 'var_tideguard_water') {
      initialStates.idle = '/assets/characters/tideguard/water/IDLE.png';
      initialStates.attack = '/assets/characters/tideguard/water/ATTACK.png';
      initialStates.hurt = '/assets/characters/tideguard/water/HURT.png';
      initialStates.defeated = '/assets/characters/tideguard/water/DEAD.png';
      initialStates.dead = '/assets/characters/tideguard/water/DEAD.png';
      initialStates.victory = '/assets/characters/tideguard/water/VICTORY.png';
    }

    registry[key] = {
      familyId: v.familyId,
      variantId: v.variantId,
      element: v.element,
      name: v.name,
      states: initialStates,
      scale: FAMILY_SCALES[v.familyId] || 1.0,
    };
  });

  return registry;
}

export const MONSTER_2D_REGISTRY: Record<string, Monster2DConfig> = buildRegistry();

/**
 * Resolve family ID from variantId or familyId
 */
export function resolveFamilyKey(id: string): string {
  const clean = (id || '').toLowerCase();
  if (clean.includes('nekohime')) return 'fam_nekohime';
  if (clean.includes('shadowstalker')) return 'fam_shadowstalker';
  if (clean.includes('freedancer')) return 'fam_freedancer';
  if (clean.includes('pyrosaur')) return 'fam_pyrosaur';
  if (clean.includes('tideguard')) return 'fam_tideguard';
  if (clean.includes('floraweaver')) return 'fam_floraweaver';
  if (clean.includes('luminary')) return 'fam_luminary';
  if (clean.includes('boss')) return 'fam_boss';
  return clean.startsWith('fam_') ? clean : `fam_${clean}`;
}

/**
 * 2D Monster Sprite Asset Service
 */
class Monster2DAssetService {
  private customOverrides: Record<string, Partial<Monster2DVisualStates>> = {};
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private availabilityCache: Map<string, boolean> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.seedCanonicalAssets();
    this.loadOverridesFromStorage();
    this.refreshServerStatus();
  }

  private seedCanonicalAssets(): void {
    // Only mark confirmed permanent canonical assets on disk as available
    const pyrosaurElems = ['fire', 'water', 'grass', 'light', 'dark'];
    pyrosaurElems.forEach(elem => {
      const base = `/assets/characters/pyrosaur/${elem}`;
      ['IDLE', 'ATTACK', 'HURT', 'DEAD', 'VICTORY', 'PORTRAIT'].forEach((st) => {
        this.availabilityCache.set(`${base}/${st}.png`, true);
        this.availabilityCache.set(`${base}/${st.toLowerCase()}.png`, true);
      });
    });

    const nekohimeElems = ['grass', 'fire', 'water', 'light', 'dark'];
    nekohimeElems.forEach(elem => {
      const base = `/assets/characters/nekohime/${elem}`;
      ['IDLE', 'ATTACK', 'HURT', 'DEAD', 'VICTORY', 'PORTRAIT'].forEach((st) => {
        this.availabilityCache.set(`${base}/${st}.png`, true);
        this.availabilityCache.set(`${base}/${st.toLowerCase()}.png`, true);
      });
    });

    const floraweaverElems = ['grass', 'fire', 'water', 'dark', 'light'];
    floraweaverElems.forEach(elem => {
      const base = `/assets/characters/floraweaver/${elem}`;
      ['IDLE', 'ATTACK', 'HURT', 'DEAD', 'VICTORY', 'PORTRAIT'].forEach((st) => {
        this.availabilityCache.set(`${base}/${st}.png`, true);
        this.availabilityCache.set(`${base}/${st.toLowerCase()}.png`, true);
      });
    });

    // Explicitly guarantee Tideguard Water permanent canonical assets
    const tideguardWaterBase = '/assets/characters/tideguard/water';
    ['IDLE', 'ATTACK', 'HURT', 'DEAD', 'VICTORY', 'PORTRAIT'].forEach((st) => {
      this.availabilityCache.set(`${tideguardWaterBase}/${st}.png`, true);
      this.availabilityCache.set(`${tideguardWaterBase}/${st.toLowerCase()}.png`, true);
    });
  }

  public async refreshServerStatus(): Promise<void> {
    try {
      const res = await fetch('/api/characters/elemental-status');
      if (res.ok) {
        const data = await res.json();
        if (data.units && typeof data.units === 'object') {
          for (const [unit, elements] of Object.entries(data.units)) {
            if (typeof elements === 'object' && elements !== null) {
              for (const [elem, info] of Object.entries(
                elements as Record<string, { portrait: boolean; status: boolean; states: Record<string, boolean> }>
              )) {
                const base = `/assets/characters/${unit}/${elem}`;
                if (info && typeof info === 'object') {
                  this.availabilityCache.set(`${base}/status.png`, Boolean(info.status));
                  this.availabilityCache.set(`${base}/PORTRAIT.png`, Boolean(info.portrait));
                  this.availabilityCache.set(`${base}/portrait.png`, Boolean(info.portrait));
                  if (info.states && typeof info.states === 'object') {
                    Object.entries(info.states).forEach(([st, present]) => {
                      this.availabilityCache.set(`${base}/${st.toUpperCase()}.png`, Boolean(present));
                      this.availabilityCache.set(`${base}/${st.toLowerCase()}.png`, Boolean(present));
                    });
                  }
                }
              }
            }
          }
          this.notify();
        }
      }
    } catch {
      // Offline / client fallback
    }
  }

  private loadOverridesFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('monster_realms_2d_sprites');
        if (raw) {
          this.customOverrides = JSON.parse(raw);
          // Purge any stale localStorage overrides for canonical units so canonical assets always render
          const canonicalKeys = [
            'fam_pyrosaur', 'pyrosaur',
            'var_pyrosaur_fire', 'pyrosaur_fire',
            'var_pyrosaur_water', 'pyrosaur_water',
            'var_pyrosaur_grass', 'pyrosaur_grass',
            'var_pyrosaur_light', 'pyrosaur_light',
            'var_pyrosaur_dark', 'pyrosaur_dark',
            'fam_nekohime', 'nekohime',
            'var_nekohime_grass', 'nekohime_grass',
            'var_nekohime_fire', 'nekohime_fire',
            'var_nekohime_water', 'nekohime_water',
            'var_nekohime_light', 'nekohime_light',
            'var_nekohime_dark', 'nekohime_dark',
            'fam_floraweaver', 'floraweaver',
            'var_floraweaver_grass', 'floraweaver_grass',
            'var_floraweaver_fire', 'floraweaver_fire',
            'var_floraweaver_water', 'floraweaver_water',
            'var_floraweaver_dark', 'floraweaver_dark',
            'var_floraweaver_light', 'floraweaver_light',
            'fam_tideguard', 'tideguard',
            'var_tideguard_water', 'tideguard_water'
          ];
          canonicalKeys.forEach(k => delete this.customOverrides[k]);
        }
      }
    } catch (err) {
      console.warn('Could not read custom 2D sprites from localStorage', err);
    }
  }

  private saveOverridesToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('monster_realms_2d_sprites', JSON.stringify(this.customOverrides));
      }
    } catch (err) {
      console.warn('Could not save custom 2D sprites to localStorage', err);
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public registerVariantConfig(v: MonsterVariant): void {
    const key = (v.variantId || '').toLowerCase().trim();
    if (!MONSTER_2D_REGISTRY[key]) {
      MONSTER_2D_REGISTRY[key] = {
        familyId: v.familyId,
        variantId: v.variantId,
        element: v.element,
        name: v.name,
        states: {
          idle: null,
          attack: null,
          hurt: null,
          defeated: null,
          dead: null,
          victory: null,
        },
        scale: FAMILY_SCALES[v.familyId] || 1.0,
      };
    }
    this.refreshServerStatus();
    this.notify();
  }

  public getConfig(variantOrFamilyId: string): Monster2DConfig | null {
    const key = (variantOrFamilyId || '').toLowerCase().trim();
    if (MONSTER_2D_REGISTRY[key]) {
      return MONSTER_2D_REGISTRY[key];
    }
    const famKey = resolveFamilyKey(variantOrFamilyId);
    return MONSTER_2D_REGISTRY[famKey] || null;
  }

  public getMonsterName(variantOrFamilyId: string, fallbackName?: string): string {
    const config = this.getConfig(variantOrFamilyId);
    if (config?.name) return config.name;
    const resolved = getMonsterDisplayName(variantOrFamilyId);
    if (resolved && resolved !== 'Unknown Monster') return resolved;
    return fallbackName || 'Unknown Monster';
  }

  public getStateUrl(
    variantOrFamilyId: string,
    state: MonsterCombatVisualState,
    element?: ElementType | string
  ): string | null {
    const key = (variantOrFamilyId || '').toLowerCase().trim();
    const isDefeatedState = state === 'DEFEATED' || state === 'DEAD';
    const stateKey = (isDefeatedState ? 'defeated' : state.toLowerCase()) as keyof Monster2DVisualStates;

    const unit = normalizeUnitName(variantOrFamilyId);
    const elem = normalizeElement(element, variantOrFamilyId);
    const stateUpper = isDefeatedState ? 'DEAD' : state.toUpperCase();
    const stateLower = isDefeatedState ? 'dead' : state.toLowerCase();

    // 0. CANONICAL ASSET MANDATE: Nekohime elements ALWAYS load from public/assets/characters/nekohime/[element]/
    const nekohimeElems = ['grass', 'fire', 'water', 'light', 'dark'];
    if (unit === 'nekohime' && nekohimeElems.includes(elem)) {
      if (stateUpper === 'ATTACK') return `/assets/characters/nekohime/${elem}/ATTACK.png`;
      if (stateUpper === 'HURT') return `/assets/characters/nekohime/${elem}/HURT.png`;
      if (stateUpper === 'DEAD' || stateUpper === 'DEFEATED') return `/assets/characters/nekohime/${elem}/DEAD.png`;
      if (stateUpper === 'VICTORY') return `/assets/characters/nekohime/${elem}/VICTORY.png`;
      if (stateUpper === 'PORTRAIT') return `/assets/characters/nekohime/${elem}/PORTRAIT.png`;
      return `/assets/characters/nekohime/${elem}/IDLE.png`;
    }

    // CANONICAL ASSET MANDATE: Pyrosaur elements ALWAYS load from public/assets/characters/pyrosaur/[element]/
    const pyrosaurElems = ['fire', 'water', 'grass', 'light', 'dark'];
    if (unit === 'pyrosaur' && pyrosaurElems.includes(elem)) {
      if (stateUpper === 'ATTACK') return `/assets/characters/pyrosaur/${elem}/ATTACK.png`;
      if (stateUpper === 'HURT') return `/assets/characters/pyrosaur/${elem}/HURT.png`;
      if (stateUpper === 'DEAD' || stateUpper === 'DEFEATED') return `/assets/characters/pyrosaur/${elem}/DEAD.png`;
      if (stateUpper === 'VICTORY') return `/assets/characters/pyrosaur/${elem}/VICTORY.png`;
      if (stateUpper === 'PORTRAIT') return `/assets/characters/pyrosaur/${elem}/PORTRAIT.png`;
      return `/assets/characters/pyrosaur/${elem}/IDLE.png`;
    }

    // CANONICAL ASSET MANDATE: Floraweaver elements ALWAYS load from public/assets/characters/floraweaver/[element]/
    const floraweaverElems = ['grass', 'fire', 'water', 'dark', 'light'];
    if (unit === 'floraweaver' && floraweaverElems.includes(elem)) {
      if (stateUpper === 'ATTACK') return `/assets/characters/floraweaver/${elem}/ATTACK.png`;
      if (stateUpper === 'HURT') return `/assets/characters/floraweaver/${elem}/HURT.png`;
      if (stateUpper === 'DEAD' || stateUpper === 'DEFEATED') return `/assets/characters/floraweaver/${elem}/DEAD.png`;
      if (stateUpper === 'VICTORY') return `/assets/characters/floraweaver/${elem}/VICTORY.png`;
      if (stateUpper === 'PORTRAIT') return `/assets/characters/floraweaver/${elem}/PORTRAIT.png`;
      return `/assets/characters/floraweaver/${elem}/IDLE.png`;
    }

    // CANONICAL ASSET MANDATE: Tideguard Water ALWAYS loads from public/assets/characters/tideguard/water/
    if (unit === 'tideguard' && elem === 'water') {
      if (stateUpper === 'ATTACK') return '/assets/characters/tideguard/water/ATTACK.png';
      if (stateUpper === 'HURT') return '/assets/characters/tideguard/water/HURT.png';
      if (stateUpper === 'DEAD' || stateUpper === 'DEFEATED') return '/assets/characters/tideguard/water/DEAD.png';
      if (stateUpper === 'VICTORY') return '/assets/characters/tideguard/water/VICTORY.png';
      if (stateUpper === 'PORTRAIT') return '/assets/characters/tideguard/water/PORTRAIT.png';
      return '/assets/characters/tideguard/water/IDLE.png';
    }

    // 1. Canonical Elemental Folder Structure: /assets/characters/[unitName]/[element]/
    // Check specific state file or standard IDLE.png or PORTRAIT.png
    const candidatePaths = [
      `/assets/characters/${unit}/${elem}/${stateUpper}.png`,
      `/assets/characters/${unit}/${elem}/${stateLower}.png`,
      ...(isDefeatedState ? [
        `/assets/characters/${unit}/${elem}/DEAD.png`,
        `/assets/characters/${unit}/${elem}/dead.png`,
        `/assets/characters/${unit}/${elem}/DEFEATED.png`,
        `/assets/characters/${unit}/${elem}/defeated.png`
      ] : []),
      `/assets/characters/${unit}/${elem}/IDLE.png`,
      `/assets/characters/${unit}/${elem}/idle.png`,
      `/assets/characters/${unit}/${elem}/PORTRAIT.png`,
      `/assets/characters/${unit}/${elem}/portrait.png`,
      `/assets/characters/${unit}/${elem}/status.png`,
    ];

    for (const p of candidatePaths) {
      if (this.availabilityCache.get(p) === true) {
        return p;
      }
    }

    const resolveUrlFromStates = (states?: Partial<Monster2DVisualStates>): string | null => {
      if (!states) return null;
      if (isDefeatedState) {
        return states.defeated || states.dead || states.hurt || states.idle || null;
      }
      return states[stateKey] || states.idle || null;
    };

    // 2. Check direct variant custom override (user-uploaded artwork for this variant)
    const directCustom = resolveUrlFromStates(this.customOverrides[key]);
    if (directCustom) return directCustom;

    // 3. Check direct variant in registry (dedicated elemental artwork slot)
    const config = MONSTER_2D_REGISTRY[key];
    if (config && config.element && normalizeElement(config.element, key) === elem) {
      const directRegistry = resolveUrlFromStates(config.states);
      if (directRegistry && this.availabilityCache.get(directRegistry) === true) {
        return directRegistry;
      }
    }

    // 4. Fallback to family registry ONLY if family native element matches requested element!
    // Strictly adhere to non-substitution rules (Rule 10: Never let one variant overwrite another)
    const famKey = resolveFamilyKey(variantOrFamilyId);
    const famConfig = MONSTER_2D_REGISTRY[famKey];
    if (famConfig) {
      const famElem = normalizeElement(famConfig.element, famKey);
      if (famElem === elem) {
        const famRegistry = resolveUrlFromStates(famConfig.states);
        if (famRegistry && this.availabilityCache.get(famRegistry) === true) {
          return famRegistry;
        }
      }
    }

    // 5. Fallback to portrait registry ONLY if portrait matches and is verified available
    const portrait = portraitRegistry.getPortraitUrl(variantOrFamilyId, elem);
    if (portrait && this.availabilityCache.get(portrait) === true) {
      return portrait;
    }

    return null;
  }

  public setCustomStateUrl(
    unitOrFamilyId: string,
    state: MonsterCombatVisualState,
    dataUrl: string
  ) {
    const key = (unitOrFamilyId || '').toLowerCase().trim();
    const stateKey = state.toLowerCase() as keyof Monster2DVisualStates;
    if (!this.customOverrides[key]) {
      this.customOverrides[key] = {};
    }
    this.customOverrides[key][stateKey] = dataUrl;
    this.availabilityCache.set(dataUrl, true);
    this.saveOverridesToStorage();
    this.notify();
  }

  public setCustomSpriteSet(
    unitOrFamilyId: string,
    states: {
      idle?: string;
      attack?: string;
      hurt?: string;
      dead?: string;
      victory?: string;
    }
  ) {
    const key = (unitOrFamilyId || '').toLowerCase().trim();
    if (!this.customOverrides[key]) {
      this.customOverrides[key] = {};
    }
    Object.assign(this.customOverrides[key], states);
    Object.values(states).forEach((url) => {
      if (url) this.availabilityCache.set(url, true);
    });
    this.saveOverridesToStorage();
    this.notify();
  }

  public clearCustomSprite(unitOrFamilyId: string, state?: MonsterCombatVisualState) {
    const key = (unitOrFamilyId || '').toLowerCase().trim();
    if (!this.customOverrides[key]) return;
    if (state) {
      const stateKey = state.toLowerCase() as keyof Monster2DVisualStates;
      delete this.customOverrides[key][stateKey];
    } else {
      delete this.customOverrides[key];
    }
    this.saveOverridesToStorage();
    this.notify();
  }

  public clearUnitElement(unit: string, elem: string): void {
    const u = unit.toLowerCase().trim();
    const e = elem.toLowerCase().trim();
    const base = `/assets/characters/${u}/${e}`;

    delete this.customOverrides[`var_${u}_${e}`];
    delete this.customOverrides[`${u}_${e}`];
    delete this.customOverrides[u];

    this.availabilityCache.set(`${base}/status.png`, false);
    this.availabilityCache.set(`${base}/PORTRAIT.png`, false);
    this.availabilityCache.set(`${base}/portrait.png`, false);
    ['IDLE', 'ATTACK', 'HURT', 'DEAD', 'DEFEATED', 'VICTORY'].forEach((st) => {
      this.availabilityCache.set(`${base}/${st}.png`, false);
      this.availabilityCache.set(`${base}/${st.toLowerCase()}.png`, false);
    });

    this.saveOverridesToStorage();
    this.notify();
  }

  public async preloadState(url: string): Promise<boolean> {
    if (!url) return false;
    if (this.availabilityCache.has(url)) {
      return this.availabilityCache.get(url)!;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(url, img);
        this.availabilityCache.set(url, true);
        resolve(true);
      };
      img.onerror = () => {
        // Attempt uppercase / lowercase alternate path if applicable
        const lastSlash = url.lastIndexOf('/');
        if (lastSlash !== -1) {
          const basePath = url.substring(0, lastSlash + 1);
          const filename = url.substring(lastSlash + 1);
          const isUpper = filename === filename.toUpperCase();
          const altFilename = isUpper ? filename.toLowerCase() : filename.toUpperCase();
          const altUrl = basePath + altFilename;

          const retryImg = new Image();
          retryImg.onload = () => {
            this.imageCache.set(url, retryImg);
            this.availabilityCache.set(url, true);
            resolve(true);
          };
          retryImg.onerror = () => {
            this.availabilityCache.set(url, false);
            resolve(false);
          };
          retryImg.src = altUrl;
          return;
        }

        this.availabilityCache.set(url, false);
        resolve(false);
      };
      img.src = url;
    });
  }

  public isAvailable(url: string | null): boolean | null {
    if (!url) return false;
    if (this.availabilityCache.has(url)) {
      return this.availabilityCache.get(url)!;
    }
    return null; // pending verification
  }

  public formatMissingReport(monsterName: string, state: MonsterCombatVisualState): string {
    return `VISUAL ASSET NOT YET ASSIGNED\nCharacter: ${monsterName}\nState: ${state}\nAsset: NOT ASSIGNED`;
  }
}

export const monster2DRegistry = new Monster2DAssetService();
