/**
 * Monster Realms - World Chat & Private Chat Modal / Drawer
 * Full-featured real-time communication interface:
 * - 🌍 World Chat: Global realm broadcast across all adventurers
 * - 💬 Private Chat: Direct 1-on-1 messaging with conversation list and friend picker
 * - Quick tactical preset phrases & emojis
 * - Interactive player card context actions (Message, Spar, Add Friend)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Globe,
  User,
  Users,
  Send,
  X,
  Sparkles,
  Shield,
  Clock,
  Swords,
  Gift,
  Heart,
  ChevronLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Smile,
  Volume2,
} from 'lucide-react';
import {
  ChatMessage,
  DirectConversation,
  FriendPublicProfile,
  FriendRecord,
  PlayerMonster,
  PlayerProfile,
} from '../../types';
import { MONSTER_VARIANTS } from '../../data/monsters';
import { MonsterAvatar } from '../MonsterAvatar';
import {
  fetchWorldChatApi,
  fetchDirectMessagesApi,
  fetchConversationsApi,
  sendWorldChat,
  sendDirectMessage,
  QUICK_REALM_PHRASES,
} from '../../services/chatService';
import {
  listenFirestoreWorldChat,
  listenFirestoreDirectMessages,
} from '../../services/firebase';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  monsters: PlayerMonster[];
  currentUser?: any;
  initialTab?: 'WORLD' | 'PRIVATE';
  initialTargetUser?: {
    userId: string;
    displayName: string;
    avatarVariantId?: string;
  };
  friends?: FriendRecord[];
  onSparBattle?: (friend: FriendPublicProfile) => void;
  onOpenProfileModal?: (tab?: 'OVERVIEW' | 'REWARDS' | 'AVATAR' | 'MAILBOX') => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  profile,
  monsters,
  currentUser,
  initialTab = 'WORLD',
  initialTargetUser,
  friends = [],
  onSparBattle,
  onOpenProfileModal,
}) => {
  const [activeTab, setActiveTab] = useState<'WORLD' | 'PRIVATE'>(initialTab);

  // World Chat State
  const [worldMessages, setWorldMessages] = useState<ChatMessage[]>([]);
  const [worldInputText, setWorldInputText] = useState('');
  const [isSendingWorld, setIsSendingWorld] = useState(false);

  // Private Chat State
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<{
    userId: string;
    displayName: string;
    avatarVariantId?: string;
    level?: number;
  } | null>(initialTargetUser || null);
  const [directMessages, setDirectMessages] = useState<ChatMessage[]>([]);
  const [directInputText, setDirectInputText] = useState('');
  const [isSendingDirect, setIsSendingDirect] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  // UI Toast Notice
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Context Menu for clicking on a player in world chat
  const [selectedPlayerContext, setSelectedPlayerContext] = useState<ChatMessage | null>(null);

  const worldEndRef = useRef<HTMLDivElement>(null);
  const directEndRef = useRef<HTMLDivElement>(null);

  const myUserId = currentUser?.uid || profile.playerId || 'player_default';

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 3500);
  };

  // Sync initial target user if passed as prop
  useEffect(() => {
    if (initialTargetUser) {
      setSelectedPartner(initialTargetUser);
      setActiveTab('PRIVATE');
    }
  }, [initialTargetUser]);

  // Load World Chat Messages (Initial API fetch + real-time Firestore listener)
  useEffect(() => {
    if (!isOpen) return;

    // 1. Initial fetch from API
    fetchWorldChatApi(60).then((msgs) => {
      if (msgs && msgs.length > 0) {
        setWorldMessages(msgs);
      }
    });

    // 2. Real-time Firestore listener if available
    let unsub: (() => void) | null = null;
    try {
      unsub = listenFirestoreWorldChat((liveMsgs) => {
        if (liveMsgs && liveMsgs.length > 0) {
          setWorldMessages(liveMsgs);
        }
      }, 60);
    } catch (e) {
      console.warn('[WorldChat] Firestore listener fallback:', e);
    }

    // 3. Fallback polling every 5 seconds for reliable background sync
    const interval = setInterval(() => {
      fetchWorldChatApi(60).then((msgs) => {
        if (msgs && msgs.length > 0) {
          setWorldMessages(msgs);
        }
      });
    }, 5000);

    return () => {
      if (unsub) unsub();
      clearInterval(interval);
    };
  }, [isOpen]);

  // Load Conversations List
  useEffect(() => {
    if (!isOpen) return;

    fetchConversationsApi(myUserId).then((convs) => {
      setConversations(convs);
      if (!selectedPartner && convs.length > 0) {
        setSelectedPartner({
          userId: convs[0].userId,
          displayName: convs[0].displayName,
          avatarVariantId: convs[0].avatarVariantId,
          level: convs[0].level,
        });
      }
    });
  }, [isOpen, myUserId]);

  // Load Direct Messages for selected partner
  useEffect(() => {
    if (!isOpen || !selectedPartner) return;

    // 1. Initial API fetch
    fetchDirectMessagesApi(selectedPartner.userId, myUserId).then((msgs) => {
      setDirectMessages(msgs);
    });

    // 2. Real-time Firestore listener if user authenticated
    let unsub: (() => void) | null = null;
    if (currentUser?.uid) {
      try {
        unsub = listenFirestoreDirectMessages(
          currentUser.uid,
          selectedPartner.userId,
          (liveMsgs) => {
            setDirectMessages(liveMsgs);
          }
        );
      } catch (e) {
        console.warn('[DirectMessage] Firestore listener fallback:', e);
      }
    }

    // 3. Fallback polling for active conversation
    const interval = setInterval(() => {
      fetchDirectMessagesApi(selectedPartner.userId, myUserId).then((msgs) => {
        setDirectMessages(msgs);
      });
    }, 4000);

    return () => {
      if (unsub) unsub();
      clearInterval(interval);
    };
  }, [isOpen, selectedPartner, myUserId, currentUser]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (activeTab === 'WORLD') {
      worldEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      directEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [worldMessages, directMessages, activeTab]);

  // Handle Send World Chat Message
  const handleSendWorld = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!worldInputText.trim()) return;

    const textToSend = worldInputText.trim();
    setWorldInputText('');
    setIsSendingWorld(true);

    try {
      const newMsg = await sendWorldChat(profile, textToSend, currentUser);
      setWorldMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    } catch (err: any) {
      showToast('error', err.message || 'Failed to send message');
      setWorldInputText(textToSend); // Restore if failed
    } finally {
      setIsSendingWorld(false);
    }
  };

  // Handle Send Direct Message
  const handleSendDirect = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!directInputText.trim() || !selectedPartner) return;

    const textToSend = directInputText.trim();
    setDirectInputText('');
    setIsSendingDirect(true);

    try {
      const newMsg = await sendDirectMessage(
        profile,
        selectedPartner.userId,
        selectedPartner.displayName,
        selectedPartner.avatarVariantId,
        textToSend,
        currentUser
      );

      setDirectMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // Update conversations list
      setConversations((prev) => {
        const existingIdx = prev.findIndex((c) => c.userId === selectedPartner.userId);
        const updatedEntry: DirectConversation = {
          userId: selectedPartner.userId,
          displayName: selectedPartner.displayName,
          avatarVariantId: selectedPartner.avatarVariantId,
          level: selectedPartner.level,
          lastMessage: textToSend,
          lastMessageTimestamp: Date.now(),
        };

        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = updatedEntry;
          return updated.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
        } else {
          return [updatedEntry, ...prev];
        }
      });
    } catch (err: any) {
      showToast('error', err.message || 'Failed to send direct message');
      setDirectInputText(textToSend);
    } finally {
      setIsSendingDirect(false);
    }
  };

  // Switch to Private Chat with selected user
  const handleStartPrivateWith = (partner: {
    userId: string;
    displayName: string;
    avatarVariantId?: string;
    level?: number;
  }) => {
    setSelectedPartner(partner);
    setActiveTab('PRIVATE');
    setSelectedPlayerContext(null);
    setIsNewChatOpen(false);
  };

  // Format relative timestamp
  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Filtered friends for starting a new chat
  const eligibleNewChatFriends = useMemo(() => {
    return friends.filter((f) => {
      if (!friendSearchQuery.trim()) return true;
      return f.displayName.toLowerCase().includes(friendSearchQuery.toLowerCase());
    });
  }, [friends, friendSearchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl h-[90vh] sm:h-[84vh] bg-[#FDFBF7] border-2 border-[#D5C29E] rounded-3xl shadow-2xl overflow-hidden text-[#2E1F0F] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ornate Top Strip */}
        <div className="h-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 shrink-0" />

        {/* HEADER BAR */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-[#EBDDBF] bg-[#F7F2E7]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md border border-amber-300">
              <MessageSquare className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black font-serif text-[#3D2817]">
                  Warden Communications
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-[#7A6348]">
                Real-time world realm frequency & private adventurer messaging
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#7A6348] hover:text-[#2E1F0F] hover:bg-[#EADBBE] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center justify-between border-b border-[#E3D3B4] bg-[#F7F2E7]/50 px-4 sm:px-6 shrink-0 text-xs sm:text-sm font-bold">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('WORLD')}
              className={`flex items-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 transition-all cursor-pointer ${
                activeTab === 'WORLD'
                  ? 'border-amber-600 text-amber-900 bg-[#FDFBF7]'
                  : 'border-transparent text-[#7A6348] hover:text-[#2E1F0F]'
              }`}
            >
              <Globe className="w-4 h-4 text-amber-600" />
              <span>World Chat</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold font-mono">
                Channel 1
              </span>
            </button>

            <button
              onClick={() => setActiveTab('PRIVATE')}
              className={`flex items-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 transition-all cursor-pointer ${
                activeTab === 'PRIVATE'
                  ? 'border-amber-600 text-amber-900 bg-[#FDFBF7]'
                  : 'border-transparent text-[#7A6348] hover:text-[#2E1F0F]'
              }`}
            >
              <User className="w-4 h-4 text-amber-600" />
              <span>Private Chat</span>
              {conversations.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold font-mono">
                  {conversations.length}
                </span>
              )}
            </button>
          </div>

          <div className="text-[11px] text-[#7A6348] hidden sm:flex items-center gap-1 font-mono">
            <span>You: <strong>{profile.username || 'Adventurer'}</strong> (Lv.{profile.accountLevel})</span>
          </div>
        </div>

        {/* TOAST NOTICE */}
        {notice && (
          <div
            className={`px-3 py-2 text-xs font-bold flex items-center gap-2 border-b shrink-0 ${
              notice.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
          >
            {notice.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="flex-1">{notice.text}</span>
          </div>
        )}

        {/* TAB 1: WORLD CHAT */}
        {activeTab === 'WORLD' && (
          <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6ED] to-[#F5EEDD]">
            {/* World Messages Stream */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
              {worldMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-[#3D2817]">No messages yet in Realm Channel 1</div>
                  <p className="text-xs text-[#7A6348] max-w-sm">
                    Be the first warden to break the silence! Coordinate dungeon strategies, summon results, or send friendly greetings.
                  </p>
                </div>
              ) : (
                worldMessages.map((msg) => {
                  const isMe = msg.senderId === myUserId || msg.senderId === currentUser?.uid;
                  const isSystem = msg.type === 'SYSTEM';
                  const variant = msg.senderAvatarVariantId
                    ? MONSTER_VARIANTS[msg.senderAvatarVariantId]
                    : null;

                  if (isSystem) {
                    return (
                      <div
                        key={msg.id}
                        className="p-3 rounded-2xl bg-gradient-to-r from-amber-100/90 via-yellow-100/80 to-amber-100/90 border border-amber-300/80 shadow-xs flex items-start gap-2.5 text-xs text-amber-950 font-serif"
                      >
                        <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                          <Sparkles className="w-4 h-4 text-amber-100" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-[#683b11]">{msg.senderName}</span>
                            <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-md font-mono">
                              SYSTEM ANNOUNCEMENT
                            </span>
                            <span className="text-[10px] text-[#8C765C] ml-auto font-mono">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          <div className="text-xs text-[#3D2817] mt-0.5 leading-snug">
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 group ${isMe ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <button
                        onClick={() => !isMe && setSelectedPlayerContext(msg)}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-[#D5C29E] overflow-hidden shadow-xs shrink-0 cursor-pointer transition-transform hover:scale-105 ${
                          isMe ? 'ring-2 ring-amber-500' : ''
                        }`}
                        title={!isMe ? `Click to interact with ${msg.senderName}` : 'Your Avatar'}
                      >
                        <MonsterAvatar
                          variantId={msg.senderAvatarVariantId}
                          element={variant?.element}
                          variant={variant}
                          size="sm"
                          className="w-full h-full object-cover"
                        />
                      </button>

                      {/* Message Bubble Container */}
                      <div className={`max-w-[82%] sm:max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                        {/* Sender info line */}
                        <div
                          className={`flex items-center gap-1.5 text-[11px] ${
                            isMe ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <button
                            onClick={() => !isMe && setSelectedPlayerContext(msg)}
                            className="font-bold text-[#2E1F0F] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>{msg.senderName}</span>
                            {msg.senderLevel ? (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded-sm bg-amber-100 text-amber-900 font-bold border border-amber-300">
                                Lv.{msg.senderLevel}
                              </span>
                            ) : null}
                          </button>

                          <span className="text-[10px] text-[#8C765C] font-mono">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>

                        {/* Speech Bubble */}
                        <div
                          className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs break-words ${
                            isMe
                              ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-tr-none'
                              : 'bg-white border border-[#D5C29E] text-[#2E1F0F] rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={worldEndRef} />
            </div>

            {/* Quick Tactical Emotes / Presets Bar */}
            <div className="px-3 py-1.5 bg-[#FAF4E6] border-t border-[#EADBBE] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
              <span className="text-[10px] font-bold text-[#7A6348] shrink-0 uppercase tracking-wider">
                Quick:
              </span>
              {QUICK_REALM_PHRASES.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => setWorldInputText(phrase)}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-100 border border-[#D5C29E] text-[11px] text-[#4A3728] font-medium shrink-0 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                >
                  {phrase}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendWorld}
              className="p-3 sm:p-4 bg-[#F7F2E7] border-t border-[#EBDDBF] flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={worldInputText}
                onChange={(e) => setWorldInputText(e.target.value.slice(0, 300))}
                placeholder="Broadcast to all realm adventurers... (Press Enter to send)"
                className="flex-1 px-4 py-2.5 bg-white border border-[#D5C29E] rounded-2xl text-xs sm:text-sm text-[#2E1F0F] placeholder-[#8C765C] focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-inner"
              />

              <div className="text-[10px] text-[#8C765C] font-mono hidden sm:block">
                {worldInputText.length}/300
              </div>

              <button
                type="submit"
                disabled={!worldInputText.trim() || isSendingWorld}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50 transition-transform active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: PRIVATE CHAT */}
        {activeTab === 'PRIVATE' && (
          <div className="flex-1 flex flex-col sm:flex-row min-h-0 bg-[#FFFDF9]">
            {/* LEFT / MOBILE TOP: CONVERSATIONS SIDEBAR */}
            <div className="w-full sm:w-72 border-b sm:border-b-0 sm:border-r border-[#E3D3B4] bg-[#FAF6ED] flex flex-col shrink-0 max-h-48 sm:max-h-none">
              {/* Sidebar Header */}
              <div className="p-3 border-b border-[#EADBBE] flex items-center justify-between">
                <span className="text-xs font-bold text-[#3D2817] uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  <span>Conversations ({conversations.length})</span>
                </span>

                <button
                  onClick={() => setIsNewChatOpen(!isNewChatOpen)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-bold shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <span>+ New Message</span>
                </button>
              </div>

              {/* New Message Pick Friend Drawer */}
              {isNewChatOpen && (
                <div className="p-3 bg-white border-b border-amber-300 space-y-2 animate-fade-in">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={friendSearchQuery}
                      onChange={(e) => setFriendSearchQuery(e.target.value)}
                      placeholder="Search confirmed friends..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF7F0] border border-[#D5C29E] rounded-xl focus:outline-hidden"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {eligibleNewChatFriends.length === 0 ? (
                      <div className="p-2 text-center text-[11px] text-[#7A6348]">
                        No friends found. Add friends in the Social Hub!
                      </div>
                    ) : (
                      eligibleNewChatFriends.map((f) => (
                        <button
                          key={f.friendUserId}
                          onClick={() => {
                            handleStartPrivateWith({
                              userId: f.friendUserId,
                              displayName: f.displayName,
                              avatarVariantId: f.avatarVariantId,
                              level: f.level,
                            });
                          }}
                          className="w-full p-1.5 rounded-lg hover:bg-amber-50 flex items-center gap-2 text-left cursor-pointer transition-colors"
                        >
                          <div className="w-6 h-6 rounded-lg bg-amber-100 overflow-hidden shrink-0 border border-amber-300">
                            <MonsterAvatar
                              variantId={f.avatarVariantId}
                              size="sm"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#2E1F0F] truncate">
                              {f.displayName}
                            </div>
                            <div className="text-[10px] text-[#7A6348] font-mono">
                              Lv.{f.level}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#EADBBE]/60">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#7A6348] space-y-2">
                    <User className="w-6 h-6 text-amber-500 mx-auto" />
                    <div>No direct messages yet.</div>
                    <p className="text-[11px]">
                      Click "+ New Message" or click any player in World Chat to message them directly!
                    </p>
                  </div>
                ) : (
                  conversations.map((c) => {
                    const isSelected = selectedPartner?.userId === c.userId;
                    const variant = c.avatarVariantId ? MONSTER_VARIANTS[c.avatarVariantId] : null;

                    return (
                      <button
                        key={c.userId}
                        onClick={() => {
                          setSelectedPartner({
                            userId: c.userId,
                            displayName: c.displayName,
                            avatarVariantId: c.avatarVariantId,
                            level: c.level,
                          });
                          setIsNewChatOpen(false);
                        }}
                        className={`w-full p-3 flex items-center gap-2.5 text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-100/90 font-bold border-l-4 border-amber-600'
                            : 'hover:bg-amber-50'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-white border border-[#D5C29E] overflow-hidden shrink-0 shadow-2xs">
                          <MonsterAvatar
                            variantId={c.avatarVariantId}
                            element={variant?.element}
                            variant={variant}
                            size="sm"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#2E1F0F] truncate">
                              {c.displayName}
                            </span>
                            <span className="text-[9px] text-[#8C765C] font-mono">
                              {formatTime(c.lastMessageTimestamp)}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7A6348] truncate leading-tight">
                            {c.lastMessage || 'Start conversation...'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT: ACTIVE THREAD */}
            <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6ED] to-[#F5EEDD]">
              {selectedPartner ? (
                <>
                  {/* Partner Header */}
                  <div className="p-3 sm:px-5 sm:py-3 border-b border-[#EBDDBF] bg-[#F7F2E7]/80 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white border border-amber-300 overflow-hidden shadow-xs shrink-0">
                        <MonsterAvatar
                          variantId={selectedPartner.avatarVariantId}
                          size="sm"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-[#2E1F0F]">
                            {selectedPartner.displayName}
                          </span>
                          {selectedPartner.level && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded-sm bg-amber-100 text-amber-900 font-bold border border-amber-300">
                              Lv.{selectedPartner.level}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#7A6348] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Private Encrypted Frequency</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Companion Shortcuts */}
                    <div className="flex items-center gap-1.5">
                      {onSparBattle && (
                        <button
                          onClick={() => {
                            onClose();
                            onSparBattle({
                              userId: selectedPartner.userId,
                              displayName: selectedPartner.displayName,
                              friendCode: 'MR-FRIEND',
                              level: selectedPartner.level || 1,
                              avatarVariantId: selectedPartner.avatarVariantId || 'var_pyrosaur_fire',
                              isOnline: true,
                              lastActive: new Date().toISOString(),
                            });
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-[11px] font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                          title="Challenge to a sparring match"
                        >
                          <Swords className="w-3 h-3 text-amber-700" />
                          <span className="hidden sm:inline">Spar</span>
                        </button>
                      )}

                      {onOpenProfileModal && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenProfileModal('MAILBOX');
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-[11px] font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                          title="Open Mailbox to send gifts"
                        >
                          <Gift className="w-3 h-3 text-amber-700" />
                          <span className="hidden sm:inline">Send Gift</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages Bubble Stream */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
                    {directMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                        <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="text-sm font-bold text-[#3D2817]">
                          Conversation with {selectedPartner.displayName}
                        </div>
                        <p className="text-xs text-[#7A6348] max-w-xs">
                          Send a greeting, coordinate party builds, or share dungeon strategies!
                        </p>
                      </div>
                    ) : (
                      directMessages.map((msg) => {
                        const isMe = msg.senderId === myUserId || msg.senderId === currentUser?.uid;

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1 text-[10px] text-[#8C765C] mb-0.5 font-mono px-1">
                              <span>{isMe ? 'You' : msg.senderName}</span>
                              <span>•</span>
                              <span>{formatTime(msg.timestamp)}</span>
                            </div>

                            <div
                              className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] sm:max-w-[70%] shadow-xs break-words ${
                                isMe
                                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-tr-none'
                                  : 'bg-white border border-[#D5C29E] text-[#2E1F0F] rounded-tl-none'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={directEndRef} />
                  </div>

                  {/* Input Bar */}
                  <form
                    onSubmit={handleSendDirect}
                    className="p-3 sm:p-4 bg-[#F7F2E7] border-t border-[#EBDDBF] flex items-center gap-2 shrink-0"
                  >
                    <input
                      type="text"
                      value={directInputText}
                      onChange={(e) => setDirectInputText(e.target.value.slice(0, 300))}
                      placeholder={`Send private message to ${selectedPartner.displayName}...`}
                      className="flex-1 px-4 py-2.5 bg-white border border-[#D5C29E] rounded-2xl text-xs sm:text-sm text-[#2E1F0F] placeholder-[#8C765C] focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-inner"
                    />

                    <button
                      type="submit"
                      disabled={!directInputText.trim() || isSendingDirect}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50 transition-transform active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <Users className="w-8 h-8 text-amber-500" />
                  <div className="text-sm font-bold text-[#3D2817]">No Partner Selected</div>
                  <p className="text-xs text-[#7A6348]">
                    Select a conversation on the left or click "+ New Message" to chat with a friend!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INTERACTIVE PLAYER CONTEXT POPUP (When clicking any player in World Chat) */}
        {selectedPlayerContext && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-fade-in"
            onClick={() => setSelectedPlayerContext(null)}
          >
            <div
              className="w-full max-w-xs bg-[#FDFBF7] border-2 border-[#D5C29E] rounded-3xl shadow-2xl p-5 text-[#2E1F0F] space-y-3.5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 overflow-hidden shadow-xs">
                  <MonsterAvatar
                    variantId={selectedPlayerContext.senderAvatarVariantId}
                    size="sm"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-black font-serif text-[#3D2817]">
                    {selectedPlayerContext.senderName}
                  </h4>
                  <div className="text-[11px] text-[#7A6348] font-mono">
                    Account Level {selectedPlayerContext.senderLevel || 1}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#EADBBE]">
                {/* 1. Direct Message */}
                <button
                  onClick={() => {
                    handleStartPrivateWith({
                      userId: selectedPlayerContext.senderId,
                      displayName: selectedPlayerContext.senderName,
                      avatarVariantId: selectedPlayerContext.senderAvatarVariantId,
                      level: selectedPlayerContext.senderLevel,
                    });
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Direct Message</span>
                </button>

                {/* 2. Challenge to Sparring */}
                {onSparBattle && (
                  <button
                    onClick={() => {
                      onClose();
                      onSparBattle({
                        userId: selectedPlayerContext.senderId,
                        displayName: selectedPlayerContext.senderName,
                        friendCode: 'MR-REALM',
                        level: selectedPlayerContext.senderLevel || 1,
                        avatarVariantId: selectedPlayerContext.senderAvatarVariantId || 'var_pyrosaur_fire',
                        isOnline: true,
                        lastActive: new Date().toISOString(),
                      });
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Swords className="w-4 h-4 text-amber-700" />
                    <span>Friendly Spar Match</span>
                  </button>
                )}

                {/* Close popup */}
                <button
                  onClick={() => setSelectedPlayerContext(null)}
                  className="w-full py-2 text-stone-500 hover:text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
