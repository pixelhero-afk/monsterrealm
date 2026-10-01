/**
 * Cinematic Skill VFX & Combat Announcement Overlay
 * Displays dynamic elemental visual effects, impact flashes,
 * active skill banners, and high-visibility EXTRA TURN announcements.
 */

import React from 'react';
import { ElementType } from '../../types';
import { Sparkles, Zap, Flame, Waves, Flower2, Sun, Moon } from 'lucide-react';

interface SkillVFXProps {
  activeSkillBanner: {
    skillName: string;
    casterName: string;
    element: ElementType;
    isExtraTurn?: boolean;
  } | null;
  extraTurnAnnouncement: string | null;
  impactFlash: boolean;
}

export const SkillVFX: React.FC<SkillVFXProps> = ({
  activeSkillBanner,
  extraTurnAnnouncement,
  impactFlash,
}) => {
  const getElementIcon = (element: ElementType) => {
    switch (element) {
      case 'FIRE':
        return <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />;
      case 'WATER':
        return <Waves className="w-5 h-5 text-cyan-400 fill-cyan-400" />;
      case 'GRASS':
        return <Flower2 className="w-5 h-5 text-emerald-400 fill-emerald-400" />;
      case 'LIGHT':
        return <Sun className="w-5 h-5 text-yellow-300 fill-yellow-300" />;
      case 'DARK':
      default:
        return <Moon className="w-5 h-5 text-purple-400 fill-purple-400" />;
    }
  };

  const getElementColor = (element: ElementType) => {
    switch (element) {
      case 'FIRE':
        return 'from-amber-600 via-rose-600 to-amber-700 border-amber-400';
      case 'WATER':
        return 'from-cyan-600 via-blue-600 to-cyan-700 border-cyan-400';
      case 'GRASS':
        return 'from-emerald-600 via-teal-600 to-emerald-700 border-emerald-400';
      case 'LIGHT':
        return 'from-amber-500 via-yellow-400 to-amber-600 border-yellow-300';
      case 'DARK':
      default:
        return 'from-violet-700 via-purple-800 to-slate-900 border-violet-400';
    }
  };

  return (
    <>
      {/* 1. Subtle Screen Edge Accent (Soft non-strobe accent) */}
      {impactFlash && (
        <div className="absolute inset-0 pointer-events-none z-40 ring-2 ring-inset ring-amber-400/20 transition-opacity duration-150" />
      )}

      {/* 2. Extra Turn High-Visibility Announcement Banner */}
      {extraTurnAnnouncement && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none text-center animate-bounce">
          <div className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-base sm:text-xl tracking-widest uppercase shadow-[0_0_35px_rgba(245,158,11,0.9)] border-2 border-white ring-4 ring-amber-500/50 flex items-center gap-2">
            <Zap className="w-6 h-6 fill-slate-950 text-slate-950" />
            <span>{extraTurnAnnouncement}</span>
            <Zap className="w-6 h-6 fill-slate-950 text-slate-950" />
          </div>
        </div>
      )}

      {/* 3. Skill Casting Banner */}
      {activeSkillBanner && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-all transform duration-300">
          <div
            className={`px-5 py-2 rounded-2xl bg-gradient-to-r ${getElementColor(
              activeSkillBanner.element
            )} border text-white shadow-2xl backdrop-blur-md flex items-center gap-3 ring-2 ring-white/30`}
          >
            {getElementIcon(activeSkillBanner.element)}
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-slate-200 tracking-wider">
                {activeSkillBanner.casterName}
              </div>
              <div className="text-sm font-black tracking-wide drop-shadow-md">
                {activeSkillBanner.skillName}
              </div>
            </div>
            {activeSkillBanner.isExtraTurn && (
              <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase ml-1 animate-pulse">
                +EXTRA TURN
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
};
