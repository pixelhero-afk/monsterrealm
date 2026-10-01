/**
 * Premium Collectible RPG Monster Card
 * Features multi-layered metallic/obsidian frames, rarity star gems,
 * element jewel badges, stat gauges, awakened visual accents, and 3D depth.
 */

import React from 'react';
import { AwakeningStage, ElementType, MonsterVariant, Rarity } from '../types';
import { MonsterAvatar } from './MonsterAvatar';
import { ELEMENT_VISUALS } from '../data/elements';
import { Shield, Swords, Zap, Heart, Sparkles, Award } from 'lucide-react';
import { MonsterStarRating } from './MonsterStarRating';
import { getMonsterStars } from '../utils/monsterStars';
import { getMonsterDisplayName } from '../utils/monsterNames';

interface MonsterCardProps {
  variant: MonsterVariant;
  level?: number;
  stars?: number;
  awakeningStage?: AwakeningStage;
  currentHp?: number;
  maxHp?: number;
  stats?: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  isSelected?: boolean;
  isLocked?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showStats?: boolean;
  className?: string;
  badgeText?: string;
}

export const MonsterCard: React.FC<MonsterCardProps> = ({
  variant,
  level = 1,
  stars,
  awakeningStage = 'BASE',
  currentHp,
  maxHp,
  stats,
  isSelected = false,
  onClick,
  size = 'md',
  showStats = true,
  className = '',
  badgeText,
}) => {
  const isAwakened = awakeningStage !== 'BASE';
  const elementVisual = ELEMENT_VISUALS[variant.element];
  const effectiveStars = stars !== undefined && stars > 0 ? stars : getMonsterStars(null, variant);
  const isTranscendent = effectiveStars >= 6;
  const isMaxApex = effectiveStars === 10;

  // Rarity Gem / Frame Styling
  const getRarityConfig = (rarity: Rarity, starCount: number) => {
    if (starCount >= 6) {
      return {
        border: starCount === 10 ? 'border-purple-600 shadow-purple-600/30 ring-purple-500/50' : 'border-[#A855F7] shadow-[#A855F7]/25 ring-[#A855F7]/30',
        bgGradient: 'from-[#FAF5FF] via-[#F3E8FF]/40 to-[#FFFDF9]',
        titleColor: 'text-purple-900',
        gemColor: '#9333ea',
        cardGlow: starCount === 10 ? 'shadow-[0_4px_20px_rgba(147,51,234,0.3)]' : 'shadow-[0_4px_16px_rgba(168,85,247,0.2)]',
        frameTag: starCount === 10 ? '10★ SOVEREIGN' : `${starCount}★ TRANSCENDENT`,
      };
    }

    switch (rarity) {
      case 'LEGENDARY':
        return {
          border: 'border-[#F59E0B] shadow-[#F59E0B]/20 ring-[#F59E0B]/40',
          bgGradient: 'from-[#FFFBEB] via-[#FEF3C7]/40 to-[#FFFDF9]',
          titleColor: 'text-[#92400E]',
          gemColor: '#d97706',
          cardGlow: 'shadow-[0_4px_16px_rgba(245,158,11,0.2)]',
          frameTag: 'LEGENDARY',
        };
      case 'EPIC':
        return {
          border: 'border-[#C084FC] shadow-[#C084FC]/20 ring-[#C084FC]/30',
          bgGradient: 'from-[#FAF5FF] via-[#F3E8FF]/40 to-[#FFFDF9]',
          titleColor: 'text-[#6B21A8]',
          gemColor: '#9333ea',
          cardGlow: 'shadow-[0_4px_16px_rgba(168,85,247,0.15)]',
          frameTag: 'EPIC',
        };
      case 'RARE':
        return {
          border: 'border-[#38BDF8] shadow-[#38BDF8]/20 ring-[#38BDF8]/30',
          bgGradient: 'from-[#F0F9FF] via-[#E0F2FE]/40 to-[#FFFDF9]',
          titleColor: 'text-[#0369A1]',
          gemColor: '#0284c7',
          cardGlow: 'shadow-[0_4px_14px_rgba(6,182,212,0.15)]',
          frameTag: 'RARE',
        };
      case 'UNCOMMON':
        return {
          border: 'border-[#4ADE80] shadow-[#4ADE80]/20 ring-[#4ADE80]/30',
          bgGradient: 'from-[#F0FDF4] via-[#DCFCE7]/40 to-[#FFFDF9]',
          titleColor: 'text-[#15803D]',
          gemColor: '#16a34a',
          cardGlow: 'shadow-[0_4px_14px_rgba(34,197,94,0.15)]',
          frameTag: 'UNCOMMON',
        };
      case 'COMMON':
      default:
        return {
          border: 'border-[#D5C29E] shadow-[#D5C29E]/20 ring-[#D5C29E]/30',
          bgGradient: 'from-[#FAF6ED] via-[#FDFBF7] to-[#FFFDF9]',
          titleColor: 'text-[#5C4A34]',
          gemColor: '#78654e',
          cardGlow: 'shadow-2xs',
          frameTag: 'COMMON',
        };
    }
  };

  const rarityConfig = getRarityConfig(variant.rarity, effectiveStars);

  const sizeClasses = {
    sm: 'w-28 p-2 text-[10px]',
    md: 'w-44 p-3 text-xs',
    lg: 'w-56 p-4 text-sm',
  }[size];

  const avatarSizes: Record<'sm' | 'md' | 'lg', 'sm' | 'md' | 'lg'> = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  };

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border transition-all duration-300 select-none group cursor-pointer overflow-hidden ${
        rarityConfig.border
      } ${rarityConfig.cardGlow} bg-gradient-to-b ${rarityConfig.bgGradient} ${
        isSelected
          ? 'scale-105 ring-2 ring-[#F59E0B] shadow-xl -translate-y-1'
          : 'hover:scale-[1.02] hover:-translate-y-0.5'
      } ${sizeClasses} ${className}`}
    >
      {/* Top Banner: Element Jewel & Awakening Crest */}
      <div className="flex items-center justify-between gap-1 mb-1.5 z-10 relative">
        {/* Element Badge */}
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full border shadow-2xs backdrop-blur-sm"
          style={{
            borderColor: `${elementVisual.borderHex}88`,
            backgroundColor: `${elementVisual.borderHex}15`,
          }}
        >
          <span
            className="w-2 h-2 rounded-full shadow-2xs"
            style={{ backgroundColor: elementVisual.colorHex }}
          />
          <span
            className="font-black text-[9px] uppercase tracking-wider"
            style={{ color: elementVisual.borderHex }}
          >
            {variant.element}
          </span>
        </div>

        {/* Awakening / Role Badge */}
        {isAwakened ? (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded fantasy-btn-gold text-[#2E1F0F] font-black text-[8px] uppercase tracking-tighter shadow-2xs font-serif">
            <Sparkles className="w-2.5 h-2.5 text-[#D97706]" />
            <span>AWK</span>
          </div>
        ) : (
          <span className="text-[9px] font-bold text-[#78654E] uppercase tracking-tight">
            {variant.primaryRole}
          </span>
        )}
      </div>

      {/* Monster Avatar Portrait Presentation */}
      <div className="relative flex items-center justify-center my-1 py-1">
        {/* Ambient Element Background Ring */}
        <div
          className="absolute w-20 h-20 rounded-full blur-xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity"
          style={{ backgroundColor: elementVisual.colorHex }}
        />

        <MonsterAvatar
          variantId={variant.variantId}
          element={variant.element}
          awakeningStage={awakeningStage}
          size={avatarSizes[size]}
          className="relative z-10 transition-transform duration-300 group-hover:scale-105"
        />

        {/* Custom Custom Badge Overlay */}
        {badgeText && (
          <div className="absolute -bottom-2 fantasy-btn-gold text-[#2E1F0F] font-black text-[9px] px-2 py-0.5 rounded-full shadow-md z-20 font-serif">
            {badgeText}
          </div>
        )}
      </div>

      {/* Rarity Stars */}
      <div className="flex items-center justify-center my-1.5 z-10 relative">
        <MonsterStarRating stars={effectiveStars} size="sm" animateApex={isMaxApex} />
      </div>

      {/* Monster Title & Subtitle */}
      <div className="text-center z-10 relative mt-1">
        <div className={`font-black truncate font-serif ${rarityConfig.titleColor}`} title={getMonsterDisplayName(variant)}>
          {getMonsterDisplayName(variant)}
        </div>
        <div className="text-[10px] text-[#78654E] font-bold flex items-center justify-center gap-1.5 mt-0.5">
          <span className="text-[#D97706] font-bold">Lv.{level}</span>
          <MonsterStarRating stars={effectiveStars} size="xs" showAllFiveSlots={false} />
          <span>•</span>
          <span className={`font-bold ${isTranscendent ? 'text-purple-700 font-black' : 'text-[#B45309]'}`}>
            {effectiveStars}★
          </span>
          <span>•</span>
          <span className="text-[#78654E]">{variant.rarity}</span>
        </div>
      </div>

      {/* HP Bar (If provided) */}
      {currentHp !== undefined && maxHp !== undefined && (
        <div className="mt-2 w-full z-10 relative">
          <div className="h-1.5 w-full bg-[#E8DEC8] rounded-full overflow-hidden border border-[#D5C29E]">
            <div
              className="h-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, (currentHp / maxHp) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] text-[#78654E] font-mono mt-0.5">
            <span>HP</span>
            <span>
              {currentHp} / {maxHp}
            </span>
          </div>
        </div>
      )}

      {/* Stat Matrix (Optional) */}
      {showStats && stats && (
        <div className="grid grid-cols-2 gap-1 mt-2 pt-2 border-t border-[#E8DEC8] text-[9px] text-[#5C4A34] z-10 relative font-mono">
          <div className="flex items-center gap-1">
            <Swords className="w-2.5 h-2.5 text-[#DC2626]" />
            <span>{stats.attack}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-2.5 h-2.5 text-[#0284C7]" />
            <span>{stats.defense}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-2.5 h-2.5 text-[#16A34A]" />
            <span>{stats.hp}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-[#D97706]" />
            <span>{stats.speed} Spd</span>
          </div>
        </div>
      )}

      {/* Subtle Frame Corner Runes */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-[#D5C29E] pointer-events-none" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-[#D5C29E] pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-[#D5C29E] pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-[#D5C29E] pointer-events-none" />

      {/* Holographic Foil Sheen for Legendary or Awakened Monsters */}
      {(variant.rarity === 'LEGENDARY' || isAwakened) && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-200/20 to-transparent pointer-events-none animate-foil-sheen" />
      )}
    </div>
  );
};
