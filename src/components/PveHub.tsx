/**
 * Monster Realms - Unified PvE Hub
 * Consolidates Campaign World Map and all future PvE Addons & Game Modes
 * under one comprehensive PvE interface.
 */

import React, { useState } from 'react';
import {
  Globe,
  Swords,
  Sparkles,
  Flame,
  Shield,
  Crown,
  Trophy,
  Zap,
  Lock,
  ChevronRight,
  Compass,
  Layers,
  Timer,
  Info,
  Calendar,
  Gift,
  AlertCircle,
} from 'lucide-react';
import { PlayerMonster, PlayerProfile, PvEStage } from '../types';
import { CampaignWorldMap } from './CampaignWorldMap';
import { EquipmentDungeonsView } from './dungeons/EquipmentDungeonsView';

export type PveSubTab = 'CAMPAIGN' | 'DUNGEONS' | 'ADDONS';

interface PveHubProps {
  profile: PlayerProfile;
  monsters: PlayerMonster[];
  stages: PvEStage[];
  initialSubTab?: PveSubTab;
  onSelectStageForBattle: (stage: PvEStage) => void;
  activeBattleStage?: PvEStage | null;
  onNavigateToBattle?: () => void;
}

export const PveHub: React.FC<PveHubProps> = ({
  profile,
  monsters,
  stages,
  initialSubTab = 'CAMPAIGN',
  onSelectStageForBattle,
  activeBattleStage,
  onNavigateToBattle,
}) => {
  const [subTab, setSubTab] = useState<PveSubTab>(initialSubTab);
  const [selectedAddonPreview, setSelectedAddonPreview] = useState<string | null>(null);

  // Sync subTab if initialSubTab prop changes externally
  React.useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Future PvE Addons definition
  const PVE_ADDONS = [
    {
      id: 'elemental_sanctums',
      title: 'Elemental Sanctums',
      subtitle: 'Awakening Stone Gauntlet',
      chapter: 'PvE Expansion • Chapter 2',
      elementTheme: 'from-amber-500 to-rose-600',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: Flame,
      status: 'Coming Soon',
      summary: '5 Rotating elemental dungeons to harvest awakening stones, celestial essences, and attribute crystals.',
      description: 'The elemental ley-lines pulse with raw energy. Venture deep into the Flame Caverns, Abyssal Trench, Ancient Sylvan Canopy, Solaris Citadel, and Umbral Crypt to gather rare awakening materials required to evolve your monsters to 6-star status.',
      features: [
        '5 Unique elemental boss chambers with phase mechanics',
        'Daily double-drop element rotations',
        'Tier 1 through Tier 10 scaling difficulty floors',
        'Guaranteed high-tier elemental essence drops',
      ],
      rewards: ['Awakening Essence', 'Attribute Runes', 'Gold Bundles', 'EXP Elixirs'],
      schedule: 'Daily Rotation (Fire → Water → Grass → Light → Dark)',
    },
    {
      id: 'spire_of_ascension',
      title: 'Spire of Ascension',
      subtitle: '100-Floor Celestial Gauntlet',
      chapter: 'PvE Expansion • Chapter 3',
      elementTheme: 'from-violet-600 to-indigo-700',
      badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
      icon: Crown,
      status: 'In Development',
      summary: 'Monthly resetting challenge tower testing tactical formation limits against brutal modifier stages.',
      description: 'Built by ancient celestial architects, the Spire of Ascension pierces the clouds. Every 10 floors features a legendary boss encounter with special field effects such as continuous burn, silence, or speed distortion.',
      features: [
        '100 Sequential floors with increasing enemy stats & AI tactics',
        'Milestone boss rewards every 10 floors',
        'Monthly season ladder with global rank titles',
        'Zero energy cost for first-time floor clears',
      ],
      rewards: ['Mystic Summoning Scrolls', 'Legendary Gear Chests', 'Gems (up to 3,000)', 'Star Essences'],
      schedule: 'Resets on the 1st of every month',
    },
    {
      id: 'world_boss_raids',
      title: 'Abyssal World Bosses',
      subtitle: 'Colossal Titan Raids',
      chapter: 'PvE Expansion • World Event',
      elementTheme: 'from-emerald-600 to-teal-800',
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      icon: Swords,
      status: 'Planned Addon',
      summary: 'Cooperative realm battles against continent-sized behemoths with multi-squad battle dispatches.',
      description: 'Gigantic primeval titans threaten the balance of the realms. Deploy your primary squad alongside standby reserve units to deal massive cumulative damage and claim server-wide milestone bounties.',
      features: [
        'Multi-squad combat dispatch (10-monster raid formations)',
        'Server-wide cooperative damage progress bars',
        'Dynamic elemental vulnerability shifts during battle',
        'Guild and friend synergy score multipliers',
      ],
      rewards: ['Titan Slayer Relics', 'Mythic Rune Sets', 'Exclusive Avatar Frames', 'Ancient Crafting Ores'],
      schedule: 'Weekend World Event (Friday - Sunday)',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-Navigation Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3">
        <div className="bg-[#FFFDF9]/90 backdrop-blur-md border-2 border-[#D8C7A5] rounded-2xl p-2 sm:p-2.5 shadow-[0_4px_20px_rgba(160,118,55,0.08)] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Section Title & Sub-Heading */}
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm ring-1 ring-amber-300 shrink-0">
              {subTab === 'CAMPAIGN' ? (
                <Globe className="w-4 h-4" />
              ) : subTab === 'DUNGEONS' ? (
                <Swords className="w-4 h-4" />
              ) : (
                <Layers className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-black text-sm sm:text-base text-[#4A3215]">
                  {subTab === 'CAMPAIGN'
                    ? 'Campaign World Map'
                    : subTab === 'DUNGEONS'
                    ? 'Equipment Dungeons'
                    : 'PvE Addons & Expansions'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#92400E] bg-[#FEF3C7] border border-[#FCD34D] px-2 py-0.5 rounded-full shadow-2xs">
                  {subTab === 'CAMPAIGN'
                    ? '5 Continents'
                    : subTab === 'DUNGEONS'
                    ? '4 Dungeons • 3 Levels'
                    : 'Future Modes'}
                </span>
              </div>
              <p className="text-[11px] text-[#78634B] hidden sm:block">
                {subTab === 'CAMPAIGN'
                  ? 'Traverse the fantasy realm continents, defeat stage bosses, and unlock new areas.'
                  : subTab === 'DUNGEONS'
                  ? 'Conquer 3 levels of weapon, armor, helm, and boots dungeons with lethal boss mechanics.'
                  : 'Elemental Sanctums, Spire of Ascension Tower, and World Boss Raids coming to the realm.'}
              </p>
            </div>
          </div>

          {/* Segmented Control Buttons */}
          <div className="flex items-center gap-1 bg-[#F5EBD7] p-1 rounded-xl border border-[#D5C29E] w-full sm:w-auto overflow-x-auto scrollbar-none">
            {/* 1. Campaign Mode */}
            <button
              onClick={() => setSubTab('CAMPAIGN')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                subTab === 'CAMPAIGN'
                  ? 'bg-gradient-to-b from-[#FFFDF9] to-[#FDF8EE] text-[#78350F] shadow-sm border border-[#D5C29E] ring-1 ring-amber-400/40'
                  : 'text-[#78634B] hover:text-[#4A3215] hover:bg-[#EFE2C8]/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-amber-700" />
              <span>Campaign</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black bg-[#FEF3C7] text-[#92400E]">
                Story
              </span>
            </button>

            {/* 2. Equipment Dungeons */}
            <button
              onClick={() => setSubTab('DUNGEONS')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                subTab === 'DUNGEONS'
                  ? 'bg-gradient-to-b from-[#FFFDF9] to-[#FDF8EE] text-[#78350F] shadow-sm border border-[#D5C29E] ring-1 ring-amber-400/40'
                  : 'text-[#78634B] hover:text-[#4A3215] hover:bg-[#EFE2C8]/60'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-rose-600" />
              <span>Equipment Dungeons</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black bg-rose-100 border border-rose-300 text-rose-800 animate-pulse">
                ⚔️ 4 Sanctums
              </span>
            </button>

            {/* 3. PvE Addons & Expansions */}
            <button
              onClick={() => setSubTab('ADDONS')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                subTab === 'ADDONS'
                  ? 'bg-gradient-to-b from-[#FFFDF9] to-[#FDF8EE] text-[#78350F] shadow-sm border border-[#D5C29E] ring-1 ring-amber-400/40'
                  : 'text-[#78634B] hover:text-[#4A3215] hover:bg-[#EFE2C8]/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              <span>Roadmap</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black bg-[#E8DCC0] text-[#78634B]">
                Future
              </span>
            </button>

            {/* 4. Active Battle Quick Link (if in progress) */}
            {activeBattleStage && onNavigateToBattle && (
              <button
                onClick={onNavigateToBattle}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-sm hover:brightness-105 cursor-pointer whitespace-nowrap animate-pulse"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Active Battle</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main PvE Content */}
      {subTab === 'CAMPAIGN' ? (
        <CampaignWorldMap
          profile={profile}
          monsters={monsters}
          stages={stages}
          onSelectStageForBattle={onSelectStageForBattle}
        />
      ) : subTab === 'DUNGEONS' ? (
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <EquipmentDungeonsView
            profile={profile}
            stages={stages}
            onSelectStageForBattle={onSelectStageForBattle}
          />
        </div>
      ) : (
        /* PvE Addons & Expansions Showcase */
        <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-6">
          {/* Header Banner */}
          <div className="fantasy-scroll-card p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 fantasy-scroll-topbar" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-700" />
                  <h2 className="text-lg sm:text-xl font-black font-serif text-[#4A3215]">
                    PvE Expansion Roadmap & Addons
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[#78634B] mt-1 max-w-2xl leading-relaxed">
                  All future PvE challenges are architected under this command hub. Prepare your monster squad for rotating elemental awakening dungeons, 100-floor ascension gauntlets, and colossal titan boss raids.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-[#854D0E] bg-[#FEF3C7] border border-[#FCD34D] px-3 py-1.5 rounded-full shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Continuous PvE Addons Pipeline</span>
              </div>
            </div>
          </div>

          {/* Addons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {PVE_ADDONS.map((addon) => {
              const Icon = addon.icon;
              return (
                <div
                  key={addon.id}
                  className="bg-[#FFFDF9] border-2 border-[#D8C7A5] rounded-3xl p-5 shadow-[0_4px_24px_rgba(160,118,55,0.08)] flex flex-col justify-between space-y-4 hover:border-amber-500/80 transition-all group"
                >
                  <div className="space-y-3">
                    {/* Top Tag & Status */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${addon.badgeBg}`}>
                        {addon.chapter}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3 text-amber-700" />
                        {addon.status}
                      </span>
                    </div>

                    {/* Icon & Title */}
                    <div className="flex items-center gap-3 pt-1">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${addon.elementTheme} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-serif font-black text-base text-[#4A3215] group-hover:text-[#B45309] transition-colors">
                          {addon.title}
                        </h3>
                        <p className="text-xs font-bold text-[#8C765C]">{addon.subtitle}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#5D4A36] leading-relaxed">
                      {addon.summary}
                    </p>

                    {/* Features List */}
                    <div className="bg-[#FAF6ED] border border-[#E8DEC8] rounded-xl p-3 space-y-1.5">
                      <div className="text-[11px] font-bold text-[#4A3215] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Key Mechanics:</span>
                      </div>
                      <ul className="text-[11px] text-[#6E5942] space-y-1">
                        {addon.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Rewards Preview */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-[#4A3215] flex items-center gap-1">
                        <Gift className="w-3 h-3 text-amber-600" />
                        <span>Featured Rewards:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {addon.rewards.map((rew, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium bg-[#F5EBD7] text-[#5D4A36] border border-[#D5C29E] px-2 py-0.5 rounded-full"
                          >
                            {rew}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action / Preview */}
                  <div className="pt-2 border-t border-[#EFE5D0]">
                    <div className="flex items-center justify-between text-[11px] text-[#8C765C] mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-700" />
                        <span>Schedule:</span>
                      </span>
                      <span className="font-semibold text-[#4A3215]">{addon.schedule}</span>
                    </div>

                    <button
                      onClick={() => setSelectedAddonPreview(addon.id)}
                      className="w-full py-2.5 rounded-xl fantasy-btn-ivory text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:border-amber-400 shadow-2xs"
                    >
                      <Info className="w-3.5 h-3.5 text-amber-700" />
                      <span>View Mode Details & Lore</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Details Modal */}
          {selectedAddonPreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-xs"
                onClick={() => setSelectedAddonPreview(null)}
              />
              <div className="relative z-10 bg-[#FFFDF9] rounded-3xl border-2 border-[#D8C7A5] max-w-lg w-full p-6 shadow-2xl space-y-4">
                {(() => {
                  const modalAddon = PVE_ADDONS.find((a) => a.id === selectedAddonPreview);
                  if (!modalAddon) return null;
                  const ModalIcon = modalAddon.icon;
                  return (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${modalAddon.elementTheme} flex items-center justify-center text-white shadow-md`}>
                            <ModalIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${modalAddon.badgeBg}`}>
                              {modalAddon.chapter}
                            </span>
                            <h3 className="font-serif font-black text-lg text-[#4A3215]">
                              {modalAddon.title}
                            </h3>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedAddonPreview(null)}
                          className="w-8 h-8 rounded-full bg-[#FAF6ED] border border-[#D5C29E] flex items-center justify-center text-[#78654E] hover:text-[#2E1F0F] cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <p className="text-xs text-[#5D4A36] leading-relaxed">
                        {modalAddon.description}
                      </p>

                      <div className="bg-[#FAF6ED] border border-[#E8DEC8] rounded-2xl p-4 space-y-2">
                        <h4 className="font-bold text-xs text-[#4A3215]">Expansion Specifications:</h4>
                        <ul className="text-xs text-[#6E5942] space-y-1.5">
                          {modalAddon.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-600 font-bold">•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-[#78654E]">Status: <strong className="text-amber-800">{modalAddon.status}</strong></span>
                        <button
                          onClick={() => setSelectedAddonPreview(null)}
                          className="px-5 py-2 rounded-xl fantasy-btn-gold text-xs font-bold cursor-pointer"
                        >
                          Got It
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
