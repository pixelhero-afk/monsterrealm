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
  Trophy,
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
import { completeArenaMatchApi } from '../services/arenaService';
import { ArenaMatchResult, getArenaTier } from '../types/arena';
import { calculatePartyXpReward } from '../utils/experienceModifiers';
import { getMonsterStars } from '../utils/monsterStars';
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
  onExitBattle: (isVictory: boolean, returnToArena?: boolean) => void;
}

export const BattleView: React.FC<BattleViewProps> = ({
  playerMonsters,
  currentStage,
  onExitBattle,
}) => {
  const [engine] = useState(() => new CombatEngine(Date.now()));
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [droppedGear, setDroppedGear] = useState<any | null>(null);
  const [droppedStones, setDroppedStones] = useState<any | null>(null);
  const hasClaimedBattleRef = useRef<boolean>(false);
  const initializedStageRef = useRef<string | null>(null);
  const isTransitioningWaveRef = useRef<boolean>(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [inspectingSkillId, setInspectingSkillId] = useState<string | null>(null);
  const [isAuto, setIsAuto] = useState<boolean>(false);
  const [battleSpeed, setBattleSpeed] = useState<1 | 2 | 3>(1);
  const [showLogDrawer, setShowLogDrawer] = useState<boolean>(false);

  // Asynchronous PvP Arena State
  const isArenaBattle =
    currentStage.stageId.startsWith('arena_') || currentStage.continentId === 'pvp_arena';
  const [arenaMatchResult, setArenaMatchResult] = useState<ArenaMatchResult | null>(null);
  const [isLoadingArenaResult, setIsLoadingArenaResult] = useState<boolean>(false);

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

  // Auto-retarget to ensure a living enemy is always focused on mobile & desktop
  useEffect(() => {
    if (!battleState || battleState.enemyTeam.length === 0) return;
    const currentTarget = battleState.enemyTeam.find(
      (e) => e.id === selectedTargetId && e.isAlive && e.currentHp > 0
    );
    if (!currentTarget) {
      const firstAlive = battleState.enemyTeam.find((e) => e.isAlive && e.currentHp > 0);
      if (firstAlive) {
        setSelectedTargetId(firstAlive.id);
      }
    }
  }, [battleState?.enemyTeam, selectedTargetId]);

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

      if (isArenaBattle) {
        setIsLoadingArenaResult(true);
        const oppId = currentStage.stageId.startsWith('arena_match_')
          ? currentStage.stageId.replace('arena_match_', '').split('_').slice(0, -1).join('_')
          : 'rival_starter_kai';
        completeArenaMatchApi(currentStage.stageId, oppId, true)
          .then((res) => {
            if (res) setArenaMatchResult(res);
          })
          .catch((err) => {
            console.error('Error completing arena match:', err);
          })
          .finally(() => {
            setIsLoadingArenaResult(false);
          });
      } else {
        completePvEBattle(
          currentStage.stageId,
          true,
          battleState?.partySize || battleState?.playerTeam.length || 1
        )
          .then((res) => {
            if (res?.droppedEquipment) {
              setDroppedGear(res.droppedEquipment);
            }
            if (res?.droppedStones) {
              setDroppedStones(res.droppedStones);
            }
          })
          .catch((err) => {
            console.error('Error claiming battle rewards:', err);
          });
      }
    }
  }, [battleState?.phase, isArenaBattle]);

  // Defeat rating resolution for Arena duels
  useEffect(() => {
    if (battleState?.phase === 'DEFEAT' && isArenaBattle && !hasClaimedBattleRef.current) {
      hasClaimedBattleRef.current = true;
      setIsLoadingArenaResult(true);
      const oppId = currentStage.stageId.startsWith('arena_match_')
        ? currentStage.stageId.replace('arena_match_', '').split('_').slice(0, -1).join('_')
        : 'rival_starter_kai';
      completeArenaMatchApi(currentStage.stageId, oppId, false)
        .then((res) => {
          if (res) setArenaMatchResult(res);
        })
        .catch((err) => {
          console.error('Error recording arena defeat:', err);
        })
        .finally(() => {
          setIsLoadingArenaResult(false);
        });
    }
  }, [battleState?.phase, isArenaBattle]);

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

        // Cinematic Elemental Spell Backdrop for powerful or AoE attacks
        if (executedAction.isAoe || executedAction.slot >= 2 || executedAction.isCrit) {
          setActiveSpell({
            casterId: actor.id,
            targetId: executedAction.targetId,
            element: executedAction.element || actor.element,
            skillName: executedAction.skillName,
            isAoe: Boolean(
              executedAction.isAoe ||
              (executedAction.allTargetIds && executedAction.allTargetIds.length > 1)
            ),
          });
          setTimeout(() => {
            setActiveSpell(null);
          }, Math.max(500, Math.round(900 / battleSpeed)));
        }
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

  const handleProjectileImpact = (targetId: string, element: any) => {
    // Synchronized hit reaction flinch at moment of projectile impact
    setHitReactions((prev) => ({ ...prev, [targetId]: true }));
    setTimeout(() => {
      setHitReactions((prev) => ({ ...prev, [targetId]: false }));
    }, Math.max(250, Math.round(350 / battleSpeed)));

    // Subtle tactile screen tremor on impact
    setIsScreenShaking(true);
    setImpactFlash(true);
    setTimeout(() => {
      setIsScreenShaking(false);
      setImpactFlash(false);
    }, 180);
  };

  const handleFinishBattle = async (isVictory: boolean) => {
    if (!hasClaimedBattleRef.current) {
      hasClaimedBattleRef.current = true;
      try {
        if (isArenaBattle) {
          const oppId = currentStage.stageId.startsWith('arena_match_')
            ? currentStage.stageId.replace('arena_match_', '').split('_').slice(0, -1).join('_')
            : 'rival_starter_kai';
          const res = await completeArenaMatchApi(currentStage.stageId, oppId, isVictory);
          if (res) setArenaMatchResult(res);
        } else {
          await completePvEBattle(
            currentStage.stageId,
            isVictory,
            battleState?.partySize || battleState?.playerTeam.length || 1
          );
        }
      } catch (err) {
        console.error('Failed to complete battle:', err);
      }
    }
    onExitBattle(isVictory, isArenaBattle);
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
    <div className="relative h-[calc(100dvh-64px)] max-h-[calc(100dvh-64px)] bg-[#0b101d] text-slate-100 flex flex-col justify-between overflow-hidden select-none">
      {/* 1. Top HUD: Compact Tactical Header for Mobile & Desktop */}
      <div className="relative z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-2 sm:px-4 py-1.5 flex items-center justify-between gap-1.5 sm:gap-3 shadow-md shrink-0">
        {/* Turn Queue Ribbon */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-0.5 scrollbar-none max-w-[48%] sm:max-w-none">
          <div className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-slate-900 border border-amber-500/40 text-[8.5px] sm:text-[10px] font-black text-amber-400 uppercase tracking-wider shrink-0 shadow-xs font-serif">
            <Zap className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Turn Queue</span>
            <span className="sm:hidden">Turns</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {battleState.turnOrderPreview.slice(0, 6).map((participantId, idx) => {
              const p = [...battleState.playerTeam, ...battleState.enemyTeam].find(
                (part) => part.id === participantId
              );
              if (!p) return null;
              const isCurrent = idx === 0;

              return (
                <div
                  key={`${participantId}_${idx}`}
                  className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border text-[8.5px] sm:text-[10.5px] font-black transition-all shrink-0 ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/60 scale-105 shadow-md'
                      : p.team === 'PLAYER'
                      ? 'bg-sky-950/60 border-sky-600/50 text-sky-300'
                      : 'bg-rose-950/60 border-rose-600/50 text-rose-300'
                  }`}
                  title={`${p.name} (Speed: ${p.stats.speed}, Turn Meter: ${Math.round(
                    p.turnMeter
                  )}%)`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: ELEMENT_VISUALS[p.element].colorHex }}
                  />
                  <span className="max-w-[45px] sm:max-w-[85px] truncate font-sans">
                    {p.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[6.5px] sm:text-[8px] bg-amber-500 text-slate-950 px-1 rounded font-black font-mono">
                      ACT
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage & Wave Indicator */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] sm:text-xs font-bold text-slate-200 shrink-0">
          <Swords className="w-3 h-3 text-rose-400 shrink-0" />
          <span className="truncate max-w-[70px] sm:max-w-[130px] font-serif hidden xs:inline">
            {currentStage.name}
          </span>
          {battleState.totalWaves && battleState.totalWaves > 1 && (
            <span
              className={`text-[8px] sm:text-[9.5px] font-black px-1.5 py-0.2 rounded-full border shadow-2xs ${
                battleState.currentWave === battleState.totalWaves
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                  : 'bg-amber-950/80 text-amber-300 border-amber-600/50'
              }`}
            >
              {battleState.currentWave === battleState.totalWaves
                ? `BOSS`
                : `W${battleState.currentWave}/${battleState.totalWaves}`}
            </span>
          )}
        </div>

        {/* Combat Speed & Auto Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Battle Speed */}
          <button
            onClick={() =>
              setBattleSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : 1))
            }
            className="flex items-center gap-0.5 sm:gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black text-amber-300 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Adjust Combat Speed"
          >
            <FastForward className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
            <span>{battleSpeed}x</span>
          </button>

          {/* Auto Battle Toggle */}
          <button
            onClick={() => setIsAuto(!isAuto)}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black border transition-all cursor-pointer shadow-xs active:scale-95 ${
              isAuto
                ? 'bg-amber-500 text-slate-950 border-amber-400 ring-1 ring-amber-400/60 shadow-amber-500/20'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAuto ? (
              <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current text-slate-950" />
            ) : (
              <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />
            )}
            <span>AUTO</span>
          </button>

          {/* Log Drawer Toggle */}
          <button
            onClick={() => setShowLogDrawer(!showLogDrawer)}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 p-1 sm:p-1.5 rounded-lg text-xs transition-all cursor-pointer shadow-xs"
            title="Toggle Detailed Combat Log"
          >
            <Scroll className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* 2. 2D Anime Battlefield Environment Stage */}
      <div className="relative w-full flex-1 min-h-0 flex flex-col bg-slate-950 overflow-hidden select-none border-b border-slate-800">
        {/* Cinematic Skill VFX & Floating Overlays */}
        <SkillVFX
          activeSkillBanner={activeSkillBanner}
          extraTurnAnnouncement={extraTurnAnnouncement}
          impactFlash={impactFlash}
        />
        <ElementalSpellVFX activeSpell={activeSpell} />

        {/* 2D Anime Battle Arena Viewport (Full 5v5 Tactical Combat) */}
        <div className="w-full flex-1 min-h-0 relative z-10 flex flex-col p-1 sm:p-2">
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
            battleSpeed={battleSpeed}
            onImpact={handleProjectileImpact}
          />

          {/* Wave Transition Screen Overlay */}
          {battleState.phase === 'WAVE_TRANSITION' && (
            <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-xs flex items-center justify-center pointer-events-none">
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
      </div>

      {/* 5. Bottom Action Deck: Mobile-Friendly Spell Bar */}
      <div className="relative z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 sm:px-4 py-2 sm:py-2.5 shadow-2xl shrink-0">
        {/* Floating Skill Inspector Tooltip Card */}
        {inspectingSkillId && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 bg-slate-900/98 border-2 border-amber-500/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md text-slate-100 animate-in fade-in duration-150">
            {(() => {
              const skillDef = getSkillDefinition(inspectingSkillId);
              if (!skillDef) return null;
              return (
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-serif font-black text-xs text-amber-300">
                        {skillDef.name}
                      </span>
                    </div>
                    <button
                      onClick={() => setInspectingSkillId(null)}
                      className="text-slate-400 hover:text-white text-xs font-mono px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-300 leading-snug mb-2 font-sans">
                    {skillDef.description}
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                      Target: {skillDef.targetType.replace('_', ' ')}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-400">
                      Cooldown: {skillDef.cooldown} turns
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Active Monster Info Banner */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
            {currentActor ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MonsterAvatar
                    variantId={currentActor.variantId}
                    element={currentActor.element}
                    awakeningStage={currentActor.awakeningStage}
                    size="sm"
                  />
                  <span
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-slate-900 flex items-center justify-center text-[7px] font-black text-white"
                    style={{ backgroundColor: ELEMENT_VISUALS[currentActor.element].colorHex }}
                  >
                    {currentActor.element[0]}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-slate-100 font-serif truncate max-w-[100px] sm:max-w-[140px]">
                      {currentActor.name}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-mono text-amber-400 font-bold">
                      Lv.{currentActor.level}
                    </span>
                  </div>
                  {/* Real-time Health bar */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-20 sm:w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, (currentActor.currentHp / currentActor.maxHp) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-[8px] font-mono font-bold text-slate-400">
                      {currentActor.currentHp}/{currentActor.maxHp}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                Advancing turn meters...
              </span>
            )}

            {/* Mobile indicator for active turn status */}
            <div className="sm:hidden text-right">
              {isPlayerTurn ? (
                <span className="text-[9px] font-black text-emerald-400 animate-pulse">
                  YOUR TURN
                </span>
              ) : (
                <span className="text-[9px] text-slate-400 italic">
                  {isAuto ? 'Auto-Battling...' : 'Enemy Turn...'}
                </span>
              )}
            </div>
          </div>

          {/* Spell Deck Buttons */}
          {isPlayerTurn && currentActor ? (
            <div className="flex items-center gap-1.5 sm:gap-2.5 w-full sm:w-auto justify-end overflow-x-auto py-0.5 scrollbar-none">
              {currentActor.skills.map((s) => {
                const skillDef = getSkillDefinition(s.definitionId);
                if (!skillDef) return null;
                const onCooldown = s.currentCooldown > 0;
                const grantsExtraTurn = skillDef.effects.some(
                  (e) => e.type === 'EXTRA_TURN'
                );

                return (
                  <div key={s.definitionId} className="relative flex-1 sm:flex-initial">
                    <button
                      disabled={onCooldown || isAuto}
                      onClick={() => handleExecuteManualSkill(s.definitionId)}
                      className={`w-full sm:w-auto min-w-[76px] sm:min-w-[120px] max-w-[140px] px-2 py-1.5 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none shadow-sm active:scale-95 ${
                        onCooldown
                          ? 'opacity-40 bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                          : grantsExtraTurn
                          ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/30 border-amber-400 text-amber-100 ring-1 ring-amber-400/50 hover:border-amber-300 hover:scale-102'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-amber-500 text-slate-100 hover:scale-102'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] sm:text-xs font-black truncate font-serif text-slate-100">
                          {skillDef.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingSkillId(
                              inspectingSkillId === s.definitionId ? null : s.definitionId
                            );
                          }}
                          className="text-slate-400 hover:text-amber-300 p-0.5 rounded transition-colors cursor-pointer"
                          title="Skill Details"
                        >
                          <Info className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1 text-[8px] text-slate-400">
                        <span className="uppercase text-amber-400 font-bold">
                          {skillDef.targetType.replace('_', ' ')}
                        </span>
                        {grantsExtraTurn && (
                          <span className="text-[7px] text-amber-300 font-bold bg-amber-950/80 px-1 rounded border border-amber-500/40">
                            +TURN
                          </span>
                        )}
                      </div>

                      {/* Hidden on small mobile screens to keep height sleek */}
                      <div className="hidden sm:block text-[8.5px] text-slate-400 line-clamp-1 mt-0.5 leading-tight">
                        {skillDef.description}
                      </div>

                      {/* Cooldown Mask */}
                      {onCooldown && (
                        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center z-10 text-white pointer-events-none">
                          <span className="text-rose-400 font-black text-sm sm:text-base font-mono">
                            {s.currentCooldown}
                          </span>
                          <span className="text-[7px] uppercase tracking-wider text-slate-400">
                            Turns
                          </span>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-2 text-center sm:text-right w-full sm:w-auto">
              {isAuto
                ? '⚡ Auto-Battle executing actions...'
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
          <div className="max-w-md w-full fantasy-plate p-4 sm:p-6 text-center shadow-2xl relative overflow-hidden max-h-[90dvh] overflow-y-auto">
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
            {isArenaBattle ? (
              <div className="bg-[#FAF6ED] border-2 border-amber-400 rounded-2xl p-4 sm:p-5 mb-6 text-left shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-2xs">
                      <Swords className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black font-serif text-[#2E1F0F]">
                        Arena Duel Triumph!
                      </div>
                      <div className="text-[11px] text-[#78654E]">
                        Vanquished rival summoner defense squad
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white font-mono shadow-2xs">
                    PvP Arena
                  </span>
                </div>

                {/* Rating Change Highlight Banner */}
                <div className="bg-gradient-to-r from-emerald-500/15 via-emerald-400/25 to-emerald-500/15 border-2 border-emerald-400 rounded-xl p-3 sm:p-4 flex items-center justify-between shadow-2xs">
                  <div>
                    <div className="text-[10px] font-black uppercase text-emerald-900 tracking-wider">
                      Arena Rating Gained
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-serif text-emerald-700 flex items-center gap-2 mt-0.5">
                      <span>+{arenaMatchResult?.ratingDelta ?? 24} PTS</span>
                      <Trophy className="w-5 h-5 text-emerald-600 fill-emerald-400" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-[#78654E]">New Rating Standing</div>
                    <div className="text-base sm:text-lg font-black font-mono text-[#2E1F0F]">
                      {(arenaMatchResult?.newRating ?? 1024).toLocaleString()} PTS
                    </div>
                    {arenaMatchResult?.newTier && (
                      <span className="text-[9px] font-black uppercase text-amber-800 bg-amber-200/90 px-2 py-0.5 rounded-full border border-amber-300 inline-block mt-0.5">
                        {arenaMatchResult.newTier}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arena Spoils */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-white border border-[#D5C29E] text-center shadow-2xs">
                    <div className="text-[10px] text-[#78654E] font-bold uppercase">Gold Bounty</div>
                    <div className="text-xs sm:text-sm font-black text-amber-600 font-mono mt-0.5">
                      +{arenaMatchResult?.rewards?.gold ?? 800} G
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-[#D5C29E] text-center shadow-2xs">
                    <div className="text-[10px] text-[#78654E] font-bold uppercase">Summon Points</div>
                    <div className="text-xs sm:text-sm font-black text-cyan-600 font-mono mt-0.5">
                      +{arenaMatchResult?.rewards?.summonPoints ?? 30} SP
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-[#D5C29E] text-center shadow-2xs">
                    <div className="text-[10px] text-[#78654E] font-bold uppercase">Gems Bonus</div>
                    <div className="text-xs sm:text-sm font-black text-purple-600 font-mono mt-0.5">
                      +{arenaMatchResult?.rewards?.gems ?? 5} 💎
                    </div>
                  </div>
                </div>
              </div>
            ) : currentStage.stageId.startsWith('spar_') || currentStage.continentId === 'sparring_arena' ? (
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

            {/* Elemental Stones Drop Banner if an elemental dungeon was cleared */}
            {droppedStones && (
              <div className="bg-gradient-to-r from-purple-500/15 via-amber-400/20 to-purple-500/15 border-2 border-purple-400 rounded-2xl p-3.5 mb-5 text-left shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-purple-950 bg-purple-200 border border-purple-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span>🔮 Awakening Stones Harvested</span>
                  </span>
                  {(droppedStones.elemental?.huge > 0 || droppedStones.magic?.huge > 0) && (
                    <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-300 px-2 py-0.5 rounded-full border border-amber-400 animate-pulse">
                      ★ Huge Stones Obtained! ★
                    </span>
                  )}
                </div>

                <div className="text-sm font-black text-[#2E1F0F] font-serif mb-2">
                  {droppedStones.element === 'MAGIC'
                    ? 'Universal Magic Awakening Stones'
                    : `${droppedStones.element} & Magic Awakening Stones`}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {/* Elemental Stones */}
                  {droppedStones.element !== 'MAGIC' && droppedStones.elemental && (
                    <div className="p-2 rounded-xl bg-[#FFFDF9] border border-amber-300 space-y-1">
                      <div className="text-[10px] font-bold text-[#92400E] uppercase font-sans">
                        {droppedStones.element} Stones
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                        {droppedStones.elemental.small > 0 && (
                          <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                            +{droppedStones.elemental.small} Sm
                          </span>
                        )}
                        {droppedStones.elemental.medium > 0 && (
                          <span className="bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded font-bold">
                            +{droppedStones.elemental.medium} Med
                          </span>
                        )}
                        {droppedStones.elemental.huge > 0 && (
                          <span className="bg-amber-400 text-stone-900 px-1.5 py-0.5 rounded font-black border border-amber-500">
                            +{droppedStones.elemental.huge} HUGE
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Magic Stones */}
                  {droppedStones.magic && (
                    <div className="p-2 rounded-xl bg-[#FFFDF9] border border-purple-300 space-y-1">
                      <div className="text-[10px] font-bold text-purple-900 uppercase font-sans">
                        Magic Stones
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                        {droppedStones.magic.small > 0 && (
                          <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-bold">
                            +{droppedStones.magic.small} Sm
                          </span>
                        )}
                        {droppedStones.magic.medium > 0 && (
                          <span className="bg-purple-200 text-purple-950 px-1.5 py-0.5 rounded font-bold">
                            +{droppedStones.magic.medium} Med
                          </span>
                        )}
                        {droppedStones.magic.huge > 0 && (
                          <span className="bg-fuchsia-300 text-purple-950 px-1.5 py-0.5 rounded font-black border border-purple-400">
                            +{droppedStones.magic.huge} HUGE
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => handleFinishBattle(true)}
              className="w-full py-3.5 rounded-2xl font-black text-sm fantasy-btn-gold text-[#2E1F0F] shadow-xl cursor-pointer transition-transform hover:scale-105 uppercase tracking-wider font-serif"
            >
              {isArenaBattle ? 'Return to Arena & Highscores' : 'Claim Rewards & Continue'}
            </button>
          </div>
        </div>
      )}

      {/* 8. ATMOSPHERIC DEFEAT SEQUENCE */}
      {battleState.phase === 'DEFEAT' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full fantasy-plate border-2 border-[#EF4444] p-4 sm:p-6 text-center shadow-2xl max-h-[90dvh] overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-[#FEE2E2] border border-[#EF4444] flex items-center justify-center mx-auto mb-4 shadow-md">
              {isArenaBattle ? (
                <Swords className="w-9 h-9 text-[#DC2626]" />
              ) : (
                <XCircle className="w-10 h-10 text-[#DC2626]" />
              )}
            </div>

            <h2 className="text-2xl font-black font-serif tracking-wider text-[#B91C1C] mb-1">
              {isArenaBattle ? 'ARENA DUEL DEFEATED' : 'EXPEDITION DEFEATED'}
            </h2>

            {isArenaBattle ? (
              <div className="my-4 space-y-3">
                <p className="text-xs text-[#5C4A34]">
                  Your offensive squad was bested by the rival summoner's defense lineup.
                </p>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between text-left">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-rose-800">Rating Change</div>
                    <div className="text-base font-black font-mono text-rose-700">
                      {arenaMatchResult?.ratingDelta ?? -12} PTS
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-[#78654E]">Current Rating</div>
                    <div className="text-sm font-black font-mono text-[#2E1F0F]">
                      {(arenaMatchResult?.newRating ?? 1000).toLocaleString()} PTS
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-[#78654E] italic bg-[#FAF6ED] p-2.5 rounded-xl border border-[#D5C29E]">
                  Tip: Adjust your tactical lineup, elemental advantages, and rune sets in the Monsters tab before challenging again!
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#5C4A34] mb-6">
                Your party was overwhelmed. Enhance levels, equip 4-piece rune
                sets, or awaken them in the Monsters tab to overpower this stage!
              </p>
            )}

            <button
              onClick={() => handleFinishBattle(false)}
              className="w-full py-3.5 rounded-2xl font-black fantasy-btn-ivory text-[#2E1F0F] border border-[#D5C29E] cursor-pointer transition-all font-serif hover:border-amber-400"
            >
              {isArenaBattle ? 'Return to Arena & Highscores' : 'Return to Realm Hub'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
