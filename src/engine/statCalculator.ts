/**
 * Centralized Stat Calculation Engine
 * Single source of truth for all stat computations.
 * Combines: Base Stats + Level Growth + Equipment + Awakening + Temporary Battle Effects.
 */

import { AwakeningStage, BaseStats, EquipmentItem, MonsterVariant, StatusEffect } from '../types';
import { EQUIPMENT_SET_BONUSES } from '../data/equipment';

export interface StatCalculationInput {
  variant: MonsterVariant;
  level: number;
  awakeningStage: AwakeningStage;
  equipment?: EquipmentItem[];
  activeEffects?: StatusEffect[];
  stars?: number;
}

export interface StatBreakdown {
  finalStats: BaseStats;
  baseWithGrowth: BaseStats;
  equipmentBonuses: Partial<BaseStats>;
  awakeningBonuses: Partial<BaseStats>;
  activeSetBonuses: string[];
}

export function calculateEffectiveStats(input: StatCalculationInput): StatBreakdown {
  const { variant, level, awakeningStage, equipment = [], activeEffects = [] } = input;
  const base = variant.baseStats;
  const growth = variant.growthPerLevel || {};

  // 1. Base + Level Growth
  const levelMult = Math.max(0, level - 1);
  const baseWithGrowth: BaseStats = {
    hp: Math.floor(base.hp + (growth.hp || 0) * levelMult),
    attack: Math.floor(base.attack + (growth.attack || 0) * levelMult),
    defense: Math.floor(base.defense + (growth.defense || 0) * levelMult),
    speed: Math.floor(base.speed + (growth.speed || 0) * levelMult),
    critRate: Number((base.critRate + (growth.critRate || 0) * levelMult).toFixed(3)),
    critDamage: Number((base.critDamage + (growth.critDamage || 0) * levelMult).toFixed(3)),
    accuracy: Number((base.accuracy + (growth.accuracy || 0) * levelMult).toFixed(3)),
    resistance: Number((base.resistance + (growth.resistance || 0) * levelMult).toFixed(3)),
  };

  // 2. Awakening Multipliers and Additions
  let hpAwakenMult = 1.0;
  let atkAwakenMult = 1.0;
  let defAwakenMult = 1.0;
  let spdAwakenAdd = 0;
  let critRateAwakenAdd = 0;
  let critDamageAwakenAdd = 0;
  let accAwakenAdd = 0;
  let resAwakenAdd = 0;

  if (awakeningStage !== 'BASE') {
    // Collect all unlocked awakening stages up to the current stage
    const stagesOrder: AwakeningStage[] = ['AWAKENED', 'GREATER_AWAKENED', 'ASCENDED'];
    const currentIdx = stagesOrder.indexOf(awakeningStage);

    for (let i = 0; i <= currentIdx; i++) {
      const stageName = stagesOrder[i];
      const stageConfig = variant.awakeningStages.find((s) => s.stage === stageName);
      if (stageConfig && stageConfig.statMultipliers) {
        const m = stageConfig.statMultipliers;
        if (m.hp) hpAwakenMult *= m.hp;
        if (m.attack) atkAwakenMult *= m.attack;
        if (m.defense) defAwakenMult *= m.defense;
        if (m.speed) spdAwakenAdd += m.speed;
        if (m.critRate) critRateAwakenAdd += m.critRate;
        if (m.critDamage) critDamageAwakenAdd += m.critDamage;
        if (m.accuracy) accAwakenAdd += m.accuracy;
        if (m.resistance) resAwakenAdd += m.resistance;
      }
    }
  }

  // Star Progression Multiplier (e.g. 6★ to 10★ Sovereign Ascension)
  const baseStars =
    variant.stars ||
    (variant.rarity === 'LEGENDARY'
      ? 5
      : variant.rarity === 'EPIC'
      ? 4
      : variant.rarity === 'RARE'
      ? 3
      : variant.rarity === 'UNCOMMON'
      ? 2
      : 1);
  const effectiveStars = input.stars !== undefined ? input.stars : baseStars;
  const starMult = effectiveStars > baseStars ? 1.0 + (effectiveStars - baseStars) * 0.12 : 1.0;
  const starSpdBonus = effectiveStars > baseStars ? (effectiveStars - baseStars) * 2 : 0;

  const postAwakening: BaseStats = {
    hp: Math.floor(baseWithGrowth.hp * hpAwakenMult * starMult),
    attack: Math.floor(baseWithGrowth.attack * atkAwakenMult * starMult),
    defense: Math.floor(baseWithGrowth.defense * defAwakenMult * starMult),
    speed: Math.floor(baseWithGrowth.speed + spdAwakenAdd + starSpdBonus),
    critRate: Number((baseWithGrowth.critRate + critRateAwakenAdd).toFixed(3)),
    critDamage: Number((baseWithGrowth.critDamage + critDamageAwakenAdd).toFixed(3)),
    accuracy: Number((baseWithGrowth.accuracy + accAwakenAdd).toFixed(3)),
    resistance: Number((baseWithGrowth.resistance + resAwakenAdd).toFixed(3)),
  };

  // 3. Equipment: Flat & Percent Main and Substats
  let eqFlatHp = 0;
  let eqPctHp = 0;
  let eqFlatAtk = 0;
  let eqPctAtk = 0;
  let eqFlatDef = 0;
  let eqPctDef = 0;
  let eqFlatSpd = 0;
  let eqCritRate = 0;
  let eqCritDamage = 0;
  let eqAccuracy = 0;
  let eqResistance = 0;
  let eqHealingDone = 0;
  let eqShieldingDone = 0;

  // Equipment Set counting
  const setCountMap: Record<string, number> = {};

  for (const item of equipment) {
    if (item.set) {
      setCountMap[item.set] = (setCountMap[item.set] || 0) + 1;
    }

    // Main Stat
    const main = item.mainStat;
    if (main.stat === 'hp') main.isPercent ? (eqPctHp += main.value) : (eqFlatHp += main.value);
    if (main.stat === 'attack') main.isPercent ? (eqPctAtk += main.value) : (eqFlatAtk += main.value);
    if (main.stat === 'defense') main.isPercent ? (eqPctDef += main.value) : (eqFlatDef += main.value);
    if (main.stat === 'speed') eqFlatSpd += main.value;
    if (main.stat === 'critRate') eqCritRate += main.value;
    if (main.stat === 'critDamage') eqCritDamage += main.value;
    if (main.stat === 'accuracy') eqAccuracy += main.value;
    if (main.stat === 'resistance') eqResistance += main.value;
    if (main.stat === 'healingDone') eqHealingDone += main.value;
    if (main.stat === 'shieldingDone') eqShieldingDone += main.value;

    // Substats
    for (const sub of item.subStats) {
      if (sub.stat === 'hp') sub.isPercent ? (eqPctHp += sub.value) : (eqFlatHp += sub.value);
      if (sub.stat === 'attack') sub.isPercent ? (eqPctAtk += sub.value) : (eqFlatAtk += sub.value);
      if (sub.stat === 'defense') sub.isPercent ? (eqPctDef += sub.value) : (eqFlatDef += sub.value);
      if (sub.stat === 'speed') eqFlatSpd += sub.value;
      if (sub.stat === 'critRate') eqCritRate += sub.value;
      if (sub.stat === 'critDamage') eqCritDamage += sub.value;
      if (sub.stat === 'accuracy') eqAccuracy += sub.value;
      if (sub.stat === 'resistance') eqResistance += sub.value;
      if (sub.stat === 'healingDone') eqHealingDone += sub.value;
      if (sub.stat === 'shieldingDone') eqShieldingDone += sub.value;
    }
  }

  // 4. Equipment Set Bonuses
  const activeSetBonuses: string[] = [];
  for (const [setKey, count] of Object.entries(setCountMap)) {
    const setDef = EQUIPMENT_SET_BONUSES[setKey as keyof typeof EQUIPMENT_SET_BONUSES];
    if (setDef) {
      const timesActivated = Math.floor(count / setDef.piecesRequired);
      if (timesActivated > 0) {
        activeSetBonuses.push(`${setDef.name} x${timesActivated}`);
        const totalBonus = setDef.statBonus.value * timesActivated;
        if (setDef.statBonus.stat === 'speed') eqFlatSpd += Math.floor(base.speed * totalBonus);
        if (setDef.statBonus.stat === 'attack') eqPctAtk += totalBonus;
        if (setDef.statBonus.stat === 'hp') eqPctHp += totalBonus;
        if (setDef.statBonus.stat === 'defense') eqPctDef += totalBonus;
        if (setDef.statBonus.stat === 'critRate') eqCritRate += totalBonus;
        if (setDef.statBonus.stat === 'accuracy') eqAccuracy += totalBonus;
        if (setDef.statBonus.stat === 'critDamage') eqCritDamage += totalBonus;
        if (setDef.statBonus.stat === 'healingDone') eqHealingDone += totalBonus;
        if (setDef.statBonus.stat === 'shieldingDone') eqShieldingDone += totalBonus;
      }
    }
  }

  // Combine Post-Awakening with Equipment
  let finalHp = Math.floor(postAwakening.hp * (1 + eqPctHp) + eqFlatHp);
  let finalAtk = Math.floor(postAwakening.attack * (1 + eqPctAtk) + eqFlatAtk);
  let finalDef = Math.floor(postAwakening.defense * (1 + eqPctDef) + eqFlatDef);
  let finalSpd = Math.floor(postAwakening.speed + eqFlatSpd);
  let finalCritRate = Math.min(1.0, postAwakening.critRate + eqCritRate);
  let finalCritDmg = postAwakening.critDamage + eqCritDamage;
  let finalAcc = Math.min(1.0, postAwakening.accuracy + eqAccuracy);
  let finalRes = Math.min(1.0, postAwakening.resistance + eqResistance);

  // 5. Temporary Battle Effects
  let atkBuffMult = 1.0;
  let defBuffMult = 1.0;
  let spdBuffMult = 1.0;
  let critRateBuff = 0;

  for (const effect of activeEffects) {
    switch (effect.type) {
      case 'ATTACK_UP':
        atkBuffMult += 0.50; // +50% Attack
        break;
      case 'ATTACK_DOWN':
        atkBuffMult -= 0.50; // -50% Attack
        break;
      case 'DEFENSE_UP':
        defBuffMult += 0.70; // +70% Defense
        break;
      case 'DEFENSE_DOWN':
        defBuffMult -= 0.70; // -70% Defense
        break;
      case 'SPEED_UP':
        spdBuffMult += 0.33; // +33% Speed
        break;
      case 'SPEED_DOWN':
        spdBuffMult -= 0.33; // -33% Speed
        break;
      case 'CRIT_RATE_UP':
        critRateBuff += 0.30;
        break;
    }
  }

  finalAtk = Math.max(1, Math.floor(finalAtk * Math.max(0.2, atkBuffMult)));
  finalDef = Math.max(1, Math.floor(finalDef * Math.max(0.2, defBuffMult)));
  finalSpd = Math.max(1, Math.floor(finalSpd * Math.max(0.2, spdBuffMult)));
  finalCritRate = Math.min(1.0, finalCritRate + critRateBuff);

  const finalStats: BaseStats = {
    hp: finalHp,
    attack: finalAtk,
    defense: finalDef,
    speed: finalSpd,
    critRate: Number(finalCritRate.toFixed(3)),
    critDamage: Number(finalCritDmg.toFixed(3)),
    accuracy: Number(finalAcc.toFixed(3)),
    resistance: Number(finalRes.toFixed(3)),
    healingDone: Number(eqHealingDone.toFixed(3)),
    shieldingDone: Number(eqShieldingDone.toFixed(3)),
  };

  return {
    finalStats,
    baseWithGrowth,
    equipmentBonuses: {
      hp: finalHp - postAwakening.hp,
      attack: finalAtk - postAwakening.attack,
      defense: finalDef - postAwakening.defense,
      speed: finalSpd - postAwakening.speed,
      healingDone: eqHealingDone,
      shieldingDone: eqShieldingDone,
    },
    awakeningBonuses: {
      hp: postAwakening.hp - baseWithGrowth.hp,
      attack: postAwakening.attack - baseWithGrowth.attack,
      defense: postAwakening.defense - baseWithGrowth.defense,
      speed: postAwakening.speed - baseWithGrowth.speed,
    },
    activeSetBonuses,
  };
}
