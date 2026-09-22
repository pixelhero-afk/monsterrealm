/**
 * Buff & Debuff Icon Component
 * Displays distinct visual icons for active combat status effects,
 * color-coded for positive buffs vs. negative debuffs, with a small
 * turns-remaining badge on the top right corner.
 */

import React from 'react';
import {
  Swords,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Sparkles,
  Heart,
  EyeOff,
  AlertTriangle,
  Snowflake,
  Moon,
  VolumeX,
  Flame,
  Skull,
  Clock,
  Ghost,
  HelpCircle,
} from 'lucide-react';
import { StatusEffect, StatusEffectType } from '../../types';

interface BuffDebuffIconProps {
  effect: StatusEffect;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

interface EffectConfig {
  icon: React.ComponentType<{ className?: string }>;
  isBuff: boolean;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  glowClass: string;
  label: string;
}

const EFFECT_CONFIGS: Record<StatusEffectType, EffectConfig> = {
  // Buffs
  ATTACK_UP: {
    icon: Swords,
    isBuff: true,
    colorClass: 'text-amber-300',
    borderClass: 'border-amber-400/90',
    bgClass: 'bg-amber-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(251,191,36,0.4)]',
    label: 'Attack Up (+50%)',
  },
  DEFENSE_UP: {
    icon: Shield,
    isBuff: true,
    colorClass: 'text-cyan-300',
    borderClass: 'border-cyan-400/90',
    bgClass: 'bg-cyan-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(34,211,238,0.4)]',
    label: 'Defense Up (+70%)',
  },
  SPEED_UP: {
    icon: Zap,
    isBuff: true,
    colorClass: 'text-emerald-300',
    borderClass: 'border-emerald-400/90',
    bgClass: 'bg-emerald-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(52,211,153,0.4)]',
    label: 'Speed Up (+30%)',
  },
  CRIT_RATE_UP: {
    icon: Sparkles,
    isBuff: true,
    colorClass: 'text-yellow-300',
    borderClass: 'border-yellow-400/90',
    bgClass: 'bg-yellow-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(250,204,21,0.4)]',
    label: 'Crit Rate Up (+30%)',
  },
  SHIELD: {
    icon: ShieldCheck,
    isBuff: true,
    colorClass: 'text-blue-300',
    borderClass: 'border-blue-400/90',
    bgClass: 'bg-blue-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(96,165,250,0.4)]',
    label: 'Shield Barrier',
  },
  CONTINUOUS_HEAL: {
    icon: Heart,
    isBuff: true,
    colorClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/90',
    bgClass: 'bg-emerald-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(16,185,129,0.4)]',
    label: 'Continuous Heal (+15% HP)',
  },
  IMMUNITY: {
    icon: Shield,
    isBuff: true,
    colorClass: 'text-amber-200',
    borderClass: 'border-amber-300/90',
    bgClass: 'bg-amber-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(253,230,138,0.4)]',
    label: 'Immunity (Blocks Debuffs)',
  },
  STEALTH: {
    icon: Ghost,
    isBuff: true,
    colorClass: 'text-purple-300',
    borderClass: 'border-purple-400/90',
    bgClass: 'bg-purple-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(192,132,252,0.4)]',
    label: 'Stealth (Untargetable)',
  },
  DOUBLE_ATTACK: {
    icon: Flame,
    isBuff: true,
    colorClass: 'text-orange-300',
    borderClass: 'border-orange-400/90',
    bgClass: 'bg-orange-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(251,146,60,0.4)]',
    label: 'Double Attack Buff',
  },

  // Debuffs / Control
  ATTACK_DOWN: {
    icon: Swords,
    isBuff: false,
    colorClass: 'text-rose-400',
    borderClass: 'border-rose-500/90',
    bgClass: 'bg-rose-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(244,63,94,0.4)]',
    label: 'Attack Down (-50%)',
  },
  DEFENSE_DOWN: {
    icon: ShieldAlert,
    isBuff: false,
    colorClass: 'text-red-400',
    borderClass: 'border-red-500/90',
    bgClass: 'bg-red-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(239,68,68,0.4)]',
    label: 'Defense Down (-70%)',
  },
  SPEED_DOWN: {
    icon: Clock,
    isBuff: false,
    colorClass: 'text-orange-400',
    borderClass: 'border-orange-500/90',
    bgClass: 'bg-orange-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(249,115,22,0.4)]',
    label: 'Speed Down (-30%)',
  },
  STUN: {
    icon: AlertTriangle,
    isBuff: false,
    colorClass: 'text-amber-400',
    borderClass: 'border-amber-500/90',
    bgClass: 'bg-amber-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(245,158,11,0.4)]',
    label: 'Stun (Action Disabled)',
  },
  FREEZE: {
    icon: Snowflake,
    isBuff: false,
    colorClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/90',
    bgClass: 'bg-cyan-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(6,182,212,0.4)]',
    label: 'Freeze (Frozen Stun)',
  },
  SLEEP: {
    icon: Moon,
    isBuff: false,
    colorClass: 'text-indigo-400',
    borderClass: 'border-indigo-500/90',
    bgClass: 'bg-indigo-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(99,102,241,0.4)]',
    label: 'Sleep (Incapacitated)',
  },
  SILENCE: {
    icon: VolumeX,
    isBuff: false,
    colorClass: 'text-purple-400',
    borderClass: 'border-purple-500/90',
    bgClass: 'bg-purple-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(168,85,247,0.4)]',
    label: 'Silence (Skills Sealed)',
  },
  TAUNT: {
    icon: Flame,
    isBuff: false,
    colorClass: 'text-rose-400',
    borderClass: 'border-rose-500/90',
    bgClass: 'bg-rose-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(225,29,72,0.4)]',
    label: 'Taunt (Forced Focus)',
  },
  CONTINUOUS_DAMAGE: {
    icon: Skull,
    isBuff: false,
    colorClass: 'text-rose-500',
    borderClass: 'border-rose-600/90',
    bgClass: 'bg-rose-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(225,29,72,0.4)]',
    label: 'Continuous Damage (Bleed/Burn)',
  },
  BLIND: {
    icon: EyeOff,
    isBuff: false,
    colorClass: 'text-slate-400',
    borderClass: 'border-slate-500/90',
    bgClass: 'bg-slate-950/90',
    glowClass: 'shadow-[0_0_6px_rgba(148,163,184,0.4)]',
    label: 'Blind (50% Miss Rate)',
  },
};

export const BuffDebuffIcon: React.FC<BuffDebuffIconProps> = ({
  effect,
  size = 'md',
  showTooltip = true,
}) => {
  const cfg = EFFECT_CONFIGS[effect.type] || {
    icon: HelpCircle,
    isBuff: effect.isBuff,
    colorClass: effect.isBuff ? 'text-emerald-300' : 'text-rose-400',
    borderClass: effect.isBuff ? 'border-emerald-500' : 'border-rose-500',
    bgClass: 'bg-slate-900/90',
    glowClass: '',
    label: effect.name || effect.type,
  };

  const IconComponent = cfg.icon;

  const sizeDimensions = {
    xs: {
      box: 'w-4 h-4 rounded-[4px] border',
      icon: 'w-2.5 h-2.5',
      badge: '-top-1.5 -right-1.5 min-w-[11px] h-[11px] text-[7px]',
    },
    sm: {
      box: 'w-5 h-5 rounded-[5px] border',
      icon: 'w-3 h-3',
      badge: '-top-1.5 -right-1.5 min-w-[13px] h-[13px] text-[8px]',
    },
    md: {
      box: 'w-6 h-6 rounded-md border-[1.5px]',
      icon: 'w-3.5 h-3.5',
      badge: '-top-1.5 -right-1.5 min-w-[14px] h-[14px] text-[9px]',
    },
    lg: {
      box: 'w-7 h-7 rounded-lg border-2',
      icon: 'w-4 h-4',
      badge: '-top-2 -right-2 min-w-[16px] h-[16px] text-[10px]',
    },
  }[size];

  const tooltipText = `${cfg.label} • ${effect.duration} turn${effect.duration === 1 ? '' : 's'} remaining`;

  return (
    <div
      className={`relative inline-flex items-center justify-center backdrop-blur-sm select-none ${sizeDimensions.box} ${cfg.bgClass} ${cfg.borderClass} ${cfg.colorClass} ${cfg.glowClass} transition-transform hover:scale-110`}
      title={showTooltip ? tooltipText : undefined}
    >
      <IconComponent className={sizeDimensions.icon} />

      {/* Small number on the buff/debuff right top to show how many more turns */}
      <span
        className={`absolute ${sizeDimensions.badge} px-0.5 rounded-full bg-slate-950 border border-amber-400/80 text-amber-300 font-black flex items-center justify-center leading-none shadow-lg z-10 pointer-events-none`}
      >
        {effect.duration}
      </span>
    </div>
  );
};
