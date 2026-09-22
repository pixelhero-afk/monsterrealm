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
import { MapManagerModal } from './MapManagerModal';
import { getMapForStage, BATTLE_MAPS, MapDefinition } from '../../data/maps';
import { MonsterCombatVisualState } from '../../services/character2d/types';
import { Palette, MapPin, Shield } from 'lucide-react';
import { getFormationSlots, FormationSlot, PLAYER_FORMATION_SLOTS, ENEMY_FORMATION_SLOTS } from './formationSlots';
import { monster2DRegistry } from '../../services/character2d/monster2DRegistry';
import { DamageNumberOverlay, FloatingNumber } from '../battle/DamageNumberOverlay';

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
}) => {
  // Active map definition synchronized with current campaign stage and continent
  const initialMap = getMapForStage(currentStageElement, undefined, currentStage?.continentId);
  const [activeMapId, setActiveMapId] = useState<string>(initialMap.id);
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);

  // Synchronize battlefield arena whenever the player selects a different campaign stage
  useEffect(() => {
    const nextMap = getMapForStage(currentStageElement, undefined, currentStage?.continentId);
    setActiveMapId(nextMap.id);
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
    <div className="relative w-full h-[540px] sm:h-[600px] lg:h-[660px] rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 flex flex-col justify-between select-none">
      {/* 1. Map Background & Atmospheric Particle FX Layer */}
      <BattleMapBackground mapDef={activeMapDef} />

      {/* 2. Elevated Perspective Combat Stage Platform (Only active unit slots) */}
      <BattlePlatformStage2D
        mapDef={activeMapDef}
        playerSlots={playerSlots.slice(0, playerTeam.length)}
        enemySlots={enemySlots.slice(0, enemyTeam.length)}
      />

      {/* 3. Top Arena Utility Bar (Map Environment Controls) */}
      <div className="relative z-40 flex items-center justify-between p-3 sm:p-4 pointer-events-auto">
        {/* Map Information Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMapModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700/80 shadow-md backdrop-blur-md cursor-pointer transition-all hover:border-amber-400/60"
            title="Switch battlefield map environment or upload custom background"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-serif">{activeMapDef.name}</span>
            <span
              className="text-[9px] font-mono uppercase px-1 rounded border"
              style={{
                borderColor: activeMapDef.palette.glowHex,
                color: activeMapDef.palette.glowHex,
              }}
            >
              {activeMapDef.element}
            </span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-400 backdrop-blur-md">
            <span>Encounter:</span>
            <span className="font-black text-cyan-400">
              {playerTeam.length}v{enemyTeam.length} ({playerTeam.length === 1 ? 'Solo' : `${playerTeam.length} Units`})
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

        {/* Floating Combat Damage Numbers Layer (Normal, Crit, Weakness, Resistant) */}
        {floatingNumbers && floatingNumbers.length > 0 && (
          <DamageNumberOverlay numbers={floatingNumbers} />
        )}
      </div>

      {/* 5. Battlefield Stage Lighting Ambient Overlay */}
      <div className="absolute inset-0 pointer-events-none z-35 mix-blend-overlay opacity-30 bg-gradient-to-t from-slate-950 via-transparent to-slate-900" />

      {/* 6. Map Switching & Background Customization Modal */}
      <MapManagerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        activeMapId={activeMapId}
        onSelectMap={(id) => setActiveMapId(id)}
      />
    </div>
  );
};
