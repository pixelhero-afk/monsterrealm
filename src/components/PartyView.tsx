/**
 * Monster Realms - Dedicated Party Management View
 * 5v5 Formation Architect, 3D Creature Preview, and Owned Collection Organizer.
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Swords,
  Shield,
  Zap,
  Heart,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle,
  AlertCircle,
  Filter,
  Save,
  RotateCcw,
  Flame,
  Droplets,
  Leaf,
  Sun,
  Moon,
  Info,
  ArrowUpDown,
} from 'lucide-react';
import {
  ElementType,
  EquipmentItem,
  EquipmentSlot,
  MonsterRole,
  PlayerMonster,
  PlayerProfile,
  PvEStage,
  Rarity,
} from '../types';
import { MONSTER_VARIANTS, getMonsterVariant } from '../data/monsters';
import { ELEMENT_VISUALS } from '../data/elements';
import { calculateEffectiveStats } from '../engine/statCalculator';
import { getSkillDefinition } from '../data/skills';
import { MonsterAvatar } from './MonsterAvatar';
import { MonsterStarRating } from './MonsterStarRating';
import { getMonsterStars } from '../utils/monsterStars';
import { toggleEquipment } from '../services/apiClient';

interface PartyViewProps {
  monsters: PlayerMonster[];
  equipment?: EquipmentItem[];
  profile: PlayerProfile;
  stages: PvEStage[];
  onSaveParty: (newPartyIds: string[]) => Promise<void>;
  onDeployBattle: (stage: PvEStage) => void;
  onNavigateToCampaign: () => void;
  onRefreshData?: () => void;
}

export const PartyView: React.FC<PartyViewProps> = ({
  monsters,
  equipment = [],
  profile,
  stages,
  onSaveParty,
  onDeployBattle,
  onNavigateToCampaign,
  onRefreshData,
}) => {
  // Local equipment state
  const [localEquipment, setLocalEquipment] = useState<EquipmentItem[]>(equipment || []);

  React.useEffect(() => {
    if (equipment && equipment.length > 0) {
      setLocalEquipment(equipment);
    }
  }, [equipment]);

  // Equipment Sort & Filter state for Party Arsenal
  const [gearSortBy, setGearSortBy] = useState<'WEAPONS_FIRST' | 'ARMORS_FIRST' | 'RARITY' | 'LEVEL' | 'SET'>('WEAPONS_FIRST');
  const [gearSlotFilter, setGearSlotFilter] = useState<'ALL' | EquipmentSlot>('ALL');
  const [isEquipDrawerOpen, setIsEquipDrawerOpen] = useState<boolean>(true);
  const [isEquipProcessing, setIsEquipProcessing] = useState<boolean>(false);

  // Local active party IDs (ordered 0 to 4, max 5)
  const [activePartyIds, setActivePartyIds] = useState<string[]>(() => {
    if (profile?.activeParty && profile.activeParty.length > 0) {
      // Validate that these IDs are in player's owned monsters
      const ownedSet = new Set(monsters.map((m) => m.instanceId));
      const valid = profile.activeParty.filter((id) => ownedSet.has(id));
      if (valid.length > 0) return valid.slice(0, 5);
    }
    // Fallback to first 5 owned monsters
    return monsters.slice(0, 5).map((m) => m.instanceId);
  });

  // Selected monster instance ID for 3D inspection and replacement target
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>(() => {
    return activePartyIds[0] || monsters[0]?.instanceId || '';
  });

  // Focused slot index (0 to 4) when player clicks a specific slot to replace
  const [targetedSlotIndex, setTargetedSlotIndex] = useState<number | null>(null);

  // Filter & Sort for Owned Collection
  const [elementFilter, setElementFilter] = useState<'ALL' | ElementType>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | MonsterRole>('ALL');
  const [sortBy, setSortBy] = useState<'CP' | 'LEVEL' | 'SPEED' | 'ELEMENT'>('CP');

  // Save state feedback
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);

  // Resolve active party monster objects
  const activeMonsters = useMemo(() => {
    return activePartyIds
      .map((id) => monsters.find((m) => m.instanceId === id))
      .filter((m): m is PlayerMonster => !!m);
  }, [activePartyIds, monsters]);

  // Selected monster object
  const selectedMonster = useMemo(() => {
    return monsters.find((m) => m.instanceId === selectedInstanceId) || monsters[0];
  }, [selectedInstanceId, monsters]);

  const selectedVariant = selectedMonster ? (getMonsterVariant(selectedMonster.variantId) || MONSTER_VARIANTS[selectedMonster.variantId] || null) : null;

  // Selected monster stats
  const selectedStats = useMemo(() => {
    if (!selectedMonster || !selectedVariant) return null;
    return calculateEffectiveStats({
      variant: selectedVariant,
      level: selectedMonster.level,
      awakeningStage: selectedMonster.awakeningStage,
    }).finalStats;
  }, [selectedMonster, selectedVariant]);

  // Total Combat Power calculation of active party
  const partyTotalCP = useMemo(() => {
    return activeMonsters.reduce((acc, m) => {
      const v = getMonsterVariant(m.variantId) || MONSTER_VARIANTS[m.variantId];
      if (!v) return acc;
      const stats = calculateEffectiveStats({
        variant: v,
        level: m.level,
        awakeningStage: m.awakeningStage,
      }).finalStats;
      return (
        acc +
        Math.floor(
          stats.hp / 10 +
            stats.attack * 1.5 +
            stats.defense * 1.2 +
            stats.speed * 2
        )
      );
    }, 0);
  }, [activeMonsters]);

  // Collection filtering & sorting
  const filteredCollection = useMemo(() => {
    return monsters
      .filter((m) => {
        const v = MONSTER_VARIANTS[m.variantId];
        if (!v) return false;
        if (elementFilter !== 'ALL' && v.element !== elementFilter) return false;
        if (roleFilter !== 'ALL' && v.primaryRole !== roleFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const va = MONSTER_VARIANTS[a.variantId];
        const vb = MONSTER_VARIANTS[b.variantId];
        if (!va || !vb) return 0;

        if (sortBy === 'LEVEL') {
          return b.level - a.level;
        }
        if (sortBy === 'SPEED') {
          const sa = calculateEffectiveStats({ variant: va, level: a.level, awakeningStage: a.awakeningStage }).finalStats.speed;
          const sb = calculateEffectiveStats({ variant: vb, level: b.level, awakeningStage: b.awakeningStage }).finalStats.speed;
          return sb - sa;
        }
        if (sortBy === 'ELEMENT') {
          return va.element.localeCompare(vb.element);
        }
        // Default: CP
        const cpa = calculateEffectiveStats({ variant: va, level: a.level, awakeningStage: a.awakeningStage }).finalStats;
        const cpb = calculateEffectiveStats({ variant: vb, level: b.level, awakeningStage: b.awakeningStage }).finalStats;
        const totalA = cpa.hp / 10 + cpa.attack * 1.5 + cpa.defense * 1.2 + cpa.speed * 2;
        const totalB = cpb.hp / 10 + cpb.attack * 1.5 + cpb.defense * 1.2 + cpb.speed * 2;
        return totalB - totalA;
      });
  }, [monsters, elementFilter, roleFilter, sortBy]);

  // Helper: check if monster is in party and at which slot
  const getPartySlotOfMonster = (instanceId: string): number => {
    return activePartyIds.indexOf(instanceId);
  };

  // Move monster left in party formation
  const handleMoveLeft = (slotIndex: number) => {
    if (slotIndex <= 0 || slotIndex >= activePartyIds.length) return;
    setActivePartyIds((prev) => {
      const next = [...prev];
      const temp = next[slotIndex];
      next[slotIndex] = next[slotIndex - 1];
      next[slotIndex - 1] = temp;
      return next;
    });
    setSaveStatusMessage('Formation reordered (remember to click Save Party).');
  };

  // Move monster right in party formation
  const handleMoveRight = (slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= activePartyIds.length - 1) return;
    setActivePartyIds((prev) => {
      const next = [...prev];
      const temp = next[slotIndex];
      next[slotIndex] = next[slotIndex + 1];
      next[slotIndex + 1] = temp;
      return next;
    });
    setSaveStatusMessage('Formation reordered (remember to click Save Party).');
  };

  // Remove monster from active party
  const handleRemoveFromParty = (instanceId: string) => {
    setActivePartyIds((prev) => prev.filter((id) => id !== instanceId));
    setTargetedSlotIndex(null);
    setSaveStatusMessage('Unit removed from party.');
  };

  // Add or Replace monster in party
  const handleAssignMonster = (instanceId: string) => {
    // If monster is already in party:
    const currentSlot = activePartyIds.indexOf(instanceId);
    if (currentSlot !== -1) {
      // If player targeted a different slot, swap them!
      if (targetedSlotIndex !== null && targetedSlotIndex !== currentSlot) {
        setActivePartyIds((prev) => {
          const next = [...prev];
          const temp = next[targetedSlotIndex];
          next[targetedSlotIndex] = next[currentSlot];
          if (temp) {
            next[currentSlot] = temp;
          } else {
            next.splice(currentSlot, 1);
          }
          return next;
        });
        setTargetedSlotIndex(null);
        setSaveStatusMessage('Party positions swapped.');
      } else {
        // Just inspect
        setSelectedInstanceId(instanceId);
      }
      return;
    }

    // Monster is NOT in party
    // If player clicked a specific target slot:
    if (targetedSlotIndex !== null) {
      setSelectedInstanceId(instanceId);
      setActivePartyIds((prev) => {
        const next = [...prev];
        next[targetedSlotIndex] = instanceId;
        return next;
      });
      setTargetedSlotIndex(null);
      setSaveStatusMessage('Slot replaced with selected monster.');
      return;
    }

    // If monster was not yet selected, select it first so the player can preview its artwork & stats
    if (selectedInstanceId !== instanceId) {
      setSelectedInstanceId(instanceId);
      return;
    }

    // Otherwise (it was already selected or user clicked again), assign to party
    setSelectedInstanceId(instanceId);

    // If party has < 5 monsters, append to first empty slot
    if (activePartyIds.length < 5) {
      setActivePartyIds((prev) => [...prev, instanceId]);
      setSaveStatusMessage('Monster added to active party.');
    } else {
      // Party is full (5/5), replace the selected active monster or last slot
      const selectedActiveSlot = activePartyIds.indexOf(selectedInstanceId);
      if (selectedActiveSlot !== -1) {
        setActivePartyIds((prev) => {
          const next = [...prev];
          next[selectedActiveSlot] = instanceId;
          return next;
        });
        setSaveStatusMessage(`Replaced slot #${selectedActiveSlot + 1} with selected unit.`);
      } else {
        setActivePartyIds((prev) => {
          const next = [...prev];
          next[4] = instanceId;
          return next;
        });
        setSaveStatusMessage('Replaced slot #5 with selected unit.');
      }
    }
  };

  // Save current party configuration
  const handleSave = async () => {
    if (activePartyIds.length < 1) {
      setSaveStatusMessage('⚠️ Your party needs at least 1 monster.');
      return;
    }
    setIsSaving(true);
    try {
      await onSaveParty(activePartyIds);
      setSaveStatusMessage(`✅ Party formation (${activePartyIds.length}/5 units) successfully saved!`);
      setTimeout(() => {
        setSaveStatusMessage(null);
      }, 4000);
    } catch (err: any) {
      setSaveStatusMessage(`❌ Failed to save: ${err?.message || 'Network error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset party to starter 5 default
  const handleResetToDefault = () => {
    const starterIds = monsters.slice(0, 5).map((m) => m.instanceId);
    setActivePartyIds(starterIds);
    setSaveStatusMessage('Reset party to default 5 units.');
  };

  // Equipment Slots metadata for Monster Equipment section
  const EQUIPMENT_SLOT_META: Record<
    string,
    { label: string; icon: string; defaultStatName: string; accentColor: string }
  > = {
    WEAPON: { label: 'Weapon', icon: '⚔️', defaultStatName: 'ATK', accentColor: '#D97706' },
    ARMOR: { label: 'Armor', icon: '🛡️', defaultStatName: 'DEF', accentColor: '#0284C7' },
    HELM: { label: 'Helmet', icon: '🪖', defaultStatName: 'HP', accentColor: '#059669' },
    BOOTS: { label: 'Boots', icon: '🥾', defaultStatName: 'SPD', accentColor: '#7C3AED' },
  };

  // Get equipment items attached to a specific monster
  const getMonsterEquipment = (monster: PlayerMonster): Record<string, EquipmentItem | null> => {
    const ids = monster.equipmentIds || [];
    const equippedItems = localEquipment.filter(
      (e) => ids.includes(e.id) || e.equippedToInstanceId === monster.instanceId
    );
    return {
      WEAPON: equippedItems.find((e) => e.slot === 'WEAPON') || null,
      ARMOR: equippedItems.find((e) => e.slot === 'ARMOR') || null,
      HELM: equippedItems.find((e) => e.slot === 'HELM') || null,
      BOOTS: equippedItems.find((e) => e.slot === 'BOOTS') || null,
    };
  };

  // Equip / Unequip gear on selected monster
  const handleToggleEquipment = async (item: EquipmentItem, action: 'EQUIP' | 'UNEQUIP') => {
    if (!selectedMonster) return;
    setIsEquipProcessing(true);
    try {
      await toggleEquipment(selectedMonster.instanceId, item.id, action);

      // Optimistic update of localEquipment
      setLocalEquipment((prev) =>
        prev.map((e) => {
          if (e.id === item.id) {
            return {
              ...e,
              equippedToInstanceId: action === 'EQUIP' ? selectedMonster.instanceId : undefined,
            };
          }
          if (
            action === 'EQUIP' &&
            e.slot === item.slot &&
            e.equippedToInstanceId === selectedMonster.instanceId
          ) {
            return { ...e, equippedToInstanceId: undefined };
          }
          return e;
        })
      );

      // Also update selectedMonster's equipmentIds locally
      if (!selectedMonster.equipmentIds) {
        selectedMonster.equipmentIds = [];
      }
      if (action === 'EQUIP') {
        const existingSameSlotItem = localEquipment.find(
          (e) => e.slot === item.slot && selectedMonster.equipmentIds.includes(e.id)
        );
        selectedMonster.equipmentIds = selectedMonster.equipmentIds.filter(
          (id) => id !== existingSameSlotItem?.id && id !== item.id
        );
        selectedMonster.equipmentIds.push(item.id);
        setSaveStatusMessage(
          `⚔️ Equipped ${item.name} (+${item.level}) onto ${selectedVariant?.name || 'monster'}!`
        );
      } else {
        selectedMonster.equipmentIds = selectedMonster.equipmentIds.filter((id) => id !== item.id);
        setSaveStatusMessage(`Unequipped ${item.name} from ${selectedVariant?.name || 'monster'}.`);
      }

      onRefreshData?.();
    } catch (err: any) {
      setSaveStatusMessage(`❌ Equipment error: ${err.message || 'Failed to update'}`);
    } finally {
      setIsEquipProcessing(false);
    }
  };

  // Sort and filter weapons and armors in the party equipment vault
  const sortedAndFilteredEquipment = useMemo(() => {
    return localEquipment
      .filter((item) => {
        if (gearSlotFilter !== 'ALL' && item.slot !== gearSlotFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (gearSortBy === 'WEAPONS_FIRST') {
          const priority: Partial<Record<EquipmentSlot, number>> = { WEAPON: 0, ARMOR: 1, HELM: 2, BOOTS: 3 };
          const pa = priority[a.slot] ?? 99;
          const pb = priority[b.slot] ?? 99;
          if (pa !== pb) {
            return pa - pb;
          }
          return b.level - a.level;
        }
        if (gearSortBy === 'ARMORS_FIRST') {
          const priority: Partial<Record<EquipmentSlot, number>> = { ARMOR: 0, WEAPON: 1, HELM: 2, BOOTS: 3 };
          const pa = priority[a.slot] ?? 99;
          const pb = priority[b.slot] ?? 99;
          if (pa !== pb) {
            return pa - pb;
          }
          return b.level - a.level;
        }
        if (gearSortBy === 'RARITY') {
          const rarityOrder: Record<Rarity, number> = {
            LEGENDARY: 5,
            EPIC: 4,
            RARE: 3,
            UNCOMMON: 2,
            COMMON: 1,
          };
          const diff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
          if (diff !== 0) return diff;
          return b.level - a.level;
        }
        if (gearSortBy === 'LEVEL') {
          if (b.level !== a.level) return b.level - a.level;
          return b.mainStat.value - a.mainStat.value;
        }
        if (gearSortBy === 'SET') {
          return a.set.localeCompare(b.set);
        }
        return 0;
      });
  }, [localEquipment, gearSlotFilter, gearSortBy]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 relative z-10">
      {/* View Header: Rolled Parchment Scroll & Formation Commander */}
      <div className="fantasy-scroll-card p-4 sm:p-8 overflow-hidden">
        {/* Ornate Rolled Scroll Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 fantasy-scroll-topbar" />

        {/* Ambient Sunlit Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 sm:py-1 rounded-full bg-[#FFFBEB] border border-[#F59E0B] text-[11px] sm:text-xs font-bold text-[#854D0E] uppercase tracking-wider shadow-2xs">
              <Users className="w-3.5 h-3.5 text-[#D97706]" />
              Party Management
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-[#2E1F0F] font-serif tracking-wide">
              Tactical Battle Formation
            </h1>
            <p className="text-xs sm:text-sm text-[#5C4A34] max-w-xl leading-relaxed">
              Design and order your battle team (1 to 5 units). Smaller squads receive a tactical XP multiplier up to +100% bonus upon victory!
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 text-[11px] sm:text-xs font-semibold">
              <span className="flex items-center gap-1.5 bg-[#FFFBEB] border border-[#FDE68A] px-2.5 py-1 rounded-full text-[#92400E] shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-[#D97706]" />
                Team Power: <strong className="font-mono font-bold">{partyTotalCP.toLocaleString()} CP</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-[#F0FDFA] border border-[#99F6E4] px-2.5 py-1 rounded-full text-[#0F766E] shadow-2xs">
                <Users className="w-3.5 h-3.5 text-[#0D9488]" />
                Slots:{' '}
                <strong className={activePartyIds.length === 5 ? 'text-[#059669] font-bold' : 'text-[#D97706] font-bold'}>
                  {activePartyIds.length} / 5 Assigned
                </strong>
              </span>
            </div>
          </div>

          {/* Action CTAs: Save & Quick Deploy (Responsive 2-col on Mobile, Flex on Desktop) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            <button
              onClick={handleResetToDefault}
              className="fantasy-btn-ivory flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              title="Reset to default first 5 monsters"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#78350F]" />
              <span className="truncate">Reset</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="fantasy-btn-gold flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm tracking-wider uppercase cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span className="truncate">{isSaving ? 'Saving...' : 'Save Party'}</span>
            </button>

            <button
              onClick={() => {
                if (activePartyIds.length < 1) {
                  setSaveStatusMessage('⚠️ You must assign at least 1 monster to enter battle.');
                  return;
                }
                onDeployBattle(stages[0]);
              }}
              className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-xs sm:text-sm tracking-wider uppercase shadow-lg transition-transform hover:scale-102 cursor-pointer ${
                activePartyIds.length >= 1
                  ? 'bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 text-white border border-rose-300 shadow-rose-900/20'
                  : 'bg-[#F2E8D2] text-[#8C765C] border border-[#D5C29E] cursor-not-allowed'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>Enter Battle ({activePartyIds.length}/5)</span>
            </button>
          </div>
        </div>

        {/* Status Message Feedback Toast */}
        {saveStatusMessage && (
          <div className="relative z-10 mt-4 p-3 rounded-xl border border-[#F59E0B] bg-[#FFFBEB] text-[#92400E] text-xs font-medium flex items-center justify-between shadow-2xs">
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#D97706] shrink-0" />
              {saveStatusMessage}
            </span>
            <button
              onClick={() => setSaveStatusMessage(null)}
              className="text-[#92400E] hover:text-[#78350F] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tactical Party Size & Bonus XP Guide */}
        <div className="relative z-10 mt-4 p-3 sm:p-3.5 rounded-2xl border border-[#93C5FD] bg-[#EFF6FF] text-xs text-[#1E3A8A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D97706] shrink-0" />
            <div>
              <span className="font-bold text-[#1E293B]">Flexible Squad Size (1 to 5 units):</span>{' '}
              <span className="text-[#475569]">Fewer deployed units yield massive multipliers!</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 w-full sm:w-auto scrollbar-none">
            {[
              { size: 1, bonus: '+100% XP', label: 'Solo (200%)' },
              { size: 2, bonus: '+75% XP', label: 'Duo (175%)' },
              { size: 3, bonus: '+50% XP', label: 'Trio (150%)' },
              { size: 4, bonus: '+25% XP', label: '4 Units (125%)' },
              { size: 5, bonus: '+0% XP', label: '5 Units (100%)' },
            ].map((tier) => (
              <span
                key={tier.size}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl font-mono text-[10px] sm:text-[11px] font-bold border transition-all whitespace-nowrap ${
                  activePartyIds.length === tier.size
                    ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E] ring-1 sm:ring-2 ring-[#F59E0B]/50 shadow-sm'
                    : 'bg-[#FFFDF9] border-[#CBD5E1] text-[#64748B]'
                }`}
                title={tier.label}
              >
                {tier.size}U: <strong>{tier.bonus}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 1: ACTIVE 5-SLOT FORMATION ROW (Responsive Horizontal Carousel on Mobile) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-[#2E1F0F] font-serif tracking-wide uppercase flex items-center gap-1.5 sm:gap-2">
              <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-[#D97706]" />
              Active Party Formation (5 Slots)
            </h2>
            <span className="text-[11px] sm:text-xs text-[#78654E] font-medium hidden sm:inline">
              • Click a slot to inspect or swap
            </span>
          </div>

          {targetedSlotIndex !== null && (
            <button
              onClick={() => setTargetedSlotIndex(null)}
              className="text-xs text-[#D97706] hover:text-[#92400E] flex items-center gap-1 cursor-pointer font-bold"
            >
              Cancel Slot #{targetedSlotIndex + 1}
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Slot Navigation Pills on Mobile */}
        <div className="flex sm:hidden items-center justify-between px-1 text-[11px] text-[#78654E]">
          <span>Swipe slots horizontally &rarr;</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((idx) => {
              const hasUnit = !!activePartyIds[idx];
              const isTargeted = targetedSlotIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    const inst = activePartyIds[idx];
                    if (inst) setSelectedInstanceId(inst);
                    else setTargetedSlotIndex(idx);
                  }}
                  className={`w-6 h-6 rounded-md font-mono text-[10px] font-bold border transition-all ${
                    isTargeted
                      ? 'bg-[#0284C7] text-white border-[#0284C7]'
                      : hasUnit
                      ? 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]'
                      : 'bg-[#FFFDF9] text-[#9E8A72] border-[#D5C29E]'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Slot Cards Container */}
        <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((slotIdx) => {
            const instanceId = activePartyIds[slotIdx];
            const monster = instanceId ? monsters.find((m) => m.instanceId === instanceId) : null;
            const variant = monster ? (getMonsterVariant(monster.variantId) || MONSTER_VARIANTS[monster.variantId] || null) : null;
            const isSelected = monster && monster.instanceId === selectedInstanceId;
            const isTargeted = targetedSlotIndex === slotIdx;

            const effectiveStats = monster && variant
              ? calculateEffectiveStats({
                  variant,
                  level: monster.level,
                  awakeningStage: monster.awakeningStage,
                }).finalStats
              : null;

            const elemVisual = variant ? ELEMENT_VISUALS[variant.element] : null;

            if (monster && variant && effectiveStats && elemVisual) {
              return (
                <div
                  key={monster.instanceId}
                  onClick={() => {
                    setSelectedInstanceId(monster.instanceId);
                    setTargetedSlotIndex(null);
                  }}
                  className={`w-[260px] shrink-0 snap-center sm:w-auto relative p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group overflow-hidden ${
                    isSelected
                      ? 'border-[#D97706] bg-[#FFFBEB] shadow-md ring-2 ring-[#F59E0B]'
                      : isTargeted
                      ? 'border-[#0284C7] bg-[#F0F9FF] shadow-md ring-2 ring-[#0284C7] animate-pulse'
                      : 'border-[#D5C29E] bg-[#FFFDF9] hover:border-[#D97706] hover:shadow-md'
                  }`}
                >
                  {/* Slot Header with Badge & Removal Button */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#92400E] flex items-center gap-1">
                      Slot #{slotIdx + 1}
                      {slotIdx === 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] font-sans font-bold">
                          LEAD
                        </span>
                      )}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromParty(monster.instanceId);
                      }}
                      className="w-6 h-6 rounded-md bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#991B1B] flex items-center justify-center transition-colors cursor-pointer"
                      title="Remove unit from party"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Monster Avatar & Title */}
                  <div className="flex items-center gap-3 my-1">
                    <div className="relative">
                      <MonsterAvatar
                        variantId={variant.variantId}
                        element={variant.element}
                        variant={variant}
                        awakeningStage={monster.awakeningStage}
                        size="md"
                      />
                      <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-[#FFFDF9] border border-[#D5C29E] text-[10px] font-mono font-bold text-[#92400E] shadow-2xs">
                        Lv.{monster.level}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#2E1F0F] truncate group-hover:text-[#D97706] transition-colors">
                        {variant.name}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[#78654E] font-medium">
                        <span style={{ color: elemVisual.colorHex }}>{elemVisual.name}</span>
                        <span>•</span>
                        <span className="capitalize">{variant.primaryRole.toLowerCase()}</span>
                      </div>
                      <div className="mt-0.5">
                        <MonsterStarRating stars={getMonsterStars(monster, variant)} size="xs" showAllFiveSlots={false} />
                      </div>
                    </div>
                  </div>

                  {/* Compact Stat Summary */}
                  <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2.5 border-t border-[#E8DEC8] text-[11px] font-mono">
                    <div className="flex items-center justify-between text-[#78654E] bg-[#FAF6ED] px-2 py-0.5 rounded border border-[#E9DEC9]">
                      <span className="text-[10px] text-[#9E8A72]">HP</span>
                      <span className="text-[#BE123C] font-semibold">{effectiveStats.hp}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#78654E] bg-[#FAF6ED] px-2 py-0.5 rounded border border-[#E9DEC9]">
                      <span className="text-[10px] text-[#9E8A72]">ATK</span>
                      <span className="text-[#B45309] font-semibold">{effectiveStats.attack}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#78654E] bg-[#FAF6ED] px-2 py-0.5 rounded border border-[#E9DEC9]">
                      <span className="text-[10px] text-[#9E8A72]">DEF</span>
                      <span className="text-[#0369A1] font-semibold">{effectiveStats.defense}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#78654E] bg-[#FAF6ED] px-2 py-0.5 rounded border border-[#E9DEC9]">
                      <span className="text-[10px] text-[#9E8A72]">SPD</span>
                      <span className="text-[#047857] font-semibold">{effectiveStats.speed}</span>
                    </div>
                  </div>

                  {/* Weapon Slot & Gear Count Indicator */}
                  {(() => {
                    const monsterGear = getMonsterEquipment(monster);
                    const equippedCount = Object.values(monsterGear).filter(Boolean).length;
                    return (
                      <div className="mt-2.5 pt-2 border-t border-[#E8DEC8] flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-xs shrink-0">⚔️</span>
                          {monsterGear.WEAPON ? (
                            <span className="truncate font-mono font-bold text-[#92400E]">
                              {monsterGear.WEAPON.name} (+{monsterGear.WEAPON.level})
                            </span>
                          ) : (
                            <span className="text-[#9E8A72] italic truncate text-[10px]">
                              Empty Weapon Slot
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 ml-1 text-[9px] px-1.5 py-0.5 rounded bg-[#FAF6ED] border border-[#D5C29E] font-mono text-[#78654E]">
                          {equippedCount}/4 Gear
                        </span>
                      </div>
                    );
                  })()}

                  {/* Slot Positioning Controls (Move Left / Move Right / Target to Replace) */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E8DEC8]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveLeft(slotIdx);
                      }}
                      disabled={slotIdx === 0}
                      className={`p-1.5 rounded-lg border text-xs flex items-center justify-center transition-colors cursor-pointer ${
                        slotIdx === 0
                          ? 'border-[#E2D6C0] text-[#C2B29A] cursor-not-allowed opacity-40'
                          : 'border-[#D5C29E] bg-[#FAF6ED] text-[#5C4A34] hover:bg-[#F2E8D2] hover:text-[#2E1F0F]'
                      }`}
                      title="Move Left in order"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetedSlotIndex(slotIdx === targetedSlotIndex ? null : slotIdx);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        isTargeted
                          ? 'bg-[#0284C7] text-white'
                          : 'bg-[#FAF6ED] hover:bg-[#F2E8D2] text-[#92400E] border border-[#D5C29E]'
                      }`}
                      title="Click then select monster below to swap/replace"
                    >
                      {isTargeted ? 'Targeted' : 'Swap'}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveRight(slotIdx);
                      }}
                      disabled={slotIdx >= activePartyIds.length - 1}
                      className={`p-1.5 rounded-lg border text-xs flex items-center justify-center transition-colors cursor-pointer ${
                        slotIdx >= activePartyIds.length - 1
                          ? 'border-[#E2D6C0] text-[#C2B29A] cursor-not-allowed opacity-40'
                          : 'border-[#D5C29E] bg-[#FAF6ED] text-[#5C4A34] hover:bg-[#F2E8D2] hover:text-[#2E1F0F]'
                      }`}
                      title="Move Right in order"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            // EMPTY SLOT
            return (
              <div
                key={`empty_${slotIdx}`}
                onClick={() => setTargetedSlotIndex(slotIdx)}
                className={`w-[260px] shrink-0 snap-center sm:w-auto relative min-h-[200px] sm:min-h-[220px] p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
                  isTargeted
                    ? 'border-[#0284C7] bg-[#F0F9FF] shadow-md ring-2 ring-[#0284C7] animate-pulse'
                    : 'border-[#D5C29E] hover:border-[#D97706] bg-[#FFFDF9]/60 hover:bg-[#FFFDF9]'
                }`}
              >
                <div className="absolute top-3 left-3 text-[11px] font-mono font-bold uppercase tracking-wider text-[#9E8A72]">
                  Slot #{slotIdx + 1}
                </div>

                <div className="w-12 h-12 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E] group-hover:border-[#D97706] group-hover:bg-[#FEF3C7] flex items-center justify-center text-[#9E8A72] group-hover:text-[#D97706] transition-all mb-3 shadow-2xs">
                  <Plus className="w-6 h-6" />
                </div>

                <span className="text-xs font-bold text-[#5C4A34] group-hover:text-[#D97706] transition-colors">
                  Empty Slot #{slotIdx + 1}
                </span>
                <span className="text-[10px] text-[#9E8A72] mt-1 max-w-[130px] leading-tight">
                  {isTargeted ? 'Targeted! Click a monster below to assign' : 'Click to target, or select monster below'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: 2D MONSTER INSPECTION & DETAILS PANEL */}
      {selectedMonster && selectedVariant && selectedStats && (
        <div className="fantasy-plate p-4 sm:p-6 shadow-md overflow-hidden relative">
          <div className="flex flex-col lg:flex-row gap-5 sm:gap-6 items-center lg:items-start">
            {/* Left: Monster Character Portrait & Elemental Frame */}
            <div className="w-full lg:w-5/12 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-[#FAF6ED] to-[#F5EED9] border-2 border-[#D5C29E] shadow-inner relative overflow-hidden">
              {/* Elemental Ambient Halo */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none rounded-2xl"
                style={{
                  background: `radial-gradient(circle at center, ${ELEMENT_VISUALS[selectedVariant.element]?.colorHex} 0%, transparent 70%)`,
                }}
              />

              <div className="relative my-2 z-10">
                <MonsterAvatar
                  variantId={selectedVariant.variantId}
                  element={selectedVariant.element}
                  variant={selectedVariant}
                  awakeningStage={selectedMonster.awakeningStage}
                  size="xl"
                  className="shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-[#FFFDF9] border border-[#D5C29E] text-xs font-mono font-bold text-[#92400E] shadow-sm">
                  Lv. {selectedMonster.level}
                </div>
              </div>

              {/* Rarity & Element Pill */}
              <div className="flex items-center gap-2 mt-3 z-10">
                <span
                  className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider shadow-2xs"
                  style={{
                    backgroundColor: `${ELEMENT_VISUALS[selectedVariant.element]?.colorHex}20`,
                    color: ELEMENT_VISUALS[selectedVariant.element]?.colorHex,
                    border: `1px solid ${ELEMENT_VISUALS[selectedVariant.element]?.colorHex}60`,
                  }}
                >
                  {selectedVariant.element}
                </span>
                <span className="text-xs font-bold text-[#5C4A34] px-2.5 py-1 rounded-full bg-[#FFFDF9] border border-[#D5C29E]">
                  {selectedVariant.primaryRole}
                </span>
              </div>

              <div className="mt-2.5 z-10">
                <MonsterStarRating stars={getMonsterStars(selectedMonster, selectedVariant)} size="md" />
              </div>
            </div>

            {/* Right: Detailed Stats, Role, and Action Controls */}
            <div className="w-full lg:w-7/12 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8DEC8] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider shadow-2xs"
                      style={{
                        backgroundColor: `${ELEMENT_VISUALS[selectedVariant.element]?.colorHex}15`,
                        color: ELEMENT_VISUALS[selectedVariant.element]?.colorHex,
                        border: `1px solid ${ELEMENT_VISUALS[selectedVariant.element]?.colorHex}50`,
                      }}
                    >
                      {selectedVariant.element}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#FAF6ED] border border-[#D5C29E] text-[#5C4A34] text-xs font-semibold">
                      {selectedVariant.primaryRole}
                    </span>
                    <span className="text-xs text-[#92400E] font-mono font-bold bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-full">
                      Lv. {selectedMonster.level}
                    </span>
                    <MonsterStarRating stars={getMonsterStars(selectedMonster, selectedVariant)} size="sm" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#2E1F0F] font-serif mt-1">
                    {selectedVariant.name}
                  </h3>
                  <p className="text-xs text-[#5C4A34] max-w-lg mt-0.5 leading-relaxed">
                    {selectedVariant.lore}
                  </p>
                </div>

                {/* Primary Party Action Button */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {getPartySlotOfMonster(selectedMonster.instanceId) !== -1 ? (
                    <button
                      onClick={() => handleRemoveFromParty(selectedMonster.instanceId)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#FEE2E2] hover:bg-[#FCA5A5] border border-[#FCA5A5] text-[#991B1B] text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                    >
                      <X className="w-4 h-4" />
                      Remove from Slot #{getPartySlotOfMonster(selectedMonster.instanceId) + 1}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAssignMonster(selectedMonster.instanceId)}
                      className="w-full sm:w-auto fantasy-btn-gold flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm tracking-wider uppercase cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      {targetedSlotIndex !== null
                        ? `Assign to Slot #${targetedSlotIndex + 1}`
                        : activePartyIds.length < 5
                        ? 'Add to Active Party'
                        : 'Replace Selected Slot'}
                    </button>
                  )}
                </div>
              </div>

              {/* Effective Combat Stats Gauges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#FAF6ED] border border-[#E8DEC8] shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-[#78654E] mb-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Heart className="w-3.5 h-3.5 text-[#E11D48]" />
                      HP
                    </span>
                    <span className="font-mono font-bold text-[#BE123C]">{selectedStats.hp}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E2D6C0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${Math.min(100, (selectedStats.hp / 2500) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF6ED] border border-[#E8DEC8] shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-[#78654E] mb-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Swords className="w-3.5 h-3.5 text-[#D97706]" />
                      ATK
                    </span>
                    <span className="font-mono font-bold text-[#B45309]">{selectedStats.attack}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E2D6C0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, (selectedStats.attack / 600) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF6ED] border border-[#E8DEC8] shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-[#78654E] mb-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Shield className="w-3.5 h-3.5 text-[#0284C7]" />
                      DEF
                    </span>
                    <span className="font-mono font-bold text-[#0369A1]">{selectedStats.defense}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E2D6C0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${Math.min(100, (selectedStats.defense / 600) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF6ED] border border-[#E8DEC8] shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-[#78654E] mb-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Zap className="w-3.5 h-3.5 text-[#059669]" />
                      SPD
                    </span>
                    <span className="font-mono font-bold text-[#047857]">{selectedStats.speed}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E2D6C0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, (selectedStats.speed / 200) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Skills Roster Preview */}
              <div>
                <span className="text-xs font-bold text-[#78654E] uppercase tracking-wider block mb-2">
                  Skills & Tactics
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedVariant.skills.map((skillId, sIdx) => {
                    const skill = getSkillDefinition(skillId);
                    if (!skill) return null;
                    return (
                      <div
                        key={skillId}
                        className="p-2.5 rounded-xl bg-[#FAF6ED] border border-[#E8DEC8] flex items-start gap-2.5 shadow-2xs"
                      >
                        <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] border border-[#F59E0B] text-[10px] font-mono font-bold text-[#92400E] shrink-0">
                          S{sIdx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#2E1F0F] truncate">
                            {skill.name}{' '}
                            {skill.cooldown > 0 && (
                              <span className="text-[10px] text-[#78654E] font-normal">
                                ({skill.cooldown}T CD)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#5C4A34] line-clamp-2 leading-tight">
                            {skill.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* MONSTER EQUIPMENT SLOTS SECTION (WEAPON, ARMOR, HELM, BOOTS) */}
          {(() => {
            const monsterGear = getMonsterEquipment(selectedMonster);
            const equippedCount = Object.values(monsterGear).filter(Boolean).length;

            return (
              <div className="mt-6 pt-5 border-t border-[#E8DEC8] space-y-4">
                {/* Header with Slot Count & Drawer Toggle */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black font-serif uppercase tracking-wider text-[#2E1F0F] flex items-center gap-2">
                      <Swords className="w-4 h-4 text-[#D97706]" />
                      <span>Monster Equipment Slots ({equippedCount}/4 Equipped)</span>
                    </h4>
                    <p className="text-[11px] text-[#78654E]">
                      Equip weapons to boost Attack, armor for Defense, helms for HP, and boots for Speed.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsEquipDrawerOpen(!isEquipDrawerOpen)}
                    className="text-xs font-bold text-[#D97706] hover:text-[#92400E] flex items-center gap-1 cursor-pointer bg-[#FEF3C7] border border-[#F59E0B]/40 px-3 py-1 rounded-xl shadow-2xs transition-colors"
                  >
                    <span>{isEquipDrawerOpen ? 'Hide Gear Arsenal' : 'Browse Weapons & Armors'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isEquipDrawerOpen ? 'rotate-90' : ''}`} />
                  </button>
                </div>

                {/* 4 Equipment Slots Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(['WEAPON', 'ARMOR', 'HELM', 'BOOTS'] as EquipmentSlot[]).map((slotKey) => {
                    const meta = EQUIPMENT_SLOT_META[slotKey];
                    const item = monsterGear[slotKey];

                    return (
                      <div
                        key={slotKey}
                        className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                          item
                            ? 'border-amber-400/80 bg-gradient-to-b from-[#FFFDF9] to-[#FFFBEB] shadow-sm'
                            : 'border-dashed border-[#D5C29E] bg-[#FAF6ED]/70'
                        }`}
                      >
                        {/* Slot Header */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#92400E] flex items-center gap-1.5">
                            <span>{meta.icon}</span>
                            <span>{meta.label}</span>
                          </span>

                          {item ? (
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                item.rarity === 'LEGENDARY'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : item.rarity === 'EPIC'
                                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                                  : item.rarity === 'RARE'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : 'bg-stone-100 text-stone-800 border-stone-300'
                              }`}
                            >
                              {item.rarity}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-[#9E8A72]">
                              Empty
                            </span>
                          )}
                        </div>

                        {/* Item Details or Empty Prompt */}
                        {item ? (
                          <div className="space-y-1.5 my-1">
                            <div className="flex items-baseline justify-between">
                              <span className="text-xs font-bold text-[#2E1F0F] truncate max-w-[140px]">
                                {item.name}
                              </span>
                              <span className="text-[11px] font-mono font-black text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                                +{item.level}
                              </span>
                            </div>

                            {/* Main Stat Value */}
                            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#92400E] bg-[#FFF9E6] px-2 py-1 rounded-lg border border-[#FDE68A]">
                              <span className="text-[10px] text-[#78654E] uppercase">{item.mainStat.stat}</span>
                              <span>
                                +{item.mainStat.value}
                                {item.mainStat.isPercent ? '%' : ''}
                              </span>
                            </div>

                            {/* Sub Stats if present */}
                            {item.subStats && item.subStats.length > 0 && (
                              <div className="space-y-0.5 pt-1 border-t border-[#E8DEC8]/70">
                                <div className="text-[9px] text-[#78654E] font-bold uppercase">Sub Stats:</div>
                                <div className="space-y-0.5">
                                  {item.subStats.map((sub, sIdx) => (
                                    <div
                                      key={sIdx}
                                      className="flex items-center justify-between text-[10px] font-mono bg-white/70 px-1.5 py-0.5 rounded border border-[#E8DEC8]"
                                    >
                                      <span className="text-[#5C4A34]">{sub.stat}</span>
                                      <span className="font-bold text-[#92400E]">
                                        +{sub.value}{sub.isPercent ? '%' : ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Set Tag */}
                            <div className="text-[10px] text-[#78654E] flex items-center gap-1 font-semibold truncate">
                              <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{item.set} Set</span>
                            </div>

                            {/* Action Buttons: Unequip or Swap */}
                            <div className="pt-2 flex items-center gap-1.5">
                              <button
                                disabled={isEquipProcessing}
                                onClick={() => handleToggleEquipment(item, 'UNEQUIP')}
                                className="flex-1 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                Unequip
                              </button>
                              <button
                                onClick={() => {
                                  setGearSlotFilter(slotKey);
                                  setIsEquipDrawerOpen(true);
                                }}
                                className="flex-1 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                Swap
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="my-2 text-center py-2">
                            <div className="text-xs text-[#9E8A72] italic mb-2">
                              No {meta.label.toLowerCase()} equipped
                            </div>
                            <button
                              onClick={() => {
                                setGearSlotFilter(slotKey);
                                setIsEquipDrawerOpen(true);
                              }}
                              className="w-full py-1.5 rounded-xl bg-[#FAF6ED] hover:bg-[#FEF3C7] border border-[#D5C29E] hover:border-[#D97706] text-[#92400E] text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Equip {meta.label}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* WEAPONS & ARMORS ARSENAL VAULT WITH SORT BUTTON */}
                {isEquipDrawerOpen && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#FAF6ED] to-[#F5EED9] border border-[#D5C29E] shadow-inner space-y-3.5">
                    {/* Vault Toolbar: Filter Chips & Weapons/Armors Sort Button */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E8DEC8] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black font-serif text-[#2E1F0F] uppercase tracking-wide">
                          Weapons & Armors Vault ({sortedAndFilteredEquipment.length} Available)
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
                        {/* Slot Filter Chips */}
                        <div className="flex items-center gap-1 bg-[#FFFDF9] border border-[#D5C29E] rounded-xl p-1 shadow-2xs overflow-x-auto scrollbar-none">
                          <button
                            onClick={() => setGearSlotFilter('ALL')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                              gearSlotFilter === 'ALL'
                                ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] shadow-2xs'
                                : 'text-[#78654E] hover:text-[#2E1F0F]'
                            }`}
                          >
                            All
                          </button>
                          <button
                            onClick={() => setGearSlotFilter('WEAPON')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                              gearSlotFilter === 'WEAPON'
                                ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] shadow-2xs'
                                : 'text-[#78654E] hover:text-[#2E1F0F]'
                            }`}
                          >
                            ⚔️ Weapons
                          </button>
                          <button
                            onClick={() => setGearSlotFilter('ARMOR')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                              gearSlotFilter === 'ARMOR'
                                ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] shadow-2xs'
                                : 'text-[#78654E] hover:text-[#2E1F0F]'
                            }`}
                          >
                            🛡️ Armors
                          </button>
                          <button
                            onClick={() => setGearSlotFilter('HELM')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                              gearSlotFilter === 'HELM'
                                ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] shadow-2xs'
                                : 'text-[#78654E] hover:text-[#2E1F0F]'
                            }`}
                          >
                            🪖 Helms
                          </button>
                          <button
                            onClick={() => setGearSlotFilter('BOOTS')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                              gearSlotFilter === 'BOOTS'
                                ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] shadow-2xs'
                                : 'text-[#78654E] hover:text-[#2E1F0F]'
                            }`}
                          >
                            🥾 Boots
                          </button>
                        </div>

                        {/* SORT BUTTON FOR WEAPONS AND ARMORS */}
                        <div className="flex items-center gap-1.5 bg-[#FFFDF9] border border-[#D5C29E] rounded-xl px-3 py-1 text-xs shadow-2xs">
                          <ArrowUpDown className="w-3.5 h-3.5 text-[#D97706]" />
                          <span className="font-bold text-[#78654E]">Sort:</span>
                          <select
                            value={gearSortBy}
                            onChange={(e) => setGearSortBy(e.target.value as any)}
                            className="bg-transparent text-[#2E1F0F] font-bold focus:outline-none cursor-pointer text-xs"
                          >
                            <option value="WEAPONS_FIRST" className="bg-[#FFFDF9] text-[#2E1F0F]">⚔️ Weapons First</option>
                            <option value="ARMORS_FIRST" className="bg-[#FFFDF9] text-[#2E1F0F]">🛡️ Armors First</option>
                            <option value="RARITY" className="bg-[#FFFDF9] text-[#2E1F0F]">⭐ Rarity (Legendary ➔ Common)</option>
                            <option value="LEVEL" className="bg-[#FFFDF9] text-[#2E1F0F]">⚡ Level (+15 ➔ +0)</option>
                            <option value="SET" className="bg-[#FFFDF9] text-[#2E1F0F]">✨ Equipment Set</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Equipment Cards Grid */}
                    {sortedAndFilteredEquipment.length === 0 ? (
                      <div className="text-center py-6 text-xs text-[#78654E] italic">
                        No equipment found matching this filter. Challenge the Equipment Dungeons in PvE Hub to harvest rare gear!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                        {sortedAndFilteredEquipment.map((eq) => {
                          const isEquippedOnThis = eq.equippedToInstanceId === selectedMonster.instanceId;
                          const equippedMonster = eq.equippedToInstanceId
                            ? monsters.find((m) => m.instanceId === eq.equippedToInstanceId)
                            : null;
                          const equippedVariant = equippedMonster
                            ? getMonsterVariant(equippedMonster.variantId) || MONSTER_VARIANTS[equippedMonster.variantId]
                            : null;

                          return (
                            <div
                              key={eq.id}
                              className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between ${
                                isEquippedOnThis
                                  ? 'border-amber-400 bg-[#FFFBEB] ring-1 ring-amber-400 shadow-sm'
                                  : eq.rarity === 'LEGENDARY'
                                  ? 'border-amber-300 bg-[#FFFDF9] hover:border-amber-500'
                                  : eq.rarity === 'EPIC'
                                  ? 'border-purple-300 bg-[#FFFDF9] hover:border-purple-500'
                                  : 'border-[#D5C29E] bg-[#FFFDF9] hover:border-amber-400'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-mono font-bold flex items-center gap-1 text-[#92400E]">
                                    <span>{EQUIPMENT_SLOT_META[eq.slot]?.icon}</span>
                                    <span>{eq.slot}</span>
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                                    +{eq.level}
                                  </span>
                                </div>

                                <h5 className="text-xs font-bold text-[#2E1F0F] truncate">
                                  {eq.name}
                                </h5>

                                <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-[#92400E] bg-[#FAF6ED] px-2 py-0.5 rounded border border-[#E8DEC8]">
                                  <span>{eq.mainStat.stat}</span>
                                  <span className="font-bold">
                                    +{eq.mainStat.value}{eq.mainStat.isPercent ? '%' : ''}
                                  </span>
                                </div>

                                {/* Sub Stats if present */}
                                {eq.subStats && eq.subStats.length > 0 && (
                                  <div className="mt-1 space-y-0.5 pt-1 border-t border-[#E8DEC8]/60">
                                    <div className="text-[9px] text-[#78654E] font-bold uppercase">Sub Stats:</div>
                                    <div className="space-y-0.5">
                                      {eq.subStats.map((sub, sIdx) => (
                                        <div
                                          key={sIdx}
                                          className="flex items-center justify-between text-[10px] font-mono bg-white/80 px-1.5 py-0.5 rounded border border-[#E8DEC8]"
                                        >
                                          <span className="text-[#5C4A34]">{sub.stat}</span>
                                          <span className="font-bold text-[#92400E]">
                                            +{sub.value}{sub.isPercent ? '%' : ''}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="mt-1 text-[10px] text-[#78654E] flex items-center justify-between">
                                  <span>{eq.set} Set</span>
                                  <span className="capitalize font-bold text-[9px] text-[#9E8A72]">
                                    {eq.rarity.toLowerCase()}
                                  </span>
                                </div>

                                {equippedVariant && !isEquippedOnThis && (
                                  <div className="mt-1 text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 truncate">
                                    Equipped on: {equippedVariant.name}
                                  </div>
                                )}
                              </div>

                              <div className="mt-2 pt-2 border-t border-[#E8DEC8]">
                                {isEquippedOnThis ? (
                                  <button
                                    disabled={isEquipProcessing}
                                    onClick={() => handleToggleEquipment(eq, 'UNEQUIP')}
                                    className="w-full py-1 rounded-lg bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800 text-[10px] font-bold cursor-pointer transition-colors"
                                  >
                                    Unequip
                                  </button>
                                ) : (
                                  <button
                                    disabled={isEquipProcessing}
                                    onClick={() => handleToggleEquipment(eq, 'EQUIP')}
                                    className="w-full py-1 rounded-lg fantasy-btn-gold text-[#2E1F0F] text-[10px] font-bold cursor-pointer transition-all shadow-2xs"
                                  >
                                    {equippedMonster ? 'Transfer to Unit' : 'Equip to Unit'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* SECTION 3: OWNED MONSTER ROSTER / COLLECTION */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#E8DEC8] pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#2E1F0F] font-serif tracking-wide uppercase flex items-center gap-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[#0284C7]" />
              Your Owned Monsters ({monsters.length})
            </h2>
            <p className="text-xs text-[#5C4A34]">
              Select an owned creature to inspect or click to add into active party formation.
            </p>
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Element Filter */}
            <div className="flex items-center gap-1 bg-[#FAF6ED] border border-[#D5C29E] rounded-xl p-1 shadow-2xs overflow-x-auto max-w-full scrollbar-none">
              <button
                onClick={() => setElementFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                  elementFilter === 'ALL'
                    ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] shadow-2xs'
                    : 'text-[#78654E] hover:text-[#2E1F0F]'
                }`}
              >
                All
              </button>
              {(['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK'] as ElementType[]).map((elem) => (
                <button
                  key={elem}
                  onClick={() => setElementFilter(elem)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                    elementFilter === elem
                      ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] shadow-2xs'
                      : 'text-[#78654E] hover:text-[#2E1F0F]'
                  }`}
                  style={{
                    color: elementFilter === elem ? ELEMENT_VISUALS[elem]?.colorHex : undefined,
                  }}
                >
                  {elem.charAt(0) + elem.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1.5 bg-[#FAF6ED] border border-[#D5C29E] rounded-xl px-2.5 py-1 text-xs shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#78654E]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[#2E1F0F] font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="CP" className="bg-[#FFFDF9] text-[#2E1F0F]">Sort by Power</option>
                <option value="LEVEL" className="bg-[#FFFDF9] text-[#2E1F0F]">Sort by Level</option>
                <option value="SPEED" className="bg-[#FFFDF9] text-[#2E1F0F]">Sort by Speed</option>
                <option value="ELEMENT" className="bg-[#FFFDF9] text-[#2E1F0F]">Sort by Element</option>
              </select>
            </div>
          </div>
        </div>

        {/* Owned Monsters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {filteredCollection.map((monster) => {
            const variant = getMonsterVariant(monster.variantId) || MONSTER_VARIANTS[monster.variantId];
            if (!variant) return null;

            const inPartySlot = getPartySlotOfMonster(monster.instanceId);
            const isInParty = inPartySlot !== -1;
            const isSelected = monster.instanceId === selectedInstanceId;

            const effectiveStats = calculateEffectiveStats({
              variant,
              level: monster.level,
              awakeningStage: monster.awakeningStage,
            }).finalStats;

            const elemVisual = ELEMENT_VISUALS[variant.element];

            return (
              <div
                key={monster.instanceId}
                onClick={() => handleAssignMonster(monster.instanceId)}
                className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group overflow-hidden ${
                  isSelected
                    ? 'border-[#D97706] bg-[#FFFBEB] ring-2 ring-[#F59E0B] shadow-md'
                    : isInParty
                    ? 'border-[#F59E0B]/50 bg-gradient-to-b from-[#FFFBEB] to-[#FFFDF9] hover:border-[#D97706] shadow-2xs'
                    : 'border-[#D5C29E] bg-[#FFFDF9] hover:border-[#D97706] hover:shadow-md'
                }`}
              >
                {/* Active Party Slot Badge */}
                {isInParty && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                    Slot #{inPartySlot + 1}
                  </div>
                )}

                {/* Avatar & Element Icon */}
                <div className="flex flex-col items-center text-center mt-1">
                  <div className="relative mb-2">
                    <MonsterAvatar
                      variantId={variant.variantId}
                      element={variant.element}
                      variant={variant}
                      awakeningStage={monster.awakeningStage}
                      size="md"
                    />
                    <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-[#FFFDF9] border border-[#D5C29E] text-[9px] font-mono font-bold text-[#92400E] shadow-2xs">
                      Lv.{monster.level}
                    </div>
                  </div>

                  <div className="text-xs font-bold text-[#2E1F0F] truncate w-full group-hover:text-[#D97706] transition-colors">
                    {variant.name}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#78654E] mt-0.5">
                    <span style={{ color: elemVisual?.colorHex }}>{variant.element}</span>
                    <span>•</span>
                    <span className="capitalize">{variant.primaryRole.toLowerCase()}</span>
                  </div>
                  <div className="mt-0.5 flex justify-center">
                    <MonsterStarRating stars={getMonsterStars(monster, variant)} size="xs" showAllFiveSlots={false} />
                  </div>
                </div>

                {/* CP & Quick Stats */}
                <div className="mt-2.5 pt-2 border-t border-[#E8DEC8] flex items-center justify-between text-[10px] font-mono text-[#78654E]">
                  <span>SPD {effectiveStats.speed}</span>
                  <span className="text-[#B45309] font-bold">
                    {Math.floor(
                      effectiveStats.hp / 10 +
                        effectiveStats.attack * 1.5 +
                        effectiveStats.defense * 1.2 +
                        effectiveStats.speed * 2
                    ).toLocaleString()}{' '}
                    CP
                  </span>
                </div>

                {/* Hover Indicator */}
                <div className="mt-2 text-center text-[10px] font-semibold text-[#9E8A72] group-hover:text-[#D97706] transition-colors">
                  {isInParty
                    ? targetedSlotIndex !== null
                      ? `Swap with Slot #${targetedSlotIndex + 1}`
                      : isSelected
                      ? 'Selected (Inspecting)'
                      : 'In Party • Click to Inspect'
                    : targetedSlotIndex !== null
                    ? `Assign to Slot #${targetedSlotIndex + 1}`
                    : isSelected
                    ? '+ Click again to Add to Party'
                    : 'Click to Inspect'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
