/**
 * Monster Realms - Arena Service (Asynchronous PvP, Defense Teams & Highscores)
 * Connects frontend components to both backend Express API and Firestore for:
 * 1. Managing player's Arena Defense Team.
 * 2. Matchmaking against other summoners' defense lineups.
 * 3. Rating changes, tier promotions, and rewards.
 * 4. Highscore Leaderboard ranking top summoners.
 */

import {
  ArenaProfile,
  ArenaSummoner,
  ArenaMatchResult,
  ArenaBattleLog,
  getArenaTier,
} from '../types/arena';
import { PlayerMonster, PlayerProfile, PvEStage } from '../types';
import { formatErrorCode } from '../utils/errorCodes';
import {
  auth,
  saveFirestoreArenaDefense,
  listenFirestoreArenaLeaderboard,
} from './firebase';

const HEADERS = {
  'Content-Type': 'application/json',
};

/**
 * Fetch player's current Arena profile, rating, rank, and defense power.
 */
export async function fetchArenaProfileApi(playerId: string = 'player_default'): Promise<ArenaProfile> {
  try {
    const res = await fetch('/api/arena/profile', {
      headers: {
        ...HEADERS,
        'x-player-id': playerId,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch arena profile');
    const data = await res.json();
    return data.profile;
  } catch (err) {
    console.warn('[Arena] Profile API fetch fallback:', err);
    // Safe default profile
    return {
      rating: 1000,
      tier: 'BRONZE',
      rank: 25,
      wins: 0,
      losses: 0,
      defenseWins: 0,
      defenseLosses: 0,
      tickets: 10,
      maxTickets: 10,
      nextTicketInSeconds: 0,
      defenseTeam: [],
      defensePower: 0,
    };
  }
}

/**
 * Set and save player's 1-to-5 monster defense lineup.
 */
export async function saveArenaDefenseApi(
  monsterInstanceIds: string[],
  playerId: string = 'player_default'
): Promise<{ success: boolean; defenseTeam: any[]; defensePower: number; profile: ArenaProfile }> {
  const res = await fetch('/api/arena/defense', {
    method: 'POST',
    headers: {
      ...HEADERS,
      'x-player-id': playerId,
    },
    body: JSON.stringify({ monsterInstanceIds }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(formatErrorCode(errData.error, 'Failed to save defense lineup'));
  }

  const data = await res.json();

  // Also sync to Firestore if user is authenticated
  try {
    const user = auth.currentUser;
    if (user && data.summoner) {
      await saveFirestoreArenaDefense(data.summoner);
    }
  } catch (err) {
    console.warn('[Arena] Firestore defense sync warning:', err);
  }

  return data;
}

/**
 * Fetch matched summoners near player's rating.
 */
export async function fetchArenaOpponentsApi(playerId: string = 'player_default'): Promise<ArenaSummoner[]> {
  try {
    const res = await fetch('/api/arena/opponents', {
      headers: {
        ...HEADERS,
        'x-player-id': playerId,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch arena opponents');
    const data = await res.json();
    return data.opponents || [];
  } catch (err) {
    console.warn('[Arena] Opponents API fetch fallback:', err);
    return [];
  }
}

/**
 * Fetch top summoners ranked by rating (Leaderboard / Highscores).
 */
export async function fetchArenaLeaderboardApi(
  searchQuery?: string,
  playerId: string = 'player_default'
): Promise<{ leaderboard: ArenaSummoner[]; playerRank: number; playerEntry: ArenaSummoner }> {
  try {
    const queryParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
    const res = await fetch(`/api/arena/leaderboard${queryParam}`, {
      headers: {
        ...HEADERS,
        'x-player-id': playerId,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch arena leaderboard');
    return await res.json();
  } catch (err) {
    console.warn('[Arena] Leaderboard API fetch fallback:', err);
    return {
      leaderboard: [],
      playerRank: 1,
      playerEntry: {
        userId: playerId,
        displayName: 'Player',
        avatarVariantId: 'pyrosaur_fire',
        level: 1,
        rating: 1000,
        tier: 'BRONZE',
        defensePower: 0,
        defenseMonsters: [],
        wins: 0,
        losses: 0,
      },
    };
  }
}

/**
 * Start an Arena match against an opponent's defense team.
 */
export async function startArenaMatchApi(
  opponentId: string,
  playerId: string = 'player_default'
): Promise<{ success: boolean; stage: PvEStage; remainingTickets: number }> {
  const res = await fetch('/api/arena/match/start', {
    method: 'POST',
    headers: {
      ...HEADERS,
      'x-player-id': playerId,
    },
    body: JSON.stringify({ opponentId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatErrorCode(err.error, 'Failed to initiate arena match'));
  }

  return await res.json();
}

/**
 * Conclude an Arena battle, resolve rating change and award victory bounty.
 */
export async function completeArenaMatchApi(
  stageId: string,
  opponentId: string,
  isVictory: boolean,
  playerId: string = 'player_default'
): Promise<ArenaMatchResult> {
  const res = await fetch('/api/arena/match/complete', {
    method: 'POST',
    headers: {
      ...HEADERS,
      'x-player-id': playerId,
    },
    body: JSON.stringify({ stageId, opponentId, isVictory }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatErrorCode(err.error, 'Failed to resolve arena match'));
  }

  const result: ArenaMatchResult = await res.json();

  // If user is authenticated, update their Firestore defense record rating
  try {
    const user = auth.currentUser;
    if (user && result.newRating) {
      // Background update
      fetchArenaProfileApi(playerId).then((prof) => {
        if (prof) {
          saveFirestoreArenaDefense({
            userId: user.uid,
            displayName: user.displayName || 'Summoner',
            avatarVariantId: prof.defenseTeam[0]?.variantId || 'pyrosaur_fire',
            level: 1,
            rating: result.newRating,
            tier: result.newTier,
            defensePower: prof.defensePower,
            defenseMonsters: prof.defenseTeam,
            wins: prof.wins,
            losses: prof.losses,
          });
        }
      });
    }
  } catch (err) {
    // Ignore firestore background sync errors
  }

  return result;
}

/**
 * Fetch recent Arena battle history (Attacks and Defenses).
 */
export async function fetchArenaLogsApi(playerId: string = 'player_default'): Promise<ArenaBattleLog[]> {
  try {
    const res = await fetch('/api/arena/logs', {
      headers: {
        ...HEADERS,
        'x-player-id': playerId,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch arena logs');
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    console.warn('[Arena] Logs API fetch fallback:', err);
    return [];
  }
}
