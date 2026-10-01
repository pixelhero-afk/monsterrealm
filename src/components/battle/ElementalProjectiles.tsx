/**
 * Elemental Projectiles & Combat Impact System
 * Features high-octane 2D projectile flights, elemental impact bursts,
 * directional projectile trajectory alignment, particle trails,
 * and panoramic AoE elemental atmospheric surges.
 */

import React, { useState, useEffect, useRef } from 'react';
import { BattleParticipant, ElementType, ExecutedActionRecord } from '../../types';
import { FormationSlot } from '../battle2d/formationSlots';
import { musicEngine } from '../../services/audio/musicEngine';

export interface ElementalProjectilesProps {
  playerTeam: BattleParticipant[];
  enemyTeam: BattleParticipant[];
  playerSlots: FormationSlot[];
  enemySlots: FormationSlot[];
  latestAction: ExecutedActionRecord | null;
  battleSpeed?: number;
  onImpact?: (targetId: string, element: ElementType) => void;
  battleStatus?: 'IN_PROGRESS' | 'VICTORY' | 'DEFEAT';
}

interface ActiveProjectile {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  angleDeg: number;
  element: ElementType;
  skillName: string;
  isCrit: boolean;
  isAoe: boolean;
  isAllyBuff: boolean;
  targetId: string;
  createdAt: number;
  duration: number;
  launched: boolean;
}

interface ActiveImpact {
  id: string;
  x: number;
  y: number;
  element: ElementType;
  isCrit: boolean;
  isAoe: boolean;
  isAllyBuff: boolean;
  createdAt: number;
  duration: number;
}

interface ActiveAoESurge {
  id: string;
  element: ElementType;
  targetSide: 'PLAYER' | 'ENEMY';
  createdAt: number;
  duration: number;
}

export const ElementalProjectiles: React.FC<ElementalProjectilesProps> = ({
  playerTeam,
  enemyTeam,
  playerSlots,
  enemySlots,
  latestAction,
  battleSpeed = 1,
  onImpact,
  battleStatus,
}) => {
  const [projectiles, setProjectiles] = useState<ActiveProjectile[]>([]);
  const [impacts, setImpacts] = useState<ActiveImpact[]>([]);
  const [aoeSurge, setAoeSurge] = useState<ActiveAoESurge | null>(null);

  const prevActionIdRef = useRef<string>('');

  // Keep latest mutable references so incidental state updates do not abort active flight timers
  const playerTeamRef = useRef(playerTeam);
  playerTeamRef.current = playerTeam;
  const enemyTeamRef = useRef(enemyTeam);
  enemyTeamRef.current = enemyTeam;
  const playerSlotsRef = useRef(playerSlots);
  playerSlotsRef.current = playerSlots;
  const enemySlotsRef = useRef(enemySlots);
  enemySlotsRef.current = enemySlots;
  const battleSpeedRef = useRef(battleSpeed);
  battleSpeedRef.current = battleSpeed;
  const onImpactRef = useRef(onImpact);
  onImpactRef.current = onImpact;

  // 1. Immediately wipe any lingering projectiles when battle concludes or resets
  useEffect(() => {
    if (battleStatus === 'VICTORY' || battleStatus === 'DEFEAT') {
      setProjectiles([]);
      setImpacts([]);
      setAoeSurge(null);
    }
  }, [battleStatus]);

  // 2. Automated background purger: guarantees no projectile or impact can EVER stay stuck on screen
  useEffect(() => {
    const sweepInterval = setInterval(() => {
      const now = Date.now();
      setProjectiles((prev) => {
        if (prev.length === 0) return prev;
        const valid = prev.filter((p) => now - p.createdAt < p.duration + 50);
        return valid.length === prev.length ? prev : valid;
      });
      setImpacts((prev) => {
        if (prev.length === 0) return prev;
        const valid = prev.filter((imp) => now - imp.createdAt < imp.duration + 50);
        return valid.length === prev.length ? prev : valid;
      });
      setAoeSurge((prev) => {
        if (!prev) return null;
        return now - prev.createdAt < prev.duration ? prev : null;
      });
    }, 35);

    return () => clearInterval(sweepInterval);
  }, []);

  // 3. Spawn projectile only when a new action ID is executed
  useEffect(() => {
    if (!latestAction || latestAction.id === prevActionIdRef.current) return;
    prevActionIdRef.current = latestAction.id;

    const curPlayerTeam = playerTeamRef.current;
    const curEnemyTeam = enemyTeamRef.current;
    const curPlayerSlots = playerSlotsRef.current;
    const curEnemySlots = enemySlotsRef.current;
    const curBattleSpeed = battleSpeedRef.current || 1;
    const curOnImpact = onImpactRef.current;

    // Locate caster participant and formation slot
    const allCombatants = [...curPlayerTeam, ...curEnemyTeam];
    const caster = allCombatants.find((p) => p.id === latestAction.actorId);
    if (!caster) return;

    const isPlayerCaster = caster.team === 'PLAYER';
    const casterTeam = isPlayerCaster ? curPlayerTeam : curEnemyTeam;
    const casterSlots = isPlayerCaster ? curPlayerSlots : curEnemySlots;
    const casterIdx = casterTeam.findIndex((p) => p.id === caster.id);
    const fromSlot = casterSlots[casterIdx >= 0 ? casterIdx : 0] || {
      x: isPlayerCaster ? 26 : 74,
      y: 50,
    };

    // Determine target IDs
    let targetIds: string[] = [];
    if (latestAction.allTargetIds && latestAction.allTargetIds.length > 0) {
      targetIds = latestAction.allTargetIds;
    } else if (latestAction.targetId) {
      targetIds = [latestAction.targetId];
    } else {
      const opposingTeam = isPlayerCaster ? curEnemyTeam : curPlayerTeam;
      const firstLiving = opposingTeam.find((p) => p.isAlive);
      if (firstLiving) targetIds = [firstLiving.id];
    }

    if (targetIds.length === 0) return;

    const isAoe = Boolean(
      latestAction.isAoe ||
      (latestAction.allTargetIds && latestAction.allTargetIds.length > 1)
    );
    const element = latestAction.element || caster.element || 'FIRE';
    const isCrit = Boolean(latestAction.isCrit);
    const isAllyBuff = Boolean(latestAction.isAllyBuff);

    const baseDuration = isAllyBuff ? 380 : 340;
    const duration = Math.max(160, Math.round(baseDuration / curBattleSpeed));
    const now = Date.now();

    // Trigger AoE atmospheric surge
    if (isAoe && !isAllyBuff) {
      const surgeDuration = Math.max(400, Math.round(700 / curBattleSpeed));
      setAoeSurge({
        id: `surge_${now}`,
        element,
        targetSide: isPlayerCaster ? 'ENEMY' : 'PLAYER',
        createdAt: now,
        duration: surgeDuration,
      });
    }

    // Create projectile records
    const newProjectiles: ActiveProjectile[] = targetIds.map((tId, idx) => {
      let targetSlot: { x: number; y: number } | null = null;

      const pIdx = curPlayerTeam.findIndex((p) => p.id === tId);
      if (pIdx >= 0) {
        targetSlot = curPlayerSlots[pIdx] || curPlayerSlots[0];
      } else {
        const eIdx = curEnemyTeam.findIndex((e) => e.id === tId);
        if (eIdx >= 0) {
          targetSlot = curEnemySlots[eIdx] || curEnemySlots[0];
        }
      }

      if (!targetSlot) {
        targetSlot = isPlayerCaster
          ? { x: 74, y: 50 }
          : { x: 26, y: 50 };
      }

      const dx = targetSlot.x - fromSlot.x;
      const dy = targetSlot.y - fromSlot.y;
      const angleRad = Math.atan2(dy, dx);
      const angleDeg = angleRad * (180 / Math.PI);

      return {
        id: `proj_${latestAction.id}_${tId}_${idx}`,
        startX: fromSlot.x,
        startY: fromSlot.y,
        targetX: targetSlot.x,
        targetY: targetSlot.y,
        angleDeg,
        element,
        skillName: latestAction.skillName,
        isCrit,
        isAoe,
        isAllyBuff,
        targetId: tId,
        createdAt: now,
        duration,
        launched: false,
      };
    });

    setProjectiles((prev) => [...prev, ...newProjectiles]);

    // Animate launch trajectory on next frame
    requestAnimationFrame(() => {
      setProjectiles((prev) =>
        prev.map((p) => {
          if (newProjectiles.some((np) => np.id === p.id)) {
            return { ...p, launched: true };
          }
          return p;
        })
      );
    });

    // Schedule arrival detonation and impact removal
    const impactDuration = Math.max(280, Math.round(450 / curBattleSpeed));

    setTimeout(() => {
      // 1. Play procedural elemental audio sound
      try {
        musicEngine.playElementalImpactSfx(element, isCrit, isAoe);
      } catch {}

      // 2. Remove the finished projectiles
      setProjectiles((prev) =>
        prev.filter((p) => !newProjectiles.some((np) => np.id === p.id))
      );

      // 3. Create explosive impact bursts at each target slot
      const impactTime = Date.now();
      const newImpacts: ActiveImpact[] = newProjectiles.map((p) => ({
        id: `impact_${p.id}`,
        x: p.targetX,
        y: p.targetY,
        element: p.element,
        isCrit: p.isCrit,
        isAoe: p.isAoe,
        isAllyBuff: p.isAllyBuff,
        createdAt: impactTime,
        duration: impactDuration,
      }));

      setImpacts((prev) => [...prev, ...newImpacts]);

      // 4. Notify parent onImpact
      if (curOnImpact) {
        newProjectiles.forEach((p) => {
          curOnImpact(p.targetId, p.element);
        });
      }

      // 5. Clear impacts after their burst animation completes
      setTimeout(() => {
        setImpacts((prev) =>
          prev.filter((imp) => !newImpacts.some((ni) => ni.id === imp.id))
        );
      }, impactDuration);
    }, duration);
  }, [latestAction?.id]);

  return (
    <div className="absolute inset-0 pointer-events-none z-35 overflow-hidden">
      {/* 1. PANORAMIC AOE ATMOSPHERIC SURGE LAYER */}
      {aoeSurge && Date.now() - aoeSurge.createdAt <= aoeSurge.duration && (
        <AoESurgeRenderer surge={aoeSurge} />
      )}

      {/* 2. FLYING ELEMENTAL PROJECTILES LAYER (Strictly filtered so finished attacks never linger) */}
      {projectiles
        .filter((proj) => Date.now() - proj.createdAt <= proj.duration + 20)
        .map((proj) => {
          const curX = proj.launched ? proj.targetX : proj.startX;
          const curY = proj.launched ? proj.targetY : proj.startY;

          return (
            <div
              key={proj.id}
              className="absolute pointer-events-none will-change-transform z-30"
              style={{
                left: `${curX}%`,
                top: `${curY}%`,
                transform: `translate(-50%, -50%) rotate(${proj.angleDeg}deg)`,
                transition: `left ${proj.duration}ms cubic-bezier(0.2, 0.8, 0.4, 1), top ${proj.duration}ms cubic-bezier(0.2, 0.8, 0.4, 1)`,
              }}
            >
              <ElementalProjectileGraphics
                element={proj.element}
                isCrit={proj.isCrit}
                isAllyBuff={proj.isAllyBuff}
              />
            </div>
          );
        })}

      {/* 3. ELEMENTAL IMPACT BURSTS LAYER (Strictly filtered to burst duration) */}
      {impacts
        .filter((impact) => Date.now() - impact.createdAt <= impact.duration + 20)
        .map((impact) => (
          <div
            key={impact.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40"
            style={{
              left: `${impact.x}%`,
              top: `${impact.y}%`,
            }}
          >
            <ElementalImpactGraphics
              element={impact.element}
              isCrit={impact.isCrit}
              isAllyBuff={impact.isAllyBuff}
            />
          </div>
        ))}
    </div>
  );
};

// ============================================================================
// ELEMENTAL PROJECTILE GRAPHICS
// High-fidelity animated cores, particle tails, and element-tailored visuals
// ============================================================================

interface ProjectileGraphicsProps {
  element: ElementType;
  isCrit: boolean;
  isAllyBuff: boolean;
}

const ElementalProjectileGraphics: React.FC<ProjectileGraphicsProps> = ({
  element,
  isCrit,
  isAllyBuff,
}) => {
  // Buff / Heal Projectile: Soothing golden-green orbs of rejuvenating mana
  if (isAllyBuff) {
    return (
      <div className="relative flex items-center justify-center">
        {/* Trailing Mote Stream */}
        <div className="absolute right-3 w-16 h-4 bg-gradient-to-l from-emerald-400/80 via-teal-300/40 to-transparent blur-[2px] rounded-full" />
        {/* Core Vitality Orb */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-300 via-teal-200 to-white shadow-[0_0_16px_rgba(52,211,153,1)] flex items-center justify-center animate-pulse">
          <div className="w-3.5 h-3.5 rounded-full bg-white blur-[1px]" />
        </div>
        {/* Sparkling Ring */}
        <div className="absolute w-12 h-12 rounded-full border border-emerald-300/70 animate-ping opacity-60" />
      </div>
    );
  }

  switch (element) {
    case 'FIRE':
      return (
        <div className="relative flex items-center justify-center">
          {/* Scorching Plasma Trail */}
          <div className="absolute right-2 w-24 h-6 bg-gradient-to-l from-amber-400 via-rose-600 to-transparent blur-[3px] rounded-full opacity-90" />
          <div className="absolute right-4 w-14 h-3 bg-gradient-to-l from-yellow-200 via-amber-500 to-transparent blur-[1px] rounded-full" />
          
          {/* Flame Embers Particles behind */}
          <div className="absolute -right-6 top-1 w-2.5 h-2.5 rounded-full bg-yellow-300 blur-[1px] animate-ping" />
          <div className="absolute -right-10 -bottom-1 w-2 h-2 rounded-full bg-rose-400 blur-[1px] animate-pulse" />

          {/* Comet Core */}
          <div
            className={`relative rounded-full bg-gradient-to-r from-yellow-100 via-amber-400 to-rose-600 flex items-center justify-center shadow-[0_0_24px_rgba(245,158,11,1)] ${
              isCrit ? 'w-12 h-12' : 'w-9 h-9'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white blur-[1px]" />
          </div>

          {/* Fiery Corona Aura */}
          <div className="absolute w-14 h-14 rounded-full border-2 border-amber-400/60 animate-spin" />
        </div>
      );

    case 'WATER':
      return (
        <div className="relative flex items-center justify-center">
          {/* Streaming Hydro Jet Trail */}
          <div className="absolute right-2 w-24 h-6 bg-gradient-to-l from-cyan-300 via-blue-600 to-transparent blur-[2px] rounded-full opacity-85" />
          <div className="absolute right-4 w-12 h-2.5 bg-gradient-to-l from-white via-sky-300 to-transparent blur-[1px] rounded-full" />
          
          {/* Water Droplet Wake */}
          <div className="absolute -right-6 -top-1 w-2.5 h-2.5 rounded-full bg-sky-300 blur-[0.5px] opacity-80" />
          <div className="absolute -right-9 top-2 w-2 h-2 rounded-full bg-cyan-200 blur-[0.5px] opacity-75" />

          {/* Hydro Sphere Core */}
          <div
            className={`relative rounded-full bg-gradient-to-r from-sky-100 via-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_22px_rgba(6,182,212,1)] ${
              isCrit ? 'w-11 h-11' : 'w-8 h-8'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white/90 blur-[0.5px]" />
          </div>

          {/* Tidal Vortex Ring */}
          <div className="absolute w-13 h-13 rounded-full border-2 border-cyan-300/60 animate-spin-reverse-slow" />
        </div>
      );

    case 'GRASS':
      return (
        <div className="relative flex items-center justify-center">
          {/* Sylvan Gale Trail */}
          <div className="absolute right-2 w-22 h-5 bg-gradient-to-l from-emerald-400 via-lime-500 to-transparent blur-[2px] rounded-full opacity-80" />
          
          {/* Razor Leaf Shuriken (Spinning 4-blade star) */}
          <div
            className={`relative flex items-center justify-center animate-spin ${
              isCrit ? 'w-12 h-12' : 'w-9 h-9'
            }`}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_12px_rgba(34,197,94,0.9)]">
              {/* 4 Razor Leaf Petals */}
              <path
                d="M50 8 C55 35 65 45 92 50 C65 55 55 65 50 92 C45 65 35 55 8 50 C35 45 45 35 50 8 Z"
                fill="url(#grassGrad)"
                stroke="#86efac"
                strokeWidth="3"
              />
              <circle cx="50" cy="50" r="8" fill="#dcfce7" />
              <defs>
                <linearGradient id="grassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#86efac" />
                  <stop offset="50%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#15803d" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Sylvan Spore Sparks */}
          <div className="absolute -right-5 top-0 w-2 h-2 rounded-full bg-lime-300 animate-ping" />
        </div>
      );

    case 'LIGHT':
      return (
        <div className="relative flex items-center justify-center">
          {/* Prismatic Starlight Beam Trail */}
          <div className="absolute right-3 w-32 h-5 bg-gradient-to-l from-yellow-200 via-amber-400 to-transparent blur-[2px] rounded-full" />
          <div className="absolute right-5 w-20 h-2 bg-gradient-to-l from-white to-transparent blur-[0.5px] rounded-full" />
          
          {/* Solar Spear Core (Diamond Gleam) */}
          <div
            className={`relative flex items-center justify-center ${
              isCrit ? 'w-12 h-12' : 'w-9 h-9'
            }`}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(251,191,36,1)]">
              {/* 8-Pointed Celestial Star */}
              <polygon
                points="50,5 60,38 95,50 60,62 50,95 40,62 5,50 40,38"
                fill="#ffffff"
                stroke="#fde047"
                strokeWidth="4"
              />
              <circle cx="50" cy="50" r="12" fill="#fbbf24" />
            </svg>
          </div>

          {/* Sparkling Starlight Halo */}
          <div className="absolute w-14 h-14 rounded-full border border-yellow-200/80 animate-ping opacity-75" />
        </div>
      );

    case 'DARK':
    default:
      return (
        <div className="relative flex items-center justify-center">
          {/* Nether Void Stream Trail */}
          <div className="absolute right-2 w-24 h-6 bg-gradient-to-l from-purple-500 via-violet-900 to-transparent blur-[3px] rounded-full opacity-90" />
          
          {/* Shadow Tendrils behind */}
          <div className="absolute -right-6 top-1 w-3 h-3 rounded-full bg-fuchsia-500 blur-[1px] animate-pulse" />
          <div className="absolute -right-9 -bottom-1 w-2 h-2 rounded-full bg-violet-700 blur-[0.5px]" />

          {/* Abyssal Void Singularity */}
          <div
            className={`relative rounded-full bg-gradient-to-r from-violet-950 via-purple-700 to-fuchsia-600 flex items-center justify-center shadow-[0_0_22px_rgba(168,85,247,1)] ${
              isCrit ? 'w-11 h-11' : 'w-8 h-8'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-violet-300" />
          </div>

          {/* Dark Chaos Ring */}
          <div className="absolute w-13 h-13 rounded-full border-2 border-purple-400/50 animate-spin-slow" />
        </div>
      );
  }
};

// ============================================================================
// ELEMENTAL IMPACT GRAPHICS
// Explosive bursts, elemental shockwave rings, and element-specific fx
// ============================================================================

interface ImpactGraphicsProps {
  element: ElementType;
  isCrit: boolean;
  isAllyBuff: boolean;
}

const ElementalImpactGraphics: React.FC<ImpactGraphicsProps> = ({
  element,
  isCrit,
  isAllyBuff,
}) => {
  if (isAllyBuff) {
    return (
      <div className="relative flex items-center justify-center">
        {/* Ascending Healing Aura */}
        <div className="w-20 h-20 rounded-full border-2 border-emerald-400/80 bg-emerald-400/20 blur-[1px] animate-ping" />
        <div className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-300 to-teal-100 shadow-[0_0_25px_rgba(52,211,153,1)] flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-emerald-800 fill-emerald-800">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </div>
      </div>
    );
  }

  switch (element) {
    case 'FIRE':
      return (
        <div className="relative flex items-center justify-center">
          {/* Shockwave Blast Ring */}
          <div
            className={`rounded-full border-4 border-amber-400 bg-amber-500/25 blur-[1px] animate-ping ${
              isCrit ? 'w-28 h-28' : 'w-20 h-20'
            }`}
          />
          {/* Fiery Core Detonation */}
          <div className="absolute w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 via-amber-500 to-yellow-200 blur-sm shadow-[0_0_35px_rgba(245,158,11,1)]" />
          
          {/* 6 Radiant Fire Sparks radiating outwards */}
          <svg viewBox="0 0 100 100" className="absolute w-24 h-24 animate-spin-slow">
            <line x1="50" y1="10" x2="50" y2="25" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
            <line x1="50" y1="90" x2="50" y2="75" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
            <line x1="10" y1="50" x2="25" y2="50" stroke="#f87171" strokeWidth="4" strokeLinecap="round" />
            <line x1="90" y1="50" x2="75" y2="50" stroke="#f87171" strokeWidth="4" strokeLinecap="round" />
            <line x1="22" y1="22" x2="33" y2="33" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
            <line x1="78" y1="78" x2="67" y2="67" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'WATER':
      return (
        <div className="relative flex items-center justify-center">
          {/* Tidal Ripple Shockwave */}
          <div
            className={`rounded-full border-4 border-cyan-400 bg-cyan-500/20 blur-[1px] animate-ping ${
              isCrit ? 'w-28 h-28' : 'w-20 h-20'
            }`}
          />
          {/* Hydro Splash Center */}
          <div className="absolute w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-400 to-sky-100 blur-sm shadow-[0_0_35px_rgba(6,182,212,1)]" />
          
          {/* Cresting Water Droplets Spray */}
          <svg viewBox="0 0 100 100" className="absolute w-24 h-24 animate-pulse">
            <circle cx="50" cy="20" r="5" fill="#38bdf8" />
            <circle cx="80" cy="40" r="4" fill="#67e8f9" />
            <circle cx="70" cy="80" r="5" fill="#38bdf8" />
            <circle cx="20" cy="70" r="4" fill="#67e8f9" />
            <circle cx="25" cy="30" r="5" fill="#bae6fd" />
          </svg>
        </div>
      );

    case 'GRASS':
      return (
        <div className="relative flex items-center justify-center">
          {/* Sylvan Thorn Nova Ring */}
          <div
            className={`rounded-full border-4 border-emerald-400 bg-emerald-500/20 blur-[1px] animate-ping ${
              isCrit ? 'w-28 h-28' : 'w-20 h-20'
            }`}
          />
          {/* Emerald Floral Core */}
          <div className="absolute w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-400 to-lime-200 blur-sm shadow-[0_0_35px_rgba(34,197,94,1)]" />
          
          {/* Sylvan Slash Cross */}
          <svg viewBox="0 0 100 100" className="absolute w-22 h-22">
            <line x1="20" y1="20" x2="80" y2="80" stroke="#86efac" strokeWidth="5" strokeLinecap="round" />
            <line x1="80" y1="20" x2="20" y2="80" stroke="#86efac" strokeWidth="5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="10" fill="#22c55e" />
          </svg>
        </div>
      );

    case 'LIGHT':
      return (
        <div className="relative flex items-center justify-center">
          {/* Celestial Pillar of Judgment Flash */}
          <div
            className={`rounded-full border-4 border-yellow-300 bg-amber-400/30 blur-[1px] animate-ping ${
              isCrit ? 'w-32 h-32' : 'w-24 h-24'
            }`}
          />
          <div className="absolute w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-200 to-white blur-sm shadow-[0_0_40px_rgba(251,191,36,1)]" />
          
          {/* Divine Cross Star */}
          <svg viewBox="0 0 100 100" className="absolute w-28 h-28 animate-spin-slow">
            <polygon
              points="50,5 62,38 95,50 62,62 50,95 38,62 5,50 38,38"
              fill="#ffffff"
              stroke="#fbbf24"
              strokeWidth="3"
            />
          </svg>
        </div>
      );

    case 'DARK':
    default:
      return (
        <div className="relative flex items-center justify-center">
          {/* Nether Rift Implosion Ring */}
          <div
            className={`rounded-full border-4 border-purple-500 bg-purple-900/40 blur-[1px] animate-ping ${
              isCrit ? 'w-30 h-30' : 'w-22 h-22'
            }`}
          />
          <div className="absolute w-16 h-16 rounded-full bg-gradient-to-tr from-purple-950 via-violet-800 to-fuchsia-500 blur-sm shadow-[0_0_35px_rgba(168,85,247,1)]" />
          
          {/* Nether Claw Slices */}
          <svg viewBox="0 0 100 100" className="absolute w-24 h-24">
            <line x1="20" y1="25" x2="80" y2="75" stroke="#c084fc" strokeWidth="4" strokeLinecap="round" />
            <line x1="30" y1="15" x2="85" y2="65" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
            <line x1="15" y1="35" x2="70" y2="85" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      );
  }
};

// ============================================================================
// PANORAMIC AOE ELEMENTAL SURGE
// Sweeps across the entire defending formation for full-team attacks
// ============================================================================

interface AoESurgeProps {
  surge: ActiveAoESurge;
}

const AoESurgeRenderer: React.FC<AoESurgeProps> = ({ surge }) => {
  const isEnemyDefending = surge.targetSide === 'ENEMY';
  const targetSideClass = isEnemyDefending
    ? 'left-1/2 right-0'
    : 'left-0 right-1/2';

  return (
    <div
      className={`absolute top-0 bottom-0 ${targetSideClass} pointer-events-none z-25 overflow-hidden flex items-center justify-center animate-pulse`}
    >
      {surge.element === 'FIRE' && (
        <div className="w-full h-full relative flex items-center justify-center">
          {/* Volcanic Deluge Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-600/30 to-amber-500/40 animate-pulse" />
          {/* Falling Flame Meteors */}
          <div className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-amber-400 blur-md animate-ping" />
          <div className="absolute top-2/3 right-1/4 w-20 h-20 rounded-full bg-rose-500 blur-lg animate-ping" />
        </div>
      )}

      {surge.element === 'WATER' && (
        <div className="w-full h-full relative flex items-center justify-center">
          {/* Tidal Surge Wall */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/30 to-blue-600/40 animate-pulse" />
          <div className="absolute top-1/3 left-1/3 w-24 h-24 rounded-full bg-cyan-300 blur-lg animate-ping" />
        </div>
      )}

      {surge.element === 'GRASS' && (
        <div className="w-full h-full relative flex items-center justify-center">
          {/* Sylvan Razor Tempest */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-600/30 to-lime-500/30 animate-pulse" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-emerald-400 blur-lg animate-ping" />
        </div>
      )}

      {surge.element === 'LIGHT' && (
        <div className="w-full h-full relative flex items-center justify-center">
          {/* Celestial Pillar Shower */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/35 to-amber-400/40 animate-pulse" />
          <div className="absolute top-10 bottom-10 left-1/3 w-16 bg-white/40 blur-md animate-ping" />
        </div>
      )}

      {surge.element === 'DARK' && (
        <div className="w-full h-full relative flex items-center justify-center">
          {/* Nether Abyss Singularity */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-950/60 to-violet-900/50 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-purple-600/30 blur-xl animate-ping" />
        </div>
      )}
    </div>
  );
};
