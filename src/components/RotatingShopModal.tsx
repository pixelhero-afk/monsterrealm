/**
 * Monster Realms - 24-Hour Rotating Magic Shop Modal
 * The Wandering Merchant offers 4 random items every 24 hours:
 * - Normal Scrolls
 * - Epic Scrolls (rare find!)
 * - Common Grade Equipment (with complete stat preview and inspect before buying)
 * - Stamina Refills
 * - Elemental Awakening Stones
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  Clock,
  RotateCcw,
  Sparkles,
  Coins,
  Gem,
  CheckCircle2,
  Scroll,
  Shield,
  Zap,
  AlertCircle,
  Eye,
  Sword,
  Footprints,
  Crown,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react';
import {
  PlayerProfile,
  RotatingShopData,
  ShopItem,
  EquipmentItem,
  EquipmentSlot,
  EquipmentSetType,
} from '../types';
import { buyShopItem, refreshShop } from '../services/apiClient';
import { EQUIPMENT_SET_BONUSES } from '../data/equipment';

interface RotatingShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onRefresh: () => void;
  onNavigateToSummon?: () => void;
  onNavigateToMonsters?: () => void;
}

function getSlotIcon(slot: EquipmentSlot) {
  switch (slot) {
    case 'WEAPON':
      return Sword;
    case 'HELM':
      return Crown;
    case 'ARMOR':
      return Shield;
    case 'BOOTS':
      return Footprints;
    default:
      return Shield;
  }
}

function formatStat(stat: string, value: number, isPercent: boolean): { name: string; valueFormatted: string } {
  const statNames: Record<string, string> = {
    hp: 'Health (HP)',
    attack: 'Attack (ATK)',
    defense: 'Defense (DEF)',
    speed: 'Speed (SPD)',
    critRate: 'Crit Rate',
    critDamage: 'Crit DMG',
    accuracy: 'Accuracy',
    resistance: 'Resistance',
    healingDone: 'Healing Done',
    shieldingDone: 'Shielding Done',
  };
  const name = statNames[stat] || stat.toUpperCase();
  const valueFormatted = isPercent ? `+${Math.round(value * 100)}%` : `+${value}`;
  return { name, valueFormatted };
}

function getSetColorClasses(set: EquipmentSetType): { bg: string; text: string; border: string } {
  switch (set) {
    case 'FATAL':
      return { bg: 'bg-red-500/10', text: 'text-red-700', border: 'border-red-300' };
    case 'ENERGY':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-300' };
    case 'SWIFT':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-700', border: 'border-cyan-300' };
    case 'GUARD':
      return { bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-300' };
    case 'BLADE':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-700', border: 'border-indigo-300' };
    case 'FOCUS':
      return { bg: 'bg-amber-500/10', text: 'text-amber-800', border: 'border-amber-300' };
    case 'DESTRUCTION':
      return { bg: 'bg-purple-500/10', text: 'text-purple-700', border: 'border-purple-300' };
    case 'LIFE':
      return { bg: 'bg-rose-500/10', text: 'text-rose-700', border: 'border-rose-300' };
    case 'BASTION':
      return { bg: 'bg-stone-500/10', text: 'text-stone-700', border: 'border-stone-300' };
    default:
      return { bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-300' };
  }
}

export const RotatingShopModal: React.FC<RotatingShopModalProps> = ({
  isOpen,
  onClose,
  profile,
  onRefresh,
  onNavigateToSummon,
  onNavigateToMonsters,
}) => {
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [confirmingRefresh, setConfirmingRefresh] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('24:00:00');

  // Equipment Inspect & Purchase Confirmation States
  const [inspectingEquipment, setInspectingEquipment] = useState<EquipmentItem | null>(null);
  const [confirmingBuyItem, setConfirmingBuyItem] = useState<ShopItem | null>(null);
  const [acquiredEquipmentNotice, setAcquiredEquipmentNotice] = useState<EquipmentItem | null>(null);

  const shop: RotatingShopData | undefined = profile.shop;

  // Countdown timer for next 24-hour rotation
  useEffect(() => {
    if (!isOpen || !shop?.nextRotationTimestamp) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, shop.nextRotationTimestamp - now);
      if (diff <= 0) {
        setTimeLeft('Rotating now...');
        onRefresh();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen, shop?.nextRotationTimestamp, onRefresh]);

  if (!isOpen) return null;

  const initiateBuy = (item: ShopItem) => {
    if (item.isSold) return;

    // If it's an equipment item, show stats confirmation first!
    if (item.type === 'COMMON_EQUIPMENT') {
      setConfirmingBuyItem(item);
      return;
    }

    // Direct buy for consumables
    executeBuy(item);
  };

  const executeBuy = async (item: ShopItem) => {
    try {
      setBuyingId(item.id);
      setStatusMessage(null);
      const res = await buyShopItem(item.id);

      if (res.acquiredEquipment) {
        setAcquiredEquipmentNotice(res.acquiredEquipment);
      } else if (item.reward.equipmentItem) {
        setAcquiredEquipmentNotice(item.reward.equipmentItem);
      }

      setStatusMessage({ type: 'success', text: res.message || `Acquired ${item.name}!` });
      setConfirmingBuyItem(null);
      onRefresh();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Purchase failed.' });
    } finally {
      setBuyingId(null);
    }
  };

  const handleManualRefresh = async () => {
    if (!confirmingRefresh) {
      setConfirmingRefresh(true);
      return;
    }
    try {
      setIsRefreshing(true);
      setConfirmingRefresh(false);
      setStatusMessage(null);
      await refreshShop();
      setStatusMessage({ type: 'success', text: 'Merchant wares refreshed!' });
      onRefresh();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to refresh shop.' });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1E1710]/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-3xl w-full fantasy-scroll-card p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden space-y-4 relative">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DEC8]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-700 border border-amber-300 flex items-center justify-center text-white shadow-xs">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-[#2E1F0F] font-serif">
                  The Wandering Merchant's Magic Shop
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Daily 24h Rotation
                </span>
              </div>
              <p className="text-[11px] text-[#5C4A34]">
                The merchant restocks 4 mysterious realm treasures every 24 hours.
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

        {/* Rotation Timer & Wallet Ribbon */}
        <div className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-[#78654E]">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="font-medium">Wares Restock In:</span>
            <span className="font-mono font-black text-sm text-[#2E1F0F] bg-amber-100/70 px-2 py-0.5 rounded-lg border border-amber-300">
              {timeLeft}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Player Currencies */}
            <div className="flex items-center gap-1 font-bold text-[#2E1F0F] bg-[#FAF6ED] px-2.5 py-1 rounded-xl border border-[#D5C29E]">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>{profile.currencies.gold.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-1 font-bold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
              <Gem className="w-3.5 h-3.5 text-purple-600" />
              <span>{profile.currencies.gems.toLocaleString()}</span>
            </div>

            <button
              type="button"
              disabled={isRefreshing}
              onClick={handleManualRefresh}
              className={`px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs disabled:opacity-50 ${
                confirmingRefresh
                  ? 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-700 animate-pulse'
                  : 'bg-[#FAF6ED] hover:bg-[#E8DEC8] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E]'
              }`}
              title="Restock wares early for 50 gems"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{confirmingRefresh ? 'Confirm? (50 💎)' : 'Restock (50 💎)'}</span>
            </button>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-2xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-red-50 text-red-900 border-red-300'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-stone-500 hover:text-stone-800 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 4 Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1 overflow-y-auto pr-1">
          {(!shop?.items || shop.items.length === 0) ? (
            <div className="col-span-2 p-8 text-center text-[#78654E] bg-[#FFFDF9] rounded-2xl border border-[#D5C29E]">
              The merchant is unpacking their caravan... Refresh to view wares.
            </div>
          ) : (
            shop.items.map((item) => {
              const isBuying = buyingId === item.id;
              const isGold = item.cost.currency === 'gold';
              const canAfford = isGold
                ? profile.currencies.gold >= item.cost.amount
                : profile.currencies.gems >= item.cost.amount;

              const isEquipment = item.type === 'COMMON_EQUIPMENT';
              const eqItem = item.reward.equipmentItem;
              const slot = item.reward.equipmentSlot || eqItem?.slot || 'WEAPON';
              const SlotIcon = getSlotIcon(slot);
              const setBonus = eqItem ? EQUIPMENT_SET_BONUSES[eqItem.set] : null;
              const setColors = eqItem ? getSetColorClasses(eqItem.set) : { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' };

              const mainStat = eqItem ? formatStat(eqItem.mainStat.stat, eqItem.mainStat.value, eqItem.mainStat.isPercent) : null;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all shadow-xs relative overflow-hidden ${
                    item.isSold
                      ? 'bg-stone-100/70 border-stone-300 opacity-60'
                      : item.type === 'SCROLL_EPIC'
                      ? 'bg-gradient-to-br from-[#FAF5FF] to-[#F3E8FF] border-purple-400'
                      : item.type === 'SCROLL_NORMAL'
                      ? 'bg-gradient-to-br from-[#FFFDF9] to-[#FEF3C7] border-amber-300'
                      : isEquipment
                      ? 'bg-gradient-to-br from-[#FFFDF9] to-[#F5F2EB] border-[#B89D77]'
                      : 'bg-[#FFFDF9] border-[#D5C29E]'
                  }`}
                >
                  {/* Sold Out Banner Overlay */}
                  {item.isSold && (
                    <div className="absolute top-3 right-3 bg-stone-700 text-white font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs">
                      SOLD OUT
                    </div>
                  )}

                  {/* Item Content */}
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-serif text-2xl shrink-0 shadow-2xs border ${
                          item.type === 'SCROLL_EPIC'
                            ? 'bg-purple-100 border-purple-300 text-purple-900'
                            : item.type === 'SCROLL_NORMAL'
                            ? 'bg-amber-100 border-amber-300 text-amber-900'
                            : item.type === 'STAMINA_REFILL'
                            ? 'bg-teal-100 border-teal-300 text-teal-800'
                            : item.type === 'ELEMENTAL_STONES'
                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'bg-amber-50 border-amber-300 text-amber-800'
                        }`}
                      >
                        {item.type === 'SCROLL_EPIC' && '🔮'}
                        {item.type === 'SCROLL_NORMAL' && '📜'}
                        {item.type === 'STAMINA_REFILL' && '⚡'}
                        {item.type === 'ELEMENTAL_STONES' && '💎'}
                        {isEquipment && <SlotIcon className="w-6 h-6 text-amber-800" />}
                      </div>

                      <div className="min-w-0 flex-1 pr-14">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-black text-[#2E1F0F] font-serif truncate">
                            {item.name}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                              item.type === 'SCROLL_EPIC'
                                ? 'bg-purple-200 text-purple-950 border-purple-300'
                                : item.type === 'SCROLL_NORMAL'
                                ? 'bg-amber-200 text-amber-950 border-amber-300'
                                : isEquipment
                                ? 'bg-stone-200 text-stone-900 border-stone-300'
                                : 'bg-[#FAF6ED] text-[#78654E] border-[#D5C29E]'
                            }`}
                          >
                            {isEquipment && <SlotIcon className="w-2.5 h-2.5" />}
                            {item.type === 'SCROLL_EPIC'
                              ? '★ RARE FIND'
                              : isEquipment
                              ? `${slot} • COMMON`
                              : item.type.replace('_', ' ')}
                          </span>

                          {isEquipment && eqItem && (
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${setColors.bg} ${setColors.text} ${setColors.border}`}
                            >
                              {eqItem.set} SET
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* EQUIPMENT DEDICATED STATS PREVIEW BOX */}
                    {isEquipment && eqItem && mainStat ? (
                      <div className="bg-[#FAF6ED] border border-[#D5C29E] rounded-xl p-2.5 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-[#78654E] font-serif">
                            Base Stats (Lv. 1)
                          </span>
                          <button
                            type="button"
                            onClick={() => setInspectingEquipment(eqItem)}
                            className="text-[10px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 underline cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect Stats</span>
                          </button>
                        </div>

                        {/* Main Stat Highlight */}
                        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-amber-300/80 shadow-2xs">
                          <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                            <span>{mainStat.name}</span>
                          </span>
                          <span className="text-xs font-black font-mono text-amber-900 bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200">
                            {mainStat.valueFormatted}
                          </span>
                        </div>

                        {/* Set Bonus description */}
                        {setBonus && (
                          <div className="text-[10px] text-stone-600 flex items-center gap-1 pt-0.5">
                            <span className="font-bold text-stone-800">{setBonus.piecesRequired}-pc Set:</span>
                            <span className="truncate">{setBonus.description}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#5C4A34] leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price & Buy Button */}
                  <div className="pt-3 mt-3 border-t border-[#E8DEC8]/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-black text-sm font-mono">
                      {isGold ? (
                        <>
                          <Coins className="w-4 h-4 text-amber-600" />
                          <span className="text-[#92400E]">{item.cost.amount.toLocaleString()} Gold</span>
                        </>
                      ) : (
                        <>
                          <Gem className="w-4 h-4 text-purple-600" />
                          <span className="text-purple-950">{item.cost.amount} Gems</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isEquipment && eqItem && !item.isSold && (
                        <button
                          type="button"
                          onClick={() => setInspectingEquipment(eqItem)}
                          className="p-1.5 rounded-xl border border-[#D5C29E] bg-[#FAF6ED] hover:bg-[#E8DEC8] text-[#78654E] hover:text-[#2E1F0F] cursor-pointer shadow-2xs"
                          title="Inspect equipment stats"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={item.isSold || !canAfford || isBuying}
                        onClick={() => initiateBuy(item)}
                        className={`px-4 py-1.5 rounded-xl font-black text-xs transition-all shadow-xs cursor-pointer ${
                          item.isSold
                            ? 'bg-stone-300 text-stone-600 cursor-not-allowed'
                            : !canAfford
                            ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                            : 'bg-[#2E1F0F] hover:bg-[#4A3525] text-[#FFFDF9]'
                        }`}
                      >
                        {item.isSold
                          ? 'Purchased'
                          : isBuying
                          ? 'Buying...'
                          : !canAfford
                          ? 'Need Funds'
                          : isEquipment
                          ? 'Review & Buy'
                          : 'Buy Item'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            EQUIPMENT PURCHASE CONFIRMATION MODAL (WITH FULL STATS)
            ═══════════════════════════════════════════════════════════════ */}
        {confirmingBuyItem && confirmingBuyItem.reward.equipmentItem && (() => {
          const eq = confirmingBuyItem.reward.equipmentItem!;
          const slot = eq.slot;
          const SlotIcon = getSlotIcon(slot);
          const setBonus = EQUIPMENT_SET_BONUSES[eq.set];
          const setColors = getSetColorClasses(eq.set);
          const mainStat = formatStat(eq.mainStat.stat, eq.mainStat.value, eq.mainStat.isPercent);
          const canAfford = profile.currencies.gold >= confirmingBuyItem.cost.amount;

          return (
            <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="max-w-md w-full fantasy-scroll-card p-5 shadow-2xl border-2 border-[#D97706] space-y-4 animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Title */}
                <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                      <SlotIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif font-black text-sm text-[#2E1F0F]">
                        Confirm Equipment Purchase
                      </h4>
                      <p className="text-[10px] text-[#78654E]">Review equipment stats before purchasing</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setConfirmingBuyItem(null)}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Equipment Card Showcase */}
                <div className="bg-[#FAF6ED] border-2 border-[#D5C29E] rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-black font-serif text-[#2E1F0F]">
                        {eq.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-stone-200 text-stone-800 border border-stone-300">
                          {slot} • COMMON GRADE
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                          LV. 1 / 15
                        </span>
                      </div>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#D5C29E] flex items-center justify-center shadow-2xs">
                      <SlotIcon className="w-6 h-6 text-amber-800" />
                    </div>
                  </div>

                  {/* Main Stat Big Feature */}
                  <div className="bg-white border-2 border-amber-400 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        Primary Stat
                      </div>
                      <div className="text-sm font-black text-[#2E1F0F] flex items-center gap-1.5 mt-0.5">
                        <Sparkles className="w-4 h-4 text-amber-600 fill-amber-400" />
                        <span>{mainStat.name}</span>
                      </div>
                    </div>
                    <div className="text-base font-black font-mono text-amber-950 bg-amber-100 px-3 py-1 rounded-lg border border-amber-300">
                      {mainStat.valueFormatted}
                    </div>
                  </div>

                  {/* Set Bonus Card */}
                  {setBonus && (
                    <div className={`p-2.5 rounded-xl border ${setColors.bg} ${setColors.border} space-y-1`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black uppercase ${setColors.text}`}>
                          {setBonus.name} ({setBonus.piecesRequired} Pieces)
                        </span>
                        <span className="text-[9px] font-bold text-stone-500">SET EFFECT</span>
                      </div>
                      <p className="text-[11px] text-stone-700 leading-snug">
                        {setBonus.description}
                      </p>
                    </div>
                  )}

                  <div className="text-[10px] text-[#78654E] italic bg-white/60 p-2 rounded-lg border border-[#E8DEC8]">
                    💡 Common gear starts at Level 1 and can be upgraded at the Blacksmith up to +15 to multiply its primary stat!
                  </div>
                </div>

                {/* Price and Balance Strip */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-stone-600">Merchant Price:</span>
                  <div className="flex items-center gap-1 font-mono font-black text-amber-900 text-sm">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>{confirmingBuyItem.cost.amount.toLocaleString()} Gold</span>
                  </div>
                </div>

                {/* Confirm & Cancel Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#E8DEC8]">
                  <button
                    type="button"
                    onClick={() => setConfirmingBuyItem(null)}
                    className="flex-1 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={!canAfford || buyingId === confirmingBuyItem.id}
                    onClick={() => executeBuy(confirmingBuyItem)}
                    className={`flex-1 py-2 rounded-xl font-black text-xs text-white transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                      !canAfford
                        ? 'bg-stone-400 cursor-not-allowed'
                        : 'bg-amber-700 hover:bg-amber-800'
                    }`}
                  >
                    {buyingId === confirmingBuyItem.id ? (
                      <span>Purchasing...</span>
                    ) : !canAfford ? (
                      <span>Insufficient Gold</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm Purchase</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════════════════════
            INSPECT EQUIPMENT STATS POPUP
            ═══════════════════════════════════════════════════════════════ */}
        {inspectingEquipment && (() => {
          const eq = inspectingEquipment;
          const slot = eq.slot;
          const SlotIcon = getSlotIcon(slot);
          const setBonus = EQUIPMENT_SET_BONUSES[eq.set];
          const setColors = getSetColorClasses(eq.set);
          const mainStat = formatStat(eq.mainStat.stat, eq.mainStat.value, eq.mainStat.isPercent);

          return (
            <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="max-w-sm w-full fantasy-scroll-card p-5 shadow-2xl border border-[#D5C29E] space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-2">
                  <div className="flex items-center gap-2">
                    <SlotIcon className="w-4 h-4 text-amber-700" />
                    <span className="font-serif font-black text-sm text-[#2E1F0F]">
                      Equipment Specifications
                    </span>
                  </div>
                  <button
                    onClick={() => setInspectingEquipment(null)}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black font-serif text-[#2E1F0F]">{eq.name}</h4>
                      <p className="text-[10px] text-[#78654E] uppercase">{slot} • Common Quality</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                      Lv. {eq.level} / 15
                    </span>
                  </div>

                  <div className="bg-[#FAF6ED] p-3 rounded-xl border border-amber-300/80 space-y-1">
                    <div className="text-[9px] uppercase font-bold text-amber-700">Primary Attribute</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800">{mainStat.name}</span>
                      <span className="text-sm font-black font-mono text-amber-900">{mainStat.valueFormatted}</span>
                    </div>
                  </div>

                  {setBonus && (
                    <div className={`p-2.5 rounded-xl border ${setColors.bg} ${setColors.border} space-y-1`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black uppercase ${setColors.text}`}>
                          {setBonus.name} ({setBonus.piecesRequired} Pcs)
                        </span>
                        <span className="text-[9px] font-bold text-stone-500">SET EFFECT</span>
                      </div>
                      <p className="text-[11px] text-stone-700 leading-snug">
                        {setBonus.description}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setInspectingEquipment(null)}
                  className="w-full py-2 rounded-xl bg-[#2E1F0F] hover:bg-[#4A3525] text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════════════════════
            ACQUIRED EQUIPMENT CELEBRATION MODAL
            ═══════════════════════════════════════════════════════════════ */}
        {acquiredEquipmentNotice && (() => {
          const eq = acquiredEquipmentNotice;
          const slot = eq.slot;
          const SlotIcon = getSlotIcon(slot);
          const setBonus = EQUIPMENT_SET_BONUSES[eq.set];
          const mainStat = formatStat(eq.mainStat.stat, eq.mainStat.value, eq.mainStat.isPercent);

          return (
            <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="max-w-sm w-full fantasy-scroll-card p-5 shadow-2xl border-2 border-emerald-500 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 mx-auto shadow-xs">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-serif font-black text-base text-[#064E3B]">
                    Equipment Acquired!
                  </h4>
                  <p className="text-[11px] text-[#047857]">
                    Safely delivered to your Adventurer Inventory.
                  </p>
                </div>

                <div className="bg-[#ECFDF5] border border-emerald-300 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white border border-emerald-200 flex items-center justify-center">
                        <SlotIcon className="w-4 h-4 text-emerald-800" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-emerald-950">{eq.name}</div>
                        <div className="text-[9px] text-emerald-700 uppercase font-bold">{slot} • Common</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-900">
                      Lv. 1
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700">{mainStat.name}</span>
                    <span className="text-xs font-black font-mono text-emerald-800">{mainStat.valueFormatted}</span>
                  </div>

                  {setBonus && (
                    <div className="text-[10px] text-emerald-800">
                      <span className="font-bold">{setBonus.name}:</span> {setBonus.description}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAcquiredEquipmentNotice(null)}
                    className="flex-1 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    Done
                  </button>

                  {onNavigateToMonsters && (
                    <button
                      type="button"
                      onClick={() => {
                        setAcquiredEquipmentNotice(null);
                        onClose();
                        onNavigateToMonsters();
                      }}
                      className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Equip in Party</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
