/**
 * Monster Realms - Unified PvE Hub
 * Layout designed to match the custom arcade RPG HUD:
 * Row 1: HOME, Player Profile, Music Toggle, Cloud Account
 * Row 2: Sub-Nav Buttons (Campaign, Dungeons, PARTY, Challenge Tower) & 2x2 Currencies Matrix
 * Row 3: Framed Content Container (Campaign 2x3 Continents, Dungeons, or Challenge Tower)
 * Row 4: Google AdSense Placement Banner
 * Row 5: Footer Utilities Bar (Map Studio, Portraits, Dev Tools)
 */

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Volume2,
  VolumeX,
  ArrowRight,
  Users,
  Zap,
  Sparkles,
  Coins,
  Gem,
  Wrench,
  Globe,
  Swords,
  Layers,
  Crown,
  Shield,
} from 'lucide-react';
import { Currencies, PlayerMonster, PlayerProfile, PvEStage, isDevAccount } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { ActiveTab } from './Navbar';
import { MONSTER_VARIANTS } from '../data/monsters';
import { MonsterAvatar } from './MonsterAvatar';
import { musicEngine } from '../services/audio/musicEngine';
import { CampaignWorldMap } from './CampaignWorldMap';
import { EquipmentDungeonsView } from './dungeons/EquipmentDungeonsView';
import { ElementalDungeonsView } from './dungeons/ElementalDungeonsView';
import { ChallengeTowerView } from './dungeons/ChallengeTowerView';
import { GoogleAdSenseBanner } from './ads/GoogleAdSenseBanner';

export type PveSubTab =
  | 'CAMPAIGN'
  | 'ELEMENTAL_DUNGEONS'
  | 'EQUIPMENT_DUNGEONS'
  | 'DUNGEONS'
  | 'CHALLENGE_TOWER';

interface PveHubProps {
  profile: PlayerProfile;
  monsters: PlayerMonster[];
  stages: PvEStage[];
  currencies: Currencies;
  currentUser?: FirebaseUser | null;
  initialSubTab?: PveSubTab;
  onSelectStageForBattle: (stage: PvEStage) => void;
  activeBattleStage?: PvEStage | null;
  onNavigateToBattle?: () => void;
  setActiveTab?: (tab: ActiveTab) => void;
  onOpenProfileModal?: (tab?: 'OVERVIEW' | 'REWARDS' | 'AVATAR' | 'MAILBOX') => void;
  onOpenAuthModal?: () => void;
  openDevTools?: () => void;
}

export const PveHub: React.FC<PveHubProps> = ({
  profile,
  monsters,
  stages,
  currencies,
  currentUser,
  initialSubTab = 'CAMPAIGN',
  onSelectStageForBattle,
  activeBattleStage,
  onNavigateToBattle,
  setActiveTab,
  onOpenProfileModal,
  onOpenAuthModal,
  openDevTools,
}) => {
  const [subTab, setSubTab] = useState<PveSubTab>(initialSubTab);
  const [musicState, setMusicState] = useState(musicEngine.getState());

  // Sync subTab if initialSubTab prop changes externally
  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Subscribe to music state
  useEffect(() => {
    const unsub = musicEngine.subscribe((state) => {
      setMusicState({ ...state });
    });
    return unsub;
  }, []);

  const isSoundActive =
    musicState.isPlaying &&
    !musicState.isMuted &&
    musicState.volume > 0 &&
    musicState.track !== 'NONE';

  const handleToggleMusic = () => {
    musicEngine.toggleMusic();
  };

  // Format currency displays
  const formattedGold =
    currencies.gold >= 1000000
      ? `${(currencies.gold / 1000000).toFixed(1)}M`
      : currencies.gold >= 10000
      ? `${Math.floor(currencies.gold / 1000)}k`
      : currencies.gold.toLocaleString();

  const avatarVariant = profile?.avatarVariantId
    ? MONSTER_VARIANTS[profile.avatarVariantId]
    : null;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-3.5 sm:space-y-4 relative z-10">
      {/* ═══════════════════════════════════════════════════════════════
          ROW 1: TOP HEADER (HOME, Player Profile, Music Toggle, Cloud Account)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3">
        {/* Box 1: HOME Button */}
        <button
          onClick={() => setActiveTab?.('HOME')}
          className="lg:col-span-3 bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl p-2.5 sm:p-3 flex items-center justify-center shadow-xs cursor-pointer transition-colors group"
          title="Return to Home Hub"
        >
          <span className="font-black text-sm sm:text-base font-serif tracking-widest text-[#2E1F0F] group-hover:scale-105 transition-transform">
            HOME
          </span>
        </button>

        {/* Box 2: Player Avatar & Level Pill */}
        <button
          onClick={() => onOpenProfileModal?.('OVERVIEW')}
          className="lg:col-span-3 bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-xs cursor-pointer transition-colors text-left group"
          title="Open Adventurer Profile & Progression"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border border-[#2E1F0F] flex items-center justify-center text-[#2E1F0F] font-black text-sm shrink-0 overflow-hidden shadow-2xs">
              {avatarVariant ? (
                <MonsterAvatar
                  variantId={profile.avatarVariantId}
                  element={avatarVariant.element}
                  size="sm"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{profile.username?.charAt(0)?.toUpperCase() || 'D'}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="font-black text-xs sm:text-sm text-[#2E1F0F] font-serif truncate group-hover:text-amber-800 transition-colors">
                {profile.username || 'Dean'}
              </div>
              <div className="inline-block bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] px-2 py-0.2 rounded-full text-[10px] font-black font-mono">
                Lv. {profile.accountLevel} Guardian
              </div>
            </div>
          </div>

          {/* Green Online Dot */}
          <div
            className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400 shadow-xs shrink-0"
            title="Online & Synced"
          />
        </button>

        {/* Box 3: Music Toggle */}
        <button
          onClick={handleToggleMusic}
          className="lg:col-span-3 bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-xs cursor-pointer transition-colors"
          title={isSoundActive ? 'Mute Background Music' : 'Play Background Music'}
        >
          <span className="font-black text-xs sm:text-sm font-serif tracking-wide text-[#2E1F0F]">
            Music: {isSoundActive ? 'On' : 'Off'}
          </span>
          <div
            className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-colors ${
              isSoundActive
                ? 'bg-amber-100 border-[#2E1F0F] text-[#2E1F0F]'
                : 'bg-[#FAF6ED] border-[#D5C29E] text-[#78654E]'
            }`}
          >
            {isSoundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </div>
        </button>

        {/* Box 4: Cloud Account -> */}
        <button
          onClick={onOpenAuthModal}
          className="lg:col-span-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-500 hover:from-amber-500 hover:to-amber-600 border-2 border-[#2E1F0F] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-xs cursor-pointer transition-all text-[#2E1F0F] group"
          title="Open Cloud Account & Cloud Save"
        >
          <span className="font-black text-xs sm:text-sm font-serif tracking-wide">
            Cloud Account
          </span>
          <div className="w-6 h-6 rounded-full bg-[#2E1F0F] text-amber-300 flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 2: SUB-NAVIGATION BUTTONS & CURRENCIES MATRIX
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 items-stretch">
        {/* Left Half: 2-Row Subnav Grid (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-2">
          {/* Row 2a: Campaign | Elemental Halls | Gear Forges | Tower */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setSubTab('CAMPAIGN')}
              className={`py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer text-center ${
                subTab === 'CAMPAIGN'
                  ? 'bg-[#FFFDF9] border-[3px] border-[#F59E0B] text-[#2E1F0F] ring-2 ring-amber-300/40 font-black'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F]'
              }`}
            >
              Campaign
            </button>

            <button
              onClick={() => setSubTab('ELEMENTAL_DUNGEONS')}
              className={`py-2.5 px-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer text-center relative flex items-center justify-center gap-1 ${
                subTab === 'ELEMENTAL_DUNGEONS' || subTab === 'DUNGEONS'
                  ? 'bg-[#FFFDF9] border-[3px] border-[#F59E0B] text-[#2E1F0F] ring-2 ring-amber-300/40 font-black'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F]'
              }`}
              title="6 Elemental Dungeons with 10 Floors (Awakening Stones)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Elemental Halls</span>
            </button>

            <button
              onClick={() => setSubTab('EQUIPMENT_DUNGEONS')}
              className={`py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                subTab === 'EQUIPMENT_DUNGEONS'
                  ? 'bg-[#FFFDF9] border-[3px] border-[#F59E0B] text-[#2E1F0F] ring-2 ring-amber-300/40 font-black'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F]'
              }`}
              title="Weapon, Armor, Helm, Boots Equipment Dungeons"
            >
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              <span>Gear Forges</span>
            </button>

            <button
              onClick={() => setSubTab('CHALLENGE_TOWER')}
              className={`py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                subTab === 'CHALLENGE_TOWER'
                  ? 'bg-[#FFFDF9] border-[3px] border-[#F59E0B] text-[#2E1F0F] ring-2 ring-amber-300/40 font-black'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F]'
              }`}
              title="Tower of Ascension"
            >
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>Tower</span>
            </button>
          </div>

          {/* Row 2b: Party & Quick Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setActiveTab?.('PARTY')}
              className="py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F] flex items-center justify-center gap-1.5"
              title="Open Party Formation"
            >
              <span>PARTY</span>
              <Users className="w-3.5 h-3.5 text-[#2E1F0F]" />
            </button>

            <button
              onClick={() => setActiveTab?.('MONSTERS')}
              className="py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F] flex items-center justify-center gap-1.5"
              title="Awaken Monsters in Roster"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Awaken</span>
            </button>

            <div className="py-2.5 px-3 rounded-2xl bg-[#E2EEF5]/40 border-2 border-dashed border-[#B0C4D0] hidden sm:block pointer-events-none" />
            <div className="py-2.5 px-3 rounded-2xl bg-[#E2EEF5]/40 border-2 border-dashed border-[#B0C4D0] hidden sm:block pointer-events-none" />
          </div>
        </div>

        {/* Right Half: 2x2 Currencies Matrix (5 cols) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-2">
          {/* Energy */}
          <div
            className="bg-[#ECFDF5] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#065F46] font-black text-xs sm:text-sm shadow-xs"
            title="Energy (Stamina)"
          >
            <span className="truncate">Energy : {currencies.energy} / {currencies.maxEnergy}</span>
            <Zap className="w-4 h-4 text-[#10B981] fill-[#10B981] shrink-0" />
          </div>

          {/* SP */}
          <div
            className="bg-[#F0F9FF] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#0369A1] font-black text-xs sm:text-sm shadow-xs"
            title="Summon Points"
          >
            <span className="truncate">SP : {currencies.summonPoints}</span>
            <Sparkles className="w-4 h-4 text-[#0EA5E9] shrink-0" />
          </div>

          {/* Gold */}
          <div
            className="bg-[#FFFBEB] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#92400E] font-black text-xs sm:text-sm shadow-xs"
            title="Gold"
          >
            <span className="truncate">Gold : {formattedGold}</span>
            <Coins className="w-4 h-4 text-[#D97706] shrink-0" />
          </div>

          {/* Gems */}
          <div
            className="bg-[#FAF5FF] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#6B21A8] font-black text-xs sm:text-sm shadow-xs"
            title="Gems"
          >
            <span className="truncate">Gems : {currencies.gems}</span>
            <Gem className="w-4 h-4 text-[#9333EA] shrink-0" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 3: MAIN VIEW CONTAINER (Framed Box with 2px Dark Border)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-3xl sm:rounded-[32px] p-3 sm:p-5 shadow-sm min-h-[500px]">
        {subTab === 'CAMPAIGN' && (
          <CampaignWorldMap
            profile={profile}
            monsters={monsters}
            stages={stages}
            onSelectStageForBattle={onSelectStageForBattle}
          />
        )}

        {(subTab === 'ELEMENTAL_DUNGEONS' || subTab === 'DUNGEONS') && (
          <ElementalDungeonsView
            profile={profile}
            stages={stages}
            onSelectStageForBattle={onSelectStageForBattle}
            onNavigateToAwakening={() => setActiveTab?.('MONSTERS')}
          />
        )}

        {subTab === 'EQUIPMENT_DUNGEONS' && (
          <EquipmentDungeonsView
            profile={profile}
            stages={stages}
            onSelectStageForBattle={onSelectStageForBattle}
          />
        )}

        {subTab === 'CHALLENGE_TOWER' && (
          <ChallengeTowerView
            profile={profile}
            monsters={monsters}
            onSelectStageForBattle={onSelectStageForBattle}
            onBackToCampaign={() => setSubTab('CAMPAIGN')}
          />
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 4: GOOGLE ADSENSE SPONSORED BANNER
          ═══════════════════════════════════════════════════════════════ */}
      <GoogleAdSenseBanner />

      {/* ═══════════════════════════════════════════════════════════════
          ROW 5: FOOTER UTILITIES (Dev Tools)
          ═══════════════════════════════════════════════════════════════ */}
      {openDevTools && (
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 pt-1">
          <button
            onClick={openDevTools}
            className="bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl py-2 px-4 flex items-center gap-2 font-bold text-xs sm:text-sm text-[#2E1F0F] shadow-xs cursor-pointer transition-colors"
          >
            <Wrench className="w-4 h-4 text-amber-700" />
            <span>Dev Tools</span>
          </button>
        </div>
      )}
    </div>
  );
};
