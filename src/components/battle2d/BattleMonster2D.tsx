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
import { AlertTriangle, Sparkles, Upload } from 'lucide-react';
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
        participant.isAlive ? 'cursor-pointer' : 'cursor-default'
      } ${isActing ? 'z-35' : isTargeted ? 'z-30' : 'z-15'}`}
      style={{
        transform: `scale(${depthScale})`,
        transformOrigin: 'bottom center',
        width: '130px',
        minHeight: '190px',
      }}
    >
      {/* 1. Tactical Overhead Status HUD */}
      <div className="w-full flex flex-col items-center mb-1 z-30 pointer-events-none">
        {/* Name & Affinity Pill */}
        <div className="flex items-center gap-1 mb-0.5 max-w-[130px] flex-wrap justify-center">
          <div
            className="flex items-center gap-1 text-[10px] font-black tracking-wide truncate drop-shadow-md px-1.5 py-0.2 rounded"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              color: isActing ? '#fef08a' : '#f8fafc',
              border: isActing ? '1px solid #facc15' : '1px solid rgba(148, 163, 184, 0.3)',
            }}
          >
            <span className="text-[9px] text-amber-400 font-mono">Lv.{participant.level}</span>
            <span className="truncate max-w-[65px]">{monsterName}</span>
            {participant.stars && (
              <MonsterStarRating stars={participant.stars} size="xs" showAllFiveSlots={false} />
            )}
          </div>
          {affinityTag === 'ADVANTAGE' && (
            <span className="text-[8px] font-black text-emerald-300 bg-emerald-950/90 border border-emerald-500/50 px-1 rounded shadow">
              ADV
            </span>
          )}
          {affinityTag === 'DISADVANTAGE' && (
            <span className="text-[8px] font-black text-rose-300 bg-rose-950/90 border border-rose-500/50 px-1 rounded shadow">
              DIS
            </span>
          )}
        </div>

        {/* Extra Turn Banner */}
        {isExtraTurn && (
          <div className="flex items-center gap-1 text-[9px] font-black text-amber-300 bg-amber-950/90 border border-amber-400 px-2 py-0.5 rounded-full mb-1 shadow-lg animate-bounce">
            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
            <span>EXTRA TURN</span>
          </div>
        )}

        {/* Mini HP Bar */}
        <div className="w-20 h-1.5 bg-slate-950/90 rounded-full overflow-hidden border border-slate-700/80 shadow mb-0.5">
          <div
            className={`h-full transition-all duration-300 ${
              isPlayer
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-rose-600 to-amber-500'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>

        {/* Mini Turn Meter Bar */}
        <div className="w-20 h-1 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800 shadow mb-0.5">
          <div
            className="h-full bg-cyan-400 transition-all duration-300"
            style={{ width: `${tmPercent}%` }}
          />
        </div>

        {/* Active Buffs / Debuffs */}
        {participant.activeEffects.length > 0 && (
          <div className="flex items-center justify-center gap-0.5 flex-wrap max-w-[110px]">
            {participant.activeEffects.slice(0, 3).map((eff, i) => (
              <BuffDebuffIcon key={eff.id || `${eff.type}-${i}`} effect={eff} size="xs" />
            ))}
          </div>
        )}
      </div>

      {/* 2. Target Reticle Indicator (Surrounding Floor Base & Framing, NOT covering artwork) */}
      {isTargeted && (
        <div className="absolute inset-0 pointer-events-none z-25 flex items-center justify-center">
          <div className="w-28 h-28 rounded-full border-2 border-dashed border-rose-400 animate-spin duration-[9000ms] shadow-lg shadow-rose-500/25 opacity-80" />
          <div className="absolute top-1 text-[9px] font-black tracking-widest text-rose-300 bg-rose-950/95 px-2 py-0.2 rounded-full border border-rose-500 shadow">
            TARGET
          </div>
        </div>
      )}

      {/* 3. The 2D Monster Artwork (Directly on Battlefield, NOT a Card) */}
      <div
        className={`relative z-20 flex items-end justify-center transition-all bg-transparent ${animationClass}`}
        style={{
          width: '100%',
          height: '150px',
          backgroundColor: 'transparent',
          backgroundImage: 'none',
          ...transformStyle,
        }}
      >
        {/* Subtle, dynamic non-rectangular contact ground shadow moving with character */}
        {assetUrl && !isAssetMissing && (
          <div
            className="absolute bottom-0 pointer-events-none -z-10 rounded-full blur-[2.5px] transition-all duration-300"
            style={{
              width: `${fitting.groundShadowWidth}px`,
              height: '16px',
              background:
                'radial-gradient(ellipse at center, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 50%, transparent 75%)',
              opacity: fitting.groundShadowOpacity,
              transform: 'translateY(5px)',
            }}
          />
        )}

        {isAssetMissing || !assetUrl ? (
          /* Explicit Missing Asset Diagnostic per Specification */
          <div
            className="w-full h-full flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/90 border-2 border-dashed border-amber-500/70 text-amber-200 shadow-xl text-center select-none"
            title="VISUAL ASSET NOT YET ASSIGNED"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 mb-0.5 animate-pulse" />
            <div className="font-mono text-[8px] uppercase font-bold text-amber-400 tracking-wider">
              VISUAL ASSET NOT YET ASSIGNED
            </div>
            <div className="font-mono text-[9px] font-bold text-slate-200 truncate max-w-[110px] mt-0.5">
              Character: {monsterName}
            </div>
            <div className="font-mono text-[8px] font-black text-amber-300 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/40 mt-0.5">
              State: {visualState}
            </div>
            <div className="font-mono text-[8px] text-amber-400/90 mt-0.5">
              Asset: NOT ASSIGNED
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
            className={`max-h-[145px] max-w-[130px] object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.65)] filter transition-all pointer-events-none select-none ${TRANSPARENT_SPRITE_CLASSNAME}`}
            style={{
              ...TRANSPARENT_SPRITE_STYLE,
              transform: `${!isPlayer ? 'scaleX(-1) ' : ''}scale(${fitting.scale}) translateY(${fitting.translateY}px)`,
              transformOrigin: 'bottom center',
            }}
          />
        )}
      </div>

      {/* 4. Runic Battlefield Ground Pad Node & Luminous Ring */}
      <div className="relative w-28 h-6 -mt-2.5 z-10 flex items-center justify-center pointer-events-none">
        {/* Luminous elemental ground ring */}
        <div
          className={`absolute w-20 h-4 rounded-full border transition-all duration-500 ${
            isActing
              ? 'scale-125 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/50'
              : 'border-slate-700/60'
          }`}
          style={{
            borderColor: isActing ? '#facc15' : elementVisual.color,
            boxShadow: `0 0 10px ${isActing ? '#facc15' : elementVisual.color}40`,
          }}
        />

        {/* Center glowing runic beacon */}
        <div
          className="w-2 h-2 rounded-full opacity-70"
          style={{ backgroundColor: elementVisual.color, boxShadow: `0 0 6px ${elementVisual.color}` }}
        />
      </div>
    </div>
  );
};
