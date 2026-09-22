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
    partySize?: number
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
          message: `${playerTeam.length}v${enemyTeam.length} Battle begins! Combatants prepare their turn meters.`,
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
    };

    this.advanceTurnMetersUntilActorReady(state);
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
        this.applyCleanseEffect(state, targets, effect.dispelCount || 1);
        actionContext.resolvedEffects.push('CLEANSE');
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
        const dotDamage = Math.max(1, Math.floor(actor.maxHp * 0.05));
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
      }

      // Decrement duration
      effect.duration -= 1;
      if (effect.duration <= 0) {
        actor.activeEffects.splice(i, 1);
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

      for (let h = 0; h < hits; h++) {
        let hitPower = (basePower * executionMultiplier) / hits;

        // Check Glancing Hit on Disadvantage
        let isGlance = false;
        if (affinity === 'DISADVANTAGE') {
          isGlance = this.rng.chance(ELEMENT_CONFIG.disadvantageGlanceChance);
        }

        // Crit roll
        let isCrit = false;
        if (!isGlance) {
          let effectiveCritRate = attacker.stats.critRate;
          if (affinity === 'ADVANTAGE') {
            effectiveCritRate += ELEMENT_CONFIG.advantageCritBonus;
          }
          isCrit = this.rng.chance(effectiveCritRate);
        }

        if (isCrit) {
          hitPower *= attacker.stats.critDamage;
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

        // Defense Mitigation Formula: 1000 / (1000 + 3 * DEF)
        const defMitigation = 1000 / (1000 + 3 * Math.max(1, target.stats.defense));
        let finalHitDamage = Math.max(1, Math.floor(hitPower * defMitigation));

        // Absorb by active Shield if present
        const shieldEffect = target.activeEffects.find((e) => e.type === 'SHIELD');
        if (shieldEffect && shieldEffect.value && shieldEffect.value > 0) {
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
      const healed = Math.min(target.maxHp - target.currentHp, Math.floor(healBase));
      target.currentHp += healed;

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
  private applyCleanseEffect(state: BattleState, targets: BattleParticipant[], count: number) {
    for (const target of targets) {
      if (!target.isAlive) continue;
      const initialCount = target.activeEffects.length;
      target.activeEffects = target.activeEffects.filter((e) => e.isBuff);
      const removed = initialCount - target.activeEffects.length;
      if (removed > 0) {
        this.addLog(state, {
          turnCount: state.turnCount,
          sourceId: 'system',
          sourceName: 'Cleanse',
          targetId: target.id,
          targetName: target.name,
          actionType: 'BUFF',
          message: `Cleansed ${removed} negative effect(s) from ${target.name}.`,
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

  private checkBattleEnd(state: BattleState): boolean {
    const playerLiving = state.playerTeam.some((p) => p.isAlive && p.currentHp > 0);
    const enemyLiving = state.enemyTeam.some((e) => e.isAlive && e.currentHp > 0);

    if (!enemyLiving) {
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
