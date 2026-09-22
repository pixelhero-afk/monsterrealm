/**
 * Monster Realms - Codex & Lore Encyclopedia
 * In-depth lore, elemental variants, and complete dynamic character card layouts.
 * Loads both portrait.png and status.png from canonical elemental folders:
 *   assets/characters/[unitName]/[element]/
 */

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Shield,
  Sparkles,
  Flame,
  Droplet,
  Leaf,
  Sun,
  Moon,
  Zap,
  Swords,
  Upload,
  Image as ImageIcon,
  Search,
  Filter,
  Layers,
  Crown,
  LayoutGrid,
  CheckCircle2,
  SlidersHorizontal,
  Star,
} from 'lucide-react';
import { MONSTER_FAMILIES, MONSTER_VARIANTS } from '../data/monsters';
import { ELEMENT_VISUALS } from '../data/elements';
import { CodexMonsterModal } from './CodexMonsterModal';
import { MonsterPortraitManagerModal } from './battle2d/MonsterPortraitManagerModal';
import { CodexMonsterCard } from './CodexMonsterCard';
import { MonsterVariant, ElementType } from '../types';
import { getMonsterStars } from '../utils/monsterStars';

export const CodexView: React.FC = () => {
  const families = Object.values(MONSTER_FAMILIES);
  const allVariants = useMemo(() => {
    const list = Object.values(MONSTER_VARIANTS);
    return Array.from(new Map(list.map((v) => [v.variantId, v])).values());
  }, []);

  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState<string>('ALL');
  const [selectedElementFilter, setSelectedElementFilter] = useState<string>('ALL');
  const [selectedStarFilter, setSelectedStarFilter] = useState<'ALL' | number>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVariantForDetail, setSelectedVariantForDetail] = useState<MonsterVariant | null>(null);
  const [isPortraitModalOpen, setIsPortraitModalOpen] = useState<boolean>(false);
  const [targetVariantForModal, setTargetVariantForModal] = useState<string | undefined>(undefined);

  // Filtered variants
  const filteredVariants = useMemo(() => {
    return allVariants.filter((variant) => {
      // Family filter
      if (selectedFamilyFilter !== 'ALL' && variant.familyId !== selectedFamilyFilter) {
        return false;
      }
      // Element filter
      if (selectedElementFilter !== 'ALL' && variant.element !== selectedElementFilter) {
        return false;
      }
      // Star filter (1 to 10 stars)
      if (selectedStarFilter !== 'ALL') {
        const variantStars = getMonsterStars(null, variant);
        if (variantStars !== selectedStarFilter) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = variant.name.toLowerCase().includes(q);
        const matchesVariantId = variant.variantId.toLowerCase().includes(q);
        const matchesLore = variant.lore.toLowerCase().includes(q);
        const matchesFamily = (MONSTER_FAMILIES[variant.familyId]?.familyName || '').toLowerCase().includes(q);
        const matchesAwakening = (variant.awakeningStages?.[0]?.title || '').toLowerCase().includes(q);
        if (!matchesName && !matchesVariantId && !matchesLore && !matchesFamily && !matchesAwakening) {
          return false;
        }
      }
      return true;
    });
  }, [allVariants, selectedFamilyFilter, selectedElementFilter, selectedStarFilter, searchQuery]);

  // Active family object for lore banner if family is selected
  const activeFamily = selectedFamilyFilter !== 'ALL' ? MONSTER_FAMILIES[selectedFamilyFilter] : null;

  const handleOpenPortraitManager = (variant?: MonsterVariant) => {
    setTargetVariantForModal(variant?.variantId);
    setIsPortraitModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="border-b border-[#E8DEC8] pb-4 sm:pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#92400E] mb-1 font-serif">
            <BookOpen className="w-4 h-4 text-[#D97706]" />
            Realm Encyclopedia & Elemental Roster
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-[#2E1F0F] font-serif tracking-wide">
            Monster Codex & Character Roster
          </h1>
          <p className="text-xs sm:text-sm text-[#5C4A34] mt-1 max-w-3xl font-medium">
            Explore complete character profiles with dynamically loaded elemental portraits (<code>portrait.png</code>) and full-body battle stances (<code>status.png</code>) from <code>assets/characters/[unitName]/[element]/</code>.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => handleOpenPortraitManager()}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl fantasy-btn-gold border-2 border-[#D97706] text-[#2E1F0F] font-black text-xs uppercase tracking-wider shadow-md transition-all hover:scale-102 cursor-pointer"
            title="Upload custom PNG portraits for monsters"
          >
            <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#92400E]" />
            <span>Upload Portraits</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Control Panel */}
      <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#FAF6ED] border-2 border-[#D5C29E] shadow-sm space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-full lg:max-w-md">
            <Search className="w-4 h-4 text-[#78654E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name (e.g. Pyrosaur Fire, NekoHime Water)..."
              className="w-full pl-9 pr-14 py-2 rounded-xl sm:rounded-2xl bg-white border-2 border-[#D5C29E] text-xs sm:text-sm text-[#2E1F0F] placeholder-[#78654E]/70 focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 focus:border-[#D97706]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-[#FAF6ED] border border-[#D5C29E] text-xs font-black text-[#2E1F0F] hover:bg-[#FEF3C7] hover:border-[#F59E0B] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Element Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pb-1 sm:pb-0 max-w-full">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#2E1F0F] font-serif mr-1 shrink-0">
              Element:
            </span>
            <button
              type="button"
              onClick={() => setSelectedElementFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedElementFilter === 'ALL'
                  ? 'bg-[#2E1F0F] text-white border-2 border-[#2E1F0F] shadow-sm'
                  : 'bg-white text-[#2E1F0F] border-2 border-[#D5C29E] hover:border-[#D97706] hover:bg-[#FAF6ED] shadow-2xs'
              }`}
            >
              All ({allVariants.length})
            </button>

            {[
              { elem: 'FIRE', label: 'Fire', icon: Flame, color: 'text-amber-500' },
              { elem: 'WATER', label: 'Water', icon: Droplet, color: 'text-cyan-500' },
              { elem: 'GRASS', label: 'Grass', icon: Leaf, color: 'text-emerald-500' },
              { elem: 'LIGHT', label: 'Light', icon: Sun, color: 'text-yellow-500' },
              { elem: 'DARK', label: 'Dark', icon: Moon, color: 'text-purple-400' },
            ].map(({ elem, label, icon: Icon, color }) => {
              const isActive = selectedElementFilter === elem;
              return (
                <button
                  key={elem}
                  type="button"
                  onClick={() => setSelectedElementFilter(elem)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#2E1F0F] text-white border-2 border-[#D97706] shadow-sm ring-1 ring-[#D97706]'
                      : 'bg-white text-[#2E1F0F] border-2 border-[#D5C29E] hover:border-[#D97706] hover:bg-[#FAF6ED] shadow-2xs'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stars Filter (1-10★) */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2.5 border-t-2 border-[#E8DEC8] max-w-full">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#2E1F0F] font-serif mr-1 shrink-0 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Stars (1-10★):
          </span>
          <button
            type="button"
            onClick={() => setSelectedStarFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              selectedStarFilter === 'ALL'
                ? 'bg-[#92400E] text-white border-2 border-[#92400E] shadow-sm ring-1 ring-[#D97706]'
                : 'bg-white text-[#2E1F0F] border-2 border-[#D5C29E] hover:border-[#92400E] hover:bg-[#FAF6ED] shadow-2xs'
            }`}
          >
            All Stars
          </button>

          {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map((starNum) => {
            const isActive = selectedStarFilter === starNum;
            const isTranscendent = starNum >= 6;
            const matchingCount = allVariants.filter((v) => getMonsterStars(null, v) === starNum).length;

            return (
              <button
                key={starNum}
                type="button"
                onClick={() => setSelectedStarFilter(starNum)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isActive
                    ? isTranscendent
                      ? 'bg-[#4C1D95] text-white border-2 border-[#A855F7] shadow-sm ring-2 ring-[#C084FC]'
                      : 'bg-[#78350F] text-white border-2 border-[#D97706] shadow-sm ring-2 ring-[#F59E0B]'
                    : isTranscendent
                    ? 'bg-[#FAF5FF] text-[#581C87] border-2 border-[#E9D5FF] hover:border-[#A855F7] hover:bg-[#F3E8FF] shadow-2xs'
                    : 'bg-white text-[#2E1F0F] border-2 border-[#D5C29E] hover:border-[#D97706] hover:bg-[#FAF6ED] shadow-2xs'
                }`}
                title={isTranscendent ? `${starNum}★ Transcendent Apex Tier` : `${starNum}★ Standard Tier`}
              >
                <Star
                  className={`w-3 h-3 ${
                    isTranscendent
                      ? 'text-[#A855F7] fill-[#A855F7]'
                      : 'text-amber-500 fill-amber-500'
                  }`}
                />
                <span>{starNum}★</span>
                {matchingCount > 0 && (
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded-md font-mono ${
                      isActive
                        ? 'bg-black/25 text-white'
                        : isTranscendent
                        ? 'bg-[#F3E8FF] text-[#7E22CE]'
                        : 'bg-[#FEF3C7] text-[#92400E]'
                    }`}
                  >
                    {matchingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Family Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2.5 border-t-2 border-[#E8DEC8] max-w-full">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#2E1F0F] font-serif mr-1 shrink-0">
            Family:
          </span>
          <button
            type="button"
            onClick={() => setSelectedFamilyFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              selectedFamilyFilter === 'ALL'
                ? 'bg-[#92400E] text-white border-2 border-[#92400E] shadow-sm'
                : 'bg-white text-[#2E1F0F] border-2 border-[#D5C29E] hover:border-[#92400E] hover:bg-[#FAF6ED] shadow-2xs'
            }`}
          >
            All Families
          </button>

          {families.map((fam) => {
            const isActive = selectedFamilyFilter === fam.familyId;
            return (
              <button
                key={fam.familyId}
                type="button"
                onClick={() => setSelectedFamilyFilter(fam.familyId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#92400E] text-white border-2 border-[#92400E] shadow-sm'
                    : 'bg-white text-[#2E1F0F] border-2 border-[#D5C29E] hover:border-[#92400E] hover:bg-[#FAF6ED] shadow-2xs'
                }`}
              >
                {fam.familyName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Family Ecology Lore (Optional contextual highlight) */}
      {activeFamily && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF6ED] border border-[#D5C29E] shadow-sm space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#FEF3C7] border border-[#F59E0B]/50 text-[#92400E] uppercase">
              {activeFamily.rarity} Family
            </span>
            <span className="text-xs text-[#5C4A34] font-medium">
              Available in Elements:{' '}
              <strong className="text-[#2E1F0F]">{activeFamily.availableElements.join(', ')}</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#2E1F0F] font-serif">
            {activeFamily.familyName} Lineage
          </h2>
          <p className="text-xs sm:text-sm text-[#5C4A34] leading-relaxed max-w-4xl font-medium">
            {activeFamily.lore}
          </p>
          <div className="text-xs text-[#78654E] italic font-serif pt-1">
            Visual Silhouette: {activeFamily.silhouetteTheme}
          </div>
        </div>
      )}

      {/* Results Counter Bar */}
      <div className="flex items-center justify-between px-1 text-xs text-[#78654E]">
        <div className="font-bold font-serif text-[#2E1F0F]">
          Showing {filteredVariants.length} of {allVariants.length} Character Units
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>Dynamic PNG Asset Loading Active</span>
        </div>
      </div>

      {/* Complete Codex Monster Cards Grid */}
      {filteredVariants.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredVariants.map((variant) => (
            <CodexMonsterCard
              key={variant.variantId}
              variant={variant}
              onInspect={(v) => setSelectedVariantForDetail(v)}
              onManageAssets={(v) => handleOpenPortraitManager(v)}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-[#FAF6ED] border border-[#D5C29E] space-y-3">
          <BookOpen className="w-10 h-10 text-[#D97706] mx-auto opacity-70" />
          <h3 className="text-base font-black text-[#2E1F0F] font-serif">No Monsters Match Filters</h3>
          <p className="text-xs text-[#5C4A34] max-w-md mx-auto">
            Try resetting your element or family filters, or clearing your search term.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedFamilyFilter('ALL');
              setSelectedElementFilter('ALL');
              setSearchQuery('');
            }}
            className="px-5 py-2.5 rounded-2xl fantasy-btn-gold border-2 border-[#D97706] text-[#2E1F0F] font-black text-xs uppercase tracking-wider cursor-pointer shadow-md"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Monster Inspection Modal */}
      {selectedVariantForDetail && (
        <CodexMonsterModal
          variant={selectedVariantForDetail}
          onClose={() => setSelectedVariantForDetail(null)}
        />
      )}

      {/* Monster Portrait Studio Modal */}
      <MonsterPortraitManagerModal
        isOpen={isPortraitModalOpen}
        onClose={() => {
          setIsPortraitModalOpen(false);
          setTargetVariantForModal(undefined);
        }}
        initialVariantId={targetVariantForModal}
      />
    </div>
  );
};
