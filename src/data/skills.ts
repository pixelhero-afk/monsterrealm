/**
 * Centralized Data-Driven Skill Definitions
 * Completely decoupled from monster identities.
 */

import { SkillDefinition } from '../types';

export const SKILLS_DATABASE: Record<string, SkillDefinition> = {
  // ==========================================
  // PYROSAUR (Fire - Burst Damage / Burn)
  // ==========================================
  'skill_flame_claw': {
    id: 'skill_flame_claw',
    name: 'Flame Claw',
    description: 'Slits the enemy with burning talons. 75% chance to inflict Continuous Damage (Burn) for 2 turns.',
    icon: 'Flame',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.2,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 2,
        description: 'Inflicts Burn DoT (5% max HP per turn)',
      },
    ],
  },
  'skill_volcanic_burst': {
    id: 'skill_volcanic_burst',
    name: 'Volcanic Burst',
    description: 'Erupts fiery magma across all enemies, with a 50% chance to decrease Defense for 2 turns.',
    icon: 'SunMedium',
    cooldown: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.5,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.50,
        statusEffect: 'DEFENSE_DOWN',
        statusDuration: 2,
        description: 'Decreases Defense by 50%',
      },
    ],
  },
  'skill_infernal_cataclysm': {
    id: 'skill_infernal_cataclysm',
    name: 'Infernal Cataclysm',
    description: 'Unleashes hellfire on a single foe. Deals extreme damage. If the target is suffering from Burn, grants an Extra Turn.',
    icon: 'Zap',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 5.4,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'EXTRA_TURN',
        chance: 1.0,
        description: 'Grants an extra turn if condition met',
      },
    ],
  },
  'skill_passive_blazing_surge': {
    id: 'skill_passive_blazing_surge',
    name: 'Blazing Surge (Passive)',
    description: 'Increases Critical Rate by 15%. When landing a critical hit, increases own Turn Meter by 20%.',
    icon: 'Sparkles',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.20,
      },
    ],
  },

  // ==========================================
  // TIDEGUARD (Water - Guardian Tank)
  // ==========================================
  'skill_coral_strike': {
    id: 'skill_coral_strike',
    name: 'Coral Strike',
    description: 'Slams a target with a solid coral shield. Damage scales with Max HP. 60% chance to Taunt for 1 turn.',
    icon: 'Shield',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 1.8,
        scalingStat: 'hp',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.60,
        statusEffect: 'TAUNT',
        statusDuration: 1,
      },
    ],
  },
  'skill_tidal_bastion': {
    id: 'skill_tidal_bastion',
    name: 'Tidal Bastion',
    description: 'Envelops all allies in a swirling water barrier. Grants a protective Shield equal to 18% of Tideguard\'s Max HP for 2 turns.',
    icon: 'ShieldCheck',
    cooldown: 4,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'SHIELD',
        multiplier: 0.18,
        scalingStat: 'hp',
        statusDuration: 2,
      },
    ],
  },
  'skill_abyssal_resurgence': {
    id: 'skill_abyssal_resurgence',
    name: 'Abyssal Resurgence',
    description: 'Awakens the depths to recover 30% HP of all allies, and cleanses 1 negative effect from each.',
    icon: 'HeartPulse',
    cooldown: 4,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'HEAL',
        multiplier: 0.30,
        scalingStat: 'hp',
      },
      {
        type: 'CLEANSE',
        dispelCount: 1,
      },
    ],
  },
  'skill_passive_ocean_fortitude': {
    id: 'skill_passive_ocean_fortitude',
    name: 'Ocean Fortitude (Passive)',
    description: 'Reduces all incoming damage to self by 15%. Counterattacks with Coral Strike when critically hit.',
    icon: 'Anchor',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  // ==========================================
  // FLORAWEAVER (Grass - Healer / Support)
  // ==========================================
  'skill_briar_dart': {
    id: 'skill_briar_dart',
    name: 'Briar Dart',
    description: 'Hurls venomous brambles at the target. 70% chance to decrease Speed for 2 turns.',
    icon: 'Feather',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.8,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.70,
        statusEffect: 'SPEED_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_blossom_spring': {
    id: 'skill_blossom_spring',
    name: 'Blossom Spring',
    description: 'Channels verdant life to heal all allies by 28% of Floraweaver\'s Max HP and cleanses 1 debuff from the ally with the lowest HP.',
    icon: 'Sparkle',
    cooldown: 4,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'HEAL',
        multiplier: 0.28,
        scalingStat: 'hp',
      },
      {
        type: 'CLEANSE',
        dispelCount: 1,
      },
    ],
  },
  'skill_sylvan_rejuvenation': {
    id: 'skill_sylvan_rejuvenation',
    name: 'Sylvan Rejuvenation',
    description: 'Removes ALL debuffs from all allies, grants Immunity for 2 turns, and fills all allies\' Turn Meter by 25%.',
    icon: 'HeartHandshake',
    cooldown: 5,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'CLEANSE',
        dispelCount: 99,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'IMMUNITY',
        statusDuration: 2,
      },
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.25,
      },
    ],
  },

  // ==========================================
  // LUMINARY (Light - Speed Controller / Buffer)
  // ==========================================
  'skill_radiant_beam': {
    id: 'skill_radiant_beam',
    name: 'Radiant Beam',
    description: 'Strikes an enemy with piercing celestial light. 75% chance to inflict Blind for 2 turns.',
    icon: 'Sun',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.0,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'BLIND',
        statusDuration: 2,
      },
    ],
  },
  'skill_dawn_chorus': {
    id: 'skill_dawn_chorus',
    name: 'Dawn Chorus',
    description: 'Bestows the vigor of the rising sun upon all allies, increasing Speed for 2 turns and boosting all allies\' Turn Meter by 15%.',
    icon: 'Wind',
    cooldown: 4,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'SPEED_UP',
        statusDuration: 2,
      },
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.15,
      },
    ],
  },
  'skill_celestial_supernova': {
    id: 'skill_celestial_supernova',
    name: 'Celestial Supernova',
    description: 'Summons a blinding orbital flare over all enemies. Deals moderate damage, reduces Turn Meter by 30%, and has a 50% chance to Stun for 1 turn.',
    icon: 'Star',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.2,
        scalingStat: 'attack',
      },
      {
        type: 'TURN_METER_REDUCE',
        turnMeterDelta: -0.30,
        chance: 1.0,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.50,
        statusEffect: 'STUN',
        statusDuration: 1,
      },
    ],
  },

  // ==========================================
  // SHADOWSTALKER (Dark - Assassin / Execute)
  // ==========================================
  'skill_umbral_fang': {
    id: 'skill_umbral_fang',
    name: 'Umbral Fang',
    description: 'Viciously bites the enemy from the dark. Ignores 30% of target Defense if landing a critical hit.',
    icon: 'Moon',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.5,
        scalingStat: 'attack',
      },
    ],
  },
  'skill_nether_shroud': {
    id: 'skill_nether_shroud',
    name: 'Nether Shroud',
    description: 'Slips into the shadows, gaining Stealth, Critical Rate Up, and Double Attack buff for 2 turns, and immediately gains an Extra Turn. While concealed, attacks cannot be countered.',
    icon: 'EyeOff',
    cooldown: 4,
    targetType: 'SELF',
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'STEALTH',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CRIT_RATE_UP',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'DOUBLE_ATTACK',
        statusDuration: 2,
      },
      {
        type: 'EXTRA_TURN',
      },
    ],
  },
  'skill_eclipse_execution': {
    id: 'skill_eclipse_execution',
    name: 'Eclipse Execution',
    description: 'Lethal execution strike on a single foe. Deals immense damage (+50% bonus damage if target HP is below 50%). If this kills the target, resets cooldown immediately.',
    icon: 'Skull',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 6.2,
        scalingStat: 'attack',
      },
      {
        type: 'RESET_COOLDOWN',
        chance: 1.0,
      },
    ],
  },
  'skill_passive_death_prowler': {
    id: 'skill_passive_death_prowler',
    name: 'Death Prowler (Passive)',
    description: 'Increases Critical Damage by 30%. When an enemy dies, gains 50% Turn Meter.',
    icon: 'FlameKindling',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.50,
      },
    ],
  },

  // ==========================================
  // PASSIVES FOR ORIGINAL MONSTERS
  // ==========================================
  'skill_passive_nurturing_grove': {
    id: 'skill_passive_nurturing_grove',
    name: 'Nurturing Grove (Passive)',
    description: 'Increases all outgoing healing by 25%. When taking a turn, cleanses 1 debuff from the most injured ally.',
    icon: 'Heart',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [
      {
        type: 'CLEANSE',
        dispelCount: 1,
      },
    ],
  },
  'skill_passive_dawn_aura': {
    id: 'skill_passive_dawn_aura',
    name: 'Dawn Aura (Passive)',
    description: "Increases all allies' Speed by 12. At the start of combat, grants all allies Attack Up for 1 turn.",
    icon: 'Sun',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'ATTACK_UP',
        statusDuration: 1,
      },
    ],
  },

  // ==========================================
  // 1. PYROSAUR ELEMENTAL VARIANTS
  // ==========================================
  // Glacial Pyrosaur (Water)
  'skill_frost_claws': {
    id: 'skill_frost_claws',
    name: 'Frost Claws',
    description: 'Rakes the foe with razor icicles. 75% chance to inflict Speed Down for 2 turns.',
    icon: 'Snowflake',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.2,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'SPEED_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_glacial_surge': {
    id: 'skill_glacial_surge',
    name: 'Glacial Surge',
    description: 'Sweeps a wave of subzero frost over all enemies. 60% chance to Freeze targets for 1 turn.',
    icon: 'Wind',
    cooldown: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.4,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.60,
        statusEffect: 'FREEZE',
        statusDuration: 1,
      },
    ],
  },
  'skill_subzero_avalanche': {
    id: 'skill_subzero_avalanche',
    name: 'Subzero Avalanche',
    description: 'Shatters an enormous glacier onto a single enemy. Deals extreme damage. If target has Speed Down or Freeze, deals +40% damage.',
    icon: 'ShieldAlert',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 5.2,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.80,
        statusEffect: 'DEFENSE_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_passive_glacial_carapace': {
    id: 'skill_passive_glacial_carapace',
    name: 'Glacial Carapace (Passive)',
    description: 'Reduces all damage taken by 15%. When attacked, 35% chance to reduce attacker’s Turn Meter by 20%.',
    icon: 'Shield',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [
      {
        type: 'TURN_METER_REDUCE',
        turnMeterDelta: -0.20,
      },
    ],
  },

  // Verdant Pyrosaur (Grass)
  'skill_briar_claws': {
    id: 'skill_briar_claws',
    name: 'Briar Claws',
    description: 'Rakes target with thorny vines. Leeches 30% of damage dealt as HP.',
    icon: 'Sparkles',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.1,
        scalingStat: 'attack',
      },
      {
        type: 'HEAL',
        multiplier: 0.30,
        chance: 1.0,
      },
    ],
  },
  'skill_bramble_fissure': {
    id: 'skill_bramble_fissure',
    name: 'Bramble Fissure',
    description: 'Shatters the ground with thorny briars across all enemies. 65% chance to decrease Attack for 2 turns.',
    icon: 'Zap',
    cooldown: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.3,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.65,
        statusEffect: 'ATTACK_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_primeval_canopy': {
    id: 'skill_primeval_canopy',
    name: 'Primeval Canopy',
    description: 'Summons the protective essence of ancient ironwood. Grants all allies Continuous Heal and Defense Up for 2 turns.',
    icon: 'ShieldCheck',
    cooldown: 4,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CONTINUOUS_HEAL',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'DEFENSE_UP',
        statusDuration: 2,
      },
    ],
  },
  'skill_passive_photosynthesis': {
    id: 'skill_passive_photosynthesis',
    name: 'Photosynthesis (Passive)',
    description: 'Restores 10% max HP at the start of each turn. Increases Base Defense by 20%.',
    icon: 'Sun',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [
      {
        type: 'HEAL',
        multiplier: 0.10,
      },
    ],
  },

  // ==========================================
  // 2. TIDEGUARD ELEMENTAL VARIANTS
  // ==========================================
  // Magma Tideguard (Fire)
  'skill_molten_slam': {
    id: 'skill_molten_slam',
    name: 'Molten Slam',
    description: 'Strikes target with superheated obsidian. Damage scales with Defense. 75% chance to Burn for 2 turns.',
    icon: 'Flame',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.9,
        scalingStat: 'defense',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 2,
      },
    ],
  },
  'skill_volcanic_carapace': {
    id: 'skill_volcanic_carapace',
    name: 'Volcanic Carapace',
    description: 'Erects a magma shield over all allies (20% max HP) and increases Defense for 2 turns.',
    icon: 'ShieldAlert',
    cooldown: 3,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'SHIELD',
        multiplier: 0.20,
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'DEFENSE_UP',
        statusDuration: 2,
      },
    ],
  },
  'skill_magma_eruption': {
    id: 'skill_magma_eruption',
    name: 'Magma Eruption',
    description: 'Detonates living lava vents across all enemies. Inflicts Taunt and Burn for 2 turns.',
    icon: 'Flame',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.5,
        scalingStat: 'defense',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'TAUNT',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.85,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 2,
      },
    ],
  },
  'skill_passive_thermal_retaliation': {
    id: 'skill_passive_thermal_retaliation',
    name: 'Thermal Retaliation (Passive)',
    description: 'When attacked, has an 80% chance to inflict Continuous Damage (Burn) on the attacker for 2 turns.',
    icon: 'Flame',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 0.80,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 2,
      },
    ],
  },

  // Prismatic Tideguard (Light)
  'skill_prismatic_bash': {
    id: 'skill_prismatic_bash',
    name: 'Prismatic Bash',
    description: 'Slams with dazzling nacre. Damage scales with Defense. 75% chance to Blind for 2 turns.',
    icon: 'SunMedium',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.8,
        scalingStat: 'defense',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'BLIND',
        statusDuration: 2,
      },
    ],
  },
  'skill_radiant_citadel': {
    id: 'skill_radiant_citadel',
    name: 'Radiant Citadel',
    description: 'Shields all allies with celestial barrier. Grants Defense Up and Immunity for 2 turns.',
    icon: 'ShieldCheck',
    cooldown: 3,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'DEFENSE_UP',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'IMMUNITY',
        statusDuration: 2,
      },
    ],
  },
  'skill_aegis_of_dawn': {
    id: 'skill_aegis_of_dawn',
    name: 'Aegis of Dawn',
    description: 'Unfurls the sacred dawn shell. Heals all allies for 30% max HP and cleanses all debuffs.',
    icon: 'Sparkles',
    cooldown: 4,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'HEAL',
        multiplier: 0.30,
      },
      {
        type: 'CLEANSE',
        dispelCount: 99,
      },
    ],
  },
  'skill_passive_luminous_shell': {
    id: 'skill_passive_luminous_shell',
    name: 'Luminous Shell (Passive)',
    description: 'Allies take 20% reduced critical hit damage while Tideguard Sunshell is active on the field.',
    icon: 'Shield',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  // ==========================================
  // 3. FLORAWEAVER ELEMENTAL VARIANTS
  // ==========================================
  // Lotus Floraweaver (Water)
  'skill_aqua_blossom': {
    id: 'skill_aqua_blossom',
    name: 'Aqua Blossom',
    description: 'Fires swirling water lotus petals. 75% chance to reduce target’s Turn Meter by 25%.',
    icon: 'Droplets',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.0,
        scalingStat: 'attack',
      },
      {
        type: 'TURN_METER_REDUCE',
        turnMeterDelta: -0.25,
        chance: 0.75,
      },
    ],
  },
  'skill_tidal_grace': {
    id: 'skill_tidal_grace',
    name: 'Tidal Grace',
    description: 'Pure spring waters cleanse 2 debuffs from all allies, granting Continuous Heal and Speed Up for 2 turns.',
    icon: 'Heart',
    cooldown: 3,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'CLEANSE',
        dispelCount: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CONTINUOUS_HEAL',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'SPEED_UP',
        statusDuration: 2,
      },
    ],
  },
  'skill_oceanic_metamorphosis': {
    id: 'skill_oceanic_metamorphosis',
    name: 'Oceanic Metamorphosis',
    description: 'Floods the field with regenerative tides. Heals all allies for 40% max HP and boosts their Turn Meter by 25%.',
    icon: 'Sparkles',
    cooldown: 4,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'HEAL',
        multiplier: 0.40,
      },
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.25,
      },
    ],
  },
  'skill_passive_tears_of_naiad': {
    id: 'skill_passive_tears_of_naiad',
    name: 'Tears of the Naiad (Passive)',
    description: 'When any ally falls below 40% HP, Floraweaver immediately grants them a 25% Shield for 2 turns.',
    icon: 'Shield',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [
      {
        type: 'SHIELD',
        multiplier: 0.25,
        statusDuration: 2,
      },
    ],
  },

  // Nightshade Floraweaver (Dark)
  'skill_thorn_despair': {
    id: 'skill_thorn_despair',
    name: 'Thorn of Despair',
    description: 'Fires cursed belladonna needles. 75% chance to inflict Continuous Damage and Speed Down for 2 turns.',
    icon: 'Skull',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.2,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'SPEED_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_wither_bloom': {
    id: 'skill_wither_bloom',
    name: 'Wither Bloom',
    description: 'Scatters poisonous spores over all enemies. Inflicts Attack Down and Silence for 2 turns.',
    icon: 'Wind',
    cooldown: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.2,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.70,
        statusEffect: 'ATTACK_DOWN',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.60,
        statusEffect: 'SILENCE',
        statusDuration: 2,
      },
    ],
  },
  'skill_grave_lotus': {
    id: 'skill_grave_lotus',
    name: 'Grave Lotus',
    description: 'Erupts black petals across all foes (3.8x Attack). 75% chance to Stun targets suffering from debuffs for 1 turn.',
    icon: 'FlameKindling',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.8,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'STUN',
        statusDuration: 1,
      },
    ],
  },
  'skill_passive_miasma_aura': {
    id: 'skill_passive_miasma_aura',
    name: 'Miasma Aura (Passive)',
    description: 'Enemies afflicted with debuffs deal 20% less damage and take 20% more damage from all sources.',
    icon: 'Skull',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  // ==========================================
  // 4. LUMINARY ELEMENTAL VARIANTS
  // ==========================================
  // Solar Flare Luminary (Fire)
  'skill_searing_flare': {
    id: 'skill_searing_flare',
    name: 'Searing Flare',
    description: 'Concentrates intense coronal fire onto target. 75% chance to inflict Defense Down for 2 turns.',
    icon: 'Sun',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.3,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'DEFENSE_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_prominence_surge': {
    id: 'skill_prominence_surge',
    name: 'Prominence Surge',
    description: 'Empowers all allies with Solar Wrath, granting Attack Up and Crit Rate Up for 2 turns.',
    icon: 'Flame',
    cooldown: 3,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'ATTACK_UP',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CRIT_RATE_UP',
        statusDuration: 2,
      },
    ],
  },
  'skill_coronal_nova': {
    id: 'skill_coronal_nova',
    name: 'Coronal Nova',
    description: 'Detonates a stellar supernova across all enemies. Deals immense damage and 75% chance to inflict Stun and Burn for 1 turn.',
    icon: 'Zap',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 4.0,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'STUN',
        statusDuration: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.85,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 2,
      },
    ],
  },
  'skill_passive_solar_radiance': {
    id: 'skill_passive_solar_radiance',
    name: 'Solar Radiance (Passive)',
    description: 'While HP is above 75%, gains +25% Critical Damage and +15 Base Speed.',
    icon: 'SunMedium',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  // Eclipse Luminary (Dark)
  'skill_shadow_pulsar': {
    id: 'skill_shadow_pulsar',
    name: 'Shadow Pulsar',
    description: 'Discharges gravitational pulses into the foe. 75% chance to reduce Turn Meter by 20%.',
    icon: 'Moon',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.2,
        scalingStat: 'attack',
      },
      {
        type: 'TURN_METER_REDUCE',
        turnMeterDelta: -0.20,
        chance: 0.75,
      },
    ],
  },
  'skill_event_horizon': {
    id: 'skill_event_horizon',
    name: 'Event Horizon',
    description: 'Bends space-time: reduces enemy team Turn Meter by 30% while increasing own team Turn Meter by 20%.',
    icon: 'EyeOff',
    cooldown: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'TURN_METER_REDUCE',
        turnMeterDelta: -0.30,
        chance: 1.0,
      },
    ],
  },
  'skill_black_hole_singularity': {
    id: 'skill_black_hole_singularity',
    name: 'Black Hole Singularity',
    description: 'Collapses cosmic dark matter over all foes. 75% chance to Stun and Blind for 2 turns.',
    icon: 'Skull',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.5,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'STUN',
        statusDuration: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'BLIND',
        statusDuration: 2,
      },
    ],
  },
  'skill_passive_gravitational_pull': {
    id: 'skill_passive_gravitational_pull',
    name: 'Gravitational Pull (Passive)',
    description: 'At the start of each turn, steals 10% Turn Meter from the enemy with the highest Turn Meter.',
    icon: 'Star',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.10,
      },
    ],
  },

  // ==========================================
  // 5. SHADOWSTALKER ELEMENTAL VARIANTS
  // ==========================================
  // Infernal Shadowstalker (Fire)
  'skill_blazing_rake': {
    id: 'skill_blazing_rake',
    name: 'Blazing Rake',
    description: 'Slashes with incandescent fire talons. Has a 40% chance to attack twice!',
    icon: 'Flame',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.2,
        scalingStat: 'attack',
      },
      {
        type: 'DOUBLE_ATTACK',
        chance: 0.40,
        description: '40% chance to attack twice',
      },
    ],
  },
  'skill_crimson_frenzy': {
    id: 'skill_crimson_frenzy',
    name: 'Crimson Frenzy',
    description: 'Enters a bloodthirsty frenzy. Deals 3.5x Attack damage with a 50% chance to attack twice, and gains Attack Up and Speed Up for 2 turns.',
    icon: 'FlameKindling',
    cooldown: 3,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.5,
        scalingStat: 'attack',
      },
      {
        type: 'DOUBLE_ATTACK',
        chance: 0.50,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'ATTACK_UP',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'SPEED_UP',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'DOUBLE_ATTACK',
        statusDuration: 2,
      },
    ],
  },
  'skill_hellfire_prowl': {
    id: 'skill_hellfire_prowl',
    name: 'Hellfire Prowl',
    description: 'Vanishes in sparks and eviscerates target (6.2x Attack). Has a 50% chance to attack twice! Resets cooldown on lethal kill.',
    icon: 'Skull',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 6.2,
        scalingStat: 'attack',
      },
      {
        type: 'DOUBLE_ATTACK',
        chance: 0.50,
      },
      {
        type: 'RESET_COOLDOWN',
        chance: 1.0,
      },
    ],
  },
  'skill_passive_blood_scent': {
    id: 'skill_passive_blood_scent',
    name: 'Blood Scent (Passive)',
    description: 'Increases Attack by 30% against targets below 50% HP. All attacks have an innate 30% chance to attack twice.',
    icon: 'Flame',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [
      {
        type: 'DOUBLE_ATTACK',
        chance: 0.30,
      },
    ],
  },

  // Tidal Shadowstalker (Water)
  'skill_frost_fang': {
    id: 'skill_frost_fang',
    name: 'Frost Fang',
    description: 'Bites with freezing fangs. 75% chance to inflict Speed Down for 2 turns. Has a 40% chance to attack twice!',
    icon: 'Snowflake',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.2,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'SPEED_DOWN',
        statusDuration: 2,
      },
      {
        type: 'DOUBLE_ATTACK',
        chance: 0.40,
      },
    ],
  },
  'skill_mirage_cloak': {
    id: 'skill_mirage_cloak',
    name: 'Mirage Cloak',
    description: 'Dissolves into tidal mist, gaining Stealth and Speed Up for 2 turns. While active, attacks have a 50% chance to attack twice.',
    icon: 'Droplets',
    cooldown: 3,
    targetType: 'SELF',
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'STEALTH',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'SPEED_UP',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'DOUBLE_ATTACK',
        statusDuration: 2,
      },
      {
        type: 'DOUBLE_ATTACK',
        chance: 0.50,
      },
    ],
  },
  'skill_tidal_assassination': {
    id: 'skill_tidal_assassination',
    name: 'Tidal Assassination',
    description: 'Strikes through watery reflections with lethal force (5.8x Attack). Freezes target for 1 turn and has a 50% chance to attack twice!',
    icon: 'Zap',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 5.8,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.85,
        statusEffect: 'FREEZE',
        statusDuration: 1,
      },
      {
        type: 'DOUBLE_ATTACK',
        chance: 0.50,
      },
    ],
  },
  'skill_passive_evasive_hunter': {
    id: 'skill_passive_evasive_hunter',
    name: 'Evasive Hunter (Passive)',
    description: 'Increases Evasion by 25%. Attacks have an innate 30% chance to attack twice!',
    icon: 'Wind',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [
      {
        type: 'DOUBLE_ATTACK',
        chance: 0.30,
      },
    ],
  },

  // ==========================================
  // LIGHT PYROSAUR (Solar Wyrm - Radiance & Speed)
  // ==========================================
  'skill_solar_claw': {
    id: 'skill_solar_claw',
    name: 'Solar Claw',
    description: 'Rakes the foe with radiant light (3.2x Attack). 60% chance to reduce target’s Turn Meter by 15% and advance self Turn Meter by 15%.',
    icon: 'Sun',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.2,
        scalingStat: 'attack',
      },
      {
        type: 'TURN_METER_REDUCE',
        chance: 0.60,
        turnMeterDelta: -0.15,
      },
      {
        type: 'TURN_METER_BOOST',
        chance: 1.0,
        turnMeterDelta: 0.15,
      },
    ],
  },
  'skill_radiant_roar': {
    id: 'skill_radiant_roar',
    name: 'Radiant Roar',
    description: 'Releases a brilliant battle roar. Cleanses 1 debuff from all allies and grants Attack Up and Speed Up for 2 turns.',
    icon: 'Sparkles',
    cooldown: 3,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'CLEANSE',
        dispelCount: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'ATTACK_UP',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'SPEED_UP',
        statusDuration: 2,
      },
    ],
  },
  'skill_supernova_fissure': {
    id: 'skill_supernova_fissure',
    name: 'Supernova Fissure',
    description: 'Shatters the battlefield with blinding solar plasma (3.5x Attack) across all enemies. Dispels 1 buff and applies Defense Down for 2 turns.',
    icon: 'SunMedium',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.5,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.80,
        statusEffect: 'DEFENSE_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_passive_dawn_fervor': {
    id: 'skill_passive_dawn_fervor',
    name: 'Dawn Fervor (Passive)',
    description: 'Increases Crit Rate by 15%. Critical strikes have a 40% chance to immediately attack twice!',
    icon: 'Award',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [
      {
        type: 'DOUBLE_ATTACK',
        chance: 0.40,
      },
    ],
  },

  // ==========================================
  // DARK PYROSAUR (Abyssal Wyrm - Brutal Bleed & Frenzy)
  // ==========================================
  'skill_abyssal_bite': {
    id: 'skill_abyssal_bite',
    name: 'Abyssal Bite',
    description: 'Crushes target with void-infused jaws (3.3x Attack). 75% chance to inflict Continuous Damage (Bleed) for 2 turns.',
    icon: 'Moon',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.3,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 2,
      },
    ],
  },
  'skill_dusk_frenzy': {
    id: 'skill_dusk_frenzy',
    name: 'Dusk Frenzy',
    description: 'Surges with abyssal ferocity (3.4x Attack). Gains Double Attack and Crit Rate Up for 2 turns and strikes with a 50% chance to attack twice!',
    icon: 'Flame',
    cooldown: 3,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.4,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'DOUBLE_ATTACK',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CRIT_RATE_UP',
        statusDuration: 2,
      },
      {
        type: 'DOUBLE_ATTACK',
        chance: 0.50,
      },
    ],
  },
  'skill_void_annihilation': {
    id: 'skill_void_annihilation',
    name: 'Void Annihilation',
    description: 'Erupts black volcanic magma beneath all enemies (3.8x Attack). 80% chance to inflict Continuous Damage and Attack Down for 2 turns.',
    icon: 'Skull',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.8,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.80,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.70,
        statusEffect: 'ATTACK_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_passive_umbral_voracity': {
    id: 'skill_passive_umbral_voracity',
    name: 'Umbral Voracity (Passive)',
    description: 'Attacks deal 25% bonus damage to afflicted enemies and have a 35% chance to attack twice!',
    icon: 'Zap',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [
      {
        type: 'DOUBLE_ATTACK',
        chance: 0.35,
      },
    ],
  },

  // ==========================================
  // TIDEGUARD (Grass & Dark)
  // ==========================================
  'skill_root_strike': {
    id: 'skill_root_strike',
    name: 'Root Strike',
    description: 'Slams the target with petrified ironwood carapace. Damage scales with Max HP. 60% chance to decrease Speed for 2 turns.',
    icon: 'Shield',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 1.8,
        scalingStat: 'hp',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.60,
        statusEffect: 'SPEED_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_verdant_bulwark': {
    id: 'skill_verdant_bulwark',
    name: 'Verdant Bulwark',
    description: 'Roots firmly into the earth, gaining a massive personal Shield equal to 25% of Max HP and Taunting the target for 1 turn.',
    icon: 'ShieldCheck',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'SHIELD',
        multiplier: 0.25,
        scalingStat: 'hp',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'TAUNT',
        statusDuration: 1,
      },
    ],
  },
  'skill_ironwood_entangle': {
    id: 'skill_ironwood_entangle',
    name: 'Ironwood Entangle',
    description: 'Summons subterranean mangrove roots beneath all enemies. Damage scales with Max HP. Reduces all enemy Turn Meters by 25%.',
    icon: 'Anchor',
    cooldown: 5,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 1.9,
        scalingStat: 'hp',
        hits: 1,
      },
      {
        type: 'TURN_METER_REDUCE',
        turnMeterDelta: -0.25,
        chance: 1.0,
      },
    ],
  },

  'skill_abyssal_crush': {
    id: 'skill_abyssal_crush',
    name: 'Abyssal Crush',
    description: 'Crushes the foe under the tremendous pressure of the deep sea. Damage scales with Max HP. 60% chance to decrease Attack for 2 turns.',
    icon: 'Shield',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 1.8,
        scalingStat: 'hp',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.60,
        statusEffect: 'ATTACK_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_trench_retribution': {
    id: 'skill_trench_retribution',
    name: 'Trench Retribution',
    description: 'Radiates oppressive abyssal pressure. Taunts the enemy with highest Attack for 2 turns and generates a 20% Max HP personal Shield.',
    icon: 'Anchor',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'SHIELD',
        multiplier: 0.20,
        scalingStat: 'hp',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'TAUNT',
        statusDuration: 2,
      },
    ],
  },
  'skill_void_maelstrom': {
    id: 'skill_void_maelstrom',
    name: 'Void Maelstrom',
    description: 'Unleashes an abyssal whirlpool (2.0x HP). 70% chance to decrease Defense of all enemies for 2 turns.',
    icon: 'Zap',
    cooldown: 5,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.0,
        scalingStat: 'hp',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.70,
        statusEffect: 'DEFENSE_DOWN',
        statusDuration: 2,
      },
    ],
  },

  // ==========================================
  // FLORAWEAVER (Fire & Light)
  // ==========================================
  'skill_ember_pollen': {
    id: 'skill_ember_pollen',
    name: 'Ember Pollen',
    description: 'Blows combustible pollen into enemy lines. 75% chance to inflict Continuous Damage (Burn) for 2 turns.',
    icon: 'Flame',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.9,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 2,
      },
    ],
  },
  'skill_cauterize_bloom': {
    id: 'skill_cauterize_bloom',
    name: 'Cauterize Bloom',
    description: 'Infuses thermal pollen into the most wounded ally. Cleanses 1 negative effect and heals for 32% of Floraweaver\'s Max HP.',
    icon: 'HeartPulse',
    cooldown: 4,
    targetType: 'SINGLE_ALLY',
    effects: [
      {
        type: 'CLEANSE',
        dispelCount: 1,
      },
      {
        type: 'HEAL',
        multiplier: 0.32,
        scalingStat: 'hp',
      },
    ],
  },
  'skill_pyre_rebirth': {
    id: 'skill_pyre_rebirth',
    name: 'Pyre Rebirth',
    description: 'Blesses all allies with solar flames. Heals all allies for 20% Max HP and grants Attack Up to the highest damage dealer for 2 turns.',
    icon: 'Sparkles',
    cooldown: 5,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'HEAL',
        multiplier: 0.20,
        scalingStat: 'hp',
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'ATTACK_UP',
        statusDuration: 2,
      },
    ],
  },

  'skill_sunpetal_flash': {
    id: 'skill_sunpetal_flash',
    name: 'Sunpetal Flash',
    description: 'Blinds the enemy with concentrated celestial sunlight. 65% chance to inflict Blind for 2 turns.',
    icon: 'Sun',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.8,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.65,
        statusEffect: 'BLIND',
        statusDuration: 2,
      },
    ],
  },
  'skill_morning_dew_grace': {
    id: 'skill_morning_dew_grace',
    name: 'Morning Dew Grace',
    description: 'Bathes all allies in celestial dawn dew, recovering 24% of Floraweaver\'s Max HP and cleansing 1 harmful effect from each ally.',
    icon: 'HeartHandshake',
    cooldown: 4,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'HEAL',
        multiplier: 0.24,
        scalingStat: 'hp',
      },
      {
        type: 'CLEANSE',
        dispelCount: 1,
      },
    ],
  },
  'skill_halo_sanctuary': {
    id: 'skill_halo_sanctuary',
    name: 'Halo Sanctuary',
    description: 'Erects a pristine holy sanctuary over all allies, granting Immunity to all debuffs for 2 turns.',
    icon: 'Sparkle',
    cooldown: 5,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'IMMUNITY',
        statusDuration: 2,
      },
    ],
  },

  // ==========================================
  // LUMINARY (Water & Grass)
  // ==========================================
  'skill_tide_pulse': {
    id: 'skill_tide_pulse',
    name: 'Tide Pulse',
    description: 'Shoots a focused gravitational water burst. 70% chance to reduce target\'s Turn Meter by 20%.',
    icon: 'Droplets',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.1,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'TURN_METER_REDUCE',
        turnMeterDelta: -0.20,
        chance: 0.70,
      },
    ],
  },
  'skill_astral_deluge': {
    id: 'skill_astral_deluge',
    name: 'Astral Deluge',
    description: 'Summons an astral torrent across all enemies (2.4x Attack). 65% chance to decrease Speed for 2 turns.',
    icon: 'Wind',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.4,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.65,
        statusEffect: 'SPEED_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_cosmic_freeze': {
    id: 'skill_cosmic_freeze',
    name: 'Cosmic Freeze',
    description: 'Condenses deep space absolute zero on a primary target, inflicting Freeze for 1 turn and pushing back all enemy Turn Meters by 20%.',
    icon: 'Star',
    cooldown: 5,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 4.2,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'FREEZE',
        statusDuration: 1,
      },
    ],
  },

  'skill_solar_thorns': {
    id: 'skill_solar_thorns',
    name: 'Solar Thorns',
    description: 'Conjures sharpened solar thorns. 65% chance to decrease target\'s Defense for 2 turns.',
    icon: 'Feather',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.0,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.65,
        statusEffect: 'DEFENSE_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_leyline_haste': {
    id: 'skill_leyline_haste',
    name: 'Leyline Haste',
    description: 'Channels nature\'s pulse into all allies, boosting Turn Meter by 20% and granting Speed Up for 2 turns.',
    icon: 'Wind',
    cooldown: 4,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.20,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'SPEED_UP',
        statusDuration: 2,
      },
    ],
  },
  'skill_vernal_convergence': {
    id: 'skill_vernal_convergence',
    name: 'Vernal Convergence',
    description: 'Calls upon verdant celestial leylines to purge all positive effects from all enemies and deal 2.5x Attack damage.',
    icon: 'SunMedium',
    cooldown: 5,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.5,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'DISPEL',
        dispelCount: 99,
        chance: 1.0,
      },
    ],
  },

  // ==========================================
  // SHADOWSTALKER (Umbral Grass & Phantom Light)
  // ==========================================
  'skill_toxic_talon': {
    id: 'skill_toxic_talon',
    name: 'Toxic Talon',
    description: 'Slashes the target with venomous shadow claws. Ignores 25% of Defense and has a 75% chance to inflict Poison (Burn/DoT) for 2 turns.',
    icon: 'Moon',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.4,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 2,
      },
    ],
  },
  'skill_bramble_ambush': {
    id: 'skill_bramble_ambush',
    name: 'Bramble Ambush',
    description: 'Lurks in poisonous brambles, dealing massive damage (4.5x Attack) to an enemy and gaining Stealth for 1 turn. Deals 35% more damage if target is below 50% HP.',
    icon: 'EyeOff',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 4.5,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'STEALTH',
        statusDuration: 1,
      },
    ],
  },
  'skill_fatal_entangle': {
    id: 'skill_fatal_entangle',
    name: 'Fatal Entangle',
    description: 'Strikes down the foe with umbral thorny vines (5.6x Attack). If this attack eliminates the enemy, grants an immediate Extra Turn.',
    icon: 'Skull',
    cooldown: 5,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 5.6,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'EXTRA_TURN',
        chance: 1.0,
      },
    ],
  },

  'skill_spectral_rend': {
    id: 'skill_spectral_rend',
    name: 'Spectral Rend',
    description: 'Strikes from the prism plane with blinding speed. 70% chance to inflict Blind for 2 turns.',
    icon: 'Moon',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.3,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.70,
        statusEffect: 'BLIND',
        statusDuration: 2,
      },
    ],
  },
  'skill_phantom_flicker': {
    id: 'skill_phantom_flicker',
    name: 'Phantom Flicker',
    description: 'Flickers across the light spectrum, striking an enemy (4.4x Attack) with a guaranteed Critical Hit and gaining Stealth for 1 turn.',
    icon: 'EyeOff',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 4.4,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'STEALTH',
        statusDuration: 1,
      },
    ],
  },
  'skill_prism_execution': {
    id: 'skill_prism_execution',
    name: 'Prism Execution',
    description: 'Bypasses barriers to deliver a fatal light-speed strike (5.8x Attack). If the target is slain, resets all skill cooldowns and gains an Extra Turn.',
    icon: 'Zap',
    cooldown: 5,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 5.8,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'EXTRA_TURN',
        chance: 1.0,
      },
    ],
  },

  // ==========================================
  // CONTINENT CHAPTER BOSS OVERLORD SKILLS
  // ==========================================

  // CHAPTER 1 (1-10): Ignis Sovereign (Fire)
  'skill_boss_ignis_claw': {
    id: 'skill_boss_ignis_claw',
    name: 'Searing Sovereign Claw',
    description: 'Slits the foe with cataclysmic volcanic claws. 100% chance to inflict Continuous Burn for 2 turns.',
    icon: 'Flame',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.8,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 2,
        description: 'Inflicts Burn DoT (5% max HP per turn)',
      },
    ],
  },
  'skill_boss_caldera_eruption': {
    id: 'skill_boss_caldera_eruption',
    name: 'Caldera Core Eruption',
    description: 'Detonates the volcanic magma chamber across all enemies, with an 80% chance to reduce Defense for 2 turns.',
    icon: 'SunMedium',
    cooldown: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.2,
        scalingStat: 'attack',
        hits: 3,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.8,
        statusEffect: 'DEFENSE_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_boss_magma_wrath': {
    id: 'skill_boss_magma_wrath',
    name: 'Magma Sovereign Wrath',
    description: 'Unleashes the molten caldera fury upon all enemies. Inflicts Stun for 1 turn and incinerates surviving foes.',
    icon: 'Flame',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 4.5,
        scalingStat: 'attack',
        hits: 4,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.6,
        statusEffect: 'STUN',
        statusDuration: 1,
      },
    ],
  },
  'skill_passive_ignis_mantle': {
    id: 'skill_passive_ignis_mantle',
    name: 'Sovereign Magma Mantle',
    description: 'Passive: Immune to Freeze effects. Retaliates against attackers when struck, burning with primordial heat.',
    icon: 'ShieldAlert',
    cooldown: 0,
    targetType: 'SELF',
    effects: [],
  },

  // CHAPTER 2 (2-10): Leviathan Sovereign (Water)
  'skill_boss_tidal_crush': {
    id: 'skill_boss_tidal_crush',
    name: 'Tidal Sovereign Slam',
    description: 'Slams the target with hydrostatic force proportional to Defense. Reduces target Turn Meter by 30%.',
    icon: 'Droplet',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.6,
        scalingStat: 'defense',
        hits: 1,
      },
      {
        type: 'TURN_METER_REDUCE',
        turnMeterDelta: -0.3,
      },
    ],
  },
  'skill_boss_tsunami_surge': {
    id: 'skill_boss_tsunami_surge',
    name: 'Primordial Tsunami Surge',
    description: 'Calls forth a colossal tidal wave across all enemies with a 65% chance to Freeze targets for 1 turn.',
    icon: 'Waves',
    cooldown: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.4,
        scalingStat: 'defense',
        hits: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.65,
        statusEffect: 'FREEZE',
        statusDuration: 1,
      },
    ],
  },
  'skill_boss_abyssal_citadel': {
    id: 'skill_boss_abyssal_citadel',
    name: 'Abyssal Fortress Aegis',
    description: 'Dispels all debuffs from all allies and shields the entire team with an impenetrable pressure barrier for 2 turns.',
    icon: 'Shield',
    cooldown: 4,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'CLEANSE',
        dispelCount: 99,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'SHIELD',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'DEFENSE_UP',
        statusDuration: 2,
      },
    ],
  },
  'skill_passive_leviathan_carapace': {
    id: 'skill_passive_leviathan_carapace',
    name: 'Primordial Reef Carapace',
    description: 'Passive: Reduces incoming critical hit damage by 40% and raises team Defense by 20%.',
    icon: 'ShieldCheck',
    cooldown: 0,
    targetType: 'SELF',
    effects: [],
  },

  // CHAPTER 3 (3-10): Yggdrasil Ancient (Grass)
  'skill_boss_leyline_whip': {
    id: 'skill_boss_leyline_whip',
    name: 'Leyline Briar Lash',
    description: 'Strikes an enemy with primeval thorny vines, absorbing 25% of their Turn Meter and recovering HP.',
    icon: 'Leaf',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.5,
        scalingStat: 'hp',
        hits: 2,
      },
      {
        type: 'TURN_METER_REDUCE',
        turnMeterDelta: -0.25,
      },
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.25,
      },
    ],
  },
  'skill_boss_worldtree_rejuvenation': {
    id: 'skill_boss_worldtree_rejuvenation',
    name: 'World Tree Rejuvenation',
    description: 'Bathes all allies in primal life essence, healing 35% of max HP and applying Continuous Recovery for 2 turns.',
    icon: 'Heart',
    cooldown: 3,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'HEAL',
        multiplier: 0.35,
        scalingStat: 'hp',
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CONTINUOUS_HEAL',
        statusDuration: 2,
      },
    ],
  },
  'skill_boss_ironbark_wrath': {
    id: 'skill_boss_ironbark_wrath',
    name: 'Ironbark Primeval Entangle',
    description: 'Roots all foes with razor-sharp ironwood thorns. Inflicts Continuous Poison DoT and 70% chance to Silence.',
    icon: 'Sparkles',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.8,
        scalingStat: 'hp',
        hits: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 3,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.7,
        statusEffect: 'SILENCE',
        statusDuration: 2,
      },
    ],
  },
  'skill_passive_worldtree_roots': {
    id: 'skill_passive_worldtree_roots',
    name: 'Heartwood Vitality',
    description: 'Passive: At the start of each turn, purges 1 random debuff from all allies and restores 5% HP.',
    icon: 'HeartPulse',
    cooldown: 0,
    targetType: 'SELF',
    effects: [],
  },

  // CHAPTER 4 (4-10): Solar Archon (Light)
  'skill_boss_celestial_lance': {
    id: 'skill_boss_celestial_lance',
    name: 'Celestial Lance of Dawn',
    description: 'Impales the enemy with a beam of concentrated solar energy, with an 85% chance to Blind for 2 turns.',
    icon: 'Sun',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.9,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.85,
        statusEffect: 'BLIND',
        statusDuration: 2,
      },
    ],
  },
  'skill_boss_supernova_judgment': {
    id: 'skill_boss_supernova_judgment',
    name: 'Supernova Prismatic Burst',
    description: 'Unleashes stellar nuclear brilliance across all enemies. Dispels 2 positive buffs and reduces Attack Power.',
    icon: 'Zap',
    cooldown: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.6,
        scalingStat: 'attack',
        hits: 3,
      },
      {
        type: 'DISPEL',
        dispelCount: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'ATTACK_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_boss_dawn_ascension': {
    id: 'skill_boss_dawn_ascension',
    name: 'Chrono Dawn Ascension',
    description: 'Ascends all allies with celestial velocity. Increases Turn Meter by 35% and grants Attack Up and Speed Up for 2 turns.',
    icon: 'Activity',
    cooldown: 4,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.35,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'ATTACK_UP',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'SPEED_UP',
        statusDuration: 2,
      },
    ],
  },
  'skill_passive_archon_radiance': {
    id: 'skill_passive_archon_radiance',
    name: 'Radiant Archon Aura',
    description: 'Passive: Elevates team Speed by +15% and guarantees all allies gain immunity to Sleep and Stun.',
    icon: 'SunDim',
    cooldown: 0,
    targetType: 'SELF',
    effects: [],
  },

  // CHAPTER 5 (5-10): Void Sovereign (Dark)
  'skill_boss_singularity_rend': {
    id: 'skill_boss_singularity_rend',
    name: 'Singularity Spatial Rend',
    description: 'Tears through dimensional spacetime to strike an enemy with lethal dark velocity. Applies severe Bleed DoT.',
    icon: 'Moon',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 4.2,
        scalingStat: 'attack',
        hits: 3,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 2,
      },
    ],
  },
  'skill_boss_event_horizon': {
    id: 'skill_boss_event_horizon',
    name: 'Event Horizon Implosion',
    description: 'Collapses the abyssal singularity across all enemies. Stuns targets for 1 turn and strips 50% Turn Meter.',
    icon: 'Disc',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 4.0,
        scalingStat: 'attack',
        hits: 4,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'STUN',
        statusDuration: 1,
      },
      {
        type: 'TURN_METER_REDUCE',
        turnMeterDelta: -0.5,
      },
    ],
  },
  'skill_boss_void_execution': {
    id: 'skill_boss_void_execution',
    name: 'Apocalyptic Execution',
    description: 'Delivers a catastrophic blow (6.5x Attack). If the target is eliminated, resets cooldown and gains an Extra Turn.',
    icon: 'Skull',
    cooldown: 5,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 6.5,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'EXTRA_TURN',
        chance: 1.0,
      },
    ],
  },
  'skill_passive_void_singularity': {
    id: 'skill_passive_void_singularity',
    name: 'Singularity Anchor',
    description: 'Passive: Negates fatal damage once per battle, retaining 1 HP, entering Stealth, and gaining 100% Turn Meter.',
    icon: 'Crosshair',
    cooldown: 0,
    targetType: 'SELF',
    effects: [],
  },

  // ==========================================
  // EQUIPMENT & WEAPON DUNGEON BOSS SKILLS
  // ==========================================

  // 1. WEAPON DUNGEON BOSS: Ignis Blade-Tyrant (Inflicts massive Continuous Damage DoT debuffs)
  'skill_boss_blade_cauterize': {
    id: 'skill_boss_blade_cauterize',
    name: 'Searing Sunder Cleave',
    description: 'Strikes an enemy with an incandescent blade. Deals heavy damage and inflicts 2 stacks of Continuous Damage (Burn) for 3 turns.',
    icon: 'Flame',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.5,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 3,
        description: 'Burn stack 1 (5% max HP / turn)',
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 3,
        description: 'Burn stack 2 (5% max HP / turn)',
      },
    ],
  },
  'skill_boss_infernal_brand': {
    id: 'skill_boss_infernal_brand',
    name: 'Infernal Ash Cataclysm',
    description: 'Sweeps an infernal molten wave across ALL enemies. Inflicts 2 stacks of Continuous Damage (Burn) to every foe for 3 turns.',
    icon: 'Flame',
    cooldown: 2,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.8,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 3,
        description: 'Party-wide burn DoT stack 1',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.85,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 3,
        description: 'Party-wide burn DoT stack 2',
      },
    ],
  },
  'skill_boss_ignite_wounds': {
    id: 'skill_boss_ignite_wounds',
    name: 'Molten Core Detonation',
    description: 'Detonates burning slag across all enemies, applying additional Continuous Damage and lowering enemy resistance.',
    icon: 'Zap',
    cooldown: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.2,
        scalingStat: 'attack',
        hits: 3,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 3,
      },
    ],
  },

  // 2. ARMOR DUNGEON BOSS: Aegis Colossus (Debuffs Attack and Defense)
  'skill_boss_armor_sunder': {
    id: 'skill_boss_armor_sunder',
    name: 'Crushing Armor Sunder',
    description: 'Slams the earth with titanic basalt fists, shattering formations. Inflicts Attack Down (-50%) and Defense Down (-70%) on all enemies for 2 turns.',
    icon: 'ShieldAlert',
    cooldown: 2,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.6,
        scalingStat: 'defense',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'ATTACK_DOWN',
        statusDuration: 2,
        description: 'Reduces enemy Attack by 50%',
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'DEFENSE_DOWN',
        statusDuration: 2,
        description: 'Reduces enemy Defense by 70%',
      },
    ],
  },
  'skill_boss_colossus_crush': {
    id: 'skill_boss_colossus_crush',
    name: 'Colossal Pulverize',
    description: 'Crushes a single enemy under a colossal shield block, dealing massive defense-scaled damage.',
    icon: 'Shield',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 4.2,
        scalingStat: 'defense',
        hits: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.8,
        statusEffect: 'ATTACK_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_boss_bastion_fortress': {
    id: 'skill_boss_bastion_fortress',
    name: 'Bastion Fortress Bulwark',
    description: 'The Colossus locks into an impregnable defensive posture, gaining Defense Up (+70%) and a massive protective Shield.',
    icon: 'Shield',
    cooldown: 3,
    targetType: 'SELF',
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'DEFENSE_UP',
        statusDuration: 3,
      },
      {
        type: 'SHIELD',
        multiplier: 1.5,
        scalingStat: 'defense',
      },
    ],
  },

  // 3. HELMET DUNGEON BOSS: Chrono-Seraph (Steals Turn Meter / Attack Bar)
  'skill_boss_temporal_siphon': {
    id: 'skill_boss_temporal_siphon',
    name: 'Temporal Attack Bar Siphon',
    description: 'Bends the timeline! Drains 35% Attack Bar from all enemies and accelerates the Seraph by +50% Attack Bar.',
    icon: 'Clock',
    cooldown: 2,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.5,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'TURN_METER_REDUCE',
        turnMeterDelta: -0.35,
        description: 'Drains 35% Attack Bar from all enemies',
      },
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.50,
        description: 'Boosts own Attack Bar by +50%',
      },
    ],
  },
  'skill_boss_time_warp': {
    id: 'skill_boss_time_warp',
    name: 'Time Paradox Lock',
    description: 'Freezes an enemy in a temporal pocket, draining 60% of their Attack Bar and applying Speed Down for 2 turns.',
    icon: 'Zap',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.4,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'TURN_METER_REDUCE',
        turnMeterDelta: -0.60,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.9,
        statusEffect: 'SPEED_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_boss_paradox_strike': {
    id: 'skill_boss_paradox_strike',
    name: 'Chronos Singular Rend',
    description: 'Strikes all enemies with distortion waves, dealing speed-scaling damage and setting back enemy turns.',
    icon: 'Sun',
    cooldown: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.0,
        scalingStat: 'attack',
        hits: 3,
      },
      {
        type: 'TURN_METER_REDUCE',
        turnMeterDelta: -0.25,
      },
    ],
  },

  // 4. BOOTS DUNGEON BOSS: Stormgale Phantom (High Speed, Freezes/Stuns and Rapid Extra Turns)
  'skill_boss_tempest_cyclone': {
    id: 'skill_boss_tempest_cyclone',
    name: 'Tempest Zephyr Vortex',
    description: 'Summons raging hurricanes across the arena. Applies Speed Down to all enemies and Speed Up to self for 2 turns.',
    icon: 'Wind',
    cooldown: 2,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.7,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'SPEED_DOWN',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'SPEED_UP',
        statusDuration: 2,
      },
    ],
  },
  'skill_boss_permafrost_gale': {
    id: 'skill_boss_permafrost_gale',
    name: 'Glacial Wind Stun',
    description: 'Blasts arctic gales that Freeze and Stun enemy targets (80% chance), robbing them of their upcoming turn.',
    icon: 'Snowflake',
    cooldown: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.9,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.8,
        statusEffect: 'STUN',
        statusDuration: 1,
      },
    ],
  },
  'skill_boss_zephyr_flurry': {
    id: 'skill_boss_zephyr_flurry',
    name: 'Supersonic Gale Flurry',
    description: 'A blinding flurry of gale strikes. If a critical hit lands, grants an immediate Extra Turn to the Phantom.',
    icon: 'Wind',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.6,
        scalingStat: 'attack',
        hits: 4,
      },
      {
        type: 'EXTRA_TURN',
        chance: 0.65,
      },
    ],
  },
  // ==========================================
  // NEKOHIME (5-Star Legendary Cat Girl)
  // ==========================================
  // Fire - Nekohime Flarepaw
  'skill_nekohime_blazing_pounce': {
    id: 'skill_nekohime_blazing_pounce',
    name: 'Blazing Pounce',
    description: 'Pounces forward with searing fiery feline claws. 75% chance to inflict Continuous Damage (Burn) for 2 turns.',
    icon: 'Flame',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.4,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 2,
        description: 'Inflicts Burn DoT (5% max HP per turn)',
      },
    ],
  },
  'skill_nekohime_flame_acrobatic': {
    id: 'skill_nekohime_flame_acrobatic',
    name: 'Feline Flame Acrobatic',
    description: 'Performs a mid-air fiery backflip, slashing all foes, boosting own Turn Meter by 25%, and gaining Attack Up for 2 turns.',
    icon: 'Zap',
    cooldown: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.8,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'ATTACK_UP',
        statusDuration: 2,
      },
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.25,
      },
    ],
  },
  'skill_nekohime_kagura_burst': {
    id: 'skill_nekohime_kagura_burst',
    name: 'Nine-Lives Kagura Burst',
    description: 'Unleashes an acrobatic flurry of 9 blazing claw strikes (5.8x Attack). Grants an Extra Turn if the attack lands a critical hit!',
    icon: 'Sparkles',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 5.8,
        scalingStat: 'attack',
        hits: 9,
      },
      {
        type: 'EXTRA_TURN',
        chance: 1.0,
        description: 'Grants Extra Turn on critical strike',
      },
    ],
  },
  'skill_passive_nine_lives_fire': {
    id: 'skill_passive_nine_lives_fire',
    name: 'Nine-Lives Instinct',
    description: 'Passive: Increases Crit Rate by 15%. Gains Attack Up for 1 turn upon taking enemy damage.',
    icon: 'ShieldAlert',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  // Water - Nekohime Aquatail
  'skill_nekohime_aqua_swish': {
    id: 'skill_nekohime_aqua_swish',
    name: 'Aqua Tail Swish',
    description: 'Swishes water-infused claws and ribbon tail, dealing Water damage and stealing 15% Turn Meter.',
    icon: 'Droplets',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.2,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'TURN_METER_REDUCE',
        chance: 1.0,
        turnMeterDelta: 0.15,
      },
    ],
  },
  'skill_nekohime_soothing_purr': {
    id: 'skill_nekohime_soothing_purr',
    name: 'Soothing Feline Purr',
    description: 'Emits a harmonious therapeutic purr that cleanses all debuffs from allies and grants Continuous Heal (15% Max HP) + Speed Up for 2 turns.',
    icon: 'Heart',
    cooldown: 3,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'CLEANSE',
        dispelCount: 99,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CONTINUOUS_HEAL',
        statusDuration: 2,
        statusValue: 0.15,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'SPEED_UP',
        statusDuration: 2,
      },
    ],
  },
  'skill_nekohime_tidal_vortex': {
    id: 'skill_nekohime_tidal_vortex',
    name: 'Tidal Ribbon Vortex',
    description: 'Spins in an aquatic cat vortex hitting all enemies, dispelling 1 positive buff and freezing them for 1 turn (70% chance).',
    icon: 'Waves',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.0,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'DISPEL',
        dispelCount: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.7,
        statusEffect: 'FREEZE',
        statusDuration: 1,
      },
    ],
  },
  'skill_passive_nine_lives_water': {
    id: 'skill_passive_nine_lives_water',
    name: 'Oceanic Grace',
    description: 'Passive: Increases Base HP by 20%. When an ally receives critical damage, grants that ally a Shield equal to 15% of Nekohime’s max HP.',
    icon: 'Shield',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  // Grass - Nekohime Sylvanclaw
  'skill_nekohime_bramble_scratch': {
    id: 'skill_nekohime_bramble_scratch',
    name: 'Bramble Scratch',
    description: 'Strikes with emerald thorned claws. 60% chance to decrease target Defense for 2 turns.',
    icon: 'Trees',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.3,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.6,
        statusEffect: 'DEFENSE_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_nekohime_catnip_bloom': {
    id: 'skill_nekohime_catnip_bloom',
    name: 'Catnip Frenzy Bloom',
    description: 'Scatters mystical sylvan catnip pollen, granting Attack Up and Speed Up to all allies for 2 turns and boosting own Turn Meter by 30%.',
    icon: 'Sparkles',
    cooldown: 3,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'ATTACK_UP',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'SPEED_UP',
        statusDuration: 2,
      },
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.3,
      },
    ],
  },
  'skill_nekohime_emerald_ambush': {
    id: 'skill_nekohime_emerald_ambush',
    name: 'Emerald Shadow Ambush',
    description: 'Leaps from tree canopy across all enemies, reducing their Turn Meters by 30% and silencing them for 1 turn.',
    icon: 'Feather',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.2,
        scalingStat: 'attack',
        hits: 3,
      },
      {
        type: 'TURN_METER_REDUCE',
        chance: 1.0,
        turnMeterDelta: 0.3,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.8,
        statusEffect: 'SILENCE',
        statusDuration: 1,
      },
    ],
  },
  'skill_passive_nine_lives_grass': {
    id: 'skill_passive_nine_lives_grass',
    name: 'Sylvan Acrobatic Reflex',
    description: 'Passive: 30% chance to evade enemy attacks and immediately counter-attack with Bramble Scratch.',
    icon: 'Wind',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  // Light - Nekohime Starlight
  'skill_nekohime_starlight_chime': {
    id: 'skill_nekohime_starlight_chime',
    name: 'Starlight Bell Chime',
    description: 'Rings her celestial golden collar bell, emitting concentrated starlight rays that deal Light damage and boost the lowest-meter ally’s Turn Meter by 20%.',
    icon: 'Bell',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.4,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.2,
      },
    ],
  },
  'skill_nekohime_prismatic_yarn': {
    id: 'skill_nekohime_prismatic_yarn',
    name: 'Prismatic Yarn Comet',
    description: 'Playfully bats a radiant celestial yarn comet through all enemies, dealing Light damage and granting Immunity to all allies for 2 turns.',
    icon: 'Sun',
    cooldown: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.7,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'IMMUNITY',
        statusDuration: 2,
      },
    ],
  },
  'skill_nekohime_supernova_pounce': {
    id: 'skill_nekohime_supernova_pounce',
    name: 'Supernova Paw Strike',
    description: 'Leaps into the heavens and strikes down in a blinding explosion of starlight (5.6x Attack), granting Double Attack to highest attack ally.',
    icon: 'Star',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 5.6,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'DOUBLE_ATTACK',
        statusDuration: 1,
      },
    ],
  },
  'skill_passive_nine_lives_light': {
    id: 'skill_passive_nine_lives_light',
    name: 'Nine-Lives Starlight Blessing',
    description: 'Passive: Increases all allies’ Speed by 12. At the start of each turn, purges 1 debuff from the lowest HP ally and restores 8% max HP.',
    icon: 'Sparkles',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  // Dark - Nekohime Kuroneko
  'skill_nekohime_midnight_rend': {
    id: 'skill_nekohime_midnight_rend',
    name: 'Midnight Rend',
    description: 'Strikes from the threshold of shadows with abyssal claws. Guaranteed critical strike if target has below 50% HP.',
    icon: 'Moon',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.6,
        scalingStat: 'attack',
        hits: 2,
      },
    ],
  },
  'skill_nekohime_vanishing_step': {
    id: 'skill_nekohime_vanishing_step',
    name: 'Vanishing Shadow Step',
    description: 'Melts into midnight shadows, entering Stealth for 2 turns, gaining Crit Rate Up for 2 turns, and boosting Turn Meter by 50%.',
    icon: 'Ghost',
    cooldown: 3,
    targetType: 'SELF',
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'STEALTH',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CRIT_RATE_UP',
        statusDuration: 2,
      },
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.5,
      },
    ],
  },
  'skill_nekohime_nine_shadow_flurry': {
    id: 'skill_nekohime_nine_shadow_flurry',
    name: 'Abyssal Nine-Claw Execution',
    description: 'Rips through the target 9 consecutive times with dark phantom claws (6.2x Attack). If the target is slain, immediately grants an Extra Turn and resets all cooldowns!',
    icon: 'Skull',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 6.2,
        scalingStat: 'attack',
        hits: 9,
      },
      {
        type: 'EXTRA_TURN',
        chance: 1.0,
      },
    ],
  },
  'skill_passive_nine_lives_dark': {
    id: 'skill_passive_nine_lives_dark',
    name: 'Nine-Lives Eclipse',
    description: 'Passive: Increases Crit Damage by 25%. Whenever any enemy is defeated, Nekohime gains +35% Turn Meter and restores 20% max HP.',
    icon: 'Zap',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  // ==========================================
  // FREE DANCER (Celestial Ballroom Dancer)
  // ==========================================
  'skill_freedancer_flamenco_step': {
    id: 'skill_freedancer_flamenco_step',
    name: 'Flamenco Step',
    description: 'Fires an impassioned fiery dance kick (3.2x Attack). 75% chance to inflict Continuous Damage (Burn) for 2 turns.',
    icon: 'Flame',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.2,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 2,
      },
    ],
  },
  'skill_freedancer_spinning_waltz': {
    id: 'skill_freedancer_spinning_waltz',
    name: 'Spinning Waltz',
    description: 'Performs an acrobatic spinning waltz across the enemy lines (3.6x Attack). Increases own Turn Meter by 25% and grants Attack Up to self for 2 turns.',
    icon: 'Zap',
    cooldown: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.6,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.25,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'ATTACK_UP',
        statusDuration: 2,
      },
    ],
  },
  'skill_freedancer_grand_encore': {
    id: 'skill_freedancer_grand_encore',
    name: 'Grand Encore Finale',
    description: 'Unleashes a blazing dance finale (5.6x Attack). If this attack lands a Critical Hit, immediately grants an Extra Turn.',
    icon: 'Sparkles',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 5.6,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'EXTRA_TURN',
        chance: 1.0,
      },
    ],
  },
  'skill_passive_freedancer_passion': {
    id: 'skill_passive_freedancer_passion',
    name: "Dancer's Passion",
    description: 'Passive: When critically striking an enemy, gains +20% Turn Meter and extends all active beneficial dance effects by 1 turn.',
    icon: 'Flame',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  'skill_freedancer_ripple_pirouette': {
    id: 'skill_freedancer_ripple_pirouette',
    name: 'Ripple Pirouette',
    description: 'Executes a flowing water pirouette (3.0x Attack). Steals 15% Turn Meter from the target.',
    icon: 'Droplets',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.0,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.15,
      },
    ],
  },
  'skill_freedancer_soothing_waltz': {
    id: 'skill_freedancer_soothing_waltz',
    name: 'Soothing Waltz',
    description: 'Dances an elegant soothing waltz. Cleanses 2 debuffs from all allies, grants Continuous Healing for 2 turns and increases Speed by 30% for 2 turns.',
    icon: 'HeartPulse',
    cooldown: 3,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'CLEANSE',
        dispelCount: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CONTINUOUS_HEAL',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'SPEED_UP',
        statusDuration: 2,
      },
    ],
  },
  'skill_freedancer_tidal_ballet': {
    id: 'skill_freedancer_tidal_ballet',
    name: 'Tidal Ballet',
    description: 'Summons a swirling tidal ballet vortex (3.5x Attack). 80% chance to Dispel 1 beneficial effect and 60% chance to Freeze enemies for 1 turn.',
    icon: 'Waves',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.5,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'DISPEL',
        dispelCount: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.60,
        statusEffect: 'FREEZE',
        statusDuration: 1,
      },
    ],
  },
  'skill_passive_freedancer_water': {
    id: 'skill_passive_freedancer_water',
    name: 'Harmonic Flow',
    description: 'Passive: At the start of each turn, restores 10% HP to the lowest health ally and grants them 15% Turn Meter.',
    icon: 'Droplets',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  'skill_freedancer_sylvan_tempo': {
    id: 'skill_freedancer_sylvan_tempo',
    name: 'Sylvan Tempo',
    description: 'Strikes with rhythmic floral flourishes (3.2x Attack). 75% chance to decrease Defense for 2 turns.',
    icon: 'Leaf',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.2,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'DEFENSE_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_freedancer_blossom_cadence': {
    id: 'skill_freedancer_blossom_cadence',
    name: 'Blossom Cadence',
    description: 'Performs a sylvan cadence dance. Grants Attack Up and Speed Up to all allies for 2 turns, and boosts party Turn Meter by 20%.',
    icon: 'Sparkles',
    cooldown: 3,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'ATTACK_UP',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'SPEED_UP',
        statusDuration: 2,
      },
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.20,
      },
    ],
  },
  'skill_freedancer_verdant_crescendo': {
    id: 'skill_freedancer_verdant_crescendo',
    name: 'Verdant Crescendo',
    description: 'Whirls through the frontline in a verdant dance crescendo (3.8x Attack). Reduces all enemy Turn Meters by 30% and inflicts Silence for 1 turn.',
    icon: 'Wind',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.8,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'TURN_METER_REDUCE',
        turnMeterDelta: 0.30,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'SILENCE',
        statusDuration: 1,
      },
    ],
  },
  'skill_passive_freedancer_grass': {
    id: 'skill_passive_freedancer_grass',
    name: 'Chorus of Petals',
    description: 'Passive: Increases ally Resistance by 25%. Whenever Free Dancer receives a buff, her attack damage increases by 10% (stacks up to 5 times).',
    icon: 'Leaf',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  'skill_freedancer_starlight_chasse': {
    id: 'skill_freedancer_starlight_chasse',
    name: 'Starlight Chassé',
    description: 'Strikes with a dazzling luminous step (3.3x Attack). Boosts the lowest-meter ally Turn Meter by 20%.',
    icon: 'Sun',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.3,
        scalingStat: 'attack',
        hits: 1,
      },
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.20,
      },
    ],
  },
  'skill_freedancer_prismatic_arabesque': {
    id: 'skill_freedancer_prismatic_arabesque',
    name: 'Prismatic Arabesque',
    description: 'Executes an illuminated arabesque leap. Grants Immunity and Defense Up to all allies for 2 turns, plus a Shield equal to 25% of Free Dancer Max HP.',
    icon: 'Shield',
    cooldown: 4,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'IMMUNITY',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'DEFENSE_UP',
        statusDuration: 2,
      },
      {
        type: 'SHIELD',
        multiplier: 0.25,
        scalingStat: 'hp',
        statusDuration: 2,
      },
    ],
  },
  'skill_freedancer_celestial_ovation': {
    id: 'skill_freedancer_celestial_ovation',
    name: 'Celestial Standing Ovation',
    description: 'Summons a radiant spotlight beam (5.4x Attack). Disperses all enemy buffs and grants the highest Attack ally a Double Attack on their next turn.',
    icon: 'Sparkles',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 5.4,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'DISPEL',
        dispelCount: 3,
      },
    ],
  },
  'skill_passive_freedancer_light': {
    id: 'skill_passive_freedancer_light',
    name: 'Spotlight Radiance',
    description: 'Passive: Whenever Free Dancer takes damage, reduces the damage by 20% and blinds the attacker (Decrease Accuracy) for 2 turns.',
    icon: 'Sun',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  'skill_freedancer_shadow_tango': {
    id: 'skill_freedancer_shadow_tango',
    name: 'Shadow Tango',
    description: 'Strikes from twilight shadows in a razor tango step (3.4x Attack). Deals 50% more damage if the target is below 50% HP.',
    icon: 'Moon',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.4,
        scalingStat: 'attack',
        hits: 1,
      },
    ],
  },
  'skill_freedancer_vanishing_waltz': {
    id: 'skill_freedancer_vanishing_waltz',
    name: 'Vanishing Waltz',
    description: 'Disappears into twilight mist with a graceful turn. Grants Stealth, +50% Crit Rate, and +50% Turn Meter.',
    icon: 'EyeOff',
    cooldown: 3,
    targetType: 'SELF',
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'STEALTH',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'CRIT_RATE_UP',
        statusDuration: 2,
      },
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.5,
      },
    ],
  },
  'skill_freedancer_danse_macabre': {
    id: 'skill_freedancer_danse_macabre',
    name: 'Danse Macabre',
    description: 'Performs a devastating 9-strike shadow choreography (6.2x Attack). If the target is slain, immediately grants an Extra Turn and resets all skill cooldowns!',
    icon: 'Skull',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 6.2,
        scalingStat: 'attack',
        hits: 9,
      },
      {
        type: 'EXTRA_TURN',
        chance: 1.0,
      },
    ],
  },
  'skill_passive_freedancer_dark': {
    id: 'skill_passive_freedancer_dark',
    name: 'Phantom Rhythm',
    description: 'Passive: Increases Crit Damage by 25%. Whenever any enemy is defeated, Free Dancer gains +35% Turn Meter and restores 20% max HP.',
    icon: 'Zap',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  // ==========================================
  // PORKY (1-STAR PIG-LIKE MONSTER) SKILLS
  // ==========================================
  'skill_porky_snout_slam': {
    id: 'skill_porky_snout_slam',
    name: 'Snout Slam',
    description: 'Slams a foe with its thick snout (2.2x Attack + 15% Max HP). 70% chance to inflict Attack Down for 2 turns.',
    icon: 'Shield',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.2,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.7,
        statusEffect: 'ATTACK_DOWN',
        statusDuration: 2,
      },
    ],
  },
  'skill_porky_mud_wallow': {
    id: 'skill_porky_mud_wallow',
    name: 'Mud Wallow',
    description: 'Wallows in protective mud, cleansing 1 debuff from self and gaining a Shield (25% Max HP) and Defense Up for 2 turns.',
    icon: 'ShieldAlert',
    cooldown: 3,
    targetType: 'SELF',
    effects: [
      {
        type: 'CLEANSE',
        dispelCount: 1,
      },
      {
        type: 'SHIELD',
        multiplier: 0.25,
        scalingStat: 'hp',
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'DEFENSE_UP',
        statusDuration: 2,
      },
    ],
  },
  'skill_porky_boar_rampage': {
    id: 'skill_porky_boar_rampage',
    name: 'Boar Rampage',
    description: 'Awakened Ultimate: Tramples violently through enemy ranks (3.8x Attack), dealing heavy damage with an 80% chance to Stun the target for 1 turn.',
    icon: 'Flame',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.8,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.8,
        statusEffect: 'STUN',
        statusDuration: 1,
      },
    ],
  },
  'skill_passive_thick_hide': {
    id: 'skill_passive_thick_hide',
    name: 'Thick Hide',
    description: 'Passive: Reduces incoming damage by 20% while HP is above 50%, and gains Continuous Heal when struck by a critical hit.',
    icon: 'ShieldCheck',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  // ==========================================
  // FISHTER (1-STAR FISHMAN-LIKE MONSTER) SKILLS
  // ==========================================
  'skill_fishter_spear_thrust': {
    id: 'skill_fishter_spear_thrust',
    name: 'Spear Thrust',
    description: 'Strikes with a razor-sharp coral trident (2.4x Attack). 75% chance to inflict Continuous Damage for 2 turns.',
    icon: 'Sword',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.4,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 2,
      },
    ],
  },
  'skill_fishter_tidal_dash': {
    id: 'skill_fishter_tidal_dash',
    name: 'Tidal Dash',
    description: 'Dashes forward with aquatic speed (3.0x Attack), granting self Speed Up for 2 turns and +35% Turn Meter.',
    icon: 'Wind',
    cooldown: 3,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.0,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'SPEED_UP',
        statusDuration: 2,
      },
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.35,
      },
    ],
  },
  'skill_fishter_abyssal_strike': {
    id: 'skill_fishter_abyssal_strike',
    name: 'Abyssal Strike',
    description: 'Awakened Ultimate: Channels deep ocean pressure into a ferocious strike (4.2x Attack) that ignores 35% Defense.',
    icon: 'Zap',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 4.2,
        scalingStat: 'attack',
        hits: 3,
      },
    ],
  },
  'skill_passive_slippery_scales': {
    id: 'skill_passive_slippery_scales',
    name: 'Slippery Scales',
    description: 'Passive: Increases base Resistance by 25%. Whenever Fishter resists a harmful effect, gains +20% Turn Meter.',
    icon: 'Droplet',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  // ==========================================
  // ROCKMAN (1-STAR GOLEM-LIKE MONSTER) SKILLS
  // ==========================================
  'skill_rockman_stone_fist': {
    id: 'skill_rockman_stone_fist',
    name: 'Stone Fist',
    description: 'Delivers a heavy granite punch (1.8x Attack + 2.0x Defense). 65% chance to reduce target Turn Meter by 25%.',
    icon: 'Square',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 1.8,
        scalingStat: 'attack',
      },
      {
        type: 'TURN_METER_REDUCE',
        chance: 0.65,
        turnMeterDelta: -0.25,
      },
    ],
  },
  'skill_rockman_seismic_shield': {
    id: 'skill_rockman_seismic_shield',
    name: 'Seismic Shield',
    description: 'Anchors firmly into bedrock, granting all allies Defense Up for 2 turns and Taunting all enemies for 1 turn.',
    icon: 'Shield',
    cooldown: 3,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'DEFENSE_UP',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'TAUNT',
        statusDuration: 1,
      },
    ],
  },
  'skill_rockman_avalanche_smash': {
    id: 'skill_rockman_avalanche_smash',
    name: 'Avalanche Smash',
    description: 'Awakened Ultimate: Drops colossal boulders across the enemy team (2.8x Defense scaling), with a 75% chance to Stun for 1 turn.',
    icon: 'Flame',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.8,
        scalingStat: 'defense',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'STUN',
        statusDuration: 1,
      },
    ],
  },
  'skill_passive_solid_granite': {
    id: 'skill_passive_solid_granite',
    name: 'Solid Granite',
    description: 'Passive: Increases Defense by 20%. Immune to Defense Down effects and reduces critical hit damage taken by 30%.',
    icon: 'ShieldCheck',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  // ==========================================
  // DOGGO (2-STAR DOG-LIKE MONSTER) SKILLS
  // ==========================================
  'skill_doggo_ferocious_bite': {
    id: 'skill_doggo_ferocious_bite',
    name: 'Playful Chomp',
    description: 'Bites with vigorous energy (2.6x Attack). 80% chance to inflict Continuous Damage for 2 turns.',
    icon: 'Sword',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.6,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.8,
        statusEffect: 'CONTINUOUS_DAMAGE',
        statusDuration: 2,
      },
    ],
  },
  'skill_doggo_rallying_howl': {
    id: 'skill_doggo_rallying_howl',
    name: 'Rallying Howl',
    description: 'Emits an energetic battle cry, granting all allies Attack Up and Speed Up for 2 turns.',
    icon: 'Volume2',
    cooldown: 3,
    targetType: 'ALL_ALLIES',
    effects: [
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'ATTACK_UP',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 1.0,
        statusEffect: 'SPEED_UP',
        statusDuration: 2,
      },
    ],
  },
  'skill_doggo_pack_hunt': {
    id: 'skill_doggo_pack_hunt',
    name: 'Pack Hunt',
    description: 'Awakened Ultimate: Pounces with blistering speed across 3 bites (4.6x Attack total) and boosts all allies Turn Meter by 25%.',
    icon: 'Zap',
    cooldown: 4,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 4.6,
        scalingStat: 'attack',
        hits: 3,
      },
      {
        type: 'TURN_METER_BOOST',
        turnMeterDelta: 0.25,
      },
    ],
  },
  'skill_passive_loyal_guardian': {
    id: 'skill_passive_loyal_guardian',
    name: 'Loyal Guardian',
    description: 'Passive: When an ally falls below 40% HP, Doggo immediately grants them a Shield (25% Doggo Max HP) and gains Speed Up for 2 turns.',
    icon: 'Heart',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },

  // ==========================================
  // BIRDUNNO (2-STAR 2-HEADED BIRD MONSTER) SKILLS
  // ==========================================
  'skill_birdunno_twin_peck': {
    id: 'skill_birdunno_twin_peck',
    name: 'Twin Peck',
    description: 'Both heads strike in sequence (1.7x Attack x 2 hits). Each hit has a 50% chance to Dispel 1 beneficial effect from the target.',
    icon: 'Sword',
    cooldown: 0,
    targetType: 'SINGLE_ENEMY',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 1.7,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'DISPEL',
        chance: 0.5,
        dispelCount: 1,
      },
    ],
  },
  'skill_birdunno_discord_squawk': {
    id: 'skill_birdunno_discord_squawk',
    name: 'Discord Squawk',
    description: 'Both heads screech at clashing frequencies, dealing 2.4x Attack to all enemies with a 75% chance to inflict Attack Down and Blind for 2 turns.',
    icon: 'VolumeX',
    cooldown: 3,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 2.4,
        scalingStat: 'attack',
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'ATTACK_DOWN',
        statusDuration: 2,
      },
      {
        type: 'APPLY_STATUS',
        chance: 0.75,
        statusEffect: 'BLIND',
        statusDuration: 2,
      },
    ],
  },
  'skill_birdunno_twin_tempest': {
    id: 'skill_birdunno_twin_tempest',
    name: 'Twin Tempest',
    description: 'Awakened Ultimate: Flaps twin wings to summon dual cyclones hitting all enemies twice (3.4x Attack total) and reduces enemy Turn Meter by 25%.',
    icon: 'Wind',
    cooldown: 4,
    targetType: 'ALL_ENEMIES',
    effects: [
      {
        type: 'DAMAGE',
        multiplier: 3.4,
        scalingStat: 'attack',
        hits: 2,
      },
      {
        type: 'TURN_METER_REDUCE',
        chance: 0.8,
        turnMeterDelta: -0.25,
      },
    ],
  },
  'skill_passive_two_minds': {
    id: 'skill_passive_two_minds',
    name: 'Two Minds',
    description: 'Passive: Having two heads makes Birdunno immune to Stun, Freeze, and Sleep. Increases Accuracy by 30%.',
    icon: 'Eye',
    cooldown: 0,
    targetType: 'SELF',
    isPassive: true,
    effects: [],
  },
};

export function getSkillDefinition(skillId: string): SkillDefinition | undefined {
  return SKILLS_DATABASE[skillId];
}
