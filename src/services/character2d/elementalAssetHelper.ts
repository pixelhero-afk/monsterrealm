/**
 * Elemental Asset Helper Service
 * Dynamically resolves character portraits and combat status PNGs from the canonical
 * 5-element directory structure:
 *
 *   /assets/characters/[unitName]/[element]/
 *     ├── placeholder.txt
 *     ├── portrait.png
 *     └── status.png (and IDLE.png, ATTACK.png, HURT.png, DEFEATED.png, VICTORY.png)
 *
 * Supported Units:
 *   - Nekohime
 *   - Pyrosaur
 *   - Shadowstalker
 *   - Tideguard
 *   - Floraweaver
 *
 * Supported Elements:
 *   - dark, fire, grass, light, water
 */

import React from 'react';
import { ElementType } from '../../types';

export type ElementalUnitName = 'nekohime' | 'pyrosaur' | 'shadowstalker' | 'tideguard' | 'floraweaver';
export type StandardElement = 'dark' | 'fire' | 'grass' | 'light' | 'water';

export const RECOGNIZED_UNITS: ElementalUnitName[] = [
  'nekohime',
  'pyrosaur',
  'shadowstalker',
  'tideguard',
  'floraweaver',
];

export const RECOGNIZED_ELEMENTS: StandardElement[] = [
  'dark',
  'fire',
  'grass',
  'light',
  'water',
];

/**
 * Normalizes any unit ID (e.g. 'fam_nekohime', 'var_nekohime_grass', 'nekohime')
 * or display name (e.g. 'Nekohime') into the canonical folder name.
 */
export function normalizeUnitName(unitIdentifier?: string, fallbackName?: string): ElementalUnitName | string {
  const raw = `${unitIdentifier || ''} ${fallbackName || ''}`.toLowerCase().trim();

  if (raw.includes('neko') || raw.includes('nekohime')) return 'nekohime';
  if (raw.includes('pyro') || raw.includes('pyrosaur') || raw.includes('ember') || raw.includes('emberling')) return 'pyrosaur';
  if (raw.includes('shadow') || raw.includes('shadowstalker')) return 'shadowstalker';
  if (raw.includes('tide') || raw.includes('tideguard')) return 'tideguard';
  if (raw.includes('flora') || raw.includes('floraweaver')) return 'floraweaver';
  if (raw.includes('lumin') || raw.includes('luminary')) return 'luminary';
  if (raw.includes('dance') || raw.includes('freedancer')) return 'freedancer';
  if (raw.includes('porky')) return 'porky';
  if (raw.includes('fishter')) return 'fishter';
  if (raw.includes('rockman')) return 'rockman';
  if (raw.includes('doggo')) return 'doggo';
  if (raw.includes('birdunno')) return 'birdunno';
  if (raw.includes('boss')) return 'boss';

  // Strip common prefixes
  const stripped = (unitIdentifier || '')
    .toLowerCase()
    .replace(/^fam_/, '')
    .replace(/^var_/, '')
    .split('_')[0];

  return stripped || 'pyrosaur';
}

/**
 * Normalizes an ElementType ('FIRE', 'WATER', etc.) or string into canonical lowercase element.
 */
export function normalizeElement(element?: ElementType | string, unitIdentifier?: string): StandardElement {
  const str = String(element || '').toLowerCase().trim();

  if (str === 'dark' || str.includes('dark') || str.includes('void')) return 'dark';
  if (str === 'fire' || str.includes('fire') || str.includes('flame') || str.includes('ignis')) return 'fire';
  if (str === 'grass' || str.includes('grass') || str.includes('earth') || str.includes('nature')) return 'grass';
  if (str === 'light' || str.includes('light') || str.includes('holy') || str.includes('solar')) return 'light';
  if (str === 'water' || str.includes('water') || str.includes('ice') || str.includes('aqua')) return 'water';

  // If element not directly specified, inspect unitIdentifier (e.g. var_nekohime_grass)
  if (unitIdentifier) {
    const idLower = unitIdentifier.toLowerCase();
    for (const elem of RECOGNIZED_ELEMENTS) {
      if (idLower.includes(`_${elem}`) || idLower.endsWith(elem)) {
        return elem;
      }
    }
  }

  // Base element map per unit
  const unit = normalizeUnitName(unitIdentifier);
  const DEFAULT_UNIT_ELEMENTS: Record<string, StandardElement> = {
    nekohime: 'grass',
    pyrosaur: 'fire',
    tideguard: 'water',
    floraweaver: 'grass',
    luminary: 'light',
    shadowstalker: 'dark',
    freedancer: 'fire',
    porky: 'fire',
    fishter: 'water',
    rockman: 'grass',
    doggo: 'fire',
    birdunno: 'light',
    boss: 'fire',
  };
  if (DEFAULT_UNIT_ELEMENTS[unit]) {
    return DEFAULT_UNIT_ELEMENTS[unit];
  }

  return 'grass';
}

/**
 * Get canonical portrait path for a given unit and element.
 * Format: /assets/characters/[unitName]/[element]/PORTRAIT.png
 */
export function getElementalPortraitPath(
  unitIdentifier?: string,
  element?: ElementType | string,
  fallbackName?: string
): string {
  const unit = normalizeUnitName(unitIdentifier, fallbackName);
  const elem = normalizeElement(element, unitIdentifier);
  return `/assets/characters/${unit}/${elem}/PORTRAIT.png`;
}

/**
 * Get canonical combat status path for a given unit, element, and optional combat visual state.
 * Format: /assets/characters/[unitName]/[element]/IDLE.png
 */
export function getElementalStatusPath(
  unitIdentifier?: string,
  element?: ElementType | string,
  statusState?: string,
  fallbackName?: string
): string {
  const unit = normalizeUnitName(unitIdentifier, fallbackName);
  const elem = normalizeElement(element, unitIdentifier);
  return `/assets/characters/${unit}/${elem}/IDLE.png`;
}

/**
 * Get all combat state paths for a unit's element following standard uppercase naming.
 */
export function getElementalCombatStates(
  unitIdentifier?: string,
  element?: ElementType | string,
  fallbackName?: string
): {
  portrait: string;
  idle: string;
  attack: string;
  hurt: string;
  dead: string;
  defeated: string;
  victory: string;
  status: string;
} {
  const unit = normalizeUnitName(unitIdentifier, fallbackName);
  const elem = normalizeElement(element, unitIdentifier);
  const base = `/assets/characters/${unit}/${elem}`;

  return {
    portrait: `${base}/PORTRAIT.png`,
    idle: `${base}/IDLE.png`,
    attack: `${base}/ATTACK.png`,
    hurt: `${base}/HURT.png`,
    dead: `${base}/DEAD.png`,
    defeated: `${base}/DEAD.png`,
    victory: `${base}/VICTORY.png`,
    status: `${base}/IDLE.png`,
  };
}

/**
 * CSS style rule guaranteeing transparent background with no white boxes or checkerboards.
 */
export const TRANSPARENT_SPRITE_STYLE: React.CSSProperties = {
  backgroundColor: 'transparent',
  backgroundImage: 'none',
  background: 'transparent',
  boxShadow: 'none',
};

/**
 * Tailwind classes guaranteeing transparency and clean sprite rendering.
 */
export const TRANSPARENT_SPRITE_CLASSNAME =
  'bg-transparent bg-none object-contain select-none pointer-events-none filter';

/**
 * Complete bundle of elemental assets for a unit at runtime.
 */
export interface UnitElementalAssets {
  unitName: string;
  element: StandardElement;
  portraitPath: string;
  statusPath: string;
  combatStates: {
    portrait?: string;
    idle: string;
    attack: string;
    hurt: string;
    dead?: string;
    defeated: string;
    victory: string;
    status: string;
  };
  transparentStyle: React.CSSProperties;
  transparentClass: string;
}

export function getUnitElementalAssets(
  unitIdentifier?: string,
  element?: ElementType | string,
  fallbackName?: string
): UnitElementalAssets {
  const unit = normalizeUnitName(unitIdentifier, fallbackName);
  const elem = normalizeElement(element, unitIdentifier);

  return {
    unitName: unit,
    element: elem,
    portraitPath: getElementalPortraitPath(unit, elem, fallbackName),
    statusPath: getElementalStatusPath(unit, elem, undefined, fallbackName),
    combatStates: getElementalCombatStates(unit, elem, fallbackName),
    transparentStyle: TRANSPARENT_SPRITE_STYLE,
    transparentClass: TRANSPARENT_SPRITE_CLASSNAME,
  };
}
