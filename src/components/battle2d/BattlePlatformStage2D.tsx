/**
 * 2D Anime Battle Platform Stage Component
 * Renders the ancient circular stone battle arena dais with a glowing central arcane rune seal
 * directly matching the generated anime fantasy reference picture:
 * - Natural circular cracked-flagstone arena ground
 * - Radiant ancient magic rune circle in center ground with glowing arcane glyphs & soft runes
 * - Organic soft ground-contact shadows under each active monster
 * - Subtle ambient team auras (cyan/gold for player, crimson/amber for challenger)
 * - Seamless anime fantasy integration without artificial wireframe labels or 3D block polygons
 */

import React, { useState, useEffect, useId } from 'react';
import { MapDefinition } from '../../data/maps';
import { mapRegistry } from '../../services/map/mapRegistry';

interface SlotCoord {
  slotKey: string;
  name: string;
  row: 'BACK' | 'FRONT';
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
}

interface BattlePlatformStage2DProps {
  mapDef: MapDefinition;
  playerSlots: SlotCoord[];
  enemySlots: SlotCoord[];
}

export const BattlePlatformStage2D: React.FC<BattlePlatformStage2DProps> = ({
  mapDef,
  playerSlots,
  enemySlots,
}) => {
  const rawId = useId();
  const uid = rawId.replace(/:/g, '_');

  const [customPlatformUrl, setCustomPlatformUrl] = useState<string | null>(() =>
    mapRegistry.getMapPlatformUrl(mapDef.id)
  );

  useEffect(() => {
    const update = () => {
      setCustomPlatformUrl(mapRegistry.getMapPlatformUrl(mapDef.id));
    };
    update();
    const unsub = mapRegistry.subscribe(update);
    return () => unsub();
  }, [mapDef.id]);

  const runeColor = mapDef.palette.glowHex || '#38bdf8';
  const playerColor = mapDef.palette.conduitPlayer || '#0284c7';
  const enemyColor = mapDef.palette.conduitEnemy || '#ef4444';

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* Custom Uploaded Battle Platform Artwork (if configured) */}
      {customPlatformUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <img
            src={customPlatformUrl}
            alt="Custom Battleplatform"
            className="w-[85%] max-h-[70%] object-contain object-center drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] filter"
          />
        </div>
      )}

      <svg
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
        className="w-full h-full relative z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Soft Ground Contact Shadow Filter */}
          <filter id={`unitShadow_${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
            <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.65 0" />
            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
          </filter>

          {/* Central Stone Dais Radial Gradient */}
          <radialGradient id={`stoneDaisGrad_${uid}`} cx="50%" cy="56%" r="50%">
            <stop offset="0%" stopColor="#473a2c" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#36291c" stopOpacity="0.82" />
            <stop offset="70%" stopColor="#251a10" stopOpacity="0.75" />
            <stop offset="92%" stopColor="#19110a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Stone Edge Rim Highlight Gradient */}
          <radialGradient id={`stoneRimGrad_${uid}`} cx="50%" cy="56%" r="48%">
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="85%" stopColor="transparent" stopOpacity="0" />
            <stop offset="95%" stopColor="#8a7356" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#2e1f13" stopOpacity="0.8" />
          </radialGradient>

          {/* Glowing Arcane Center Rune Gradient */}
          <radialGradient id={`arcaneCoreGlow_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="25%" stopColor={runeColor} stopOpacity="0.75" />
            <stop offset="60%" stopColor={runeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Rune Circle Glow Filter */}
          <filter id={`runeGlow_${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Player Ambient Ground Glow */}
          <radialGradient id={`playerZoneGlow_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={playerColor} stopOpacity="0.25" />
            <stop offset="60%" stopColor={playerColor} stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Enemy Ambient Ground Glow */}
          <radialGradient id={`enemyZoneGlow_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={enemyColor} stopOpacity="0.25" />
            <stop offset="60%" stopColor={enemyColor} stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 1. NATURAL ANIME BATTLEFIELD AMBIENCE (No 3D Stone Block Dais) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <g id="natural-anime-ground">
          {/* Gentle ground atmosphere vignette at base to blend naturally */}
          <ellipse cx="500" cy="520" rx="550" ry="120" fill="#000000" fillOpacity="0.25" filter={`url(#unitShadow_${uid})`} />
        </g>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 2. GLOWING ARCANE MAGIC RUNE CIRCLE (Center Stage Ground)      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <g id="center-magic-rune-circle" transform="translate(500, 365)" filter={`url(#runeGlow_${uid})`}>
          {/* Subtle Core Energy Glow */}
          <ellipse cx="0" cy="0" rx="130" ry="48" fill={`url(#arcaneCoreGlow_${uid})`} opacity="0.35" />

          {/* Outer Rune Band Circle */}
          <ellipse
            cx="0"
            cy="0"
            rx="125"
            ry="45"
            fill="none"
            stroke={runeColor}
            strokeWidth="2.2"
            strokeOpacity="0.85"
          />

          {/* Secondary Concentric Rune Line */}
          <ellipse
            cx="0"
            cy="0"
            rx="112"
            ry="40"
            fill="none"
            stroke={runeColor}
            strokeWidth="1.2"
            strokeDasharray="6 4 14 4"
            strokeOpacity="0.7"
          />

          {/* Mystical Runic Inscriptions / Glyphs along perimeter */}
          <g fill={runeColor} opacity="0.75" fontSize="8" fontFamily="serif" fontWeight="bold">
            {/* Arcane Rune Glyphs mapped along the ellipse */}
            {[
              { x: -100, y: -8, char: 'ᚠ' },
              { x: -75, y: -22, char: 'ᚢ' },
              { x: -40, y: -32, char: 'ᚦ' },
              { x: 0, y: -36, char: 'ᚨ' },
              { x: 40, y: -32, char: 'ᚱ' },
              { x: 75, y: -22, char: 'ᚲ' },
              { x: 100, y: -8, char: 'ᚷ' },
              { x: 100, y: 12, char: 'ᚹ' },
              { x: 75, y: 26, char: 'ᚺ' },
              { x: 40, y: 34, char: 'ᚾ' },
              { x: 0, y: 38, char: 'ᛁ' },
              { x: -40, y: 34, char: 'ᛃ' },
              { x: -75, y: 26, char: 'ᛈ' },
              { x: -100, y: 12, char: 'ᛇ' },
            ].map((glyph, i) => (
              <text key={`r-glyph-${i}`} x={glyph.x} y={glyph.y} textAnchor="middle" dominantBaseline="middle">
                {glyph.char}
              </text>
            ))}
          </g>

          {/* Inner Arcane Geometry (Star / Seal / Magic Matrix) */}
          <g stroke={runeColor} strokeWidth="1.2" fill="none" opacity="0.8">
            {/* Diamond Sigil */}
            <polygon points="0,-28 75,0 0,28 -75,0" strokeOpacity="0.75" />
            <polygon points="0,-22 55,0 0,22 -55,0" strokeOpacity="0.6" strokeDasharray="3 3" />

            {/* Inner Concentric Core Ring */}
            <ellipse cx="0" cy="0" rx="38" ry="14" strokeWidth="1.5" strokeOpacity="0.9" />
            <circle cx="0" cy="0" r="3.5" fill="#ffffff" opacity="0.95" />
          </g>

          {/* Central Magical Sigil Crest (Emblem) */}
          <path
            d="M -16,-4 C -8,-10 8,-10 16,-4 C 8,6 -8,6 -16,-4 Z"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.4"
            opacity="0.9"
          />
        </g>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 3. NATURAL GROUND CONTACT SHADOWS & AURAS FOR EACH COMBATANT   */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* Player Team Ground Contact Shadows */}
        {playerSlots.map((slot) => {
          const sx = (slot.x / 100) * 1000;
          const sy = (slot.y / 100) * 600;
          const rx = 36 * (slot.row === 'FRONT' ? 1.05 : 0.95);
          const ry = 13 * (slot.row === 'FRONT' ? 1.05 : 0.95);

          return (
            <g key={`p-pad-${slot.slotKey}`} transform={`translate(${sx}, ${sy + 26})`}>
              {/* Natural Ground Contact Drop Shadow */}
              <ellipse rx={rx + 10} ry={ry + 5} fill="#000000" fillOpacity="0.6" filter={`url(#unitShadow_${uid})`} />

              {/* Subtle Team Arcane Ground Aura (Natural, no text labels) */}
              <ellipse rx={rx} ry={ry} fill={`url(#playerZoneGlow_${uid})`} />
              <ellipse
                rx={rx}
                ry={ry}
                fill="none"
                stroke={playerColor}
                strokeWidth="1.2"
                strokeDasharray="8 6"
                strokeOpacity="0.45"
              />
            </g>
          );
        })}

        {/* Enemy Team Ground Contact Shadows */}
        {enemySlots.map((slot) => {
          const sx = (slot.x / 100) * 1000;
          const sy = (slot.y / 100) * 600;
          const rx = 36 * (slot.row === 'FRONT' ? 1.05 : 0.95);
          const ry = 13 * (slot.row === 'FRONT' ? 1.05 : 0.95);

          return (
            <g key={`e-pad-${slot.slotKey}`} transform={`translate(${sx}, ${sy + 26})`}>
              {/* Natural Ground Contact Drop Shadow */}
              <ellipse rx={rx + 10} ry={ry + 5} fill="#000000" fillOpacity="0.6" filter={`url(#unitShadow_${uid})`} />

              {/* Subtle Team Arcane Ground Aura (Natural, no text labels) */}
              <ellipse rx={rx} ry={ry} fill={`url(#enemyZoneGlow_${uid})`} />
              <ellipse
                rx={rx}
                ry={ry}
                fill="none"
                stroke={enemyColor}
                strokeWidth="1.2"
                strokeDasharray="8 6"
                strokeOpacity="0.45"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
