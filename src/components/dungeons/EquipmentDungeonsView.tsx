/**
 * Monster Realms - Equipment Dungeons View
 * 4 Specialized Dungeons: Weapon, Armor, Helm, Boots
 * Each dungeon has 3 Levels (2 normal fights then boss fight) with unique boss mechanics.
 */

import React, { useState } from 'react';
import {
  Swords,
  Shield,
  Crown,
  Zap,
  Flame,
  Droplets,
  Leaf,
  Sun,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  Skull,
  Award,
  Play,
} from 'lucide-react';
import { PlayerProfile, PvEStage } from '../../types';
import { EQUIPMENT_DUNGEON_INFOS, EquipmentDungeonInfo, isStageUnlocked } from '../../data/stages';
import { MONSTER_VARIANTS } from '../../data/monsters';
import { MonsterAvatar } from '../MonsterAvatar';
import { ELEMENT_VISUALS } from '../../data/elements';

interface EquipmentDungeonsViewProps {
  profile: PlayerProfile;
  stages: PvEStage[];
  onSelectStageForBattle: (stage: PvEStage) => void;
}

export const EquipmentDungeonsView: React.FC<EquipmentDungeonsViewProps> = ({
  profile,
  stages,
  onSelectStageForBattle,
}) => {
  const [selectedDungeonId, setSelectedDungeonId] = useState<'WEAPON' | 'ARMOR' | 'HELM' | 'BOOTS'>('WEAPON');
  const [selectedLevel, setSelectedLevel] = useState<number>(1); // Default to Level 1

  const activeDungeon: EquipmentDungeonInfo = EQUIPMENT_DUNGEON_INFOS[selectedDungeonId];
  const activeBossVariant = MONSTER_VARIANTS[activeDungeon.bossVariantId];
  const completedStages = profile?.completedStages || [];

  const currentLevelStage = activeDungeon.stages.find((s) => s.dungeonLevel === selectedLevel) || activeDungeon.stages[0];
  const isUnlocked = isStageUnlocked(currentLevelStage.stageId, completedStages);
  const isCompleted = completedStages.includes(currentLevelStage.stageId);
  const starsEarned = profile?.stageStars?.[currentLevelStage.stageId] || (isCompleted ? 3 : 0);
  const playerEnergy = profile?.currencies?.energy ?? 0;
  const hasEnoughEnergy = playerEnergy >= currentLevelStage.energyCost;

  const handleStartStage = (stageToStart: PvEStage) => {
    onSelectStageForBattle(stageToStart);
  };

  const getDungeonSlotIcon = (id: 'WEAPON' | 'ARMOR' | 'HELM' | 'BOOTS') => {
    switch (id) {
      case 'WEAPON':
        return '⚔️';
      case 'ARMOR':
        return '🛡️';
      case 'HELM':
        return '🪖';
      case 'BOOTS':
        return '🥾';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-stone-900 to-slate-950 border-2 border-[#D5C29E] shadow-xl text-amber-50">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            Specialized Equipment Dungeons
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-wide">
            The Elemental Forges of Destiny
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
            Delve into 4 dedicated gear sanctums. Conquer 3 challenging levels — featuring 2 normal enemy waves followed by devastating boss encounters with lethal mechanics — to harvest legendary weapons, armors, helms, and boots!
          </p>
        </div>

        {/* Ambient Decorative Watermark */}
        <div className="absolute right-4 -bottom-6 opacity-10 text-9xl font-serif pointer-events-none select-none">
          ⚔️
        </div>
      </div>

      {/* 4 Dungeon Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {(Object.keys(EQUIPMENT_DUNGEON_INFOS) as Array<'WEAPON' | 'ARMOR' | 'HELM' | 'BOOTS'>).map((dId) => {
          const dungeon = EQUIPMENT_DUNGEON_INFOS[dId];
          const isSelected = dId === selectedDungeonId;
          const clearedCount = dungeon.stages.filter((s) => completedStages.includes(s.stageId)).length;

          return (
            <button
              key={dId}
              onClick={() => {
                setSelectedDungeonId(dId);
                // Keep same level or reset to 1 if not cleared
              }}
              className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                isSelected
                  ? 'border-amber-400 bg-gradient-to-b from-[#FFFBEB] to-[#FFF7ED] shadow-lg ring-2 ring-amber-400/50 scale-[1.02]'
                  : 'border-[#D5C29E] bg-[#FFFDF9] hover:border-amber-400/70 hover:shadow-md'
              }`}
            >
              {/* Top Row: Slot Emoji & Cleared Badge */}
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getDungeonSlotIcon(dId)}</span>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-900 font-serif">
                    {dungeon.slotName}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    clearedCount === 3
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : clearedCount > 0
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  {clearedCount}/3 Cleared
                </span>
              </div>

              {/* Dungeon Title */}
              <div>
                <h3 className="text-sm font-black text-[#2E1F0F] font-serif group-hover:text-amber-800 transition-colors">
                  {dungeon.name}
                </h3>
                <p className="text-[11px] text-[#78654E] mt-0.5 line-clamp-1">
                  Boss: {dungeon.bossName}
                </p>
              </div>

              {/* Mechanic Tag */}
              <div className="mt-3 pt-2 border-t border-[#E8DEC8] flex items-center justify-between text-[10px]">
                <span className="font-semibold text-rose-800 truncate max-w-[170px]">
                  ⚠️ {dungeon.bossMechanicTitle}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-0.5 text-amber-600' : 'text-stone-400'}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Dungeon Detail Stage & Boss Chamber */}
      <div className="fantasy-plate p-5 sm:p-7 shadow-lg space-y-6">
        {/* Active Dungeon Header & Lore */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E8DEC8] pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shadow-inner shrink-0">
              {getDungeonSlotIcon(activeDungeon.id)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-900 uppercase">
                  {activeDungeon.element} Element
                </span>
                <span className="text-xs font-bold text-amber-800">
                  Target Drops: <strong>{activeDungeon.slotName}</strong>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#2E1F0F] font-serif mt-1">
                {activeDungeon.name}
              </h2>
              <p className="text-xs text-[#5C4A34] max-w-2xl mt-1 leading-relaxed">
                {activeDungeon.lore}
              </p>
            </div>
          </div>

          {/* Boss Portrait Preview & Header Quick-Start */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            {activeBossVariant && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] border border-amber-300 shadow-2xs">
                <MonsterAvatar
                  variantId={activeBossVariant.variantId}
                  element={activeBossVariant.element}
                  variant={activeBossVariant}
                  size="md"
                />
                <div className="pr-2">
                  <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                    Chamber Overlord
                  </div>
                  <div className="text-xs font-black text-[#2E1F0F] font-serif">
                    {activeBossVariant.name}
                  </div>
                  <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
                    6-Star Ascended Boss
                  </div>
                </div>
              </div>
            )}

            {/* Quick Header Start Button */}
            <button
              onClick={() => handleStartStage(currentLevelStage)}
              disabled={!hasEnoughEnergy}
              className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider font-serif shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105 ${
                hasEnoughEnergy
                  ? 'fantasy-btn-gold text-[#2E1F0F] ring-2 ring-amber-400/40'
                  : 'bg-stone-200 text-stone-500 border border-stone-300 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current text-amber-900" />
              <span>START BATTLE</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10">
                ⚡ {currentLevelStage.energyCost}
              </span>
            </button>
          </div>
        </div>

        {/* 3 Level Selector Tabs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black font-serif text-[#2E1F0F] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
              Select Dungeon Level (3 Levels Available)
            </span>
            <span className="text-xs text-[#78654E]">
              Level 3 features 2 normal fights then the Boss Fight!
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeDungeon.stages.map((stage) => {
              const lvl = stage.dungeonLevel || 1;
              const isLvlSelected = lvl === selectedLevel;
              const lvlCompleted = completedStages.includes(stage.stageId);
              const isBossLevel = lvl === 3;

              return (
                <div
                  key={stage.stageId}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isLvlSelected
                      ? 'border-amber-500 bg-gradient-to-b from-[#FFFBEB] to-[#FEF3C7] shadow-md ring-2 ring-amber-400/40'
                      : 'border-[#D5C29E] bg-[#FFFDF9] hover:border-amber-400 hover:shadow-sm'
                  }`}
                >
                  <div>
                    {/* Level Pill & Status */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[11px] font-mono font-black uppercase px-2 py-0.5 rounded-md border ${
                          isBossLevel
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {isBossLevel ? 'Level 3 • Boss Fight' : `Level ${lvl} • Normal Fight`}
                      </span>

                      {lvlCompleted ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-700 font-bold">
                          Ready
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-[#2E1F0F] font-serif">
                      {stage.name}
                    </h4>
                    <p className="text-[11px] text-[#78654E] mt-1 leading-snug">
                      {isBossLevel
                        ? '3 Waves: 2 Normal monster fights, then the Overlord Boss!'
                        : '2 Waves of elemental scouts and guardians.'}
                    </p>
                  </div>

                  {/* Rewards preview & Direct Card START BATTLE Button */}
                  <div className="mt-3 pt-2.5 border-t border-[#E8DEC8] flex items-center justify-between gap-2">
                    <div className="text-[10px] font-mono leading-tight">
                      <div className="text-[#92400E] font-bold">
                        Drop: {isBossLevel ? '⭐ LEGENDARY' : lvl === 2 ? 'EPIC' : 'RARE'} {activeDungeon.slot}
                      </div>
                      <div className="text-[#78654E]">
                        ⚡ {stage.energyCost} Energy Cost
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLevel(lvl);
                        handleStartStage(stage);
                      }}
                      disabled={playerEnergy < stage.energyCost}
                      className="px-3.5 py-1.5 rounded-xl fantasy-btn-gold text-[#2E1F0F] text-xs font-black uppercase tracking-wider font-serif shadow-md hover:scale-105 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Play className="w-3 h-3 fill-current text-[#92400E]" />
                      <span>START</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Level Details & Boss Mechanics Callout */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FAF6ED] to-[#F5EED9] border border-[#D5C29E] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8DEC8] pb-3">
            <div>
              <span className="text-[11px] font-mono font-bold text-amber-800 uppercase tracking-wider">
                Level {selectedLevel} Stage Intel
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#2E1F0F] font-serif">
                {currentLevelStage.name}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#FFFDF9] border border-[#D5C29E] font-mono text-[#78654E]">
                Recommended Power: <strong>{currentLevelStage.recommendedPower.toLocaleString()} CP</strong>
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 font-mono text-amber-900 font-bold">
                ⚡ {currentLevelStage.energyCost} Energy
              </span>
            </div>
          </div>

          {/* Boss Lethal Mechanics Alert Box */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-rose-300 bg-rose-50/80 text-rose-950 flex items-start gap-3 shadow-2xs">
            <Skull className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-black font-serif text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                <span>Lethal Dungeon Mechanics:</span>
                <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 text-[10px] font-sans">
                  {activeDungeon.bossMechanicTitle}
                </span>
              </div>
              <p className="text-rose-900/90 leading-relaxed">
                {currentLevelStage.bossMechanicDescription || activeDungeon.bossMechanicDescription}
              </p>
            </div>
          </div>

          {/* Drops & First Clear Rewards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Guaranteed Gear Drop */}
            <div className="p-3 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8]">
              <div className="text-[11px] font-bold text-[#78654E] uppercase font-serif mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Guaranteed Equipment Drop
              </div>
              <div className="flex items-center gap-2 font-mono font-bold text-[#2E1F0F]">
                <span>{getDungeonSlotIcon(activeDungeon.id)}</span>
                <span className="text-amber-800">
                  {selectedLevel === 3 ? 'LEGENDARY (★★★★★)' : selectedLevel === 2 ? 'EPIC (★★★★)' : 'RARE (★★★)'}{' '}
                  {activeDungeon.slotName.slice(0, -1)}
                </span>
              </div>
              <p className="text-[10px] text-[#78654E] mt-0.5">
                Directly added to your inventory upon victorious completion.
              </p>
            </div>

            {/* First Clear Bounty */}
            <div className="p-3 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8]">
              <div className="text-[11px] font-bold text-[#78654E] uppercase font-serif mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                First-Clear Chamber Bounty
              </div>
              <div className="flex items-center gap-3 font-mono font-bold text-xs text-[#2E1F0F]">
                <span className="text-amber-700">+{currentLevelStage.firstClearRewards.gold.toLocaleString()} G</span>
                <span className="text-blue-700">+{currentLevelStage.firstClearRewards.gems} Gems</span>
                <span className="text-purple-700">+{currentLevelStage.firstClearRewards.summonPoints} SP</span>
              </div>
              <p className="text-[10px] text-[#78654E] mt-0.5">
                Repeat clears grant +{currentLevelStage.repeatRewards.gold} Gold & +{currentLevelStage.repeatRewards.exp} EXP!
              </p>
            </div>
          </div>

          {/* Action Button: Start Dungeon Battle */}
          <div className="pt-3 space-y-2">
            <button
              disabled={!hasEnoughEnergy}
              onClick={() => handleStartStage(currentLevelStage)}
              className={`w-full py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider font-serif shadow-2xl flex items-center justify-center gap-3 cursor-pointer transition-transform hover:scale-[1.01] ${
                hasEnoughEnergy
                  ? 'fantasy-btn-gold text-[#2E1F0F] border-2 border-amber-500/70 ring-4 ring-amber-400/30'
                  : 'bg-stone-300 text-stone-500 border border-stone-400 cursor-not-allowed'
              }`}
            >
              <Play className="w-5 h-5 fill-current text-[#78350F]" />
              <span>
                {hasEnoughEnergy
                  ? `START BATTLE • ${activeDungeon.name.toUpperCase()} (LEVEL ${selectedLevel})`
                  : `INSUFFICIENT ENERGY (⚡ ${currentLevelStage.energyCost} REQUIRED)`}
              </span>
              {hasEnoughEnergy && (
                <span className="px-2.5 py-1 rounded-full bg-amber-900/15 border border-amber-900/30 text-xs font-mono font-black text-[#78350F]">
                  ⚡ {currentLevelStage.energyCost} Energy
                </span>
              )}
            </button>
            <p className="text-center text-xs text-[#78654E]">
              ⚔️ Deploys your active 5v5 battle party against {selectedLevel === 3 ? '2 monster waves + Overlord Boss' : '2 monster waves'}.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Bottom Quick-Start Bar for Immediate Access at any scroll position */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-gradient-to-r from-[#2E1F0F] via-[#3B2211] to-[#2E1F0F] border-2 border-amber-400 text-amber-50 p-3 sm:p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md">
        <div className="min-w-0">
          <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider truncate flex items-center gap-1.5">
            <span>{getDungeonSlotIcon(activeDungeon.id)}</span>
            <span>{activeDungeon.name} • Level {selectedLevel}</span>
          </div>
          <div className="text-xs font-bold text-white truncate">
            {currentLevelStage.name}
          </div>
        </div>

        <button
          onClick={() => handleStartStage(currentLevelStage)}
          disabled={!hasEnoughEnergy}
          className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider font-serif shadow-lg flex items-center gap-2 cursor-pointer shrink-0 transition-transform hover:scale-105 ${
            hasEnoughEnergy
              ? 'fantasy-btn-gold text-[#2E1F0F]'
              : 'bg-stone-400 text-stone-700 cursor-not-allowed'
          }`}
        >
          <Play className="w-4 h-4 fill-current text-[#78350F]" />
          <span>START BATTLE</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10">
            ⚡ {currentLevelStage.energyCost}
          </span>
        </button>
      </div>
    </div>
  );
};
