/**
 * Monster Realms — Canonical Elemental Display Name Resolver
 *
 * Provides authoritative, universal name resolution conforming to:
 *   [Monster Name] [Element]
 * Examples:
 *   getMonsterDisplayName("pysaur", "fire")         -> "Pyrosaur Fire"
 *   getMonsterDisplayName("nekohime", "water")      -> "NekoHime Water"
 *   getMonsterDisplayName("shadowstalker", "dark")  -> "Shadowstalker Dark"
 *   getMonsterDisplayName("var_pyrosaur_fire")       -> "Pyrosaur Fire"
 *
 * Keeps internal family IDs, element data, and asset structures intact.
 */

import { ElementType, MonsterVariant } from '../types';

/** Canonical element display names with standard capitalization */
export const CANONICAL_ELEMENT_NAMES: Record<string, string> = {
  fire: 'Fire',
  water: 'Water',
  grass: 'Grass',
  light: 'Light',
  dark: 'Dark',
};

/**
 * Format raw element string or ElementType to standard player-facing name:
 * 'fire' -> 'Fire', 'WATER' -> 'Water', etc.
 */
export function formatElementName(element?: string | ElementType | null): string {
  if (!element) return '';
  const key = String(element).toLowerCase().trim();
  if (CANONICAL_ELEMENT_NAMES[key]) {
    return CANONICAL_ELEMENT_NAMES[key];
  }
  // Title-case fallback
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Canonical family display names (without element)
 */
export const CANONICAL_FAMILY_NAMES: Record<string, string> = {
  fam_pyrosaur: 'Pyrosaur',
  pyrosaur: 'Pyrosaur',
  pysaur: 'Pyrosaur',
  pyro: 'Pyrosaur',

  fam_nekohime: 'NekoHime',
  nekohime: 'NekoHime',
  neko: 'NekoHime',

  fam_tideguard: 'Tideguard',
  tideguard: 'Tideguard',
  tide: 'Tideguard',

  fam_floraweaver: 'Floraweaver',
  floraweaver: 'Floraweaver',
  flora: 'Floraweaver',

  fam_luminary: 'Luminary',
  luminary: 'Luminary',
  lumin: 'Luminary',

  fam_shadowstalker: 'Shadowstalker',
  shadowstalker: 'Shadowstalker',
  shadow: 'Shadowstalker',

  fam_freedancer: 'Free Dancer',
  freedancer: 'Free Dancer',
  'free dancer': 'Free Dancer',

  fam_porky: 'Porky',
  porky: 'Porky',

  fam_fishter: 'Fishter',
  fishter: 'Fishter',

  fam_rockman: 'Rockman',
  rockman: 'Rockman',

  fam_doggo: 'Doggo',
  doggo: 'Doggo',

  fam_birdunno: 'Birdunno',
  birdunno: 'Birdunno',
};

/**
 * Apex Continent Bosses have unique sovereign titles and do NOT have elemental variants.
 */
export const BOSS_EXACT_NAMES: Record<string, string> = {
  var_boss_pyrosaur_ignis: 'Ignis Sovereign',
  var_boss_tideguard_leviathan: 'Leviathan Sovereign',
  var_boss_floraweaver_yggdrasil: 'Yggdrasil Ancient',
  var_boss_luminary_archon: 'Solar Archon',
  var_boss_shadowstalker_void: 'Void Sovereign',
  boss_ignis: 'Ignis Sovereign',
  boss_leviathan: 'Leviathan Sovereign',
  boss_yggdrasil: 'Yggdrasil Ancient',
  boss_archon: 'Solar Archon',
  boss_void: 'Void Sovereign',
};

/**
 * Resolves the clean base monster name (e.g. "Pyrosaur", "NekoHime", "Free Dancer")
 * without element suffix or subtitle.
 */
export function getBaseMonsterName(
  identifier?: string | { familyId?: string; variantId?: string; name?: string } | null
): string {
  if (!identifier) return 'Unknown Monster';

  if (typeof identifier === 'object') {
    // Check known boss first
    if (identifier.variantId && BOSS_EXACT_NAMES[identifier.variantId]) {
      return BOSS_EXACT_NAMES[identifier.variantId];
    }
    const raw = identifier.familyId || identifier.variantId || identifier.name || '';
    return getBaseMonsterName(raw);
  }

  const rawKey = identifier.toLowerCase().trim();

  // Check boss map
  if (BOSS_EXACT_NAMES[rawKey]) {
    return BOSS_EXACT_NAMES[rawKey];
  }
  for (const [bossKey, bossName] of Object.entries(BOSS_EXACT_NAMES)) {
    if (rawKey.includes(bossKey.replace(/^var_/, '')) || rawKey.includes(bossName.toLowerCase())) {
      return bossName;
    }
  }

  // Check canonical family map
  if (CANONICAL_FAMILY_NAMES[rawKey]) {
    return CANONICAL_FAMILY_NAMES[rawKey];
  }

  // Match known substrings
  if (rawKey.includes('nekohime') || rawKey.includes('neko')) return 'NekoHime';
  if (rawKey.includes('pyrosaur') || rawKey.includes('pysaur') || rawKey.includes('pyro')) return 'Pyrosaur';
  if (rawKey.includes('tideguard') || rawKey.includes('tide')) return 'Tideguard';
  if (rawKey.includes('floraweaver') || rawKey.includes('flora')) return 'Floraweaver';
  if (rawKey.includes('luminary') || rawKey.includes('lumin')) return 'Luminary';
  if (rawKey.includes('shadowstalker') || rawKey.includes('shadow')) return 'Shadowstalker';
  if (rawKey.includes('freedancer') || rawKey.includes('free dancer')) return 'Free Dancer';
  if (rawKey.includes('porky')) return 'Porky';
  if (rawKey.includes('fishter')) return 'Fishter';
  if (rawKey.includes('rockman')) return 'Rockman';
  if (rawKey.includes('doggo')) return 'Doggo';
  if (rawKey.includes('birdunno')) return 'Birdunno';

  // Fallback for custom units: clean up 'fam_' or 'var_' prefix and capitalize
  const clean = rawKey
    .replace(/^fam_/, '')
    .replace(/^var_/, '')
    .split('_')[0]
    .trim();

  if (!clean) return 'Monster';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Universal Display-Name Resolver
 *
 * Supports signatures:
 *   getMonsterDisplayName("pysaur", "fire") -> "Pyrosaur Fire"
 *   getMonsterDisplayName("nekohime", "water") -> "NekoHime Water"
 *   getMonsterDisplayName("var_nekohime_grass") -> "NekoHime Grass"
 *   getMonsterDisplayName(variantObject) -> "NekoHime Water"
 *
 * Preserves normal names for units that genuinely have no elemental variants (e.g. Apex Bosses).
 */
export function getMonsterDisplayName(
  familyOrVariant: string | { familyId?: string; variantId?: string; element?: string | ElementType; name?: string } | null | undefined,
  elementParam?: string | ElementType | null
): string {
  if (!familyOrVariant) return 'Unknown Monster';

  let familyKey = '';
  let resolvedElement: string | ElementType | undefined = elementParam || undefined;
  let variantId = '';
  let existingName = '';

  if (typeof familyOrVariant === 'object') {
    familyKey = familyOrVariant.familyId || '';
    variantId = familyOrVariant.variantId || '';
    existingName = familyOrVariant.name || '';
    if (!resolvedElement && familyOrVariant.element) {
      resolvedElement = familyOrVariant.element;
    }
  } else {
    familyKey = familyOrVariant;
    if (familyOrVariant.startsWith('var_')) {
      variantId = familyOrVariant;
    }
  }

  // 1. Check if it's a unique Boss without elemental variants
  if (variantId && BOSS_EXACT_NAMES[variantId]) {
    return BOSS_EXACT_NAMES[variantId];
  }
  const checkKey = (variantId || familyKey).toLowerCase();
  if (BOSS_EXACT_NAMES[checkKey]) {
    return BOSS_EXACT_NAMES[checkKey];
  }

  // 2. If no elementParam provided, try to extract element from variantId (e.g. var_pyrosaur_fire)
  if (!resolvedElement && checkKey.startsWith('var_')) {
    const parts = checkKey.split('_');
    const lastPart = parts[parts.length - 1];
    if (CANONICAL_ELEMENT_NAMES[lastPart]) {
      resolvedElement = lastPart;
    }
  }

  // 3. Resolve base monster name
  const baseName = getBaseMonsterName(familyKey || variantId || existingName);

  // 4. If unit genuinely has no element, keep base name
  if (!resolvedElement) {
    return baseName;
  }

  // 5. Return standardized [Monster Name] [Element]
  const formattedElement = formatElementName(resolvedElement);
  return `${baseName} ${formattedElement}`;
}
