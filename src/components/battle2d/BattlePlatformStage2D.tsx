/**
 * 2D Anime Battle Platform Stage Component
 * Seamlessly integrates combatants directly onto the natural ground of each painted arena
 * (the winding forest path, volcanic ash trail, ocean shoreline, celestial marble promenade, or cosmic void causeway).
 * Eliminates artificial floating geometric polygon boxes in favor of:
 * - Natural ground contact drop shadows beneath each combatant
 * - Elegant, low-profile glowing anime summon rings & elemental rune circles
 * - Ambient tactical squad demarcation (Allied Squad on left, Challenger Squad on right)
 * - Subtle central clash demarcation that keeps the breathtaking scenery unblocked
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

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* Custom Uploaded Battle Platform Artwork (if configured via Map Studio) */}
      {customPlatformUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <img
            src={customPlatformUrl}
            alt="Custom Battleplatform"
            className="w-[74%] max-h-[62%] object-contain object-center drop-shadow-[0_20px_30px_rgba(0,0,0,0.85)] filter"
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
            <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.7 0" />
            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
          </filter>

          {/* Allied Squad Ambient Ground Leyline Radial */}
          <radialGradient id={`alliedZoneGlow_${uid}`} cx="25%" cy="55%" r="35%">
            <stop offset="0%" stopColor={mapDef.palette.conduitPlayer} stopOpacity="0.12" />
            <stop offset="70%" stopColor={mapDef.palette.conduitPlayer} stopOpacity="0.03" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Challenger Squad Ambient Ground Leyline Radial */}
          <radialGradient id={`enemyZoneGlow_${uid}`} cx="75%" cy="55%" r="35%">
            <stop offset="0%" stopColor={mapDef.palette.conduitEnemy} stopOpacity="0.12" />
            <stop offset="70%" stopColor={mapDef.palette.conduitEnemy} stopOpacity="0.03" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Unit Pedestal Glowing Rune Radials */}
          <radialGradient id={`playerSlotRune_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={mapDef.palette.conduitPlayer} stopOpacity="0.32" />
            <stop offset="60%" stopColor={mapDef.palette.conduitPlayer} stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={`enemySlotRune_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={mapDef.palette.conduitEnemy} stopOpacity="0.32" />
            <stop offset="60%" stopColor={mapDef.palette.conduitEnemy} stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Center Leyline Shimmer Line Gradient */}
          <linearGradient id={`centerShimmer_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="25%" stopColor={mapDef.palette.dividerColor} stopOpacity="0.4" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="75%" stopColor={mapDef.palette.dividerColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Natural Ambient Squad Formation Ground Auras */}
        <ellipse cx="260" cy="330" rx="220" ry="120" fill={`url(#alliedZoneGlow_${uid})`} />
        <ellipse cx="740" cy="330" rx="220" ry="120" fill={`url(#enemyZoneGlow_${uid})`} />

        {/* 2. Delicate Center Clash Leyline Demarcation (Subtle, doesn't block scenery) */}
        <line
          x1="500"
          y1="160"
          x2="500"
          y2="520"
          stroke={`url(#centerShimmer_${uid})`}
          strokeWidth="2"
          strokeDasharray="8 6"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Center Clash Emblem Rune */}
        <g transform="translate(500, 340)" opacity="0.75">
          <circle r="18" fill="#000000" fillOpacity="0.35" stroke={mapDef.palette.dividerColor} strokeWidth="1.5" />
          <circle r="12" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 2" opacity="0.8" />
          <polygon points="0,-8 7,0 0,8 -7,0" fill={mapDef.palette.dividerColor} opacity="0.9" />
          <circle r="2.5" fill="#ffffff" />
        </g>

        {/* 3. Subtle Formation Titles Integrated on Ground */}
        <text
          x="260"
          y="180"
          textAnchor="middle"
          fontSize="10"
          fontFamily="sans-serif"
          fontWeight="900"
          letterSpacing="3"
          fill={mapDef.palette.conduitPlayer}
          opacity="0.45"
        >
          ALLIED SQUAD
        </text>
        <text
          x="740"
          y="180"
          textAnchor="middle"
          fontSize="10"
          fontFamily="sans-serif"
          fontWeight="900"
          letterSpacing="3"
          fill={mapDef.palette.conduitEnemy}
          opacity="0.45"
        >
          CHALLENGER SQUAD
        </text>

        {/* 4. Unit Ground Contact Pedestals (Allied Squad - Left) */}
        {playerSlots.map((slot) => {
          const sx = (slot.x / 100) * 1000;
          const sy = (slot.y / 100) * 600;
          const rx = 34;
          const ry = 13;

          return (
            <g key={`p-pad-${slot.slotKey}`} transform={`translate(${sx}, ${sy + 22})`}>
              {/* Natural Ground Contact Drop Shadow */}
              <ellipse rx={rx + 8} ry={ry + 5} fill="#000000" fillOpacity="0.5" filter={`url(#unitShadow_${uid})`} />
              
              {/* Glowing Elemental Rune Circle Fill */}
              <ellipse rx={rx} ry={ry} fill={`url(#playerSlotRune_${uid})`} />
              
              {/* Outer Rune Ring */}
              <ellipse
                rx={rx}
                ry={ry}
                fill="none"
                stroke={mapDef.palette.conduitPlayer}
                strokeWidth="1.6"
                strokeOpacity="0.7"
              />

              {/* Inner Dashed Magic Rune Ring */}
              <ellipse
                rx={rx * 0.72}
                ry={ry * 0.72}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                strokeDasharray="4 3"
                strokeOpacity="0.65"
              />

              {/* Center Elemental Glyph Spark */}
              <circle r="3" fill="#ffffff" opacity="0.85" />

              {/* Tactical Slot Identification Label */}
              <text
                x="0"
                y={ry + 13}
                textAnchor="middle"
                fontSize="8.5"
                fontFamily="ui-monospace, monospace"
                fontWeight="bold"
                fill={mapDef.palette.conduitPlayer}
                opacity="0.8"
                letterSpacing="1"
              >
                {slot.slotKey} · {slot.row}
              </text>
            </g>
          );
        })}

        {/* Unit Ground Contact Pedestals (Challenger Squad - Right) */}
        {enemySlots.map((slot) => {
          const sx = (slot.x / 100) * 1000;
          const sy = (slot.y / 100) * 600;
          const rx = 34;
          const ry = 13;

          return (
            <g key={`e-pad-${slot.slotKey}`} transform={`translate(${sx}, ${sy + 22})`}>
              {/* Natural Ground Contact Drop Shadow */}
              <ellipse rx={rx + 8} ry={ry + 5} fill="#000000" fillOpacity="0.5" filter={`url(#unitShadow_${uid})`} />
              
              {/* Glowing Elemental Rune Circle Fill */}
              <ellipse rx={rx} ry={ry} fill={`url(#enemySlotRune_${uid})`} />
              
              {/* Outer Rune Ring */}
              <ellipse
                rx={rx}
                ry={ry}
                fill="none"
                stroke={mapDef.palette.conduitEnemy}
                strokeWidth="1.6"
                strokeOpacity="0.7"
              />

              {/* Inner Dashed Magic Rune Ring */}
              <ellipse
                rx={rx * 0.72}
                ry={ry * 0.72}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                strokeDasharray="4 3"
                strokeOpacity="0.65"
              />

              {/* Center Elemental Glyph Spark */}
              <circle r="3" fill="#ffffff" opacity="0.85" />

              {/* Tactical Slot Identification Label */}
              <text
                x="0"
                y={ry + 13}
                textAnchor="middle"
                fontSize="8.5"
                fontFamily="ui-monospace, monospace"
                fontWeight="bold"
                fill={mapDef.palette.conduitEnemy}
                opacity="0.8"
                letterSpacing="1"
              >
                {slot.slotKey} · {slot.row}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
