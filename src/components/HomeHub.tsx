/**
 * Monster Realms - Home Hub
 * Primary fantasy interface showcasing active 5-monster team, stage dispatch,
 * energy timer, and quick links.
 */

import React, { useState } from 'react';
import {
  Swords,
  Sparkles,
  Shield,
  Zap,
  Flame,
  Award,
  ChevronRight,
  TrendingUp,
  Coins,
  Globe,
  Lock,
  Crown,
  Star,
  Users,
  AlertCircle,
  Compass,
  Layers,
  Upload,
  Image as ImageIcon,
  Gem,
  Gift,
  Pencil,
  Camera,
} from 'lucide-react';
import { Currencies, PlayerMonster, PlayerProfile, PvEStage, isDevAccount } from '../types';
import { User } from 'firebase/auth';
import { MONSTER_VARIANTS } from '../data/monsters';
import { ELEMENT_VISUALS } from '../data/elements';
import { CONTINENTS, isStageUnlocked, isContinentUnlocked } from '../data/stages';
import { calculateEffectiveStats } from '../engine/statCalculator';
import { MonsterAvatar } from './MonsterAvatar';
import { MonsterCard } from './MonsterCard';
import { ActiveTab } from './Navbar';
import { MapManagerModal } from './battle2d/MapManagerModal';
import { MonsterPortraitManagerModal } from './battle2d/MonsterPortraitManagerModal';
import { getExpToNextAccountLevel, getUnclaimedRewards } from '../services/accountProgression';

interface HomeHubProps {
  profile: PlayerProfile;
  monsters: PlayerMonster[];
  stages: PvEStage[];
  currencies: Currencies;
  currentUser?: User | null;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenProfileModal?: (tab?: 'OVERVIEW' | 'REWARDS' | 'AVATAR') => void;
}

export const HomeHub: React.FC<HomeHubProps> = ({
  profile,
  monsters,
  stages,
  currencies,
  currentUser,
  setActiveTab,
  onOpenProfileModal,
}) => {
  const [isMapManagerOpen, setIsMapManagerOpen] = useState<boolean>(false);
  const [isPortraitManagerOpen, setIsPortraitManagerOpen] = useState<boolean>(false);
  const isAuthorizedDev = isDevAccount(profile?.username) || isDevAccount(currentUser?.email);
  // Resolve active party monsters from profile
  const activePartyMonsters: PlayerMonster[] = React.useMemo(() => {
    if (!profile?.activeParty || profile.activeParty.length === 0) {
      return monsters.slice(0, 5);
    }
    return profile.activeParty
      .map((id) => monsters.find((m) => m.instanceId === id))
      .filter((m): m is PlayerMonster => !!m);
  }, [profile?.activeParty, monsters]);

  const activePartyCount = activePartyMonsters.length;

  // Progression math
  const expToNext = getExpToNextAccountLevel(profile.accountLevel);
  const currentExp = profile.experience || 0;
  const expPercent = Math.min(100, Math.floor((currentExp / expToNext) * 100));
  const unclaimedRewards = getUnclaimedRewards(profile);
  const totalUnclaimedGems = unclaimedRewards.reduce((s, r) => s + r.gems, 0);
  const hasChangedName = !!profile.hasChangedName;

  // Total combat power calculation of current active party
  const totalPower = activePartyMonsters.reduce((acc, m) => {
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
        stats.hp / 10 +
          stats.attack * 1.5 +
          stats.defense * 1.2 +
          stats.speed * 2
      )
    );
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 relative z-10">
      {/* Hero Banner: Rolled Parchment Scroll & Adventure Command */}
      <div className="fantasy-scroll-card p-4 sm:p-8 overflow-hidden">
        {/* Ornate Rolled Scroll Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 fantasy-scroll-topbar" />

        {/* Ambient Sunlit Warmth */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-amber-200/40 via-yellow-100/30 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-sky-200/40 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2.5 sm:space-y-3">
            {/* Party Status Ribbon Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-0.5 sm:py-1 rounded-full bg-[#FFFBEB] border border-[#F59E0B] text-[11px] sm:text-xs font-bold text-[#854D0E] uppercase tracking-wider shadow-2xs">
              <Users className="w-3.5 h-3.5 text-[#D97706]" />
              Party Status: {activePartyCount} Units Active
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-[#2E1F0F] font-serif tracking-wide">
              Realm Expeditionary Force
            </h1>
            <p className="text-xs sm:text-sm text-[#5C4A34] max-w-xl leading-relaxed">
              Assemble and tune your tactical monster expedition, challenge continental guardians across the 5 elemental continents, and harvest celestial awakening crests.
            </p>

            {/* Quick Stat Tags */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 text-[11px] sm:text-xs font-semibold">
              <span className="flex items-center gap-1.5 bg-[#FFFBEB] border border-[#FDE68A] px-2.5 py-1 rounded-full text-[#92400E] shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-[#D97706]" />
                Combat Power: <strong className="font-mono font-bold">{totalPower.toLocaleString()} CP</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-[#F0FDFA] border border-[#99F6E4] px-2.5 py-1 rounded-full text-[#0F766E] shadow-2xs">
                <Crown className="w-3.5 h-3.5 text-[#0D9488]" />
                Account Level: <strong className="font-mono font-bold">Lv. {profile.accountLevel}</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-[#FAF5FF] border border-[#E9D5FF] px-2.5 py-1 rounded-full text-[#6B21A8] shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#9333EA]" />
                Owned Roster: <strong className="font-mono font-bold">{monsters.length} Monsters</strong>
              </span>
            </div>
          </div>

          {/* Action CTAs: Responsive 2x2 Grid on Mobile, Flex Row on Desktop */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            {isAuthorizedDev && (
              <>
                <button
                  onClick={() => setIsMapManagerOpen(true)}
                  className="fantasy-btn-ivory flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs tracking-wide uppercase cursor-pointer"
                  title="Upload custom background and battleplatform for each campaign map"
                >
                  <Layers className="w-4 h-4 text-[#B45309]" />
                  <span className="truncate">Map Studio</span>
                </button>
                <button
                  onClick={() => setIsPortraitManagerOpen(true)}
                  className="fantasy-btn-sky flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs tracking-wide uppercase cursor-pointer"
                  title="Upload custom PNG portraits for all monsters"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="truncate">Portraits</span>
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('MONSTERS')}
              className="fantasy-btn-ivory flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs tracking-wide uppercase cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#B45309]" />
              <span className="truncate">Party & Roster</span>
            </button>
            <button
              onClick={() => setActiveTab('PVE')}
              className="fantasy-btn-gold flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs tracking-wider uppercase cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span className="truncate">PvE Adventures</span>
            </button>
          </div>
        </div>

        {/* Dynamic Party Size Information Banner */}
        {activePartyCount < 5 && (
          <div className="relative z-10 mt-4 sm:mt-5 p-3 sm:p-3.5 rounded-2xl border border-[#FCD34D] bg-[#FFFBEB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-2xs">
            <div className="flex items-center gap-2.5 text-xs text-[#92400E] font-medium">
              <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
              <span>
                Your party currently has <strong>{activePartyCount} of 5</strong> monsters deployed. Parties with fewer monsters receive an <strong>XP multiplier bonus (up to +100%)</strong>!
              </span>
            </div>
            <button
              onClick={() => setActiveTab('PARTY')}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl fantasy-btn-gold text-[#382109] font-bold text-xs whitespace-nowrap cursor-pointer text-center"
            >
              Manage Slots
            </button>
          </div>
        )}
      </div>

      {/* Adventurer Identity & Level Progression Banner */}
      <div className="relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FFFDF9] via-[#FAF3E3] to-[#F5ECD8] border-2 border-[#D5C29E] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Avatar, Username, Edit Name & Level */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative group shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 p-0.5 shadow-md ring-2 ring-amber-300/80 overflow-hidden flex items-center justify-center">
              <MonsterAvatar
                variantId={profile.avatarVariantId}
                size="md"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => onOpenProfileModal?.('AVATAR')}
              className="absolute -bottom-1 -right-1 bg-[#854D0E] hover:bg-[#B45309] text-white p-1 rounded-full shadow-md border border-amber-200 cursor-pointer"
              title="Change Avatar from Unlocked Portraits"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base sm:text-xl font-black font-serif text-[#2E1F0F]">
                {profile.username}
              </span>
              <button
                onClick={() => onOpenProfileModal?.('OVERVIEW')}
                className="p-1 text-[#854D0E] hover:text-[#B45309] hover:bg-amber-100 rounded-md transition-colors cursor-pointer"
                title="Change Adventurer Name"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

              {!hasChangedName ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                  1 Free Name Change
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300 flex items-center gap-1 shadow-2xs">
                  <Gem className="w-2.5 h-2.5 text-purple-600" />
                  Rename: 500 Gems
                </span>
              )}
            </div>

            {/* Level & Exp */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#854D0E] bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md font-mono">
                Lv. {profile.accountLevel}
              </span>
              <div className="w-28 sm:w-40 h-2.5 bg-stone-200 rounded-full overflow-hidden border border-stone-300">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
              <span className="text-[10px] sm:text-xs text-[#7A6348] font-mono">
                {currentExp} / {expToNext} EXP
              </span>
            </div>
          </div>
        </div>

        {/* Right: Milestone Rewards CTA & Avatar Switcher */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={() => onOpenProfileModal?.('AVATAR')}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white hover:bg-[#FEF3C7] border border-[#D5C29E] text-xs font-bold text-[#7A6348] hover:text-[#2E1F0F] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-amber-600" />
            <span>Portraits</span>
          </button>

          <button
            onClick={() => onOpenProfileModal?.('REWARDS')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 ${
              unclaimedRewards.length > 0
                ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white animate-pulse border border-yellow-200'
                : 'bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>
              {unclaimedRewards.length > 0
                ? `Claim Level Gems (+${totalUnclaimedGems} 💎)`
                : 'Account Level Rewards'}
            </span>
          </button>
        </div>
      </div>

      {/* First-time Free Name Change Welcome Ribbon (if not yet changed) */}
      {!hasChangedName && (
        <div
          onClick={() => onOpenProfileModal?.('OVERVIEW')}
          className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-center justify-between gap-3 shadow-2xs cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 animate-spin" />
            <span>
              <strong>Welcome Adventurer!</strong> You can customize your adventurer profile name once for <strong>FREE (0 Gems)</strong>. Subsequent renames cost 500 Gems.
            </span>
          </div>
          <span className="shrink-0 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs">
            Set Name & Avatar →
          </span>
        </div>
      )}

      {/* Main Grid: PvE Campaign Stages & Progression Hub */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* World Campaign & Elemental Continents Portal (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          <div
            onClick={() => setActiveTab('CAMPAIGN')}
            className="fantasy-scroll-card p-6 rounded-3xl cursor-pointer group transition-all hover:scale-[1.01]"
          >
            {/* Scroll Finial Header */}
            <div className="absolute top-0 left-0 right-0 h-1.5 fantasy-scroll-topbar" />

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#D97706]" />
                World Campaign & Expeditions
              </span>
              <span className="text-xs font-bold text-[#854D0E] group-hover:text-[#B45309] flex items-center gap-1 transition-colors">
                Open World Map
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#D97706]" />
              </span>
            </div>
            <h2 className="text-xl font-black text-[#2E1F0F] font-serif">
              The 5 Elemental Continents
            </h2>
            <p className="text-xs text-[#5C4A34] mt-1 max-w-xl leading-relaxed">
              Explore the Scorched Expanse, Sunken Abyss, Emerald Canopy, Celestial Spire, and Shadowfell Rift. Engage in tactical 5v5 boss battles and harvest awakening crests.
            </p>

            {/* Visual Continent Mini-Teaser */}
            <div className="mt-4 pt-3 border-t border-[#E8DCBE] flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1">
              {['Scorched Expanse', 'Sunken Abyss', 'Emerald Canopy', 'Celestial Spire', 'Shadowfell Rift'].map((cName, idx) => (
                <div
                  key={cName}
                  className="px-3 py-1.5 rounded-xl bg-[#FFFDF9] border border-[#D5C29E] text-[11px] font-bold text-[#5C4A34] whitespace-nowrap shadow-2xs group-hover:border-amber-400 transition-colors"
                >
                  <span className="text-[#B45309] mr-1">#{idx + 1}</span> {cName}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Roster & Codex Showcase */}
          <div
            onClick={() => setActiveTab('CODEX')}
            className="fantasy-plate-interactive p-5 rounded-2xl cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-[#FEF3C7] to-[#FDE68A] border border-[#F59E0B] flex items-center justify-center text-[#B45309] shadow-sm">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#2E1F0F] group-hover:text-[#B45309] transition-colors font-serif">
                  Elemental Monster Codex
                </h4>
                <p className="text-xs text-[#6E5942]">
                  Browse all 5 elemental variants of Pyrosaur, Tideguard, Floraweaver, Luminary, and Shadowstalker.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#B45309] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Quick Progression Shortcuts (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          {/* Summon Gate Shortcut */}
          <div
            onClick={() => setActiveTab('SUMMON')}
            className="fantasy-plate-interactive p-5 rounded-2xl cursor-pointer shadow-md group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#7E22CE] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#9333EA]" />
                Astral Portal
              </span>
              <ChevronRight className="w-4 h-4 text-[#7E22CE] group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-lg font-black text-[#2E1F0F] font-serif">Summon New Monsters</h3>
            <p className="text-xs text-[#6E5942] mt-1">
              Roll on the Standard and Featured banners to acquire rare, epic, and legendary elemental variants.
            </p>
          </div>

          {/* Synthesis Chamber Shortcut */}
          <div
            onClick={() => setActiveTab('SYNTHESIS')}
            className="fantasy-plate-interactive p-5 rounded-2xl cursor-pointer shadow-md group border-2 border-[#D97706]/30 hover:border-[#D97706]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#EA580C]" />
                Alchemical Transmutation
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/60 shadow-2xs uppercase">
                  Fusion
                </span>
                <ChevronRight className="w-4 h-4 text-[#D97706] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            <h3 className="text-lg font-black text-[#2E1F0F] font-serif">Monster Synthesis Chamber</h3>
            <p className="text-xs text-[#6E5942] mt-1">
              Fuse duplicate monsters into guaranteed higher-tier variants, unlocking dual-element resonance and bonus stats!
            </p>
          </div>

          {/* Friends & Social Shortcut */}
          <div
            onClick={() => setActiveTab('FRIENDS')}
            className="fantasy-plate-interactive p-5 rounded-2xl cursor-pointer shadow-md group border-2 border-emerald-600/30 hover:border-emerald-600"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                Adventurer Guild
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs uppercase">
                  Social
                </span>
                <ChevronRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            <h3 className="text-lg font-black text-[#2E1F0F] font-serif">Friends & Daily Gifts</h3>
            <p className="text-xs text-[#6E5942] mt-1">
              Share Friend Codes, send daily 100G & 10SP gift bundles, inspect defense formations, and test your mettle in sparring duels.
            </p>
          </div>

          {/* Awakening Chamber Shortcut */}
          <div
            onClick={() => setActiveTab('MONSTERS')}
            className="fantasy-plate-interactive p-5 rounded-2xl cursor-pointer shadow-md group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#D97706]" />
                Awakening Chamber
              </span>
              <ChevronRight className="w-4 h-4 text-[#B45309] group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-lg font-black text-[#2E1F0F] font-serif">Awaken Your Roster</h3>
            <p className="text-xs text-[#6E5942] mt-1">
              Transform your monsters with new titles, enhanced skill trees, upgraded appearances, and speed boosts.
            </p>
          </div>

          {/* Equipment Armory Shortcut */}
          <div
            onClick={() => setActiveTab('MONSTERS')}
            className="fantasy-plate-interactive p-5 rounded-2xl cursor-pointer shadow-md group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#0284C7] uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#0EA5E9]" />
                Equipment & Sets
              </span>
              <ChevronRight className="w-4 h-4 text-[#0284C7] group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-lg font-black text-[#2E1F0F] font-serif">Equip 4-Piece Sets</h3>
            <p className="text-xs text-[#6E5942] mt-1">
              Optimize Speed (Swift Set), Attack (Fatal Set), and Defense (Guard Set) for tactical mastery.
            </p>
          </div>
        </div>
      </div>

      {/* Campaign Map Background & Battleplatform Manager Modal - Dev Studio */}
      {isAuthorizedDev && (
        <MapManagerModal
          isOpen={isMapManagerOpen}
          onClose={() => setIsMapManagerOpen(false)}
        />
      )}

      {/* Monster Portrait Upload & Manager Modal - Dev Studio */}
      {isAuthorizedDev && (
        <MonsterPortraitManagerModal
          isOpen={isPortraitManagerOpen}
          onClose={() => setIsPortraitManagerOpen(false)}
        />
      )}
    </div>
  );
};
