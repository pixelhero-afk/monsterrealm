/**
 * Monster Realms - Daily Missions Service
 * Manages daily quest progression, 24h reset cycles, playtime tracking,
 * stamina/SP/gold reward claims, and the 100 Gems All-Clear Grand Bounty.
 */

import {
  DailyMissionDefinition,
  DailyMissionId,
  DailyMissionProgress,
  DailyMissionsData,
  PlayerProfile,
  Currencies,
} from '../types';

export const DAILY_MISSION_DEFINITIONS: Record<DailyMissionId, DailyMissionDefinition> = {
  DAILY_LOGIN: {
    id: 'DAILY_LOGIN',
    title: 'Daily Check-In',
    description: 'Log in to Monster Realms today to claim daily warden rations.',
    target: 1,
    reward: {
      energy: 30, // Stamina
      gold: 2000,
    },
    icon: 'LogIn',
  },
  WIN_BATTLES: {
    id: 'WIN_BATTLES',
    title: 'Win 3 Battles',
    description: 'Achieve victory in 3 battles across Campaign, Dungeons, or Arena.',
    target: 3,
    reward: {
      summonPoints: 50, // SP
      gold: 3000,
    },
    icon: 'Swords',
    actionTab: 'PVE',
  },
  SUMMON_MONSTER: {
    id: 'SUMMON_MONSTER',
    title: 'Summon a Monster',
    description: 'Conduct at least 1 summon invocation at the Astral Portal.',
    target: 1,
    reward: {
      energy: 40, // Stamina
      summonPoints: 30, // SP
    },
    icon: 'Sparkles',
    actionTab: 'SUMMON',
  },
  PLAYTIME_1H: {
    id: 'PLAYTIME_1H',
    title: 'Play for One Hour',
    description: 'Spend 1 hour (60 minutes) actively adventuring across the realms.',
    target: 3600, // 3600 seconds = 60 minutes
    reward: {
      energy: 50, // Stamina
      summonPoints: 50, // SP
    },
    icon: 'Clock',
  },
};

export const ALL_CLEAR_REWARD_GEMS = 100;

/**
 * Returns today's UTC date key in format "YYYY-MM-DD"
 */
export function getTodayDateKey(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

/**
 * Calculates remaining seconds until the next 00:00:00 UTC day reset.
 */
export function getSecondsUntilNextReset(): number {
  const now = new Date();
  const nextReset = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return Math.max(0, Math.floor((nextReset.getTime() - now.getTime()) / 1000));
}

/**
 * Formats seconds into HH:MM:SS
 */
export function formatRemainingTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}h ${minutes
    .toString()
    .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}

/**
 * Formats playtime display (e.g. "45m 20s / 60m" or "60m / 60m")
 */
export function formatPlaytimeProgress(seconds: number): string {
  const clamped = Math.min(3600, seconds);
  const minutes = Math.floor(clamped / 60);
  const sec = clamped % 60;
  if (clamped >= 3600) {
    return '60m / 60m (Complete)';
  }
  return `${minutes}m ${sec}s / 60m`;
}

/**
 * Generates an initial clean daily missions data structure for the given date.
 * Daily login is automatically credited immediately upon logging in/opening the game.
 */
export function createDefaultDailyMissions(dateKey: string = getTodayDateKey()): DailyMissionsData {
  return {
    dateKey,
    allClearClaimed: false,
    playtimeSeconds: 0,
    lastPlaytimeTrackedAt: Date.now(),
    missions: {
      DAILY_LOGIN: {
        id: 'DAILY_LOGIN',
        current: 1,
        target: 1,
        completed: true,
        claimed: false,
      },
      WIN_BATTLES: {
        id: 'WIN_BATTLES',
        current: 0,
        target: 3,
        completed: false,
        claimed: false,
      },
      SUMMON_MONSTER: {
        id: 'SUMMON_MONSTER',
        current: 0,
        target: 1,
        completed: false,
        claimed: false,
      },
      PLAYTIME_1H: {
        id: 'PLAYTIME_1H',
        current: 0,
        target: 3600,
        completed: false,
        claimed: false,
      },
    },
  };
}

/**
 * Ensures a player profile's daily missions data is initialized and up to date for today.
 * If the date has rolled over, resets to a fresh daily missions board.
 * Automatically marks DAILY_LOGIN as completed.
 */
export function syncDailyMissionsState(profile: PlayerProfile): PlayerProfile {
  const todayKey = getTodayDateKey();
  let daily = profile.dailyMissions;

  if (!daily || daily.dateKey !== todayKey) {
    daily = createDefaultDailyMissions(todayKey);
    return {
      ...profile,
      dailyMissions: daily,
      updatedAt: Date.now(),
    };
  }

  // Ensure all mission keys exist (in case new mission types were added)
  let changed = false;
  const updatedMissions = { ...daily.missions };

  // Always verify login is completed for today
  if (!updatedMissions.DAILY_LOGIN) {
    updatedMissions.DAILY_LOGIN = {
      id: 'DAILY_LOGIN',
      current: 1,
      target: 1,
      completed: true,
      claimed: false,
    };
    changed = true;
  } else if (!updatedMissions.DAILY_LOGIN.completed) {
    updatedMissions.DAILY_LOGIN.current = 1;
    updatedMissions.DAILY_LOGIN.completed = true;
    changed = true;
  }

  if (!updatedMissions.WIN_BATTLES) {
    updatedMissions.WIN_BATTLES = {
      id: 'WIN_BATTLES',
      current: 0,
      target: 3,
      completed: false,
      claimed: false,
    };
    changed = true;
  }

  if (!updatedMissions.SUMMON_MONSTER) {
    updatedMissions.SUMMON_MONSTER = {
      id: 'SUMMON_MONSTER',
      current: 0,
      target: 1,
      completed: false,
      claimed: false,
    };
    changed = true;
  }

  if (!updatedMissions.PLAYTIME_1H) {
    updatedMissions.PLAYTIME_1H = {
      id: 'PLAYTIME_1H',
      current: daily.playtimeSeconds || 0,
      target: 3600,
      completed: (daily.playtimeSeconds || 0) >= 3600,
      claimed: false,
    };
    changed = true;
  }

  if (changed) {
    return {
      ...profile,
      dailyMissions: {
        ...daily,
        missions: updatedMissions,
      },
      updatedAt: Date.now(),
    };
  }

  return profile;
}

/**
 * Increments active playtime by a specified number of seconds.
 */
export function recordPlaytimeTick(profile: PlayerProfile, secondsToAdd: number): PlayerProfile {
  const syncedProfile = syncDailyMissionsState(profile);
  const daily = syncedProfile.dailyMissions!;

  const newPlaytime = Math.max(0, (daily.playtimeSeconds || 0) + secondsToAdd);
  const playMission = daily.missions.PLAYTIME_1H;

  const isCompleted = newPlaytime >= 3600;
  const updatedPlayMission: DailyMissionProgress = {
    ...playMission,
    current: Math.min(3600, newPlaytime),
    completed: isCompleted,
  };

  return {
    ...syncedProfile,
    dailyMissions: {
      ...daily,
      playtimeSeconds: newPlaytime,
      lastPlaytimeTrackedAt: Date.now(),
      missions: {
        ...daily.missions,
        PLAYTIME_1H: updatedPlayMission,
      },
    },
    updatedAt: Date.now(),
  };
}

/**
 * Records a battle victory (PvE, Dungeon, or Arena).
 */
export function recordBattleWinProgress(profile: PlayerProfile): PlayerProfile {
  const syncedProfile = syncDailyMissionsState(profile);
  const daily = syncedProfile.dailyMissions!;
  const mission = daily.missions.WIN_BATTLES;

  if (mission.completed && mission.claimed) {
    return syncedProfile;
  }

  const newCurrent = Math.min(mission.target, (mission.current || 0) + 1);
  const isCompleted = newCurrent >= mission.target;

  return {
    ...syncedProfile,
    dailyMissions: {
      ...daily,
      missions: {
        ...daily.missions,
        WIN_BATTLES: {
          ...mission,
          current: newCurrent,
          completed: isCompleted,
        },
      },
    },
    updatedAt: Date.now(),
  };
}

/**
 * Records a summon invocation at the Astral Portal.
 */
export function recordSummonProgress(profile: PlayerProfile, count: number = 1): PlayerProfile {
  const syncedProfile = syncDailyMissionsState(profile);
  const daily = syncedProfile.dailyMissions!;
  const mission = daily.missions.SUMMON_MONSTER;

  if (mission.completed && mission.claimed) {
    return syncedProfile;
  }

  const newCurrent = Math.min(mission.target, (mission.current || 0) + count);
  const isCompleted = newCurrent >= mission.target;

  return {
    ...syncedProfile,
    dailyMissions: {
      ...daily,
      missions: {
        ...daily.missions,
        SUMMON_MONSTER: {
          ...mission,
          current: newCurrent,
          completed: isCompleted,
        },
      },
    },
    updatedAt: Date.now(),
  };
}

/**
 * Claims the reward for an individual completed daily mission.
 * Adds Stamina (energy), SP (summonPoints), Gold, and/or Gems directly to profile.currencies.
 */
export function claimDailyMission(
  profile: PlayerProfile,
  missionId: DailyMissionId
): { profile: PlayerProfile; claimedReward: DailyMissionDefinition['reward'] } {
  const syncedProfile = syncDailyMissionsState(profile);
  const daily = syncedProfile.dailyMissions!;
  const mission = daily.missions[missionId];
  const def = DAILY_MISSION_DEFINITIONS[missionId];

  if (!mission || !mission.completed || mission.claimed) {
    throw new Error('Mission is not ready to claim or has already been claimed.');
  }

  const cur = syncedProfile.currencies;
  const reward = def.reward;

  const updatedCurrencies: Currencies = {
    ...cur,
    energy: Math.min(cur.maxEnergy + 200, (cur.energy || 0) + (reward.energy || 0)),
    summonPoints: (cur.summonPoints || 0) + (reward.summonPoints || 0),
    gold: (cur.gold || 0) + (reward.gold || 0),
    gems: (cur.gems || 0) + (reward.gems || 0),
  };

  const updatedMissions = {
    ...daily.missions,
    [missionId]: {
      ...mission,
      claimed: true,
    },
  };

  const updatedProfile: PlayerProfile = {
    ...syncedProfile,
    currencies: updatedCurrencies,
    dailyMissions: {
      ...daily,
      missions: updatedMissions,
    },
    updatedAt: Date.now(),
  };

  return { profile: updatedProfile, claimedReward: reward };
}

/**
 * Claims the 100 Gems All-Clear Grand Reward when all 4 daily missions are completed and claimed.
 */
export function claimAllClearBonus(profile: PlayerProfile): {
  profile: PlayerProfile;
  gemsClaimed: number;
} {
  const syncedProfile = syncDailyMissionsState(profile);
  const daily = syncedProfile.dailyMissions!;

  if (daily.allClearClaimed) {
    throw new Error('All-Clear 100 Gems bonus has already been claimed today.');
  }

  const missionIds: DailyMissionId[] = ['DAILY_LOGIN', 'WIN_BATTLES', 'SUMMON_MONSTER', 'PLAYTIME_1H'];
  const allMissionsClaimed = missionIds.every((id) => daily.missions[id]?.claimed);

  if (!allMissionsClaimed) {
    throw new Error('You must complete and claim all 4 daily missions to receive the 100 Gems bonus!');
  }

  const updatedCurrencies: Currencies = {
    ...syncedProfile.currencies,
    gems: (syncedProfile.currencies.gems || 0) + ALL_CLEAR_REWARD_GEMS,
  };

  const updatedProfile: PlayerProfile = {
    ...syncedProfile,
    currencies: updatedCurrencies,
    dailyMissions: {
      ...daily,
      allClearClaimed: true,
    },
    updatedAt: Date.now(),
  };

  return { profile: updatedProfile, gemsClaimed: ALL_CLEAR_REWARD_GEMS };
}

/**
 * Claims all currently completed but unclaimed daily missions in one action.
 * If all 4 missions become claimed, also automatically claims the 100 Gems All-Clear Grand Bounty.
 */
export function claimAllAvailableDailyMissions(profile: PlayerProfile): {
  profile: PlayerProfile;
  claimedMissionsCount: number;
  totalEnergyClaimed: number;
  totalSpClaimed: number;
  totalGoldClaimed: number;
  totalGemsClaimed: number;
  allClearClaimed: boolean;
} {
  let currentProfile = syncDailyMissionsState(profile);
  const missionIds: DailyMissionId[] = ['DAILY_LOGIN', 'WIN_BATTLES', 'SUMMON_MONSTER', 'PLAYTIME_1H'];

  let claimedCount = 0;
  let totalEnergy = 0;
  let totalSp = 0;
  let totalGold = 0;
  let totalGems = 0;

  for (const id of missionIds) {
    const m = currentProfile.dailyMissions?.missions[id];
    if (m && m.completed && !m.claimed) {
      const res = claimDailyMission(currentProfile, id);
      currentProfile = res.profile;
      claimedCount++;
      totalEnergy += res.claimedReward.energy || 0;
      totalSp += res.claimedReward.summonPoints || 0;
      totalGold += res.claimedReward.gold || 0;
      totalGems += res.claimedReward.gems || 0;
    }
  }

  let allClearClaimedNow = false;
  const isAllEligibleForGrandBounty =
    missionIds.every((id) => currentProfile.dailyMissions?.missions[id]?.claimed) &&
    !currentProfile.dailyMissions?.allClearClaimed;

  if (isAllEligibleForGrandBounty) {
    const grandRes = claimAllClearBonus(currentProfile);
    currentProfile = grandRes.profile;
    totalGems += grandRes.gemsClaimed;
    allClearClaimedNow = true;
  }

  return {
    profile: currentProfile,
    claimedMissionsCount: claimedCount,
    totalEnergyClaimed: totalEnergy,
    totalSpClaimed: totalSp,
    totalGoldClaimed: totalGold,
    totalGemsClaimed: totalGems,
    allClearClaimed: allClearClaimedNow,
  };
}

/**
 * Counts how many missions are currently ready to be claimed, plus the all-clear bonus if claimable.
 */
export function getUnclaimedDailyMissionsCount(daily?: DailyMissionsData): number {
  if (!daily || !daily.missions) return 0;

  const missionIds: DailyMissionId[] = ['DAILY_LOGIN', 'WIN_BATTLES', 'SUMMON_MONSTER', 'PLAYTIME_1H'];
  let count = 0;

  let allClaimed = true;
  for (const id of missionIds) {
    const m = daily.missions[id];
    if (m?.completed && !m.claimed) {
      count++;
    }
    if (!m?.claimed) {
      allClaimed = false;
    }
  }

  // If all 4 are claimed but grand chest not claimed yet, add 1 badge notification!
  if (allClaimed && !daily.allClearClaimed) {
    count++;
  }

  return count;
}

/**
 * Returns overall completion ratio: [completedCount, totalCount]
 */
export function getMissionsProgressSummary(daily?: DailyMissionsData): {
  completedCount: number;
  claimedCount: number;
  totalCount: number;
  allClearReady: boolean;
  allClearClaimed: boolean;
} {
  const missionIds: DailyMissionId[] = ['DAILY_LOGIN', 'WIN_BATTLES', 'SUMMON_MONSTER', 'PLAYTIME_1H'];
  if (!daily || !daily.missions) {
    return {
      completedCount: 0,
      claimedCount: 0,
      totalCount: missionIds.length,
      allClearReady: false,
      allClearClaimed: false,
    };
  }

  let completedCount = 0;
  let claimedCount = 0;

  for (const id of missionIds) {
    const m = daily.missions[id];
    if (m?.completed) completedCount++;
    if (m?.claimed) claimedCount++;
  }

  const allClearReady = claimedCount === missionIds.length && !daily.allClearClaimed;

  return {
    completedCount,
    claimedCount,
    totalCount: missionIds.length,
    allClearReady,
    allClearClaimed: !!daily.allClearClaimed,
  };
}
