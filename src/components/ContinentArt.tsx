/**
 * 2D / 2.5D Fantasy Continent Illustrations & Biome Art
 * Provides isometric elevated fantasy landmasses with biome topography,
 * glowing leylines, floating elements, and volumetric perspective depth.
 */

import React from 'react';
import { ElementType } from '../types';

interface ContinentArtProps {
  element: ElementType;
  className?: string;
  isHovered?: boolean;
  isLocked?: boolean;
}

export const ContinentArt: React.FC<ContinentArtProps> = ({
  element,
  className = 'w-full h-48',
  isHovered = false,
  isLocked = false,
}) => {
  switch (element) {
    case 'FIRE':
      return (
        <svg
          viewBox="0 0 320 200"
          className={`overflow-visible select-none transition-transform duration-500 ${
            isHovered && !isLocked ? 'scale-105' : ''
          } ${className}`}
        >
          <defs>
            <radialGradient id="fireGlow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="obsidianBase" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#292524" />
              <stop offset="60%" stopColor="#1c1917" />
              <stop offset="100%" stopColor="#0c0a09" />
            </linearGradient>
            <linearGradient id="magmaRiver" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="30%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <linearGradient id="cragLight" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#78716c" />
              <stop offset="100%" stopColor="#292524" />
            </linearGradient>
          </defs>

          {/* Ethereal Glow */}
          <circle cx="160" cy="110" r="90" fill="url(#fireGlow)" />

          {/* 2.5D Floating Island Base - Underbelly */}
          <path
            d="M50 110 L160 175 L270 110 L230 145 L160 190 L90 145 Z"
            fill="#1c1917"
            stroke="#44403c"
            strokeWidth="1.5"
          />
          {/* Jagged stalactites hanging into the void */}
          <polygon points="160,175 155,198 165,178" fill="#0c0a09" />
          <polygon points="120,155 116,182 125,158" fill="#1c1917" />
          <polygon points="200,155 195,185 204,158" fill="#0c0a09" />

          {/* 2.5D Island Surface Topography (Isometric Plateau) */}
          <polygon
            points="50,110 160,70 270,110 160,150"
            fill="url(#obsidianBase)"
            stroke="#57534e"
            strokeWidth="1.5"
          />

          {/* Mountain Peaks (Volcanic Caldera) */}
          {/* Back Peak */}
          <polygon points="140,75 160,35 180,75" fill="url(#cragLight)" />
          {/* Caldera Mouth & Lava Glow */}
          <polygon points="152,38 160,32 168,38 160,42" fill="#fef08a" />
          {/* Main Volcanic Crags */}
          <polygon points="105,95 130,50 155,95" fill="#44403c" />
          <polygon points="130,50 155,95 140,105" fill="#292524" />
          <polygon points="165,95 190,55 215,95" fill="url(#cragLight)" />
          <polygon points="190,55 215,95 200,105" fill="#1c1917" />

          {/* Molten Lava Rivers Flowing into Void */}
          <path
            d="M160 42 Q150 70 145 90 Q140 115 160 150 Q160 165 160 190"
            fill="none"
            stroke="url(#magmaRiver)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M148 85 Q175 100 210 120"
            fill="none"
            stroke="url(#magmaRiver)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M145 90 Q110 105 85 118"
            fill="none"
            stroke="url(#magmaRiver)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Obsidian Fortress / Dragon Spire Silhouette */}
          <polygon points="155,95 160,82 165,95" fill="#f97316" />
          <line x1="160" y1="82" x2="160" y2="76" stroke="#fbbf24" strokeWidth="2" />

          {/* Floating Embers / Sparks */}
          <circle cx="130" cy="55" r="2" fill="#fbbf24" className="animate-ping" opacity="0.8" />
          <circle cx="195" cy="45" r="1.5" fill="#f97316" />
          <circle cx="160" cy="25" r="2.5" fill="#fef08a" />
          <circle cx="230" cy="90" r="1.5" fill="#ef4444" />
          <circle cx="85" cy="85" r="2" fill="#f97316" />
        </svg>
      );

    case 'WATER':
      return (
        <svg
          viewBox="0 0 320 200"
          className={`overflow-visible select-none transition-transform duration-500 ${
            isHovered && !isLocked ? 'scale-105' : ''
          } ${className}`}
        >
          <defs>
            <radialGradient id="waterGlow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="oceanDeep" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#082f49" />
            </linearGradient>
            <linearGradient id="coralSand" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Ethereal Glow */}
          <circle cx="160" cy="110" r="90" fill="url(#waterGlow)" />

          {/* 2.5D Island Base - Undersea Reef Body */}
          <path
            d="M45 110 L160 175 L275 110 L240 148 L160 188 L80 148 Z"
            fill="#082f49"
            stroke="#0ea5e9"
            strokeWidth="1.2"
          />
          {/* Coral Stalactites / Underwater Rock Formations */}
          <polygon points="160,175 156,195 164,178" fill="#0369a1" />
          <polygon points="110,150 106,175 115,152" fill="#075985" />
          <polygon points="215,150 210,178 220,152" fill="#0c4a6e" />

          {/* 2.5D Island Surface Topography (Luminescent Lagoon & Coral Ring) */}
          <polygon
            points="45,110 160,68 275,110 160,152"
            fill="url(#oceanDeep)"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />

          {/* Inner Atoll & Swirling Tidal Vortex */}
          <ellipse
            cx="160"
            cy="110"
            rx="55"
            ry="24"
            fill="#0c4a6e"
            stroke="#7dd3fc"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <ellipse
            cx="160"
            cy="110"
            rx="32"
            ry="14"
            fill="#0284c7"
            stroke="#e0f2fe"
            strokeWidth="1.5"
          />
          <circle cx="160" cy="110" r="6" fill="#38bdf8" />

          {/* Coral Spires & Ancient Tideguard Pillars */}
          <polygon points="100,95 110,55 118,95" fill="#f43f5e" />
          <polygon points="108,55 118,95 113,98" fill="#be123c" />

          <polygon points="210,95 218,60 226,95" fill="#06b6d4" />
          <polygon points="218,60 226,95 222,98" fill="#0891b2" />

          <polygon points="152,78 160,42 168,78" fill="#38bdf8" />
          <circle cx="160" cy="40" r="4" fill="#e0f2fe" />

          {/* Cascading Waterfalls Falling from Edge */}
          <path
            d="M75 115 L75 155 M160 152 L160 188 M245 115 L245 155"
            stroke="#bae6fd"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Iridescent Sea Bubbles */}
          <circle cx="140" cy="70" r="2.5" fill="#7dd3fc" />
          <circle cx="180" cy="65" r="2" fill="#e0f2fe" />
          <circle cx="160" cy="85" r="1.5" fill="#38bdf8" />
        </svg>
      );

    case 'GRASS':
      return (
        <svg
          viewBox="0 0 320 200"
          className={`overflow-visible select-none transition-transform duration-500 ${
            isHovered && !isLocked ? 'scale-105' : ''
          } ${className}`}
        >
          <defs>
            <radialGradient id="grassGlow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#14532d" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="canopyTop" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="50%" stopColor="#166534" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>
            <linearGradient id="rootWood" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
          </defs>

          {/* Ethereal Nature Glow */}
          <circle cx="160" cy="110" r="90" fill="url(#grassGlow)" />

          {/* 2.5D Island Base - Ancient Roots Hanging in Mid-Air */}
          <path
            d="M48 110 L160 175 L272 110 L235 150 L160 192 L85 150 Z"
            fill="url(#rootWood)"
            stroke="#78350f"
            strokeWidth="1.5"
          />
          {/* Gnarled Root Tendrils */}
          <path
            d="M160 175 Q150 190 155 202 M120 155 Q110 175 115 188 M200 155 Q210 178 205 190"
            stroke="#92400e"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* 2.5D Surface Topography (Lush Emerald Canopy) */}
          <polygon
            points="48,110 160,68 272,110 160,152"
            fill="url(#canopyTop)"
            stroke="#4ade80"
            strokeWidth="1.5"
          />

          {/* Central Ancient World Tree (Yggdrasil Ancient) */}
          {/* Trunk */}
          <path
            d="M152 110 L154 55 Q160 48 166 55 L168 110 Z"
            fill="#78350f"
            stroke="#92400e"
            strokeWidth="1"
          />
          {/* Colossal Bioluminescent Canopy Leaves */}
          <circle cx="160" cy="45" r="26" fill="#16a34a" />
          <circle cx="145" cy="40" r="18" fill="#22c55e" opacity="0.9" />
          <circle cx="175" cy="40" r="18" fill="#15803d" />
          <circle cx="160" cy="30" r="15" fill="#4ade80" opacity="0.8" />
          {/* Tree Hollow Core Rune */}
          <circle cx="160" cy="65" r="3.5" fill="#fef08a" />

          {/* Surrounding Sylvan Grove & Fairy Ruin Arches */}
          <path
            d="M95 100 Q105 80 115 100"
            stroke="#86efac"
            strokeWidth="2.5"
            fill="none"
          />
          <circle cx="105" cy="85" r="2" fill="#86efac" />

          <path
            d="M205 100 Q215 80 225 100"
            stroke="#86efac"
            strokeWidth="2.5"
            fill="none"
          />
          <circle cx="215" cy="85" r="2" fill="#86efac" />

          {/* Floating Spores & Fireflies */}
          <circle cx="135" cy="55" r="2" fill="#bbf7d0" />
          <circle cx="185" cy="50" r="1.5" fill="#fef08a" />
          <circle cx="160" cy="18" r="2.5" fill="#86efac" />
        </svg>
      );

    case 'LIGHT':
      return (
        <svg
          viewBox="0 0 320 200"
          className={`overflow-visible select-none transition-transform duration-500 ${
            isHovered && !isLocked ? 'scale-105' : ''
          } ${className}`}
        >
          <defs>
            <radialGradient id="lightGlow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#713f12" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="astralMarble" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id="crystalGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>

          {/* Solar Radiance Halo */}
          <circle cx="160" cy="110" r="95" fill="url(#lightGlow)" />

          {/* Floating Astral Platform Underbelly */}
          <path
            d="M50 110 L160 172 L270 110 L232 148 L160 188 L88 148 Z"
            fill="#713f12"
            stroke="#ca8a04"
            strokeWidth="1.5"
          />
          {/* Hovering Celestial Shards Below Island */}
          <polygon points="160,172 156,192 164,175" fill="#eab308" />
          <polygon points="115,150 112,170 118,153" fill="#facc15" />
          <polygon points="205,150 202,170 208,153" fill="#facc15" />

          {/* 2.5D Island Surface (Golden Altar of Light) */}
          <polygon
            points="50,110 160,68 270,110 160,152"
            fill="url(#astralMarble)"
            stroke="#fef08a"
            strokeWidth="1.8"
          />

          {/* Central Sun Temple & Celestial Spire */}
          <polygon points="152,100 160,30 168,100" fill="url(#crystalGold)" />
          <polygon points="160,30 168,100 164,103" fill="#ca8a04" />

          {/* Floating Halo Ring above Citadel Apex */}
          <ellipse
            cx="160"
            cy="32"
            rx="18"
            ry="7"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
          />
          <circle cx="160" cy="32" r="5" fill="#ffffff" />

          {/* Flanking Seraphic Pillars */}
          <polygon points="95,98 102,52 108,98" fill="url(#crystalGold)" />
          <polygon points="212,98 218,52 225,98" fill="url(#crystalGold)" />

          {/* Beams of Dawn Light */}
          <line x1="160" y1="20" x2="160" y2="2" stroke="#fef08a" strokeWidth="2.5" />
          <line x1="140" y1="25" x2="128" y2="12" stroke="#fde047" strokeWidth="1.5" />
          <line x1="180" y1="25" x2="192" y2="12" stroke="#fde047" strokeWidth="1.5" />

          {/* Floating Star Gleams */}
          <circle cx="130" cy="65" r="2.5" fill="#ffffff" />
          <circle cx="190" cy="60" r="2" fill="#ffffff" />
          <circle cx="160" cy="80" r="2" fill="#ffffff" />
        </svg>
      );

    case 'DARK':
      return (
        <svg
          viewBox="0 0 320 200"
          className={`overflow-visible select-none transition-transform duration-500 ${
            isHovered && !isLocked ? 'scale-105' : ''
          } ${className}`}
        >
          <defs>
            <radialGradient id="voidGlow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3b0764" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="voidStone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#581c87" />
              <stop offset="60%" stopColor="#3b0764" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
            <linearGradient id="riftPlasma" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>
          </defs>

          {/* Nether Void Aura */}
          <circle cx="160" cy="110" r="95" fill="url(#voidGlow)" />

          {/* Shattered Dimensional Fragments Below */}
          <polygon points="160,172 153,195 167,176" fill="#1e1b4b" />
          <polygon points="105,152 98,178 112,156" fill="#3b0764" />
          <polygon points="215,152 208,178 222,156" fill="#1e1b4b" />
          {/* Floating Detached Void Shards */}
          <polygon points="60,135 68,122 75,138" fill="#581c87" />
          <polygon points="245,135 252,120 260,138" fill="#581c87" />

          {/* 2.5D Fractured Surface Topography */}
          <polygon
            points="50,110 160,68 270,110 160,152"
            fill="url(#voidStone)"
            stroke="#a855f7"
            strokeWidth="1.5"
          />

          {/* Dimensional Gravitational Rift in the center */}
          <path
            d="M130 95 Q160 80 190 95 Q175 125 145 120 Z"
            fill="#09090b"
            stroke="url(#riftPlasma)"
            strokeWidth="2"
          />
          {/* Singularity Core (Black Hole Eye) */}
          <circle cx="160" cy="105" r="7" fill="#09090b" />
          <circle cx="160" cy="105" r="4" fill="#c084fc" />

          {/* Void Monolith Spire of Chaos */}
          <polygon points="154,95 160,35 166,95" fill="#7e22ce" />
          <polygon points="160,35 166,95 163,98" fill="#3b0764" />
          {/* Floating Dark Crystal hovering at top */}
          <polygon points="160,20 165,28 160,36 155,28" fill="#e879f9" />

          {/* Shadow tendrils / violet lightning sparks */}
          <path
            d="M160 105 Q140 85 120 80 M160 105 Q180 85 200 80"
            stroke="#c084fc"
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
          />

          {/* Dark Cosmic Nebulae Particles */}
          <circle cx="125" cy="65" r="2" fill="#c084fc" />
          <circle cx="195" cy="65" r="2" fill="#e879f9" />
          <circle cx="160" cy="14" r="2.5" fill="#f43f5e" />
        </svg>
      );

    default:
      return null;
  }
};
