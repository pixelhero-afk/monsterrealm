/**
 * Awakening Cost Tuning Studio for Developer Sandbox
 * Allows inspecting and customizing the exact Gold and Elemental/Magic stone
 * requirements needed to awaken any unit in Monster Realms.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Flame,
  Droplets,
  Leaf,
  Sun,
  Moon,
  Coins,
  RotateCcw,
  Check,
  Zap,
  Gift,
  Sliders,
  Layers,
  Wrench,
  CheckCircle2,
  Copy,
  Plus,
  Minus,
  AlertCircle,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { ElementType, MonsterVariant, Rarity, ElementalDungeonType } from '../../types';
import { getAllVariants } from '../../data/monsters';
import {
  AwakeningCost,
  getDefaultAwakeningCost,
} from '../../data/elementalDungeons';
import { awakeningCostService } from '../../services/awakeningCostService';
import { customUnitsService } from '../../services/customUnitsService';
import { callDevAction } from '../../services/apiClient';
import { MonsterAvatar } from '../MonsterAvatar';

interface AwakeningCostsTabProps {
  onStateModified?: () => void;
}

const ELEMENT_CONFIG: Record<
  ElementType,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  FIRE: { label: 'Fire', icon: Flame, color: '#EF4444', bg: 'bg-red-500/10 text-red-700', border: 'border-red-300' },
  WATER: { label: 'Water', icon: Droplets, color: '#3B82F6', bg: 'bg-blue-500/10 text-blue-700', border: 'border-blue-300' },
  GRASS: { label: 'Grass', icon: Leaf, color: '#10B981', bg: 'bg-emerald-500/10 text-emerald-700', border: 'border-emerald-300' },
  LIGHT: { label: 'Light', icon: Sun, color: '#F59E0B', bg: 'bg-amber-500/10 text-amber-700', border: 'border-amber-300' },
  DARK: { label: 'Dark', icon: Moon, color: '#8B5CF6', bg: 'bg-purple-500/10 text-purple-700', border: 'border-purple-300' },
};

const RARITY_COLORS: Record<Rarity, string> = {
  COMMON: 'bg-stone-100 text-stone-700 border-stone-300',
  UNCOMMON: 'bg-green-100 text-green-800 border-green-300',
  RARE: 'bg-blue-100 text-blue-800 border-blue-300',
  EPIC: 'bg-purple-100 text-purple-800 border-purple-300',
  LEGENDARY: 'bg-amber-100 text-amber-900 border-amber-400',
};

export const AwakeningCostsTab: React.FC<AwakeningCostsTabProps> = ({ onStateModified }) => {
  const [search, setSearch] = useState<string>('');
  const [selectedElement, setSelectedElement] = useState<ElementType | 'ALL'>('ALL');
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CUSTOM' | 'DEFAULT'>('ALL');

  const [selectedVariant, setSelectedVariant] = useState<MonsterVariant | null>(null);
  const [variantsList, setVariantsList] = useState<MonsterVariant[]>([]);
  const [overrides, setOverrides] = useState<Record<string, AwakeningCost>>({});

  // Active Editor Form State
  const [editGold, setEditGold] = useState<number>(10000);
  const [editElemSmall, setEditElemSmall] = useState<number>(10);
  const [editElemMed, setEditElemMed] = useState<number>(5);
  const [editElemHuge, setEditElemHuge] = useState<number>(0);
  const [editMagicSmall, setEditMagicSmall] = useState<number>(5);
  const [editMagicMed, setEditMagicMed] = useState<number>(2);
  const [editMagicHuge, setEditMagicHuge] = useState<number>(0);

  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const refreshData = () => {
    const list = getAllVariants().filter(
      (v) => !v.isBoss && v.familyId !== 'fam_boss' && !v.variantId.startsWith('var_boss_')
    );
    setVariantsList(list);
    setOverrides(awakeningCostService.getOverrides());
  };

  useEffect(() => {
    refreshData();
    const unsub = awakeningCostService.subscribe(() => {
      setOverrides(awakeningCostService.getOverrides());
    });
    return () => unsub();
  }, []);

  // When selectedVariant changes, populate the editor fields
  useEffect(() => {
    if (selectedVariant) {
      const currentCost = awakeningCostService.getCost(selectedVariant);
      setEditGold(currentCost.gold);
      setEditElemSmall(currentCost.elementalStones.small);
      setEditElemMed(currentCost.elementalStones.medium);
      setEditElemHuge(currentCost.elementalStones.huge);
      setEditMagicSmall(currentCost.magicStones.small);
      setEditMagicMed(currentCost.magicStones.medium);
      setEditMagicHuge(currentCost.magicStones.huge);
    }
  }, [selectedVariant, overrides]);

  // Set default selected variant if none selected
  useEffect(() => {
    if (!selectedVariant && variantsList.length > 0) {
      setSelectedVariant(variantsList[0]);
    }
  }, [variantsList, selectedVariant]);

  const filteredVariants = useMemo(() => {
    const q = search.toLowerCase().trim();
    return variantsList.filter((v) => {
      if (selectedElement !== 'ALL' && v.element !== selectedElement) return false;
      if (selectedRarity !== 'ALL' && v.rarity !== selectedRarity) return false;
      const isCustom = Boolean(overrides[v.variantId]);
      if (statusFilter === 'CUSTOM' && !isCustom) return false;
      if (statusFilter === 'DEFAULT' && isCustom) return false;
      if (!q) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        v.variantId.toLowerCase().includes(q) ||
        (v.familyId && v.familyId.toLowerCase().includes(q))
      );
    });
  }, [variantsList, search, selectedElement, selectedRarity, statusFilter, overrides]);

  const customOverridesCount = useMemo(() => {
    return Object.keys(overrides).length;
  }, [overrides]);

  // Save changes for currently selected unit
  const handleSaveCurrentUnit = async () => {
    if (!selectedVariant) return;
    try {
      setSaving(true);
      setFeedback(null);
      const newCost: AwakeningCost = {
        element: (selectedVariant.element as ElementalDungeonType) || 'FIRE',
        elementalStones: {
          small: Math.max(0, editElemSmall),
          medium: Math.max(0, editElemMed),
          huge: Math.max(0, editElemHuge),
        },
        magicStones: {
          small: Math.max(0, editMagicSmall),
          medium: Math.max(0, editMagicMed),
          huge: Math.max(0, editMagicHuge),
        },
        gold: Math.max(0, editGold),
      };

      await awakeningCostService.saveUnitCost(selectedVariant.variantId, newCost);
      setFeedback({
        type: 'success',
        message: `✓ Saved awakening requirements for ${selectedVariant.name}! Live in Awakening Chamber & server validation.`,
      });
      onStateModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save awakening cost' });
    } finally {
      setSaving(false);
    }
  };

  // Revert selected unit to default tier cost
  const handleResetCurrentUnit = async () => {
    if (!selectedVariant) return;
    try {
      setSaving(true);
      setFeedback(null);
      await awakeningCostService.resetUnitCost(selectedVariant.variantId);
      const defCost = getDefaultAwakeningCost(selectedVariant);
      setEditGold(defCost.gold);
      setEditElemSmall(defCost.elementalStones.small);
      setEditElemMed(defCost.elementalStones.medium);
      setEditElemHuge(defCost.elementalStones.huge);
      setEditMagicSmall(defCost.magicStones.small);
      setEditMagicMed(defCost.magicStones.medium);
      setEditMagicHuge(defCost.magicStones.huge);

      setFeedback({
        type: 'info',
        message: `Reverted ${selectedVariant.name} back to default ${selectedVariant.rarity} tier awakening costs.`,
      });
      onStateModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reset awakening cost' });
    } finally {
      setSaving(false);
    }
  };

  // Apply Quick Preset to editor
  const applyPreset = (preset: 'ONE_STONE' | 'FREE' | 'DEFAULT') => {
    if (!selectedVariant) return;
    if (preset === 'ONE_STONE') {
      setEditGold(100);
      setEditElemSmall(1);
      setEditElemMed(0);
      setEditElemHuge(0);
      setEditMagicSmall(1);
      setEditMagicMed(0);
      setEditMagicHuge(0);
    } else if (preset === 'FREE') {
      setEditGold(0);
      setEditElemSmall(0);
      setEditElemMed(0);
      setEditElemHuge(0);
      setEditMagicSmall(0);
      setEditMagicMed(0);
      setEditMagicHuge(0);
    } else if (preset === 'DEFAULT') {
      const defCost = getDefaultAwakeningCost(selectedVariant);
      setEditGold(defCost.gold);
      setEditElemSmall(defCost.elementalStones.small);
      setEditElemMed(defCost.elementalStones.medium);
      setEditElemHuge(defCost.elementalStones.huge);
      setEditMagicSmall(defCost.magicStones.small);
      setEditMagicMed(defCost.magicStones.medium);
      setEditMagicHuge(defCost.magicStones.huge);
    }
  };

  // Batch Apply to all units of same rarity
  const handleApplyToSameRarity = async () => {
    if (!selectedVariant) return;
    const sameRarityUnits = variantsList.filter((v) => v.rarity === selectedVariant.rarity);

    try {
      setSaving(true);
      const batchOverrides: Record<string, AwakeningCost> = {};
      sameRarityUnits.forEach((v) => {
        batchOverrides[v.variantId] = {
          element: (v.element as ElementalDungeonType) || 'FIRE',
          elementalStones: {
            small: Math.max(0, editElemSmall),
            medium: Math.max(0, editElemMed),
            huge: Math.max(0, editElemHuge),
          },
          magicStones: {
            small: Math.max(0, editMagicSmall),
            medium: Math.max(0, editMagicMed),
            huge: Math.max(0, editMagicHuge),
          },
          gold: Math.max(0, editGold),
        };
      });

      await awakeningCostService.bulkSetCosts(batchOverrides);
      setFeedback({
        type: 'success',
        message: `✓ Applied custom awakening requirements to all ${sameRarityUnits.length} ${selectedVariant.rarity} units!`,
      });
      onStateModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Batch apply failed' });
    } finally {
      setSaving(false);
    }
  };

  // Batch Apply to all units of same element
  const handleApplyToSameElement = async () => {
    if (!selectedVariant) return;
    const sameElementUnits = variantsList.filter((v) => v.element === selectedVariant.element);

    try {
      setSaving(true);
      const batchOverrides: Record<string, AwakeningCost> = {};
      sameElementUnits.forEach((v) => {
        batchOverrides[v.variantId] = {
          element: (v.element as ElementalDungeonType) || 'FIRE',
          elementalStones: {
            small: Math.max(0, editElemSmall),
            medium: Math.max(0, editElemMed),
            huge: Math.max(0, editElemHuge),
          },
          magicStones: {
            small: Math.max(0, editMagicSmall),
            medium: Math.max(0, editMagicMed),
            huge: Math.max(0, editMagicHuge),
          },
          gold: Math.max(0, editGold),
        };
      });

      await awakeningCostService.bulkSetCosts(batchOverrides);
      setFeedback({
        type: 'success',
        message: `✓ Applied custom awakening requirements to all ${sameElementUnits.length} ${selectedVariant.element} units!`,
      });
      onStateModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Batch apply failed' });
    } finally {
      setSaving(false);
    }
  };

  // Quick 1-Stone directly from unit row
  const handleQuickOneStoneUnit = async (v: MonsterVariant, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const quickCost: AwakeningCost = {
        element: (v.element as ElementalDungeonType) || 'FIRE',
        elementalStones: { small: 1, medium: 0, huge: 0 },
        magicStones: { small: 1, medium: 0, huge: 0 },
        gold: 100,
      };
      await awakeningCostService.saveUnitCost(v.variantId, quickCost);
      if (selectedVariant?.variantId === v.variantId) {
        setEditGold(100);
        setEditElemSmall(1);
        setEditElemMed(0);
        setEditElemHuge(0);
        setEditMagicSmall(1);
        setEditMagicMed(0);
        setEditMagicHuge(0);
      }
      setFeedback({
        type: 'success',
        message: `✓ ${v.name} set to 1-Stone Test Mode (1 Small Elemental + 1 Magic + 100 Gold).`,
      });
      onStateModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Quick tune failed' });
    }
  };

  // Quick Revert directly from unit row
  const handleQuickRevertUnit = async (v: MonsterVariant, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await awakeningCostService.resetUnitCost(v.variantId);
      if (selectedVariant?.variantId === v.variantId) {
        const def = getDefaultAwakeningCost(v);
        setEditGold(def.gold);
        setEditElemSmall(def.elementalStones.small);
        setEditElemMed(def.elementalStones.medium);
        setEditElemHuge(def.elementalStones.huge);
        setEditMagicSmall(def.magicStones.small);
        setEditMagicMed(def.magicStones.medium);
        setEditMagicHuge(def.magicStones.huge);
      }
      setFeedback({
        type: 'info',
        message: `Reverted ${v.name} to default tier cost.`,
      });
      onStateModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Quick revert failed' });
    }
  };

  // Global: Grant +100 stones to player profile
  const handleGrantStones = async () => {
    try {
      setSaving(true);
      await callDevAction('GRANT_ELEMENTAL_STONES');
      setFeedback({
        type: 'success',
        message: '✓ Granted +100 Small, +50 Medium, +25 Huge stones for all 6 Elements + 500,000 Gold to player inventory!',
      });
      onStateModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to grant stones' });
    } finally {
      setSaving(false);
    }
  };

  // Global: Set ALL units in game to 1 stone
  const handleSetAllToOneStone = async () => {
    try {
      setSaving(true);
      const bulk: Record<string, AwakeningCost> = {};
      variantsList.forEach((v) => {
        bulk[v.variantId] = {
          element: (v.element as ElementalDungeonType) || 'FIRE',
          elementalStones: { small: 1, medium: 0, huge: 0 },
          magicStones: { small: 1, medium: 0, huge: 0 },
          gold: 100,
        };
      });
      await awakeningCostService.bulkSetCosts(bulk);
      setFeedback({
        type: 'success',
        message: `✓ Set ALL ${variantsList.length} units to 1-Stone Test Mode!`,
      });
      onStateModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to set all to 1 stone' });
    } finally {
      setSaving(false);
    }
  };

  // Global: Reset ALL units back to default
  const handleResetAllToDefaults = async () => {
    try {
      setSaving(true);
      await awakeningCostService.resetAllCosts();
      if (selectedVariant) {
        const def = getDefaultAwakeningCost(selectedVariant);
        setEditGold(def.gold);
        setEditElemSmall(def.elementalStones.small);
        setEditElemMed(def.elementalStones.medium);
        setEditElemHuge(def.elementalStones.huge);
        setEditMagicSmall(def.magicStones.small);
        setEditMagicMed(def.magicStones.medium);
        setEditMagicHuge(def.magicStones.huge);
      }
      setFeedback({
        type: 'info',
        message: 'Reverted all units back to default tier awakening requirements.',
      });
      onStateModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reset all costs' });
    } finally {
      setSaving(false);
    }
  };

  // Grant copy of selected unit to roster
  const handleGrantSelectedUnit = async () => {
    if (!selectedVariant) return;
    try {
      await customUnitsService.grantUnit(selectedVariant.variantId, 25, selectedVariant.stars || 4);
      setFeedback({
        type: 'success',
        message: `✓ Granted a Level 25 unawakened copy of ${selectedVariant.name} to your monster roster for live testing!`,
      });
      onStateModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to grant unit' });
    }
  };

  const defaultCostForSelected = selectedVariant ? getDefaultAwakeningCost(selectedVariant) : null;
  const isSelectedOverridden = selectedVariant ? Boolean(overrides[selectedVariant.variantId]) : false;

  return (
    <div className="space-y-4 text-xs">
      {/* Top Banner & Quick State Tools */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#FFFDF9] via-[#FAF5EC] to-[#FFFDF9] border border-[#D5C29E] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-400 flex items-center justify-center text-amber-700 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#2E1F0F] font-serif flex items-center gap-2">
                Unit Awakening Tuning Studio
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Live Game Tuning
                </span>
              </h4>
              <p className="text-[11px] text-[#5C4A34]">
                Easily change the exact Gold and Elemental/Magic stone amounts each unit needs to awaken. Overrides take effect instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleGrantStones}
              className="px-3 py-1.5 rounded-xl bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] font-bold text-xs flex items-center gap-1.5 border border-[#F59E0B]/50 cursor-pointer shadow-2xs transition-colors"
              title="Add 100 of each Elemental & Magic stone to your account so you can test awakening instantly"
            >
              <Gift className="w-4 h-4 text-amber-700" />
              <span>+100 All Stones</span>
            </button>

            <button
              type="button"
              onClick={handleSetAllToOneStone}
              className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs flex items-center gap-1.5 border border-purple-300 cursor-pointer shadow-2xs transition-colors"
              title="Set every unit in the game to 1 stone for rapid testing"
            >
              <Zap className="w-4 h-4 text-purple-700" />
              <span>All 1-Stone Mode</span>
            </button>

            <button
              type="button"
              onClick={handleResetAllToDefaults}
              className="px-3 py-1.5 rounded-xl bg-[#FAF6ED] hover:bg-[#E8DEC8] text-[#78654E] font-bold text-xs flex items-center gap-1.5 border border-[#D5C29E] cursor-pointer shadow-2xs transition-colors"
              title="Clear all overrides back to default tier costs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset All</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E8DEC8]/70 text-center">
          <div className="bg-[#FFFDF9] p-2 rounded-xl border border-[#E8DEC8]">
            <span className="text-[10px] text-[#78654E] font-medium block">Total Units</span>
            <span className="text-sm font-black text-[#2E1F0F]">{variantsList.length}</span>
          </div>
          <div className="bg-[#FFFDF9] p-2 rounded-xl border border-[#E8DEC8]">
            <span className="text-[10px] text-amber-800 font-medium block">Custom Tuned Units</span>
            <span className="text-sm font-black text-amber-700">{customOverridesCount}</span>
          </div>
          <div className="bg-[#FFFDF9] p-2 rounded-xl border border-[#E8DEC8]">
            <span className="text-[10px] text-stone-600 font-medium block">Default Tier Units</span>
            <span className="text-sm font-black text-stone-700">{variantsList.length - customOverridesCount}</span>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-2xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : feedback.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-300'
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-stone-500 hover:text-stone-800 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Two-Column Layout: Left Workbench / Right Unit Browser */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Active Unit Editor Workbench (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          {selectedVariant ? (
            <div className="p-4 rounded-2xl bg-[#FFFDF9] border-2 border-[#2E1F0F] shadow-sm space-y-4">
              {/* Unit Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E8DEC8] gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#2E1F0F] shrink-0 bg-stone-100 shadow-2xs">
                    <MonsterAvatar variantId={selectedVariant.variantId} size="md" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-base font-black text-[#2E1F0F] font-serif">
                        {selectedVariant.name}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isSelectedOverridden
                            ? 'bg-amber-100 text-amber-900 border-amber-400 font-black'
                            : 'bg-stone-100 text-stone-700 border-stone-300'
                        }`}
                      >
                        {isSelectedOverridden ? '★ CUSTOM TUNED' : 'DEFAULT TIER'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#78654E]">
                      <span className="font-mono text-[#92400E] font-medium">{selectedVariant.variantId}</span>
                      <span>•</span>
                      <span className="font-bold">{selectedVariant.element}</span>
                      <span>•</span>
                      <span className="font-bold">{selectedVariant.rarity}</span>
                      <span>•</span>
                      <span>{selectedVariant.stars || 3}★ Base</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGrantSelectedUnit}
                  className="px-2.5 py-1.5 rounded-xl bg-[#FAF6ED] hover:bg-[#E8DEC8] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E] font-bold text-[11px] shrink-0 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="Grant a copy of this unawakened monster to your roster so you can test it in MonstersView"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Grant to Box</span>
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#78654E] uppercase tracking-wider block">
                  Quick Presets for {selectedVariant.name}:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('ONE_STONE')}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>1-Stone Test Preset</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('FREE')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>0 Cost (Free)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('DEFAULT')}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF6ED] hover:bg-[#E8DEC8] text-[#78654E] border border-[#D5C29E] font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Rarity Default</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Gold Currency */}
              <div className="p-3 rounded-xl bg-[#FAF6ED] border border-[#D5C29E] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[#2E1F0F]">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>Gold Requirement</span>
                  </div>
                  <span className="text-[11px] text-[#78654E]">
                    Default: {defaultCostForSelected?.gold.toLocaleString()} Gold
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={editGold}
                    onChange={(e) => setEditGold(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#FFFDF9] border border-[#D5C29E] rounded-xl px-3 py-1.5 font-bold text-sm text-[#2E1F0F] focus:outline-none focus:border-[#92400E]"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditGold((prev) => Math.max(0, prev - 5000))}
                      className="px-2 py-1.5 rounded-lg bg-[#FFFDF9] hover:bg-[#FAF6ED] border border-[#D5C29E] text-xs font-bold cursor-pointer"
                    >
                      -5k
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditGold((prev) => prev + 5000)}
                      className="px-2 py-1.5 rounded-lg bg-[#FFFDF9] hover:bg-[#FAF6ED] border border-[#D5C29E] text-xs font-bold cursor-pointer"
                    >
                      +5k
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditGold(100)}
                      className="px-2 py-1.5 rounded-lg bg-[#FFFDF9] hover:bg-[#FAF6ED] border border-[#D5C29E] text-xs font-bold cursor-pointer"
                    >
                      100
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Elemental Stones Requirement */}
              <div className="p-3.5 rounded-xl bg-[#FAF6ED] border border-[#D5C29E] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[#2E1F0F]">
                    {React.createElement(ELEMENT_CONFIG[selectedVariant.element]?.icon || Flame, {
                      className: `w-4 h-4`,
                      style: { color: ELEMENT_CONFIG[selectedVariant.element]?.color || '#EF4444' },
                    })}
                    <span>{selectedVariant.element} Stones Requirement</span>
                  </div>
                  <span className="text-[11px] text-[#78654E]">
                    Default: {defaultCostForSelected?.elementalStones.small}S / {defaultCostForSelected?.elementalStones.medium}M / {defaultCostForSelected?.elementalStones.huge}H
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* Small Elemental */}
                  <div className="bg-[#FFFDF9] p-2.5 rounded-xl border border-[#D5C29E] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#2E1F0F]">
                      <span>Small</span>
                      <span className="text-[10px] text-[#78654E]">Def: {defaultCostForSelected?.elementalStones.small}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditElemSmall((v) => Math.max(0, v - 1))}
                        className="w-7 h-7 rounded-lg bg-[#FAF6ED] hover:bg-[#E8DEC8] border border-[#D5C29E] flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={editElemSmall}
                        onChange={(e) => setEditElemSmall(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-center font-bold text-sm bg-transparent border-0 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setEditElemSmall((v) => v + 1)}
                        className="w-7 h-7 rounded-lg bg-[#FAF6ED] hover:bg-[#E8DEC8] border border-[#D5C29E] flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Medium Elemental */}
                  <div className="bg-[#FFFDF9] p-2.5 rounded-xl border border-[#D5C29E] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#2E1F0F]">
                      <span>Medium</span>
                      <span className="text-[10px] text-[#78654E]">Def: {defaultCostForSelected?.elementalStones.medium}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditElemMed((v) => Math.max(0, v - 1))}
                        className="w-7 h-7 rounded-lg bg-[#FAF6ED] hover:bg-[#E8DEC8] border border-[#D5C29E] flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={editElemMed}
                        onChange={(e) => setEditElemMed(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-center font-bold text-sm bg-transparent border-0 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setEditElemMed((v) => v + 1)}
                        className="w-7 h-7 rounded-lg bg-[#FAF6ED] hover:bg-[#E8DEC8] border border-[#D5C29E] flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Huge Elemental */}
                  <div className="bg-[#FFFDF9] p-2.5 rounded-xl border border-[#D5C29E] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#2E1F0F]">
                      <span className="text-amber-800">Huge</span>
                      <span className="text-[10px] text-[#78654E]">Def: {defaultCostForSelected?.elementalStones.huge}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditElemHuge((v) => Math.max(0, v - 1))}
                        className="w-7 h-7 rounded-lg bg-[#FAF6ED] hover:bg-[#E8DEC8] border border-[#D5C29E] flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={editElemHuge}
                        onChange={(e) => setEditElemHuge(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-center font-bold text-sm bg-transparent border-0 focus:outline-none text-amber-900"
                      />
                      <button
                        type="button"
                        onClick={() => setEditElemHuge((v) => v + 1)}
                        className="w-7 h-7 rounded-lg bg-[#FAF6ED] hover:bg-[#E8DEC8] border border-[#D5C29E] flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Universal Magic Stones Requirement */}
              <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-purple-900">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Universal Magic Stones Requirement</span>
                  </div>
                  <span className="text-[11px] text-purple-700">
                    Default: {defaultCostForSelected?.magicStones.small}S / {defaultCostForSelected?.magicStones.medium}M / {defaultCostForSelected?.magicStones.huge}H
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* Small Magic */}
                  <div className="bg-[#FFFDF9] p-2.5 rounded-xl border border-purple-200 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
                      <span>Small</span>
                      <span className="text-[10px] text-purple-600">Def: {defaultCostForSelected?.magicStones.small}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditMagicSmall((v) => Math.max(0, v - 1))}
                        className="w-7 h-7 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={editMagicSmall}
                        onChange={(e) => setEditMagicSmall(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-center font-bold text-sm bg-transparent border-0 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setEditMagicSmall((v) => v + 1)}
                        className="w-7 h-7 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Medium Magic */}
                  <div className="bg-[#FFFDF9] p-2.5 rounded-xl border border-purple-200 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
                      <span>Medium</span>
                      <span className="text-[10px] text-purple-600">Def: {defaultCostForSelected?.magicStones.medium}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditMagicMed((v) => Math.max(0, v - 1))}
                        className="w-7 h-7 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={editMagicMed}
                        onChange={(e) => setEditMagicMed(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-center font-bold text-sm bg-transparent border-0 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setEditMagicMed((v) => v + 1)}
                        className="w-7 h-7 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Huge Magic */}
                  <div className="bg-[#FFFDF9] p-2.5 rounded-xl border border-purple-200 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
                      <span>Huge</span>
                      <span className="text-[10px] text-purple-600">Def: {defaultCostForSelected?.magicStones.huge}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditMagicHuge((v) => Math.max(0, v - 1))}
                        className="w-7 h-7 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={editMagicHuge}
                        onChange={(e) => setEditMagicHuge(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-center font-bold text-sm bg-transparent border-0 focus:outline-none text-purple-950"
                      />
                      <button
                        type="button"
                        onClick={() => setEditMagicHuge((v) => v + 1)}
                        className="w-7 h-7 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-2 space-y-2.5">
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveCurrentUnit}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#2E1F0F] hover:bg-[#4A3525] text-[#FFFDF9] font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Save Awakening Cost for {selectedVariant.name}</span>
                  </button>

                  {isSelectedOverridden && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleResetCurrentUnit}
                      className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
                      title="Revert this unit to standard tier cost"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Revert</span>
                    </button>
                  )}
                </div>

                {/* Batch Actions Expansion */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#E8DEC8]/60 text-[11px]">
                  <span className="text-[#78654E] font-medium shrink-0">Batch Apply:</span>
                  <button
                    type="button"
                    onClick={handleApplyToSameRarity}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF6ED] hover:bg-[#E8DEC8] text-[#5C4A34] font-bold border border-[#D5C29E] cursor-pointer transition-colors"
                  >
                    Apply to all {selectedVariant.rarity} units
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyToSameElement}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF6ED] hover:bg-[#E8DEC8] text-[#5C4A34] font-bold border border-[#D5C29E] cursor-pointer transition-colors"
                  >
                    Apply to all {selectedVariant.element} units
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] text-center text-[#78654E]">
              Select a unit from the roster on the right to customize its awakening costs.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Filterable Unit Browser (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search & Element / Rarity Filters */}
          <div className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] space-y-2.5 shadow-2xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#78654E] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search unit by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#2E1F0F] placeholder-[#78654E]/60 focus:outline-none focus:border-[#92400E]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2 text-[#78654E] hover:text-[#2E1F0F] text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Element Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {(['ALL', 'FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK'] as const).map((elem) => (
                <button
                  key={elem}
                  type="button"
                  onClick={() => setSelectedElement(elem)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    selectedElement === elem
                      ? 'bg-[#2E1F0F] text-[#FFFDF9] shadow-2xs'
                      : 'bg-[#FAF6ED] text-[#78654E] hover:bg-[#E8DEC8] border border-[#D5C29E]'
                  }`}
                >
                  {elem}
                </button>
              ))}
            </div>

            {/* Status Filter: All / Custom / Default */}
            <div className="flex items-center gap-1 pt-1 border-t border-[#E8DEC8]/60">
              {(['ALL', 'CUSTOM', 'DEFAULT'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${
                    statusFilter === st
                      ? 'bg-amber-100 text-amber-900 border border-amber-400 font-black'
                      : 'bg-[#FAF6ED] text-[#78654E] hover:bg-[#E8DEC8] border border-[#D5C29E]'
                  }`}
                >
                  {st === 'CUSTOM' ? 'Custom Only' : st === 'DEFAULT' ? 'Default Only' : 'All Status'}
                </button>
              ))}
            </div>
          </div>

          {/* Unit List Scroll Area */}
          <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1">
            {filteredVariants.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#FFFDF9] border border-[#D5C29E] text-center text-[#78654E] text-xs">
                No units match the search or filter criteria.
              </div>
            ) : (
              filteredVariants.map((v) => {
                const isSelected = selectedVariant?.variantId === v.variantId;
                const isCustom = Boolean(overrides[v.variantId]);
                const cost = awakeningCostService.getCost(v);

                return (
                  <div
                    key={v.variantId}
                    onClick={() => setSelectedVariant(v)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-[#FEF3C7] border-2 border-[#D97706] shadow-xs'
                        : isCustom
                        ? 'bg-[#FFFDF9] border-amber-300 hover:border-amber-400'
                        : 'bg-[#FFFDF9] border-[#E8DEC8] hover:border-[#D5C29E]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#D5C29E] shrink-0 bg-stone-100">
                        <MonsterAvatar variantId={v.variantId} size="sm" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-[#2E1F0F] truncate font-serif">
                            {v.name}
                          </span>
                          {isCustom && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              CUSTOM
                            </span>
                          )}
                        </div>

                        {/* Stones chips summary */}
                        <div className="flex items-center gap-1.5 text-[10px] text-[#78654E] mt-0.5">
                          <span
                            className="font-bold uppercase"
                            style={{ color: ELEMENT_CONFIG[v.element]?.color || '#EF4444' }}
                          >
                            {v.element[0]}:
                          </span>
                          <span>
                            {cost.elementalStones.small}S/{cost.elementalStones.medium}M/{cost.elementalStones.huge}H
                          </span>
                          <span>•</span>
                          <span className="text-purple-700 font-bold">M:</span>
                          <span>
                            {cost.magicStones.small}S/{cost.magicStones.medium}M/{cost.magicStones.huge}H
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleQuickOneStoneUnit(v, e)}
                        className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900 cursor-pointer shadow-2xs"
                        title="Set this unit to 1-Stone test mode immediately"
                      >
                        1-Stone
                      </button>

                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleQuickRevertUnit(v, e)}
                          className="p-1 rounded bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 cursor-pointer"
                          title="Revert back to default tier cost"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
