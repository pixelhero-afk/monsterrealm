/**
 * Cinematic 5v5 Battlefield Environment
 * Renders stage-specific layered fantasy landscapes (Volcanic Caldera, Sylvan Glade,
 * Abyssal Reef, Celestial Sky Citadel, Void Abyss) with perspective depth, environmental lighting,
 * atmospheric motes, and glowing elemental combat pedestals.
 */

import React from 'react';
import { ElementType } from '../../types';

interface BattlefieldEnvironmentProps {
  stageElement: ElementType;
  children: React.ReactNode;
  isShaking?: boolean;
}

export const BattlefieldEnvironment: React.FC<BattlefieldEnvironmentProps> = ({
  stageElement,
  children,
  isShaking = false,
}) => {
  // Biome Themes
  const getBiomeTheme = (element: ElementType) => {
    switch (element) {
      case 'FIRE':
        return {
          skyGradient: 'from-amber-950/80 via-rose-950/60 to-slate-950',
          horizonColor: '#7f1d1d',
          accentLight: 'rgba(239, 68, 68, 0.18)',
          pedestalAllied: '#f97316',
          pedestalEnemy: '#dc2626',
          ambientMoteColor: '#fbbf24',
          groundGradient: 'from-stone-900 via-stone-950 to-black',
          title: 'Volcanic Basalt Caldera',
        };
      case 'WATER':
        return {
          skyGradient: 'from-cyan-950/80 via-blue-950/60 to-slate-950',
          horizonColor: '#0c4a6e',
          accentLight: 'rgba(6, 182, 212, 0.18)',
          pedestalAllied: '#06b6d4',
          pedestalEnemy: '#2563eb',
          ambientMoteColor: '#67e8f9',
          groundGradient: 'from-slate-900 via-slate-950 to-black',
          title: 'Abyssal Sunken Temple',
        };
      case 'GRASS':
        return {
          skyGradient: 'from-emerald-950/80 via-teal-950/60 to-slate-950',
          horizonColor: '#064e3b',
          accentLight: 'rgba(16, 185, 129, 0.18)',
          pedestalAllied: '#10b981',
          pedestalEnemy: '#059669',
          ambientMoteColor: '#86efac',
          groundGradient: 'from-stone-900 via-stone-950 to-black',
          title: 'Ancient Sylvan Ruins',
        };
      case 'LIGHT':
        return {
          skyGradient: 'from-amber-950/60 via-yellow-950/40 to-slate-950',
          horizonColor: '#78350f',
          accentLight: 'rgba(245, 158, 11, 0.22)',
          pedestalAllied: '#f59e0b',
          pedestalEnemy: '#d97706',
          ambientMoteColor: '#fef08a',
          groundGradient: 'from-slate-900 via-slate-950 to-black',
          title: 'Celestial Sky Citadel',
        };
      case 'DARK':
      default:
        return {
          skyGradient: 'from-purple-950/80 via-violet-950/60 to-slate-950',
          horizonColor: '#3b0764',
          accentLight: 'rgba(139, 92, 246, 0.2)',
          pedestalAllied: '#8b5cf6',
          pedestalEnemy: '#6d28d9',
          ambientMoteColor: '#c084fc',
          groundGradient: 'from-slate-900 via-slate-950 to-black',
          title: 'Umbral Void Abyss',
        };
    }
  };

  const biome = getBiomeTheme(stageElement);

  return (
    <div
      className={`relative w-full min-h-[580px] sm:min-h-[640px] flex flex-col justify-between overflow-hidden select-none transition-transform duration-150 ${
        isShaking ? 'translate-x-1.5 -translate-y-1' : ''
      }`}
    >
      {/* 1. LAYER 1: Distant Sky & Atmosphere */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${biome.skyGradient} pointer-events-none transition-colors duration-700`}
      />

      {/* 2. LAYER 2: Distant Horizon Silhouettes / Mountains / Pillars */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <svg
          viewBox="0 0 1000 350"
          className="w-full h-48 sm:h-64 object-cover absolute top-0 left-0"
          preserveAspectRatio="none"
        >
          {/* Distant Spire Mountains */}
          <path
            d="M0 240 L120 140 L220 220 L350 90 L480 230 L620 110 L750 210 L880 130 L1000 240 L1000 350 L0 350 Z"
            fill="#0f172a"
            opacity="0.6"
          />
          {/* Floating Mystic Monoliths */}
          <polygon points="180,60 210,40 220,100 190,120" fill="#1e293b" opacity="0.7" />
          <polygon points="460,40 480,25 490,75 470,90" fill="#1e293b" opacity="0.6" />
          <polygon points="780,50 810,35 820,95 790,110" fill="#1e293b" opacity="0.8" />
          {/* Atmospheric Light Rays */}
          <line x1="500" y1="0" x2="300" y2="350" stroke={biome.ambientMoteColor} strokeWidth="2" opacity="0.15" />
          <line x1="500" y1="0" x2="700" y2="350" stroke={biome.ambientMoteColor} strokeWidth="2" opacity="0.15" />
        </svg>
      </div>

      {/* 3. LAYER 3: Volumetric Atmospheric Light Orbs */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: biome.accentLight }}
      />

      {/* 4. LAYER 4: 2.5D Perspective Ground Plane */}
      <div className="absolute bottom-0 left-0 right-0 h-[68%] pointer-events-none overflow-hidden">
        {/* Ground Plane with Isometric Angle */}
        <div
          className={`w-full h-full bg-gradient-to-t ${biome.groundGradient} border-t border-slate-800/80 shadow-2xl relative`}
          style={{
            transform: 'perspective(600px) rotateX(20deg)',
            transformOrigin: 'bottom center',
          }}
        >
          {/* Ancient Stone Floor Runic Grid Lines */}
          <div className="absolute inset-0 opacity-15">
            <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <pattern id="runicGrid" width="80" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 80 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#runicGrid)" />
            </svg>
          </div>

          {/* Central Arena Leyline Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 rounded-full border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.1)] pointer-events-none flex items-center justify-center">
            <div className="w-64 h-32 rounded-full border border-cyan-500/20" />
          </div>
        </div>
      </div>

      {/* 5. Ambient Floating Particles / Energy Motes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-16 left-[15%] w-2 h-2 rounded-full blur-[1px] animate-bounce"
          style={{ backgroundColor: biome.ambientMoteColor, animationDuration: '4s' }}
        />
        <div
          className="absolute top-32 right-[20%] w-1.5 h-1.5 rounded-full blur-[1px] animate-bounce"
          style={{ backgroundColor: biome.ambientMoteColor, animationDuration: '5.5s' }}
        />
        <div
          className="absolute top-48 left-[45%] w-2.5 h-2.5 rounded-full blur-[1px] animate-pulse"
          style={{ backgroundColor: biome.ambientMoteColor }}
        />
        <div
          className="absolute bottom-28 right-[30%] w-1.5 h-1.5 rounded-full blur-[1px] animate-bounce"
          style={{ backgroundColor: biome.ambientMoteColor, animationDuration: '3.8s' }}
        />
      </div>

      {/* Foreground Interactive Units Content */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-3 sm:p-5">
        {children}
      </div>
    </div>
  );
};
