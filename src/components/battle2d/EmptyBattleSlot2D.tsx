/**
 * Empty Battle Slot Component
 * Renders an illuminated holographic unit slot pad when a team has fewer than 5 members,
 * maintaining battlefield symmetry, depth, and spatial tactical awareness.
 */

import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

interface EmptyBattleSlot2DProps {
  slotKey: string;
  slotName: string;
  row: 'BACK' | 'FRONT';
  isPlayer: boolean;
  depthScale?: number;
}

export const EmptyBattleSlot2D: React.FC<EmptyBattleSlot2DProps> = ({
  slotKey,
  slotName,
  row,
  isPlayer,
  depthScale = 1.0,
}) => {
  const themeColor = isPlayer ? '#38bdf8' : '#fb923c';
  const borderColor = isPlayer ? 'border-sky-500/40' : 'border-orange-500/40';
  const bgColor = isPlayer ? 'bg-sky-950/20' : 'bg-orange-950/20';

  return (
    <div
      className="relative flex flex-col items-center justify-end select-none pointer-events-none opacity-60"
      style={{
        transform: `scale(${depthScale})`,
        transformOrigin: 'bottom center',
        width: '120px',
        minHeight: '180px',
      }}
    >
      {/* Upper subtle slot blueprint indicator */}
      <div
        className={`flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${borderColor} ${bgColor} mb-8`}
        style={{ color: themeColor }}
      >
        <Shield className="w-2.5 h-2.5 opacity-70" />
        <span>{slotKey} · {row}</span>
      </div>

      {/* Holographic floor pedestal ring */}
      <div className="relative w-28 h-6 z-10 flex items-center justify-center">
        <div className="absolute w-22 h-4 bg-black/50 rounded-full blur-sm" />
        <div
          className={`absolute w-20 h-5 rounded-full border border-dashed ${borderColor} animate-pulse`}
          style={{
            boxShadow: `0 0 10px ${themeColor}20`,
          }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: themeColor, opacity: 0.7 }}
        />
      </div>
    </div>
  );
};
