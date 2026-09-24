/**
 * Monster Realms - Home Hub (Command Center Layout)
 * Implements the hero dashboard wireframe while retaining the high-fantasy RPG aesthetic.
 */

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Volume2,
  VolumeX,
  LogIn,
  Home,
  Shield,
  Users,
  User,
  Swords,
  Star,
  Zap,
  Sparkles,
  Coins,
  Gem,
  Megaphone,
  BookOpen,
  ArrowRight,
  Layers,
  Image as ImageIcon,
  Wrench,
} from 'lucide-react';
import { Currencies, PlayerMonster, PlayerProfile, PvEStage, isDevAccount } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { ActiveTab } from './Navbar';
import { MONSTER_VARIANTS } from '../data/monsters';
import { MonsterAvatar } from './MonsterAvatar';
import { musicEngine } from '../services/audio/musicEngine';
import { PvPArenaModal } from './arena/PvPArenaModal';
import { NewsAndUpdatesModal } from './news/NewsAndUpdatesModal';
import { MapManagerModal } from './battle2d/MapManagerModal';
import { MonsterPortraitManagerModal } from './battle2d/MonsterPortraitManagerModal';

interface HomeHubProps {
  profile: PlayerProfile;
  monsters: PlayerMonster[];
  stages: PvEStage[];
  currencies: Currencies;
  currentUser?: FirebaseUser | null;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenProfileModal?: (tab?: 'OVERVIEW' | 'REWARDS' | 'AVATAR') => void;
  onOpenAuthModal?: () => void;
  onStartBattle?: (stage: PvEStage) => void;
  onSparBattle?: (friend: any) => void;
  openDevTools?: () => void;
}

export const HomeHub: React.FC<HomeHubProps> = ({
  profile,
  monsters,
  stages,
  currencies,
  currentUser,
  setActiveTab,
  onOpenProfileModal,
  onOpenAuthModal,
  onStartBattle,
  onSparBattle,
  openDevTools,
}) => {
  const [musicState, setMusicState] = useState(musicEngine.getState());
  const [isPvPModalOpen, setIsPvPModalOpen] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isMapManagerOpen, setIsMapManagerOpen] = useState(false);
  const [isPortraitManagerOpen, setIsPortraitManagerOpen] = useState(false);

  const isAuthorizedDev = isDevAccount(profile?.username) || isDevAccount(currentUser?.email);

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
          ROW 1: TOP HEADER (Logo, Player Info, Music Toggle, Account)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3">
        {/* Box 1: MONSTER REALMS v1.0 */}
        <div className="lg:col-span-3 bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 border border-[#2E1F0F] flex items-center justify-center text-white shadow-xs">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <span className="font-black text-sm sm:text-base font-serif tracking-wider text-[#2E1F0F]">
              MONSTER REALMS
            </span>
          </div>
          <span className="bg-[#2E1F0F] text-amber-200 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-tight shadow-2xs">
            v1.0
          </span>
        </div>

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
                {profile.username || 'Guardian'}
              </div>
              <div className="inline-block bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] px-2 py-0.2 rounded-full text-[10px] font-black font-mono">
                Lv. {profile.accountLevel} Guardian
              </div>
            </div>
          </div>

          {/* Green Online Dot */}
          <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0" />
        </button>

        {/* Box 3: Music Toggle */}
        <button
          onClick={handleToggleMusic}
          className="lg:col-span-3 bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-xs cursor-pointer transition-colors text-left"
          title={isSoundActive ? 'Click to Turn Off Music' : 'Click to Turn On Music'}
        >
          <span className="font-black text-xs sm:text-sm text-[#2E1F0F] font-serif">
            Music: {isSoundActive ? 'On' : 'Off'}
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#FAF6ED] border border-[#D5C29E] flex items-center justify-center text-[#B45309]">
            {isSoundActive ? (
              <Volume2 className="w-4 h-4 text-[#B45309] animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#DC2626]" />
            )}
          </div>
        </button>

        {/* Box 4: Login / Account Button */}
        <button
          onClick={() => onOpenAuthModal?.()}
          className="lg:col-span-3 bg-[#FBBF24] hover:bg-[#F59E0B] border-2 border-[#2E1F0F] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 text-[#2E1F0F] font-black text-xs sm:text-sm shadow-xs cursor-pointer transition-transform active:scale-[0.99]"
          title={currentUser ? 'Cloud Account Connected' : 'Login or Create Account'}
        >
          <span className="truncate">
            {currentUser ? 'Cloud Account' : 'Login / Account'}
          </span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 2 & 3: NAVIGATION & LIVE CURRENCIES (6 columns x 2 rows)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
        {/* ROW 1: BUTTONS & CURRENCIES */}

        {/* 1. Home (Active state: warm amber/gold) */}
        <button
          onClick={() => setActiveTab('HOME')}
          className="bg-[#FBBF24] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#2E1F0F] font-black text-xs sm:text-sm shadow-xs cursor-pointer"
        >
          <span className="capitalize">home</span>
          <Home className="w-4 h-4 text-[#2E1F0F]" />
        </button>

        {/* 2. PVE */}
        <button
          onClick={() => setActiveTab('PVE')}
          className="bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#2E1F0F] font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition-all active:scale-95"
        >
          <span>PVE</span>
          <Shield className="w-4 h-4 text-[#B45309]" />
        </button>

        {/* 3. PARTY */}
        <button
          onClick={() => setActiveTab('PARTY')}
          className="bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#2E1F0F] font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition-all active:scale-95"
        >
          <span>PARTY</span>
          <Users className="w-4 h-4 text-[#B45309]" />
        </button>

        {/* 4. Friends */}
        <button
          onClick={() => setActiveTab('FRIENDS')}
          className="bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#2E1F0F] font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition-all active:scale-95"
        >
          <span>Friends</span>
          <Users className="w-4 h-4 text-[#B45309]" />
        </button>

        {/* 5. Energy */}
        <div
          className="bg-[#E6F9F5] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#047857] font-black text-xs sm:text-sm shadow-xs"
          title="Battle Energy"
        >
          <span className="truncate">
            Energy : {currencies.energy} / {currencies.maxEnergy}
          </span>
          <Zap className="w-4 h-4 text-[#059669] fill-emerald-500 shrink-0" />
        </div>

        {/* 6. SP */}
        <div
          className="bg-[#E0F7FA] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#0284C7] font-black text-xs sm:text-sm shadow-xs"
          title="Summon Points"
        >
          <span className="truncate">SP : {currencies.summonPoints}</span>
          <Sparkles className="w-4 h-4 text-[#0284C7] shrink-0" />
        </div>

        {/* ROW 2: BUTTONS & CURRENCIES */}

        {/* 7. Profile */}
        <button
          onClick={() => onOpenProfileModal?.('OVERVIEW')}
          className="bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#2E1F0F] font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition-all active:scale-95"
        >
          <span>Profile</span>
          <User className="w-4 h-4 text-[#B45309]" />
        </button>

        {/* 8. PVP */}
        <button
          onClick={() => setIsPvPModalOpen(true)}
          className="bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#2E1F0F] font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition-all active:scale-95"
        >
          <span>PVP</span>
          <Swords className="w-4 h-4 text-[#B45309]" />
        </button>

        {/* 9. SUMMON */}
        <button
          onClick={() => setActiveTab('SUMMON')}
          className="bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#2E1F0F] font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition-all active:scale-95"
        >
          <span>SUMMON</span>
          <Star className="w-4 h-4 text-[#F59E0B] fill-amber-400" />
        </button>

        {/* 10. Fusion */}
        <button
          onClick={() => setActiveTab('FUSION')}
          className="bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#2E1F0F] font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition-all active:scale-95"
        >
          <span>Fusion</span>
          <Flame className="w-4 h-4 text-[#EA580C]" />
        </button>

        {/* 11. Gold */}
        <div
          className="bg-[#FFFBEB] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#92400E] font-black text-xs sm:text-sm shadow-xs"
          title="Gold"
        >
          <span className="truncate">Gold : {formattedGold}</span>
          <Coins className="w-4 h-4 text-[#D97706] shrink-0" />
        </div>

        {/* 12. Gems */}
        <div
          className="bg-[#FAF5FF] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#6B21A8] font-black text-xs sm:text-sm shadow-xs"
          title="Gems"
        >
          <span className="truncate">Gems : {currencies.gems}</span>
          <Gem className="w-4 h-4 text-[#9333EA] shrink-0" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 4: MAIN 2-COLUMN SHOWCASE (News & Updates | Astral Portal)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 items-stretch">
        {/* Left Card: News & Updates */}
        <div className="bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            {/* Pill Header */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFBEB] border-2 border-[#2E1F0F] text-xs font-bold text-[#2E1F0F] uppercase tracking-wider mb-4 shadow-2xs">
              <Megaphone className="w-3.5 h-3.5 text-[#B45309]" />
              <span>news & updates</span>
            </div>

            {/* Inset White Content Box */}
            <div className="bg-white border-2 border-[#E5D7BE] rounded-2xl p-4 sm:p-5 shadow-inner min-h-[190px] flex flex-col justify-between space-y-3">
              <div>
                <p className="font-mono font-black text-xs sm:text-sm text-[#2E1F0F] leading-snug tracking-wide">
                  NEWS : NEW UNITS HAVE BEEN ADDED , PVP AND PVE RELEASED!
                </p>

                <div className="mt-3 pt-3 border-t border-[#F0E6D2] space-y-1.5 text-xs text-[#5C4A34]">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>
                      <strong>3-Wave Equipment Dungeons:</strong> Defeat 2 enemy waves and battle the dungeon boss to unlock Tiered Substat loot.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>
                      <strong>PvP & Friendly Sparring:</strong> Challenge rival NPC guardians or duel your friends with 0 stamina cost.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>
                      <strong>Astral Portal Rate Boost:</strong> 5x higher legendary drops active on featured elemental summons.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-[#E8DEC8] mt-4">
            <span className="text-xs font-semibold text-[#78654E]">
              Updated today at 04:00 UTC
            </span>
            <button
              onClick={() => setIsNewsModalOpen(true)}
              className="bg-[#FBBF24] hover:bg-[#F59E0B] text-[#2E1F0F] font-black text-xs sm:text-sm py-2 px-4 rounded-xl border-2 border-[#2E1F0F] shadow-xs cursor-pointer flex items-center gap-2 transition-transform active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Full News</span>
            </button>
          </div>
        </div>

        {/* Right Card: Astral Portal Showcase */}
        <div className="bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            {/* Pill Header */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5FF] border-2 border-[#2E1F0F] text-xs font-bold text-[#6B21A8] uppercase tracking-wider mb-2.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#9333EA]" />
              <span>new summon banner</span>
            </div>

            {/* Title & Description */}
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#1E112A] tracking-tight mb-1">
              Astral Portal Showcase
            </h2>
            <p className="text-xs text-[#5C4A34] leading-relaxed mb-3">
              Roll on the Standard and Featured banners to acquire rare, epic, and legendary
              elemental variants. Claim your daily free ticket or use Gems for multi-pulls!
            </p>

            {/* Inset Featured Event Banner */}
            <div className="bg-gradient-to-r from-[#170F28] via-[#24143D] to-[#120B20] border-2 border-[#F59E0B] rounded-2xl p-4 sm:p-5 text-white flex items-center justify-between gap-4 shadow-md relative overflow-hidden">
              {/* Subtle ambient light */}
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

              <div className="relative z-10 space-y-1">
                <span className="bg-[#FEF08A] text-[#713F12] font-black text-[10px] px-2.5 py-0.5 rounded-full inline-block uppercase tracking-wider shadow-2xs">
                  FEATURED EVENT
                </span>
                <h3 className="text-lg sm:text-xl font-black font-serif text-[#FDE047] drop-shadow-sm">
                  Celestial Dragon & Friends
                </h3>
                <p className="text-xs text-amber-200/90 font-medium">
                  5x Higher Legendary Drop Rate Active
                </p>
              </div>

              {/* Creature Icon in Gold Box */}
              <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400/20 border-2 border-[#F59E0B] flex items-center justify-center text-amber-300 shadow-inner shrink-0">
                <Flame className="w-8 h-8 text-amber-400 drop-shadow" />
              </div>
            </div>
          </div>

          {/* Card Footer Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-[#E8DEC8] mt-4">
            <span className="text-xs sm:text-sm font-black text-[#6B21A8] font-mono flex items-center gap-1.5">
              <Gem className="w-3.5 h-3.5 text-[#9333EA]" />
              <span>Cost: 100 Gems/pull</span>
            </span>
            <button
              onClick={() => setActiveTab('SUMMON')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm py-2 px-5 rounded-xl border-2 border-[#2E1F0F] shadow-sm cursor-pointer flex items-center gap-2 transition-transform active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Summon Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 5: BOTTOM SPONSORED BANNER / ADSENSE PLACEMENT
          ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 text-center shadow-xs">
        <span className="bg-[#1E1F24] text-white px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider font-mono shadow-2xs">
          GOOGLE ADSENSE
        </span>
        <span className="text-xs font-bold text-[#5C4A34]">
          Sponsored Banner / Google Adsense Placement (Responsive 970×90 Slot)
        </span>
      </div>

      {/* Developer Studio Buttons for Dean */}
      {isAuthorizedDev && (
        <div className="pt-2 flex items-center justify-center gap-2">
          <button
            onClick={() => setIsMapManagerOpen(true)}
            className="px-3 py-1 rounded-xl bg-[#FAF6ED] border border-[#2E1F0F] text-[11px] font-bold text-[#78654E] hover:text-[#2E1F0F] flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5 text-amber-700" />
            <span>Map Studio</span>
          </button>
          <button
            onClick={() => setIsPortraitManagerOpen(true)}
            className="px-3 py-1 rounded-xl bg-[#FAF6ED] border border-[#2E1F0F] text-[11px] font-bold text-[#78654E] hover:text-[#2E1F0F] flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-700" />
            <span>Portraits</span>
          </button>
          {openDevTools && (
            <button
              onClick={openDevTools}
              className="px-3 py-1 rounded-xl bg-[#FAF6ED] border border-[#2E1F0F] text-[11px] font-bold text-[#78654E] hover:text-[#2E1F0F] flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-800" />
              <span>Dev Tools</span>
            </button>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODALS: PVP ARENA, NEWS & PATCH NOTES, DEV TOOLS
          ═══════════════════════════════════════════════════════════════ */}
      <PvPArenaModal
        isOpen={isPvPModalOpen}
        onClose={() => setIsPvPModalOpen(false)}
        onStartPvPBattle={(stage) => {
          if (onStartBattle) {
            onStartBattle(stage);
          }
        }}
        onNavigateToFriends={() => setActiveTab('FRIENDS')}
        profile={profile}
      />

      <NewsAndUpdatesModal
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        onNavigateToTab={setActiveTab}
      />

      {isAuthorizedDev && (
        <MapManagerModal
          isOpen={isMapManagerOpen}
          onClose={() => setIsMapManagerOpen(false)}
        />
      )}

      {isAuthorizedDev && (
        <MonsterPortraitManagerModal
          isOpen={isPortraitManagerOpen}
          onClose={() => setIsPortraitManagerOpen(false)}
        />
      )}
    </div>
  );
};
