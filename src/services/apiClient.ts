/**
 * Frontend API Client
 * Interacts with server-authoritative backend endpoints.
 */

import {
  Continent,
  EquipmentItem,
  PlayerMonster,
  PlayerProfile,
  PvEStage,
  SummonBanner,
  SummonResult,
} from '../types';

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
  if (!res.ok) throw new Error('Failed to restore player state to server');
  return res.json();
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
  if (!res.ok) throw new Error('Failed to fetch player profile');
  return res.json();
}

export async function initializeStarterAccount(): Promise<any> {
  const res = await fetch('/api/player/initialize', {
    method: 'POST',
    headers: HEADERS,
  });
  if (!res.ok) throw new Error('Failed to initialize starter account');
  return res.json();
}

export async function updateTutorialStep(step: number, stepName?: string): Promise<any> {
  const res = await fetch('/api/player/tutorial/step', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ step, stepName }),
  });
  return res.json();
}

export async function skipTutorial(): Promise<any> {
  const res = await fetch('/api/player/tutorial/skip', {
    method: 'POST',
    headers: HEADERS,
  });
  return res.json();
}

export async function levelUpMonster(instanceId: string, levelsToAdd: number = 1): Promise<any> {
  const res = await fetch('/api/monsters/level-up', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ instanceId, levelsToAdd }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to level up');
  }
  return res.json();
}

export async function awakenMonster(instanceId: string): Promise<any> {
  const res = await fetch('/api/monsters/awaken', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ instanceId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to awaken');
  }
  return res.json();
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
  return res.json();
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
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to expand inventory');
  }
  return res.json();
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
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to forge equipment');
  }
  return res.json();
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
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to dismantle equipment');
  }
  return res.json();
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
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Summon failed');
  }
  return res.json();
}

export async function startPvEBattle(stageId: string): Promise<any> {
  const res = await fetch('/api/battle/pve/start', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ stageId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Unable to start battle');
  }
  return res.json();
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
  return res.json();
}

export async function savePlayerParty(party: string[]): Promise<{ success: boolean; activeParty: string[] }> {
  const res = await fetch('/api/player/party', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ party }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save party');
  }
  return res.json();
}

export async function callDevAction(action: string, payload?: any): Promise<any> {
  const res = await fetch('/api/devtools/action', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ action, payload }),
  });
  return res.json();
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
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Synthesis failed');
  }
  return res.json();
}

export async function toggleMonsterLock(instanceId: string): Promise<{ success: boolean; monster: PlayerMonster; locked: boolean }> {
  const res = await fetch('/api/monsters/toggle-lock', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ instanceId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to toggle lock');
  }
  return res.json();
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
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to change profile name');
  }
  return res.json();
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
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update avatar');
  }
  return res.json();
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
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to claim level progression reward');
  }
  return res.json();
}

