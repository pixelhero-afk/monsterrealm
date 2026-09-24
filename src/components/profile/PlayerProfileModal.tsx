/**
 * Monster Realms - Player Profile, Avatar Selection & Level Progression Rewards Modal
 *
 * Features:
 * 1. Profile Name Change:
 *    - First change is FREE (0 Gems)
 *    - Subsequent changes cost 500 Gems
 * 2. Avatar Selection:
 *    - Browse and equip avatar from unlocked monster portraits
 * 3. Account Level Progression Rewards:
 *    - Level 2, 3, 4 -> 50 Gems each
 *    - Level 5 -> 100 Gems
 *    - Level 10 -> 200 Gems
 *    - Milestone tracks with single and "Claim All" functionality
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  User,
  Pencil,
  Gem,
  Award,
  Sparkles,
  Check,
  Lock,
  ChevronRight,
  Shield,
  Gift,
  Coins,
  AlertCircle,
  CheckCircle2,
  Crown,
  Camera,
  Layers,
  Flame,
  Droplets,
  Leaf,
  Sun,
  Moon,
} from 'lucide-react';
import {
  ElementType,
  MonsterVariant,
  PlayerMonster,
  PlayerProfile,
  isDevAccount,
} from '../../types';
import { MONSTER_VARIANTS } from '../../data/monsters';
import { MonsterAvatar } from '../MonsterAvatar';
import {
  changePlayerName,
  claimAccountLevelReward,
  updatePlayerAvatar,
} from '../../services/apiClient';
import {
  getAllAccountLevelRewards,
  getExpToNextAccountLevel,
  getUnclaimedRewards,
  MAX_ACCOUNT_LEVEL,
} from '../../services/accountProgression';
import { updateUserPublicProfile } from '../../services/firebase';
import { getAuth } from 'firebase/auth';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile | null;
  monsters: PlayerMonster[];
  onProfileUpdated: (updatedProfile: PlayerProfile) => void;
  initialTab?: 'OVERVIEW' | 'REWARDS' | 'AVATAR';
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  monsters,
  onProfileUpdated,
  initialTab = 'OVERVIEW',
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REWARDS' | 'AVATAR'>(initialTab);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(profile?.username || '');
  const [isSubmittingName, setIsSubmittingName] = useState<boolean>(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [avatarFilterElement, setAvatarFilterElement] = useState<ElementType | 'ALL'>('ALL');
  const [isSavingAvatar, setIsSavingAvatar] = useState<boolean>(false);

  const [isClaimingReward, setIsClaimingReward] = useState<boolean>(false);
  const [noticeMessage, setNoticeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state when profile changes
  React.useEffect(() => {
    if (profile) {
      setNameInput(profile.username);
    }
  }, [profile?.username]);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setNoticeMessage(null);
      setNameError(null);
    }
  }, [isOpen, initialTab]);

  // Unlocked monster variants set (from player's owned monster collection + starters)
  const unlockedVariantIdSet = useMemo(() => {
    const set = new Set<string>();
    // Default starter variants always available
    set.add('var_pyrosaur_fire');
    set.add('var_nekohime_grass');
    set.add('var_tideguard_water');
    set.add('var_floraweaver_grass');
    set.add('var_shadowstalker_dark');

    // Add all monsters currently in player's roster
    (monsters || []).forEach((m) => {
      if (m && m.variantId) {
        set.add(m.variantId);
      }
    });

    return set;
  }, [monsters]);

  // All variants catalog grouped into unlocked and locked
  const { unlockedVariants, lockedVariants } = useMemo(() => {
    const allVariants = Object.values(MONSTER_VARIANTS).filter((v) => !v.disabled);
    const unlocked: MonsterVariant[] = [];
    const locked: MonsterVariant[] = [];

    allVariants.forEach((v) => {
      if (unlockedVariantIdSet.has(v.variantId)) {
        unlocked.push(v);
      } else {
        locked.push(v);
      }
    });

    return { unlockedVariants: unlocked, lockedVariants: locked };
  }, [unlockedVariantIdSet]);

  const filteredUnlockedVariants = useMemo(() => {
    if (avatarFilterElement === 'ALL') return unlockedVariants;
    return unlockedVariants.filter((v) => v.element === avatarFilterElement);
  }, [unlockedVariants, avatarFilterElement]);

  const currentGems = profile?.currencies?.gems || 0;
  const activeAvatarVariant = useMemo(() => {
    return profile?.avatarVariantId ? MONSTER_VARIANTS[profile.avatarVariantId] : null;
  }, [profile?.avatarVariantId]);
  const hasChangedName = !!profile?.hasChangedName;
  const nameChangeCost = hasChangedName ? 500 : 0;
  const canAffordNameChange = currentGems >= nameChangeCost;

  // Progression math
  const expToNext = getExpToNextAccountLevel(profile?.accountLevel || 1);
  const currentExp = profile?.experience || 0;
  const expPercent = Math.min(100, Math.floor((currentExp / expToNext) * 100));

  const allMilestoneRewards = getAllAccountLevelRewards(30);
  const unclaimedRewards = profile ? getUnclaimedRewards(profile) : [];
  const totalUnclaimedGems = unclaimedRewards.reduce((s, r) => s + r.gems, 0);

  const showToast = (type: 'success' | 'error', text: string) => {
    setNoticeMessage({ type, text });
    setTimeout(() => {
      setNoticeMessage(null);
    }, 4000);
  };

  // Name change handler
  const handleSaveName = async () => {
    if (!profile) return;
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Adventurer name cannot be empty.');
      return;
    }
    if (trimmed.length < 2 || trimmed.length > 20) {
      setNameError('Adventurer name must be between 2 and 20 characters.');
      return;
    }
    if (trimmed === profile.username) {
      setIsEditingName(false);
      return;
    }
    if (nameChangeCost > 0 && currentGems < nameChangeCost) {
      setNameError(`Insufficient Gems! You need 500 Gems to change your name again. (Current: ${currentGems})`);
      return;
    }

    try {
      setIsSubmittingName(true);
      setNameError(null);
      const res = await changePlayerName(trimmed);
      onProfileUpdated(res.profile);

      // Sync to public Firebase user card if logged in
      const auth = getAuth();
      if (auth.currentUser) {
        updateUserPublicProfile(auth.currentUser.uid, {
          displayName: trimmed,
        }).catch((err) => console.warn('Cloud sync error for name:', err));
      }

      setIsEditingName(false);
      showToast(
        'success',
        nameChangeCost > 0
          ? `Name updated to "${trimmed}" (-500 Gems)!`
          : `First free name change claimed! Welcome, ${trimmed}!`
      );
    } catch (err: any) {
      setNameError(err.message || 'Failed to update adventurer name');
    } finally {
      setIsSubmittingName(false);
    }
  };

  // Avatar select handler
  const handleSelectAvatar = async (variantId: string) => {
    if (!profile || variantId === profile.avatarVariantId) return;

    try {
      setIsSavingAvatar(true);
      const res = await updatePlayerAvatar(variantId);
      onProfileUpdated(res.profile);

      // Sync to public Firebase user card if logged in
      const auth = getAuth();
      if (auth.currentUser) {
        updateUserPublicProfile(auth.currentUser.uid, {
          avatarVariantId: variantId,
        }).catch((err) => console.warn('Cloud sync error for avatar:', err));
      }

      showToast('success', 'Profile avatar updated successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update profile avatar');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // Claim level reward handler
  const handleClaimReward = async (level?: number, claimAll: boolean = false) => {
    try {
      setIsClaimingReward(true);
      const res = await claimAccountLevelReward(level, claimAll);
      onProfileUpdated(res.profile);

      showToast(
        'success',
        claimAll
          ? `Claimed all milestone rewards! +${res.totalGemsAwarded} Gems added to your treasury!`
          : `Claimed Level ${res.level} milestone! +${res.gemsAwarded} Gems!`
      );
    } catch (err: any) {
      showToast('error', err.message || 'Failed to claim progression reward');
    } finally {
      setIsClaimingReward(false);
    }
  };

  const getElementColor = (elem: ElementType) => {
    switch (elem) {
      case 'FIRE':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'WATER':
        return 'text-sky-500 bg-sky-50 border-sky-200';
      case 'GRASS':
        return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      case 'LIGHT':
        return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'DARK':
        return 'text-purple-500 bg-purple-50 border-purple-200';
    }
  };

  if (!isOpen || !profile) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#FDFBF7] border-2 border-[#D5C29E] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-[#2E1F0F]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ornate Top Bar */}
        <div className="h-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[#EBDDBF] bg-[#F7F2E7]/80 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-xs border border-amber-300">
              <Crown className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black font-serif text-[#3D2817] tracking-wide">
                Adventurer Profile & Progression
              </h2>
              <p className="text-[11px] sm:text-xs text-[#7A6348]">
                Manage your realm identity, unlocked avatar portraits, and account level gems
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#7A6348] hover:text-[#2E1F0F] hover:bg-[#EADBBE] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notice */}
        {noticeMessage && (
          <div
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 shrink-0 ${
              noticeMessage.type === 'success'
                ? 'bg-emerald-100 text-emerald-800 border-b border-emerald-300'
                : 'bg-rose-100 text-rose-800 border-b border-rose-300'
            }`}
          >
            {noticeMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span className="flex-1">{noticeMessage.text}</span>
          </div>
        )}

        {/* HERO ADVENTURER PROFILE CARD */}
        <div className="p-4 sm:p-6 bg-gradient-to-br from-[#FFFDF9] via-[#FAF4E6] to-[#F5ECD8] border-b border-[#E3D3B4] shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Avatar & Identity */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 p-0.5 shadow-md ring-2 ring-amber-300/80 overflow-hidden flex items-center justify-center">
                  <MonsterAvatar
                    variantId={profile.avatarVariantId}
                    element={activeAvatarVariant?.element}
                    variant={activeAvatarVariant}
                    size="lg"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => setActiveTab('AVATAR')}
                  className="absolute -bottom-1.5 -right-1.5 bg-[#854D0E] hover:bg-[#B45309] text-white p-1.5 rounded-full shadow-md border-2 border-amber-200 transition-transform active:scale-95 cursor-pointer"
                  title="Choose Avatar from unlocked monster portraits"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1">
                {/* Username & Edit */}
                <div className="flex flex-wrap items-center gap-2">
                  {!isEditingName ? (
                    <>
                      <span className="text-lg sm:text-2xl font-black font-serif text-[#2E1F0F]">
                        {profile.username}
                      </span>
                      <button
                        onClick={() => {
                          setIsEditingName(true);
                          setNameInput(profile.username);
                          setNameError(null);
                        }}
                        className="p-1 text-[#854D0E] hover:text-[#B45309] hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                        title={
                          hasChangedName
                            ? 'Change Profile Name (Costs 500 Gems)'
                            : 'Change Profile Name (1st Change is FREE!)'
                        }
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Owner badge */}
                      {(isDevAccount(profile.username) ||
                        isDevAccount(getAuth().currentUser?.email)) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200 border border-amber-400 text-amber-900 text-[10px] sm:text-xs font-black shadow-2xs">
                          <Crown className="w-3 h-3 text-amber-700" />
                          Owner
                        </span>
                      )}

                      {/* Name change badge */}
                      {!hasChangedName ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] sm:text-xs font-bold shadow-2xs">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          1 Free Name Change
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] sm:text-xs font-semibold shadow-2xs">
                          <Gem className="w-3 h-3 text-purple-600" />
                          Rename: 500 Gems
                        </span>
                      )}
                    </>
                  ) : (
                    /* Inline name edit form */
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          maxLength={20}
                          placeholder="Enter Adventurer Name..."
                          className="px-2.5 py-1 text-sm bg-white border-2 border-amber-400 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-bold text-[#2E1F0F] w-44 sm:w-56"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveName}
                          disabled={isSubmittingName}
                          className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingName ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingName(false);
                            setNameInput(profile.username);
                            setNameError(null);
                          }}
                          className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Cost breakdown */}
                      <div className="text-[11px] font-semibold flex items-center gap-1.5">
                        {!hasChangedName ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            First name change is <strong>FREE</strong> (0 Gems)!
                          </span>
                        ) : (
                          <span
                            className={`flex items-center gap-1 ${
                              canAffordNameChange ? 'text-amber-800' : 'text-rose-600 font-bold'
                            }`}
                          >
                            <Gem className="w-3 h-3 text-purple-600" />
                            Cost: 500 Gems (You have {currentGems} Gems)
                            {!canAffordNameChange && ' — Insufficient Gems!'}
                          </span>
                        )}
                      </div>

                      {nameError && (
                        <span className="text-[11px] text-rose-600 font-bold">{nameError}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Account Level & EXP Bar */}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-xs font-black text-[#854D0E] bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md shadow-2xs font-mono">
                    Lv. {profile.accountLevel}
                  </span>
                  <div className="w-32 sm:w-48 h-3 bg-stone-200 rounded-full overflow-hidden border border-stone-300 relative shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${expPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs text-[#7A6348] font-mono">
                    {currentExp} / {expToNext} EXP
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Overview Badges */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 w-full sm:w-auto border-t sm:border-t-0 border-[#EBDDBF] pt-2 sm:pt-0">
              {/* Unclaimed Rewards Button / Alert */}
              {unclaimedRewards.length > 0 ? (
                <button
                  onClick={() => setActiveTab('REWARDS')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-md animate-pulse cursor-pointer border border-yellow-200"
                >
                  <Gift className="w-4 h-4" />
                  <span>{unclaimedRewards.length} Rewards Ready ({totalUnclaimedGems} Gems)</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-[#7A6348] font-semibold bg-[#F5EEDD] border border-[#DDD0B5] px-2.5 py-1 rounded-xl">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>All level rewards claimed</span>
                </div>
              )}

              {/* Roster & Avatar Stats */}
              <div className="flex items-center gap-2 text-[11px] text-[#8C765C]">
                <span>
                  Unlocked Portraits: <strong className="text-[#3D2817] font-mono">{unlockedVariants.length}</strong>
                </span>
                <span>•</span>
                <span>
                  Treasury: <strong className="text-purple-700 font-mono">{currentGems} Gems</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-[#E3D3B4] bg-[#F7F2E7]/60 px-4 sm:px-6 shrink-0 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('REWARDS')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === 'REWARDS'
                ? 'border-amber-600 text-amber-900 bg-[#FDFBF7]'
                : 'border-transparent text-[#7A6348] hover:text-[#2E1F0F]'
            }`}
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>Account Level Rewards</span>
            {unclaimedRewards.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {unclaimedRewards.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('AVATAR')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === 'AVATAR'
                ? 'border-amber-600 text-amber-900 bg-[#FDFBF7]'
                : 'border-transparent text-[#7A6348] hover:text-[#2E1F0F]'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-600" />
            <span>Unlocked Monster Avatars</span>
            <span className="bg-stone-200 text-stone-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {unlockedVariants.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`hidden sm:flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'border-amber-600 text-amber-900 bg-[#FDFBF7]'
                : 'border-transparent text-[#7A6348] hover:text-[#2E1F0F]'
            }`}
          >
            <User className="w-4 h-4 text-amber-600" />
            <span>Identity Details</span>
          </button>
        </div>

        {/* TAB 1: ACCOUNT LEVEL PROGRESSION REWARDS */}
        {activeTab === 'REWARDS' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Banner info */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-100 via-amber-50 to-yellow-50 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Account Level Milestone Progression
                </div>
                <p className="text-[11px] sm:text-xs text-[#7A6348] leading-relaxed">
                  Clear campaign stages and expedition trials to gain Account EXP. Levels 2, 3, and 4 award{' '}
                  <strong className="text-purple-700">50 Gems</strong>, Level 5 awards{' '}
                  <strong className="text-purple-700">100 Gems</strong>, Level 10 awards{' '}
                  <strong className="text-purple-700">200 Gems</strong>, and more!
                </p>
              </div>

              {unclaimedRewards.length > 0 && (
                <button
                  onClick={() => handleClaimReward(undefined, true)}
                  disabled={isClaimingReward}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 transition-transform active:scale-95"
                >
                  <Gift className="w-4 h-4" />
                  <span>Claim All ({totalUnclaimedGems} Gems)</span>
                </button>
              )}
            </div>

            {/* Progression List */}
            <div className="space-y-2">
              {allMilestoneRewards.map((milestone) => {
                const isReached = profile.accountLevel >= milestone.level;
                const isClaimed = (profile.claimedLevelRewards || []).includes(milestone.level);
                const isReadyToClaim = isReached && !isClaimed;

                return (
                  <div
                    key={milestone.level}
                    className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all ${
                      isReadyToClaim
                        ? 'bg-[#FFFBEB] border-amber-400 shadow-sm ring-1 ring-amber-300'
                        : isClaimed
                        ? 'bg-[#F9F7F1] border-[#E3D3B4] opacity-75'
                        : 'bg-white border-[#EADBBE]'
                    }`}
                  >
                    {/* Level Badge & Description */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center font-black font-serif shadow-xs border ${
                          isReadyToClaim
                            ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white border-amber-300'
                            : isClaimed
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-stone-100 text-stone-500 border-stone-300'
                        }`}
                      >
                        <span className="text-[9px] uppercase font-bold leading-none">Lv.</span>
                        <span className="text-base sm:text-lg leading-tight font-mono">{milestone.level}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-[#2E1F0F]">
                            Level {milestone.level} Progression
                          </span>
                          {milestone.level === 5 && (
                            <span className="text-[9px] uppercase tracking-wider font-extrabold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-md">
                              Milestone
                            </span>
                          )}
                          {milestone.level % 10 === 0 && (
                            <span className="text-[9px] uppercase tracking-wider font-extrabold bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded-md">
                              Major Milestone
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#7A6348]">{milestone.description}</p>
                      </div>
                    </div>

                    {/* Reward & Claim CTA */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 font-bold text-xs sm:text-sm shadow-2xs">
                        <Gem className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                        <span>+{milestone.gems} Gems</span>
                      </div>

                      {isReadyToClaim ? (
                        <button
                          onClick={() => handleClaimReward(milestone.level, false)}
                          disabled={isClaimingReward}
                          className="px-3 sm:px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer transition-transform active:scale-95 flex items-center gap-1"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Claim</span>
                        </button>
                      ) : isClaimed ? (
                        <div className="flex items-center gap-1 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Claimed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-3 py-1 bg-stone-100 border border-stone-200 text-stone-500 rounded-xl text-xs font-semibold">
                          <Lock className="w-3 h-3" />
                          <span>Reach Lv.{milestone.level}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: AVATAR SELECTION (UNLOCKED MONSTER PORTRAITS) */}
        {activeTab === 'AVATAR' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Banner info */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#F7F2E7] border border-[#D5C29E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs sm:text-sm font-black text-[#2E1F0F] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-700" />
                  Unlocked Monster Avatar Portraits
                </div>
                <p className="text-[11px] sm:text-xs text-[#7A6348]">
                  Select your adventurer avatar from monsters you have summoned or unlocked. Summon new elemental
                  variants to expand your portrait gallery!
                </p>
              </div>

              <div className="text-xs font-bold text-[#854D0E] bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full shrink-0">
                {unlockedVariants.length} / {Object.keys(MONSTER_VARIANTS).length} Portraits Unlocked
              </div>
            </div>

            {/* Element Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
              <button
                onClick={() => setAvatarFilterElement('ALL')}
                className={`px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
                  avatarFilterElement === 'ALL'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-white text-[#7A6348] border-[#D5C29E] hover:bg-[#F7F2E7]'
                }`}
              >
                All ({unlockedVariants.length})
              </button>
              {(['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK'] as ElementType[]).map((elem) => {
                const count = unlockedVariants.filter((v) => v.element === elem).length;
                return (
                  <button
                    key={elem}
                    onClick={() => setAvatarFilterElement(elem)}
                    className={`px-3 py-1.5 rounded-full border cursor-pointer transition-all flex items-center gap-1.5 ${
                      avatarFilterElement === elem
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white text-[#7A6348] border-[#D5C29E] hover:bg-[#F7F2E7]'
                    }`}
                  >
                    <span>{elem}</span>
                    <span className="text-[10px] opacity-80 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* UNLOCKED PORTRAITS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredUnlockedVariants.map((variant) => {
                const isSelected = profile.avatarVariantId === variant.variantId;
                const elemClass = getElementColor(variant.element);

                return (
                  <div
                    key={variant.variantId}
                    className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center text-center group cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFFBEB] border-amber-500 shadow-md ring-2 ring-amber-300'
                        : 'bg-white border-[#E3D3B4] hover:border-amber-400 hover:shadow-sm'
                    }`}
                    onClick={() => handleSelectAvatar(variant.variantId)}
                  >
                    {/* Active Avatar Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" />
                        <span>Active</span>
                      </div>
                    )}

                    {/* Portrait Avatar */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-xs border border-amber-200 p-0.5 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center my-1 group-hover:scale-105 transition-transform">
                      <MonsterAvatar
                        variantId={variant.variantId}
                        element={variant.element}
                        variant={variant}
                        size="md"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <span className="text-xs sm:text-sm font-black font-serif text-[#2E1F0F] truncate w-full mt-1">
                      {variant.name}
                    </span>

                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${elemClass}`}>
                        {variant.element}
                      </span>
                    </div>

                    {/* Equip button */}
                    <button
                      disabled={isSelected || isSavingAvatar}
                      className={`mt-2.5 w-full py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs'
                      }`}
                    >
                      {isSelected ? 'Equipped' : 'Equip Avatar'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* LOCKED PREVIEW SECTION */}
            {lockedVariants.length > 0 && (
              <div className="pt-4 border-t border-[#E3D3B4]">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-[#7A6348] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-stone-500" />
                    Locked Portraits ({lockedVariants.length} Remaining)
                  </div>
                  <span className="text-[11px] text-[#8C765C]">Acquire in Summons to unlock</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 opacity-60">
                  {lockedVariants.slice(0, 8).map((variant) => (
                    <div
                      key={variant.variantId}
                      className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 flex items-center gap-2.5"
                    >
                      <div className="w-9 h-9 rounded-lg bg-stone-200 flex items-center justify-center text-stone-500 shrink-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-stone-700 truncate">{variant.name}</div>
                        <div className="text-[10px] text-stone-500">{variant.element}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: IDENTITY DETAILS (Quick Overview) */}
        {activeTab === 'OVERVIEW' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name Details Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#E3D3B4] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#7A6348] uppercase tracking-wider">
                    Profile Name Policy
                  </span>
                  {!hasChangedName ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      1 Free Change
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                      Costs 500 Gems
                    </span>
                  )}
                </div>

                <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#EADBBE] space-y-1">
                  <div className="text-xs text-[#7A6348]">Current Adventurer Name:</div>
                  <div className="text-base font-black font-serif text-[#2E1F0F]">{profile.username}</div>
                  <div className="text-[11px] text-[#8C765C]">
                    Total name changes made:{' '}
                    <strong className="font-mono">{profile.nameChangesCount || 0}</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsEditingName(true);
                    setNameInput(profile.username);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>
                    {!hasChangedName ? 'Change Name (FREE)' : 'Change Name (500 Gems)'}
                  </span>
                </button>
              </div>

              {/* Avatar Policy Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#E3D3B4] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#7A6348] uppercase tracking-wider">
                    Monster Avatar Gallery
                  </span>
                  <span className="text-xs font-bold text-amber-800 font-mono">
                    {unlockedVariants.length} Unlocked
                  </span>
                </div>

                <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#EADBBE] flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-200 overflow-hidden shrink-0 border border-amber-300">
                    <MonsterAvatar
                      variantId={profile.avatarVariantId}
                      element={activeAvatarVariant?.element}
                      variant={activeAvatarVariant}
                      size="sm"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#2E1F0F]">
                      {MONSTER_VARIANTS[profile.avatarVariantId]?.name || 'Pyrosaur'}
                    </div>
                    <div className="text-[11px] text-[#7A6348]">Active Adventurer Portrait</div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('AVATAR')}
                  className="w-full py-2 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 rounded-xl text-xs font-black shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Browse Unlocked Portraits</span>
                </button>
              </div>
            </div>

            {/* Level Milestones Quick Summary */}
            <div className="p-4 rounded-2xl bg-white border border-[#E3D3B4] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#7A6348] uppercase tracking-wider">
                  Milestone Gem Track
                </span>
                <button
                  onClick={() => setActiveTab('REWARDS')}
                  className="text-xs text-amber-800 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View All Milestones</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[10px] uppercase font-bold text-[#854D0E]">Lv. 2-4</div>
                  <div className="text-sm font-black text-purple-700 font-mono">50 Gems ea</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[10px] uppercase font-bold text-[#854D0E]">Lv. 5</div>
                  <div className="text-sm font-black text-purple-700 font-mono">100 Gems</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[10px] uppercase font-bold text-[#854D0E]">Lv. 10</div>
                  <div className="text-sm font-black text-purple-700 font-mono">200 Gems</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[10px] uppercase font-bold text-[#854D0E]">Lv. 30</div>
                  <div className="text-sm font-black text-purple-700 font-mono">500 Gems</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-[#EBDDBF] bg-[#F7F2E7]/80 shrink-0">
          <div className="text-[11px] text-[#7A6348]">
            Monster Realms • Realm Warden Identity v1.0
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gradient-to-r from-stone-600 to-stone-700 hover:from-stone-700 hover:to-stone-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
