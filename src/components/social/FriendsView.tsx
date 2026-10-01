/**
 * Monster Realms - Friends & Social Hub View
 * Manage friends, send/claim daily gifts, search players, accept requests,
 * inspect defense teams, and launch friendly sparring matches.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Copy,
  Check,
  Search,
  Gift,
  Swords,
  Eye,
  Trash2,
  Sparkles,
  Clock,
  Shield,
  Star,
  AlertCircle,
  RefreshCw,
  Award,
  ChevronRight,
  Send,
  Heart,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  FriendLeadMonster,
  FriendPublicProfile,
  FriendRecord,
  FriendRequestRecord,
  PlayerMonster,
  PlayerProfile,
} from '../../types';
import {
  acceptFriendRequest,
  claimDailyFriendGift,
  deleteFriendRequest,
  generateFriendCode,
  getUserPublicProfile,
  listenFriendsList,
  listenIncomingRequests,
  listenOutgoingRequests,
  removeFriend,
  searchPlayer,
  sendDailyFriendGift,
  sendFriendRequest,
  checkIsOnline,
  formatLastSeen,
  listenFriendsPresence,
  FriendPresenceInfo,
  sendFriendMailFirestore,
  db,
} from '../../services/firebase';
import { sendFriendGiftMailApi } from '../../services/apiClient';
import { getUnclaimedMailCount } from '../../services/mailboxService';
import { collection, doc, getDoc, getDocs, limit, query } from 'firebase/firestore';
import { MONSTER_VARIANTS } from '../../data/monsters';
import { ELEMENT_VISUALS } from '../../data/elements';
import { MonsterAvatar } from '../MonsterAvatar';
import { FriendInspectModal } from './FriendInspectModal';
import { ActiveTab } from '../Navbar';
import { HubCommandHeader, HubCurrenciesMatrix } from '../common/HubCommandHeader';
import { Currencies } from '../../types';
import { GoogleAdSenseBanner } from '../ads/GoogleAdSenseBanner';

interface FriendsViewProps {
  currentUser: FirebaseUser | null;
  profile: PlayerProfile;
  monsters: PlayerMonster[];
  currencies: Currencies;
  setActiveTab?: (tab: ActiveTab) => void;
  onOpenProfileModal?: (tab?: 'OVERVIEW' | 'REWARDS' | 'AVATAR' | 'MAILBOX') => void;
  onOpenAuthModal: () => void;
  onSparBattle: (friend: FriendPublicProfile) => void;
  onClaimGiftReward: (gold: number, summonPoints: number) => void;
  onOpenChat?: (tab?: 'WORLD' | 'PRIVATE', targetUser?: any) => void;
}

type SocialSubTab = 'FRIENDS' | 'ADD' | 'REQUESTS';

export const FriendsView: React.FC<FriendsViewProps> = ({
  currentUser,
  profile,
  monsters,
  currencies,
  setActiveTab,
  onOpenProfileModal,
  onOpenAuthModal,
  onSparBattle,
  onClaimGiftReward,
  onOpenChat,
}) => {
  const [subTab, setSubTab] = useState<SocialSubTab>('FRIENDS');
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestRecord[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendPublicProfile[]>([]);
  const [recommendedPlayers, setRecommendedPlayers] = useState<FriendPublicProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inspectingFriend, setInspectingFriend] = useState<FriendPublicProfile | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [friendsPresence, setFriendsPresence] = useState<Record<string, FriendPresenceInfo>>({});

  const myFriendCode = currentUser ? generateFriendCode(currentUser.uid) : 'GUEST-LOCAL';

  // Copy Friend Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(myFriendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Build my current public profile representation
  const myPublicProfile: FriendPublicProfile = React.useMemo(() => {
    const activePartyMonsters = (profile.activeParty || [])
      .map((id) => monsters.find((m) => m.instanceId === id))
      .filter((m): m is PlayerMonster => !!m);
    const lead = activePartyMonsters[0] || monsters[0];

    const leadData: FriendLeadMonster | undefined = lead
      ? {
          variantId: lead.variantId,
          name: lead.variantId.replace(/^var_/, '').replace(/_/g, ' '),
          level: lead.level,
          stars: lead.stars || 5,
          element: (lead.variantId.split('_')[2] as any) || 'FIRE',
          awakeningStage: lead.awakeningStage,
        }
      : undefined;

    return {
      userId: currentUser?.uid || 'guest',
      displayName: profile.username || currentUser?.displayName || 'Adventurer',
      friendCode: myFriendCode,
      level: profile.accountLevel || 1,
      avatarVariantId: profile.avatarVariantId || lead?.variantId,
      leadMonster: leadData,
      defenseParty: activePartyMonsters.slice(0, 5),
      lastActive: new Date().toISOString(),
      createdAt: new Date(profile.createdAt || Date.now()).toISOString(),
    };
  }, [currentUser, profile, monsters, myFriendCode]);

  // Subscribe to real-time Friends & Requests
  useEffect(() => {
    if (!currentUser) {
      setFriends([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      return;
    }

    const unsubFriends = listenFriendsList(currentUser.uid, (list) => {
      setFriends(list);
    });

    const unsubIncoming = listenIncomingRequests(currentUser.uid, (list) => {
      setIncomingRequests(list);
    });

    const unsubOutgoing = listenOutgoingRequests(currentUser.uid, (list) => {
      setOutgoingRequests(list);
    });

    return () => {
      unsubFriends();
      unsubIncoming();
      unsubOutgoing();
    };
  }, [currentUser]);

  // Subscribe to real-time presence (online/offline status) for all confirmed friends
  useEffect(() => {
    if (!friends || friends.length === 0) {
      setFriendsPresence({});
      return;
    }

    const friendIds = friends.map((f) => f.friendUserId).filter(Boolean);
    const unsubPresence = listenFriendsPresence(friendIds, (presenceMap) => {
      setFriendsPresence(presenceMap);
    });

    return () => unsubPresence();
  }, [friends]);

  // Load recommended adventurers for discovery
  useEffect(() => {
    if (!currentUser) return;

    async function loadRecommended() {
      try {
        const q = query(collection(db, 'users'), limit(8));
        const snap = await getDocs(q);
        const list: FriendPublicProfile[] = [];
        snap.forEach((doc) => {
          const data = doc.data() as FriendPublicProfile;
          if (data.userId !== currentUser.uid) {
            list.push(data);
          }
        });
        setRecommendedPlayers(list);
      } catch (err) {
        console.warn('Could not load recommended players:', err);
      }
    }

    loadRecommended();
  }, [currentUser]);

  // Search player handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setSearchMessage(null);
      const results = await searchPlayer(searchQuery);
      // Filter out self
      const filtered = results.filter((p) => p.userId !== currentUser?.uid);
      setSearchResults(filtered);
      if (filtered.length === 0) {
        setSearchMessage(`No adventurers found matching "${searchQuery}".`);
      }
    } catch (err: any) {
      setSearchMessage('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Send friend request
  const handleSendRequest = async (target: FriendPublicProfile) => {
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }

    try {
      await sendFriendRequest(myPublicProfile, target);
      setActionNotice(`Friend request sent to ${target.displayName}!`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setActionNotice(err.message || 'Failed to send friend request');
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  // Accept request
  const handleAcceptRequest = async (req: FriendRequestRecord) => {
    try {
      await acceptFriendRequest(req, myPublicProfile);
      setActionNotice(`Accepted ${req.fromDisplayName}'s friend request!`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setActionNotice(err.message || 'Failed to accept request');
    }
  };

  // Reject / Cancel request
  const handleDeleteRequest = async (requestId: string, isIncoming: boolean) => {
    try {
      await deleteFriendRequest(requestId);
      setActionNotice(isIncoming ? 'Request declined.' : 'Request cancelled.');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setActionNotice(err.message);
    }
  };

  // Send Daily Gift
  const handleSendGift = async (friendId: string, friendName: string) => {
    if (!currentUser) return;
    try {
      await sendDailyFriendGift(currentUser.uid, friendId);
      // Dispatch gift care package to the friend's mailbox on Firestore and backend
      sendFriendMailFirestore(friendId, myPublicProfile, 'Here are your daily friendship supplies! Best of luck in battle!').catch(() => {});
      sendFriendGiftMailApi(friendId, friendName, 'Here are your daily friendship supplies!').catch(() => {});
      setActionNotice(`Daily Gift sent to ${friendName}'s Mailbox! (+100 Gold & 10 Summon Points)`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setActionNotice(err.message || 'Could not send gift');
    }
  };

  // Claim Daily Gift
  const handleClaimGift = async (friendId: string, friendName: string) => {
    if (!currentUser) return;
    try {
      await claimDailyFriendGift(currentUser.uid, friendId);
      onClaimGiftReward(100, 10);
      setActionNotice(`Claimed Daily Gift from ${friendName}! (+100 Gold, +10 Summon Points)`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setActionNotice(err.message || 'Could not claim gift');
    }
  };

  // Remove Friend
  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (!currentUser) return;
    if (!window.confirm(`Are you sure you want to remove ${friendName} from your friends list?`)) {
      return;
    }
    try {
      await removeFriend(currentUser.uid, friendId);
      setActionNotice(`${friendName} removed from friends.`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setActionNotice(err.message || 'Could not remove friend');
    }
  };

  // Inspect Friend
  const handleInspect = async (friend: FriendRecord | FriendPublicProfile) => {
    // If it's FriendRecord, fetch their latest public profile to get their live defense party
    const friendId = 'friendUserId' in friend ? friend.friendUserId : friend.userId;
    const fullProfile = await getUserPublicProfile(friendId);
    const livePresence = friendsPresence[friendId];

    if (fullProfile) {
      if (livePresence) {
        fullProfile.isOnline = livePresence.isOnline;
        if (livePresence.lastActive) fullProfile.lastActive = livePresence.lastActive;
      }
      setInspectingFriend(fullProfile);
    } else {
      // Fallback
      setInspectingFriend({
        userId: friendId,
        displayName: friend.displayName,
        friendCode: friend.friendCode,
        level: friend.level,
        avatarVariantId: friend.avatarVariantId,
        leadMonster: friend.leadMonster,
        defenseParty: [],
        isOnline: livePresence !== undefined ? livePresence.isOnline : friend.isOnline,
        lastActive: livePresence?.lastActive || friend.lastActive || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-3.5 sm:space-y-4 relative z-10">
      {/* ═══════════════════════════════════════════════════════════════
          ROW 1: TOP HEADER (HOME, Player Profile, Music Toggle, Cloud Account)
          ═══════════════════════════════════════════════════════════════ */}
      <HubCommandHeader
        activeTab="FRIENDS"
        setActiveTab={setActiveTab}
        profile={profile}
        currentUser={currentUser}
        onOpenProfileModal={onOpenProfileModal}
        onOpenAuthModal={onOpenAuthModal}
      />

      {/* ACTION NOTICE TOAST */}
      {actionNotice && (
        <div className="p-3 bg-emerald-50 border-2 border-emerald-600 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2 shadow-xs animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          ROW 2: SOCIAL SUB-NAV & LIVE CURRENCIES MATRIX
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 items-stretch">
        {/* Left Half: Subnav Grid (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-2">
          {/* Row 2a: Friends | Add Friends | Requests | Copy Code */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setSubTab('FRIENDS')}
              className={`py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                subTab === 'FRIENDS'
                  ? 'bg-[#FFFDF9] border-[3px] border-[#F59E0B] text-[#2E1F0F] ring-2 ring-amber-300/40 font-black'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F]'
              }`}
            >
              <Users className="w-4 h-4 text-amber-700" />
              <span>Friends ({friends.length}/50)</span>
            </button>

            <button
              onClick={() => setSubTab('ADD')}
              className={`py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                subTab === 'ADD'
                  ? 'bg-[#FFFDF9] border-[3px] border-[#F59E0B] text-[#2E1F0F] ring-2 ring-amber-300/40 font-black'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F]'
              }`}
            >
              <UserPlus className="w-4 h-4 text-blue-700" />
              <span>Add Friends</span>
            </button>

            <button
              onClick={() => setSubTab('REQUESTS')}
              className={`py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
                subTab === 'REQUESTS'
                  ? 'bg-[#FFFDF9] border-[3px] border-[#F59E0B] text-[#2E1F0F] ring-2 ring-amber-300/40 font-black'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F]'
              }`}
            >
              <Mail className="w-4 h-4 text-purple-700" />
              <span>Requests</span>
              {incomingRequests.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {incomingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={handleCopyCode}
              className="py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F]"
              title="Copy your friend code"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-700" />
                  <span>Code: {myFriendCode.slice(0, 6)}</span>
                </>
              )}
            </button>
          </div>

          {/* Row 2b: Mailbox & Quick Utilities */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => onOpenProfileModal?.('MAILBOX')}
              className="col-span-2 py-2 px-3 rounded-2xl bg-gradient-to-r from-[#FFFDF9] via-[#FAF4E6] to-[#FFFBEB] hover:bg-[#FAF6ED] border-2 border-amber-400 text-[#2E1F0F] font-bold text-xs sm:text-sm shadow-xs cursor-pointer flex items-center justify-between gap-1.5 transition-all group"
              title="Open Mailbox to claim gifts from friends"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span>Warden Mailbox</span>
              </div>
              {getUnclaimedMailCount(profile) > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black font-mono animate-pulse">
                  {getUnclaimedMailCount(profile)} Gifts
                </span>
              ) : (
                <span className="text-[10px] text-[#78654E] font-medium">Check Gifts</span>
              )}
            </button>

            {/* Realm Comms & Chat Button */}
            {onOpenChat && (
              <button
                onClick={() => onOpenChat('WORLD')}
                className="col-span-2 py-2 px-3 rounded-2xl bg-gradient-to-r from-[#FFFDF9] via-[#FAF4E6] to-[#FEF3C7] hover:bg-[#FAF6ED] border-2 border-amber-400 text-[#2E1F0F] font-bold text-xs sm:text-sm shadow-xs cursor-pointer flex items-center justify-between gap-1.5 transition-all group"
                title="Open World & Private Chat"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <span>Realm Chat</span>
                </div>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  World & DM
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Right Half: 2x2 Currencies Matrix (5 cols) */}
        <div className="lg:col-span-5">
          <HubCurrenciesMatrix currencies={currencies} />
        </div>
      </div>

      {/* TOP HERO PROFILE & FRIEND CODE BANNER */}
      <div className="bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-xs ring-2 ring-[#2E1F0F] flex items-center justify-center">
                {myPublicProfile.leadMonster ? (
                  <MonsterAvatar
                    variantId={myPublicProfile.leadMonster.variantId}
                    awakeningStage={myPublicProfile.leadMonster.awakeningStage}
                    size="lg"
                    element={myPublicProfile.leadMonster.element}
                  />
                ) : (
                  <Users className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-[#2E1F0F] text-amber-300 font-black text-[10px] rounded-full shadow-2xs">
                Lv.{profile.accountLevel}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-serif font-black text-[#2E1F0F] leading-tight">
                  {profile.username || 'Adventurer'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]">
                  {currentUser ? 'Cloud Linked' : 'Guest Mode'}
                </span>
              </div>
              <p className="text-xs text-[#78654E] mt-0.5">
                Champion Lead:{' '}
                <span className="font-bold text-[#2E1F0F]">
                  {myPublicProfile.leadMonster?.name || 'Starter Team'}
                </span>
              </p>
            </div>
          </div>

          {/* Friend Code Display Card */}
          <div className="flex flex-col sm:items-end w-full sm:w-auto">
            <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl shadow-2xs">
              <div className="text-left sm:text-right">
                <div className="text-[10px] uppercase font-bold tracking-wider text-[#78654E]">
                  Your Friend Code
                </div>
                <div className="font-mono font-black text-sm sm:text-base text-[#2E1F0F] tracking-wider">
                  {myFriendCode}
                </div>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 border border-[#2E1F0F] text-[#2E1F0F] text-xs font-black transition-all cursor-pointer shadow-2xs"
                title="Copy Friend Code to clipboard"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {!currentUser && (
              <button
                onClick={onOpenAuthModal}
                className="mt-2 text-[11px] font-bold text-amber-800 hover:text-amber-900 underline flex items-center gap-1 cursor-pointer"
              >
                <span>Login or Register to save friends & cloud progress</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── TAB 1: FRIENDS LIST ── */}
      {subTab === 'FRIENDS' && (
        <div className="space-y-4">
          {friends.length === 0 ? (
            <div className="py-12 px-4 text-center bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl sm:rounded-3xl shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-[#2E1F0F] text-amber-800 flex items-center justify-center mx-auto shadow-2xs">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-black text-base text-[#2E1F0F]">
                Your Friends List is Empty
              </h3>
              <p className="text-xs text-[#78654E] max-w-md mx-auto">
                Connect with other summoners to send daily gift bundles (+100 Gold & +10 Summon Points),
                inspect team compositions, and spar in friendly arena battles!
              </p>
              <button
                onClick={() => setSubTab('ADD')}
                className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 border-2 border-[#2E1F0F] text-[#2E1F0F] text-xs px-4 py-2.5 rounded-xl font-black inline-flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Search & Add Friends</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {friends.map((friend) => {
                const isGiftCooldown =
                  friend.lastGiftSentAt && Date.now() - friend.lastGiftSentAt < 86400000;
                const presence = friendsPresence[friend.friendUserId];
                const isOnline =
                  presence !== undefined
                    ? presence.isOnline
                    : checkIsOnline(friend.isOnline, friend.lastActive);
                const lastActiveTime = presence?.lastActive || friend.lastActive;
                const lastSeenText = formatLastSeen(lastActiveTime);

                return (
                  <div
                    key={friend.friendUserId}
                    className="p-3.5 sm:p-4 bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl shadow-xs hover:border-amber-600 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {friend.leadMonster ? (
                            <MonsterAvatar
                              variantId={friend.leadMonster.variantId}
                              awakeningStage={friend.leadMonster.awakeningStage}
                              size="md"
                              element={friend.leadMonster.element}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-amber-200 border border-[#2E1F0F] flex items-center justify-center font-bold text-amber-800">
                              {friend.displayName[0]?.toUpperCase() || 'P'}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-[#2E1F0F] text-amber-300 font-black text-[9px] rounded-sm shadow-2xs">
                            Lv.{friend.level}
                          </div>
                          {/* Live Online / Offline Status Dot */}
                          <span
                            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ring-2 ring-white shadow-2xs ${
                              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                            }`}
                            title={isOnline ? 'Online now' : `Offline${lastSeenText ? ` • ${lastSeenText}` : ''}`}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-[#2E1F0F] font-serif">
                              {friend.displayName}
                            </span>
                            {isOnline ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                                <span>Online</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-stone-100 text-stone-600 border border-stone-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0"></span>
                                <span>Offline</span>
                                {lastSeenText && <span className="text-[8px] text-stone-400 font-normal">• {lastSeenText}</span>}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-[#78654E]">
                            Code: <span className="text-amber-800 font-bold">{friend.friendCode}</span>
                          </div>
                          {friend.leadMonster && (
                            <div className="flex items-center gap-1 text-[10px] text-[#78654E] mt-0.5">
                              <span>Lead: {friend.leadMonster.name}</span>
                              <div className="flex items-center">
                                {Array.from({ length: friend.leadMonster.stars || 5 }).map((_, s) => (
                                  <Star key={s} className="w-2 h-2 fill-amber-400 text-amber-500" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Remove Friend Button */}
                      <button
                        onClick={() => handleRemoveFriend(friend.friendUserId, friend.displayName)}
                        className="p-1.5 text-[#78654E] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove Friend"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#D5C29E]">
                      {/* Send Daily Gift */}
                      <button
                        onClick={() => handleSendGift(friend.friendUserId, friend.displayName)}
                        disabled={!!isGiftCooldown}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs border-2 ${
                          isGiftCooldown
                            ? 'bg-[#FAF6ED] text-[#A89884] border-[#D5C29E] cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#2E1F0F] border-[#2E1F0F] active:scale-95'
                        }`}
                        title={isGiftCooldown ? 'Gift sent today (24h cooldown)' : 'Send 100 Gold & 10 Summon Points'}
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>{isGiftCooldown ? 'Gift Sent' : 'Send Gift'}</span>
                      </button>

                      {/* Inspect Team */}
                      <button
                        onClick={() => handleInspect(friend)}
                        className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F] text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
                        title="Inspect Friend's Party"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#78654E]" />
                        <span>Inspect</span>
                      </button>

                      {/* Spar Friendly Battle */}
                      <button
                        onClick={async () => {
                          const full = await getUserPublicProfile(friend.friendUserId);
                          if (full) onSparBattle(full);
                        }}
                        className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-2 border-[#2E1F0F] text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
                        title="Spar against friend's defense party"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        <span>Spar</span>
                      </button>

                      {/* Chat / Direct Message */}
                      {onOpenChat && (
                        <button
                          onClick={() =>
                            onOpenChat('PRIVATE', {
                              userId: friend.friendUserId,
                              displayName: friend.displayName,
                              avatarVariantId: friend.avatarVariantId,
                              level: friend.level,
                            })
                          }
                          className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-[#FFFDF9] hover:bg-amber-100 border-2 border-[#2E1F0F] text-[#2E1F0F] text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Send Private Direct Message"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                          <span>Chat</span>
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

      {/* ── TAB 2: ADD FRIENDS ── */}
      {subTab === 'ADD' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Search Box */}
          <div className="p-4 sm:p-5 bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl sm:rounded-3xl shadow-xs">
            <h3 className="font-serif font-black text-sm sm:text-base text-[#2E1F0F] mb-1">
              Search by Friend Code or Player Name
            </h3>
            <p className="text-xs text-[#78654E] mb-3">
              Enter an 8-character Friend Code (e.g. <span className="font-mono font-bold text-amber-800">MR-8K92-B4X1</span>) or exact player name.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#78654E] absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Friend Code (MR-XXXX-XXXX) or Name..."
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-xl text-xs sm:text-sm text-[#2E1F0F] focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs font-mono font-bold"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 border-2 border-[#2E1F0F] text-[#2E1F0F] px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 shrink-0 active:scale-95"
              >
                {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Search</span>
              </button>
            </form>

            {searchMessage && (
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-[#78350F] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{searchMessage}</span>
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C765C]">
                Search Results ({searchResults.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {searchResults.map((result) => {
                  const isAlreadyFriend = friends.some((f) => f.friendUserId === result.userId);
                  const hasOutgoing = outgoingRequests.some((r) => r.toUserId === result.userId);
                  const isOnline = checkIsOnline(result.isOnline, result.lastActive);
                  const lastSeenText = formatLastSeen(result.lastActive);

                  return (
                    <div
                      key={result.userId}
                      className="p-4 bg-white border border-[#D5C29E] rounded-xl shadow-sm flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
                            {result.displayName[0]?.toUpperCase() || 'P'}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                            }`}
                            title={isOnline ? 'Online' : 'Offline'}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#4A3822]">{result.displayName}</span>
                            {isOnline ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Online
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-stone-100 text-stone-600 border border-stone-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                                Offline
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-[#B45309] font-bold">
                            {result.friendCode}
                          </div>
                          <div className="text-[10px] text-[#8C765C]">
                            Lv.{result.level} {lastSeenText && !isOnline ? `• Seen ${lastSeenText}` : ''}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isAlreadyFriend ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            Friend
                          </span>
                        ) : hasOutgoing ? (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            Requested
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendRequest(result)}
                            className="fantasy-btn-gold px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add Friend</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Adventurers */}
          {recommendedPlayers.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C765C]">
                  Adventurers in the Realm
                </h4>
                <span className="text-[11px] text-[#8C765C]">Active Players</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendedPlayers.map((player) => {
                  const isAlreadyFriend = friends.some((f) => f.friendUserId === player.userId);
                  const hasOutgoing = outgoingRequests.some((r) => r.toUserId === player.userId);
                  const isOnline = checkIsOnline(player.isOnline, player.lastActive);

                  return (
                    <div
                      key={player.userId}
                      className="p-3 bg-[#FFFDF9] border border-[#E8DCBE] rounded-xl shadow-2xs flex items-center justify-between gap-2 hover:bg-[#FDFBF7] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                            {player.displayName[0]?.toUpperCase() || 'P'}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'
                            }`}
                            title={isOnline ? 'Online' : 'Offline'}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#4A3822] truncate">
                              {player.displayName}
                            </span>
                            {isOnline ? (
                              <span className="px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                Online
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-stone-100 text-stone-500 border border-stone-200 shrink-0">
                                Offline
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-[#8C765C] truncate">
                            {player.friendCode} • Lv.{player.level}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        <button
                          onClick={() => handleInspect(player)}
                          className="p-1.5 rounded-lg text-[#8C765C] hover:text-[#5B3912] hover:bg-[#F4EBD7] cursor-pointer"
                          title="Inspect Team"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {isAlreadyFriend ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Friend
                          </span>
                        ) : hasOutgoing ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendRequest(player)}
                            className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-[#78350F] text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: FRIEND REQUESTS ── */}
      {subTab === 'REQUESTS' && (
        <div className="space-y-6">
          {/* Incoming Requests */}
          <div className="space-y-3">
            <h3 className="font-serif font-black text-sm text-[#2E1F0F] flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-700" />
              <span>Incoming Friend Requests ({incomingRequests.length})</span>
            </h3>

            {incomingRequests.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#78654E] bg-[#FFFDF9] border-2 border-dashed border-[#D5C29E] rounded-2xl">
                No pending incoming friend requests.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.requestId}
                    className="p-3.5 bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 border border-[#2E1F0F] text-white flex items-center justify-center font-bold text-base shadow-xs">
                        {req.fromDisplayName[0]?.toUpperCase() || 'P'}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#2E1F0F] font-serif">{req.fromDisplayName}</div>
                        <div className="font-mono text-[10px] text-amber-800 font-bold">
                          {req.fromFriendCode} • Lv.{req.fromLevel}
                        </div>
                        <div className="text-[10px] text-[#78654E]">
                          Requested {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAcceptRequest(req)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black border-2 border-[#2E1F0F] transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(req.requestId, true)}
                        className="px-2.5 py-1.5 rounded-xl border-2 border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests */}
          <div className="space-y-3 pt-2">
            <h3 className="font-serif font-black text-sm text-[#5B3912] flex items-center gap-2">
              <Send className="w-4 h-4 text-[#8C765C]" />
              <span>Sent Requests ({outgoingRequests.length})</span>
            </h3>

            {outgoingRequests.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#8C765C] bg-[#FFFDF9] border border-dashed border-[#D5C29E] rounded-xl">
                No active outgoing friend requests.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {outgoingRequests.map((req) => (
                  <div
                    key={req.requestId}
                    className="p-3 bg-[#FFFDF9] border border-[#E8DCBE] rounded-xl shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#4A3822]">
                        Sent to: {req.toFriendCode || req.toUserId}
                      </div>
                      <div className="text-[10px] text-[#8C765C]">Status: Awaiting player approval</div>
                    </div>
                    <button
                      onClick={() => handleDeleteRequest(req.requestId, false)}
                      className="px-2.5 py-1 rounded-lg border border-[#D5C29E] hover:bg-[#F4EBD7] text-[#78350F] text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          BOTTOM SPONSORED BANNER / ADSENSE PLACEMENT
          ═══════════════════════════════════════════════════════════════ */}
      <GoogleAdSenseBanner />

      {/* FRIEND INSPECT MODAL */}
      {inspectingFriend && (
        <FriendInspectModal
          friend={inspectingFriend}
          onClose={() => setInspectingFriend(null)}
          onSparBattle={(f) => {
            setInspectingFriend(null);
            onSparBattle(f);
          }}
        />
      )}
    </div>
  );
};
