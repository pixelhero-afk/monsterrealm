/**
 * Admin Event Gifter & Reward Dispatcher Tab
 * Allows Dean to gift currencies, scrolls, awakening stones, and monsters
 * to all players, specific summoners, or the dev account for events & liveops.
 */

import React, { useState, useEffect } from 'react';
import {
  Gift,
  Coins,
  Gem,
  Zap,
  Scroll,
  Sparkles,
  Users,
  User,
  Send,
  Mail,
  History,
  CheckCircle2,
  AlertCircle,
  Flame,
  Droplet,
  Leaf,
  Sun,
  Moon,
  Search,
  Plus,
  Trash2,
} from 'lucide-react';
import { EventGiftPayload, MonsterVariant, PlayerProfile } from '../../types';
import { MONSTER_VARIANTS } from '../../data/monsters';
import { ELEMENT_VISUALS } from '../../data/elements';
import { MonsterAvatar } from '../MonsterAvatar';
import {
  getAdminPlayersApi,
  sendAdminGiftApi,
  getAdminGiftLogsApi,
} from '../../services/apiClient';

interface EventGifterTabProps {
  currentUserProfile?: PlayerProfile | null;
  onGiftsDispatched?: () => void;
}

interface PlayerSummary {
  playerId: string;
  username: string;
  accountLevel: number;
  avatarVariantId: string;
  monstersCount: number;
  currencies: any;
}

interface GiftLogEntry {
  id: string;
  timestamp: number;
  sender: string;
  target: string;
  recipientsCount: number;
  recipientNames?: string[];
  deliveryMethod: string;
  title: string;
  rewards: any;
}

export const EventGifterTab: React.FC<EventGifterTabProps> = ({
  currentUserProfile,
  onGiftsDispatched,
}) => {
  const [playersList, setPlayersList] = useState<PlayerSummary[]>([]);
  const [giftLogs, setGiftLogs] = useState<GiftLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Target & Delivery
  const [target, setTarget] = useState<'ALL' | 'SPECIFIC' | 'SELF'>('ALL');
  const [targetPlayerId, setTargetPlayerId] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<'MAILBOX' | 'DIRECT' | 'BOTH'>('MAILBOX');

  // Mail details
  const [mailTitle, setMailTitle] = useState<string>('🌟 Realm Festival Care Package');
  const [senderName, setSenderName] = useState<string>('Dean (Game Master)');
  const [mailMessage, setMailMessage] = useState<string>(
    'Greetings, Summoner! In celebration of the ongoing realm festival, the High Council grants you these special rewards. May your summons be blessed!'
  );

  // Rewards Configuration
  const [gold, setGold] = useState<number>(500000);
  const [gems, setGems] = useState<number>(1000);
  const [energy, setEnergy] = useState<number>(120);
  const [summonPoints, setSummonPoints] = useState<number>(100);

  // Mystical Scrolls
  const [scrollNormal, setScrollNormal] = useState<number>(10);
  const [scrollEpic, setScrollEpic] = useState<number>(5);
  const [scrollLegendary, setScrollLegendary] = useState<number>(2);
  const [scrollLightDark, setScrollLightDark] = useState<number>(2);

  // Elemental Awakening Stones (Small, Med, Huge)
  const [stones, setStones] = useState<Record<string, { small: number; medium: number; huge: number }>>({
    FIRE: { small: 0, medium: 0, huge: 0 },
    WATER: { small: 0, medium: 0, huge: 0 },
    GRASS: { small: 0, medium: 0, huge: 0 },
    LIGHT: { small: 0, medium: 0, huge: 0 },
    DARK: { small: 0, medium: 0, huge: 0 },
    MAGIC: { small: 0, medium: 0, huge: 0 },
  });

  // Monster Gift (Optional)
  const [giftMonsterEnabled, setGiftMonsterEnabled] = useState<boolean>(false);
  const [monsterVariantId, setMonsterVariantId] = useState<string>('var_magestudent_light');
  const [monsterStars, setMonsterStars] = useState<number>(4);
  const [monsterLevel, setMonsterLevel] = useState<number>(15);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [playersRes, logsRes] = await Promise.all([
        getAdminPlayersApi().catch(() => ({ success: false, players: [] })),
        getAdminGiftLogsApi().catch(() => ({ success: false, logs: [] })),
      ]);
      if (playersRes?.players) {
        setPlayersList(playersRes.players);
        if (playersRes.players.length > 0 && !targetPlayerId) {
          setTargetPlayerId(playersRes.players[0].playerId);
        }
      }
      if (logsRes?.logs) {
        setGiftLogs(logsRes.logs);
      }
    } catch (err: any) {
      console.warn('Could not fetch initial admin player/gift data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Quick Presets
  const applyPreset = (presetName: string) => {
    if (presetName === 'LAUNCH_BUNDLE') {
      setMailTitle('🎉 Grand Realm Launch Celebration');
      setSenderName('Dean (Game Master)');
      setMailMessage('Welcome to Monster Realms! Enjoy this grand festival care package packed with Gems, Gold, and Sovereign Scrolls.');
      setGems(5000);
      setGold(1000000);
      setEnergy(200);
      setSummonPoints(300);
      setScrollNormal(20);
      setScrollEpic(10);
      setScrollLegendary(5);
      setScrollLightDark(10);
      fillAllStones(25);
    } else if (presetName === 'MAINTENANCE_APOLOGY') {
      setMailTitle('🔧 Maintenance Compensation Package');
      setSenderName('Server Operations');
      setMailMessage('Thank you for your patience during server maintenance! Please accept these provisions as apology for the downtime.');
      setGems(1000);
      setGold(250000);
      setEnergy(150);
      setSummonPoints(100);
      setScrollNormal(5);
      setScrollEpic(5);
      setScrollLegendary(1);
      setScrollLightDark(1);
    } else if (presetName === 'AWAKENING_CACHE') {
      setMailTitle('✨ Astral Awakening Master Cache');
      setSenderName('Astral Arcanum');
      setMailMessage('The leylines have overflowed with awakening ether! Take these huge stones to awaken your strongest champions.');
      setGems(1500);
      setGold(500000);
      setEnergy(100);
      setScrollNormal(0);
      setScrollEpic(3);
      setScrollLegendary(1);
      setScrollLightDark(1);
      fillAllStones(50);
    } else if (presetName === 'WHALE_VAULT') {
      setMailTitle('👑 High Roller Sovereign Vault');
      setSenderName('The Sovereign Court');
      setMailMessage('A kingly tribute of astronomical proportions for the greatest summoners of the realm.');
      setGems(10000);
      setGold(5000000);
      setEnergy(500);
      setSummonPoints(1000);
      setScrollNormal(50);
      setScrollEpic(25);
      setScrollLegendary(15);
      setScrollLightDark(15);
      fillAllStones(100);
    }
  };

  const fillAllStones = (amount: number) => {
    setStones({
      FIRE: { small: amount * 2, medium: amount, huge: amount },
      WATER: { small: amount * 2, medium: amount, huge: amount },
      GRASS: { small: amount * 2, medium: amount, huge: amount },
      LIGHT: { small: amount * 2, medium: amount, huge: amount },
      DARK: { small: amount * 2, medium: amount, huge: amount },
      MAGIC: { small: amount * 2, medium: amount, huge: amount },
    });
  };

  const resetAllRewards = () => {
    setGold(0);
    setGems(0);
    setEnergy(0);
    setSummonPoints(0);
    setScrollNormal(0);
    setScrollEpic(0);
    setScrollLegendary(0);
    setScrollLightDark(0);
    setStones({
      FIRE: { small: 0, medium: 0, huge: 0 },
      WATER: { small: 0, medium: 0, huge: 0 },
      GRASS: { small: 0, medium: 0, huge: 0 },
      LIGHT: { small: 0, medium: 0, huge: 0 },
      DARK: { small: 0, medium: 0, huge: 0 },
      MAGIC: { small: 0, medium: 0, huge: 0 },
    });
    setGiftMonsterEnabled(false);
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDispatching(true);
      setFeedback(null);

      // Clean up stones to only non-zero
      const cleanStones: Record<string, any> = {};
      Object.entries(stones).forEach(([el, rawAmounts]) => {
        const amounts = rawAmounts as { small: number; medium: number; huge: number };
        if (amounts.small > 0 || amounts.medium > 0 || amounts.huge > 0) {
          cleanStones[el] = {
            ...(amounts.small > 0 ? { small: amounts.small } : {}),
            ...(amounts.medium > 0 ? { medium: amounts.medium } : {}),
            ...(amounts.huge > 0 ? { huge: amounts.huge } : {}),
          };
        }
      });

      const cleanScrolls: any = {};
      if (scrollNormal > 0) cleanScrolls.normal = scrollNormal;
      if (scrollEpic > 0) cleanScrolls.epic = scrollEpic;
      if (scrollLegendary > 0) cleanScrolls.legendary = scrollLegendary;
      if (scrollLightDark > 0) cleanScrolls.lightDark = scrollLightDark;

      const payload: EventGiftPayload = {
        target,
        targetPlayerId: target === 'SPECIFIC' ? targetPlayerId : undefined,
        deliveryMethod,
        title: mailTitle.trim(),
        message: mailMessage.trim(),
        senderName: senderName.trim(),
        rewards: {
          ...(gold > 0 ? { gold } : {}),
          ...(gems > 0 ? { gems } : {}),
          ...(energy > 0 ? { energy } : {}),
          ...(summonPoints > 0 ? { summonPoints } : {}),
          ...(Object.keys(cleanScrolls).length > 0 ? { scrolls: cleanScrolls } : {}),
          ...(Object.keys(cleanStones).length > 0 ? { stones: cleanStones } : {}),
          ...(giftMonsterEnabled
            ? {
                monsters: [
                  {
                    variantId: monsterVariantId,
                    stars: monsterStars,
                    level: monsterLevel,
                  },
                ],
              }
            : {}),
        },
      };

      const res = await sendAdminGiftApi(payload);
      setFeedback({
        type: 'success',
        message: `✓ Successfully dispatched event gifts to ${res.recipientsCount} recipient account(s)!`,
      });

      // Refresh logs
      const updatedLogs = await getAdminGiftLogsApi().catch(() => null);
      if (updatedLogs?.logs) setGiftLogs(updatedLogs.logs);

      onGiftsDispatched?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to dispatch gifts' });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF3E3] p-3 rounded-2xl border border-[#D5C29E]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 border border-amber-700 flex items-center justify-center text-white shadow-2xs">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-[#2E1F0F] text-sm">Admin Event Gift & Resource Dispatcher</h3>
            <p className="text-[11px] text-[#7A6348]">
              Gift gems, gold, sovereign scrolls, awakening stones, or monsters to all summoners for realm events.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black text-[#7A6348] uppercase tracking-wider">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('LAUNCH_BUNDLE')}
            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 rounded-lg text-[10px] font-bold cursor-pointer"
          >
            🎉 Grand Launch
          </button>
          <button
            type="button"
            onClick={() => applyPreset('MAINTENANCE_APOLOGY')}
            className="px-2 py-1 bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-900 rounded-lg text-[10px] font-bold cursor-pointer"
          >
            🔧 Maintenance
          </button>
          <button
            type="button"
            onClick={() => applyPreset('AWAKENING_CACHE')}
            className="px-2 py-1 bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-900 rounded-lg text-[10px] font-bold cursor-pointer"
          >
            ✨ Awakening
          </button>
          <button
            type="button"
            onClick={() => applyPreset('WHALE_VAULT')}
            className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 rounded-lg text-[10px] font-bold cursor-pointer"
          >
            👑 High Roller
          </button>
          <button
            type="button"
            onClick={resetAllRewards}
            className="px-2 py-1 bg-white hover:bg-stone-100 border border-stone-300 text-stone-600 rounded-lg text-[10px] font-bold cursor-pointer"
          >
            Clear
          </button>
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

      {/* Main Split: Dispatcher Form (Left/Center) + History Logs (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column: Form */}
        <div className="md:col-span-8 space-y-4 max-h-[620px] overflow-y-auto pr-1">
          <form onSubmit={handleDispatch} className="bg-white border border-[#EADBBE] rounded-2xl p-4 shadow-sm space-y-4">
            {/* Target & Delivery Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#FAF6ED]/70 border border-[#D5C29E]">
              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">
                  Recipient Audience
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setTarget('ALL')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      target === 'ALL'
                        ? 'bg-[#2E1F0F] text-white shadow-xs'
                        : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>All ({playersList.length || 'All'})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTarget('SELF')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      target === 'SELF'
                        ? 'bg-[#2E1F0F] text-white shadow-xs'
                        : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTarget('SPECIFIC')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      target === 'SPECIFIC'
                        ? 'bg-[#2E1F0F] text-white shadow-xs'
                        : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Specific</span>
                  </button>
                </div>

                {target === 'SPECIFIC' && (
                  <div className="mt-2">
                    <select
                      value={targetPlayerId}
                      onChange={(e) => setTargetPlayerId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#D5C29E] rounded-lg text-xs font-bold text-[#2E1F0F]"
                    >
                      {playersList.map((p) => (
                        <option key={p.playerId} value={p.playerId}>
                          {p.username} (Lvl {p.accountLevel}) — ID: {p.playerId}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C4A34] mb-1">
                  Delivery Method
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('MAILBOX')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      deliveryMethod === 'MAILBOX'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Mailbox</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('DIRECT')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      deliveryMethod === 'DIRECT'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Direct</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('BOTH')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      deliveryMethod === 'BOTH'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Both</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mail Information */}
            <div className="space-y-2 p-3 rounded-xl bg-amber-50/50 border border-amber-200">
              <span className="text-[11px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>Event Mail Announcement</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 mb-0.5">Mail Title / Subject</label>
                  <input
                    type="text"
                    value={mailTitle}
                    onChange={(e) => setMailTitle(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 mb-0.5">Sender Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-600 mb-0.5">Message Body</label>
                <textarea
                  value={mailMessage}
                  onChange={(e) => setMailMessage(e.target.value)}
                  rows={2}
                  className="w-full px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs"
                  required
                />
              </div>
            </div>

            {/* Currencies Matrix */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase text-[#5C4A34] tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>Realm Currencies</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2 rounded-xl bg-[#FAF6ED] border border-[#D5C29E]">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#5C4A34]">
                    <span className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-600" /> Gold
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={gold}
                    onChange={(e) => setGold(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs font-bold mt-1"
                  />
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => setGold((g) => g + 100000)}
                      className="text-[9px] px-1.5 py-0.5 bg-white border rounded hover:bg-stone-100 cursor-pointer"
                    >
                      +100k
                    </button>
                    <button
                      type="button"
                      onClick={() => setGold((g) => g + 500000)}
                      className="text-[9px] px-1.5 py-0.5 bg-white border rounded hover:bg-stone-100 cursor-pointer"
                    >
                      +500k
                    </button>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-[#FAF6ED] border border-[#D5C29E]">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#5C4A34]">
                    <span className="flex items-center gap-1">
                      <Gem className="w-3.5 h-3.5 text-sky-600" /> Gems
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={gems}
                    onChange={(e) => setGems(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs font-bold mt-1 text-sky-800"
                  />
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => setGems((g) => g + 500)}
                      className="text-[9px] px-1.5 py-0.5 bg-white border rounded hover:bg-stone-100 cursor-pointer"
                    >
                      +500
                    </button>
                    <button
                      type="button"
                      onClick={() => setGems((g) => g + 1000)}
                      className="text-[9px] px-1.5 py-0.5 bg-white border rounded hover:bg-stone-100 cursor-pointer"
                    >
                      +1k
                    </button>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-[#FAF6ED] border border-[#D5C29E]">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#5C4A34]">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" /> Energy
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={energy}
                    onChange={(e) => setEnergy(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs font-bold mt-1"
                  />
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => setEnergy((e) => e + 50)}
                      className="text-[9px] px-1.5 py-0.5 bg-white border rounded hover:bg-stone-100 cursor-pointer"
                    >
                      +50
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnergy((e) => e + 120)}
                      className="text-[9px] px-1.5 py-0.5 bg-white border rounded hover:bg-stone-100 cursor-pointer"
                    >
                      +120
                    </button>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-[#FAF6ED] border border-[#D5C29E]">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#5C4A34]">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Points
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={summonPoints}
                    onChange={(e) => setSummonPoints(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs font-bold mt-1"
                  />
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => setSummonPoints((p) => p + 100)}
                      className="text-[9px] px-1.5 py-0.5 bg-white border rounded hover:bg-stone-100 cursor-pointer"
                    >
                      +100
                    </button>
                    <button
                      type="button"
                      onClick={() => setSummonPoints((p) => p + 300)}
                      className="text-[9px] px-1.5 py-0.5 bg-white border rounded hover:bg-stone-100 cursor-pointer"
                    >
                      +300
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mystical Summon Scrolls */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase text-[#5C4A34] tracking-wider flex items-center gap-1.5">
                <Scroll className="w-3.5 h-3.5 text-purple-600" />
                <span>Mystical Summon Scrolls</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300">
                  <div className="text-[10px] font-black text-emerald-900 truncate">Normal Scroll (1-3★)</div>
                  <input
                    type="number"
                    min="0"
                    value={scrollNormal}
                    onChange={(e) => setScrollNormal(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-bold mt-1 text-center"
                  />
                  <div className="flex justify-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => setScrollNormal((s) => s + 5)}
                      className="text-[9px] px-1.5 py-0.5 bg-white border rounded cursor-pointer"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => setScrollNormal((s) => s + 20)}
                      className="text-[9px] px-1.5 py-0.5 bg-white border rounded cursor-pointer"
                    >
                      +20
                    </button>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-purple-50 border border-purple-300">
                  <div className="text-[10px] font-black text-purple-900 truncate">Epic Scroll (1-5★)</div>
                  <input
                    type="number"
                    min="0"
                    value={scrollEpic}
                    onChange={(e) => setScrollEpic(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs font-bold mt-1 text-center"
                  />
                  <div className="flex justify-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => setScrollEpic((s) => s + 3)}
                      className="text-[9px] px-1.5 py-0.5 bg-white border rounded cursor-pointer"
                    >
                      +3
                    </button>
                    <button
                      type="button"
                      onClick={() => setScrollEpic((s) => s + 10)}
                      className="text-[9px] px-1.5 py-0.5 bg-white border rounded cursor-pointer"
                    >
                      +10
                    </button>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-amber-50 border border-amber-300">
                  <div className="text-[10px] font-black text-amber-900 truncate">Legendary (Guar. 5★)</div>
                  <input
                    type="number"
                    min="0"
                    value={scrollLegendary}
                    onChange={(e) => setScrollLegendary(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-amber-400 rounded-lg text-xs font-black mt-1 text-center text-amber-900"
                  />
                  <div className="flex justify-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => setScrollLegendary((s) => s + 1)}
                      className="text-[9px] px-1.5 py-0.5 bg-white border rounded cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => setScrollLegendary((s) => s + 5)}
                      className="text-[9px] px-1.5 py-0.5 bg-white border rounded cursor-pointer"
                    >
                      +5
                    </button>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-300">
                  <div className="text-[10px] font-black text-indigo-900 truncate">Light &amp; Dark (1-5★)</div>
                  <input
                    type="number"
                    min="0"
                    value={scrollLightDark}
                    onChange={(e) => setScrollLightDark(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-indigo-300 rounded-lg text-xs font-bold mt-1 text-center text-indigo-900"
                  />
                  <div className="flex justify-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => setScrollLightDark((s) => s + 1)}
                      className="text-[9px] px-1.5 py-0.5 bg-white border rounded cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => setScrollLightDark((s) => s + 5)}
                      className="text-[9px] px-1.5 py-0.5 bg-white border rounded cursor-pointer"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Elemental Awakening Stones */}
            <div className="space-y-2 p-3 rounded-xl bg-[#FAF6ED]/70 border border-[#D5C29E]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-[#5C4A34] tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Elemental Awakening Stones</span>
                </span>
                <button
                  type="button"
                  onClick={() => fillAllStones(50)}
                  className="px-2 py-0.5 bg-white border border-[#D5C29E] hover:bg-stone-100 rounded text-[10px] font-bold text-[#5C4A34] cursor-pointer"
                >
                  +50 Huge of All 6 Elements
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {(['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK', 'MAGIC'] as const).map((el) => {
                  const val = stones[el] || { small: 0, medium: 0, huge: 0 };
                  return (
                    <div key={el} className="p-2 rounded-lg bg-white border border-stone-200 text-center">
                      <div className="text-[10px] font-black text-stone-800">{el}</div>
                      <div className="space-y-1 mt-1">
                        <div>
                          <span className="text-[8px] text-stone-500 block">Huge</span>
                          <input
                            type="number"
                            min="0"
                            value={val.huge}
                            onChange={(e) =>
                              setStones((prev) => ({
                                ...prev,
                                [el]: { ...prev[el], huge: Number(e.target.value) },
                              }))
                            }
                            className="w-full text-center text-xs font-bold border rounded py-0.5"
                          />
                        </div>
                        <div>
                          <span className="text-[8px] text-stone-500 block">Med</span>
                          <input
                            type="number"
                            min="0"
                            value={val.medium}
                            onChange={(e) =>
                              setStones((prev) => ({
                                ...prev,
                                [el]: { ...prev[el], medium: Number(e.target.value) },
                              }))
                            }
                            className="w-full text-center text-[10px] border rounded py-0.5"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional Monster Grant */}
            <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={giftMonsterEnabled}
                    onChange={(e) => setGiftMonsterEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs font-black text-purple-950">
                    Include Specific Monster Unit in Gift Package
                  </span>
                </label>
              </div>

              {giftMonsterEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 mb-0.5">Select Champion</label>
                    <select
                      value={monsterVariantId}
                      onChange={(e) => setMonsterVariantId(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs font-bold"
                    >
                      {Object.values(MONSTER_VARIANTS)
                        .filter((v) => v.familyId !== 'fam_boss')
                        .map((v) => (
                          <option key={v.variantId} value={v.variantId}>
                            {v.name} ({v.stars}★ {v.element})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 mb-0.5">Star Rating</label>
                    <select
                      value={monsterStars}
                      onChange={(e) => setMonsterStars(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs font-bold"
                    >
                      <option value="1">1 Star ★</option>
                      <option value="2">2 Stars ★★</option>
                      <option value="3">3 Stars ★★★</option>
                      <option value="4">4 Stars ★★★★</option>
                      <option value="5">5 Stars ★★★★★</option>
                      <option value="6">6 Stars ★★★★★★</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 mb-0.5">Starting Level</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={monsterLevel}
                      onChange={(e) => setMonsterLevel(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-2 border-t border-[#EADBBE]">
              <span className="text-[11px] text-[#7A6348] font-bold">
                Target: {target === 'ALL' ? 'All Registered Players' : target === 'SELF' ? 'Your Dev Account' : targetPlayerId}
              </span>

              <button
                type="submit"
                disabled={dispatching}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{dispatching ? 'Dispatching...' : 'Dispatch Event Gifts'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Dispatch History Logs */}
        <div className="md:col-span-4 space-y-2 max-h-[620px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black uppercase text-[#7A6348] tracking-wider flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              <span>Dispatch Logs ({giftLogs.length})</span>
            </span>
          </div>

          {giftLogs.length === 0 ? (
            <div className="p-4 rounded-xl bg-white border border-[#EADBBE] text-center text-xs text-stone-500">
              No event gifts have been dispatched yet. Use the form to send realm-wide provisions!
            </div>
          ) : (
            giftLogs.map((log) => {
              const dateStr = new Date(log.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-white border border-[#EADBBE] shadow-2xs space-y-1.5 text-left"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {log.target} ({log.recipientsCount} summoners)
                    </span>
                    <span className="text-stone-400">{dateStr}</span>
                  </div>

                  <h5 className="text-xs font-bold text-stone-900 leading-tight">
                    {log.title}
                  </h5>

                  {/* Summary of rewards in log */}
                  <div className="flex flex-wrap gap-1 text-[9px] text-stone-600 pt-1 border-t border-stone-100">
                    {log.rewards?.gems && (
                      <span className="px-1 bg-sky-50 text-sky-800 rounded font-mono font-bold">
                        💎 +{log.rewards.gems}
                      </span>
                    )}
                    {log.rewards?.gold && (
                      <span className="px-1 bg-amber-50 text-amber-800 rounded font-mono font-bold">
                        🪙 +{log.rewards.gold.toLocaleString()}
                      </span>
                    )}
                    {log.rewards?.energy && (
                      <span className="px-1 bg-yellow-50 text-yellow-800 rounded font-mono font-bold">
                        ⚡ +{log.rewards.energy}
                      </span>
                    )}
                    {log.rewards?.scrolls?.legendary && (
                      <span className="px-1 bg-orange-50 text-orange-800 rounded font-mono font-bold">
                        📜 +{log.rewards.scrolls.legendary} Leg
                      </span>
                    )}
                    {log.rewards?.scrolls?.lightDark && (
                      <span className="px-1 bg-purple-50 text-purple-800 rounded font-mono font-bold">
                        📜 +{log.rewards.scrolls.lightDark} L/D
                      </span>
                    )}
                    {log.rewards?.monsters?.length && (
                      <span className="px-1 bg-rose-50 text-rose-800 rounded font-mono font-bold">
                        👾 {log.rewards.monsters.length} Unit
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
