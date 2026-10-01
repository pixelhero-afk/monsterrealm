/**
 * Anime Arena Scenery Component
 * Renders rich, hand-crafted painterly anime fantasy battle landscapes modeled after
 * high-fantasy anime RPG digital matte paintings (Genshin, Granblue Fantasy, Epic Seven):
 * 
 * 1. Astral Citadel (Light) - Directly inspired by reference artwork:
 *    - Warm golden hour sunset sky with painterly clouds and sunburst glow.
 *    - Towering fantasy mountain ridges, cascading waterfalls, and ravines.
 *    - Majestic fairytale castle citadel perched high on the central mountain summit.
 *    - Floating sun motes and golden atmospheric haze.
 * 
 * 2. Ignis Caldera (Fire):
 *    - Smoldering volcanic peaks with fiery twilight sky and billowing ash clouds.
 *    - Glowing molten magma waterfalls and lava veins carved into obsidian crags.
 *    - Distant dark volcanic fortress ruins and rising fire embers.
 * 
 * 3. Azure Archipelago (Water):
 *    - Lush tropical sea cliffs and towering sea stacks under a vibrant anime sky.
 *    - Cascading coastal waterfalls splashing into turquoise ocean lagoons with sun caustics.
 *    - Drifting sea foam sparkles and glowing aqua bubbles.
 * 
 * 4. Forest Shrine (Grass):
 *    - Ghibli-inspired enchanted ancient forest with massive ancient sacred trees.
 *    - Dappled Komorebi sunbeams filtering through rich green canopies.
 *    - Ancient stone shrine torii ruins, glowing forest lanterns, and drifting sakura petals.
 * 
 * 5. The Abyssal Rift (Dark):
 *    - Twilight cosmic void dominated by a giant glowing purple celestial moon.
 *    - Starry violet nebulae, floating dark crystal spires, and ethereal purple auroras.
 */

import React, { useId } from 'react';
import { MapDefinition } from '../../data/maps';

interface AnimeArenaSceneryProps {
  mapDef: MapDefinition;
}

export const AnimeArenaScenery: React.FC<AnimeArenaSceneryProps> = ({ mapDef }) => {
  const rawId = useId();
  const uid = rawId.replace(/:/g, '_');
  const theme = mapDef.themeKey || 'FOREST_SHRINE';

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
      <svg
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>{`
            @keyframes emberFloat_${uid} {
              0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.65; }
              50% { transform: translateY(-12px) translateX(4px); opacity: 0.95; }
            }
            @keyframes sunPulse_${uid} {
              0%, 100% { opacity: 0.85; }
              50% { opacity: 1; }
            }
            @keyframes cloudDrift_${uid} {
              0%, 100% { transform: translateX(0px); }
              50% { transform: translateX(15px); }
            }
            .ember-drift-${uid} {
              animation: emberFloat_${uid} 4.5s ease-in-out infinite alternate;
            }
            .sun-pulse-${uid} {
              animation: sunPulse_${uid} 5s ease-in-out infinite alternate;
            }
            .cloud-drift-${uid} {
              animation: cloudDrift_${uid} 16s ease-in-out infinite alternate;
            }
          `}</style>

          {/* ========================================================= */}
          {/* COMMON BLURS & GLOW FILTERS                               */}
          {/* ========================================================= */}
          <filter id={`bloom_${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`mistBlur_${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" />
          </filter>

          {/* ========================================================= */}
          {/* 1. ASTRAL CITADEL (LIGHT) GRADIENTS - SUNSET MOUNTAIN CASTLE */}
          {/* ========================================================= */}
          <linearGradient id={`astralSunsetSky_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2e1065" />
            <stop offset="25%" stopColor="#4c1d95" />
            <stop offset="50%" stopColor="#9a3412" />
            <stop offset="70%" stopColor="#ea580c" />
            <stop offset="85%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fef08a" />
          </linearGradient>

          <radialGradient id={`sunburstGlow_${uid}`} cx="55%" cy="30%" r="45%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="20%" stopColor="#fef08a" stopOpacity="0.8" />
            <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="75%" stopColor="#c2410c" stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <linearGradient id={`mountainFar_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#472652" />
            <stop offset="50%" stopColor="#5b2d5a" />
            <stop offset="100%" stopColor="#7a3e5c" />
          </linearGradient>

          <linearGradient id={`mountainMid_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c1d3b" />
            <stop offset="60%" stopColor="#442a42" />
            <stop offset="100%" stopColor="#55383f" />
          </linearGradient>

          <linearGradient id={`waterfallGrad_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.85" />
          </linearGradient>

          {/* ========================================================= */}
          {/* 2. IGNIS CALDERA (FIRE) GRADIENTS                          */}
          {/* ========================================================= */}
          <linearGradient id={`ignisSky_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c0505" />
            <stop offset="35%" stopColor="#3f0e0e" />
            <stop offset="65%" stopColor="#7f1d1d" />
            <stop offset="85%" stopColor="#c2410c" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>

          <radialGradient id={`calderaEruptionGlow_${uid}`} cx="50%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#ffedd5" stopOpacity="0.9" />
            <stop offset="25%" stopColor="#fb923c" stopOpacity="0.7" />
            <stop offset="55%" stopColor="#dc2626" stopOpacity="0.35" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <linearGradient id={`magmaFall_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#fef08a" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>

          {/* Celestial Sun-Gate Beams & Ancient Column Gradients (Matching Reference Artwork) */}
          <linearGradient id={`celestialBeamGrad_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="25%" stopColor="#fef08a" stopOpacity="0.55" />
            <stop offset="65%" stopColor="#f97316" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
          </linearGradient>

          <linearGradient id={`columnGrad_${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1c110e" />
            <stop offset="30%" stopColor="#3d2720" />
            <stop offset="70%" stopColor="#5c3c32" />
            <stop offset="85%" stopColor="#7c5346" />
            <stop offset="100%" stopColor="#241512" />
          </linearGradient>

          <linearGradient id={`lavaRiverGrad_${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="25%" stopColor="#ea580c" />
            <stop offset="50%" stopColor="#fef08a" />
            <stop offset="75%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>

          {/* ========================================================= */}
          {/* 3. AZURE ARCHIPELAGO (WATER) GRADIENTS                    */}
          {/* ========================================================= */}
          <linearGradient id={`azureSky_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="40%" stopColor="#0284c7" />
            <stop offset="70%" stopColor="#38bdf8" />
            <stop offset="90%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>

          <linearGradient id={`tropicalSea_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="40%" stopColor="#06b6d4" />
            <stop offset="80%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#115e59" />
          </linearGradient>

          {/* ========================================================= */}
          {/* 4. FOREST SHRINE (GRASS) GRADIENTS                        */}
          {/* ========================================================= */}
          <linearGradient id={`forestSky_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#022c22" />
            <stop offset="35%" stopColor="#064e3b" />
            <stop offset="65%" stopColor="#047857" />
            <stop offset="85%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#a7f3d0" />
          </linearGradient>

          {/* ========================================================= */}
          {/* 5. ABYSSAL RIFT (DARK) GRADIENTS                          */}
          {/* ========================================================= */}
          <linearGradient id={`abyssalSky_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#090514" />
            <stop offset="30%" stopColor="#180b2b" />
            <stop offset="60%" stopColor="#2e1065" />
            <stop offset="85%" stopColor="#3b0764" />
            <stop offset="100%" stopColor="#581c87" />
          </linearGradient>

          <radialGradient id={`voidMoonGlow_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f5d0fe" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#c084fc" stopOpacity="0.75" />
            <stop offset="65%" stopColor="#9333ea" stopOpacity="0.35" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* THEME 1: ASTRAL CITADEL (Directly matching reference image!)   */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {theme === 'ASTRAL_CITADEL' && (
          <g id="astral-citadel-art">
            {/* Dramatic Sunset Sky */}
            <rect width="1200" height="700" fill={`url(#astralSunsetSky_${uid})`} />

            {/* Radiant Sunburst Glow over Horizon */}
            <g className={`sun-pulse-${uid}`}>
              <circle cx="680" cy="220" r="320" fill={`url(#sunburstGlow_${uid})`} />
              <circle cx="680" cy="220" r="45" fill="#ffffff" opacity="0.95" />
            </g>

            {/* Soft Painted Clouds */}
            <g className={`cloud-drift-${uid}`} fill="#fed7aa" opacity="0.45" filter={`url(#mistBlur_${uid})`}>
              <ellipse cx="300" cy="180" rx="220" ry="50" />
              <ellipse cx="500" cy="140" rx="260" ry="60" fill="#fde047" />
              <ellipse cx="850" cy="190" rx="280" ry="55" />
              <ellipse cx="1020" cy="130" rx="190" ry="45" />
            </g>

            {/* Distant Mountain Ridges (Layer 1 - Deep Background) */}
            <path
              d="M 0,380 
                 L 120,290 L 220,330 L 340,240 L 460,310 
                 L 580,210 L 720,270 L 860,200 L 980,280 L 1100,220 L 1200,320 
                 L 1200,700 L 0,700 Z"
              fill={`url(#mountainFar_${uid})`}
              opacity="0.85"
            />

            {/* Cascading Far Waterfalls */}
            <path d="M 940,290 Q 945,360 940,430" stroke={`url(#waterfallGrad_${uid})`} strokeWidth="4" fill="none" opacity="0.8" />
            <path d="M 280,300 Q 285,370 280,440" stroke={`url(#waterfallGrad_${uid})`} strokeWidth="3.5" fill="none" opacity="0.75" />

            {/* Midground Mountain Peaks with Warm Sunset Highlights */}
            <path
              d="M -40,480 
                 L 80,350 L 180,420 L 310,310 L 450,440 
                 L 600,280 L 780,410 L 910,290 L 1040,390 L 1160,320 L 1240,460 
                 L 1240,700 L -40,700 Z"
              fill={`url(#mountainMid_${uid})`}
            />

            {/* Sun Rim Lighting on Mountain Edges */}
            <path
              d="M 80,350 L 180,420 L 310,310 L 450,440 L 600,280 L 780,410 L 910,290 L 1040,390 L 1160,320"
              stroke="#fdba74"
              strokeWidth="2.5"
              fill="none"
              opacity="0.6"
            />

            {/* ========================================================= */}
            {/* MAJESTIC FAIRYTALE CITADEL CASTLE (High Mountain Summit) */}
            {/* ========================================================= */}
            <g id="mountain-citadel" transform="translate(480, 100)">
              {/* Grand Citadel Silhouette & Towers */}
              {/* Central Keep Tower */}
              <polygon points="120,40 100,180 140,180" fill="#f8fafc" opacity="0.95" />
              <polygon points="120,20 112,42 128,42" fill="#38bdf8" />
              {/* Left Castle Spires */}
              <polygon points="80,70 65,180 95,180" fill="#ede9fe" opacity="0.9" />
              <polygon points="80,50 74,72 86,72" fill="#38bdf8" />
              <polygon points="50,100 40,180 60,180" fill="#e2e8f0" opacity="0.85" />
              <polygon points="50,85 45,102 55,102" fill="#f59e0b" />
              {/* Right Castle Spires */}
              <polygon points="160,70 145,180 175,180" fill="#ede9fe" opacity="0.9" />
              <polygon points="160,50 154,72 166,72" fill="#38bdf8" />
              <polygon points="190,100 180,180 200,180" fill="#e2e8f0" opacity="0.85" />
              <polygon points="190,85 185,102 195,102" fill="#f59e0b" />

              {/* Castle Fortress Walls & Arched Bridges */}
              <rect x="55" y="140" width="130" height="42" fill="#f1f5f9" />
              <path d="M 40,165 Q 120,150 200,165 L 200,182 L 40,182 Z" fill="#cbd5e1" />
              {/* Glowing Warm Castle Windows */}
              {[70, 95, 120, 145, 170].map((x, i) => (
                <rect key={`win-${i}`} x={x - 2} y="150" width="4" height="7" rx="1.5" fill="#fef08a" opacity="0.9" />
              ))}
              <circle cx="120" cy="115" r="3.5" fill="#fde047" />

              {/* Citadel Radiant Spire Aura */}
              <circle cx="120" cy="35" r="22" fill="#ffffff" opacity="0.75" filter={`url(#bloom_${uid})`} />
            </g>

            {/* Plunging Cliffs & Ravine Waterfalls */}
            <g id="plunging-waterfalls">
              {/* Main Left Cliff Waterfall */}
              <path d="M 520,280 Q 525,370 515,480" stroke={`url(#waterfallGrad_${uid})`} strokeWidth="7" fill="none" opacity="0.9" />
              <path d="M 520,280 Q 525,370 515,480" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.95" />
              <ellipse cx="515" cy="485" rx="35" ry="12" fill="#bae6fd" opacity="0.6" filter={`url(#mistBlur_${uid})`} />

              {/* Right Mountain Waterfall */}
              <path d="M 960,340 Q 968,410 962,490" stroke={`url(#waterfallGrad_${uid})`} strokeWidth="9" fill="none" opacity="0.92" />
              <path d="M 960,340 Q 968,410 962,490" stroke="#ffffff" strokeWidth="3" fill="none" opacity="0.95" />
              <ellipse cx="962" cy="495" rx="42" ry="14" fill="#bae6fd" opacity="0.65" filter={`url(#mistBlur_${uid})`} />
            </g>

            {/* Foreground Framing Crags (Left & Right) */}
            <path
              d="M -30,220 Q 80,340 110,540 L 140,680 L -30,680 Z"
              fill="#22142d"
              stroke="#3b214c"
              strokeWidth="2"
            />
            <path
              d="M 1230,220 Q 1120,340 1090,540 L 1060,680 L 1230,680 Z"
              fill="#22142d"
              stroke="#3b214c"
              strokeWidth="2"
            />

            {/* Floating Golden Twilight Embers / Spores */}
            <g className={`ember-drift-${uid}`}>
              {[
                { cx: 200, cy: 380, r: 2.5 },
                { cx: 340, cy: 420, r: 2.0 },
                { cx: 480, cy: 350, r: 3.0 },
                { cx: 620, cy: 400, r: 2.2 },
                { cx: 780, cy: 360, r: 2.8 },
                { cx: 890, cy: 430, r: 2.4 },
                { cx: 1020, cy: 390, r: 3.2 },
              ].map((p, i) => (
                <circle key={`emb-${i}`} cx={p.cx} cy={p.cy} r={p.r} fill="#fef08a" opacity="0.8" filter={`url(#bloom_${uid})`} />
              ))}
            </g>
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* THEME 2: IGNIS CALDERA (FIRE)                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {theme === 'IGNIS_CALDERA' && (
          <g id="ignis-caldera-art">
            <rect width="1200" height="700" fill={`url(#ignisSky_${uid})`} />

            {/* Smoldering Eruption Core */}
            <circle cx="600" cy="200" r="300" fill={`url(#calderaEruptionGlow_${uid})`} />
            <circle cx="600" cy="200" r="36" fill="#fffbeb" opacity="0.9" />

            {/* Billowing Dark Ash Clouds */}
            <g fill="#1f0909" opacity="0.65" filter={`url(#mistBlur_${uid})`}>
              <ellipse cx="420" cy="130" rx="260" ry="75" />
              <ellipse cx="780" cy="140" rx="280" ry="80" />
              <ellipse cx="600" cy="90" rx="320" ry="85" fill="#2d0d0d" />
            </g>

            {/* Jagged Obsidian Volcanic Peaks */}
            <path
              d="M -40,460 
                 L 110,320 L 240,410 L 380,260 L 520,380 
                 L 600,230 L 680,380 L 820,260 L 960,410 L 1090,320 L 1240,460 
                 L 1240,700 L -40,700 Z"
              fill="#180707"
            />
            {/* Glowing Magma Fissures on Volcano */}
            <path d="M 600,230 Q 570,330 540,430" stroke={`url(#magmaFall_${uid})`} strokeWidth="7" fill="none" opacity="0.9" />
            <path d="M 600,230 Q 630,330 660,430" stroke={`url(#magmaFall_${uid})`} strokeWidth="7" fill="none" opacity="0.9" />

            {/* Foreground Basalt Framing */}
            <path d="M -30,220 Q 90,360 120,560 L 150,680 L -30,680 Z" fill="#120505" stroke="#450a0a" strokeWidth="2" />
            <path d="M 1230,220 Q 1110,360 1080,560 L 1050,680 L 1230,680 Z" fill="#120505" stroke="#450a0a" strokeWidth="2" />

            {/* Rising Sparks and Cinders */}
            {[
              { cx: 250, cy: 360, r: 2.5 },
              { cx: 400, cy: 300, r: 3.0 },
              { cx: 580, cy: 260, r: 2.2 },
              { cx: 720, cy: 320, r: 2.8 },
              { cx: 860, cy: 280, r: 3.2 },
              { cx: 1000, cy: 370, r: 2.4 },
            ].map((p, i) => (
              <circle key={`fire-p-${i}`} cx={p.cx} cy={p.cy} r={p.r} fill="#fb923c" opacity="0.85" filter={`url(#bloom_${uid})`} />
            ))}
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* THEME 3: AZURE ARCHIPELAGO (WATER)                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {theme === 'AZURE_ARCHIPELAGO' && (
          <g id="azure-archipelago-art">
            <rect width="1200" height="700" fill={`url(#azureSky_${uid})`} />

            {/* Sun Glow */}
            <circle cx="600" cy="180" r="220" fill="#ffffff" opacity="0.3" filter={`url(#bloom_${uid})`} />

            {/* Fluffy Anime Cumulus Clouds */}
            <g fill="#ffffff" opacity="0.8" filter={`url(#mistBlur_${uid})`}>
              <ellipse cx="260" cy="160" rx="180" ry="55" />
              <ellipse cx="880" cy="170" rx="220" ry="60" />
            </g>

            {/* Distant Sea Horizon & Coral Atolls */}
            <rect y="310" width="1200" height="390" fill={`url(#tropicalSea_${uid})`} />

            {/* Tropical Sea Cliff Stacks */}
            <path
              d="M -40,480 
                 L 90,340 L 190,410 L 320,290 L 440,420 
                 L 540,360 L 660,420 L 780,310 L 920,430 L 1050,330 L 1240,480 
                 L 1240,700 L -40,700 Z"
              fill="#083344"
            />

            {/* Coastal Waterfalls tumbling into Lagoon */}
            <path d="M 320,290 Q 325,360 320,430" stroke="#bae6fd" strokeWidth="6" fill="none" opacity="0.9" />
            <path d="M 780,310 Q 785,370 780,440" stroke="#bae6fd" strokeWidth="7" fill="none" opacity="0.9" />

            {/* Lagoon Wave Sparkles */}
            {[
              { cx: 300, cy: 370, r: 2.2 },
              { cx: 480, cy: 400, r: 2.8 },
              { cx: 650, cy: 360, r: 2.4 },
              { cx: 820, cy: 390, r: 3.0 },
              { cx: 980, cy: 370, r: 2.5 },
            ].map((p, i) => (
              <circle key={`water-sp-${i}`} cx={p.cx} cy={p.cy} r={p.r} fill="#e0f2fe" opacity="0.9" filter={`url(#bloom_${uid})`} />
            ))}
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* THEME 4: FOREST SHRINE (GRASS)                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {theme === 'FOREST_SHRINE' && (
          <g id="forest-shrine-art">
            <rect width="1200" height="700" fill={`url(#forestSky_${uid})`} />

            {/* Dappled Komorebi Sun Light Core */}
            <circle cx="600" cy="180" r="260" fill="#fef08a" opacity="0.35" filter={`url(#bloom_${uid})`} />

            {/* Sacred Giant Ancient World-Tree Canopies */}
            <g fill="#064e3b" opacity="0.85">
              <ellipse cx="200" cy="180" rx="320" ry="160" />
              <ellipse cx="1000" cy="180" rx="320" ry="160" />
              <ellipse cx="600" cy="120" rx="420" ry="150" fill="#047857" opacity="0.75" />
            </g>

            {/* Ancient Mossy Stone Torii & Shrine Silhouette in Deep Woods */}
            <g transform="translate(530, 240)" opacity="0.8">
              <rect x="0" y="0" width="140" height="12" rx="3" fill="#14532d" />
              <rect x="15" y="12" width="110" height="8" rx="2" fill="#166534" />
              <rect x="25" y="20" width="14" height="110" fill="#14532d" />
              <rect x="100" y="20" width="14" height="110" fill="#14532d" />
              <circle cx="70" cy="50" r="10" fill="#86efac" opacity="0.8" filter={`url(#bloom_${uid})`} />
            </g>

            {/* Gentle Drifting Sakura Petals and Forest Fireflies */}
            {[
              { cx: 220, cy: 320, r: 2.8, color: '#fbcfe8' },
              { cx: 380, cy: 280, r: 2.4, color: '#86efac' },
              { cx: 520, cy: 340, r: 3.2, color: '#fbcfe8' },
              { cx: 680, cy: 290, r: 2.6, color: '#86efac' },
              { cx: 840, cy: 330, r: 3.0, color: '#fbcfe8' },
              { cx: 990, cy: 270, r: 2.4, color: '#86efac' },
            ].map((p, i) => (
              <circle key={`for-sp-${i}`} cx={p.cx} cy={p.cy} r={p.r} fill={p.color} opacity="0.85" filter={`url(#bloom_${uid})`} />
            ))}
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* THEME 5: THE ABYSSAL RIFT (DARK)                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {theme === 'ABYSSAL_RIFT' && (
          <g id="abyssal-rift-art">
            <rect width="1200" height="700" fill={`url(#abyssalSky_${uid})`} />

            {/* Colossal Luminous Celestial Violet Moon */}
            <circle cx="600" cy="190" r="180" fill={`url(#voidMoonGlow_${uid})`} />
            <circle cx="600" cy="190" r="85" fill="#fdf4ff" opacity="0.95" />
            {/* Moon Crater Details */}
            <ellipse cx="570" cy="170" rx="22" ry="14" fill="#e9d5ff" opacity="0.6" />
            <ellipse cx="635" cy="210" rx="18" ry="12" fill="#e9d5ff" opacity="0.5" />

            {/* Floating Void Crystal Monoliths */}
            <g fill="#1e1035" stroke="#9333ea" strokeWidth="1.5">
              <polygon points="260,240 285,160 305,245 280,310" opacity="0.85" />
              <polygon points="900,220 925,140 945,225 920,290" opacity="0.85" />
            </g>

            {/* Cosmic Star Dust & Purple Auroras */}
            {[
              { cx: 180, cy: 260, r: 2.2 },
              { cx: 340, cy: 320, r: 2.8 },
              { cx: 470, cy: 240, r: 2.5 },
              { cx: 730, cy: 250, r: 3.0 },
              { cx: 860, cy: 310, r: 2.4 },
              { cx: 1040, cy: 270, r: 2.8 },
            ].map((p, i) => (
              <circle key={`cos-sp-${i}`} cx={p.cx} cy={p.cy} r={p.r} fill="#d8b4fe" opacity="0.9" filter={`url(#bloom_${uid})`} />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
};
