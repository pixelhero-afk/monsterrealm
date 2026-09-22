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
  db,
} from '../../services/firebase';
import { collection, doc, getDoc, getDocs, limit, query } from 'firebase/firestore';
import { MONSTER_VARIANTS } from '../../data/monsters';
import { ELEMENT_VISUALS } from '../../data/elements';
import { MonsterAvatar } from '../MonsterAvatar';
import { FriendInspectModal } from './FriendInspectModal';

interface FriendsViewProps {
  currentUser: FirebaseUser | null;
  profile: PlayerProfile;
  monsters: PlayerMonster[];
  onOpenAuthModal: () => void;
  onSparBattle: (friend: FriendPublicProfile) => void;
  onClaimGiftReward: (gold: number, summonPoints: number) => void;
}

type SocialSubTab = 'FRIENDS' | 'ADD' | 'REQUESTS';

export const FriendsView: React.FC<FriendsViewProps> = ({
  currentUser,
  profile,
  monsters,
  onOpenAuthModal,
  onSparBattle,
  onClaimGiftReward,
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
      setActionNotice(`Daily Gift sent to ${friendName}! (100 Gold & 10 Summon Points)`);
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
    if (fullProfile) {
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
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 relative z-10 animate-fade-in">
      {/* ACTION NOTICE TOAST */}
      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* TOP HERO PROFILE & FRIEND CODE BANNER */}
      <div className="relative p-4 sm:p-6 bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] border-2 border-[#D8C7A5] rounded-2xl shadow-md overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-md ring-2 ring-amber-300 flex items-center justify-center">
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
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-amber-600 text-white font-black text-[10px] rounded-full shadow-2xs">
                Lv.{profile.accountLevel}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-serif font-black text-[#5B3912] leading-tight">
                  {profile.username || 'Adventurer'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-[#78350F] border border-amber-300">
                  {currentUser ? 'Cloud Linked' : 'Guest Mode'}
                </span>
              </div>
              <p className="text-xs text-[#854D0E] mt-0.5">
                Champion Lead:{' '}
                <span className="font-bold text-[#5B3912]">
                  {myPublicProfile.leadMonster?.name || 'Starter Team'}
                </span>
              </p>
            </div>
          </div>

          {/* Friend Code Display Card */}
          <div className="flex flex-col sm:items-end w-full sm:w-auto">
            <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-white/90 backdrop-blur-sm border border-[#D5C29E] rounded-xl shadow-2xs">
              <div className="text-left sm:text-right">
                <div className="text-[10px] uppercase font-bold tracking-wider text-[#8C765C]">
                  Your Friend Code
                </div>
                <div className="font-mono font-black text-sm sm:text-base text-[#B45309] tracking-wider">
                  {myFriendCode}
                </div>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[#78350F] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Copy Friend Code to clipboard"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
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

      {/* SOCIAL SUB-NAV TABS */}
      <div className="flex items-center gap-2 border-b border-[#D8C7A5] pb-2 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setSubTab('FRIENDS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            subTab === 'FRIENDS'
              ? 'bg-[#854D0E] text-white shadow-md'
              : 'bg-[#FFFDF9] text-[#78350F] hover:bg-[#F7F2E7] border border-[#E8DCBE]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Friends</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-200/40 text-current">
            {friends.length}/50
          </span>
        </button>

        <button
          onClick={() => setSubTab('ADD')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            subTab === 'ADD'
              ? 'bg-[#854D0E] text-white shadow-md'
              : 'bg-[#FFFDF9] text-[#78350F] hover:bg-[#F7F2E7] border border-[#E8DCBE]'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Friends</span>
        </button>

        <button
          onClick={() => setSubTab('REQUESTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer relative ${
            subTab === 'REQUESTS'
              ? 'bg-[#854D0E] text-white shadow-md'
              : 'bg-[#FFFDF9] text-[#78350F] hover:bg-[#F7F2E7] border border-[#E8DCBE]'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Requests</span>
          {incomingRequests.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
              {incomingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB 1: FRIENDS LIST ── */}
      {subTab === 'FRIENDS' && (
        <div className="space-y-4">
          {friends.length === 0 ? (
            <div className="py-12 px-4 text-center bg-[#FFFDF9] border border-[#D5C29E] rounded-2xl shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-black text-base text-[#5B3912]">
                Your Friends List is Empty
              </h3>
              <p className="text-xs text-[#8C765C] max-w-md mx-auto">
                Connect with other summoners to send daily gift bundles (+100 Gold & +10 Summon Points),
                inspect team compositions, and spar in friendly arena battles!
              </p>
              <button
                onClick={() => setSubTab('ADD')}
                className="fantasy-btn-gold text-xs px-4 py-2 rounded-xl font-bold inline-flex items-center gap-2 cursor-pointer shadow-md"
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

                return (
                  <div
                    key={friend.friendUserId}
                    className="p-3.5 sm:p-4 bg-[#FFFDF9] border border-[#D5C29E] rounded-2xl shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
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
                            <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center font-bold text-amber-800">
                              {friend.displayName[0]?.toUpperCase() || 'P'}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-amber-600 text-white font-black text-[9px] rounded-sm shadow-2xs">
                            Lv.{friend.level}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-[#4A3822]">
                              {friend.displayName}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-[#8C765C]">
                            Code: <span className="text-[#B45309] font-bold">{friend.friendCode}</span>
                          </div>
                          {friend.leadMonster && (
                            <div className="flex items-center gap-1 text-[10px] text-[#78350F] mt-0.5">
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
                        className="p-1 text-[#8C765C] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove Friend"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F2E8D5]">
                      {/* Send Daily Gift */}
                      <button
                        onClick={() => handleSendGift(friend.friendUserId, friend.displayName)}
                        disabled={!!isGiftCooldown}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          isGiftCooldown
                            ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
                        }`}
                        title={isGiftCooldown ? 'Gift sent today (24h cooldown)' : 'Send 100 Gold & 10 Summon Points'}
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>{isGiftCooldown ? 'Gift Sent' : 'Send Gift'}</span>
                      </button>

                      {/* Inspect Team */}
                      <button
                        onClick={() => handleInspect(friend)}
                        className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-white border border-[#D5C29E] hover:bg-[#F7F2E7] text-[#5B3912] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        title="Inspect Friend's Party"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#8C765C]" />
                        <span>Inspect</span>
                      </button>

                      {/* Spar Friendly Battle */}
                      <button
                        onClick={async () => {
                          const full = await getUserPublicProfile(friend.friendUserId);
                          if (full) onSparBattle(full);
                        }}
                        className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        title="Spar against friend's defense party"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        <span>Spar</span>
                      </button>
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
        <div className="space-y-6">
          {/* Search Box */}
          <div className="p-4 sm:p-5 bg-[#FFFDF9] border border-[#D5C29E] rounded-2xl shadow-sm">
            <h3 className="font-serif font-black text-sm sm:text-base text-[#5B3912] mb-1">
              Search by Friend Code or Player Name
            </h3>
            <p className="text-xs text-[#8C765C] mb-3">
              Enter an 8-character Friend Code (e.g. <span className="font-mono font-bold text-[#B45309]">MR-8K92-B4X1</span>) or exact player name.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8C765C] absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Friend Code (MR-XXXX-XXXX) or Name..."
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#D5C29E] rounded-xl text-xs sm:text-sm text-[#4A3822] focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="fantasy-btn-gold px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 shrink-0"
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

                  return (
                    <div
                      key={result.userId}
                      className="p-4 bg-white border border-[#D5C29E] rounded-xl shadow-sm flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
                          {result.displayName[0]?.toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#4A3822]">{result.displayName}</div>
                          <div className="font-mono text-[11px] text-[#B45309] font-bold">
                            {result.friendCode}
                          </div>
                          <div className="text-[10px] text-[#8C765C]">Lv.{result.level}</div>
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

                  return (
                    <div
                      key={player.userId}
                      className="p-3 bg-[#FFFDF9] border border-[#E8DCBE] rounded-xl shadow-2xs flex items-center justify-between gap-2 hover:bg-[#FDFBF7] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {player.displayName[0]?.toUpperCase() || 'P'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#4A3822] truncate">
                            {player.displayName}
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
            <h3 className="font-serif font-black text-sm text-[#5B3912] flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-600" />
              <span>Incoming Friend Requests ({incomingRequests.length})</span>
            </h3>

            {incomingRequests.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8C765C] bg-[#FFFDF9] border border-dashed border-[#D5C29E] rounded-xl">
                No pending incoming friend requests.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.requestId}
                    className="p-3.5 bg-white border border-[#D5C29E] rounded-xl shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                        {req.fromDisplayName[0]?.toUpperCase() || 'P'}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#4A3822]">{req.fromDisplayName}</div>
                        <div className="font-mono text-[10px] text-[#B45309] font-bold">
                          {req.fromFriendCode} • Lv.{req.fromLevel}
                        </div>
                        <div className="text-[10px] text-[#8C765C]">
                          Requested {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAcceptRequest(req)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(req.requestId, true)}
                        className="px-2 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all cursor-pointer"
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
