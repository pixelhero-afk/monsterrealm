/**
 * Summon Banners LiveOps Editor Tab
 * Allows Dean to view, configure, reorder, rate-adjust, and publish Astral Summon Gates.
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Crown,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Gem,
  Coins,
  Search,
  Eye,
  Star,
  Sliders,
  X,
  Copy,
} from 'lucide-react';
import { SummonBanner, MonsterVariant, ElementType, Rarity } from '../../types';
import { MONSTER_VARIANTS } from '../../data/monsters';
import { ELEMENT_VISUALS } from '../../data/elements';
import { MonsterAvatar } from '../MonsterAvatar';
import {
  getBannersApi,
  saveBannerApi,
  setFeaturedBannerApi,
  deleteBannerApi,
  resetBannersApi,
} from '../../services/apiClient';

interface BannerEditorTabProps {
  onBannersModified?: () => void;
}

export const BannerEditorTab: React.FC<BannerEditorTabProps> = ({ onBannersModified }) => {
  const [banners, setBanners] = useState<SummonBanner[]>([]);
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Fields
  const [formId, setFormId] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formTag, setFormTag] = useState<string>('FEATURED RATE UP');
  const [formCostType, setFormCostType] = useState<'GEMS' | 'SUMMON_POINTS'>('GEMS');
  const [formCostAmount, setFormCostAmount] = useState<number>(300);
  const [formPityThreshold, setFormPityThreshold] = useState<number>(30);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formFeaturedIds, setFormFeaturedIds] = useState<string[]>([]);

  // Rates State (as percentages 0-100)
  const [rateCommon, setRateCommon] = useState<number>(35);
  const [rateUncommon, setRateUncommon] = useState<number>(30);
  const [rateRare, setRateRare] = useState<number>(21);
  const [rateEpic, setRateEpic] = useState<number>(10);
  const [rateLegendary, setRateLegendary] = useState<number>(4);

  // Monster Picker State
  const [showMonsterPicker, setShowMonsterPicker] = useState<boolean>(false);
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerElement, setPickerElement] = useState<string>('ALL');
  const [pickerRarity, setPickerRarity] = useState<string>('ALL');

  // Confirmation States (Safe alternative to window.confirm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  const totalRatePct = Math.round((rateCommon + rateUncommon + rateRare + rateEpic + rateLegendary) * 10) / 10;

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await getBannersApi();
      if (res?.banners) {
        setBanners(res.banners);
        if (res.banners.length > 0 && !selectedBannerId) {
          selectBanner(res.banners[0]);
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch summon banners' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const selectBanner = (b: SummonBanner) => {
    setSelectedBannerId(b.bannerId);
    setFormId(b.bannerId);
    setFormName(b.name);
    setFormDescription(b.description || '');
    setFormTag(b.tag || (b.featuredVariantIds?.length ? 'FEATURED RATE UP' : 'STANDARD'));
    setFormCostType(b.cost?.type || 'GEMS');
    setFormCostAmount(b.cost?.amount || 300);
    setFormPityThreshold(b.pityThreshold || 30);
    setFormIsActive(b.isActive !== false);
    setFormFeaturedIds(b.featuredVariantIds ? [...b.featuredVariantIds] : []);

    const rates = b.rates || { common: 0.35, uncommon: 0.3, rare: 0.21, epic: 0.1, legendary: 0.04 };
    setRateCommon(Math.round((rates.common || 0) * 100));
    setRateUncommon(Math.round((rates.uncommon || 0) * 100));
    setRateRare(Math.round((rates.rare || 0) * 100));
    setRateEpic(Math.round((rates.epic || 0) * 100));
    setRateLegendary(Math.round((rates.legendary || 0) * 100));

    setConfirmDeleteId(null);
  };

  const handleCreateNew = () => {
    const newId = `banner_custom_${Date.now()}`;
    setSelectedBannerId(newId);
    setFormId(newId);
    setFormName('Astral Carnival Showcase');
    setFormDescription('Special realm festival! Boosted summon chances for featured champions.');
    setFormTag('LIMITED EVENT');
    setFormCostType('GEMS');
    setFormCostAmount(300);
    setFormPityThreshold(30);
    setFormIsActive(true);
    setFormFeaturedIds(['var_magestudent_light', 'var_sillyclown_fire']);
    setRateCommon(35);
    setRateUncommon(30);
    setRateRare(21);
    setRateEpic(10);
    setRateLegendary(4);
    setConfirmDeleteId(null);
  };

  const handleDuplicate = () => {
    const newId = `banner_copy_${Date.now()}`;
    setSelectedBannerId(newId);
    setFormId(newId);
    setFormName(`${formName} (Copy)`);
    setConfirmDeleteId(null);
  };

  const handleAutoBalanceRates = () => {
    const sum = rateCommon + rateUncommon + rateRare + rateEpic + rateLegendary;
    if (sum === 0) return;
    const factor = 100 / sum;
    setRateCommon(Math.round(rateCommon * factor));
    setRateUncommon(Math.round(rateUncommon * factor));
    setRateRare(Math.round(rateRare * factor));
    setRateEpic(Math.round(rateEpic * factor));
    const remainder = 100 - (Math.round(rateCommon * factor) + Math.round(rateUncommon * factor) + Math.round(rateRare * factor) + Math.round(rateEpic * factor));
    setRateLegendary(Math.max(1, remainder));
  };

  const applyRatePreset = (preset: 'STANDARD' | 'BOOSTED' | 'FESTIVAL') => {
    if (preset === 'STANDARD') {
      setRateCommon(40);
      setRateUncommon(30);
      setRateRare(20);
      setRateEpic(8);
      setRateLegendary(2);
    } else if (preset === 'BOOSTED') {
      setRateCommon(35);
      setRateUncommon(30);
      setRateRare(21);
      setRateEpic(10);
      setRateLegendary(4);
    } else if (preset === 'FESTIVAL') {
      setRateCommon(25);
      setRateUncommon(25);
      setRateRare(26);
      setRateEpic(16);
      setRateLegendary(8);
    }
  };

  const handleToggleFeaturedMonster = (variantId: string) => {
    setFormFeaturedIds((prev) => {
      if (prev.includes(variantId)) {
        return prev.filter((id) => id !== variantId);
      } else {
        return [...prev, variantId];
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formId.trim()) {
      setFeedback({ type: 'error', message: 'Banner ID and Name are required' });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      const bannerPayload: SummonBanner = {
        bannerId: formId.trim(),
        name: formName.trim(),
        description: formDescription.trim(),
        tag: formTag.trim(),
        featuredVariantIds: formFeaturedIds,
        rates: {
          common: rateCommon / 100,
          uncommon: rateUncommon / 100,
          rare: rateRare / 100,
          epic: rateEpic / 100,
          legendary: rateLegendary / 100,
        },
        probabilities: {
          '5★ Legendary': rateLegendary,
          '4★ Epic': rateEpic,
          '3★ Rare': rateRare,
          '2★ Uncommon': rateUncommon,
          '1★ Common': rateCommon,
        },
        cost: {
          type: formCostType,
          amount: Math.max(1, Number(formCostAmount)),
        },
        pityThreshold: Math.max(1, Number(formPityThreshold)),
        isActive: formIsActive,
      };

      const res = await saveBannerApi(bannerPayload);
      if (res?.allBanners) {
        setBanners(res.allBanners);
        if (res.banner) selectBanner(res.banner);
      }
      setFeedback({ type: 'success', message: `✓ Banner "${bannerPayload.name}" saved & active!` });
      onBannersModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save banner' });
    } finally {
      setSaving(false);
    }
  };

  const handleSetFeatured = async () => {
    try {
      setSaving(true);
      setFeedback(null);
      const res = await setFeaturedBannerApi({
        name: formName,
        description: formDescription,
        featuredVariantIds: formFeaturedIds,
        costAmount: formCostAmount,
        pityThreshold: formPityThreshold,
        rates: {
          common: rateCommon / 100,
          uncommon: rateUncommon / 100,
          rare: rateRare / 100,
          epic: rateEpic / 100,
          legendary: rateLegendary / 100,
        },
      });
      if (res?.allBanners) {
        setBanners(res.allBanners);
        if (res.banner) selectBanner(res.banner);
      }
      setFeedback({ type: 'success', message: '✓ Set as active primary Featured Banner!' });
      onBannersModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to set featured banner' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setSaving(true);
      setFeedback(null);
      const res = await deleteBannerApi(id);
      if (res?.allBanners) {
        setBanners(res.allBanners);
        if (res.allBanners.length > 0) {
          selectBanner(res.allBanners[0]);
        } else {
          handleCreateNew();
        }
      }
      setFeedback({ type: 'success', message: '✓ Banner deleted.' });
      setConfirmDeleteId(null);
      onBannersModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete banner' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      setFeedback(null);
      const res = await resetBannersApi();
      if (res?.allBanners) {
        setBanners(res.allBanners);
        if (res.allBanners.length > 0) selectBanner(res.allBanners[0]);
      }
      setFeedback({ type: 'success', message: '✓ Restored original default summon banners.' });
      setConfirmReset(false);
      onBannersModified?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reset banners' });
    } finally {
      setSaving(false);
    }
  };

  // Filtered monsters for picker
  const filteredCatalogMonsters = Object.values(MONSTER_VARIANTS).filter((v) => {
    if (v.familyId === 'fam_boss') return false;
    if (pickerElement !== 'ALL' && v.element !== pickerElement) return false;
    if (pickerRarity !== 'ALL' && v.rarity !== pickerRarity) return false;
    if (pickerSearch.trim()) {
      const q = pickerSearch.toLowerCase();
      return v.name.toLowerCase().includes(q) || v.variantId.toLowerCase().includes(q) || v.element.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF3E3] p-3 rounded-2xl border border-[#D5C29E]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500 border border-purple-700 flex items-center justify-center text-white shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-[#2E1F0F] text-sm">Summon Banners LiveOps Editor</h3>
            <p className="text-[11px] text-[#7A6348]">
              Configure rate-ups, pity thresholds, featured champions, and Astral Gate summon costs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNew}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Banner</span>
          </button>

          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              title="Reset banners to default configuration"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-rose-100 p-1 rounded-xl border border-rose-300">
              <span className="text-[10px] text-rose-900 font-bold px-1">Confirm reset?</span>
              <button
                onClick={handleReset}
                disabled={saving}
                className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-black hover:bg-rose-700 cursor-pointer"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-2 py-1 bg-white text-stone-700 rounded-lg text-[10px] font-bold hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Main Split: Banners List (Left) + Editor Form & Live Preview (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column: Banners List */}
        <div className="md:col-span-4 space-y-2 max-h-[620px] overflow-y-auto pr-1">
          <div className="text-[11px] font-black uppercase text-[#7A6348] tracking-wider px-1">
            Summon Banners ({banners.length})
          </div>

          {banners.map((b) => {
            const isSelected = b.bannerId === selectedBannerId;
            const isFeatured = b.featuredVariantIds && b.featuredVariantIds.length > 0;

            return (
              <div
                key={b.bannerId}
                onClick={() => selectBanner(b)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative ${
                  isSelected
                    ? 'bg-purple-50 border-purple-400 shadow-sm ring-1 ring-purple-400'
                    : 'bg-white hover:bg-[#FFFDF9] border-[#EADBBE] shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border ${
                      isFeatured
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-blue-100 text-blue-900 border-blue-300'
                    }`}
                  >
                    {b.tag || (isFeatured ? 'FEATURED' : 'STANDARD')}
                  </span>
                  <span className="text-[10px] text-[#8C765C] font-mono flex items-center gap-1">
                    {b.cost?.type === 'GEMS' ? (
                      <Gem className="w-3 h-3 text-sky-600 inline" />
                    ) : (
                      <Coins className="w-3 h-3 text-amber-600 inline" />
                    )}
                    {b.cost?.amount}
                  </span>
                </div>

                <h4 className="text-xs font-black text-[#2E1F0F] line-clamp-1 font-serif">
                  {b.name}
                </h4>

                <p className="text-[10px] text-[#7A6348] line-clamp-2 mt-0.5">
                  {b.description}
                </p>

                {/* Featured preview icons */}
                {b.featuredVariantIds && b.featuredVariantIds.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[9px] text-[#8C765C] font-bold">Featured:</span>
                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      {b.featuredVariantIds.slice(0, 4).map((varId) => (
                        <div key={varId} className="w-5 h-5 rounded-full border border-amber-400 overflow-hidden bg-stone-100">
                          <MonsterAvatar variantId={varId} size="sm" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {b.featuredVariantIds.length > 4 && (
                        <div className="w-5 h-5 rounded-full bg-amber-200 border border-amber-400 text-[8px] font-black text-amber-900 flex items-center justify-center">
                          +{b.featuredVariantIds.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#EADBBE]/50 text-[10px] text-[#8C765C]">
                  <span>Pity: {b.pityThreshold || 30} pulls</span>
                  <span className="font-mono text-purple-700 font-bold">
                    ★ {Math.round((b.rates?.legendary || 0.02) * 100)}% 5★
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Editor Form & Live Preview */}
        <div className="md:col-span-8 space-y-4 max-h-[620px] overflow-y-auto pr-1">
          {/* Form */}
          <form onSubmit={handleSave} className="bg-white border border-[#EADBBE] rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EADBBE] pb-2">
              <span className="text-xs font-black font-serif text-[#2E1F0F] flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>{formId ? `Editing Banner: ${formId}` : 'Create Summon Banner'}</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="px-2.5 py-1 text-stone-700 hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  title="Duplicate as new template"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>

                <button
                  type="button"
                  onClick={handleSetFeatured}
                  disabled={saving}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Make this the active featured banner in Astral Summon Gate"
                >
                  <Crown className="w-3 h-3 text-amber-100" />
                  <span>Set as Featured</span>
                </button>

                {formId && (
                  !confirmDeleteId ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(formId)}
                      disabled={saving || banners.length <= 1}
                      className="px-2.5 py-1 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-40"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-300">
                      <span className="text-[10px] text-rose-800 font-bold">Delete?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(formId)}
                        className="text-rose-600 hover:text-rose-800 font-black text-xs cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-stone-500 hover:text-stone-700 text-xs cursor-pointer ml-1"
                      >
                        No
                      </button>
                    </div>
                  )
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Banner'}</span>
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">Banner ID</label>
                <input
                  type="text"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF6ED] border border-[#D5C29E] rounded-xl text-xs text-[#2E1F0F] font-mono focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={formTag}
                  onChange={(e) => setFormTag(e.target.value)}
                  placeholder="e.g. FEATURED RATE UP, LIMITED EVENT"
                  className="w-full px-3 py-1.5 bg-[#FAF6ED] border border-[#D5C29E] rounded-xl text-xs text-[#2E1F0F] focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">Banner Title / Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Feline Starlight (Featured Nekohime)"
                className="w-full px-3 py-1.5 bg-[#FAF6ED] border border-[#D5C29E] rounded-xl text-xs text-[#2E1F0F] font-bold focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">Description & Lore Tagline</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                placeholder="Describe rate-up perks, featured lore, and summon rewards..."
                className="w-full px-3 py-1.5 bg-[#FAF6ED] border border-[#D5C29E] rounded-xl text-xs text-[#2E1F0F] focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Cost, Pity & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[#FAF6ED]/70 border border-[#D5C29E]">
              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">Summon Currency</label>
                <select
                  value={formCostType}
                  onChange={(e) => setFormCostType(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-[#D5C29E] rounded-xl text-xs text-[#2E1F0F] font-bold"
                >
                  <option value="GEMS">💎 Astral Gems</option>
                  <option value="SUMMON_POINTS">🪙 Summon Points</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">Cost Per Summon</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={formCostAmount}
                  onChange={(e) => setFormCostAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-[#D5C29E] rounded-xl text-xs text-[#2E1F0F] font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">Pity Threshold (Pulls)</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={formPityThreshold}
                  onChange={(e) => setFormPityThreshold(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-[#D5C29E] rounded-xl text-xs text-[#2E1F0F] font-bold"
                />
              </div>
            </div>

            {/* Featured Champions Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase text-[#5C4A34] tracking-wider flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span>Featured Rate-Up Champions ({formFeaturedIds.length})</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowMonsterPicker(!showMonsterPicker)}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  {showMonsterPicker ? 'Close Picker' : '+ Add/Edit Champions'}
                </button>
              </div>

              {/* Selected Champions Pill List */}
              <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-[#FAF6ED] border border-[#D5C29E] min-h-[50px]">
                {formFeaturedIds.length === 0 ? (
                  <span className="text-[11px] text-[#8C765C] italic self-center">
                    No rate-up champions selected (standard pool rates apply to all monsters).
                  </span>
                ) : (
                  formFeaturedIds.map((varId) => {
                    const variant = MONSTER_VARIANTS[varId];
                    const elemVis = variant ? ELEMENT_VISUALS[variant.element] : null;

                    return (
                      <div
                        key={varId}
                        className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-white border border-amber-300 rounded-xl shadow-2xs"
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                          <MonsterAvatar variantId={varId} size="sm" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[11px] font-bold text-[#2E1F0F]">
                          {variant?.name || varId}
                        </span>
                        {elemVis && (
                          <span className={`text-[9px] font-black px-1 rounded ${elemVis.badgeBg} ${elemVis.badgeText}`}>
                            {variant.element}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleFeaturedMonster(varId)}
                          className="text-stone-400 hover:text-rose-600 cursor-pointer ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Monster Picker Drawer */}
              {showMonsterPicker && (
                <div className="p-3 bg-stone-50 border border-stone-300 rounded-xl space-y-3 animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-stone-800">Select Champions to Feature</span>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                        <input
                          type="text"
                          value={pickerSearch}
                          onChange={(e) => setPickerSearch(e.target.value)}
                          placeholder="Search monsters..."
                          className="pl-8 pr-2 py-1 bg-white border border-stone-300 rounded-lg text-xs w-36"
                        />
                      </div>

                      <select
                        value={pickerElement}
                        onChange={(e) => setPickerElement(e.target.value)}
                        className="px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs"
                      >
                        <option value="ALL">All Elements</option>
                        <option value="FIRE">Fire</option>
                        <option value="WATER">Water</option>
                        <option value="GRASS">Grass</option>
                        <option value="LIGHT">Light</option>
                        <option value="DARK">Dark</option>
                      </select>

                      <select
                        value={pickerRarity}
                        onChange={(e) => setPickerRarity(e.target.value)}
                        className="px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs"
                      >
                        <option value="ALL">All Rarities</option>
                        <option value="LEGENDARY">5★ Legendary</option>
                        <option value="EPIC">4★ Epic</option>
                        <option value="RARE">3★ Rare</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                    {filteredCatalogMonsters.map((v) => {
                      const isFeatured = formFeaturedIds.includes(v.variantId);
                      return (
                        <button
                          key={v.variantId}
                          type="button"
                          onClick={() => handleToggleFeaturedMonster(v.variantId)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            isFeatured
                              ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-400'
                              : 'bg-white hover:bg-stone-100 border-stone-200'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                            <MonsterAvatar variantId={v.variantId} size="sm" className="w-full h-full object-cover" />
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-[11px] font-bold text-stone-900 truncate">{v.name}</div>
                            <div className="text-[9px] text-stone-500 flex items-center gap-1">
                              <span>{'★'.repeat(v.stars)}</span>
                              <span>• {v.element}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Summon Rates Matrix */}
            <div className="space-y-2 p-3 rounded-xl bg-[#FAF6ED]/70 border border-[#D5C29E]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-black text-[#2E1F0F]">Rarity Probabilities (Total: {totalRatePct}%)</span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      totalRatePct === 100
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {totalRatePct === 100 ? 'Balanced 100%' : 'Must Equal 100%'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAutoBalanceRates}
                    className="px-2 py-0.5 bg-white border border-[#D5C29E] hover:bg-stone-100 rounded-md text-[10px] font-bold text-[#5C4A34] cursor-pointer"
                  >
                    Auto-Balance to 100%
                  </button>
                  <button
                    type="button"
                    onClick={() => applyRatePreset('STANDARD')}
                    className="px-2 py-0.5 bg-white border border-[#D5C29E] hover:bg-stone-100 rounded-md text-[10px] font-bold text-[#5C4A34] cursor-pointer"
                  >
                    Preset: Standard (2% 5★)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyRatePreset('BOOSTED')}
                    className="px-2 py-0.5 bg-amber-100 border border-amber-300 hover:bg-amber-200 rounded-md text-[10px] font-bold text-amber-900 cursor-pointer"
                  >
                    Preset: Boosted (4% 5★)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyRatePreset('FESTIVAL')}
                    className="px-2 py-0.5 bg-purple-100 border border-purple-300 hover:bg-purple-200 rounded-md text-[10px] font-bold text-purple-900 cursor-pointer"
                  >
                    Preset: Festival (8% 5★)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 pt-2 text-center">
                <div className="p-2 rounded-lg bg-stone-100 border border-stone-200">
                  <span className="text-[10px] font-black text-stone-600 block">1★ Common</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rateCommon}
                    onChange={(e) => setRateCommon(Number(e.target.value))}
                    className="w-full text-center font-bold text-xs bg-white rounded border border-stone-300 mt-1 py-1"
                  />
                  <span className="text-[9px] text-stone-500 block mt-0.5">{rateCommon}%</span>
                </div>

                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-black text-emerald-800 block">2★ Uncommon</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rateUncommon}
                    onChange={(e) => setRateUncommon(Number(e.target.value))}
                    className="w-full text-center font-bold text-xs bg-white rounded border border-emerald-300 mt-1 py-1"
                  />
                  <span className="text-[9px] text-emerald-700 block mt-0.5">{rateUncommon}%</span>
                </div>

                <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="text-[10px] font-black text-blue-800 block">3★ Rare</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rateRare}
                    onChange={(e) => setRateRare(Number(e.target.value))}
                    className="w-full text-center font-bold text-xs bg-white rounded border border-blue-300 mt-1 py-1"
                  />
                  <span className="text-[9px] text-blue-700 block mt-0.5">{rateRare}%</span>
                </div>

                <div className="p-2 rounded-lg bg-purple-50 border border-purple-200">
                  <span className="text-[10px] font-black text-purple-800 block">4★ Epic</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rateEpic}
                    onChange={(e) => setRateEpic(Number(e.target.value))}
                    className="w-full text-center font-bold text-xs bg-white rounded border border-purple-300 mt-1 py-1"
                  />
                  <span className="text-[9px] text-purple-700 block mt-0.5">{rateEpic}%</span>
                </div>

                <div className="p-2 rounded-lg bg-amber-50 border border-amber-300">
                  <span className="text-[10px] font-black text-amber-800 block">5★ Legendary</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rateLegendary}
                    onChange={(e) => setRateLegendary(Number(e.target.value))}
                    className="w-full text-center font-black text-xs bg-white rounded border border-amber-400 mt-1 py-1 text-amber-900"
                  />
                  <span className="text-[9px] text-amber-700 font-bold block mt-0.5">{rateLegendary}%</span>
                </div>
              </div>
            </div>
          </form>

          {/* Live Preview Panel */}
          <div className="bg-[#FAF3E3] border border-[#D5C29E] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black font-serif text-[#2E1F0F] flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-purple-600" />
                <span>Live Astral Altar Preview (What Players See)</span>
              </span>
              <span className="text-[10px] font-bold text-[#7A6348]">
                Cost: {formCostAmount} {formCostType === 'GEMS' ? 'Gems' : 'Points'} • Pity: {formPityThreshold}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-950 to-stone-900 border-2 border-amber-400/80 shadow-lg text-white relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-mono">
                  {formTag || 'FEATURED RATE UP'}
                </span>

                <div className="flex items-center gap-1.5 text-xs font-mono font-bold bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">
                  <span className="text-amber-400">★ {rateLegendary}% 5★ Legendary</span>
                  <span>•</span>
                  <span className="text-purple-300">{rateEpic}% 4★ Epic</span>
                </div>
              </div>

              <h3 className="text-lg font-black font-serif tracking-wide text-amber-200">
                {formName || 'Astral Summon Gate'}
              </h3>
              <p className="text-xs text-stone-300 mt-1 max-w-xl">
                {formDescription || 'Summon legendary heroes from the astral vortex.'}
              </p>

              {/* Featured Showcase */}
              {formFeaturedIds.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/15 flex flex-wrap items-center gap-3">
                  <span className="text-[11px] font-black text-amber-300">Rate-Up Champions:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {formFeaturedIds.map((varId) => {
                      const v = MONSTER_VARIANTS[varId];
                      return (
                        <div
                          key={varId}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-black/50 border border-amber-400/50 backdrop-blur-xs"
                        >
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-stone-800 border border-amber-400">
                            <MonsterAvatar variantId={varId} size="sm" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-white leading-tight">
                              {v?.name || varId}
                            </div>
                            <div className="text-[8px] text-amber-300 font-mono">
                              {'★'.repeat(v?.stars || 5)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
