/**
 * Centralized Element System Configuration
 * Defines affinities, damage multipliers, accuracy/crit modifiers
 */

import { ElementType } from '../types';

export interface ElementRelationConfig {
  advantageDamageMultiplier: number;     // e.g. 1.20 (+20% damage dealt)
  disadvantageDamageMultiplier: number;  // e.g. 0.85 (-15% damage dealt)
  advantageCritBonus: number;            // e.g. +0.15 (+15% crit rate)
  disadvantageGlanceChance: number;      // e.g. 0.30 (30% glancing hit on disadvantage)
  glanceDamageMultiplier: number;        // e.g. 0.70 (30% less damage on glance, cannot crit)
  accuracyBonusOnAdvantage: number;      // e.g. +0.15 (+15% chance to land debuffs)
  accuracyPenaltyOnDisadvantage: number; // e.g. -0.15 (-15% chance to land debuffs)
}

export const ELEMENT_CONFIG: ElementRelationConfig = {
  advantageDamageMultiplier: 1.25,
  disadvantageDamageMultiplier: 0.80,
  advantageCritBonus: 0.15,
  disadvantageGlanceChance: 0.35,
  glanceDamageMultiplier: 0.70,
  accuracyBonusOnAdvantage: 0.15,
  accuracyPenaltyOnDisadvantage: 0.15,
};

export type AffinityResult = 'ADVANTAGE' | 'DISADVANTAGE' | 'NEUTRAL';

/**
 * Standard elemental triad:
 * Fire > Grass > Water > Fire
 * Light <-> Dark: Mutual strong advantage against each other
 */
const ELEMENT_ADVANTAGE_MAP: Record<ElementType, ElementType[]> = {
  FIRE: ['GRASS'],
  WATER: ['FIRE'],
  GRASS: ['WATER'],
  LIGHT: ['DARK'],
  DARK: ['LIGHT'],
};

const ELEMENT_DISADVANTAGE_MAP: Record<ElementType, ElementType[]> = {
  FIRE: ['WATER'],
  WATER: ['GRASS'],
  GRASS: ['FIRE'],
  LIGHT: [], // Dark is mutual, but not disadvantageous defense-wise
  DARK: [],
};

export function getElementAffinity(attacker: ElementType, defender: ElementType): AffinityResult {
  if (ELEMENT_ADVANTAGE_MAP[attacker]?.includes(defender)) {
    return 'ADVANTAGE';
  }
  if (ELEMENT_DISADVANTAGE_MAP[attacker]?.includes(defender)) {
    return 'DISADVANTAGE';
  }
  return 'NEUTRAL';
}

export interface ElementVisual {
  name: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  borderHex: string;
  colorHex: string;
  weaknessHint: string;
}

export const ELEMENT_VISUALS: Record<ElementType, ElementVisual> = {
  FIRE: {
    name: 'Fire',
    icon: 'Flame',
    badgeBg: 'bg-rose-950/80',
    badgeText: 'text-rose-400',
    borderHex: '#ef4444',
    colorHex: '#dc2626',
    weaknessHint: 'Weak vs Water, Strong vs Grass',
  },
  WATER: {
    name: 'Water',
    icon: 'Droplet',
    badgeBg: 'bg-cyan-950/80',
    badgeText: 'text-cyan-400',
    borderHex: '#06b6d4',
    colorHex: '#0284c7',
    weaknessHint: 'Weak vs Grass, Strong vs Fire',
  },
  GRASS: {
    name: 'Grass',
    icon: 'Leaf',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-400',
    borderHex: '#10b981',
    colorHex: '#059669',
    weaknessHint: 'Weak vs Fire, Strong vs Water',
  },
  LIGHT: {
    name: 'Light',
    icon: 'Sun',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-300',
    borderHex: '#f59e0b',
    colorHex: '#d97706',
    weaknessHint: 'High offensive bonus vs Dark',
  },
  DARK: {
    name: 'Dark',
    icon: 'Moon',
    badgeBg: 'bg-purple-950/80',
    badgeText: 'text-purple-400',
    borderHex: '#a855f7',
    colorHex: '#7c3aed',
    weaknessHint: 'High offensive bonus vs Light',
  },
};
