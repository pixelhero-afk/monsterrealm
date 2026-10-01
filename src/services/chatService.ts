/**
 * Monster Realms - Chat Service (World Chat & Private Direct Chat)
 * Handles dual-channel messaging:
 * 1. World Chat: Global real-time broadcast across all realm adventurers.
 * 2. Private Direct Chat: 1-on-1 private messaging with friends and wardens.
 * Synchronizes with Firestore when authenticated, with seamless fallback to Express API endpoints.
 */

import { ChatMessage, DirectConversation, PlayerProfile } from '../types';
import { formatErrorCode } from '../utils/errorCodes';
import {
  listenFirestoreWorldChat,
  sendFirestoreWorldChatMessage,
  listenFirestoreDirectMessages,
  sendFirestoreDirectMessage,
  auth,
} from './firebase';

const HEADERS = {
  'Content-Type': 'application/json',
};

// Preset tactical chat phrases / quick messages for instant combat or realm socialization
export const QUICK_REALM_PHRASES = [
  '👋 Greetings from the elemental sanctuaries!',
  '⚔️ Looking for friendly sparring matches!',
  '✨ Blessed summons to everyone at the Altar!',
  '🔥 Need tactical advice for Continent Bosses!',
  '🎁 Sent daily friendship gifts, please check mailbox!',
  '🛡️ Leveling up my defense team!',
  '💎 Good luck in the Sunken Grotto and Flaming Peaks!',
  '🎉 GG and well played!',
];

/**
 * Fetch World Chat messages from the backend API.
 */
export async function fetchWorldChatApi(limit: number = 50): Promise<ChatMessage[]> {
  try {
    const res = await fetch(`/api/chat/world?limit=${limit}`, { headers: HEADERS });
    if (!res.ok) throw new Error('Failed to fetch world chat');
    const data = await res.json();
    return data.messages || [];
  } catch (err) {
    console.warn('[Chat] API fetch world chat error:', err);
    return [];
  }
}

/**
 * Post a message to World Chat via API.
 */
export async function postWorldChatApi(
  text: string,
  senderName: string,
  senderAvatarVariantId?: string,
  senderLevel?: number,
  playerId?: string
): Promise<ChatMessage> {
  const headers = {
    ...HEADERS,
    ...(playerId ? { 'x-player-id': playerId } : {}),
  };

  const res = await fetch('/api/chat/world', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      text,
      senderName,
      senderAvatarVariantId,
      senderLevel,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatErrorCode(err.error, 'Failed to post message to World Chat'));
  }

  const data = await res.json();
  return data.message;
}

/**
 * Fetch Direct Messages between current player and target user via API.
 */
export async function fetchDirectMessagesApi(
  withUserId: string,
  playerId?: string
): Promise<ChatMessage[]> {
  try {
    const headers = {
      ...HEADERS,
      ...(playerId ? { 'x-player-id': playerId } : {}),
    };
    const res = await fetch(`/api/chat/private?withUserId=${encodeURIComponent(withUserId)}`, {
      headers,
    });
    if (!res.ok) throw new Error('Failed to fetch direct messages');
    const data = await res.json();
    return data.messages || [];
  } catch (err) {
    console.warn('[Chat] API fetch direct messages error:', err);
    return [];
  }
}

/**
 * Post a Direct Message via API.
 */
export async function postDirectMessageApi(
  recipientId: string,
  recipientName: string,
  recipientAvatarVariantId: string | undefined,
  text: string,
  senderName: string,
  senderAvatarVariantId?: string,
  senderLevel?: number,
  playerId?: string
): Promise<ChatMessage> {
  const headers = {
    ...HEADERS,
    ...(playerId ? { 'x-player-id': playerId } : {}),
  };

  const res = await fetch('/api/chat/private', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      recipientId,
      recipientName,
      recipientAvatarVariantId,
      text,
      senderName,
      senderAvatarVariantId,
      senderLevel,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatErrorCode(err.error, 'Failed to send direct message'));
  }

  const data = await res.json();
  return data.message;
}

/**
 * Fetch list of recent direct conversations via API.
 */
export async function fetchConversationsApi(playerId?: string): Promise<DirectConversation[]> {
  try {
    const headers = {
      ...HEADERS,
      ...(playerId ? { 'x-player-id': playerId } : {}),
    };
    const res = await fetch('/api/chat/conversations', { headers });
    if (!res.ok) throw new Error('Failed to fetch conversations');
    const data = await res.json();
    return data.conversations || [];
  } catch (err) {
    console.warn('[Chat] API fetch conversations error:', err);
    return [];
  }
}

/**
 * Unified World Chat sender: dispatches to both backend API and Firestore (if authenticated).
 */
export async function sendWorldChat(
  profile: PlayerProfile,
  text: string,
  currentUser?: any
): Promise<ChatMessage> {
  const senderId = currentUser?.uid || profile.playerId || 'player_default';
  const senderName = profile.username || currentUser?.displayName || 'Adventurer';
  const senderAvatarVariantId = profile.avatarVariantId || 'var_pyrosaur_fire';
  const senderLevel = profile.accountLevel || 1;

  // 1. Post to API for server-authoritative persistence & local fallback
  const createdMsg = await postWorldChatApi(
    text,
    senderName,
    senderAvatarVariantId,
    senderLevel,
    senderId
  );

  // 2. Also propagate to Firestore if authenticated for instant multi-client push
  if (currentUser) {
    sendFirestoreWorldChatMessage({
      ...createdMsg,
      senderId: currentUser.uid,
    }).catch((e) => {
      console.debug('[WorldChat] Firestore broadcast notice:', e);
    });
  }

  return createdMsg;
}

/**
 * Unified Direct Message sender: dispatches to both backend API and Firestore.
 */
export async function sendDirectMessage(
  profile: PlayerProfile,
  recipientId: string,
  recipientName: string,
  recipientAvatarVariantId: string | undefined,
  text: string,
  currentUser?: any
): Promise<ChatMessage> {
  const senderId = currentUser?.uid || profile.playerId || 'player_default';
  const senderName = profile.username || currentUser?.displayName || 'Adventurer';
  const senderAvatarVariantId = profile.avatarVariantId || 'var_pyrosaur_fire';
  const senderLevel = profile.accountLevel || 1;

  const createdMsg = await postDirectMessageApi(
    recipientId,
    recipientName,
    recipientAvatarVariantId,
    text,
    senderName,
    senderAvatarVariantId,
    senderLevel,
    senderId
  );

  if (currentUser) {
    sendFirestoreDirectMessage({
      ...createdMsg,
      senderId: currentUser.uid,
    }).catch((e) => {
      console.debug('[DirectMessage] Firestore broadcast notice:', e);
    });
  }

  return createdMsg;
}
