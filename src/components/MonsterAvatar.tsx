/**
 * Monster Avatar & Illustration Renderer
 * Provides high-fidelity original fantasy monster character illustrations
 * with rich multi-tier SVG gradients, elemental VFX, awakened crests, and dynamic lighting.
 * Automatically adapts silhouette to family and elemental palette to the monster's element.
 */

import React, { useState, useEffect } from 'react';
import { AwakeningStage, ElementType, MonsterVariant, Rarity } from '../types';
import { ELEMENT_VISUALS } from '../data/elements';
import { portraitRegistry } from '../services/character2d/portraitRegistry';

interface MonsterAvatarProps {
  variantId?: string;
  element?: ElementType;
  variant?: MonsterVariant | null;
  rarity?: Rarity;
  awakeningStage?: AwakeningStage;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showAwakenedGlow?: boolean;
  className?: string;
}

export const MonsterAvatar: React.FC<MonsterAvatarProps> = ({
  variantId: propVariantId,
  element: propElement,
  variant,
  awakeningStage = 'BASE',
  size = 'md',
  className = '',
}) => {
  const variantId = (propVariantId || variant?.variantId || '').toLowerCase();
  const element: ElementType = propElement || variant?.element || 'FIRE';
  const isAwakened = awakeningStage !== 'BASE';
  const elementVisual = ELEMENT_VISUALS[element] || ELEMENT_VISUALS.FIRE;

  const [customPortrait, setCustomPortrait] = useState<string | null>(() =>
    portraitRegistry.getPortraitUrl(variantId, element)
  );
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    setImageError(false);
    const update = () => {
      const url = portraitRegistry.getPortraitUrl(variantId, element);
      setCustomPortrait(url);
      if (url) {
        setImageError(false);
      }
    };
    update();
    const unsubscribe = portraitRegistry.subscribe(update);
    return () => unsubscribe();
  }, [variantId, element]);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-36 h-36',
  }[size];

  const elementColors: Record<ElementType, { main: string; mid: string; dark: string; core: string; glow: string; eye: string }> = {
    FIRE: { main: '#f97316', mid: '#ea580c', dark: '#7f1d1d', core: '#fef08a', glow: '#f97316', eye: '#fef08a' },
    WATER: { main: '#38bdf8', mid: '#0284c7', dark: '#082f49', core: '#a5f3fc', glow: '#06b6d4', eye: '#67e8f9' },
    GRASS: { main: '#4ade80', mid: '#16a34a', dark: '#14532d', core: '#bbf7d0', glow: '#22c55e', eye: '#facc15' },
    LIGHT: { main: '#fde047', mid: '#eab308', dark: '#713f12', core: '#ffffff', glow: '#fef08a', eye: '#ffffff' },
    DARK: { main: '#c084fc', mid: '#7e22ce', dark: '#2e1065', core: '#f43f5e', glow: '#a855f7', eye: '#f43f5e' },
  };

  const palette = elementColors[element] || elementColors.FIRE;
  const uid = `${variantId}_${element}_${size}`;

  const isBoss =
    variantId.includes('boss') ||
    variantId.startsWith('var_boss_') ||
    variantId === 'var_boss_pyrosaur_ignis' ||
    variantId === 'var_boss_tideguard_leviathan' ||
    variantId === 'var_boss_floraweaver_yggdrasil' ||
    variantId === 'var_boss_luminary_archon' ||
    variantId === 'var_boss_shadowstalker_void';

  const renderIllustration = () => {
    const isIgnisBoss = variantId === 'var_boss_pyrosaur_ignis';
    const isLeviathanBoss = variantId === 'var_boss_tideguard_leviathan';
    const isYggdrasilBoss = variantId === 'var_boss_floraweaver_yggdrasil';
    const isSolarArchonBoss = variantId === 'var_boss_luminary_archon';
    const isVoidBoss = variantId === 'var_boss_shadowstalker_void';

    // =========================================================================
    // 1. BESPOKE BOSS ILLUSTRATION: IGNIS SOVEREIGN (Chapter 1-10 Fire Boss)
    // =========================================================================
    if (isIgnisBoss) {
      return (
        <g>
          <defs>
            <radialGradient id={`calderaBg_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#b91c1c" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#450a0a" stopOpacity="0.1" />
            </radialGradient>
            <linearGradient id={`ignisCrownGrad_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="35%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>
            <linearGradient id={`obsidianBody_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="50%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
          </defs>

          {/* Caldera Flare Background */}
          <circle cx="50" cy="50" r="44" fill={`url(#calderaBg_${uid})`} />

          {/* Magma Embers */}
          <circle cx="20" cy="25" r="1.5" fill="#fef08a" opacity="0.8" />
          <circle cx="80" cy="22" r="2" fill="#f97316" opacity="0.8" />
          <circle cx="15" cy="65" r="1.5" fill="#ef4444" opacity="0.7" />
          <circle cx="85" cy="68" r="1.8" fill="#facc15" opacity="0.9" />

          {/* Shoulder Volcanic Chimneys */}
          <polygon points="18,48 24,32 32,36 28,54" fill="#18181b" stroke="#7f1d1d" strokeWidth="1" />
          <polygon points="82,48 76,32 68,36 72,54" fill="#18181b" stroke="#7f1d1d" strokeWidth="1" />
          <ellipse cx="23" cy="33" rx="4" ry="2" fill="#f97316" />
          <ellipse cx="77" cy="33" rx="4" ry="2" fill="#f97316" />

          {/* Giant Curved Obsidian Horns */}
          <path d="M26 36 Q10 20 18 8 Q24 22 34 28 Z" fill="#09090b" stroke="#f97316" strokeWidth="1" />
          <path d="M74 36 Q90 20 82 8 Q76 22 66 28 Z" fill="#09090b" stroke="#f97316" strokeWidth="1" />

          {/* 5-Spike Spiked Obsidian Caldera Crown */}
          <polygon
            points="32,24 36,12 42,20 50,4 58,20 64,12 68,24"
            fill={`url(#ignisCrownGrad_${uid})`}
            stroke="#fbbf24"
            strokeWidth="1.2"
          />

          {/* Draconic Sovereign Head */}
          <path
            d="M30 68 L22 45 L32 38 L50 25 L68 38 L78 45 L70 68 Q50 82 30 68 Z"
            fill={`url(#obsidianBody_${uid})`}
            stroke="#b91c1c"
            strokeWidth="1.5"
          />

          {/* Magma Fissure Lines on Face */}
          <path d="M50 26 L50 48 M42 42 L50 48 L58 42 M50 48 L46 64 M50 48 L54 64" stroke="#f97316" strokeWidth="1.4" strokeLinecap="round" />

          {/* Piercing Magma Eyes */}
          <polygon points="34,44 44,41 42,47" fill="#fef08a" stroke="#ef4444" strokeWidth="0.8" />
          <polygon points="66,44 56,41 58,47" fill="#fef08a" stroke="#ef4444" strokeWidth="0.8" />
          <circle cx="39" cy="44" r="1.2" fill="#ffffff" />
          <circle cx="61" cy="44" r="1.2" fill="#ffffff" />

          {/* Molten Chest Caldera Core */}
          <polygon points="50,68 56,76 50,84 44,76" fill="#fef08a" stroke="#ea580c" strokeWidth="1.2" />

          {/* Orbiting Magma Comets */}
          <circle cx="16" cy="44" r="2.8" fill="#f97316" stroke="#fef08a" strokeWidth="0.8" />
          <circle cx="84" cy="42" r="2.8" fill="#f97316" stroke="#fef08a" strokeWidth="0.8" />
          <circle cx="50" cy="90" r="3" fill="#ef4444" stroke="#fbbf24" strokeWidth="0.8" />
        </g>
      );
    }

    // =========================================================================
    // 2. BESPOKE BOSS ILLUSTRATION: LEVIATHAN SOVEREIGN (Chapter 2-10 Water Boss)
    // =========================================================================
    if (isLeviathanBoss) {
      return (
        <g>
          <defs>
            <radialGradient id={`abyssBg_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.9" />
              <stop offset="65%" stopColor="#082f49" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#021526" stopOpacity="0.2" />
            </radialGradient>
            <linearGradient id={`coralGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="45%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#082f49" />
            </linearGradient>
            <radialGradient id={`pearlCore_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#0284c7" />
            </radialGradient>
          </defs>

          {/* Deep Abyss Background */}
          <circle cx="50" cy="50" r="44" fill={`url(#abyssBg_${uid})`} />

          {/* Hydro Whirlpool Rings */}
          <ellipse cx="50" cy="50" rx="42" ry="18" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" transform="rotate(-20 50 50)" />
          <ellipse cx="50" cy="50" rx="40" ry="16" fill="none" stroke="#06b6d4" strokeWidth="1.2" strokeDasharray="4 6" opacity="0.6" transform="rotate(25 50 50)" />

          {/* Massive Nautilus Coral Shell Pauldrons */}
          <circle cx="18" cy="50" r="12" fill="#082f49" stroke="#38bdf8" strokeWidth="1.8" />
          <circle cx="18" cy="50" r="7" fill="none" stroke="#67e8f9" strokeWidth="1" />
          <circle cx="82" cy="50" r="12" fill="#082f49" stroke="#38bdf8" strokeWidth="1.8" />
          <circle cx="82" cy="50" r="7" fill="none" stroke="#67e8f9" strokeWidth="1" />

          {/* Oceanic Coral Trident Horns on Head */}
          <polygon points="46,26 50,6 54,26" fill="#67e8f9" stroke="#0284c7" strokeWidth="1" />
          <polygon points="34,28 28,12 38,24" fill="#38bdf8" stroke="#082f49" strokeWidth="1" />
          <polygon points="66,28 72,12 62,24" fill="#38bdf8" stroke="#082f49" strokeWidth="1" />

          {/* Heavy Leviathan Head Plate */}
          <path
            d="M32 68 L24 46 L34 38 L50 26 L66 38 L76 46 L68 68 Q50 82 32 68 Z"
            fill={`url(#coralGrad_${uid})`}
            stroke="#082f49"
            strokeWidth="1.8"
          />

          {/* Bioluminescent Glyphs */}
          <path d="M42 38 L50 44 L58 38 M50 44 L50 62" stroke="#67e8f9" strokeWidth="1.6" strokeLinecap="round" />

          {/* Luminous Aquamarine Eyes */}
          <ellipse cx="38" cy="48" rx="4.5" ry="2.8" fill="#a5f3fc" stroke="#0369a1" strokeWidth="1" />
          <ellipse cx="62" cy="48" rx="4.5" ry="2.8" fill="#a5f3fc" stroke="#0369a1" strokeWidth="1" />
          <circle cx="38" cy="48" r="1.5" fill="#ffffff" />
          <circle cx="62" cy="48" r="1.5" fill="#ffffff" />

          {/* Central Abyssal Pearl Heart */}
          <circle cx="50" cy="72" r="6" fill={`url(#pearlCore_${uid})`} stroke="#ffffff" strokeWidth="1" />
        </g>
      );
    }

    // =========================================================================
    // 3. BESPOKE BOSS ILLUSTRATION: YGGDRASIL ANCIENT (Chapter 3-10 Grass Boss)
    // =========================================================================
    if (isYggdrasilBoss) {
      return (
        <g>
          <defs>
            <radialGradient id={`sylvanBg_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.9" />
              <stop offset="65%" stopColor="#14532d" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#052e16" stopOpacity="0.2" />
            </radialGradient>
            <linearGradient id={`barkGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#573f27" />
              <stop offset="50%" stopColor="#3d2a17" />
              <stop offset="100%" stopColor="#22170d" />
            </linearGradient>
            <radialGradient id={`leylineCore_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#15803d" />
            </radialGradient>
          </defs>

          {/* Sylvan Leyline Aura Background */}
          <circle cx="50" cy="50" r="44" fill={`url(#sylvanBg_${uid})`} />

          {/* Sacred Celtic Leyline Halo Ring */}
          <circle cx="50" cy="46" r="38" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="8 4" opacity="0.85" />
          <circle cx="50" cy="46" r="34" fill="none" stroke="#4ade80" strokeWidth="1.2" opacity="0.6" />

          {/* Spreading World-Tree Antlers with Golden Blossoms */}
          <path d="M38 28 Q24 14 14 18 Q22 10 32 20 M22 13 Q10 4 6 12 Q14 2 24 10" stroke="#573f27" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M62 28 Q76 14 86 18 Q78 10 68 20 M78 13 Q90 4 94 12 Q86 2 76 10" stroke="#573f27" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Antler Blossoms */}
          <circle cx="14" cy="18" r="2.5" fill="#facc15" stroke="#16a34a" strokeWidth="0.8" />
          <circle cx="6" cy="12" r="2.5" fill="#4ade80" stroke="#facc15" strokeWidth="0.8" />
          <circle cx="86" cy="18" r="2.5" fill="#facc15" stroke="#16a34a" strokeWidth="0.8" />
          <circle cx="94" cy="12" r="2.5" fill="#4ade80" stroke="#facc15" strokeWidth="0.8" />

          {/* Ancient Ironwood Face and Bark Crown */}
          <path
            d="M32 68 L24 46 L34 36 L50 26 L66 36 L76 46 L68 68 Q50 82 32 68 Z"
            fill={`url(#barkGrad_${uid})`}
            stroke="#16a34a"
            strokeWidth="1.6"
          />

          {/* Moss & Leaf Crest */}
          <path d="M42 26 Q50 18 58 26 Q50 32 42 26 Z" fill="#22c55e" stroke="#facc15" strokeWidth="1" />

          {/* Emerald Leyline Veins */}
          <path d="M50 34 L50 52 M40 46 L50 52 L60 46 M50 52 L45 66 M50 52 L55 66" stroke="#4ade80" strokeWidth="1.4" strokeLinecap="round" />

          {/* Ancient Glowing Emerald Eyes */}
          <circle cx="38" cy="46" r="3.2" fill="#facc15" />
          <circle cx="62" cy="46" r="3.2" fill="#facc15" />
          <circle cx="38" cy="46" r="1.5" fill="#ffffff" />
          <circle cx="62" cy="46" r="1.5" fill="#ffffff" />

          {/* Primordial Leyline Heart Sigil */}
          <polygon points="50,66 57,75 50,84 43,75" fill={`url(#leylineCore_${uid})`} stroke="#facc15" strokeWidth="1.2" />

          {/* Floating Spore Wisps */}
          <circle cx="22" cy="62" r="2" fill="#bbf7d0" opacity="0.9" />
          <circle cx="78" cy="62" r="2" fill="#bbf7d0" opacity="0.9" />
          <circle cx="50" cy="10" r="2.2" fill="#facc15" opacity="0.9" />
        </g>
      );
    }

    // =========================================================================
    // 4. BESPOKE BOSS ILLUSTRATION: SOLAR ARCHON (Chapter 4-10 Light Boss)
    // =========================================================================
    if (isSolarArchonBoss) {
      return (
        <g>
          <defs>
            <radialGradient id={`solarBg_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
              <stop offset="50%" stopColor="#eab308" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#713f12" stopOpacity="0.2" />
            </radialGradient>
            <linearGradient id={`goldArmor_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
            <radialGradient id={`dawnCore_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#eab308" />
            </radialGradient>
          </defs>

          {/* Solar Coronal Background */}
          <circle cx="50" cy="50" r="44" fill={`url(#solarBg_${uid})`} />

          {/* Triple Concentric Solar Halo Rings with 12 Sunburst Rays */}
          <circle cx="50" cy="50" r="40" fill="none" stroke="#fef08a" strokeWidth="2" opacity="0.9" />
          <circle cx="50" cy="50" r="34" fill="none" stroke="#ca8a04" strokeWidth="1.2" strokeDasharray="5 3" />
          <circle cx="50" cy="50" r="28" fill="none" stroke="#fef08a" strokeWidth="1" strokeDasharray="2 4" />

          {/* 8 Radiant Solar Ray Spikes */}
          <polygon points="50,4 52,10 48,10" fill="#ffffff" />
          <polygon points="96,50 90,52 90,48" fill="#ffffff" />
          <polygon points="50,96 52,90 48,90" fill="#ffffff" />
          <polygon points="4,50 10,52 10,48" fill="#ffffff" />
          <polygon points="82,18 78,24 74,20" fill="#fef08a" />
          <polygon points="18,18 22,24 26,20" fill="#fef08a" />
          <polygon points="82,82 78,76 74,80" fill="#fef08a" />
          <polygon points="18,82 22,76 26,80" fill="#fef08a" />

          {/* Hexa-Wing Golden Plumes */}
          <path d="M22 45 Q8 30 12 18 Q20 28 26 40" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
          <path d="M78 45 Q92 30 88 18 Q80 28 74 40" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />

          {/* Celestial Mask & Crown */}
          <polygon points="36,24 42,12 50,6 58,12 64,24" fill="#ffffff" stroke="#eab308" strokeWidth="1.5" />

          <path
            d="M32 68 L24 46 L34 36 L50 26 L66 36 L76 46 L68 68 Q50 82 32 68 Z"
            fill={`url(#goldArmor_${uid})`}
            stroke="#ffffff"
            strokeWidth="1.6"
          />

          {/* Blinding Diamond Eyes */}
          <polygon points="36,44 44,40 42,46" fill="#ffffff" stroke="#ca8a04" strokeWidth="0.8" />
          <polygon points="64,44 56,40 58,46" fill="#ffffff" stroke="#ca8a04" strokeWidth="0.8" />

          {/* Coronal Heart of Dawn Core */}
          <circle cx="50" cy="72" r="7" fill={`url(#dawnCore_${uid})`} stroke="#ffffff" strokeWidth="1.5" />
        </g>
      );
    }

    // =========================================================================
    // 5. BESPOKE BOSS ILLUSTRATION: VOID SOVEREIGN (Chapter 5-10 Dark Boss)
    // =========================================================================
    if (isVoidBoss) {
      return (
        <g>
          <defs>
            <radialGradient id={`eventHorizon_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0f0a1e" stopOpacity="1" />
              <stop offset="45%" stopColor="#581c87" stopOpacity="0.9" />
              <stop offset="85%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.2" />
            </radialGradient>
            <linearGradient id={`voidChitin_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b0764" />
              <stop offset="50%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#090514" />
            </linearGradient>
            <radialGradient id={`singularityOrb_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000000" />
              <stop offset="50%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#a855f7" />
            </radialGradient>
          </defs>

          {/* Event Horizon Accretion Disk Vortex */}
          <circle cx="50" cy="50" r="44" fill={`url(#eventHorizon_${uid})`} />
          <ellipse cx="50" cy="50" rx="42" ry="16" fill="none" stroke="#f43f5e" strokeWidth="1.8" strokeDasharray="5 3" transform="rotate(-30 50 50)" />
          <ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="#c084fc" strokeWidth="1.2" strokeDasharray="3 5" transform="rotate(35 50 50)" />

          {/* Quad Void Tail Silhouettes */}
          <path d="M22 68 Q10 60 8 46 Q16 52 24 64" fill="#0f0a1e" stroke="#f43f5e" strokeWidth="1" />
          <path d="M78 68 Q90 60 92 46 Q84 52 76 64" fill="#0f0a1e" stroke="#f43f5e" strokeWidth="1" />
          <polygon points="8,46 10,40 14,46 10,50" fill="#f43f5e" />
          <polygon points="92,46 90,40 86,46 90,50" fill="#f43f5e" />

          {/* Abyssal Dread Horns */}
          <path d="M28 34 Q14 16 20 6 Q28 18 36 28 Z" fill="#090514" stroke="#f43f5e" strokeWidth="1.2" />
          <path d="M72 34 Q86 16 80 6 Q72 18 64 28 Z" fill="#090514" stroke="#f43f5e" strokeWidth="1.2" />

          {/* Void Panther Demon Skull */}
          <path
            d="M32 68 L24 46 L36 36 L50 30 L64 36 L76 46 L68 68 Q50 82 32 68 Z"
            fill={`url(#voidChitin_${uid})`}
            stroke="#a855f7"
            strokeWidth="1.6"
          />

          {/* Sabertooth Void Fangs */}
          <polygon points="40,56 43,65 45,56" fill="#f43f5e" />
          <polygon points="60,56 57,65 55,56" fill="#f43f5e" />

          {/* Terrifying Crimson Singularity Eyes */}
          <polygon points="34,44 44,40 42,46" fill="#f43f5e" />
          <polygon points="66,44 56,40 58,46" fill="#f43f5e" />
          <circle cx="39" cy="44" r="1.4" fill="#ffffff" />
          <circle cx="61" cy="44" r="1.4" fill="#ffffff" />

          {/* Singularity Core in Chest */}
          <circle cx="50" cy="72" r="6.5" fill={`url(#singularityOrb_${uid})`} stroke="#f43f5e" strokeWidth="1.4" />
        </g>
      );
    }

    const isPyrosaur = variantId.includes('pyrosaur');
    const isTideguard = variantId.includes('tideguard');
    const isFloraweaver = variantId.includes('floraweaver');
    const isLuminary = variantId.includes('luminary');
    const isShadowstalker = variantId.includes('shadowstalker');
    const isFreeDancer = variantId.includes('freedancer');
    const isNekohime = variantId.includes('nekohime');
    const isPorky = variantId.includes('porky');
    const isFishter = variantId.includes('fishter');
    const isRockman = variantId.includes('rockman');
    const isDoggo = variantId.includes('doggo');
    const isBirdunno = variantId.includes('birdunno');

    if (isFreeDancer) {
      return (
        <g>
          <defs>
            <linearGradient id={`dancerGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.main} />
              <stop offset="50%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.dark} />
            </linearGradient>
            <radialGradient id={`dancerHalo_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={palette.glow} stopOpacity="0.8" />
              <stop offset="60%" stopColor={palette.mid} stopOpacity="0.3" />
              <stop offset="100%" stopColor={palette.dark} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Spotlight Stage Aura */}
          <circle cx="50" cy="50" r="44" fill={`url(#dancerHalo_${uid})`} />

          {/* Awakening Spotlight Ring */}
          {isAwakened && (
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={palette.glow}
              strokeWidth="2"
              strokeDasharray="6 3"
              opacity="0.9"
            />
          )}

          {/* Elegant Dancer Ballgown / Tutu swirl */}
          <path
            d="M32 64 Q50 56 68 64 Q78 82 50 86 Q22 82 32 64 Z"
            fill={`url(#dancerGrad_${uid})`}
            stroke={palette.dark}
            strokeWidth="1.2"
          />
          <path
            d="M26 72 Q50 66 74 72 Q82 88 50 90 Q18 88 26 72 Z"
            fill={palette.core}
            opacity="0.6"
          />

          {/* Torso & Bodice */}
          <path
            d="M44 48 L42 64 Q50 66 58 64 L56 48 Q50 44 44 48 Z"
            fill={`url(#dancerGrad_${uid})`}
            stroke={palette.dark}
            strokeWidth="1"
          />

          {/* Graceful Head & Updo Hairstyle */}
          <circle cx="50" cy="36" r="8" fill="#fde68a" stroke={palette.dark} strokeWidth="0.8" />
          {/* Hair Bun / Tiara */}
          <circle cx="50" cy="27" r="5" fill={palette.mid} />
          <path d="M46 25 Q50 20 54 25 Z" fill={palette.glow} />

          {/* Graceful Ballet Arms Raised */}
          <path
            d="M42 50 Q30 38 34 26"
            fill="none"
            stroke="#fde68a"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M58 50 Q70 38 66 26"
            fill="none"
            stroke="#fde68a"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Sparkling Musical / Dance Notes */}
          <circle cx="30" cy="24" r="1.8" fill={palette.glow} />
          <circle cx="70" cy="24" r="1.8" fill={palette.glow} />
          <path
            d="M48 18 Q50 14 52 18"
            stroke={palette.glow}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );
    }

    if (isNekohime) {
      return (
        <g>
          <defs>
            <linearGradient id={`nekoGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.main} />
              <stop offset="45%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.dark} />
            </linearGradient>
            <radialGradient id={`nekoHalo_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={palette.glow} stopOpacity="0.85" />
              <stop offset="60%" stopColor={palette.mid} stopOpacity="0.3" />
              <stop offset="100%" stopColor={palette.dark} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`goldBell_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>

          {/* Background Aura Glow */}
          <circle cx="50" cy="50" r="44" fill={`url(#nekoHalo_${uid})`} />

          {/* Awakened: Nine-Lives Starlight / Spirit Orbs */}
          {isAwakened && (
            <g>
              <circle cx="50" cy="50" r="47" fill="none" stroke={palette.core} strokeWidth="1.8" strokeDasharray="6 3" opacity="0.9" />
              {/* 9 celestial paw / flame spirit wisps */}
              <circle cx="50" cy="4" r="2.8" fill={palette.core} />
              <circle cx="78" cy="12" r="2.5" fill={palette.glow} />
              <circle cx="95" cy="36" r="2.5" fill={palette.glow} />
              <circle cx="92" cy="68" r="2.5" fill={palette.glow} />
              <circle cx="70" cy="92" r="2.5" fill={palette.glow} />
              <circle cx="30" cy="92" r="2.5" fill={palette.glow} />
              <circle cx="8" cy="68" r="2.5" fill={palette.glow} />
              <circle cx="5" cy="36" r="2.5" fill={palette.glow} />
              <circle cx="22" cy="12" r="2.5" fill={palette.glow} />
            </g>
          )}

          {/* Cat Ears */}
          {/* Left Cat Ear */}
          <path d="M22 36 L14 12 L38 24 Z" fill={palette.mid} stroke={palette.dark} strokeWidth="1.2" />
          <path d="M22 33 L18 16 L34 25 Z" fill="#fbcfe8" opacity="0.9" />

          {/* Right Cat Ear */}
          <path d="M78 36 L86 12 L62 24 Z" fill={palette.mid} stroke={palette.dark} strokeWidth="1.2" />
          <path d="M78 33 L82 16 L66 25 Z" fill="#fbcfe8" opacity="0.9" />

          {/* Cat Ear Twin Bells & Hair Ribbons */}
          {/* Left twin bells */}
          <circle cx="20" cy="29" r="3.6" fill={`url(#goldBell_${uid})`} stroke="#b45309" strokeWidth="0.6" />
          <circle cx="26" cy="27" r="3.6" fill={`url(#goldBell_${uid})`} stroke="#b45309" strokeWidth="0.6" />
          <circle cx="23" cy="28" r="1.5" fill="#ef4444" />
          {/* Right twin bells */}
          <circle cx="74" cy="27" r="3.6" fill={`url(#goldBell_${uid})`} stroke="#b45309" strokeWidth="0.6" />
          <circle cx="80" cy="29" r="3.6" fill={`url(#goldBell_${uid})`} stroke="#b45309" strokeWidth="0.6" />
          <circle cx="77" cy="28" r="1.5" fill="#ef4444" />

          {/* Hair back / Twin tails */}
          <path d="M20 40 Q10 56 16 76 Q26 78 26 64 Z" fill={palette.dark} opacity="0.8" />
          <path d="M80 40 Q90 56 84 76 Q74 78 74 64 Z" fill={palette.dark} opacity="0.8" />

          {/* Face Base */}
          <path
            d="M30 38 Q50 30 70 38 Q76 56 68 70 Q50 82 32 70 Q24 56 30 38 Z"
            fill="#fff1f2"
            stroke="#fecdd3"
            strokeWidth="1.2"
          />

          {/* Anime Hair Bangs */}
          <path
            d="M26 36 Q38 32 50 38 Q62 32 74 36 Q70 48 64 50 Q56 42 50 48 Q44 42 36 50 Q30 48 26 36 Z"
            fill={`url(#nekoGrad_${uid})`}
          />

          {/* Cheerful Cat Girl Eyes */}
          {/* Left Eye */}
          <ellipse cx="40" cy="52" rx="4.5" ry="5.5" fill={palette.dark} />
          <ellipse cx="40" cy="52" rx="3.5" ry="4.5" fill={palette.glow} />
          <ellipse cx="40" cy="52" rx="1.5" ry="3.5" fill="#09090b" />
          <circle cx="38.5" cy="49.5" r="1.5" fill="#ffffff" />
          <circle cx="41.5" cy="54" r="0.8" fill="#ffffff" />

          {/* Right Eye */}
          <ellipse cx="60" cy="52" rx="4.5" ry="5.5" fill={palette.dark} />
          <ellipse cx="60" cy="52" rx="3.5" ry="4.5" fill={palette.glow} />
          <ellipse cx="60" cy="52" rx="1.5" ry="3.5" fill="#09090b" />
          <circle cx="58.5" cy="49.5" r="1.5" fill="#ffffff" />
          <circle cx="61.5" cy="54" r="0.8" fill="#ffffff" />

          {/* Cute Cat Nose & Smile */}
          <polygon points="49,60 51,60 50,61.5" fill="#f43f5e" />
          <path d="M46 63 Q50 66 50 63 Q50 66 54 63" stroke="#e11d48" strokeWidth="1" fill="none" strokeLinecap="round" />

          {/* Rosy Blush */}
          <ellipse cx="32" cy="58" rx="3.5" ry="2" fill="#f43f5e" opacity="0.3" />
          <ellipse cx="68" cy="58" rx="3.5" ry="2" fill="#f43f5e" opacity="0.3" />
          {/* Awakened Feline Whiskers (3 sleek whiskers per cheek) */}
          {isAwakened && (
            <g opacity="0.85">
              <line x1="20" y1="55" x2="30" y2="56.5" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
              <line x1="19" y1="58.5" x2="30" y2="58.5" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
              <line x1="20" y1="62" x2="30" y2="60.5" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
              <line x1="80" y1="55" x2="70" y2="56.5" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
              <line x1="81" y1="58.5" x2="70" y2="58.5" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
              <line x1="80" y1="62" x2="70" y2="60.5" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
            </g>
          )}

          {/* Collar & Golden Jingle Bell */}
          <path d="M36 74 Q50 80 64 74 L62 77 Q50 83 38 77 Z" fill="#dc2626" />
          <circle cx="50" cy="79" r="4.5" fill={`url(#goldBell_${uid})`} stroke="#b45309" strokeWidth="0.8" />
          <circle cx="50" cy="80.5" r="1" fill="#78350f" />
        </g>
      );
    }

    if (isPyrosaur) {
      return (
        <g>
          <defs>
            <linearGradient id={`pyroGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.main} />
              <stop offset="45%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.dark} />
            </linearGradient>
            <linearGradient id={`lavaCore_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={palette.core} />
              <stop offset="50%" stopColor={palette.main} />
              <stop offset="100%" stopColor={palette.mid} />
            </linearGradient>
            <radialGradient id={`emberGlow_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={palette.glow} stopOpacity="0.8" />
              <stop offset="100%" stopColor={palette.dark} stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="50" cy="50" r="42" fill={`url(#emberGlow_${uid})`} />

          {isAwakened && (
            <g>
              <circle cx="50" cy="50" r="46" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 4" opacity="0.9" />
              <polygon points="50,4 53,14 47,14" fill="#fbbf24" />
              <polygon points="96,50 86,53 86,47" fill="#fbbf24" />
              <polygon points="50,96 53,86 47,86" fill="#fbbf24" />
              <polygon points="4,50 14,53 14,47" fill="#fbbf24" />
            </g>
          )}

          <path d="M26 34 L16 16 L34 26 Z" fill={palette.dark} stroke={palette.mid} strokeWidth="1" />
          <path d="M74 34 L84 16 L66 26 Z" fill={palette.dark} stroke={palette.mid} strokeWidth="1" />
          <path d="M44 22 L50 8 L56 22 Z" fill={palette.main} />

          <path
            d="M30 70 L22 46 L34 40 L45 26 L55 26 L66 40 L78 46 L70 70 Q50 82 30 70 Z"
            fill={`url(#pyroGrad_${uid})`}
            stroke={palette.dark}
            strokeWidth="1.5"
          />

          <path d="M42 36 L50 30 L58 36 L50 44 Z" fill={palette.dark} />
          <path d="M36 48 L44 42 L42 54 L34 52 Z" fill={palette.dark} />
          <path d="M64 48 L56 42 L58 54 L66 52 Z" fill={palette.dark} />

          <polygon points="40,58 50,66 60,58 50,54" fill={`url(#lavaCore_${uid})`} />
          <line x1="44" y1="57" x2="56" y2="57" stroke="#ffffff" strokeWidth="1" />

          <polygon points="36,44 44,46 41,40" fill={palette.eye} />
          <polygon points="64,44 56,46 59,40" fill={palette.eye} />
          <circle cx="41" cy="44" r="1.5" fill={palette.mid} />
          <circle cx="59" cy="44" r="1.5" fill={palette.mid} />

          <circle cx="28" cy="62" r="1.5" fill="#fbbf24" />
          <circle cx="72" cy="62" r="1.5" fill="#fbbf24" />
          <circle cx="50" cy="18" r="2" fill="#fef08a" />
        </g>
      );
    }

    if (isTideguard) {
      return (
        <g>
          <defs>
            <linearGradient id={`tideGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.main} />
              <stop offset="40%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.dark} />
            </linearGradient>
            <linearGradient id={`pearlCore_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor={palette.core} />
              <stop offset="100%" stopColor={palette.main} />
            </linearGradient>
            <radialGradient id={`oceanMist_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={palette.glow} stopOpacity="0.7" />
              <stop offset="100%" stopColor={palette.dark} stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="50" cy="50" r="42" fill={`url(#oceanMist_${uid})`} />

          {isAwakened && (
            <g>
              <circle cx="50" cy="50" r="46" fill="none" stroke="#67e8f9" strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />
              <circle cx="50" cy="8" r="3" fill="#67e8f9" />
              <circle cx="92" cy="50" r="3" fill="#67e8f9" />
              <circle cx="50" cy="92" r="3" fill="#67e8f9" />
              <circle cx="8" cy="50" r="3" fill="#67e8f9" />
            </g>
          )}

          <path d="M14 46 Q16 28 32 30 Q28 48 18 56 Z" fill={palette.mid} stroke={palette.dark} strokeWidth="1" />
          <path d="M86 46 Q84 28 68 30 Q72 48 82 56 Z" fill={palette.mid} stroke={palette.dark} strokeWidth="1" />

          <path
            d="M32 36 Q50 20 68 36 Q78 56 68 76 Q50 86 32 76 Q22 56 32 36 Z"
            fill={`url(#tideGrad_${uid})`}
            stroke={palette.dark}
            strokeWidth="1.5"
          />

          <path d="M50 24 L50 48" stroke={palette.main} strokeWidth="2" strokeLinecap="round" />
          <path d="M38 42 Q50 46 62 42" stroke={palette.dark} strokeWidth="2" fill="none" />
          <path d="M36 56 Q50 60 64 56" stroke={palette.dark} strokeWidth="2" fill="none" />
          <path d="M40 70 Q50 72 60 70" stroke={palette.dark} strokeWidth="1.5" fill="none" />

          <polygon points="40,48 50,44 60,48 50,52" fill={palette.dark} />
          <circle cx="50" cy="48" r="3.5" fill={`url(#pearlCore_${uid})`} />
          <circle cx="50" cy="48" r="1.5" fill={palette.eye} />

          <circle cx="28" cy="30" r="2.5" fill="#e0f2fe" opacity="0.6" />
          <circle cx="74" cy="28" r="2" fill="#e0f2fe" opacity="0.7" />
          <circle cx="68" cy="74" r="1.5" fill="#e0f2fe" opacity="0.5" />
        </g>
      );
    }

    if (isFloraweaver) {
      return (
        <g>
          <defs>
            <linearGradient id={`floraGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.main} />
              <stop offset="45%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.dark} />
            </linearGradient>
            <radialGradient id={`pollenGlow_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={palette.glow} stopOpacity="0.8" />
              <stop offset="100%" stopColor={palette.dark} stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="50" cy="50" r="42" fill={`url(#pollenGlow_${uid})`} />

          {isAwakened && (
            <g>
              <circle cx="50" cy="50" r="45" fill="none" stroke="#fde047" strokeWidth="1.5" strokeDasharray="5 3" />
              <path d="M50 6 Q55 16 50 20 Q45 16 50 6 Z" fill="#fde047" />
              <path d="M94 50 Q84 55 80 50 Q84 45 94 50 Z" fill="#fde047" />
              <path d="M50 94 Q45 84 50 80 Q55 84 50 94 Z" fill="#fde047" />
              <path d="M6 50 Q16 45 20 50 Q16 55 6 50 Z" fill="#fde047" />
            </g>
          )}

          <path d="M30 40 C20 20 35 15 42 28 Z" fill={palette.mid} opacity="0.9" />
          <path d="M70 40 C80 20 65 15 58 28 Z" fill={palette.mid} opacity="0.9" />
          <path d="M22 60 C10 50 18 35 32 46 Z" fill={palette.dark} />
          <path d="M78 60 C90 50 82 35 68 46 Z" fill={palette.dark} />

          <path
            d="M34 68 C30 50 38 34 50 26 C62 34 70 50 66 68 C60 78 40 78 34 68 Z"
            fill={`url(#floraGrad_${uid})`}
            stroke={palette.dark}
            strokeWidth="1.5"
          />

          <polygon points="50,22 55,30 45,30" fill={palette.core} />
          <polygon points="42,27 48,33 40,34" fill={palette.main} />
          <polygon points="58,27 52,33 60,34" fill={palette.main} />

          <ellipse cx="43" cy="46" rx="3.5" ry="2.5" fill={palette.eye} />
          <ellipse cx="57" cy="46" rx="3.5" ry="2.5" fill={palette.eye} />
          <circle cx="43" cy="46" r="1.5" fill="#ffffff" />
          <circle cx="57" cy="46" r="1.5" fill="#ffffff" />

          <circle cx="39" cy="54" r="2" fill={palette.main} opacity="0.8" />
          <circle cx="61" cy="54" r="2" fill={palette.main} opacity="0.8" />

          <circle cx="26" cy="30" r="2" fill="#fef08a" />
          <circle cx="74" cy="32" r="2" fill="#fef08a" />
          <circle cx="50" cy="74" r="2.5" fill="#fef08a" />
        </g>
      );
    }

    if (isLuminary) {
      return (
        <g>
          <defs>
            <linearGradient id={`lumiGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.main} />
              <stop offset="50%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.dark} />
            </linearGradient>
            <radialGradient id={`starlightHalo_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={palette.glow} stopOpacity="0.8" />
              <stop offset="100%" stopColor={palette.dark} stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="50" cy="50" r="42" fill={`url(#starlightHalo_${uid})`} />

          {isAwakened && (
            <g>
              <circle cx="50" cy="50" r="47" fill="none" stroke="#fef08a" strokeWidth="2" opacity="0.85" />
              <polygon points="50,2 54,12 46,12" fill="#fef08a" />
              <polygon points="98,50 88,54 88,46" fill="#fef08a" />
              <polygon points="50,98 54,88 46,88" fill="#fef08a" />
              <polygon points="2,50 12,54 12,46" fill="#fef08a" />
            </g>
          )}

          <path d="M28 44 C12 30 8 16 26 22 C34 26 38 36 34 46 Z" fill={palette.main} opacity="0.9" />
          <path d="M72 44 C88 30 92 16 74 22 C66 26 62 36 66 46 Z" fill={palette.main} opacity="0.9" />
          <path d="M22 56 C6 50 12 36 28 40 Z" fill={palette.mid} />
          <path d="M78 56 C94 50 88 36 72 40 Z" fill={palette.mid} />

          <path
            d="M34 66 L30 42 L50 24 L70 42 L66 66 Q50 78 34 66 Z"
            fill={`url(#lumiGrad_${uid})`}
            stroke={palette.dark}
            strokeWidth="1.5"
          />

          <line x1="50" y1="28" x2="50" y2="66" stroke={palette.dark} strokeWidth="2" />
          <line x1="36" y1="46" x2="64" y2="46" stroke={palette.dark} strokeWidth="2" />

          <circle cx="50" cy="46" r="6" fill={palette.core} />
          <circle cx="50" cy="46" r="3" fill={palette.eye} />

          <polygon points="50,14 52,18 50,22 48,18" fill="#ffffff" />
          <polygon points="24,50 26,54 24,58 22,54" fill="#ffffff" />
          <polygon points="76,50 78,54 76,58 74,54" fill="#ffffff" />
        </g>
      );
    }

    if (isShadowstalker) {
      return (
        <g>
          <defs>
            <linearGradient id={`shadowGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.main} />
              <stop offset="50%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.dark} />
            </linearGradient>
            <radialGradient id={`voidFog_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={palette.glow} stopOpacity="0.8" />
              <stop offset="100%" stopColor={palette.dark} stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="50" cy="50" r="42" fill={`url(#voidFog_${uid})`} />

          {isAwakened && (
            <g>
              <circle cx="50" cy="50" r="46" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4" opacity="0.8" />
              <polygon points="50,5 53,13 47,13" fill="#f43f5e" />
              <polygon points="95,50 87,53 87,47" fill="#f43f5e" />
              <polygon points="50,95 53,87 47,87" fill="#f43f5e" />
              <polygon points="5,50 13,53 13,47" fill="#f43f5e" />
            </g>
          )}

          <path d="M28 34 L20 14 L36 28 Z" fill={palette.mid} />
          <path d="M72 34 L80 14 L64 28 Z" fill={palette.mid} />

          <path
            d="M32 68 L24 46 L36 38 L50 32 L64 38 L76 46 L68 68 Q50 82 32 68 Z"
            fill={`url(#shadowGrad_${uid})`}
            stroke={palette.dark}
            strokeWidth="1.5"
          />

          <path d="M42 38 L50 30 L58 38 L50 48 Z" fill={palette.dark} />
          <polygon points="50,32 54,39 46,39" fill={palette.eye} />

          <ellipse cx="39" cy="46" rx="4" ry="2.5" fill={palette.eye} />
          <ellipse cx="61" cy="46" rx="4" ry="2.5" fill={palette.eye} />
          <circle cx="39" cy="46" r="1.5" fill={palette.core} />
          <circle cx="61" cy="46" r="1.5" fill={palette.core} />

          <polygon points="43,56 46,62 48,56" fill="#ffffff" />
          <polygon points="57,56 54,62 52,56" fill="#ffffff" />

          <circle cx="24" cy="22" r="2" fill={palette.main} opacity="0.8" />
          <circle cx="76" cy="22" r="2" fill={palette.main} opacity="0.8" />
          {isAwakened && (
            <g>
              <circle cx="50" cy="12" r="2.5" fill={palette.eye} />
            </g>
          )}
        </g>
      );
    }

    // =========================================================================
    // 8. PORKY (1-Star Pig-like Monster)
    // =========================================================================
    if (isPorky) {
      return (
        <g>
          <defs>
            <linearGradient id={`porkyGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.main} />
              <stop offset="60%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.dark} />
            </linearGradient>
            <radialGradient id={`porkySnout_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={palette.core} />
              <stop offset="80%" stopColor={palette.main} />
              <stop offset="100%" stopColor={palette.mid} />
            </radialGradient>
          </defs>

          {/* Awakened Energy Aura */}
          {isAwakened && (
            <g>
              <circle cx="50" cy="50" r="46" fill="none" stroke={palette.glow} strokeWidth="2.5" strokeDasharray="6 3" opacity="0.85" />
              <polygon points="50,4 54,12 46,12" fill={palette.glow} />
              <polygon points="96,50 88,54 88,46" fill={palette.glow} />
              <polygon points="50,96 54,88 46,88" fill={palette.glow} />
              <polygon points="4,50 12,54 12,46" fill={palette.glow} />
            </g>
          )}

          {/* Floppy Pig Ears */}
          <path d="M24 38 C14 26 12 14 26 18 C32 20 34 30 30 40 Z" fill={palette.mid} stroke={palette.dark} strokeWidth="1.2" />
          <path d="M22 28 C18 22 18 16 26 18 Z" fill={palette.core} opacity="0.6" />
          <path d="M76 38 C86 26 88 14 74 18 C68 20 66 30 70 40 Z" fill={palette.mid} stroke={palette.dark} strokeWidth="1.2" />
          <path d="M78 28 C82 22 82 16 74 18 Z" fill={palette.core} opacity="0.6" />

          {/* Curled Tail Silhouettes (Peeking left) */}
          <path d="M16 66 Q10 56 16 52 Q22 48 18 60" fill="none" stroke={palette.dark} strokeWidth="2.5" strokeLinecap="round" />

          {/* Chubby Porcine Head & Body */}
          <ellipse cx="50" cy="54" rx="34" ry="30" fill={`url(#porkyGrad_${uid})`} stroke={palette.dark} strokeWidth="1.8" />

          {/* Mud / Armor Coating */}
          <path d="M26 66 Q36 78 50 78 Q64 78 74 66 Q64 72 50 72 Q36 72 26 66 Z" fill={palette.dark} opacity="0.7" />

          {/* Porky Eyes */}
          <ellipse cx="38" cy="42" rx="4" ry="4.5" fill={palette.dark} />
          <circle cx="37" cy="40.5" r="1.5" fill="#ffffff" />
          <ellipse cx="62" cy="42" rx="4" ry="4.5" fill={palette.dark} />
          <circle cx="61" cy="40.5" r="1.5" fill="#ffffff" />

          {/* Cute Eyebrows */}
          <path d="M34 35 Q38 33 42 35" fill="none" stroke={palette.dark} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M58 35 Q62 33 66 35" fill="none" stroke={palette.dark} strokeWidth="1.5" strokeLinecap="round" />

          {/* Big Stout Pig Snout */}
          <ellipse cx="50" cy="56" rx="14" ry="10" fill={`url(#porkySnout_${uid})`} stroke={palette.dark} strokeWidth="1.5" />
          {/* Nostrils */}
          <ellipse cx="45" cy="56" rx="3" ry="4" fill={palette.dark} />
          <ellipse cx="55" cy="56" rx="3" ry="4" fill={palette.dark} />

          {/* Curved Boar Tusks */}
          <path d="M36 62 Q33 52 35 48 Q39 55 40 64 Z" fill="#ffffff" stroke={palette.dark} strokeWidth="1" />
          <path d="M64 62 Q67 52 65 48 Q61 55 60 64 Z" fill="#ffffff" stroke={palette.dark} strokeWidth="1" />

          {/* Awakened Boar War Crest */}
          {isAwakened && (
            <g>
              <polygon points="50,22 55,30 45,30" fill={palette.glow} stroke={palette.dark} strokeWidth="1" />
              <polygon points="42,26 47,32 39,32" fill={palette.glow} />
              <polygon points="58,26 61,32 53,32" fill={palette.glow} />
              <circle cx="50" cy="30" r="2.5" fill="#ffffff" />
            </g>
          )}
        </g>
      );
    }

    // =========================================================================
    // 9. FISHTER (1-Star Fishman Monster)
    // =========================================================================
    if (isFishter) {
      return (
        <g>
          <defs>
            <linearGradient id={`fishterGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.main} />
              <stop offset="50%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.dark} />
            </linearGradient>
            <linearGradient id={`finGrad_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={palette.core} />
              <stop offset="100%" stopColor={palette.mid} />
            </linearGradient>
          </defs>

          {/* Awakened Ocean Vortex Ring */}
          {isAwakened && (
            <g>
              <circle cx="50" cy="50" r="46" fill="none" stroke={palette.glow} strokeWidth="2" strokeDasharray="5 3" opacity="0.9" />
              <ellipse cx="50" cy="50" rx="44" ry="18" fill="none" stroke={palette.core} strokeWidth="1.2" strokeDasharray="4 4" transform="rotate(-25 50 50)" />
            </g>
          )}

          {/* Aquatic Dorsal Crest Spine */}
          <path d="M50 10 Q52 24 50 34 Q48 24 50 10 Z" fill={`url(#finGrad_${uid})`} stroke={palette.dark} strokeWidth="1.2" />
          <path d="M46 16 L50 20 L54 16 L50 26 Z" fill={palette.core} />

          {/* Webbed Gill Frills (Left & Right) */}
          <path d="M26 50 C14 42 12 56 22 62 C16 58 18 52 28 54 Z" fill={`url(#finGrad_${uid})`} stroke={palette.dark} strokeWidth="1" />
          <path d="M74 50 C86 42 88 56 78 62 C84 58 82 52 72 54 Z" fill={`url(#finGrad_${uid})`} stroke={palette.dark} strokeWidth="1" />

          {/* Fishman Head & Torso */}
          <path
            d="M32 68 L26 48 Q34 30 50 28 Q66 30 74 48 L68 68 Q50 80 32 68 Z"
            fill={`url(#fishterGrad_${uid})`}
            stroke={palette.dark}
            strokeWidth="1.8"
          />

          {/* Lateral Line Scales Texture */}
          <path d="M34 56 Q50 62 66 56" fill="none" stroke={palette.dark} strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
          <path d="M36 62 Q50 68 64 62" fill="none" stroke={palette.dark} strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />

          {/* Sharp Fishman Eyes */}
          <polygon points="34,44 44,40 42,48" fill={palette.dark} />
          <polygon points="66,44 56,40 58,48" fill={palette.dark} />
          <ellipse cx="39" cy="44" rx="2" ry="3" fill={palette.eye} />
          <ellipse cx="61" cy="44" rx="2" ry="3" fill={palette.eye} />
          <circle cx="39" cy="43" r="0.8" fill="#ffffff" />
          <circle cx="61" cy="43" r="0.8" fill="#ffffff" />

          {/* Fish Mouth & Barbels */}
          <path d="M44 58 Q50 62 56 58" fill="none" stroke={palette.dark} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M43 60 Q40 68 38 72" fill="none" stroke={palette.mid} strokeWidth="1.5" />
          <path d="M57 60 Q60 68 62 72" fill="none" stroke={palette.mid} strokeWidth="1.5" />

          {/* Coral Trident Weapon held at side */}
          <line x1="74" y1="26" x2="74" y2="76" stroke={palette.dark} strokeWidth="2" strokeLinecap="round" />
          <path d="M68 28 L74 20 L80 28 M74 20 L74 34 M68 32 L80 32" fill="none" stroke={palette.core} strokeWidth="1.8" strokeLinecap="round" />

          {/* Awakened Deepsea Bioluminescent Lure */}
          {isAwakened && (
            <g>
              <path d="M50 14 Q50 4 60 6" fill="none" stroke={palette.glow} strokeWidth="2" />
              <circle cx="60" cy="6" r="3.5" fill={palette.core} />
              <circle cx="60" cy="6" r="1.5" fill="#ffffff" />
            </g>
          )}
        </g>
      );
    }

    // =========================================================================
    // 10. ROCKMAN (1-Star Golem Monster)
    // =========================================================================
    if (isRockman) {
      return (
        <g>
          <defs>
            <linearGradient id={`rockGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.main} />
              <stop offset="50%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.dark} />
            </linearGradient>
            <radialGradient id={`coreGlow_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor={palette.core} />
              <stop offset="100%" stopColor={palette.dark} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Awakened Orbiting Satellite Boulders */}
          {isAwakened && (
            <g>
              <circle cx="50" cy="50" r="46" fill="none" stroke={palette.glow} strokeWidth="1.5" strokeDasharray="6 4" opacity="0.8" />
              <polygon points="12,30 18,26 22,34 16,38" fill={palette.mid} stroke={palette.dark} strokeWidth="1" />
              <polygon points="88,30 82,26 78,34 84,38" fill={palette.mid} stroke={palette.dark} strokeWidth="1" />
              <polygon points="50,6 56,12 50,16 44,12" fill={palette.glow} />
            </g>
          )}

          {/* Massive Boulder Shoulders */}
          <polygon points="14,64 24,44 38,52 32,74" fill={palette.dark} stroke="#0f172a" strokeWidth="1.5" />
          <polygon points="86,64 76,44 62,52 68,74" fill={palette.dark} stroke="#0f172a" strokeWidth="1.5" />

          {/* Faceted Chiseled Golem Head */}
          <polygon
            points="32,28 50,18 68,28 72,56 50,74 28,56"
            fill={`url(#rockGrad_${uid})`}
            stroke="#0f172a"
            strokeWidth="2"
          />

          {/* Rock Plate Facets */}
          <line x1="50" y1="18" x2="50" y2="44" stroke={palette.dark} strokeWidth="1.5" />
          <line x1="32" y1="28" x2="50" y2="44" stroke={palette.dark} strokeWidth="1.5" />
          <line x1="68" y1="28" x2="50" y2="44" stroke={palette.dark} strokeWidth="1.5" />
          <line x1="28" y1="56" x2="50" y2="52" stroke={palette.dark} strokeWidth="1.5" />
          <line x1="72" y1="56" x2="50" y2="52" stroke={palette.dark} strokeWidth="1.5" />

          {/* Glowing Elemental Cracks */}
          <path d="M42 48 L46 54 L44 60 L50 64" fill="none" stroke={palette.core} strokeWidth="1.8" />
          <path d="M58 48 L54 54 L56 60 L50 64" fill="none" stroke={palette.core} strokeWidth="1.8" />

          {/* Luminous Crystalline Eyes (Set into deep stone sockets) */}
          <polygon points="36,40 44,38 42,46" fill="#0f172a" />
          <polygon points="64,40 56,38 58,46" fill="#0f172a" />
          <rect x="38" y="40" width="4" height="4" rx="1" fill={palette.eye} />
          <rect x="58" y="40" width="4" height="4" rx="1" fill={palette.eye} />
          <circle cx="40" cy="42" r="1" fill="#ffffff" />
          <circle cx="60" cy="42" r="1" fill="#ffffff" />

          {/* Heavy Stone Chin / Brow Crest */}
          <polygon points="40,24 50,20 60,24 50,27" fill={palette.mid} stroke={palette.dark} strokeWidth="1" />
          <polygon points="42,66 50,72 58,66 50,64" fill={palette.dark} />

          {/* Pulsing Glowing Heart Core */}
          <circle cx="50" cy="64" r="5" fill={`url(#coreGlow_${uid})`} />
        </g>
      );
    }

    // =========================================================================
    // 11. DOGGO (2-Star Canine Monster)
    // =========================================================================
    if (isDoggo) {
      return (
        <g>
          <defs>
            <linearGradient id={`doggoGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.main} />
              <stop offset="60%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.dark} />
            </linearGradient>
            <radialGradient id={`dogCheek_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor={palette.core} />
              <stop offset="100%" stopColor={palette.main} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Awakened Pack Alpha Halo */}
          {isAwakened && (
            <g>
              <circle cx="50" cy="50" r="46" fill="none" stroke={palette.glow} strokeWidth="2" strokeDasharray="8 4" opacity="0.85" />
              <polygon points="50,4 53,10 47,10" fill={palette.glow} />
              <polygon points="96,50 90,53 90,47" fill={palette.glow} />
              <polygon points="50,96 53,90 47,90" fill={palette.glow} />
              <polygon points="4,50 10,53 10,47" fill={palette.glow} />
            </g>
          )}

          {/* Alert Pointy Canine Ears */}
          <polygon points="26,38 18,12 36,24" fill={palette.mid} stroke={palette.dark} strokeWidth="1.5" />
          <polygon points="24,34 20,16 32,24" fill={palette.core} opacity="0.7" />
          <polygon points="74,38 82,12 64,24" fill={palette.mid} stroke={palette.dark} strokeWidth="1.5" />
          <polygon points="76,34 80,16 68,24" fill={palette.core} opacity="0.7" />

          {/* Wagging Bushy Tail curve at top right */}
          <path d="M74 58 Q90 46 88 32 Q82 34 80 44" fill={palette.main} stroke={palette.dark} strokeWidth="1.5" />

          {/* Canine Head with Fluffy Cheeks */}
          <path
            d="M24 52 C18 50 16 60 22 66 C28 72 36 76 50 76 C64 76 72 72 78 66 C84 60 82 50 76 52 C74 38 66 30 50 30 C34 30 26 38 24 52 Z"
            fill={`url(#doggoGrad_${uid})`}
            stroke={palette.dark}
            strokeWidth="1.8"
          />

          {/* Cheerful White/Core Muzzle */}
          <ellipse cx="50" cy="58" rx="15" ry="12" fill={palette.core} stroke={palette.dark} strokeWidth="1.2" />

          {/* Shiny Black Dog Nose */}
          <polygon points="46,51 54,51 50,56" fill={palette.dark} />
          <circle cx="48.5" cy="52" r="0.8" fill="#ffffff" />

          {/* Happy Open Mouth & Tongue */}
          <path d="M46 56 Q50 60 54 56" fill="none" stroke={palette.dark} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M47 58 Q50 66 53 58 Z" fill="#f43f5e" stroke={palette.dark} strokeWidth="1" />
          {/* Cute Little Canine Fangs */}
          <polygon points="45,56 46,59 47,56" fill="#ffffff" />
          <polygon points="53,56 54,59 55,56" fill="#ffffff" />

          {/* Bright Sparkly Dog Eyes */}
          <ellipse cx="38" cy="44" rx="4.5" ry="5.5" fill={palette.dark} />
          <circle cx="36.5" cy="42" r="1.8" fill="#ffffff" />
          <circle cx="39.5" cy="46" r="0.8" fill="#ffffff" />
          <ellipse cx="62" cy="44" rx="4.5" ry="5.5" fill={palette.dark} />
          <circle cx="60.5" cy="42" r="1.8" fill="#ffffff" />
          <circle cx="63.5" cy="46" r="0.8" fill="#ffffff" />

          {/* Cute Eyebrow Dots */}
          <ellipse cx="37" cy="36" rx="2" ry="1.5" fill={palette.core} />
          <ellipse cx="63" cy="36" rx="2" ry="1.5" fill={palette.core} />

          {/* Spiked / Studded Battle Collar */}
          <path d="M30 72 Q50 82 70 72" fill="none" stroke={palette.dark} strokeWidth="4" />
          <circle cx="40" cy="76" r="2" fill={palette.glow} />
          <circle cx="50" cy="77" r="2.5" fill="#facc15" />
          <circle cx="60" cy="76" r="2" fill={palette.glow} />

          {/* Awakened Alpha Crest */}
          {isAwakened && (
            <g>
              <polygon points="50,18 53,24 47,24" fill={palette.glow} />
              <circle cx="50" cy="25" r="2" fill="#ffffff" />
            </g>
          )}
        </g>
      );
    }

    // =========================================================================
    // 12. BIRDUNNO (2-Star 2-Headed Bird Monster)
    // =========================================================================
    if (isBirdunno) {
      return (
        <g>
          <defs>
            <linearGradient id={`birdGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.main} />
              <stop offset="50%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.dark} />
            </linearGradient>
            <linearGradient id={`beakGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Awakened Dual Tempest Whirlwind */}
          {isAwakened && (
            <g>
              <circle cx="50" cy="50" r="46" fill="none" stroke={palette.glow} strokeWidth="2" strokeDasharray="5 3" opacity="0.85" />
              <ellipse cx="38" cy="38" rx="20" ry="12" fill="none" stroke={palette.core} strokeWidth="1" strokeDasharray="3 3" transform="rotate(-15 38 38)" />
              <ellipse cx="62" cy="38" rx="20" ry="12" fill="none" stroke={palette.core} strokeWidth="1" strokeDasharray="3 3" transform="rotate(15 62 38)" />
            </g>
          )}

          {/* Broad Sweeping Avian Wings (Left & Right) */}
          <path d="M26 56 C8 48 6 68 20 74 C26 70 28 62 26 56 Z" fill={palette.mid} stroke={palette.dark} strokeWidth="1.2" />
          <path d="M74 56 C92 48 94 68 80 74 C74 70 72 62 74 56 Z" fill={palette.mid} stroke={palette.dark} strokeWidth="1.2" />

          {/* Twin Head Necks joining at central feathered chest */}
          <path
            d="M26 44 Q32 62 42 70 L58 70 Q68 62 74 44 Q60 52 50 48 Q40 52 26 44 Z"
            fill={`url(#birdGrad_${uid})`}
            stroke={palette.dark}
            strokeWidth="1.5"
          />

          {/* Downy Feathered Chest */}
          <ellipse cx="50" cy="68" rx="14" ry="9" fill={palette.core} opacity="0.8" />

          {/* ================= LEFT HEAD (Head A) ================= */}
          {/* Feather Crest Left */}
          <path d="M34 22 C28 10 32 6 38 16 Z" fill={palette.main} stroke={palette.dark} strokeWidth="1" />
          <path d="M38 22 C34 12 40 8 42 18 Z" fill={palette.core} />

          {/* Left Head Skull */}
          <ellipse cx="36" cy="34" rx="13" ry="12" fill={`url(#birdGrad_${uid})`} stroke={palette.dark} strokeWidth="1.5" />

          {/* Left Head Eye (Curious / Tilted) */}
          <ellipse cx="34" cy="32" rx="3.5" ry="4" fill={palette.dark} />
          <circle cx="33" cy="30.5" r="1.4" fill="#ffffff" />
          <circle cx="34" cy="32" r="2.2" fill={palette.eye} />
          <circle cx="33.5" cy="31" r="0.8" fill="#ffffff" />

          {/* Left Head Sharp Beak (Pointing slightly left) */}
          <polygon points="24,34 10,38 24,42" fill={`url(#beakGrad_${uid})`} stroke={palette.dark} strokeWidth="1.2" />

          {/* ================= RIGHT HEAD (Head B) ================= */}
          {/* Feather Crest Right */}
          <path d="M66 22 C72 10 68 6 62 16 Z" fill={palette.main} stroke={palette.dark} strokeWidth="1" />
          <path d="M62 22 C66 12 60 8 58 18 Z" fill={palette.core} />

          {/* Right Head Skull */}
          <ellipse cx="64" cy="34" rx="13" ry="12" fill={`url(#birdGrad_${uid})`} stroke={palette.dark} strokeWidth="1.5" />

          {/* Right Head Eye (Feisty / Inquisitive) */}
          <ellipse cx="66" cy="32" rx="3.5" ry="4" fill={palette.dark} />
          <circle cx="67" cy="30.5" r="1.4" fill="#ffffff" />
          <circle cx="66" cy="32" r="2.2" fill={palette.eye} />
          <circle cx="66.5" cy="31" r="0.8" fill="#ffffff" />

          {/* Right Head Sharp Beak (Pointing slightly right) */}
          <polygon points="76,34 90,38 76,42" fill={`url(#beakGrad_${uid})`} stroke={palette.dark} strokeWidth="1.2" />

          {/* Twin Harmonic Connection / Awakening Stars */}
          {isAwakened ? (
            <g>
              <polygon points="50,22 52,26 56,26 53,29 54,33 50,30 46,33 47,29 44,26 48,26" fill="#facc15" stroke={palette.dark} strokeWidth="0.8" />
              <line x1="38" y1="20" x2="62" y2="20" stroke={palette.glow} strokeWidth="1.5" strokeDasharray="2 2" />
            </g>
          ) : (
            <circle cx="50" cy="36" r="2" fill={palette.core} opacity="0.6" />
          )}
        </g>
      );
    }

    return (
      <g>
        <circle cx="50" cy="50" r="40" fill={palette.mid} />
        <circle cx="50" cy="50" r="20" fill={palette.core} />
      </g>
    );
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl overflow-hidden border shadow-sm transition-transform duration-300 ${sizeClasses} ${className}`}
      style={{
        backgroundColor: customPortrait && !imageError ? 'transparent' : '#FAF6ED',
        borderColor: isBoss ? '#f59e0b' : isAwakened ? '#fbbf24' : elementVisual.borderHex,
        boxShadow: isBoss
          ? `0 0 16px #f59e0b66, inset 0 0 10px #f59e0b33`
          : isAwakened
          ? `0 0 14px ${elementVisual.borderHex}66, inset 0 0 8px #fbbf2433`
          : `0 2px 8px rgba(92, 64, 40, 0.12)`,
      }}
    >
      {customPortrait && !imageError ? (
        <img
          src={customPortrait}
          alt={variantId}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover object-center bg-transparent select-none"
          style={{ backgroundColor: 'transparent', backgroundImage: 'none', background: 'transparent' }}
        />
      ) : (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {renderIllustration()}
        </svg>
      )}

      {/* Boss Overlord Crown Ribbon */}
      {isBoss && (
        <span
          className="absolute top-1 left-1 text-[8px] font-black px-1 rounded shadow-md ring-1 ring-amber-400 uppercase tracking-tighter"
          style={{ backgroundColor: '#dc2626', color: '#fef08a' }}
        >
          👑 BOSS
        </span>
      )}

      {/* Awakening Star Ribbon */}
      {!isBoss && isAwakened && (
        <span
          className="absolute bottom-1 right-1 text-[9px] font-black px-1 rounded shadow-md ring-1 ring-amber-300"
          style={{ backgroundColor: '#fbbf24', color: '#78350f' }}
        >
          ★ AWK
        </span>
      )}
    </div>
  );
};
