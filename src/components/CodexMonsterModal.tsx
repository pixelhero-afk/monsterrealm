/**
 * Monster Codex Detailed Inspector Modal
 * Displays complete stats, dynamic level scaling, full skill tree breakdowns,
 * damage formulas, status effects, awakening transformations, and real-time 3D preview.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Swords,
  Shield,
  Zap,
  Flame,
  Droplet,
  Leaf,
  Sun,
  Moon,
  ChevronRight,
  Eye,
  Heart,
  Target,
  Activity,
  Layers,
  Award,
  Crown,
  Maximize2,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { MonsterVariant, AwakeningStage, ElementType } from '../types';
import { ELEMENT_VISUALS } from '../data/elements';
import { getSkillDefinition } from '../data/skills';
import { calculateEffectiveStats } from '../engine/statCalculator';
import { MonsterAvatar } from './MonsterAvatar';
import { MonsterStarRating } from './MonsterStarRating';
import { portraitRegistry } from '../services/character2d/portraitRegistry';
import {
  normalizeUnitName,
  normalizeElement,
  getElementalPortraitPath,
  getElementalStatusPath,
  TRANSPARENT_SPRITE_CLASSNAME,
  TRANSPARENT_SPRITE_STYLE,
} from '../services/character2d/elementalAssetHelper';

interface CodexMonsterModalProps {
  variant: MonsterVariant;
  onClose: () => void;
}

export const CodexMonsterModal: React.FC<CodexMonsterModalProps> = ({ variant, onClose }) => {
  const [activeTab, setActiveTab] = useState<'SKILLS' | 'STATS' | 'PORTRAIT' | 'AWAKENING'>('SKILLS');
  const [level, setLevel] = useState<number>(50);
  const [awakened, setAwakened] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [, setRerenderKey] = useState<number>(0);

  useEffect(() => {
    const unsub = portraitRegistry.subscribe(() => {
      setRerenderKey((k) => k + 1);
    });
    return () => unsub();
  }, []);

  const elementVisual = ELEMENT_VISUALS[variant.element] || ELEMENT_VISUALS.FIRE;
  const awakeningStage: AwakeningStage = awakened ? 'AWAKENED' : 'BASE';

  // Calculate stats for current level and awakening toggle
  const statsCalc = calculateEffectiveStats({
    variant,
    level,
    awakeningStage,
  });
  const currentStats = statsCalc.finalStats;

  // Combat rating estimation
  const combatPower = Math.floor(
    currentStats.hp / 10 +
      currentStats.attack * 1.5 +
      currentStats.defense * 1.2 +
      currentStats.speed * 2 +
      currentStats.critRate * 200 +
      currentStats.critDamage * 100
  );

  const skills = variant.skills
    .map((id) => getSkillDefinition(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const awakeningData = variant.awakeningStages[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1E1710]/65 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl fantasy-scroll-card shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="relative p-5 sm:p-6 border-b border-[#E8DEC8] bg-[#FAF6ED]/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <MonsterAvatar
              variantId={variant.variantId}
              element={variant.element}
              awakeningStage={awakeningStage}
              size="lg"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className="text-[11px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider shadow-2xs"
                  style={{
                    backgroundColor: `${elementVisual.borderHex}22`,
                    borderColor: elementVisual.borderHex,
                    color: elementVisual.borderHex,
                  }}
                >
                  {variant.element}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] uppercase border border-[#F59E0B]/40 shadow-2xs">
                  {variant.rarity}
                </span>
                <span className="text-[11px] font-semibold text-[#5C4A34]">
                  {variant.primaryRole}
                </span>
                <div className="inline-flex items-center">
                  <MonsterStarRating stars={variant.stars || 3} size="xs" showAllFiveSlots={false} />
                </div>
                {awakened && (
                  <span className="text-[11px] font-black px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/60 shadow-2xs">
                    ★ AWAKENED: {awakeningData?.title}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#2E1F0F] font-serif">
                {variant.name}
              </h2>
              <div className="text-xs text-[#5C4A34] mt-0.5 flex items-center gap-3 font-medium">
                <span>Family: <strong className="text-[#2E1F0F]">{variant.familyId === 'fam_boss' ? 'CONTINENT OVERLORDS' : variant.familyId.replace('fam_', '').toUpperCase()}</strong></span>
                <span>•</span>
                <span>Combat Power: <strong className="text-[#92400E] font-mono">{combatPower.toLocaleString()} CP</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white hover:bg-[#FAF6ED] border-2 border-[#D5C29E] hover:border-[#D97706] text-[#2E1F0F] transition-colors cursor-pointer shadow-xs"
            title="Close Monster Codex"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Boss Overlord Status Notice */}
        {(variant.isBoss || variant.familyId === 'fam_boss') && (
          <div className="mx-6 mt-3 px-3.5 py-2.5 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B]/50 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 text-[#92400E] font-bold text-xs">
              <Crown className="w-4 h-4 text-[#D97706] shrink-0" />
              <span>CONTINENT CHAPTER OVERLORD (APEX BOSS)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#78654E] hidden sm:inline">Campaign Encounter Only</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FFE4E6] text-[#9F1239] border border-[#FDA4AF] uppercase tracking-wide">
                Unobtainable by Players
              </span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 px-6 pt-3.5 pb-2 border-b-2 border-[#E8DEC8] bg-[#FAF6ED]/70">
          <button
            onClick={() => setActiveTab('SKILLS')}
            className={`px-3 sm:px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer font-serif ${
              activeTab === 'SKILLS'
                ? 'bg-white border-2 border-[#D97706] text-[#92400E] shadow-sm'
                : 'bg-[#FFFDF9] border-2 border-[#D5C29E] text-[#2E1F0F] hover:border-[#D97706] hover:bg-white shadow-2xs'
            }`}
          >
            <Zap className="w-4 h-4 text-[#D97706]" />
            Skills & Abilities ({skills.length})
          </button>

          <button
            onClick={() => setActiveTab('STATS')}
            className={`px-3 sm:px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer font-serif ${
              activeTab === 'STATS'
                ? 'bg-white border-2 border-[#D97706] text-[#92400E] shadow-sm'
                : 'bg-[#FFFDF9] border-2 border-[#D5C29E] text-[#2E1F0F] hover:border-[#D97706] hover:bg-white shadow-2xs'
            }`}
          >
            <Activity className="w-4 h-4 text-[#D97706]" />
            Base Stats & Level Scaling
          </button>

          <button
            onClick={() => setActiveTab('PORTRAIT')}
            className={`px-3 sm:px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer font-serif ${
              activeTab === 'PORTRAIT'
                ? 'bg-white border-2 border-[#0284C7] text-[#0369A1] shadow-sm'
                : 'bg-[#FFFDF9] border-2 border-[#D5C29E] text-[#2E1F0F] hover:border-[#0284C7] hover:bg-white shadow-2xs'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-[#0284C7]" />
            Portrait & Artwork
          </button>

          <button
            onClick={() => setActiveTab('AWAKENING')}
            className={`px-3 sm:px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer font-serif ${
              activeTab === 'AWAKENING'
                ? 'bg-white border-2 border-[#7C3AED] text-[#6D28D9] shadow-sm'
                : 'bg-[#FFFDF9] border-2 border-[#D5C29E] text-[#2E1F0F] hover:border-[#7C3AED] hover:bg-white shadow-2xs'
            }`}
          >
            <Award className="w-4 h-4 text-[#7C3AED]" />
            Awakening Form & Lore
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: SKILLS & ABILITIES */}
          {activeTab === 'SKILLS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#2E1F0F] uppercase tracking-wider font-serif">
                    Full Skill Arsenal & Mechanics
                  </h3>
                  <p className="text-xs text-[#5C4A34] font-medium">
                    Active attack multipliers, crowd control chances, buff/debuff durations, and cooldowns.
                  </p>
                </div>
                <button
                  onClick={() => setAwakened(!awakened)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    awakened
                      ? 'fantasy-btn-gold shadow-2xs'
                      : 'fantasy-btn-ivory'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-[#D97706]" />
                  {awakened ? 'Previewing Awakened Skills' : 'Toggle Awakened Mode'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skills.map((skill, index) => {
                  const isAwakenedSkill = skill.id === awakeningData?.unlockedSkillId;

                  return (
                    <div
                      key={skill.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isAwakenedSkill
                          ? 'bg-[#FFFBEB] border-[#F59E0B]/60 ring-2 ring-[#F59E0B]/30 shadow-sm'
                          : 'bg-[#FFFDF9] border-[#D5C29E] hover:border-[#D97706] shadow-2xs'
                      }`}
                    >
                      <div>
                        {/* Skill Header */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-[#FEF3C7] border border-[#F59E0B]/50 flex items-center justify-center font-bold text-xs text-[#92400E] shadow-2xs">
                              {index + 1}
                            </span>
                            <div>
                              <div className="text-sm font-black text-[#2E1F0F] font-serif flex items-center gap-2">
                                {skill.name}
                                {isAwakenedSkill && (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/50">
                                    AWAKENED
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#78654E] capitalize">
                                Target: {skill.targetType.replace('_', ' ').toLowerCase()}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                skill.cooldown === 0
                                  ? 'bg-[#FAF6ED] border-[#D5C29E] text-[#78654E]'
                                  : 'bg-[#E0F2FE] border-[#7DD3FC] text-[#0369A1]'
                              }`}
                            >
                              {skill.cooldown === 0 ? 'Basic (No CD)' : `${skill.cooldown} Turns CD`}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-[#5C4A34] leading-relaxed mt-2 font-medium">
                          {skill.description}
                        </p>
                      </div>

                      {/* Effects breakdown tags */}
                      <div className="mt-4 pt-3 border-t border-[#E8DEC8] flex flex-wrap gap-1.5">
                        {skill.effects.map((eff, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF6ED] border border-[#D5C29E] text-[#2E1F0F] font-mono shadow-2xs"
                          >
                            {eff.type === 'DAMAGE' && (
                              <span className="text-[#9F1239]">
                                ⚔️ {eff.multiplier}x {eff.scalingStat} ({eff.hits || 1} hits)
                              </span>
                            )}
                            {eff.type === 'HEAL' && (
                              <span className="text-[#166534]">
                                💚 {eff.multiplier}x {eff.scalingStat} Heal
                              </span>
                            )}
                            {eff.type === 'APPLY_STATUS' && (
                              <span className="text-[#0369A1]">
                                🌀 {Math.round((eff.chance || 1) * 100)}% {eff.statusEffect} ({eff.statusDuration}t)
                              </span>
                            )}
                            {eff.type === 'APPLY_BUFF' && (
                              <span className="text-[#92400E]">
                                🛡️ {eff.buffType} ({eff.statusDuration}t)
                              </span>
                            )}
                            {eff.type === 'CLEANSE' && (
                              <span className="text-[#15803D]">
                                ✨ Cleanse Debuffs
                              </span>
                            )}
                            {eff.type === 'ATB_BOOST' && (
                              <span className="text-[#B45309]">
                                ⚡ +{Math.round((eff.atbAmount || 0) * 100)}% Attack Bar
                              </span>
                            )}
                            {eff.type === 'EXTRA_TURN' && (
                              <span className="text-[#6D28D9] font-bold">
                                🎲 Instant Extra Turn
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: BASE STATS & LEVEL SCALING */}
          {activeTab === 'STATS' && (
            <div className="space-y-6">
              {/* Level Controller */}
              <div className="p-4 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                <div>
                  <div className="text-xs font-bold text-[#92400E] uppercase tracking-wider font-serif">
                    Dynamic Stat Simulator
                  </div>
                  <div className="text-sm font-black text-[#2E1F0F]">
                    Preview at Level {level} / 50
                  </div>
                </div>

                {/* Level presets & Slider */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex gap-1">
                    {[1, 25, 40, 50].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setLevel(preset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          level === preset
                            ? 'fantasy-btn-gold shadow-2xs'
                            : 'fantasy-btn-ivory'
                        }`}
                      >
                        Lv.{preset}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="w-32 sm:w-48 accent-[#D97706] cursor-pointer"
                  />

                  <button
                    onClick={() => setAwakened(!awakened)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      awakened
                        ? 'fantasy-btn-gold shadow-2xs'
                        : 'fantasy-btn-ivory'
                    }`}
                  >
                    ★ {awakened ? 'Awakened' : 'Base'}
                  </button>
                </div>
              </div>

              {/* Stat Meters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* HP */}
                <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-[#5C4A34] mb-1">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Heart className="w-3.5 h-3.5 text-[#E11D48]" />
                      HP (Health)
                    </span>
                    <span className="font-mono text-[#2E1F0F] font-extrabold text-sm">
                      {currentStats.hp.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#FAF6ED] rounded-full overflow-hidden mt-2 border border-[#E8DEC8]">
                    <div
                      className="h-full bg-[#E11D48] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (currentStats.hp / 14000) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-[#78654E] mt-1">
                    Base: {variant.baseStats.hp} (+{variant.growthPerLevel?.hp || 0}/lv)
                  </div>
                </div>

                {/* ATK */}
                <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-[#5C4A34] mb-1">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Swords className="w-3.5 h-3.5 text-[#D97706]" />
                      Attack
                    </span>
                    <span className="font-mono text-[#2E1F0F] font-extrabold text-sm">
                      {currentStats.attack.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#FAF6ED] rounded-full overflow-hidden mt-2 border border-[#E8DEC8]">
                    <div
                      className="h-full bg-[#D97706] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (currentStats.attack / 1200) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-[#78654E] mt-1">
                    Base: {variant.baseStats.attack} (+{variant.growthPerLevel?.attack || 0}/lv)
                  </div>
                </div>

                {/* DEF */}
                <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-[#5C4A34] mb-1">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Shield className="w-3.5 h-3.5 text-[#0284C7]" />
                      Defense
                    </span>
                    <span className="font-mono text-[#2E1F0F] font-extrabold text-sm">
                      {currentStats.defense.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#FAF6ED] rounded-full overflow-hidden mt-2 border border-[#E8DEC8]">
                    <div
                      className="h-full bg-[#0284C7] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (currentStats.defense / 950) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-[#78654E] mt-1">
                    Base: {variant.baseStats.defense} (+{variant.growthPerLevel?.defense || 0}/lv)
                  </div>
                </div>

                {/* SPD */}
                <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-[#5C4A34] mb-1">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Zap className="w-3.5 h-3.5 text-[#16A34A]" />
                      Speed
                    </span>
                    <span className="font-mono text-[#2E1F0F] font-extrabold text-sm">
                      {currentStats.speed}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#FAF6ED] rounded-full overflow-hidden mt-2 border border-[#E8DEC8]">
                    <div
                      className="h-full bg-[#16A34A] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (currentStats.speed / 130) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-[#78654E] mt-1">
                    Base: {variant.baseStats.speed} (+{variant.growthPerLevel?.speed || 0}/lv)
                  </div>
                </div>
              </div>

              {/* Secondary Combat Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] text-center shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-[#78654E]">Critical Rate</div>
                  <div className="text-base font-extrabold text-[#92400E] font-mono mt-0.5">
                    {Math.round(currentStats.critRate * 100)}%
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] text-center shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-[#78654E]">Critical Damage</div>
                  <div className="text-base font-extrabold text-[#92400E] font-mono mt-0.5">
                    {Math.round(currentStats.critDamage * 100)}%
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] text-center shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-[#78654E]">Accuracy</div>
                  <div className="text-base font-extrabold text-[#0369A1] font-mono mt-0.5">
                    {Math.round(currentStats.accuracy * 100)}%
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] text-center shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-[#78654E]">Resistance</div>
                  <div className="text-base font-extrabold text-[#6D28D9] font-mono mt-0.5">
                    {Math.round(currentStats.resistance * 100)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PORTRAIT & ARTWORK (PNG UPLOAD) */}
          {activeTab === 'PORTRAIT' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#2E1F0F] uppercase tracking-wider flex items-center gap-2 font-serif">
                    <span>2D Character Portrait & Artwork</span>
                    {portraitRegistry.hasCustomPortrait(variant.variantId) && (
                      <span className="text-[9px] font-bold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#86EFAC]">
                        CUSTOM PNG ACTIVE
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#5C4A34] font-medium">
                    Inspect the creature avatar or upload your own custom PNG portrait for this monster.
                  </p>
                </div>

                {portraitRegistry.hasCustomPortrait(variant.variantId) && (
                  <button
                    onClick={() => {
                      portraitRegistry.clearPortrait(variant.variantId);
                      setUploadMsg('Reset portrait to default SVG illustration.');
                    }}
                    className="flex items-center gap-1 text-xs text-[#9F1239] hover:text-[#4C0519] p-2 rounded-xl bg-[#FFE4E6] border border-[#FDA4AF] cursor-pointer transition-colors shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset to Default</span>
                  </button>
                )}
              </div>

              {uploadMsg && (
                <div className="text-xs font-semibold text-[#166534] bg-[#DCFCE7] border border-[#86EFAC] p-2.5 rounded-xl">
                  {uploadMsg}
                </div>
              )}

              <div className="p-6 rounded-3xl border border-[#D5C29E] bg-[#FAF6ED] flex flex-col sm:flex-row items-center gap-6 justify-center shadow-2xs">
                {/* Large Avatar preview */}
                <div className="flex flex-col items-center gap-2">
                  <MonsterAvatar
                    variantId={variant.variantId}
                    element={variant.element}
                    awakeningStage={awakeningStage}
                    size="xl"
                    className="shadow-md ring-4 ring-[#E8DEC8]"
                  />
                  <div className="text-xs font-mono text-[#5C4A34] font-bold">
                    {variant.name} ({awakeningStage})
                  </div>
                </div>

                {/* Upload Action Panel */}
                <div className="space-y-3 max-w-sm text-center sm:text-left">
                  <div className="text-xs text-[#5C4A34] font-medium">
                    Custom portraits are automatically displayed in battles, roster lists, party architect, turn meter, and codex modals.
                  </div>

                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl fantasy-btn-gold text-[#2E1F0F] font-black text-xs uppercase tracking-wider shadow-md cursor-pointer hover:scale-105 transition-all">
                    <Upload className="w-4 h-4 text-[#92400E]" />
                    <span>{isUploading ? 'Uploading...' : 'Upload PNG Portrait'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploading(true);
                        const reader = new FileReader();
                        reader.onload = async (ev) => {
                          const dataUrl = ev.target?.result as string;
                          if (dataUrl) {
                            await portraitRegistry.savePortrait(variant.variantId, dataUrl);
                            
                            // Also persist directly to canonical elemental storage
                            const uName = normalizeUnitName(variant.variantId, variant.name);
                            const elem = normalizeElement(variant.element, variant.variantId);
                            fetch('/api/characters/elemental-save', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                unit: uName,
                                element: elem,
                                type: 'portrait',
                                dataUrl,
                              }),
                            }).catch(() => {});

                            setUploadMsg(`Successfully updated portrait for ${variant.name}!`);
                            setIsUploading(false);
                          }
                        };
                        reader.onerror = () => {
                          setUploadMsg('Failed to read image file.');
                          setIsUploading(false);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  <div className="text-[10px] text-[#78654E] font-mono space-y-1">
                    <div>Canonical path: <code className="text-[#92400E] bg-[#FFFDF9] px-1 py-0.5 rounded border border-[#E8DEC8]">/assets/characters/{normalizeUnitName(variant.variantId, variant.name)}/{normalizeElement(variant.element, variant.variantId)}/PORTRAIT.png</code></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AWAKENING FORM & LORE */}
          {activeTab === 'AWAKENING' && (
            <div className="space-y-6">
              {/* Lore Card */}
              <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] space-y-2 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#92400E] font-serif">
                  Lore & Elemental Ecology
                </h4>
                <p className="text-sm text-[#5C4A34] leading-relaxed font-serif">
                  {variant.lore}
                </p>
                <div className="pt-2 text-xs text-[#78654E] italic">
                  Visual Silhouette Archetype: {variant.primaryRole} Guardian
                </div>
              </div>

              {/* Awakening Transformation Details */}
              {awakeningData && (
                <div className="p-6 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B]/50 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/50 flex items-center justify-center text-[#92400E] shadow-2xs">
                      <Crown className="w-6 h-6 text-[#D97706]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#92400E] tracking-wider">
                        Stage 1 Awakening Rite
                      </span>
                      <h3 className="text-lg font-black text-[#2E1F0F] font-serif">
                        Awakens into: {awakeningData.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-[#5C4A34] leading-relaxed font-medium">
                    {awakeningData.visualChangeDescription}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-[#FFFDF9] border border-[#D5C29E]">
                      <div className="text-[10px] font-bold text-[#92400E] uppercase">
                        Awakening Stat Multipliers
                      </div>
                      <div className="text-xs text-[#2E1F0F] mt-1 font-mono space-y-0.5">
                        {awakeningData.statMultipliers?.attack && (
                          <div>+{(awakeningData.statMultipliers.attack - 1) * 100}% Base Attack</div>
                        )}
                        {awakeningData.statMultipliers?.hp && (
                          <div>+{(awakeningData.statMultipliers.hp - 1) * 100}% Base HP</div>
                        )}
                        {awakeningData.statMultipliers?.speed && (
                          <div>+{awakeningData.statMultipliers.speed} Base Speed</div>
                        )}
                        {awakeningData.statMultipliers?.critRate && (
                          <div>+{Math.round(awakeningData.statMultipliers.critRate * 100)}% Critical Rate</div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FFFDF9] border border-[#D5C29E]">
                      <div className="text-[10px] font-bold text-[#166534] uppercase">
                        Unlocked Awakening Ability
                      </div>
                      <div className="text-xs text-[#2E1F0F] mt-1">
                        {awakeningData.unlockedSkillId ? (
                          <span className="font-bold text-[#2E1F0F] font-serif">
                            {getSkillDefinition(awakeningData.unlockedSkillId)?.name || awakeningData.unlockedSkillId}
                          </span>
                        ) : (
                          <span className="text-[#78654E]">Passive stat transcendence</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 border-t-2 border-[#E8DEC8] bg-[#FAF6ED] flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#5C4A34] font-medium hidden sm:block">
            Viewing <strong className="text-[#2E1F0F]">{variant.name}</strong> elemental codex entry
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2E1F0F] hover:bg-[#45311B] text-white border-2 border-[#2E1F0F] font-black text-xs uppercase tracking-wider shadow-md transition-colors cursor-pointer text-center ml-auto"
          >
            Close Entry
          </button>
        </div>
      </div>
    </div>
  );
};
