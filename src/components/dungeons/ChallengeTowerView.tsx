/**
 * Monster Realms - Challenge Tower (Spire of Ascension)
 * 100-Floor monthly celestial gauntlet with scaling enemy stats,
 * field modifiers, milestone boss chambers, and legendary bounties.
 */

import React, { useState } from 'react';
import {
  Crown,
  Lock,
  Sparkles,
  Trophy,
  Swords,
  ChevronRight,
  Shield,
  Zap,
  Gem,
  Coins,
  Flame,
  Droplets,
  Leaf,
  Sun,
  Moon,
  Info,
  Play,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { AwakeningStage, PlayerMonster, PlayerProfile, PvEStage } from '../../types';
import { MONSTER_VARIANTS } from '../../data/monsters';
import { MonsterAvatar } from '../MonsterAvatar';
import { getSecondsUntilNextReset, formatRemainingTime } from '../../services/dailyMissionsService';

interface ChallengeTowerViewProps {
  profile: PlayerProfile;
  monsters: PlayerMonster[];
  onSelectStageForBattle: (stage: PvEStage) => void;
  onBackToCampaign?: () => void;
}

export const ChallengeTowerView: React.FC<ChallengeTowerViewProps> = ({
  profile,
  monsters,
  onSelectStageForBattle,
  onBackToCampaign,
}) => {
  // Current season highest floor cleared (default 0 or read from completed stages)
  const completedStages = profile?.completedStages || [];
  const towerStagesCleared = completedStages.filter((s) => s.startsWith('tower_floor_')).length;
  const currentFloor = Math.min(100, towerStagesCleared + 1);

  const [selectedFloor, setSelectedFloor] = useState<number>(currentFloor);
  const [selectedTierGroup, setSelectedTierGroup] = useState<number>(
    Math.floor((currentFloor - 1) / 10) * 10 + 1
  );

  const isSelectedFloorCleared = selectedFloor <= towerStagesCleared;
  const isSelectedFloorUnlocked = selectedFloor <= currentFloor;
  const isBossFloor = selectedFloor % 10 === 0;

  // Milestone boss rewards definition
  const MILESTONE_REWARDS: Record<number, { gems: number; gold: number; title: string; bossName: string; element: 'FIRE' | 'WATER' | 'GRASS' | 'LIGHT' | 'DARK' }> = {
    10: { gems: 100, gold: 10000, title: 'Flame Colossus Floor', bossName: 'Pyrosaur Overlord', element: 'FIRE' },
    20: { gems: 150, gold: 20000, title: 'Tidal Sovereign Floor', bossName: 'Leviathan Primordial', element: 'WATER' },
    30: { gems: 200, gold: 30000, title: 'Ironwood Elder Floor', bossName: 'Yggdrasil Ancient', element: 'GRASS' },
    40: { gems: 250, gold: 40000, title: 'Sun Prism Floor', bossName: 'Solar Archon Seraph', element: 'LIGHT' },
    50: { gems: 300, gold: 50000, title: 'Void Singularity Floor', bossName: 'Abyssal Void Monarch', element: 'DARK' },
    60: { gems: 400, gold: 60000, title: 'Draconic Ley-Line Floor', bossName: 'Inferno Wyrm Overlord', element: 'FIRE' },
    70: { gems: 500, gold: 70000, title: 'Chasm Kraken Floor', bossName: 'Abyssal Kraken God', element: 'WATER' },
    80: { gems: 600, gold: 80000, title: 'Primeval Grove Floor', bossName: 'Floraweaver Matriarch', element: 'GRASS' },
    90: { gems: 750, gold: 90000, title: 'Celestial High Seraph Floor', bossName: 'Solaris Apex Seraph', element: 'LIGHT' },
    100: { gems: 1000, gold: 150000, title: 'Celestial Architect Pinnacle', bossName: 'Primeval God of Ascension', element: 'DARK' },
  };

  // Determine floor element and boss info
  const floorElement: 'FIRE' | 'WATER' | 'GRASS' | 'LIGHT' | 'DARK' =
    isBossFloor
      ? MILESTONE_REWARDS[selectedFloor]?.element || 'FIRE'
      : (['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK'][(selectedFloor - 1) % 5] as any);

  // Energy cost is 0 for tower floors!
  const energyCost = 0;
  const recommendedPower = 1000 + selectedFloor * 280;

  // Launch battle with dynamically generated Tower stage
  const handleLaunchFloor = () => {
    if (!isSelectedFloorUnlocked) return;

    // Pick enemy variants matching element
    const variantsForElem = Object.values(MONSTER_VARIANTS).filter(
      (v) => v.element === floorElement && !v.isBoss && v.isObtainable !== false
    );
    const leadVariant = isBossFloor
      ? Object.values(MONSTER_VARIANTS).find((v) => v.isBoss && v.element === floorElement) || variantsForElem[0]
      : variantsForElem[0];

    const towerStage: PvEStage = {
      stageId: `tower_floor_${selectedFloor}`,
      continentId: 'challenge_tower',
      chapter: Math.ceil(selectedFloor / 10),
      stageNumber: selectedFloor,
      name: isBossFloor ? `Spire Floor ${selectedFloor} - Boss Trial` : `Spire Floor ${selectedFloor}`,
      element: floorElement,
      energyCost: 0,
      recommendedPower,
      description: isBossFloor
        ? `Celestial milestone boss chamber! Defeat ${leadVariant.name} to claim the milestone bounty.`
        : `Floor ${selectedFloor} of the Spire of Ascension. Ascend higher to test your squad limits.`,
      enemyVariants: [
        {
          variantId: leadVariant.variantId,
          level: Math.min(100, 10 + Math.floor(selectedFloor * 0.9)),
          slotIndex: 0,
          awakeningStage: (isBossFloor ? 'ASCENDED' : selectedFloor > 50 ? 'GREATER_AWAKENED' : selectedFloor > 20 ? 'AWAKENED' : 'BASE') as AwakeningStage,
        },
        ...(variantsForElem.slice(0, 3).map((v, idx) => ({
          variantId: v.variantId,
          level: Math.min(95, 8 + Math.floor(selectedFloor * 0.85)),
          slotIndex: idx + 1,
          awakeningStage: (selectedFloor > 60 ? 'GREATER_AWAKENED' : selectedFloor > 30 ? 'AWAKENED' : 'BASE') as AwakeningStage,
        }))),
      ],
      firstClearRewards: {
        gold: isBossFloor ? (MILESTONE_REWARDS[selectedFloor]?.gold || 20000) : 3000 + selectedFloor * 300,
        gems: isBossFloor ? (MILESTONE_REWARDS[selectedFloor]?.gems || 100) : 10,
        summonPoints: 20,
      },
      repeatRewards: {
        gold: 1000,
        exp: 200,
      },
    };

    onSelectStageForBattle(towerStage);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Tower Lore & Season Countdown */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E112A] via-[#2D1B42] to-[#1E112A] border-2 border-[#7C3AED] p-4 sm:p-6 text-white shadow-md">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 border border-purple-300 flex items-center justify-center text-white shadow-md shrink-0">
              <Crown className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-400 text-purple-950 px-2 py-0.5 rounded-full font-mono">
                  Monthly Season 1
                </span>
                <span className="text-xs text-purple-200 font-medium">
                  100-Floor Celestial Gauntlet
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black font-serif text-white mt-0.5 tracking-wide">
                Spire of Ascension
              </h2>
              <p className="text-xs text-purple-200/80 max-w-xl mt-0.5">
                Climb 100 ascending floors with 0 stamina cost. Defeat milestone bosses every 10 floors for massive Gem bounties!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0">
            <div className="bg-black/40 border border-purple-400/40 rounded-xl px-3 py-2 text-right">
              <span className="text-[10px] font-bold uppercase text-purple-300 block">Current Progress</span>
              <span className="text-base sm:text-lg font-mono font-black text-amber-300">
                Floor {currentFloor} / 100
              </span>
            </div>

            {onBackToCampaign && (
              <button
                onClick={onBackToCampaign}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs py-2 px-3.5 rounded-xl cursor-pointer transition-colors"
              >
                ← Campaign
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Column Interface: Floor List (Left) & Floor Detail / Battle Prep (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Floor Range Tabs & 10 Floors (8 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Floor Range Navigator (1-10, 11-20, 21-30, ... 91-100) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[1, 11, 21, 31, 41, 51, 61, 71, 81, 91].map((startFloor) => {
              const endFloor = startFloor + 9;
              const isCurrentRange = selectedTierGroup === startFloor;
              const hasReachedRange = currentFloor >= startFloor;

              return (
                <button
                  key={startFloor}
                  onClick={() => {
                    setSelectedTierGroup(startFloor);
                    setSelectedFloor(Math.min(endFloor, Math.max(startFloor, currentFloor)));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                    isCurrentRange
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-sm'
                      : hasReachedRange
                      ? 'bg-[#FFFDF9] hover:bg-[#FAF6ED] text-[#2E1F0F] border-[#D5C29E]'
                      : 'bg-gray-100 text-gray-400 border-gray-200 opacity-60'
                  }`}
                >
                  Floors {startFloor}–{endFloor}
                </button>
              );
            })}
          </div>

          {/* 10 Floor Cards for Selected Range */}
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, idx) => {
              const floorNum = selectedTierGroup + idx;
              const isFloorCleared = floorNum < currentFloor;
              const isCurrentUnreached = floorNum === currentFloor;
              const isFloorLocked = floorNum > currentFloor;
              const isSelected = selectedFloor === floorNum;
              const isMilestone = floorNum % 10 === 0;

              return (
                <div
                  key={floorNum}
                  onClick={() => !isFloorLocked && setSelectedFloor(floorNum)}
                  className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                    isFloorLocked
                      ? 'bg-[#FAF6ED]/60 border-[#E5DAC0] opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FFFBEB] border-[#F59E0B] shadow-sm ring-2 ring-amber-400/40 cursor-pointer'
                      : isFloorCleared
                      ? 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-[#D5C29E] cursor-pointer'
                      : 'bg-emerald-50/60 border-emerald-300 cursor-pointer shadow-xs animate-pulse'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs border ${
                        isMilestone
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white border-amber-300 shadow-xs'
                          : isFloorCleared
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isCurrentUnreached
                          ? 'bg-purple-600 text-white border-purple-400 animate-bounce'
                          : 'bg-gray-100 text-gray-500 border-gray-300'
                      }`}
                    >
                      {isMilestone ? <Crown className="w-4 h-4" /> : floorNum}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-black text-xs sm:text-sm text-[#2E1F0F]">
                          Floor {floorNum}
                        </span>
                        {isMilestone && (
                          <span className="bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] text-[10px] font-black px-2 py-0.2 rounded-full uppercase">
                            👑 Boss Chamber
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#78654E]">
                        {isMilestone
                          ? `Milestone Reward: +💎 ${MILESTONE_REWARDS[floorNum]?.gems || 100} Gems`
                          : `Stage Reward: +10 Gems, +3,000 Gold`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isFloorCleared ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Cleared</span>
                      </span>
                    ) : isCurrentUnreached ? (
                      <span className="text-[11px] font-black text-purple-700 bg-purple-100 border border-purple-300 px-2.5 py-0.5 rounded-full">
                        Next Up
                      </span>
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Floor Mission Details & Deploy Button (5 Cols) */}
        <div className="lg:col-span-5 bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DEC8]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  Floor {selectedFloor} Intel
                </span>
                <h3 className="text-lg font-black font-serif text-[#2E1F0F] mt-1">
                  {isBossFloor ? `Floor ${selectedFloor} Boss Challenge` : `Floor ${selectedFloor} Guardian Trial`}
                </h3>
              </div>

              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-bold">
                {floorElement === 'FIRE' && <Flame className="w-5 h-5 text-orange-600" />}
                {floorElement === 'WATER' && <Droplets className="w-5 h-5 text-blue-600" />}
                {floorElement === 'GRASS' && <Leaf className="w-5 h-5 text-emerald-600" />}
                {floorElement === 'LIGHT' && <Sun className="w-5 h-5 text-amber-500" />}
                {floorElement === 'DARK' && <Moon className="w-5 h-5 text-purple-600" />}
              </div>
            </div>

            {/* Recommended Power & Stamina Cost */}
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF6ED] border border-[#D5C29E]">
                <span className="text-[10px] font-bold text-[#78654E] block">Energy Cost</span>
                <span className="font-mono font-black text-emerald-700 text-sm">0 Energy (FREE)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF6ED] border border-[#D5C29E]">
                <span className="text-[10px] font-bold text-[#78654E] block">Rec. Squad Power</span>
                <span className="font-mono font-black text-amber-700 text-sm">
                  {recommendedPower.toLocaleString()} CP
                </span>
              </div>
            </div>

            {/* Floor Rewards */}
            <div className="mt-3 p-3 rounded-2xl bg-[#FFFBEB] border border-[#FCD34D] space-y-1.5">
              <span className="text-[10px] font-black uppercase text-[#92400E] block tracking-wide">
                First-Clear Floor Rewards
              </span>
              <div className="flex items-center gap-3 text-xs font-bold text-[#78350F]">
                <div className="flex items-center gap-1">
                  <Gem className="w-3.5 h-3.5 text-purple-600" />
                  <span>+{isBossFloor ? MILESTONE_REWARDS[selectedFloor]?.gems || 100 : 10} Gems</span>
                </div>
                <div className="flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <span>+{isBossFloor ? (MILESTONE_REWARDS[selectedFloor]?.gold || 20000).toLocaleString() : (3000 + selectedFloor * 300).toLocaleString()} Gold</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+20 SP</span>
                </div>
              </div>
            </div>

            {/* Active Squad Preview */}
            <div className="mt-3">
              <span className="text-[10px] font-black uppercase text-[#78654E] block mb-1.5 tracking-wide">
                Your Deployed Formation (5 Units)
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {profile.activeParty?.slice(0, 5).map((id) => {
                  const m = monsters.find((item) => item.instanceId === id);
                  if (!m) return null;
                  const v = MONSTER_VARIANTS[m.variantId];
                  return (
                    <div
                      key={id}
                      className="w-10 h-10 rounded-xl border border-[#2E1F0F] bg-amber-100 overflow-hidden shrink-0 shadow-2xs"
                      title={v?.name || 'Party Monster'}
                    >
                      <MonsterAvatar variantId={m.variantId} element={v?.element} size="sm" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Deploy Button */}
          <div>
            {isSelectedFloorCleared ? (
              <button
                onClick={handleLaunchFloor}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-transform active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Replay Floor {selectedFloor}</span>
              </button>
            ) : isSelectedFloorUnlocked ? (
              <button
                onClick={handleLaunchFloor}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95 animate-pulse"
              >
                <Swords className="w-4 h-4" />
                <span>Challenge Floor {selectedFloor}</span>
              </button>
            ) : (
              <div className="w-full py-3 rounded-2xl bg-gray-200 border border-gray-300 text-gray-500 font-bold text-xs flex items-center justify-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>Clear Preceding Floors to Unlock</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
