/**
 * Monster Realms - Adventurer Inventory Modal
 * Provides categorized storage for Summoning Scrolls, Elemental Awakening Stones,
 * Equipment Collection, and Realm Currencies & Consumables.
 */

import React, { useState } from 'react';
import {
  X,
  Package,
  Scroll,
  Sparkles,
  Shield,
  Coins,
  Gem,
  Flame,
  Droplets,
  Leaf,
  Sun,
  Moon,
  Zap,
  ArrowRight,
  Filter,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  EquipmentItem,
  PlayerProfile,
  ScrollType,
  ElementalDungeonType,
  ScrollsInventory,
} from '../types';
import { formatEquipmentStat } from '../data/equipment';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  equipment: EquipmentItem[];
  onNavigateToSummon?: (scrollType?: ScrollType) => void;
  onNavigateToDungeons?: () => void;
  onNavigateToMonsters?: () => void;
}

type InventoryTab = 'SCROLLS' | 'STONES' | 'EQUIPMENT' | 'CURRENCIES';

const ELEMENT_COLORS: Record<ElementalDungeonType, { name: string; color: string; border: string; bg: string; icon: any }> = {
  FIRE: { name: 'Fire', color: '#EF4444', border: 'border-red-300', bg: 'bg-red-500/10 text-red-700', icon: Flame },
  WATER: { name: 'Water', color: '#3B82F6', border: 'border-blue-300', bg: 'bg-blue-500/10 text-blue-700', icon: Droplets },
  GRASS: { name: 'Grass', color: '#10B981', border: 'border-emerald-300', bg: 'bg-emerald-500/10 text-emerald-700', icon: Leaf },
  LIGHT: { name: 'Light', color: '#F59E0B', border: 'border-amber-300', bg: 'bg-amber-500/10 text-amber-700', icon: Sun },
  DARK: { name: 'Dark', color: '#8B5CF6', border: 'border-purple-300', bg: 'bg-purple-500/10 text-purple-700', icon: Moon },
  MAGIC: { name: 'Magic', color: '#A855F7', border: 'border-purple-300', bg: 'bg-purple-500/10 text-purple-700', icon: Sparkles },
};

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  profile,
  equipment = [],
  onNavigateToSummon,
  onNavigateToDungeons,
  onNavigateToMonsters,
}) => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('SCROLLS');
  const [equipSlotFilter, setEquipSlotFilter] = useState<'ALL' | 'WEAPON' | 'ARMOR' | 'HELM' | 'BOOTS'>('ALL');

  if (!isOpen) return null;

  const scrolls: ScrollsInventory = profile.scrolls || {
    normal: 0,
    epic: 0,
    legendary: 0,
    lightDark: 0,
  };

  const stones = profile.elementalStones || {
    FIRE: { small: 0, medium: 0, huge: 0 },
    WATER: { small: 0, medium: 0, huge: 0 },
    GRASS: { small: 0, medium: 0, huge: 0 },
    LIGHT: { small: 0, medium: 0, huge: 0 },
    DARK: { small: 0, medium: 0, huge: 0 },
    MAGIC: { small: 0, medium: 0, huge: 0 },
  };

  const totalScrollsCount = scrolls.normal + scrolls.epic + scrolls.legendary + scrolls.lightDark;

  const filteredEquipment = equipment.filter((eq) => {
    if (equipSlotFilter !== 'ALL' && eq.slot !== equipSlotFilter) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#1E1710]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-4xl w-full fantasy-scroll-card p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DEC8]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 border border-amber-300 flex items-center justify-center text-white shadow-xs">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#2E1F0F] font-serif flex items-center gap-2">
                Adventurer Inventory & Storage
              </h3>
              <p className="text-[11px] text-[#5C4A34]">
                Mystic Scrolls, Awakening Stones, Equipment Bag & Realm Resources
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#FFFDF9] hover:bg-[#FAF6ED] border border-[#D5C29E] text-[#78654E] hover:text-[#2E1F0F] cursor-pointer shadow-2xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 py-3 border-b border-[#E8DEC8] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('SCROLLS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'SCROLLS'
                ? 'bg-[#2E1F0F] text-[#FFFDF9] shadow-sm'
                : 'bg-[#FAF6ED] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E]'
            }`}
          >
            <Scroll className="w-4 h-4 text-amber-300" />
            <span>Mystic Scrolls ({totalScrollsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STONES')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'STONES'
                ? 'bg-[#2E1F0F] text-[#FFFDF9] shadow-sm'
                : 'bg-[#FAF6ED] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Elemental Stones</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EQUIPMENT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'EQUIPMENT'
                ? 'bg-[#2E1F0F] text-[#FFFDF9] shadow-sm'
                : 'bg-[#FAF6ED] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E]'
            }`}
          >
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Equipment Bag ({equipment.length}/{profile.maxEquipmentSlots || 60})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CURRENCIES')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'CURRENCIES'
                ? 'bg-[#2E1F0F] text-[#FFFDF9] shadow-sm'
                : 'bg-[#FAF6ED] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E]'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-500" />
            <span>Currencies & Flasks</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto py-3.5 pr-1 text-xs">
          {/* TAB 1: SCROLLS */}
          {activeTab === 'SCROLLS' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Normal Scroll */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFFDF9] to-[#FBF8EF] border-2 border-[#D5C29E] space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-800 shadow-2xs font-serif font-black text-lg">
                        📜
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#2E1F0F] font-serif">
                          Normal Mystical Scroll
                        </h4>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.2 rounded-full border border-amber-200">
                          1★ to 3★ Water / Fire / Grass
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-[#78654E] block">In Stock</span>
                      <span className="text-xl font-black text-[#2E1F0F] font-mono">{scrolls.normal}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#5C4A34] leading-relaxed">
                    Ancient arcane parchment. Can be found during Campaign battles if you are lucky. Summons a 1★ to 3★ Water, Fire, or Grass monster.
                  </p>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-stone-500 italic">Campaign Droppable</span>
                    <button
                      type="button"
                      disabled={scrolls.normal <= 0}
                      onClick={() => {
                        onClose();
                        onNavigateToSummon?.('normal');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#2E1F0F] hover:bg-[#4A3525] text-[#FFFDF9] font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                    >
                      <span>Summon</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. Epic Scroll */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF5FF] to-[#F3E8FF] border-2 border-purple-300 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-400 flex items-center justify-center text-purple-900 shadow-2xs font-serif font-black text-lg">
                        🔮
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-purple-950 font-serif">
                          Epic Mystical Scroll
                        </h4>
                        <span className="text-[10px] font-bold text-purple-900 bg-purple-200/80 px-2 py-0.2 rounded-full border border-purple-300">
                          1★ to 5★ • 0.5% for 5★ Legendary!
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-purple-700 block">In Stock</span>
                      <span className="text-xl font-black text-purple-950 font-mono">{scrolls.epic}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-purple-900/80 leading-relaxed">
                    Radiates intense elemental leyline power. Can be found in middle to high level Dungeons (Floor 4-10) if lucky. Summons 1-5★ Water, Fire, or Grass units!
                  </p>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-purple-600 font-bold">0.5% 5★ Rate • Dungeon Drop</span>
                    <button
                      type="button"
                      disabled={scrolls.epic <= 0}
                      onClick={() => {
                        onClose();
                        onNavigateToSummon?.('epic');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                    >
                      <span>Summon</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3. Legendary Scroll */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] border-2 border-amber-400 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-200 border border-amber-400 flex items-center justify-center text-amber-900 shadow-2xs font-serif font-black text-lg">
                        👑
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#5B3912] font-serif">
                          Legendary Sovereign Scroll
                        </h4>
                        <span className="text-[10px] font-black text-amber-900 bg-white/80 px-2 py-0.2 rounded-full border border-amber-300">
                          100% Guaranteed 5★ Monster!
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-amber-800 block">In Stock</span>
                      <span className="text-xl font-black text-[#5B3912] font-mono">{scrolls.legendary}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#5B3912]/80 leading-relaxed">
                    The supreme scroll of champions. Guarantees a powerful 5★ Legendary Water, Fire, or Grass monster! Obtained strictly from special events.
                  </p>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-amber-900 font-black">Events Only</span>
                    <button
                      type="button"
                      disabled={scrolls.legendary <= 0}
                      onClick={() => {
                        onClose();
                        onNavigateToSummon?.('legendary');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                    >
                      <span>Summon 5★</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 4. Light and Dark Scroll */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1E1710] to-[#2E1F0F] text-[#FFFDF9] border-2 border-amber-400 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-purple-500 border border-amber-300 flex items-center justify-center text-white shadow-2xs font-serif font-black text-lg">
                        🌓
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#FFFDF9] font-serif">
                          Light & Dark Scroll
                        </h4>
                        <span className="text-[10px] font-bold text-amber-300 bg-black/40 px-2 py-0.2 rounded-full border border-amber-400/40">
                          1★ to 5★ Light or Dark Unit
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-amber-200/70 block">In Stock</span>
                      <span className="text-xl font-black text-amber-300 font-mono">{scrolls.lightDark}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#E8DCBE] leading-relaxed">
                    Harnesses celestial solar and void energies. Summons exclusively rare Light or Dark element monsters. Obtained from special events only.
                  </p>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-amber-300 font-bold">Exclusive Light/Dark Pool</span>
                    <button
                      type="button"
                      disabled={scrolls.lightDark <= 0}
                      onClick={() => {
                        onClose();
                        onNavigateToSummon?.('lightDark');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#1E1710] font-black text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                    >
                      <span>Summon L/D</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ELEMENTAL AWAKENING STONES */}
          {activeTab === 'STONES' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK', 'MAGIC'] as const).map((elem) => {
                  const cfg = ELEMENT_COLORS[elem];
                  const inv = stones[elem] || { small: 0, medium: 0, huge: 0 };
                  const Icon = cfg.icon;

                  return (
                    <div
                      key={elem}
                      className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                          <h4 className="font-bold text-xs text-[#2E1F0F]">
                            {cfg.name} Stones
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#78654E]">
                          Hall of {elem}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                        <div className="bg-[#FAF6ED] p-1.5 rounded-lg border border-[#E8DEC8]">
                          <span className="text-[9px] text-[#78654E] block font-sans">Small</span>
                          <span className="font-bold text-xs text-[#2E1F0F]">{inv.small}</span>
                        </div>
                        <div className="bg-[#FAF6ED] p-1.5 rounded-lg border border-[#E8DEC8]">
                          <span className="text-[9px] text-[#78654E] block font-sans">Medium</span>
                          <span className="font-bold text-xs text-[#2E1F0F]">{inv.medium}</span>
                        </div>
                        <div className="bg-[#FAF6ED] p-1.5 rounded-lg border border-[#E8DEC8]">
                          <span className="text-[9px] text-[#78654E] block font-sans">Huge</span>
                          <span className="font-bold text-xs text-[#2E1F0F]">{inv.huge}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FEF3C7] border border-[#F59E0B]/50">
                <span className="text-xs text-[#92400E] font-medium">
                  Farm small, medium, and huge elemental stones from the 6 Elemental Dungeons to awaken your units!
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToDungeons?.();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#2E1F0F] hover:bg-[#4A3525] text-white font-bold text-xs shrink-0 cursor-pointer shadow-2xs ml-3"
                >
                  Go to Dungeons
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: EQUIPMENT BAG */}
          {activeTab === 'EQUIPMENT' && (
            <div className="space-y-3">
              {/* Slot Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(['ALL', 'WEAPON', 'ARMOR', 'HELM', 'BOOTS'] as const).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setEquipSlotFilter(slot)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      equipSlotFilter === slot
                        ? 'bg-[#2E1F0F] text-[#FFFDF9]'
                        : 'bg-[#FAF6ED] text-[#78654E] border border-[#D5C29E]'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {filteredEquipment.length === 0 ? (
                <div className="p-8 text-center text-[#78654E] bg-[#FFFDF9] rounded-2xl border border-[#D5C29E]">
                  No equipment pieces found matching this filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {filteredEquipment.map((eq) => (
                    <div
                      key={eq.id}
                      className="p-3 rounded-xl bg-[#FFFDF9] border border-[#D5C29E] space-y-1.5 shadow-2xs text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[#2E1F0F] font-serif truncate">{eq.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                          +{eq.level}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#78654E] flex items-center justify-between">
                        <span>{eq.slot} • {eq.rarity}</span>
                        <span className="text-purple-700 font-bold">{eq.set}</span>
                      </div>

                      <div className="pt-1 border-t border-[#E8DEC8] flex items-center justify-between font-mono text-[11px]">
                        <span className="text-[#92400E] font-bold">
                          {formatEquipmentStat(eq.mainStat.stat, eq.mainStat.value, eq.mainStat.isPercent)}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          {eq.equippedToInstanceId ? 'Equipped' : 'In Bag'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CURRENCIES & FLASKS */}
          {activeTab === 'CURRENCIES' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] space-y-1">
                  <Coins className="w-5 h-5 text-amber-500 mx-auto" />
                  <span className="text-[10px] text-[#78654E] font-bold block">Gold</span>
                  <span className="text-base font-black text-[#2E1F0F] font-mono">
                    {profile.currencies.gold.toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] space-y-1">
                  <Gem className="w-5 h-5 text-purple-600 mx-auto" />
                  <span className="text-[10px] text-[#78654E] font-bold block">Gems</span>
                  <span className="text-base font-black text-purple-900 font-mono">
                    {profile.currencies.gems.toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] space-y-1">
                  <Flame className="w-5 h-5 text-teal-600 mx-auto" />
                  <span className="text-[10px] text-[#78654E] font-bold block">Stamina</span>
                  <span className="text-base font-black text-teal-900 font-mono">
                    {profile.currencies.energy}/{profile.currencies.maxEnergy}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] space-y-1">
                  <Sparkles className="w-5 h-5 text-emerald-600 mx-auto" />
                  <span className="text-[10px] text-[#78654E] font-bold block">Summon Points</span>
                  <span className="text-base font-black text-emerald-900 font-mono">
                    {profile.currencies.summonPoints} SP
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
