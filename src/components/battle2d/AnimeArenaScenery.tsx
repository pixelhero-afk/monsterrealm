/**
 * Anime Arena Scenery Component
 * Renders rich, hand-crafted painterly anime fantasy battle landscapes modeled after
 * the cinematic proscenium framing, layered depth, winding natural ground path,
 * and glowing bioluminescent flora of the reference illustration:
 * 
 * 1. Forest Shrine (Sylvan Glade):
 *    - Massive ancient gnarled oak trunks with moss-covered bark forming natural cathedral arches.
 *    - Winding earthy dirt trail bordered by lush moss banks, ferns, and mushrooms.
 *    - Clustered bioluminescent glowing cyan-blue fairy blossoms with radiant light halos.
 *    - Dappled Komorebi sunbeams and animated drifting cyan firefly motes.
 * 
 * 2. Ignis Caldera (Volcanic Crags):
 *    - Towering jagged obsidian arches and volcanic basalt crags framing the scene.
 *    - Winding dark ash and cracked basalt path with glowing molten magma fissures.
 *    - Clustered incandescent flame-lotus blossoms and molten cinder crystals with glowing halos.
 *    - Distant erupting caldera, magma waterfalls, and rising glowing ember sparks.
 * 
 * 3. Azure Archipelago (Sunken Coral & Coastal Lagoon):
 *    - Curving driftwood palm trunks and natural sea-sculpted coral arches framing the view.
 *    - Winding pearlescent white sand shoreline trail weaving past crystal turquoise tide pools.
 *    - Clustered glowing azure sea anemones, turquoise sea lilies, and luminescent pearl shells.
 *    - Sunlight wave caustics on shallow lagoons and rising translucent ocean bubbles.
 * 
 * 4. Astral Citadel (Celestial High Sanctuary):
 *    - Towering ivory and gold celestial marble colonnades and divine crystal tree arches.
 *    - Sweeping curved alabaster and gold-inlaid terrace promenade.
 *    - Clustered glowing golden solar blossoms and radiant crystal prism clusters.
 *    - Sea of dawn clouds, golden morning aurora, sunburst prism, and floating stardust.
 * 
 * 5. The Abyssal Rift (Cosmic Void & Umbral Moon):
 *    - Twisted dark obsidian crystal spires and petrified void trees arching into a cosmic vault.
 *    - Winding dark cosmic stone causeway with glowing violet rift fissures.
 *    - Clustered glowing deep violet and magenta void orchids and luminous amethyst crystals.
 *    - Colossal glowing violet celestial eclipse moon, cosmic nebulas, and floating purple stardust.
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
      {/* 1. Base Atmospheric Sky Glow */}
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse at 50% 20%, ${mapDef.palette.skyBottom} 0%, ${mapDef.palette.skyTop} 100%)`,
        }}
      />

      {/* 2. Painted Anime Environment SVG Stage */}
      <svg
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* ========================================================= */}
          {/* COMMON BLURS & GLOW FILTERS                              */}
          {/* ========================================================= */}
          <filter id={`bloomGlow_${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`softHalo_${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="14" />
          </filter>

          {/* ========================================================= */}
          {/* 1. FOREST SHRINE / SYLVAN GLADE GRADIENTS                 */}
          {/* ========================================================= */}
          <linearGradient id={`forestSky_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#042318" />
            <stop offset="45%" stopColor="#083827" />
            <stop offset="85%" stopColor="#104f37" />
            <stop offset="100%" stopColor="#082b1d" />
          </linearGradient>
          <radialGradient id={`canopyLight_${uid}`} cx="50%" cy="18%" r="45%">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#34d399" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#064e3b" stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`forestDirtPath_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9a7b56" />
            <stop offset="40%" stopColor="#806240" />
            <stop offset="80%" stopColor="#674c2f" />
            <stop offset="100%" stopColor="#4f3821" />
          </linearGradient>
          <linearGradient id={`mossBankGrad_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2e6d38" />
            <stop offset="50%" stopColor="#1e4e26" />
            <stop offset="100%" stopColor="#0f2f16" />
          </linearGradient>
          <linearGradient id={`ancientBark_${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#18100b" />
            <stop offset="35%" stopColor="#2c1d14" />
            <stop offset="70%" stopColor="#3d2a1d" />
            <stop offset="100%" stopColor="#1a110c" />
          </linearGradient>
          <radialGradient id={`cyanFlowerGlow_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="1" />
            <stop offset="25%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`komorebiBeam_${uid}`} x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.28" />
            <stop offset="50%" stopColor="#6ee7b7" stopOpacity="0.12" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>

          {/* ========================================================= */}
          {/* 2. IGNIS CALDERA / VOLCANIC REALM GRADIENTS               */}
          {/* ========================================================= */}
          <linearGradient id={`ignisSkyGrad_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#200606" />
            <stop offset="45%" stopColor="#3f0d0d" />
            <stop offset="80%" stopColor="#681818" />
            <stop offset="100%" stopColor="#280c0c" />
          </linearGradient>
          <radialGradient id={`calderaCoreGlow_${uid}`} cx="50%" cy="25%" r="48%">
            <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#fef08a" stopOpacity="0.8" />
            <stop offset="55%" stopColor="#f97316" stopOpacity="0.5" />
            <stop offset="85%" stopColor="#dc2626" stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`volcanicAshPath_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#382d2c" />
            <stop offset="50%" stopColor="#281f1e" />
            <stop offset="100%" stopColor="#181312" />
          </linearGradient>
          <linearGradient id={`lavaStreamGrad_${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="25%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#fef08a" />
            <stop offset="75%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <radialGradient id={`flameFlowerGlow_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="30%" stopColor="#fef08a" stopOpacity="0.9" />
            <stop offset="65%" stopColor="#f97316" stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* ========================================================= */}
          {/* 3. AZURE ARCHIPELAGO / OCEAN REALM GRADIENTS              */}
          {/* ========================================================= */}
          <linearGradient id={`azureSkyGrad_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#041f38" />
            <stop offset="45%" stopColor="#0369a1" />
            <stop offset="80%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id={`oceanWater_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.75" />
            <stop offset="45%" stopColor="#0369a1" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#082f49" stopOpacity="0.98" />
          </linearGradient>
          <linearGradient id={`whiteSandPath_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fdfbf7" />
            <stop offset="40%" stopColor="#f4ede2" />
            <stop offset="80%" stopColor="#e2d4c0" />
            <stop offset="100%" stopColor="#c5b29a" />
          </linearGradient>
          <radialGradient id={`seaFloraGlow_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="25%" stopColor="#67e8f9" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#0284c7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* ========================================================= */}
          {/* 4. ASTRAL CITADEL / CELESTIAL REALM GRADIENTS             */}
          {/* ========================================================= */}
          <linearGradient id={`astralSkyGrad_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="40%" stopColor="#3730a3" />
            <stop offset="70%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#fef3c7" />
          </linearGradient>
          <radialGradient id={`astralSunPrism_${uid}`} cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="25%" stopColor="#fef08a" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.45" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`marbleWalkwayGrad_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="85%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <radialGradient id={`solarBlossomGlow_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="25%" stopColor="#fde047" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* ========================================================= */}
          {/* 5. ABYSSAL RIFT / DARK VOID GRADIENTS                     */}
          {/* ========================================================= */}
          <linearGradient id={`abyssalSkyGrad_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#080410" />
            <stop offset="40%" stopColor="#1c0a33" />
            <stop offset="75%" stopColor="#380961" />
            <stop offset="100%" stopColor="#120521" />
          </linearGradient>
          <radialGradient id={`voidMoonHalo_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f5d0fe" stopOpacity="1" />
            <stop offset="35%" stopColor="#c084fc" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#7e22ce" stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`voidCosmicPath_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#231438" />
            <stop offset="50%" stopColor="#180b26" />
            <stop offset="100%" stopColor="#0e0417" />
          </linearGradient>
          <radialGradient id={`voidOrchidGlow_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fdf4ff" stopOpacity="1" />
            <stop offset="25%" stopColor="#e879f9" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#a855f7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ========================================================================= */}
        {/* THEME 1: FOREST SHRINE / SYLVAN GLADE (MATCHES USER REFERENCE!)            */}
        {/* ========================================================================= */}
        {theme === 'FOREST_SHRINE' && (
          <g id="sylvan-glade-scenery">
            {/* Background Forest Sky */}
            <rect width="1200" height="700" fill={`url(#forestSky_${uid})`} />

            {/* Glowing Dappled Sunlight Clearing in Deep Canopy */}
            <ellipse cx="600" cy="180" rx="420" ry="160" fill={`url(#canopyLight_${uid})`} />

            {/* Distant Receding Forest Silhouettes */}
            <path
              d="M 0,380 Q 250,290 500,340 T 950,300 T 1200,340 L 1200,700 L 0,700 Z"
              fill="#062e1e"
              opacity="0.9"
            />
            {/* Midground Tree Silhouettes */}
            <g fill="#083825" opacity="0.85">
              <path d="M 180,180 Q 190,320 220,440 L 270,440 Q 240,320 220,180 Z" />
              <path d="M 400,160 Q 410,290 430,420 L 470,420 Q 450,290 430,160 Z" />
              <path d="M 770,160 Q 750,290 740,420 L 780,420 Q 790,290 810,160 Z" />
              <path d="M 980,180 Q 960,320 940,440 L 990,440 Q 1000,320 1020,180 Z" />
              <circle cx="210" cy="160" r="110" />
              <circle cx="420" cy="140" r="95" />
              <circle cx="770" cy="140" r="95" />
              <circle cx="980" cy="160" r="110" />
            </g>

            {/* Komorebi: Soft Sunbeams Filtering Down Through Foliage */}
            <polygon points="260,0 400,0 560,700 380,700" fill={`url(#komorebiBeam_${uid})`} />
            <polygon points="480,0 620,0 760,700 580,700" fill={`url(#komorebiBeam_${uid})`} />
            <polygon points="720,0 860,0 980,700 820,700" fill={`url(#komorebiBeam_${uid})`} />

            {/* Midground Moss Mounds & Rolling Forest Floor */}
            <path
              d="M 0,420 Q 320,380 600,430 T 1200,410 L 1200,700 L 0,700 Z"
              fill={`url(#mossBankGrad_${uid})`}
            />

            {/* =================================================================== */}
            {/* THE WINDING EARTH DIRT PATH (Where Combatants Stand!)                */}
            {/* Sweeps smoothly across from left (y:420-580) to right (y:420-580)   */}
            {/* =================================================================== */}
            <path
              d="M -20,490 
                 C 140,450 280,440 440,460 
                 C 600,480 760,470 940,450 
                 C 1080,430 1180,460 1220,490
                 L 1220,620
                 C 1060,650 900,640 740,620
                 C 560,600 380,620 220,650
                 C 80,670 -20,640 -20,620 Z"
              fill={`url(#forestDirtPath_${uid})`}
              stroke="#3d281a"
              strokeWidth="2.5"
            />
            {/* Subtle path wheel / travel ruts and soil variations */}
            <path
              d="M 60,530 C 240,490 440,510 600,525 C 780,540 960,510 1140,520"
              stroke="#6b4c2b"
              strokeWidth="3.5"
              fill="none"
              opacity="0.45"
            />
            <path
              d="M 40,570 C 220,540 420,555 600,565 C 780,575 980,550 1160,560"
              stroke="#583c20"
              strokeWidth="3"
              fill="none"
              opacity="0.4"
            />

            {/* Lower Velvety Moss & Wild Fern Border Banks */}
            <path
              d="M -20,590 Q 200,580 400,620 T 800,600 T 1220,590 L 1220,700 L -20,700 Z"
              fill="#0d3119"
            />
            <path
              d="M -20,630 Q 280,610 600,640 T 1220,620 L 1220,700 L -20,700 Z"
              fill="#072010"
            />

            {/* =================================================================== */}
            {/* PROSCENIUM FRAMING: MASSIVE GNARLED ANCIENT OAK TREES & ROOTS       */}
            {/* =================================================================== */}
            {/* LEFT PROSCENIUM TREE TRUNK & CANOPY */}
            <g id="left-giant-tree">
              {/* Massive Gnarled Trunk Arching Inward */}
              <path
                d="M -40,-20 
                   C 110,60 160,180 140,320 
                   C 120,440 180,520 220,620 
                   C 150,620 60,600 -40,650 Z"
                fill={`url(#ancientBark_${uid})`}
                stroke="#100b07"
                strokeWidth="3"
              />
              {/* Bark Furrows and Textural Crevices */}
              <path d="M 20,40 Q 90,180 70,320 Q 50,440 90,560" stroke="#0e0805" strokeWidth="4" fill="none" opacity="0.85" />
              <path d="M 60,80 Q 120,200 100,340 Q 80,450 140,580" stroke="#0e0805" strokeWidth="3" fill="none" opacity="0.85" />
              <path d="M -10,120 Q 50,220 40,360" stroke="#0e0805" strokeWidth="3.5" fill="none" opacity="0.8" />
              
              {/* Sprawling Massive Mossy Roots Reaching into Path */}
              <path
                d="M 140,480 Q 210,510 260,570 Q 200,580 130,530 Z"
                fill="#2c1d14"
                stroke="#150e09"
                strokeWidth="2"
              />
              <path
                d="M 180,560 Q 250,590 310,630 Q 220,640 150,600 Z"
                fill="#251810"
                stroke="#150e09"
                strokeWidth="2"
              />

              {/* Moss Patches Clinging to Bark */}
              <path d="M 80,180 Q 140,240 110,320 Q 90,260 70,220 Z" fill="#2e6d38" opacity="0.85" />
              <path d="M 100,340 Q 150,400 120,480 Q 90,420 80,360 Z" fill="#3f854a" opacity="0.8" />
              <path d="M 140,490 Q 190,520 220,570 Q 170,550 130,520 Z" fill="#2d6b37" opacity="0.9" />

              {/* Overhead Branch Arching Inward Across Top */}
              <path
                d="M 80,80 C 240,40 420,90 540,160 C 460,190 320,160 80,170 Z"
                fill={`url(#ancientBark_${uid})`}
                stroke="#100b07"
                strokeWidth="2"
              />
              {/* Dense Foliage Canopy Tufts on Left */}
              <g fill="#0e5436">
                <circle cx="80" cy="40" r="140" />
                <circle cx="220" cy="60" r="120" />
                <circle cx="360" cy="70" r="110" />
                <circle cx="480" cy="110" r="90" />
                <circle cx="160" cy="130" r="100" fill="#146c45" />
                <circle cx="300" cy="120" r="95" fill="#146c45" />
              </g>
            </g>

            {/* RIGHT PROSCENIUM TREE TRUNK & CANOPY */}
            <g id="right-giant-tree">
              {/* Massive Gnarled Trunk Arching Inward */}
              <path
                d="M 1240,-20 
                   C 1090,60 1040,180 1060,320 
                   C 1080,440 1020,520 980,620 
                   C 1050,620 1140,600 1240,650 Z"
                fill={`url(#ancientBark_${uid})`}
                stroke="#100b07"
                strokeWidth="3"
              />
              {/* Bark Furrows and Textural Crevices */}
              <path d="M 1180,40 Q 1110,180 1130,320 Q 1150,440 1110,560" stroke="#0e0805" strokeWidth="4" fill="none" opacity="0.85" />
              <path d="M 1140,80 Q 1080,200 1100,340 Q 1120,450 1060,580" stroke="#0e0805" strokeWidth="3" fill="none" opacity="0.85" />
              <path d="M 1210,120 Q 1150,220 1160,360" stroke="#0e0805" strokeWidth="3.5" fill="none" opacity="0.8" />

              {/* Sprawling Massive Mossy Roots Reaching into Path */}
              <path
                d="M 1060,480 Q 990,510 940,570 Q 1000,580 1070,530 Z"
                fill="#2c1d14"
                stroke="#150e09"
                strokeWidth="2"
              />
              <path
                d="M 1020,560 Q 950,590 890,630 Q 980,640 1050,600 Z"
                fill="#251810"
                stroke="#150e09"
                strokeWidth="2"
              />

              {/* Moss Patches Clinging to Bark */}
              <path d="M 1120,180 Q 1060,240 1090,320 Q 1110,260 1130,220 Z" fill="#2e6d38" opacity="0.85" />
              <path d="M 1100,340 Q 1050,400 1080,480 Q 1110,420 1120,360 Z" fill="#3f854a" opacity="0.8" />
              <path d="M 1060,490 Q 1010,520 980,570 Q 1030,550 1070,520 Z" fill="#2d6b37" opacity="0.9" />

              {/* Overhead Branch Arching Inward Across Top */}
              <path
                d="M 1120,80 C 960,40 780,90 660,160 C 740,190 880,160 1120,170 Z"
                fill={`url(#ancientBark_${uid})`}
                stroke="#100b07"
                strokeWidth="2"
              />
              {/* Dense Foliage Canopy Tufts on Right */}
              <g fill="#0e5436">
                <circle cx="1120" cy="40" r="140" />
                <circle cx="980" cy="60" r="120" />
                <circle cx="840" cy="70" r="110" />
                <circle cx="720" cy="110" r="90" />
                <circle cx="1040" cy="130" r="100" fill="#146c45" />
                <circle cx="900" cy="120" r="95" fill="#146c45" />
              </g>
            </g>

            {/* Overhanging Center Vines & Hanging Foliage */}
            <path d="M 420,130 Q 430,210 415,280" stroke="#1b4d27" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 460,140 Q 475,230 460,310" stroke="#164321" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 740,140 Q 725,230 740,310" stroke="#164321" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 780,130 Q 770,210 785,280" stroke="#1b4d27" strokeWidth="4" fill="none" strokeLinecap="round" />

            {/* =================================================================== */}
            {/* BIOLUMINESCENT GLOWING CYAN FAIRY BLOSSOMS (THE HERO SIGNATURE!)    */}
            {/* Clustered along the edges of the path and around the ancient roots  */}
            {/* =================================================================== */}
            <g id="glowing-cyan-flowers">
              {[
                // Left foreground clusters around roots & path edge
                { cx: 80, cy: 620, r: 8, glowR: 28 },
                { cx: 110, cy: 605, r: 6.5, glowR: 22 },
                { cx: 135, cy: 635, r: 7.5, glowR: 26 },
                { cx: 160, cy: 590, r: 7, glowR: 24 },
                { cx: 185, cy: 615, r: 8.5, glowR: 30 },
                { cx: 215, cy: 575, r: 6, glowR: 20 },
                { cx: 245, cy: 605, r: 7.5, glowR: 26 },
                { cx: 280, cy: 565, r: 8, glowR: 28 },
                { cx: 320, cy: 585, r: 6.5, glowR: 22 },
                { cx: 360, cy: 615, r: 8.5, glowR: 32 },

                // Center path border clusters
                { cx: 430, cy: 595, r: 6.5, glowR: 22 },
                { cx: 480, cy: 615, r: 8, glowR: 28 },
                { cx: 530, cy: 600, r: 7, glowR: 24 },
                { cx: 580, cy: 625, r: 9, glowR: 34 },
                { cx: 630, cy: 605, r: 7.5, glowR: 26 },
                { cx: 680, cy: 620, r: 8.5, glowR: 30 },
                { cx: 730, cy: 595, r: 6.5, glowR: 22 },
                { cx: 775, cy: 615, r: 8, glowR: 28 },

                // Right foreground clusters around roots & path edge
                { cx: 830, cy: 575, r: 7, glowR: 24 },
                { cx: 870, cy: 600, r: 8.5, glowR: 30 },
                { cx: 910, cy: 565, r: 6.5, glowR: 22 },
                { cx: 945, cy: 590, r: 8, glowR: 28 },
                { cx: 980, cy: 560, r: 7, glowR: 24 },
                { cx: 1015, cy: 610, r: 8.5, glowR: 32 },
                { cx: 1050, cy: 585, r: 6.5, glowR: 22 },
                { cx: 1080, cy: 625, r: 9, glowR: 34 },
                { cx: 1115, cy: 595, r: 7.5, glowR: 26 },
                { cx: 1140, cy: 630, r: 8.5, glowR: 30 },

                // Upper path-edge glowing buds
                { cx: 220, cy: 450, r: 5.5, glowR: 18 },
                { cx: 310, cy: 440, r: 6, glowR: 20 },
                { cx: 470, cy: 455, r: 5.5, glowR: 18 },
                { cx: 720, cy: 460, r: 6, glowR: 20 },
                { cx: 890, cy: 445, r: 5.5, glowR: 18 },
                { cx: 970, cy: 435, r: 6, glowR: 20 },
              ].map((fl, i) => (
                <g key={`cyan-fl-${i}`}>
                  {/* Radiant Cyan Ground Glow Halo */}
                  <circle cx={fl.cx} cy={fl.cy} r={fl.glowR} fill={`url(#cyanFlowerGlow_${uid})`} />
                  
                  {/* 5-Petal Star Fairy Blossom */}
                  <g transform={`translate(${fl.cx}, ${fl.cy}) rotate(${i * 47})`}>
                    {[0, 72, 144, 216, 288].map((angle, pIdx) => (
                      <ellipse
                        key={`petal-${pIdx}`}
                        cx="0"
                        cy={-fl.r * 0.9}
                        rx={fl.r * 0.45}
                        ry={fl.r * 0.75}
                        fill="#38bdf8"
                        opacity="0.9"
                        transform={`rotate(${angle})`}
                      />
                    ))}
                    {/* Inner Luminescent Core */}
                    <circle r={fl.r * 0.45} fill="#e0f2fe" />
                    <circle r={fl.r * 0.22} fill="#ffffff" />
                  </g>
                </g>
              ))}
            </g>

            {/* Delicate Woodland Ferns Flanking the Flowers */}
            <g stroke="#1b5e20" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85">
              <path d="M 50,650 Q 80,600 120,590" />
              <path d="M 70,640 Q 110,610 135,620" />
              <path d="M 1150,650 Q 1120,600 1080,590" />
              <path d="M 1130,640 Q 1090,610 1065,620" />
            </g>
          </g>
        )}

        {/* ========================================================================= */}
        {/* THEME 2: IGNIS CALDERA / VOLCANIC REALM                                    */}
        {/* ========================================================================= */}
        {theme === 'IGNIS_CALDERA' && (
          <g id="ignis-caldera-scenery">
            {/* Volcanic Sky */}
            <rect width="1200" height="700" fill={`url(#ignisSkyGrad_${uid})`} />

            {/* Billowing Ash Clouds Backlit by Erupting Core */}
            <g opacity="0.6">
              <ellipse cx="600" cy="140" rx="340" ry="110" fill="#1c0b0b" />
              <ellipse cx="440" cy="100" rx="260" ry="90" fill="#2c0f0f" />
              <ellipse cx="760" cy="90" rx="280" ry="95" fill="#1c0b0b" />
            </g>

            {/* Caldera Eruption Glow in Distant Background */}
            <circle cx="600" cy="210" r="240" fill={`url(#calderaCoreGlow_${uid})`} />
            <ellipse cx="600" cy="220" rx="90" ry="24" fill="#fffbeb" />

            {/* Distant Volcanic Peak Silhouettes */}
            <polygon points="120,440 480,210 540,225 660,225 720,210 1080,440 1200,470 1200,700 0,700 0,470" fill="#1a0b0b" />

            {/* Cascading Magma Rivers Spilling Down the Volcano */}
            <path d="M 590,230 Q 560,300 520,380 Q 480,440 420,490" stroke="#f97316" strokeWidth="12" fill="none" strokeLinecap="round" />
            <path d="M 590,230 Q 560,300 520,380 Q 480,440 420,490" stroke="#fef08a" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 610,230 Q 640,310 680,390 Q 720,450 780,490" stroke="#f97316" strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M 610,230 Q 640,310 680,390 Q 720,450 780,490" stroke="#fef08a" strokeWidth="3" fill="none" strokeLinecap="round" />

            {/* =================================================================== */}
            {/* THE WINDING CRACKED BASALT ASH PATH (Where Combatants Stand!)        */}
            {/* =================================================================== */}
            <path
              d="M -20,490 
                 C 140,450 280,440 440,460 
                 C 600,480 760,470 940,450 
                 C 1080,430 1180,460 1220,490
                 L 1220,620
                 C 1060,650 900,640 740,620
                 C 560,600 380,620 220,650
                 C 80,670 -20,640 -20,620 Z"
              fill={`url(#volcanicAshPath_${uid})`}
              stroke="#1a0c0c"
              strokeWidth="2.5"
            />
            {/* Molten Magma Fissures Slicing Through the Path */}
            <path
              d="M 40,540 Q 240,510 420,535 T 780,520 T 1160,540"
              stroke={`url(#lavaStreamGrad_${uid})`}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 120,580 Q 340,560 520,575 T 880,565 T 1100,580"
              stroke={`url(#lavaStreamGrad_${uid})`}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />

            {/* =================================================================== */}
            {/* PROSCENIUM FRAMING: MASSIVE JAGGED BASALT VOLCANIC CRAGS            */}
            {/* =================================================================== */}
            {/* Left Basalt Spire Framing */}
            <polygon points="-40,-20 180,60 140,240 220,440 260,620 -40,650" fill="#150808" stroke="#331111" strokeWidth="2" />
            <polygon points="40,40 140,220 100,380 180,560 60,620" fill="#240e0e" opacity="0.75" />
            <path d="M 80,120 Q 140,260 160,460" stroke="#f97316" strokeWidth="3" fill="none" opacity="0.8" />
            <polygon points="120,60 380,40 480,140 220,160" fill="#150808" />

            {/* Right Basalt Spire Framing */}
            <polygon points="1240,-20 1020,60 1060,240 980,440 940,620 1240,650" fill="#150808" stroke="#331111" strokeWidth="2" />
            <polygon points="1160,40 1060,220 1100,380 1020,560 1140,620" fill="#240e0e" opacity="0.75" />
            <path d="M 1120,120 Q 1060,260 1040,460" stroke="#f97316" strokeWidth="3" fill="none" opacity="0.8" />
            <polygon points="1080,60 820,40 720,140 980,160" fill="#150808" />

            {/* =================================================================== */}
            {/* BIOLUMINESCENT INCANDESCENT FLAME BLOSSOMS                          */}
            {/* =================================================================== */}
            <g id="glowing-flame-flowers">
              {[
                { cx: 120, cy: 610, r: 8, glowR: 30 },
                { cx: 180, cy: 590, r: 7, glowR: 24 },
                { cx: 240, cy: 625, r: 8.5, glowR: 32 },
                { cx: 330, cy: 575, r: 7, glowR: 26 },
                { cx: 480, cy: 610, r: 8, glowR: 28 },
                { cx: 620, cy: 615, r: 9, glowR: 34 },
                { cx: 750, cy: 585, r: 7, glowR: 26 },
                { cx: 880, cy: 615, r: 8.5, glowR: 32 },
                { cx: 960, cy: 580, r: 7, glowR: 26 },
                { cx: 1040, cy: 610, r: 8.5, glowR: 30 },
                { cx: 1100, cy: 630, r: 8, glowR: 28 },
              ].map((fl, i) => (
                <g key={`flame-fl-${i}`}>
                  <circle cx={fl.cx} cy={fl.cy} r={fl.glowR} fill={`url(#flameFlowerGlow_${uid})`} />
                  <g transform={`translate(${fl.cx}, ${fl.cy}) rotate(${i * 53})`}>
                    {[0, 60, 120, 180, 240, 300].map((angle, pIdx) => (
                      <ellipse
                        key={`f-petal-${pIdx}`}
                        cx="0"
                        cy={-fl.r * 0.9}
                        rx={fl.r * 0.4}
                        ry={fl.r * 0.8}
                        fill="#f97316"
                        opacity="0.9"
                        transform={`rotate(${angle})`}
                      />
                    ))}
                    <circle r={fl.r * 0.45} fill="#fef08a" />
                    <circle r={fl.r * 0.2} fill="#ffffff" />
                  </g>
                </g>
              ))}
            </g>
          </g>
        )}

        {/* ========================================================================= */}
        {/* THEME 3: AZURE ARCHIPELAGO / OCEAN REALM                                  */}
        {/* ========================================================================= */}
        {theme === 'AZURE_ARCHIPELAGO' && (
          <g id="azure-archipelago-scenery">
            {/* Tropical Ocean Sky */}
            <rect width="1200" height="700" fill={`url(#azureSkyGrad_${uid})`} />

            {/* Puffy Anime Cumulus Clouds at Horizon */}
            <g fill="#ffffff" opacity="0.45">
              <circle cx="240" cy="200" r="80" />
              <circle cx="320" cy="180" r="100" />
              <circle cx="410" cy="200" r="85" />
              <circle cx="780" cy="190" r="90" />
              <circle cx="870" cy="170" r="105" />
              <circle cx="960" cy="200" r="80" />
            </g>

            {/* Distant Sea Stacks & Sunlit Tropical Atolls */}
            <polygon points="120,340 180,240 250,340 0,350" fill="#034e75" opacity="0.8" />
            <polygon points="960,340 1020,230 1100,340 1200,350" fill="#034e75" opacity="0.8" />

            {/* Crystal Turquoise Lagoon Water */}
            <rect y="310" width="1200" height="390" fill={`url(#oceanWater_${uid})`} />

            {/* Sunlight Wave Caustics Shimmering on Water */}
            <g stroke="#67e8f9" strokeWidth="2" fill="none" opacity="0.45">
              <path d="M 80,380 Q 240,350 420,380 T 780,370 T 1140,380" />
              <path d="M 60,420 Q 280,390 500,430 T 920,410 T 1160,420" />
              <path d="M 100,460 Q 320,430 560,470 T 980,450 T 1120,460" />
            </g>

            {/* =================================================================== */}
            {/* THE WINDING PEARLESCENT WHITE SAND SHORELINE PATH                   */}
            {/* =================================================================== */}
            <path
              d="M -20,490 
                 C 140,450 280,440 440,460 
                 C 600,480 760,470 940,450 
                 C 1080,430 1180,460 1220,490
                 L 1220,620
                 C 1060,650 900,640 740,620
                 C 560,600 380,620 220,650
                 C 80,670 -20,640 -20,620 Z"
              fill={`url(#whiteSandPath_${uid})`}
              stroke="#0284c7"
              strokeWidth="2"
            />
            {/* Wet Sand Tide Ripple Shading */}
            <path d="M 60,530 C 260,500 460,515 620,530 C 800,545 980,515 1160,525" stroke="#0284c7" strokeWidth="3" fill="none" opacity="0.3" />
            <path d="M 40,570 C 240,545 440,560 620,570 C 800,580 1000,555 1180,565" stroke="#0284c7" strokeWidth="2.5" fill="none" opacity="0.25" />

            {/* =================================================================== */}
            {/* PROSCENIUM FRAMING: CURVING DRIFTWOOD PALMS & SEA-CARVED CORAL      */}
            {/* =================================================================== */}
            {/* Left Coral & Palm Framing */}
            <path d="M -40,-20 C 120,80 140,220 120,380 C 100,480 160,560 220,640 L -40,650 Z" fill="#082f49" stroke="#0284c7" strokeWidth="2" />
            {/* Palm Fronds on Left */}
            <g fill="#059669">
              <ellipse cx="140" cy="80" rx="140" ry="45" transform="rotate(-25 140 80)" />
              <ellipse cx="200" cy="120" rx="130" ry="40" transform="rotate(15 200 120)" />
              <ellipse cx="160" cy="160" rx="120" ry="38" transform="rotate(40 160 160)" />
            </g>

            {/* Right Coral & Palm Framing */}
            <path d="M 1240,-20 C 1080,80 1060,220 1080,380 C 1100,480 1040,560 980,640 L 1240,650 Z" fill="#082f49" stroke="#0284c7" strokeWidth="2" />
            {/* Palm Fronds on Right */}
            <g fill="#059669">
              <ellipse cx="1060" cy="80" rx="140" ry="45" transform="rotate(25 1060 80)" />
              <ellipse cx="1000" cy="120" rx="130" ry="40" transform="rotate(-15 1000 120)" />
              <ellipse cx="1040" cy="160" rx="120" ry="38" transform="rotate(-40 1040 160)" />
            </g>

            {/* =================================================================== */}
            {/* BIOLUMINESCENT GLOWING AZURE SEA LILIES & ANEMONES                  */}
            {/* =================================================================== */}
            <g id="glowing-sea-flowers">
              {[
                { cx: 110, cy: 610, r: 8, glowR: 28 },
                { cx: 170, cy: 590, r: 7, glowR: 24 },
                { cx: 240, cy: 620, r: 8.5, glowR: 30 },
                { cx: 340, cy: 575, r: 6.5, glowR: 22 },
                { cx: 480, cy: 615, r: 8, glowR: 28 },
                { cx: 620, cy: 620, r: 9, glowR: 32 },
                { cx: 750, cy: 585, r: 7, glowR: 24 },
                { cx: 860, cy: 610, r: 8.5, glowR: 30 },
                { cx: 960, cy: 580, r: 7, glowR: 24 },
                { cx: 1040, cy: 615, r: 8.5, glowR: 30 },
                { cx: 1110, cy: 625, r: 8, glowR: 28 },
              ].map((fl, i) => (
                <g key={`sea-fl-${i}`}>
                  <circle cx={fl.cx} cy={fl.cy} r={fl.glowR} fill={`url(#seaFloraGlow_${uid})`} />
                  <g transform={`translate(${fl.cx}, ${fl.cy}) rotate(${i * 45})`}>
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, pIdx) => (
                      <ellipse
                        key={`s-petal-${pIdx}`}
                        cx="0"
                        cy={-fl.r * 0.85}
                        rx={fl.r * 0.35}
                        ry={fl.r * 0.75}
                        fill="#38bdf8"
                        opacity="0.9"
                        transform={`rotate(${angle})`}
                      />
                    ))}
                    <circle r={fl.r * 0.4} fill="#e0f2fe" />
                    <circle r={fl.r * 0.18} fill="#ffffff" />
                  </g>
                </g>
              ))}
            </g>
          </g>
        )}

        {/* ========================================================================= */}
        {/* THEME 4: ASTRAL CITADEL / CELESTIAL REALM                                 */}
        {/* ========================================================================= */}
        {theme === 'ASTRAL_CITADEL' && (
          <g id="astral-citadel-scenery">
            {/* Celestial Sky */}
            <rect width="1200" height="700" fill={`url(#astralSkyGrad_${uid})`} />

            {/* Radiant Sunburst Prism Halo in Sky */}
            <circle cx="600" cy="180" r="220" fill={`url(#astralSunPrism_${uid})`} />
            <circle cx="600" cy="180" r="42" fill="#ffffff" />

            {/* Divine Light Beams Sweeping Down */}
            <g stroke="#fef08a" strokeWidth="2" opacity="0.6">
              <line x1="600" y1="40" x2="600" y2="320" />
              <line x1="460" y1="180" x2="740" y2="180" />
              <line x1="500" y1="80" x2="700" y2="280" />
              <line x1="500" y1="280" x2="700" y2="80" />
            </g>

            {/* Sea of Dawn Clouds Floating in Background */}
            <g fill="#f8fafc" opacity="0.7">
              <ellipse cx="600" cy="380" rx="550" ry="110" />
              <ellipse cx="220" cy="360" rx="240" ry="90" fill="#ede9fe" />
              <ellipse cx="980" cy="360" rx="240" ry="90" fill="#ede9fe" />
            </g>

            {/* Distant High Celestial Palace Spires */}
            <polygon points="600,180 440,240 760,240" fill="#f8fafc" stroke="#f59e0b" strokeWidth="2" />
            <rect x="460" y="240" width="280" height="20" fill="#e2e8f0" />
            {[-100, -50, 0, 50, 100].map((off, idx) => (
              <rect key={`col-${idx}`} x={600 + off - 8} y="260" width="16" height="110" fill="#f8fafc" stroke="#fbbf24" strokeWidth="1" />
            ))}

            {/* =================================================================== */}
            {/* THE WINDING CELESTIAL IVORY & GOLD MARBLE PROMENADE                 */}
            {/* =================================================================== */}
            <path
              d="M -20,490 
                 C 140,450 280,440 440,460 
                 C 600,480 760,470 940,450 
                 C 1080,430 1180,460 1220,490
                 L 1220,620
                 C 1060,650 900,640 740,620
                 C 560,600 380,620 220,650
                 C 80,670 -20,640 -20,620 Z"
              fill={`url(#marbleWalkwayGrad_${uid})`}
              stroke="#fbbf24"
              strokeWidth="3"
            />
            {/* Inlaid Gold Leylines in Marble */}
            <path d="M 60,530 C 260,500 460,515 620,530 C 800,545 980,515 1160,525" stroke="#f59e0b" strokeWidth="3" fill="none" opacity="0.65" />
            <path d="M 40,570 C 240,545 440,560 620,570 C 800,580 1000,555 1180,565" stroke="#fbbf24" strokeWidth="2.5" fill="none" opacity="0.6" />

            {/* =================================================================== */}
            {/* PROSCENIUM FRAMING: CELESTIAL IVORY-GOLD MARBLE COLONNADES          */}
            {/* =================================================================== */}
            {/* Left Marble Pillars */}
            <path d="M -40,-20 C 100,60 120,200 110,360 C 100,460 140,550 200,630 L -40,650 Z" fill="#e2e8f0" stroke="#f59e0b" strokeWidth="2" />
            <rect x="60" y="80" width="35" height="420" rx="3" fill="#f8fafc" stroke="#f59e0b" strokeWidth="1.5" />
            <rect x="50" y="70" width="55" height="15" fill="#fbbf24" />
            <rect x="50" y="490" width="55" height="15" fill="#fbbf24" />

            {/* Right Marble Pillars */}
            <path d="M 1240,-20 C 1100,60 1080,200 1090,360 C 1100,460 1060,550 1000,630 L 1240,650 Z" fill="#e2e8f0" stroke="#f59e0b" strokeWidth="2" />
            <rect x="1105" y="80" width="35" height="420" rx="3" fill="#f8fafc" stroke="#f59e0b" strokeWidth="1.5" />
            <rect x="1095" y="70" width="55" height="15" fill="#fbbf24" />
            <rect x="1095" y="490" width="55" height="15" fill="#fbbf24" />

            {/* =================================================================== */}
            {/* BIOLUMINESCENT GLOWING SOLAR STAR BLOSSOMS                          */}
            {/* =================================================================== */}
            <g id="glowing-solar-flowers">
              {[
                { cx: 120, cy: 610, r: 8, glowR: 28 },
                { cx: 180, cy: 590, r: 7, glowR: 24 },
                { cx: 250, cy: 620, r: 8.5, glowR: 30 },
                { cx: 340, cy: 575, r: 6.5, glowR: 22 },
                { cx: 480, cy: 615, r: 8, glowR: 28 },
                { cx: 620, cy: 620, r: 9, glowR: 32 },
                { cx: 750, cy: 585, r: 7, glowR: 24 },
                { cx: 860, cy: 610, r: 8.5, glowR: 30 },
                { cx: 950, cy: 580, r: 7, glowR: 24 },
                { cx: 1030, cy: 615, r: 8.5, glowR: 30 },
                { cx: 1100, cy: 625, r: 8, glowR: 28 },
              ].map((fl, i) => (
                <g key={`solar-fl-${i}`}>
                  <circle cx={fl.cx} cy={fl.cy} r={fl.glowR} fill={`url(#solarBlossomGlow_${uid})`} />
                  <g transform={`translate(${fl.cx}, ${fl.cy}) rotate(${i * 45})`}>
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, pIdx) => (
                      <ellipse
                        key={`sol-petal-${pIdx}`}
                        cx="0"
                        cy={-fl.r * 0.9}
                        rx={fl.r * 0.35}
                        ry={fl.r * 0.8}
                        fill="#fde047"
                        opacity="0.9"
                        transform={`rotate(${angle})`}
                      />
                    ))}
                    <circle r={fl.r * 0.45} fill="#ffffff" />
                  </g>
                </g>
              ))}
            </g>
          </g>
        )}

        {/* ========================================================================= */}
        {/* THEME 5: THE ABYSSAL RIFT / COSMIC VOID REALM                             */}
        {/* ========================================================================= */}
        {theme === 'ABYSSAL_RIFT' && (
          <g id="abyssal-rift-scenery">
            {/* Deep Cosmic Void Sky */}
            <rect width="1200" height="700" fill={`url(#abyssalSkyGrad_${uid})`} />

            {/* Swirling Purple Cosmic Nebula Clouds */}
            <g opacity="0.6">
              <ellipse cx="600" cy="240" rx="460" ry="170" fill="#6b21a8" />
              <ellipse cx="380" cy="190" rx="260" ry="110" fill="#581c87" />
              <ellipse cx="820" cy="250" rx="280" ry="120" fill="#701a75" />
            </g>

            {/* Colossal Glowing Celestial Violet Eclipse Moon */}
            <g transform="translate(600, 190)">
              <circle r="200" fill={`url(#voidMoonHalo_${uid})`} />
              <circle r="95" fill="#f5d0fe" />
              <circle r="90" fill="#c084fc" opacity="0.9" />
              <circle cx="-30" cy="-25" r="18" fill="#9333ea" opacity="0.5" />
              <circle cx="25" cy="30" r="24" fill="#9333ea" opacity="0.45" />
              <circle cx="40" cy="-20" r="14" fill="#9333ea" opacity="0.4" />
            </g>

            {/* Twinkling Cosmic Stars */}
            <g fill="#ffffff">
              {[
                { cx: 120, cy: 90, r: 2 },
                { cx: 260, cy: 130, r: 2.5 },
                { cx: 340, cy: 70, r: 1.5 },
                { cx: 460, cy: 120, r: 2 },
                { cx: 740, cy: 80, r: 2 },
                { cx: 880, cy: 125, r: 2.5 },
                { cx: 980, cy: 75, r: 1.5 },
                { cx: 1100, cy: 100, r: 2 },
              ].map((st, i) => (
                <circle key={`v-star-${i}`} cx={st.cx} cy={st.cy} r={st.r} opacity="0.85" />
              ))}
            </g>

            {/* =================================================================== */}
            {/* THE WINDING DARK OBSIDIAN VOID CAUSEWAY                             */}
            {/* =================================================================== */}
            <path
              d="M -20,490 
                 C 140,450 280,440 440,460 
                 C 600,480 760,470 940,450 
                 C 1080,430 1180,460 1220,490
                 L 1220,620
                 C 1060,650 900,640 740,620
                 C 560,600 380,620 220,650
                 C 80,670 -20,640 -20,620 Z"
              fill={`url(#voidCosmicPath_${uid})`}
              stroke="#9333ea"
              strokeWidth="2.5"
            />
            {/* Glowing Dimensional Energy Fissures */}
            <path d="M 60,530 C 260,500 460,515 620,530 C 800,545 980,515 1160,525" stroke="#c084fc" strokeWidth="3" fill="none" opacity="0.75" />
            <path d="M 40,570 C 240,545 440,560 620,570 C 800,580 1000,555 1180,565" stroke="#e879f9" strokeWidth="2.5" fill="none" opacity="0.65" />

            {/* =================================================================== */}
            {/* PROSCENIUM FRAMING: TWISTED OBSIDIAN CRYSTAL SPIRES                 */}
            {/* =================================================================== */}
            {/* Left Obsidian Spire */}
            <polygon points="-40,-20 160,80 120,240 200,440 240,620 -40,650" fill="#120521" stroke="#c084fc" strokeWidth="2" />
            <polygon points="120,200 180,160 210,360 150,380" fill="#2d1047" stroke="#e879f9" strokeWidth="1" />

            {/* Right Obsidian Spire */}
            <polygon points="1240,-20 1040,80 1080,240 1000,440 960,620 1240,650" fill="#120521" stroke="#c084fc" strokeWidth="2" />
            <polygon points="1080,200 1020,160 990,360 1050,380" fill="#2d1047" stroke="#e879f9" strokeWidth="1" />

            {/* =================================================================== */}
            {/* BIOLUMINESCENT GLOWING VOID ORCHIDS & AMETHYST BLOOMS               */}
            {/* =================================================================== */}
            <g id="glowing-void-flowers">
              {[
                { cx: 120, cy: 610, r: 8, glowR: 28 },
                { cx: 180, cy: 590, r: 7, glowR: 24 },
                { cx: 250, cy: 620, r: 8.5, glowR: 30 },
                { cx: 340, cy: 575, r: 6.5, glowR: 22 },
                { cx: 480, cy: 615, r: 8, glowR: 28 },
                { cx: 620, cy: 620, r: 9, glowR: 32 },
                { cx: 750, cy: 585, r: 7, glowR: 24 },
                { cx: 860, cy: 610, r: 8.5, glowR: 30 },
                { cx: 950, cy: 580, r: 7, glowR: 24 },
                { cx: 1030, cy: 615, r: 8.5, glowR: 30 },
                { cx: 1100, cy: 625, r: 8, glowR: 28 },
              ].map((fl, i) => (
                <g key={`void-fl-${i}`}>
                  <circle cx={fl.cx} cy={fl.cy} r={fl.glowR} fill={`url(#voidOrchidGlow_${uid})`} />
                  <g transform={`translate(${fl.cx}, ${fl.cy}) rotate(${i * 45})`}>
                    {[0, 60, 120, 180, 240, 300].map((angle, pIdx) => (
                      <ellipse
                        key={`v-petal-${pIdx}`}
                        cx="0"
                        cy={-fl.r * 0.9}
                        rx={fl.r * 0.4}
                        ry={fl.r * 0.8}
                        fill="#c084fc"
                        opacity="0.9"
                        transform={`rotate(${angle})`}
                      />
                    ))}
                    <circle r={fl.r * 0.45} fill="#f5d0fe" />
                    <circle r={fl.r * 0.2} fill="#ffffff" />
                  </g>
                </g>
              ))}
            </g>
          </g>
        )}
      </svg>

      {/* 3. Dynamic Animated Ambient Elemental Particles Layer */}
      {/* A. Forest Shrine / Sylvan Glade: Floating Glowing Cyan Fireflies & Spores */}
      {theme === 'FOREST_SHRINE' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(26)].map((_, i) => (
            <span
              key={`forest-firefly-${i}`}
              className="absolute rounded-full pointer-events-none animate-pulse"
              style={{
                width: `${3 + (i % 4)}px`,
                height: `${3 + (i % 4)}px`,
                left: `${(i * 3.9 + 2) % 96}%`,
                top: `${(i * 4.7 + 10) % 85}%`,
                background: i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#67e8f9' : '#34d399',
                boxShadow: i % 2 === 0 ? '0 0 10px #38bdf8' : '0 0 10px #34d399',
                opacity: 0.55 + (i % 4) * 0.12,
                animationDuration: `${2.2 + (i % 4) * 0.6}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* B. Ignis Caldera: Rising Glowing Flame Embers */}
      {theme === 'IGNIS_CALDERA' && (
        <div className="w-full h-full relative overflow-hidden pointer-events-none">
          {[...Array(24)].map((_, i) => (
            <span
              key={`ember-${i}`}
              className="absolute rounded-full bg-amber-400 blur-[0.5px] pointer-events-none animate-pulse"
              style={{
                width: `${Math.random() * 4 + 2.5}px`,
                height: `${Math.random() * 4 + 2.5}px`,
                left: `${(i * 4.3 + 3) % 96}%`,
                bottom: `${(i * 4.5 + 5) % 85}%`,
                animationDuration: `${1.6 + (i % 3) * 0.5}s`,
                opacity: 0.45 + (i % 5) * 0.12,
                boxShadow: '0 0 10px #f97316',
              }}
            />
          ))}
        </div>
      )}

      {/* C. Azure Archipelago: Rising Translucent Ocean Bubbles */}
      {theme === 'AZURE_ARCHIPELAGO' && (
        <div className="w-full h-full relative overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <span
              key={`bubble-${i}`}
              className="absolute rounded-full border border-cyan-300 bg-cyan-400/20 pointer-events-none animate-pulse"
              style={{
                width: `${5 + (i % 7)}px`,
                height: `${5 + (i % 7)}px`,
                left: `${(i * 4.8 + 2) % 96}%`,
                bottom: `${(i * 5.2 + 8) % 82}%`,
                animationDuration: `${2.2 + (i % 4) * 0.5}s`,
                opacity: 0.35 + (i % 4) * 0.15,
                boxShadow: '0 0 6px rgba(56, 189, 248, 0.4)',
              }}
            />
          ))}
        </div>
      )}

      {/* D. Astral Citadel: Golden Starlight Motes */}
      {theme === 'ASTRAL_CITADEL' && (
        <div className="w-full h-full relative overflow-hidden pointer-events-none">
          {[...Array(22)].map((_, i) => (
            <span
              key={`sunmote-${i}`}
              className="absolute rounded-full bg-amber-200 pointer-events-none animate-pulse"
              style={{
                width: `${3 + (i % 4)}px`,
                height: `${3 + (i % 4)}px`,
                left: `${(i * 4.6 + 2) % 96}%`,
                top: `${(i * 5.1 + 8) % 80}%`,
                animationDuration: `${2.4 + (i % 3) * 0.7}s`,
                opacity: 0.65,
                boxShadow: '0 0 10px #fbbf24',
              }}
            />
          ))}
        </div>
      )}

      {/* E. Abyssal Rift: Cosmic Void Dust */}
      {theme === 'ABYSSAL_RIFT' && (
        <div className="w-full h-full relative overflow-hidden pointer-events-none">
          {[...Array(26)].map((_, i) => (
            <span
              key={`voidmote-${i}`}
              className="absolute rounded-full bg-purple-200 pointer-events-none animate-ping"
              style={{
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                left: `${(i * 3.9 + 2) % 96}%`,
                top: `${(i * 4.2 + 6) % 84}%`,
                animationDuration: `${3.2 + (i % 4) * 0.6}s`,
                opacity: 0.7,
                boxShadow: '0 0 8px #c084fc',
              }}
            />
          ))}
        </div>
      )}

      {/* 4. Cinematic Framing Vignette (Soft corner darkening for depth) */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/15 to-black/55 pointer-events-none" />
    </div>
  );
};
