/**
 * Monster Asset Registry
 * Declarative catalog of production 3D character assets, models, materials, and animation bindings.
 */

import { MonsterAssetConfig } from './types';
import { ElementType } from '../../types';
import { getMonsterVariant } from '../../data/monsters';

export const ELEMENT_THEME_PROPERTIES: Record<
  ElementType,
  {
    tintColor: string;
    rimColor: string;
    emissiveColor: string;
    extraAuraColor: string;
  }
> = {
  FIRE: {
    tintColor: '#ff8282',
    rimColor: '#f87171',
    emissiveColor: '#ef4444',
    extraAuraColor: '#dc2626',
  },
  WATER: {
    tintColor: '#60a5fa',
    rimColor: '#38bdf8',
    emissiveColor: '#0ea5e9',
    extraAuraColor: '#0284c7',
  },
  GRASS: {
    tintColor: '#4ade80',
    rimColor: '#34d399',
    emissiveColor: '#10b981',
    extraAuraColor: '#059669',
  },
  LIGHT: {
    tintColor: '#fef08a',
    rimColor: '#fde047',
    emissiveColor: '#facc15',
    extraAuraColor: '#d97706',
  },
  DARK: {
    tintColor: '#c084fc',
    rimColor: '#c084fc',
    emissiveColor: '#a855f7',
    extraAuraColor: '#7c3aed',
  },
};

export const MONSTER_ASSET_REGISTRY: Record<string, MonsterAssetConfig> = {
  // 1. Shadowstalker
  'fam_shadowstalker': {
    familyId: 'fam_shadowstalker',
    name: 'Shadowstalker',
    modelUrl: '',
    scale: 0.024,
    heightOffset: 0.0,
    rotationYOffset: Math.PI,
    materials: {
      celShading: true,
      emissiveColor: '#c084fc',
      emissiveIntensity: 1.8,
      rimColor: '#c084fc',
      rimPower: 2.2,
      rimIntensity: 1.6,
      roughness: 0.45,
      metalness: 0.08,
    },
    animations: {
      idle: 'Survey',
      walk: 'Walk',
      attack: 'Run',
      skill: 'Survey',
      skill2: 'Survey',
      skill3: 'Run',
      hit: 'Survey',
      defeat: 'Survey',
      victory: 'Survey',
    },
    awakenedConfig: {
      scaleMultiplier: 1.35,
      emissiveMultiplier: 1.8,
      extraAuraColor: '#9333ea',
    },
  },

  // 2. Tideguard
  'fam_tideguard': {
    familyId: 'fam_tideguard',
    name: 'Tideguard',
    modelUrl: '',
    scale: 0.45,
    heightOffset: 0.0,
    rotationYOffset: 0,
    materials: {
      celShading: true,
      emissiveColor: '#38bdf8',
      emissiveIntensity: 1.2,
      rimColor: '#0284c7',
      rimPower: 2.0,
      rimIntensity: 2.0,
      roughness: 0.28,
      metalness: 0.25,
    },
    animations: {
      idle: 'Idle',
      walk: 'Walking',
      attack: 'Punch',
      skill: 'Jump',
      skill2: 'Jump',
      skill3: 'ThumbsUp',
      hit: 'No',
      defeat: 'Death',
      victory: 'Wave',
    },
    awakenedConfig: {
      scaleMultiplier: 1.25,
      emissiveMultiplier: 1.6,
      extraAuraColor: '#0284c7',
    },
  },

  // 3. Floraweaver
  'fam_floraweaver': {
    familyId: 'fam_floraweaver',
    name: 'Floraweaver',
    modelUrl: '',
    scale: 0.85,
    heightOffset: 0.0,
    rotationYOffset: 0,
    materials: {
      celShading: true,
      emissiveColor: '#34d399',
      emissiveIntensity: 1.6,
      rimColor: '#10b981',
      rimPower: 2.0,
      rimIntensity: 2.0,
      roughness: 0.45,
      metalness: 0.05,
    },
    animations: {
      idle: 'idle',
      attack: 'walk',
      skill: 'idle',
      hit: 'idle',
      defeat: 'idle',
      victory: 'idle',
    },
    awakenedConfig: {
      scaleMultiplier: 1.2,
      emissiveMultiplier: 1.5,
      extraAuraColor: '#16a34a',
    },
  },

  // 4. Luminary
  'fam_luminary': {
    familyId: 'fam_luminary',
    name: 'Luminary',
    modelUrl: '',
    scale: 1.2,
    heightOffset: 0.0,
    rotationYOffset: 0,
    materials: {
      celShading: true,
      emissiveColor: '#fde047',
      emissiveIntensity: 1.5,
      rimColor: '#eab308',
      rimPower: 2.0,
      rimIntensity: 2.0,
      roughness: 0.32,
      metalness: 0.35,
    },
    animations: {
      idle: 'Idle',
      walk: 'Walk',
      attack: 'Run',
      skill: 'Idle',
      hit: 'Idle',
      defeat: 'Idle',
      victory: 'Idle',
    },
    awakenedConfig: {
      scaleMultiplier: 1.25,
      emissiveMultiplier: 1.7,
      extraAuraColor: '#ca8a04',
    },
  },

  // 5. Pyrosaur
  'fam_pyrosaur': {
    familyId: 'fam_pyrosaur',
    name: 'Pyrosaur',
    modelUrl: '',
    scale: 0.82,
    heightOffset: 0.0,
    rotationYOffset: Math.PI,
    materials: {
      celShading: true,
      emissiveColor: '#ff5500',
      emissiveIntensity: 2.4,
      rimColor: '#ff2200',
      rimPower: 1.8,
      rimIntensity: 2.4,
      roughness: 0.38,
      metalness: 0.15,
    },
    animations: {
      idle: 'idle',
      attack: 'attack',
      skill: 'skill',
      hit: 'hit',
      defeat: 'defeat',
      victory: 'victory',
    },
    awakenedConfig: {
      scaleMultiplier: 1.3,
      emissiveMultiplier: 1.8,
      extraAuraColor: '#dc2626',
    },
  },

  // 6. Free Dancer
  'fam_freedancer': {
    familyId: 'fam_freedancer',
    name: 'Free Dancer',
    modelUrl: '',
    scale: 0.88,
    heightOffset: 0.0,
    rotationYOffset: 0,
    materials: {
      celShading: true,
      emissiveColor: '#ec4899',
      emissiveIntensity: 1.2,
      rimColor: '#f43f5e',
      rimPower: 2.2,
      rimIntensity: 1.8,
      roughness: 0.4,
      metalness: 0.15,
    },
    animations: {
      idle: 'SambaDance',
      walk: 'SambaDance',
      attack: 'SambaDance',
      skill: 'SambaDance',
      skill2: 'SambaDance',
      skill3: 'SambaDance',
      hit: 'SambaDance',
      defeat: 'TPose',
      victory: 'SambaDance',
    },
    awakenedConfig: {
      scaleMultiplier: 1.15,
      emissiveMultiplier: 1.5,
      extraAuraColor: '#f43f5e',
    },
  },

  // 7. Nekohime
  'fam_nekohime': {
    familyId: 'fam_nekohime',
    name: 'Nekohime',
    modelUrl: '',
    scale: 1.05,
    heightOffset: 0.0,
    rotationYOffset: 0,
    materials: {
      celShading: true,
      emissiveColor: '#10b981',
      emissiveIntensity: 1.5,
      rimColor: '#34d399',
      rimPower: 2.0,
      rimIntensity: 2.0,
      roughness: 0.45,
      metalness: 0.1,
    },
    animations: {
      idle: 'Idle',
      walk: 'Walk',
      attack: 'Attack',
      skill: 'Skill1',
      skill2: 'Skill2',
      skill3: 'Skill2',
      hit: 'Hit',
      defeat: 'Defeat',
      victory: 'Victory',
    },
    awakenedConfig: {
      scaleMultiplier: 1.18,
      emissiveMultiplier: 1.6,
      extraAuraColor: '#10b981',
    },
  },
};

/**
 * Resolves the active element for a monster based on variant ID, explicit element, or family.
 */
export function resolveElement(
  variantOrFamilyId: string,
  explicitElement?: ElementType
): ElementType {
  if (explicitElement) return explicitElement;
  const variant = getMonsterVariant(variantOrFamilyId);
  if (variant?.element) return variant.element;

  const idLower = (variantOrFamilyId || '').toLowerCase();
  if (idLower.includes('_fire') || idLower.includes('fire')) return 'FIRE';
  if (idLower.includes('_water') || idLower.includes('water')) return 'WATER';
  if (idLower.includes('_grass') || idLower.includes('grass')) return 'GRASS';
  if (idLower.includes('_light') || idLower.includes('light')) return 'LIGHT';
  if (idLower.includes('_dark') || idLower.includes('dark')) return 'DARK';

  if (idLower.includes('pyrosaur')) return 'FIRE';
  if (idLower.includes('tideguard')) return 'WATER';
  if (idLower.includes('floraweaver')) return 'GRASS';
  if (idLower.includes('luminary')) return 'LIGHT';
  if (idLower.includes('shadowstalker')) return 'DARK';
  if (idLower.includes('freedancer')) return 'FIRE';
  if (idLower.includes('nekohime')) return 'GRASS';

  return 'FIRE';
}

/**
 * Resolves monster asset configuration from variantId or familyId and element.
 * Dynamically applies element-based colors (red-ish for Fire, blue for Water, etc.)
 * and specialized textures for Nekohime and all other models.
 */
export function getMonsterAssetConfig(
  variantOrFamilyId: string,
  explicitElement?: ElementType
): MonsterAssetConfig {
  const idLower = (variantOrFamilyId || '').toLowerCase();
  let baseConfig: MonsterAssetConfig;

  if (idLower.includes('freedancer')) {
    baseConfig = MONSTER_ASSET_REGISTRY['fam_freedancer'];
  } else if (idLower.includes('nekohime')) {
    baseConfig = MONSTER_ASSET_REGISTRY['fam_nekohime'];
  } else if (idLower.includes('shadowstalker')) {
    baseConfig = MONSTER_ASSET_REGISTRY['fam_shadowstalker'];
  } else if (idLower.includes('tideguard')) {
    baseConfig = MONSTER_ASSET_REGISTRY['fam_tideguard'];
  } else if (idLower.includes('floraweaver')) {
    baseConfig = MONSTER_ASSET_REGISTRY['fam_floraweaver'];
  } else if (idLower.includes('luminary')) {
    baseConfig = MONSTER_ASSET_REGISTRY['fam_luminary'];
  } else if (idLower.includes('pyrosaur')) {
    baseConfig = MONSTER_ASSET_REGISTRY['fam_pyrosaur'];
  } else if (MONSTER_ASSET_REGISTRY[variantOrFamilyId]) {
    baseConfig = MONSTER_ASSET_REGISTRY[variantOrFamilyId];
  } else {
    console.warn(
      `[AssetValidation] WARN: Monster "${variantOrFamilyId}" did not match known family. Resolving to Pyrosaur fallback.`
    );
    baseConfig = MONSTER_ASSET_REGISTRY['fam_pyrosaur'];
  }

  // Resolve active element for dynamic element-based color styling
  const element = resolveElement(variantOrFamilyId, explicitElement);
  const theme = ELEMENT_THEME_PROPERTIES[element] || ELEMENT_THEME_PROPERTIES.FIRE;
  const elemLower = element.toLowerCase();

  // Create customized instance for this monster element
  const tailoredConfig: MonsterAssetConfig = {
    ...baseConfig,
    materials: {
      ...baseConfig.materials,
      familyId: baseConfig.familyId,
      element: element,
      tintColor:
        baseConfig.familyId === 'fam_nekohime' ||
        baseConfig.familyId === 'fam_pyrosaur' ||
        baseConfig.familyId === 'fam_tideguard' ||
        baseConfig.familyId === 'fam_floraweaver'
          ? undefined
          : theme.tintColor,
      rimColor: theme.rimColor,
      emissiveColor: theme.emissiveColor,
      diffuseTextureUrl: baseConfig.materials.diffuseTextureUrl,
      normalTextureUrl: baseConfig.materials.normalTextureUrl,
      emissiveTextureUrl: baseConfig.materials.emissiveTextureUrl,
    },
    awakenedConfig: baseConfig.awakenedConfig
      ? {
          ...baseConfig.awakenedConfig,
          extraAuraColor: theme.extraAuraColor,
        }
      : undefined,
  };

  return tailoredConfig;
}
