/**
 * Monster Realms - 2.5D Campaign World Map & Sequential Stage Progression
 * Features interactive 2.5D continent landmasses, locked continent chains,
 * and 10-node sequential campaign roads (1-1 -> 1-2 -> ... -> 1-10 Boss -> 2-1).
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Compass,
  Crown,
  Flame,
  Globe,
  Lock,
  Play,
  Shield,
  Sparkles,
  Star,
  Swords,
  Trophy,
  Zap,
} from 'lucide-react';
import { Continent, PlayerMonster, PlayerProfile, PvEStage } from '../types';
import { CONTINENTS, getStagesForContinent, isContinentUnlocked, isStageUnlocked } from '../data/stages';
import { ELEMENT_VISUALS } from '../data/elements';
import { MONSTER_VARIANTS } from '../data/monsters';
import { calculateEffectiveStats } from '../engine/statCalculator';
import { ContinentArt } from './ContinentArt';
import { MonsterAvatar } from './MonsterAvatar';
import { StageBackgroundArt, getStageTerrainInfo } from './StageBackgroundArt';

interface CampaignWorldMapProps {
  profile: PlayerProfile;
  monsters: PlayerMonster[];
  stages: PvEStage[];
  onSelectStageForBattle: (stage: PvEStage) => void;
}

export const CampaignWorldMap: React.FC<CampaignWorldMapProps> = ({
  profile,
  monsters,
  stages,
  onSelectStageForBattle,
}) => {
  const completedStages = Array.isArray(profile?.completedStages) ? profile.completedStages : [];
  const stageStars = profile?.stageStars || {};

  // Selected Continent: null means World Overview Map; non-null means Continent 10-Stage Path
  const [selectedContinentId, setSelectedContinentId] = useState<string | null>(null);
  // Selected Stage for Deployment Drawer
  const [selectedStage, setSelectedStage] = useState<PvEStage | null>(null);
  // Hovered continent in world map
  const [hoveredContinentId, setHoveredContinentId] = useState<string | null>(null);
  // Locked stage warning
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const activeContinent = selectedContinentId
    ? CONTINENTS.find((c) => c.continentId === selectedContinentId) || CONTINENTS[0]
    : null;

  const continentStages = activeContinent ? getStagesForContinent(activeContinent.continentId) : [];

  // Player active team combat power (derived from profile.activeParty)
  const playerActiveTeam = React.useMemo(() => {
    if (profile?.activeParty && profile.activeParty.length > 0) {
      const resolved = profile.activeParty
        .map((id) => monsters.find((m) => m.instanceId === id))
        .filter((m): m is PlayerMonster => !!m);
      if (resolved.length > 0) return resolved;
    }
    return monsters.slice(0, 5);
  }, [profile?.activeParty, monsters]);

  const playerTeamPower = playerActiveTeam.reduce((acc, m) => {
    const v = MONSTER_VARIANTS[m.variantId];
    if (!v) return acc;
    const stats = calculateEffectiveStats({
      variant: v,
      level: m.level,
      awakeningStage: m.awakeningStage,
    }).finalStats;
    return acc + Math.floor(stats.hp / 10 + stats.attack * 1.5 + stats.defense * 1.2 + stats.speed * 2);
  }, 0);

  // Total stars collected across all stages
  const totalStars = Object.values(stageStars).reduce((acc: number, s: any) => acc + (typeof s === 'number' ? s : 0), 0);

  const handleStageClick = (stage: PvEStage) => {
    const unlocked = isStageUnlocked(stage.stageId, completedStages);
    if (!unlocked) {
      if (stage.stageNumber === 1 && stage.chapter > 1) {
        const prevBoss = stages.find((s) => s.chapter === stage.chapter - 1 && s.stageNumber === 10);
        setLockedNotice(
          `Stage ${stage.chapter}-${stage.stageNumber} is locked! You must defeat the Boss of Continent ${
            stage.chapter - 1
          } (${prevBoss?.name || 'Stage ' + (stage.chapter - 1) + '-10'}) first.`
        );
      } else {
        const prevStage = stages.find(
          (s) => s.chapter === stage.chapter && s.stageNumber === stage.stageNumber - 1
        );
        setLockedNotice(
          `Stage ${stage.chapter}-${stage.stageNumber} is locked! Clear preceding Stage ${stage.chapter}-${
            stage.stageNumber - 1
          } (${prevStage?.name || 'Stage ' + stage.chapter + '-' + (stage.stageNumber - 1)}) first.`
        );
      }
      setTimeout(() => setLockedNotice(null), 5000);
      return;
    }
    setLockedNotice(null);
    setSelectedStage(stage);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Locked Notice Banner */}
      {lockedNotice && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFF1F2] border border-[#FDA4AF] text-[#9F1239] flex items-center justify-between shadow-md animate-shake">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FFE4E6] flex items-center justify-center text-[#E11D48] shrink-0">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#9F1239]">
                Sequential Unlock Required
              </div>
              <div className="text-xs text-[#BE123C] font-medium mt-0.5">{lockedNotice}</div>
            </div>
          </div>
          <button
            onClick={() => setLockedNotice(null)}
            className="text-xs font-bold text-[#9F1239] hover:text-[#4C0519] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#FFE4E6] cursor-pointer shrink-0 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Campaign Continent Stage Navigation Bar (Shown when exploring a specific continent) */}
      {selectedContinentId && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl fantasy-plate shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto min-w-0 flex-1">
            <button
              onClick={() => {
                setSelectedContinentId(null);
                setSelectedStage(null);
              }}
              className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black cursor-pointer shrink-0 shadow-md transition-all hover:scale-105 active:scale-95 bg-gradient-to-b from-[#FDE047] via-[#F59E0B] to-[#D97706] text-[#2E1F0F] border-2 border-[#B45309] ring-2 ring-[#FEF08A]/60"
              title="Return to Continents Overview"
            >
              <ArrowLeft className="w-4 h-4 text-[#2E1F0F] stroke-[3]" />
              <span className="font-serif tracking-wide text-[#2E1F0F] drop-shadow-none">← Back to Continents</span>
            </button>

            <div className="hidden md:block h-6 w-px bg-[#E8DEC8] shrink-0" />

            {/* Quick Continent Switcher Pills */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-full scrollbar-none py-0.5">
              {CONTINENTS.map((c) => {
                const unlocked = isContinentUnlocked(c.continentId, completedStages);
                const isCurrent = selectedContinentId === c.continentId;
                const elemVisual = ELEMENT_VISUALS[c.element];

                return (
                  <button
                    key={c.continentId}
                    onClick={() => {
                      if (unlocked) {
                        setSelectedContinentId(c.continentId);
                        setSelectedStage(null);
                      } else {
                        setLockedNotice(
                          `Continent ${c.chapter} (${c.name}) is locked! Defeat the Boss of Continent ${
                            c.chapter - 1
                          } (Stage ${c.chapter - 1}-10) to conquer and unlock this realm.`
                        );
                        setTimeout(() => setLockedNotice(null), 5000);
                      }
                    }}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                      isCurrent
                        ? 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B] shadow-2xs'
                        : unlocked
                        ? 'bg-[#FAF6ED] text-[#5C4A34] hover:text-[#2E1F0F] hover:bg-[#F3ECE0] border-[#D5C29E]'
                        : 'bg-[#F2ECE1]/60 text-[#A89884] border-[#E2D6C0] cursor-not-allowed'
                    }`}
                    style={{
                      borderColor: isCurrent ? elemVisual.colorHex : undefined,
                    }}
                  >
                    {unlocked ? (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: elemVisual.colorHex }}
                      />
                    ) : (
                      <Lock className="w-3 h-3 text-[#A89884]" />
                    )}
                    <span>Ch.{c.chapter}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campaign Metrics Display */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8DEC8]">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-[#FAF6ED] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-[#D5C29E] text-[11px] sm:text-xs shadow-2xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span className="font-extrabold text-[#92400E]">{totalStars}</span>
              <span className="text-[#8C7A65]">/ 150 ★</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 bg-[#FAF6ED] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-[#D5C29E] text-[11px] sm:text-xs shadow-2xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-[#0284C7]" />
              <span className="text-[#8C7A65] hidden sm:inline">Team CP:</span>
              <span className="font-extrabold text-[#0369A1]">{playerTeamPower.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 1: WORLD OVERVIEW MAP (5 Floating 2.5D Continents)
         ============================================================ */}
      {!selectedContinentId && (
        <div className="space-y-4">
          {/* 5 Continents 2.5D Grid matching image.png mockup */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4.5">
            {CONTINENTS.map((continent) => {
              const unlocked = isContinentUnlocked(continent.continentId, completedStages);
              const cStages = getStagesForContinent(continent.continentId);
              const clearedCount = cStages.filter((s) => completedStages.includes(s.stageId)).length;
              const isConquered = clearedCount === 10;
              const isHovered = hoveredContinentId === continent.continentId;

              // Theme configuration matching the mockup in image.png
              const MOCKUP_THEMES: Record<string, {
                tag: string;
                cardBg: string;
                border: string;
                tagBg: string;
                tagText: string;
                tagBorder: string;
              }> = {
                continent_1: {
                  tag: 'FLAME CHAPTER 1: FIRE',
                  cardBg: 'bg-[#FFF7ED]',
                  border: 'border-[#FED7AA]',
                  tagBg: 'bg-[#FFEDD5]',
                  tagText: 'text-[#C2410C]',
                  tagBorder: 'border-[#FDBA74]',
                },
                continent_2: {
                  tag: 'DEEPEST CHAPTER 2: WATER',
                  cardBg: 'bg-[#F0F9FF]',
                  border: 'border-[#BAE6FD]',
                  tagBg: 'bg-[#E0F2FE]',
                  tagText: 'text-[#0284C7]',
                  tagBorder: 'border-[#7DD3FC]',
                },
                continent_3: {
                  tag: 'LEAF CHAPTER 3: GRASS',
                  cardBg: 'bg-[#F0FDF4]',
                  border: 'border-[#BBF7D0]',
                  tagBg: 'bg-[#DCFCE7]',
                  tagText: 'text-[#15803D]',
                  tagBorder: 'border-[#86EFAC]',
                },
                continent_4: {
                  tag: 'SUN CHAPTER 4: LIGHT',
                  cardBg: 'bg-[#FEFCE8]',
                  border: 'border-[#FEF08A]',
                  tagBg: 'bg-[#FEF9C3]',
                  tagText: 'text-[#A16207]',
                  tagBorder: 'border-[#FDE047]',
                },
                continent_5: {
                  tag: 'MOON CHAPTER 5: DARK',
                  cardBg: 'bg-[#FAF5FF]',
                  border: 'border-[#E9D5FF]',
                  tagBg: 'bg-[#F3E8FF]',
                  tagText: 'text-[#7E22CE]',
                  tagBorder: 'border-[#D8B4FE]',
                },
              };

              const theme = MOCKUP_THEMES[continent.continentId] || {
                tag: `CHAPTER ${continent.chapter}: ${continent.element}`,
                cardBg: 'bg-[#FFFDF9]',
                border: 'border-[#D5C29E]',
                tagBg: 'bg-[#FAF6ED]',
                tagText: 'text-[#78654E]',
                tagBorder: 'border-[#D5C29E]',
              };

              return (
                <div
                  key={continent.continentId}
                  onMouseEnter={() => setHoveredContinentId(continent.continentId)}
                  onMouseLeave={() => setHoveredContinentId(null)}
                  onClick={() => {
                    if (unlocked) {
                      setSelectedContinentId(continent.continentId);
                    } else {
                      setLockedNotice(
                        `Continent ${continent.chapter} (${continent.name}) is locked! Defeat Stage ${
                          continent.chapter - 1
                        }-10 Boss to unlock.`
                      );
                      setTimeout(() => setLockedNotice(null), 5000);
                    }
                  }}
                  className={`group relative rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between overflow-hidden cursor-pointer select-none ${theme.cardBg} ${theme.border} ${
                    unlocked
                      ? 'shadow-xs hover:shadow-md hover:-translate-y-1'
                      : 'opacity-85 hover:opacity-95'
                  }`}
                >
                  {/* Top Bar: Chapter Tag (Left) & Progress / Locked Badge (Right) */}
                  <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs font-mono truncate ${theme.tagBg} ${theme.tagText} ${theme.tagBorder}`}
                    >
                      {theme.tag}
                    </span>

                    {isConquered ? (
                      <span className="text-[10px] font-black text-[#92400E] bg-[#FEF3C7] border border-[#F59E0B]/50 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs shrink-0">
                        <Trophy className="w-3 h-3 text-[#D97706]" />
                        <span>Cleared</span>
                      </span>
                    ) : unlocked ? (
                      <span className="text-[10px] font-extrabold text-[#78350F] bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs shrink-0">
                        {clearedCount > 0 ? `${clearedCount} Cleared` : 'Available'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-[#9F1239] bg-[#FFE4E6] border border-[#FDA4AF] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs shrink-0 uppercase tracking-wide">
                        <Lock className="w-3 h-3 text-[#E11D48]" />
                        <span>LOCKED</span>
                      </span>
                    )}
                  </div>

                  {/* 2.5D Isometric Biome Illustration */}
                  <div className="relative z-10 py-2 sm:py-3 flex items-center justify-center min-h-[140px] sm:min-h-[160px]">
                    <ContinentArt
                      element={continent.element}
                      isHovered={isHovered}
                      isLocked={!unlocked}
                      className="w-full h-36 sm:h-40 drop-shadow-md"
                    />

                    {/* Lock Overlay Badge matching mockup */}
                    {!unlocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                        <div className="bg-[#FFFDF9]/90 border border-[#FDA4AF] rounded-2xl py-2 px-3.5 shadow-sm backdrop-blur-xs flex flex-col items-center">
                          <div className="w-7 h-7 rounded-xl bg-[#FFE4E6] flex items-center justify-center text-[#E11D48] mb-1">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] font-black text-[#9F1239] uppercase tracking-wider font-mono">
                            LOCKED REALM
                          </span>
                          <span className="text-[9px] text-[#5C4A34] mt-0.5 max-w-[150px] leading-tight">
                            Defeat Stage {continent.chapter - 1}-10 Boss to unlock
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Continent Lore & Sovereign Info */}
                  <div className="relative z-10 space-y-1.5 mt-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-[#2E1F0F] font-serif tracking-wide group-hover:text-amber-800 transition-colors">
                        {continent.name}
                      </h3>
                      <div className="text-[11px] font-semibold text-[#78654E]">{continent.subtitle}</div>
                    </div>

                    <p className="text-[11px] text-[#5C4A34] line-clamp-2 leading-relaxed">
                      {continent.description}
                    </p>

                    {/* Boss Bounty & Stage Count Footer */}
                    <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[11px] text-[#5C4A34]">
                      <div className="flex items-center gap-1.5 truncate max-w-[190px]">
                        <Crown className="w-3 h-3 text-[#D97706] shrink-0" />
                        <span className="truncate text-[10px] font-semibold">{continent.bossName}</span>
                      </div>

                      {unlocked ? (
                        <span className="font-mono font-bold text-[10px] text-amber-800 whitespace-nowrap">
                          Stages 10
                        </span>
                      ) : (
                        <span className="font-mono text-[#8C7A65] text-[10px] whitespace-nowrap">
                          Unlock: Lv. {continent.chapter - 1}-10
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 2: CONTINENT 10-NODE SEQUENTIAL ROAD (Stages 1-1 to 1-10)
         ============================================================ */}
      {selectedContinentId && activeContinent && (
        <div className="space-y-6">
          {/* Continent Hero Banner with Biome Scenery */}
          <div className="fantasy-scroll-card p-4 sm:p-8 overflow-hidden">
            {/* Scenic Biome Panorama Backdrop */}
            <StageBackgroundArt
              continentId={activeContinent.continentId}
              element={activeContinent.element}
              mode="hero"
              className="opacity-55 pointer-events-none"
            />

            {/* Background Biome Atmospheric Light */}
            <div
              className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: activeContinent.colorHex }}
            />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded border shadow-2xs"
                    style={{
                      backgroundColor: `${activeContinent.colorHex}20`,
                      color: activeContinent.accentHex,
                      borderColor: `${activeContinent.colorHex}40`,
                    }}
                  >
                    Chapter {activeContinent.chapter} • {activeContinent.element}
                  </span>
                  <span className="text-xs text-[#5C4A34]">10 Sequential Battles</span>
                </div>

                <h1 className="text-xl sm:text-4xl font-black text-[#2E1F0F] font-serif tracking-wide">
                  {activeContinent.name}
                </h1>
                <p className="text-xs sm:text-sm text-[#5C4A34] max-w-xl">
                  {activeContinent.description}
                </p>
              </div>

              {/* Progress Summary Card */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <div className="p-3 sm:p-4 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E] flex items-center justify-between sm:justify-start gap-4 sm:gap-5 shadow-sm shrink-0">
                  <div>
                    <div className="text-[10px] font-bold text-[#78654E] uppercase tracking-widest">
                      Continent Progress
                    </div>
                    <div className="text-lg sm:text-xl font-black text-[#2E1F0F] font-serif mt-0.5">
                      {continentStages.filter((s) => completedStages.includes(s.stageId)).length} / 10
                      <span className="text-xs text-[#5C4A34] font-normal ml-1.5">Cleared</span>
                    </div>
                  </div>

                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/40 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-[#D97706]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sequential Stage Roadmap (1-1 -> 1-2 -> ... -> 1-10) */}
          <div className="p-3.5 sm:p-8 rounded-2xl sm:rounded-3xl fantasy-plate shadow-sm relative overflow-hidden">
            {/* Ambient Biome Map Horizon Scenery */}
            <StageBackgroundArt
              continentId={activeContinent.continentId}
              element={activeContinent.element}
              mode="hero"
              className="opacity-15 pointer-events-none"
            />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <div>
                <h2 className="text-base sm:text-xl font-black text-[#2E1F0F] font-serif flex items-center gap-2">
                  <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-[#D97706]" />
                  Tactical Campaign Path
                </h2>
                <p className="text-xs text-[#5C4A34] mt-0.5">
                  Stages unlock sequentially. Clear each stage in order to reach the Continent Sovereign at Stage{' '}
                  {activeContinent.chapter}-10!
                </p>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold text-[#5C4A34]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border border-emerald-400" />
                  Cleared
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500 border border-amber-400 animate-pulse" />
                  Current
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#D5C29E] border border-[#BFA882]" />
                  Locked
                </span>
              </div>
            </div>

            {/* 10-Node Grid Path with 2.5D Depth (2 cols on mobile, 3 cols on tablet, 5 cols on desktop) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 sm:gap-6">
              {continentStages.map((stage) => {
                const isCleared = completedStages.includes(stage.stageId);
                const isUnlocked = isStageUnlocked(stage.stageId, completedStages);
                const stars = stageStars[stage.stageId] || 0;
                const isCurrentActive = isUnlocked && !isCleared;
                const isSelected = selectedStage?.stageId === stage.stageId;
                const isBoss = stage.isBossStage;
                const isMidBoss = stage.stageNumber === 5;

                return (
                  <div
                    key={stage.stageId}
                    onClick={() => handleStageClick(stage)}
                    className={`relative rounded-2xl border transition-all duration-300 p-4 flex flex-col justify-between select-none cursor-pointer group overflow-hidden ${
                      isSelected
                        ? 'ring-2 ring-[#F59E0B] scale-102 z-20 shadow-xl bg-[#FFFBEB] border-[#D97706]'
                        : isCurrentActive
                        ? 'border-[#F59E0B] bg-gradient-to-b from-[#FFFBEB] via-[#FFFDF9] to-[#FAF6ED] shadow-md shadow-amber-900/10 hover:-translate-y-1'
                        : isCleared
                        ? 'border-[#A7F3D0] bg-[#F0FDF4] hover:border-[#34D399] hover:-translate-y-1 shadow-2xs'
                        : 'border-[#E2D6C0] bg-[#FAF6ED]/70 opacity-60 hover:opacity-80'
                    }`}
                  >
                    {/* Stage-Specific Illustrated Scenic Background Art */}
                    <StageBackgroundArt
                      stage={stage}
                      element={activeContinent.element}
                      continentId={activeContinent.continentId}
                      mode="card"
                      className={`transition-opacity duration-300 pointer-events-none ${
                        isSelected
                          ? 'opacity-85'
                          : isUnlocked
                          ? 'opacity-65 group-hover:opacity-85'
                          : 'opacity-30'
                      }`}
                    />

                    {/* Relative wrapper for node content */}
                    <div className="relative z-10 flex flex-col justify-between h-full">
                      {/* Top Status & Node Number */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-lg border tracking-wider shadow-2xs ${
                            isBoss
                              ? 'bg-[#FFE4E6] text-[#9F1239] border-[#FDA4AF]'
                              : isMidBoss
                              ? 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]'
                              : isCleared
                              ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                              : isUnlocked
                              ? 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]'
                              : 'bg-[#FAF6ED] text-[#8C7A65] border-[#D5C29E]'
                          }`}
                        >
                          {stage.chapter}-{stage.stageNumber}
                          {isBoss && ' • BOSS'}
                          {isMidBoss && ' • GATE'}
                        </span>

                        {/* Stars / Lock Icon */}
                        {isCleared ? (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3].map((starIdx) => (
                              <Star
                                key={starIdx}
                                className={`w-3.5 h-3.5 ${
                                  starIdx <= stars
                                    ? 'fill-amber-400 text-amber-500'
                                    : 'text-[#D5C29E]'
                                }`}
                              />
                            ))}
                          </div>
                        ) : isUnlocked ? (
                          <span className="text-[10px] font-black uppercase text-[#D97706] animate-pulse">
                            AVAILABLE
                          </span>
                        ) : (
                          <Lock className="w-4 h-4 text-[#8C7A65]" />
                        )}
                      </div>

                      {/* 2.5D Node Pedestal Visual */}
                      <div className="relative py-4 flex flex-col items-center justify-center">
                        {/* Active Beacon Ripple */}
                        {isCurrentActive && (
                          <div className="absolute w-20 h-20 rounded-full border border-amber-500/40 animate-ping pointer-events-none" />
                        )}

                        {/* 2.5D Stage Plinth */}
                        <div
                          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-md border ${
                            isBoss
                              ? 'bg-gradient-to-tr from-rose-600 to-amber-500 border-rose-400 text-white shadow-rose-900/20'
                              : isMidBoss
                              ? 'bg-gradient-to-tr from-amber-500 to-amber-400 border-amber-300 text-white'
                              : isCleared
                              ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-400 text-white'
                              : isUnlocked
                              ? 'bg-gradient-to-tr from-amber-100 to-amber-200 border-[#F59E0B] text-[#92400E]'
                              : 'bg-[#FAF6ED] border-[#D5C29E] text-[#A89884]'
                          }`}
                        >
                          {isBoss ? (
                            <Crown className="w-8 h-8 fill-current" />
                          ) : isMidBoss ? (
                            <Shield className="w-7 h-7" />
                          ) : isCleared ? (
                            <Trophy className="w-7 h-7" />
                          ) : isUnlocked ? (
                            <Play className="w-6 h-6 fill-current ml-1" />
                          ) : (
                            <Lock className="w-6 h-6" />
                          )}
                        </div>

                        {/* Boss Title Banner */}
                        {isBoss && (
                          <div className="mt-2 text-[10px] font-black uppercase tracking-wider text-[#9F1239] bg-[#FFE4E6] border border-[#FDA4AF] px-2 py-0.5 rounded-full shadow-2xs">
                            Continent Boss
                          </div>
                        )}
                      </div>

                      {/* Stage Title & Enemy Info */}
                      <div className="mt-2 text-center space-y-1">
                        <div className="text-xs font-black text-[#2E1F0F] truncate group-hover:text-[#D97706] transition-colors">
                          {stage.name}
                        </div>

                        <div className="text-[10px] text-[#78654E] flex items-center justify-center gap-2">
                          <span className="text-[#0284C7] font-semibold">{stage.energyCost} Energy</span>
                          <span>•</span>
                          <span className="text-[#B45309] font-semibold">{stage.recommendedPower} CP</span>
                        </div>
                      </div>

                      {/* Locked Requirement Tag */}
                      {!isUnlocked && (
                        <div className="mt-2 text-[10px] text-center text-[#BE123C] font-medium">
                          Clear {stage.stageNumber === 1 ? `${stage.chapter - 1}-10 Boss` : `${stage.chapter}-${stage.stageNumber - 1}`} first
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================
              STAGE INTEL & DEPLOYMENT DRAWER / CARD
             ============================================================ */}
          {selectedStage && (
            <div className="rounded-2xl sm:rounded-3xl border border-[#D5C29E] fantasy-plate p-4 sm:p-8 shadow-xl relative animate-fadeIn overflow-hidden">
              {/* Cinematic Widescreen Stage Background Art */}
              <StageBackgroundArt
                stage={selectedStage}
                element={activeContinent.element}
                continentId={activeContinent.continentId}
                mode="drawer"
                className="opacity-45 pointer-events-none"
              />

              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
                {/* Stage Info */}
                <div className="space-y-2 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-[#92400E] bg-[#FEF3C7] border border-[#F59E0B]/50 px-2.5 py-1 rounded-lg shadow-2xs">
                      Stage {selectedStage.chapter}-{selectedStage.stageNumber}
                    </span>
                    {selectedStage.isBossStage && (
                      <span className="text-xs font-black text-[#9F1239] bg-[#FFE4E6] border border-[#FDA4AF] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs">
                        <Crown className="w-3.5 h-3.5" />
                        CONTINENT SOVEREIGN
                      </span>
                    )}
                    <span className="text-xs text-[#5C4A34]">{activeContinent.name}</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-[#2E1F0F] font-serif">
                    {selectedStage.name}
                  </h3>

                  {/* Terrain & Atmospheric Characteristics */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-[#92400E] bg-[#FEF3C7] border border-[#F59E0B]/40 px-2.5 py-0.5 rounded-full shadow-2xs">
                      Terrain: {getStageTerrainInfo(selectedStage).terrain}
                    </span>
                    <span className="text-[#5C4A34] bg-[#FAF6ED] border border-[#D5C29E] px-2.5 py-0.5 rounded-full shadow-2xs">
                      {getStageTerrainInfo(selectedStage).atmosphere}
                    </span>
                  </div>

                  <p className="text-xs text-[#5C4A34] leading-relaxed">
                    {selectedStage.description}
                  </p>

                  {/* Enemy Lineup Preview */}
                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-[#78654E] uppercase tracking-wider mb-2">
                      Enemy 5-Unit Roster:
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {selectedStage.enemyVariants.map((e, idx) => {
                        const v = MONSTER_VARIANTS[e.variantId];
                        return (
                          <div
                            key={idx}
                            className="flex flex-col items-center p-2 rounded-xl bg-[#FFFDF9] border border-[#D5C29E] text-center min-w-[72px] shadow-2xs"
                          >
                            <MonsterAvatar
                              variantId={e.variantId}
                              element={v?.element || 'FIRE'}
                              awakeningStage={e.awakeningStage}
                              size="sm"
                              className="mb-1"
                            />
                            <span className="text-[10px] font-bold text-[#2E1F0F] truncate max-w-[80px]" title={v?.name}>
                              {v?.name || 'Enemy'}
                            </span>
                            <span className="text-[9px] text-[#B45309] font-semibold">Lv.{e.level}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Rewards & Deployment CTA */}
                <div className="w-full lg:w-80 space-y-4 p-5 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] shrink-0 shadow-md">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#78654E]">Energy Cost:</span>
                      <span className="font-extrabold text-[#0284C7]">
                        {selectedStage.energyCost} / {profile.currencies.energy} Energy
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#78654E]">Recommended CP:</span>
                      <span className="font-extrabold text-[#B45309]">
                        {selectedStage.recommendedPower.toLocaleString()} CP
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#78654E]">Your Team CP:</span>
                      <span
                        className={`font-extrabold ${
                          playerTeamPower >= selectedStage.recommendedPower
                            ? 'text-[#15803D]'
                            : 'text-[#BE123C]'
                        }`}
                      >
                        {playerTeamPower.toLocaleString()} CP{' '}
                        {playerTeamPower >= selectedStage.recommendedPower ? '(Advantage)' : '(Caution)'}
                      </span>
                    </div>
                  </div>

                  {/* First Clear Bounty */}
                  {!completedStages.includes(selectedStage.stageId) && (
                    <div className="p-3 rounded-xl bg-[#FEF3C7]/80 border border-[#F59E0B]/40 text-[11px] space-y-1 shadow-2xs">
                      <div className="font-black text-[#92400E] uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                        First-Clear Bounty:
                      </div>
                      <div className="text-[#5C4A34] flex items-center gap-3 font-semibold">
                        <span>+{selectedStage.firstClearRewards.gold.toLocaleString()} Gold</span>
                        <span>+{selectedStage.firstClearRewards.gems} Gems</span>
                        <span>+{selectedStage.firstClearRewards.summonPoints} SP</span>
                      </div>
                    </div>
                  )}

                  {/* Deploy Action */}
                  <button
                    onClick={() => onSelectStageForBattle(selectedStage)}
                    disabled={profile.currencies.energy < selectedStage.energyCost}
                    className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform cursor-pointer shadow-md ${
                      profile.currencies.energy >= selectedStage.energyCost
                        ? 'bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white hover:scale-102 shadow-rose-900/20'
                        : 'bg-[#FAF6ED] text-[#A89884] cursor-not-allowed border border-[#D5C29E]'
                    }`}
                  >
                    <Swords className="w-4 h-4" />
                    {profile.currencies.energy >= selectedStage.energyCost
                      ? 'Deploy 5v5 Battle'
                      : 'Insufficient Energy'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
