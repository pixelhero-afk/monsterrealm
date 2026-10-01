/**
 * Elemental Spell VFX & Cinematic Impact Animator
 * Provides high-impact, commercial RPG spell visuals:
 * Fireballs, Tidal Surges, Razor Leaf Gales, Celestial Light Beams, and Void Slashes.
 */

import React from 'react';
import { ElementType } from '../../types';

interface ElementalSpellVFXProps {
  activeSpell: {
    casterId: string;
    targetId?: string | null;
    element: ElementType;
    skillName: string;
    isAoe?: boolean;
  } | null;
}

export const ElementalSpellVFX: React.FC<ElementalSpellVFXProps> = ({ activeSpell }) => {
  if (!activeSpell) return null;

  const { element, isAoe } = activeSpell;

  return (
    <div className="absolute inset-0 pointer-events-none z-35 overflow-hidden flex items-center justify-center">
      {/* 1. Dramatic Theater Vignette */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] animate-pulse pointer-events-none" />

      {/* 2. Element Specific Spell Graphics */}
      {element === 'FIRE' && (
        <div className="relative flex items-center justify-center">
          {/* Blazing Magma Comet */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-amber-600 via-rose-600 to-yellow-300 blur-md animate-ping opacity-75" />
          <div className="absolute w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-amber-300 shadow-[0_0_50px_rgba(245,158,11,1)] flex items-center justify-center animate-spin">
            <div className="w-12 h-12 rounded-full bg-amber-400 blur-sm" />
          </div>
          {/* Fire Spark Ring */}
          <svg viewBox="0 0 100 100" className="absolute w-44 h-44 animate-spin-slow">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="8 6" />
            <circle cx="50" cy="10" r="4" fill="#fbbf24" />
            <circle cx="90" cy="50" r="4" fill="#fbbf24" />
            <circle cx="50" cy="90" r="4" fill="#fbbf24" />
            <circle cx="10" cy="50" r="4" fill="#fbbf24" />
          </svg>
        </div>
      )}

      {element === 'WATER' && (
        <div className="relative flex items-center justify-center">
          {/* Abyssal Tidal Vortex */}
          <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-cyan-600 via-blue-600 to-sky-300 blur-md animate-ping opacity-75" />
          <div className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-cyan-300 shadow-[0_0_50px_rgba(6,182,212,1)] animate-spin-reverse-slow" />
          {/* Ocean Waves Rings */}
          <svg viewBox="0 0 100 100" className="absolute w-48 h-48 animate-spin-slow">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="12 8" />
            <circle cx="50" cy="50" r="28" fill="none" stroke="#67e8f9" strokeWidth="2" strokeDasharray="6 4" />
          </svg>
        </div>
      )}

      {element === 'GRASS' && (
        <div className="relative flex items-center justify-center">
          {/* Sylvan Thorn Whirlwind */}
          <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-lime-300 blur-md animate-ping opacity-75" />
          <div className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,1)] flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-300 blur-sm" />
          </div>
          {/* Floral Petal Ring */}
          <svg viewBox="0 0 100 100" className="absolute w-48 h-48 animate-spin">
            <polygon points="50,15 58,42 85,50 58,58 50,85 42,58 15,50 42,42" fill="#86efac" opacity="0.8" />
          </svg>
        </div>
      )}

      {element === 'LIGHT' && (
        <div className="relative flex items-center justify-center">
          {/* Celestial Pillar of Judgment */}
          <div className="absolute -top-64 bottom-0 w-16 sm:w-24 bg-gradient-to-b from-white via-yellow-200 to-amber-500 blur-md shadow-[0_0_60px_rgba(251,191,36,1)] animate-pulse" />
          <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-amber-400/40 blur-xl animate-ping" />
          {/* Prismatic Diamond Star */}
          <svg viewBox="0 0 100 100" className="absolute w-44 h-44 animate-spin-slow">
            <polygon points="50,10 62,38 90,50 62,62 50,90 38,62 10,50 38,38" fill="#ffffff" />
            <circle cx="50" cy="50" r="16" fill="#fbbf24" opacity="0.8" />
          </svg>
        </div>
      )}

      {element === 'DARK' && (
        <div className="relative flex items-center justify-center">
          {/* Nether Void Rift */}
          <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-purple-900 via-violet-950 to-rose-900 blur-lg animate-ping opacity-90" />
          <div className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-purple-500 shadow-[0_0_55px_rgba(168,85,247,1)] animate-spin-slow flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-purple-950 border border-violet-400" />
          </div>
          {/* Dimensional Slash Claws */}
          <svg viewBox="0 0 100 100" className="absolute w-48 h-48 animate-pulse">
            <line x1="20" y1="20" x2="80" y2="80" stroke="#c084fc" strokeWidth="4" strokeLinecap="round" />
            <line x1="30" y1="15" x2="85" y2="70" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="15" y1="30" x2="70" y2="85" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
};
