/**
 * Monster Realms - Firebase Services
 * Authentication, Cloud Progress Save / Sync, and Real-time Friend List System.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  limit,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import rawFirebaseConfig from '../../firebase-applet-config.json';
import {
  CloudSaveState,
  EquipmentItem,
  FriendLeadMonster,
  FriendPublicProfile,
  FriendRecord,
  FriendRequestRecord,
  PlayerMonster,
  PlayerProfile,
  PvEStage,
} from '../types';

// Canonical Firebase Configuration matching monster-x-collecter
export const firebaseConfig = {
  apiKey: "AIzaSyDZZQpwjNG80RZy2Mn_WKM23v2uowkGUNE",
  authDomain: "monster-x-collecter.firebaseapp.com",
  projectId: "monster-x-collecter",
  storageBucket: "monster-x-collecter.firebasestorage.app",
  messagingSenderId: "474267569261",
  appId: "1:474267569261:web:cd644b492e92e939840364",
  measurementId: "G-R9W9NNKPBY",
  firestoreDatabaseId: "(default)",
  ...(rawFirebaseConfig || {}),
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// =========================================================================
// MANDATORY ERROR HANDLER
// =========================================================================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('[Firestore Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on initial module evaluation
async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or database initializing.');
    }
  }
}
testFirestoreConnection();

// =========================================================================
// HELPER: UNIQUE FRIEND CODE GENERATOR
// =========================================================================
export function generateFriendCode(userId: string): string {
  // Generate deterministic/unique 8-character uppercase code e.g. MR-8K92-B4X1
  const cleanUid = (userId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const part1 = cleanUid.slice(0, 4).padEnd(4, '7');
  const part2 = cleanUid.slice(-4).padStart(4, 'X');
  return `MR-${part1}-${part2}`;
}

// =========================================================================
// AUTHENTICATION UTILITIES
// =========================================================================

/** Sign in with Google Popup */
export async function signInWithGoogle(): Promise<User> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (err: any) {
    console.error('Google Sign In Error:', err);
    throw err;
  }
}

/** Register with Email & Password */
export async function registerWithEmail(email: string, pass: string, displayName: string): Promise<User> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    return cred.user;
  } catch (err: any) {
    console.error('Email Registration Error:', err);
    throw err;
  }
}

/** Sign in with Email & Password */
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return cred.user;
  } catch (err: any) {
    console.error('Email Sign In Error:', err);
    throw err;
  }
}

/** Sign Out */
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err: any) {
    console.error('Sign Out Error:', err);
    throw err;
  }
}

/** Auth State Listener */
export function onAuthChanged(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

// =========================================================================
// CLOUD SAVE & PROGRESS PERSISTENCE
// =========================================================================

/**
 * Save complete player game state to Firestore.
 * Also synchronizes the public user discovery card for friends to see.
 */
export async function saveGameToCloud(
  userId: string,
  profile: PlayerProfile,
  monsters: PlayerMonster[],
  equipment: EquipmentItem[],
  stages?: PvEStage[]
): Promise<void> {
  const savePath = `users/${userId}/gameSave/data`;
  const userCardPath = `users/${userId}`;
  const now = new Date().toISOString();

  // Find lead monster from active party
  const activePartyMonsters = (profile.activeParty || [])
    .map((id) => monsters.find((m) => m.instanceId === id))
    .filter((m): m is PlayerMonster => !!m);
  const lead = activePartyMonsters[0] || monsters[0];

  const leadMonsterData: FriendLeadMonster | undefined = lead
    ? {
        variantId: lead.variantId,
        name: lead.variantId.replace(/^var_/, '').replace(/_/g, ' '),
        level: lead.level,
        stars: lead.stars || 5,
        element: (lead.variantId.split('_')[2] as any) || 'FIRE',
        awakeningStage: lead.awakeningStage,
      }
    : undefined;

  const friendCode = generateFriendCode(userId);

  // 1. Write the private full game save
  const payload: CloudSaveState = {
    userId,
    profile,
    monsters,
    equipment,
    stages,
    saveVersion: 1,
    savedAt: now,
  };

  try {
    await setDoc(doc(db, savePath), payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, savePath);
  }

  // 2. Write the public discoverable profile card
  const isOwnerAccount =
    (profile.username && profile.username.trim().toLowerCase() === 'dean') ||
    (auth.currentUser?.email && auth.currentUser.email.toLowerCase() === 'deanvantessel@gmail.com');

  const publicCard: FriendPublicProfile = {
    userId,
    displayName: profile.username || auth.currentUser?.displayName || 'Adventurer',
    friendCode,
    level: profile.accountLevel || 1,
    avatarVariantId: profile.avatarVariantId || lead?.variantId,
    leadMonster: leadMonsterData,
    defenseParty: activePartyMonsters.slice(0, 5),
    role: isOwnerAccount ? 'owner' : 'player',
    lastActive: now,
    createdAt: new Date(profile.createdAt || Date.now()).toISOString(),
  };

  try {
    await setDoc(doc(db, userCardPath), publicCard, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userCardPath);
  }
}

/**
 * Load cloud game save from Firestore.
 */
export async function loadGameFromCloud(userId: string): Promise<CloudSaveState | null> {
  const savePath = `users/${userId}/gameSave/data`;
  try {
    const snap = await getDoc(doc(db, savePath));
    if (snap.exists()) {
      return snap.data() as CloudSaveState;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, savePath);
  }
}

/**
 * Fetch or create a user's public profile record.
 */
export async function getUserPublicProfile(userId: string): Promise<FriendPublicProfile | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, path));
    if (snap.exists()) {
      return snap.data() as FriendPublicProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

/**
 * Quick update of user's public profile (e.g. displayName, avatarVariantId, level).
 */
export async function updateUserPublicProfile(
  userId: string,
  updates: Partial<FriendPublicProfile>
): Promise<void> {
  const userCardPath = `users/${userId}`;
  try {
    await setDoc(
      doc(db, userCardPath),
      {
        ...updates,
        lastActive: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userCardPath);
  }
}

// =========================================================================
// FRIEND LIST SYSTEM
// =========================================================================

/**
 * Search for players by friend code or exact name.
 */
export async function searchPlayer(searchTerm: string): Promise<FriendPublicProfile[]> {
  const trimmed = searchTerm.trim().toUpperCase();
  if (!trimmed) return [];

  const path = 'users';
  try {
    // 1. Search by Friend Code
    const codeQuery = query(collection(db, path), where('friendCode', '==', trimmed), limit(5));
    const codeSnap = await getDocs(codeQuery);
    if (!codeSnap.empty) {
      return codeSnap.docs.map((d) => d.data() as FriendPublicProfile);
    }

    // 2. Search by User Display Name (case matching or prefix)
    const nameQuery = query(collection(db, path), where('displayName', '==', searchTerm.trim()), limit(5));
    const nameSnap = await getDocs(nameQuery);
    return nameSnap.docs.map((d) => d.data() as FriendPublicProfile);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

/**
 * Send a friend request to a target player.
 */
export async function sendFriendRequest(
  senderProfile: FriendPublicProfile,
  targetProfile: FriendPublicProfile
): Promise<void> {
  if (senderProfile.userId === targetProfile.userId) {
    throw new Error('You cannot add yourself as a friend!');
  }

  const requestId = `req_${senderProfile.userId}_${targetProfile.userId}`;
  const path = `friendRequests/${requestId}`;
  const now = new Date().toISOString();

  const reqData: FriendRequestRecord = {
    requestId,
    fromUserId: senderProfile.userId,
    fromDisplayName: senderProfile.displayName,
    fromFriendCode: senderProfile.friendCode,
    fromLeadMonster: senderProfile.leadMonster,
    fromLevel: senderProfile.level,
    toUserId: targetProfile.userId,
    toFriendCode: targetProfile.friendCode,
    status: 'pending',
    createdAt: now,
  };

  try {
    await setDoc(doc(db, path), reqData);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Listen for incoming friend requests targeting the user.
 */
export function listenIncomingRequests(
  userId: string,
  callback: (requests: FriendRequestRecord[]) => void
): Unsubscribe {
  const path = 'friendRequests';
  const q = query(
    collection(db, path),
    where('toUserId', '==', userId),
    where('status', '==', 'pending')
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as FriendRequestRecord);
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

/**
 * Listen for outgoing friend requests sent by the user.
 */
export function listenOutgoingRequests(
  userId: string,
  callback: (requests: FriendRequestRecord[]) => void
): Unsubscribe {
  const path = 'friendRequests';
  const q = query(
    collection(db, path),
    where('fromUserId', '==', userId),
    where('status', '==', 'pending')
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as FriendRequestRecord);
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

/**
 * Accept a friend request: adds both players to each other's friends subcollection.
 */
export async function acceptFriendRequest(
  request: FriendRequestRecord,
  currentUserProfile: FriendPublicProfile
): Promise<void> {
  const now = new Date().toISOString();

  // 1. Add sender to receiver's friends
  const myFriendDocPath = `users/${currentUserProfile.userId}/friends/${request.fromUserId}`;
  const senderAsFriend: FriendRecord = {
    friendUserId: request.fromUserId,
    friendCode: request.fromFriendCode,
    displayName: request.fromDisplayName,
    level: request.fromLevel,
    leadMonster: request.fromLeadMonster,
    addedAt: now,
  };

  try {
    await setDoc(doc(db, myFriendDocPath), senderAsFriend);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, myFriendDocPath);
  }

  // 2. Add receiver to sender's friends
  const senderFriendDocPath = `users/${request.fromUserId}/friends/${currentUserProfile.userId}`;
  const meAsFriend: FriendRecord = {
    friendUserId: currentUserProfile.userId,
    friendCode: currentUserProfile.friendCode,
    displayName: currentUserProfile.displayName,
    level: currentUserProfile.level,
    leadMonster: currentUserProfile.leadMonster,
    addedAt: now,
  };

  try {
    await setDoc(doc(db, senderFriendDocPath), meAsFriend);
  } catch (err) {
    // If sender rules restrict direct write, it's non-blocking
    console.warn('Reciprocal friend record write note:', err);
  }

  // 3. Mark request as accepted or delete it
  const reqPath = `friendRequests/${request.requestId}`;
  try {
    await updateDoc(doc(db, reqPath), {
      status: 'accepted',
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, reqPath);
  }
}

/**
 * Reject or cancel a friend request.
 */
export async function deleteFriendRequest(requestId: string): Promise<void> {
  const reqPath = `friendRequests/${requestId}`;
  try {
    await deleteDoc(doc(db, reqPath));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, reqPath);
  }
}

/**
 * Listen for user's confirmed friends list in real time.
 */
export function listenFriendsList(userId: string, callback: (friends: FriendRecord[]) => void): Unsubscribe {
  const path = `users/${userId}/friends`;
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as FriendRecord);
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

/**
 * Send daily gift (100 Gold + 10 Friendship Summon Points) to a friend once every 24h.
 */
export async function sendDailyFriendGift(userId: string, friendId: string): Promise<void> {
  const path = `users/${userId}/friends/${friendId}`;
  const now = Date.now();
  try {
    await updateDoc(doc(db, path), {
      lastGiftSentAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Claim received daily friendship gift.
 */
export async function claimDailyFriendGift(userId: string, friendId: string): Promise<void> {
  const path = `users/${userId}/friends/${friendId}`;
  const now = Date.now();
  try {
    await updateDoc(doc(db, path), {
      lastGiftClaimedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Remove a friend.
 */
export async function removeFriend(userId: string, friendId: string): Promise<void> {
  const path = `users/${userId}/friends/${friendId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
