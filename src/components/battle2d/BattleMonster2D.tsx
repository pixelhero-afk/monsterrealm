/**
 * 2D Monster Combat Sprite Renderer
 * Directly renders full-character illustrations on the battlefield across 5 dedicated states:
 * IDLE, ATTACK, HURT, DEAD, VICTORY.
 * Strictly adheres to non-card layout, subtle animations, directional facing,
 * depth scaling, and explicit missing asset diagnostics.
 */

import React, { useState, useEffect, useRef } from 'react';
import { BattleParticipant, ElementType } from '../../types';
import { ELEMENT_VISUALS } from '../../data/elements';
import { monster2DRegistry } from '../../services/character2d/monster2DRegistry';
import { portraitRegistry } from '../../services/character2d/portraitRegistry';
import { MonsterCombatVisualState } from '../../services/character2d/types';
import { BuffDebuffIcon } from '../battle/BuffDebuffIcon';
import { MonsterStarRating } from '../MonsterStarRating';
import { AlertTriangle, Sparkles, Upload, ChevronDown } from 'lucide-react';
import {
  calculateSpriteFitting,
  detectVisibleBounds,
  CharacterBounds,
} from '../../services/character2d/spriteFitting';
import {
  TRANSPARENT_SPRITE_CLASSNAME,
  TRANSPARENT_SPRITE_STYLE,
} from '../../services/character2d/elementalAssetHelper';
import { useBattleTransparentSprite } from '../../services/character2d/battleSpriteTransparency';

interface BattleMonster2DProps {
  participant: BattleParticipant;
  visualState: MonsterCombatVisualState;
  isTargeted: boolean;
  isActing: boolean;
  isExtraTurn?: boolean;
  affinityTag?: 'ADVANTAGE' | 'DISADVANTAGE' | null;
  depthScale?: number;
  lungeVector?: { x: number; y: number };
  onClick?: () => void;
  onOpenAssetManager?: (familyId: string, state: MonsterCombatVisualState) => void;
}

export const BattleMonster2D: React.FC<BattleMonster2DProps> = ({
  participant,
  visualState,
  isTargeted,
  isActing,
  isExtraTurn,
  affinityTag,
  depthScale = 1.0,
  lungeVector,
  onClick,
  onOpenAssetManager,
}) => {
  const isPlayer = participant.team === 'PLAYER';
  const monsterName = monster2DRegistry.getMonsterName(participant.variantId, participant.name);
  const elementVisual = ELEMENT_VISUALS[participant.element] || ELEMENT_VISUALS.FIRE;

  // Resolve initial reliable URL so character is visible immediately without flashing
  const initialUrl =
    monster2DRegistry.getStateUrl(participant.variantId, visualState, participant.element) ||
    monster2DRegistry.getStateUrl(participant.variantId, 'IDLE', participant.element) ||
    portraitRegistry.getPortraitUrl(participant.variantId, participant.element, participant.name);

  const [assetUrl, setAssetUrl] = useState<string | null>(initialUrl);
  const [isAssetLoaded, setIsAssetLoaded] = useState<boolean>(true);
  const [isAssetMissing, setIsAssetMissing] = useState<boolean>(false);
  const [detectedBounds, setDetectedBounds] = useState<CharacterBounds | null>(null);

  // Automatically make white or near-white backgrounds completely invisible on the battlefield
  const transparentSpriteUrl = useBattleTransparentSprite(assetUrl);
  const displayUrl = transparentSpriteUrl || assetUrl;

  // Persistent reference to the last valid loaded image URL guarantees the character never disappears or flashes out during combat turns
  const lastValidUrlRef = useRef<string | null>(initialUrl);
  if (assetUrl) {
    lastValidUrlRef.current = assetUrl;
  }

  // Sync with registry whenever variant, state, or custom sprites change
  useEffect(() => {
    let isCancelled = false;
    setDetectedBounds(null);

    const updateAsset = () => {
      // 1. Try state-specific visual URL
      let url = monster2DRegistry.getStateUrl(
        participant.variantId,
        visualState,
        participant.element
      );

      // 2. Seamless fallback to IDLE state or last known valid URL so combatant remains rock-solid on field
      if (!url) {
        url =
          monster2DRegistry.getStateUrl(
            participant.variantId,
            'IDLE',
            participant.element
          ) ||
          lastValidUrlRef.current ||
          portraitRegistry.getPortraitUrl(
            participant.variantId,
            participant.element,
            participant.name
          );
      }

      if (url) {
        setAssetUrl(url);
        lastValidUrlRef.current = url;
        setIsAssetMissing(false);
        setIsAssetLoaded(true);
      } else if (!lastValidUrlRef.current) {
        setIsAssetMissing(true);
        setIsAssetLoaded(false);
      }
    };

    updateAsset();
    const unsubscribe = monster2DRegistry.subscribe(updateAsset);
    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [participant.variantId, visualState, participant.element]);

  // Dynamic animation classes based on combat state - smooth physical motions with stable opacity
  let animationClass = '';
  const transformStyle: React.CSSProperties = {};

  switch (visualState) {
    case 'IDLE':
      // Smooth breathing bob with solid 100% opacity - NO fading/pulsing in and out
      animationClass = 'animate-monster-breathe';
      break;
    case 'ATTACK':
      // Dynamic directional lunge towards target across the battlefield
      animationClass = 'transition-transform duration-200 ease-out z-40';
      if (lungeVector && (lungeVector.x !== 0 || lungeVector.y !== 0)) {
        transformStyle.transform = `translate(${lungeVector.x}px, ${lungeVector.y}px) scale(1.12)`;
      } else {
        // Fallback horizontal lunge: player moves right, enemy moves left
        animationClass += isPlayer
          ? ' translate-x-8 sm:translate-x-14 scale-110'
          : ' -translate-x-8 sm:-translate-x-14 scale-110';
      }
      break;
    case 'HURT':
      // Physical impact tremor recoil - NO brightness flare or strobe
      animationClass = 'animate-hit-tremor z-30';
      break;
    case 'DEFEATED':
    case 'DEAD':
      // Defeated on the battlefield - full color DEAD sprite, gentle sink, non-interactive (no greying out)
      animationClass = 'translate-y-3 pointer-events-none transition-all duration-700';
      break;
    case 'VICTORY':
      // Triumphant celebration bounce
      animationClass = 'scale-105 duration-500 ease-in-out -translate-y-2';
      break;
  }

  // HP and Turn Meter calculation
  const hpPercent = Math.max(0, Math.min(100, (participant.currentHp / participant.maxHp) * 100));
  const tmPercent = Math.max(0, Math.min(100, participant.turnMeter));

  // Sprite fitting calculation to guarantee uniform visual size across Idle, Attack, Hurt, Dead, Victory
  const fitting = calculateSpriteFitting(participant.variantId, visualState, detectedBounds);

  return (
    <div
      onClick={() => {
        if (participant.isAlive && onClick) onClick();
      }}
      className={`relative flex flex-col items-center justify-end select-none group transition-transform ${
        participant.isAlive ? 'cursor-pointer active:scale-95' : 'cursor-default'
      } ${isActing ? 'z-35' : isTargeted ? 'z-30' : 'z-15'} w-[76px] sm:w-[104px] lg:w-[128px] min-h-[110px] sm:min-h-[148px] lg:min-h-[185px]`}
      style={{
        transform: `scale(${depthScale})`,
        transformOrigin: 'bottom center',
      }}
    >
      {/* 1. Tactical Overhead Status HUD (Matching Reference Image) */}
      <div className="w-full flex flex-col items-center mb-1 sm:mb-1.5 z-30 pointer-events-none">
        {/* Unit Plate Card: Lv, Name, Numeric HP Bar */}
        <div
          className={`flex flex-col items-center px-1 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg backdrop-blur-md transition-all shadow-md w-full max-w-[74px] sm:max-w-[100px] lg:max-w-[126px] ${
            isActing
              ? 'bg-slate-950/95 border border-amber-400 ring-1 sm:ring-2 ring-amber-400/50 scale-105'
              : isTargeted
              ? 'bg-slate-950/90 border border-rose-500 ring-1 ring-rose-500/50'
              : 'bg-slate-950/85 border border-slate-700/70'
          }`}
        >
          {/* Top Line: Level & Name */}
          <div className="flex items-center justify-between w-full gap-0.5 sm:gap-1 mb-0.5">
            <span className="text-[7.5px] sm:text-[9.5px] lg:text-[10px] text-amber-400 font-black font-mono">
              Lv.{participant.level}
            </span>
            <span className="text-[8px] sm:text-[10px] lg:text-[11px] font-black text-slate-100 truncate font-serif text-center flex-1 drop-shadow-sm">
              {monsterName}
            </span>
            {participant.stars && (
              <span className="text-[7.5px] sm:text-[9px] text-amber-300">★{participant.stars}</span>
            )}
          </div>

          {/* HP Bar with Numeric Text inside/on top (Matching Reference Image) */}
          <div className="relative w-full h-2 sm:h-2.5 lg:h-3 bg-slate-900 rounded-xs overflow-hidden border border-slate-700/80 shadow-inner flex items-center justify-center">
            <div
              className={`absolute left-0 top-0 bottom-0 transition-all duration-300 ${
                isPlayer
                  ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
            {/* Centered Numeric HP: e.g. 315/215 */}
            <span className="relative z-10 text-[6.5px] sm:text-[8px] lg:text-[8.5px] font-black font-mono text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] tracking-tight">
              {participant.currentHp}/{participant.maxHp}
            </span>
          </div>

          {/* Thin Turn Meter Bar */}
          <div className="w-full h-0.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${tmPercent}%` }}
            />
          </div>
        </div>

        {/* Affinity Tag & Extra Turn Banner */}
        <div className="flex items-center gap-1 mt-0.5 justify-center flex-wrap">
          {affinityTag === 'ADVANTAGE' && (
            <span className="text-[7px] sm:text-[8px] font-black text-emerald-300 bg-emerald-950/90 border border-emerald-500/60 px-1 py-0.2 rounded shadow">
              +ADV
            </span>
          )}
          {affinityTag === 'DISADVANTAGE' && (
            <span className="text-[7px] sm:text-[8px] font-black text-rose-300 bg-rose-950/90 border border-rose-500/60 px-1 py-0.2 rounded shadow">
              -DIS
            </span>
          )}
          {isExtraTurn && (
            <div className="flex items-center gap-0.5 text-[7px] sm:text-[8px] font-black text-amber-300 bg-amber-950/95 border border-amber-400 px-1 py-0.2 rounded shadow animate-bounce">
              <Sparkles className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-amber-300" />
              <span>EXTRA</span>
            </div>
          )}
        </div>

        {/* Active Buffs / Debuffs */}
        {participant.activeEffects.length > 0 && (
          <div className="flex items-center justify-center gap-0.5 mt-0.5 flex-wrap max-w-[76px] sm:max-w-[120px]">
            {participant.activeEffects.slice(0, 4).map((eff, i) => (
              <BuffDebuffIcon key={eff.id || `${eff.type}-${i}`} effect={eff} size="xs" />
            ))}
          </div>
        )}
      </div>

      {/* 2. Target Reticle Indicator (Floating Bouncing Arrow + Floor Ring) */}
      {isTargeted && (
        <>
          {/* Floating Target Arrow above unit */}
          <div className="absolute -top-7 sm:-top-8 flex flex-col items-center pointer-events-none z-40 animate-bounce">
            <div className="flex items-center gap-0.5 px-1.5 py-0.2 sm:py-0.5 rounded-full bg-rose-600 text-white font-black text-[7px] sm:text-[8.5px] shadow-lg border border-rose-300 uppercase tracking-wider">
              <ChevronDown className="w-2.5 h-2.5" />
              <span>TARGET</span>
            </div>
          </div>

          {/* Floor Target Ring */}
          <div className="absolute inset-0 pointer-events-none z-25 flex items-center justify-center">
            <div className="w-20 sm:w-26 h-20 sm:h-26 rounded-full border-2 border-dashed border-rose-400 animate-spin duration-[9000ms] shadow-lg shadow-rose-500/25 opacity-70" />
          </div>
        </>
      )}

      {/* 3. The 2D Monster Artwork (Directly on Battlefield, NOT a Card) */}
      <div
        className={`relative z-20 flex items-end justify-center transition-all bg-transparent ${animationClass} w-full h-[85px] sm:h-[115px] lg:h-[145px]`}
        style={{
          backgroundColor: 'transparent',
          backgroundImage: 'none',
          ...transformStyle,
        }}
      >
        {/* Subtle, dynamic non-rectangular contact ground shadow moving with character */}
        {assetUrl && !isAssetMissing && (
          <div
            className="absolute bottom-0 pointer-events-none -z-10 rounded-full blur-[2px] transition-all duration-300"
            style={{
              width: `${Math.max(28, fitting.groundShadowWidth * 0.8)}px`,
              height: '14px',
              background:
                'radial-gradient(ellipse at center, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 50%, transparent 75%)',
              opacity: fitting.groundShadowOpacity,
              transform: 'translateY(4px)',
            }}
          />
        )}

        {isAssetMissing || !assetUrl ? (
          /* Explicit Missing Asset Diagnostic per Specification */
          <div
            className="w-full h-full flex flex-col items-center justify-center p-1 sm:p-2 rounded-xl bg-slate-950/90 border border-dashed border-amber-500/70 text-amber-200 shadow-xl text-center select-none"
            title="VISUAL ASSET NOT YET ASSIGNED"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mb-0.5 animate-pulse" />
            <div className="font-mono text-[7px] uppercase font-bold text-amber-400 tracking-wider">
              NO ASSET
            </div>
            <div className="font-mono text-[8px] font-bold text-slate-200 truncate max-w-[70px] sm:max-w-[100px] mt-0.5">
              {monsterName}
            </div>
          </div>
        ) : (
          /* Actual 2D Character Artwork Transparent PNG */
          <img
            src={displayUrl}
            alt={`${monsterName} - ${visualState}`}
            referrerPolicy="no-referrer"
            onLoad={(e) => {
              const bounds = detectVisibleBounds(e.currentTarget);
              setDetectedBounds(bounds);
              setIsAssetLoaded(true);
              setIsAssetMissing(false);
            }}
            onError={() => {
              // Gracefully handle broken or 404 image paths so white broken-image boxes never appear
              const fallbackUrl =
                monster2DRegistry.getStateUrl(participant.variantId, 'IDLE', participant.element) ||
                portraitRegistry.getPortraitUrl(participant.variantId, participant.element, participant.name);

              if (fallbackUrl && fallbackUrl !== assetUrl) {
                setAssetUrl(fallbackUrl);
              } else {
                setIsAssetMissing(true);
                setIsAssetLoaded(false);
              }
            }}
            className={`max-h-[85px] sm:max-h-[115px] lg:max-h-[145px] max-w-[76px] sm:max-w-[104px] lg:max-w-[128px] object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.65)] filter transition-all pointer-events-none select-none ${TRANSPARENT_SPRITE_CLASSNAME}`}
            style={{
              ...TRANSPARENT_SPRITE_STYLE,
              transform: `${!isPlayer ? 'scaleX(-1) ' : ''}scale(${fitting.scale}) translateY(${fitting.translateY}px)`,
              transformOrigin: 'bottom center',
            }}
          />
        )}
      </div>

      {/* 4. Natural Ground Contact Shadow & Combat Turn Aura */}
      <div className="relative w-20 sm:w-28 h-4 sm:h-5 -mt-1.5 sm:-mt-2 z-10 flex items-center justify-center pointer-events-none">
        {/* Soft Organic Ground Contact Shadow */}
        <div className="w-14 sm:w-20 h-2 sm:h-2.5 rounded-full bg-black/45 blur-[2px] transition-all" />

        {/* Dynamic Acting Magic Ring (Only glows during unit's active turn) */}
        {isActing && (
          <div
            className="absolute w-18 sm:w-24 h-4 sm:h-5 rounded-full border-2 border-amber-400 bg-amber-400/25 shadow-[0_0_12px_rgba(251,191,36,0.65)] animate-pulse"
          />
        )}

        {/* Targeted Highlight Indicator */}
        {isTargeted && !isActing && (
          <div
            className="absolute w-16 sm:w-22 h-3.5 sm:h-4.5 rounded-full border-2 border-rose-500 bg-rose-500/25 shadow-[0_0_10px_rgba(244,63,94,0.55)] animate-pulse"
          />
        )}
      </div>
    </div>
  );
};
