/**
 * Unit Registry Browser for Developer Sandbox
 * Inspect all standard and custom-created units, view canonical asset directories,
 * and grant units directly to the player's team roster.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Copy,
  Check,
  PlusCircle,
  Folder,
  Trash2,
  Sparkles,
  Flame,
  Droplets,
  Leaf,
  Sun,
  Moon,
  Shield,
  Sword,
  RotateCcw,
  Layers,
  Image as ImageIcon,
  Ban,
  CheckCircle2,
  Power,
} from 'lucide-react';
import { ElementType, MonsterVariant } from '../../types';
import { getAllVariants } from '../../data/monsters';
import { customUnitsService } from '../../services/customUnitsService';
import { CharacterSpriteManagerModal } from './CharacterSpriteManagerModal';
import { monster2DRegistry } from '../../services/character2d/monster2DRegistry';
import { unitAvailabilityService } from '../../services/unitAvailabilityService';

interface UnitRegistryTabProps {
  onRosterUpdated: () => void;
}

const ELEMENT_BADGES: Record<
  ElementType,
  { label: string; icon: any; color: string; bg: string }
> = {
  FIRE: { label: 'Fire', icon: Flame, color: '#EF4444', bg: 'bg-red-500/10 text-red-700' },
  WATER: { label: 'Water', icon: Droplets, color: '#3B82F6', bg: 'bg-blue-500/10 text-blue-700' },
  GRASS: { label: 'Grass', icon: Leaf, color: '#10B981', bg: 'bg-emerald-500/10 text-emerald-700' },
  LIGHT: { label: 'Light', icon: Sun, color: '#F59E0B', bg: 'bg-amber-500/10 text-amber-700' },
  DARK: { label: 'Dark', icon: Moon, color: '#8B5CF6', bg: 'bg-purple-500/10 text-purple-700' },
};

export const UnitRegistryTab: React.FC<UnitRegistryTabProps> = ({ onRosterUpdated }) => {
  const [search, setSearch] = useState<string>('');
  const [selectedElement, setSelectedElement] = useState<ElementType | 'ALL'>('ALL');
  const [onlyCustom, setOnlyCustom] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ENABLED' | 'DISABLED'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [grantingId, setGrantingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [togglingDisabledId, setTogglingDisabledId] = useState<string | null>(null);
  const [managingVariant, setManagingVariant] = useState<MonsterVariant | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [variantsList, setVariantsList] = useState<MonsterVariant[]>([]);
  const [disabledVariantIds, setDisabledVariantIds] = useState<string[]>([]);

  const loadVariants = () => {
    setVariantsList(getAllVariants());
    setDisabledVariantIds(unitAvailabilityService.getDisabledIds());
  };

  useEffect(() => {
    loadVariants();
    const unsubCustom = customUnitsService.subscribe(() => {
      loadVariants();
    });
    const unsubAvailability = unitAvailabilityService.subscribe(() => {
      setDisabledVariantIds(unitAvailabilityService.getDisabledIds());
    });
    return () => {
      unsubCustom();
      unsubAvailability();
    };
  }, []);

  const disabledSet = useMemo(() => new Set(disabledVariantIds), [disabledVariantIds]);

  const filteredVariants = useMemo(() => {
    const q = search.toLowerCase().trim();
    return variantsList.filter((v) => {
      if (selectedElement !== 'ALL' && v.element !== selectedElement) return false;
      if (onlyCustom && !customUnitsService.isCustomVariant(v.variantId)) return false;
      const isDisabled = disabledSet.has(v.variantId);
      if (statusFilter === 'ENABLED' && isDisabled) return false;
      if (statusFilter === 'DISABLED' && !isDisabled) return false;
      if (!q) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        v.variantId.toLowerCase().includes(q) ||
        v.familyId.toLowerCase().includes(q)
      );
    });
  }, [variantsList, search, selectedElement, onlyCustom, statusFilter, disabledSet]);

  const handleToggleDisabled = async (v: MonsterVariant) => {
    try {
      setTogglingDisabledId(v.variantId);
      setFeedback(null);
      const isCurrentlyDisabled = disabledSet.has(v.variantId);
      const targetState = !isCurrentlyDisabled;
      await unitAvailabilityService.setUnitDisabled(v.variantId, targetState);
      setFeedback(
        targetState
          ? `Disabled ${v.name}: Removed from summon gate, blocked from battles & party assignment.`
          : `Enabled ${v.name}: Now usable in party, battles, and obtainable via summon gate.`
      );
      loadVariants();
      onRosterUpdated();
    } catch (err: any) {
      setFeedback(`Error toggling unit availability: ${err.message}`);
    } finally {
      setTogglingDisabledId(null);
    }
  };

  const handleCopyDir = (v: MonsterVariant) => {
    const unit = (v.familyId ? v.familyId.replace(/^fam_/, '') : v.variantId.replace(/^var_/, '').split('_')[0]).toLowerCase();
    const elem = v.element.toLowerCase();
    const dir = `public/assets/characters/${unit}/${elem}/`;
    navigator.clipboard.writeText(dir);
    setCopiedId(v.variantId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGrantUnit = async (v: MonsterVariant) => {
    try {
      setGrantingId(v.variantId);
      setFeedback(null);
      await customUnitsService.grantUnit(v.variantId, 15, v.stars || 4);
      setFeedback(`Granted a Level 15 copy of ${v.name} to your roster!`);
      onRosterUpdated();
    } catch (err: any) {
      setFeedback(`Error granting unit: ${err.message}`);
    } finally {
      setGrantingId(null);
    }
  };

  const handleResetUnitSprites = async (v: MonsterVariant) => {
    const unitSlug = (v.familyId ? v.familyId.replace(/^fam_/, '') : v.variantId.replace(/^var_/, '').split('_')[0]).toLowerCase();
    const elemSlug = v.element.toLowerCase();
    const dir = `public/assets/characters/${unitSlug}/${elemSlug}/`;

    if (!confirm(`Are you sure you want to delete all sprites for ${v.name}?\n\nThis will remove all PNG character sprite files in ${dir}.`)) {
      return;
    }

    try {
      setResettingId(v.variantId);
      setFeedback(null);
      const res = await fetch('/api/characters/sprites/reset-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit: unitSlug, element: elemSlug }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback(`Reset successful! Deleted ${data.count} sprite file(s) for ${v.name}.`);
        await monster2DRegistry.refreshServerStatus();
        onRosterUpdated();
      } else {
        setFeedback(`Error resetting sprites: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setResettingId(null);
    }
  };

  const handleDeleteCustom = async (v: MonsterVariant) => {
    if (!confirm(`Are you sure you want to remove ${v.name} from the game data? (All existing PNG sprite assets remain preserved)`)) {
      return;
    }
    try {
      await customUnitsService.deleteCustomUnit(v.variantId);
      setFeedback(`Removed ${v.name} from custom units.`);
      loadVariants();
      onRosterUpdated();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header filter controls */}
      <div className="bg-[#FFFDF9] border border-[#D5C29E] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#78654E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search units by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#2E1F0F] focus:outline-none focus:border-[#F59E0B]"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-[#5C4A34] shrink-0 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyCustom}
              onChange={(e) => setOnlyCustom(e.target.checked)}
              className="w-4 h-4 rounded text-[#D97706] focus:ring-[#F59E0B]"
            />
            <span>Custom Units Only</span>
          </label>
        </div>

        {/* Availability & Element selector chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E8DEC8]">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#FAF6ED] p-1 rounded-xl border border-[#E8DEC8]">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#2E1F0F] text-[#FFFDF9] shadow-2xs'
                  : 'text-[#78654E] hover:text-[#2E1F0F]'
              }`}
            >
              All Status ({variantsList.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ENABLED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                statusFilter === 'ENABLED'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Active ({variantsList.length - disabledSet.size})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DISABLED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                statusFilter === 'DISABLED'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <Ban className="w-3 h-3" />
              <span>Disabled ({disabledSet.size})</span>
            </button>
          </div>

          {/* Element selector chips */}
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setSelectedElement('ALL')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                selectedElement === 'ALL'
                  ? 'bg-[#2E1F0F] text-[#FFFDF9]'
                  : 'bg-[#FAF6ED] text-[#78654E] border border-[#D5C29E] hover:border-[#2E1F0F]'
              }`}
            >
              All Elements
            </button>
            {(['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK'] as ElementType[]).map((elem) => {
              const badge = ELEMENT_BADGES[elem];
              const isSelected = selectedElement === elem;
              return (
                <button
                  key={elem}
                  type="button"
                  onClick={() => setSelectedElement(elem)}
                  className={`px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#2E1F0F] text-[#FFFDF9]'
                      : 'bg-[#FAF6ED] text-[#78654E] border border-[#D5C29E] hover:border-[#2E1F0F]'
                  }`}
                >
                  <badge.icon className="w-3.5 h-3.5" style={{ color: isSelected ? '#FFF' : badge.color }} />
                  <span>{badge.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/60 text-[#92400E] text-xs font-semibold">
          {feedback}
        </div>
      )}

      {/* Units List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
        {filteredVariants.map((v) => {
          const badge = ELEMENT_BADGES[v.element];
          const isCustom = customUnitsService.isCustomVariant(v.variantId);
          const isDisabled = disabledSet.has(v.variantId);
          const unitSlug = (v.familyId ? v.familyId.replace(/^fam_/, '') : v.variantId.replace(/^var_/, '').split('_')[0]).toLowerCase();
          const elemSlug = v.element.toLowerCase();
          const dirPath = `public/assets/characters/${unitSlug}/${elemSlug}/`;

          return (
            <div
              key={v.variantId}
              className={`border rounded-2xl p-3.5 shadow-2xs transition-all flex flex-col justify-between gap-3 ${
                isDisabled
                  ? 'bg-rose-50/40 border-rose-300 hover:border-rose-400'
                  : 'bg-[#FFFDF9] border-[#D5C29E] hover:border-[#F59E0B]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${badge.bg}`}>
                        {v.element}
                      </span>
                      {isCustom && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-300">
                          Custom Unit
                        </span>
                      )}
                      {isDisabled ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          <Ban className="w-2.5 h-2.5" />
                          Disabled
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Active
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-[#78654E]">
                        {'★'.repeat(v.stars || 3)}
                      </span>
                    </div>
                    <h4 className={`text-sm font-black mt-1 ${isDisabled ? 'text-rose-950 line-through opacity-80' : 'text-[#2E1F0F]'}`}>
                      {v.name}
                    </h4>
                    <p className="text-[11px] text-[#78654E]">
                      {v.primaryRole} {v.secondaryRole ? `• ${v.secondaryRole}` : ''} ({v.familyId})
                    </p>
                  </div>

                  {/* Disable / Enable Toggle Button */}
                  <div className="shrink-0 flex flex-col items-end">
                    <button
                      type="button"
                      disabled={togglingDisabledId === v.variantId}
                      onClick={() => handleToggleDisabled(v)}
                      className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs disabled:opacity-50 ${
                        isDisabled
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700'
                      }`}
                      title={isDisabled ? `Re-enable ${v.name}` : `Disable ${v.name} (blocks from battles, party, summon)`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{togglingDisabledId === v.variantId ? 'Saving...' : isDisabled ? 'Enable' : 'Disable'}</span>
                    </button>
                    <span className="text-[9px] text-[#9C8265] mt-0.5">
                      {isDisabled ? 'Blocked' : 'Allowed'}
                    </span>
                  </div>
                </div>

                {/* Directory snippet */}
                <div className="mt-2.5 flex items-center justify-between gap-2 bg-[#FAF6ED] border border-[#E8DEC8] rounded-xl px-2.5 py-1.5 text-[10px] font-mono text-[#5C4A34]">
                  <span className="truncate">{dirPath}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyDir(v)}
                    className="shrink-0 text-[#D97706] hover:text-[#92400E] font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    {copiedId === v.variantId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === v.variantId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8DEC8]">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={grantingId === v.variantId || isDisabled}
                    onClick={() => handleGrantUnit(v)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#2E1F0F] hover:bg-[#4A321A] text-[#FFFDF9] font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-40"
                    title={isDisabled ? 'Cannot grant disabled unit' : `Grant level 15 copy of ${v.name}`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                    <span>Grant</span>
                  </button>

                  {/* Sprites inspector button */}
                  <button
                    type="button"
                    onClick={() => setManagingVariant(v)}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300/80 text-amber-900 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title={`Inspect & manage sprites for ${v.name}`}
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-700" />
                    <span>Sprites</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Reset Sprites Button */}
                  <button
                    type="button"
                    disabled={resettingId === v.variantId}
                    onClick={() => handleResetUnitSprites(v)}
                    className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                    title={`Delete / Reset all sprite PNGs for ${v.name}`}
                  >
                    <RotateCcw className={`w-3.5 h-3.5 text-red-600 ${resettingId === v.variantId ? 'animate-spin' : ''}`} />
                    <span>{resettingId === v.variantId ? 'Resetting...' : 'Reset Sprites'}</span>
                  </button>

                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustom(v)}
                      className="p-1.5 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 cursor-pointer"
                      title="Remove custom unit (keeps assets)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Character Sprite Manager & Reset Modal */}
      {managingVariant && (
        <CharacterSpriteManagerModal
          variant={managingVariant}
          isOpen={!!managingVariant}
          onClose={() => setManagingVariant(null)}
          onSpritesChanged={() => {
            loadVariants();
            onRosterUpdated();
          }}
        />
      )}
    </div>
  );
};
