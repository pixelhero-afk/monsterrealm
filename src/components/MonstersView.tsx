/**
 * Monsters & Equipment Management View
 * Roster display, level up, 4-slot equipment manager, and awakening chamber.
 */

import React, { useState } from 'react';
import {
  Shield,
  Zap,
  Sparkles,
  ArrowUpCircle,
  Coins,
  Flame,
  Award,
  Swords,
  PlusCircle,
  X,
  CheckCircle,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Droplets,
  Leaf,
  Sun,
  Moon,
  ArrowUpDown,
  Gem,
  Hammer,
  Trash2,
  Heart,
  Target,
  Crosshair,
  Activity,
  Package,
  Layers,
} from 'lucide-react';
import { ElementType, EquipmentItem, PlayerMonster, PlayerProfile } from '../types';
import { MONSTER_FAMILIES, MONSTER_VARIANTS, getMonsterFamily } from '../data/monsters';
import { calculateEffectiveStats } from '../engine/statCalculator';
import { getSkillDefinition } from '../data/skills';
import { ELEMENT_VISUALS } from '../data/elements';
import { EQUIPMENT_SET_BONUSES, formatEquipmentStat } from '../data/equipment';
import { MonsterAvatar } from './MonsterAvatar';
import { MonsterCard } from './MonsterCard';
import { MonsterShowcase2D } from './battle2d/MonsterShowcase2D';
import { MonsterPortraitManagerModal } from './battle2d/MonsterPortraitManagerModal';
import { MonsterCombatVisualState } from '../services/character2d/types';
import { MonsterStarRating } from './MonsterStarRating';
import { getMonsterStars } from '../utils/monsterStars';
import { getMonsterDisplayName } from '../utils/monsterNames';
import { getMonsterLevelUpCost, getTotalLevelUpCost } from '../utils/monsterLevelCost';
import { getAwakeningCost } from '../data/elementalDungeons';
import { awakeningCostService } from '../services/awakeningCostService';
import {
  awakenMonster,
  levelUpMonster,
  toggleEquipment,
  expandEquipmentInventory,
  forgeEquipment,
  dismantleEquipment,
} from '../services/apiClient';

interface MonstersViewProps {
  monsters: PlayerMonster[];
  equipment: EquipmentItem[];
  profile: PlayerProfile;
  onRefresh: () => void;
}

export const MonstersView: React.FC<MonstersViewProps> = ({
  monsters,
  equipment,
  profile,
  onRefresh,
}) => {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>(
    monsters[0]?.instanceId || ''
  );
  const [activeTab, setActiveTab] = useState<'STATS' | 'EQUIP' | 'AWAKEN'>('STATS');
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [, setAwakeningCostTick] = useState<number>(0);

  // Subscribe to live awakening cost tuning updates from DevTools
  React.useEffect(() => {
    const unsub = awakeningCostService.subscribe(() => {
      setAwakeningCostTick((t) => t + 1);
    });
    return () => unsub();
  }, []);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPortraitModalOpen, setIsPortraitModalOpen] = useState<boolean>(false);
  const [portraitModalVariantId, setPortraitModalVariantId] = useState<string>('');

  // Equipment inventory filters
  const [equipSlotFilter, setEquipSlotFilter] = useState<'ALL' | 'HELM' | 'BOOTS' | 'ARMOUR' | 'WEAPON'>('ALL');
  const [equipSetFilter, setEquipSetFilter] = useState<string>('ALL');
  const [equipStatusFilter, setEquipStatusFilter] = useState<'ALL' | 'EQUIPPED' | 'UNEQUIPPED'>('ALL');

  // Filter States: Element, Level, Awakened, Kind
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [elementFilter, setElementFilter] = useState<'ALL' | ElementType>('ALL');
  const [levelFilter, setLevelFilter] = useState<'ALL' | '1-5' | '6-10' | '11-20' | '21+'>('ALL');
  const [levelSort, setLevelSort] = useState<'NONE' | 'DESC' | 'ASC'>('NONE');
  const [awakenedFilter, setAwakenedFilter] = useState<'ALL' | 'AWAKENED' | 'UNAWAKENED'>('ALL');
  const [kindFilter, setKindFilter] = useState<'ALL' | string>('ALL');

  const activeFiltersCount =
    (elementFilter !== 'ALL' ? 1 : 0) +
    (levelFilter !== 'ALL' ? 1 : 0) +
    (levelSort !== 'NONE' ? 1 : 0) +
    (awakenedFilter !== 'ALL' ? 1 : 0) +
    (kindFilter !== 'ALL' ? 1 : 0);

  const resetFilters = () => {
    setElementFilter('ALL');
    setLevelFilter('ALL');
    setLevelSort('NONE');
    setAwakenedFilter('ALL');
    setKindFilter('ALL');
  };

  // Filter and sort the monsters roster
  const filteredMonsters = monsters.filter((m) => {
    const v = MONSTER_VARIANTS[m.variantId];
    if (!v) return false;

    // 1. Element Filter
    if (elementFilter !== 'ALL' && v.element !== elementFilter) {
      return false;
    }

    // 2. Awakened Filter
    const isAwk = m.awakeningStage !== 'BASE';
    if (awakenedFilter === 'AWAKENED' && !isAwk) return false;
    if (awakenedFilter === 'UNAWAKENED' && isAwk) return false;

    // 3. Kind / Family Filter
    if (kindFilter !== 'ALL' && v.familyId !== kindFilter) return false;

    // 4. Level Filter
    if (levelFilter === '1-5' && (m.level < 1 || m.level > 5)) return false;
    if (levelFilter === '6-10' && (m.level < 6 || m.level > 10)) return false;
    if (levelFilter === '11-20' && (m.level < 11 || m.level > 20)) return false;
    if (levelFilter === '21+' && m.level <= 20) return false;

    return true;
  });

  if (levelSort === 'DESC') {
    filteredMonsters.sort((a, b) => b.level - a.level);
  } else if (levelSort === 'ASC') {
    filteredMonsters.sort((a, b) => a.level - b.level);
  }

  const selectedMonster =
    filteredMonsters.find((m) => m.instanceId === selectedInstanceId) ||
    filteredMonsters[0] ||
    monsters.find((m) => m.instanceId === selectedInstanceId) ||
    monsters[0];
  const variant = selectedMonster ? MONSTER_VARIANTS[selectedMonster.variantId] : null;
  const family = variant ? getMonsterFamily(variant.familyId) : null;

  if (!selectedMonster || !variant || !family) {
    return <div className="p-8 text-center text-slate-400">No monsters available in roster.</div>;
  }

  // Calculate effective stats including equipment & awakening
  const equippedItems = equipment.filter((e) =>
    selectedMonster.equipmentIds?.includes(e.id)
  );
  const statBreakdown = calculateEffectiveStats({
    variant,
    level: selectedMonster.level,
    awakeningStage: selectedMonster.awakeningStage,
    equipment: equippedItems,
  });

  const isAwakened = selectedMonster.awakeningStage !== 'BASE';
  const elementVisual = ELEMENT_VISUALS[variant.element];

  const handleLevelUp = async (count: number = 1) => {
    try {
      setLoadingAction(true);
      setStatusMessage(null);
      await levelUpMonster(selectedMonster.instanceId, count);
      setStatusMessage(`Level Up Success! +${count} Level(s)`);
      onRefresh();
    } catch (err: any) {
      setStatusMessage(err.message || 'Level up failed');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAwaken = async () => {
    try {
      setLoadingAction(true);
      setStatusMessage(null);
      await awakenMonster(selectedMonster.instanceId);
      setStatusMessage(`Awakening Ritual Complete! ${variant.name} transformed!`);
      onRefresh();
    } catch (err: any) {
      setStatusMessage(err.message || 'Awakening failed');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEquip = async (itemId: string, action: 'EQUIP' | 'UNEQUIP') => {
    try {
      setLoadingAction(true);
      await toggleEquipment(selectedMonster.instanceId, itemId, action);
      onRefresh();
    } catch (err: any) {
      setStatusMessage(err.message || 'Equipment toggle failed');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleExpandInventory = async () => {
    try {
      setLoadingAction(true);
      setStatusMessage(null);
      const res = await expandEquipmentInventory();
      setStatusMessage(res.message || `Inventory successfully expanded to ${res.maxEquipmentSlots} slots!`);
      onRefresh();
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to expand equipment inventory');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleForgeEquipment = async () => {
    try {
      setLoadingAction(true);
      setStatusMessage(null);
      const res = await forgeEquipment();
      setStatusMessage(`Forged ${res.item.name} (${res.item.slot} - ${res.item.set} Set) with 1 Main Stat + 3 Sub Stats!`);
      onRefresh();
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to forge equipment');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDismantleEquipment = async (itemId: string) => {
    try {
      setLoadingAction(true);
      setStatusMessage(null);
      const res = await dismantleEquipment(itemId);
      setStatusMessage(`Recycled equipment for +${res.goldAwarded} Gold!`);
      onRefresh();
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to dismantle equipment');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Status Notice */}
      {statusMessage && (
        <div className="mb-4 p-3 rounded-2xl bg-[#FEF3C7] border-2 border-[#F59E0B] text-[#92400E] text-xs font-bold flex items-center justify-between shadow-xs">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-[#92400E] hover:text-[#78350F] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* LEFT COLUMN: Roster Selection Grid (4 cols) */}
        <div className="lg:col-span-4 bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 flex flex-col shadow-xs">
          {/* Header with Title & Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-[#E8DEC8]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#D97706]" />
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#2E1F0F] font-serif">
                Roster ({filteredMonsters.length}{filteredMonsters.length !== monsters.length ? `/${monsters.length}` : ''})
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-[10px] text-[#78654E] hover:text-[#2E1F0F] flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FAF6ED] border border-[#D5C29E] transition-colors cursor-pointer"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3 h-3 text-[#D97706]" />
                  <span>Reset</span>
                </button>
              )}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`text-[11px] font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  isFilterOpen || activeFiltersCount > 0
                    ? 'fantasy-btn-gold text-[#2E1F0F]'
                    : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-[#D5C29E] text-[#5C4A34]'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Filter</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-[#D97706] text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
                {isFilterOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Expandable Filter Menu Drawer */}
          {isFilterOpen && (
            <div className="mb-3 p-3 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E] shadow-inner space-y-3 animate-fadeIn">
              {/* 1. Elemental Filter */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#78654E] mb-1.5 font-serif">
                  <span>Elemental</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'ALL', label: 'All Elements', color: 'text-[#5C4A34] border-[#D5C29E]' },
                    { id: 'FIRE', label: 'Fire', color: 'text-[#DC2626] border-[#FCA5A5]' },
                    { id: 'WATER', label: 'Water', color: 'text-[#0284C7] border-[#7DD3FC]' },
                    { id: 'GRASS', label: 'Grass', color: 'text-[#16A34A] border-[#86EFAC]' },
                    { id: 'LIGHT', label: 'Light', color: 'text-[#D97706] border-[#FCD34D]' },
                    { id: 'DARK', label: 'Dark', color: 'text-[#7C3AED] border-[#D8B4FE]' },
                  ].map((elem) => {
                    const active = elementFilter === elem.id;
                    return (
                      <button
                        key={elem.id}
                        onClick={() => setElementFilter(elem.id as any)}
                        className={`text-[10px] font-bold py-1 px-1.5 rounded-lg border text-center transition-all cursor-pointer truncate ${
                          active
                            ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E] font-black shadow-2xs ring-1 ring-[#F59E0B]'
                            : `bg-[#FFFDF9] hover:bg-[#FAF6ED] ${elem.color}`
                        }`}
                      >
                        {elem.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Kind / Monster Family Filter */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#78654E] mb-1.5 font-serif">
                  <span>Kind / Family</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'ALL', label: 'All Kinds' },
                    { id: 'fam_pyrosaur', label: 'Pyrosaur' },
                    { id: 'fam_tideguard', label: 'Tideguard' },
                    { id: 'fam_floraweaver', label: 'Floraweaver' },
                    { id: 'fam_luminary', label: 'Luminary' },
                    { id: 'fam_shadowstalker', label: 'Shadowstalker' },
                  ].map((kind) => {
                    const active = kindFilter === kind.id;
                    return (
                      <button
                        key={kind.id}
                        onClick={() => setKindFilter(kind.id)}
                        className={`text-[10px] font-bold py-1 px-1 rounded-lg border text-center transition-all cursor-pointer truncate ${
                          active
                            ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E] font-black shadow-2xs ring-1 ring-[#F59E0B]'
                            : 'bg-[#FFFDF9] border-[#D5C29E] text-[#5C4A34] hover:bg-[#FAF6ED]'
                        }`}
                      >
                        {kind.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Awakening Status Filter */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#78654E] mb-1.5 font-serif">
                  <span>Awakened Status</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: 'AWAKENED', label: 'Awakened ★' },
                    { id: 'UNAWAKENED', label: 'Base Only' },
                  ].map((awk) => {
                    const active = awakenedFilter === awk.id;
                    return (
                      <button
                        key={awk.id}
                        onClick={() => setAwakenedFilter(awk.id as any)}
                        className={`text-[10px] font-bold py-1 px-1 rounded-lg border text-center transition-all cursor-pointer truncate ${
                          active
                            ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E] font-black shadow-2xs ring-1 ring-[#F59E0B]'
                            : 'bg-[#FFFDF9] border-[#D5C29E] text-[#5C4A34] hover:bg-[#FAF6ED]'
                        }`}
                      >
                        {awk.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Level Range & Sort Filter */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#78654E] mb-1.5 flex items-center justify-between font-serif">
                  <span>Level Range & Sort</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setLevelSort(levelSort === 'DESC' ? 'NONE' : 'DESC')}
                      className={`text-[9px] px-1.5 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        levelSort === 'DESC'
                          ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E] font-black'
                          : 'bg-[#FFFDF9] border-[#D5C29E] text-[#78654E] hover:text-[#2E1F0F]'
                      }`}
                      title="Sort highest level first"
                    >
                      Lv ↓
                    </button>
                    <button
                      onClick={() => setLevelSort(levelSort === 'ASC' ? 'NONE' : 'ASC')}
                      className={`text-[9px] px-1.5 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        levelSort === 'ASC'
                          ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E] font-black'
                          : 'bg-[#FFFDF9] border-[#D5C29E] text-[#78654E] hover:text-[#2E1F0F]'
                      }`}
                      title="Sort lowest level first"
                    >
                      Lv ↑
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: '1-5', label: '1–5' },
                    { id: '6-10', label: '6–10' },
                    { id: '11-20', label: '11–20' },
                    { id: '21+', label: '21+' },
                  ].map((lvl) => {
                    const active = levelFilter === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        onClick={() => setLevelFilter(lvl.id as any)}
                        className={`text-[10px] font-bold py-1 rounded-lg border text-center transition-all cursor-pointer ${
                          active
                            ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E] font-black shadow-2xs ring-1 ring-[#F59E0B]'
                            : 'bg-[#FFFDF9] border-[#D5C29E] text-[#5C4A34] hover:bg-[#FAF6ED]'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Quick Filter Tag Bar (when menu is collapsed but filters active) */}
          {!isFilterOpen && activeFiltersCount > 0 && (
            <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
              {elementFilter !== 'ALL' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] flex items-center gap-1 shadow-2xs">
                  <span>Elem: {elementFilter}</span>
                  <button onClick={() => setElementFilter('ALL')} className="hover:text-[#9F1239] cursor-pointer">✕</button>
                </span>
              )}
              {kindFilter !== 'ALL' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E0F2FE] border border-[#7DD3FC] text-[#0369A1] flex items-center gap-1 shadow-2xs">
                  <span>Kind: {MONSTER_FAMILIES[kindFilter]?.familyName || kindFilter}</span>
                  <button onClick={() => setKindFilter('ALL')} className="hover:text-[#9F1239] cursor-pointer">✕</button>
                </span>
              )}
              {awakenedFilter !== 'ALL' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] flex items-center gap-1 shadow-2xs">
                  <span>{awakenedFilter === 'AWAKENED' ? 'Awakened' : 'Base'}</span>
                  <button onClick={() => setAwakenedFilter('ALL')} className="hover:text-[#9F1239] cursor-pointer">✕</button>
                </span>
              )}
              {levelFilter !== 'ALL' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] flex items-center gap-1 shadow-2xs">
                  <span>Lv {levelFilter}</span>
                  <button onClick={() => setLevelFilter('ALL')} className="hover:text-[#9F1239] cursor-pointer">✕</button>
                </span>
              )}
              {levelSort !== 'NONE' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3E8FF] border border-[#D8B4FE] text-[#7C3AED] flex items-center gap-1 shadow-2xs">
                  <span>Sort: {levelSort === 'DESC' ? 'Lv High→Low' : 'Lv Low→High'}</span>
                  <button onClick={() => setLevelSort('NONE')} className="hover:text-[#9F1239] cursor-pointer">✕</button>
                </span>
              )}
            </div>
          )}

          {/* Roster Grid or Empty Filter State */}
          {filteredMonsters.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-[#FAF6ED] border border-dashed border-[#D5C29E] my-auto">
              <Filter className="w-8 h-8 text-[#A89880] mx-auto mb-2" />
              <p className="text-xs font-black text-[#2E1F0F] mb-1 font-serif">No Monsters Found</p>
              <p className="text-[11px] text-[#78654E] mb-3">No monsters match your current filter selection.</p>
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 rounded-xl fantasy-btn-gold text-[#2E1F0F] font-black text-xs cursor-pointer shadow-2xs"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 sm:gap-2.5 max-h-[340px] lg:max-h-[600px] overflow-y-auto pr-1">
              {filteredMonsters.map((m) => {
                const v = MONSTER_VARIANTS[m.variantId];
                if (!v) return null;
                const isSelected = m.instanceId === selectedMonster.instanceId;

                return (
                  <div
                    key={m.instanceId}
                    onClick={() => setSelectedInstanceId(m.instanceId)}
                    className={`cursor-pointer transition-transform ${
                      isSelected ? 'scale-102 ring-2 ring-[#D97706] rounded-2xl shadow-md' : 'hover:scale-102'
                    }`}
                  >
                    <MonsterCard
                      variant={v}
                      level={m.level}
                      stars={m.stars}
                      awakeningStage={m.awakeningStage}
                      size="sm"
                      isSelected={isSelected}
                      showStats={false}
                      className="w-full shadow-2xs"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Detail & Enhancement Workshop (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* 2D Interactive Creature Showcase */}
          <MonsterShowcase2D
            variantId={variant.variantId}
            element={variant.element}
            isAwakened={isAwakened}
            className="w-full"
          />

          {/* Header Card: Selected Monster Identity, Lore, & Roles */}
          <div className="bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            <div
              onClick={() => {
                setPortraitModalVariantId(variant.variantId);
                setIsPortraitModalOpen(true);
              }}
              className="cursor-pointer group relative shrink-0"
              title="Click to upload or manage custom portrait"
            >
              <MonsterAvatar
                variantId={variant.variantId}
                element={variant.element}
                awakeningStage={selectedMonster.awakeningStage}
                size="md"
                className="shadow-2xs"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity border border-[#F59E0B]">
                <span className="text-[10px] text-white font-bold bg-[#92400E]/90 px-1.5 py-0.5 rounded-lg shadow">Edit PNG</span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mb-1">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border shadow-2xs"
                  style={{
                    backgroundColor: `${elementVisual.borderHex}22`,
                    borderColor: elementVisual.borderHex,
                    color: elementVisual.borderHex,
                  }}
                >
                  {variant.element}
                </span>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#FAF6ED] border border-[#D5C29E] text-[#5C4A34]">
                  {variant.rarity}
                </span>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#FEF3C7] border border-[#F59E0B]/50 text-[#92400E]">
                  Role: {variant.primaryRole}
                </span>

                <div className="flex items-center">
                  <MonsterStarRating stars={getMonsterStars(selectedMonster, variant)} size="sm" />
                </div>

                {isAwakened && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase bg-[#F59E0B] text-white shadow-2xs">
                    AWAKENED
                  </span>
                )}

                <button
                  onClick={() => {
                    setPortraitModalVariantId(variant.variantId);
                    setIsPortraitModalOpen(true);
                  }}
                  className="sm:ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF6ED] hover:bg-[#FAF0DC] border-2 border-[#2E1F0F] text-[#2E1F0F] text-[11px] font-black transition-all cursor-pointer shadow-xs active:scale-95"
                  title={`Upload custom PNG portrait for ${variant.name}`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>Upload Portrait (.png)</span>
                </button>
              </div>

              <h1 className="text-lg sm:text-xl font-black text-[#2E1F0F] font-serif tracking-wide truncate">
                {getMonsterDisplayName(variant)}
                {isAwakened && variant.awakeningStages[0]?.title && (
                  <span className="ml-2 text-xs font-sans font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full align-middle">
                    {variant.awakeningStages[0].title}
                  </span>
                )}
              </h1>
              <p className="text-xs text-[#5C4A34] mt-1 max-w-xl line-clamp-2 font-medium">
                {variant.lore}
              </p>
            </div>
          </div>

          {/* Sub-Navigation Tabs: STATS & SKILLS | EQUIPMENT | AWAKENING */}
          <div className="flex items-center gap-2 border-b border-[#D5C29E] pb-2 overflow-x-auto scrollbar-none max-w-full">
            <button
              onClick={() => setActiveTab('STATS')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs font-serif shrink-0 whitespace-nowrap border-2 ${
                activeTab === 'STATS'
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 border-[#2E1F0F] text-[#2E1F0F]'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-[#2E1F0F] text-[#2E1F0F]'
              }`}
            >
              Stats & Skills
            </button>
            <button
              onClick={() => setActiveTab('EQUIP')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs font-serif shrink-0 whitespace-nowrap border-2 ${
                activeTab === 'EQUIP'
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 border-[#2E1F0F] text-[#2E1F0F]'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-[#2E1F0F] text-[#2E1F0F]'
              }`}
            >
              Equipment ({equippedItems.length}/4)
            </button>
            <button
              onClick={() => setActiveTab('AWAKEN')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs font-serif shrink-0 whitespace-nowrap border-2 ${
                activeTab === 'AWAKEN'
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 border-[#2E1F0F] text-[#2E1F0F]'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-[#2E1F0F] text-[#2E1F0F]'
              }`}
            >
              Awakening Chamber
            </button>
          </div>

          {/* TAB 1: STATS & SKILLS */}
          {activeTab === 'STATS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Detailed Effective Stats Panel */}
              <div className="bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-2">
                  <span className="text-xs font-black text-[#2E1F0F] uppercase tracking-wider font-serif">
                    Effective Stats (Lv.{selectedMonster.level})
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={loadingAction || selectedMonster.level >= (selectedMonster.awakeningStage === 'BASE' ? 30 : 40)}
                      onClick={() => handleLevelUp(1)}
                      className="px-2.5 py-1 rounded-xl fantasy-btn-gold text-[#2E1F0F] font-black text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5 text-[#92400E]" />
                      +1 Lv ({getMonsterLevelUpCost(selectedMonster.level).toLocaleString()}g)
                    </button>
                    <button
                      disabled={loadingAction || selectedMonster.level >= (selectedMonster.awakeningStage === 'BASE' ? 30 : 40)}
                      onClick={() => handleLevelUp(5)}
                      className="px-2.5 py-1 rounded-xl bg-[#FAF6ED] hover:bg-[#F5EDE0] border border-[#D5C29E] text-[#92400E] font-black text-xs cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      +5 Lv ({getTotalLevelUpCost(selectedMonster.level, Math.min(5, (selectedMonster.awakeningStage === 'BASE' ? 30 : 40) - selectedMonster.level)).toLocaleString()}g)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8] shadow-2xs">
                    <span className="text-[#78654E] font-medium">HP:</span>
                    <span className="font-black text-[#2E1F0F] ml-2">
                      {statBreakdown.finalStats.hp}
                    </span>
                    {statBreakdown.equipmentBonuses.hp ? (
                      <span className="text-[10px] text-[#16A34A] font-bold ml-1">
                        (+{statBreakdown.equipmentBonuses.hp})
                      </span>
                    ) : null}
                  </div>

                  <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8] shadow-2xs">
                    <span className="text-[#78654E] font-medium">Attack:</span>
                    <span className="font-black text-[#2E1F0F] ml-2">
                      {statBreakdown.finalStats.attack}
                    </span>
                    {statBreakdown.equipmentBonuses.attack ? (
                      <span className="text-[10px] text-[#16A34A] font-bold ml-1">
                        (+{statBreakdown.equipmentBonuses.attack})
                      </span>
                    ) : null}
                  </div>

                  <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8] shadow-2xs">
                    <span className="text-[#78654E] font-medium">Defense:</span>
                    <span className="font-black text-[#2E1F0F] ml-2">
                      {statBreakdown.finalStats.defense}
                    </span>
                    {statBreakdown.equipmentBonuses.defense ? (
                      <span className="text-[10px] text-[#16A34A] font-bold ml-1">
                        (+{statBreakdown.equipmentBonuses.defense})
                      </span>
                    ) : null}
                  </div>

                  <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8] shadow-2xs">
                    <span className="text-[#78654E] font-medium">Speed:</span>
                    <span className="font-black text-[#D97706] ml-2">
                      {statBreakdown.finalStats.speed}
                    </span>
                    {statBreakdown.equipmentBonuses.speed ? (
                      <span className="text-[10px] text-[#16A34A] font-bold ml-1">
                        (+{statBreakdown.equipmentBonuses.speed})
                      </span>
                    ) : null}
                  </div>

                  <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8] shadow-2xs">
                    <span className="text-[#78654E] font-medium">Crit Rate:</span>
                    <span className="font-black text-[#2E1F0F] ml-2">
                      {Math.round(statBreakdown.finalStats.critRate * 100)}%
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8] shadow-2xs">
                    <span className="text-[#78654E] font-medium">Crit Dmg:</span>
                    <span className="font-black text-[#2E1F0F] ml-2">
                      {Math.round(statBreakdown.finalStats.critDamage * 100)}%
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8] shadow-2xs">
                    <span className="text-[#78654E] font-medium">Accuracy:</span>
                    <span className="font-black text-[#2E1F0F] ml-2">
                      {Math.round(statBreakdown.finalStats.accuracy * 100)}%
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8] shadow-2xs">
                    <span className="text-[#78654E] font-medium">Resistance:</span>
                    <span className="font-black text-[#2E1F0F] ml-2">
                      {Math.round(statBreakdown.finalStats.resistance * 100)}%
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8] shadow-2xs">
                    <span className="text-[#78654E] font-medium flex items-center gap-1">
                      <Heart className="w-3 h-3 text-emerald-600" /> Healing Done:
                    </span>
                    <span className="font-black text-[#059669] ml-2">
                      +{Math.round((statBreakdown.finalStats.healingDone || 0) * 100)}%
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8] shadow-2xs">
                    <span className="text-[#78654E] font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3 text-cyan-600" /> Shielding Done:
                    </span>
                    <span className="font-black text-[#0284C7] ml-2">
                      +{Math.round((statBreakdown.finalStats.shieldingDone || 0) * 100)}%
                    </span>
                  </div>
                </div>

                {statBreakdown.activeSetBonuses.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#E8DEC8] text-[11px] text-[#92400E] font-black flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                    Active Sets: {statBreakdown.activeSetBonuses.join(', ')}
                  </div>
                )}
              </div>

              {/* Skills Arsenal */}
              <div className="bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl p-4 space-y-3 shadow-xs">
                <span className="text-xs font-black text-[#2E1F0F] uppercase tracking-wider font-serif">
                  Skill Arsenal
                </span>

                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {variant.skills.map((skillId, idx) => {
                    const skill = getSkillDefinition(skillId);
                    if (!skill) return null;

                    return (
                      <div
                        key={skill.id}
                        className="p-2.5 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8] text-xs shadow-2xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-[#92400E] flex items-center gap-1.5 font-serif">
                            <Zap className="w-3.5 h-3.5 text-[#D97706]" />
                            {idx === 0 ? 'Basic Attack' : `Skill ${idx + 1}`}: {skill.name}
                          </span>
                          <span className="text-[10px] text-[#78654E] font-medium border border-[#D5C29E] bg-[#FAF6ED] px-1.5 py-0.2 rounded-md">
                            {skill.cooldown === 0 ? 'No Cooldown' : `${skill.cooldown} Turn CD`}
                          </span>
                        </div>
                        <p className="text-[#5C4A34] text-[11px] leading-relaxed font-medium">
                          {skill.description}
                        </p>
                      </div>
                    );
                  })}

                  {/* Passive Skill */}
                  {variant.passiveSkillId && (
                    <div className="p-2.5 rounded-xl bg-[#FAF5FF] border border-[#D8B4FE] text-xs shadow-2xs">
                      <div className="font-black text-[#7C3AED] flex items-center gap-1.5 mb-1 font-serif">
                        <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" />
                        Passive: {getSkillDefinition(variant.passiveSkillId)?.name}
                      </div>
                      <p className="text-[#5C4A34] text-[11px] leading-relaxed font-medium">
                        {getSkillDefinition(variant.passiveSkillId)?.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EQUIPMENT MANAGER */}
          {activeTab === 'EQUIP' && (() => {
            const currentCapacity = profile.maxEquipmentSlots || 60;
            const isInventoryFull = equipment.length >= currentCapacity;
            const canExpand = currentCapacity < 200;
            const canAffordExpand = profile.currencies.gems >= 500;
            const canAffordForge = profile.currencies.gold >= 1000;

            const slots = ['HELM', 'BOOTS', 'ARMOUR', 'WEAPON'] as const;

            // Helper to match equipment item to slot
            const isMatchSlot = (itemSlot: string, targetSlot: string) => {
              if (itemSlot === targetSlot) return true;
              if (targetSlot === 'ARMOUR' && (itemSlot === 'ARMOR' || itemSlot === 'ARMOUR')) return true;
              return false;
            };

            // Filter inventory items
            const filteredInventory = equipment.filter((item) => {
              if (equipSlotFilter !== 'ALL' && !isMatchSlot(item.slot, equipSlotFilter)) {
                return false;
              }
              if (equipSetFilter !== 'ALL' && item.set !== equipSetFilter) {
                return false;
              }
              const isEquippedAny = monsters.some((m) => m.equipmentIds?.includes(item.id));
              if (equipStatusFilter === 'EQUIPPED' && !isEquippedAny) return false;
              if (equipStatusFilter === 'UNEQUIPPED' && isEquippedAny) return false;
              return true;
            });

            return (
              <div className="bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-5 shadow-xs">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8DEC8] pb-3.5">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-[#2E1F0F] font-serif flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#D97706]" />
                      4-Slot Equipment Workshop
                    </h3>
                    <p className="text-xs text-[#5C4A34] mt-0.5">
                      Each monster equips 4 pieces: <strong>Helm</strong>, <strong>Boots</strong>, <strong>Armour</strong>, and <strong>Weapon</strong>.
                      Each piece rolls <strong>1 Main Stat + 3 Sub Stats</strong> (with lucky duplicate rolls possible!).
                    </p>
                  </div>

                  {/* Inventory Space Capacity & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={loadingAction || !canAffordForge || isInventoryFull}
                      onClick={handleForgeEquipment}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl fantasy-btn-gold border-2 border-[#D97706] text-[#2E1F0F] text-xs font-black transition-all hover:scale-102 cursor-pointer shadow-xs disabled:opacity-50"
                      title={isInventoryFull ? 'Inventory is full! Expand space to forge more gear.' : 'Forge a random equipment piece (1,000 Gold)'}
                    >
                      <Hammer className="w-3.5 h-3.5 text-[#92400E]" />
                      <span>Forge Gear (1,000 🪙)</span>
                    </button>

                    <button
                      type="button"
                      disabled={loadingAction || !canExpand || !canAffordExpand}
                      onClick={handleExpandInventory}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 border-2 border-purple-400 text-purple-900 text-xs font-black transition-all hover:scale-102 cursor-pointer shadow-xs disabled:opacity-50"
                      title={canExpand ? 'Expand inventory space by +10 slots (500 Gems, max 200)' : 'Maximum 200 inventory slots reached!'}
                    >
                      <Gem className="w-3.5 h-3.5 text-purple-600" />
                      <span>{canExpand ? '+10 Space (500 💎)' : 'Max Space (200)'}</span>
                    </button>
                  </div>
                </div>

                {/* Storage Capacity Status Bar */}
                <div className="p-3 rounded-xl bg-[#FAF6ED] border border-[#E8DEC8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#92400E]" />
                    <span className="font-bold text-[#2E1F0F]">
                      Equipment Bag Capacity: <strong className="font-mono text-sm">{equipment.length}</strong> / <span className="font-mono text-sm">{currentCapacity}</span>
                    </span>
                    <span className="text-[10px] text-[#78654E] font-mono">
                      (Max: 200 slots)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                    <div className="w-full bg-[#E8DEC8] rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          isInventoryFull
                            ? 'bg-red-500'
                            : equipment.length / currentCapacity > 0.8
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (equipment.length / currentCapacity) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono font-black text-[#5C4A34]">
                      {Math.round((equipment.length / currentCapacity) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Active Equipped 4 Slots */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-[#2E1F0F] uppercase tracking-wider font-serif">
                      Equipped on {getMonsterDisplayName(variant)} ({equippedItems.length}/4)
                    </span>
                    <span className="text-[10px] text-[#78654E] italic font-serif">
                      Equip 2-piece or 4-piece sets to trigger active combat bonuses
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {slots.map((slot) => {
                      const equippedItem = equippedItems.find((e) => isMatchSlot(e.slot, slot));

                      // Check for duplicate substats on equipped item
                      const subStatCounts: Record<string, number> = {};
                      if (equippedItem?.subStats) {
                        equippedItem.subStats.forEach((s) => {
                          subStatCounts[s.stat] = (subStatCounts[s.stat] || 0) + 1;
                        });
                      }
                      const hasDuplicateSub = Object.values(subStatCounts).some((c) => c > 1);

                      return (
                        <div
                          key={slot}
                          className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between min-h-[160px] shadow-sm transition-all ${
                            equippedItem
                              ? 'border-[#C5A059] bg-[#FFFDF9]'
                              : 'border-dashed border-[#D5C29E] bg-[#FAF6ED]/60'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-[#78654E] font-serif border-b border-[#E8DEC8]/80 pb-1.5">
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-[#D97706]" />
                              {slot}
                            </span>
                            {equippedItem && (
                              <span className="text-xs font-mono font-black text-[#0284C7] bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200">
                                +{equippedItem.level}
                              </span>
                            )}
                          </div>

                          {equippedItem ? (
                            <div className="my-2 space-y-1.5 flex-1">
                              <div className="text-xs font-black text-[#2E1F0F] truncate" title={equippedItem.name}>
                                {equippedItem.name}
                              </div>

                              {/* Set Tag */}
                              <div className="inline-block px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200 text-[10px] font-black text-[#92400E]">
                                {equippedItem.set} SET
                              </div>

                              {/* Main Stat */}
                              <div className="text-xs font-black text-[#D97706] font-mono">
                                Main: {formatEquipmentStat(equippedItem.mainStat.stat, equippedItem.mainStat.value, equippedItem.mainStat.isPercent)}
                              </div>

                              {/* 3 Sub Stats */}
                              <div className="space-y-0.5 pt-1 border-t border-[#E8DEC8]/60">
                                <div className="text-[10px] text-[#78654E] font-bold">Sub Stats:</div>
                                {equippedItem.subStats.map((sub, sIdx) => {
                                  const count = subStatCounts[sub.stat] || 1;
                                  const isDupe = count > 1;
                                  return (
                                    <div
                                      key={sIdx}
                                      className={`text-[10px] font-mono font-semibold flex items-center justify-between px-1.5 py-0.5 rounded ${
                                        isDupe
                                          ? 'bg-amber-100/80 text-amber-900 border border-amber-300 font-bold'
                                          : 'bg-[#FAF6ED] text-[#5C4A34]'
                                      }`}
                                    >
                                      <span>{formatEquipmentStat(sub.stat, sub.value, sub.isPercent)}</span>
                                      {isDupe && (
                                        <span className="text-[9px] text-amber-700 bg-amber-200 px-1 rounded font-sans">
                                          {count}x Roll! 🔥
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {hasDuplicateSub && (
                                <div className="text-[9px] text-amber-700 bg-amber-100/90 border border-amber-300 p-1 rounded font-bold text-center">
                                  ⭐ Lucky Duplicate Sub-stat Roll!
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => handleEquip(equippedItem.id, 'UNEQUIP')}
                                className="w-full mt-2 py-1 rounded-lg text-xs font-bold text-red-700 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                              >
                                Unequip
                              </button>
                            </div>
                          ) : (
                            <div className="my-auto text-center py-4">
                              <div className="text-xs text-[#A89880] italic">Empty {slot} Slot</div>
                              <span className="text-[10px] text-[#C5A059] block mt-1">Select from inventory below</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Available Inventory Section with Filter Controls */}
                <div className="pt-4 border-t-2 border-[#E8DEC8] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#2E1F0F] font-serif flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#D97706]" />
                      Inventory Equipment ({filteredInventory.length} of {equipment.length})
                    </span>

                    {/* Filter controls: Slot, Set, Status */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {/* Slot Filter */}
                      <select
                        value={equipSlotFilter}
                        onChange={(e) => setEquipSlotFilter(e.target.value as any)}
                        className="px-2 py-1 rounded-lg bg-white border border-[#D5C29E] text-[#2E1F0F] font-bold text-xs cursor-pointer shadow-2xs"
                      >
                        <option value="ALL">All Slots</option>
                        <option value="HELM">Helm Only</option>
                        <option value="BOOTS">Boots Only</option>
                        <option value="ARMOUR">Armour Only</option>
                        <option value="WEAPON">Weapon Only</option>
                      </select>

                      {/* Set Filter */}
                      <select
                        value={equipSetFilter}
                        onChange={(e) => setEquipSetFilter(e.target.value)}
                        className="px-2 py-1 rounded-lg bg-white border border-[#D5C29E] text-[#2E1F0F] font-bold text-xs cursor-pointer shadow-2xs"
                      >
                        <option value="ALL">All Sets</option>
                        <option value="SWIFT">Swift (+25% Spd)</option>
                        <option value="FATAL">Fatal (+35% Atk)</option>
                        <option value="GUARD">Guard (+15% Def)</option>
                        <option value="ENERGY">Energy (+15% HP)</option>
                        <option value="BLADE">Blade (+12% Crit)</option>
                        <option value="FOCUS">Focus (+20% Acc)</option>
                        <option value="DESTRUCTION">Destruction (+40% CDmg)</option>
                        <option value="LIFE">Life (+20% Heal Done)</option>
                        <option value="BASTION">Bastion (+25% Shield Done)</option>
                      </select>

                      {/* Status Filter */}
                      <select
                        value={equipStatusFilter}
                        onChange={(e) => setEquipStatusFilter(e.target.value as any)}
                        className="px-2 py-1 rounded-lg bg-white border border-[#D5C29E] text-[#2E1F0F] font-bold text-xs cursor-pointer shadow-2xs"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="UNEQUIPPED">Unequipped</option>
                        <option value="EQUIPPED">Equipped</option>
                      </select>
                    </div>
                  </div>

                  {filteredInventory.length === 0 ? (
                    <div className="p-8 text-center bg-[#FAF6ED] rounded-2xl border border-dashed border-[#D5C29E] text-[#78654E] text-xs">
                      No equipment matches the selected filters. Click <strong>"Forge Gear"</strong> above to craft new pieces!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                      {filteredInventory.map((item) => {
                        const isEquippedHere = selectedMonster.equipmentIds?.includes(item.id);
                        const equippedOnOther = !isEquippedHere && monsters.find((m) => m.equipmentIds?.includes(item.id));

                        // Count duplicates in 3 substats
                        const subCounts: Record<string, number> = {};
                        item.subStats.forEach((s) => {
                          subCounts[s.stat] = (subCounts[s.stat] || 0) + 1;
                        });
                        const hasLuckyDupe = Object.values(subCounts).some((c) => c > 1);

                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-2xl border-2 bg-[#FFFDF9] flex flex-col justify-between text-xs shadow-2xs transition-all ${
                              isEquippedHere
                                ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-400'
                                : 'border-[#D5C29E] hover:border-[#D97706]'
                            }`}
                          >
                            <div className="space-y-1.5">
                              {/* Header: Name, Slot, Set */}
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="font-black text-[#2E1F0F] font-serif truncate" title={item.name}>
                                  {item.name}
                                </div>
                                <span className="px-1.5 py-0.2 rounded bg-[#FAF6ED] border border-[#D5C29E] text-[10px] font-black text-[#0284C7] shrink-0">
                                  {item.slot}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className="px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200 text-[#92400E] font-black">
                                  {item.set} SET
                                </span>
                                <span className="text-[#78654E] font-mono">
                                  Lv.{item.level}
                                </span>
                                {hasLuckyDupe && (
                                  <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 border border-red-300 font-black">
                                    Double Roll! 🔥
                                  </span>
                                )}
                              </div>

                              {/* Main Stat */}
                              <div className="p-1.5 rounded-lg bg-[#FAF6ED] border border-[#E8DEC8] text-[11px] font-mono font-black text-[#D97706]">
                                Main: {formatEquipmentStat(item.mainStat.stat, item.mainStat.value, item.mainStat.isPercent)}
                              </div>

                              {/* 3 Sub Stats */}
                              <div className="space-y-0.5 pt-1">
                                <div className="text-[10px] text-[#78654E] font-bold">Sub Stats:</div>
                                <div className="grid grid-cols-1 gap-1">
                                  {item.subStats.map((sub, sIdx) => {
                                    const dupeCount = subCounts[sub.stat] || 1;
                                    const isDupe = dupeCount > 1;

                                    return (
                                      <div
                                        key={sIdx}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center justify-between ${
                                          isDupe
                                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                                            : 'bg-white border border-[#E8DEC8] text-[#5C4A34]'
                                        }`}
                                      >
                                        <span>{formatEquipmentStat(sub.stat, sub.value, sub.isPercent)}</span>
                                        {isDupe && (
                                          <span className="text-[9px] text-amber-700 bg-amber-200 px-1 rounded font-sans">
                                            {dupeCount}x!
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Card Footer Actions: Equip / Unequip / Dismantle */}
                            <div className="mt-3 pt-2 border-t border-[#E8DEC8] flex items-center justify-between gap-1.5">
                              {isEquippedHere ? (
                                <>
                                  <span className="text-[11px] text-emerald-700 font-black flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Equipped
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleEquip(item.id, 'UNEQUIP')}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-red-700 hover:bg-red-50 border border-red-200 cursor-pointer"
                                  >
                                    Unequip
                                  </button>
                                </>
                              ) : equippedOnOther ? (
                                <>
                                  <span className="text-[10px] text-[#78654E] truncate max-w-[120px]">
                                    On {getMonsterDisplayName(MONSTER_VARIANTS[equippedOnOther.variantId] || variant)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleEquip(item.id, 'EQUIP')}
                                    className="px-2.5 py-1 rounded-lg fantasy-btn-sky text-[#0C4A6E] text-xs font-black cursor-pointer"
                                  >
                                    Transfer Here
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleDismantleEquipment(item.id)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 cursor-pointer"
                                    title="Dismantle this gear to salvage +250 Gold"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                    <span>Salvage (250🪙)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleEquip(item.id, 'EQUIP')}
                                    className="px-3 py-1 rounded-xl fantasy-btn-sky text-[#0C4A6E] text-xs font-black cursor-pointer shadow-2xs"
                                  >
                                    Equip
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 3: AWAKENING CHAMBER */}
          {activeTab === 'AWAKEN' && (() => {
            const awakenCost = getAwakeningCost(variant);
            const elemKey = awakenCost.element;
            const elemInv = profile?.elementalStones?.[elemKey] || { small: 0, medium: 0, huge: 0 };
            const magicInv = profile?.elementalStones?.MAGIC || { small: 0, medium: 0, huge: 0 };

            const hasGold = profile.currencies.gold >= awakenCost.gold;
            const hasElemSmall = elemInv.small >= awakenCost.elementalStones.small;
            const hasElemMed = elemInv.medium >= awakenCost.elementalStones.medium;
            const hasElemHuge = elemInv.huge >= awakenCost.elementalStones.huge;

            const hasMagicSmall = magicInv.small >= awakenCost.magicStones.small;
            const hasMagicMed = magicInv.medium >= awakenCost.magicStones.medium;
            const hasMagicHuge = magicInv.huge >= awakenCost.magicStones.huge;

            const canPerformAwakening =
              hasGold &&
              hasElemSmall &&
              hasElemMed &&
              hasElemHuge &&
              hasMagicSmall &&
              hasMagicMed &&
              hasMagicHuge;

            const isHighTier = variant.rarity === 'EPIC' || variant.rarity === 'LEGENDARY';

            return (
              <div className="bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-6 shadow-xs">
                <div className="border-b border-[#E8DEC8] pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-[#2E1F0F] font-serif flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        Awakening Chamber Ritual
                      </h3>
                      {awakeningCostService.isOverridden(variant.variantId) && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-400">
                          ★ Custom Tuned Cost
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        awakenCost.elementalStones.huge > 0 || awakenCost.magicStones.huge > 0
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      {awakenCost.elementalStones.huge > 0 || awakenCost.magicStones.huge > 0
                        ? `${variant.rarity} Tier • Requires Huge Stones`
                        : `${variant.rarity} Tier • Small & Medium Stones Only`}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C4A34] mt-1.5 leading-relaxed">
                    Awakening transforms the monster: unlocking enhanced skill mechanics, visual aura transformations, and permanent stat surges. Harvest Elemental and Magic stones from the 6 Elemental Dungeons!
                  </p>
                </div>

                {variant.awakeningStages.map((stage) => {
                  const isCurrentlyUnlocked = isAwakened;

                  return (
                    <div
                      key={stage.stage}
                      className={`p-5 rounded-2xl border ${
                        isCurrentlyUnlocked
                          ? 'border-[#86EFAC] bg-[#F0FDF4]'
                          : 'border-[#D8B4FE] bg-[#FAF5FF]'
                      } shadow-2xs space-y-4`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C3AED]">
                            {stage.visualTitle}
                          </span>
                          <h4 className="text-lg font-black text-[#2E1F0F] font-serif">
                            {stage.title}
                          </h4>
                        </div>

                        {isCurrentlyUnlocked ? (
                          <div className="flex items-center gap-1 text-[#16A34A] text-xs font-black bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                            <CheckCircle className="w-4 h-4" />
                            Awakened
                          </div>
                        ) : (
                          <div className="text-xs text-[#92400E] font-black flex items-center gap-1 bg-[#FEF3C7] px-2.5 py-1 rounded-lg border border-[#F59E0B]">
                            <Coins className="w-4 h-4 text-[#D97706]" />
                            {awakenCost.gold.toLocaleString()} Gold Required
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-[#5C4A34] leading-relaxed bg-[#FFFDF9] p-3 rounded-xl border border-[#D5C29E]">
                        {stage.description}
                      </p>

                      {/* Required Awakening Stones Matrix */}
                      {!isCurrentlyUnlocked && (
                        <div className="space-y-3 pt-2">
                          <span className="text-xs font-black font-serif text-[#2E1F0F] block">
                            Required Awakening Materials
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {/* Elemental Stones Card */}
                            <div className="p-3.5 rounded-xl border-2 border-amber-300 bg-amber-50/60 space-y-2">
                              <div className="flex items-center justify-between font-black text-[#92400E]">
                                <span>{elemKey} Stones (Hall of {elemKey})</span>
                                <span className="text-[10px] font-mono uppercase bg-amber-200/70 px-1.5 py-0.2 rounded">
                                  Elemental
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-mono">
                                {/* Small */}
                                <div
                                  className={`p-1.5 rounded-lg border ${
                                    hasElemSmall
                                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                                      : 'bg-rose-50 border-rose-300 text-rose-900'
                                  }`}
                                >
                                  <span className="block text-[9px] uppercase font-sans text-stone-500 font-bold">Small</span>
                                  <span className="font-black">
                                    {elemInv.small} / {awakenCost.elementalStones.small}
                                  </span>
                                </div>

                                {/* Medium */}
                                <div
                                  className={`p-1.5 rounded-lg border ${
                                    hasElemMed
                                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                                      : 'bg-rose-50 border-rose-300 text-rose-900'
                                  }`}
                                >
                                  <span className="block text-[9px] uppercase font-sans text-stone-500 font-bold">Medium</span>
                                  <span className="font-black">
                                    {elemInv.medium} / {awakenCost.elementalStones.medium}
                                  </span>
                                </div>

                                {/* Huge */}
                                <div
                                  className={`p-1.5 rounded-lg border ${
                                    awakenCost.elementalStones.huge === 0
                                      ? 'bg-stone-100 border-stone-200 text-stone-400'
                                      : hasElemHuge
                                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                                      : 'bg-rose-50 border-rose-300 text-rose-900'
                                  }`}
                                >
                                  <span className="block text-[9px] uppercase font-sans text-stone-500 font-bold">Huge</span>
                                  <span className="font-black">
                                    {awakenCost.elementalStones.huge === 0 ? '—' : `${elemInv.huge} / ${awakenCost.elementalStones.huge}`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Magic Stones Card */}
                            <div className="p-3.5 rounded-xl border-2 border-purple-300 bg-purple-50/60 space-y-2">
                              <div className="flex items-center justify-between font-black text-purple-900">
                                <span>Magic Stones (Hall of Magic)</span>
                                <span className="text-[10px] font-mono uppercase bg-purple-200/70 px-1.5 py-0.2 rounded">
                                  Universal
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-mono">
                                {/* Small */}
                                <div
                                  className={`p-1.5 rounded-lg border ${
                                    hasMagicSmall
                                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                                      : 'bg-rose-50 border-rose-300 text-rose-900'
                                  }`}
                                >
                                  <span className="block text-[9px] uppercase font-sans text-stone-500 font-bold">Small</span>
                                  <span className="font-black">
                                    {magicInv.small} / {awakenCost.magicStones.small}
                                  </span>
                                </div>

                                {/* Medium */}
                                <div
                                  className={`p-1.5 rounded-lg border ${
                                    hasMagicMed
                                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                                      : 'bg-rose-50 border-rose-300 text-rose-900'
                                  }`}
                                >
                                  <span className="block text-[9px] uppercase font-sans text-stone-500 font-bold">Medium</span>
                                  <span className="font-black">
                                    {magicInv.medium} / {awakenCost.magicStones.medium}
                                  </span>
                                </div>

                                {/* Huge */}
                                <div
                                  className={`p-1.5 rounded-lg border ${
                                    awakenCost.magicStones.huge === 0
                                      ? 'bg-stone-100 border-stone-200 text-stone-400'
                                      : hasMagicHuge
                                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                                      : 'bg-rose-50 border-rose-300 text-rose-900'
                                  }`}
                                >
                                  <span className="block text-[9px] uppercase font-sans text-stone-500 font-bold">Huge</span>
                                  <span className="font-black">
                                    {awakenCost.magicStones.huge === 0 ? '—' : `${magicInv.huge} / ${awakenCost.magicStones.huge}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {!canPerformAwakening && (
                            <p className="text-[11px] text-[#92400E] bg-amber-100/70 p-2.5 rounded-xl border border-amber-300/80 leading-relaxed">
                              ⚠️ Need more materials? Farm <strong>Hall of {elemKey}</strong> for {elemKey} Stones and <strong>Hall of Magic</strong> for Magic Stones. Low tier monsters only require Small & Medium stones, while Epic & Legendary monsters need Huge Stones from Floor B10!
                            </p>
                          )}

                          <button
                            disabled={loadingAction || !canPerformAwakening}
                            onClick={handleAwaken}
                            className={`mt-2 w-full py-3.5 rounded-xl font-black text-sm shadow-md cursor-pointer transition-all font-serif flex items-center justify-center gap-2 ${
                              canPerformAwakening
                                ? 'fantasy-btn-gold text-[#2E1F0F] hover:shadow-lg active:scale-[0.99]'
                                : 'bg-stone-200 text-stone-500 border border-stone-300 cursor-not-allowed'
                            }`}
                          >
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            <span>
                              {canPerformAwakening
                                ? `Perform Awakening Ritual (${awakenCost.gold.toLocaleString()} Gold)`
                                : 'Insufficient Awakening Stones or Gold'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
      {/* Monster Portrait Upload & Manager Modal */}
      <MonsterPortraitManagerModal
        isOpen={isPortraitModalOpen}
        onClose={() => setIsPortraitModalOpen(false)}
        initialVariantId={portraitModalVariantId}
      />
    </div>
  );
};
