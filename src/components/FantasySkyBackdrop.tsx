import React from 'react';

/**
 * FantasySkyBackdrop
 * High-fantasy anime sky environment inspired by Granblue Fantasy & Genshin Impact.
 * Features a bright cerulean-to-golden morning sky, sunbeams, distant floating
 * citadel spires, soft drifting cumulus clouds, and floating golden light motes.
 */
export const FantasySkyBackdrop: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Base Sky Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#7dd3fc] via-[#bae6fd] to-[#f0f9ff]" />

      {/* 2. Morning Sun Rays & Golden Corona */}
      <div className="absolute top-0 right-1/4 w-[900px] h-[700px] -translate-y-1/3 translate-x-1/4 rounded-full bg-gradient-to-br from-amber-100/60 via-yellow-200/30 to-transparent blur-3xl" />
      <div className="absolute -top-32 right-1/3 w-96 h-96 rounded-full bg-white/70 blur-2xl animate-sunbeam" />

      {/* 3. Distant Citadel Spires & Floating Sky Islands (SVG Silhouette Layer) */}
      <svg
        viewBox="0 0 1920 1080"
        className="absolute inset-0 w-full h-full object-cover opacity-35"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="citadelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#dbeafe" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="islandRock" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Far Right Floating Island & Castle Spire Complex */}
        <g transform="translate(1420, 260) scale(0.9)">
          {/* Island Underbelly */}
          <path
            d="M -60 140 Q 80 280 220 140 Q 320 220 400 130 L 360 80 L -20 90 Z"
            fill="url(#islandRock)"
          />
          {/* Spire Towers & Citadel Domes */}
          <path
            d="M 20 90 L 20 0 L 35 -30 L 50 0 L 50 90 Z
               M 70 90 L 70 -60 L 95 -110 L 120 -60 L 120 90 Z
               M 140 90 L 140 20 L 160 -10 L 180 20 L 180 90 Z
               M 200 90 L 200 -40 L 225 -85 L 250 -40 L 250 90 Z
               M 270 90 L 270 10 L 290 -15 L 310 10 L 310 90 Z"
            fill="url(#citadelGrad)"
          />
          {/* Castle Walls and Colonnades */}
          <rect x="0" y="40" width="340" height="50" rx="6" fill="url(#citadelGrad)" />
          {/* Golden Dome Accents */}
          <ellipse cx="95" cy="-60" rx="20" ry="12" fill="#fde047" opacity="0.8" />
          <ellipse cx="225" cy="-40" rx="18" ry="10" fill="#fde047" opacity="0.8" />
        </g>

        {/* Far Left Distant Spire Island */}
        <g transform="translate(40, 480) scale(0.65)">
          <path
            d="M -40 120 Q 80 240 240 110 L 200 70 L -20 80 Z"
            fill="url(#islandRock)"
          />
          <path
            d="M 40 80 L 40 -10 L 60 -50 L 80 -10 L 80 80 Z
               M 100 80 L 100 -70 L 125 -120 L 150 -70 L 150 80 Z
               M 170 80 L 170 10 L 190 -20 L 210 10 L 210 80 Z"
            fill="url(#citadelGrad)"
          />
          <rect x="20" y="40" width="200" height="40" rx="4" fill="url(#citadelGrad)" />
        </g>
      </svg>

      {/* 4. Drifting Cumulus Cloud Layers */}
      {/* Top Background Cloud */}
      <div className="absolute -top-12 left-10 w-[700px] h-[300px] rounded-full bg-white/50 blur-3xl animate-cloud-drift-slow pointer-events-none" />
      {/* Right Cloud Bank */}
      <div className="absolute top-1/4 -right-24 w-[850px] h-[450px] rounded-full bg-white/60 blur-3xl animate-cloud-drift-reverse pointer-events-none" />
      {/* Bottom Horizon Cloud Foundation */}
      <div className="absolute -bottom-24 left-0 right-0 h-96 bg-gradient-to-t from-white/90 via-sky-50/70 to-transparent blur-2xl pointer-events-none" />

      {/* 5. Golden Ambient Floating Sparkles / Light Motes */}
      <div className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_12px_#f59e0b] animate-mote" />
      <div className="absolute top-1/2 right-1/3 w-3 h-3 rounded-full bg-yellow-200 shadow-[0_0_15px_#facc15] animate-mote [animation-delay:2s]" />
      <div className="absolute top-1/5 right-1/5 w-2 h-2 rounded-full bg-sky-200 shadow-[0_0_12px_#38bdf8] animate-mote [animation-delay:3.5s]" />
      <div className="absolute top-2/3 left-1/5 w-2.5 h-2.5 rounded-full bg-amber-200 shadow-[0_0_12px_#fbbf24] animate-mote [animation-delay:1.2s]" />
      <div className="absolute top-3/4 right-1/4 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#ffffff] animate-mote [animation-delay:4.5s]" />
    </div>
  );
};
