/**
 * Monster Realms - News & Patch Notes Modal
 */

import React from 'react';
import { Megaphone, X, Sparkles, Swords, Shield, Zap, ExternalLink, Calendar } from 'lucide-react';
import { ActiveTab } from '../Navbar';

interface NewsAndUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: ActiveTab) => void;
}

export const NewsAndUpdatesModal: React.FC<NewsAndUpdatesModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-[#2E1F0F] bg-[#FAF3E3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FBBF24] border-2 border-[#2E1F0F] flex items-center justify-center shadow-xs">
              <Megaphone className="w-5 h-5 text-[#2E1F0F]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-serif text-[#2E1F0F] tracking-wide">
                NEWS & UPDATES
              </h2>
              <p className="text-xs text-[#78654E] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Version 1.0 • Updated today at 04:00 UTC</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#FFFDF9] border-2 border-[#2E1F0F] flex items-center justify-center text-[#2E1F0F] hover:bg-[#FAF6ED] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Main Headline Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-50 border-2 border-[#2E1F0F] shadow-xs">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#2E1F0F] text-amber-200 font-mono">
              MAJOR RELEASE
            </span>
            <h3 className="text-base sm:text-lg font-black font-serif text-[#2E1F0F] mt-2">
              NEW UNITS ADDED, PVP & EQUIPMENT DUNGEONS RELEASED!
            </h3>
            <p className="text-xs text-[#5C4A34] mt-1 leading-relaxed">
              Welcome to the latest version of Monster Realms! We have rolled out 3-wave equipment dungeons, tiered substat equipment drops, the PvP Arena system, and enhanced Astral Portal banners.
            </p>
          </div>

          {/* Section 1: Equipment Dungeons */}
          <div className="space-y-2">
            <h4 className="text-sm font-black font-serif text-[#2E1F0F] flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-600" />
              <span>3-Wave Equipment Dungeons (Fight &gt; Fight &gt; Boss)</span>
            </h4>
            <div className="p-3.5 rounded-xl bg-white border border-[#D5C29E] text-xs text-[#5C4A34] space-y-1.5 leading-relaxed">
              <p>
                Dungeons now feature consecutive 3-wave gauntlets. Vanquish the minions in waves 1 &amp; 2 before facing off against the colossal stage Boss in wave 3!
              </p>
              <ul className="list-disc list-inside space-y-1 text-[#4A3722]">
                <li><strong>Common &amp; Uncommon:</strong> 1 Main Stat.</li>
                <li><strong>Rare Gear:</strong> 1 Main Stat + 1 Substat.</li>
                <li><strong>Epic Gear:</strong> 1 Main Stat + 2 Substats.</li>
                <li><strong>Legendary Gear:</strong> 1 Main Stat + 3 Substats.</li>
                <li>Stats support both flat values and percentage rolls (+% ATK, +% HP, etc.)</li>
              </ul>
            </div>
          </div>

          {/* Section 2: PvP & Friendly Sparring */}
          <div className="space-y-2">
            <h4 className="text-sm font-black font-serif text-[#2E1F0F] flex items-center gap-2">
              <Swords className="w-4 h-4 text-amber-700" />
              <span>PvP Arena & Friendly Sparring</span>
            </h4>
            <div className="p-3.5 rounded-xl bg-white border border-[#D5C29E] text-xs text-[#5C4A34] space-y-1 leading-relaxed">
              <p>
                Challenge 4 tiers of rival NPC Summoners in the Grand PvP Arena (Bronze, Silver, Gold, Master).
              </p>
              <p>
                Friendly sparring matches against friends are now available with 0 energy cost, awarding 0 gold and 0 experience for pure tactical testing.
              </p>
            </div>
          </div>

          {/* Section 3: Astral Portal Showcase */}
          <div className="space-y-2">
            <h4 className="text-sm font-black font-serif text-[#2E1F0F] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Astral Portal: Celestial Dragon &amp; Friends</span>
            </h4>
            <div className="p-3.5 rounded-xl bg-white border border-[#D5C29E] text-xs text-[#5C4A34] space-y-1 leading-relaxed">
              <p>
                The featured summon banner currently enjoys a <strong>5x Legendary drop rate</strong>! Collect Celestial Dragon and elemental monster variants across Fire, Water, Grass, Light, and Dark.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t-2 border-[#2E1F0F] bg-[#FAF3E3] flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-[#78654E]">Monster Realms v1.0 Turn-Meter RPG</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onNavigateToTab('PVE');
              }}
              className="px-4 py-2 rounded-xl bg-[#FFFDF9] border-2 border-[#2E1F0F] text-xs font-bold text-[#2E1F0F] hover:bg-[#FAF6ED] cursor-pointer"
            >
              Explore Dungeons
            </button>
            <button
              onClick={() => {
                onClose();
                onNavigateToTab('SUMMON');
              }}
              className="px-4 py-2 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] border-2 border-[#2E1F0F] text-xs font-black text-[#2E1F0F] cursor-pointer shadow-xs"
            >
              Summon Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
