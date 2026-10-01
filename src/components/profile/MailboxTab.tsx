/**
 * Monster Realms - Mailbox & Gifts Tab Component
 *
 * Players can receive gifts from friends or from the game here:
 * - Claim individual or all gifts (Gold, Gems, SP, Energy)
 * - Read lore-rich letters and friend notes
 * - Filter by All, Friends, Realm/Game, and Unclaimed
 * - Send gifts to fellow adventurers
 * - Request Realm High Council supply drops
 */

import React, { useState, useMemo } from 'react';
import {
  Mail,
  Gift,
  Coins,
  Gem,
  Flame,
  Sparkles,
  CheckCircle2,
  Trash2,
  Send,
  Crown,
  User,
  Clock,
  Inbox,
  AlertCircle,
  X,
  ExternalLink,
  Heart,
  ShieldCheck,
  RefreshCw,
  Scroll,
  Zap,
} from 'lucide-react';
import { MailItem, MailReward, PlayerProfile } from '../../types';
import { MONSTER_VARIANTS } from '../../data/monsters';
import { MonsterAvatar } from '../MonsterAvatar';
import {
  claimAllMail,
  claimMailItem,
  clearClaimedMail,
  deleteMailItem,
  markMailAsRead,
  addFriendGiftMail,
  addGameGiftMail,
  syncMailboxState,
} from '../../services/mailboxService';
import {
  claimMailApi,
  claimAllMailApi,
  deleteMailApi,
  clearClaimedMailApi,
  sendFriendGiftMailApi,
  sendGameGiftMailApi,
} from '../../services/apiClient';

interface MailboxTabProps {
  profile: PlayerProfile;
  onProfileUpdated: (updatedProfile: PlayerProfile) => void;
  currentUser?: any;
  onOpenFriends?: () => void;
}

type FilterCategory = 'ALL' | 'UNCLAIMED' | 'FRIEND' | 'GAME';

export const MailboxTab: React.FC<MailboxTabProps> = ({
  profile,
  onProfileUpdated,
  currentUser,
  onOpenFriends,
}) => {
  const [filter, setFilter] = useState<FilterCategory>('ALL');
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [isSendingGift, setIsSendingGift] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Send Gift Form state
  const [showSendModal, setShowSendModal] = useState<boolean>(false);
  const [friendNameInput, setFriendNameInput] = useState<string>('Elena Swiftwind');
  const [friendCodeInput, setFriendCodeInput] = useState<string>('MR-7789-ELENA');
  const [giftNoteInput, setGiftNoteInput] = useState<string>('Good luck in your campaign battles! Keep up the great work!');

  // Sync profile mailbox
  const mailbox = useMemo(() => {
    return profile.mailbox && profile.mailbox.length > 0
      ? profile.mailbox
      : syncMailboxState(profile).mailbox || [];
  }, [profile.mailbox]);

  const showToast = (type: 'success' | 'info' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered mail list
  const filteredMail = useMemo(() => {
    return mailbox.filter((item) => {
      if (filter === 'UNCLAIMED') return !item.isClaimed;
      if (filter === 'FRIEND') return item.senderType === 'FRIEND';
      if (filter === 'GAME') return item.senderType === 'GAME' || item.senderType === 'SYSTEM';
      return true;
    });
  }, [mailbox, filter]);

  // Aggregate stats
  const unclaimedItems = useMemo(() => mailbox.filter((m) => !m.isClaimed), [mailbox]);
  const unclaimedCount = unclaimedItems.length;

  const totalUnclaimedRewards = useMemo(() => {
    let gold = 0;
    let gems = 0;
    let sp = 0;
    let energy = 0;

    unclaimedItems.forEach((m) => {
      const r = m.reward || {};
      gold += r.gold || 0;
      gems += r.gems || 0;
      sp += r.summonPoints || 0;
      energy += r.energy || 0;
    });

    return { gold, gems, sp, energy };
  }, [unclaimedItems]);

  // Format relative timestamp
  const formatTime = (ts: number | string) => {
    const time = typeof ts === 'string' ? new Date(ts).getTime() : ts;
    if (isNaN(time)) return 'Recently';
    const diff = Math.max(0, Math.floor((Date.now() - time) / 1000));
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Handle single mail claim
  const handleClaimSingle = async (mailId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setIsClaiming(true);
      // Attempt backend API claim
      try {
        const res = await claimMailApi(mailId);
        onProfileUpdated(res.profile);
      } catch (apiErr) {
        // Fallback to local synchronous claim
        const result = claimMailItem(profile, mailId);
        onProfileUpdated(result.updatedProfile);
      }

      const item = mailbox.find((m) => m.id === mailId);
      const r = item?.reward;
      const rewardsText = [
        r?.gems ? `+${r.gems} Gems` : null,
        r?.gold ? `+${r.gold.toLocaleString()} Gold` : null,
        r?.energy ? `+${r.energy} Energy` : null,
        r?.summonPoints ? `+${r.summonPoints} SP` : null,
      ]
        .filter(Boolean)
        .join(', ');

      showToast('success', `Claimed gift from ${item?.senderName}! (${rewardsText})`);
      if (selectedMail && selectedMail.id === mailId) {
        setSelectedMail((prev) => (prev ? { ...prev, isClaimed: true, isRead: true } : null));
      }
    } catch (err: any) {
      showToast('error', err.message || 'Could not claim gift');
    } finally {
      setIsClaiming(false);
    }
  };

  // Handle claim all
  const handleClaimAll = async () => {
    if (unclaimedCount === 0) return;
    try {
      setIsClaiming(true);
      try {
        const res = await claimAllMailApi();
        onProfileUpdated(res.profile);
      } catch (apiErr) {
        const result = claimAllMail(profile);
        onProfileUpdated(result.updatedProfile);
      }

      showToast(
        'success',
        `Claimed all ${unclaimedCount} gifts! Treasury enriched with Gold, Gems, Energy & SP!`
      );
      if (selectedMail) {
        setSelectedMail((prev) => (prev ? { ...prev, isClaimed: true, isRead: true } : null));
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to claim all mail');
    } finally {
      setIsClaiming(false);
    }
  };

  // Handle delete single mail
  const handleDeleteMail = async (mailId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      try {
        const res = await deleteMailApi(mailId);
        onProfileUpdated(res.profile);
      } catch (apiErr) {
        const updated = deleteMailItem(profile, mailId);
        onProfileUpdated(updated);
      }
      if (selectedMail?.id === mailId) {
        setSelectedMail(null);
      }
      showToast('info', 'Mail deleted.');
    } catch (err: any) {
      showToast('error', err.message || 'Could not delete mail');
    }
  };

  // Handle clear all claimed
  const handleClearClaimed = async () => {
    const claimedCount = mailbox.filter((m) => m.isClaimed).length;
    if (claimedCount === 0) {
      showToast('info', 'No claimed mail to clear.');
      return;
    }
    try {
      try {
        const res = await clearClaimedMailApi();
        onProfileUpdated(res.profile);
      } catch (apiErr) {
        const updated = clearClaimedMail(profile);
        onProfileUpdated(updated);
      }
      showToast('info', `Removed ${claimedCount} already claimed letters.`);
    } catch (err: any) {
      showToast('error', err.message || 'Could not clear claimed mail');
    }
  };

  // Handle request game supplies (interactive realm drop)
  const handleRequestRealmDrop = async () => {
    try {
      setIsClaiming(true);
      const drops = [
        {
          title: 'High Council Daily Tribute',
          message: 'The High Council of Monster Realms grants these rations to active Wardens on patrol.',
          reward: { gems: 150, gold: 12000, energy: 35, summonPoints: 40 },
          sender: 'The High Council',
        },
        {
          title: 'Expeditionary Guild Bounty',
          message: 'Bounty rewards collected from wild monster incursions across the five elemental continents.',
          reward: { gems: 100, gold: 20000, energy: 50, summonPoints: 50 },
          sender: 'Adventurers Guild Master',
        },
        {
          title: 'Weekend Festival Gift Box',
          message: 'Celebrate the harmony of elemental sanctuaries! May your summons be blessed with Legendary beasts!',
          reward: { gems: 250, gold: 30000, summonPoints: 100, energy: 40 },
          sender: 'High Summoner Lyra',
        },
      ];

      const pick = drops[Math.floor(Math.random() * drops.length)];

      try {
        const res = await sendGameGiftMailApi(pick.title, pick.message, pick.reward, pick.sender);
        onProfileUpdated(res.profile);
      } catch (apiErr) {
        const result = addGameGiftMail(profile, pick.title, pick.message, pick.reward, pick.sender);
        onProfileUpdated(result.updatedProfile);
      }

      showToast('success', `New delivery arrived from ${pick.sender}! Check your mailbox.`);
    } catch (err: any) {
      showToast('error', err.message || 'Could not fetch realm supply drop');
    } finally {
      setIsClaiming(false);
    }
  };

  // Handle send gift to friend
  const handleSendFriendGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendNameInput.trim()) {
      showToast('error', 'Please enter a friend name.');
      return;
    }

    try {
      setIsSendingGift(true);
      const reward: MailReward = {
        gold: 2500,
        summonPoints: 25,
        energy: 15,
      };

      try {
        await sendFriendGiftMailApi(undefined, friendNameInput.trim(), giftNoteInput.trim(), reward);
      } catch (apiErr) {
        // Fallback local simulated incoming friend mail or outgoing acknowledgement
      }

      // Also create a reply simulated care-package in player's own mailbox from that friend for immediate fun!
      const added = addFriendGiftMail(
        profile,
        friendNameInput.trim(),
        friendCodeInput.trim() || 'MR-FRIEND-CODE',
        'var_nekohime_grass',
        `Thanks for connecting! Here is a reciprocated gift package back for you: "${giftNoteInput.trim()}"`,
        reward
      );
      onProfileUpdated(added.updatedProfile);

      setShowSendModal(false);
      showToast('success', `Gift package dispatched to ${friendNameInput.trim()}!`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to send gift');
    } finally {
      setIsSendingGift(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border shadow-xs animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <Inbox className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span className="flex-1">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="text-stone-400 hover:text-stone-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* CHAMBER HERO HEADER & CLAIM-ALL ACTION MATRIX */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FFFDF9] via-[#FAF4E6] to-[#F5EBD4] border-2 border-[#E3D3B4] shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-white shadow-md border-2 border-amber-300 shrink-0">
              <Mail className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-serif text-[#3D2817]">
                  Warden Realm Mailbox
                </h3>
                {unclaimedCount > 0 ? (
                  <span className="bg-gradient-to-r from-amber-500 to-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                    {unclaimedCount} Unclaimed
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    All Caught Up
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-[#7A6348]">
                Receive gifts, letters, stamina supplies, and summon tokens from friends and the game
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {unclaimedCount > 0 && (
              <button
                onClick={handleClaimAll}
                disabled={isClaiming}
                className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-md border border-yellow-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-transform active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-yellow-100" />
                <span>Claim All Gifts ({unclaimedCount})</span>
              </button>
            )}

            <button
              onClick={() => setShowSendModal(true)}
              className="px-3 py-2 bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              title="Send a gift package to a friend"
            >
              <Send className="w-3.5 h-3.5 text-amber-700" />
              <span>Send Friend Gift</span>
            </button>

            <button
              onClick={handleRequestRealmDrop}
              disabled={isClaiming}
              className="p-2 bg-white hover:bg-amber-50 border border-amber-300 text-amber-800 rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center cursor-pointer transition-colors"
              title="Request Realm High Council supplies drop"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isClaiming ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Pending Rewards Ticker Bar */}
        {unclaimedCount > 0 && (
          <div className="pt-2.5 border-t border-[#EADBBE] flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[11px] font-semibold text-[#7A6348]">
              Ready to Claim from {unclaimedCount} letters:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {totalUnclaimedRewards.gold > 0 && (
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-lg text-amber-900 font-bold text-[11px] font-mono shadow-2xs">
                  <Coins className="w-3 h-3 text-amber-600" />
                  <span>+{totalUnclaimedRewards.gold.toLocaleString()}</span>
                </div>
              )}
              {totalUnclaimedRewards.gems > 0 && (
                <div className="flex items-center gap-1 bg-purple-50 border border-purple-300 px-2 py-0.5 rounded-lg text-purple-900 font-bold text-[11px] font-mono shadow-2xs">
                  <Gem className="w-3 h-3 text-purple-600" />
                  <span>+{totalUnclaimedRewards.gems}</span>
                </div>
              )}
              {totalUnclaimedRewards.energy > 0 && (
                <div className="flex items-center gap-1 bg-teal-50 border border-teal-300 px-2 py-0.5 rounded-lg text-teal-900 font-bold text-[11px] font-mono shadow-2xs">
                  <Flame className="w-3 h-3 text-teal-600" />
                  <span>+{totalUnclaimedRewards.energy} Energy</span>
                </div>
              )}
              {totalUnclaimedRewards.sp > 0 && (
                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg text-emerald-900 font-bold text-[11px] font-mono shadow-2xs">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>+{totalUnclaimedRewards.sp} SP</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FILTER TABS & BULK CLEAR */}
      <div className="flex items-center justify-between border-b border-[#E3D3B4] pb-2 text-xs font-bold gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white hover:bg-amber-100 text-[#7A6348] border border-[#EADBBE]'
            }`}
          >
            All Mail ({mailbox.length})
          </button>

          <button
            onClick={() => setFilter('UNCLAIMED')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'UNCLAIMED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white hover:bg-amber-100 text-[#7A6348] border border-[#EADBBE]'
            }`}
          >
            <span>Unclaimed</span>
            {unclaimedCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {unclaimedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter('FRIEND')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              filter === 'FRIEND'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white hover:bg-amber-100 text-[#7A6348] border border-[#EADBBE]'
            }`}
          >
            <Heart className="w-3 h-3 text-rose-500" />
            <span>From Friends ({mailbox.filter((m) => m.senderType === 'FRIEND').length})</span>
          </button>

          <button
            onClick={() => setFilter('GAME')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              filter === 'GAME'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white hover:bg-amber-100 text-[#7A6348] border border-[#EADBBE]'
            }`}
          >
            <Crown className="w-3 h-3 text-amber-500" />
            <span>From Realm ({mailbox.filter((m) => m.senderType === 'GAME' || m.senderType === 'SYSTEM').length})</span>
          </button>
        </div>

        {mailbox.some((m) => m.isClaimed) && (
          <button
            onClick={handleClearClaimed}
            className="text-[11px] text-[#8C765C] hover:text-red-700 flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
            title="Remove letters that have already been claimed"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Clear Claimed</span>
          </button>
        )}
      </div>

      {/* MAIL ITEMS LIST */}
      {filteredMail.length === 0 ? (
        <div className="py-12 px-4 rounded-2xl bg-[#FAF7F0] border-2 border-dashed border-[#E3D3B4] flex flex-col items-center justify-center text-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-[#3D2817]">Your Mailbox is Empty</div>
          <p className="text-xs text-[#7A6348] max-w-sm">
            {filter === 'UNCLAIMED'
              ? 'You have claimed all pending gifts! Check back later or request a Realm supply drop.'
              : filter === 'FRIEND'
              ? 'No letters from friends yet. Add friends from the Social Hub to send and receive daily gifts!'
              : 'No mail matching this filter.'}
          </p>
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleRequestRealmDrop}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Get Realm Supplies</span>
            </button>
            {onOpenFriends && (
              <button
                onClick={onOpenFriends}
                className="px-3.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
              >
                Go to Friends
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredMail.map((mail) => {
            const isFriend = mail.senderType === 'FRIEND';
            const reward = mail.reward || {};
            const friendVariant = mail.senderAvatarVariantId
              ? MONSTER_VARIANTS[mail.senderAvatarVariantId]
              : null;

            return (
              <div
                key={mail.id}
                onClick={() => {
                  setSelectedMail(mail);
                  if (!mail.isRead) {
                    const updated = markMailAsRead(profile, mail.id);
                    onProfileUpdated(updated);
                  }
                }}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  !mail.isClaimed
                    ? 'bg-[#FFFDF9] hover:bg-[#FFFBEB] border-amber-300 shadow-xs hover:border-amber-400 hover:shadow-md'
                    : 'bg-[#F9F7F1]/80 hover:bg-[#FAF6EC] border-[#EADBBE] opacity-85'
                }`}
              >
                {/* Unclaimed side indicator strip */}
                {!mail.isClaimed && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-500 via-yellow-400 to-amber-600" />
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Left: Sender Icon & Content Preview */}
                  <div className="flex items-start gap-3 sm:gap-3.5 flex-1 min-w-0">
                    {/* Avatar / Crest */}
                    <div className="shrink-0 mt-0.5">
                      {isFriend ? (
                        <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-300 overflow-hidden shadow-xs flex items-center justify-center">
                          <MonsterAvatar
                            variantId={mail.senderAvatarVariantId}
                            element={friendVariant?.element}
                            variant={friendVariant}
                            size="sm"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-200 text-white flex items-center justify-center shadow-xs">
                          <Crown className="w-6 h-6 text-amber-100" />
                        </div>
                      )}
                    </div>

                    {/* Metadata & Message */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-black text-[#2E1F0F] font-serif">
                          {mail.senderName}
                        </span>

                        {isFriend ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                            <Heart className="w-2.5 h-2.5 text-emerald-600" />
                            Friend Gift
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                            <ShieldCheck className="w-2.5 h-2.5 text-amber-600" />
                            Realm Official
                          </span>
                        )}

                        <span className="text-[10px] text-[#8C765C] flex items-center gap-1 ml-auto sm:ml-0 font-mono">
                          <Clock className="w-3 h-3 text-[#A89070]" />
                          {formatTime(mail.sentAt)}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs sm:text-sm font-bold text-[#3D2817] truncate">
                        {mail.title}
                      </h4>

                      {/* Message Preview */}
                      <p className="text-[11px] text-[#7A6348] line-clamp-1 leading-snug">
                        {mail.message}
                      </p>

                      {/* Reward Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {reward.gold && reward.gold > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold font-mono">
                            <Coins className="w-3 h-3 text-amber-600" />
                            +{reward.gold.toLocaleString()}
                          </span>
                        )}
                        {reward.gems && reward.gems > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-900 text-[10px] font-bold font-mono">
                            <Gem className="w-3 h-3 text-purple-600" />
                            +{reward.gems} Gems
                          </span>
                        )}
                        {reward.energy && reward.energy > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-900 text-[10px] font-bold font-mono">
                            <Flame className="w-3 h-3 text-teal-600" />
                            +{reward.energy} Energy
                          </span>
                        )}
                        {reward.summonPoints && reward.summonPoints > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] font-bold font-mono">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            +{reward.summonPoints} SP
                          </span>
                        )}
                        {reward.scrolls && Object.values(reward.scrolls).some((v) => Number(v) > 0) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-bold font-mono">
                            <Scroll className="w-3 h-3 text-indigo-600" />
                            +{Object.values(reward.scrolls).reduce<number>((a, b) => a + (Number(b) || 0), 0)} Scrolls
                          </span>
                        )}
                        {reward.stones && Object.keys(reward.stones).length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-900 text-[10px] font-bold font-mono">
                            <Zap className="w-3 h-3 text-rose-600" />
                            Awakening Stones
                          </span>
                        )}
                        {reward.monsters && reward.monsters.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-950 text-[10px] font-black">
                            <Crown className="w-3 h-3 text-amber-700" />
                            +{reward.monsters.length} Monster{reward.monsters.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Claim CTA or Status */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EADBBE]">
                    {!mail.isClaimed ? (
                      <button
                        onClick={(e) => handleClaimSingle(mail.id, e)}
                        disabled={isClaiming}
                        className="w-full sm:w-auto px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-transform active:scale-95 border border-amber-300"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Claim</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Claimed</span>
                        </span>
                        <button
                          onClick={(e) => handleDeleteMail(mail.id, e)}
                          className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete this letter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LETTER DETAIL MODAL */}
      {selectedMail && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedMail(null)}
        >
          <div
            className="relative w-full max-w-lg bg-[#FDFBF7] border-2 border-[#D5C29E] rounded-3xl shadow-2xl overflow-hidden text-[#2E1F0F] flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ornate Top Strip */}
            <div className="h-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 shrink-0" />

            {/* Letter Header */}
            <div className="p-4 sm:p-5 border-b border-[#EBDDBF] bg-[#F7F2E7]/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs border border-amber-300">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black font-serif text-[#3D2817]">
                    {selectedMail.title}
                  </h3>
                  <div className="text-[11px] text-[#7A6348] flex items-center gap-1.5">
                    <span>From: <strong>{selectedMail.senderName}</strong></span>
                    <span>•</span>
                    <span>{formatTime(selectedMail.sentAt)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedMail(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#7A6348] hover:text-[#2E1F0F] hover:bg-[#EADBBE] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Letter Body (Parchment scroll aesthetic) */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6ED] to-[#F5EEDD]">
              {/* Wax seal & sender info */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E3D3B4]">
                <div className="flex items-center gap-2 text-xs text-[#7A6348]">
                  {selectedMail.senderType === 'FRIEND' ? (
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-emerald-600" />
                      Adventurer Friend Letter
                    </span>
                  ) : (
                    <span className="font-bold text-amber-900 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      Royal Realm Dispatch
                    </span>
                  )}
                  {selectedMail.senderFriendCode && (
                    <span className="font-mono text-[10px] text-[#8C765C]">
                      [{selectedMail.senderFriendCode}]
                    </span>
                  )}
                </div>

                {selectedMail.isClaimed ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Claimed
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full animate-pulse">
                    Gift Attached
                  </span>
                )}
              </div>

              {/* Full Lore / Message Text */}
              <div className="p-4 rounded-xl bg-white/80 border border-[#EADBBE] text-xs sm:text-sm text-[#3D2817] leading-relaxed font-serif shadow-inner whitespace-pre-wrap">
                {selectedMail.message}
              </div>

              {/* Attached Gifts Card */}
              <div className="p-4 rounded-xl bg-[#FFFBEB] border border-amber-300 space-y-2.5 shadow-2xs">
                <div className="text-xs font-black text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Gift className="w-4 h-4 text-amber-600" />
                  <span>Enclosed Care Package:</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedMail.reward?.gold ? (
                    <div className="p-2 rounded-lg bg-white border border-amber-200 text-center">
                      <Coins className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                      <div className="text-[10px] text-[#7A6348] font-bold">Gold</div>
                      <div className="text-xs font-black font-mono text-amber-900">
                        +{selectedMail.reward.gold.toLocaleString()}
                      </div>
                    </div>
                  ) : null}

                  {selectedMail.reward?.gems ? (
                    <div className="p-2 rounded-lg bg-white border border-purple-200 text-center">
                      <Gem className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                      <div className="text-[10px] text-[#7A6348] font-bold">Gems</div>
                      <div className="text-xs font-black font-mono text-purple-900">
                        +{selectedMail.reward.gems}
                      </div>
                    </div>
                  ) : null}

                  {selectedMail.reward?.energy ? (
                    <div className="p-2 rounded-lg bg-white border border-teal-200 text-center">
                      <Flame className="w-4 h-4 text-teal-600 mx-auto mb-1" />
                      <div className="text-[10px] text-[#7A6348] font-bold">Energy</div>
                      <div className="text-xs font-black font-mono text-teal-900">
                        +{selectedMail.reward.energy}
                      </div>
                    </div>
                  ) : null}

                  {selectedMail.reward?.summonPoints ? (
                    <div className="p-2 rounded-lg bg-white border border-emerald-200 text-center">
                      <Sparkles className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                      <div className="text-[10px] text-[#7A6348] font-bold">Summon SP</div>
                      <div className="text-xs font-black font-mono text-emerald-900">
                        +{selectedMail.reward.summonPoints}
                      </div>
                    </div>
                  ) : null}

                  {selectedMail.reward?.scrolls && Object.entries(selectedMail.reward.scrolls).map(([type, count]) => {
                    const numCount = Number(count) || 0;
                    if (numCount <= 0) return null;
                    return (
                      <div key={type} className="p-2 rounded-lg bg-white border border-indigo-200 text-center">
                        <Scroll className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                        <div className="text-[10px] text-[#7A6348] font-bold capitalize">{type} Scrolls</div>
                        <div className="text-xs font-black font-mono text-indigo-900">+{numCount}</div>
                      </div>
                    );
                  })}

                  {selectedMail.reward?.stones && Object.entries(selectedMail.reward.stones).map(([el, rawSt]) => {
                    const st = rawSt as { small?: number; medium?: number; huge?: number } | undefined;
                    const totalStones = (st?.small || 0) + (st?.medium || 0) + (st?.huge || 0);
                    if (totalStones <= 0) return null;
                    return (
                      <div key={el} className="p-2 rounded-lg bg-white border border-rose-200 text-center">
                        <Zap className="w-4 h-4 text-rose-600 mx-auto mb-1" />
                        <div className="text-[10px] text-[#7A6348] font-bold capitalize">{el.toLowerCase()} Stones</div>
                        <div className="text-xs font-black font-mono text-rose-900">+{totalStones}</div>
                      </div>
                    );
                  })}

                  {selectedMail.reward?.monsters && selectedMail.reward.monsters.map((m, idx) => {
                    const v = MONSTER_VARIANTS[m.variantId];
                    return (
                      <div key={idx} className="p-2 rounded-lg bg-white border border-amber-300 text-center col-span-2">
                        <Crown className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                        <div className="text-[10px] text-[#7A6348] font-bold">Monster Companion</div>
                        <div className="text-xs font-black text-amber-900 truncate">
                          {m.stars || 4}★ {v?.name || m.variantId} (Lv. {m.level || 1})
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Letter Actions Footer */}
            <div className="p-4 border-t border-[#EBDDBF] bg-[#F7F2E7]/80 flex items-center justify-between shrink-0">
              <button
                onClick={() => handleDeleteMail(selectedMail.id)}
                className="px-3 py-1.5 text-stone-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedMail(null)}
                  className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>

                {!selectedMail.isClaimed && (
                  <button
                    onClick={() => handleClaimSingle(selectedMail.id)}
                    disabled={isClaiming}
                    className="px-5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Claim Package</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEND FRIEND GIFT MODAL */}
      {showSendModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowSendModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#FDFBF7] border-2 border-[#D5C29E] rounded-3xl shadow-2xl overflow-hidden text-[#2E1F0F]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 shrink-0" />

            <div className="p-4 sm:p-5 border-b border-[#EBDDBF] bg-[#F7F2E7]/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-xs">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black font-serif text-[#3D2817]">
                    Send Gift to a Friend
                  </h3>
                  <p className="text-[11px] text-[#7A6348]">
                    Send friendship care package to their mailbox
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-[#7A6348] hover:text-[#2E1F0F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendFriendGift} className="p-5 space-y-3.5">
              {/* Friend Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3D2817]">Friend Adventurer Name</label>
                <input
                  type="text"
                  value={friendNameInput}
                  onChange={(e) => setFriendNameInput(e.target.value)}
                  placeholder="e.g. Elena Swiftwind, Dean"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5C29E] rounded-xl font-bold text-[#2E1F0F] focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Friend Code */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3D2817]">Friend Code (Optional)</label>
                <input
                  type="text"
                  value={friendCodeInput}
                  onChange={(e) => setFriendCodeInput(e.target.value)}
                  placeholder="e.g. MR-7789-ELENA"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5C29E] rounded-xl font-mono text-[#2E1F0F] focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3D2817]">Personalized Note</label>
                <textarea
                  rows={2}
                  value={giftNoteInput}
                  onChange={(e) => setGiftNoteInput(e.target.value)}
                  placeholder="Leave an encouraging note for your companion..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5C29E] rounded-xl text-[#2E1F0F] focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Enclosed Package Preview */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-amber-600" />
                  Free Enclosed Friendship Package:
                </span>
                <div className="flex items-center gap-3 text-[11px] font-mono text-amber-800 font-bold">
                  <span>+2,500 Gold</span>
                  <span>•</span>
                  <span>+25 Summon Points</span>
                  <span>•</span>
                  <span>+15 Energy</span>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingGift}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingGift ? 'Sending...' : 'Send Care Package'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
