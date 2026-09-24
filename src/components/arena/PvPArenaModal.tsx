/**
 * Monster Realms - PvP Arena & Sparring Modal
 * Allows players to challenge Rival Summoner Guardians or spar with friends.
 */

import React, { useState } from 'react';
import {
  Swords,
  Shield,
  Trophy,
  Users,
  X,
  Flame,
  Sparkles,
  ChevronRight,
  Crown,
  Award,
} from 'lucide-react';
import { PlayerProfile, PvEStage } from '../../types';
import { MONSTER_VARIANTS } from '../../data/monsters';

interface PvPArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPvPBattle: (stage: PvEStage) => void;
  onNavigateToFriends: () => void;
  profile: PlayerProfile;
}

interface RivalGuardian {
  id: string;
  name: string;
  title: string;
  rank: 'BRONZE' | 'SILVER' | 'GOLD' | 'MASTER';
  rankColor: string;
  recommendedPower: number;
  monsters: { variantId: string; level: number; awakeningStage?: 'BASE' | 'AWAKENED' }[];
  rewardGold: number;
  rewardExp: number;
}

const RIVAL_GUARDIANS: RivalGuardian[] = [
  {
    id: 'rival_bronze_leo',
    name: 'Apprentice Leo',
    title: 'Wandering Elementalist',
    rank: 'BRONZE',
    rankColor: 'from-amber-700 to-amber-900 border-amber-600',
    recommendedPower: 1200,
    rewardGold: 100,
    rewardExp: 40,
    monsters: [
      { variantId: 'pyrosaur_fire', level: 5 },
      { variantId: 'tideguard_water', level: 5 },
      { variantId: 'floraweaver_grass', level: 4 },
      { variantId: 'luminary_light', level: 4 },
    ],
  },
  {
    id: 'rival_silver_nadia',
    name: 'Tactician Nadia',
    title: 'Crest Scholar',
    rank: 'SILVER',
    rankColor: 'from-slate-400 to-slate-600 border-slate-300',
    recommendedPower: 3500,
    rewardGold: 220,
    rewardExp: 80,
    monsters: [
      { variantId: 'floraweaver_grass', level: 12 },
      { variantId: 'luminary_light', level: 12 },
      { variantId: 'pyrosaur_fire', level: 11 },
      { variantId: 'shadowstalker_dark', level: 11 },
      { variantId: 'tideguard_water', level: 11 },
    ],
  },
  {
    id: 'rival_gold_zephyr',
    name: 'Champion Zephyr',
    title: 'Skyward Vanguard',
    rank: 'GOLD',
    rankColor: 'from-amber-400 to-yellow-600 border-yellow-300',
    recommendedPower: 8000,
    rewardGold: 450,
    rewardExp: 160,
    monsters: [
      { variantId: 'shadowstalker_dark', level: 22, awakeningStage: 'AWAKENED' },
      { variantId: 'pyrosaur_fire', level: 22, awakeningStage: 'AWAKENED' },
      { variantId: 'luminary_light', level: 21 },
      { variantId: 'tideguard_water', level: 21 },
      { variantId: 'floraweaver_grass', level: 20 },
    ],
  },
  {
    id: 'rival_master_ignis',
    name: 'Archmage Ignis',
    title: 'Grand Flame Sovereign',
    rank: 'MASTER',
    rankColor: 'from-purple-600 to-indigo-900 border-purple-400',
    recommendedPower: 16000,
    rewardGold: 900,
    rewardExp: 350,
    monsters: [
      { variantId: 'pyrosaur_fire', level: 35, awakeningStage: 'AWAKENED' },
      { variantId: 'luminary_light', level: 35, awakeningStage: 'AWAKENED' },
      { variantId: 'shadowstalker_dark', level: 34, awakeningStage: 'AWAKENED' },
      { variantId: 'tideguard_water', level: 34, awakeningStage: 'AWAKENED' },
      { variantId: 'floraweaver_grass', level: 34, awakeningStage: 'AWAKENED' },
    ],
  },
];

export const PvPArenaModal: React.FC<PvPArenaModalProps> = ({
  isOpen,
  onClose,
  onStartPvPBattle,
  onNavigateToFriends,
  profile,
}) => {
  const [activeTab, setActiveTab] = useState<'RIVALS' | 'FRIENDS'>('RIVALS');

  if (!isOpen) return null;

  const handleChallengeRival = (rival: RivalGuardian) => {
    const pvpStage: PvEStage = {
      stageId: `pvp_${rival.id}_${Date.now()}`,
      continentId: 'pvp_arena',
      chapter: 1,
      stageNumber: 1,
      name: `PvP Duel: ${rival.name}`,
      element: 'FIRE',
      energyCost: 5,
      recommendedPower: rival.recommendedPower,
      description: `Tactical 5v5 PvP duel against ${rival.name} (${rival.title}) in the Grand Arena.`,
      enemyVariants: rival.monsters.map((m, idx) => ({
        variantId: m.variantId,
        level: m.level,
        slotIndex: idx,
        awakeningStage: m.awakeningStage || 'BASE',
      })),
      firstClearRewards: {
        gold: rival.rewardGold * 2,
        gems: 10,
        summonPoints: 20,
      },
      repeatRewards: {
        gold: rival.rewardGold,
        exp: rival.rewardExp,
      },
    };

    onClose();
    onStartPvPBattle(pvpStage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-[#2E1F0F] bg-[#FAF3E3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FBBF24] border-2 border-[#2E1F0F] flex items-center justify-center shadow-xs">
              <Swords className="w-5 h-5 text-[#2E1F0F]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-serif text-[#2E1F0F] tracking-wide">
                GRAND PVP ARENA
              </h2>
              <p className="text-xs text-[#78654E]">
                Test your 5-monster battle formation against rival summoners
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#FFFDF9] border-2 border-[#2E1F0F] flex items-center justify-center text-[#2E1F0F] hover:bg-[#FAF6ED] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-4 border-b border-[#E8DEC8]">
          <button
            onClick={() => setActiveTab('RIVALS')}
            className={`px-4 py-2 font-black text-xs sm:text-sm font-serif rounded-t-xl border-t-2 border-x-2 transition-all cursor-pointer ${
              activeTab === 'RIVALS'
                ? 'bg-[#FFFDF9] border-[#2E1F0F] text-[#2E1F0F] -mb-[2px] pb-2.5'
                : 'border-transparent text-[#78654E] hover:text-[#2E1F0F]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>Rival Summoners</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('FRIENDS')}
            className={`px-4 py-2 font-black text-xs sm:text-sm font-serif rounded-t-xl border-t-2 border-x-2 transition-all cursor-pointer ${
              activeTab === 'FRIENDS'
                ? 'bg-[#FFFDF9] border-[#2E1F0F] text-[#2E1F0F] -mb-[2px] pb-2.5'
                : 'border-transparent text-[#78654E] hover:text-[#2E1F0F]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Friendly Sparring (0 Cost)</span>
            </div>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {activeTab === 'RIVALS' && (
            <div className="space-y-3">
              <div className="text-xs text-[#78654E] flex items-center justify-between">
                <span>Select a tier to challenge:</span>
                <span className="font-mono font-bold text-[#B45309]">Cost: 5 Energy / match</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RIVAL_GUARDIANS.map((rival) => (
                  <div
                    key={rival.id}
                    className="p-4 rounded-2xl bg-white border-2 border-[#2E1F0F] flex flex-col justify-between gap-3 shadow-xs hover:border-amber-500 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white bg-gradient-to-r border ${rival.rankColor}`}
                        >
                          Rank: {rival.rank}
                        </span>
                        <span className="text-[11px] font-mono text-[#78654E]">
                          Power: ~{rival.recommendedPower} CP
                        </span>
                      </div>
                      <h4 className="text-base font-black font-serif text-[#2E1F0F]">
                        {rival.name}
                      </h4>
                      <p className="text-xs text-[#78654E]">{rival.title}</p>

                      <div className="mt-2.5 pt-2 border-t border-[#E8DEC8] flex items-center justify-between text-[11px] text-[#78654E]">
                        <span>Squad Size: {rival.monsters.length} Units</span>
                        <span className="text-amber-700 font-bold font-mono">
                          +{rival.rewardGold} G • +{rival.rewardExp} EXP
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleChallengeRival(rival)}
                      className="w-full py-2 px-3 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] border-2 border-[#2E1F0F] text-[#2E1F0F] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-transform active:scale-95"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Challenge Duel</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'FRIENDS' && (
            <div className="p-6 rounded-2xl bg-white border-2 border-[#2E1F0F] text-center space-y-4 shadow-inner">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 border-2 border-emerald-600 mx-auto flex items-center justify-center text-emerald-700 shadow-xs">
                <Users className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-black font-serif text-[#2E1F0F]">
                  Friendly Sparring Duels
                </h3>
                <p className="text-xs text-[#78654E] max-w-md mx-auto mt-1 leading-relaxed">
                  Spar with registered friends to test tactical combinations against their active defense squads. Friendly duels cost 0 Energy and award 0 gold or experience.
                </p>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onNavigateToFriends();
                }}
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 border-2 border-[#2E1F0F] shadow-sm cursor-pointer"
              >
                <span>Open Friends Roster & Spar</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
