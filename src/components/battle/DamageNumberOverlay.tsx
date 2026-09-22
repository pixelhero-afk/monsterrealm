/**
 * Dynamic Floating Combat Text & Damage Numbers
 * Renders high-visibility floating numbers for normal damage, CRITICAL hits,
 * elemental advantages (Weakness), resisted hits, healing, and shield absorption.
 */

import React from 'react';
import { CombatDamageNumber, CombatDamageType } from './CombatDamageNumber';

export interface FloatingNumber {
  id: string;
  targetId: string;
  text: string;
  type: CombatDamageType;
  xOffset?: number;
  yOffset?: number;
  targetX?: number;
  targetY?: number;
}

interface DamageNumberOverlayProps {
  numbers: FloatingNumber[];
}

export const DamageNumberOverlay: React.FC<DamageNumberOverlayProps> = ({ numbers }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {numbers.map((item) => {
        const hasCoords = typeof item.targetX === 'number' && typeof item.targetY === 'number';
        const leftStyle = hasCoords
          ? `calc(${item.targetX}% + ${item.xOffset || 0}px)`
          : `calc(50% + ${item.xOffset || 0}px)`;
        const topStyle = hasCoords
          ? `calc(${item.targetY}% + ${item.yOffset || 0}px)`
          : `calc(45% + ${item.yOffset || 0}px)`;

        return (
          <div
            key={item.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none will-change-transform"
            style={{
              left: leftStyle,
              top: topStyle,
            }}
          >
            <CombatDamageNumber text={item.text} type={item.type} />
          </div>
        );
      })}
    </div>
  );
};

