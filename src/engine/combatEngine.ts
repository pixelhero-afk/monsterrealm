/**
 * Monster Realms - 5v5 Speed-Based Turn-Meter Combat Engine
 * Fully decoupled, deterministic, data-driven core engine.
 */

import {
  BattleAction,
  BattleLogEntry,
  BattleParticipant,
  BattleState,
  ElementType,
  SkillDefinition,
  StatusEffect,
  StatusEffectType,
} from '../types';
import { ELEMENT_CONFIG, getElementAffinity } from '../data/elements';
import { getSkillDefinition } from '../data/skills';
import { DeterministicRNG } from './rng';

export const TURN_METER_CAP = 100;
export const TICK_RATE_DIVISOR = 70; // Controls speed tick granularity
export const MAX_EXTRA_TURN_CHAIN_DEPTH = 3; // Maximum chained extra turns allowed
export const MAX_CONSECUTIVE_ACTIONS = 4; // Absolute cap on consecutive turns by same actor
export const LOOP_DETECTION_THRESHOLD = 50;

export class CombatEngine {
  private rng: DeterministicRNG;

  constructor(seed: number = Date.now()) {
    this.rng = new DeterministicRNG(seed);
  }

  /**
   * Initializes a new 5v5 battle state
   */
  createBattle(
    battleId: string,
    playerTeam: BattleParticipant[],
    enemyTeam: BattleParticipant[],
    seed: number = Date.now(),
    partySize?: number,
    waveInfo?: { currentWave: number; totalWaves: number }
  ): BattleState {
    this.rng = new DeterministicRNG(seed);

    // Initial turn meter can have minor variance based on speed
    playerTeam.forEach((p) => {
      p.turnMeter = Math.min(95, Math.floor(p.stats.speed * 0.5));
      p.isAlive = p.currentHp > 0;
    });
    enemyTeam.forEach((e) => {
      e.turnMeter = Math.min(95, Math.floor(e.stats.speed * 0.5));
      e.isAlive = e.currentHp > 0;
    });

    const currentWave = waveInfo?.currentWave ?? 1;
    const totalWaves = waveInfo?.totalWaves ?? 1;
    const waveText = totalWaves > 1 ? ` (Wave ${currentWave}/${totalWaves})` : '';

    const state: BattleState = {
      battleId,
      partySize: partySize ?? playerTeam.length,
      turnCount: 0,
      currentActorId: null,
      phase: 'SELECTING_ACTION',
      playerTeam,
      enemyTeam,
      turnOrderPreview: [],
      combatLog: [
        {
          id: `log_init_${Date.now()}`,
          turnCount: 0,
          sourceId: 'system',
          sourceName: 'System',
          actionType: 'SKILL',
          message: `${playerTeam.length}v${enemyTeam.length} Battle begins${waveText}! Combatants prepare their turn meters.`,
          timestamp: Date.now(),
        },
      ],
      isAuto: false,
      battleSpeed: 1,
      seed,
      currentExtraTurnDepth: 0,
      consecutiveActionsCount: 0,
      activeActionContext: null,
      loopDetectionCount: 0,
      currentWave,
      totalWaves,
    };

    this.advanceTurnMetersUntilActorReady(state);
    return state;
  }

  /**
   * Advances the battle to the next wave (e.g. Wave 1 -> Wave 2 -> Wave 3 Boss)
   * Retains player monsters' remaining HP, cooldowns, and buffs.
   */
  advanceToWave(
    state: BattleState,
    nextWave: number,
    newEnemyTeam: BattleParticipant[]
  ): BattleState {
    state.currentWave = nextWave;
    state.enemyTeam = newEnemyTeam;
    state.phase = 'SELECTING_ACTION';

    // Initialize enemy turn meters
    newEnemyTeam.forEach((e) => {
      e.turnMeter = Math.min(95, Math.floor(e.stats.speed * 0.4));
      e.isAlive = e.currentHp > 0;
    });

    const isBossWave = state.totalWaves ? nextWave === state.totalWaves : false;
    this.addLog(state, {
      turnCount: state.turnCount,
      sourceId: 'system',
      sourceName: 'System',
      actionType: 'SKILL',
      message: isBossWave
        ? `🔥 FINAL WAVE ${nextWave}/${state.totalWaves}: BOSS ENCOUNTER! The Overlord engages!`
        : `⚔️ WAVE ${nextWave}/${state.totalWaves}: Enemy reinforcements arrive!`,
    });

    this.advanceTurnMetersUntilActorReady(state);
    state.turnOrderPreview = this.calculateTurnOrderPreview(state);
    return state;
  }

  /**
   * Advances turn meters continuously until at least one living participant hits 100+
   */
  advanceTurnMetersUntilActorReady(state: BattleState): string | null {
    if (this.checkBattleEnd(state)) return null;

    let iterations = 0;
    const maxIterations = 500;

    while (iterations < maxIterations) {
      iterations++;
      const allLiving = this.getAllLivingParticipants(state);
      if (allLiving.length === 0) {
        this.checkBattleEnd(state);
        return null;
      }

      // Check if anyone has already reached the cap
      const readyActors = allLiving.filter((p) => p.turnMeter >= TURN_METER_CAP);

      if (readyActors.length > 0) {
        // Sort by turn meter descending, then speed descending
        readyActors.sort((a, b) => b.turnMeter - a.turnMeter || b.stats.speed - a.stats.speed);
        const actor = readyActors[0];
        state.currentActorId = actor.id;
        state.phase = 'SELECTING_ACTION';
        state.currentExtraTurnDepth = 0;
        state.consecutiveActionsCount = 0;
        state.activeActionContext = null;
        state.turnOrderPreview = this.calculateTurnOrderPreview(state);

        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: actor.id,
          sourceName: actor.name,
          actionType: 'SKILL',
          message: `[TURN] ${actor.name} begins turn.`,
        });

        // Process start-of-turn effects (DoTs, Stuns, Cooldowns)
        const canAct = this.processStartOfTurn(state, actor);
        if (!canAct) {
          // Actor was stunned/frozen/asleep - turn ends immediately
          actor.turnMeter = 0;
          state.currentActorId = null;
          continue; // Loop again to find next actor
        }

        return actor.id;
      }

      // Ticking turn meters forward based on effective speed
      for (const participant of allLiving) {
        let effectiveSpeed = participant.stats.speed;
        if (participant.activeEffects.some((e) => e.type === 'SPEED_UP')) {
          effectiveSpeed = Math.floor(effectiveSpeed * 1.30);
        }
        if (participant.activeEffects.some((e) => e.type === 'SPEED_DOWN')) {
          effectiveSpeed = Math.floor(effectiveSpeed * 0.70);
        }
        const speedGain = Math.max(5, effectiveSpeed / TICK_RATE_DIVISOR);
        participant.turnMeter += speedGain;
      }
    }

    // Safety fallback if iterations exceeded to prevent hard freeze
    const allLivingFallback = this.getAllLivingParticipants(state);
    if (allLivingFallback.length > 0) {
      allLivingFallback.sort((a, b) => b.turnMeter - a.turnMeter || b.stats.speed - a.stats.speed);
      const forcedActor = allLivingFallback[0];
      forcedActor.turnMeter = TURN_METER_CAP;
      state.currentActorId = forcedActor.id;
      state.phase = 'SELECTING_ACTION';
      state.currentExtraTurnDepth = 0;
      state.consecutiveActionsCount = 0;
      return forcedActor.id;
    }

    return null;
  }

  /**
   * Executes a player or enemy action with deterministic extra-turn safety
   */
  executeAction(
    state: BattleState,
    actorId: string,
    skillId: string,
    targetId: string
  ): BattleState {
    const actor = this.findParticipant(state, actorId);
    if (!actor || !actor.isAlive) return state;

    const skill = getSkillDefinition(skillId);
    if (!skill) return state;

    // Validate Cooldown
    const skillTracker = actor.skills.find((s) => s.definitionId === skill.id);
    if (skillTracker && skillTracker.currentCooldown > 0) {
      this.addLog(state, {
        turnCount: state.turnCount,
        sourceId: actor.id,
        sourceName: actor.name,
        skillName: skill.name,
        actionType: 'SKILL',
        message: `[COOLDOWN REJECT] ${actor.name} cannot cast [${skill.name}] (${skillTracker.currentCooldown} turns remaining).`,
      });
      return state;
    }

    // Setup Action Resolution Context
    const currentDepth = state.currentExtraTurnDepth || 0;
    const previousChainSkills = state.activeActionContext ? state.activeActionContext.skillsUsedInChain : [];
    const actionContext = {
      actionId: `act_${Date.now()}_${this.rng.nextInt(1000, 9999)}`,
      actorId: actor.id,
      skillId: skill.id,
      triggerSource: currentDepth > 0 ? (state.activeActionContext?.skillId || 'EXTRA_TURN') : 'NORMAL_TURN',
      extraTurnDepth: currentDepth,
      skillsUsedInChain: [...previousChainSkills, skill.id],
      triggeredEffects: [] as string[],
      resolvedEffects: [] as string[],
      killedTargetIds: [] as string[],
    };
    state.activeActionContext = actionContext;

    state.turnCount++;

    // Log the skill usage
    this.addLog(state, {
      turnCount: state.turnCount,
      sourceId: actor.id,
      sourceName: actor.name,
      skillName: skill.name,
      actionType: 'SKILL',
      message: `[ACTION] ${actor.name} casts [${skill.name}]!`,
    });

    // Resolve target(s)
    const targets = this.resolveTargets(state, actor, skill, targetId);

    // Dark Mage Student Flavor: Sacrifices 15% own current HP to unleash massive heals
    if (skill.id === 'skill_magestudent_blood_communion') {
      const hpSacrifice = Math.max(1, Math.floor(actor.currentHp * 0.15));
      actor.currentHp = Math.max(1, actor.currentHp - hpSacrifice);
      this.addLog(state, {
        turnCount: state.turnCount,
        sourceId: actor.id,
        sourceName: actor.name,
        actionType: 'DAMAGE',
        message: `${actor.name} sacrificed ${hpSacrifice} HP to channel Blood Arcana Transfusion!`,
      });

      // Passive: Vampiric Leyline leeches 10% Turn Meter from enemy with highest TM
      const opposingTeam = state.playerTeam.some((p) => p.id === actor.id)
        ? state.enemyTeam
        : state.playerTeam;
      const aliveOpponents = opposingTeam.filter((e) => e.isAlive);
      if (aliveOpponents.length > 0) {
        aliveOpponents.sort((a, b) => b.turnMeter - a.turnMeter);
        const highestEnemy = aliveOpponents[0];
        highestEnemy.turnMeter = Math.max(0, highestEnemy.turnMeter - 10);
        actor.turnMeter = Math.min(100, actor.turnMeter + 10);
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: actor.id,
          sourceName: actor.name,
          targetId: highestEnemy.id,
          targetName: highestEnemy.name,
          actionType: 'TURN_METER',
          message: `${actor.name}'s Vampiric Leyline leeched 10% Turn Meter from ${highestEnemy.name}!`,
        });
      }
    }

    // Dark Goblin Berserker Flavor: Sacrifices own HP to fuel armor-shredding burst
    if (skill.id === 'skill_goblin_blood_rend') {
      const hpSacrifice = Math.max(1, Math.floor(actor.currentHp * 0.10));
      actor.currentHp = Math.max(1, actor.currentHp - hpSacrifice);
      this.addLog(state, {
        turnCount: state.turnCount,
        sourceId: actor.id,
        sourceName: actor.name,
        actionType: 'DAMAGE',
        message: `${actor.name} sacrificed ${hpSacrifice} HP to empower Blood Rend!`,
      });
    } else if (skill.id === 'skill_goblin_kamikaze_behead') {
      const hpSacrifice = Math.max(1, Math.floor(actor.currentHp * 0.20));
      actor.currentHp = Math.max(1, actor.currentHp - hpSacrifice);
      this.addLog(state, {
        turnCount: state.turnCount,
        sourceId: actor.id,
        sourceName: actor.name,
        actionType: 'DAMAGE',
        message: `${actor.name} sacrificed ${hpSacrifice} HP to unleash a catastrophic Guillotine Sunder execution strike!`,
      });
    }

    // Apply primary skill effects
    for (const effect of skill.effects) {
      if (effect.type === 'DAMAGE') {
        this.applyDamageEffect(state, actor, skill, effect, targets);
        actionContext.resolvedEffects.push('DAMAGE');
      } else if (effect.type === 'HEAL') {
        this.applyHealEffect(state, actor, skill, effect, targets);
        actionContext.resolvedEffects.push('HEAL');
      } else if (effect.type === 'SHIELD') {
        this.applyShieldEffect(state, actor, effect, targets);
        actionContext.resolvedEffects.push('SHIELD');
      } else if (effect.type === 'APPLY_STATUS' && effect.statusEffect) {
        this.applyStatusEffect(state, actor, effect, targets);
        actionContext.resolvedEffects.push('APPLY_STATUS');
      } else if (effect.type === 'CLEANSE') {
        this.applyCleanseEffect(state, targets, effect.dispelCount || 1, actor, skill.id);
        actionContext.resolvedEffects.push('CLEANSE');
      } else if (effect.type === 'DISPEL') {
        this.applyDispelEffect(state, actor, skill, targets, effect.dispelCount || 1);
        actionContext.resolvedEffects.push('DISPEL');
      } else if (effect.type === 'TURN_METER_BOOST' || effect.type === 'TURN_METER_REDUCE') {
        this.applyTurnMeterDelta(state, targets, effect.turnMeterDelta || 0);
        actionContext.resolvedEffects.push('TURN_METER');
      } else if (effect.type === 'EXTRA_TURN') {
        // Ability-specific condition check
        let conditionMet = true;
        if (skill.id === 'skill_infernal_cataclysm') {
          // Infernal Cataclysm requires Burn on target
          const targetHadBurn = targets.some((t) =>
            t.activeEffects.some((e) => e.type === 'CONTINUOUS_DAMAGE')
          );
          if (!targetHadBurn) {
            conditionMet = false;
          }
        }
        if (conditionMet) {
          actionContext.triggeredEffects.push('EXTRA_TURN');
        }
      } else if (effect.type === 'RESET_COOLDOWN') {
        // Eclipse Execution: only resets if a target was killed by this action
        if (actionContext.killedTargetIds.length > 0) {
          actionContext.triggeredEffects.push('RESET_COOLDOWN');
        }
      } else if (effect.type === 'DOUBLE_ATTACK') {
        const doubleAttackChance = effect.chance !== undefined ? effect.chance : 0.50;
        if (this.rng.chance(doubleAttackChance)) {
          actionContext.triggeredEffects.push('DOUBLE_ATTACK');
        }
      }
    }

    // Fire Silly Clown: Chaotic Firecracker Roulette (Random: Taunt, Silence, or Burn)
    if (skill.id === 'skill_clown_chaotic_firecracker_roulette') {
      const chaoticEffects: StatusEffectType[] = ['TAUNT', 'SILENCE', 'CONTINUOUS_DAMAGE'];
      for (const target of targets) {
        if (!target.isAlive) continue;
        const count = this.rng.chance(0.35) ? 2 : 1;
        const shuffled = [...chaoticEffects].sort(() => this.rng.next() - 0.5);
        for (let i = 0; i < count; i++) {
          const chosen = shuffled[i];
          target.activeEffects.push({
            id: `firecracker_${chosen}_${Date.now()}_${this.rng.nextInt(100, 999)}`,
            type: chosen,
            name: chosen === 'CONTINUOUS_DAMAGE' ? 'Carnival Burn' : chosen.replace('_', ' '),
            isBuff: false,
            duration: 2,
            sourceParticipantId: actor.id,
          });
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: actor.id,
            sourceName: actor.name,
            targetId: target.id,
            targetName: target.name,
            actionType: 'DEBUFF',
            message: `🎪 Firecracker Roulette afflicted ${target.name} with chaotic [${chosen.replace('_', ' ')}]!`,
          });
        }
      }
    }

    // Water Silly Clown: Slippery Circus Deluge (Confusion, Attack Down, Speed Down)
    if (skill.id === 'skill_clown_slippery_circus_deluge') {
      const waterDebuffs: StatusEffectType[] = ['CONFUSION', 'ATTACK_DOWN', 'SPEED_DOWN'];
      for (const target of targets) {
        if (!target.isAlive) continue;
        const count = this.rng.chance(0.40) ? 2 : 1;
        const shuffled = [...waterDebuffs].sort(() => this.rng.next() - 0.5);
        for (let i = 0; i < count; i++) {
          const chosen = shuffled[i];
          target.activeEffects.push({
            id: `slippery_${chosen}_${Date.now()}_${this.rng.nextInt(100, 999)}`,
            type: chosen,
            name: chosen.replace('_', ' '),
            isBuff: false,
            duration: 2,
            sourceParticipantId: actor.id,
          });
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: actor.id,
            sourceName: actor.name,
            targetId: target.id,
            targetName: target.name,
            actionType: 'DEBUFF',
            message: `🎪 Slippery Circus Deluge soaked ${target.name} with [${chosen.replace('_', ' ')}]!`,
          });
        }
      }
    }

    // Grass Silly Clown: Jack-in-the-Box Turn Meter Pandemonium
    if (skill.id === 'skill_clown_turn_meter_pandemonium') {
      for (const target of targets) {
        if (!target.isAlive) continue;
        const newTm = this.rng.nextInt(0, 50);
        target.turnMeter = newTm;
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: actor.id,
          sourceName: actor.name,
          targetId: target.id,
          targetName: target.name,
          actionType: 'TURN_METER',
          message: `🌀 Spores & laughing gas shuffled ${target.name}'s Turn Meter to ${newTm}%!`,
        });
      }
      // Spore Juggler Passive trigger: Steals 15% from highest enemy
      const enemyTeam = state.playerTeam.some((p) => p.id === actor.id) ? state.enemyTeam : state.playerTeam;
      const aliveEnemies = enemyTeam.filter((e) => e.isAlive);
      if (aliveEnemies.length > 0) {
        aliveEnemies.sort((a, b) => b.turnMeter - a.turnMeter);
        const fastest = aliveEnemies[0];
        fastest.turnMeter = Math.max(0, fastest.turnMeter - 15);
        actor.turnMeter = Math.min(100, actor.turnMeter + 15);
        const debuffPool: StatusEffectType[] = ['ATTACK_DOWN', 'DEFENSE_DOWN', 'SPEED_DOWN'];
        const randomDebuff = debuffPool[this.rng.nextInt(0, debuffPool.length - 1)];
        fastest.activeEffects.push({
          id: `spore_juggle_${Date.now()}_${this.rng.nextInt(100, 999)}`,
          type: randomDebuff,
          name: randomDebuff.replace('_', ' '),
          isBuff: false,
          duration: 2,
          sourceParticipantId: actor.id,
        });
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: actor.id,
          sourceName: actor.name,
          targetId: fastest.id,
          targetName: fastest.name,
          actionType: 'TURN_METER',
          message: `🤹 Spore Juggler siphoned 15% Turn Meter from ${fastest.name} and afflicted them with [${randomDebuff.replace('_', ' ')}]!`,
        });
      }
    }

    // Dark Silly Clown: Macabre Sideshow Hex (Fear, Hex Curse, Healing Block)
    if (skill.id === 'skill_clown_macabre_sideshow_hex') {
      for (const target of targets) {
        if (!target.isAlive) continue;
        target.activeEffects.push({
          id: `clown_hex_${Date.now()}_${this.rng.nextInt(100, 999)}`,
          type: 'CONTINUOUS_DAMAGE',
          name: 'Spiteful Hex Curse',
          isBuff: false,
          duration: 2,
          sourceParticipantId: actor.id,
        });
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: actor.id,
          sourceName: actor.name,
          targetId: target.id,
          targetName: target.name,
          actionType: 'DEBUFF',
          message: `🎭 Macabre Sideshow hexed ${target.name} with Spiteful Hex Curse and absolute Healing-Block!`,
        });
      }
    }

    // Check if actor has active DOUBLE_ATTACK buff (e.g. from Nether Shroud / Shadow Frenzy)
    const hasDoubleAttackBuff = actor.activeEffects.some((e) => e.type === 'DOUBLE_ATTACK');
    if (hasDoubleAttackBuff && !actionContext.triggeredEffects.includes('DOUBLE_ATTACK')) {
      if (this.rng.chance(0.50)) {
        actionContext.triggeredEffects.push('DOUBLE_ATTACK');
      }
    }

    // Check if actor has passive with DOUBLE_ATTACK (e.g. Blood Scent, Evasive Hunter)
    if (actor.passiveSkillId && !actionContext.triggeredEffects.includes('DOUBLE_ATTACK')) {
      const passiveDef = getSkillDefinition(actor.passiveSkillId);
      const passiveDoubleAttack = passiveDef?.effects?.find((e) => e.type === 'DOUBLE_ATTACK');
      if (passiveDoubleAttack && this.rng.chance(passiveDoubleAttack.chance || 0.30)) {
        actionContext.triggeredEffects.push('DOUBLE_ATTACK');
      }
    }

    // Resolve Attack Twice follow-up strike
    let didDoubleAttack = false;
    if (actionContext.triggeredEffects.includes('DOUBLE_ATTACK')) {
      const liveTargets = targets.filter((t) => t.isAlive);
      const damageEffects = skill.effects.filter((e) => e.type === 'DAMAGE');

      if (damageEffects.length > 0 && liveTargets.length > 0) {
        didDoubleAttack = true;
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: actor.id,
          sourceName: actor.name,
          skillName: skill.name,
          actionType: 'SKILL',
          message: `[DOUBLE ATTACK] ${actor.name} strikes with blazing agility, attacking a second time!`,
        });

        for (const dmgEffect of damageEffects) {
          this.applyDamageEffect(state, actor, skill, dmgEffect, liveTargets);
        }
      } else if (skill.targetType === 'SELF') {
        // If skill was self-buff (e.g. Nether Shroud), unleash an immediate surprise attack
        const enemyTargets =
          actor.team === 'PLAYER'
            ? state.enemyTeam.filter((e) => e.isAlive)
            : state.playerTeam.filter((p) => p.isAlive);
        if (enemyTargets.length > 0) {
          const autoTarget = enemyTargets[0];
          didDoubleAttack = true;
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: actor.id,
            sourceName: actor.name,
            skillName: skill.name,
            actionType: 'SKILL',
            message: `[DOUBLE ATTACK] ${actor.name} strikes ${autoTarget.name} from the shroud!`,
          });
          this.applyDamageEffect(
            state,
            actor,
            skill,
            { type: 'DAMAGE', multiplier: 2.8, scalingStat: 'attack' },
            [autoTarget]
          );
        }
      }
    }

    // Set cooldown for used skill (if not a basic attack)
    // NOTE: Cooldown is ALWAYS applied immediately upon use.
    if (skillTracker && skill.cooldown > 0) {
      if (actionContext.triggeredEffects.includes('RESET_COOLDOWN')) {
        skillTracker.currentCooldown = 0;
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: actor.id,
          sourceName: actor.name,
          skillName: skill.name,
          actionType: 'BUFF',
          message: `[TRIGGER] Lethal strike with [${skill.name}] secured a kill! Cooldown reset immediately.`,
        });
      } else {
        skillTracker.currentCooldown = skill.cooldown;
      }
    }

    // Extra-Turn Evaluation & Safety Validation
    let extraTurnGranted = false;
    if (actionContext.triggeredEffects.includes('EXTRA_TURN')) {
      const skillsInChain = actionContext.skillsUsedInChain;

      // Safety Rule 1: Max extra-turn chain depth reached
      if (currentDepth >= MAX_EXTRA_TURN_CHAIN_DEPTH) {
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: actor.id,
          sourceName: actor.name,
          actionType: 'TURN_METER',
          message: `[EXTRA TURN CAPPED] ${actor.name} reached maximum extra-turn chain depth (${MAX_EXTRA_TURN_CHAIN_DEPTH}). Extra turn suppressed for battle stability.`,
        });
      }
      // Safety Rule 2: Recursion guard — identical ability cannot grant an extra turn twice in the same chain
      else if (skillsInChain.filter((sId) => sId === skill.id).length > 1) {
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: actor.id,
          sourceName: actor.name,
          actionType: 'TURN_METER',
          message: `[GUARD] [${skill.name}] was already executed in this extra-turn chain and cannot recursively grant extra turns.`,
        });
      }
      // Safety Rule 3: Actor must be alive and battle must still be active
      else if (!actor.isAlive || state.phase === 'VICTORY' || state.phase === 'DEFEAT') {
        // Extra turn invalid
      }
      // Safety Rule 4: Consecutive actions limit
      else if ((state.consecutiveActionsCount || 0) >= MAX_CONSECUTIVE_ACTIONS) {
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: actor.id,
          sourceName: actor.name,
          actionType: 'TURN_METER',
          message: `[LOOP PROTECTION] Consecutive actions limit reached (${MAX_CONSECUTIVE_ACTIONS}). Extra turn halted.`,
        });
      } else {
        extraTurnGranted = true;
      }
    }

    // End-of-turn processing
    if (extraTurnGranted) {
      const newDepth = currentDepth + 1;
      state.currentExtraTurnDepth = newDepth;
      state.consecutiveActionsCount = (state.consecutiveActionsCount || 0) + 1;
      state.currentActorId = actor.id;
      actor.turnMeter = TURN_METER_CAP;

      this.addLog(state, {
        turnCount: state.turnCount,
        sourceId: actor.id,
        sourceName: actor.name,
        actionType: 'TURN_METER',
        message: `[TRIGGER] Extra Turn condition satisfied for [${skill.name}].`,
      });

      this.addLog(state, {
        turnCount: state.turnCount,
        sourceId: actor.id,
        sourceName: actor.name,
        actionType: 'BUFF',
        message: `[EXTRA TURN] ${actor.name} receives an Extra Turn! (Chain: ${newDepth}/${MAX_EXTRA_TURN_CHAIN_DEPTH})`,
      });

      this.addLog(state, {
        turnCount: state.turnCount,
        sourceId: actor.id,
        sourceName: actor.name,
        actionType: 'SKILL',
        message: `[TURN] ${actor.name} begins extra turn (Chain: ${newDepth}/${MAX_EXTRA_TURN_CHAIN_DEPTH}).`,
      });

      // Start of Extra Turn processing:
      // Decrements buff/debuff durations and decrements skill cooldowns by 1.
      // Nether Shroud was set to 4 cooldown, and now becomes 3 cooldown (still strictly on cooldown!).
      this.processStartOfTurn(state, actor);

      state.phase = 'SELECTING_ACTION';
      state.turnOrderPreview = this.calculateTurnOrderPreview(state);
    } else {
      // Normal turn completion
      actor.turnMeter = Math.max(0, actor.turnMeter - TURN_METER_CAP);
      state.currentActorId = null;
      state.currentExtraTurnDepth = 0;
      state.consecutiveActionsCount = 0;
      state.activeActionContext = null;

      // Advance turn meters if battle not over
      if (!this.checkBattleEnd(state)) {
        this.advanceTurnMetersUntilActorReady(state);
      }
    }

    // Determine skill slot (1, 2, or 3)
    let slot: 1 | 2 | 3 = 1;
    if (actor.skills[2]?.definitionId === skill.id) slot = 3;
    else if (actor.skills[1]?.definitionId === skill.id) slot = 2;
    else if (actor.skills[0]?.definitionId === skill.id) slot = 1;
    else {
      const sLower = (skill?.name || skill?.id || '').toLowerCase();
      if (
        sLower.includes('cataclysm') ||
        sLower.includes('resurgence') ||
        sLower.includes('rejuvenation') ||
        sLower.includes('supernova') ||
        sLower.includes('execution') ||
        sLower.includes('3')
      ) {
        slot = 3;
      } else if (
        sLower.includes('volcanic') ||
        sLower.includes('bastion') ||
        sLower.includes('spring') ||
        sLower.includes('chorus') ||
        sLower.includes('shroud') ||
        sLower.includes('2')
      ) {
        slot = 2;
      }
    }

    const isAoe = skill.targetType === 'ALL_ENEMIES' || skill.targetType === 'ALL_ALLIES';
    const isAllyBuff =
      skill.targetType === 'ALL_ALLIES' || skill.targetType === 'SINGLE_ALLY' || skill.targetType === 'SELF';
    const primaryTargetId = targetId || targets[0]?.id || null;

    state.lastExecutedAction = {
      id: `act_${Date.now()}_${this.rng.nextInt(1000, 9999)}`,
      actorId: actor.id,
      targetId: primaryTargetId,
      allTargetIds: targets.map((t) => t.id),
      killedTargetIds: [...actionContext.killedTargetIds],
      skillId: skill.id,
      skillName: skill.name,
      slot,
      element: actor.element,
      isCrit:
        actionContext.triggeredEffects.includes('CRIT') || actionContext.resolvedEffects.includes('CRIT'),
      isExtraTurn: extraTurnGranted,
      isDoubleAttack: didDoubleAttack,
      isAoe,
      isAllyBuff,
      timestamp: Date.now(),
    };

    return state;
  }

  /**
   * Automates the current turn using modular AI logic with state loop detection
   */
  stepAutoBattle(state: BattleState): BattleState {
    if (!state.currentActorId) {
      this.advanceTurnMetersUntilActorReady(state);
    }

    if (state.phase === 'VICTORY' || state.phase === 'DEFEAT' || !state.currentActorId) {
      return state;
    }

    const actor = this.findParticipant(state, state.currentActorId);
    if (!actor || !actor.isAlive) {
      this.advanceTurnMetersUntilActorReady(state);
      return state;
    }

    // Battle-State Loop Detection Guard
    const stateFingerprint = `${state.turnCount}_${actor.id}_${actor.currentHp}_${state.playerTeam
      .map((p) => p.currentHp)
      .join(',')}_${state.enemyTeam.map((e) => e.currentHp).join(',')}`;

    if (state.lastStateFingerprint === stateFingerprint) {
      state.loopDetectionCount = (state.loopDetectionCount || 0) + 1;
      if (state.loopDetectionCount >= 4) {
        // Safe loop break: consume turn meter, advance next actor
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: 'system',
          sourceName: 'System',
          actionType: 'TURN_METER',
          message: `[BATTLE LOOP DETECTED] Repeated state detected without progress. Advancing turn meters safely.`,
        });
        actor.turnMeter = 0;
        state.currentActorId = null;
        state.currentExtraTurnDepth = 0;
        state.consecutiveActionsCount = 0;
        state.activeActionContext = null;
        state.loopDetectionCount = 0;
        this.advanceTurnMetersUntilActorReady(state);
        return state;
      }
    } else {
      state.lastStateFingerprint = stateFingerprint;
      state.loopDetectionCount = 0;
    }

    // AI selects skill & target
    const { skillId, targetId } = this.selectAiAction(state, actor);
    return this.executeAction(state, actor.id, skillId, targetId);
  }

  /**
   * Intelligent AI Action & Target Selection
   */
  private selectAiAction(
    state: BattleState,
    actor: BattleParticipant
  ): { skillId: string; targetId: string } {
    // 1. Pick highest priority available skill (longest cooldown first)
    const availableSkills = actor.skills
      .filter((s) => s.currentCooldown === 0)
      .map((s) => getSkillDefinition(s.definitionId))
      .filter((def): def is SkillDefinition => !!def && !def.isPassive)
      .sort((a, b) => b.cooldown - a.cooldown);

    const chosenSkill = availableSkills[0] || getSkillDefinition(actor.skills[0].definitionId)!;

    // 2. Determine opposing and friendly teams
    const enemyTeam = actor.team === 'PLAYER' ? state.enemyTeam : state.playerTeam;
    const allyTeam = actor.team === 'PLAYER' ? state.playerTeam : state.enemyTeam;

    let targetId = '';

    if (
      chosenSkill.targetType === 'SINGLE_ALLY' ||
      chosenSkill.targetType === 'ALL_ALLIES' ||
      chosenSkill.targetType === 'SELF'
    ) {
      if (chosenSkill.targetType === 'SELF') {
        targetId = actor.id;
      } else {
        // Ally with lowest HP percent
        const livingAllies = allyTeam.filter((a) => a.isAlive);
        livingAllies.sort((a, b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp);
        targetId = livingAllies[0]?.id || actor.id;
      }
    } else {
      // Offensive skill: target enemy
      const livingEnemies = enemyTeam.filter((e) => e.isAlive);

      // Prioritize: 1. Killable target (< 25% HP), 2. Elemental advantage, 3. Lowest HP
      const killable = livingEnemies.find((e) => e.currentHp / e.maxHp <= 0.25);
      if (killable) {
        targetId = killable.id;
      } else {
        const advantageTarget = livingEnemies.find(
          (e) => getElementAffinity(actor.element, e.element) === 'ADVANTAGE'
        );
        if (advantageTarget) {
          targetId = advantageTarget.id;
        } else {
          livingEnemies.sort((a, b) => a.currentHp - b.currentHp);
          targetId = livingEnemies[0]?.id || '';
        }
      }
    }

    return { skillId: chosenSkill.id, targetId };
  }

  /**
   * Processes DoTs, heals, and CC ticks at start of turn
   */
  private processStartOfTurn(state: BattleState, actor: BattleParticipant): boolean {
    let canAct = true;

    // 1. Process DoTs and HoTs
    for (let i = actor.activeEffects.length - 1; i >= 0; i--) {
      const effect = actor.activeEffects[i];

      if (effect.type === 'CONTINUOUS_DAMAGE') {
        let baseRatio = 0.05;
        const opposingTeam = state.playerTeam.some((p) => p.id === actor.id)
          ? state.enemyTeam
          : state.playerTeam;

        // Grass Poisonous Lizardman: Rampant Spore Colony (+30% tick damage)
        const grassLizardman = opposingTeam.find(
          (p) =>
            p.isAlive &&
            (p.id.includes('lizardman_grass') ||
              p.skills.some((s) => s.definitionId === 'skill_passive_rampant_spores'))
        );
        if (grassLizardman) {
          baseRatio *= 1.30;
        }

        const dotDamage = Math.max(1, Math.floor(actor.maxHp * baseRatio));
        actor.currentHp = Math.max(0, actor.currentHp - dotDamage);
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: 'system',
          sourceName: 'Burn / DoT',
          targetId: actor.id,
          targetName: actor.name,
          actionType: 'DAMAGE',
          damage: dotDamage,
          message: `${actor.name} suffers ${dotDamage} Continuous Damage!`,
        });

        // Water Poisonous Lizardman: Slowing Slime-Poison (reduces enemy Speed / Turn Meter while ticking)
        const waterLizardman = opposingTeam.find(
          (p) =>
            p.isAlive &&
            (p.id.includes('lizardman_water') ||
              p.skills.some((s) => s.definitionId === 'skill_passive_paralyzing_slime'))
        );
        if (waterLizardman && actor.isAlive) {
          const tmSlow = 15;
          actor.turnMeter = Math.max(0, actor.turnMeter - tmSlow);
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: waterLizardman.id,
            sourceName: waterLizardman.name,
            targetId: actor.id,
            targetName: actor.name,
            actionType: 'TURN_METER',
            message: `${actor.name}'s Turn Meter was slowed by -${tmSlow}% due to Slowing Slime-Poison!`,
          });
        }

        // Dark Poisonous Lizardman: Necrotic venom that heals the Lizardman for a percentage of the DoT damage dealt
        const darkLizardman = opposingTeam.find(
          (p) =>
            p.isAlive &&
            (p.id.includes('lizardman_dark') ||
              p.skills.some((s) => s.definitionId === 'skill_passive_necrotic_siphon'))
        );
        if (darkLizardman) {
          const leechHeal = Math.min(
            darkLizardman.maxHp - darkLizardman.currentHp,
            Math.max(1, Math.floor(dotDamage * 0.60))
          );
          darkLizardman.currentHp += leechHeal;
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: darkLizardman.id,
            sourceName: darkLizardman.name,
            targetId: darkLizardman.id,
            targetName: darkLizardman.name,
            actionType: 'HEAL',
            message: `${darkLizardman.name}'s Necrotic Siphon restored ${leechHeal} HP from ${actor.name}'s ticking venom!`,
          });
        }

        if (actor.currentHp <= 0) {
          actor.isAlive = false;
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: 'system',
            sourceName: 'System',
            targetId: actor.id,
            targetName: actor.name,
            actionType: 'DEATH',
            message: `${actor.name} collapsed from continuous damage!`,
          });
          return false;
        }
      } else if (effect.type === 'CONTINUOUS_HEAL') {
        const healAmt = Math.min(actor.maxHp - actor.currentHp, Math.floor(actor.maxHp * 0.15));
        actor.currentHp += healAmt;
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: 'system',
          sourceName: 'Continuous Heal',
          targetId: actor.id,
          targetName: actor.name,
          actionType: 'HEAL',
          message: `${actor.name} regenerates ${healAmt} HP.`,
        });
      }

      // Check Crowd Control preventing turn
      if (effect.type === 'STUN' || effect.type === 'FREEZE' || effect.type === 'SLEEP') {
        canAct = false;
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: 'system',
          sourceName: 'Crowd Control',
          targetId: actor.id,
          targetName: actor.name,
          actionType: 'DEBUFF',
          message: `${actor.name} is incapacitated by ${effect.type} and cannot move!`,
        });
      } else if (effect.type === 'CONFUSION') {
        if (this.rng.chance(0.40)) {
          canAct = false;
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: 'system',
            sourceName: 'Confusion',
            targetId: actor.id,
            targetName: actor.name,
            actionType: 'DEBUFF',
            message: `💫 ${actor.name} is hopelessly confused by the circus pandemonium and stumbles, losing their turn!`,
          });
        }
      }

      // Decrement duration
      effect.duration -= 1;
      if (effect.duration <= 0) {
        actor.activeEffects.splice(i, 1);
      }
    }

    // Water Silly Clown: Soapy Mayhem (30% chance for debuffed enemies to slip on turn start)
    const opposingTeam = state.playerTeam.some((p) => p.id === actor.id) ? state.enemyTeam : state.playerTeam;
    const hasWaterClown = opposingTeam.some(
      (m) =>
        m.isAlive &&
        (m.id.includes('sillyclown_water') || m.skills?.some((s) => s.definitionId === 'skill_passive_soapy_mayhem'))
    );
    if (hasWaterClown && canAct) {
      const hasSoapyDebuff = actor.activeEffects.some(
        (e) => e.type === 'CONFUSION' || e.type === 'ATTACK_DOWN' || e.type === 'SPEED_DOWN'
      );
      if (hasSoapyDebuff && this.rng.chance(0.30)) {
        actor.turnMeter = Math.max(0, actor.turnMeter - 20);
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: 'soapy_floor',
          sourceName: 'Soapy Mayhem',
          targetId: actor.id,
          targetName: actor.name,
          actionType: 'TURN_METER',
          message: `🧼 ${actor.name} slipped on soapy circus water, losing -20% Turn Meter!`,
        });
      }
    }

    // 2. Decrement skill cooldowns for actor
    for (const skill of actor.skills) {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown -= 1;
      }
    }

    return canAct;
  }

  /**
   * Applies damage effect from skill
   */
  private applyDamageEffect(
    state: BattleState,
    attacker: BattleParticipant,
    skill: SkillDefinition,
    effect: any,
    targets: BattleParticipant[]
  ) {
    const scalingStatVal =
      effect.scalingStat === 'hp'
        ? attacker.maxHp
        : effect.scalingStat === 'defense'
        ? attacker.stats.defense
        : attacker.stats.attack;

    const basePower = scalingStatVal * (effect.multiplier || 2.5);
    const hits = effect.hits || 1;

    for (const target of targets) {
      if (!target.isAlive) continue;

      const affinity = getElementAffinity(attacker.element, target.element);
      let totalDamageDealt = 0;
      let landedCrit = false;

      // Check execution bonus damage: Eclipse Execution (+50% bonus if target HP < 50%)
      const isLowHpTarget = target.currentHp / target.maxHp < 0.5;
      const executionMultiplier = skill.id === 'skill_eclipse_execution' && isLowHpTarget ? 1.5 : 1.0;

      // Fire Poisonous Lizardman: Cauterizing Bile (+25% bonus damage against targets with Continuous Damage)
      const hasCauterizingBile = attacker.skills.some(
        (s) => s.definitionId === 'skill_passive_cauterizing_bile'
      );
      const targetHasDot = target.activeEffects.some((e) => e.type === 'CONTINUOUS_DAMAGE');
      const dotBonus = hasCauterizingBile && targetHasDot ? 1.25 : 1.0;

      // Light Poisonous Lizardman: Dazzling Neurotoxin (+20% bonus damage against Blinded targets)
      const hasDazzlingNeurotoxin = attacker.skills.some(
        (s) => s.definitionId === 'skill_passive_dazzling_neurotoxin'
      );
      const targetIsBlind = target.activeEffects.some((e) => e.type === 'BLIND');
      const blindBonus = hasDazzlingNeurotoxin && targetIsBlind ? 1.20 : 1.0;

      // Grass Goblin Berserker: Missing HP scaling
      const missingHpRatio = Math.max(0, 1 - (target.currentHp / target.maxHp));
      let missingHpMultiplier = 1.0;
      if (skill.id === 'skill_goblin_wild_club') {
        missingHpMultiplier = 1.0 + (missingHpRatio * 0.50);
      } else if (skill.id === 'skill_goblin_executioners_bludgeon') {
        missingHpMultiplier = 1.0 + (missingHpRatio * 1.0);
      } else if (attacker.skills?.some((s) => s.definitionId === 'skill_passive_apex_scavenger')) {
        missingHpMultiplier = 1.0 + (missingHpRatio * 0.40);
      }

      // Water Goblin Berserker: Crushing Momentum (+30% bonus if target has DEFENSE_DOWN)
      const targetHasDefDown = target.activeEffects.some((e) => e.type === 'DEFENSE_DOWN');
      const momentumDamageBonus =
        (skill.id === 'skill_goblin_crushing_momentum' || attacker.id.includes('goblinberserker_water')) && targetHasDefDown
          ? 1.30
          : 1.0;

      // Fire Goblin Berserker: Blazing Fury / Molten Cleave
      const isFireGoblin =
        attacker.id.includes('goblinberserker_fire') ||
        attacker.skills?.some(
          (s) => s.definitionId === 'skill_passive_blazing_fury' || s.definitionId === 'skill_goblin_molten_cleave'
        );

      // Light Goblin Berserker: Holy Zealot (+75% bonus damage to Dark-element enemies or Bosses)
      const isTargetBoss = !!target.isBoss || target.variantId?.startsWith('var_boss_') || target.id?.includes('boss');
      const isDarkOrBoss = target.element === 'DARK' || isTargetBoss;
      const isLightGoblin =
        attacker.id.includes('goblinberserker_light') ||
        attacker.skills?.some(
          (s) => s.definitionId === 'skill_passive_holy_zealot' || s.definitionId === 'skill_goblin_righteous_judgment'
        );
      const holyZealotBonus = isLightGoblin && isDarkOrBoss ? (target.element === 'DARK' && isTargetBoss ? 2.0 : 1.75) : 1.0;

      // Dark Goblin Berserker: Death Drive (missing HP boost to attack)
      const attackerMissingHpRatio = Math.max(0, 1 - (attacker.currentHp / attacker.maxHp));
      const hasDeathDrive =
        attacker.skills?.some((s) => s.definitionId === 'skill_passive_death_drive') ||
        attacker.id.includes('goblinberserker_dark');
      const deathDriveBonus = hasDeathDrive ? 1.0 + attackerMissingHpRatio : 1.0;

      // Light Silly Clown: Blinded target takes +25% increased damage
      const targetIsBlinded = target.activeEffects.some((e) => e.type === 'BLIND');
      const blindVulnBonus = targetIsBlinded ? 1.25 : 1.0;

      // Light Silly Clown: Blinded attacker deals 30% less damage
      const attackerIsBlind = attacker.activeEffects.some((e) => e.type === 'BLIND');
      const blindAtkPenalty = attackerIsBlind ? 0.70 : 1.0;

      // Dark Silly Clown: Macabre Nightmare (+20% damage on cursed or healing-blocked targets)
      const isCursedOrBlocked = target.activeEffects.some(
        (e) => e.type === 'HEALING_REDUCTION' || e.name?.includes('Hex') || e.name?.includes('Curse')
      );
      const macabreBonus = isCursedOrBlocked ? 1.20 : 1.0;

      for (let h = 0; h < hits; h++) {
        // Check Blind miss chance on attacker (50% chance to miss)
        if (attackerIsBlind && this.rng.chance(0.50)) {
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: attacker.id,
            sourceName: attacker.name,
            targetId: target.id,
            targetName: target.name,
            actionType: 'DAMAGE',
            damage: 0,
            message: `💨 ${attacker.name}'s attack missed ${target.name} due to Blindness!`,
          });

          // Light Silly Clown Counter: Dazzling Showstopper counters with Flashbang Cream Pie
          const targetTeam = state.playerTeam.some((p) => p.id === target.id) ? state.playerTeam : state.enemyTeam;
          const lightClowns = targetTeam.filter(
            (m) =>
              m.isAlive &&
              (m.id.includes('sillyclown_light') ||
                m.skills?.some((s) => s.definitionId === 'skill_passive_dazzling_showstopper'))
          );
          for (const lc of lightClowns) {
            const counterDmg = Math.max(1, Math.floor(lc.stats.attack * 1.5));
            attacker.currentHp = Math.max(0, attacker.currentHp - counterDmg);
            this.addLog(state, {
              turnCount: state.turnCount,
              sourceId: lc.id,
              sourceName: lc.name,
              targetId: attacker.id,
              targetName: attacker.name,
              actionType: 'DAMAGE',
              damage: counterDmg,
              message: `🥧 ${lc.name} punished the miss with a Flashbang Cream Pie counter dealing ${counterDmg} damage to ${attacker.name}!`,
            });
            if (attacker.currentHp <= 0) {
              attacker.isAlive = false;
              break;
            }
          }
          continue;
        }

        let hitPower =
          (basePower *
            executionMultiplier *
            dotBonus *
            blindBonus *
            missingHpMultiplier *
            momentumDamageBonus *
            holyZealotBonus *
            deathDriveBonus *
            blindVulnBonus *
            blindAtkPenalty *
            macabreBonus) /
          hits;

        // Check Glancing Hit on Disadvantage
        let isGlance = false;
        if (affinity === 'DISADVANTAGE') {
          isGlance = this.rng.chance(ELEMENT_CONFIG.disadvantageGlanceChance);
        }

        // Crit roll
        let isCrit = false;
        const isGuaranteedCrit =
          skill.id === 'skill_goblin_kamikaze_behead' ||
          (skill.id === 'skill_goblin_executioners_bludgeon' && isLowHpTarget) ||
          (attacker.skills?.some((s) => s.definitionId === 'skill_passive_apex_scavenger') && isLowHpTarget) ||
          (hasDeathDrive && attacker.currentHp / attacker.maxHp < 0.30);

        if (isGuaranteedCrit) {
          isCrit = true;
          isGlance = false;
        } else if (!isGlance) {
          let effectiveCritRate = attacker.stats.critRate;
          if (affinity === 'ADVANTAGE') {
            effectiveCritRate += ELEMENT_CONFIG.advantageCritBonus;
          }
          isCrit = this.rng.chance(effectiveCritRate);
        }

        if (isCrit) {
          let critDmg = attacker.stats.critDamage;
          // Fire Goblin Berserker / Blazing Fury bonus crit damage
          if (isFireGoblin) {
            critDmg += 0.25;
            hitPower *= 1.30; // Extra burst explosion damage!
          }
          hitPower *= critDmg;
          landedCrit = true;
        }

        // Element multiplier
        if (affinity === 'ADVANTAGE') {
          hitPower *= ELEMENT_CONFIG.advantageDamageMultiplier;
        } else if (affinity === 'DISADVANTAGE') {
          hitPower *= isGlance
            ? ELEMENT_CONFIG.glanceDamageMultiplier
            : ELEMENT_CONFIG.disadvantageDamageMultiplier;
        }

        // Defense Mitigation Formula & Armor Shredding:
        // Dark Goblin Berserker: Kamikaze Behead ignores 100% defense, Blood Rend ignores 50% defense
        let effectiveDef = target.stats.defense;
        if (skill.id === 'skill_goblin_kamikaze_behead' || (hasDeathDrive && isCrit)) {
          effectiveDef = 0; // 100% Armor Pierce
        } else if (
          skill.id === 'skill_goblin_blood_rend' ||
          (isLightGoblin && skill.id === 'skill_goblin_righteous_judgment')
        ) {
          effectiveDef = Math.floor(effectiveDef * 0.50); // 50% Armor Pierce
        }

        const defMitigation = effectiveDef <= 0 ? 1.0 : 1000 / (1000 + 3 * Math.max(1, effectiveDef));
        let finalHitDamage = Math.max(1, Math.floor(hitPower * defMitigation));

        // Absorb by active Shield if present
        const shieldEffect = target.activeEffects.find((e) => e.type === 'SHIELD');
        if (shieldEffect && shieldEffect.value && shieldEffect.value > 0) {
          // Fire Mage Student Flavor: Shields allies by absorbing heat (applies small Burn to attackers)
          const targetTeam = state.playerTeam.some((p) => p.id === target.id) ? state.playerTeam : state.enemyTeam;
          const hasFireMageAegis =
            shieldEffect.name?.toLowerCase().includes('thermal') ||
            targetTeam.some(
              (m) =>
                m.isAlive &&
                (m.id.includes('magestudent_fire') ||
                  m.skills?.some(
                    (s) =>
                      s.definitionId === 'skill_passive_blazing_aegis' ||
                      s.definitionId === 'skill_magestudent_thermal_barrier'
                  ))
            );

          if (hasFireMageAegis && attacker.isAlive) {
            // Counter-inflicts small Burn to attacker
            if (!attacker.activeEffects.some((e) => e.type === 'CONTINUOUS_DAMAGE')) {
              attacker.activeEffects.push({
                id: `thermal_burn_${Date.now()}_${this.rng.nextInt(100, 999)}`,
                type: 'CONTINUOUS_DAMAGE',
                name: 'Thermal Burn',
                isBuff: false,
                duration: 2,
                sourceParticipantId: target.id,
              });
              this.addLog(state, {
                turnCount: state.turnCount,
                sourceId: target.id,
                sourceName: target.name,
                targetId: attacker.id,
                targetName: attacker.name,
                actionType: 'DEBUFF',
                message: `${target.name}'s Thermal Shield absorbed kinetic heat and counter-inflicted Burn on ${attacker.name}!`,
              });
            }

            // Passive Blazing Aegis: restores 5% Max HP to the shielded ally
            const hasBlazingAegis = targetTeam.some(
              (m) =>
                m.isAlive &&
                m.skills?.some((s) => s.definitionId === 'skill_passive_blazing_aegis')
            );
            if (hasBlazingAegis) {
              const absorbedHeal = Math.max(1, Math.floor(target.maxHp * 0.05));
              target.currentHp = Math.min(target.maxHp, target.currentHp + absorbedHeal);
              this.addLog(state, {
                turnCount: state.turnCount,
                sourceId: target.id,
                sourceName: target.name,
                actionType: 'HEAL',
                message: `${target.name} absorbed thermal energy to restore ${absorbedHeal} HP!`,
              });
            }
          }

          if (shieldEffect.value >= finalHitDamage) {
            shieldEffect.value -= finalHitDamage;
            finalHitDamage = 0;
          } else {
            finalHitDamage -= shieldEffect.value;
            shieldEffect.value = 0;
            target.activeEffects = target.activeEffects.filter((e) => e.id !== shieldEffect.id);
          }
        }

        target.currentHp = Math.max(0, target.currentHp - finalHitDamage);
        totalDamageDealt += finalHitDamage;

        if (target.currentHp <= 0) {
          target.isAlive = false;
          break;
        }
      }

      if (landedCrit && state.activeActionContext) {
        state.activeActionContext.triggeredEffects.push('CRIT');
      }

      this.addLog(state, {
        turnCount: state.turnCount,
        sourceId: attacker.id,
        sourceName: attacker.name,
        targetId: target.id,
        targetName: target.name,
        skillName: skill.name,
        actionType: 'DAMAGE',
        damage: totalDamageDealt,
        isCrit: landedCrit,
        elementAdvantage: affinity,
        message: `${attacker.name} hit ${target.name} for ${totalDamageDealt} damage${
          landedCrit ? ' (CRITICAL!)' : ''
        }${affinity === 'ADVANTAGE' ? ' [Weakness Hit]' : affinity === 'DISADVANTAGE' ? ' [Resistant Hit]' : ''}`,
      });

      // Fire Goblin Berserker: Ignites weapon on crits, inflicting Burn
      if (landedCrit && isFireGoblin && target.isAlive) {
        if (!target.activeEffects.some((e) => e.type === 'CONTINUOUS_DAMAGE')) {
          target.activeEffects.push({
            id: `goblin_burn_${Date.now()}_${this.rng.nextInt(100, 999)}`,
            type: 'CONTINUOUS_DAMAGE',
            name: 'Blazing Ignited Burn',
            isBuff: false,
            duration: 2,
            sourceParticipantId: attacker.id,
          });
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: attacker.id,
            sourceName: attacker.name,
            targetId: target.id,
            targetName: target.name,
            actionType: 'DEBUFF',
            message: `🔥 ${attacker.name}'s weapon ignited on Critical Hit, inflicting Blazing Burn on ${target.name}!`,
          });
        }
      }

      // Light Goblin Berserker: Holy Rage Execution dispels shield & suppresses Turn Meter
      if (isLightGoblin && isDarkOrBoss && target.isAlive) {
        const shieldIdx = target.activeEffects.findIndex((e) => e.type === 'SHIELD');
        if (shieldIdx >= 0) {
          target.activeEffects.splice(shieldIdx, 1);
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: attacker.id,
            sourceName: attacker.name,
            targetId: target.id,
            targetName: target.name,
            actionType: 'DEBUFF',
            message: `✨ ${attacker.name}'s holy rage shattered ${target.name}'s protective barrier!`,
          });
        }
        if (skill.id === 'skill_goblin_righteous_judgment') {
          target.turnMeter = Math.max(0, target.turnMeter - 20);
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: attacker.id,
            sourceName: attacker.name,
            targetId: target.id,
            targetName: target.name,
            actionType: 'TURN_METER',
            message: `${attacker.name}'s holy strike suppressed ${target.name}'s Turn Meter by -20%!`,
          });
        }
      }

      if (!target.isAlive) {
        if (state.activeActionContext) {
          state.activeActionContext.killedTargetIds.push(target.id);
        }

        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: attacker.id,
          sourceName: attacker.name,
          targetId: target.id,
          targetName: target.name,
          actionType: 'DEATH',
          message: `${target.name} was defeated in battle!`,
        });

        // Trigger Death Prowler passive if attacker is Shadowstalker
        if (attacker.skills.some((s) => s.definitionId === 'skill_passive_death_prowler')) {
          attacker.turnMeter = Math.min(100, attacker.turnMeter + 50);
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: attacker.id,
            sourceName: attacker.name,
            actionType: 'BUFF',
            message: `${attacker.name}'s Death Prowler passive activated! (+50% Turn Meter)`,
          });
        }
      }
    }
  }

  /**
   * Applies healing effect
   */
  private applyHealEffect(
    state: BattleState,
    healer: BattleParticipant,
    skill: SkillDefinition,
    effect: any,
    targets: BattleParticipant[]
  ) {
    const healBonus = 1 + (healer.stats.healingDone || 0);
    const healBase = healer.maxHp * (effect.multiplier || 0.25) * healBonus;

    for (const target of targets) {
      if (!target.isAlive) continue;
      let effectiveBase = healBase;
      const targetTeam = state.playerTeam.some((p) => p.id === target.id) ? state.playerTeam : state.enemyTeam;
      const opposingTeam = targetTeam === state.playerTeam ? state.enemyTeam : state.playerTeam;
      const hasDarkClown = opposingTeam.some(
        (m) =>
          m.isAlive &&
          (m.id.includes('sillyclown_dark') ||
            m.skills?.some((s) => s.definitionId === 'skill_passive_macabre_nightmare'))
      );

      // Check Healing Reduction / Healing Block
      if (target.activeEffects.some((e) => e.type === 'HEALING_REDUCTION')) {
        if (hasDarkClown) {
          // Blocked healing dealt as shadow backlash damage
          const backlashDmg = Math.max(1, Math.floor(effectiveBase));
          target.currentHp = Math.max(0, target.currentHp - backlashDmg);
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: 'macabre_nightmare',
            sourceName: 'Macabre Nightmare',
            targetId: target.id,
            targetName: target.name,
            actionType: 'DAMAGE',
            damage: backlashDmg,
            message: `☠️ Macabre Nightmare blocked healing on ${target.name} and dealt ${backlashDmg} shadow backlash damage!`,
          });
          if (target.currentHp <= 0) {
            target.isAlive = false;
            this.addLog(state, {
              turnCount: state.turnCount,
              sourceId: 'macabre_nightmare',
              sourceName: 'Macabre Nightmare',
              targetId: target.id,
              targetName: target.name,
              actionType: 'DEATH',
              message: `${target.name} was defeated by shadow backlash from blocked healing!`,
            });
          }
          continue;
        } else {
          // Fire Poisonous Lizardman: Venom-Flame reduces healing received by 50%
          effectiveBase *= 0.5;
        }
      }
      const healed = Math.min(target.maxHp - target.currentHp, Math.floor(effectiveBase));
      target.currentHp += healed;

      // Grass Mage Student Flavor: Spreads barrier vitality, cleansing minor debuffs on heal
      const isGrassMageSustain =
        healer.id.includes('magestudent_grass') ||
        skill.id.includes('verdant') ||
        skill.id.includes('vital_breeze') ||
        healer.skills.some((s) => s.definitionId === 'skill_passive_cleanse_vitality');

      if (isGrassMageSustain) {
        const debuffs = target.activeEffects.filter((e) => !e.isBuff);
        if (debuffs.length > 0) {
          const removed = debuffs[0];
          target.activeEffects = target.activeEffects.filter((e) => e.id !== removed.id);
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: healer.id,
            sourceName: healer.name,
            targetId: target.id,
            targetName: target.name,
            actionType: 'BUFF',
            message: `${healer.name}'s barrier vitality cleansed [${removed.name}] from ${target.name}!`,
          });
        }
      }

      this.addLog(state, {
        turnCount: state.turnCount,
        sourceId: healer.id,
        sourceName: healer.name,
        targetId: target.id,
        targetName: target.name,
        skillName: skill.name,
        actionType: 'HEAL',
        message: `${healer.name} healed ${target.name} for ${healed} HP.${healer.stats.healingDone ? ` (+${Math.round(healer.stats.healingDone * 100)}% Heal Bonus)` : ''}`,
      });
    }
  }

  /**
   * Applies shield to targets
   */
  private applyShieldEffect(
    state: BattleState,
    shielder: BattleParticipant,
    effect: any,
    targets: BattleParticipant[]
  ) {
    const shieldBonus = 1 + (shielder.stats.shieldingDone || 0);
    const shieldAmt = Math.floor(shielder.maxHp * (effect.multiplier || 0.20) * shieldBonus);

    for (const target of targets) {
      if (!target.isAlive) continue;
      target.activeEffects.push({
        id: `shield_${Date.now()}_${Math.random()}`,
        type: 'SHIELD',
        name: 'Shield',
        isBuff: true,
        duration: effect.statusDuration || 2,
        value: shieldAmt,
        sourceParticipantId: shielder.id,
      });

      this.addLog(state, {
        turnCount: state.turnCount,
        sourceId: shielder.id,
        sourceName: shielder.name,
        targetId: target.id,
        targetName: target.name,
        actionType: 'BUFF',
        message: `${target.name} received a ${shieldAmt} HP protective barrier.${shielder.stats.shieldingDone ? ` (+${Math.round(shielder.stats.shieldingDone * 100)}% Shield Bonus)` : ''}`,
      });
    }
  }

  /**
   * Applies buffs or debuffs with accuracy vs resistance check
   */
  private applyStatusEffect(
    state: BattleState,
    attacker: BattleParticipant,
    effect: any,
    targets: BattleParticipant[]
  ) {
    const statusType = effect.statusEffect as StatusEffectType;
    const isBuff = [
      'ATTACK_UP',
      'DEFENSE_UP',
      'SPEED_UP',
      'CRIT_RATE_UP',
      'SHIELD',
      'CONTINUOUS_HEAL',
      'IMMUNITY',
      'STEALTH',
      'DOUBLE_ATTACK',
    ].includes(statusType);

    for (const target of targets) {
      if (!target.isAlive) continue;

      if (isBuff) {
        // Dark Friendly Ghost Flavor: Curses the enemy it steals from, dealing damage whenever they try to buff themselves again
        const hexCurse = target.activeEffects.find(
          (e) => e.name?.includes('Spiteful Hex') || e.name?.includes('Hex')
        );
        if (hexCurse && target.isAlive) {
          const backlashDamage = Math.max(1, Math.floor(target.maxHp * 0.15));
          target.currentHp = Math.max(0, target.currentHp - backlashDamage);
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: 'spiteful_hex',
            sourceName: 'Spiteful Hex Backlash',
            targetId: target.id,
            targetName: target.name,
            actionType: 'DAMAGE',
            damage: backlashDamage,
            message: `⚡ Spiteful Hex punished ${target.name} for ${backlashDamage} backlash damage as they gained a buff!`,
          });
          if (target.currentHp <= 0) {
            target.isAlive = false;
            this.addLog(state, {
              turnCount: state.turnCount,
              sourceId: 'spiteful_hex',
              sourceName: 'Spiteful Hex Backlash',
              targetId: target.id,
              targetName: target.name,
              actionType: 'DEATH',
              message: `${target.name} succumbed to Spiteful Hex curse backlash!`,
            });
            continue;
          }
        }

        // Buffs always land on allies
        target.activeEffects.push({
          id: `buff_${statusType}_${Date.now()}_${this.rng.nextInt(100, 999)}`,
          type: statusType,
          name: statusType.replace('_', ' '),
          isBuff: true,
          duration: effect.statusDuration || 2,
          sourceParticipantId: attacker.id,
        });

        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: attacker.id,
          sourceName: attacker.name,
          targetId: target.id,
          targetName: target.name,
          actionType: 'BUFF',
          message: `${target.name} gained [${statusType.replace('_', ' ')}]!`,
        });
      } else {
        // Check Immunity on target
        if (target.activeEffects.some((e) => e.type === 'IMMUNITY')) {
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: attacker.id,
            sourceName: attacker.name,
            targetId: target.id,
            targetName: target.name,
            actionType: 'DEBUFF',
            message: `${target.name} resisted ${statusType} due to Immunity!`,
          });
          continue;
        }

        // Proc chance roll
        const baseChance = effect.chance !== undefined ? effect.chance : 1.0;
        if (!this.rng.chance(baseChance)) continue;

        // Resistance vs Accuracy check: Chance = max(15%, min(85%, 100% - (Res - Acc)))
        const resDelta = target.stats.resistance - attacker.stats.accuracy;
        const landChance = Math.max(0.15, Math.min(0.85, 1.0 - resDelta));

        if (this.rng.chance(landChance)) {
          target.activeEffects.push({
            id: `debuff_${statusType}_${Date.now()}_${this.rng.nextInt(100, 999)}`,
            type: statusType,
            name: statusType.replace('_', ' '),
            isBuff: false,
            duration: effect.statusDuration || 2,
            sourceParticipantId: attacker.id,
          });

          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: attacker.id,
            sourceName: attacker.name,
            targetId: target.id,
            targetName: target.name,
            actionType: 'DEBUFF',
            message: `${target.name} was afflicted with [${statusType.replace('_', ' ')}]!`,
          });

          const attackerTeam = state.playerTeam.some((p) => p.id === attacker.id) ? state.playerTeam : state.enemyTeam;

          // Water Goblin Berserker: Momentum-based; gains stacking speed as targets lose armor
          if (statusType === 'DEFENSE_DOWN') {
            const waterGoblins = attackerTeam.filter(
              (m) =>
                m.isAlive &&
                (m.id.includes('goblinberserker_water') ||
                  m.skills?.some((s) => s.definitionId === 'skill_passive_torrential_momentum'))
            );
            for (const wg of waterGoblins) {
              const existingBuff = wg.activeEffects.find((e) => e.name === 'Torrential Momentum' || e.type === 'SPEED_UP');
              if (existingBuff) {
                existingBuff.duration = 2;
                existingBuff.value = Math.min(50, (existingBuff.value || 10) + 10);
              } else {
                wg.activeEffects.push({
                  id: `momentum_spd_${Date.now()}_${this.rng.nextInt(100, 999)}`,
                  type: 'SPEED_UP',
                  name: 'Torrential Momentum',
                  isBuff: true,
                  duration: 2,
                  value: 10,
                  sourceParticipantId: wg.id,
                });
              }
              wg.turnMeter = Math.min(100, wg.turnMeter + 15);
              this.addLog(state, {
                turnCount: state.turnCount,
                sourceId: wg.id,
                sourceName: wg.name,
                targetId: wg.id,
                targetName: wg.name,
                actionType: 'TURN_METER',
                message: `⚡ ${wg.name}'s Torrential Momentum surged (+15% Turn Meter, +Speed) as ${target.name}'s armor cracked!`,
              });
            }
          }

          // Fire Silly Clown: Carnival Pyrotechnics (detonates bonus true burst and +10% TM on debuff)
          const fireClowns = attackerTeam.filter(
            (m) =>
              m.isAlive &&
              (m.id.includes('sillyclown_fire') ||
                m.skills?.some((s) => s.definitionId === 'skill_passive_carnival_pyrotechnics'))
          );
          for (const fc of fireClowns) {
            const burstDmg = Math.max(1, Math.floor(fc.stats.attack * 0.45));
            target.currentHp = Math.max(0, target.currentHp - burstDmg);
            fc.turnMeter = Math.min(100, fc.turnMeter + 10);
            this.addLog(state, {
              turnCount: state.turnCount,
              sourceId: fc.id,
              sourceName: fc.name,
              targetId: target.id,
              targetName: target.name,
              actionType: 'DAMAGE',
              damage: burstDmg,
              message: `🎆 ${fc.name}'s Carnival Pyrotechnics detonated a firecracker on ${target.name} for ${burstDmg} burst damage (+10% Turn Meter)!`,
            });
            if (target.currentHp <= 0) {
              target.isAlive = false;
              this.addLog(state, {
                turnCount: state.turnCount,
                sourceId: fc.id,
                sourceName: fc.name,
                targetId: target.id,
                targetName: target.name,
                actionType: 'DEATH',
                message: `${target.name} was defeated by explosive firecrackers!`,
              });
            }
          }
        } else {
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: attacker.id,
            sourceName: attacker.name,
            targetId: target.id,
            targetName: target.name,
            actionType: 'DEBUFF',
            message: `${target.name} resisted ${statusType}!`,
          });
        }
      }
    }
  }

  /**
   * Cleanses debuffs from allies
   */
  private applyCleanseEffect(
    state: BattleState,
    targets: BattleParticipant[],
    count: number,
    actor?: BattleParticipant,
    skillId?: string
  ) {
    for (const target of targets) {
      if (!target.isAlive) continue;
      const debuffs = target.activeEffects.filter((e) => !e.isBuff);
      if (debuffs.length === 0) continue;

      const toRemove = count ? debuffs.slice(0, count) : debuffs;
      const toRemoveIds = new Set(toRemove.map((d) => d.id));
      target.activeEffects = target.activeEffects.filter((e) => !toRemoveIds.has(e.id));

      this.addLog(state, {
        turnCount: state.turnCount,
        sourceId: actor ? actor.id : 'system',
        sourceName: actor ? actor.name : 'Cleanse',
        targetId: target.id,
        targetName: target.name,
        actionType: 'BUFF',
        message: `Cleansed ${toRemove.length} negative effect(s) from ${target.name}.`,
      });

      // Water Friendly Ghost Reflection Flavor:
      // Cleanses an ally and reflects the removed debuff back at a random enemy!
      if (
        skillId &&
        (skillId.includes('mirror') ||
          skillId.includes('reflect') ||
          skillId.includes('friendlyghost_water'))
      ) {
        const isTargetPlayer = state.playerTeam.some((p) => p.id === target.id);
        const opposingTeam = isTargetPlayer ? state.enemyTeam : state.playerTeam;
        const aliveEnemies = opposingTeam.filter((e) => e.isAlive);
        if (aliveEnemies.length > 0) {
          for (const debuff of toRemove) {
            const randomEnemy = aliveEnemies[this.rng.nextInt(0, aliveEnemies.length - 1)];
            randomEnemy.activeEffects.push({
              id: `reflected_${debuff.type}_${Date.now()}_${this.rng.nextInt(100, 999)}`,
              type: debuff.type,
              name: debuff.name,
              isBuff: false,
              duration: debuff.duration || 2,
              value: debuff.value,
              sourceParticipantId: actor ? actor.id : target.id,
            });
            this.addLog(state, {
              turnCount: state.turnCount,
              sourceId: actor ? actor.id : target.id,
              sourceName: actor ? actor.name : 'Ghost Reflection',
              targetId: randomEnemy.id,
              targetName: randomEnemy.name,
              actionType: 'DEBUFF',
              message: `Reflected cleansed [${debuff.name}] back onto ${randomEnemy.name}!`,
            });
          }
        }
      }
    }
  }

  /**
   * Dispels buffs from enemies and applies Friendly Ghost tactical plunder mechanics
   */
  private applyDispelEffect(
    state: BattleState,
    actor: BattleParticipant,
    skill: SkillDefinition,
    targets: BattleParticipant[],
    count: number
  ) {
    const isActorPlayer = state.playerTeam.some((p) => p.id === actor.id);
    const allyTeam = isActorPlayer ? state.playerTeam : state.enemyTeam;

    for (const target of targets) {
      if (!target.isAlive) continue;
      const buffs = target.activeEffects.filter((e) => e.isBuff);
      if (buffs.length === 0) continue;

      const toDispel = count ? buffs.slice(0, count) : buffs;
      const toDispelIds = new Set(toDispel.map((b) => b.id));
      target.activeEffects = target.activeEffects.filter((e) => !toDispelIds.has(e.id));

      this.addLog(state, {
        turnCount: state.turnCount,
        sourceId: actor.id,
        sourceName: actor.name,
        targetId: target.id,
        targetName: target.name,
        actionType: 'DEBUFF',
        message: `${actor.name} dispelled ${toDispel.length} buff(s) from ${target.name}!`,
      });

      // 1. Fire: Steals a buff and converts it into a small Burn dot on the enemy
      if (skill.id.includes('friendlyghost_fire') || skill.id.includes('pyro_theft')) {
        for (const buff of toDispel) {
          actor.activeEffects.push({
            id: `stolen_${buff.type}_${Date.now()}_${this.rng.nextInt(100, 999)}`,
            type: buff.type,
            name: buff.name,
            isBuff: true,
            duration: buff.duration || 2,
            value: buff.value,
            sourceParticipantId: actor.id,
          });
          target.activeEffects.push({
            id: `burn_${Date.now()}_${this.rng.nextInt(100, 999)}`,
            type: 'CONTINUOUS_DAMAGE',
            name: 'Burn DoT',
            isBuff: false,
            duration: 2,
            sourceParticipantId: actor.id,
          });
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: actor.id,
            sourceName: actor.name,
            targetId: target.id,
            targetName: target.name,
            actionType: 'DEBUFF',
            message: `${actor.name} stole [${buff.name}] and ignited ${target.name} with a scorching Burn DoT!`,
          });
        }
      }

      // 2. Grass: Steals buffs and extends their duration for the ghost's team (+1 turn duration)
      else if (skill.id.includes('friendlyghost_grass') || skill.id.includes('verdant_heist')) {
        const aliveAllies = allyTeam.filter((a) => a.isAlive);
        for (const buff of toDispel) {
          const extendedDuration = (buff.duration || 2) + 1;
          for (const ally of aliveAllies) {
            ally.activeEffects.push({
              id: `extended_${buff.type}_${Date.now()}_${this.rng.nextInt(100, 999)}`,
              type: buff.type,
              name: buff.name,
              isBuff: true,
              duration: extendedDuration,
              value: buff.value,
              sourceParticipantId: actor.id,
            });
          }
          this.addLog(state, {
            turnCount: state.turnCount,
            sourceId: actor.id,
            sourceName: actor.name,
            actionType: 'BUFF',
            message: `${actor.name} shared stolen [${buff.name}] with all allies for an extended ${extendedDuration} turns!`,
          });
        }
      }

      // 3. Light: Banishes an enemy's positive effects into bonus Turn Meter for the party (+15% TM per buff)
      else if (skill.id.includes('friendlyghost_light') || skill.id.includes('aurora_banish')) {
        const tmDelta = 0.15 * toDispel.length;
        const aliveAllies = allyTeam.filter((a) => a.isAlive);
        this.applyTurnMeterDelta(state, aliveAllies, tmDelta);
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: actor.id,
          sourceName: actor.name,
          actionType: 'TURN_METER',
          message: `${actor.name} converted ${toDispel.length} banished buff(s) into +${Math.round(
            tmDelta * 100
          )}% Turn Meter for the team!`,
        });
      }

      // 4. Dark: Curses the enemy it steals from, dealing damage whenever they try to buff themselves again
      else if (skill.id.includes('friendlyghost_dark') || skill.id.includes('hex_plunder')) {
        for (const buff of toDispel) {
          actor.activeEffects.push({
            id: `dark_stolen_${buff.type}_${Date.now()}_${this.rng.nextInt(100, 999)}`,
            type: buff.type,
            name: buff.name,
            isBuff: true,
            duration: buff.duration || 2,
            value: buff.value,
            sourceParticipantId: actor.id,
          });
        }
        target.activeEffects.push({
          id: `curse_${Date.now()}_${this.rng.nextInt(100, 999)}`,
          type: 'CONTINUOUS_DAMAGE',
          name: 'Spiteful Hex Curse',
          isBuff: false,
          duration: 3,
          sourceParticipantId: actor.id,
        });
        target.activeEffects.push({
          id: `curse_def_${Date.now()}_${this.rng.nextInt(100, 999)}`,
          type: 'DEFENSE_DOWN',
          name: 'Hex Weakness',
          isBuff: false,
          duration: 2,
          sourceParticipantId: actor.id,
        });
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: actor.id,
          sourceName: actor.name,
          targetId: target.id,
          targetName: target.name,
          actionType: 'DEBUFF',
          message: `${actor.name} cursed ${target.name} with Spiteful Hex, dealing damage whenever they attempt enchantments!`,
        });
      }
    }
  }

  /**
   * Manipulates turn meters (+% or -%)
   */
  private applyTurnMeterDelta(state: BattleState, targets: BattleParticipant[], delta: number) {
    for (const target of targets) {
      if (!target.isAlive) continue;
      const oldVal = target.turnMeter;
      target.turnMeter = Math.max(0, Math.min(120, target.turnMeter + delta * 100));

      this.addLog(state, {
        turnCount: state.turnCount,
        sourceId: 'system',
        sourceName: 'Turn Meter',
        targetId: target.id,
        targetName: target.name,
        actionType: 'TURN_METER',
        message: `${target.name}'s Turn Meter changed by ${delta > 0 ? '+' : ''}${Math.round(
          delta * 100
        )}% (${Math.round(oldVal)}% -> ${Math.round(target.turnMeter)}%).`,
      });
    }
  }

  /**
   * Resolves target participants based on targetType
   */
  private resolveTargets(
    state: BattleState,
    actor: BattleParticipant,
    skill: SkillDefinition,
    primaryTargetId: string
  ): BattleParticipant[] {
    const enemyTeam = actor.team === 'PLAYER' ? state.enemyTeam : state.playerTeam;
    const allyTeam = actor.team === 'PLAYER' ? state.playerTeam : state.enemyTeam;

    switch (skill.targetType) {
      case 'SINGLE_ENEMY': {
        const found = enemyTeam.find((e) => e.id === primaryTargetId && e.isAlive);
        return found ? [found] : enemyTeam.filter((e) => e.isAlive).slice(0, 1);
      }
      case 'ALL_ENEMIES':
        return enemyTeam.filter((e) => e.isAlive);
      case 'SINGLE_ALLY': {
        const found = allyTeam.find((a) => a.id === primaryTargetId && a.isAlive);
        return found ? [found] : [actor];
      }
      case 'ALL_ALLIES':
        return allyTeam.filter((a) => a.isAlive);
      case 'SELF':
        return [actor];
      case 'RANDOM_ENEMY': {
        const living = enemyTeam.filter((e) => e.isAlive);
        if (living.length === 0) return [];
        return [living[this.rng.nextInt(0, living.length - 1)]];
      }
      default:
        return [];
    }
  }

  /**
   * Calculates dynamic turn order preview for top indicator
   */
  private calculateTurnOrderPreview(state: BattleState): string[] {
    const participants = this.getAllLivingParticipants(state).map((p) => ({
      id: p.id,
      meter: p.turnMeter,
      speed: p.stats.speed,
    }));

    const preview: string[] = [];
    const simulated = [...participants];

    for (let step = 0; step < 8; step++) {
      let candidate = simulated.find((p) => p.meter >= TURN_METER_CAP);
      while (!candidate) {
        for (const p of simulated) {
          p.meter += Math.max(5, p.speed / TICK_RATE_DIVISOR);
        }
        candidate = simulated.find((p) => p.meter >= TURN_METER_CAP);
      }
      preview.push(candidate.id);
      candidate.meter -= TURN_METER_CAP;
    }

    return preview;
  }

  private getAllLivingParticipants(state: BattleState): BattleParticipant[] {
    return [...state.playerTeam, ...state.enemyTeam].filter((p) => p.isAlive && p.currentHp > 0);
  }

  private findParticipant(state: BattleState, id: string): BattleParticipant | undefined {
    return (
      state.playerTeam.find((p) => p.id === id) || state.enemyTeam.find((e) => e.id === id)
    );
  }

  public checkBattleEnd(state: BattleState): boolean {
    const playerLiving = state.playerTeam.some((p) => p.isAlive && p.currentHp > 0);
    const enemyLiving = state.enemyTeam.some((e) => e.isAlive && e.currentHp > 0);

    if (!enemyLiving) {
      // Check if more waves exist in this encounter
      if (state.currentWave && state.totalWaves && state.currentWave < state.totalWaves) {
        state.phase = 'WAVE_TRANSITION';
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: 'system',
          sourceName: 'System',
          actionType: 'SKILL',
          message: `Wave ${state.currentWave}/${state.totalWaves} cleared! Next wave approaching...`,
        });
        return true;
      }

      state.phase = 'VICTORY';
      this.addLog(state, {
        turnCount: state.turnCount,
        sourceId: 'system',
        sourceName: 'System',
        actionType: 'SKILL',
        message: 'VICTORY! All enemies have been defeated!',
      });
      return true;
    }

    if (!playerLiving) {
      state.phase = 'DEFEAT';
      this.addLog(state, {
        turnCount: state.turnCount,
        sourceId: 'system',
        sourceName: 'System',
        actionType: 'SKILL',
        message: 'DEFEAT! All your monsters were defeated.',
      });
      return true;
    }

    return false;
  }

  private addLog(state: BattleState, entry: Omit<BattleLogEntry, 'id' | 'timestamp'>) {
    const logItem: BattleLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
    };
    state.combatLog.unshift(logItem);
    if (state.combatLog.length > 50) {
      state.combatLog.pop();
    }
  }
}
