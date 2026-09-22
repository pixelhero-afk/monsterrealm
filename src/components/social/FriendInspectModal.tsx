/**
 * Monster Realms - Friend Inspect Modal
 * Detailed inspection view of a friend's active defense team, monsters, levels, and gear.
 */

import React from 'react';
import {
  X,
  Shield,
  Swords,
  Star,
  Sparkles,
  Award,
  Zap,
  Flame,
  Heart,
} from 'lucide-react';
import { FriendPublicProfile, PlayerMonster } from '../../types';
import { MONSTER_VARIANTS } from '../../data/monsters';
import { ELEMENT_VISUALS } from '../../data/elements';
import { MonsterAvatar } from '../MonsterAvatar';
import { calculateEffectiveStats } from '../../engine/statCalculator';

interface FriendInspectModalProps {
  friend: FriendPublicProfile | null;
  onClose: () => void;
  onSparBattle?: (friend: FriendPublicProfile) => void;
}

export const FriendInspectModal: React.FC<FriendInspectModalProps> = ({
  friend,
  onClose,
  onSparBattle,
}) => {
  if (!friend) return null;

  const partyMonsters: PlayerMonster[] = friend.defenseParty || [];

  // Calculate total team power
  const totalPower = partyMonsters.reduce((acc, m) => {
    const v = MONSTER_VARIANTS[m.variantId];
    if (!v) return acc;
    const stats = calculateEffectiveStats({
      variant: v,
      level: m.level,
      awakeningStage: m.awakeningStage,
    }).finalStats;
    return (
      acc +
      Math.floor(
        stats.hp / 10 + stats.attack * 1.5 + stats.defense * 1.2 + stats.speed * 2
      )
    );
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#FFFDF9] border-2 border-[#D8C7A5] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] border-b border-[#E8DCBE] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold text-lg shadow-md ring-1 ring-amber-300">
              {friend.displayName[0]?.toUpperCase() || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-black text-[#5B3912] leading-tight">
                  {friend.displayName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-[#78350F] border border-amber-300">
                  Lv.{friend.level}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#854D0E]">
                Friend Code: <span className="font-bold text-[#B45309]">{friend.friendCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#854D0E] hover:bg-amber-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Defense Team Stats Overview */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FDFBF7] border border-[#D5C29E] rounded-xl text-xs">
            <div className="flex items-center gap-2 text-[#78350F]">
              <Shield className="w-4 h-4 text-amber-600" />
              <span className="font-bold">Active Defense Formation</span>
              <span className="text-[#8C765C]">({partyMonsters.length}/5 Monsters)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#8C765C]">Estimated Power:</span>
              <span className="font-mono font-black text-[#B45309] text-sm">
                {totalPower.toLocaleString()} CP
              </span>
            </div>
          </div>

          {/* 5 Monsters Roster Cards */}
          {partyMonsters.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8C765C] bg-[#FAF7F0] rounded-xl border border-dashed border-[#D5C29E]">
              No defense monsters configured.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {partyMonsters.map((monster, idx) => {
                const variant = MONSTER_VARIANTS[monster.variantId];
                if (!variant) return null;
                const elem = ELEMENT_VISUALS[variant.element];
                const stats = calculateEffectiveStats({
                  variant,
                  level: monster.level,
                  awakeningStage: monster.awakeningStage,
                }).finalStats;

                return (
                  <div
                    key={monster.instanceId || idx}
                    className="p-3 bg-white border border-[#E8DCBE] rounded-xl shadow-2xs hover:shadow-sm transition-all flex items-start gap-3"
                  >
                    <div className="relative shrink-0">
                      <MonsterAvatar
                        variantId={monster.variantId}
                        awakeningStage={monster.awakeningStage}
                        size="md"
                        element={variant.element}
                      />
                      <div className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-amber-500 text-white font-black text-[9px] rounded-sm shadow-2xs">
                        Lv.{monster.level}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-[#4A3822] truncate">
                          {variant.name}
                        </span>
                        <span
                          className="text-[10px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-wider shrink-0"
                          style={{
                            backgroundColor: `${elem?.colorHex}15`,
                            color: elem?.colorHex,
                            borderColor: `${elem?.colorHex}40`,
                          }}
                        >
                          {variant.element}
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: monster.stars || variant.stars || 5 }).map((_, s) => (
                          <Star key={s} className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                        ))}
                      </div>

                      {/* Mini Stats */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] font-mono text-[#78350F] mt-1.5 pt-1.5 border-t border-[#F2E8D5]">
                        <div>HP: {stats.hp.toLocaleString()}</div>
                        <div>ATK: {stats.attack}</div>
                        <div>DEF: {stats.defense}</div>
                        <div>SPD: {stats.speed}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#FAF7F0] border-t border-[#E8DCBE] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#D5C29E] text-[#5B3912] font-bold text-xs hover:bg-[#F4EBD7] transition-colors cursor-pointer"
          >
            Close
          </button>

          {onSparBattle && partyMonsters.length > 0 && (
            <button
              onClick={() => {
                onSparBattle(friend);
                onClose();
              }}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>Spar Friendly Battle</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
