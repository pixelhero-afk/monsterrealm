/**
 * Monster Realms - Daily Missions Modal
 * High-fantasy daily bounties interface with 24h countdown, progress tracking,
 * one-click reward claiming, and the 100 Gems All-Clear Grand Bounty.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Swords,
  LogIn,
  Clock,
  CheckCircle2,
  Gift,
  Coins,
  Gem,
  Zap,
  Flame,
  ArrowRight,
  RotateCcw,
  Award,
  ChevronRight,
  Compass,
} from 'lucide-react';
import {
  DailyMissionId,
  DailyMissionReward,
  DailyMissionsData,
  PlayerProfile,
  isDevAccount,
} from '../../types';
import { User } from 'firebase/auth';
import {
  DAILY_MISSION_DEFINITIONS,
  ALL_CLEAR_REWARD_GEMS,
  claimDailyMission,
  claimAllClearBonus,
  claimAllAvailableDailyMissions,
  getSecondsUntilNextReset,
  formatRemainingTime,
  formatPlaytimeProgress,
  getMissionsProgressSummary,
  syncDailyMissionsState,
  recordPlaytimeTick,
  recordBattleWinProgress,
  recordSummonProgress,
  createDefaultDailyMissions,
} from '../../services/dailyMissionsService';
import {
  claimDailyMissionApi,
  claimDailyAllClearApi,
  claimAllDailyMissionsApi,
} from '../../services/apiClient';
import { ActiveTab } from '../Navbar';

interface DailyMissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onProfileUpdated: (updatedProfile: PlayerProfile) => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
  currentUser?: User | null;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
  onNavigateToTab,
  currentUser,
}) => {
  const [secondsUntilReset, setSecondsUntilReset] = useState<number>(getSecondsUntilNextReset());
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  const isAuthorizedDev = isDevAccount(profile?.username) || isDevAccount(currentUser?.email);

  // Sync daily missions on open
  useEffect(() => {
    if (isOpen && profile) {
      const synced = syncDailyMissionsState(profile);
      if (synced !== profile) {
        onProfileUpdated(synced);
      }
    }
  }, [isOpen, profile, onProfileUpdated]);

  // Real-time countdown timer to next daily reset
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setSecondsUntilReset(getSecondsUntilNextReset());
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !profile) return null;

  const daily = profile.dailyMissions || syncDailyMissionsState(profile).dailyMissions!;
  const summary = getMissionsProgressSummary(daily);

  const handleClaimMission = async (missionId: DailyMissionId) => {
    try {
      setIsClaiming(true);
      setClaimFeedback(null);

      // Attempt server-authoritative claim first
      try {
        const res = await claimDailyMissionApi(missionId);
        if (res.profile) {
          onProfileUpdated(res.profile);
          const parts: string[] = [];
          if (res.claimedReward?.energy) parts.push(`+⚡ ${res.claimedReward.energy} Stamina`);
          if (res.claimedReward?.summonPoints) parts.push(`+❇️ ${res.claimedReward.summonPoints} SP`);
          if (res.claimedReward?.gold) parts.push(`+🪙 ${res.claimedReward.gold.toLocaleString()} Gold`);
          if (res.claimedReward?.gems) parts.push(`+💎 ${res.claimedReward.gems} Gems`);
          setClaimFeedback(`✓ Claimed ${parts.join(' & ')}!`);
          return;
        }
      } catch (apiErr: any) {
        // Fallback to local synchronous calculation
        const { profile: updated, claimedReward } = claimDailyMission(profile, missionId);
        onProfileUpdated(updated);

        const parts: string[] = [];
        if (claimedReward.energy) parts.push(`+⚡ ${claimedReward.energy} Stamina`);
        if (claimedReward.summonPoints) parts.push(`+❇️ ${claimedReward.summonPoints} SP`);
        if (claimedReward.gold) parts.push(`+🪙 ${claimedReward.gold.toLocaleString()} Gold`);
        if (claimedReward.gems) parts.push(`+💎 ${claimedReward.gems} Gems`);

        setClaimFeedback(`✓ Claimed ${parts.join(' & ')}!`);
      }
    } catch (err: any) {
      setClaimFeedback(`✗ ${err.message || 'Failed to claim reward'}`);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClaimAllClear = async () => {
    try {
      setIsClaiming(true);
      setClaimFeedback(null);

      try {
        const res = await claimDailyAllClearApi();
        if (res.profile) {
          onProfileUpdated(res.profile);
          setClaimFeedback(`🎉 Magnificent! Claimed Daily Master Bounty: +💎 ${res.gemsClaimed} Gems!`);
          return;
        }
      } catch (apiErr) {
        const { profile: updated, gemsClaimed } = claimAllClearBonus(profile);
        onProfileUpdated(updated);
        setClaimFeedback(`🎉 Magnificent! Claimed Daily Master Bounty: +💎 ${gemsClaimed} Gems!`);
      }
    } catch (err: any) {
      setClaimFeedback(`✗ ${err.message || 'Failed to claim all-clear bounty'}`);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClaimAllAvailable = async () => {
    try {
      setIsClaiming(true);
      setClaimFeedback(null);

      try {
        const res = await claimAllDailyMissionsApi();
        if (res.profile) {
          onProfileUpdated(res.profile);
          const parts: string[] = [];
          if (res.totalEnergyClaimed) parts.push(`+⚡ ${res.totalEnergyClaimed} Stamina`);
          if (res.totalSpClaimed) parts.push(`+❇️ ${res.totalSpClaimed} SP`);
          if (res.totalGoldClaimed) parts.push(`+🪙 ${res.totalGoldClaimed.toLocaleString()} Gold`);
          if (res.totalGemsClaimed) parts.push(`+💎 ${res.totalGemsClaimed} Gems`);
          if (res.allClearClaimed) parts.push(`🎉 +100 Gems All-Clear Bounty!`);

          setClaimFeedback(`✓ Claimed ${res.claimedMissionsCount} Missions: ${parts.join(' | ')}`);
          return;
        }
      } catch (apiErr) {
        const res = claimAllAvailableDailyMissions(profile);
        onProfileUpdated(res.profile);
        const parts: string[] = [];
        if (res.totalEnergyClaimed) parts.push(`+⚡ ${res.totalEnergyClaimed} Stamina`);
        if (res.totalSpClaimed) parts.push(`+❇️ ${res.totalSpClaimed} SP`);
        if (res.totalGoldClaimed) parts.push(`+🪙 ${res.totalGoldClaimed.toLocaleString()} Gold`);
        if (res.totalGemsClaimed) parts.push(`+💎 ${res.totalGemsClaimed} Gems`);
        if (res.allClearClaimed) parts.push(`🎉 +100 Gems All-Clear Bounty!`);

        setClaimFeedback(`✓ Claimed ${res.claimedMissionsCount} Missions: ${parts.join(' | ')}`);
      }
    } catch (err: any) {
      setClaimFeedback(`✗ ${err.message || 'Failed to claim all daily rewards'}`);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleGoToMission = (actionTab?: string) => {
    if (actionTab && onNavigateToTab) {
      onClose();
      onNavigateToTab(actionTab as ActiveTab);
    }
  };

  // Dev Quick Test Cheats
  const handleDevFastForwardPlaytime = (seconds: number) => {
    const updated = recordPlaytimeTick(profile, seconds);
    onProfileUpdated(updated);
    setClaimFeedback(`✓ Added +${Math.round(seconds / 60)} minutes of active playtime!`);
  };

  const handleDevWinBattle = () => {
    const updated = recordBattleWinProgress(profile);
    onProfileUpdated(updated);
    setClaimFeedback(`✓ Recorded +1 Battle Victory!`);
  };

  const handleDevCompleteAll = () => {
    let p = recordPlaytimeTick(profile, 3600);
    p = recordBattleWinProgress(p);
    p = recordBattleWinProgress(p);
    p = recordBattleWinProgress(p);
    p = recordSummonProgress(p, 1);
    onProfileUpdated(p);
    setClaimFeedback(`✓ All 4 Daily Missions marked completed and ready to claim!`);
  };

  const handleDevResetMissions = () => {
    const fresh = createDefaultDailyMissions();
    const updated: PlayerProfile = {
      ...profile,
      dailyMissions: fresh,
      updatedAt: Date.now(),
    };
    onProfileUpdated(updated);
    setClaimFeedback(`✓ Reset today's daily missions state to initial clean slate.`);
  };

  const missionList: DailyMissionId[] = [
    'DAILY_LOGIN',
    'WIN_BATTLES',
    'SUMMON_MONSTER',
    'PLAYTIME_1H',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#1E1710]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="max-w-3xl w-full fantasy-scroll-card p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border-2 border-[#D8C7A5]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#E8DEC8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 border border-[#B45309] p-0.5 shadow-md flex items-center justify-center text-white shrink-0">
              <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-[#2E1F0F] font-serif tracking-tight">
                  Daily Missions & Bounties
                </h2>
                <span className="bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {summary.completedCount}/{summary.totalCount} Complete
                </span>
              </div>
              <p className="text-xs text-[#78654E] flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-700 inline shrink-0" />
                <span>Resets in:</span>
                <span className="font-mono font-bold text-[#B45309]">
                  {formatRemainingTime(secondsUntilReset)}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FAF6ED] border border-[#D5C29E] flex items-center justify-center text-[#78654E] hover:text-[#2E1F0F] hover:bg-[#F3ECE0] transition-colors cursor-pointer"
            title="Close Daily Missions"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Claim Feedback Banner */}
        {claimFeedback && (
          <div
            className={`my-2 p-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs ${
              claimFeedback.startsWith('✓') || claimFeedback.startsWith('🎉')
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border border-rose-300 text-rose-900'
            }`}
          >
            <span>{claimFeedback}</span>
            <button
              onClick={() => setClaimFeedback(null)}
              className="text-[#5C4A34] hover:text-black cursor-pointer font-bold ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-3.5 scrollbar-thin">
          {/* ═══════════════════════════════════════════════════════════════
              GRAND COMPLETION BOUNTY: 100 GEMS
              ═══════════════════════════════════════════════════════════════ */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-[#D97706] bg-gradient-to-r from-[#291705] via-[#452308] to-[#291705] p-4 text-white shadow-md">
            {/* Ambient gold glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 border-2 border-amber-200 flex items-center justify-center text-amber-950 shadow-lg shrink-0">
                  <Gem className="w-7 h-7 sm:w-8 sm:h-8 text-amber-950 drop-shadow" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full shadow-2xs">
                      All-Clear Bonus
                    </span>
                    <span className="text-xs text-amber-200 font-medium">
                      Complete all 4 missions today
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black font-serif text-amber-100 flex items-center gap-2 mt-0.5">
                    <span>Daily Master Reward:</span>
                    <span className="text-amber-300 font-mono font-black drop-shadow-md">
                      +{ALL_CLEAR_REWARD_GEMS} Gems
                    </span>
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2 w-full max-w-xs">
                    <div className="flex-1 h-2 rounded-full bg-black/40 border border-amber-500/40 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500"
                        style={{ width: `${(summary.claimedCount / summary.totalCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-amber-200">
                      {summary.claimedCount}/{summary.totalCount} Claimed
                    </span>
                  </div>
                </div>
              </div>

              {/* Claim Grand Button */}
              <div className="shrink-0 w-full sm:w-auto">
                {daily.allClearClaimed ? (
                  <div className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-emerald-900/60 border border-emerald-400/50 text-emerald-200 font-black text-xs flex items-center justify-center gap-1.5 shadow-inner">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Claimed for Today!</span>
                  </div>
                ) : summary.allClearReady ? (
                  <button
                    disabled={isClaiming}
                    onClick={handleClaimAllClear}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-xs sm:text-sm border-2 border-amber-200 shadow-lg cursor-pointer flex items-center justify-center gap-2 transition-transform active:scale-95 animate-pulse"
                  >
                    <Sparkles className="w-4 h-4 fill-amber-950" />
                    <span>Claim 100 Gems Bonus!</span>
                  </button>
                ) : (
                  <div className="w-full sm:w-auto py-2 px-3.5 rounded-xl bg-white/10 border border-white/15 text-amber-200/80 font-bold text-xs text-center">
                    {summary.totalCount - summary.claimedCount} more to unlock
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              4 DAILY MISSIONS LIST
              ═══════════════════════════════════════════════════════════════ */}
          {(() => {
            const readyToClaimCount = missionList.filter(
              (id) => daily.missions[id]?.completed && !daily.missions[id]?.claimed
            ).length;

            return (
              <div className="flex items-center justify-between gap-2 px-1">
                <span className="font-serif font-black text-xs sm:text-sm text-[#2E1F0F] tracking-wide uppercase">
                  Daily Assignments ({summary.completedCount}/{summary.totalCount})
                </span>
                {readyToClaimCount > 0 && (
                  <button
                    disabled={isClaiming}
                    onClick={handleClaimAllAvailable}
                    className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs py-1 px-3 rounded-xl border border-amber-600 shadow-xs cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95 animate-pulse"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-white" />
                    <span>Claim All ({readyToClaimCount})</span>
                  </button>
                )}
              </div>
            );
          })()}

          <div className="space-y-2.5">
            {missionList.map((missionId) => {
              const def = DAILY_MISSION_DEFINITIONS[missionId];
              const mission = daily.missions[missionId];
              if (!def || !mission) return null;

              const isCompleted = mission.completed;
              const isClaimed = mission.claimed;

              // Progress label
              let progressLabel = `${mission.current} / ${mission.target}`;
              let percent = Math.min(100, Math.round((mission.current / mission.target) * 100));

              if (missionId === 'PLAYTIME_1H') {
                progressLabel = formatPlaytimeProgress(mission.current);
                percent = Math.min(100, Math.round((mission.current / 3600) * 100));
              }

              // Icons
              let IconComp = Swords;
              let iconColor = 'text-amber-700 bg-amber-100 border-amber-300';
              if (missionId === 'DAILY_LOGIN') {
                IconComp = LogIn;
                iconColor = 'text-emerald-700 bg-emerald-100 border-emerald-300';
              } else if (missionId === 'SUMMON_MONSTER') {
                IconComp = Sparkles;
                iconColor = 'text-purple-700 bg-purple-100 border-purple-300';
              } else if (missionId === 'PLAYTIME_1H') {
                IconComp = Clock;
                iconColor = 'text-blue-700 bg-blue-100 border-blue-300';
              }

              return (
                <div
                  key={missionId}
                  className={`p-3 sm:p-4 rounded-2xl border-2 transition-all ${
                    isClaimed
                      ? 'bg-[#FAF6ED]/70 border-[#E5DAC0] opacity-80'
                      : isCompleted
                      ? 'bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FFFBEB] border-[#F59E0B] shadow-sm ring-1 ring-amber-400/40'
                      : 'bg-[#FFFDF9] border-[#D8C7A5] hover:border-[#C4B18B] shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    {/* Left: Icon & Details */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${iconColor}`}
                      >
                        <IconComp className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-[#2E1F0F] font-serif">
                            {def.title}
                          </h4>

                          {/* Reward Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {def.reward.energy && (
                              <span className="inline-flex items-center gap-1 bg-[#E6F9F5] border border-[#A7F3D0] text-[#065F46] text-[10px] font-black px-2 py-0.2 rounded-full">
                                <Zap className="w-3 h-3 text-[#059669] fill-emerald-500" />
                                <span>+{def.reward.energy} Stamina</span>
                              </span>
                            )}
                            {def.reward.summonPoints && (
                              <span className="inline-flex items-center gap-1 bg-[#E0F7FA] border border-[#BAE6FD] text-[#0369A1] text-[10px] font-black px-2 py-0.2 rounded-full">
                                <Sparkles className="w-3 h-3 text-[#0284C7]" />
                                <span>+{def.reward.summonPoints} SP</span>
                              </span>
                            )}
                            {def.reward.gold && (
                              <span className="inline-flex items-center gap-1 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-[10px] font-black px-2 py-0.2 rounded-full">
                                <Coins className="w-3 h-3 text-[#D97706]" />
                                <span>+{def.reward.gold.toLocaleString()} Gold</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-[#78654E] mt-0.5 leading-snug">
                          {def.description}
                        </p>

                        {/* Progress Bar */}
                        <div className="mt-2 flex items-center gap-2 max-w-sm">
                          <div className="flex-1 h-2 rounded-full bg-[#E8DEC8] overflow-hidden border border-[#D5C29E]">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isClaimed
                                  ? 'bg-emerald-500'
                                  : isCompleted
                                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                                  : 'bg-amber-600'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-[#5C4A34] whitespace-nowrap">
                            {progressLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action Button */}
                    <div className="shrink-0 w-full sm:w-auto flex sm:justify-end">
                      {isClaimed ? (
                        <div className="w-full sm:w-auto py-2 px-3.5 rounded-xl bg-[#E6F4EA] border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Claimed</span>
                        </div>
                      ) : isCompleted ? (
                        <button
                          disabled={isClaiming}
                          onClick={() => handleClaimMission(missionId)}
                          className="w-full sm:w-auto py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs border border-amber-600 shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-transform active:scale-95 animate-bounce"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Claim Reward</span>
                        </button>
                      ) : def.actionTab ? (
                        <button
                          onClick={() => handleGoToMission(def.actionTab)}
                          className="w-full sm:w-auto py-2 px-3.5 rounded-xl bg-[#FAF6ED] hover:bg-[#F3ECE0] border border-[#D5C29E] text-[#2E1F0F] font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-2xs group"
                        >
                          <span>Go</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ) : (
                        <div className="w-full sm:w-auto py-2 px-3.5 rounded-xl bg-[#F0ECE1] text-[#8C765C] font-semibold text-xs text-center border border-[#DDD3BC]">
                          In Progress
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Developer Quick Sandbox Cheats (Dean only) */}
          {isAuthorizedDev && (
            <div className="mt-4 pt-3 border-t border-[#E8DEC8] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#78654E] uppercase tracking-wider font-mono">
                  Dean Developer Testing Sandbox
                </span>
                <span className="text-[10px] text-amber-800 font-bold">
                  Quick Testing Tools
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleDevFastForwardPlaytime(900)}
                  className="py-1.5 px-2 rounded-lg bg-[#FAF6ED] hover:bg-[#F3ECE0] border border-[#D5C29E] text-[10px] font-bold text-[#5C4A34] cursor-pointer"
                  title="Add 15 minutes of playtime"
                >
                  +15m Playtime
                </button>
                <button
                  onClick={() => handleDevFastForwardPlaytime(3600)}
                  className="py-1.5 px-2 rounded-lg bg-[#FAF6ED] hover:bg-[#F3ECE0] border border-[#D5C29E] text-[10px] font-bold text-[#5C4A34] cursor-pointer"
                  title="Complete 1 hour playtime mission"
                >
                  Fill 1h Playtime
                </button>
                <button
                  onClick={handleDevWinBattle}
                  className="py-1.5 px-2 rounded-lg bg-[#FAF6ED] hover:bg-[#F3ECE0] border border-[#D5C29E] text-[10px] font-bold text-[#5C4A34] cursor-pointer"
                  title="Increment battle victory count by 1"
                >
                  +1 Battle Win
                </button>
                <button
                  onClick={handleDevCompleteAll}
                  className="py-1.5 px-2 rounded-lg bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#F59E0B] text-[10px] font-black text-[#92400E] cursor-pointer"
                  title="Make all 4 missions complete and ready to claim"
                >
                  Complete All
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleDevResetMissions}
                  className="text-[10px] text-[#8C765C] hover:text-[#2E1F0F] underline cursor-pointer"
                >
                  Reset Daily State to Fresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
