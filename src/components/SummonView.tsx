/**
 * Monster Realms - Astral Summon Gate
 * Cinematic fantasy summoning altar with interactive rune circle ritual,
 * dramatic card flip reveals, rarity shockwaves, transparent probabilities, and duplicate compensation.
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Gem,
  Coins,
  Flame,
  Info,
  CheckCircle2,
  X,
  Award,
  Crown,
  Zap,
  Eye,
  ArrowUpRight,
  Scroll,
  Edit3,
} from 'lucide-react';
import { Currencies, SummonBanner, SummonResult, MonsterVariant, PlayerMonster, PlayerProfile, ScrollType, ScrollsInventory, isDevAccount } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { ActiveTab } from './Navbar';
import { performSummon, performScrollSummon } from '../services/apiClient';
import { MonsterCard } from './MonsterCard';
import { ELEMENT_VISUALS } from '../data/elements';
import { SUMMON_BANNERS } from '../data/banners';
import { HubCommandHeader, HubCurrenciesMatrix } from './common/HubCommandHeader';
import { GoogleAdSenseBanner } from './ads/GoogleAdSenseBanner';

export const SCROLL_CONFIGS: Record<ScrollType, {
  name: string;
  subtitle: string;
  source: string;
  rarities: string;
  description: string;
  elements: string;
  bgGrad: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  rates: Record<string, string>;
}> = {
  normal: {
    name: 'Normal Mystical Scroll',
    subtitle: '1-3★ Water, Fire, Grass',
    source: 'Found in Campaign stages if lucky',
    rarities: '1★ to 3★',
    description: 'Ancient parchment woven from elemental leylines. Summons a 1-3 star monster of Water, Fire, or Grass.',
    elements: 'Water / Fire / Grass',
    bgGrad: 'from-emerald-500/10 via-amber-500/10 to-blue-500/10',
    borderColor: 'border-emerald-600',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    rates: {
      '3★ Rare': '10.0%',
      '2★ Uncommon': '35.0%',
      '1★ Common': '55.0%',
    },
  },
  epic: {
    name: 'Epic Mystical Scroll',
    subtitle: '1-5★ Water, Fire, Grass (0.5% 5★)',
    source: 'Found in Middle to High Level Dungeons if lucky',
    rarities: '1★ to 5★ (0.5% 5★)',
    description: 'Imbued with potent concentrated ether. Summons a 1-5 star Water, Fire, or Grass monster with a 0.5% chance for a 5-star Legendary.',
    elements: 'Water / Fire / Grass',
    bgGrad: 'from-purple-500/15 via-indigo-500/10 to-rose-500/15',
    borderColor: 'border-purple-600',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    rates: {
      '5★ Legendary': '0.5%',
      '4★ Epic': '8.5%',
      '3★ Rare': '25.0%',
      '2★ Uncommon': '33.0%',
      '1★ Common': '33.0%',
    },
  },
  legendary: {
    name: 'Legendary Sovereign Scroll',
    subtitle: 'Guaranteed 5★ Water, Fire, Grass',
    source: 'Exclusive to Special Realm Events',
    rarities: 'Guaranteed 5★ Legendary',
    description: 'Forged in dragonfire and celestial radiance. Summons a guaranteed 5-star Legendary champion of Fire, Water, or Grass.',
    elements: 'Water / Fire / Grass',
    bgGrad: 'from-amber-400/25 via-yellow-300/20 to-orange-400/25',
    borderColor: 'border-amber-600',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    rates: {
      '5★ Legendary': '100%',
    },
  },
  lightDark: {
    name: 'Light and Dark Scroll',
    subtitle: '1-5★ Light or Dark Monster',
    source: 'Exclusive to Special Realm Events',
    rarities: '1★ to 5★ Light / Dark',
    description: 'Carved with eclipse runes. Breaks the planar veil to summon a 1-5 star creature of primordial Light or Dark.',
    elements: 'Light / Dark',
    bgGrad: 'from-indigo-900/15 via-purple-600/15 to-amber-400/15',
    borderColor: 'border-indigo-600',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    rates: {
      '5★ Legendary': '0.5%',
      '4★ Epic': '8.5%',
      '3★ Rare': '25.0%',
      '2★ Uncommon': '33.0%',
      '1★ Common': '33.0%',
    },
  },
};

interface SummonViewProps {
  banners: SummonBanner[];
  currencies: Currencies;
  monsters?: PlayerMonster[];
  profile?: PlayerProfile;
  currentUser?: FirebaseUser | null;
  initialScrollType?: ScrollType;
  onRefresh: () => void;
  onNavigateToFusion?: () => void;
  onSummonPerformed?: (count: number) => void;
  setActiveTab?: (tab: ActiveTab) => void;
  onOpenProfileModal?: (tab?: 'OVERVIEW' | 'REWARDS' | 'AVATAR' | 'MAILBOX') => void;
  onOpenAuthModal?: () => void;
  onOpenBannerEditor?: () => void;
}

export const SummonView: React.FC<SummonViewProps> = ({
  banners = [],
  currencies,
  monsters = [],
  profile,
  currentUser,
  initialScrollType,
  onRefresh,
  onNavigateToFusion,
  onSummonPerformed,
  setActiveTab,
  onOpenProfileModal,
  onOpenAuthModal,
  onOpenBannerEditor,
}) => {
  const [selectedBannerId, setSelectedBannerId] = useState<string>(
    banners[0]?.bannerId || 'banner_featured_nekohime'
  );
  const [category, setCategory] = useState<'BANNERS' | 'SCROLLS'>(
    initialScrollType ? 'SCROLLS' : 'BANNERS'
  );
  const [selectedScroll, setSelectedScroll] = useState<ScrollType>(
    initialScrollType || 'normal'
  );
  const [isSummoning, setIsSummoning] = useState<boolean>(false);
  const [ritualPhase, setRitualPhase] = useState<'IDLE' | 'CONVERGING' | 'OPENING_GATES' | 'BURST' | 'REVEALING'>(
    'IDLE'
  );
  const [summonResults, setSummonResults] = useState<SummonResult[] | null>(null);
  const [revealedIndices, setRevealedIndices] = useState<Record<number, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRatesModal, setShowRatesModal] = useState<boolean>(false);

  useEffect(() => {
    if (initialScrollType) {
      setCategory('SCROLLS');
      setSelectedScroll(initialScrollType);
    }
  }, [initialScrollType]);

  const scrolls: ScrollsInventory = profile?.scrolls || {
    normal: 0,
    epic: 0,
    legendary: 0,
    lightDark: 0,
  };
  const totalScrollsCount = scrolls.normal + scrolls.epic + scrolls.legendary + scrolls.lightDark;
  const currentScrollDef = SCROLL_CONFIGS[selectedScroll] || SCROLL_CONFIGS.normal;
  const availableScrolls = scrolls[selectedScroll] || 0;

  const activeBanner: SummonBanner =
    banners.find((b) => b.bannerId === selectedBannerId) || banners[0] || SUMMON_BANNERS[0];

  const activeProbabilities: Record<string, string | number> =
    category === 'SCROLLS'
      ? currentScrollDef.rates
      : activeBanner?.probabilities ||
        (activeBanner?.rates
          ? {
              '5★ Legendary': `${Math.round((activeBanner.rates.legendary || 0) * 100)}%`,
              '4★ Epic': `${Math.round((activeBanner.rates.epic || 0) * 100)}%`,
              '3★ Rare': `${Math.round((activeBanner.rates.rare || 0) * 100)}%`,
              '2★ Uncommon': `${Math.round((activeBanner.rates.uncommon || 0) * 100)}%`,
              '1★ Common': `${Math.round((activeBanner.rates.common || 0) * 100)}%`,
            }
          : {
              '5★ Legendary': '2%',
              '4★ Epic': '8%',
              '3★ Rare': '20%',
              '2★ Uncommon': '30%',
              '1★ Common': '40%',
            });

  const handleSummon = async (count: number) => {
    try {
      setIsSummoning(true);
      setErrorMsg(null);
      setRitualPhase('CONVERGING');

      // 1. Run actual API summon call
      const res = await performSummon(activeBanner.bannerId, count);

      // 2. Play ritual charging -> Gate Opening effect -> Burst flash -> Cards Reveal
      setTimeout(() => {
        setRitualPhase('OPENING_GATES');
        setTimeout(() => {
          setRitualPhase('BURST');
          setTimeout(() => {
            setRitualPhase('IDLE');
            setIsSummoning(false);
            setSummonResults(res.results);
            onSummonPerformed?.(count);
            onRefresh();
          }, 450);
        }, 850);
      }, 550);
    } catch (err: any) {
      setRitualPhase('IDLE');
      setIsSummoning(false);
      setErrorMsg(err.message || 'Summoning failed');
    }
  };

  const handleScrollSummon = async (scrollType: ScrollType, count: number) => {
    try {
      setIsSummoning(true);
      setErrorMsg(null);
      setRitualPhase('CONVERGING');

      const res = await performScrollSummon(scrollType, count);

      setTimeout(() => {
        setRitualPhase('OPENING_GATES');
        setTimeout(() => {
          setRitualPhase('BURST');
          setTimeout(() => {
            setRitualPhase('IDLE');
            setIsSummoning(false);
            setSummonResults(res.results);
            onSummonPerformed?.(count);
            onRefresh();
          }, 450);
        }, 850);
      }, 550);
    } catch (err: any) {
      setRitualPhase('IDLE');
      setIsSummoning(false);
      setErrorMsg(err.message || 'Scroll summon operation failed');
    }
  };

  const handleRevealAll = () => {
    if (!summonResults) return;
    const allRevealed: Record<number, boolean> = {};
    summonResults.forEach((_, idx) => {
      allRevealed[idx] = true;
    });
    setRevealedIndices(allRevealed);
  };

  const handleRevealCard = (idx: number) => {
    setRevealedIndices((prev) => ({ ...prev, [idx]: true }));
  };

  const allCardsRevealed =
    summonResults &&
    summonResults.length > 0 &&
    summonResults.every((_, idx) => revealedIndices[idx]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-3.5 sm:space-y-4 relative z-10">
      {/* ═══════════════════════════════════════════════════════════════
          ROW 1: TOP HEADER (HOME, Player Profile, Music Toggle, Cloud Account)
          ═══════════════════════════════════════════════════════════════ */}
      <HubCommandHeader
        activeTab="SUMMON"
        setActiveTab={setActiveTab}
        profile={profile || ({} as any)}
        currentUser={currentUser}
        onOpenProfileModal={onOpenProfileModal}
        onOpenAuthModal={onOpenAuthModal}
      />

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-3 rounded-2xl bg-[#FFF1F2] border border-[#FDA4AF] text-[#9F1239] text-xs flex items-center justify-between shadow-sm">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="cursor-pointer hover:text-[#4C0519]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          ROW 2: BANNER GATES SUB-NAV & CURRENCIES MATRIX
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 items-stretch">
        {/* Left Half: Subnav Grid (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-2">
          {/* Category Switcher: Astral Banners vs Mystic Scrolls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCategory('BANNERS')}
              className={`flex-1 py-2 px-3 rounded-xl font-serif text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                category === 'BANNERS'
                  ? 'bg-[#FEF3C7] border-2 border-[#D97706] text-[#92400E] shadow-2xs'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#78654E]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Astral Banners</span>
            </button>

            <button
              onClick={() => setCategory('SCROLLS')}
              className={`flex-1 py-2 px-3 rounded-xl font-serif text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                category === 'SCROLLS'
                  ? 'bg-[#FEF3C7] border-2 border-[#D97706] text-[#92400E] shadow-2xs'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#78654E]'
              }`}
            >
              <Scroll className="w-3.5 h-3.5 text-purple-600" />
              <span>Mystic Scrolls</span>
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-black ${
                totalScrollsCount > 0 ? 'bg-[#D97706] text-white animate-pulse' : 'bg-stone-200 text-stone-600'
              }`}>
                {totalScrollsCount}
              </span>
            </button>
          </div>

          {category === 'BANNERS' ? (
            <>
              {/* Row 2a: Banner buttons & Fusion portal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {banners.slice(0, 3).map((banner) => {
                  const isSelected = banner.bannerId === activeBanner.bannerId;
                  const isFeatured = banner.featuredVariantIds && banner.featuredVariantIds.length > 0;

                  return (
                    <button
                      key={banner.bannerId}
                      onClick={() => setSelectedBannerId(banner.bannerId)}
                      className={`py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                        isSelected
                          ? 'bg-[#FFFDF9] border-[3px] border-[#F59E0B] text-[#2E1F0F] ring-2 ring-amber-300/40 font-black'
                          : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F]'
                      }`}
                      title={banner.name}
                    >
                      {isFeatured ? (
                        <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <span className="truncate">{banner.name.split(' ')[0]}</span>
                    </button>
                  );
                })}

                {/* Fusion Chamber Quick Link */}
                <button
                  onClick={() => (onNavigateToFusion ? onNavigateToFusion() : setActiveTab?.('FUSION'))}
                  className="py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F] flex items-center justify-center gap-1.5"
                  title="Open Fusion Chamber"
                >
                  <Flame className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Fusion</span>
                </button>
              </div>

              {/* Row 2b: Additional banners or placeholder slots */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {banners.slice(3, 4).map((banner) => {
                  const isSelected = banner.bannerId === activeBanner.bannerId;
                  return (
                    <button
                      key={banner.bannerId}
                      onClick={() => setSelectedBannerId(banner.bannerId)}
                      className={`py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                        isSelected
                          ? 'bg-[#FFFDF9] border-[3px] border-[#F59E0B] text-[#2E1F0F] ring-2 ring-amber-300/40 font-black'
                          : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F]'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="truncate">{banner.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
                {/* Developer Banner Editor Shortcut */}
                {(isDevAccount(profile?.username) || isDevAccount(currentUser?.email)) && onOpenBannerEditor ? (
                  <button
                    onClick={onOpenBannerEditor}
                    className="py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer bg-purple-100 hover:bg-purple-200 border-2 border-purple-500 text-purple-950 flex items-center justify-center gap-1.5"
                    title="Open Summon Banner LiveOps Editor"
                  >
                    <Edit3 className="w-4 h-4 text-purple-700 shrink-0" />
                    <span>Edit Banners</span>
                  </button>
                ) : (
                  <div className="py-2.5 px-3 rounded-2xl bg-[#E2EEF5]/40 border-2 border-dashed border-[#B0C4D0] pointer-events-none" />
                )}
                <div className="py-2.5 px-3 rounded-2xl bg-[#E2EEF5]/40 border-2 border-dashed border-[#B0C4D0] hidden sm:block pointer-events-none" />
                <div className="py-2.5 px-3 rounded-2xl bg-[#E2EEF5]/40 border-2 border-dashed border-[#B0C4D0] hidden sm:block pointer-events-none" />
              </div>
            </>
          ) : (
            /* Mystic Scrolls Subnav (4 Scroll Types) */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['normal', 'epic', 'legendary', 'lightDark'] as ScrollType[]).map((sType) => {
                const sDef = SCROLL_CONFIGS[sType];
                const count = scrolls[sType] || 0;
                const isSelected = selectedScroll === sType;

                return (
                  <button
                    key={sType}
                    onClick={() => setSelectedScroll(sType)}
                    className={`py-2 px-2.5 rounded-2xl font-bold text-xs shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-[#FFFDF9] border-[3px] border-[#F59E0B] text-[#2E1F0F] ring-2 ring-amber-300/40 font-black'
                        : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F]'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Scroll className="w-3.5 h-3.5 text-amber-700" />
                      <span className="truncate font-serif">{sDef.name.split(' ')[0]}</span>
                    </div>
                    <span className={`text-[10px] font-mono font-black px-2 py-0.2 rounded-full ${
                      count > 0 ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/50' : 'bg-stone-100 text-stone-500'
                    }`}>
                      x{count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Half: 2x2 Currencies Matrix (5 cols) */}
        <div className="lg:col-span-5">
          <HubCurrenciesMatrix currencies={currencies} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 3: MAIN VIEW CONTAINER (Framed Box with 2px Dark Border)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xs min-h-[500px]">

          {/* Main Summoning Altar Canvas */}
          <div className="relative rounded-2xl sm:rounded-3xl bg-[#FAF6ED] p-4 sm:p-10 shadow-xs overflow-hidden text-center border-2 border-[#2E1F0F]">
            {/* Layer 1: Ambient Background Astral Nebulae */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FDE68A]/35 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#BAE6FD]/35 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/60 rounded-full blur-2xl pointer-events-none" />

            {/* Layer 2: Interactive Swirling Leyline Rune Circle */}
            <div
              className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700 ${
                ritualPhase === 'CONVERGING'
                  ? 'scale-125 opacity-90'
                  : ritualPhase === 'OPENING_GATES'
                  ? 'scale-140 opacity-100'
                  : ritualPhase === 'BURST'
                  ? 'scale-160 opacity-100'
                  : 'opacity-40'
              }`}
            >
              <svg viewBox="0 0 500 500" className="w-[600px] h-[600px] animate-spin-slow">
                <defs>
                  <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D97706" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#0284C7" />
                  </linearGradient>
                </defs>
                {/* Outer Rune Bands */}
                <circle cx="250" cy="250" r="230" fill="none" stroke="url(#circleGrad)" strokeWidth="2.5" strokeDasharray="16 8" />
                <circle cx="250" cy="250" r="180" fill="none" stroke="#D97706" strokeWidth="1.5" />
                <circle cx="250" cy="250" r="120" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="8 4" />
                {/* Intersecting Pentagram / Astrolabe Triangles */}
                <polygon points="250,30 420,360 80,360" fill="none" stroke="#D97706" strokeWidth="2" />
                <polygon points="250,470 80,140 420,140" fill="none" stroke="#0284C7" strokeWidth="2" />
                {/* Elemental Nodes around circle */}
                <circle cx="250" cy="30" r="8" fill="#EF4444" />
                <circle cx="440" cy="180" r="8" fill="#0284C7" />
                <circle cx="370" cy="420" r="8" fill="#16A34A" />
                <circle cx="130" cy="420" r="8" fill="#F59E0B" />
                <circle cx="60" cy="180" r="8" fill="#9333EA" />
              </svg>
            </div>

            {/* Layer 2.5: Astral Summon Gate Opening Cinematic Visual Effect */}
            {(ritualPhase === 'CONVERGING' || ritualPhase === 'OPENING_GATES' || ritualPhase === 'BURST') && (
              <div className="absolute inset-0 z-25 pointer-events-none summon-gate-portal-perspective overflow-hidden flex items-center justify-center">
                {/* Cosmic Celestial Portal Core behind the gates */}
                <div
                  className={`absolute inset-0 transition-opacity duration-700 flex items-center justify-center ${
                    ritualPhase === 'OPENING_GATES' || ritualPhase === 'BURST'
                      ? 'opacity-100'
                      : 'opacity-40'
                  }`}
                >
                  <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-amber-400/40 via-yellow-200/50 to-sky-400/40 blur-3xl animate-pulse" />
                  <div className="absolute w-72 h-72 rounded-full bg-amber-100/70 blur-2xl" />
                  <div className="absolute w-[650px] h-[650px] rounded-full border border-amber-300/40 animate-gate-rays pointer-events-none" />
                </div>

                {/* Left Ornate Astral Gate Door */}
                <div
                  className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-br from-[#2D1F13] via-[#3B291A] to-[#1E140C] border-r-2 border-[#F59E0B] shadow-2xl transition-all duration-700 ease-out origin-left flex items-center justify-end overflow-hidden"
                  style={{
                    transform:
                      ritualPhase === 'OPENING_GATES' || ritualPhase === 'BURST'
                        ? 'perspective(1200px) rotateY(-82deg) scaleX(0.85) translateX(-8%)'
                        : 'perspective(1200px) rotateY(0deg) scaleX(1) translateX(0%)',
                    boxShadow:
                      ritualPhase === 'OPENING_GATES' || ritualPhase === 'BURST'
                        ? '0 0 40px rgba(245, 158, 11, 0.6)'
                        : 'none',
                  }}
                >
                  {/* Ornate Door Engravings & Shimmer */}
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-amber-300 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/10 to-transparent pointer-events-none animate-gate-shimmer" />
                  
                  {/* Left Door Handle & Medallion Half */}
                  <div className="relative mr-4 sm:mr-8 flex items-center gap-2">
                    <div className="w-10 sm:w-14 h-24 sm:h-32 rounded-l-full border-2 border-r-0 border-[#F59E0B] bg-gradient-to-l from-[#B45309]/80 to-[#78350F]/80 flex items-center justify-center shadow-lg">
                      <Sparkles className="w-4 sm:w-6 h-4 sm:h-6 text-[#FEF08A] animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Right Ornate Astral Gate Door */}
                <div
                  className="absolute top-0 bottom-0 right-0 w-1/2 bg-gradient-to-bl from-[#2D1F13] via-[#3B291A] to-[#1E140C] border-l-2 border-[#F59E0B] shadow-2xl transition-all duration-700 ease-out origin-right flex items-center justify-start overflow-hidden"
                  style={{
                    transform:
                      ritualPhase === 'OPENING_GATES' || ritualPhase === 'BURST'
                        ? 'perspective(1200px) rotateY(82deg) scaleX(0.85) translateX(8%)'
                        : 'perspective(1200px) rotateY(0deg) scaleX(1) translateX(0%)',
                    boxShadow:
                      ritualPhase === 'OPENING_GATES' || ritualPhase === 'BURST'
                        ? '0 0 40px rgba(245, 158, 11, 0.6)'
                        : 'none',
                  }}
                >
                  {/* Ornate Door Engravings & Shimmer */}
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-amber-300 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/10 to-transparent pointer-events-none animate-gate-shimmer" />

                  {/* Right Door Handle & Medallion Half */}
                  <div className="relative ml-4 sm:ml-8 flex items-center gap-2">
                    <div className="w-10 sm:w-14 h-24 sm:h-32 rounded-r-full border-2 border-l-0 border-[#F59E0B] bg-gradient-to-r from-[#B45309]/80 to-[#78350F]/80 flex items-center justify-center shadow-lg">
                      <Crown className="w-4 sm:w-6 h-4 sm:h-6 text-[#FEF08A] animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Gate Center Leyline Beam when opening */}
                <div
                  className={`absolute top-0 bottom-0 w-2.5 bg-gradient-to-b from-amber-200 via-white to-amber-200 shadow-[0_0_35px_#F59E0B] transition-all duration-500 pointer-events-none ${
                    ritualPhase === 'OPENING_GATES'
                      ? 'scale-y-100 opacity-100 scale-x-150'
                      : 'scale-y-50 opacity-0 scale-x-50'
                  }`}
                />
              </div>
            )}

            {/* Layer 3: Screen Burst Flash on Summon */}
            {ritualPhase === 'BURST' && (
              <div className="absolute inset-0 bg-[#FEF9C3]/80 z-30 animate-ping pointer-events-none" />
            )}

            {/* Content Container */}
            <div
              className={`relative z-10 max-w-2xl mx-auto transition-all duration-700 ${
                ritualPhase === 'OPENING_GATES' || ritualPhase === 'BURST'
                  ? 'scale-95 opacity-20 filter blur-xs'
                  : ritualPhase === 'CONVERGING'
                  ? 'scale-98 opacity-90'
                  : 'scale-100 opacity-100'
              }`}
            >
              {category === 'BANNERS' ? (
                <>
                  {/* Altar Badge */}
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FEF3C7] border border-[#F59E0B]/60 text-[#92400E] text-xs font-black mb-3 shadow-2xs">
                    <Sparkles className="w-4 h-4 text-[#D97706]" />
                    <span className="tracking-wider">ASTRAL NEXUS SUMMONING ALTAR</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black text-[#2E1F0F] font-serif tracking-wide mb-2">
                    {activeBanner.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#5C4A34] mb-6 leading-relaxed font-medium">
                    {activeBanner.description}
                  </p>

                  {/* Rates & Pity Tracker */}
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8 text-xs">
                    <button
                      onClick={() => setShowRatesModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-[#D5C29E] hover:border-[#D97706] text-[#2E1F0F] hover:text-[#92400E] font-black text-xs shadow-xs hover:bg-[#FAF6ED] transition-all cursor-pointer"
                    >
                      <Info className="w-4 h-4 text-[#D97706]" />
                      <span>View Probabilities & Drop Rates</span>
                    </button>
                    <span className="hidden sm:inline text-[#D5C29E]">•</span>
                    <span className="text-[#92400E] font-black bg-[#FEF3C7] px-3.5 py-1.5 rounded-xl border-2 border-[#F59E0B]/60 shadow-xs flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Pity Guaranteed at {activeBanner.pityThreshold} Summons</span>
                    </span>
                  </div>

                  {/* Summoning Action Controls (1x & 10x) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-md mx-auto">
                    {/* 1x Summon */}
                    <button
                      disabled={isSummoning}
                      onClick={() => handleSummon(1)}
                      className="p-4 sm:p-5 rounded-2xl border-2 border-[#2E1F0F] bg-[#FFFDF9] hover:bg-[#FAF6ED] text-[#2E1F0F] font-black transition-all shadow-xs cursor-pointer disabled:opacity-50 flex flex-col items-center justify-center group active:scale-95"
                    >
                      <span className="text-base text-[#2E1F0F] font-serif mb-1.5 tracking-wide">
                        Single Ritual (1x)
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-[#92400E] font-black">
                        {activeBanner.cost.type === 'SUMMON_POINTS' ? (
                          <>
                            <Sparkles className="w-4 h-4 text-[#16A34A]" />
                            <span>{activeBanner.cost.amount} SP</span>
                          </>
                        ) : (
                          <>
                            <Gem className="w-4 h-4 text-[#7C3AED]" />
                            <span>{activeBanner.cost.amount} Gems</span>
                          </>
                        )}
                      </div>
                    </button>

                    {/* 10x Summon */}
                    <button
                      disabled={isSummoning}
                      onClick={() => handleSummon(10)}
                      className="p-4 sm:p-5 rounded-2xl border-2 border-[#2E1F0F] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-[#2E1F0F] font-black transition-all shadow-xs cursor-pointer disabled:opacity-50 flex flex-col items-center justify-center group active:scale-95"
                    >
                      <span className="text-base font-serif mb-1.5 tracking-wide">
                        Grand Ritual (10x)
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#2E1F0F]">
                        {activeBanner.cost.type === 'SUMMON_POINTS' ? (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>{activeBanner.cost.amount * 10} SP</span>
                          </>
                        ) : (
                          <>
                            <Gem className="w-4 h-4" />
                            <span>{activeBanner.cost.amount * 10} Gems</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                /* Mystic Scrolls Altar Mode */
                <>
                  {/* Altar Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full ${currentScrollDef.badgeBg} border ${currentScrollDef.borderColor} ${currentScrollDef.badgeText} text-xs font-black mb-3 shadow-2xs`}>
                    <Scroll className="w-4 h-4" />
                    <span className="tracking-wider">MYSTIC SCROLL SUMMONING ALTAR</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black text-[#2E1F0F] font-serif tracking-wide mb-1">
                    {currentScrollDef.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#92400E] font-bold mb-2">
                    {currentScrollDef.subtitle}
                  </p>
                  <p className="text-xs sm:text-sm text-[#5C4A34] mb-4 leading-relaxed font-medium max-w-xl mx-auto">
                    {currentScrollDef.description}
                  </p>

                  {/* Pills: Source, Elements, Owned Count */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-xs">
                    <span className="px-3 py-1 rounded-xl bg-white border border-[#D5C29E] text-[#5C4A34] font-medium shadow-2xs">
                      📍 {currentScrollDef.source}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] font-bold shadow-2xs">
                      ✨ Elements: {currentScrollDef.elements}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-900 font-black font-mono shadow-2xs">
                      📜 Available: {availableScrolls}
                    </span>
                  </div>

                  {/* Rates Modal Trigger */}
                  <div className="flex items-center justify-center mb-6">
                    <button
                      onClick={() => setShowRatesModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-[#D5C29E] hover:border-[#D97706] text-[#2E1F0F] hover:text-[#92400E] font-black text-xs shadow-xs hover:bg-[#FAF6ED] transition-all cursor-pointer"
                    >
                      <Info className="w-4 h-4 text-[#D97706]" />
                      <span>View Scroll Probabilities & Rates</span>
                    </button>
                  </div>

                  {/* Scroll Summon Action Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                    {/* Single Scroll Summon */}
                    <button
                      disabled={isSummoning || availableScrolls < 1}
                      onClick={() => handleScrollSummon(selectedScroll, 1)}
                      className="p-4 sm:p-5 rounded-2xl border-2 border-[#2E1F0F] bg-[#FFFDF9] hover:bg-[#FAF6ED] text-[#2E1F0F] font-black transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center justify-center group active:scale-95"
                    >
                      <span className="text-base text-[#2E1F0F] font-serif mb-1 tracking-wide">
                        Summon 1 Monster
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-[#92400E] font-black font-mono">
                        <Scroll className="w-3.5 h-3.5 text-amber-700" />
                        <span>Use 1 Scroll</span>
                      </div>
                    </button>

                    {/* Multi Scroll Summon (up to 10) */}
                    {(() => {
                      const multiCount = Math.max(1, Math.min(10, availableScrolls));
                      return (
                        <button
                          disabled={isSummoning || availableScrolls < 1}
                          onClick={() => handleScrollSummon(selectedScroll, multiCount)}
                          className="p-4 sm:p-5 rounded-2xl border-2 border-[#2E1F0F] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-[#2E1F0F] font-black transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center justify-center group active:scale-95"
                        >
                          <span className="text-base font-serif mb-1 tracking-wide">
                            Summon {availableScrolls > 0 ? `${multiCount}x Monsters` : '10x Monsters'}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs font-black text-[#2E1F0F] font-mono">
                            <Scroll className="w-3.5 h-3.5" />
                            <span>Use {multiCount} Scrolls</span>
                          </div>
                        </button>
                      );
                    })()}
                  </div>

                  {/* Empty Scroll Notice / Farming Tip */}
                  {availableScrolls === 0 && (
                    <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs max-w-md mx-auto text-center font-medium">
                      <span>You have 0 {currentScrollDef.name}s. </span>
                      {selectedScroll === 'normal' && (
                        <span>Win Campaign battles to find lucky Normal Scrolls!</span>
                      )}
                      {selectedScroll === 'epic' && (
                        <span>Battle Floor 4-10 in Elemental Dungeons for lucky Epic Scroll drops!</span>
                      )}
                      {(selectedScroll === 'legendary' || selectedScroll === 'lightDark') && (
                        <span>Look out for Special Events or check the 24-Hour Magic Shop!</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Synthesis Callout Banner inside Summon Gate */}
          <div className="mt-6 rounded-2xl sm:rounded-3xl bg-[#FAF6ED] border-2 border-[#2E1F0F] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 border border-[#2E1F0F] flex items-center justify-center text-white shadow-xs shrink-0">
                <Flame className="w-6 h-6 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black font-serif text-[#2E1F0F]">
                    Alchemical Monster Synthesis Altar
                  </h3>
                  <span className="text-[9px] uppercase font-black tracking-widest text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] px-2 py-0.5 rounded-full shadow-2xs">
                    Forge Higher Tiers
                  </span>
                </div>
                <p className="text-xs text-[#78654E] mt-0.5">
                  Have lower-tier or duplicate monsters? Fuse any two matching-tier catalysts to forge higher-tier champions with dual element resonance!
                </p>
              </div>
            </div>

            {onNavigateToFusion && (
              <button
                onClick={onNavigateToFusion}
                className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 border-2 border-[#2E1F0F] text-[#2E1F0F] text-xs font-black uppercase tracking-wider shadow-xs hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>Enter Fusion Altar</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              BOTTOM SPONSORED BANNER / ADSENSE PLACEMENT
              ═══════════════════════════════════════════════════════════════ */}
          <div className="mt-6">
            <GoogleAdSenseBanner />
          </div>

      {/* REVEAL & RESULTS MODAL */}
      {summonResults && (
        <div className="fixed inset-0 z-50 bg-[#1E1710]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-4 mb-6">
              <div className="text-left">
                <div className="flex items-center gap-2 text-xs font-black text-[#92400E] uppercase tracking-widest">
                  <Sparkles className="w-4 h-4 text-[#D97706]" />
                  Astral Nexus Reveal
                </div>
                <h2 className="text-2xl font-black font-serif tracking-wide text-[#2E1F0F] mt-0.5">
                  Summoning Manifest
                </h2>
              </div>

              {!allCardsRevealed && summonResults.length > 1 && (
                <button
                  onClick={handleRevealAll}
                  className="fantasy-btn-gold px-4 py-2 rounded-xl text-xs font-black cursor-pointer shadow-sm"
                >
                  Reveal All
                </button>
              )}
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 p-2">
              {summonResults.map((res, idx) => {
                const isRevealed = revealedIndices[idx];
                const isEpicOrLegendary =
                  res.variant.rarity === 'EPIC' || res.variant.rarity === 'LEGENDARY';

                return (
                  <div
                    key={`${res.instance.instanceId}_${idx}`}
                    onClick={() => {
                      if (!isRevealed) {
                        handleRevealCard(idx);
                      }
                    }}
                    className="flex flex-col items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-102"
                  >
                    {isRevealed ? (
                      <div className="relative w-full flex flex-col items-center animate-fade-in">
                        {/* New Badge */}
                        {res.isNew && (
                          <span className="absolute -top-2.5 z-20 bg-[#16A34A] text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-md ring-2 ring-white animate-bounce">
                            ★ NEW!
                          </span>
                        )}

                        <MonsterCard
                          variant={res.variant}
                          level={1}
                          size="sm"
                          showStats={false}
                          className="w-full shadow-md"
                        />

                        {/* Duplicate Compensation */}
                        {res.isDuplicate && res.duplicateCompensation && (
                          <div className="mt-1 text-[9px] text-[#92400E] font-semibold bg-[#FEF3C7] px-2 py-0.5 rounded-lg border border-[#F59E0B]/50 w-full truncate">
                            Dup: +{res.duplicateCompensation.gold}g & shards
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Face-down Mysterious Rune Card */
                      <div
                        className={`w-full h-44 rounded-2xl border-2 flex flex-col items-center justify-center p-3 text-center transition-all duration-300 shadow-md ${
                          isEpicOrLegendary
                            ? 'border-[#D97706] bg-gradient-to-b from-[#FEF3C7] to-[#FAF6ED] ring-2 ring-[#F59E0B]/40 animate-pulse'
                            : 'border-[#D5C29E] bg-gradient-to-b from-[#FAF6ED] to-[#F3ECE0] hover:scale-105'
                        }`}
                      >
                        <Sparkles
                          className={`w-8 h-8 mb-2 ${
                            isEpicOrLegendary ? 'text-[#D97706]' : 'text-[#78654E]'
                          }`}
                        />
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#2E1F0F]">
                          {isEpicOrLegendary ? 'HIGH AURA' : 'ASTRAL RUNE'}
                        </span>
                        <span className="text-[9px] text-[#78654E] mt-1 font-semibold">
                          Tap to Reveal 3D
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Dismiss Button */}
            {allCardsRevealed && (
              <button
                onClick={() => {
                  setSummonResults(null);
                  setRitualPhase('IDLE');
                }}
                className="mt-8 w-full max-w-sm py-3.5 rounded-2xl font-black text-sm fantasy-btn-gold shadow-lg cursor-pointer transition-transform hover:scale-105 mx-auto block uppercase tracking-wider"
              >
                Collect Monsters & Return
              </button>
            )}
          </div>
        </div>
      )}

      {/* RATES MODAL */}
      {showRatesModal && (
        <div className="fixed inset-0 z-50 bg-[#1E1710]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full fantasy-scroll-card p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DEC8] mb-4">
              <h3 className="font-bold text-base text-[#2E1F0F] font-serif">
                Summon Probabilities & Drop Rates
              </h3>
              <button onClick={() => setShowRatesModal(false)} className="cursor-pointer text-[#78654E] hover:text-[#2E1F0F]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-4">
              {Object.entries(activeProbabilities).map(([rarity, prob]) => {
                const displayVal = typeof prob === 'number' ? `${prob}%` : prob;
                return (
                  <div
                    key={rarity}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF6ED] border border-[#D5C29E]"
                  >
                    <span className="font-bold text-[#2E1F0F]">{rarity}</span>
                    <span className="font-black text-[#92400E] font-mono">
                      {displayVal}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Boss Exclusion Policy Notice */}
            <div className="p-3 rounded-2xl bg-[#FEF3C7] border border-[#F59E0B]/40 text-[11px] text-[#78350F] mb-6 space-y-1">
              <div className="font-bold text-[#92400E] flex items-center gap-1.5">
                <span>👑</span>
                <span>Continent Boss Exclusions</span>
              </div>
              <p className="text-[#92400E]/90 leading-relaxed font-medium">
                Continental Chapter Overlords (Ignis Sovereign, Leviathan Sovereign, Yggdrasil Ancient, Solar Archon, and Void Sovereign) are exclusive to PvE Campaign Apex encounters (1-10, 2-10, 3-10, 4-10, 5-10) and are <strong>strictly excluded from all summoning gates</strong>. They cannot be summoned or obtained by players.
              </p>
            </div>

            <button
              onClick={() => setShowRatesModal(false)}
              className="w-full py-3 rounded-2xl bg-[#2E1F0F] text-white border-2 border-[#2E1F0F] hover:bg-[#45311B] font-black text-xs uppercase tracking-wider cursor-pointer shadow-md transition-colors"
            >
              Close Rates Window
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
