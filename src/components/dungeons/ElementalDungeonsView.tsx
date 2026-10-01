/**
 * Monster Realms - 6 Elemental Awakening Dungeons View
 * 
 * 6 Elemental Dungeons:
 * - Hall of Fire
 * - Hall of Water
 * - Hall of Grass (Wind)
 * - Hall of Light
 * - Hall of Dark
 * - Hall of Magic
 * 
 * 10 Difficulty Levels per dungeon (Floor 1 / B1 to Floor 10 / B10).
 * Each level has 3 fights in a row (Wave 1, Wave 2, Wave 3: Boss + Crystals) without healing.
 * 
 * Summoners War Unique Boss Mechanics:
 * - Water: Colossal HP, takes 300% amplified damage from Continuous Damage (DoTs/Poison/Burn)
 * - Fire: Bomb Crystal & stacking burns; cleanse or burst before detonation
 * - Grass: Recovery Totem heals 40% HP; requires Heal Block or high burst
 * - Light: Ironclad Defense (+400%); requires Defense Break or True Damage
 * - Dark: Stacking Poison & execute extra turns; requires Cleanse & Immunity
 * - Magic: Dual Power/Disruption Crystals; drops universal Magic Stones
 */

import React, { useState } from 'react';
import {
  Flame,
  Droplets,
  Leaf,
  Sun,
  Moon,
  Sparkles,
  Shield,
  Zap,
  Crown,
  Swords,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Layers,
  Info,
  Skull,
  Play,
  ArrowRight,
  Compass,
} from 'lucide-react';
import {
  ElementalDungeonType,
  ElementalStonesInventory,
  PlayerProfile,
  PvEStage,
} from '../../types';
import {
  ELEMENTAL_DUNGEONS,
  ELEMENTAL_DUNGEON_STAGES,
  ElementalDungeonInfo,
} from '../../data/elementalDungeons';
import { MONSTER_VARIANTS } from '../../data/monsters';
import { MonsterAvatar } from '../MonsterAvatar';
import { isStageUnlocked } from '../../data/stages';

interface ElementalDungeonsViewProps {
  profile: PlayerProfile;
  stages: PvEStage[];
  onSelectStageForBattle: (stage: PvEStage) => void;
  onNavigateToAwakening?: () => void;
}

export const ElementalDungeonsView: React.FC<ElementalDungeonsViewProps> = ({
  profile,
  stages,
  onSelectStageForBattle,
  onNavigateToAwakening,
}) => {
  const [selectedDungeonId, setSelectedDungeonId] = useState<ElementalDungeonType>('FIRE');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);

  const activeDungeon: ElementalDungeonInfo = ELEMENTAL_DUNGEONS[selectedDungeonId];
  const activeBossVariant = MONSTER_VARIANTS[activeDungeon.bossVariantId] || Object.values(MONSTER_VARIANTS)[0];
  const completedStages = profile?.completedStages || [];

  // Filter 10 floors for the selected dungeon
  const dungeonStages = ELEMENTAL_DUNGEON_STAGES.filter(
    (s) => s.elementalDungeonType === selectedDungeonId
  );

  const currentStage =
    dungeonStages.find((s) => s.dungeonLevel === selectedFloor) || dungeonStages[0];

  const isUnlocked = isStageUnlocked(currentStage.stageId, completedStages);
  const isCompleted = completedStages.includes(currentStage.stageId);
  const starsEarned = profile?.stageStars?.[currentStage.stageId] || (isCompleted ? 3 : 0);
  const playerEnergy = profile?.currencies?.energy ?? 0;
  const hasEnoughEnergy = playerEnergy >= currentStage.energyCost;

  // Stash of stones
  const stonesInv: ElementalStonesInventory = profile?.elementalStones || {
    FIRE: { small: 0, medium: 0, huge: 0 },
    WATER: { small: 0, medium: 0, huge: 0 },
    GRASS: { small: 0, medium: 0, huge: 0 },
    LIGHT: { small: 0, medium: 0, huge: 0 },
    DARK: { small: 0, medium: 0, huge: 0 },
    MAGIC: { small: 0, medium: 0, huge: 0 },
  };

  const getDungeonTabIcon = (id: ElementalDungeonType) => {
    switch (id) {
      case 'FIRE':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'WATER':
        return <Droplets className="w-4 h-4 text-sky-400" />;
      case 'GRASS':
        return <Leaf className="w-4 h-4 text-emerald-400" />;
      case 'LIGHT':
        return <Sun className="w-4 h-4 text-amber-400" />;
      case 'DARK':
        return <Moon className="w-4 h-4 text-purple-400" />;
      case 'MAGIC':
        return <Sparkles className="w-4 h-4 text-fuchsia-400" />;
    }
  };

  const getStoneColor = (type: ElementalDungeonType) => {
    switch (type) {
      case 'FIRE':
        return 'text-red-500 bg-red-950/40 border-red-500/30';
      case 'WATER':
        return 'text-sky-400 bg-sky-950/40 border-sky-500/30';
      case 'GRASS':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
      case 'LIGHT':
        return 'text-amber-400 bg-amber-950/40 border-amber-500/30';
      case 'DARK':
        return 'text-purple-400 bg-purple-950/40 border-purple-500/30';
      case 'MAGIC':
        return 'text-fuchsia-400 bg-fuchsia-950/40 border-fuchsia-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════
          HEADER BANNER: 6 Elemental Halls of Awakening
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-950 via-stone-900 to-slate-900 border-2 border-[#D5C29E] shadow-xl text-amber-50">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Awakening Sanctums • 10 Difficulty Floors
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-wide">
            The 6 Elemental Awakening Dungeons
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
            Delve into the 6 Elemental Halls: <strong className="text-red-400">Fire</strong>,{' '}
            <strong className="text-sky-400">Water</strong>,{' '}
            <strong className="text-emerald-400">Grass</strong>,{' '}
            <strong className="text-purple-400">Dark</strong>,{' '}
            <strong className="text-amber-300">Light</strong>, and{' '}
            <strong className="text-fuchsia-400">Magic</strong>. Each floor features{' '}
            <span className="text-amber-300 font-bold">3 consecutive fights without healing</span>,
            culminating in a boss encounter with unique Summoners War mechanics! Conquer Floor B10 to harvest{' '}
            <span className="text-amber-300 font-bold">Small, Medium, and Huge Elemental Stones</span> needed to Awaken your monsters!
          </p>
        </div>

        {/* Floating Ambient Stone Icons */}
        <div className="absolute right-4 -bottom-6 opacity-10 text-9xl font-serif pointer-events-none select-none">
          🔮
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ELEMENTAL STONES INVENTORY STASH BAR
          ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black font-serif text-[#2E1F0F]">Your Awakening Stones Stash</span>
            <span className="text-[11px] text-[#78654E] font-medium">(Used in Monsters screen to Awaken)</span>
          </div>
          {onNavigateToAwakening && (
            <button
              onClick={onNavigateToAwakening}
              className="text-xs font-black text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Go to Monster Awakening</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {(['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK', 'MAGIC'] as ElementalDungeonType[]).map((el) => {
            const counts = stonesInv[el] || { small: 0, medium: 0, huge: 0 };
            return (
              <div
                key={el}
                className={`p-2.5 rounded-xl border flex flex-col gap-1 ${getStoneColor(el)}`}
              >
                <div className="flex items-center justify-between text-xs font-black">
                  <div className="flex items-center gap-1">
                    {getDungeonTabIcon(el)}
                    <span>{el}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 text-center text-[10px] font-mono mt-1 gap-1">
                  <div className="bg-black/20 rounded px-1 py-0.5" title="Small Stones (Low & Mid tiers)">
                    <span className="text-stone-300 block text-[8px] uppercase">Sm</span>
                    <span className="font-bold">{counts.small}</span>
                  </div>
                  <div className="bg-black/20 rounded px-1 py-0.5" title="Medium Stones (All tiers)">
                    <span className="text-stone-300 block text-[8px] uppercase">Med</span>
                    <span className="font-bold">{counts.medium}</span>
                  </div>
                  <div className="bg-amber-400/20 rounded px-1 py-0.5 border border-amber-400/30" title="Huge Stones (Epic & Legendary tiers only!)">
                    <span className="text-amber-300 block text-[8px] uppercase font-black">Huge</span>
                    <span className="font-black text-amber-300">{counts.huge}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          6 ELEMENTAL DUNGEONS SELECTOR TABS
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {(Object.keys(ELEMENTAL_DUNGEONS) as ElementalDungeonType[]).map((dungeonKey) => {
          const dungeon = ELEMENTAL_DUNGEONS[dungeonKey];
          const isSelected = selectedDungeonId === dungeonKey;

          return (
            <button
              key={dungeonKey}
              onClick={() => {
                setSelectedDungeonId(dungeonKey);
                setSelectedFloor(1);
              }}
              className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between group ${
                isSelected
                  ? 'bg-gradient-to-br from-[#2E1F0F] to-stone-900 border-[#F59E0B] text-white shadow-md ring-2 ring-amber-400/40 scale-[1.02]'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-[#2E1F0F] text-[#2E1F0F] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-black/10 border border-[#2E1F0F]/20 flex items-center justify-center shrink-0">
                  {getDungeonTabIcon(dungeonKey)}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-amber-400/20 text-amber-300' : 'bg-stone-200 text-[#5C4A34]'
                }`}>
                  10 Floors
                </span>
              </div>

              <div className="mt-2 min-w-0">
                <h3 className={`font-black text-sm font-serif truncate ${
                  isSelected ? 'text-amber-300' : 'text-[#2E1F0F]'
                }`}>
                  {dungeon.name}
                </h3>
                <span className={`text-[11px] block truncate ${
                  isSelected ? 'text-stone-300' : 'text-[#78654E]'
                }`}>
                  {dungeon.stoneName}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ACTIVE DUNGEON DETAIL & 10 FLOORS PROGRESSION
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 10 Difficulty Floors List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black font-serif text-[#2E1F0F] flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              <span>{activeDungeon.name} Floors (B1 to B10)</span>
            </h2>
            <span className="text-xs text-[#78654E] font-medium">3 Fights Per Floor • No Healing</span>
          </div>

          <div className="space-y-2.5">
            {dungeonStages.map((stage) => {
              const floorNum = stage.dungeonLevel || 1;
              const isFloorUnlocked = isStageUnlocked(stage.stageId, completedStages);
              const isFloorCompleted = completedStages.includes(stage.stageId);
              const isSelected = selectedFloor === floorNum;
              const isB10 = floorNum === 10;

              return (
                <div
                  key={stage.stageId}
                  onClick={() => setSelectedFloor(floorNum)}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-[#F59E0B] bg-[#FFFBEB] ring-2 ring-amber-300/50 shadow-md'
                      : isFloorUnlocked
                      ? 'border-[#2E1F0F] bg-[#FFFDF9] hover:bg-[#FAF6ED] shadow-xs'
                      : 'border-stone-300 bg-stone-100/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Floor Badge */}
                    <div
                      className={`w-11 h-11 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 font-serif font-black ${
                        isB10
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-[#2E1F0F] text-[#2E1F0F] shadow-sm animate-pulse'
                          : isFloorCompleted
                          ? 'bg-emerald-500 border-[#2E1F0F] text-white'
                          : isFloorUnlocked
                          ? 'bg-[#2E1F0F] border-[#2E1F0F] text-amber-300'
                          : 'bg-stone-300 border-stone-400 text-stone-500'
                      }`}
                    >
                      <span className="text-[10px] leading-none uppercase">B</span>
                      <span className="text-base leading-none">{floorNum}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm font-serif text-[#2E1F0F]">
                          {stage.name}
                        </span>
                        {isB10 && (
                          <span className="bg-amber-500 text-[#2E1F0F] text-[9px] font-black uppercase px-2 py-0.2 rounded-full border border-[#2E1F0F] tracking-wide">
                            Huge Stones Guaranteed!
                          </span>
                        )}
                        {isFloorCompleted && (
                          <div className="flex items-center text-amber-500 text-xs">
                            {'★'.repeat(profile?.stageStars?.[stage.stageId] || 3)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#5C4A34] mt-0.5">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Zap className="w-3 h-3 text-emerald-600" />
                          {stage.energyCost} Energy
                        </span>
                        <span className="text-stone-400">•</span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Swords className="w-3 h-3 text-amber-600" />
                          Rec. Power: {stage.recommendedPower.toLocaleString()}
                        </span>
                        <span className="text-stone-400">•</span>
                        <span className="text-[11px] font-semibold text-purple-700">
                          {floorNum <= 3
                            ? 'Small Stones'
                            : floorNum <= 6
                            ? 'Small + Medium'
                            : floorNum <= 9
                            ? 'Medium + Huge'
                            : 'Small + Med + Huge!'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Select Indicator */}
                  <div className="flex items-center justify-end gap-2 shrink-0">
                    {isFloorUnlocked ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFloor(floorNum);
                          onSelectStageForBattle(stage);
                        }}
                        disabled={!hasEnoughEnergy && isSelected}
                        className={`px-4 py-2 rounded-xl font-black text-xs font-serif flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#2E1F0F] border-2 border-[#2E1F0F] shadow-sm'
                            : 'bg-[#FFFDF9] hover:bg-amber-100 border border-[#2E1F0F] text-[#2E1F0F]'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Battle</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-stone-500 font-bold px-3 py-1.5 rounded-xl bg-stone-200/60 border border-stone-300">
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Floor Intel & Boss Tactical HUD (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            {/* Header: Boss Preview */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2E1F0F] to-stone-900 border-2 border-[#2E1F0F] flex items-center justify-center shrink-0 overflow-hidden shadow-sm relative">
                <MonsterAvatar
                  variantId={activeDungeon.bossVariantId}
                  element={activeDungeon.element === 'MAGIC' ? 'LIGHT' : activeDungeon.element}
                  size="md"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 right-0 bg-[#2E1F0F] text-amber-300 text-[9px] font-black px-1 rounded-tl">
                  BOSS
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-amber-700 font-mono tracking-wider">
                    {activeDungeon.bossTitle}
                  </span>
                  <span className="bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] text-[10px] font-black px-1.5 py-0.2 rounded font-mono">
                    Floor B{selectedFloor}
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#2E1F0F] font-serif truncate">
                  {activeDungeon.bossName}
                </h3>
                <span className="text-xs text-[#5C4A34] block">
                  3 Waves: 2 Vanguard fights, then Boss + Dual Crystals
                </span>
              </div>
            </div>

            {/* Boss Summoners War Signature Mechanics Card */}
            <div className="p-4 rounded-2xl bg-[#FAF5FF] border-2 border-[#D8B4FE] space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-900">
                <Crown className="w-4 h-4 text-purple-600" />
                <span>Summoners War Boss Mechanic</span>
              </div>
              <h4 className="font-black text-sm text-[#2E1F0F] font-serif">
                {activeDungeon.bossMechanicTitle}
              </h4>
              <p className="text-xs text-[#5C4A34] leading-relaxed">
                {activeDungeon.bossMechanicDescription}
              </p>
            </div>

            {/* Dual Crystals (Left & Right Towers) Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-black font-serif text-[#2E1F0F] block">
                Wave 3 Dual Towers (Summoners War Style)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Left Tower */}
                <div className="p-3 rounded-xl border border-stone-300 bg-[#FFFDF9]">
                  <div className="flex items-center gap-1.5 font-black text-[#2E1F0F]">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>{activeDungeon.leftTowerName}</span>
                  </div>
                  <p className="text-[11px] text-[#5C4A34] mt-1 leading-normal">
                    {activeDungeon.leftTowerDescription}
                  </p>
                </div>

                {/* Right Tower */}
                <div className="p-3 rounded-xl border border-stone-300 bg-[#FFFDF9]">
                  <div className="flex items-center gap-1.5 font-black text-[#2E1F0F]">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>{activeDungeon.rightTowerName}</span>
                  </div>
                  <p className="text-[11px] text-[#5C4A34] mt-1 leading-normal">
                    {activeDungeon.rightTowerDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Strategy Tips */}
            <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-emerald-300 text-xs text-[#065F46] space-y-1">
              <div className="flex items-center gap-1.5 font-black">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recommended Strategy</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {activeDungeon.strategyTips}
              </p>
            </div>

            {/* Dropped Stone Scaling Breakdown for this Floor */}
            <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B] text-xs text-[#92400E] space-y-1.5">
              <div className="flex items-center justify-between font-black">
                <span>Floor B{selectedFloor} Drop Potential</span>
                <span className="font-mono text-[11px] bg-amber-200/80 px-2 py-0.5 rounded">
                  {selectedFloor === 10 ? '★ GUARANTEED HUGE ★' : `Floor ${selectedFloor} Tier`}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {selectedFloor <= 3
                  ? `Drops mostly Small ${activeDungeon.stoneName}s and Small Magic Stones.`
                  : selectedFloor <= 6
                  ? `Drops Small and Medium ${activeDungeon.stoneName}s and Magic Stones.`
                  : selectedFloor <= 9
                  ? `Drops Medium ${activeDungeon.stoneName}s with a solid chance for Huge Stones.`
                  : `Floor B10 guarantees Small, Medium, AND Huge ${activeDungeon.stoneName}s + Magic Stones!`}
              </p>
            </div>

            {/* Big Launch Battle Button */}
            <button
              onClick={() => onSelectStageForBattle(currentStage)}
              disabled={!isUnlocked || !hasEnoughEnergy}
              className={`w-full py-4 rounded-2xl font-black font-serif text-base shadow-md cursor-pointer transition-all flex items-center justify-center gap-2.5 ${
                !isUnlocked
                  ? 'bg-stone-300 text-stone-500 border-2 border-stone-400 cursor-not-allowed'
                  : !hasEnoughEnergy
                  ? 'bg-stone-200 text-stone-500 border-2 border-stone-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-[#2E1F0F] border-2 border-[#2E1F0F] hover:shadow-lg active:scale-[0.99]'
              }`}
            >
              <Swords className="w-5 h-5 text-[#2E1F0F]" />
              <span>
                {!isUnlocked
                  ? `Floor B${selectedFloor} Locked (Clear B${selectedFloor - 1} First)`
                  : !hasEnoughEnergy
                  ? `Insufficient Energy (${playerEnergy}/${currentStage.energyCost})`
                  : `Start Battle: Floor B${selectedFloor} (${currentStage.energyCost} Energy)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
