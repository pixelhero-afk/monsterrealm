/**
 * Cinematic 5v5 Battle Monster Sprite
 * Renders full-standing original fantasy creature artwork on luminous 3D combat pedestals.
 * Features idle breathing, attack lunges, hit flinches, elemental ground runes,
 * animated HP/Turn-Meter plates, and live status effect indicators.
 */

import React, { useState, useEffect } from 'react';
import { AwakeningStage, BattleParticipant, ElementType } from '../../types';
import { ELEMENT_VISUALS } from '../../data/elements';
import { Swords, Zap, Shield, Skull } from 'lucide-react';
import { BuffDebuffIcon } from './BuffDebuffIcon';
import { monster2DRegistry } from '../../services/character2d/monster2DRegistry';
import {
  TRANSPARENT_SPRITE_CLASSNAME,
  TRANSPARENT_SPRITE_STYLE,
} from '../../services/character2d/elementalAssetHelper';
import { useBattleTransparentSprite } from '../../services/character2d/battleSpriteTransparency';

interface BattleMonsterSpriteProps {
  participant: BattleParticipant;
  isActing: boolean;
  isTargeted: boolean;
  isLunging: boolean;
  isFlinching: boolean;
  affinityTag?: 'ADVANTAGE' | 'DISADVANTAGE' | null;
  onClick: () => void;
  team: 'PLAYER' | 'ENEMY';
}

export const BattleMonsterSprite: React.FC<BattleMonsterSpriteProps> = ({
  participant,
  isActing,
  isTargeted,
  isLunging,
  isFlinching,
  affinityTag,
  onClick,
  team,
}) => {
  const isPlayer = team === 'PLAYER';
  const elementVisual = ELEMENT_VISUALS[participant.element];
  const isAwakened = participant.awakeningStage !== 'BASE';

  // HP and Shield calculations
  const hpPercent = Math.max(
    0,
    Math.min(100, (participant.currentHp / participant.maxHp) * 100)
  );
  const shield =
    participant.activeEffects.find((e) => e.type === 'SHIELD')?.value || 0;
  const shieldPercent = Math.min(100, (shield / participant.maxHp) * 100);
  const tmPercent = Math.max(0, Math.min(100, participant.turnMeter));

  // Dynamic animations
  const lungeClass = isLunging
    ? isPlayer
      ? 'animate-player-lunge z-30'
      : 'animate-enemy-lunge z-30'
    : '';

  const flinchClass = isFlinching ? 'animate-hit-tremor z-20' : '';

  // Dynamic visual state & elemental sprite loading
  const visualState = !participant.isAlive
    ? 'DEFEATED'
    : isLunging
    ? 'ATTACK'
    : isFlinching
    ? 'HURT'
    : 'IDLE';

  const [spriteUrl, setSpriteUrl] = useState<string | null>(() =>
    monster2DRegistry.getStateUrl(participant.variantId, visualState, participant.element)
  );
  const [hasSpriteError, setHasSpriteError] = useState<boolean>(false);

  // Eliminate white background from sprite during battle
  const transparentSpriteUrl = useBattleTransparentSprite(spriteUrl);
  const displaySpriteUrl = transparentSpriteUrl || spriteUrl;

  useEffect(() => {
    setHasSpriteError(false);
    const update = () => {
      setSpriteUrl(
        monster2DRegistry.getStateUrl(participant.variantId, visualState, participant.element)
      );
    };
    update();
    const unsub = monster2DRegistry.subscribe(update);
    return () => unsub();
  }, [participant.variantId, visualState, participant.element]);

  // Render Full Monster Creature SVG
  const renderCreatureArt = () => {
    const id = participant.variantId;

    switch (id) {
      case 'var_pyrosaur_fire':
      case 'var_pyrosaur_water':
      case 'var_pyrosaur_grass':
      case 'var_pyrosaur_light':
      case 'var_pyrosaur_dark':
      case 'var_boss_pyrosaur_ignis': {
        const elem = participant.element || 'FIRE';
        const palettes = {
          FIRE: {
            grad1: '#f97316', grad2: '#ea580c', grad3: '#991b1b',
            core1: '#fef08a', core2: '#f97316', core3: '#dc2626',
            stroke: '#7f1d1d', aura: '#fbbf24', eye: '#ef4444', horn: '#78350f', hornStroke: '#b45309',
          },
          WATER: {
            grad1: '#38bdf8', grad2: '#0284c7', grad3: '#0c4a6e',
            core1: '#e0f2fe', core2: '#38bdf8', core3: '#0369a1',
            stroke: '#082f49', aura: '#38bdf8', eye: '#0284c7', horn: '#1e293b', hornStroke: '#0284c7',
          },
          GRASS: {
            grad1: '#4ade80', grad2: '#16a34a', grad3: '#14532d',
            core1: '#dcfce7', core2: '#4ade80', core3: '#15803d',
            stroke: '#052e16', aura: '#86efac', eye: '#16a34a', horn: '#1c1917', hornStroke: '#16a34a',
          },
          LIGHT: {
            grad1: '#fef08a', grad2: '#eab308', grad3: '#713f12',
            core1: '#ffffff', core2: '#fde047', core3: '#ca8a04',
            stroke: '#422006', aura: '#fef08a', eye: '#ca8a04', horn: '#451a03', hornStroke: '#eab308',
          },
          DARK: {
            grad1: '#c084fc', grad2: '#9333ea', grad3: '#3b0764',
            core1: '#f3e8ff', core2: '#a855f7', core3: '#581c87',
            stroke: '#2e1065', aura: '#d8b4fe', eye: '#7e22ce', horn: '#1e1b4b', hornStroke: '#9333ea',
          },
        };
        const p = palettes[elem] || palettes.FIRE;

        return (
          <svg viewBox="0 0 120 140" className="w-24 h-28 sm:w-28 sm:h-32 drop-shadow-2xl">
            <defs>
              <linearGradient id={`pyroBody_${elem}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={p.grad1} />
                <stop offset="45%" stopColor={p.grad2} />
                <stop offset="100%" stopColor={p.grad3} />
              </linearGradient>
              <radialGradient id={`pyroCore_${elem}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={p.core1} />
                <stop offset="60%" stopColor={p.core2} />
                <stop offset="100%" stopColor={p.core3} stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Awakened Corona */}
            {isAwakened && (
              <g opacity="0.85">
                <circle cx="60" cy="70" r="54" fill="none" stroke={p.aura} strokeWidth="1.5" strokeDasharray="6 4" />
                <polygon points="60,8 65,22 55,22" fill={p.aura} />
                <polygon points="112,70 98,75 98,65" fill={p.aura} />
                <polygon points="8,70 22,75 22,65" fill={p.aura} />
              </g>
            )}
            {/* Tail */}
            <path d="M78 100 Q105 110 110 85 Q115 65 118 55 Q108 75 90 90 Z" fill={p.grad3} stroke={p.stroke} strokeWidth="1.5" />
            <circle cx="118" cy="55" r="5" fill={p.grad1} />
            <circle cx="118" cy="55" r="2.5" fill={p.core1} />
            {/* Back Horns / Spikes */}
            <polygon points="40,35 25,15 48,28" fill={p.horn} stroke={p.hornStroke} strokeWidth="1" />
            <polygon points="80,35 95,15 72,28" fill={p.horn} stroke={p.hornStroke} strokeWidth="1" />
            <polygon points="56,22 60,6 64,22" fill={p.grad1} />
            {/* Legs & Claws */}
            <path d="M36 100 L30 128 L44 128 L40 100 Z" fill={p.horn} />
            <polygon points="26,128 32,135 34,128" fill={p.core1} />
            <polygon points="34,128 40,135 42,128" fill={p.core1} />
            <path d="M84 100 L90 128 L76 128 L80 100 Z" fill={p.horn} />
            <polygon points="76,128 82,135 84,128" fill={p.core1} />
            <polygon points="84,128 90,135 92,128" fill={p.core1} />
            {/* Saurian Torso & Head */}
            <path
              d="M38 95 L32 55 L45 35 L60 22 L75 35 L88 55 L82 95 Q60 110 38 95 Z"
              fill={`url(#pyroBody_${elem})`}
              stroke={p.stroke}
              strokeWidth="2"
            />
            {/* Elemental Armor Scales */}
            <polygon points="52,42 60,32 68,42 60,52" fill={p.horn} />
            <polygon points="44,58 52,50 50,66 42,64" fill={p.grad3} />
            <polygon points="76,58 68,50 70,66 78,64" fill={p.grad3} />
            {/* Glowing Elemental Ventral Core */}
            <circle cx="60" cy="74" r="14" fill={`url(#pyroCore_${elem})`} />
            <line x1="52" y1="74" x2="68" y2="74" stroke="#ffffff" strokeWidth="1.5" />
            {/* Dragon Eyes */}
            <polygon points="44,48 54,50 50,44" fill={p.core1} />
            <polygon points="76,48 66,50 70,44" fill={p.core1} />
            <circle cx="50" cy="48" r="1.5" fill={p.eye} />
            <circle cx="70" cy="48" r="1.5" fill={p.eye} />
          </svg>
        );
      }

      case 'var_tideguard_water':
      case 'var_tideguard_fire':
      case 'var_tideguard_grass':
      case 'var_tideguard_light':
      case 'var_tideguard_dark':
      case 'var_boss_tideguard_leviathan': {
        const elem = participant.element || 'WATER';
        const tidePalettes = {
          WATER: {
            shell1: '#38bdf8', shell2: '#0284c7', shell3: '#082f49',
            core1: '#ffffff', core2: '#38bdf8', core3: '#0369a1',
            stroke: '#0369a1', aura: '#38bdf8', visor: '#67e8f9', leg: '#082f49', frame: '#0f172a', spire: '#0284c7',
          },
          FIRE: {
            shell1: '#fb923c', shell2: '#ea580c', shell3: '#7c2d12',
            core1: '#fff7ed', core2: '#f97316', core3: '#c2410c',
            stroke: '#9a3412', aura: '#f97316', visor: '#fdba74', leg: '#431407', frame: '#1c1917', spire: '#ea580c',
          },
          GRASS: {
            shell1: '#4ade80', shell2: '#16a34a', shell3: '#14532d',
            core1: '#f0fdf4', core2: '#22c55e', core3: '#15803d',
            stroke: '#166534', aura: '#4ade80', visor: '#86efac', leg: '#052e16', frame: '#064e3b', spire: '#16a34a',
          },
          LIGHT: {
            shell1: '#fde047', shell2: '#ca8a04', shell3: '#713f12',
            core1: '#ffffff', core2: '#eab308', core3: '#a16207',
            stroke: '#854d0e', aura: '#facc15', visor: '#fef08a', leg: '#422006', frame: '#292524', spire: '#ca8a04',
          },
          DARK: {
            shell1: '#c084fc', shell2: '#9333ea', shell3: '#3b0764',
            core1: '#faf5ff', core2: '#a855f7', core3: '#6b21a8',
            stroke: '#581c87', aura: '#c084fc', visor: '#d8b4fe', leg: '#1e1b4b', frame: '#0f172a', spire: '#9333ea',
          },
        };
        const p = tidePalettes[elem] || tidePalettes.WATER;

        return (
          <svg viewBox="0 0 120 140" className="w-24 h-28 sm:w-28 sm:h-32 drop-shadow-2xl">
            <defs>
              <linearGradient id={`tideShell_${elem}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={p.shell1} />
                <stop offset="40%" stopColor={p.shell2} />
                <stop offset="100%" stopColor={p.shell3} />
              </linearGradient>
              <radialGradient id={`abyssalPearl_${elem}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={p.core1} />
                <stop offset="50%" stopColor={p.core2} />
                <stop offset="100%" stopColor={p.core3} />
              </radialGradient>
            </defs>
            {/* Awakened Rings */}
            {isAwakened && (
              <g opacity="0.85">
                <circle cx="60" cy="70" r="54" fill="none" stroke={p.aura} strokeWidth="2" strokeDasharray="5 3" />
                <circle cx="60" cy="70" r="48" fill="none" stroke={p.visor} strokeWidth="1" opacity="0.6" />
              </g>
            )}
            {/* Living Shoulder Spires */}
            <path d="M30 42 L16 18 L38 34 Z" fill={p.spire} stroke={p.leg} strokeWidth="1" />
            <path d="M90 42 L104 18 L82 34 Z" fill={p.spire} stroke={p.leg} strokeWidth="1" />
            {/* Heavy Nautilus Shell Shield Body */}
            <path
              d="M25 50 Q60 16 95 50 Q104 96 60 114 Q16 96 25 50 Z"
              fill={`url(#tideShell_${elem})`}
              stroke={p.stroke}
              strokeWidth="2.5"
            />
            {/* Armored Carapace Breastplate */}
            <path
              d="M38 58 Q60 46 82 58 Q88 88 60 102 Q32 88 38 58 Z"
              fill={p.frame}
              stroke={p.shell1}
              strokeWidth="2"
            />
            {/* Abyssal Pearl Reactor */}
            <circle cx="60" cy="72" r="12" fill={`url(#abyssalPearl_${elem})`} />
            <circle cx="60" cy="72" r="16" fill="none" stroke={p.visor} strokeWidth="1.5" strokeDasharray="4 2" />
            {/* Glowing Visor Slit */}
            <line x1="46" y1="60" x2="74" y2="60" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="60" x2="70" y2="60" stroke={p.visor} strokeWidth="5" strokeLinecap="round" opacity="0.8" />
            {/* Armored Golem Legs */}
            <rect x="38" y="108" width="16" height="20" rx="4" fill={p.leg} stroke={p.stroke} strokeWidth="1.5" />
            <rect x="66" y="108" width="16" height="20" rx="4" fill={p.leg} stroke={p.stroke} strokeWidth="1.5" />
          </svg>
        );
      }

      case 'var_floraweaver_grass':
        return (
          <svg viewBox="0 0 120 140" className="w-24 h-28 sm:w-28 sm:h-32 drop-shadow-2xl">
            <defs>
              <linearGradient id="floraBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#86efac" />
                <stop offset="40%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#14532d" />
              </linearGradient>
              <linearGradient id="petalWing" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#db2777" />
              </linearGradient>
            </defs>
            {/* Awakened Floral Corona */}
            {isAwakened && (
              <g opacity="0.9">
                <circle cx="60" cy="70" r="54" fill="none" stroke="#86efac" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="60" cy="16" r="4" fill="#f472b6" />
                <circle cx="106" cy="70" r="4" fill="#f472b6" />
                <circle cx="14" cy="70" r="4" fill="#f472b6" />
              </g>
            )}
            {/* Blooming Iridescent Petal Wings */}
            <path d="M58 58 Q14 26 18 68 Q34 88 58 70 Z" fill="url(#petalWing)" opacity="0.85" />
            <path d="M62 58 Q106 26 102 68 Q86 88 62 70 Z" fill="url(#petalWing)" opacity="0.85" />
            {/* Slender Sylph Dryad Body */}
            <path
              d="M52 38 Q60 22 68 38 L72 96 Q60 106 48 96 Z"
              fill="url(#floraBody)"
              stroke="#14532d"
              strokeWidth="2"
            />
            {/* Lotus Blossom Crown */}
            <circle cx="60" cy="30" r="7" fill="#fef08a" />
            <circle cx="50" cy="24" r="5" fill="#f472b6" />
            <circle cx="70" cy="24" r="5" fill="#f472b6" />
            <circle cx="60" cy="18" r="4.5" fill="#fb7185" />
            {/* Glowing Fae Eyes */}
            <ellipse cx="54" cy="46" rx="2.5" ry="2" fill="#ffffff" />
            <ellipse cx="66" cy="46" rx="2.5" ry="2" fill="#ffffff" />
            <circle cx="54" cy="46" r="1.2" fill="#10b981" />
            <circle cx="66" cy="46" r="1.2" fill="#10b981" />
            {/* Floating Vine Tendrils */}
            <path d="M48 96 Q38 116 44 126" stroke="#15803d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M72 96 Q82 116 76 126" stroke="#15803d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        );

      case 'var_luminary_light':
        return (
          <svg viewBox="0 0 120 140" className="w-24 h-28 sm:w-28 sm:h-32 drop-shadow-2xl">
            <defs>
              <linearGradient id="lumiCore" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            {/* Rotating Celestial Rays */}
            <g opacity="0.6">
              <line x1="60" y1="6" x2="60" y2="134" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="6" y1="70" x2="114" y2="70" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="20" y1="20" x2="100" y2="120" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="20" y1="120" x2="100" y2="20" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 4" />
            </g>
            {/* Feathered Archangel Wings */}
            <path d="M58 65 Q14 18 10 55 Q32 80 58 70 Z" fill="#fef08a" stroke="#f59e0b" strokeWidth="2" />
            <path d="M62 65 Q106 18 110 55 Q88 80 62 70 Z" fill="#fef08a" stroke="#f59e0b" strokeWidth="2" />
            <path d="M58 62 Q28 32 30 56 Q42 72 58 66 Z" fill="#ffffff" opacity="0.9" />
            <path d="M62 62 Q92 32 90 56 Q78 72 62 66 Z" fill="#ffffff" opacity="0.9" />
            {/* Solar Core Astrolabe */}
            <circle cx="60" cy="68" r="18" fill="url(#lumiCore)" stroke="#b45309" strokeWidth="2" />
            <circle cx="60" cy="68" r="24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 3" />
            {/* Prismatic Diamond Star */}
            <polygon points="60,36 66,60 90,68 66,76 60,100 54,76 30,68 54,60" fill="#ffffff" />
            <circle cx="60" cy="68" r="5" fill="#fbbf24" />
            {/* Awakened Seraph Halo */}
            {isAwakened && (
              <g>
                <circle cx="60" cy="24" r="10" fill="none" stroke="#fef08a" strokeWidth="2.5" />
                <circle cx="60" cy="24" r="4" fill="#ffffff" />
              </g>
            )}
          </svg>
        );

      case 'var_shadowstalker_dark':
      default:
        return (
          <svg viewBox="0 0 120 140" className="w-24 h-28 sm:w-28 sm:h-32 drop-shadow-2xl">
            <defs>
              <linearGradient id="voidBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e9d5ff" />
                <stop offset="35%" stopColor="#a855f7" />
                <stop offset="70%" stopColor="#581c87" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </linearGradient>
            </defs>
            {/* Awakened Void Seal */}
            {isAwakened && (
              <g opacity="0.85">
                <circle cx="60" cy="70" r="54" fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="6 4" />
                <polygon points="60,8 65,20 55,20" fill="#f43f5e" />
                <polygon points="60,132 65,120 55,120" fill="#f43f5e" />
              </g>
            )}
            {/* Spectral Void Claws / Wings */}
            <path d="M20 45 Q8 22 36 30 Q30 58 42 66 Z" fill="#3b0764" stroke="#7e22ce" strokeWidth="1.5" />
            <path d="M100 45 Q112 22 84 30 Q90 58 78 66 Z" fill="#3b0764" stroke="#7e22ce" strokeWidth="1.5" />
            {/* Sleek Panther Silhouette */}
            <path
              d="M38 95 L32 46 L46 56 L60 42 L74 56 L88 46 L82 95 Q60 112 38 95 Z"
              fill="url(#voidBody)"
              stroke="#3b0764"
              strokeWidth="2.5"
            />
            {/* Abyssal Horns */}
            <path d="M34 46 L24 18 L44 38 Z" fill="#7e22ce" />
            <path d="M86 46 L96 18 L76 38 Z" fill="#7e22ce" />
            {/* Forehead Blood Rune */}
            <polygon points="60,42 65,52 55,52" fill="#f43f5e" />
            {/* Predatory Crimson Eyes */}
            <ellipse cx="48" cy="62" rx="5" ry="3" fill="#f43f5e" />
            <ellipse cx="72" cy="62" rx="5" ry="3" fill="#f43f5e" />
            <circle cx="48" cy="62" r="1.8" fill="#fef08a" />
            <circle cx="72" cy="62" r="1.8" fill="#fef08a" />
            {/* Razor Fangs */}
            <polygon points="52,76 56,84 58,76" fill="#ffffff" />
            <polygon points="68,76 64,84 62,76" fill="#ffffff" />
            {/* Hind Legs & Void Tail */}
            <path d="M78 95 Q105 105 100 80 Q96 68 104 60" stroke="#c084fc" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="104" cy="60" r="3" fill="#f43f5e" />
          </svg>
        );
    }
  };

  return (
    <div
      onClick={participant.isAlive ? onClick : undefined}
      className={`relative flex flex-col items-center justify-end transition-all duration-300 select-none group cursor-pointer ${lungeClass} ${flinchClass} ${
        !participant.isAlive
          ? 'pointer-events-none translate-y-2'
          : isActing
          ? 'scale-110 -translate-y-3 z-20'
          : isTargeted
          ? 'scale-105 -translate-y-1 z-10'
          : 'hover:scale-105'
      }`}
    >
      {/* 1. Targeting Bouncing Reticle */}
      {isTargeted && participant.isAlive && (
        <div className="absolute -top-7 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black text-[9px] px-3 py-0.5 rounded-full shadow-2xl animate-bounce flex items-center gap-1 z-30 ring-2 ring-white/60">
          <Swords className="w-3 h-3" />
          <span>TARGET</span>
        </div>
      )}

      {/* 2. Active Casting Tag */}
      {isActing && participant.isAlive && (
        <div
          className={`absolute -top-7 ${
            isPlayer
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 ring-cyan-300'
              : 'bg-gradient-to-r from-rose-600 to-rose-500 ring-rose-300'
          } text-white font-black text-[9px] px-3 py-0.5 rounded-full shadow-2xl animate-pulse z-30 ring-2 flex items-center gap-1`}
        >
          <Zap className="w-3 h-3 fill-current" />
          <span>CASTING</span>
        </div>
      )}

      {/* 3. Elemental Affinity Indicator */}
      {affinityTag && isTargeted && participant.isAlive && (
        <div className="absolute -top-12 z-30">
          {affinityTag === 'ADVANTAGE' ? (
            <span className="text-[9px] font-black text-emerald-300 bg-emerald-950/90 border border-emerald-500 px-2 py-0.5 rounded-full shadow-md">
              ▲ +25% ADVANTAGE
            </span>
          ) : (
            <span className="text-[9px] font-black text-rose-300 bg-rose-950/90 border border-rose-500 px-2 py-0.5 rounded-full shadow-md">
              ▼ -15% DISADVANTAGE
            </span>
          )}
        </div>
      )}

      {/* 4. Full Creature Model with Breathing Idle */}
      <div
        className="relative mb-0.5 animate-monster-breathe flex items-center justify-center bg-transparent"
        style={{ backgroundColor: 'transparent', backgroundImage: 'none' }}
      >
        {displaySpriteUrl && !hasSpriteError ? (
          <img
            src={displaySpriteUrl}
            alt={participant.name}
            referrerPolicy="no-referrer"
            onError={() => setHasSpriteError(true)}
            className={`w-24 h-28 sm:w-28 sm:h-32 object-contain drop-shadow-2xl pointer-events-none select-none ${TRANSPARENT_SPRITE_CLASSNAME}`}
            style={{
              ...TRANSPARENT_SPRITE_STYLE,
              transform: !isPlayer ? 'scaleX(-1)' : undefined,
            }}
          />
        ) : (
          renderCreatureArt()
        )}

        {/* Casting Aura Flare */}
        {isActing && (
          <div
            className="absolute inset-0 rounded-full blur-xl pointer-events-none opacity-40"
            style={{ backgroundColor: elementVisual.colorHex }}
          />
        )}

        {/* Defeated Skull Overlay */}
        {!participant.isAlive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-slate-950/80 border-2 border-rose-600 flex items-center justify-center shadow-2xl">
              <Skull className="w-7 h-7 text-rose-500" />
            </div>
          </div>
        )}
      </div>

      {/* 5. 3D Runic Ground Pedestal */}
      <div
        className={`w-20 sm:w-24 h-5 rounded-full border shadow-xl flex items-center justify-center -mt-2 mb-1 pointer-events-none animate-pedestal ${
          isPlayer
            ? 'border-cyan-400/50 bg-cyan-950/40 shadow-cyan-500/30'
            : 'border-rose-500/50 bg-rose-950/40 shadow-rose-500/30'
        }`}
      >
        <div
          className={`w-14 h-2.5 rounded-full border ${
            isPlayer ? 'border-cyan-300/40' : 'border-rose-400/40'
          }`}
        />
      </div>

      {/* 6. Floating Status & Gauges Plate */}
      <div className="w-full max-w-[136px] bg-slate-950/95 border border-slate-800/90 rounded-xl p-1.5 shadow-2xl backdrop-blur-md text-center ring-1 ring-white/10">
        {/* Name & Element Crest */}
        <div className="flex items-center justify-center gap-1 text-[10px] font-black text-slate-100 truncate">
          <span
            className="w-2 h-2 rounded-full shadow-sm flex-shrink-0"
            style={{ backgroundColor: elementVisual.colorHex }}
          />
          <span className="truncate">{participant.name}</span>
        </div>

        {/* HP Bar */}
        <div className="mt-1 relative h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              isPlayer
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                : 'bg-gradient-to-r from-rose-600 to-rose-500'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
          {shield > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-cyan-300/90 border-r border-white shadow-sm"
              style={{ width: `${shieldPercent}%` }}
              title={`Shield: ${shield}`}
            />
          )}
        </div>

        {/* Turn Meter Bar */}
        <div className="mt-1 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
          <div
            className={`h-full transition-all duration-200 ${
              tmPercent >= 100
                ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 animate-pulse'
                : 'bg-gradient-to-r from-blue-600 to-cyan-400'
            }`}
            style={{ width: `${tmPercent}%` }}
          />
        </div>

        {/* Status Effects Icons Row */}
        {participant.activeEffects.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-1 overflow-x-auto scrollbar-none pt-0.5">
            {participant.activeEffects.map((eff, i) => (
              <BuffDebuffIcon key={eff.id || `${eff.type}_${i}`} effect={eff} size="xs" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
