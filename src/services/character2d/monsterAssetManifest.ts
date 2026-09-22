/**
 * Authoritative Character Asset Manifest
 * Single canonical source of truth for character combat sprites and portrait asset paths.
 *
 * CANONICAL DIRECTORIES:
 * - Combat 5-State Sprites: /assets/characters/[monster]/[element]/[IDLE|ATTACK|HURT|DEAD|VICTORY].png
 * - Unit Portraits: /assets/characters/[monster]/[element]/PORTRAIT.png
 *
 * Standard filenames:
 * - PORTRAIT.png
 * - IDLE.png
 * - ATTACK.png
 * - HURT.png
 * - DEAD.png
 * - VICTORY.png
 */

export interface CharacterCombatVisuals {
  idle: string;
  attack: string;
  hurt: string;
  defeated: string;
  victory: string;
}

export interface CharacterAssetEntry {
  id: string; // familyId (e.g. 'fam_pyrosaur') or variantId (e.g. 'var_pyrosaur_fire')
  name: string;
  portrait: string;
  visuals: CharacterCombatVisuals;
  scale?: number;
}

export const CANONICAL_CHARACTER_ASSETS: Record<string, CharacterAssetEntry> = {
  // 1. Pyrosaur Family (Fire)
  'fam_pyrosaur': {
    id: 'fam_pyrosaur',
    name: 'Pyrosaur',
    portrait: '/assets/characters/pyrosaur/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/pyrosaur/fire/IDLE.png',
      attack: '/assets/characters/pyrosaur/fire/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/fire/HURT.png',
      defeated: '/assets/characters/pyrosaur/fire/DEAD.png',
      victory: '/assets/characters/pyrosaur/fire/VICTORY.png',
    },
    scale: 1.1,
  },

  // Pyrosaur Fire Variant
  'var_pyrosaur_fire': {
    id: 'var_pyrosaur_fire',
    name: 'Pyrosaur Fire',
    portrait: '/assets/characters/pyrosaur/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/pyrosaur/fire/IDLE.png',
      attack: '/assets/characters/pyrosaur/fire/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/fire/HURT.png',
      defeated: '/assets/characters/pyrosaur/fire/DEAD.png',
      victory: '/assets/characters/pyrosaur/fire/VICTORY.png',
    },
    scale: 1.1,
  },

  'pyrosaur': {
    id: 'fam_pyrosaur',
    name: 'Pyrosaur',
    portrait: '/assets/characters/pyrosaur/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/pyrosaur/fire/IDLE.png',
      attack: '/assets/characters/pyrosaur/fire/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/fire/HURT.png',
      defeated: '/assets/characters/pyrosaur/fire/DEAD.png',
      victory: '/assets/characters/pyrosaur/fire/VICTORY.png',
    },
    scale: 1.1,
  },

  'pyrosaur_fire': {
    id: 'var_pyrosaur_fire',
    name: 'Pyrosaur Fire',
    portrait: '/assets/characters/pyrosaur/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/pyrosaur/fire/IDLE.png',
      attack: '/assets/characters/pyrosaur/fire/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/fire/HURT.png',
      defeated: '/assets/characters/pyrosaur/fire/DEAD.png',
      victory: '/assets/characters/pyrosaur/fire/VICTORY.png',
    },
    scale: 1.1,
  },

  // Pyrosaur Water Variant
  'var_pyrosaur_water': {
    id: 'var_pyrosaur_water',
    name: 'Pyrosaur Water',
    portrait: '/assets/characters/pyrosaur/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/pyrosaur/water/IDLE.png',
      attack: '/assets/characters/pyrosaur/water/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/water/HURT.png',
      defeated: '/assets/characters/pyrosaur/water/DEAD.png',
      victory: '/assets/characters/pyrosaur/water/VICTORY.png',
    },
    scale: 1.1,
  },

  'pyrosaur_water': {
    id: 'var_pyrosaur_water',
    name: 'Pyrosaur Water',
    portrait: '/assets/characters/pyrosaur/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/pyrosaur/water/IDLE.png',
      attack: '/assets/characters/pyrosaur/water/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/water/HURT.png',
      defeated: '/assets/characters/pyrosaur/water/DEAD.png',
      victory: '/assets/characters/pyrosaur/water/VICTORY.png',
    },
    scale: 1.1,
  },

  // Pyrosaur Grass Variant
  'var_pyrosaur_grass': {
    id: 'var_pyrosaur_grass',
    name: 'Pyrosaur Grass',
    portrait: '/assets/characters/pyrosaur/grass/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/pyrosaur/grass/IDLE.png',
      attack: '/assets/characters/pyrosaur/grass/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/grass/HURT.png',
      defeated: '/assets/characters/pyrosaur/grass/DEAD.png',
      victory: '/assets/characters/pyrosaur/grass/VICTORY.png',
    },
    scale: 1.1,
  },

  'pyrosaur_grass': {
    id: 'var_pyrosaur_grass',
    name: 'Pyrosaur Grass',
    portrait: '/assets/characters/pyrosaur/grass/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/pyrosaur/grass/IDLE.png',
      attack: '/assets/characters/pyrosaur/grass/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/grass/HURT.png',
      defeated: '/assets/characters/pyrosaur/grass/DEAD.png',
      victory: '/assets/characters/pyrosaur/grass/VICTORY.png',
    },
    scale: 1.1,
  },

  // Pyrosaur Light Variant
  'var_pyrosaur_light': {
    id: 'var_pyrosaur_light',
    name: 'Pyrosaur Light',
    portrait: '/assets/characters/pyrosaur/light/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/pyrosaur/light/IDLE.png',
      attack: '/assets/characters/pyrosaur/light/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/light/HURT.png',
      defeated: '/assets/characters/pyrosaur/light/DEAD.png',
      victory: '/assets/characters/pyrosaur/light/VICTORY.png',
    },
    scale: 1.1,
  },

  'pyrosaur_light': {
    id: 'var_pyrosaur_light',
    name: 'Pyrosaur Light',
    portrait: '/assets/characters/pyrosaur/light/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/pyrosaur/light/IDLE.png',
      attack: '/assets/characters/pyrosaur/light/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/light/HURT.png',
      defeated: '/assets/characters/pyrosaur/light/DEAD.png',
      victory: '/assets/characters/pyrosaur/light/VICTORY.png',
    },
    scale: 1.1,
  },

  // Pyrosaur Dark Variant
  'var_pyrosaur_dark': {
    id: 'var_pyrosaur_dark',
    name: 'Pyrosaur Dark',
    portrait: '/assets/characters/pyrosaur/dark/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/pyrosaur/dark/IDLE.png',
      attack: '/assets/characters/pyrosaur/dark/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/dark/HURT.png',
      defeated: '/assets/characters/pyrosaur/dark/DEAD.png',
      victory: '/assets/characters/pyrosaur/dark/VICTORY.png',
    },
    scale: 1.1,
  },

  'pyrosaur_dark': {
    id: 'var_pyrosaur_dark',
    name: 'Pyrosaur Dark',
    portrait: '/assets/characters/pyrosaur/dark/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/pyrosaur/dark/IDLE.png',
      attack: '/assets/characters/pyrosaur/dark/ATTACK.png',
      hurt: '/assets/characters/pyrosaur/dark/HURT.png',
      defeated: '/assets/characters/pyrosaur/dark/DEAD.png',
      victory: '/assets/characters/pyrosaur/dark/VICTORY.png',
    },
    scale: 1.1,
  },

  // 2. NekoHime Family (Grass)
  'fam_nekohime': {
    id: 'fam_nekohime',
    name: 'NekoHime',
    portrait: '/assets/characters/nekohime/grass/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/nekohime/grass/IDLE.png',
      attack: '/assets/characters/nekohime/grass/ATTACK.png',
      hurt: '/assets/characters/nekohime/grass/HURT.png',
      defeated: '/assets/characters/nekohime/grass/DEAD.png',
      victory: '/assets/characters/nekohime/grass/VICTORY.png',
    },
    scale: 1.0,
  },

  'nekohime': {
    id: 'fam_nekohime',
    name: 'NekoHime',
    portrait: '/assets/characters/nekohime/grass/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/nekohime/grass/IDLE.png',
      attack: '/assets/characters/nekohime/grass/ATTACK.png',
      hurt: '/assets/characters/nekohime/grass/HURT.png',
      defeated: '/assets/characters/nekohime/grass/DEAD.png',
      victory: '/assets/characters/nekohime/grass/VICTORY.png',
    },
    scale: 1.0,
  },

  // NekoHime Grass Variant
  'var_nekohime_grass': {
    id: 'var_nekohime_grass',
    name: 'NekoHime Grass',
    portrait: '/assets/characters/nekohime/grass/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/nekohime/grass/IDLE.png',
      attack: '/assets/characters/nekohime/grass/ATTACK.png',
      hurt: '/assets/characters/nekohime/grass/HURT.png',
      defeated: '/assets/characters/nekohime/grass/DEAD.png',
      victory: '/assets/characters/nekohime/grass/VICTORY.png',
    },
    scale: 1.0,
  },

  'nekohime_grass': {
    id: 'var_nekohime_grass',
    name: 'NekoHime Grass',
    portrait: '/assets/characters/nekohime/grass/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/nekohime/grass/IDLE.png',
      attack: '/assets/characters/nekohime/grass/ATTACK.png',
      hurt: '/assets/characters/nekohime/grass/HURT.png',
      defeated: '/assets/characters/nekohime/grass/DEAD.png',
      victory: '/assets/characters/nekohime/grass/VICTORY.png',
    },
    scale: 1.0,
  },

  // NekoHime Fire Variant
  'var_nekohime_fire': {
    id: 'var_nekohime_fire',
    name: 'NekoHime Fire',
    portrait: '/assets/characters/nekohime/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/nekohime/fire/IDLE.png',
      attack: '/assets/characters/nekohime/fire/ATTACK.png',
      hurt: '/assets/characters/nekohime/fire/HURT.png',
      defeated: '/assets/characters/nekohime/fire/DEAD.png',
      victory: '/assets/characters/nekohime/fire/VICTORY.png',
    },
    scale: 1.0,
  },

  'nekohime_fire': {
    id: 'var_nekohime_fire',
    name: 'NekoHime Fire',
    portrait: '/assets/characters/nekohime/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/nekohime/fire/IDLE.png',
      attack: '/assets/characters/nekohime/fire/ATTACK.png',
      hurt: '/assets/characters/nekohime/fire/HURT.png',
      defeated: '/assets/characters/nekohime/fire/DEAD.png',
      victory: '/assets/characters/nekohime/fire/VICTORY.png',
    },
    scale: 1.0,
  },

  // NekoHime Water Variant
  'var_nekohime_water': {
    id: 'var_nekohime_water',
    name: 'NekoHime Water',
    portrait: '/assets/characters/nekohime/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/nekohime/water/IDLE.png',
      attack: '/assets/characters/nekohime/water/ATTACK.png',
      hurt: '/assets/characters/nekohime/water/HURT.png',
      defeated: '/assets/characters/nekohime/water/DEAD.png',
      victory: '/assets/characters/nekohime/water/VICTORY.png',
    },
    scale: 1.0,
  },

  'nekohime_water': {
    id: 'var_nekohime_water',
    name: 'NekoHime Water',
    portrait: '/assets/characters/nekohime/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/nekohime/water/IDLE.png',
      attack: '/assets/characters/nekohime/water/ATTACK.png',
      hurt: '/assets/characters/nekohime/water/HURT.png',
      defeated: '/assets/characters/nekohime/water/DEAD.png',
      victory: '/assets/characters/nekohime/water/VICTORY.png',
    },
    scale: 1.0,
  },

  // NekoHime Light Variant
  'var_nekohime_light': {
    id: 'var_nekohime_light',
    name: 'NekoHime Light',
    portrait: '/assets/characters/nekohime/light/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/nekohime/light/IDLE.png',
      attack: '/assets/characters/nekohime/light/ATTACK.png',
      hurt: '/assets/characters/nekohime/light/HURT.png',
      defeated: '/assets/characters/nekohime/light/DEAD.png',
      victory: '/assets/characters/nekohime/light/VICTORY.png',
    },
    scale: 1.0,
  },

  'nekohime_light': {
    id: 'var_nekohime_light',
    name: 'NekoHime Light',
    portrait: '/assets/characters/nekohime/light/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/nekohime/light/IDLE.png',
      attack: '/assets/characters/nekohime/light/ATTACK.png',
      hurt: '/assets/characters/nekohime/light/HURT.png',
      defeated: '/assets/characters/nekohime/light/DEAD.png',
      victory: '/assets/characters/nekohime/light/VICTORY.png',
    },
    scale: 1.0,
  },

  // NekoHime Dark Variant
  'var_nekohime_dark': {
    id: 'var_nekohime_dark',
    name: 'NekoHime Dark',
    portrait: '/assets/characters/nekohime/dark/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/nekohime/dark/IDLE.png',
      attack: '/assets/characters/nekohime/dark/ATTACK.png',
      hurt: '/assets/characters/nekohime/dark/HURT.png',
      defeated: '/assets/characters/nekohime/dark/DEAD.png',
      victory: '/assets/characters/nekohime/dark/VICTORY.png',
    },
    scale: 1.0,
  },

  'nekohime_dark': {
    id: 'var_nekohime_dark',
    name: 'NekoHime Dark',
    portrait: '/assets/characters/nekohime/dark/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/nekohime/dark/IDLE.png',
      attack: '/assets/characters/nekohime/dark/ATTACK.png',
      hurt: '/assets/characters/nekohime/dark/HURT.png',
      defeated: '/assets/characters/nekohime/dark/DEAD.png',
      victory: '/assets/characters/nekohime/dark/VICTORY.png',
    },
    scale: 1.0,
  },

  // 3. Tideguard Family (Water)
  'fam_tideguard': {
    id: 'fam_tideguard',
    name: 'Tideguard',
    portrait: '/assets/characters/tideguard/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/tideguard/water/IDLE.png',
      attack: '/assets/characters/tideguard/water/ATTACK.png',
      hurt: '/assets/characters/tideguard/water/HURT.png',
      defeated: '/assets/characters/tideguard/water/DEAD.png',
      victory: '/assets/characters/tideguard/water/VICTORY.png',
    },
    scale: 1.15,
  },

  'var_tideguard_water': {
    id: 'var_tideguard_water',
    name: 'Tideguard Water',
    portrait: '/assets/characters/tideguard/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/tideguard/water/IDLE.png',
      attack: '/assets/characters/tideguard/water/ATTACK.png',
      hurt: '/assets/characters/tideguard/water/HURT.png',
      defeated: '/assets/characters/tideguard/water/DEAD.png',
      victory: '/assets/characters/tideguard/water/VICTORY.png',
    },
    scale: 1.15,
  },

  'tideguard_water': {
    id: 'var_tideguard_water',
    name: 'Tideguard Water',
    portrait: '/assets/characters/tideguard/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/tideguard/water/IDLE.png',
      attack: '/assets/characters/tideguard/water/ATTACK.png',
      hurt: '/assets/characters/tideguard/water/HURT.png',
      defeated: '/assets/characters/tideguard/water/DEAD.png',
      victory: '/assets/characters/tideguard/water/VICTORY.png',
    },
    scale: 1.15,
  },

  'tideguard': {
    id: 'fam_tideguard',
    name: 'Tideguard',
    portrait: '/assets/characters/tideguard/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/tideguard/water/IDLE.png',
      attack: '/assets/characters/tideguard/water/ATTACK.png',
      hurt: '/assets/characters/tideguard/water/HURT.png',
      defeated: '/assets/characters/tideguard/water/DEAD.png',
      victory: '/assets/characters/tideguard/water/VICTORY.png',
    },
    scale: 1.15,
  },

  // 4. Floraweaver Family (Grass)
  'fam_floraweaver': {
    id: 'fam_floraweaver',
    name: 'Floraweaver',
    portrait: '/assets/characters/floraweaver/grass/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/floraweaver/grass/IDLE.png',
      attack: '/assets/characters/floraweaver/grass/ATTACK.png',
      hurt: '/assets/characters/floraweaver/grass/HURT.png',
      defeated: '/assets/characters/floraweaver/grass/DEAD.png',
      victory: '/assets/characters/floraweaver/grass/VICTORY.png',
    },
    scale: 1.0,
  },

  // Floraweaver Grass Variant
  'var_floraweaver_grass': {
    id: 'var_floraweaver_grass',
    name: 'Floraweaver Grass',
    portrait: '/assets/characters/floraweaver/grass/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/floraweaver/grass/IDLE.png',
      attack: '/assets/characters/floraweaver/grass/ATTACK.png',
      hurt: '/assets/characters/floraweaver/grass/HURT.png',
      defeated: '/assets/characters/floraweaver/grass/DEAD.png',
      victory: '/assets/characters/floraweaver/grass/VICTORY.png',
    },
    scale: 1.0,
  },

  'floraweaver_grass': {
    id: 'var_floraweaver_grass',
    name: 'Floraweaver Grass',
    portrait: '/assets/characters/floraweaver/grass/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/floraweaver/grass/IDLE.png',
      attack: '/assets/characters/floraweaver/grass/ATTACK.png',
      hurt: '/assets/characters/floraweaver/grass/HURT.png',
      defeated: '/assets/characters/floraweaver/grass/DEAD.png',
      victory: '/assets/characters/floraweaver/grass/VICTORY.png',
    },
    scale: 1.0,
  },

  // Floraweaver Fire Variant
  'var_floraweaver_fire': {
    id: 'var_floraweaver_fire',
    name: 'Floraweaver Fire',
    portrait: '/assets/characters/floraweaver/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/floraweaver/fire/IDLE.png',
      attack: '/assets/characters/floraweaver/fire/ATTACK.png',
      hurt: '/assets/characters/floraweaver/fire/HURT.png',
      defeated: '/assets/characters/floraweaver/fire/DEAD.png',
      victory: '/assets/characters/floraweaver/fire/VICTORY.png',
    },
    scale: 1.0,
  },

  'floraweaver_fire': {
    id: 'var_floraweaver_fire',
    name: 'Floraweaver Fire',
    portrait: '/assets/characters/floraweaver/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/floraweaver/fire/IDLE.png',
      attack: '/assets/characters/floraweaver/fire/ATTACK.png',
      hurt: '/assets/characters/floraweaver/fire/HURT.png',
      defeated: '/assets/characters/floraweaver/fire/DEAD.png',
      victory: '/assets/characters/floraweaver/fire/VICTORY.png',
    },
    scale: 1.0,
  },

  // Floraweaver Water Variant
  'var_floraweaver_water': {
    id: 'var_floraweaver_water',
    name: 'Floraweaver Water',
    portrait: '/assets/characters/floraweaver/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/floraweaver/water/IDLE.png',
      attack: '/assets/characters/floraweaver/water/ATTACK.png',
      hurt: '/assets/characters/floraweaver/water/HURT.png',
      defeated: '/assets/characters/floraweaver/water/DEAD.png',
      victory: '/assets/characters/floraweaver/water/VICTORY.png',
    },
    scale: 1.0,
  },

  'floraweaver_water': {
    id: 'var_floraweaver_water',
    name: 'Floraweaver Water',
    portrait: '/assets/characters/floraweaver/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/floraweaver/water/IDLE.png',
      attack: '/assets/characters/floraweaver/water/ATTACK.png',
      hurt: '/assets/characters/floraweaver/water/HURT.png',
      defeated: '/assets/characters/floraweaver/water/DEAD.png',
      victory: '/assets/characters/floraweaver/water/VICTORY.png',
    },
    scale: 1.0,
  },

  // Floraweaver Dark Variant
  'var_floraweaver_dark': {
    id: 'var_floraweaver_dark',
    name: 'Floraweaver Dark',
    portrait: '/assets/characters/floraweaver/dark/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/floraweaver/dark/IDLE.png',
      attack: '/assets/characters/floraweaver/dark/ATTACK.png',
      hurt: '/assets/characters/floraweaver/dark/HURT.png',
      defeated: '/assets/characters/floraweaver/dark/DEAD.png',
      victory: '/assets/characters/floraweaver/dark/VICTORY.png',
    },
    scale: 1.0,
  },

  'floraweaver_dark': {
    id: 'var_floraweaver_dark',
    name: 'Floraweaver Dark',
    portrait: '/assets/characters/floraweaver/dark/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/floraweaver/dark/IDLE.png',
      attack: '/assets/characters/floraweaver/dark/ATTACK.png',
      hurt: '/assets/characters/floraweaver/dark/HURT.png',
      defeated: '/assets/characters/floraweaver/dark/DEAD.png',
      victory: '/assets/characters/floraweaver/dark/VICTORY.png',
    },
    scale: 1.0,
  },

  // Floraweaver Light Variant
  'var_floraweaver_light': {
    id: 'var_floraweaver_light',
    name: 'Floraweaver Light',
    portrait: '/assets/characters/floraweaver/light/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/floraweaver/light/IDLE.png',
      attack: '/assets/characters/floraweaver/light/ATTACK.png',
      hurt: '/assets/characters/floraweaver/light/HURT.png',
      defeated: '/assets/characters/floraweaver/light/DEAD.png',
      victory: '/assets/characters/floraweaver/light/VICTORY.png',
    },
    scale: 1.0,
  },

  'floraweaver_light': {
    id: 'var_floraweaver_light',
    name: 'Floraweaver Light',
    portrait: '/assets/characters/floraweaver/light/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/floraweaver/light/IDLE.png',
      attack: '/assets/characters/floraweaver/light/ATTACK.png',
      hurt: '/assets/characters/floraweaver/light/HURT.png',
      defeated: '/assets/characters/floraweaver/light/DEAD.png',
      victory: '/assets/characters/floraweaver/light/VICTORY.png',
    },
    scale: 1.0,
  },

  // 5. Luminary Family (Light)
  'fam_luminary': {
    id: 'fam_luminary',
    name: 'Luminary',
    portrait: '/assets/characters/luminary/light/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/luminary/light/IDLE.png',
      attack: '/assets/characters/luminary/light/ATTACK.png',
      hurt: '/assets/characters/luminary/light/HURT.png',
      defeated: '/assets/characters/luminary/light/DEAD.png',
      victory: '/assets/characters/luminary/light/VICTORY.png',
    },
    scale: 1.05,
  },

  // 6. Shadowstalker Family (Dark)
  'fam_shadowstalker': {
    id: 'fam_shadowstalker',
    name: 'Shadowstalker',
    portrait: '/assets/characters/shadowstalker/dark/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/shadowstalker/dark/IDLE.png',
      attack: '/assets/characters/shadowstalker/dark/ATTACK.png',
      hurt: '/assets/characters/shadowstalker/dark/HURT.png',
      defeated: '/assets/characters/shadowstalker/dark/DEAD.png',
      victory: '/assets/characters/shadowstalker/dark/VICTORY.png',
    },
    scale: 1.05,
  },

  // 7. Free Dancer Family (Fire)
  'fam_freedancer': {
    id: 'fam_freedancer',
    name: 'Free Dancer',
    portrait: '/assets/characters/freedancer/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/freedancer/fire/IDLE.png',
      attack: '/assets/characters/freedancer/fire/ATTACK.png',
      hurt: '/assets/characters/freedancer/fire/HURT.png',
      defeated: '/assets/characters/freedancer/fire/DEAD.png',
      victory: '/assets/characters/freedancer/fire/VICTORY.png',
    },
    scale: 1.0,
  },

  // 8. Porky Family (1-Star Pig-like Monster)
  'fam_porky': {
    id: 'fam_porky',
    name: 'Porky',
    portrait: '/assets/characters/porky/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/porky/fire/IDLE.png',
      attack: '/assets/characters/porky/fire/ATTACK.png',
      hurt: '/assets/characters/porky/fire/HURT.png',
      defeated: '/assets/characters/porky/fire/DEAD.png',
      victory: '/assets/characters/porky/fire/VICTORY.png',
    },
    scale: 0.95,
  },
  'porky': {
    id: 'fam_porky',
    name: 'Porky',
    portrait: '/assets/characters/porky/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/porky/fire/IDLE.png',
      attack: '/assets/characters/porky/fire/ATTACK.png',
      hurt: '/assets/characters/porky/fire/HURT.png',
      defeated: '/assets/characters/porky/fire/DEAD.png',
      victory: '/assets/characters/porky/fire/VICTORY.png',
    },
    scale: 0.95,
  },
  'var_porky_fire': {
    id: 'var_porky_fire',
    name: 'Porky Fire',
    portrait: '/assets/characters/porky/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/porky/fire/IDLE.png',
      attack: '/assets/characters/porky/fire/ATTACK.png',
      hurt: '/assets/characters/porky/fire/HURT.png',
      defeated: '/assets/characters/porky/fire/DEAD.png',
      victory: '/assets/characters/porky/fire/VICTORY.png',
    },
    scale: 0.95,
  },
  'var_porky_water': {
    id: 'var_porky_water',
    name: 'Porky Water',
    portrait: '/assets/characters/porky/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/porky/water/IDLE.png',
      attack: '/assets/characters/porky/water/ATTACK.png',
      hurt: '/assets/characters/porky/water/HURT.png',
      defeated: '/assets/characters/porky/water/DEAD.png',
      victory: '/assets/characters/porky/water/VICTORY.png',
    },
    scale: 0.95,
  },
  'var_porky_grass': {
    id: 'var_porky_grass',
    name: 'Porky Grass',
    portrait: '/assets/characters/porky/grass/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/porky/grass/IDLE.png',
      attack: '/assets/characters/porky/grass/ATTACK.png',
      hurt: '/assets/characters/porky/grass/HURT.png',
      defeated: '/assets/characters/porky/grass/DEAD.png',
      victory: '/assets/characters/porky/grass/VICTORY.png',
    },
    scale: 0.95,
  },
  'var_porky_light': {
    id: 'var_porky_light',
    name: 'Porky Light',
    portrait: '/assets/characters/porky/light/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/porky/light/IDLE.png',
      attack: '/assets/characters/porky/light/ATTACK.png',
      hurt: '/assets/characters/porky/light/HURT.png',
      defeated: '/assets/characters/porky/light/DEAD.png',
      victory: '/assets/characters/porky/light/VICTORY.png',
    },
    scale: 0.95,
  },
  'var_porky_dark': {
    id: 'var_porky_dark',
    name: 'Porky Dark',
    portrait: '/assets/characters/porky/dark/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/porky/dark/IDLE.png',
      attack: '/assets/characters/porky/dark/ATTACK.png',
      hurt: '/assets/characters/porky/dark/HURT.png',
      defeated: '/assets/characters/porky/dark/DEAD.png',
      victory: '/assets/characters/porky/dark/VICTORY.png',
    },
    scale: 0.95,
  },

  // 9. Fishter Family (1-Star Fishman-like Monster)
  'fam_fishter': {
    id: 'fam_fishter',
    name: 'Fishter',
    portrait: '/assets/characters/fishter/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/fishter/water/IDLE.png',
      attack: '/assets/characters/fishter/water/ATTACK.png',
      hurt: '/assets/characters/fishter/water/HURT.png',
      defeated: '/assets/characters/fishter/water/DEAD.png',
      victory: '/assets/characters/fishter/water/VICTORY.png',
    },
    scale: 0.95,
  },
  'fishter': {
    id: 'fam_fishter',
    name: 'Fishter',
    portrait: '/assets/characters/fishter/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/fishter/water/IDLE.png',
      attack: '/assets/characters/fishter/water/ATTACK.png',
      hurt: '/assets/characters/fishter/water/HURT.png',
      defeated: '/assets/characters/fishter/water/DEAD.png',
      victory: '/assets/characters/fishter/water/VICTORY.png',
    },
    scale: 0.95,
  },
  'var_fishter_water': {
    id: 'var_fishter_water',
    name: 'Fishter Water',
    portrait: '/assets/characters/fishter/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/fishter/water/IDLE.png',
      attack: '/assets/characters/fishter/water/ATTACK.png',
      hurt: '/assets/characters/fishter/water/HURT.png',
      defeated: '/assets/characters/fishter/water/DEAD.png',
      victory: '/assets/characters/fishter/water/VICTORY.png',
    },
    scale: 0.95,
  },
  'var_fishter_fire': {
    id: 'var_fishter_fire',
    name: 'Fishter Fire',
    portrait: '/assets/characters/fishter/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/fishter/fire/IDLE.png',
      attack: '/assets/characters/fishter/fire/ATTACK.png',
      hurt: '/assets/characters/fishter/fire/HURT.png',
      defeated: '/assets/characters/fishter/fire/DEAD.png',
      victory: '/assets/characters/fishter/fire/VICTORY.png',
    },
    scale: 0.95,
  },
  'var_fishter_grass': {
    id: 'var_fishter_grass',
    name: 'Fishter Grass',
    portrait: '/assets/characters/fishter/grass/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/fishter/grass/IDLE.png',
      attack: '/assets/characters/fishter/grass/ATTACK.png',
      hurt: '/assets/characters/fishter/grass/HURT.png',
      defeated: '/assets/characters/fishter/grass/DEAD.png',
      victory: '/assets/characters/fishter/grass/VICTORY.png',
    },
    scale: 0.95,
  },
  'var_fishter_light': {
    id: 'var_fishter_light',
    name: 'Fishter Light',
    portrait: '/assets/characters/fishter/light/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/fishter/light/IDLE.png',
      attack: '/assets/characters/fishter/light/ATTACK.png',
      hurt: '/assets/characters/fishter/light/HURT.png',
      defeated: '/assets/characters/fishter/light/DEAD.png',
      victory: '/assets/characters/fishter/light/VICTORY.png',
    },
    scale: 0.95,
  },
  'var_fishter_dark': {
    id: 'var_fishter_dark',
    name: 'Fishter Dark',
    portrait: '/assets/characters/fishter/dark/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/fishter/dark/IDLE.png',
      attack: '/assets/characters/fishter/dark/ATTACK.png',
      hurt: '/assets/characters/fishter/dark/HURT.png',
      defeated: '/assets/characters/fishter/dark/DEAD.png',
      victory: '/assets/characters/fishter/dark/VICTORY.png',
    },
    scale: 0.95,
  },

  // 10. Rockman Family (1-Star Golem-like Monster)
  'fam_rockman': {
    id: 'fam_rockman',
    name: 'Rockman',
    portrait: '/assets/characters/rockman/grass/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/rockman/grass/IDLE.png',
      attack: '/assets/characters/rockman/grass/ATTACK.png',
      hurt: '/assets/characters/rockman/grass/HURT.png',
      defeated: '/assets/characters/rockman/grass/DEAD.png',
      victory: '/assets/characters/rockman/grass/VICTORY.png',
    },
    scale: 1.0,
  },
  'rockman': {
    id: 'fam_rockman',
    name: 'Rockman',
    portrait: '/assets/characters/rockman/grass/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/rockman/grass/IDLE.png',
      attack: '/assets/characters/rockman/grass/ATTACK.png',
      hurt: '/assets/characters/rockman/grass/HURT.png',
      defeated: '/assets/characters/rockman/grass/DEAD.png',
      victory: '/assets/characters/rockman/grass/VICTORY.png',
    },
    scale: 1.0,
  },
  'var_rockman_grass': {
    id: 'var_rockman_grass',
    name: 'Rockman Grass',
    portrait: '/assets/characters/rockman/grass/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/rockman/grass/IDLE.png',
      attack: '/assets/characters/rockman/grass/ATTACK.png',
      hurt: '/assets/characters/rockman/grass/HURT.png',
      defeated: '/assets/characters/rockman/grass/DEAD.png',
      victory: '/assets/characters/rockman/grass/VICTORY.png',
    },
    scale: 1.0,
  },
  'var_rockman_fire': {
    id: 'var_rockman_fire',
    name: 'Rockman Fire',
    portrait: '/assets/characters/rockman/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/rockman/fire/IDLE.png',
      attack: '/assets/characters/rockman/fire/ATTACK.png',
      hurt: '/assets/characters/rockman/fire/HURT.png',
      defeated: '/assets/characters/rockman/fire/DEAD.png',
      victory: '/assets/characters/rockman/fire/VICTORY.png',
    },
    scale: 1.0,
  },
  'var_rockman_water': {
    id: 'var_rockman_water',
    name: 'Rockman Water',
    portrait: '/assets/characters/rockman/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/rockman/water/IDLE.png',
      attack: '/assets/characters/rockman/water/ATTACK.png',
      hurt: '/assets/characters/rockman/water/HURT.png',
      defeated: '/assets/characters/rockman/water/DEAD.png',
      victory: '/assets/characters/rockman/water/VICTORY.png',
    },
    scale: 1.0,
  },
  'var_rockman_light': {
    id: 'var_rockman_light',
    name: 'Rockman Light',
    portrait: '/assets/characters/rockman/light/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/rockman/light/IDLE.png',
      attack: '/assets/characters/rockman/light/ATTACK.png',
      hurt: '/assets/characters/rockman/light/HURT.png',
      defeated: '/assets/characters/rockman/light/DEAD.png',
      victory: '/assets/characters/rockman/light/VICTORY.png',
    },
    scale: 1.0,
  },
  'var_rockman_dark': {
    id: 'var_rockman_dark',
    name: 'Rockman Dark',
    portrait: '/assets/characters/rockman/dark/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/rockman/dark/IDLE.png',
      attack: '/assets/characters/rockman/dark/ATTACK.png',
      hurt: '/assets/characters/rockman/dark/HURT.png',
      defeated: '/assets/characters/rockman/dark/DEAD.png',
      victory: '/assets/characters/rockman/dark/VICTORY.png',
    },
    scale: 1.0,
  },

  // 11. Doggo Family (2-Star Canine Monster)
  'fam_doggo': {
    id: 'fam_doggo',
    name: 'Doggo',
    portrait: '/assets/characters/doggo/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/doggo/fire/IDLE.png',
      attack: '/assets/characters/doggo/fire/ATTACK.png',
      hurt: '/assets/characters/doggo/fire/HURT.png',
      defeated: '/assets/characters/doggo/fire/DEAD.png',
      victory: '/assets/characters/doggo/fire/VICTORY.png',
    },
    scale: 1.0,
  },
  'doggo': {
    id: 'fam_doggo',
    name: 'Doggo',
    portrait: '/assets/characters/doggo/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/doggo/fire/IDLE.png',
      attack: '/assets/characters/doggo/fire/ATTACK.png',
      hurt: '/assets/characters/doggo/fire/HURT.png',
      defeated: '/assets/characters/doggo/fire/DEAD.png',
      victory: '/assets/characters/doggo/fire/VICTORY.png',
    },
    scale: 1.0,
  },
  'var_doggo_fire': {
    id: 'var_doggo_fire',
    name: 'Doggo Fire',
    portrait: '/assets/characters/doggo/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/doggo/fire/IDLE.png',
      attack: '/assets/characters/doggo/fire/ATTACK.png',
      hurt: '/assets/characters/doggo/fire/HURT.png',
      defeated: '/assets/characters/doggo/fire/DEAD.png',
      victory: '/assets/characters/doggo/fire/VICTORY.png',
    },
    scale: 1.0,
  },
  'var_doggo_water': {
    id: 'var_doggo_water',
    name: 'Doggo Water',
    portrait: '/assets/characters/doggo/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/doggo/water/IDLE.png',
      attack: '/assets/characters/doggo/water/ATTACK.png',
      hurt: '/assets/characters/doggo/water/HURT.png',
      defeated: '/assets/characters/doggo/water/DEAD.png',
      victory: '/assets/characters/doggo/water/VICTORY.png',
    },
    scale: 1.0,
  },
  'var_doggo_grass': {
    id: 'var_doggo_grass',
    name: 'Doggo Grass',
    portrait: '/assets/characters/doggo/grass/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/doggo/grass/IDLE.png',
      attack: '/assets/characters/doggo/grass/ATTACK.png',
      hurt: '/assets/characters/doggo/grass/HURT.png',
      defeated: '/assets/characters/doggo/grass/DEAD.png',
      victory: '/assets/characters/doggo/grass/VICTORY.png',
    },
    scale: 1.0,
  },
  'var_doggo_light': {
    id: 'var_doggo_light',
    name: 'Doggo Light',
    portrait: '/assets/characters/doggo/light/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/doggo/light/IDLE.png',
      attack: '/assets/characters/doggo/light/ATTACK.png',
      hurt: '/assets/characters/doggo/light/HURT.png',
      defeated: '/assets/characters/doggo/light/DEAD.png',
      victory: '/assets/characters/doggo/light/VICTORY.png',
    },
    scale: 1.0,
  },
  'var_doggo_dark': {
    id: 'var_doggo_dark',
    name: 'Doggo Dark',
    portrait: '/assets/characters/doggo/dark/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/doggo/dark/IDLE.png',
      attack: '/assets/characters/doggo/dark/ATTACK.png',
      hurt: '/assets/characters/doggo/dark/HURT.png',
      defeated: '/assets/characters/doggo/dark/DEAD.png',
      victory: '/assets/characters/doggo/dark/VICTORY.png',
    },
    scale: 1.0,
  },

  // 12. Birdunno Family (2-Star 2-Headed Bird Monster)
  'fam_birdunno': {
    id: 'fam_birdunno',
    name: 'Birdunno',
    portrait: '/assets/characters/birdunno/light/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/birdunno/light/IDLE.png',
      attack: '/assets/characters/birdunno/light/ATTACK.png',
      hurt: '/assets/characters/birdunno/light/HURT.png',
      defeated: '/assets/characters/birdunno/light/DEAD.png',
      victory: '/assets/characters/birdunno/light/VICTORY.png',
    },
    scale: 1.0,
  },
  'birdunno': {
    id: 'fam_birdunno',
    name: 'Birdunno',
    portrait: '/assets/characters/birdunno/light/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/birdunno/light/IDLE.png',
      attack: '/assets/characters/birdunno/light/ATTACK.png',
      hurt: '/assets/characters/birdunno/light/HURT.png',
      defeated: '/assets/characters/birdunno/light/DEAD.png',
      victory: '/assets/characters/birdunno/light/VICTORY.png',
    },
    scale: 1.0,
  },
  'var_birdunno_light': {
    id: 'var_birdunno_light',
    name: 'Birdunno Light',
    portrait: '/assets/characters/birdunno/light/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/birdunno/light/IDLE.png',
      attack: '/assets/characters/birdunno/light/ATTACK.png',
      hurt: '/assets/characters/birdunno/light/HURT.png',
      defeated: '/assets/characters/birdunno/light/DEAD.png',
      victory: '/assets/characters/birdunno/light/VICTORY.png',
    },
    scale: 1.0,
  },
  'var_birdunno_fire': {
    id: 'var_birdunno_fire',
    name: 'Birdunno Fire',
    portrait: '/assets/characters/birdunno/fire/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/birdunno/fire/IDLE.png',
      attack: '/assets/characters/birdunno/fire/ATTACK.png',
      hurt: '/assets/characters/birdunno/fire/HURT.png',
      defeated: '/assets/characters/birdunno/fire/DEAD.png',
      victory: '/assets/characters/birdunno/fire/VICTORY.png',
    },
    scale: 1.0,
  },
  'var_birdunno_water': {
    id: 'var_birdunno_water',
    name: 'Birdunno Water',
    portrait: '/assets/characters/birdunno/water/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/birdunno/water/IDLE.png',
      attack: '/assets/characters/birdunno/water/ATTACK.png',
      hurt: '/assets/characters/birdunno/water/HURT.png',
      defeated: '/assets/characters/birdunno/water/DEAD.png',
      victory: '/assets/characters/birdunno/water/VICTORY.png',
    },
    scale: 1.0,
  },
  'var_birdunno_grass': {
    id: 'var_birdunno_grass',
    name: 'Birdunno Grass',
    portrait: '/assets/characters/birdunno/grass/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/birdunno/grass/IDLE.png',
      attack: '/assets/characters/birdunno/grass/ATTACK.png',
      hurt: '/assets/characters/birdunno/grass/HURT.png',
      defeated: '/assets/characters/birdunno/grass/DEAD.png',
      victory: '/assets/characters/birdunno/grass/VICTORY.png',
    },
    scale: 1.0,
  },
  'var_birdunno_dark': {
    id: 'var_birdunno_dark',
    name: 'Birdunno Dark',
    portrait: '/assets/characters/birdunno/dark/PORTRAIT.png',
    visuals: {
      idle: '/assets/characters/birdunno/dark/IDLE.png',
      attack: '/assets/characters/birdunno/dark/ATTACK.png',
      hurt: '/assets/characters/birdunno/dark/HURT.png',
      defeated: '/assets/characters/birdunno/dark/DEAD.png',
      victory: '/assets/characters/birdunno/dark/VICTORY.png',
    },
    scale: 1.0,
  },
};
