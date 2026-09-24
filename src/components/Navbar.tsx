/**
 * Top RPG Header & Tab Navigation Bar
 * Optimized for desktop and mobile viewports with bottom navigation bar and quick sheet.
 */

import React, { useState } from 'react';
import {
  Coins,
  Flame,
  Gem,
  Globe,
  LayoutGrid,
  Shield,
  Sparkles,
  Swords,
  BookOpen,
  Wrench,
  Users,
  Menu,
  X,
  ChevronRight,
  Compass,
  Cloud,
  User,
  HeartHandshake,
  Gift,
  Zap,
} from 'lucide-react';
import { Currencies, PlayerProfile, isDevAccount } from '../types';
import { MONSTER_VARIANTS } from '../data/monsters';
import { MusicController } from './audio/MusicController';
import { MonsterAvatar } from './MonsterAvatar';

export type ActiveTab =
  | 'HOME'
  | 'PVE'
  | 'MONSTERS'
  | 'SUMMON'
  | 'FUSION'
  | 'SYNTHESIS'
  | 'FRIENDS'
  | 'CAMPAIGN'
  | 'PARTY'
  | 'BATTLE'
  | 'CODEX';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  profile: PlayerProfile;
  currencies: Currencies;
  openDevTools?: () => void;
  currentUser?: any;
  onOpenAuthModal: () => void;
  pendingRequestsCount?: number;
  onOpenProfileModal?: (tab?: 'OVERVIEW' | 'REWARDS' | 'AVATAR') => void;
  unclaimedRewardsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  currencies,
  openDevTools,
  currentUser,
  onOpenAuthModal,
  pendingRequestsCount = 0,
  onOpenProfileModal,
  unclaimedRewardsCount = 0,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const canAccessDevTools = isDevAccount(profile?.username) || isDevAccount(currentUser?.email);

  const isPveActive =
    activeTab === 'PVE' || activeTab === 'CAMPAIGN' || activeTab === 'BATTLE';
  const isMonstersActive =
    activeTab === 'MONSTERS' || activeTab === 'PARTY' || activeTab === 'CODEX';
  const isSummonActive = activeTab === 'SUMMON';
  const isFusionActive = activeTab === 'FUSION' || activeTab === 'SYNTHESIS';
  const isFriendsActive = activeTab === 'FRIENDS';
  const isMoreTabActive = isFriendsActive;

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const avatarVariant = profile?.avatarVariantId ? MONSTER_VARIANTS[profile.avatarVariantId] : null;

  return (
    <>
      {/* ── TOP HEADER (Desktop & Mobile) ── */}
      <header className="sticky top-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-b-2 border-[#D8C7A5] shadow-[0_4px_24px_rgba(160,118,55,0.12)]">
        {/* Top Status & Currency Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand & Player Level */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => handleSelectTab('HOME')}
              className="flex items-center gap-2 cursor-pointer text-left focus:outline-none"
              title="Return to Home Hub"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-md shadow-amber-900/20 ring-1 ring-amber-300 shrink-0">
                <div className="w-full h-full rounded-[10px] bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-sm" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black tracking-wider text-xs sm:text-base font-serif bg-gradient-to-r from-[#5B3912] via-[#854D0E] to-[#B45309] bg-clip-text text-transparent whitespace-nowrap">
                    MONSTER REALMS
                  </span>
                  <span className="hidden lg:inline-block text-[9px] uppercase font-bold tracking-widest text-[#854D0E] bg-[#FEF3C7] border border-[#FCD34D] px-1.5 py-0.2 rounded-full shadow-2xs">
                    v1.0 Turn-Meter
                  </span>
                </div>
              </div>
            </button>

            {/* Player Level & Avatar Badge (Clickable to open profile customization & level rewards) */}
            <button
              onClick={() => onOpenProfileModal?.('OVERVIEW')}
              className="flex items-center gap-1.5 bg-[#FDFBF7] hover:bg-[#FEF3C7] border border-[#D5C29E] hover:border-[#D97706] pl-1 pr-2 sm:pr-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold text-[#4A3822] shadow-2xs transition-all cursor-pointer group"
              title="Adventurer Profile, Name Change & Level Progression Rewards"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden bg-amber-200 border border-amber-300 shrink-0 flex items-center justify-center">
                <MonsterAvatar
                  variantId={profile.avatarVariantId}
                  element={avatarVariant?.element}
                  variant={avatarVariant}
                  size="sm"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[#B45309] font-black font-mono">Lv.{profile.accountLevel}</span>
              <span className="text-[#8C765C] font-medium hidden sm:inline truncate max-w-[85px] group-hover:text-[#2E1F0F]">
                • {profile.username}
              </span>
              {unclaimedRewardsCount > 0 && (
                <span className="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full animate-bounce shadow-xs">
                  {unclaimedRewardsCount}
                </span>
              )}
            </button>
          </div>

          {/* Live Currencies (Touch-Friendly Responsive Horizontal Strip) */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5 scrollbar-none text-[11px] sm:text-xs font-medium">
            {/* Energy */}
            <div
              className="flex items-center gap-1 bg-gradient-to-b from-[#F0FDFA] to-[#CCFBF1] border border-[#5EEAD4] px-2 py-0.5 sm:py-1 rounded-full text-[#0F766E] shadow-2xs font-bold whitespace-nowrap"
              title="Energy (PvE Battles)"
            >
              <Flame className="w-3 h-3 text-[#0D9488]" />
              <span className="font-mono text-[10px] sm:text-xs">
                {currencies.energy}/{currencies.maxEnergy}
              </span>
            </div>

            {/* Gold */}
            <div
              className="flex items-center gap-1 bg-gradient-to-b from-[#FFFBEB] to-[#FEF3C7] border border-[#FCD34D] px-2 py-0.5 sm:py-1 rounded-full text-[#92400E] shadow-2xs font-bold whitespace-nowrap"
              title="Gold (Leveling & Awakening)"
            >
              <Coins className="w-3 h-3 text-[#D97706]" />
              <span className="font-mono text-[10px] sm:text-xs">
                {currencies.gold >= 1000000
                  ? `${(currencies.gold / 1000000).toFixed(1)}M`
                  : currencies.gold >= 10000
                  ? `${Math.floor(currencies.gold / 1000)}k`
                  : currencies.gold.toLocaleString()}
              </span>
            </div>

            {/* Summon Points */}
            <div
              className="flex items-center gap-1 bg-gradient-to-b from-[#F0FDF4] to-[#DCFCE7] border border-[#86EFAC] px-2 py-0.5 sm:py-1 rounded-full text-[#166534] shadow-2xs font-bold whitespace-nowrap"
              title="Summon Points"
            >
              <Sparkles className="w-3 h-3 text-[#15803D]" />
              <span className="font-mono text-[10px] sm:text-xs">{currencies.summonPoints} SP</span>
            </div>

            {/* Gems */}
            <div
              className="flex items-center gap-1 bg-gradient-to-b from-[#FAF5FF] to-[#F3E8FF] border border-[#D8B4FE] px-2 py-0.5 sm:py-1 rounded-full text-[#6B21A8] shadow-2xs font-bold whitespace-nowrap"
              title="Gems (Featured Summoning)"
            >
              <Gem className="w-3 h-3 text-[#9333EA]" />
              <span className="font-mono text-[10px] sm:text-xs">{currencies.gems}</span>
            </div>

            {/* Music Controller */}
            <MusicController compact />

            {/* Account & Cloud Save Button */}
            <button
              onClick={onOpenAuthModal}
              className={`text-[10px] sm:text-xs px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1.5 cursor-pointer font-bold whitespace-nowrap shrink-0 transition-all ${
                currentUser
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 shadow-2xs'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-xs'
              }`}
              title={currentUser ? 'Account & Cloud Save active' : 'Login or Create Account to save progress'}
            >
              {currentUser ? (
                <>
                  <Cloud className="w-3 h-3 text-emerald-600" />
                  <span className="hidden sm:inline">Cloud Saved</span>
                </>
              ) : (
                <>
                  <User className="w-3 h-3" />
                  <span>Login / Save</span>
                </>
              )}
            </button>

            {/* Dev Tools Quick Button - Only enabled for account named "Dean" */}
            {canAccessDevTools && openDevTools && (
              <button
                onClick={openDevTools}
                className="fantasy-btn-ivory text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1 cursor-pointer font-bold whitespace-nowrap shrink-0"
                title="Open Developer & Testing Panel"
              >
                <Wrench className="w-3 h-3 text-[#78350F]" />
                <span className="hidden md:inline">Dev Tools</span>
              </button>
            )}
          </div>
        </div>

        {/* Desktop Tab Bar (Hidden on mobile < md) */}
        <div className="hidden md:flex max-w-7xl mx-auto px-4 items-center justify-start gap-2 overflow-x-auto py-1.5 scrollbar-none border-t border-[#E8DCBE]">
          {/* 1. Home Hub */}
          <button
            onClick={() => handleSelectTab('HOME')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'HOME' ? 'fantasy-nav-tab-active' : 'fantasy-nav-tab-inactive'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Home</span>
          </button>

          {/* 2. Unified PvE (Campaign & Addons) */}
          <button
            onClick={() => handleSelectTab('PVE')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
              isPveActive ? 'fantasy-nav-tab-active' : 'fantasy-nav-tab-inactive'
            }`}
          >
            <Globe className="w-4 h-4 text-amber-600" />
            <span className="font-bold">PvE</span>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/50 shadow-2xs">
              Campaign & Addons
            </span>
          </button>

          {/* 3. Unified Monsters (Party, Roster, Codex) */}
          <button
            onClick={() => handleSelectTab('MONSTERS')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
              isMonstersActive ? 'fantasy-nav-tab-active' : 'fantasy-nav-tab-inactive'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-700" />
            <span className="font-bold">Monsters</span>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/50 shadow-2xs">
              Party & Codex
            </span>
          </button>

          {/* 4. Summon Gate */}
          <button
            onClick={() => handleSelectTab('SUMMON')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
              isSummonActive ? 'fantasy-nav-tab-active' : 'fantasy-nav-tab-inactive'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Summon</span>
          </button>

          {/* 5. Monster Fusion & Synthesis */}
          <button
            onClick={() => handleSelectTab('FUSION')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
              isFusionActive ? 'fantasy-nav-tab-active' : 'fantasy-nav-tab-inactive'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Fusion</span>
          </button>

          {/* 6. Friends & Social */}
          <button
            onClick={() => handleSelectTab('FRIENDS')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer relative ${
              isFriendsActive ? 'fantasy-nav-tab-active' : 'fantasy-nav-tab-inactive'
            }`}
          >
            <Users className="w-4 h-4 text-amber-700" />
            <span>Friends</span>
            {pendingRequestsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* ── MOBILE SLIDE-UP DRAWER (Quick Access & Sub-features) ── */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end animate-fadeIn">
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sheet Container */}
          <div className="relative z-10 bg-[#FFFDF9] rounded-t-3xl border-t-2 border-[#D8C7A5] shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-[#D5C29E] rounded-full mx-auto" />

            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E8DEC8]">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#D97706]" />
                <h3 className="font-serif font-black text-base text-[#2E1F0F]">Realm Command Menu</h3>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF6ED] border border-[#D5C29E] flex items-center justify-center text-[#78654E] hover:text-[#2E1F0F] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Adventurer Profile & Progression Rewards */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenProfileModal?.('OVERVIEW');
                }}
                className="col-span-2 p-3.5 rounded-2xl border text-left flex items-center justify-between bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] border-[#F59E0B] text-[#2E1F0F] shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-amber-200 border border-amber-300 shrink-0 flex items-center justify-center shadow-xs">
                    <MonsterAvatar
                      variantId={profile.avatarVariantId}
                      element={avatarVariant?.element}
                      variant={avatarVariant}
                      size="sm"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="font-bold text-xs font-serif">{profile.username}</div>
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 border border-amber-400 font-mono">
                        Lv.{profile.accountLevel}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#78654E]">
                      Rename, change avatar & claim level gems
                    </div>
                  </div>
                </div>
                {unclaimedRewardsCount > 0 ? (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-red-500 text-white text-[10px] font-black rounded-full shadow-xs animate-bounce flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    <span>{unclaimedRewardsCount} Claim</span>
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#78654E]" />
                )}
              </button>

              {/* PvE Shortcut */}
              <button
                onClick={() => handleSelectTab('PVE')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isPveActive
                    ? 'fantasy-btn-gold text-[#2E1F0F] shadow-md ring-2 ring-[#F59E0B]'
                    : 'bg-[#FFFDF9] border-[#D5C29E] hover:border-[#D97706] text-[#2E1F0F]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs mb-2">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="font-bold text-xs font-serif">PvE Hub</div>
                  <span className="text-[8px] font-black px-1 rounded bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/50">
                    WORLD
                  </span>
                </div>
                <div className="text-[10px] text-[#78654E]">Campaign & Future Addons</div>
              </button>

              {/* Monsters Shortcut */}
              <button
                onClick={() => handleSelectTab('MONSTERS')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isMonstersActive
                    ? 'fantasy-btn-gold text-[#2E1F0F] shadow-md ring-2 ring-[#F59E0B]'
                    : 'bg-[#FFFDF9] border-[#D5C29E] hover:border-[#D97706] text-[#2E1F0F]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600 to-yellow-600 text-white flex items-center justify-center shadow-xs mb-2">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="font-bold text-xs font-serif">Monsters Hub</div>
                  <span className="text-[8px] font-black px-1 rounded bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/50">
                    TEAM
                  </span>
                </div>
                <div className="text-[10px] text-[#78654E]">Party, Roster & Codex</div>
              </button>

              {/* Fusion / Synthesis Shortcut */}
              <button
                onClick={() => handleSelectTab('FUSION')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  activeTab === 'FUSION' || activeTab === 'SYNTHESIS'
                    ? 'fantasy-btn-gold text-[#2E1F0F] shadow-md ring-2 ring-[#F59E0B]'
                    : 'bg-[#FFFDF9] border-[#D5C29E] hover:border-[#D97706] text-[#2E1F0F]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs mb-2">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="font-bold text-xs font-serif">Fusion Altar</div>
                  <span className="text-[8px] font-black px-1 rounded bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/50">
                    SYNTHESIS
                  </span>
                </div>
                <div className="text-[10px] text-[#78654E]">Fuse monsters to higher tiers</div>
              </button>

              {/* Friends Shortcut */}
              <button
                onClick={() => handleSelectTab('FRIENDS')}
                className="col-span-2 p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer relative bg-[#FFFDF9] border-[#D5C29E] hover:border-[#D97706] text-[#2E1F0F]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs mb-0 relative shrink-0">
                    <Users className="w-4 h-4" />
                    {pendingRequestsCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs font-serif">Friends & Social</div>
                    <div className="text-[10px] text-[#78654E]">Gifts, friend codes & spar</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#78654E]" />
              </button>

              {/* Dev Tools & Sandbox - Only for account named "Dean" */}
              {canAccessDevTools && openDevTools && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openDevTools();
                  }}
                  className="col-span-2 p-3 rounded-2xl border text-left flex items-center justify-between bg-[#FFFDF9] border-[#D5C29E] hover:border-[#D97706] text-[#2E1F0F] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs font-serif">Dev Tools & Sandbox</div>
                      <div className="text-[10px] text-[#78654E]">Cheats, energy, gems & gold</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#78654E]" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── STICKY MOBILE BOTTOM NAVIGATION BAR (Thumb-Friendly, iOS/Android Safe) ── */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-t-2 border-[#D8C7A5] shadow-[0_-4px_24px_rgba(160,118,55,0.18)] pb-[max(env(safe-area-inset-bottom),6px)] pt-1 px-1 flex items-center justify-around"
      >
        {/* 1. Home */}
        <button
          onClick={() => handleSelectTab('HOME')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-xl px-1.5 py-1 transition-all cursor-pointer ${
            activeTab === 'HOME'
              ? 'text-[#B45309] font-black'
              : 'text-[#78654E] hover:text-[#2E1F0F]'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              activeTab === 'HOME'
                ? 'bg-[#FEF3C7] border border-[#F59E0B] text-[#B45309] shadow-xs'
                : 'text-[#8C765C]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Home</span>
        </button>

        {/* 2. Unified PvE (Campaign & Future Addons) */}
        <button
          onClick={() => handleSelectTab('PVE')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-xl px-1.5 py-1 transition-all cursor-pointer ${
            isPveActive
              ? 'text-[#B45309] font-black'
              : 'text-[#78654E] hover:text-[#2E1F0F]'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              isPveActive
                ? 'bg-[#FEF3C7] border border-[#F59E0B] text-[#B45309] shadow-xs'
                : 'text-[#8C765C]'
            }`}
          >
            <Globe className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">PvE</span>
        </button>

        {/* 3. Unified Monsters (Party, Roster & Codex) */}
        <button
          onClick={() => handleSelectTab('MONSTERS')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-xl px-1.5 py-1 transition-all cursor-pointer ${
            isMonstersActive
              ? 'text-[#B45309] font-black'
              : 'text-[#78654E] hover:text-[#2E1F0F]'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              isMonstersActive
                ? 'bg-[#FEF3C7] border border-[#F59E0B] text-[#B45309] shadow-xs'
                : 'text-[#8C765C]'
            }`}
          >
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Monsters</span>
        </button>

        {/* 4. Summon */}
        <button
          onClick={() => handleSelectTab('SUMMON')}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[46px] rounded-xl px-1 py-1 transition-all cursor-pointer ${
            isSummonActive
              ? 'text-[#B45309] font-black'
              : 'text-[#78654E] hover:text-[#2E1F0F]'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              isSummonActive
                ? 'bg-[#FEF3C7] border border-[#F59E0B] text-[#B45309] shadow-xs'
                : 'text-[#8C765C]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Summon</span>
        </button>

        {/* 5. Fusion */}
        <button
          onClick={() => handleSelectTab('FUSION')}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[46px] rounded-xl px-1 py-1 transition-all cursor-pointer ${
            isFusionActive
              ? 'text-[#B45309] font-black'
              : 'text-[#78654E] hover:text-[#2E1F0F]'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              isFusionActive
                ? 'bg-[#FEF3C7] border border-[#F59E0B] text-[#B45309] shadow-xs'
                : 'text-[#8C765C]'
            }`}
          >
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Fusion</span>
        </button>

        {/* 6. Realm Command Menu (Drawer) */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[46px] rounded-xl px-1 py-1 transition-all cursor-pointer relative ${
            isMoreTabActive || isMobileMenuOpen
              ? 'text-[#B45309] font-black'
              : 'text-[#78654E] hover:text-[#2E1F0F]'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              isMoreTabActive || isMobileMenuOpen
                ? 'bg-[#FEF3C7] border border-[#F59E0B] text-[#B45309] shadow-xs'
                : 'text-[#8C765C]'
            }`}
          >
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Menu</span>
          {(isMoreTabActive || pendingRequestsCount > 0) && (
            <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-[#D97706] ring-1 ring-white" />
          )}
        </button>
      </nav>
    </>
  );
};

