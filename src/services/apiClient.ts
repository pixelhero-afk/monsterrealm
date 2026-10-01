/**
 * Frontend API Client
 * Interacts with server-authoritative backend endpoints.
 */

import {
  Continent,
  DailyMissionId,
  EquipmentItem,
  PlayerMonster,
  PlayerProfile,
  PvEStage,
  SummonBanner,
  SummonResult,
  ScrollType,
  RotatingShopData,
  ShopItem,
  NewsItem,
  EventGiftPayload,
} from '../types';
import { formatErrorCode } from '../utils/errorCodes';

const HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-player-id': 'player_default',
  'x-player-email': '',
};

export function setActivePlayerId(id: string | null) {
  HEADERS['x-player-id'] = id || 'player_default';
}

export function setActivePlayerEmail(email: string | null) {
  HEADERS['x-player-email'] = email || '';
}

export function getActivePlayerId(): string {
  return HEADERS['x-player-id'];
}

/**
 * Universal safe API response parser.
 * Prevents HTML SyntaxErrors, translates raw error codes into friendly user messages.
 */
async function handleApiResponse<T = any>(res: Response, fallbackError: string): Promise<T> {
  let data: any = null;
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await res.text();
      if (text.includes('<!doctype') || text.includes('<html')) {
        data = { error: `Server returned an unexpected response (HTTP ${res.status}).` };
      } else {
        data = { error: text };
      }
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const rawError = data?.error || data?.message || `Request failed with status ${res.status}`;
    const friendlyMessage = formatErrorCode(rawError, fallbackError);
    const err = new Error(friendlyMessage);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }

  return (data || {}) as T;
}

export async function restorePlayerState(data: {
  profile: PlayerProfile;
  monsters: PlayerMonster[];
  equipment: EquipmentItem[];
}): Promise<any> {
  const res = await fetch('/api/player/restore', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(data),
  });
  return handleApiResponse(res, 'Failed to restore player state to server');
}

export async function fetchPlayerProfile(): Promise<{
  profile: PlayerProfile;
  monsters: PlayerMonster[];
  equipment: EquipmentItem[];
  banners: SummonBanner[];
  stages: PvEStage[];
  continents: Continent[];
}> {
  const res = await fetch('/api/player/profile', { headers: HEADERS });
  return handleApiResponse(res, 'Failed to fetch player profile');
}

export async function initializeStarterAccount(): Promise<any> {
  const res = await fetch('/api/player/initialize', {
    method: 'POST',
    headers: HEADERS,
  });
  return handleApiResponse(res, 'Failed to initialize starter account');
}

export async function updateTutorialStep(step: number, stepName?: string): Promise<any> {
  const res = await fetch('/api/player/tutorial/step', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ step, stepName }),
  });
  return handleApiResponse(res, 'Failed to update tutorial progress');
}

export async function skipTutorial(): Promise<any> {
  const res = await fetch('/api/player/tutorial/skip', {
    method: 'POST',
    headers: HEADERS,
  });
  return handleApiResponse(res, 'Failed to skip tutorial');
}

export async function levelUpMonster(instanceId: string, levelsToAdd: number = 1): Promise<any> {
  const res = await fetch('/api/monsters/level-up', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ instanceId, levelsToAdd }),
  });
  return handleApiResponse(res, 'Failed to level up monster');
}

export async function awakenMonster(instanceId: string): Promise<any> {
  const res = await fetch('/api/monsters/awaken', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ instanceId }),
  });
  return handleApiResponse(res, 'Failed to awaken monster');
}

export async function toggleEquipment(
  instanceId: string,
  equipmentId: string,
  action: 'EQUIP' | 'UNEQUIP'
): Promise<any> {
  const res = await fetch('/api/monsters/equip', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ instanceId, equipmentId, action }),
  });
  return handleApiResponse(res, 'Failed to update equipment');
}

export async function expandEquipmentInventory(): Promise<{
  success: boolean;
  maxEquipmentSlots: number;
  currencies: any;
  message: string;
}> {
  const res = await fetch('/api/equipment/expand-inventory', {
    method: 'POST',
    headers: HEADERS,
  });
  return handleApiResponse(res, 'Failed to expand equipment inventory');
}

export async function forgeEquipment(options?: {
  slot?: string;
  set?: string;
  rarity?: string;
}): Promise<{
  success: boolean;
  item: any;
  equipment: any[];
  currencies: any;
  message: string;
}> {
  const res = await fetch('/api/equipment/forge', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(options || {}),
  });
  return handleApiResponse(res, 'Failed to forge equipment');
}

export async function dismantleEquipment(equipmentId: string): Promise<{
  success: boolean;
  goldAwarded: number;
  equipment: any[];
  currencies: any;
  message: string;
}> {
  const res = await fetch('/api/equipment/dismantle', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ equipmentId }),
  });
  return handleApiResponse(res, 'Failed to dismantle equipment');
}

export async function performSummon(
  bannerId: string,
  count: number
): Promise<{ results: SummonResult[]; currencies: any; pityCount: number }> {
  const res = await fetch('/api/summon', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ bannerId, count }),
  });
  return handleApiResponse(res, 'Summon operation failed');
}

export async function performScrollSummon(
  scrollType: ScrollType,
  count: number = 1
): Promise<{
  success: boolean;
  results: SummonResult[];
  scrolls: any;
  currencies: any;
  monsters: PlayerMonster[];
}> {
  const res = await fetch('/api/summon/scroll', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ scrollType, count }),
  });
  return handleApiResponse(res, 'Scroll summon operation failed');
}

export async function fetchShop(): Promise<{
  success: boolean;
  shop: RotatingShopData;
  currencies: any;
  scrolls: any;
}> {
  const res = await fetch('/api/shop', {
    method: 'GET',
    headers: HEADERS,
  });
  return handleApiResponse(res, 'Failed to fetch magic shop wares');
}

export async function buyShopItem(itemId: string): Promise<{
  success: boolean;
  item: ShopItem;
  acquiredEquipment?: EquipmentItem | null;
  shop: RotatingShopData;
  currencies: any;
  scrolls: any;
  elementalStones: any;
  equipment: any[];
  message: string;
}> {
  const res = await fetch('/api/shop/buy', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ itemId }),
  });
  return handleApiResponse(res, 'Failed to purchase shop item');
}

export async function refreshShop(): Promise<{
  success: boolean;
  shop: RotatingShopData;
  currencies: any;
  message: string;
}> {
  const res = await fetch('/api/shop/refresh', {
    method: 'POST',
    headers: HEADERS,
  });
  return handleApiResponse(res, 'Failed to refresh magic shop');
}

export async function fetchServerStamina(): Promise<{
  energy: number;
  maxEnergy: number;
  nextRegenSeconds: number;
  serverTime: number;
  regenIntervalSeconds: number;
}> {
  const res = await fetch('/api/player/stamina', {
    method: 'GET',
    headers: HEADERS,
  });
  return handleApiResponse(res, 'Failed to fetch stamina');
}

export async function startPvEBattle(
  stageId: string
): Promise<{
  success: boolean;
  stage: PvEStage;
  remainingEnergy: number;
  currencies: PlayerProfile['currencies'];
}> {
  const res = await fetch('/api/battle/pve/start', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ stageId }),
  });
  return handleApiResponse(res, 'Unable to start battle');
}

export async function completePvEBattle(
  stageId: string,
  isVictory: boolean,
  partySize?: number
): Promise<any> {
  const res = await fetch('/api/battle/pve/complete', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ stageId, isVictory, partySize }),
  });
  return handleApiResponse(res, 'Failed to record battle completion');
}

export async function savePlayerParty(party: string[]): Promise<{ success: boolean; activeParty: string[] }> {
  const res = await fetch('/api/player/party', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ party }),
  });
  return handleApiResponse(res, 'Failed to save party lineup');
}

export async function callDevAction(action: string, payload?: any): Promise<any> {
  const res = await fetch('/api/devtools/action', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ action, payload }),
  });
  return handleApiResponse(res, 'Dev action failed');
}

export async function synthesizeMonsters(
  instanceId1: string,
  instanceId2: string
): Promise<{
  success: boolean;
  newMonster: PlayerMonster;
  variant: any;
  sacrificedNames: string[];
  previousStars: number;
  targetStars: number;
  goldSpent: number;
  currencies: any;
  unequippedItemsCount: number;
  message: string;
}> {
  const res = await fetch('/api/monsters/synthesize', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ instanceId1, instanceId2 }),
  });
  return handleApiResponse(res, 'Synthesis operation failed');
}

export async function toggleMonsterLock(instanceId: string): Promise<{ success: boolean; monster: PlayerMonster; locked: boolean }> {
  const res = await fetch('/api/monsters/toggle-lock', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ instanceId }),
  });
  return handleApiResponse(res, 'Failed to toggle monster lock');
}

export async function changePlayerName(newName: string): Promise<{
  success: boolean;
  message: string;
  username: string;
  hasChangedName: boolean;
  nameChangesCount: number;
  costGems: number;
  currencies: any;
  profile: PlayerProfile;
}> {
  const res = await fetch('/api/player/change-name', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ newName }),
  });
  return handleApiResponse(res, 'Failed to change player name');
}

export async function updatePlayerAvatar(avatarVariantId: string): Promise<{
  success: boolean;
  message: string;
  avatarVariantId: string;
  profile: PlayerProfile;
}> {
  const res = await fetch('/api/player/avatar', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ avatarVariantId }),
  });
  return handleApiResponse(res, 'Failed to update player avatar');
}

export async function claimAccountLevelReward(level?: number, claimAll?: boolean): Promise<{
  success: boolean;
  message: string;
  level?: number;
  claimedLevels?: number[];
  gemsAwarded?: number;
  totalGemsAwarded?: number;
  currencies: any;
  profile: PlayerProfile;
}> {
  const res = await fetch('/api/player/claim-level-reward', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ level, claimAll }),
  });
  return handleApiResponse(res, 'Failed to claim level progression reward');
}

export async function claimDailyMissionApi(missionId: DailyMissionId): Promise<{
  success: boolean;
  message: string;
  missionId: DailyMissionId;
  claimedReward: any;
  profile: PlayerProfile;
  currencies: any;
}> {
  const res = await fetch('/api/player/daily-missions/claim', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ missionId }),
  });
  return handleApiResponse(res, 'Failed to claim daily mission reward');
}

export async function claimDailyAllClearApi(): Promise<{
  success: boolean;
  message: string;
  gemsClaimed: number;
  profile: PlayerProfile;
  currencies: any;
}> {
  const res = await fetch('/api/player/daily-missions/claim-all-clear', {
    method: 'POST',
    headers: HEADERS,
  });
  return handleApiResponse(res, 'Failed to claim all-clear bounty');
}

export async function claimAllDailyMissionsApi(): Promise<{
  success: boolean;
  message: string;
  claimedMissionsCount: number;
  totalEnergyClaimed: number;
  totalSpClaimed: number;
  totalGoldClaimed: number;
  totalGemsClaimed: number;
  allClearClaimed: boolean;
  profile: PlayerProfile;
  currencies: any;
}> {
  const res = await fetch('/api/player/daily-missions/claim-all', {
    method: 'POST',
    headers: HEADERS,
  });
  return handleApiResponse(res, 'Failed to claim all daily missions');
}

export async function reportPlaytimeApi(seconds: number = 5): Promise<{
  success: boolean;
  playtimeSeconds: number;
  profile: PlayerProfile;
}> {
  const res = await fetch('/api/player/playtime', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ seconds }),
  });
  return handleApiResponse(res, 'Failed to report playtime');
}

// ============================================================
// MAILBOX API CLIENT FUNCTIONS
// ============================================================

export async function fetchMailboxApi(): Promise<{
  mailbox: any[];
  unclaimedCount: number;
}> {
  const res = await fetch('/api/player/mailbox', { headers: HEADERS });
  return handleApiResponse(res, 'Failed to fetch mailbox');
}

export async function claimMailApi(mailId: string): Promise<{
  success: boolean;
  claimedItem: any;
  rewardsGained: any;
  profile: PlayerProfile;
  currencies: any;
}> {
  const res = await fetch('/api/player/mailbox/claim', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ mailId }),
  });
  return handleApiResponse(res, 'Failed to claim mail gift');
}

export async function claimAllMailApi(): Promise<{
  success: boolean;
  claimedCount: number;
  totalRewardsGained: any;
  profile: PlayerProfile;
  currencies: any;
}> {
  const res = await fetch('/api/player/mailbox/claim-all', {
    method: 'POST',
    headers: HEADERS,
  });
  return handleApiResponse(res, 'Failed to claim all mail gifts');
}

export async function deleteMailApi(mailId: string): Promise<{
  success: boolean;
  mailbox: any[];
  profile: PlayerProfile;
}> {
  const res = await fetch('/api/player/mailbox/delete', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ mailId }),
  });
  return handleApiResponse(res, 'Failed to delete mail');
}

export async function clearClaimedMailApi(): Promise<{
  success: boolean;
  mailbox: any[];
  profile: PlayerProfile;
}> {
  const res = await fetch('/api/player/mailbox/clear-claimed', {
    method: 'POST',
    headers: HEADERS,
  });
  return handleApiResponse(res, 'Failed to clear claimed mail');
}

export async function sendFriendGiftMailApi(
  targetUserId?: string,
  targetDisplayName?: string,
  note?: string,
  reward?: any
): Promise<{
  success: boolean;
  message: string;
}> {
  const res = await fetch('/api/player/mailbox/send-friend-gift', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ targetUserId, targetDisplayName, note, reward }),
  });
  return handleApiResponse(res, 'Failed to send gift to friend');
}

export async function sendGameGiftMailApi(
  title?: string,
  message?: string,
  reward?: any,
  senderName?: string
): Promise<{
  success: boolean;
  newMail: any;
  profile: PlayerProfile;
}> {
  const res = await fetch('/api/player/mailbox/send-game-gift', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ title, message, reward, senderName }),
  });
  return handleApiResponse(res, 'Failed to dispatch realm game gift');
}

// ============================================================
// News & Announcements API
// ============================================================

export async function getNewsApi(): Promise<{ success: boolean; news: NewsItem[] }> {
  const res = await fetch('/api/news', { headers: HEADERS });
  return handleApiResponse(res, 'Failed to fetch news announcements');
}

export async function saveNewsApi(newsData: Partial<NewsItem>): Promise<{ success: boolean; news: NewsItem; allNews: NewsItem[] }> {
  const res = await fetch('/api/news', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(newsData),
  });
  return handleApiResponse(res, 'Failed to save news announcement');
}

export async function deleteNewsApi(id: string): Promise<{ success: boolean; allNews: NewsItem[] }> {
  const res = await fetch(`/api/news/${id}`, {
    method: 'DELETE',
    headers: HEADERS,
  });
  return handleApiResponse(res, 'Failed to delete news announcement');
}

export async function resetNewsApi(): Promise<{ success: boolean; allNews: NewsItem[] }> {
  const res = await fetch('/api/news/reset', {
    method: 'POST',
    headers: HEADERS,
  });
  return handleApiResponse(res, 'Failed to reset news announcements');
}

// ============================================================
// Summon Banners LiveOps API
// ============================================================

export async function getBannersApi(): Promise<{ success: boolean; banners: SummonBanner[] }> {
  const res = await fetch('/api/banners', { headers: HEADERS });
  return handleApiResponse(res, 'Failed to fetch summon banners');
}

export async function saveBannerApi(banner: SummonBanner): Promise<{ success: boolean; banner: SummonBanner; allBanners: SummonBanner[] }> {
  const res = await fetch('/api/banners', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(banner),
  });
  return handleApiResponse(res, 'Failed to save summon banner');
}

export async function setFeaturedBannerApi(payload: any): Promise<{ success: boolean; banner: SummonBanner; allBanners: SummonBanner[] }> {
  const res = await fetch('/api/banners/set-featured', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });
  return handleApiResponse(res, 'Failed to update featured banner');
}

export async function deleteBannerApi(id: string): Promise<{ success: boolean; allBanners: SummonBanner[] }> {
  const res = await fetch(`/api/banners/${id}`, {
    method: 'DELETE',
    headers: HEADERS,
  });
  return handleApiResponse(res, 'Failed to delete summon banner');
}

export async function resetBannersApi(): Promise<{ success: boolean; allBanners: SummonBanner[] }> {
  const res = await fetch('/api/banners/reset', {
    method: 'POST',
    headers: HEADERS,
  });
  return handleApiResponse(res, 'Failed to reset summon banners');
}

// ============================================================
// Admin Event Gifting API
// ============================================================

export async function getAdminPlayersApi(): Promise<{
  success: boolean;
  players: Array<{
    playerId: string;
    username: string;
    accountLevel: number;
    avatarVariantId: string;
    monstersCount: number;
    currencies: any;
  }>;
}> {
  const res = await fetch('/api/admin/players', { headers: HEADERS });
  return handleApiResponse(res, 'Failed to fetch player accounts');
}

export async function sendAdminGiftApi(payload: EventGiftPayload): Promise<{
  success: boolean;
  recipientsCount: number;
  deliveryMethod: string;
  message: string;
  gift: EventGiftPayload;
}> {
  const res = await fetch('/api/admin/gift', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });
  return handleApiResponse(res, 'Failed to dispatch event gift');
}

export async function getAdminGiftLogsApi(): Promise<{ success: boolean; logs: any[] }> {
  const res = await fetch('/api/admin/gifts/logs', { headers: HEADERS });
  return handleApiResponse(res, 'Failed to fetch event gift logs');
}
