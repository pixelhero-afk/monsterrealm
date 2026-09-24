/**
 * Equipment System Data & Set Bonuses
 * 4 Equipment Slots: Helm, Boots, Armour, Weapon
 * Stat Rolling: 1 Main Stat + 3 Sub Stats (with duplicate sub stats allowed, e.g. double speed)
 * Supported Stats: % health, % defence, speed, % attack, % healing done, % crit chance, % crit damage, % shielding done
 */

import { EquipmentItem, EquipmentSetType, EquipmentSlot, Rarity, StatKey } from '../types';

export interface SetBonusDefinition {
  type: EquipmentSetType;
  name: string;
  piecesRequired: number;
  statBonus: {
    stat: StatKey;
    value: number;       // e.g. 0.25 for +25%
    isPercent: boolean;
  };
  description: string;
}

export const EQUIPMENT_SET_BONUSES: Record<EquipmentSetType, SetBonusDefinition> = {
  SWIFT: {
    type: 'SWIFT',
    name: 'Swift Set',
    piecesRequired: 4,
    statBonus: {
      stat: 'speed',
      value: 0.25,
      isPercent: true,
    },
    description: 'Increases Base Speed by 25%',
  },
  FATAL: {
    type: 'FATAL',
    name: 'Fatal Set',
    piecesRequired: 4,
    statBonus: {
      stat: 'attack',
      value: 0.35,
      isPercent: true,
    },
    description: 'Increases Base Attack by 35%',
  },
  ENERGY: {
    type: 'ENERGY',
    name: 'Energy Set',
    piecesRequired: 2,
    statBonus: {
      stat: 'hp',
      value: 0.15,
      isPercent: true,
    },
    description: 'Increases Base HP by 15%',
  },
  GUARD: {
    type: 'GUARD',
    name: 'Guard Set',
    piecesRequired: 2,
    statBonus: {
      stat: 'defense',
      value: 0.15,
      isPercent: true,
    },
    description: 'Increases Base Defense by 15%',
  },
  BLADE: {
    type: 'BLADE',
    name: 'Blade Set',
    piecesRequired: 2,
    statBonus: {
      stat: 'critRate',
      value: 0.12,
      isPercent: true,
    },
    description: 'Increases Critical Rate by 12%',
  },
  FOCUS: {
    type: 'FOCUS',
    name: 'Focus Set',
    piecesRequired: 2,
    statBonus: {
      stat: 'accuracy',
      value: 0.20,
      isPercent: true,
    },
    description: 'Increases Accuracy by 20%',
  },
  DESTRUCTION: {
    type: 'DESTRUCTION',
    name: 'Destruction Set',
    piecesRequired: 4,
    statBonus: {
      stat: 'critDamage',
      value: 0.40,
      isPercent: true,
    },
    description: 'Increases Critical Damage by 40%',
  },
  LIFE: {
    type: 'LIFE',
    name: 'Life Set',
    piecesRequired: 2,
    statBonus: {
      stat: 'healingDone',
      value: 0.20,
      isPercent: true,
    },
    description: 'Increases Healing Done by 20%',
  },
  BASTION: {
    type: 'BASTION',
    name: 'Bastion Set',
    piecesRequired: 2,
    statBonus: {
      stat: 'shieldingDone',
      value: 0.25,
      isPercent: true,
    },
    description: 'Increases Shielding Done by 25%',
  },
};

/**
 * Available Stats for Equipment Rolling
 * Can roll as flat stats or % stats as requested
 */
export interface StatPoolEntry {
  stat: StatKey;
  isPercent: boolean;
  label: string;
  minMain: number;
  maxMain: number;
  minSub: number;
  maxSub: number;
}

export const EQUIPMENT_STAT_POOL: StatPoolEntry[] = [
  // Flat Stats
  { stat: 'hp', isPercent: false, label: 'Health', minMain: 180, maxMain: 450, minSub: 60, maxSub: 180 },
  { stat: 'attack', isPercent: false, label: 'Attack', minMain: 28, maxMain: 85, minSub: 10, maxSub: 35 },
  { stat: 'defense', isPercent: false, label: 'Defence', minMain: 22, maxMain: 75, minSub: 8, maxSub: 30 },
  { stat: 'speed', isPercent: false, label: 'Speed', minMain: 8, maxMain: 22, minSub: 3, maxSub: 9 },

  // Percent Stats
  { stat: 'hp', isPercent: true, label: '% Health', minMain: 0.10, maxMain: 0.25, minSub: 0.04, maxSub: 0.12 },
  { stat: 'attack', isPercent: true, label: '% Attack', minMain: 0.10, maxMain: 0.25, minSub: 0.04, maxSub: 0.12 },
  { stat: 'defense', isPercent: true, label: '% Defence', minMain: 0.10, maxMain: 0.25, minSub: 0.04, maxSub: 0.12 },
  { stat: 'speed', isPercent: true, label: '% Speed', minMain: 0.06, maxMain: 0.14, minSub: 0.03, maxSub: 0.08 },
  { stat: 'critRate', isPercent: true, label: '% Crit Chance', minMain: 0.08, maxMain: 0.18, minSub: 0.03, maxSub: 0.09 },
  { stat: 'critDamage', isPercent: true, label: '% Crit Damage', minMain: 0.15, maxMain: 0.40, minSub: 0.06, maxSub: 0.18 },
  { stat: 'accuracy', isPercent: true, label: '% Accuracy', minMain: 0.10, maxMain: 0.22, minSub: 0.04, maxSub: 0.10 },
  { stat: 'resistance', isPercent: true, label: '% Resistance', minMain: 0.10, maxMain: 0.22, minSub: 0.04, maxSub: 0.10 },
  { stat: 'healingDone', isPercent: true, label: '% Healing Done', minMain: 0.10, maxMain: 0.22, minSub: 0.04, maxSub: 0.10 },
  { stat: 'shieldingDone', isPercent: true, label: '% Shielding Done', minMain: 0.10, maxMain: 0.22, minSub: 0.04, maxSub: 0.10 },
];

export const EQUIPMENT_SLOTS: EquipmentSlot[] = ['HELM', 'BOOTS', 'ARMOR', 'WEAPON'];

const SET_NAMES: Record<EquipmentSetType, Record<EquipmentSlot, string>> = {
  SWIFT: {
    HELM: 'Zephyr Wing Helm',
    BOOTS: 'Windstrider Boots',
    ARMOR: 'Gale Feather Cuirass',
    WEAPON: 'Tempest Rapier',
    ACCESSORY: 'Gale Pendant',
    RELIC: 'Zephyr Charm',
  },
  FATAL: {
    HELM: 'Warfang Greathelm',
    BOOTS: 'Ironclad Striders',
    ARMOR: 'Berserker Carapace',
    WEAPON: 'Infernal Cleaver',
    ACCESSORY: 'Ruby Medallion',
    RELIC: 'Bloodstone Seal',
  },
  ENERGY: {
    HELM: 'Crown of Yggdrasil',
    BOOTS: 'Verdant Treads',
    ARMOR: 'Living Bark Vestment',
    WEAPON: 'Lifebloom Scepter',
    ACCESSORY: 'Jade Rosary',
    RELIC: 'Verdant Talisman',
  },
  GUARD: {
    HELM: 'Bulwark Visor',
    BOOTS: 'Granite Sabatons',
    ARMOR: 'Titan Aegis Plate',
    WEAPON: 'Fortress Mace',
    ACCESSORY: 'Basalt Torque',
    RELIC: 'Guardian Idol',
  },
  BLADE: {
    HELM: 'Razor Crest Helm',
    BOOTS: 'Shadow Dancer Greaves',
    ARMOR: 'Obsidian Hauberk',
    WEAPON: 'Vorpal Scimitar',
    ACCESSORY: 'Opal Ring',
    RELIC: 'Edge Sigil',
  },
  FOCUS: {
    HELM: 'Oracle Circlet',
    BOOTS: 'Diviner Footwraps',
    ARMOR: 'Celestial Robe',
    WEAPON: 'Prismatic Stave',
    ACCESSORY: 'Clairvoyant Eye',
    RELIC: 'Chronos Astrolabe',
  },
  DESTRUCTION: {
    HELM: 'Cataclysm Helm',
    BOOTS: 'Ruinous Treads',
    ARMOR: 'Abyssal Dreadplate',
    WEAPON: 'Doom Scythe',
    ACCESSORY: 'Blight Brand',
    RELIC: 'Void Shard',
  },
  LIFE: {
    HELM: 'Sanctuary Diadem',
    BOOTS: 'Mercy Walkers',
    ARMOR: 'Radiant Dawn Robes',
    WEAPON: 'Seraphic Caduceus',
    ACCESSORY: 'Tears of Light',
    RELIC: 'Fountain Reliquary',
  },
  BASTION: {
    HELM: 'Bastion Crest Helm',
    BOOTS: 'Iron Wall Greaves',
    ARMOR: 'Phalanx Great-Armor',
    WEAPON: 'Vanguard Spear',
    ACCESSORY: 'Shielding Choker',
    RELIC: 'Barrier Core',
  },
};

/**
 * Rolls Equipment Piece with User-Specified Rules:
 * - Drops random between COMMON - LEGENDARY
 * - Rare items: 1 sub stat
 * - Epic items: 2 sub stats
 * - Legendary items: 3 sub stats
 * - Common / Uncommon: 0 sub stats (main stat only)
 * - Stats can be flat or %
 */
export function rollEquipmentPiece(options?: {
  slot?: EquipmentSlot;
  set?: EquipmentSetType;
  rarity?: Rarity;
  level?: number;
}): EquipmentItem {
  const slots: EquipmentSlot[] = ['HELM', 'BOOTS', 'ARMOR', 'WEAPON'];
  const sets: EquipmentSetType[] = [
    'SWIFT',
    'FATAL',
    'ENERGY',
    'GUARD',
    'BLADE',
    'FOCUS',
    'DESTRUCTION',
    'LIFE',
    'BASTION',
  ];
  const rarities: Rarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

  const slot = options?.slot || slots[Math.floor(Math.random() * slots.length)];
  const set = options?.set || sets[Math.floor(Math.random() * sets.length)];
  const rarity = options?.rarity || rarities[Math.floor(Math.random() * rarities.length)];
  const level = options?.level || 1;

  // 1. Roll 1 Main Stat (can be flat or %)
  const mainDef = EQUIPMENT_STAT_POOL[Math.floor(Math.random() * EQUIPMENT_STAT_POOL.length)];
  const mainValue = mainDef.isPercent
    ? Number((mainDef.minMain + Math.random() * (mainDef.maxMain - mainDef.minMain)).toFixed(2))
    : Math.floor(mainDef.minMain + Math.random() * (mainDef.maxMain - mainDef.minMain + 1));

  // 2. Roll Sub Stats based strictly on rule:
  // "only rare items can have 1 sub stat , epic 2 sub stats , legendary 3 sub stats"
  const subStatsCount =
    rarity === 'LEGENDARY' ? 3 :
    rarity === 'EPIC' ? 2 :
    rarity === 'RARE' ? 1 : 0;

  const subStats: EquipmentItem['subStats'] = [];
  for (let i = 0; i < subStatsCount; i++) {
    const subDef = EQUIPMENT_STAT_POOL[Math.floor(Math.random() * EQUIPMENT_STAT_POOL.length)];
    const subValue = subDef.isPercent
      ? Number((subDef.minSub + Math.random() * (subDef.maxSub - subDef.minSub)).toFixed(2))
      : Math.floor(subDef.minSub + Math.random() * (subDef.maxSub - subDef.minSub + 1));

    subStats.push({
      stat: subDef.stat,
      value: subValue,
      isPercent: subDef.isPercent,
    });
  }

  const name = SET_NAMES[set]?.[slot] || `${set} ${slot}`;
  const id = `eq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id,
    name,
    slot,
    rarity,
    level,
    mainStat: {
      stat: mainDef.stat,
      value: mainValue,
      isPercent: mainDef.isPercent,
    },
    subStats,
    set,
  };
}

/**
 * Pre-configured starter equipment sets for testing and new players
 * 4 Equipment Slots: Helm, Boots, Armour, Weapon
 * 1 Main Stat + 3 Sub Stats each (with duplicate roll examples!)
 */
export const STARTER_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'eq_starter_helm_01',
    name: 'Zephyr Wing Helm',
    slot: 'HELM',
    rarity: 'EPIC',
    level: 6,
    mainStat: { stat: 'hp', value: 0.16, isPercent: true },
    subStats: [
      { stat: 'speed', value: 5, isPercent: false },
      { stat: 'speed', value: 6, isPercent: false }, // Lucky duplicate speed roll!
      { stat: 'critRate', value: 0.05, isPercent: true },
    ],
    set: 'SWIFT',
  },
  {
    id: 'eq_starter_boots_01',
    name: 'Windstrider Boots',
    slot: 'BOOTS',
    rarity: 'RARE',
    level: 6,
    mainStat: { stat: 'speed', value: 14, isPercent: false },
    subStats: [
      { stat: 'attack', value: 0.08, isPercent: true },
      { stat: 'critDamage', value: 0.12, isPercent: true },
      { stat: 'shieldingDone', value: 0.06, isPercent: true },
    ],
    set: 'SWIFT',
  },
  {
    id: 'eq_starter_armor_01',
    name: 'Titan Aegis Plate',
    slot: 'ARMOR',
    rarity: 'RARE',
    level: 6,
    mainStat: { stat: 'defense', value: 0.18, isPercent: true },
    subStats: [
      { stat: 'hp', value: 0.08, isPercent: true },
      { stat: 'healingDone', value: 0.08, isPercent: true },
      { stat: 'defense', value: 0.07, isPercent: true }, // Duplicate % defence!
    ],
    set: 'GUARD',
  },
  {
    id: 'eq_starter_sword_01',
    name: 'Infernal Cleaver',
    slot: 'WEAPON',
    rarity: 'LEGENDARY',
    level: 8,
    mainStat: { stat: 'attack', value: 0.22, isPercent: true },
    subStats: [
      { stat: 'critRate', value: 0.07, isPercent: true },
      { stat: 'critDamage', value: 0.14, isPercent: true },
      { stat: 'speed', value: 7, isPercent: false },
    ],
    set: 'FATAL',
  },
  {
    id: 'eq_starter_helm_life_01',
    name: 'Sanctuary Diadem',
    slot: 'HELM',
    rarity: 'RARE',
    level: 6,
    mainStat: { stat: 'healingDone', value: 0.16, isPercent: true },
    subStats: [
      { stat: 'hp', value: 0.09, isPercent: true },
      { stat: 'shieldingDone', value: 0.08, isPercent: true },
      { stat: 'speed', value: 4, isPercent: false },
    ],
    set: 'LIFE',
  },
  {
    id: 'eq_starter_boots_destruct_01',
    name: 'Ruinous Treads',
    slot: 'BOOTS',
    rarity: 'EPIC',
    level: 7,
    mainStat: { stat: 'critDamage', value: 0.28, isPercent: true },
    subStats: [
      { stat: 'critRate', value: 0.06, isPercent: true },
      { stat: 'speed', value: 6, isPercent: false },
      { stat: 'attack', value: 0.09, isPercent: true },
    ],
    set: 'DESTRUCTION',
  },
  {
    id: 'eq_starter_armor_bastion_01',
    name: 'Phalanx Great-Armor',
    slot: 'ARMOR',
    rarity: 'RARE',
    level: 6,
    mainStat: { stat: 'shieldingDone', value: 0.18, isPercent: true },
    subStats: [
      { stat: 'defense', value: 0.10, isPercent: true },
      { stat: 'hp', value: 0.07, isPercent: true },
      { stat: 'healingDone', value: 0.06, isPercent: true },
    ],
    set: 'BASTION',
  },
];

export function formatEquipmentStat(stat: string, value: number, isPercent?: boolean): string {
  const isPct = isPercent ?? (value < 2.0 && stat !== 'speed');
  if (isPct) {
    const pct = Math.round(value * 100);
    switch (stat) {
      case 'hp': return `+${pct}% Health`;
      case 'attack': return `+${pct}% Attack`;
      case 'defense': return `+${pct}% Defence`;
      case 'speed': return `+${pct}% Speed`;
      case 'critRate': return `+${pct}% Crit Chance`;
      case 'critDamage': return `+${pct}% Crit Damage`;
      case 'accuracy': return `+${pct}% Accuracy`;
      case 'resistance': return `+${pct}% Resistance`;
      case 'healingDone': return `+${pct}% Healing Done`;
      case 'shieldingDone': return `+${pct}% Shielding Done`;
      default: return `+${pct}% ${stat.toUpperCase()}`;
    }
  }
  switch (stat) {
    case 'hp': return `+${Math.round(value)} Health`;
    case 'attack': return `+${Math.round(value)} Attack`;
    case 'defense': return `+${Math.round(value)} Defence`;
    case 'speed': return `+${Math.round(value)} Speed`;
    default: return `+${Math.round(value)} ${stat.toUpperCase()}`;
  }
}

/**
 * Formats equipment in the user-specified representation:
 * main stat / sub stat / sub stat / sub stat
 * (Rare has 1 sub stat, Epic has 2 sub stats, Legendary has 3 sub stats, Common/Uncommon has 0 sub stats)
 */
export function formatEquipmentStatString(item: EquipmentItem): string {
  const parts: string[] = [];
  if (item.mainStat) {
    parts.push(formatEquipmentStat(item.mainStat.stat, item.mainStat.value, item.mainStat.isPercent));
  }
  if (item.subStats && item.subStats.length > 0) {
    for (const sub of item.subStats) {
      parts.push(formatEquipmentStat(sub.stat, sub.value, sub.isPercent));
    }
  }
  return parts.join(' / ');
}
