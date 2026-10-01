/**
 * Monster Realms - Mailbox & Gifts System Service
 * Handles mail items, receiving gifts from friends and from the game, claiming rewards,
 * and maintaining inbox state.
 */

import { MailItem, MailReward, PlayerProfile } from '../types';

export const PRESEEDED_MAIL_IDS = new Set([
  'mail_welcome_high_council',
  'mail_vanguard_provisions',
  'mail_guild_fellowship',
  'mail_friend_elena_gift',
]);

export const STARTER_MAILBOX_GIFTS: MailItem[] = [];

/**
 * Returns a cloned list of default starter mail items.
 */
export function createDefaultMailboxItems(): MailItem[] {
  return [];
}

/**
 * Ensures player profile has a valid mailbox array.
 * Filters out any obsolete preseeded gifts while preserving user gifts.
 */
export function syncMailboxState(profile: PlayerProfile): PlayerProfile {
  const currentMailbox = (profile.mailbox || []).filter(
    (m) => !PRESEEDED_MAIL_IDS.has(m.id)
  );
  return {
    ...profile,
    mailbox: currentMailbox,
  };
}

/**
 * Counts how many unclaimed mail items are waiting for the player.
 */
export function getUnclaimedMailCount(profile: PlayerProfile | null): number {
  if (!profile || !profile.mailbox) return 0;
  return profile.mailbox.filter((m) => !m.isClaimed).length;
}

/**
 * Claims rewards from a single mail item by ID.
 * Returns the updated profile with increased currencies and the mail marked as claimed.
 */
export function claimMailItem(
  profile: PlayerProfile,
  mailId: string
): {
  updatedProfile: PlayerProfile;
  claimedItem: MailItem;
  rewardsGained: MailReward;
} {
  const currentMailbox = profile.mailbox || createDefaultMailboxItems();
  const mailIndex = currentMailbox.findIndex((m) => m.id === mailId);

  if (mailIndex === -1) {
    throw new Error('Mail item not found.');
  }

  const mail = currentMailbox[mailIndex];
  if (mail.isClaimed) {
    throw new Error('This gift has already been claimed!');
  }

  const reward = mail.reward || {};
  const goldToAdd = reward.gold || 0;
  const gemsToAdd = reward.gems || 0;
  const summonPointsToAdd = reward.summonPoints || 0;
  const energyToAdd = reward.energy || 0;

  const currentCurrencies = profile.currencies;
  const newCurrencies = {
    ...currentCurrencies,
    gold: currentCurrencies.gold + goldToAdd,
    gems: currentCurrencies.gems + gemsToAdd,
    summonPoints: currentCurrencies.summonPoints + summonPointsToAdd,
    energy: Math.min(currentCurrencies.energy + energyToAdd, 9999),
  };

  const newScrolls = { ...(profile.scrolls || { normal: 0, epic: 0, legendary: 0, lightDark: 0 }) };
  if (reward.scrolls) {
    if (reward.scrolls.normal) newScrolls.normal = (newScrolls.normal || 0) + reward.scrolls.normal;
    if (reward.scrolls.epic) newScrolls.epic = (newScrolls.epic || 0) + reward.scrolls.epic;
    if (reward.scrolls.legendary) newScrolls.legendary = (newScrolls.legendary || 0) + reward.scrolls.legendary;
    if (reward.scrolls.lightDark) newScrolls.lightDark = (newScrolls.lightDark || 0) + reward.scrolls.lightDark;
  }

  const newStones: any = { ...(profile.elementalStones || {}) };
  if (reward.stones) {
    Object.entries(reward.stones).forEach(([el, amounts]) => {
      if (!newStones[el]) newStones[el] = { small: 0, medium: 0, huge: 0 };
      if (amounts.small) newStones[el].small = (newStones[el].small || 0) + amounts.small;
      if (amounts.medium) newStones[el].medium = (newStones[el].medium || 0) + amounts.medium;
      if (amounts.huge) newStones[el].huge = (newStones[el].huge || 0) + amounts.huge;
    });
  }

  const updatedMailbox = [...currentMailbox];
  const updatedMail: MailItem = {
    ...mail,
    isClaimed: true,
    isRead: true,
  };
  updatedMailbox[mailIndex] = updatedMail;

  const updatedProfile: PlayerProfile = {
    ...profile,
    currencies: newCurrencies,
    scrolls: newScrolls,
    elementalStones: newStones,
    mailbox: updatedMailbox,
    updatedAt: Date.now(),
  };

  return {
    updatedProfile,
    claimedItem: updatedMail,
    rewardsGained: {
      gold: goldToAdd,
      gems: gemsToAdd,
      summonPoints: summonPointsToAdd,
      energy: energyToAdd,
      scrolls: reward.scrolls,
      stones: reward.stones,
      monsters: reward.monsters,
    },
  };
}

/**
 * Claims all currently unclaimed mail items in the mailbox.
 * Aggregates currencies into player profile and marks all items as claimed.
 */
export function claimAllMail(profile: PlayerProfile): {
  updatedProfile: PlayerProfile;
  claimedCount: number;
  totalRewardsGained: MailReward;
} {
  const currentMailbox = profile.mailbox || createDefaultMailboxItems();
  const unclaimed = currentMailbox.filter((m) => !m.isClaimed);

  if (unclaimed.length === 0) {
    return {
      updatedProfile: profile,
      claimedCount: 0,
      totalRewardsGained: {},
    };
  }

  let totalGold = 0;
  let totalGems = 0;
  let totalSP = 0;
  let totalEnergy = 0;
  const totalScrolls = { normal: 0, epic: 0, legendary: 0, lightDark: 0 };
  const totalStones: Record<string, { small: number; medium: number; huge: number }> = {};

  unclaimed.forEach((item) => {
    const r = item.reward || {};
    totalGold += r.gold || 0;
    totalGems += r.gems || 0;
    totalSP += r.summonPoints || 0;
    totalEnergy += r.energy || 0;

    if (r.scrolls) {
      if (r.scrolls.normal) totalScrolls.normal += r.scrolls.normal;
      if (r.scrolls.epic) totalScrolls.epic += r.scrolls.epic;
      if (r.scrolls.legendary) totalScrolls.legendary += r.scrolls.legendary;
      if (r.scrolls.lightDark) totalScrolls.lightDark += r.scrolls.lightDark;
    }

    if (r.stones) {
      Object.entries(r.stones).forEach(([el, amounts]) => {
        if (!totalStones[el]) totalStones[el] = { small: 0, medium: 0, huge: 0 };
        if (amounts.small) totalStones[el].small += amounts.small;
        if (amounts.medium) totalStones[el].medium += amounts.medium;
        if (amounts.huge) totalStones[el].huge += amounts.huge;
      });
    }
  });

  const updatedMailbox = currentMailbox.map((item) => {
    if (!item.isClaimed) {
      return {
        ...item,
        isClaimed: true,
        isRead: true,
      };
    }
    return item;
  });

  const cur = profile.currencies;
  const newCurrencies = {
    ...cur,
    gold: cur.gold + totalGold,
    gems: cur.gems + totalGems,
    summonPoints: cur.summonPoints + totalSP,
    energy: Math.min(cur.energy + totalEnergy, 9999),
  };

  const newScrolls = { ...(profile.scrolls || { normal: 0, epic: 0, legendary: 0, lightDark: 0 }) };
  newScrolls.normal = (newScrolls.normal || 0) + totalScrolls.normal;
  newScrolls.epic = (newScrolls.epic || 0) + totalScrolls.epic;
  newScrolls.legendary = (newScrolls.legendary || 0) + totalScrolls.legendary;
  newScrolls.lightDark = (newScrolls.lightDark || 0) + totalScrolls.lightDark;

  const newStones: any = { ...(profile.elementalStones || {}) };
  Object.entries(totalStones).forEach(([el, amounts]) => {
    if (!newStones[el]) newStones[el] = { small: 0, medium: 0, huge: 0 };
    newStones[el].small = (newStones[el].small || 0) + amounts.small;
    newStones[el].medium = (newStones[el].medium || 0) + amounts.medium;
    newStones[el].huge = (newStones[el].huge || 0) + amounts.huge;
  });

  const updatedProfile: PlayerProfile = {
    ...profile,
    currencies: newCurrencies,
    scrolls: newScrolls,
    elementalStones: newStones,
    mailbox: updatedMailbox,
    updatedAt: Date.now(),
  };

  return {
    updatedProfile,
    claimedCount: unclaimed.length,
    totalRewardsGained: {
      gold: totalGold,
      gems: totalGems,
      summonPoints: totalSP,
      energy: totalEnergy,
      scrolls: totalScrolls,
      stones: totalStones,
    },
  };
}

/**
 * Deletes a mail item by ID.
 */
export function deleteMailItem(profile: PlayerProfile, mailId: string): PlayerProfile {
  const currentMailbox = profile.mailbox || [];
  return {
    ...profile,
    mailbox: currentMailbox.filter((m) => m.id !== mailId),
    updatedAt: Date.now(),
  };
}

/**
 * Clears all already-claimed mail items from the mailbox.
 */
export function clearClaimedMail(profile: PlayerProfile): PlayerProfile {
  const currentMailbox = profile.mailbox || [];
  return {
    ...profile,
    mailbox: currentMailbox.filter((m) => !m.isClaimed),
    updatedAt: Date.now(),
  };
}

/**
 * Marks a specific mail item as read.
 */
export function markMailAsRead(profile: PlayerProfile, mailId: string): PlayerProfile {
  const currentMailbox = profile.mailbox || [];
  return {
    ...profile,
    mailbox: currentMailbox.map((m) => (m.id === mailId ? { ...m, isRead: true } : m)),
  };
}

/**
 * Adds an incoming gift mail from a friend.
 */
export function addFriendGiftMail(
  profile: PlayerProfile,
  senderName: string,
  senderFriendCode?: string,
  senderAvatarVariantId?: string,
  note?: string,
  customReward?: MailReward
): {
  updatedProfile: PlayerProfile;
  newMail: MailItem;
} {
  const newMail: MailItem = {
    id: `mail_friend_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    senderType: 'FRIEND',
    senderName,
    senderFriendCode,
    senderAvatarVariantId: senderAvatarVariantId || 'var_nekohime_grass',
    title: `Gift from ${senderName}`,
    message: note || 'A warm friendship gift from your fellow adventurer! Keep up the great battle!',
    reward: customReward || {
      gold: 2500,
      summonPoints: 20,
      energy: 10,
    },
    isClaimed: false,
    isRead: false,
    sentAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };

  const updatedMailbox = [newMail, ...(profile.mailbox || [])];
  return {
    updatedProfile: {
      ...profile,
      mailbox: updatedMailbox,
      updatedAt: Date.now(),
    },
    newMail,
  };
}

/**
 * Adds an official game / realm supply gift to the player's mailbox.
 */
export function addGameGiftMail(
  profile: PlayerProfile,
  title: string,
  message: string,
  reward: MailReward,
  senderName: string = 'Realm High Council'
): {
  updatedProfile: PlayerProfile;
  newMail: MailItem;
} {
  const newMail: MailItem = {
    id: `mail_game_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    senderType: 'GAME',
    senderName,
    title,
    message,
    reward,
    isClaimed: false,
    isRead: false,
    sentAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
  };

  const updatedMailbox = [newMail, ...(profile.mailbox || [])];
  return {
    updatedProfile: {
      ...profile,
      mailbox: updatedMailbox,
      updatedAt: Date.now(),
    },
    newMail,
  };
}
