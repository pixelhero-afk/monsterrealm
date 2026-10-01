/**
 * Monster Realms - Synthesis Outcome & Growth Potential Preview Panel
 * Displays detailed base stats, dynamic level-scaling growth simulations,
 * catalyst-to-outcome comparative stat surges, awakening potential,
 * and tactical skillsets before player confirms the transmutation ritual.
 */

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Swords,
  Shield,
  Heart,
  Zap,
  TrendingUp,
  Award,
  Crown,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Coins,
  X,
  Target,
  Layers,
  ChevronRight,
  HelpCircle,
  Activity,
} from 'lucide-react';
import {
  AwakeningStage,
  ElementType,
  MonsterVariant,
  PlayerMonster,
  Rarity,
} from '../types';
import { ELEMENT_VISUALS } from '../data/elements';
import { getSkillDefinition } from '../data/skills';
import { calculateEffectiveStats } from '../engine/statCalculator';
import { MonsterAvatar } from './MonsterAvatar';
import { MonsterStarRating } from './MonsterStarRating';
import { getStarDisplayConfig, MAX_MONSTER_STARS } from '../utils/monsterStars';

interface SynthesisOutcomePreviewPanelProps {
  catalyst1: { monster: PlayerMonster; variant: MonsterVariant } | null;
  catalyst2: { monster: PlayerMonster; variant: MonsterVariant } | null;
  targetStars?: number;
  targetRarity?: Rarity;
  possibleVariants?: MonsterVariant[];
  resonanceInfo?: {
    type: 'PURE' | 'DUAL';
    text: string;
    element?: ElementType;
    elements?: ElementType[];
  } | null;
  goldCost: number;
  playerGold: number;
  hasEnoughGold: boolean;
  isTransmuting: boolean;
  onConfirmFusion: () => void;
  onClose?: () => void;
}

const RARITY_STARS: Record<Rarity, number> = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  EPIC: 4,
  LEGENDARY: 5,
};

const RARITY_THEMES: Record<
  Rarity,
  { border: string; bg: string; text: string; badge: string; ring: string }
> = {
  COMMON: {
    border: 'border-slate-300',
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    ring: 'ring-slate-300',
  },
  UNCOMMON: {
    border: 'border-emerald-400',
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    ring: 'ring-emerald-400',
  },
  RARE: {
    border: 'border-sky-400',
    bg: 'bg-sky-50',
    text: 'text-sky-900',
    badge: 'bg-sky-100 text-sky-800 border-sky-300',
    ring: 'ring-sky-400',
  },
  EPIC: {
    border: 'border-purple-400',
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    ring: 'ring-purple-400',
  },
  LEGENDARY: {
    border: 'border-amber-400',
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    ring: 'ring-amber-400',
  },
};

export const SynthesisOutcomePreviewPanel: React.FC<
  SynthesisOutcomePreviewPanelProps
> = ({
  catalyst1,
  catalyst2,
  targetStars,
  targetRarity,
  possibleVariants,
  resonanceInfo,
  goldCost,
  playerGold,
  hasEnoughGold,
  isTransmuting,
  onConfirmFusion,
  onClose,
}) => {
  // Sort candidates so matching resonance elements appear first
  const sortedVariants = useMemo(() => {
    if (!possibleVariants || possibleVariants.length === 0) return [];
    const resonanceElements = resonanceInfo?.elements || (resonanceInfo?.element ? [resonanceInfo.element] : []);
    
    return [...possibleVariants].sort((a, b) => {
      const aMatches = resonanceElements.includes(a.element) ? 1 : 0;
      const bMatches = resonanceElements.includes(b.element) ? 1 : 0;
      if (bMatches !== aMatches) return bMatches - aMatches;
      return a.name.localeCompare(b.name);
    });
  }, [possibleVariants, resonanceInfo]);

  // Selected outcome candidate for in-depth inspection
  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    return sortedVariants[0]?.variantId || '';
  });

  // Ensure valid selection if candidates update
  const activeVariant = useMemo(() => {
    return (
      sortedVariants.find((v) => v.variantId === selectedVariantId) ||
      sortedVariants[0] ||
      null
    );
  }, [sortedVariants, selectedVariantId]);

  // Growth Simulator State
  const [simulatedLevel, setSimulatedLevel] = useState<number>(30);
  const [isSimulatedAwakened, setIsSimulatedAwakened] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'STATS' | 'SKILLS' | 'COMPARISON'>('STATS');

  // Catalyst stats analysis
  const catalystSummary = useMemo(() => {
    if (!catalyst1 || !catalyst2) return null;

    const c1Stats = calculateEffectiveStats({
      variant: catalyst1.variant,
      level: catalyst1.monster.level,
      awakeningStage: catalyst1.monster.awakeningStage,
    }).finalStats;

    const c2Stats = calculateEffectiveStats({
      variant: catalyst2.variant,
      level: catalyst2.monster.level,
      awakeningStage: catalyst2.monster.awakeningStage,
    }).finalStats;

    const avgHp = Math.round((c1Stats.hp + c2Stats.hp) / 2);
    const avgAtk = Math.round((c1Stats.attack + c2Stats.attack) / 2);
    const avgDef = Math.round((c1Stats.defense + c2Stats.defense) / 2);
    const avgSpd = Math.round((c1Stats.speed + c2Stats.speed) / 2);

    return {
      c1Stats,
      c2Stats,
      avgHp,
      avgAtk,
      avgDef,
      avgSpd,
      avgLevel: Math.round((catalyst1.monster.level + catalyst2.monster.level) / 2),
    };
  }, [catalyst1, catalyst2]);

  // Active variant stats at simulated level
  const simulatedStats = useMemo(() => {
    if (!activeVariant) return null;
    const stage: AwakeningStage = isSimulatedAwakened ? 'AWAKENED' : 'BASE';
    return calculateEffectiveStats({
      variant: activeVariant,
      level: simulatedLevel,
      awakeningStage: stage,
    }).finalStats;
  }, [activeVariant, simulatedLevel, isSimulatedAwakened]);

  // Active variant base level 1 stats (for true baseline comparison)
  const baseStatsLv1 = useMemo(() => {
    if (!activeVariant) return null;
    return calculateEffectiveStats({
      variant: activeVariant,
      level: 1,
      awakeningStage: 'BASE',
    }).finalStats;
  }, [activeVariant]);

  // Combat Power Rating estimation
  const combatPower = useMemo(() => {
    if (!simulatedStats) return 0;
    return Math.floor(
      simulatedStats.hp / 10 +
        simulatedStats.attack * 1.5 +
        simulatedStats.defense * 1.2 +
        simulatedStats.speed * 2 +
        simulatedStats.critRate * 200 +
        simulatedStats.critDamage * 100
    );
  }, [simulatedStats]);

  if (!activeVariant || !simulatedStats || !baseStatsLv1) {
    return (
      <div className="p-6 rounded-3xl bg-[#FAF6ED] border border-[#D5C29E] text-center text-[#78654E]">
        <HelpCircle className="w-8 h-8 mx-auto mb-2 text-amber-600 opacity-60" />
        <p className="font-bold text-sm">No outcome candidates available for this tier.</p>
      </div>
    );
  }

  const safeTargetStars = targetStars || (targetRarity ? RARITY_STARS[targetRarity] : 6);
  const starConfig = getStarDisplayConfig(safeTargetStars);
  const elementVisual = ELEMENT_VISUALS[activeVariant.element] || ELEMENT_VISUALS.FIRE;
  const effectiveRarity = targetRarity || activeVariant.rarity || 'LEGENDARY';
  const rarityTheme = RARITY_THEMES[effectiveRarity] || RARITY_THEMES.LEGENDARY;
  const awakeningConfig = activeVariant.awakeningStages?.[0];

  // Resolve skill definitions
  const resolvedSkills = activeVariant.skills
    .map((id) => getSkillDefinition(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  // Determine probability chance for active variant
  let variantProbabilityText = 'Standard Pool';
  if (resonanceInfo) {
    if (resonanceInfo.type === 'PURE') {
      if (activeVariant.element === resonanceInfo.element) {
        variantProbabilityText = '100% Pure Resonance Match';
      }
    } else if (resonanceInfo.type === 'DUAL') {
      if (resonanceInfo.elements?.includes(activeVariant.element)) {
        variantProbabilityText = '50% Dual Resonance Match';
      }
    }
  }

  return (
    <div className="w-full rounded-3xl fantasy-scroll-card border-2 border-[#D4AF37] shadow-2xl overflow-hidden relative animate-fade-in text-[#2E1F0F]">
      {/* Top Banner & Header */}
      <div className="relative p-5 sm:p-6 bg-gradient-to-r from-[#FAF6ED] via-[#FFFDF9] to-[#FAF6ED] border-b border-[#E8DEC8] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 p-0.5 shadow-md">
            <div className="w-full h-full rounded-[14px] bg-[#FFFDF9] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black font-serif text-[#2E1F0F] tracking-wide">
                Preview Synthesis Outcome & Growth
              </h3>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border shadow-2xs bg-[#FFFDF9] border-[#D5C29E]">
                <MonsterStarRating stars={safeTargetStars} size="xs" />
                <span className="text-[10px] font-black uppercase text-[#2E1F0F]">
                  {starConfig.tierLabel}
                </span>
              </div>
            </div>
            <p className="text-xs text-[#5C4A34] font-medium mt-0.5">
              Simulate base stats, level scaling trajectory, and tactical skillsets before forging.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs Switcher */}
          <div className="flex items-center bg-[#EFE8D8] p-1 rounded-xl border border-[#D5C29E]">
            <button
              onClick={() => setActiveTab('STATS')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'STATS'
                  ? 'bg-[#FFFDF9] text-[#92400E] shadow-2xs'
                  : 'text-[#78654E] hover:text-[#2E1F0F]'
              }`}
            >
              Stats & Growth
            </button>
            <button
              onClick={() => setActiveTab('COMPARISON')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'COMPARISON'
                  ? 'bg-[#FFFDF9] text-[#92400E] shadow-2xs'
                  : 'text-[#78654E] hover:text-[#2E1F0F]'
              }`}
            >
              Catalyst Delta
            </button>
            <button
              onClick={() => setActiveTab('SKILLS')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'SKILLS'
                  ? 'bg-[#FFFDF9] text-[#92400E] shadow-2xs'
                  : 'text-[#78654E] hover:text-[#2E1F0F]'
              }`}
            >
              Skill Arsenal
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#FAF6ED] border border-[#D5C29E] text-[#78654E] hover:text-[#2E1F0F] cursor-pointer hover:border-amber-400 transition-colors"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Candidate Selector Strip (if multiple variants can emerge from this tier) */}
      {sortedVariants.length > 1 && (
        <div className="px-5 py-3 bg-[#FAF6ED]/70 border-b border-[#E8DEC8]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#78654E] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>
                Outcome Candidate: {activeVariant.name} ({safeTargetStars}★)
              </span>
            </span>
            <span className="text-[10px] text-[#92400E] font-bold">
              Tap a champion to inspect its growth stats
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {sortedVariants.map((v) => {
              const isSelected = v.variantId === activeVariant.variantId;
              const isResonant = resonanceInfo?.elements?.includes(v.element) || resonanceInfo?.element === v.element;

              return (
                <button
                  key={v.variantId}
                  onClick={() => setSelectedVariantId(v.variantId)}
                  className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFFDF9] border-[#D97706] ring-2 ring-[#D97706]/40 shadow-sm scale-[1.02]'
                      : 'bg-[#FAF6ED] border-[#D5C29E] hover:border-[#C5A059] opacity-85 hover:opacity-100'
                  }`}
                >
                  <MonsterAvatar variant={v} size="sm" />
                  <div>
                    <div className="text-xs font-bold text-[#2E1F0F] truncate max-w-[120px]">
                      {v.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px]">
                      <span
                        className="px-1.5 py-0.2 rounded font-black text-white"
                        style={{ backgroundColor: ELEMENT_VISUALS[v.element]?.colorHex || '#D97706' }}
                      >
                        {v.element}
                      </span>
                      {isResonant && (
                        <span className="text-[#B45309] font-bold">Resonant</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="p-5 sm:p-7 space-y-6">
        {/* Active Champion Header Showcase */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FFFDF9] to-[#FAF6ED] border border-[#D5C29E] flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              {/* Element Glow Ring */}
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-35"
                style={{ backgroundColor: elementVisual.colorHex }}
              />
              <MonsterAvatar
                variantId={activeVariant.variantId}
                element={activeVariant.element}
                awakeningStage={isSimulatedAwakened ? 'AWAKENED' : 'BASE'}
                size="lg"
                className="relative z-10"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full text-white uppercase tracking-wider shadow-2xs"
                  style={{ backgroundColor: elementVisual.colorHex }}
                >
                  {activeVariant.element}
                </span>

                <span className="text-[10px] font-bold text-[#78654E] bg-[#EFE8D8] px-2 py-0.5 rounded-full">
                  {activeVariant.primaryRole}
                </span>

                <span className="text-[10px] font-black text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full">
                  {variantProbabilityText}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <h4 className="text-xl font-black font-serif text-[#2E1F0F]">
                  {isSimulatedAwakened
                    ? awakeningConfig?.title || activeVariant.name
                    : activeVariant.name}
                </h4>
                <MonsterStarRating stars={safeTargetStars} size="sm" />
              </div>
              <p className="text-xs text-[#78654E] font-medium line-clamp-1 max-w-md mt-0.5">
                {activeVariant.lore}
              </p>
            </div>
          </div>

          {/* Combat Rating Badge */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-[#78654E]">
                Projected Rating
              </div>
              <div className="text-xl font-extrabold text-[#92400E] font-mono">
                CP {combatPower.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#78654E]">
                at Lv.{simulatedLevel} {isSimulatedAwakened ? '(Awakened)' : '(Base)'}
              </div>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-amber-100/80 border border-amber-300 flex items-center justify-center text-amber-700 shadow-2xs">
              <Crown className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* TAB 1: STATS & DYNAMIC GROWTH SIMULATOR */}
        {activeTab === 'STATS' && (
          <div className="space-y-6">
            {/* Simulation Controls: Slider, Presets, Awakening Toggle */}
            <div className="p-4 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E] flex flex-col lg:flex-row items-center justify-between gap-4 shadow-2xs">
              <div>
                <div className="text-xs font-bold text-[#92400E] uppercase tracking-wider font-serif flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span>Interactive Growth Simulator</span>
                </div>
                <div className="text-sm font-black text-[#2E1F0F] mt-0.5">
                  Simulated at Level {simulatedLevel} / 50
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Level Presets */}
                <div className="flex items-center gap-1">
                  {[1, 20, 35, 50].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setSimulatedLevel(preset)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        simulatedLevel === preset
                          ? 'fantasy-btn-gold shadow-2xs scale-105'
                          : 'fantasy-btn-ivory'
                      }`}
                    >
                      Lv.{preset}
                    </button>
                  ))}
                </div>

                {/* Level Range Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#78654E]">1</span>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={simulatedLevel}
                    onChange={(e) => setSimulatedLevel(Number(e.target.value))}
                    className="w-28 sm:w-44 accent-[#D97706] cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-[#78654E]">50</span>
                </div>

                {/* Awakening State Toggle */}
                {awakeningConfig && (
                  <button
                    onClick={() => setIsSimulatedAwakened(!isSimulatedAwakened)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSimulatedAwakened
                        ? 'fantasy-btn-gold shadow-2xs'
                        : 'fantasy-btn-ivory'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isSimulatedAwakened ? 'Awakened Apex' : 'Base Form'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Core Stats Gauges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* HP Meter */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] shadow-2xs hover:border-[#E11D48]/50 transition-colors">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-[#5C4A34]">
                    <Heart className="w-4 h-4 text-[#E11D48]" />
                    <span>Health (HP)</span>
                  </span>
                  <span className="font-mono text-[#2E1F0F] font-extrabold text-base">
                    {simulatedStats.hp.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#FAF6ED] rounded-full overflow-hidden mt-2 border border-[#E8DEC8]">
                  <div
                    className="h-full bg-gradient-to-r from-[#E11D48] to-[#F43F5E] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (simulatedStats.hp / 14000) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#78654E] mt-2 pt-2 border-t border-[#F2EADB]">
                  <span>Base: {baseStatsLv1.hp}</span>
                  <span className="font-bold text-[#E11D48]">
                    +{activeVariant.growthPerLevel?.hp || 0}/lv
                  </span>
                </div>
              </div>

              {/* ATK Meter */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] shadow-2xs hover:border-[#D97706]/50 transition-colors">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-[#5C4A34]">
                    <Swords className="w-4 h-4 text-[#D97706]" />
                    <span>Attack</span>
                  </span>
                  <span className="font-mono text-[#2E1F0F] font-extrabold text-base">
                    {simulatedStats.attack.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#FAF6ED] rounded-full overflow-hidden mt-2 border border-[#E8DEC8]">
                  <div
                    className="h-full bg-gradient-to-r from-[#D97706] to-[#F59E0B] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (simulatedStats.attack / 1200) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#78654E] mt-2 pt-2 border-t border-[#F2EADB]">
                  <span>Base: {baseStatsLv1.attack}</span>
                  <span className="font-bold text-[#D97706]">
                    +{activeVariant.growthPerLevel?.attack || 0}/lv
                  </span>
                </div>
              </div>

              {/* DEF Meter */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] shadow-2xs hover:border-[#0284C7]/50 transition-colors">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-[#5C4A34]">
                    <Shield className="w-4 h-4 text-[#0284C7]" />
                    <span>Defense</span>
                  </span>
                  <span className="font-mono text-[#2E1F0F] font-extrabold text-base">
                    {simulatedStats.defense.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#FAF6ED] rounded-full overflow-hidden mt-2 border border-[#E8DEC8]">
                  <div
                    className="h-full bg-gradient-to-r from-[#0284C7] to-[#38BDF8] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (simulatedStats.defense / 950) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#78654E] mt-2 pt-2 border-t border-[#F2EADB]">
                  <span>Base: {baseStatsLv1.defense}</span>
                  <span className="font-bold text-[#0284C7]">
                    +{activeVariant.growthPerLevel?.defense || 0}/lv
                  </span>
                </div>
              </div>

              {/* SPD Meter */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] shadow-2xs hover:border-[#16A34A]/50 transition-colors">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-[#5C4A34]">
                    <Zap className="w-4 h-4 text-[#16A34A]" />
                    <span>Speed</span>
                  </span>
                  <span className="font-mono text-[#2E1F0F] font-extrabold text-base">
                    {simulatedStats.speed}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#FAF6ED] rounded-full overflow-hidden mt-2 border border-[#E8DEC8]">
                  <div
                    className="h-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (simulatedStats.speed / 135) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#78654E] mt-2 pt-2 border-t border-[#F2EADB]">
                  <span>Base: {baseStatsLv1.speed}</span>
                  <span className="font-bold text-[#16A34A]">
                    +{activeVariant.growthPerLevel?.speed || 0}/lv
                  </span>
                </div>
              </div>
            </div>

            {/* Secondary Attributes Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E] text-center shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-[#78654E]">Crit Rate</div>
                <div className="text-sm font-extrabold text-[#92400E] font-mono mt-0.5">
                  {Math.round(simulatedStats.critRate * 100)}%
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E] text-center shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-[#78654E]">Crit Damage</div>
                <div className="text-sm font-extrabold text-[#92400E] font-mono mt-0.5">
                  {Math.round(simulatedStats.critDamage * 100)}%
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E] text-center shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-[#78654E]">Accuracy</div>
                <div className="text-sm font-extrabold text-[#0369A1] font-mono mt-0.5">
                  {Math.round(simulatedStats.accuracy * 100)}%
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E] text-center shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-[#78654E]">Resistance</div>
                <div className="text-sm font-extrabold text-[#15803D] font-mono mt-0.5">
                  {Math.round(simulatedStats.resistance * 100)}%
                </div>
              </div>
            </div>

            {/* Awakening Growth Potential Overview */}
            {awakeningConfig && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFFBEB] via-[#FFFDF9] to-[#FFFBEB] border border-amber-300 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#92400E] font-serif uppercase tracking-wider">
                      Awakening Potential: {awakeningConfig.title}
                    </div>
                    <div className="text-xs text-[#5C4A34] font-medium mt-0.5">
                      {awakeningConfig.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {awakeningConfig.statMultipliers.attack && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      +{Math.round((awakeningConfig.statMultipliers.attack - 1) * 100)}% ATK
                    </span>
                  )}
                  {awakeningConfig.statMultipliers.hp && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                      +{Math.round((awakeningConfig.statMultipliers.hp - 1) * 100)}% HP
                    </span>
                  )}
                  {awakeningConfig.statMultipliers.speed && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      +{awakeningConfig.statMultipliers.speed} SPD
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CATALYST COMPARISON DELTA */}
        {activeTab === 'COMPARISON' && catalystSummary && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E]">
              <div className="text-xs font-bold text-[#92400E] uppercase tracking-wider font-serif mb-1">
                Ascension Jump: Host & Catalyst vs {safeTargetStars}★ Ascended Monster
              </div>
              <p className="text-xs text-[#5C4A34]">
                Comparing your Slot 1 Host (Lv.{catalyst1?.monster.level}) and sacrificed Catalyst against the newly ascended {safeTargetStars}★ {activeVariant.name} at baseline Lv.1 and simulated Lv.{simulatedLevel}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Catalyst 1 Card */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] shadow-2xs">
                <div className="text-[10px] font-black uppercase text-[#78654E] mb-2 flex items-center justify-between">
                  <span>Slot 1: Result Host</span>
                  <span>Lv.{catalyst1?.monster.level}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {catalyst1 && <MonsterAvatar variant={catalyst1.variant} size="sm" />}
                  <div className="truncate font-bold text-xs text-[#2E1F0F]">
                    {catalyst1?.variant.name}
                  </div>
                </div>
                <div className="space-y-1 text-[11px] font-mono text-[#5C4A34]">
                  <div className="flex justify-between">
                    <span>HP:</span>
                    <span className="font-bold">{catalystSummary.c1Stats.hp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ATK:</span>
                    <span className="font-bold">{catalystSummary.c1Stats.attack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DEF:</span>
                    <span className="font-bold">{catalystSummary.c1Stats.defense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SPD:</span>
                    <span className="font-bold">{catalystSummary.c1Stats.speed}</span>
                  </div>
                </div>
              </div>

              {/* Catalyst 2 Card */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] shadow-2xs">
                <div className="text-[10px] font-black uppercase text-[#78654E] mb-2 flex items-center justify-between">
                  <span>Slot 2: Catalyst (Sacrificed)</span>
                  <span>Lv.{catalyst2?.monster.level}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {catalyst2 && <MonsterAvatar variant={catalyst2.variant} size="sm" />}
                  <div className="truncate font-bold text-xs text-[#2E1F0F]">
                    {catalyst2?.variant.name}
                  </div>
                </div>
                <div className="space-y-1 text-[11px] font-mono text-[#5C4A34]">
                  <div className="flex justify-between">
                    <span>HP:</span>
                    <span className="font-bold">{catalystSummary.c2Stats.hp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ATK:</span>
                    <span className="font-bold">{catalystSummary.c2Stats.attack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DEF:</span>
                    <span className="font-bold">{catalystSummary.c2Stats.defense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SPD:</span>
                    <span className="font-bold">{catalystSummary.c2Stats.speed}</span>
                  </div>
                </div>
              </div>

              {/* Forged Outcome Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-[#FFFBEB] to-[#FFFDF9] border-2 border-amber-400 shadow-md">
                <div className="text-[10px] font-black uppercase text-amber-800 mb-2 flex items-center justify-between">
                  <span>Ascended Host ({safeTargetStars}★)</span>
                  <span>Simulated Lv.{simulatedLevel}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <MonsterAvatar variant={activeVariant} size="sm" />
                  <div className="truncate font-black text-xs text-[#92400E]">
                    {activeVariant.name}
                  </div>
                </div>
                <div className="space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>HP:</span>
                    <span>
                      {simulatedStats.hp}{' '}
                      <span className="text-[9px] text-emerald-600">
                        (+{Math.round(((simulatedStats.hp - catalystSummary.avgHp) / catalystSummary.avgHp) * 100)}%)
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>ATK:</span>
                    <span>
                      {simulatedStats.attack}{' '}
                      <span className="text-[9px] text-emerald-600">
                        (+{Math.round(((simulatedStats.attack - catalystSummary.avgAtk) / catalystSummary.avgAtk) * 100)}%)
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>DEF:</span>
                    <span>
                      {simulatedStats.defense}{' '}
                      <span className="text-[9px] text-emerald-600">
                        (+{Math.round(((simulatedStats.defense - catalystSummary.avgDef) / catalystSummary.avgDef) * 100)}%)
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>SPD:</span>
                    <span>
                      {simulatedStats.speed}{' '}
                      <span className="text-[9px] text-emerald-600">
                        ({simulatedStats.speed - catalystSummary.avgSpd >= 0 ? '+' : ''}
                        {simulatedStats.speed - catalystSummary.avgSpd})
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SKILL ARSENAL */}
        {activeTab === 'SKILLS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#78654E] flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-600" />
                <span>Tactical Combat Kit & Ability Scaling ({resolvedSkills.length} Skills)</span>
              </span>
              <span className="text-[10px] text-[#92400E] font-bold">
                {activeVariant.primaryRole} Archetype
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {resolvedSkills.map((skill, index) => {
                const isAwakenedSkill = skill.id === awakeningConfig?.unlockedSkillId;

                return (
                  <div
                    key={skill.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isAwakenedSkill
                        ? 'bg-[#FFFBEB] border-amber-300 ring-2 ring-amber-300/40 shadow-xs'
                        : 'bg-[#FFFDF9] border-[#D5C29E] shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-[#FEF3C7] border border-[#F59E0B]/50 flex items-center justify-center font-black text-xs text-[#92400E]">
                            {index + 1}
                          </span>
                          <div>
                            <div className="text-sm font-black text-[#2E1F0F] font-serif flex items-center gap-1.5">
                              <span>{skill.name}</span>
                              {isAwakenedSkill && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                                  AWAKENED
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#78654E]">
                              Target: {skill.targetType.replace('_', ' ').toLowerCase()}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            skill.cooldown === 0
                              ? 'bg-[#FAF6ED] border-[#D5C29E] text-[#78654E]'
                              : 'bg-[#E0F2FE] border-[#7DD3FC] text-[#0369A1]'
                          }`}
                        >
                          {skill.cooldown === 0 ? 'Basic (No CD)' : `${skill.cooldown}t CD`}
                        </span>
                      </div>

                      <p className="text-xs text-[#5C4A34] leading-relaxed mt-2 font-medium">
                        {skill.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Confirmation Footer */}
        <div className="pt-4 border-t border-[#E8DEC8] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#5C4A34]">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="font-semibold">Synthesis Cost:</span>
              <span
                className={`font-black font-mono ${
                  hasEnoughGold ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {goldCost.toLocaleString()} Gold
              </span>
              <span className="text-[10px] text-[#78654E]">
                (Balance: {playerGold.toLocaleString()})
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#78654E]">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Gear Auto-Salvaged</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E] text-[#5C4A34] hover:text-[#2E1F0F] font-bold text-xs cursor-pointer hover:border-amber-400 transition-colors"
              >
                Return to Altar
              </button>
            )}

            <button
              disabled={isTransmuting || !hasEnoughGold}
              onClick={onConfirmFusion}
              className={`py-2.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-md ${
                isTransmuting
                  ? 'bg-amber-400 text-amber-950 opacity-90 animate-pulse'
                  : hasEnoughGold
                  ? 'fantasy-btn-gold hover:scale-105 active:scale-95 shadow-amber-900/20'
                  : 'bg-[#E5D7BE] text-[#8C765C] cursor-not-allowed opacity-60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isTransmuting ? 'Transmuting Champion...' : 'Confirm & Synthesize'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
