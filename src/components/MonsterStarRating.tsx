/**
 * Monster Realms - Star Rating & Transcendent Purple Star Component
 *
 * Displays the 5-star constellation next to monster levels, on cards, and in modals.
 * When a monster reaches 6★, 1 star turns amethyst purple.
 * Each additional star turns another purple until all 5 stars are purple at 10★!
 */

import React from 'react';
import { getStarDisplayConfig } from '../utils/monsterStars';

interface MonsterStarRatingProps {
  stars: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showAllFiveSlots?: boolean;
  textPosition?: 'left' | 'right';
  className?: string;
  animateApex?: boolean;
}

export const MonsterStarRating: React.FC<MonsterStarRatingProps> = ({
  stars,
  size = 'sm',
  showText = false,
  showAllFiveSlots = true,
  textPosition = 'right',
  className = '',
  animateApex = false,
}) => {
  const config = getStarDisplayConfig(stars);

  const sizeClasses = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  }[size];

  const gapClasses = {
    xs: 'gap-0.5',
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1',
    xl: 'gap-1.5',
  }[size];

  const textClasses = {
    xs: 'text-[9px]',
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  }[size];

  // Build the 5 star slots
  // Indices 0..4
  // If transcendent (stars >= 6):
  //   i < purpleCount => Purple Star
  //   i >= purpleCount => Gold Star
  // If <= 5:
  //   i < goldCount => Gold Star
  //   i >= goldCount => Empty Star (if showAllFiveSlots)
  const slots: Array<'PURPLE' | 'GOLD' | 'EMPTY'> = [];
  for (let i = 0; i < 5; i++) {
    if (config.isTranscendent) {
      if (i < config.purpleCount) {
        slots.push('PURPLE');
      } else {
        slots.push('GOLD');
      }
    } else {
      if (i < config.goldCount) {
        slots.push('GOLD');
      } else if (showAllFiveSlots) {
        slots.push('EMPTY');
      }
    }
  }

  const renderTextBadge = () => {
    if (!showText) return null;
    return (
      <span
        className={`font-black font-mono shrink-0 whitespace-nowrap ${textClasses} ${
          config.isMaxApex
            ? 'text-purple-700 bg-purple-100 border border-purple-300 px-1 rounded shadow-2xs'
            : config.isTranscendent
            ? 'text-purple-600'
            : 'text-amber-700'
        }`}
        title={`${config.stars} Stars (${config.tierLabel})`}
      >
        {config.stars}★
      </span>
    );
  };

  return (
    <div
      className={`inline-flex items-center ${gapClasses} ${className}`}
      title={`${config.stars} Stars: ${config.purpleCount > 0 ? `${config.purpleCount} Purple, ` : ''}${config.goldCount} Gold (${config.tierLabel})`}
    >
      {textPosition === 'left' && renderTextBadge()}

      <div className={`inline-flex items-center ${gapClasses}`}>
        {slots.map((slotType, idx) => {
          if (slotType === 'PURPLE') {
            return (
              <svg
                key={`star-p-${idx}`}
                viewBox="0 0 24 24"
                className={`${sizeClasses} shrink-0 fill-[#A855F7] text-[#7E22CE] drop-shadow-[0_0_3px_rgba(168,85,247,0.7)] ${
                  animateApex && config.isMaxApex ? 'animate-pulse' : ''
                }`}
              >
                <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
              </svg>
            );
          }

          if (slotType === 'GOLD') {
            return (
              <svg
                key={`star-g-${idx}`}
                viewBox="0 0 24 24"
                className={`${sizeClasses} shrink-0 fill-[#F59E0B] text-[#D97706] drop-shadow-[0_0_2px_rgba(245,158,11,0.5)]`}
              >
                <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
              </svg>
            );
          }

          // Empty slot
          return (
            <svg
              key={`star-e-${idx}`}
              viewBox="0 0 24 24"
              className={`${sizeClasses} shrink-0 fill-transparent text-[#D5C29E] opacity-35`}
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
            </svg>
          );
        })}
      </div>

      {textPosition === 'right' && renderTextBadge()}
    </div>
  );
};
