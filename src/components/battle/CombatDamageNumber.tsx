import React from 'react';

export type CombatDamageType =
  | 'NORMAL'
  | 'CRIT'
  | 'WEAKNESS'
  | 'RESISTANT'
  | 'HEAL'
  | 'SHIELD'
  | 'EXTRA_TURN'
  // Compatibility aliases
  | 'DAMAGE'
  | 'ADVANTAGE'
  | 'DISADVANTAGE';

interface CombatDamageNumberProps {
  text: string;
  type: CombatDamageType;
  id?: string;
  scale?: number;
}

export const CombatDamageNumber: React.FC<CombatDamageNumberProps> = ({
  text,
  type,
  scale = 1,
}) => {
  // Normalize types
  let normalizedType = type;
  if (type === 'DAMAGE') normalizedType = 'NORMAL';
  if (type === 'ADVANTAGE') normalizedType = 'WEAKNESS';
  if (type === 'DISADVANTAGE') normalizedType = 'RESISTANT';

  // Format display text (remove negative sign if present since styling indicates damage)
  const cleanDigits = text.replace(/^[+-]/, '').trim();

  switch (normalizedType) {
    // =========================================================================
    // 1. CRITICAL HIT (Fiery explosion burst, orange-yellow-red gradient, flames)
    // =========================================================================
    case 'CRIT': {
      return (
        <div
          className="relative flex flex-col items-center justify-center select-none filter drop-shadow-[0_4px_12px_rgba(220,38,38,0.7)] animate-crit-pop"
          style={{ transform: `scale(${scale * 1.15})` }}
        >
          <svg
            className="overflow-visible"
            width="220"
            height="110"
            viewBox="-110 -55 220 110"
          >
            <defs>
              {/* Fiery Blast Gradient */}
              <linearGradient id="critBlastGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#F97316" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0.85" />
              </linearGradient>

              {/* Fiery Inner Burst */}
              <radialGradient id="critInnerRadial" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FEF9C3" stopOpacity="1" />
                <stop offset="60%" stopColor="#FBBF24" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
              </radialGradient>

              {/* Critical Number Gradient (Yellow-Orange-Crimson) */}
              <linearGradient id="critTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFEE" />
                <stop offset="18%" stopColor="#FEF08A" />
                <stop offset="48%" stopColor="#F97316" />
                <stop offset="80%" stopColor="#DC2626" />
                <stop offset="100%" stopColor="#991B1B" />
              </linearGradient>

              {/* Critical Label Gradient */}
              <linearGradient id="critLabelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="60%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>

              {/* Glow Filter */}
              <filter id="critGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Back Explosive Starburst Blast */}
            <g className="animate-crit-blast-spin origin-center">
              {/* Outer Starburst Shards */}
              <path
                d="M 0,-46 L 12,-24 L 38,-38 L 26,-12 L 52,-8 L 28,10 L 46,34 L 18,22 L 8,48 L -6,22 L -28,42 L -22,14 L -50,18 L -30,-4 L -54,-22 L -24,-16 L -20,-42 L -4,-22 Z"
                fill="url(#critBlastGrad)"
                stroke="#7F1D1D"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Inner Bright Burst */}
              <polygon
                points="0,-32 9,-15 28,-22 17,-5 36,0 18,10 26,26 9,16 0,34 -9,16 -26,26 -18,10 -36,0 -17,-5 -28,-22 -9,-15"
                fill="url(#critInnerRadial)"
              />
            </g>

            {/* Flame Sparks / Embers floating out */}
            <circle cx="-42" cy="-28" r="3" fill="#FEF08A" />
            <circle cx="48" cy="-22" r="3.5" fill="#F97316" />
            <circle cx="36" cy="32" r="2.5" fill="#FEF08A" />
            <circle cx="-38" cy="26" r="3" fill="#F97316" />
            <polygon points="12,-48 15,-40 18,-48 15,-54" fill="#FDE047" />

            {/* "CRITICAL!" Header Badge (Arched/Tilted) */}
            <g transform="translate(0, -26) rotate(-3)">
              {/* Dark Outline */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="17"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', Impact, sans-serif"
                stroke="#450A0A"
                strokeWidth="5"
                strokeLinejoin="round"
                fill="none"
              >
                CRITICAL!
              </text>
              {/* Gradient Fill */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="17"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', Impact, sans-serif"
                fill="url(#critLabelGrad)"
              >
                CRITICAL!
              </text>
            </g>

            {/* Large Combat Digits (e.g. 489) */}
            <g transform="translate(0, 24)">
              {/* Deep Red Dark Maroon Outline */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="48"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', 'Arial Black', sans-serif"
                stroke="#3E0000"
                strokeWidth="9"
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
              >
                {cleanDigits}
              </text>

              {/* Inner Red Rim */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="48"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', 'Arial Black', sans-serif"
                stroke="#991B1B"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
              >
                {cleanDigits}
              </text>

              {/* Fiery Gradient Fill */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="48"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', 'Arial Black', sans-serif"
                fill="url(#critTextGrad)"
              >
                {cleanDigits}
              </text>
            </g>
          </svg>
        </div>
      );
    }

    // =========================================================================
    // 2. WEAKNESS HIT (Electric violet-to-cyan lightning, dynamic slanted text)
    // =========================================================================
    case 'WEAKNESS': {
      return (
        <div
          className="relative flex flex-col items-center justify-center select-none filter drop-shadow-[0_4px_14px_rgba(56,189,248,0.75)] animate-weakness-pop"
          style={{ transform: `scale(${scale * 1.1})` }}
        >
          <svg
            className="overflow-visible"
            width="220"
            height="110"
            viewBox="-110 -55 220 110"
          >
            <defs>
              {/* Electric Text Gradient (Violet/Lavender -> Indigo -> Bright Neon Cyan) */}
              <linearGradient id="weakTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="20%" stopColor="#E9D5FF" />
                <stop offset="50%" stopColor="#A855F7" />
                <stop offset="78%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>

              {/* Weakness Label Gradient */}
              <linearGradient id="weakLabelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F0ABFC" />
                <stop offset="50%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>

              {/* Electric Glow */}
              <filter id="electricGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Electric Aura Burst & Lightning Arcs */}
            <g filter="url(#electricGlow)">
              {/* Left Top Lightning Arc */}
              <path
                d="M -55,-40 L -38,-20 L -46,-16 L -24,8 L -34,4 L -20,32"
                stroke="#38BDF8"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="bevel"
                fill="none"
              />
              <path
                d="M -55,-40 L -38,-20 L -46,-16 L -24,8 L -34,4 L -20,32"
                stroke="#E0F2FE"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              />

              {/* Right Top Lightning Arc */}
              <path
                d="M 40,-44 L 28,-22 L 38,-18 L 18,12 L 26,16 L 36,40"
                stroke="#C084FC"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="bevel"
                fill="none"
              />
              <path
                d="M 40,-44 L 28,-22 L 38,-18 L 18,12 L 26,16 L 36,40"
                stroke="#FAF5FF"
                strokeWidth="1"
                strokeLinecap="round"
                fill="none"
              />

              {/* Lightning branching forks */}
              <path
                d="M 28,-22 L 52,-18"
                stroke="#38BDF8"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M -38,-20 L -62,-12"
                stroke="#A855F7"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            </g>

            {/* Crackling electric spark points */}
            <circle cx="-50" cy="-35" r="2.5" fill="#E0F2FE" />
            <circle cx="56" cy="-28" r="3" fill="#A855F7" />
            <circle cx="-25" cy="38" r="2" fill="#38BDF8" />
            <circle cx="48" cy="28" r="2.5" fill="#F0ABFC" />

            {/* "Weakness!" Header Text (Dynamic script/italic, slightly tilted) */}
            <g transform="translate(0, -25) rotate(-2)">
              {/* Dark Navy / Indigo Outline */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="18"
                fontWeight="900"
                fontStyle="italic"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', sans-serif"
                stroke="#0F172A"
                strokeWidth="5"
                strokeLinejoin="round"
                fill="none"
              >
                Weakness!
              </text>
              {/* Vibrant Gradient Fill */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="18"
                fontWeight="900"
                fontStyle="italic"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', sans-serif"
                fill="url(#weakLabelGrad)"
              >
                Weakness!
              </text>
            </g>

            {/* Combat Digits (e.g. 735) */}
            <g transform="translate(0, 24)">
              {/* Deep Midnight Navy Stroke */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="46"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', 'Arial Black', sans-serif"
                stroke="#0B0F19"
                strokeWidth="9"
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
              >
                {cleanDigits}
              </text>

              {/* Electric Cyan Accent Outline */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="46"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', 'Arial Black', sans-serif"
                stroke="#1E1B4B"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
              >
                {cleanDigits}
              </text>

              {/* Electric Gradient Fill */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="46"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', 'Arial Black', sans-serif"
                fill="url(#weakTextGrad)"
              >
                {cleanDigits}
              </text>
            </g>
          </svg>
        </div>
      );
    }

    // =========================================================================
    // 3. RESISTANT HIT (Metallic steel slate, solid defense, kite shield icon)
    // =========================================================================
    case 'RESISTANT': {
      return (
        <div
          className="relative flex flex-col items-center justify-center select-none filter drop-shadow-[0_3px_8px_rgba(15,23,42,0.8)] animate-resistant-pop"
          style={{ transform: `scale(${scale * 0.95})` }}
        >
          <svg
            className="overflow-visible"
            width="200"
            height="100"
            viewBox="-100 -50 200 100"
          >
            <defs>
              {/* Steel Metallic Gradient for Digits */}
              <linearGradient id="resistTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="25%" stopColor="#E2E8F0" />
                <stop offset="55%" stopColor="#94A3B8" />
                <stop offset="85%" stopColor="#475569" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              {/* Metallic Shield Bevel Gradient */}
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#CBD5E1" />
                <stop offset="40%" stopColor="#94A3B8" />
                <stop offset="80%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>

              <linearGradient id="shieldInnerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#64748B" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
            </defs>

            {/* "RESISTANT" Header Badge */}
            <g transform="translate(0, -22)">
              {/* Dark Charcoal Outline */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="15"
                fontWeight="900"
                letterSpacing="1"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', sans-serif"
                stroke="#0F172A"
                strokeWidth="4.5"
                strokeLinejoin="round"
                fill="none"
              >
                RESISTANT
              </text>
              {/* Steel Blue/Slate Fill */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="15"
                fontWeight="900"
                letterSpacing="1"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', sans-serif"
                fill="#94A3B8"
              >
                RESISTANT
              </text>
            </g>

            {/* Digits + Metallic Shield Group */}
            <g transform="translate(-14, 20)">
              {/* Dark Slate Thick Stroke */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="42"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', 'Arial Black', sans-serif"
                stroke="#0F172A"
                strokeWidth="8"
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
              >
                {cleanDigits}
              </text>

              {/* Steel Gradient Fill */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="42"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', 'Arial Black', sans-serif"
                fill="url(#resistTextGrad)"
              >
                {cleanDigits}
              </text>

              {/* Metallic Defensive Kite Shield beside the digits */}
              <g transform="translate(38, -14)">
                {/* Outer Shield Outline */}
                <path
                  d="M 0,-14 L 14,-10 L 14,2 C 14,13 0,22 0,22 C 0,22 -14,13 -14,2 L -14,-10 Z"
                  fill="url(#shieldGrad)"
                  stroke="#0F172A"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                {/* Inner Beveled Rim */}
                <path
                  d="M 0,-10 L 10,-7 L 10,2 C 10,10 0,17 0,17 C 0,17 -10,10 -10,2 L -10,-7 Z"
                  fill="url(#shieldInnerGrad)"
                  stroke="#64748B"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
                {/* Center Highlight Crest */}
                <path
                  d="M 0,-8 L 0,15"
                  stroke="#E2E8F0"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              </g>
            </g>
          </svg>
        </div>
      );
    }

    // =========================================================================
    // 4. NORMAL HIT (Warm cream-to-orange gradient, thick chocolate outline, stars)
    // =========================================================================
    case 'NORMAL':
    default: {
      return (
        <div
          className="relative flex flex-col items-center justify-center select-none filter drop-shadow-[0_3px_8px_rgba(69,26,3,0.65)] animate-normal-pop"
          style={{ transform: `scale(${scale * 1.0})` }}
        >
          <svg
            className="overflow-visible"
            width="200"
            height="100"
            viewBox="-100 -50 200 100"
          >
            <defs>
              {/* Normal Warm Gold/Amber Gradient */}
              <linearGradient id="normalTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFEE8" />
                <stop offset="25%" stopColor="#FEF08A" />
                <stop offset="60%" stopColor="#FBBF24" />
                <stop offset="85%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>

              {/* Star Sparkle Gradient */}
              <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF9C3" />
                <stop offset="50%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>

            {/* Orbiting Golden Sparkling Stars */}
            {/* Top Left Star (4-point sparkle) */}
            <path
              d="M -44,-34 L -41,-28 L -35,-26 L -41,-24 L -44,-18 L -47,-24 L -53,-26 L -47,-28 Z"
              fill="url(#starGrad)"
              stroke="#451A03"
              strokeWidth="1"
            />
            {/* Top Right Star */}
            <path
              d="M 46,-36 L 49,-30 L 55,-28 L 49,-26 L 46,-20 L 43,-26 L 37,-28 L 43,-30 Z"
              fill="url(#starGrad)"
              stroke="#451A03"
              strokeWidth="1"
            />
            {/* Middle Left Star */}
            <path
              d="M -56,6 L -53,10 L -49,12 L -53,14 L -56,18 L -59,14 L -63,12 L -59,10 Z"
              fill="url(#starGrad)"
              stroke="#451A03"
              strokeWidth="0.8"
            />
            {/* Small sparkles */}
            <circle cx="-32" cy="-38" r="2" fill="#FEF08A" stroke="#78350F" strokeWidth="0.5" />
            <circle cx="58" cy="-14" r="2.5" fill="#FEF08A" stroke="#78350F" strokeWidth="0.5" />
            <circle cx="48" cy="22" r="2" fill="#FDE047" stroke="#78350F" strokeWidth="0.5" />
            <circle cx="-42" cy="28" r="2.5" fill="#FDE047" stroke="#78350F" strokeWidth="0.5" />

            {/* "NORMAL" Header Badge */}
            <g transform="translate(0, -22)">
              {/* Dark Outline */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="16"
                fontWeight="900"
                letterSpacing="1.2"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', sans-serif"
                stroke="#1C1917"
                strokeWidth="4.5"
                strokeLinejoin="round"
                fill="none"
              >
                NORMAL
              </text>
              {/* Clean White/Ivory Fill */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="16"
                fontWeight="900"
                letterSpacing="1.2"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', sans-serif"
                fill="#FAFAF9"
              >
                NORMAL
              </text>
            </g>

            {/* Combat Digits (e.g. 145) */}
            <g transform="translate(0, 20)">
              {/* Deep Chocolate/Dark Espresso Stroke */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="44"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', 'Arial Black', sans-serif"
                stroke="#2B1105"
                strokeWidth="8"
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
              >
                {cleanDigits}
              </text>

              {/* Warm Golden/Amber Gradient Fill */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="44"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', 'Arial Black', sans-serif"
                fill="url(#normalTextGrad)"
              >
                {cleanDigits}
              </text>
            </g>
          </svg>
        </div>
      );
    }

    // =========================================================================
    // 5. HEAL (Emerald restoration with sparkle crosses)
    // =========================================================================
    case 'HEAL': {
      return (
        <div
          className="relative flex flex-col items-center justify-center select-none filter drop-shadow-[0_3px_8px_rgba(5,150,105,0.7)] animate-normal-pop"
          style={{ transform: `scale(${scale * 1.05})` }}
        >
          <svg
            className="overflow-visible"
            width="200"
            height="100"
            viewBox="-100 -50 200 100"
          >
            <defs>
              <linearGradient id="healTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ECFDF5" />
                <stop offset="40%" stopColor="#6EE7B7" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>

            {/* Emerald Healing Crosses */}
            <g transform="translate(-45, -20)">
              <rect x="-2" y="-7" width="4" height="14" rx="1.5" fill="#6EE7B7" stroke="#064E3B" strokeWidth="1" />
              <rect x="-7" y="-2" width="14" height="4" rx="1.5" fill="#6EE7B7" stroke="#064E3B" strokeWidth="1" />
            </g>
            <g transform="translate(45, -15)">
              <rect x="-1.5" y="-5" width="3" height="10" rx="1" fill="#A7F3D0" stroke="#064E3B" strokeWidth="0.8" />
              <rect x="-5" y="-1.5" width="10" height="3" rx="1" fill="#A7F3D0" stroke="#064E3B" strokeWidth="0.8" />
            </g>

            {/* "RECOVERY" Header Badge */}
            <g transform="translate(0, -22)">
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="15"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', sans-serif"
                stroke="#064E3B"
                strokeWidth="4.5"
                strokeLinejoin="round"
                fill="none"
              >
                RECOVERY
              </text>
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="15"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', sans-serif"
                fill="#A7F3D0"
              >
                RECOVERY
              </text>
            </g>

            {/* Digits with + prefix */}
            <g transform="translate(0, 20)">
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="42"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', 'Arial Black', sans-serif"
                stroke="#064E3B"
                strokeWidth="8"
                strokeLinejoin="round"
                fill="none"
              >
                +{cleanDigits}
              </text>
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="42"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', 'Arial Black', sans-serif"
                fill="url(#healTextGrad)"
              >
                +{cleanDigits}
              </text>
            </g>
          </svg>
        </div>
      );
    }

    // =========================================================================
    // 6. SHIELD ABSORB
    // =========================================================================
    case 'SHIELD': {
      return (
        <div
          className="relative flex flex-col items-center justify-center select-none filter drop-shadow-[0_3px_8px_rgba(6,182,212,0.7)] animate-normal-pop"
          style={{ transform: `scale(${scale * 0.95})` }}
        >
          <svg
            className="overflow-visible"
            width="200"
            height="100"
            viewBox="-100 -50 200 100"
          >
            <defs>
              <linearGradient id="shieldAbsorbGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ECFEFF" />
                <stop offset="40%" stopColor="#67E8F9" />
                <stop offset="100%" stopColor="#0891B2" />
              </linearGradient>
            </defs>

            <g transform="translate(0, -22)">
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="15"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', sans-serif"
                stroke="#164E63"
                strokeWidth="4"
                strokeLinejoin="round"
                fill="none"
              >
                GUARD
              </text>
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="15"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', sans-serif"
                fill="#A5F3FC"
              >
                GUARD
              </text>
            </g>

            <g transform="translate(0, 20)">
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="38"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', 'Arial Black', sans-serif"
                stroke="#083344"
                strokeWidth="7"
                strokeLinejoin="round"
                fill="none"
              >
                {cleanDigits}
              </text>
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="38"
                fontWeight="900"
                fontFamily="'Titan One', 'Fredoka', 'Outfit', 'Arial Black', sans-serif"
                fill="url(#shieldAbsorbGrad)"
              >
                {cleanDigits}
              </text>
            </g>
          </svg>
        </div>
      );
    }
  }
};
