/**
 * Monster Codex Monster Card Component
 * Complete Codex card layout displaying:
 *  - Monster Unit Name & Awakening Title
 *  - Element details & Rarity badges
 *  - Dynamic loading of BOTH portrait.png and status.png from canonical elemental paths
 *    (assets/characters/[unitName]/[element]/portrait.png & status.png)
 *  - Transparent backgrounds with no white boxes, artifacts, or missing placeholders
 *  - Interactive combat pose preview (Status/Idle, Attack, Hurt, Defeated, Victory)
 *  - Key skills, stat progression bars, and quick inspection modal triggers
 */

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Droplet,
  Leaf,
  Sun,
  Moon,
  Shield,
  Swords,
  Zap,
  Sparkles,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Folder,
  Eye,
  Heart,
  Crown,
} from 'lucide-react';
import { MonsterVariant, ElementType } from '../types';
import { ELEMENT_VISUALS } from '../data/elements';
import { getSkillDefinition } from '../data/skills';
import {
  normalizeUnitName,
  normalizeElement,
  getElementalPortraitPath,
  getElementalStatusPath,
  getElementalCombatStates,
  TRANSPARENT_SPRITE_CLASSNAME,
  TRANSPARENT_SPRITE_STYLE,
} from '../services/character2d/elementalAssetHelper';
import { portraitRegistry } from '../services/character2d/portraitRegistry';
import { monster2DRegistry } from '../services/character2d/monster2DRegistry';
import { MonsterAvatar } from './MonsterAvatar';
import { MonsterStarRating } from './MonsterStarRating';

interface CodexMonsterCardProps {
  variant: MonsterVariant;
  onInspect: (variant: MonsterVariant) => void;
  onManageAssets?: (variant: MonsterVariant) => void;
}

type PoseState = 'STATUS' | 'ATTACK' | 'HURT' | 'DEFEATED' | 'VICTORY';

export const CodexMonsterCard: React.FC<CodexMonsterCardProps> = ({
  variant,
  onInspect,
  onManageAssets,
}) => {
  const [, setRerenderTick] = useState<number>(0);
  const [selectedPose, setSelectedPose] = useState<PoseState>('STATUS');
  const [portraitError, setPortraitError] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<boolean>(false);
  const [poseErrorMap, setPoseErrorMap] = useState<Record<string, boolean>>({});

  const unitName = normalizeUnitName(variant.variantId, variant.name);
  const elementKey = normalizeElement(variant.element, variant.variantId);
  const elementVisual = ELEMENT_VISUALS[variant.element] || ELEMENT_VISUALS.FIRE;

  // Canonical elemental asset paths
  const canonicalPortraitPath = getElementalPortraitPath(unitName, elementKey);
  const canonicalStatusPath = getElementalStatusPath(unitName, elementKey);
  const combatStates = getElementalCombatStates(unitName, elementKey);

  // Subscribe to registry updates for live real-time reflection
  useEffect(() => {
    const unsubPortraits = portraitRegistry.subscribe(() => setRerenderTick((t) => t + 1));
    const unsubSprites = monster2DRegistry.subscribe(() => setRerenderTick((t) => t + 1));
    return () => {
      unsubPortraits();
      unsubSprites();
    };
  }, []);

  // Determine current active portrait URL with hierarchical fallback
  const resolvedCustomPortrait = portraitRegistry.getPortraitUrl(
    variant.variantId,
    variant.element,
    variant.name
  );
  const activePortraitUrl =
    !portraitError && canonicalPortraitPath
      ? canonicalPortraitPath
      : resolvedCustomPortrait || canonicalPortraitPath;

  // Determine active status/pose sprite URL
  let activePoseUrl: string = canonicalStatusPath;
  if (selectedPose === 'STATUS') {
    activePoseUrl = canonicalStatusPath;
  } else if (selectedPose === 'ATTACK') {
    activePoseUrl = combatStates.attack;
  } else if (selectedPose === 'HURT') {
    activePoseUrl = combatStates.hurt;
  } else if (selectedPose === 'DEFEATED') {
    activePoseUrl = combatStates.defeated;
  } else if (selectedPose === 'VICTORY') {
    activePoseUrl = combatStates.victory;
  }

  // Fallback to custom sprite registry if canonical state errors or is missing
  const registrySprite = monster2DRegistry.getStateUrl(
    variant.variantId,
    selectedPose === 'STATUS' ? 'IDLE' : selectedPose,
    variant.element
  );

  const finalPoseUrl = poseErrorMap[selectedPose]
    ? registrySprite || canonicalStatusPath
    : activePoseUrl;

  const awakeningStage = variant.awakeningStages?.[0];
  const skills = (variant.skills || [])
    .slice(0, 3)
    .map((sId) => getSkillDefinition(sId))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  // Render elemental icon
  const renderElementIcon = () => {
    switch (variant.element) {
      case 'FIRE':
        return <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />;
      case 'WATER':
        return <Droplet className="w-3.5 h-3.5 text-cyan-500 fill-cyan-500/20" />;
      case 'GRASS':
        return <Leaf className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />;
      case 'LIGHT':
        return <Sun className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20" />;
      case 'DARK':
        return <Moon className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div
      id={`codex-card-${variant.variantId}`}
      className="group relative rounded-3xl bg-[#FFFDF9] border border-[#D5C29E] hover:border-[#D97706] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
      style={{
        boxShadow: '0 4px 16px rgba(92, 64, 40, 0.07)',
      }}
    >
      {/* Top Banner Accent Line */}
      <div
        className="h-1.5 w-full transition-all duration-300"
        style={{
          background: `linear-gradient(90deg, ${elementVisual.borderHex} 0%, ${elementVisual.borderHex}99 60%, transparent 100%)`,
        }}
      />

      <div className="p-5 sm:p-6 space-y-5">
        {/* Header: Title, Rarity, Element & Canonical Path Chip */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#E8DEC8] pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Element Badge */}
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide border shadow-2xs"
                style={{
                  backgroundColor: `${elementVisual.borderHex}15`,
                  borderColor: `${elementVisual.borderHex}55`,
                  color: elementVisual.borderHex,
                }}
              >
                {renderElementIcon()}
                <span>{variant.element}</span>
              </span>

              {/* Rarity & Role Badge */}
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF6ED] text-[#78654E] border border-[#D5C29E]">
                {variant.rarity} • {variant.primaryRole}
              </span>

              {/* Star Rating */}
              <div className="inline-flex items-center">
                <MonsterStarRating stars={variant.stars || 3} size="xs" showAllFiveSlots={false} />
              </div>

              {variant.isBoss && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFE4E6] text-[#9F1239] border border-[#FDA4AF] text-[10px] font-black uppercase tracking-wider">
                  <Crown className="w-3 h-3 text-[#9F1239]" /> BOSS
                </span>
              )}
            </div>

            {/* Monster Display Name */}
            <h3 className="text-xl sm:text-2xl font-black text-[#2E1F0F] font-serif tracking-tight group-hover:text-[#92400E] transition-colors">
              {variant.name}
            </h3>

            {/* Awakening Transformation Subtitle */}
            {awakeningStage && (
              <p className="text-xs font-serif italic text-[#92400E] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Awakens: <strong className="font-bold text-[#2E1F0F]">{awakeningStage.title}</strong></span>
              </p>
            )}
          </div>

          {/* Canonical Elemental Directory Pill */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F5EFE1] border border-[#D5C29E]/80 text-[#5C4A34] text-[11px] font-mono shrink-0 select-all"
            title={`Canonical Elemental Path: assets/characters/${unitName}/${elementKey}/`}
          >
            <Folder className="w-3.5 h-3.5 text-[#92400E] shrink-0" />
            <span className="truncate max-w-[200px] sm:max-w-none">
              characters/{unitName}/{elementKey}/
            </span>
          </div>
        </div>

        {/* Dual Visual Showcase Stage: Portrait (Left) + Combat Status Stance (Right) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
          {/* 1. Dynamic Portrait Display */}
          <div className="sm:col-span-5 flex flex-col items-center justify-between p-3.5 rounded-2xl bg-[#FAF6ED]/70 border border-[#E8DEC8] text-center relative overflow-hidden">
            <div className="w-full flex items-center justify-between text-[11px] font-bold text-[#78654E] mb-2 px-1">
              <span className="flex items-center gap-1 font-serif text-[#92400E]">
                <ImageIcon className="w-3 h-3" />
                portrait.png
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-1.5 py-0.2 rounded font-mono">
                Face Art
              </span>
            </div>

            {/* Portrait Frame with Gold Accents */}
            <div
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 shadow-md flex items-center justify-center bg-transparent transition-transform duration-300 group-hover:scale-102"
              style={{
                borderColor: elementVisual.borderHex,
                backgroundColor: 'transparent',
                backgroundImage: 'none',
              }}
            >
              {activePortraitUrl && !portraitError ? (
                <img
                  src={activePortraitUrl}
                  alt={`${variant.name} portrait`}
                  referrerPolicy="no-referrer"
                  onError={() => setPortraitError(true)}
                  className={`w-full h-full object-cover object-center ${TRANSPARENT_SPRITE_CLASSNAME}`}
                  style={TRANSPARENT_SPRITE_STYLE}
                />
              ) : (
                <div className="w-full h-full p-2 flex items-center justify-center bg-transparent">
                  <MonsterAvatar
                    variantId={variant.variantId}
                    element={variant.element}
                    size="xl"
                    className="w-full h-full shadow-none border-0"
                  />
                </div>
              )}

              {/* Element Crest in Corner */}
              <div
                className="absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-sm border border-white/60"
                style={{ backgroundColor: `${elementVisual.borderHex}` }}
              >
                {renderElementIcon()}
              </div>
            </div>

            {/* Path description */}
            <p className="text-[10px] text-[#78654E] mt-2 font-mono truncate w-full px-1">
              /{unitName}/{elementKey}/portrait.png
            </p>
          </div>

          {/* 2. Dynamic Status / Combat Stance Display */}
          <div className="sm:col-span-7 flex flex-col justify-between p-3.5 rounded-2xl bg-[#FAF6ED]/70 border border-[#E8DEC8] relative overflow-hidden">
            <div className="w-full flex items-center justify-between text-[11px] font-bold text-[#78654E] mb-2 px-1">
              <span className="flex items-center gap-1 font-serif text-[#92400E]">
                <Swords className="w-3 h-3" />
                status.png (Battle Stance)
              </span>
              <span className="text-[10px] text-amber-800 bg-amber-100/70 border border-amber-300 px-1.5 py-0.2 rounded font-mono">
                Full Body
              </span>
            </div>

            {/* Battlefield Pedestal & Live Transparent Sprite */}
            <div
              className="relative w-full h-36 sm:h-40 flex items-end justify-center rounded-xl bg-transparent overflow-hidden"
              style={{
                backgroundColor: 'transparent',
                backgroundImage: 'none',
              }}
            >
              {/* Ethereal Battlefield Radial Ground Disc */}
              <div
                className="absolute bottom-1 w-36 h-8 rounded-full blur-[1px] pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at center, ${elementVisual.borderHex}44 0%, ${elementVisual.borderHex}11 50%, transparent 75%)`,
                  transform: 'scaleY(0.4)',
                }}
              />

              {/* Status or Combat Pose Sprite */}
              <div className="relative z-10 animate-monster-breathe flex items-end justify-center h-full pb-1 bg-transparent">
                {finalPoseUrl && !statusError ? (
                  <img
                    src={finalPoseUrl}
                    alt={`${variant.name} ${selectedPose}`}
                    referrerPolicy="no-referrer"
                    onError={() => {
                      if (selectedPose === 'STATUS') setStatusError(true);
                      setPoseErrorMap((prev) => ({ ...prev, [selectedPose]: true }));
                    }}
                    className={`max-h-[135px] max-w-[150px] object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.55)] transition-all ${TRANSPARENT_SPRITE_CLASSNAME}`}
                    style={TRANSPARENT_SPRITE_STYLE}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-2 text-center bg-transparent">
                    <MonsterAvatar
                      variantId={variant.variantId}
                      element={variant.element}
                      size="xl"
                      className="w-24 h-24 mb-1"
                    />
                    <span className="text-[10px] text-[#78654E] italic font-serif">
                      Stylized Illustration Active
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Pose Switcher Controls (Status, Attack, Hurt, Defeated, Victory) */}
            <div className="mt-2 pt-2 border-t border-[#E8DEC8]/80 flex items-center justify-center gap-1 flex-wrap">
              {(['STATUS', 'ATTACK', 'HURT', 'DEFEATED', 'VICTORY'] as PoseState[]).map((pose) => {
                const isActive = selectedPose === pose;
                return (
                  <button
                    key={pose}
                    type="button"
                    onClick={() => setSelectedPose(pose)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#2E1F0F] text-white border border-[#2E1F0F] shadow-xs scale-105 ring-1 ring-[#D97706]'
                        : 'bg-white text-[#2E1F0F] border border-[#D5C29E] hover:border-[#D97706] hover:bg-[#FAF6ED] shadow-2xs font-bold'
                    }`}
                  >
                    {pose === 'STATUS' ? 'Status' : pose.toLowerCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ecology Lore */}
        <p className="text-xs text-[#5C4A34] leading-relaxed line-clamp-2 font-medium italic font-serif">
          "{variant.lore}"
        </p>

        {/* Base Stats Preview */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#E8DEC8]/80">
          <div className="p-1.5 rounded-xl bg-[#FAF6ED] border border-[#E8DEC8] text-center">
            <div className="text-[9px] font-bold text-[#78654E] flex items-center justify-center gap-0.5">
              <Heart className="w-2.5 h-2.5 text-rose-500" /> HP
            </div>
            <div className="text-xs font-black text-[#2E1F0F] font-mono mt-0.5">
              {variant.baseStats.hp}
            </div>
          </div>

          <div className="p-1.5 rounded-xl bg-[#FAF6ED] border border-[#E8DEC8] text-center">
            <div className="text-[9px] font-bold text-[#78654E] flex items-center justify-center gap-0.5">
              <Swords className="w-2.5 h-2.5 text-amber-600" /> ATK
            </div>
            <div className="text-xs font-black text-[#2E1F0F] font-mono mt-0.5">
              {variant.baseStats.attack}
            </div>
          </div>

          <div className="p-1.5 rounded-xl bg-[#FAF6ED] border border-[#E8DEC8] text-center">
            <div className="text-[9px] font-bold text-[#78654E] flex items-center justify-center gap-0.5">
              <Shield className="w-2.5 h-2.5 text-blue-600" /> DEF
            </div>
            <div className="text-xs font-black text-[#2E1F0F] font-mono mt-0.5">
              {variant.baseStats.defense}
            </div>
          </div>

          <div className="p-1.5 rounded-xl bg-[#FAF6ED] border border-[#E8DEC8] text-center">
            <div className="text-[9px] font-bold text-[#78654E] flex items-center justify-center gap-0.5">
              <Zap className="w-2.5 h-2.5 text-emerald-600" /> SPD
            </div>
            <div className="text-xs font-black text-[#2E1F0F] font-mono mt-0.5">
              {variant.baseStats.speed}
            </div>
          </div>
        </div>

        {/* Signature Skills */}
        {skills.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#78654E] font-serif">
              Signature Skills ({skills.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {skills.slice(0, 2).map((sk) => (
                <div
                  key={sk.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF6ED] border border-[#E8DEC8] text-left"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#2E1F0F] text-[#F5EFE1] flex items-center justify-center text-xs font-bold shrink-0">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-[#2E1F0F] truncate">{sk.name}</div>
                    <div className="text-[10px] text-[#78654E] truncate font-medium">
                      {sk.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="p-4 bg-[#FAF6ED] border-t-2 border-[#E8DEC8] flex items-center justify-between gap-3">
        {onManageAssets && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onManageAssets(variant);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border-2 border-[#C5A059] hover:border-[#D97706] text-[#2E1F0F] text-xs font-black transition-all cursor-pointer shadow-xs hover:bg-[#FAF6ED]"
            title="Upload or manage custom PNG assets for this monster"
          >
            <Upload className="w-3.5 h-3.5 text-[#92400E]" />
            <span>Manage PNGs</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onInspect(variant)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl fantasy-btn-gold border-2 border-[#D97706] text-[#2E1F0F] font-black text-xs uppercase tracking-wider shadow-md transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Eye className="w-4 h-4 text-[#92400E]" />
          <span>Inspect Codex Details</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#92400E]" />
        </button>
      </div>
    </div>
  );
};
