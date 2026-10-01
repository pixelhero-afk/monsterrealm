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
  Wrench,
  Award,
  Clock,
  CheckCircle2,
  Mail,
  MessageSquare,
  Globe,
  Package,
  Store,
  Gift,
} from 'lucide-react';
import { Currencies, PlayerMonster, PlayerProfile, PvEStage, isDevAccount, ScrollsInventory } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { ActiveTab } from './Navbar';
import { MONSTER_VARIANTS } from '../data/monsters';
import { MonsterAvatar } from './MonsterAvatar';
import { musicEngine } from '../services/audio/musicEngine';
import { getMissionsProgressSummary, formatPlaytimeProgress } from '../services/dailyMissionsService';
import { PvPArenaModal } from './arena/PvPArenaModal';
import { NewsAndUpdatesModal } from './news/NewsAndUpdatesModal';
import { getUnclaimedMailCount } from '../services/mailboxService';
import { GoogleAdSenseBanner } from './ads/GoogleAdSenseBanner';

interface HomeHubProps {
  profile: PlayerProfile;
  monsters: PlayerMonster[];
  stages: PvEStage[];
  currencies: Currencies;
  currentUser?: FirebaseUser | null;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenProfileModal?: (tab?: 'OVERVIEW' | 'REWARDS' | 'AVATAR' | 'MAILBOX') => void;
  onOpenAuthModal?: () => void;
  onStartBattle?: (stage: PvEStage) => void;
  onStartArenaBattle?: (stage: PvEStage) => void;
  onOpenArena?: () => void;
  onSparBattle?: (friend: any) => void;
  openDevTools?: (tab?: any) => void;
  onOpenDailyMissions?: () => void;
  unclaimedMissionsCount?: number;
  onOpenChat?: (tab?: 'WORLD' | 'PRIVATE', targetUser?: any) => void;
  onOpenInventory?: () => void;
  onOpenShop?: () => void;
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
  onStartArenaBattle,
  onOpenArena,
  onSparBattle,
  openDevTools,
  onOpenDailyMissions,
  unclaimedMissionsCount = 0,
  onOpenChat,
  onOpenInventory,
  onOpenShop,
}) => {
  const [musicState, setMusicState] = useState(musicEngine.getState());
  const [isPvPModalOpen, setIsPvPModalOpen] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);

  const isAuthorizedDev = isDevAccount(profile?.username) || isDevAccount(currentUser?.email);
  const unclaimedMailCount = getUnclaimedMailCount(profile);

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

  const totalScrollsCount = profile?.scrolls
    ? profile.scrolls.normal + profile.scrolls.epic + profile.scrolls.legendary + profile.scrolls.lightDark
    : 0;

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

          {/* Unclaimed Mailbox Badge & Green Online Dot */}
          <div className="flex items-center gap-1.5 shrink-0">
            {unclaimedMailCount > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProfileModal?.('MAILBOX');
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-[9px] font-black shadow-xs animate-bounce font-mono cursor-pointer"
                title={`${unclaimedMailCount} Unclaimed Gifts in Mailbox!`}
              >
                <Mail className="w-2.5 h-2.5" />
                <span>{unclaimedMailCount}</span>
              </span>
            )}
            <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
          </div>
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

        {/* 6. Inventory (in place of SP) */}
        <button
          onClick={() => onOpenInventory?.()}
          className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] hover:from-[#FDE68A] hover:to-[#FCD34D] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#92400E] font-black text-xs sm:text-sm shadow-xs cursor-pointer transition-all active:scale-95 group"
          title="Open Adventurer Inventory (Scrolls, Awakening Stones, Gear)"
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-serif">Inventory</span>
            {totalScrollsCount > 0 && (
              <span className="bg-[#B45309] text-white text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full">
                {totalScrollsCount}
              </span>
            )}
          </div>
          <Package className="w-4 h-4 text-[#B45309] group-hover:rotate-12 transition-transform shrink-0" />
        </button>

        {/* ROW 2: BUTTONS & CURRENCIES */}

        {/* 7. Profile & Mailbox */}
        <button
          onClick={() => onOpenProfileModal?.('OVERVIEW')}
          className="bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#2E1F0F] font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition-all active:scale-95 group"
        >
          <div className="flex items-center gap-1.5">
            <span>Profile</span>
            {unclaimedMailCount > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProfileModal?.('MAILBOX');
                }}
                className="bg-red-500 hover:bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full font-mono animate-pulse"
                title={`${unclaimedMailCount} Unclaimed Mailbox Gifts`}
              >
                {unclaimedMailCount} Mail
              </span>
            )}
          </div>
          <User className="w-4 h-4 text-[#B45309]" />
        </button>

        {/* 8. Grand Arena (PvP) */}
        <button
          onClick={() => {
            if (onOpenArena) {
              onOpenArena();
            } else {
              setIsPvPModalOpen(true);
            }
          }}
          className="bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl py-2 px-3 sm:px-4 flex items-center justify-between text-[#2E1F0F] font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition-all active:scale-95 group"
          title="Battle rival summoners and climb the Rating Highscores"
        >
          <div className="flex flex-col text-left">
            <span className="font-serif">Grand Arena</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-[#92400E] font-mono font-black leading-tight">
                {(profile.arenaRating || 1000).toLocaleString()} PTS
              </span>
              <span className="text-[8px] font-black uppercase px-1 py-0.1 rounded bg-amber-100 text-amber-900 border border-amber-300">
                PvP
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-[#B45309] group-hover:scale-110 transition-transform shadow-2xs">
            <Swords className="w-4 h-4" />
          </div>
        </button>

        {/* 9. SUMMON */}
        <button
          onClick={() => setActiveTab('SUMMON')}
          className="bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#2E1F0F] font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition-all active:scale-95"
        >
          <span>SUMMON</span>
          <Star className="w-4 h-4 text-[#F59E0B] fill-amber-400" />
        </button>

        {/* 10. Magic Shop (Rotates every 24 hours) */}
        <button
          onClick={() => onOpenShop?.()}
          className="bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-amber-400/20 hover:from-amber-400/30 hover:to-orange-400/30 border-2 border-[#2E1F0F] rounded-2xl py-2 px-3 sm:px-4 flex items-center justify-between text-[#2E1F0F] font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition-all active:scale-95 group"
          title="Wandering Merchant's 24-Hour Rotating Magic Shop"
        >
          <div className="flex flex-col text-left">
            <span className="font-serif font-black">Magic Shop</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] text-[#92400E] font-black font-mono">
                24h Merchant
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-200 border border-amber-400 flex items-center justify-center text-[#B45309] group-hover:scale-110 transition-transform shadow-2xs">
            <Store className="w-4 h-4" />
          </div>
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
          ROW 3.5: DAILY MISSIONS & BOUNTIES STRIP
          ═══════════════════════════════════════════════════════════════ */}
      {onOpenDailyMissions && (() => {
        const dailySummary = getMissionsProgressSummary(profile.dailyMissions);
        return (
          <div
            onClick={onOpenDailyMissions}
            className="group cursor-pointer bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FFFBEB] border-2 border-[#D97706] rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative overflow-hidden"
          >
            {/* Ambient subtle light */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

            {/* Left: Icon & Title */}
            <div className="flex items-center gap-3 relative z-10 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 border border-[#B45309] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-serif font-black text-xs sm:text-sm text-[#2E1F0F] tracking-wide">
                    DAILY MISSIONS & BOUNTIES
                  </span>
                  <span className="bg-[#B45309] text-amber-100 text-[9px] font-black px-2 py-0.2 rounded-full font-mono uppercase tracking-wider">
                    💎 +100 Gems Bonus
                  </span>
                </div>
                <p className="text-[11px] text-[#78654E] truncate max-w-xl">
                  Win 3 Battles, Summon a Monster, and Play 1h for Stamina & SP!
                </p>
              </div>
            </div>

            {/* Right: Progress bar & Action */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end relative z-10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-20 sm:w-28 h-2 rounded-full bg-[#E5D7BE] border border-[#CBB89A] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${(dailySummary.completedCount / dailySummary.totalCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-[#5C4A34] whitespace-nowrap">
                  {dailySummary.completedCount}/{dailySummary.totalCount} Complete
                </span>
              </div>

              {unclaimedMissionsCount > 0 ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDailyMissions();
                  }}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs py-1.5 px-3.5 rounded-xl border border-amber-600 shadow-sm cursor-pointer flex items-center gap-1.5 animate-bounce shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-white" />
                  <span>{unclaimedMissionsCount} Ready to Claim!</span>
                </button>
              ) : dailySummary.allClearClaimed ? (
                <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold py-1 px-3 rounded-xl flex items-center gap-1 shadow-2xs shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>All Done for Today!</span>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDailyMissions();
                  }}
                  className="bg-[#FAF6ED] hover:bg-[#F3ECE0] border border-[#D5C29E] text-[#2E1F0F] font-bold text-xs py-1.5 px-3 rounded-xl cursor-pointer flex items-center gap-1 transition-colors shadow-2xs shrink-0"
                >
                  <span>Open Missions</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════
          ROW 3.6: REALM WORLD CHAT & PRIVATE COMS BANNER
          ═══════════════════════════════════════════════════════════════ */}
      {onOpenChat && (
        <div
          onClick={() => onOpenChat('WORLD')}
          className="group cursor-pointer bg-gradient-to-r from-[#FFFDF9] via-[#FAF4E6] to-[#FEF3C7] border-2 border-amber-400 rounded-2xl p-3 sm:p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative overflow-hidden"
        >
          <div className="flex items-center gap-3 relative z-10 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 border border-[#2E1F0F] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-serif font-black text-xs sm:text-sm text-[#2E1F0F] tracking-wide">
                  REALM WORLD CHAT & PRIVATE COMS
                </span>
                <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.2 rounded-full font-mono uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Live Real-Time
                </span>
              </div>
              <p className="text-[11px] text-[#78654E] truncate max-w-xl">
                Broadcast strategies across Monster Realms or send direct messages to friends & wardens.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenChat('WORLD');
              }}
              className="bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F] font-black text-xs py-1.5 px-3.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Globe className="w-3.5 h-3.5 text-amber-700" />
              <span>World Chat</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenChat('PRIVATE');
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs py-1.5 px-3.5 rounded-xl border border-amber-700 cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-white" />
              <span>Direct Comms</span>
            </button>
          </div>
        </div>
      )}

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
      <GoogleAdSenseBanner />

      {/* Developer Studio Buttons for Dean */}
      {isAuthorizedDev && openDevTools && (
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => openDevTools('NEWS')}
            className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-400 text-xs font-black text-amber-950 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            title="Edit announcements, patch notes & events"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-800" />
            <span>Edit News</span>
          </button>
          <button
            onClick={() => openDevTools('BANNERS')}
            className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 border border-purple-400 text-xs font-black text-purple-950 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            title="Edit summon banner, rates & featured champions"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-800" />
            <span>Edit Banners</span>
          </button>
          <button
            onClick={() => openDevTools('GIFTER')}
            className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 border border-emerald-400 text-xs font-black text-emerald-950 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            title="Gift gems, scrolls, stones and items to players"
          >
            <Gift className="w-3.5 h-3.5 text-emerald-800" />
            <span>Gift Players</span>
          </button>
          <button
            onClick={() => openDevTools()}
            className="px-3 py-1.5 rounded-xl bg-[#FAF6ED] hover:bg-[#F3EAD3] border border-[#2E1F0F] text-xs font-bold text-[#78654E] hover:text-[#2E1F0F] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            title="Open Sandbox Console"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-800" />
            <span>All Dev Tools</span>
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODALS: PVP ARENA, NEWS & PATCH NOTES, DEV TOOLS
          ═══════════════════════════════════════════════════════════════ */}
      <PvPArenaModal
        isOpen={isPvPModalOpen}
        onClose={() => setIsPvPModalOpen(false)}
        onStartPvPBattle={(stage) => {
          if (onStartArenaBattle) {
            onStartArenaBattle(stage);
          } else if (onStartBattle) {
            onStartBattle(stage);
          }
        }}
        onNavigateToFriends={() => setActiveTab('FRIENDS')}
        profile={profile}
        monsters={monsters}
      />

      <NewsAndUpdatesModal
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        onNavigateToTab={setActiveTab}
        onOpenNewsEditor={() => {
          setIsNewsModalOpen(false);
          openDevTools?.('NEWS');
        }}
        isDev={isAuthorizedDev}
      />
    </div>
  );
};
