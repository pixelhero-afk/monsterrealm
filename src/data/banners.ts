/**
 * Summon Banners Configuration
 * Configurable probabilities, pity counts, and currency costs.
 */

import { SummonBanner } from '../types';

export const SUMMON_BANNERS: SummonBanner[] = [
  {
    bannerId: 'banner_featured_nekohime',
    name: 'Feline Starlight (Featured Nekohime)',
    description: 'Rate UP for the 5-Star Legendary Cat Girl Nekohime! Nine-lives kagura and celestial starlight power.',
    featuredVariantIds: [
      'var_nekohime_fire',
      'var_nekohime_light',
      'var_nekohime_dark',
      'var_nekohime_water',
      'var_nekohime_grass',
    ],
    rates: {
      common: 0.35,     // 1★ Tideguard
      uncommon: 0.30,   // 2★ Floraweaver
      rare: 0.21,       // 3★ Pyrosaur
      epic: 0.10,       // 4★ Luminary
      legendary: 0.04,  // 5★ Nekohime & Shadowstalker
    },
    probabilities: {
      '5★ Legendary': 4,
      '4★ Epic': 10,
      '3★ Rare': 21,
      '2★ Uncommon': 30,
      '1★ Common': 35,
    },
    cost: {
      type: 'GEMS',
      amount: 300,
    },
    pityThreshold: 30,
  },
  {
    bannerId: 'banner_standard_realm',
    name: 'Astral Gateway (Standard)',
    description: 'Summon original monsters across all elements and rarities (1★ to 5★). Bosses cannot be summoned.',
    featuredVariantIds: [],
    rates: {
      common: 0.40,     // 1★ Tideguard
      uncommon: 0.30,   // 2★ Floraweaver
      rare: 0.20,       // 3★ Pyrosaur
      epic: 0.08,       // 4★ Luminary
      legendary: 0.02,  // 5★ Shadowstalker & Nekohime
    },
    probabilities: {
      '5★ Legendary': 2,
      '4★ Epic': 8,
      '3★ Rare': 20,
      '2★ Uncommon': 30,
      '1★ Common': 40,
    },
    cost: {
      type: 'SUMMON_POINTS',
      amount: 100,
    },
    pityThreshold: 50,
  },
];
