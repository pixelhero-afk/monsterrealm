/**
 * 2D Battle Arena Component
 * Staged two-sided 5v5 tactical battlefield replacing the 3D viewport.
 * Features a 3-Back / 2-Front formation on each side, mirrored across a central glowing dividing line,
 * data-driven map backgrounds, elevated perspective battle platform,
 * dedicated holographic unit slot pads, and directional attack lunging.
 */

import React, { useState, useEffect } from 'react';
import { BattleParticipant, ElementType, ExecutedActionRecord } from '../../types';
import { BattleMonster2D } from './BattleMonster2D';
import { BattlePlatformStage2D } from './BattlePlatformStage2D';
import { BattleMapBackground } from './BattleMapBackground';
import { getMapForStage, BATTLE_MAPS, MapDefinition } from '../../data/maps';
import { MonsterCombatVisualState } from '../../services/character2d/types';
import { Shield } from 'lucide-react';
import { getFormationSlots, FormationSlot, PLAYER_FORMATION_SLOTS, ENEMY_FORMATION_SLOTS } from './formationSlots';
import { monster2DRegistry } from '../../services/character2d/monster2DRegistry';
import { DamageNumberOverlay, FloatingNumber } from '../battle/DamageNumberOverlay';
import { ElementalProjectiles } from '../battle/ElementalProjectiles';

export { PLAYER_FORMATION_SLOTS, ENEMY_FORMATION_SLOTS };

interface BattleArena2DProps {
  playerTeam: BattleParticipant[];
  enemyTeam: BattleParticipant[];
  currentActorId: string | null;
  selectedTargetId: string | null;
  onSelectTarget: (targetId: string) => void;
  latestAction: ExecutedActionRecord | null;
  battleStatus: 'IN_PROGRESS' | 'VICTORY' | 'DEFEAT';
  lungingActors: Record<string, boolean>;
  hitReactions: Record<string, boolean>;
  killCelebrationActors?: Record<string, boolean>;
  onOpenAssetManager?: (familyId?: string, state?: MonsterCombatVisualState) => void;
  currentStage?: any;
  currentStageElement?: ElementType;
  floatingNumbers?: FloatingNumber[];
  battleSpeed?: number;
  onImpact?: (targetId: string, element: ElementType) => void;
}

export const BattleArena2D: React.FC<BattleArena2DProps> = ({
  playerTeam,
  enemyTeam,
  currentActorId,
  selectedTargetId,
  onSelectTarget,
  latestAction,
  battleStatus,
  lungingActors,
  hitReactions,
  killCelebrationActors,
  onOpenAssetManager,
  currentStage,
  currentStageElement = 'FIRE',
  floatingNumbers,
  battleSpeed = 1,
  onImpact,
}) => {
  // Active map definition synchronized with current campaign stage and continent
  const initialMap = getMapForStage(currentStageElement, undefined, currentStage?.continentId);
  const [activeMapId, setActiveMapId] = useState<string>(initialMap.id);

  // Synchronize battlefield arena whenever the player selects a different campaign stage
  useEffect(() => {
    const nextMap = getMapForStage(currentStageElement, undefined, currentStage?.continentId);
    setActiveMapId((prev) => (prev === nextMap.id ? prev : nextMap.id));
  }, [currentStage?.continentId, currentStageElement]);

  const activeMapDef: MapDefinition = BATTLE_MAPS[activeMapId] || initialMap;

  // Preload combat artwork for all combatants so state transitions (idle, attack, hurt) are instant and flicker-free
  useEffect(() => {
    const allParticipants = [...playerTeam, ...enemyTeam];
    const states: MonsterCombatVisualState[] = ['IDLE', 'ATTACK', 'HURT', 'DEFEATED', 'VICTORY'];

    allParticipants.forEach((p) => {
      states.forEach((st) => {
        const url = monster2DRegistry.getStateUrl(p.variantId, st, p.element);
        if (url) {
          monster2DRegistry.preloadState(url);
        }
      });
    });
  }, [playerTeam, enemyTeam]);

  // Dynamic tactical formation slots based on team sizes (1 to 5 units)
  const playerSlots = getFormationSlots(playerTeam.length, true);
  const enemySlots = getFormationSlots(enemyTeam.length, false);

  // Determine each participant's visual state (IDLE, ATTACK, HURT, DEFEATED, VICTORY)
  // Strictly adhering to state priority:
  // 1. DEFEATED (HP <= 0) - Dead units NEVER show IDLE/ATTACK/VICTORY (except transient hurt during fatal blow)
  // 2. HURT (taking damage, HP > 0, or fatal hit reaction)
  // 3. ATTACK (active skill execution / lunge)
  // 4. VICTORY (end of battle or temporary kill celebration)
  // 5. IDLE (default living state)
  const computeVisualState = (p: BattleParticipant): MonsterCombatVisualState => {
    const isDead = !p.isAlive || p.currentHp <= 0;

    // Transient hit flinch has visual priority during the impact reaction (including fatal hit reaction)
    if (hitReactions[p.id]) {
      return 'HURT';
    }

    // 1. Defeated / Dead state (zero HP or dead)
    if (isDead) {
      return 'DEFEATED';
    }

    // 2. Attacking / skill execution
    if (lungingActors[p.id]) {
      return 'ATTACK';
    }

    // 3. Victory:
    // - End-of-battle victory for surviving player units
    if (battleStatus === 'VICTORY' && p.team === 'PLAYER') {
      return 'VICTORY';
    }
    // - Temporary kill celebration for the unit that landed a fatal blow
    if (killCelebrationActors && killCelebrationActors[p.id]) {
      return 'VICTORY';
    }

    // 4. Normal living idle
    return 'IDLE';
  };

  // Calculate directional attack lunge towards the selected target's slot
  const calculateLungeVector = (actorId: string, isPlayer: boolean): { x: number; y: number } => {
    if (!lungingActors[actorId]) return { x: 0, y: 0 };

    // Find actor's slot
    let actorSlot: FormationSlot | null = null;
    if (isPlayer) {
      const idx = playerTeam.findIndex((p) => p.id === actorId);
      actorSlot = playerSlots[idx >= 0 ? idx : 0] || playerSlots[0];
    } else {
      const idx = enemyTeam.findIndex((e) => e.id === actorId);
      actorSlot = enemySlots[idx >= 0 ? idx : 0] || enemySlots[0];
    }

    if (!actorSlot) return { x: isPlayer ? 45 : -45, y: 0 };

    // Find target's slot
    let targetSlot: FormationSlot | null = null;
    if (selectedTargetId) {
      const pIdx = playerTeam.findIndex((p) => p.id === selectedTargetId);
      if (pIdx >= 0) {
        targetSlot = playerSlots[pIdx];
      } else {
        const eIdx = enemyTeam.findIndex((e) => e.id === selectedTargetId);
        if (eIdx >= 0) {
          targetSlot = enemySlots[eIdx];
        }
      }
    }

    // Default target: center of opposing formation
    const targetX = targetSlot ? targetSlot.x : isPlayer ? 70 : 30;
    const targetY = targetSlot ? targetSlot.y : actorSlot.y;

    const dx = targetX - actorSlot.x;
    const dy = targetY - actorSlot.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return { x: isPlayer ? 45 : -45, y: 0 };

    // Move ~45 pixels along the vector
    const speed = 50;
    return {
      x: (dx / dist) * speed,
      y: (dy / dist) * speed,
    };
  };

  return (
    <div className="relative w-full flex-1 min-h-[300px] sm:min-h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between select-none">
      {/* 1. Map Background & Atmospheric Particle FX Layer */}
      <BattleMapBackground mapDef={activeMapDef} />

      {/* 2. Elevated Perspective Combat Stage Platform (Only active unit slots) */}
      <BattlePlatformStage2D
        mapDef={activeMapDef}
        playerSlots={playerSlots.slice(0, playerTeam.length)}
        enemySlots={enemySlots.slice(0, enemyTeam.length)}
      />

      {/* 3. Top Arena Status (Realm Environment & Encounter Size) */}
      <div className="relative z-40 flex items-center justify-between p-2 sm:p-3 pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl bg-slate-950/85 border border-slate-700/80 text-slate-100 text-[10px] sm:text-xs font-bold shadow-lg backdrop-blur-md pointer-events-auto">
            <span className="font-serif tracking-wide truncate max-w-[110px] sm:max-w-none">{activeMapDef.name}</span>
            <span
              className="text-[8px] sm:text-[9px] font-mono uppercase px-1 sm:px-1.5 py-0.5 rounded font-black border"
              style={{
                borderColor: activeMapDef.palette.glowHex,
                color: activeMapDef.palette.glowHex,
                backgroundColor: `${activeMapDef.palette.glowHex}20`,
              }}
            >
              {activeMapDef.element}
            </span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-lg sm:rounded-xl bg-slate-950/70 border border-slate-800 text-[9px] sm:text-[11px] font-mono text-slate-400 backdrop-blur-md pointer-events-auto">
            <span>Squad:</span>
            <span className="font-black text-cyan-400">
              {playerTeam.length}v{enemyTeam.length}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Interactive Combat Arena (Mirrored Formations + Open Center Clash Zone) */}
      <div className="relative z-30 w-full flex-1 overflow-hidden">
        {/* ------------------------------------------------------------- */}
        {/* PLAYER FORMATION (LEFT SIDE - 1 TO 5 BALANCED POSITIONS)      */}
        {/* ------------------------------------------------------------- */}
        {playerTeam.map((participant, idx) => {
          const slot = playerSlots[idx] || playerSlots[0];

          return (
            <div
              key={`player-pos-${participant.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                zIndex: slot.zIndex,
              }}
            >
              <BattleMonster2D
                participant={participant}
                visualState={computeVisualState(participant)}
                isTargeted={selectedTargetId === participant.id}
                isActing={currentActorId === participant.id}
                isExtraTurn={Boolean(
                  latestAction?.actorId === participant.id && latestAction?.isExtraTurn
                )}
                depthScale={slot.scale}
                lungeVector={calculateLungeVector(participant.id, true)}
                onClick={() => {
                  // Clicking player unit highlights tactical stats
                }}
                onOpenAssetManager={(fam, st) => onOpenAssetManager(fam, st)}
              />
            </div>
          );
        })}

        {/* ------------------------------------------------------------- */}
        {/* ENEMY FORMATION (RIGHT SIDE - 1 TO 5 BALANCED POSITIONS)      */}
        {/* ------------------------------------------------------------- */}
        {enemyTeam.map((participant, idx) => {
          const slot = enemySlots[idx] || enemySlots[0];

          return (
            <div
              key={`enemy-pos-${participant.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                zIndex: slot.zIndex,
              }}
            >
              <BattleMonster2D
                participant={participant}
                visualState={computeVisualState(participant)}
                isTargeted={selectedTargetId === participant.id}
                isActing={currentActorId === participant.id}
                isExtraTurn={Boolean(
                  latestAction?.actorId === participant.id && latestAction?.isExtraTurn
                )}
                depthScale={slot.scale}
                lungeVector={calculateLungeVector(participant.id, false)}
                onClick={() => {
                  if (participant.isAlive && participant.currentHp > 0) {
                    onSelectTarget(participant.id);
                  }
                }}
                onOpenAssetManager={(fam, st) => onOpenAssetManager(fam, st)}
              />
            </div>
          );
        })}

        {/* Elemental Projectiles, Trajectories, Particle Trails & Impact Bursts Layer */}
        <ElementalProjectiles
          playerTeam={playerTeam}
          enemyTeam={enemyTeam}
          playerSlots={playerSlots}
          enemySlots={enemySlots}
          latestAction={latestAction}
          battleSpeed={battleSpeed}
          onImpact={onImpact}
          battleStatus={battleStatus}
        />

        {/* Floating Combat Damage Numbers Layer (Normal, Crit, Weakness, Resistant) */}
        {floatingNumbers && floatingNumbers.length > 0 && (
          <DamageNumberOverlay numbers={floatingNumbers} />
        )}
      </div>
    </div>
  );
};
