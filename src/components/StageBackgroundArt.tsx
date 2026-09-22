/**
 * StageBackgroundArt - Immersive Fantasy Stage & Continent Scenery
 * Renders distinct scenic backgrounds for every stage and continent in the Campaign Map.
 * For example:
 * - Ignis Caldera stages: volcanoes, magma rivers, lava tubes, basalt crossings, erupting caldera cores.
 * - Azure Archipelago stages: coral shallows, mist atolls, tidecaller shoals, sunken amphitheaters, whirlpools.
 * - Sylvan Canopy stages: verdant outskirts, luminescent glades, canopy walkways, Yggdrasil root apex.
 * - Astral Citadel stages: starlight ascents, crystal promenades, solar gatehouses, celestial seraph towers.
 * - The Abyssal Rift stages: void horizon edges, singularity shallows, dark nebulas, event horizon citadels.
 */

import React from 'react';
import { ElementType, PvEStage } from '../types';

interface StageBackgroundArtProps {
  stage?: PvEStage | null;
  continentId?: string;
  element?: ElementType;
  mode?: 'card' | 'drawer' | 'hero';
  className?: string;
}

export const StageBackgroundArt: React.FC<StageBackgroundArtProps> = ({
  stage,
  continentId,
  element = 'FIRE',
  mode = 'card',
  className = '',
}) => {
  // Determine effective element
  const effElement: ElementType =
    stage?.element ||
    element ||
    (continentId === 'continent_2'
      ? 'WATER'
      : continentId === 'continent_3'
      ? 'GRASS'
      : continentId === 'continent_4'
      ? 'LIGHT'
      : continentId === 'continent_5'
      ? 'DARK'
      : 'FIRE');

  const stageNum = stage?.stageNumber || 1;
  const stageKey = stage?.stageId || `stage_${effElement}_${stageNum}`;

  // Unique IDs for SVG gradients to prevent clashes across multiple cards
  const uid = `${stageKey}_${mode}_${Math.random().toString(36).substr(2, 5)}`;

  // =========================================================================
  // CONTINENT / HERO PANORAMA (e.g. Volcanic Caldera for Ignis Caldera)
  // =========================================================================
  if (mode === 'hero') {
    switch (effElement) {
      case 'FIRE':
        return (
          <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}>
            {/* Ambient Heat Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-rose-950/70 via-amber-950/40 to-slate-950" />
            
            <svg
              viewBox="0 0 1000 400"
              preserveAspectRatio="xMidYMid slice"
              className="w-full h-full opacity-65"
            >
              <defs>
                <linearGradient id={`sky_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#450a0a" />
                  <stop offset="60%" stopColor="#7c2d12" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id={`volcanoGrad_${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#44403c" />
                  <stop offset="40%" stopColor="#292524" />
                  <stop offset="100%" stopColor="#0c0a09" />
                </linearGradient>
                <linearGradient id={`magmaFall_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="35%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
                <radialGradient id={`craterGlow_${uid}`} cx="50%" cy="30%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="#ea580c" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Sky Background */}
              <rect width="1000" height="400" fill={`url(#sky_${uid})`} />

              {/* Volcanic Smoke & Ash Plumes */}
              <ellipse cx="500" cy="90" rx="180" ry="70" fill="#292524" opacity="0.6" />
              <ellipse cx="440" cy="65" rx="140" ry="55" fill="#1c1917" opacity="0.7" />
              <ellipse cx="560" cy="55" rx="160" ry="60" fill="#44403c" opacity="0.5" />
              <ellipse cx="500" cy="40" rx="120" ry="40" fill="#0f172a" opacity="0.8" />

              {/* Crater Eruption Glow */}
              <circle cx="500" cy="140" r="140" fill={`url(#craterGlow_${uid})`} />

              {/* Distant Volcanic Ridges */}
              <polygon points="0,280 180,180 320,290 480,210 650,300 820,190 1000,270 1000,400 0,400" fill="#1c1917" opacity="0.75" />

              {/* Main Ignis Volcano Peak */}
              <polygon
                points="240,400 460,140 485,150 515,150 540,140 760,400"
                fill={`url(#volcanoGrad_${uid})`}
              />

              {/* Caldera Rim & Magma Lake at Summit */}
              <ellipse cx="500" cy="148" rx="30" ry="8" fill="#fef08a" />
              <ellipse cx="500" cy="148" rx="20" ry="5" fill="#ffffff" />

              {/* Cascading Magma Rivers Down Volcano Flank */}
              <path
                d="M495 152 Q475 220 440 270 Q410 320 370 400"
                fill="none"
                stroke={`url(#magmaFall_${uid})`}
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M508 152 Q530 230 560 300 Q590 350 630 400"
                fill="none"
                stroke={`url(#magmaFall_${uid})`}
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M480 230 Q510 270 515 340 Q518 380 500 400"
                fill="none"
                stroke={`url(#magmaFall_${uid})`}
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* Foreground Basalt Jagged Cliffs & Lava Lakes */}
              <polygon points="0,340 120,300 250,360 400,320 550,370 700,310 880,360 1000,320 1000,400 0,400" fill="#0c0a09" />
              <rect x="0" y="380" width="1000" height="20" fill={`url(#magmaFall_${uid})`} opacity="0.8" />

              {/* Rising Fiery Ember Particles */}
              {[
                { cx: 480, cy: 110, r: 2.5, op: 0.9 },
                { cx: 520, cy: 95, r: 3, op: 0.8 },
                { cx: 460, cy: 70, r: 2, op: 0.7 },
                { cx: 540, cy: 120, r: 2.2, op: 0.85 },
                { cx: 390, cy: 220, r: 3.5, op: 0.75 },
                { cx: 610, cy: 250, r: 2.8, op: 0.8 },
                { cx: 430, cy: 160, r: 2, op: 0.9 },
                { cx: 570, cy: 180, r: 2.4, op: 0.85 },
                { cx: 320, cy: 280, r: 2, op: 0.6 },
                { cx: 680, cy: 290, r: 2.5, op: 0.65 },
              ].map((mote, i) => (
                <circle key={i} cx={mote.cx} cy={mote.cy} r={mote.r} fill="#fef08a" opacity={mote.op} />
              ))}
            </svg>

            {/* Bottom Fade to blend seamlessly with UI container */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
          </div>
        );

      case 'WATER':
        return (
          <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/70 via-blue-950/40 to-slate-950" />
            <svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice" className="w-full h-full opacity-60">
              <defs>
                <linearGradient id={`waterSky_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#082f49" />
                  <stop offset="50%" stopColor="#0369a1" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id={`oceanWaves_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>
              </defs>
              <rect width="1000" height="400" fill={`url(#waterSky_${uid})`} />
              {/* Distant Islands & Coral Arches */}
              <path d="M0 240 Q150 200 300 240 Q450 190 600 230 Q750 180 1000 240 L1000 400 L0 400 Z" fill="#082f49" opacity="0.8" />
              {/* Sea Spire Needles */}
              <polygon points="280,240 290,130 300,240" fill="#0c4a6e" />
              <polygon points="620,230 635,110 650,230" fill="#082f49" />
              <polygon points="780,240 790,150 800,240" fill="#0c4a6e" />
              {/* Sunken Coral Reefs */}
              <path d="M0 280 C200 260 350 300 500 280 C650 260 800 300 1000 270 L1000 400 L0 400 Z" fill={`url(#oceanWaves_${uid})`} opacity="0.65" />
              <path d="M0 340 C250 310 450 360 700 320 C850 300 950 340 1000 330 L1000 400 L0 400 Z" fill="#0284c7" opacity="0.8" />
              {/* Rising Luminous Water Bubbles */}
              {[
                { cx: 220, cy: 300, r: 4 },
                { cx: 240, cy: 260, r: 6 },
                { cx: 480, cy: 290, r: 5 },
                { cx: 650, cy: 270, r: 4 },
                { cx: 750, cy: 310, r: 7 },
              ].map((b, i) => (
                <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill="#38bdf8" opacity="0.5" />
              ))}
            </svg>
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
          </div>
        );

      case 'GRASS':
        return (
          <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 via-teal-950/40 to-slate-950" />
            <svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice" className="w-full h-full opacity-60">
              <defs>
                <linearGradient id={`grassSky_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#064e3b" />
                  <stop offset="60%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>
              <rect width="1000" height="400" fill={`url(#grassSky_${uid})`} />
              {/* Colossal Yggdrasil Ancient Tree Canopy Silhouette */}
              <circle cx="500" cy="110" rx="350" ry="120" fill="#064e3b" opacity="0.75" />
              <circle cx="200" cy="160" rx="180" ry="90" fill="#047857" opacity="0.6" />
              <circle cx="800" cy="150" rx="200" ry="100" fill="#047857" opacity="0.6" />
              {/* Massive Tree Trunks */}
              <path d="M440 400 Q480 280 470 160 L530 160 Q520 280 560 400 Z" fill="#022c22" />
              <path d="M150 400 Q190 300 210 200 L240 200 Q210 310 210 400 Z" fill="#022c22" opacity="0.7" />
              <path d="M780 400 Q760 300 750 200 L780 200 Q790 310 830 400 Z" fill="#022c22" opacity="0.7" />
              {/* Hanging Bioluminescent Vine Tendrils & Spores */}
              {[
                { cx: 350, cy: 220, r: 3.5 },
                { cx: 480, cy: 190, r: 4 },
                { cx: 540, cy: 240, r: 3 },
                { cx: 620, cy: 200, r: 4.5 },
              ].map((spore, i) => (
                <circle key={i} cx={spore.cx} cy={spore.cy} r={spore.r} fill="#6ee7b7" opacity="0.8" />
              ))}
            </svg>
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
          </div>
        );

      case 'LIGHT':
        return (
          <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-b from-amber-950/60 via-yellow-950/30 to-slate-950" />
            <svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice" className="w-full h-full opacity-60">
              <defs>
                <linearGradient id={`lightSky_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#78350f" />
                  <stop offset="50%" stopColor="#b45309" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>
              <rect width="1000" height="400" fill={`url(#lightSky_${uid})`} />
              {/* Blazing Solar Corona */}
              <circle cx="500" cy="110" r="90" fill="#fef08a" opacity="0.5" />
              <circle cx="500" cy="110" r="50" fill="#ffffff" opacity="0.8" />
              {/* Floating Ivory Palace Spires */}
              <polygon points="460,320 480,160 500,320" fill="#fde047" opacity="0.85" />
              <polygon points="500,320 520,140 540,320" fill="#fef08a" />
              <polygon points="320,340 335,210 350,340" fill="#fef08a" opacity="0.7" />
              <polygon points="650,340 665,190 680,340" fill="#fef08a" opacity="0.7" />
              {/* Rolling Golden Cloudbanks */}
              <ellipse cx="250" cy="340" rx="220" ry="80" fill="#78350f" opacity="0.8" />
              <ellipse cx="750" cy="340" rx="240" ry="90" fill="#78350f" opacity="0.8" />
              <ellipse cx="500" cy="370" rx="300" ry="90" fill="#451a03" opacity="0.9" />
            </svg>
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
          </div>
        );

      case 'DARK':
      default:
        return (
          <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-b from-purple-950/70 via-indigo-950/40 to-slate-950" />
            <svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice" className="w-full h-full opacity-60">
              <defs>
                <radialGradient id={`voidSingularity_${uid}`} cx="50%" cy="40%" r="50%">
                  <stop offset="0%" stopColor="#000000" />
                  <stop offset="25%" stopColor="#581c87" />
                  <stop offset="60%" stopColor="#7e22ce" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="1000" height="400" fill="#090514" />
              {/* Singularity Black Hole & Accretion Halo */}
              <ellipse cx="500" cy="160" rx="220" ry="50" fill="#a855f7" opacity="0.5" transform="rotate(-15 500 160)" />
              <circle cx="500" cy="160" r="55" fill="#000000" stroke="#c084fc" strokeWidth="4" />
              {/* Floating Shattered Asteroid Fragments */}
              <polygon points="200,240 230,220 260,250 240,280 190,260" fill="#1e1b4b" />
              <polygon points="750,220 790,200 820,230 800,260 760,250" fill="#1e1b4b" />
              <polygon points="380,310 400,290 420,320 390,330" fill="#2e1065" />
              <polygon points="620,290 640,270 660,300 630,310" fill="#2e1065" />
            </svg>
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
          </div>
        );
    }
  }

  // =========================================================================
  // STAGE-SPECIFIC ILLUSTRATED ARTWORK (Mode 'card' or 'drawer')
  // Render scenery tailored specifically to each stage's name and biome!
  // =========================================================================
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none rounded-inherit ${className}`}
    >
      {renderStageSvg(effElement, stageNum, stage?.name || '', uid, (mode === 'drawer' || mode === 'battle' || mode === 'hero') ? 'drawer' : 'card')}
      
      {/* Readability scrim: Darkens bottom/edges so stage text, numbers and buttons remain 100% legible */}
      <div
        className={`absolute inset-0 ${
          mode === 'card'
            ? 'bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30'
            : 'bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent'
        }`}
      />
    </div>
  );
};

// =========================================================================
// STAGE TERRAIN INTEL HELPER
// =========================================================================
export function getStageTerrainInfo(stage: PvEStage): { terrain: string; atmosphere: string } {
  const { chapter, stageNumber } = stage;
  const element = stage.element;

  if (element === 'FIRE' || chapter === 1) {
    const fireTerrains: Record<number, { terrain: string; atmosphere: string }> = {
      1: { terrain: 'Smoking Basalt Foothills', atmosphere: 'Rising Magma Embers & Thermal Fissures' },
      2: { terrain: 'Narrow Scorched Canyon Defile', atmosphere: 'Glowing Red Rock Fissures & Heat Shimmer' },
      3: { terrain: 'Hexagonal Basalt Crossing', atmosphere: 'Boiling Magma River & Stepping Columns' },
      4: { terrain: 'Sulfur Steppes & Geysers', atmosphere: 'Pungent Sulfuric Steam & Mud Fumaroles' },
      5: { terrain: 'Ashen Stronghold Battlements', atmosphere: 'Obsidian Citadel & Flaming Braziers' },
      6: { terrain: 'Obsidian Magma Caverns', atmosphere: 'Hanging Stalactites & Boiling Lava Pools' },
      7: { terrain: 'Arched Lava Tube Tunnels', atmosphere: 'Flowing Liquid Fire & Molten Torrents' },
      8: { terrain: 'Cinder Spire Pinnacles', atmosphere: 'Dense Ash Storms & Red Volcanic Lightning' },
      9: { terrain: 'Dragoncrest Crater Ramparts', atmosphere: 'Dragon-Skulled Cliffs & Scorching Updrafts' },
      10: { terrain: 'Active Caldera Volcano Core', atmosphere: 'Lava Fountains, Magma Sea & Ash Plume' },
    };
    return fireTerrains[stageNumber] || { terrain: 'Volcanic Caldera Ridge', atmosphere: 'Magma & Ash' };
  }

  if (element === 'WATER' || chapter === 2) {
    const waterTerrains: Record<number, { terrain: string; atmosphere: string }> = {
      1: { terrain: 'Shallow Coral Reefs & Atolls', atmosphere: 'Turquoise Waters & Luminous Sea Life' },
      2: { terrain: 'Circular Mist Veil Atoll', atmosphere: 'Ghostly Sea Mist & Calm Lagoon' },
      3: { terrain: 'Coastal Tidecaller Shoals', atmosphere: 'Crashing Ocean Breakers & Sea Spray' },
      4: { terrain: 'Luminous Pearl Grotto', atmosphere: 'Iridescent Giant Pearls & Cave Waters' },
      5: { terrain: 'Barrier Reef Sunken Citadel', atmosphere: 'Submerged Stone Towers & Coral Towers' },
      6: { terrain: 'Siren Trench Ocean Drop-Off', atmosphere: 'Bioluminescent Jellyfish & Twilight Depths' },
      7: { terrain: 'Sunken Classical Amphitheater', atmosphere: 'Submerged Marble Colonnades & Kelp' },
      8: { terrain: 'Whirlpool Crucible Maelstrom', atmosphere: 'Swirling Oceanic Vortex & Torrential Currents' },
      9: { terrain: 'Abyssal Leviathan Gate', atmosphere: 'Colossal Sea Statues & Trench Chasm' },
      10: { terrain: 'Poseidon Deep Trench Apex', atmosphere: 'Primordial Benthic Palace & Hydrothermal Glow' },
    };
    return waterTerrains[stageNumber] || { terrain: 'Azure Ocean Shelf', atmosphere: 'Tides & Coral' };
  }

  if (element === 'GRASS' || chapter === 3) {
    const grassTerrains: Record<number, { terrain: string; atmosphere: string }> = {
      1: { terrain: 'Sunlit Forest Meadow Fringe', atmosphere: 'Wild Floral Blooms & Verdant Hills' },
      2: { terrain: 'Dense Emerald Jungle Thicket', atmosphere: 'Tangled Roots, Hanging Moss & Ferns' },
      3: { terrain: 'Luminescent Mushroom Glade', atmosphere: 'Bioluminescent Turquoise Spores & Fairy Wisps' },
      4: { terrain: 'Twisted Bramble Hollow', atmosphere: 'Thorny Briar Arches & Secret Forest Stream' },
      5: { terrain: 'Heartwood Redwood Bastion', atmosphere: 'Living Tree Hollow Fort & Bark Watchtowers' },
      6: { terrain: 'Treetop Canopy Suspension Walkways', atmosphere: 'High Rope Bridges in the Mist' },
      7: { terrain: 'Whispering Alpine Pine Ridge', atmosphere: 'Foggy Evergreen Silhouettes & Cool Wind' },
      8: { terrain: 'Spiral Ancient Grove Spire', atmosphere: 'Elder-Wood Spires Carved to the Sky' },
      9: { terrain: 'Fey Dragon Canyon Run', atmosphere: 'Giant Blossoms & Floating Spore Clouds' },
      10: { terrain: 'Yggdrasil World Tree Root Apex', atmosphere: 'Pulsing Emerald Leylines & Ancient Heartwood' },
    };
    return grassTerrains[stageNumber] || { terrain: 'Primeval Canopy', atmosphere: 'Ancient Roots & Spores' };
  }

  if (element === 'LIGHT' || chapter === 4) {
    const lightTerrains: Record<number, { terrain: string; atmosphere: string }> = {
      1: { terrain: 'Floating Starlight Stairway', atmosphere: 'Golden Cloud Ocean & Starry Skies' },
      2: { terrain: 'Quartz Crystal Promenade', atmosphere: 'Prismatic Light Pillars & Polished Marble' },
      3: { terrain: 'Radiant Dawn Cloudfields', atmosphere: 'Billowing Sunset Clouds & Sunbeams' },
      4: { terrain: 'Solar Gatehouse Portal', atmosphere: 'Gleaming Gold Archways & Solar Halos' },
      5: { terrain: 'Silver Seraph Watchtower', atmosphere: 'Soaring Spire & Angelic Wing Sculptures' },
      6: { terrain: 'Prism Sanctum Cathedral', atmosphere: 'Refracted Rainbow Beams & Crystal Vaults' },
      7: { terrain: 'Floating Celestial Courtyard', atmosphere: 'Marble Plaza & Starlight Fountains' },
      8: { terrain: 'Nova Colosseum Sky Arena', atmosphere: 'Circular Battle Ring & Orbiting Sun Sparks' },
      9: { terrain: 'Dawn Spire Throne Gate', atmosphere: 'Golden Balcony & Infinite Horizon' },
      10: { terrain: 'Citadel Apex of Supreme Radiance', atmosphere: 'Blinding Solar Corona & Incandescent Throne' },
    };
    return lightTerrains[stageNumber] || { terrain: 'Celestial Spire', atmosphere: 'Golden Sunbeams & Starlight' };
  }

  // DARK / Chapter 5
  const darkTerrains: Record<number, { terrain: string; atmosphere: string }> = {
    1: { terrain: 'Floating Void Island Horizon', atmosphere: 'Shattered Obsidian Edge & Starry Abyss' },
    2: { terrain: 'Gravitational Singularity Shallows', atmosphere: 'Warped Space & Concentric Gravity Rings' },
    3: { terrain: 'Eclipsed Dark Star Ruins', atmosphere: 'Alien Monoliths Lit by Dark Eclipse' },
    4: { terrain: 'Swirling Dark Nebula Caverns', atmosphere: 'Violet & Magenta Cosmic Dust Clouds' },
    5: { terrain: 'Event Horizon Gothic Citadel', atmosphere: 'Fortress Anchored on Black Hole Rim' },
    6: { terrain: 'Graviton Rift Asteroid Path', atmosphere: 'Shattered Rocks Linked by Purple Tractor Beams' },
    7: { terrain: 'Floating Nether Bastion', atmosphere: 'Dark Warp Fires & Purple Void Lightning' },
    8: { terrain: 'Abyssal Void Vault', atmosphere: 'Obsidian Monoliths Circling Antimatter Sphere' },
    9: { terrain: 'Chasm of Dimensional Despair', atmosphere: 'Space Tear Bleeding Purple Cosmic Energy' },
    10: { terrain: 'Shattered Singularity Core', atmosphere: 'Supermassive Black Hole & Violet Accretion Disk' },
  };
  return darkTerrains[stageNumber] || { terrain: 'Cosmic Singularity Rift', atmosphere: 'Void Energy & Gravity Waves' };
}

function renderStageSvg(
  element: ElementType,
  stageNum: number,
  stageName: string,
  uid: string,
  mode: 'card' | 'drawer' | 'battle' | 'hero' = 'card'
) {
  const isDrawer = mode === 'drawer' || mode === 'battle' || mode === 'hero';
  const width = isDrawer ? 600 : 200;
  const height = isDrawer ? 300 : 180;

  switch (element) {
    // ---------------------------------------------------------------------
    // FIRE REALM (Ignis Caldera): Magma, Volcanoes, Basalt, Lava Tubes, Ash
    // ---------------------------------------------------------------------
    case 'FIRE': {
      if (stageNum === 1) {
        // 1-1: Ember Foothills - Rolling smoking volcanic foothills with sparks
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <defs>
              <linearGradient id={`bg_${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#450a0a" />
                <stop offset="100%" stopColor="#1c1917" />
              </linearGradient>
            </defs>
            <rect width={width} height={height} fill={`url(#bg_${uid})`} />
            {/* Distant smoke */}
            <circle cx={width * 0.75} cy={height * 0.3} r={height * 0.35} fill="#78716c" opacity="0.2" />
            <circle cx={width * 0.3} cy={height * 0.25} r={height * 0.25} fill="#ea580c" opacity="0.25" />
            {/* Rolling foothills */}
            <path d={`M0 ${height * 0.6} Q${width * 0.3} ${height * 0.45} ${width * 0.6} ${height * 0.65} T${width} ${height * 0.55} L${width} ${height} L0 ${height} Z`} fill="#292524" />
            <path d={`M0 ${height * 0.75} Q${width * 0.5} ${height * 0.6} ${width} ${height * 0.75} L${width} ${height} L0 ${height} Z`} fill="#1c1917" />
            {/* Glowing fissures */}
            <path d={`M${width * 0.2} ${height * 0.85} Q${width * 0.4} ${height * 0.8} ${width * 0.7} ${height * 0.9}`} stroke="#f97316" strokeWidth="2" fill="none" />
            {/* Drifting embers */}
            <circle cx={width * 0.35} cy={height * 0.4} r="2" fill="#fef08a" opacity="0.9" />
            <circle cx={width * 0.65} cy={height * 0.35} r="2.5" fill="#f97316" opacity="0.8" />
            <circle cx={width * 0.8} cy={height * 0.5} r="1.8" fill="#fef08a" opacity="0.85" />
          </svg>
        );
      }

      if (stageNum === 2) {
        // 1-2: Scorched Defile - Steep scorched canyon walls with fissures
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#3f0a0a" />
            {/* Fiery Canyon Sky */}
            <polygon points={`0,0 ${width * 0.45},0 ${width * 0.5},${height * 0.7} ${width * 0.3},${height} 0,${height}`} fill="#1c1917" />
            <polygon points={`${width},0 ${width * 0.55},0 ${width * 0.5},${height * 0.7} ${width * 0.7},${height} ${width},${height}`} fill="#292524" />
            {/* Canyon Floor Lava Crack */}
            <path d={`M${width * 0.48} 0 L${width * 0.5} ${height}`} stroke="#f97316" strokeWidth="4" />
            <path d={`M${width * 0.5} ${height * 0.4} L${width * 0.45} ${height * 0.7}`} stroke="#fef08a" strokeWidth="2" />
          </svg>
        );
      }

      if (stageNum === 3) {
        // 1-3: Basalt Crossing - Hexagonal columns over magma river
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#292524" />
            {/* Surging Molten River */}
            <rect x="0" y={height * 0.55} width={width} height={height * 0.3} fill="#ea580c" />
            <path d={`M0 ${height * 0.65} Q${width * 0.5} ${height * 0.75} ${width} ${height * 0.65}`} stroke="#fef08a" strokeWidth="4" fill="none" />
            {/* Hexagonal Basalt Stepping Columns */}
            {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => (
              <polygon
                key={i}
                points={`${width * ratio - 12},${height * 0.5 + (i % 2) * 10} ${width * ratio},${height * 0.45 + (i % 2) * 10} ${width * ratio + 12},${height * 0.5 + (i % 2) * 10} ${width * ratio + 12},${height * 0.75 + (i % 2) * 10} ${width * ratio - 12},${height * 0.75 + (i % 2) * 10}`}
                fill="#0c0a09"
                stroke="#57534e"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        );
      }

      if (stageNum === 4) {
        // 1-4: Sulfur Steppes - Yellow-green volcanic fumaroles & geysers
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#2e1005" />
            {/* Sulfuric Geyser Jets */}
            <polygon points={`${width * 0.3},${height * 0.7} ${width * 0.28},${height * 0.15} ${width * 0.32},${height * 0.7}`} fill="#fef08a" opacity="0.6" />
            <polygon points={`${width * 0.7},${height * 0.75} ${width * 0.68},${height * 0.25} ${width * 0.72},${height * 0.75}`} fill="#fef08a" opacity="0.5" />
            {/* Steppe Crags & Sulfur Pools */}
            <polygon points={`0,${height * 0.7} ${width * 0.4},${height * 0.65} ${width * 0.7},${height * 0.75} ${width},${height * 0.65} ${width},${height} 0,${height}`} fill="#1c1917" />
            <ellipse cx={width * 0.5} cy={height * 0.82} rx={width * 0.2} ry={height * 0.08} fill="#ca8a04" opacity="0.75" />
          </svg>
        );
      }

      if (stageNum === 5) {
        // 1-5: Ashen Stronghold (Mid-Boss) - Fortress walls with flaming braziers
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#1c1917" />
            <rect x="0" y="0" width={width} height={height * 0.5} fill="#450a0a" opacity="0.6" />
            {/* Fortress Battlements */}
            <polygon points={`${width * 0.1},${height} ${width * 0.1},${height * 0.45} ${width * 0.3},${height * 0.45} ${width * 0.3},${height * 0.55} ${width * 0.7},${height * 0.55} ${width * 0.7},${height * 0.45} ${width * 0.9},${height * 0.45} ${width * 0.9},${height}`} fill="#0c0a09" stroke="#78716c" strokeWidth="1" />
            {/* Flaming Braziers on Towers */}
            <circle cx={width * 0.2} cy={height * 0.4} r="7" fill="#f97316" />
            <circle cx={width * 0.8} cy={height * 0.4} r="7" fill="#f97316" />
            <circle cx={width * 0.2} cy={height * 0.38} r="3" fill="#fef08a" />
            <circle cx={width * 0.8} cy={height * 0.38} r="3" fill="#fef08a" />
            {/* Iron Gate Arch */}
            <path d={`M${width * 0.42} ${height} L${width * 0.42} ${height * 0.65} Q${width * 0.5} ${height * 0.58} ${width * 0.58} ${height * 0.65} L${width * 0.58} ${height} Z`} fill="#f97316" opacity="0.8" />
          </svg>
        );
      }

      if (stageNum === 6) {
        // 1-6: Obsidian Caverns - Underground cave with magma stalactites
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#0c0a09" />
            {/* Cavern Ceiling Stalactites */}
            <polygon points={`0,0 ${width * 0.15},${height * 0.35} ${width * 0.3},0`} fill="#1c1917" />
            <polygon points={`${width * 0.35},0 ${width * 0.45},${height * 0.45} ${width * 0.55},0`} fill="#292524" />
            <polygon points={`${width * 0.7},0 ${width * 0.82},${height * 0.4} ${width * 0.95},0`} fill="#1c1917" />
            {/* Boiling Magma Floor Lake */}
            <ellipse cx={width * 0.5} cy={height * 0.88} rx={width * 0.45} ry={height * 0.18} fill="#ea580c" />
            <ellipse cx={width * 0.5} cy={height * 0.88} rx={width * 0.25} ry={height * 0.08} fill="#fef08a" />
          </svg>
        );
      }

      if (stageNum === 7) {
        // 1-7: Lava Tube Tunnels - Arched volcanic tunnel with flowing river
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#1c1917" />
            {/* Tunnel Arch */}
            <ellipse cx={width * 0.5} cy={height * 0.4} rx={width * 0.4} ry={height * 0.4} fill="#450a0a" />
            <ellipse cx={width * 0.5} cy={height * 0.45} rx={width * 0.25} ry={height * 0.25} fill="#ea580c" />
            <ellipse cx={width * 0.5} cy={height * 0.45} rx={width * 0.1} ry={height * 0.1} fill="#fef08a" />
            {/* Lava Stream exiting tunnel */}
            <polygon points={`${width * 0.4},${height * 0.6} ${width * 0.6},${height * 0.6} ${width * 0.8},${height} ${width * 0.2},${height}`} fill="#f97316" />
          </svg>
        );
      }

      if (stageNum === 8) {
        // 1-8: Cinder Spire Trail - Jagged mountain spires with ash storms
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#292524" />
            {/* Sharp Spires */}
            <polygon points={`${width * 0.2},${height} ${width * 0.3},${height * 0.2} ${width * 0.4},${height}`} fill="#0c0a09" />
            <polygon points={`${width * 0.5},${height} ${width * 0.65},${height * 0.1} ${width * 0.8},${height}`} fill="#1c1917" />
            {/* Red Lightning in Ash Clouds */}
            <path d={`M${width * 0.5} 0 L${width * 0.52} ${height * 0.2} L${width * 0.48} ${height * 0.3} L${width * 0.55} ${height * 0.5}`} stroke="#ef4444" strokeWidth="2" fill="none" />
          </svg>
        );
      }

      if (stageNum === 9) {
        // 1-9: Dragoncrest Ramparts - High volcanic ridge overlooking fiery crater
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#450a0a" />
            {/* Dragoncrest Ridge */}
            <path d={`M0 ${height * 0.8} L${width * 0.4} ${height * 0.3} L${width * 0.48} ${height * 0.4} L${width * 0.6} ${height * 0.25} L${width} ${height * 0.8} L${width} ${height} L0 ${height} Z`} fill="#0c0a09" />
            <circle cx={width * 0.5} cy={height * 0.2} r="18" fill="#f97316" opacity="0.6" />
          </svg>
        );
      }

      // 1-10: Caldera Core (Final Boss) - Erupting central volcano & magma sea!
      return (
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <defs>
            <radialGradient id={`calderaErupt_${uid}`} cx="50%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="30%" stopColor="#f97316" />
              <stop offset="70%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#1c1917" />
            </radialGradient>
          </defs>
          <rect width={width} height={height} fill={`url(#calderaErupt_${uid})`} />
          {/* Active Volcano Silhouette */}
          <polygon points={`0,${height} ${width * 0.35},${height * 0.35} ${width * 0.65},${height * 0.35} ${width},${height}`} fill="#0c0a09" />
          {/* Exploding Magma Plume */}
          <circle cx={width * 0.5} cy={height * 0.3} r={height * 0.25} fill="#fef08a" opacity="0.85" />
          <path d={`M${width * 0.4} ${height * 0.35} Q${width * 0.3} ${height * 0.1} ${width * 0.2} ${height * 0.4}`} stroke="#f97316" strokeWidth="4" fill="none" />
          <path d={`M${width * 0.6} ${height * 0.35} Q${width * 0.7} ${height * 0.1} ${width * 0.8} ${height * 0.4}`} stroke="#f97316" strokeWidth="4" fill="none" />
          {/* Magma Sea Floor */}
          <rect x="0" y={height * 0.75} width={width} height={height * 0.25} fill="#ea580c" />
        </svg>
      );
    }

    // ---------------------------------------------------------------------
    // WATER REALM (Azure Archipelago): Ocean, Corals, Sunken Atolls, Trenches
    // ---------------------------------------------------------------------
    case 'WATER': {
      if (stageNum === 1) {
        // 2-1: Coral Shallows - Shallow turquoise waters & branching corals
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#0369a1" />
            <path d={`M0 ${height * 0.4} Q${width * 0.5} ${height * 0.3} ${width} ${height * 0.4} L${width} ${height} L0 ${height} Z`} fill="#0284c7" />
            {/* Branching Corals */}
            <path d={`M${width * 0.2} ${height} L${width * 0.2} ${height * 0.55} L${width * 0.15} ${height * 0.4} M${width * 0.2} ${height * 0.65} L${width * 0.25} ${height * 0.45}`} stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d={`M${width * 0.75} ${height} L${width * 0.75} ${height * 0.5} L${width * 0.7} ${height * 0.35} M${width * 0.75} ${height * 0.6} L${width * 0.82} ${height * 0.42}`} stroke="#fb7185" strokeWidth="4" strokeLinecap="round" fill="none" />
            <ellipse cx={width * 0.5} cy={height * 0.85} rx={width * 0.35} ry={height * 0.15} fill="#0c4a6e" />
            <circle cx={width * 0.4} cy={height * 0.35} r="3" fill="#bae6fd" opacity="0.7" />
          </svg>
        );
      }
      if (stageNum === 2) {
        // 2-2: Mist Veil Atoll - Circular lagoon & mist
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#082f49" />
            <ellipse cx={width * 0.5} cy={height * 0.65} rx={width * 0.45} ry={height * 0.3} fill="#0284c7" stroke="#38bdf8" strokeWidth="3" />
            <ellipse cx={width * 0.5} cy={height * 0.65} rx={width * 0.25} ry={height * 0.16} fill="#0369a1" />
            <rect x="0" y={height * 0.2} width={width} height={height * 0.3} fill="#bae6fd" opacity="0.2" />
          </svg>
        );
      }
      if (stageNum === 3) {
        // 2-3: Tidecaller Shoals - Crashing breakers against wet rocks
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#0c4a6e" />
            <path d={`M0 ${height * 0.55} Q${width * 0.25} ${height * 0.4} ${width * 0.5} ${height * 0.55} T${width} ${height * 0.5} L${width} ${height} L0 ${height} Z`} fill="#0284c7" />
            <polygon points={`${width * 0.15},${height} ${width * 0.25},${height * 0.45} ${width * 0.35},${height}`} fill="#1e293b" />
            <polygon points={`${width * 0.65},${height} ${width * 0.78},${height * 0.38} ${width * 0.9},${height}`} fill="#0f172a" />
            <ellipse cx={width * 0.25} cy={height * 0.46} rx="15" ry="5" fill="#e0f2fe" opacity="0.8" />
          </svg>
        );
      }
      if (stageNum === 4) {
        // 2-4: Pearl Grotto - Luminous sea cave with giant pearl
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#082f49" />
            {/* Cave Arch */}
            <path d={`M0 0 L0 ${height} L${width * 0.3} ${height} Q${width * 0.5} ${height * 0.25} ${width * 0.7} ${height} L${width} ${height} L${width} 0 Z`} fill="#0f172a" />
            {/* Glowing Giant Pearl */}
            <circle cx={width * 0.5} cy={height * 0.65} r={height * 0.18} fill="#f8fafc" />
            <circle cx={width * 0.5} cy={height * 0.65} r={height * 0.25} fill="#38bdf8" opacity="0.35" />
          </svg>
        );
      }
      if (stageNum === 5) {
        // 2-5: Barrier Reef Citadel (Mid-Boss) - Sunken castle towers
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#075985" />
            <rect x={width * 0.35} y={height * 0.35} width={width * 0.3} height={height * 0.65} fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
            <polygon points={`${width * 0.32},${height * 0.35} ${width * 0.5},${height * 0.15} ${width * 0.68},${height * 0.35}`} fill="#0284c7" />
            <circle cx={width * 0.5} cy={height * 0.45} r="6" fill="#38bdf8" />
          </svg>
        );
      }
      if (stageNum === 6) {
        // 2-6: Siren Trench Descent - Deep blue drop-off with swimming jellyfish
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#0369a1" />
            <polygon points={`0,0 0,${height} ${width},${height} ${width},${height * 0.5}`} fill="#082f49" />
            {/* Glowing Jellyfish */}
            <circle cx={width * 0.6} cy={height * 0.35} r="8" fill="#e0e7ff" opacity="0.8" />
            <path d={`M${width * 0.58} ${height * 0.38} L${width * 0.56} ${height * 0.55} M${width * 0.62} ${height * 0.38} L${width * 0.64} ${height * 0.56}`} stroke="#a5b4fc" strokeWidth="1.5" />
          </svg>
        );
      }
      if (stageNum === 7) {
        // 2-7: Sunken Amphitheater - Submerged Roman columns
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#0c4a6e" />
            {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => (
              <rect key={i} x={width * ratio - 6} y={height * 0.35} width="12" height={height * 0.65} fill="#1e293b" stroke="#38bdf8" strokeWidth="0.5" />
            ))}
            <rect x={width * 0.15} y={height * 0.3} width={width * 0.7} height="8" fill="#334155" />
          </svg>
        );
      }
      if (stageNum === 8) {
        // 2-8: Whirlpool Crucible - Colossal swirling maelstrom
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#082f49" />
            <ellipse cx={width * 0.5} cy={height * 0.55} rx={width * 0.45} ry={height * 0.35} fill="#0284c7" />
            <ellipse cx={width * 0.5} cy={height * 0.55} rx={width * 0.3} ry={height * 0.22} fill="#075985" />
            <ellipse cx={width * 0.5} cy={height * 0.55} rx={width * 0.15} ry={height * 0.12} fill="#0f172a" />
            <circle cx={width * 0.5} cy={height * 0.55} r="8" fill="#38bdf8" />
          </svg>
        );
      }
      if (stageNum === 9) {
        // 2-9: Abyssal Trench Gate - Oceanic statue pillars
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#082f49" />
            <polygon points={`${width * 0.15},${height} ${width * 0.25},${height * 0.2} ${width * 0.35},${height}`} fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
            <polygon points={`${width * 0.65},${height} ${width * 0.75},${height * 0.2} ${width * 0.85},${height}`} fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
            <path d={`M${width * 0.35} ${height * 0.8} Q${width * 0.5} ${height * 0.6} ${width * 0.65} ${height * 0.8}`} stroke="#38bdf8" strokeWidth="3" fill="none" />
          </svg>
        );
      }
      // 2-10: Poseidon Trench Apex (Boss) - Deep sea benthic sovereign palace
      return (
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <rect width={width} height={height} fill="#082f49" />
          <polygon points={`0,${height} ${width * 0.5},${height * 0.15} ${width},${height}`} fill="#0369a1" />
          <circle cx={width * 0.5} cy={height * 0.4} r={height * 0.25} fill="#38bdf8" opacity="0.45" />
          <circle cx={width * 0.5} cy={height * 0.4} r="12" fill="#e0f2fe" />
          {/* Hydrothermal vents */}
          <line x1={width * 0.3} y1={height} x2={width * 0.3} y2={height * 0.6} stroke="#38bdf8" strokeWidth="3" />
          <line x1={width * 0.7} y1={height} x2={width * 0.7} y2={height * 0.6} stroke="#38bdf8" strokeWidth="3" />
        </svg>
      );
    }

    // ---------------------------------------------------------------------
    // GRASS REALM (Sylvan Canopy): Primeval Forests, Ancient Trees, Glades
    // ---------------------------------------------------------------------
    case 'GRASS': {
      if (stageNum === 3) {
        // 3-3: Luminescent Glade - Giant glowing mushrooms
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#064e3b" />
            <rect x={width * 0.32} y={height * 0.55} width="8" height={height * 0.45} fill="#14532d" />
            <path d={`M${width * 0.2} ${height * 0.55} Q${width * 0.36} ${height * 0.3} ${width * 0.52} ${height * 0.55} Z`} fill="#06b6d4" />
            <circle cx={width * 0.36} cy={height * 0.45} r="3" fill="#a5f3fc" />
            <rect x={width * 0.65} y={height * 0.6} width="6" height={height * 0.4} fill="#14532d" />
            <path d={`M${width * 0.55} ${height * 0.6} Q${width * 0.68} ${height * 0.42} ${width * 0.81} ${height * 0.6} Z`} fill="#a855f7" />
            <circle cx={width * 0.5} cy={height * 0.3} r="2.5" fill="#6ee7b7" />
          </svg>
        );
      }
      if (stageNum === 6) {
        // 3-6: Canopy Walkways - High suspension bridges
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#022c22" />
            <rect x="0" y="0" width={width * 0.25} height={height} fill="#14532d" />
            <rect x={width * 0.75} y="0" width={width * 0.25} height={height} fill="#14532d" />
            <path d={`M${width * 0.25} ${height * 0.45} Q${width * 0.5} ${height * 0.6} ${width * 0.75} ${height * 0.45}`} stroke="#ca8a04" strokeWidth="3" fill="none" />
            <path d={`M${width * 0.25} ${height * 0.4} Q${width * 0.5} ${height * 0.55} ${width * 0.75} ${height * 0.4}`} stroke="#ca8a04" strokeWidth="1.5" fill="none" />
          </svg>
        );
      }
      if (stageNum === 10) {
        // 3-10: Yggdrasil Root Apex (Boss) - Ancient World Tree heart
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#022c22" />
            <circle cx={width * 0.5} cy={height * 0.4} r={height * 0.35} fill="#059669" opacity="0.5" />
            <circle cx={width * 0.5} cy={height * 0.4} r="18" fill="#a7f3d0" />
            <path d={`M${width * 0.35} ${height} Q${width * 0.45} ${height * 0.6} ${width * 0.5} ${height * 0.4} Q${width * 0.55} ${height * 0.6} ${width * 0.65} ${height}`} stroke="#10b981" strokeWidth="5" fill="none" />
          </svg>
        );
      }
      // Standard Grass stage
      return (
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <defs>
            <linearGradient id={`grassGrad_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#064e3b" />
              <stop offset="100%" stopColor="#022c22" />
            </linearGradient>
          </defs>
          <rect width={width} height={height} fill={`url(#grassGrad_${uid})`} />
          <circle cx={width * 0.5} cy={height * 0.2} r={height * 0.4} fill="#047857" opacity="0.65" />
          <circle cx={width * 0.15} cy={height * 0.35} r={height * 0.3} fill="#065f46" opacity="0.75" />
          <circle cx={width * 0.85} cy={height * 0.35} r={height * 0.3} fill="#065f46" opacity="0.75" />
          <rect x={width * 0.45} y={height * 0.4} width={width * 0.1} height={height * 0.6} fill="#14532d" />
          <circle cx={width * 0.35} cy={height * 0.6} r="3" fill="#86efac" opacity="0.8" />
          <circle cx={width * 0.65} cy={height * 0.55} r="3.5" fill="#6ee7b7" opacity="0.85" />
        </svg>
      );
    }

    // ---------------------------------------------------------------------
    // LIGHT REALM (Astral Citadel): Floating Spire Sanctuaries, Golden Dawn
    // ---------------------------------------------------------------------
    case 'LIGHT': {
      if (stageNum === 1) {
        // 4-1: Starlight Ascent - Floating crystal stairs
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#78350f" />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={width * 0.2 + i * 20} y={height * 0.7 - i * 18} width="35" height="8" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
            ))}
            <circle cx={width * 0.8} cy={height * 0.25} r="14" fill="#fef08a" />
          </svg>
        );
      }
      if (stageNum === 4) {
        // 4-4: Solar Gatehouse - Monumental gold portal
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#451a03" />
            <circle cx={width * 0.5} cy={height * 0.45} r={height * 0.3} fill="#f59e0b" opacity="0.5" />
            <rect x={width * 0.3} y={height * 0.3} width="12" height={height * 0.7} fill="#fde047" />
            <rect x={width * 0.7 - 12} y={height * 0.3} width="12" height={height * 0.7} fill="#fde047" />
            <rect x={width * 0.25} y={height * 0.25} width={width * 0.5} height="10" fill="#fef08a" />
          </svg>
        );
      }
      if (stageNum === 10) {
        // 4-10: Citadel Apex of Radiance (Boss) - Supreme Solar Throne
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#78350f" />
            <circle cx={width * 0.5} cy={height * 0.35} r={height * 0.35} fill="#fef08a" />
            <polygon points={`${width * 0.45},${height} ${width * 0.5},${height * 0.2} ${width * 0.55},${height}`} fill="#ffffff" />
            <circle cx={width * 0.5} cy={height * 0.35} r="10" fill="#ffffff" />
          </svg>
        );
      }
      // Standard Light stage
      return (
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <defs>
            <linearGradient id={`lightGrad_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="60%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
          </defs>
          <rect width={width} height={height} fill={`url(#lightGrad_${uid})`} />
          <circle cx={width * 0.5} cy={height * 0.3} r={height * 0.25} fill="#fef08a" opacity="0.7" />
          <polygon points={`${width * 0.42},${height} ${width * 0.5},${height * 0.25} ${width * 0.58},${height}`} fill="#fef08a" opacity="0.9" />
          <polygon points={`${width * 0.2},${height} ${width * 0.26},${height * 0.45} ${width * 0.32},${height}`} fill="#fde047" opacity="0.7" />
          <polygon points={`${width * 0.68},${height} ${width * 0.74},${height * 0.45} ${width * 0.8},${height}`} fill="#fde047" opacity="0.7" />
          <ellipse cx={width * 0.5} cy={height * 0.9} rx={width * 0.45} ry={height * 0.2} fill="#78350f" opacity="0.9" />
        </svg>
      );
    }

    // ---------------------------------------------------------------------
    // DARK REALM (The Abyssal Rift): Cosmic Void, Singularity, Dark Nebulae
    // ---------------------------------------------------------------------
    case 'DARK':
    default: {
      if (stageNum === 4) {
        // 5-4: Dark Nebula Caverns - Swirling violet dust clouds
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#090514" />
            <ellipse cx={width * 0.35} cy={height * 0.4} rx={width * 0.3} ry={height * 0.35} fill="#7e22ce" opacity="0.5" />
            <ellipse cx={width * 0.65} cy={height * 0.6} rx={width * 0.35} ry={height * 0.3} fill="#a855f7" opacity="0.4" />
            <circle cx={width * 0.2} cy={height * 0.2} r="1.5" fill="#f3e8ff" />
            <circle cx={width * 0.8} cy={height * 0.3} r="2" fill="#f3e8ff" />
          </svg>
        );
      }
      if (stageNum === 10) {
        // 5-10: The Shattered Singularity Core (Boss) - Colossal black hole
        return (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect width={width} height={height} fill="#090514" />
            <ellipse cx={width * 0.5} cy={height * 0.45} rx={width * 0.45} ry={height * 0.2} fill="#c084fc" opacity="0.7" transform={`rotate(-15 ${width * 0.5} ${height * 0.45})`} />
            <circle cx={width * 0.5} cy={height * 0.45} r={height * 0.22} fill="#000000" stroke="#a855f7" strokeWidth="4" />
            <circle cx={width * 0.5} cy={height * 0.45} r={height * 0.24} fill="none" stroke="#f3e8ff" strokeWidth="1" strokeDasharray="4,4" />
          </svg>
        );
      }
      // Standard Dark stage
      return (
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <defs>
            <linearGradient id={`voidGrad_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2e1065" />
              <stop offset="100%" stopColor="#090514" />
            </linearGradient>
          </defs>
          <rect width={width} height={height} fill={`url(#voidGrad_${uid})`} />
          <ellipse cx={width * 0.5} cy={height * 0.4} rx={width * 0.35} ry={height * 0.15} fill="#a855f7" opacity="0.4" transform={`rotate(-12 ${width * 0.5} ${height * 0.4})`} />
          <circle cx={width * 0.5} cy={height * 0.4} r={height * 0.18} fill="#000000" stroke="#c084fc" strokeWidth="2" />
          <polygon points={`${width * 0.2},${height * 0.7} ${width * 0.25},${height * 0.65} ${width * 0.28},${height * 0.75} ${width * 0.22},${height * 0.8}`} fill="#1e1b4b" />
          <polygon points={`${width * 0.75},${height * 0.65} ${width * 0.82},${height * 0.6} ${width * 0.85},${height * 0.7} ${width * 0.78},${height * 0.75}`} fill="#1e1b4b" />
        </svg>
      );
    }
  }
}
