/**
 * Monster Realms - Premium 5v5 Combat Arena
 * Features 2.5D staggered battlefield perspective, stage-specific biomes,
 * luminous runic pedestals, cinematic skill VFX, floating damage numbers,
 * speed turn queue, and deterministic extra-turn architecture.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Sparkles,
  Shield,
  Heart,
  Zap,
  Swords,
  Scroll,
  Info,
  CheckCircle2,
  XCircle,
  Award,
  Crown,
  Flame,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import {
  BattleAction,
  BattleParticipant,
  BattleState,
  ExecutedActionRecord,
  PlayerMonster,
  PvEStage,
  PvEEnemyVariant,
} from '../types';
import { CombatEngine } from '../engine/combatEngine';
import { calculateEffectiveStats } from '../engine/statCalculator';
import { MONSTER_VARIANTS } from '../data/monsters';
import { getSkillDefinition } from '../data/skills';
import { ELEMENT_VISUALS, getElementAffinity } from '../data/elements';
import { formatEquipmentStatString } from '../data/equipment';
import { BuffDebuffIcon } from './battle/BuffDebuffIcon';
import { MonsterAvatar } from './MonsterAvatar';
import { completePvEBattle } from '../services/apiClient';
import { calculatePartyXpReward } from '../utils/experienceModifiers';
import { getMonsterStars } from '../utils/monsterStars';
import { StageBackgroundArt, getStageTerrainInfo } from './StageBackgroundArt';
import { DamageNumberOverlay, FloatingNumber } from './battle/DamageNumberOverlay';
import { CombatDamageType } from './battle/CombatDamageNumber';
import { getFormationSlots } from './battle2d/formationSlots';
import { SkillVFX } from './battle/SkillVFX';
import { ElementalSpellVFX } from './battle/ElementalSpellVFX';
import { BattleArena2D } from './battle2d/BattleArena2D';
import { MonsterCombatVisualState } from '../services/character2d/types';
import { musicEngine } from '../services/audio/musicEngine';

interface BattleViewProps {
  playerMonsters: PlayerMonster[];
  currentStage: PvEStage;
  onExitBattle: (isVictory: boolean) => void;
}

export const BattleView: React.FC<BattleViewProps> = ({
  playerMonsters,
  currentStage,
  onExitBattle,
}) => {
  const [engine] = useState(() => new CombatEngine(Date.now()));
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [droppedGear, setDroppedGear] = useState<any | null>(null);
  const hasClaimedBattleRef = useRef<boolean>(false);
  const initializedStageRef = useRef<string | null>(null);
  const isTransitioningWaveRef = useRef<boolean>(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [isAuto, setIsAuto] = useState<boolean>(false);
  const [battleSpeed, setBattleSpeed] = useState<1 | 2 | 3>(1);
  const [showLogDrawer, setShowLogDrawer] = useState<boolean>(false);

  // Cinematic VFX & Animation States
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [activeSkillBanner, setActiveSkillBanner] = useState<{
    skillName: string;
    casterName: string;
    element: any;
    isExtraTurn?: boolean;
  } | null>(null);
  const [extraTurnAnnouncement, setExtraTurnAnnouncement] = useState<string | null>(null);
  const [impactFlash, setImpactFlash] = useState<boolean>(false);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);
  const [hitReactions, setHitReactions] = useState<Record<string, boolean>>({});
  const [lungingActors, setLungingActors] = useState<Record<string, boolean>>({});
  const [killCelebrationActors, setKillCelebrationActors] = useState<Record<string, boolean>>({});
  const [activeSpell, setActiveSpell] = useState<{
    casterId: string;
    targetId?: string | null;
    element: any;
    skillName: string;
    isAoe?: boolean;
  } | null>(null);
  const [latestAction3D, setLatestAction3D] = useState<ExecutedActionRecord | null>(null);

  const autoLoopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevTurnCountRef = useRef<number>(0);
  const prevLogIdRef = useRef<string>('');
  const prevActionIdRef = useRef<string>('');

  // Battle Soundtrack Management: Switch between Battle Theme and Menu Prelude ONLY when music is on
  useEffect(() => {
    const state = musicEngine.getState();
    const isMusicActive = state.isPlaying && !state.isMuted && state.track !== 'NONE';
    if (isMusicActive) {
      const track = currentStage.isBoss ? 'BOSS' : 'BATTLE';
      musicEngine.playTrack(track);
    }
    return () => {
      const cur = musicEngine.getState();
      if (cur.isPlaying && !cur.isMuted && cur.track !== 'NONE') {
        musicEngine.playTrack('MENU');
      }
    };
  }, [currentStage.isBoss]);

  // Victory Fanfare and Rewards Collection when winning battle
  useEffect(() => {
    if (battleState?.phase === 'VICTORY' && !hasClaimedBattleRef.current) {
      hasClaimedBattleRef.current = true;
      const cur = musicEngine.getState();
      if (cur.isPlaying && !cur.isMuted && cur.track !== 'NONE') {
        musicEngine.playTrack('VICTORY');
      }
      completePvEBattle(
        currentStage.stageId,
        true,
        battleState?.partySize || battleState?.playerTeam.length || 1
      )
        .then((res) => {
          if (res?.droppedEquipment) {
            setDroppedGear(res.droppedEquipment);
          }
        })
        .catch((err) => {
          console.error('Error claiming battle rewards:', err);
        });
    }
  }, [battleState?.phase]);

  // 1. Initialize 5v5 Battle
  useEffect(() => {
    // Avoid re-initializing if we are already fighting in this stage instance
    if (initializedStageRef.current === currentStage.stageId && battleState) {
      return;
    }
    initializedStageRef.current = currentStage.stageId;
    hasClaimedBattleRef.current = false;
    isTransitioningWaveRef.current = false;

    // 5 Player combatants
    const activePlayerMonsters = playerMonsters.slice(0, 5);
    const playerParticipants: BattleParticipant[] = activePlayerMonsters.map((m, idx) => {
      const variant = MONSTER_VARIANTS[m.variantId] || Object.values(MONSTER_VARIANTS)[0];
      const stats = calculateEffectiveStats({
        variant,
        level: m.level,
        awakeningStage: m.awakeningStage,
      }).finalStats;

      return {
        id: `p_${idx}`,
        instanceId: m.instanceId,
        variantId: variant.variantId,
        name: variant.name,
        element: variant.element,
        team: 'PLAYER',
        slotIndex: idx,
        level: m.level,
        stars: getMonsterStars(m, variant),
        awakeningStage: m.awakeningStage,
        stats,
        maxHp: stats.hp,
        currentHp: stats.hp,
        turnMeter: Math.floor(stats.speed * 0.4),
        isAlive: true,
        skills: variant.skills.map((sId) => ({
          definitionId: sId,
          currentCooldown: 0,
        })),
        activeEffects: [],
        artwork: {
          avatar: variant.artwork.baseAvatar,
          colorHex: variant.artwork.colorHex,
          accentHex: variant.artwork.accentHex,
        },
      };
    });

    // Helper to generate enemy BattleParticipant array for any wave
    const buildEnemyParticipants = (
      variants: PvEEnemyVariant[],
      waveNumber: number
    ): BattleParticipant[] => {
      return variants.map((e, idx) => {
        const variant = MONSTER_VARIANTS[e.variantId] || Object.values(MONSTER_VARIANTS)[0];
        const stats = calculateEffectiveStats({
          variant,
          level: e.level,
          awakeningStage: e.awakeningStage || 'BASE',
        }).finalStats;

        return {
          id: `e_w${waveNumber}_${idx}`,
          variantId: variant.variantId,
          name: variant.name,
          element: variant.element,
          team: 'ENEMY',
          slotIndex: idx,
          level: e.level,
          stars: e.stars || getMonsterStars(null, variant),
          awakeningStage: e.awakeningStage || 'BASE',
          stats,
          maxHp: stats.hp,
          currentHp: stats.hp,
          turnMeter: Math.floor(stats.speed * 0.4),
          isAlive: true,
          skills: variant.skills.map((sId) => ({
            definitionId: sId,
            currentCooldown: 0,
          })),
          activeEffects: [],
          artwork: {
            avatar: variant.artwork.baseAvatar,
            colorHex: variant.artwork.colorHex,
            accentHex: variant.artwork.accentHex,
          },
        };
      });
    };

    // Determine initial wave configuration
    const totalWaves =
      currentStage.waves && currentStage.waves.length > 0 ? currentStage.waves.length : 1;
    const initialWaveConfig =
      currentStage.waves && currentStage.waves.length > 0
        ? currentStage.waves[0]
        : currentStage.enemyVariants;

    const enemyParticipants: BattleParticipant[] = buildEnemyParticipants(initialWaveConfig, 1);

    const initial = engine.createBattle(
      `battle_${Date.now()}`,
      playerParticipants,
      enemyParticipants,
      Date.now(),
      playerParticipants.length, // Snapshot of active party size at battle start
      { currentWave: 1, totalWaves }
    );

    setBattleState({ ...initial });
  }, [currentStage.stageId, engine]);

  // 1b. Wave Progression: Transition to Next Wave (Fight > Fight > Boss)
  useEffect(() => {
    if (battleState?.phase === 'WAVE_TRANSITION') {
      if (isTransitioningWaveRef.current) return;
      isTransitioningWaveRef.current = true;

      const nextWave = (battleState.currentWave || 1) + 1;
      const wavesList = currentStage.waves;

      if (!wavesList || nextWave > wavesList.length) {
        setBattleState((prev) => (prev ? { ...prev, phase: 'VICTORY' } : null));
        isTransitioningWaveRef.current = false;
        return;
      }

      const delay = Math.max(900, Math.round(1600 / battleSpeed));
      const timer = setTimeout(() => {
        const nextWaveConfig = wavesList[nextWave - 1];
        const nextEnemyParticipants: BattleParticipant[] = nextWaveConfig.map((e, idx) => {
          const variant = MONSTER_VARIANTS[e.variantId] || Object.values(MONSTER_VARIANTS)[0];
          const stats = calculateEffectiveStats({
            variant,
            level: e.level,
            awakeningStage: e.awakeningStage || 'BASE',
          }).finalStats;

          return {
            id: `e_w${nextWave}_${idx}`,
            variantId: variant.variantId,
            name: variant.name,
            element: variant.element,
            team: 'ENEMY',
            slotIndex: idx,
            level: e.level,
            stars: e.stars || getMonsterStars(null, variant),
            awakeningStage: e.awakeningStage || 'BASE',
            stats,
            maxHp: stats.hp,
            currentHp: stats.hp,
            turnMeter: Math.floor(stats.speed * 0.4),
            isAlive: true,
            skills: variant.skills.map((sId) => ({
              definitionId: sId,
              currentCooldown: 0,
            })),
            activeEffects: [],
            artwork: {
              avatar: variant.artwork.baseAvatar,
              colorHex: variant.artwork.colorHex,
              accentHex: variant.artwork.accentHex,
            },
          };
        });

        setBattleState((prev) => {
          if (!prev) return null;
          const nextState = engine.advanceToWave(prev, nextWave, nextEnemyParticipants);
          return { ...nextState };
        });

        isTransitioningWaveRef.current = false;

        // Default target to first living enemy of new wave
        const firstLiving = nextEnemyParticipants.find((e) => e.isAlive);
        if (firstLiving) {
          setSelectedTargetId(firstLiving.id);
        }
      }, delay);

      return () => {
        clearTimeout(timer);
        isTransitioningWaveRef.current = false;
      };
    } else {
      isTransitioningWaveRef.current = false;
    }
  }, [battleState?.phase, battleState?.currentWave, currentStage, engine, battleSpeed]);

  // 2. Default target & skill setup whenever actor shifts
  useEffect(() => {
    if (!battleState || !battleState.currentActorId) return;

    const actor = [...battleState.playerTeam, ...battleState.enemyTeam].find(
      (p) => p.id === battleState.currentActorId
    );

    if (actor && actor.team === 'PLAYER') {
      const availableSkill = actor.skills.find((s) => s.currentCooldown === 0);
      if (availableSkill) {
        setSelectedSkillId(availableSkill.definitionId);
      }
      const firstLivingEnemy = battleState.enemyTeam.find((e) => e.isAlive);
      if (firstLivingEnemy) {
        setSelectedTargetId(firstLivingEnemy.id);
      }
    }
  }, [battleState?.currentActorId]);

  // 3. Cinematic VFX Trigger on Combat Actions
  useEffect(() => {
    if (!battleState) return;

    // Direct Action Trigger from lastExecutedAction
    const executedAction = battleState.lastExecutedAction;
    if (executedAction && executedAction.id !== prevActionIdRef.current) {
      prevActionIdRef.current = executedAction.id;
      setLatestAction3D(executedAction);

      const actor = [...battleState.playerTeam, ...battleState.enemyTeam].find(
        (p) => p.id === executedAction.actorId
      );

      if (actor) {
        setActiveSkillBanner({
          skillName: executedAction.skillName,
          casterName: actor.name,
          element: actor.element,
          isExtraTurn: executedAction.isExtraTurn,
        });

        // Lunge animation on actor
        setLungingActors((prev) => ({ ...prev, [actor.id]: true }));
        setTimeout(() => {
          setLungingActors((prev) => ({ ...prev, [actor.id]: false }));
        }, Math.max(300, Math.round(550 / battleSpeed)));

        setTimeout(() => {
          setActiveSkillBanner(null);
        }, 1300 / battleSpeed);
      }

      // 1. Target HURT State Trigger (Per-unit independent hit flinch with visible duration)
      const targetsToHit =
        executedAction.allTargetIds && executedAction.allTargetIds.length > 0
          ? executedAction.allTargetIds
          : executedAction.targetId
          ? [executedAction.targetId]
          : [];

      if (!executedAction.isAllyBuff && targetsToHit.length > 0) {
        // Trigger hit reaction slightly delayed so projectile/lunge connects first
        setTimeout(() => {
          targetsToHit.forEach((tId) => {
            setHitReactions((prev) => ({ ...prev, [tId]: true }));
            setTimeout(() => {
              setHitReactions((prev) => ({ ...prev, [tId]: false }));
            }, Math.max(250, Math.round(350 / battleSpeed)));
          });
        }, Math.round(200 / battleSpeed));
      }

      // 2. Kill Victory State Trigger
      // When an action kills one or more monsters, the attacker temporarily celebrates with VICTORY.png
      if (
        actor &&
        executedAction.killedTargetIds &&
        executedAction.killedTargetIds.length > 0
      ) {
        setTimeout(() => {
          setKillCelebrationActors((prev) => ({ ...prev, [actor.id]: true }));
          setTimeout(() => {
            setKillCelebrationActors((prev) => ({ ...prev, [actor.id]: false }));
          }, Math.max(450, Math.round(650 / battleSpeed)));
        }, Math.round(220 / battleSpeed));
      }

      if (executedAction.isCrit || executedAction.isExtraTurn) {
        setIsScreenShaking(true);
        setImpactFlash(true);
        setTimeout(() => {
          setIsScreenShaking(false);
          setImpactFlash(false);
        }, 250);
      }

      if (executedAction.isExtraTurn) {
        setExtraTurnAnnouncement(
          `⚡ EXTRA TURN GRANTED! (${battleState.currentExtraTurnDepth || 1}/3)`
        );
        setTimeout(() => {
          setExtraTurnAnnouncement(null);
        }, 1600 / battleSpeed);
      }
    }

    // Process combat logs for floating numbers and reactions
    if (battleState.combatLog.length === 0) return;

    // Collect new logs since last check
    const newLogs: typeof battleState.combatLog = [];
    for (const log of battleState.combatLog) {
      if (log.id === prevLogIdRef.current) break;
      newLogs.push(log);
    }
    if (battleState.combatLog[0]) {
      prevLogIdRef.current = battleState.combatLog[0].id;
    }

    if (newLogs.length > 0) {
      const pSlots = getFormationSlots(battleState.playerTeam.length, true);
      const eSlots = getFormationSlots(battleState.enemyTeam.length, false);
      const spawnedNumbers: FloatingNumber[] = [];

      // Process chronologically (older to newer in this batch)
      newLogs.reverse().forEach((latestLog) => {
        const logMsg = latestLog.message || '';
        const isCrit = Boolean(latestLog.isCrit) || logMsg.includes('CRITICAL');
        const isHeal = latestLog.actionType === 'HEAL';
        const isDamage = latestLog.actionType === 'DAMAGE';
        const isAdvantage =
          latestLog.elementAdvantage === 'ADVANTAGE' ||
          logMsg.includes('Advantage') ||
          logMsg.includes('Weakness');
        const isDisadvantage =
          latestLog.elementAdvantage === 'DISADVANTAGE' ||
          logMsg.includes('Disadvantage') ||
          logMsg.includes('Resistant');

        // Trigger hit flinch reaction on target for logged damage (e.g. passive damage or retaliation)
        if (isDamage && latestLog.targetId) {
          const targetId = latestLog.targetId;
          setTimeout(() => {
            setHitReactions((prev) => ({ ...prev, [targetId]: true }));
            setTimeout(() => {
              setHitReactions((prev) => ({ ...prev, [targetId]: false }));
            }, Math.max(250, Math.round(350 / battleSpeed)));
          }, Math.round(150 / battleSpeed));
        }

        // Extract damage / heal value from log message
        const match = logMsg.match(/(\d+)\s*(damage|heal|shield|hp)/i);
        const extractedNum = match
          ? match[1]
          : typeof latestLog.damage === 'number'
          ? String(latestLog.damage)
          : null;

        if (extractedNum && latestLog.targetId) {
          let targetX = 50;
          let targetY = 45;

          const pIdx = battleState.playerTeam.findIndex((p) => p.id === latestLog.targetId);
          if (pIdx >= 0 && pSlots[pIdx]) {
            targetX = pSlots[pIdx].x;
            targetY = pSlots[pIdx].y - 12;
          } else {
            const eIdx = battleState.enemyTeam.findIndex((e) => e.id === latestLog.targetId);
            if (eIdx >= 0 && eSlots[eIdx]) {
              targetX = eSlots[eIdx].x;
              targetY = eSlots[eIdx].y - 12;
            }
          }

          const type: CombatDamageType = isCrit
            ? 'CRIT'
            : isAdvantage
            ? 'WEAKNESS'
            : isDisadvantage
            ? 'RESISTANT'
            : isHeal
            ? 'HEAL'
            : 'NORMAL';

          spawnedNumbers.push({
            id: `f_${Date.now()}_${Math.random()}`,
            targetId: latestLog.targetId,
            text: extractedNum,
            type,
            targetX,
            targetY,
            xOffset: (Math.random() - 0.5) * 24,
            yOffset: (Math.random() - 0.5) * 16,
          });
        }
      });

      if (spawnedNumbers.length > 0) {
        setFloatingNumbers((prev) => [...prev.slice(-10), ...spawnedNumbers]);
      }
    }
  }, [battleState?.lastExecutedAction, battleState?.combatLog, battleSpeed]);

  // Clean up floating numbers
  useEffect(() => {
    if (floatingNumbers.length === 0) return;
    const timer = setTimeout(() => {
      setFloatingNumbers((prev) => prev.slice(1));
    }, 1400);
    return () => clearTimeout(timer);
  }, [floatingNumbers]);

  // 4. Combat Turn Loop (Enemy AI runs automatically in both manual and auto mode; Auto-battle controls player actions)
  const isExecutingAiTurnRef = useRef<boolean>(false);

  useEffect(() => {
    // Battle ended or transitioning waves: Halt combat turn loop
    if (
      !battleState ||
      battleState.phase === 'VICTORY' ||
      battleState.phase === 'DEFEAT' ||
      battleState.phase === 'WAVE_TRANSITION'
    ) {
      if (autoLoopTimerRef.current) clearTimeout(autoLoopTimerRef.current);
      isExecutingAiTurnRef.current = false;
      return;
    }

    // Advance turn meters if no actor is ready (handled asynchronously to prevent render-loop lockups)
    if (!battleState.currentActorId) {
      if (isExecutingAiTurnRef.current) return;
      isExecutingAiTurnRef.current = true;
      if (autoLoopTimerRef.current) clearTimeout(autoLoopTimerRef.current);
      autoLoopTimerRef.current = setTimeout(() => {
        setBattleState((prev) => {
          if (!prev || prev.phase !== 'SELECTING_ACTION') return prev;
          const nextState = engine.stepAutoBattle(prev);
          return { ...nextState };
        });
        isExecutingAiTurnRef.current = false;
      }, Math.max(40, Math.round(100 / battleSpeed)));
      return;
    }

    const currentActor = [...battleState.playerTeam, ...battleState.enemyTeam].find(
      (p) => p.id === battleState.currentActorId
    );

    if (!currentActor || !currentActor.isAlive) {
      if (isExecutingAiTurnRef.current) return;
      isExecutingAiTurnRef.current = true;
      if (autoLoopTimerRef.current) clearTimeout(autoLoopTimerRef.current);
      autoLoopTimerRef.current = setTimeout(() => {
        setBattleState((prev) => {
          if (!prev || prev.phase !== 'SELECTING_ACTION') return prev;
          const nextState = engine.stepAutoBattle(prev);
          return { ...nextState };
        });
        isExecutingAiTurnRef.current = false;
      }, Math.max(40, Math.round(100 / battleSpeed)));
      return;
    }

    const isEnemyTurn = currentActor.team === 'ENEMY';
    const isPlayerTurn = currentActor.team === 'PLAYER';

    // Player Manual Turn: wait for player to choose action via UI
    if (isPlayerTurn && !isAuto) {
      if (autoLoopTimerRef.current) clearTimeout(autoLoopTimerRef.current);
      isExecutingAiTurnRef.current = false;
      console.log(
        `[Combat Turn Start] PLAYER MANUAL turn ready: ${currentActor.name} (${currentActor.id}) - awaiting player input.`
      );
      return;
    }

    // AI Turn Execution (Enemy AI executes ALWAYS; Player executes if Auto-Battle enabled)
    const turnType = isEnemyTurn ? 'ENEMY AI' : 'AUTO-BATTLE PLAYER';
    const delay = isEnemyTurn
      ? Math.max(300, Math.round(900 / battleSpeed))
      : Math.max(260, Math.round(1100 / battleSpeed));

    console.log(
      `[Combat Turn Start] ${turnType} turn: ${currentActor.name} (${currentActor.id}, Team: ${currentActor.team}) [Delay: ${delay}ms]`
    );

    if (autoLoopTimerRef.current) clearTimeout(autoLoopTimerRef.current);

    autoLoopTimerRef.current = setTimeout(() => {
      if (isExecutingAiTurnRef.current) return;
      isExecutingAiTurnRef.current = true;

      console.log(
        `[Combat AI Step] ${turnType} executing action for ${currentActor.name} (${currentActor.id})`
      );

      setBattleState((prev) => {
        if (!prev || prev.phase !== 'SELECTING_ACTION') return prev;
        const nextState = engine.stepAutoBattle(prev);
        return { ...nextState };
      });
      isExecutingAiTurnRef.current = false;
    }, delay);

    return () => {
      if (autoLoopTimerRef.current) clearTimeout(autoLoopTimerRef.current);
    };
  }, [battleState, isAuto, battleSpeed, engine]);

  if (!battleState) {
    return (
      <div className="p-12 text-center text-slate-300">
        <div className="animate-spin w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
        <span className="font-serif font-black text-lg tracking-wider text-amber-300">
          Conjuring 5v5 Combat Arena...
        </span>
      </div>
    );
  }

  const currentActor = [...battleState.playerTeam, ...battleState.enemyTeam].find(
    (p) => p.id === battleState.currentActorId
  );
  const isPlayerTurn = currentActor?.team === 'PLAYER';

  // Manual Skill Execution
  const handleExecuteManualSkill = (skillId: string) => {
    if (!currentActor || !isPlayerTurn) return;

    const skillDef = getSkillDefinition(skillId);
    if (!skillDef) return;

    let targetId = selectedTargetId;
    if (skillDef.targetType === 'SELF') {
      targetId = currentActor.id;
    } else if (
      skillDef.targetType === 'ALL_ALLIES' ||
      skillDef.targetType === 'SINGLE_ALLY'
    ) {
      targetId = selectedTargetId || currentActor.id;
    } else {
      const targetEnemy = battleState.enemyTeam.find(
        (e) => e.id === selectedTargetId && e.isAlive
      );
      if (!targetEnemy) {
        const defaultEnemy = battleState.enemyTeam.find((e) => e.isAlive);
        if (!defaultEnemy) return;
        targetId = defaultEnemy.id;
        setSelectedTargetId(defaultEnemy.id);
      } else {
        targetId = targetEnemy.id;
      }
    }

    console.log(
      `[Combat Manual Action] Player executed: ${currentActor.name} (${currentActor.id}) using ${skillDef.name} on target ${targetId}`
    );

    const nextState = engine.executeAction(
      battleState,
      currentActor.id,
      skillId,
      targetId
    );

    const nextActor = nextState.currentActorId
      ? [...nextState.playerTeam, ...nextState.enemyTeam].find(
          (p) => p.id === nextState.currentActorId
        )
      : null;

    console.log(
      `[Combat Action Resolved] Manual action completed. Turn count: ${nextState.turnCount}. Next actor: ${
        nextActor ? `${nextActor.name} (${nextActor.id}, ${nextActor.team})` : 'Advancing turn meters'
      }`
    );

    setBattleState({ ...nextState });
    setSelectedSkillId(null);
  };

  const handleFinishBattle = async (isVictory: boolean) => {
    if (!hasClaimedBattleRef.current) {
      hasClaimedBattleRef.current = true;
      try {
        await completePvEBattle(
          currentStage.stageId,
          isVictory,
          battleState?.partySize || battleState?.playerTeam.length || 1
        );
      } catch (err) {
        console.error('Failed to complete battle:', err);
      }
    }
    onExitBattle(isVictory);
  };

  if (playerMonsters.length < 1) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-serif text-[#2E1F0F] tracking-wide">
            Your Party is Empty
          </h2>
          <p className="text-xs text-[#5C4A34] leading-relaxed">
            You need at least 1 active monster in your tactical squad to enter battle. Visit the Party menu to select your combat team.
          </p>
          <button
            onClick={() => onExitBattle(false)}
            className="w-full py-3.5 rounded-xl fantasy-btn-gold text-[#2E1F0F] font-black text-xs uppercase tracking-wider cursor-pointer shadow-md font-serif"
          >
            Go to Party Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-[#FDFBF7] text-[#2E1F0F] flex flex-col justify-between overflow-hidden">
      {/* 1. Top HUD: Speed Turn Order Preview Ribbon & Battle Controls */}
      <div className="relative z-30 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E8DEC8] px-2.5 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 sm:gap-3 shadow-md">
        {/* Turn Queue Ribbon */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5 scrollbar-none max-w-full">
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-xl bg-[#FAF6ED] border border-[#D5C29E] text-[9px] sm:text-[10px] font-black text-[#92400E] uppercase tracking-widest whitespace-nowrap shadow-2xs font-serif shrink-0">
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D97706]" />
            <span>Turn Queue</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {battleState.turnOrderPreview.slice(0, 8).map((participantId, idx) => {
              const p = [...battleState.playerTeam, ...battleState.enemyTeam].find(
                (part) => part.id === participantId
              );
              if (!p) return null;
              const isCurrent = idx === 0;

              return (
                <div
                  key={`${participantId}_${idx}`}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border text-[10px] sm:text-[11px] font-black transition-all shadow-2xs shrink-0 ${
                    isCurrent
                      ? 'scale-105 shadow-md border-[#F59E0B] fantasy-btn-gold text-[#2E1F0F] ring-1 sm:ring-2 ring-[#F59E0B]/50'
                      : p.team === 'PLAYER'
                      ? 'border-[#7DD3FC] bg-[#E0F2FE] text-[#0369A1]'
                      : 'border-[#FECDD3] bg-[#FFF1F2] text-[#BE123C]'
                  }`}
                  title={`${p.name} (Speed: ${p.stats.speed}, Turn Meter: ${Math.round(
                    p.turnMeter
                  )}%)`}
                >
                  <span
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-2xs shrink-0"
                    style={{ backgroundColor: ELEMENT_VISUALS[p.element].colorHex }}
                  />
                  <span className="max-w-[90px] sm:max-w-[120px] truncate">
                    {p.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[8px] sm:text-[9px] bg-[#92400E] text-white px-1 rounded font-black">
                      ACT
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Speed & Auto Combat Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto sm:ml-0">
          {/* Battle Speed */}
          <button
            onClick={() =>
              setBattleSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : 1))
            }
            className="flex items-center gap-1 bg-[#FAF6ED] hover:bg-[#F5EDE0] border border-[#D5C29E] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black text-[#92400E] transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Adjust Combat Speed"
          >
            <FastForward className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D97706]" />
            <span>{battleSpeed}x</span>
          </button>

          {/* Auto Battle Toggle */}
          <button
            onClick={() => setIsAuto(!isAuto)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black border transition-all cursor-pointer shadow-2xs active:scale-95 ${
              isAuto
                ? 'fantasy-btn-gold text-[#2E1F0F] ring-1 sm:ring-2 ring-[#F59E0B]/60'
                : 'bg-[#FFFDF9] border-[#D5C29E] text-[#5C4A34] hover:bg-[#FAF6ED]'
            }`}
          >
            {isAuto ? (
              <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current text-[#92400E]" />
            ) : (
              <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#78654E]" />
            )}
            AUTO: {isAuto ? 'ON' : 'OFF'}
          </button>

          {/* Log Drawer Toggle */}
          <button
            onClick={() => setShowLogDrawer(!showLogDrawer)}
            className="bg-[#FAF6ED] hover:bg-[#F5EDE0] border border-[#D5C29E] text-[#5C4A34] p-1.5 sm:p-2 rounded-xl text-xs transition-all cursor-pointer shadow-2xs hover:text-[#2E1F0F]"
            title="Toggle Detailed Combat Log"
          >
            <Scroll className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D97706]" />
          </button>
        </div>
      </div>

      {/* 2. 2D Battlefield Environment Stage */}
      <div className="relative w-full flex-1 flex flex-col bg-[#FAF6ED] overflow-hidden select-none border-b border-[#D5C29E]">
        {/* Stage-Specific Illustrated Scenic Background Art */}
        <StageBackgroundArt
          stage={currentStage}
          element={currentStage.element}
          continentId={currentStage.continentId}
          mode="battle"
          className="opacity-45 pointer-events-none"
        />

        {/* Cinematic Skill VFX & Floating Overlays */}
        <SkillVFX
          activeSkillBanner={activeSkillBanner}
          extraTurnAnnouncement={extraTurnAnnouncement}
          impactFlash={impactFlash}
        />
        <ElementalSpellVFX activeSpell={activeSpell} />

        {/* 3. ENEMY SQUAD TACTICAL HUD (Top Compact Overlay) */}
        <div className="w-full max-w-5xl mx-auto z-20 px-3 pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#B91C1C] font-serif flex-wrap">
                <Swords className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Opponent Squad — {currentStage.name}</span>
                {battleState.totalWaves && battleState.totalWaves > 1 && (
                  <span
                    className={`ml-1 text-[10px] font-black px-2 py-0.5 rounded-full border shadow-2xs ${
                      battleState.currentWave === battleState.totalWaves
                        ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {battleState.currentWave === battleState.totalWaves
                      ? `🔥 BOSS WAVE (${battleState.currentWave}/${battleState.totalWaves})`
                      : `⚔️ WAVE ${battleState.currentWave}/${battleState.totalWaves}`}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline-block text-[10px] text-[#92400E] font-bold bg-[#FEF3C7] border border-[#F59E0B]/50 px-2 py-0.5 rounded-full">
                {getStageTerrainInfo(currentStage).terrain}
              </span>
            </div>
            <span className="text-[10px] text-[#78654E] font-bold bg-[#FAF6ED]/90 px-2 py-0.5 rounded border border-[#D5C29E]">
              Click 2D Monster or Tab to Target
            </span>
          </div>

          {/* Enemy 5-Unit Status Row */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {battleState.enemyTeam.map((enemy) => {
              const isTargeted = selectedTargetId === enemy.id;
              const isActing = battleState.currentActorId === enemy.id;
              const isDead = !enemy.isAlive;
              const hpPercent = Math.max(0, Math.min(100, (enemy.currentHp / enemy.maxHp) * 100));

              let affinityTag: 'ADVANTAGE' | 'DISADVANTAGE' | null = null;
              if (currentActor && isPlayerTurn) {
                const aff = getElementAffinity(currentActor.element, enemy.element);
                if (aff === 'ADVANTAGE') affinityTag = 'ADVANTAGE';
                else if (aff === 'DISADVANTAGE') affinityTag = 'DISADVANTAGE';
              }

              return (
                <button
                  key={enemy.id}
                  onClick={() => enemy.isAlive && setSelectedTargetId(enemy.id)}
                  disabled={isDead}
                  className={`relative p-1.5 rounded-xl border text-left transition-all cursor-pointer shadow-2xs backdrop-blur-md ${
                    isDead
                      ? 'border-[#D5C29E] bg-[#FAF6ED]/90'
                      : isTargeted
                      ? 'border-[#EF4444] bg-[#FEF2F2] shadow-md shadow-[#FCA5A5]/40 ring-2 ring-[#EF4444]/60 scale-[1.02]'
                      : isActing
                      ? 'border-[#F59E0B] bg-[#FFFBEB] ring-2 ring-[#F59E0B]/50'
                      : 'border-[#D5C29E] bg-[#FFFDF9]/90 hover:border-[#B45309]'
                  }`}
                >
                  {/* Element & Name */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-[#2E1F0F] truncate font-serif">
                      {enemy.name}
                    </span>
                    {affinityTag === 'ADVANTAGE' && (
                      <span className="text-[8px] font-black text-[#15803D] bg-[#DCFCE7] px-1 rounded border border-[#86EFAC]">
                        ADV
                      </span>
                    )}
                    {affinityTag === 'DISADVANTAGE' && (
                      <span className="text-[8px] font-black text-[#B91C1C] bg-[#FEE2E2] px-1 rounded border border-[#FCA5A5]">
                        DIS
                      </span>
                    )}
                  </div>

                  {/* HP Bar */}
                  <div className="w-full h-1.5 bg-[#E8DEC8] rounded-full overflow-hidden mb-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#DC2626] to-[#EF4444] transition-all duration-300"
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>

                  {/* Turn Meter Bar */}
                  <div className="w-full h-1 bg-[#E8DEC8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0284C7] transition-all duration-300"
                      style={{ width: `${Math.min(100, enemy.turnMeter)}%` }}
                    />
                  </div>

                  {/* Active Buffs & Debuffs with Turn Counters */}
                  {enemy.activeEffects.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {enemy.activeEffects.map((eff, i) => (
                        <BuffDebuffIcon key={eff.id || `${eff.type}-${i}`} effect={eff} size="xs" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. REAL 2D BATTLE ARENA VIEWPORT (5v5 Tactical Combat) */}
        <div className="w-full relative z-10 my-1">
          <BattleArena2D
            playerTeam={battleState.playerTeam}
            enemyTeam={battleState.enemyTeam}
            currentActorId={battleState.currentActorId}
            selectedTargetId={selectedTargetId}
            onSelectTarget={(id) => setSelectedTargetId(id)}
            latestAction={battleState.lastExecutedAction || latestAction3D}
            battleStatus={battleState.status}
            lungingActors={lungingActors}
            hitReactions={hitReactions}
            killCelebrationActors={killCelebrationActors}
            currentStage={currentStage}
            currentStageElement={currentStage.element}
            floatingNumbers={floatingNumbers}
          />

          {/* Wave Transition Screen Overlay */}
          {battleState.phase === 'WAVE_TRANSITION' && (
            <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-xs flex items-center justify-center pointer-events-none">
              <div className="fantasy-plate p-5 text-center max-w-sm w-full mx-4 shadow-2xl border-2 border-amber-400 animate-bounce-short">
                <div className="w-12 h-12 rounded-full fantasy-btn-gold flex items-center justify-center mx-auto mb-2 shadow-md">
                  <Swords className="w-6 h-6 text-[#78350F]" />
                </div>
                <div className="text-[11px] font-black text-[#D97706] tracking-widest uppercase mb-0.5">
                  Wave Cleared!
                </div>
                <h3 className="text-xl font-black font-serif text-[#2E1F0F] mb-1">
                  {battleState.currentWave && battleState.totalWaves && battleState.currentWave + 1 === battleState.totalWaves
                    ? '🔥 BOSS WAVE APPROACHING!'
                    : `WAVE ${(battleState.currentWave || 1) + 1} OF ${battleState.totalWaves || 3}`}
                </h3>
                <p className="text-xs text-[#78654E]">
                  Enemy reinforcements are taking position...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 5. ALLIED VANGUARD TACTICAL HUD (Bottom Compact Overlay) */}
        <div className="w-full max-w-5xl mx-auto z-20 px-3 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#0369A1] font-serif">
              <Shield className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>
                Allied Vanguard ({battleState.playerTeam.length}{' '}
                {battleState.playerTeam.length === 1 ? 'Unit' : 'Units'})
              </span>
            </div>
            {isPlayerTurn && (
              <span className="text-[10px] font-black text-[#92400E] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#F59E0B] animate-pulse font-serif">
                COMMAND PHASE
              </span>
            )}
          </div>

          {/* Allied Unit Status Row (Adaptive 1-5 units) */}
          <div
            className={`grid gap-1.5 sm:gap-2 ${
              battleState.playerTeam.length === 1
                ? 'grid-cols-1 max-w-xs mx-auto'
                : battleState.playerTeam.length === 2
                ? 'grid-cols-2 max-w-md mx-auto'
                : battleState.playerTeam.length === 3
                ? 'grid-cols-3 max-w-xl mx-auto'
                : battleState.playerTeam.length === 4
                ? 'grid-cols-4 max-w-3xl mx-auto'
                : 'grid-cols-5'
            }`}
          >
            {battleState.playerTeam.map((ally) => {
              const isActing = battleState.currentActorId === ally.id;
              const isDead = !ally.isAlive;
              const hpPercent = Math.max(0, Math.min(100, (ally.currentHp / ally.maxHp) * 100));

              return (
                <div
                  key={ally.id}
                  className={`relative p-1.5 rounded-xl border text-left transition-all backdrop-blur-md shadow-2xs ${
                    isDead
                      ? 'border-[#D5C29E] bg-[#FAF6ED]/90'
                      : isActing
                      ? 'border-[#F59E0B] bg-[#FFFBEB] ring-2 ring-[#F59E0B]/50 scale-[1.02] shadow-md'
                      : 'border-[#D5C29E] bg-[#FFFDF9]/90'
                  }`}
                >
                  {/* Element & Name */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-[#2E1F0F] truncate font-serif">
                      {ally.name}
                    </span>
                    {isActing && (
                      <span className="text-[8px] font-black text-[#92400E] bg-[#FEF3C7] px-1 rounded border border-[#F59E0B]">
                        TURN
                      </span>
                    )}
                  </div>

                  {/* HP Bar */}
                  <div className="w-full h-1.5 bg-[#E8DEC8] rounded-full overflow-hidden mb-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] transition-all duration-300"
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>

                  {/* Turn Meter Bar */}
                  <div className="w-full h-1 bg-[#E8DEC8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0284C7] transition-all duration-300"
                      style={{ width: `${Math.min(100, ally.turnMeter)}%` }}
                    />
                  </div>

                  {/* Active Buffs & Debuffs with Turn Counters */}
                  {ally.activeEffects.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {ally.activeEffects.map((eff, i) => (
                        <BuffDebuffIcon key={eff.id || `${eff.type}-${i}`} effect={eff} size="xs" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Bottom Action Bar: High-Fantasy Spell Deck */}
      <div className="relative z-30 bg-[#FFFDF9]/95 backdrop-blur-md border-t border-[#E8DEC8] px-4 py-3 shadow-md">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Active Monster Info Banner */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            {currentActor ? (
              <div className="flex items-center gap-2.5">
                <MonsterAvatar
                  variantId={currentActor.variantId}
                  element={currentActor.element}
                  awakeningStage={currentActor.awakeningStage}
                  size="sm"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#2E1F0F] font-serif">
                      {currentActor.name}
                    </span>
                    <span
                      className="text-[10px] font-black px-1.5 py-0.2 rounded uppercase"
                      style={{
                        color: ELEMENT_VISUALS[currentActor.element].borderHex,
                        backgroundColor: `${ELEMENT_VISUALS[currentActor.element].borderHex}22`,
                      }}
                    >
                      {currentActor.element}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#5C4A34]">
                    {isPlayerTurn
                      ? 'Select an ability to cast:'
                      : 'Enemy turn in progress...'}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-xs text-[#78654E]">
                Advancing turn meters...
              </span>
            )}
          </div>

          {/* Spell Deck Buttons */}
          {isPlayerTurn && currentActor ? (
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1 scrollbar-none w-full sm:w-auto justify-center">
              {currentActor.skills.map((s) => {
                const skillDef = getSkillDefinition(s.definitionId);
                if (!skillDef) return null;
                const onCooldown = s.currentCooldown > 0;
                const grantsExtraTurn = skillDef.effects.some(
                  (e) => e.type === 'EXTRA_TURN'
                );

                return (
                  <button
                    key={s.definitionId}
                    disabled={onCooldown || isAuto}
                    onClick={() => handleExecuteManualSkill(s.definitionId)}
                    className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer select-none min-w-[140px] max-w-[180px] shadow-sm ${
                      onCooldown
                        ? 'opacity-40 bg-[#FAF6ED] border-[#D5C29E] text-[#A89880] cursor-not-allowed'
                        : grantsExtraTurn
                        ? 'fantasy-btn-gold text-[#2E1F0F] border-[#F59E0B] shadow-md hover:scale-105 active:scale-95 ring-2 ring-[#F59E0B]/50'
                        : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-[#D5C29E] hover:border-[#B45309] text-[#2E1F0F] hover:scale-105 active:scale-95'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-black truncate text-[#2E1F0F] font-serif">
                        {skillDef.name}
                      </span>
                      {grantsExtraTurn && !onCooldown && (
                        <span className="w-2 h-2 rounded-full bg-[#D97706] animate-ping" />
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 text-[9px] text-[#78654E] mb-1">
                      <span className="text-[#92400E] font-black uppercase">
                        {skillDef.targetType.replace('_', ' ')}
                      </span>
                      {grantsExtraTurn && (
                        <span className="text-[8px] font-black text-[#92400E] bg-[#FEF3C7] border border-[#F59E0B] px-1 rounded">
                          +EXTRA TURN
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <div className="text-[9px] text-[#5C4A34] line-clamp-2 leading-tight">
                      {skillDef.description}
                    </div>

                    {/* Cooldown Mask */}
                    {onCooldown && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center z-10 text-white">
                        <span className="text-[#FCA5A5] font-black text-base">
                          {s.currentCooldown}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-[#E8DEC8]">
                          Turns Left
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-[#78654E] italic">
              {isAuto
                ? 'Auto-battle combat algorithm executing actions...'
                : 'Awaiting turn resolution...'}
            </div>
          )}
        </div>
      </div>

      {/* 6. Combat Log Slideout Drawer */}
      {showLogDrawer && (
        <div className="absolute right-0 top-12 bottom-16 w-80 bg-[#FFFDF9]/95 backdrop-blur-md border-l border-[#D5C29E] p-4 z-40 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-[#E8DEC8] mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#2E1F0F] font-serif flex items-center gap-1.5">
              <Scroll className="w-4 h-4 text-[#D97706]" />
              Combat Event Log
            </span>
            <button
              onClick={() => setShowLogDrawer(false)}
              className="text-[#78654E] hover:text-[#2E1F0F] text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
            {battleState.combatLog.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded-xl bg-[#FAF6ED] border border-[#D5C29E] text-[#5C4A34] shadow-2xs"
              >
                <div className="flex items-center justify-between text-[10px] text-[#A89880] mb-0.5">
                  <span className="font-serif font-bold">Turn {log.turnCount}</span>
                  <span className="uppercase text-[#B45309] font-black">
                    {log.actionType}
                  </span>
                </div>
                <div className="text-[#2E1F0F] font-medium">{log.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. REWARDING VICTORY SEQUENCE */}
      {battleState.phase === 'VICTORY' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full fantasy-plate p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden animate-bounce-short">
            {/* Ambient Victory Rays */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-20 h-20 rounded-full fantasy-btn-gold flex items-center justify-center mx-auto mb-4 shadow-xl ring-4 ring-[#F59E0B]/40">
              <Crown className="w-12 h-12 text-[#78350F]" />
            </div>

            <h2 className="text-3xl font-black font-serif tracking-wider text-[#2E1F0F] mb-1">
              {currentStage.stageId.startsWith('spar_') || currentStage.continentId === 'sparring_arena'
                ? 'SPARRING VICTORY!'
                : 'BATTLE VICTORY!'}
            </h2>
            <p className="text-xs text-[#5C4A34] mb-6">
              {currentStage.stageId.startsWith('spar_') || currentStage.continentId === 'sparring_arena'
                ? "Friendly duel concluded! You defeated your friend's defense party."
                : `All ${battleState.enemyTeam.length} enemy combatants have been vanquished in battle.`}
            </p>

            {/* Surviving Squad Ribbon */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {battleState.playerTeam.map((p) => (
                <div
                  key={p.id}
                  className={`p-1 rounded-xl border shadow-2xs ${
                    p.isAlive
                      ? 'border-[#F59E0B] bg-[#FFFBEB]'
                      : 'border-[#D5C29E] bg-[#FAF6ED]'
                  }`}
                >
                  <MonsterAvatar
                    variantId={p.variantId}
                    element={p.element}
                    size="sm"
                  />
                </div>
              ))}
            </div>

            {/* Rewarded Currencies & Party-Size XP Breakdown */}
            {currentStage.stageId.startsWith('spar_') || currentStage.continentId === 'sparring_arena' ? (
              <div className="bg-[#FAF6ED] border border-[#D5C29E] rounded-2xl p-4 mb-6 space-y-2.5 text-left shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-2">
                  <div className="text-xs text-[#78654E] font-bold uppercase font-serif">Match Type</div>
                  <div className="text-xs font-black text-[#0284C7] font-mono uppercase tracking-wider flex items-center gap-1">
                    <span>🤝</span> Friendly Sparring
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[#78654E]">
                  <span>Gold Earned:</span>
                  <span className="font-mono text-[#78654E] font-bold">0 G</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#78654E]">
                  <span>Experience Earned:</span>
                  <span className="font-mono text-[#78654E] font-bold">0 EXP</span>
                </div>
                <div className="text-[11px] text-[#A89078] italic text-center pt-1 border-t border-[#E8DEC8]">
                  Practice mode — friendly sparring matches do not award gold or experience.
                </div>
              </div>
            ) : (() => {
              const xpReward = calculatePartyXpReward(
                currentStage.repeatRewards.exp,
                battleState.partySize || battleState.playerTeam.length
              );

              return (
                <div className="bg-[#FAF6ED] border border-[#D5C29E] rounded-2xl p-4 mb-6 space-y-3 text-left shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-2.5">
                    <div className="text-xs text-[#78654E] font-bold uppercase font-serif">Gold Earned</div>
                    <div className="text-base font-black text-[#D97706] font-mono">
                      +{currentStage.repeatRewards.gold.toLocaleString()} G
                    </div>
                  </div>

                  {/* Experience Breakdown */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-xs text-[#78654E]">
                      <span>Base EXP:</span>
                      <span className="font-mono text-[#2E1F0F] font-bold">{xpReward.baseExp.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#0284C7] font-bold">
                        {xpReward.bonusLabel}:
                      </span>
                      <span className="font-mono font-black text-[#D97706]">
                        {xpReward.bonusPercentText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-black pt-1.5 border-t border-[#E8DEC8]">
                      <span className="text-[#16A34A] font-serif">Total EXP:</span>
                      <span className="font-mono font-black text-[#16A34A] text-base">
                        {xpReward.totalExp.toLocaleString()} EXP
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Equipment Drop Banner if an equipment dungeon or stage dropped gear */}
            {droppedGear && (
              <div className="bg-gradient-to-r from-amber-500/15 via-amber-400/25 to-amber-500/15 border-2 border-amber-400 rounded-2xl p-3.5 mb-5 text-left shadow-md">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-amber-950 bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>⚔️ Equipment Loot</span>
                  </span>
                  <span className={`text-xs font-mono font-black uppercase ${
                    droppedGear.rarity === 'LEGENDARY' ? 'text-amber-600' :
                    droppedGear.rarity === 'EPIC' ? 'text-purple-600' :
                    droppedGear.rarity === 'RARE' ? 'text-blue-600' :
                    droppedGear.rarity === 'UNCOMMON' ? 'text-emerald-600' : 'text-slate-600'
                  }`}>
                    {droppedGear.rarity}
                  </span>
                </div>
                <div className="text-base font-black text-[#2E1F0F] font-serif">
                  {droppedGear.name} (+{droppedGear.level})
                </div>
                <div className="text-[11px] font-mono text-[#78654E] mt-0.5 mb-2">
                  {droppedGear.set} Set • {droppedGear.slot}
                </div>

                {/* Formatted: main stat / sub stat / sub stat / sub stat */}
                <div className="bg-[#FFFDF9] rounded-xl p-2.5 border border-amber-300 shadow-2xs">
                  <div className="text-[10px] text-[#78654E] font-bold uppercase mb-1">
                    Stats (main stat / sub stat):
                  </div>
                  <div className="text-xs font-mono font-bold text-[#92400E] leading-relaxed break-words">
                    {formatEquipmentStatString(droppedGear)}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => handleFinishBattle(true)}
              className="w-full py-3.5 rounded-2xl font-black text-sm fantasy-btn-gold text-[#2E1F0F] shadow-xl cursor-pointer transition-transform hover:scale-105 uppercase tracking-wider font-serif"
            >
              Claim Rewards & Continue
            </button>
          </div>
        </div>
      )}

      {/* 8. ATMOSPHERIC DEFEAT SEQUENCE */}
      {battleState.phase === 'DEFEAT' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full fantasy-plate border-2 border-[#EF4444] p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#FEE2E2] border border-[#EF4444] flex items-center justify-center mx-auto mb-4 shadow-md">
              <XCircle className="w-10 h-10 text-[#DC2626]" />
            </div>

            <h2 className="text-2xl font-black font-serif tracking-wider text-[#B91C1C] mb-1">
              EXPEDITION DEFEATED
            </h2>
            <p className="text-xs text-[#5C4A34] mb-6">
              Your party was overwhelmed. Enhance levels, equip 4-piece rune
              sets, or awaken them in the Monsters tab to overpower this stage!
            </p>

            <button
              onClick={() => handleFinishBattle(false)}
              className="w-full py-3.5 rounded-2xl font-black fantasy-btn-ivory text-[#2E1F0F] border border-[#D5C29E] cursor-pointer transition-all font-serif"
            >
              Return to Realm Hub
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
