/**
 * Monster Realms - Alchemical Synthesis Chamber
 * High-fantasy transmutation altar allowing players to fuse two lower-tier catalyst monsters
 * into a higher-tier champion with dual-element resonance, automatic gear salvage,
 * interactive runic ritual animation, and dynamic outcome predictions.
 */

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Flame,
  Coins,
  Shield,
  Lock,
  Unlock,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  X,
  HelpCircle,
  Filter,
  Layers,
  ChevronRight,
  RefreshCw,
  Zap,
  Info,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { Currencies, ElementType, PlayerMonster, PlayerProfile, Rarity } from '../types';
import { MONSTER_VARIANTS } from '../data/monsters';
import { ELEMENT_VISUALS } from '../data/elements';
import { MonsterCard } from './MonsterCard';
import { MonsterAvatar } from './MonsterAvatar';
import { MonsterStarRating } from './MonsterStarRating';
import { SynthesisOutcomePreviewPanel } from './SynthesisOutcomePreviewPanel';
import { synthesizeMonsters, toggleMonsterLock } from '../services/apiClient';
import {
  getMonsterStars,
  getStarDisplayConfig,
  getSynthesisStarCost,
  validateSynthesisEligibility,
  MAX_MONSTER_STARS,
} from '../utils/monsterStars';
import { getBaseMonsterName } from '../utils/monsterNames';

interface SynthesisChamberProps {
  monsters: PlayerMonster[];
  currencies: Currencies;
  profile?: PlayerProfile;
  onRefresh: () => void;
  onSwitchToSummon?: () => void;
}

const RARITY_COLORS: Record<Rarity, { border: string; bg: string; text: string; ring: string }> = {
  COMMON: {
    border: 'border-slate-300',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    ring: 'ring-slate-300',
  },
  UNCOMMON: {
    border: 'border-emerald-400',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    ring: 'ring-emerald-400',
  },
  RARE: {
    border: 'border-blue-400',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    ring: 'ring-blue-400',
  },
  EPIC: {
    border: 'border-purple-400',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    ring: 'ring-purple-400',
  },
  LEGENDARY: {
    border: 'border-amber-400',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    ring: 'ring-amber-400',
  },
};

export const SynthesisChamber: React.FC<SynthesisChamberProps> = ({
  monsters,
  currencies,
  profile,
  onRefresh,
  onSwitchToSummon,
}) => {
  // Selected Catalyst Slots (Slot 1 = Result Host, Slot 2 = Catalyst)
  const [slot1Id, setSlot1Id] = useState<string | null>(null);
  const [slot2Id, setSlot2Id] = useState<string | null>(null);

  // Active target slot for monster picker
  const [activeSlotTarget, setActiveSlotTarget] = useState<1 | 2>(1);

  // Filters for ingredient inventory
  const [starFilter, setStarFilter] = useState<string>('ALL');
  const [elementFilter, setElementFilter] = useState<string>('ALL');
  const [onlyPairsFilter, setOnlyPairsFilter] = useState<boolean>(false);

  // Transmutation state
  const [isTransmuting, setIsTransmuting] = useState<boolean>(false);
  const [transmutationPhase, setTransmutationPhase] = useState<'IDLE' | 'CHARGING' | 'FUSION' | 'BURST'>('IDLE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synthesis Result Modal
  const [synthesizedResult, setSynthesizedResult] = useState<{
    newMonster: PlayerMonster;
    variant: any;
    sacrificedNames: string[];
    previousStars: number;
    targetStars: number;
    goldSpent: number;
    unequippedItemsCount: number;
  } | null>(null);

  // Guide modal state
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Outcome Preview panel state
  const [showOutcomePreview, setShowOutcomePreview] = useState<boolean>(true);

  // Resolved monster objects
  const monster1 = useMemo(() => monsters.find((m) => m.instanceId === slot1Id) || null, [monsters, slot1Id]);
  const monster2 = useMemo(() => monsters.find((m) => m.instanceId === slot2Id) || null, [monsters, slot2Id]);

  const variant1 = monster1 ? MONSTER_VARIANTS[monster1.variantId] : null;
  const variant2 = monster2 ? MONSTER_VARIANTS[monster2.variantId] : null;

  const stars1 = monster1 && variant1 ? getMonsterStars(monster1, variant1) : null;
  const stars2 = monster2 && variant2 ? getMonsterStars(monster2, variant2) : null;

  // Validation using monsterStars utility
  const validation = useMemo(() => {
    return validateSynthesisEligibility(monster1, monster2, MONSTER_VARIANTS);
  }, [monster1, monster2]);

  const areMonstersCompatible = validation.eligible;
  const targetStars = validation.nextStars || (stars1 ? Math.min(MAX_MONSTER_STARS, stars1 + 1) : null);
  const goldCost = validation.goldCost || (stars1 ? getSynthesisStarCost(stars1) : 0);
  const hasEnoughGold = currencies.gold >= goldCost;

  // Star display config
  const targetStarConfig = targetStars ? getStarDisplayConfig(targetStars) : null;

  // Possible target outcome: in the new system, Host is the result with +1 star
  const possibleOutcomeVariants = useMemo(() => {
    if (!variant1) return [];
    return [variant1];
  }, [variant1]);

  // Resonance / Element relationship
  const resonanceInfo = useMemo(() => {
    if (!variant1 || !variant2) return null;
    if (variant1.element === variant2.element) {
      return {
        type: 'PURE' as const,
        text: `Pure ${variant1.element} Kinship (Result Host: ${variant1.name})`,
        element: variant1.element,
      };
    }
    return {
      type: 'DUAL' as const,
      text: `Elemental Synthesis (${variant2.element} Catalyst into ${variant1.element} Host Result)`,
      elements: [variant1.element, variant2.element],
    };
  }, [variant1, variant2]);

  // Calculate pairs available in player inventory: (same familyId + same stars)
  const pairableKeys = useMemo(() => {
    const keyCounts: Record<string, number> = {};
    monsters.forEach((m) => {
      const v = MONSTER_VARIANTS[m.variantId];
      if (v && !m.locked) {
        const s = getMonsterStars(m, v);
        if (s < MAX_MONSTER_STARS) {
          const key = `${v.familyId}_${s}`;
          keyCounts[key] = (keyCounts[key] || 0) + 1;
        }
      }
    });
    return keyCounts;
  }, [monsters]);

  // Filtered monsters for selection list
  const filteredMonsters = useMemo(() => {
    return monsters.filter((m) => {
      const v = MONSTER_VARIANTS[m.variantId];
      if (!v) return false;
      const s = getMonsterStars(m, v);

      // Filter by stars
      if (starFilter !== 'ALL') {
        const targetS = parseInt(starFilter, 10);
        if (s !== targetS) return false;
      }

      // Filter by element
      if (elementFilter !== 'ALL' && v.element !== elementFilter) return false;

      // Filter by pairs only
      if (onlyPairsFilter) {
        const key = `${v.familyId}_${s}`;
        if ((pairableKeys[key] || 0) < 2) return false;
      }

      return true;
    });
  }, [monsters, starFilter, elementFilter, onlyPairsFilter, pairableKeys]);

  // Handle slot selection / click
  const handleSelectMonster = (instanceId: string) => {
    setErrorMsg(null);

    // If already in slot 1, remove from slot 1
    if (slot1Id === instanceId) {
      setSlot1Id(null);
      setActiveSlotTarget(1);
      return;
    }
    // If already in slot 2, remove from slot 2
    if (slot2Id === instanceId) {
      setSlot2Id(null);
      setActiveSlotTarget(2);
      return;
    }

    const m = monsters.find((item) => item.instanceId === instanceId);
    if (!m) return;

    if (m.locked) {
      setErrorMsg('This monster is locked. Unlock it below before synthesizing.');
      return;
    }

    const v = MONSTER_VARIANTS[m.variantId];
    if (!v) return;
    const s = getMonsterStars(m, v);

    // Placing into activeSlotTarget
    if (activeSlotTarget === 1 || !slot1Id) {
      if (s >= MAX_MONSTER_STARS) {
        setErrorMsg(`${v.name} is already at the 10★ Sovereign star limit.`);
        return;
      }
      setSlot1Id(instanceId);
      // If slot 2 is empty, set next target to slot 2
      if (!slot2Id) {
        setActiveSlotTarget(2);
      }
    } else {
      // Placing in slot 2 (Catalyst)
      if (variant1 && monster1) {
        if (v.familyId !== variant1.familyId) {
          setErrorMsg(
            `Kind mismatch: Only the same kind of monster can fuse (e.g. Nekohime + Nekohime). ${v.name} cannot fuse with ${variant1.name}.`
          );
          return;
        }
        if (s !== stars1) {
          setErrorMsg(
            `Star mismatch: Catalyst 1 is ${stars1}★. Catalyst 2 must also be ${stars1}★.`
          );
          return;
        }
      }
      setSlot2Id(instanceId);
    }
  };

  // Toggle monster lock
  const handleToggleLock = async (instanceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleMonsterLock(instanceId);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to toggle lock');
    }
  };

  // Execute synthesis
  const handleSynthesize = async () => {
    if (!slot1Id || !slot2Id) {
      setErrorMsg('Please select both a Host Monster and a Catalyst Monster.');
      return;
    }
    if (!validation.eligible) {
      setErrorMsg(validation.errorReason || 'These monsters cannot be fused.');
      return;
    }
    if (!hasEnoughGold) {
      setErrorMsg(`Insufficient Gold. Synthesis requires ${goldCost.toLocaleString()} Gold.`);
      return;
    }

    try {
      setIsTransmuting(true);
      setErrorMsg(null);
      setTransmutationPhase('CHARGING');

      // Play dramatic charging animation
      setTimeout(async () => {
        setTransmutationPhase('FUSION');

        try {
          const res = await synthesizeMonsters(slot1Id, slot2Id);

          setTimeout(() => {
            setTransmutationPhase('BURST');

            setTimeout(() => {
              setTransmutationPhase('IDLE');
              setIsTransmuting(false);
              setSlot1Id(null);
              setSlot2Id(null);
              setActiveSlotTarget(1);
              setSynthesizedResult({
                newMonster: res.newMonster,
                variant: res.variant,
                sacrificedNames: res.sacrificedNames,
                previousStars: res.previousStars,
                targetStars: res.targetStars,
                goldSpent: res.goldSpent,
                unequippedItemsCount: res.unequippedItemsCount,
              });
              onRefresh();
            }, 500);
          }, 600);
        } catch (apiErr: any) {
          setTransmutationPhase('IDLE');
          setIsTransmuting(false);
          setErrorMsg(apiErr.message || 'Synthesis transmutation failed.');
        }
      }, 700);
    } catch (err: any) {
      setTransmutationPhase('IDLE');
      setIsTransmuting(false);
      setErrorMsg(err.message || 'Synthesis failed');
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Error / Feedback Banner */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-[#FFF1F2] border border-[#FDA4AF] text-[#9F1239] text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="cursor-pointer hover:text-[#4C0519] p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Synthesis Altar Chamber Hero Card */}
      <div className="relative rounded-3xl fantasy-scroll-card p-6 sm:p-10 shadow-2xl overflow-hidden border-2 border-[#D4AF37]/60">
        {/* Background Ambient Alchemical Energy */}
        <div className="absolute -top-36 -left-36 w-[450px] h-[450px] bg-amber-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-36 -right-36 w-[450px] h-[450px] bg-purple-400/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />

        {/* Dynamic Leyline Swirl */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700 ${
            transmutationPhase === 'CHARGING'
              ? 'scale-115 opacity-80'
              : transmutationPhase === 'FUSION'
              ? 'scale-130 opacity-100'
              : transmutationPhase === 'BURST'
              ? 'scale-150 opacity-100'
              : 'opacity-30'
          }`}
        >
          <svg viewBox="0 0 500 500" className="w-[620px] h-[620px] animate-spin-slow">
            <defs>
              <linearGradient id="synthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D97706" />
                <stop offset="50%" stopColor="#9333EA" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
            </defs>
            <circle cx="250" cy="250" r="235" fill="none" stroke="url(#synthGrad)" strokeWidth="2.5" strokeDasharray="14 10" />
            <circle cx="250" cy="250" r="175" fill="none" stroke="#D97706" strokeWidth="1.5" />
            <circle cx="250" cy="250" r="115" fill="none" stroke="#9333EA" strokeWidth="2" strokeDasharray="8 6" />
            <polygon points="250,25 440,360 60,360" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
            <polygon points="250,475 60,140 440,140" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Burst Flash */}
        {transmutationPhase === 'BURST' && (
          <div className="absolute inset-0 bg-amber-100/80 z-30 animate-ping pointer-events-none" />
        )}

        {/* Top Header & Action Controls */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#E8DEC8] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 p-0.5 shadow-md">
              <div className="w-full h-full rounded-[14px] bg-[#FFFDF9] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#2E1F0F] font-serif tracking-wide">
                  Alchemical Monster Synthesis
                </h2>
                <span className="text-[10px] uppercase font-black tracking-widest text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] px-2.5 py-0.5 rounded-full shadow-2xs">
                  Tier Upgrade Altar
                </span>
              </div>
              <p className="text-xs text-[#5C4A34] font-medium">
                Combine two matching-tier monsters to forge a higher-tier champion.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGuideModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF6ED] border border-[#D5C29E] text-[#5C4A34] hover:text-[#92400E] font-bold text-xs cursor-pointer shadow-2xs hover:border-[#C5A059]"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Transmutation Rules</span>
            </button>

            {onSwitchToSummon && (
              <button
                onClick={onSwitchToSummon}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/50 text-[#92400E] font-bold text-xs cursor-pointer shadow-2xs hover:bg-[#FDE68A]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Astral Gate</span>
              </button>
            )}
          </div>
        </div>

        {/* Center Altar Stage: Catalyst Slot 1 + Crucible Forge + Catalyst Slot 2 */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-11 gap-4 items-center justify-center mb-8">
          {/* 1. CATALYST SLOT 1 (HOST MONSTER) */}
          <div className="md:col-span-4 flex flex-col items-center">
            <div className="text-center mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#78654E] flex items-center justify-center gap-1">
                <span>Slot 1: Result Host</span>
                {slot1Id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </span>
            </div>

            <div
              onClick={() => setActiveSlotTarget(1)}
              className={`w-full max-w-[240px] h-72 rounded-3xl border-2 p-4 flex flex-col items-center justify-between transition-all duration-300 relative cursor-pointer shadow-md ${
                slot1Id && variant1
                  ? `${RARITY_COLORS[variant1.rarity].border} ${RARITY_COLORS[variant1.rarity].bg} ring-2 ${RARITY_COLORS[variant1.rarity].ring}/50`
                  : activeSlotTarget === 1
                  ? 'border-amber-500 bg-amber-50/60 ring-4 ring-amber-400/30'
                  : 'border-[#D5C29E] bg-[#FAF6ED]/70 hover:border-amber-400'
              }`}
            >
              {slot1Id && monster1 && variant1 ? (
                <>
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSlot1Id(null);
                      setActiveSlotTarget(1);
                    }}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center shadow-xs cursor-pointer z-10"
                    title="Remove host"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Element Badge & Host Indicator */}
                  <div className="self-start flex items-center gap-1">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider shadow-2xs text-white uppercase"
                      style={{ backgroundColor: ELEMENT_VISUALS[variant1.element]?.colorHex || '#D97706' }}
                    >
                      {variant1.element}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                      HOST RESULT
                    </span>
                  </div>

                  {/* Monster Avatar */}
                  <div className="my-auto transform transition-transform group-hover:scale-105">
                    <MonsterAvatar variant={variant1} size="lg" />
                  </div>

                  {/* Details */}
                  <div className="w-full text-center mt-2 pt-2 border-t border-slate-200/60">
                    <div className="font-bold text-sm text-[#2E1F0F] truncate font-serif">
                      {variant1.name}
                    </div>
                    <div className="flex flex-col items-center justify-center gap-0.5 mt-0.5">
                      <div className="flex items-center gap-2 text-xs text-[#78654E]">
                        <span className="font-mono font-bold">Lv. {monster1.level}</span>
                        <span>•</span>
                        <span className="font-semibold text-amber-800">{variant1.rarity}</span>
                      </div>
                      {stars1 && <MonsterStarRating stars={stars1} size="xs" />}
                    </div>

                    {monster1.equipmentIds?.length > 0 && (
                      <div className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 mt-1 inline-flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        <span>{monster1.equipmentIds.length} gear retained</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-3">
                  <div className="w-14 h-14 rounded-full bg-[#FAF6ED] border-2 border-dashed border-[#D5C29E] flex items-center justify-center text-[#78654E] mb-3 group-hover:border-amber-500">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                  </div>
                  <span className="font-bold text-xs text-[#2E1F0F]">Select Host Monster</span>
                  <span className="text-[11px] text-[#78654E] mt-1">
                    Will ascend +1★ and keep its species & element
                  </span>
                  {activeSlotTarget === 1 && (
                    <span className="mt-3 text-[10px] uppercase font-black tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      Active Target
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. CENTER TRANSMUTATION FORGE & OUTCOME PREVIEW */}
          <div className="md:col-span-3 flex flex-col items-center text-center px-2 py-4">
            {/* Runic Energy Icon / Core */}
            <div className="relative mb-3">
              <div
                className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                  isTransmuting
                    ? 'border-amber-400 bg-amber-400/20 scale-110 shadow-lg shadow-amber-400/40 animate-pulse'
                    : areMonstersCompatible
                    ? 'border-purple-500 bg-purple-100/70 shadow-md shadow-purple-500/20'
                    : 'border-[#D5C29E] bg-[#FAF6ED]'
                }`}
              >
                <Zap
                  className={`w-8 h-8 ${
                    isTransmuting
                      ? 'text-amber-500 animate-spin-slow'
                      : areMonstersCompatible
                      ? 'text-purple-600'
                      : 'text-[#8C6D37]'
                  }`}
                />
              </div>
            </div>

            {/* Prediction Details */}
            {monster1 && monster2 && areMonstersCompatible && targetStars ? (
              <div className="w-full space-y-2 mb-4">
                <div className="p-2.5 rounded-2xl bg-[#FFFDF9] border border-amber-300/80 shadow-xs">
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#92400E]">
                    SYNTHESIS ASCENSION
                  </div>
                  <div className="text-sm font-black text-[#B45309] font-serif flex flex-col items-center gap-1 mt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-[#78654E]">{stars1}★</span>
                      <span className="text-amber-600 font-bold">➔</span>
                      <span className="font-mono font-black text-[#92400E]">{targetStars}★</span>
                    </div>
                    <MonsterStarRating stars={targetStars} size="sm" />
                  </div>

                  {resonanceInfo && (
                    <div className="text-[11px] font-medium text-[#78654E] mt-1">
                      {resonanceInfo.text}
                    </div>
                  )}
                </div>

                {/* Gold Cost Badge */}
                <div className="flex items-center justify-center gap-1.5 text-xs">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-[#5C4A34]">Cost:</span>
                  <span
                    className={`font-black font-mono ${
                      hasEnoughGold ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {goldCost.toLocaleString()} Gold
                  </span>
                </div>

                {/* Preview Outcome Panel Trigger Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowOutcomePreview(true);
                    const el = document.getElementById('synthesis-outcome-preview');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 hover:from-amber-500/20 hover:to-purple-500/20 border border-amber-300/80 text-[#92400E] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs hover:scale-[1.02] active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                  <span>Preview Outcome & Growth</span>
                </button>
              </div>
            ) : monster1 && monster2 && !areMonstersCompatible ? (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] mb-3">
                <div className="font-bold">Incompatible Monsters</div>
                <div>{validation.errorReason || 'Only the same kind with equal stars can fuse.'}</div>
              </div>
            ) : (
              <div className="text-[11px] text-[#78654E] mb-3 max-w-[180px]">
                Select a Host and a matching Catalyst monster of the same species and star tier.
              </div>
            )}

            {/* Synthesize Transmute Button */}
            <button
              disabled={
                isTransmuting ||
                !slot1Id ||
                !slot2Id ||
                !areMonstersCompatible ||
                !hasEnoughGold
              }
              onClick={handleSynthesize}
              className={`w-full py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                isTransmuting
                  ? 'bg-amber-400 text-amber-950 opacity-90 animate-pulse'
                  : slot1Id && slot2Id && areMonstersCompatible && hasEnoughGold
                  ? 'fantasy-btn-gold hover:scale-105 active:scale-95 shadow-amber-900/20'
                  : 'bg-[#E5D7BE] text-[#8C765C] cursor-not-allowed opacity-60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isTransmuting ? 'Transmuting...' : 'Ascend Monster'}</span>
            </button>
          </div>

          {/* 3. CATALYST SLOT 2 */}
          <div className="md:col-span-4 flex flex-col items-center">
            <div className="text-center mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#78654E] flex items-center justify-center gap-1">
                <span>Catalyst 2</span>
                {slot2Id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </span>
            </div>

            <div
              onClick={() => setActiveSlotTarget(2)}
              className={`w-full max-w-[240px] h-72 rounded-3xl border-2 p-4 flex flex-col items-center justify-between transition-all duration-300 relative cursor-pointer shadow-md ${
                slot2Id && variant2
                  ? `${RARITY_COLORS[variant2.rarity].border} ${RARITY_COLORS[variant2.rarity].bg} ring-2 ${RARITY_COLORS[variant2.rarity].ring}/50`
                  : activeSlotTarget === 2
                  ? 'border-amber-500 bg-amber-50/60 ring-4 ring-amber-400/30'
                  : 'border-[#D5C29E] bg-[#FAF6ED]/70 hover:border-amber-400'
              }`}
            >
              {slot2Id && monster2 && variant2 ? (
                <>
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSlot2Id(null);
                      setActiveSlotTarget(2);
                    }}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center shadow-xs cursor-pointer z-10"
                    title="Remove catalyst"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Element Badge */}
                  <div className="self-start">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider shadow-2xs text-white uppercase"
                      style={{ backgroundColor: ELEMENT_VISUALS[variant2.element]?.colorHex || '#D97706' }}
                    >
                      {variant2.element}
                    </span>
                  </div>

                  {/* Monster Avatar */}
                  <div className="my-auto transform transition-transform group-hover:scale-105">
                    <MonsterAvatar variant={variant2} size="lg" />
                  </div>

                  {/* Details */}
                  <div className="w-full text-center mt-2 pt-2 border-t border-slate-200/60">
                    <div className="font-bold text-sm text-[#2E1F0F] truncate font-serif">
                      {variant2.name}
                    </div>
                    <div className="flex flex-col items-center justify-center gap-0.5 mt-0.5">
                      <div className="flex items-center gap-2 text-xs text-[#78654E]">
                        <span className="font-mono font-bold">Lv. {monster2.level}</span>
                        <span>•</span>
                        <span className="font-semibold text-amber-800">{variant2.rarity}</span>
                      </div>
                      {stars2 && <MonsterStarRating stars={stars2} size="xs" />}
                    </div>

                    {monster2.equipmentIds?.length > 0 && (
                      <div className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 mt-1 inline-flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        <span>{monster2.equipmentIds.length} gear safe</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-3">
                  <div className="w-14 h-14 rounded-full bg-[#FAF6ED] border-2 border-dashed border-[#D5C29E] flex items-center justify-center text-[#78654E] mb-3 group-hover:border-amber-500">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                  </div>
                  <span className="font-bold text-xs text-[#2E1F0F]">Select Catalyst 2</span>
                  <span className="text-[11px] text-[#78654E] mt-1">
                    {variant1 && stars1
                      ? `Select a matching ${stars1}★ ${getBaseMonsterName(variant1.familyId || variant1.name)} catalyst`
                      : 'Tap a monster from your roster below'}
                  </span>
                  {activeSlotTarget === 2 && (
                    <span className="mt-3 text-[10px] uppercase font-black tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      Active Target
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Outcome Preview & Candidates Showcase */}
        {targetStars && possibleOutcomeVariants.length > 0 && (
          <div id="synthesis-outcome-preview" className="relative z-10 pt-5 border-t border-[#E8DEC8]">
            {monster1 && monster2 && areMonstersCompatible && variant1 && variant2 ? (
              showOutcomePreview ? (
                <SynthesisOutcomePreviewPanel
                  catalyst1={{ monster: monster1, variant: variant1 }}
                  catalyst2={{ monster: monster2, variant: variant2 }}
                  targetStars={targetStars}
                  possibleVariants={possibleOutcomeVariants}
                  resonanceInfo={resonanceInfo}
                  goldCost={goldCost}
                  playerGold={currencies.gold}
                  hasEnoughGold={hasEnoughGold}
                  isTransmuting={isTransmuting}
                  onConfirmFusion={handleSynthesize}
                  onClose={() => setShowOutcomePreview(false)}
                />
              ) : (
                <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#2E1F0F] font-serif flex items-center gap-1.5">
                        <span>{variant1.name} {targetStars}★ Ascension Outcome Ready</span>
                        <MonsterStarRating stars={targetStars} size="xs" />
                      </div>
                      <div className="text-[11px] text-[#78654E]">
                        Preview base stats, level scaling, and awakening potential before fusing.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOutcomePreview(true)}
                    className="px-4 py-2 rounded-xl fantasy-btn-gold text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-105 transition-transform"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Expand Outcome Preview</span>
                  </button>
                </div>
              )
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#78654E]">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span>Result Outcome Preview</span>
                  </div>
                  <span className="text-[10px] text-[#92400E] font-semibold bg-amber-100/60 px-2 py-0.5 rounded-full">
                    Select a matching pair of the same kind to simulate exact growth & stats
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {possibleOutcomeVariants.map((v) => (
                    <div
                      key={v.variantId}
                      className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFFDF9] border border-[#D5C29E] shadow-2xs"
                    >
                      <MonsterAvatar variant={v} size="sm" />
                      <div className="text-left">
                        <div className="text-xs font-bold text-[#2E1F0F] truncate max-w-[120px]">
                          {v.name}
                        </div>
                        <div className="text-[10px] font-semibold flex items-center gap-1 text-[#78654E]">
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: ELEMENT_VISUALS[v.element]?.colorHex || '#D97706' }}
                          />
                          <span>{v.element}</span>
                          <span>•</span>
                          <span>{v.primaryRole}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Roster Ingredients Selection Tray */}
      <div className="rounded-3xl fantasy-scroll-card p-6 shadow-xl border-2 border-[#D5C29E]">
        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E8DEC8] mb-5">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-[#2E1F0F] font-serif">
              Select Catalyst Ingredients ({monsters.length} in Roster)
            </h3>
            {slot1Id && variant1 && stars1 && (
              <span className="text-xs font-bold text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-300 flex items-center gap-1">
                <span>Matching Kind: {getBaseMonsterName(variant1.familyId || variant1.name)} ({stars1}★)</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Filter: Matching Pairs Only */}
            <button
              onClick={() => setOnlyPairsFilter((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                onlyPairsFilter
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-[#FAF6ED] border border-[#D5C29E] text-[#5C4A34] hover:border-amber-400'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Pairs Available</span>
            </button>

            {/* Star Tabs */}
            <div className="flex items-center gap-1 bg-[#FAF6ED] p-1 rounded-xl border border-[#D5C29E]">
              {['ALL', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((sVal) => (
                <button
                  key={sVal}
                  onClick={() => setStarFilter(sVal)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    starFilter === sVal
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-[#78654E] hover:text-[#2E1F0F]'
                  }`}
                >
                  {sVal === 'ALL' ? 'All Stars' : `${sVal}★`}
                </button>
              ))}
            </div>

            {/* Element Filter */}
            <div className="flex items-center gap-1 bg-[#FAF6ED] p-1 rounded-xl border border-[#D5C29E]">
              {['ALL', 'FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK'].map((elem) => (
                <button
                  key={elem}
                  onClick={() => setElementFilter(elem)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    elementFilter === elem
                      ? 'bg-[#92400E] text-white shadow-2xs'
                      : 'text-[#78654E] hover:text-[#2E1F0F]'
                  }`}
                >
                  {elem === 'ALL' ? 'All Elem' : elem.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Monster Cards Grid */}
        {filteredMonsters.length === 0 ? (
          <div className="py-12 text-center text-[#78654E]">
            <Sparkles className="w-8 h-8 mx-auto text-amber-500 mb-2 opacity-60" />
            <p className="font-bold text-sm text-[#2E1F0F]">No monsters match the active filter</p>
            <p className="text-xs mt-1">Try toggling filters or summon more monsters from the Astral Gate.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {filteredMonsters.map((monster) => {
              const variant = MONSTER_VARIANTS[monster.variantId];
              if (!variant) return null;

              const monsterStars = getMonsterStars(monster, variant);
              const isSlot1 = slot1Id === monster.instanceId;
              const isSlot2 = slot2Id === monster.instanceId;
              const isSelected = isSlot1 || isSlot2;
              const isInParty = profile?.activeParty?.includes(monster.instanceId);
              const isMaxStars = monsterStars >= MAX_MONSTER_STARS;

              // If slot 1 is chosen, highlight if this monster matches slot 1 kind & stars
              const matchesSlot1Kind = variant1 && variant.familyId === variant1.familyId;
              const matchesSlot1Stars = stars1 !== null && monsterStars === stars1;
              const isCompatibleWithSlot1 = matchesSlot1Kind && matchesSlot1Stars;
              const mismatchWithSlot1 = variant1 && !isCompatibleWithSlot1 && !isSlot1;

              return (
                <div
                  key={monster.instanceId}
                  onClick={() => {
                    if (isMaxStars) {
                      setErrorMsg(`${variant.name} is already at the 10★ Sovereign star limit.`);
                      return;
                    }
                    handleSelectMonster(monster.instanceId);
                  }}
                  className={`relative rounded-2xl border-2 p-3 flex flex-col items-center justify-between transition-all duration-200 cursor-pointer shadow-xs ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400 shadow-md scale-102'
                      : isMaxStars
                      ? 'opacity-40 border-slate-200 bg-slate-100 cursor-not-allowed'
                      : mismatchWithSlot1
                      ? 'opacity-50 border-slate-200 bg-white hover:opacity-80'
                      : isCompatibleWithSlot1
                      ? 'border-purple-400 bg-purple-50/50 hover:border-purple-500 ring-1 ring-purple-300/40'
                      : 'border-[#D5C29E] bg-[#FFFDF9] hover:border-amber-400 hover:shadow-sm'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="w-full flex items-center justify-between mb-1.5">
                    {/* Element Badge */}
                    <span
                      className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded text-white shadow-2xs"
                      style={{ backgroundColor: ELEMENT_VISUALS[variant.element]?.colorHex || '#D97706' }}
                    >
                      {variant.element}
                    </span>

                    {/* Slot / Status Badges */}
                    {isSlot1 && (
                      <span className="text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                        HOST
                      </span>
                    )}
                    {isSlot2 && (
                      <span className="text-[9px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                        CATALYST
                      </span>
                    )}
                    {!isSelected && monster.locked && (
                      <button
                        onClick={(e) => handleToggleLock(monster.instanceId, e)}
                        className="text-[9px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 hover:bg-rose-100 cursor-pointer"
                        title="Click to unlock this monster for synthesis"
                      >
                        <Lock className="w-2.5 h-2.5" />
                        <span>Unlock</span>
                      </button>
                    )}
                    {!isSelected && !monster.locked && isInParty && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded">
                        Party
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="my-1.5">
                    <MonsterAvatar variant={variant} size="md" />
                  </div>

                  {/* Info */}
                  <div className="w-full text-center mt-1">
                    <div className="font-bold text-xs text-[#2E1F0F] truncate">{variant.name}</div>
                    <div className="flex flex-col items-center justify-center gap-0.5 mt-0.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#78654E]">
                        <span className="font-mono font-bold">Lv.{monster.level}</span>
                        <span>•</span>
                        <span className="font-semibold text-amber-800">{variant.rarity}</span>
                      </div>
                      <MonsterStarRating stars={monsterStars} size="xs" />
                    </div>

                    {monster.equipmentIds?.length > 0 && (
                      <div className="text-[9px] text-sky-700 flex items-center justify-center gap-0.5 mt-0.5">
                        <Shield className="w-2.5 h-2.5" />
                        <span>{monster.equipmentIds.length} equipped</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SYNTHESIS RESULT CELEBRATION MODAL */}
      {synthesizedResult && (
        <div className="fixed inset-0 z-50 bg-[#1E1710]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full fantasy-scroll-card p-6 sm:p-8 text-center shadow-2xl relative border-2 border-amber-400 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 via-purple-500 to-amber-500 mx-auto flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4 animate-bounce">
              <Sparkles className="w-8 h-8 text-amber-950" />
            </div>

            <div className="text-xs font-black uppercase tracking-widest text-[#B45309] mb-1">
              Alchemical Transmutation Complete!
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#2E1F0F] mb-1">
              {synthesizedResult.variant.name}
            </h2>
            <div className="flex items-center justify-center gap-2 mb-6">
              <MonsterStarRating stars={synthesizedResult.targetStars} size="md" />
              <span className="text-xs font-black uppercase text-purple-900 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-full">
                {getStarDisplayConfig(synthesizedResult.targetStars).tierLabel} ({synthesizedResult.targetStars}★)
              </span>
            </div>

            {/* Monster Card Display */}
            <div className="max-w-[260px] mx-auto mb-6 shadow-xl rounded-2xl overflow-hidden">
              <MonsterCard
                variant={synthesizedResult.variant}
                level={synthesizedResult.newMonster.level || 1}
                stars={synthesizedResult.targetStars}
                size="md"
                showStats={true}
              />
            </div>

            {/* Summary Details */}
            <div className="p-3.5 rounded-2xl bg-[#FEF3C7]/60 border border-amber-300/80 text-left space-y-2 mb-6 text-xs">
              <div className="flex items-center justify-between text-[#78654E]">
                <span>Host Ascended:</span>
                <span className="font-bold text-[#2E1F0F]">
                  {synthesizedResult.previousStars}★ ➔ {synthesizedResult.targetStars}★
                </span>
              </div>
              <div className="flex items-center justify-between text-[#78654E]">
                <span>Catalyst Consumed:</span>
                <span className="font-bold text-[#2E1F0F] truncate max-w-[200px]">
                  {synthesizedResult.sacrificedNames.join(' + ')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#78654E]">
                <span>Gold Consumed:</span>
                <span className="font-mono font-bold text-amber-800">
                  {synthesizedResult.goldSpent.toLocaleString()}g
                </span>
              </div>
              {synthesizedResult.unequippedItemsCount > 0 && (
                <div className="flex items-center justify-between text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 font-semibold">
                  <span>Equipment Salvaged:</span>
                  <span>{synthesizedResult.unequippedItemsCount} items returned to bag</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSynthesizedResult(null)}
              className="w-full py-3.5 rounded-2xl fantasy-btn-gold font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer hover:scale-102 transition-transform"
            >
              Transmute Another / Return
            </button>
          </div>
        </div>
      )}

      {/* RULES / GUIDE MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-[#1E1710]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full fantasy-scroll-card p-6 shadow-2xl text-left border-2 border-[#D5C29E]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DEC8] mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-[#2E1F0F] font-serif">
                  Monster Synthesis Alchemical Guide
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="cursor-pointer text-[#78654E] hover:text-[#2E1F0F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#5C4A34] mb-6">
              <div className="p-3 rounded-xl bg-[#FAF6ED] border border-[#D5C29E]">
                <h4 className="font-bold text-[#2E1F0F] mb-1.5 flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-purple-600" />
                  <span>Star Ascension System (1★ ➔ 10★ Sovereign)</span>
                </h4>
                <div className="space-y-1 font-mono text-[11px] text-[#4A3B2A]">
                  <div>• Same Kind Only: Fusing monsters must share the same species family (e.g. Nekohime + Nekohime).</div>
                  <div>• Equal Star Requirement: Both the Host and Catalyst must possess the exact same star rank.</div>
                  <div>• Ascension Outcome: The Host monster advances +1 Star while keeping its element and identity.</div>
                  <div>• Gold Star Tiers (1★ ➔ 5★): Displayed as 1 to 5 brilliant gold stars.</div>
                  <div>• Sovereign Purple Stars (6★ ➔ 10★): At 6★, one star turns purple. Each further level adds another purple star until all 5 stars are purple at 10★!</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF6ED] border border-[#D5C29E]">
                <h4 className="font-bold text-[#2E1F0F] mb-1.5 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>Elemental Variants as Catalysts</span>
                </h4>
                <p className="leading-relaxed">
                  • <strong>Cross-Element Fusion</strong>: You can fuse different elemental variants of the same species! For example, fuse a Water Nekohime (Host) with a Fire Nekohime (Catalyst).<br />
                  • <strong>Host Outcome</strong>: Slot 1 is the result Host. It preserves its exact element and equipment, while the Catalyst is consumed to grant the +1 Star upgrade.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF6ED] border border-[#D5C29E]">
                <h4 className="font-bold text-[#2E1F0F] mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Equipment & Lock Safeguards</span>
                </h4>
                <p className="leading-relaxed">
                  • <strong>Gear Salvage</strong>: Any equipment currently equipped on catalyst monsters is automatically stripped and returned intact to your equipment bag.<br />
                  • <strong>Lock Safeguard</strong>: Locked monsters cannot be sacrificed accidentally. Simply tap the unlock button on a card to prepare it for synthesis.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl fantasy-btn-gold font-bold text-xs cursor-pointer shadow-sm"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
