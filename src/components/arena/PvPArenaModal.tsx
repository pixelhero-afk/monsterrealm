/**
 * Monster Realms - Asynchronous PvP Arena & Rating System
 * Players configure a 1-to-5 monster defense lineup, challenge other players' defense teams,
 * gain or lose Arena Rating, climb tiers (Bronze to Grandmaster), and compete on the Global Leaderboard.
 */

import React, { useState, useEffect } from 'react';
import {
  Swords,
  Shield,
  Trophy,
  Users,
  X,
  Flame,
  Sparkles,
  ChevronRight,
  Crown,
  Award,
  RefreshCw,
  Search,
  Clock,
  Zap,
  Star,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Lock,
  Plus,
} from 'lucide-react';
import { PlayerMonster, PlayerProfile, PvEStage } from '../../types';
import {
  ArenaProfile,
  ArenaSummoner,
  ArenaTier,
  ArenaBattleLog,
  getArenaTier,
  ARENA_TIERS,
} from '../../types/arena';
import { MONSTER_VARIANTS } from '../../data/monsters';
import { ELEMENT_VISUALS } from '../../data/elements';
import { MonsterAvatar } from '../MonsterAvatar';
import { MonsterStarRating } from '../MonsterStarRating';
import {
  fetchArenaProfileApi,
  saveArenaDefenseApi,
  fetchArenaOpponentsApi,
  fetchArenaLeaderboardApi,
  startArenaMatchApi,
  fetchArenaLogsApi,
} from '../../services/arenaService';
import { listenFirestoreArenaLeaderboard } from '../../services/firebase';

interface PvPArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPvPBattle: (stage: PvEStage) => void;
  onNavigateToFriends: () => void;
  profile: PlayerProfile;
  monsters?: PlayerMonster[];
  onUpdateProfile?: (updated: PlayerProfile) => void;
}

export const PvPArenaModal: React.FC<PvPArenaModalProps> = ({
  isOpen,
  onClose,
  onStartPvPBattle,
  onNavigateToFriends,
  profile,
  monsters = [],
  onUpdateProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'MATCHMAKING' | 'DEFENSE' | 'LEADERBOARD' | 'LOGS'>('MATCHMAKING');

  // Arena Data States
  const [arenaProfile, setArenaProfile] = useState<ArenaProfile | null>(null);
  const [opponents, setOpponents] = useState<ArenaSummoner[]>([]);
  const [leaderboard, setLeaderboard] = useState<ArenaSummoner[]>([]);
  const [playerRank, setPlayerRank] = useState<number>(1);
  const [battleLogs, setBattleLogs] = useState<ArenaBattleLog[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Loading & Action States
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [isLoadingOpponents, setIsLoadingOpponents] = useState<boolean>(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState<boolean>(false);
  const [isSavingDefense, setIsSavingDefense] = useState<boolean>(false);
  const [isChallenging, setIsChallenging] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Defense Editing Drawer
  const [isEditingDefense, setIsEditingDefense] = useState<boolean>(false);
  const [selectedDefenseIds, setSelectedDefenseIds] = useState<string[]>([]);

  // Load initial arena data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    loadProfileAndOpponents();
    loadLeaderboard();
    loadLogs();

    // Listen to real-time highscores if Firestore is connected
    const unsubscribe = listenFirestoreArenaLeaderboard((firestoreSummoners) => {
      if (firestoreSummoners && firestoreSummoners.length > 0) {
        setLeaderboard((prev) => {
          // Merge with current state
          const ids = new Set(firestoreSummoners.map((s) => s.userId));
          const combined = [
            ...firestoreSummoners,
            ...prev.filter((p) => !ids.has(p.userId)),
          ];
          combined.sort((a, b) => (b.rating || 1000) - (a.rating || 1000));
          combined.forEach((s, idx) => {
            s.rank = idx + 1;
          });
          return combined;
        });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isOpen, profile.playerId]);

  // Synchronize defense selection when arenaProfile loads
  useEffect(() => {
    if (arenaProfile && arenaProfile.defenseTeam) {
      const activeIds = profile.defenseTeam || profile.activeParty || [];
      setSelectedDefenseIds(activeIds);
    } else if (profile.activeParty) {
      setSelectedDefenseIds(profile.activeParty);
    }
  }, [arenaProfile, profile.defenseTeam, profile.activeParty]);

  const loadProfileAndOpponents = async () => {
    setIsLoadingProfile(true);
    setIsLoadingOpponents(true);
    try {
      const [prof, opps] = await Promise.all([
        fetchArenaProfileApi(profile.playerId),
        fetchArenaOpponentsApi(profile.playerId),
      ]);
      setArenaProfile(prof);
      setOpponents(opps);
      if (prof.rank) setPlayerRank(prof.rank);
    } catch (err) {
      console.warn('Error loading arena data:', err);
    } finally {
      setIsLoadingProfile(false);
      setIsLoadingOpponents(false);
    }
  };

  const loadLeaderboard = async (query?: string) => {
    setIsLoadingLeaderboard(true);
    try {
      const data = await fetchArenaLeaderboardApi(query, profile.playerId);
      setLeaderboard(data.leaderboard);
      setPlayerRank(data.playerRank);
    } catch (err) {
      console.warn('Error loading arena leaderboard:', err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const loadLogs = async () => {
    try {
      const logs = await fetchArenaLogsApi(profile.playerId);
      setBattleLogs(logs);
    } catch (err) {
      console.warn('Error loading arena logs:', err);
    }
  };

  const handleRefreshOpponents = async () => {
    setIsLoadingOpponents(true);
    try {
      const opps = await fetchArenaOpponentsApi(profile.playerId);
      setOpponents(opps);
    } catch (err) {
      setErrorMessage('Failed to refresh matchmaking rivals.');
    } finally {
      setIsLoadingOpponents(false);
    }
  };

  const handleChallenge = async (opponentId: string) => {
    if ((arenaProfile?.tickets ?? 10) <= 0) {
      setErrorMessage('No Arena tickets remaining! Tickets refill automatically over time.');
      return;
    }

    setIsChallenging(opponentId);
    setErrorMessage(null);
    try {
      const data = await startArenaMatchApi(opponentId, profile.playerId);
      if (data.stage) {
        onClose();
        onStartPvPBattle(data.stage);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to start arena match.');
    } finally {
      setIsChallenging(null);
    }
  };

  const handleToggleMonsterDefense = (instanceId: string) => {
    if (selectedDefenseIds.includes(instanceId)) {
      if (selectedDefenseIds.length <= 1) {
        setErrorMessage('Your defense team must have at least 1 monster.');
        return;
      }
      setSelectedDefenseIds((prev) => prev.filter((id) => id !== instanceId));
    } else {
      if (selectedDefenseIds.length >= 5) {
        setErrorMessage('Defense squad can hold up to 5 monsters.');
        return;
      }
      setSelectedDefenseIds((prev) => [...prev, instanceId]);
    }
  };

  const handleDeployActivePartyAsDefense = () => {
    if (profile.activeParty && profile.activeParty.length > 0) {
      setSelectedDefenseIds([...profile.activeParty]);
      setSaveSuccessNotice('Selected your active party for defense squad. Click "Save Defense Squad" to confirm.');
      setTimeout(() => setSaveSuccessNotice(null), 3500);
    } else {
      setErrorMessage('Your active party is currently empty.');
    }
  };

  const handleAutoFillStrongestDefense = () => {
    if (!monsters || monsters.length === 0) return;
    const sorted = [...monsters].sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return (b.stars || 4) - (a.stars || 4);
    });
    const top5Ids = sorted.slice(0, 5).map((m) => m.instanceId);
    setSelectedDefenseIds(top5Ids);
    setSaveSuccessNotice('Selected your top 5 strongest monsters for defense squad. Click "Save Defense Squad" to confirm.');
    setTimeout(() => setSaveSuccessNotice(null), 3500);
  };

  const handleSaveDefenseTeam = async () => {
    if (selectedDefenseIds.length === 0) {
      setErrorMessage('Please select at least 1 monster for your defense squad.');
      return;
    }

    setIsSavingDefense(true);
    setErrorMessage(null);
    try {
      const result = await saveArenaDefenseApi(selectedDefenseIds, profile.playerId);
      if (result.profile) {
        setArenaProfile(result.profile);
      }
      setSaveSuccessNotice('Arena Defense Lineup successfully registered!');
      setIsEditingDefense(false);
      setTimeout(() => setSaveSuccessNotice(null), 3000);

      // Refresh leaderboard so player's new defense appears immediately
      loadLeaderboard();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save defense lineup.');
    } finally {
      setIsSavingDefense(false);
    }
  };

  if (!isOpen) return null;

  const currentRating = arenaProfile?.rating || profile.arenaRating || 1000;
  const currentTierConfig = getArenaTier(currentRating);
  const nextTierConfig = Object.values(ARENA_TIERS).find((t) => t.minRating > currentRating);
  const ratingToNextTier = nextTierConfig ? nextTierConfig.minRating - currentRating : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ============================================================== */}
        {/* 1. TOP BANNER & RATING OVERVIEW                                */}
        {/* ============================================================== */}
        <div className="p-4 sm:p-5 border-b-2 border-[#2E1F0F] bg-gradient-to-r from-[#FAF3E3] via-[#FFFDF9] to-[#FAF3E3] flex flex-wrap items-center justify-between gap-3 relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 border-2 border-[#2E1F0F] flex items-center justify-center shadow-md">
              <Swords className="w-6 h-6 text-[#2E1F0F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black font-serif text-[#2E1F0F] tracking-wide">
                  Grand Arena & Rating
                </h2>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border shadow-2xs font-serif ${currentTierConfig.badgeBg}`}
                >
                  {currentTierConfig.title}
                </span>
              </div>
              <p className="text-xs text-[#78654E]">
                Defend your ranking and conquer other summoners to climb the Hall of Champions.
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tickets */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E] shadow-2xs">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
              <div className="text-left">
                <div className="text-[9px] font-bold text-[#78654E] uppercase leading-none">
                  Duel Wings
                </div>
                <div className="text-xs font-black text-[#2E1F0F]">
                  {arenaProfile?.tickets ?? 10} / 10
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E] shadow-2xs">
              <Trophy className="w-4 h-4 text-amber-600" />
              <div className="text-left">
                <div className="text-[9px] font-bold text-[#78654E] uppercase leading-none">
                  Arena Rating
                </div>
                <div className="text-xs font-black text-[#92400E]">
                  {currentRating.toLocaleString()} PTS
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#FAF6ED] hover:bg-[#F3EAD3] border border-[#D5C29E] flex items-center justify-center text-[#78654E] hover:text-[#2E1F0F] cursor-pointer transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. NAVIGATION TABS                                             */}
        {/* ============================================================== */}
        <div className="bg-[#FAF6ED] border-b border-[#E8DEC8] px-4 pt-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('MATCHMAKING')}
              className={`px-4 py-2 rounded-t-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all border-t border-x ${
                activeTab === 'MATCHMAKING'
                  ? 'bg-[#FFFDF9] border-[#2E1F0F] text-[#2E1F0F] shadow-sm -mb-[1px] pb-2.5 z-10'
                  : 'bg-transparent border-transparent text-[#78654E] hover:text-[#2E1F0F]'
              }`}
            >
              <Swords className="w-4 h-4 text-amber-600" />
              <span>Arena Duels</span>
            </button>

            <button
              onClick={() => setActiveTab('DEFENSE')}
              className={`px-4 py-2 rounded-t-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all border-t border-x ${
                activeTab === 'DEFENSE'
                  ? 'bg-[#FFFDF9] border-[#2E1F0F] text-[#2E1F0F] shadow-sm -mb-[1px] pb-2.5 z-10'
                  : 'bg-transparent border-transparent text-[#78654E] hover:text-[#2E1F0F]'
              }`}
            >
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Defense Squad</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-bold">
                {selectedDefenseIds.length}/5
              </span>
            </button>

            <button
              onClick={() => setActiveTab('LEADERBOARD')}
              className={`px-4 py-2 rounded-t-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all border-t border-x ${
                activeTab === 'LEADERBOARD'
                  ? 'bg-[#FFFDF9] border-[#2E1F0F] text-[#2E1F0F] shadow-sm -mb-[1px] pb-2.5 z-10'
                  : 'bg-transparent border-transparent text-[#78654E] hover:text-[#2E1F0F]'
              }`}
            >
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>Leaderboard</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">
                Rank #{playerRank}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('LOGS')}
              className={`px-4 py-2 rounded-t-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all border-t border-x ${
                activeTab === 'LOGS'
                  ? 'bg-[#FFFDF9] border-[#2E1F0F] text-[#2E1F0F] shadow-sm -mb-[1px] pb-2.5 z-10'
                  : 'bg-transparent border-transparent text-[#78654E] hover:text-[#2E1F0F]'
              }`}
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>History</span>
            </button>
          </div>

          {/* Quick Spar with Friends button */}
          <button
            onClick={() => {
              onClose();
              onNavigateToFriends();
            }}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#78654E] hover:text-[#2E1F0F] cursor-pointer pb-2"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Friend Sparring</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Notifications & Feedback */}
        {saveSuccessNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center gap-2 text-xs font-bold text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between gap-2 text-xs font-bold text-rose-800 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. MAIN TAB CONTENT AREA                                       */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FFFDF9]">
          {/* TAB 1: MATCHMAKING & DUELS */}
          {activeTab === 'MATCHMAKING' && (
            <div className="space-y-5">
              {/* Status Header Strip */}
              <div className="fantasy-plate p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <div className="text-xs font-black font-serif text-[#2E1F0F]">
                      Matchmaking: {currentTierConfig.title} Tier
                    </div>
                    <div className="text-[11px] text-[#78654E]">
                      Win matches to gain Rating • Win streak bonus active
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefreshOpponents}
                    disabled={isLoadingOpponents}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF6ED] hover:bg-[#F3EAD3] border border-[#D5C29E] text-xs font-bold text-[#2E1F0F] cursor-pointer shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isLoadingOpponents ? 'animate-spin' : ''}`} />
                    <span>Refresh Rivals</span>
                  </button>
                </div>
              </div>

              {/* Opponents List */}
              {isLoadingOpponents ? (
                <div className="p-12 text-center text-[#78654E]">
                  <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
                  <span className="font-serif font-bold text-sm">Searching the Realm for worthy rivals...</span>
                </div>
              ) : opponents.length === 0 ? (
                <div className="p-10 text-center text-[#78654E] bg-[#FAF6ED] rounded-2xl border border-[#D5C29E]">
                  <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-60" />
                  <h4 className="font-bold text-sm text-[#2E1F0F]">No Rivals Found</h4>
                  <p className="text-xs text-[#78654E] mt-1 mb-3">
                    Click refresh to generate new opponents from the realm database.
                  </p>
                  <button
                    onClick={handleRefreshOpponents}
                    className="px-4 py-2 fantasy-btn-gold text-[#2E1F0F] rounded-xl text-xs font-bold font-serif"
                  >
                    Search Opponents
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {opponents.map((opponent) => {
                    const oppTier = getArenaTier(opponent.rating);
                    const ratingDiff = opponent.rating - currentRating;
                    const estimatedGain = Math.max(14, Math.min(35, 20 + Math.round(ratingDiff / 25)));

                    return (
                      <div
                        key={opponent.userId}
                        className="fantasy-plate p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-400 transition-all shadow-xs"
                      >
                        {/* Opponent Info */}
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <MonsterAvatar
                              variantId={opponent.avatarVariantId}
                              className="w-13 h-13 rounded-2xl border-2 border-[#2E1F0F] shadow-sm bg-white"
                            />
                            <span className="absolute -bottom-1 -right-1 bg-[#2E1F0F] text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-amber-400">
                              Lv.{opponent.level}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black font-serif text-[#2E1F0F]">
                                {opponent.displayName}
                              </h4>
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${oppTier.badgeBg}`}
                              >
                                {oppTier.tier}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-[#78654E] mt-0.5">
                              <span className="font-bold text-[#92400E]">
                                {opponent.rating} PTS
                              </span>
                              <span>•</span>
                              <span className="font-mono text-[11px] text-cyan-800 font-bold">
                                ⚡ {opponent.defensePower.toLocaleString()} Power
                              </span>
                              <span>•</span>
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 rounded">
                                +{estimatedGain} Rating on Win
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Defense Monsters Mini Avatars */}
                        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
                          {opponent.defenseMonsters.map((m, idx) => {
                            const v = MONSTER_VARIANTS[m.variantId];
                            const elem = ELEMENT_VISUALS[m.element || v?.element || 'FIRE'];

                            return (
                              <div
                                key={`opp_mon_${opponent.userId}_${idx}`}
                                className="relative flex flex-col items-center group"
                                title={`${m.name || v?.name || m.variantId} (Lv.${m.level})`}
                              >
                                <div
                                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 overflow-hidden bg-white shadow-2xs"
                                  style={{ borderColor: elem?.borderHex || '#D5C29E' }}
                                >
                                  <MonsterAvatar variantId={m.variantId} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-[8px] font-black text-[#2E1F0F] mt-0.5">
                                  Lv.{m.level}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Challenge Button */}
                        <button
                          onClick={() => handleChallenge(opponent.userId)}
                          disabled={isChallenging === opponent.userId}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl fantasy-btn-gold text-[#2E1F0F] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50 shrink-0 font-serif"
                        >
                          <Swords className="w-4 h-4 text-[#78350F]" />
                          <span>{isChallenging === opponent.userId ? 'Entering Arena...' : 'Duel Rival'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DEFENSE TEAM SETUP */}
          {activeTab === 'DEFENSE' && (
            <div className="space-y-5">
              {/* Defense Overview Card */}
              <div className="fantasy-plate p-4 sm:p-5 rounded-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-black font-serif text-[#2E1F0F]">
                      Your Arena Defense Squad
                    </h3>
                    <p className="text-xs text-[#78654E]">
                      This tactical team defends your ranking against incoming challenges while you are away.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeployActivePartyAsDefense}
                      className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-[#FAF6ED] hover:bg-[#F3EAD3] border border-[#D5C29E] text-xs font-bold text-[#2E1F0F] cursor-pointer shadow-2xs"
                      title="Quickly fill defense squad with your active combat party"
                    >
                      Use Active Party
                    </button>
                    <button
                      onClick={handleAutoFillStrongestDefense}
                      className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-[#FAF6ED] hover:bg-[#F3EAD3] border border-[#D5C29E] text-xs font-bold text-[#2E1F0F] cursor-pointer shadow-2xs"
                      title="Quickly fill defense squad with your 5 highest-level monsters"
                    >
                      Auto-Fill Top 5
                    </button>
                    <div className="px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-300 text-cyan-900 text-xs font-mono font-bold">
                      Defense Power: ⚡ {arenaProfile?.defensePower.toLocaleString() || '0'}
                    </div>
                    <button
                      onClick={() => setIsEditingDefense((prev) => !prev)}
                      className="px-4 py-2 rounded-xl fantasy-btn-gold text-[#2E1F0F] font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs font-serif"
                    >
                      {isEditingDefense ? 'Cancel Editing' : 'Configure Squad'}
                    </button>
                  </div>
                </div>

                {/* Warning if no defense squad is set */}
                {selectedDefenseIds.length === 0 && (
                  <div className="mb-4 p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-amber-900 animate-fadeIn">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div className="text-xs font-bold">
                        <span className="font-black text-[#2E1F0F]">No Defense Squad Set!</span> Put up a defense lineup of 1-5 monsters to defend your ranking and earn rating from rival challengers.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDeployActivePartyAsDefense}
                        className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-bold font-serif cursor-pointer shadow-2xs"
                      >
                        Use Active Party
                      </button>
                      <button
                        onClick={handleAutoFillStrongestDefense}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold font-serif cursor-pointer shadow-2xs"
                      >
                        Auto-Fill Top 5
                      </button>
                    </div>
                  </div>
                )}

                {/* 5 Formation Pedestals */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
                  {[0, 1, 2, 3, 4].map((slotIdx) => {
                    const instId = selectedDefenseIds[slotIdx];
                    const monster = monsters.find((m) => m.instanceId === instId);
                    const variant = monster ? MONSTER_VARIANTS[monster.variantId] : null;
                    const elem = variant ? ELEMENT_VISUALS[variant.element] : null;

                    if (!monster || !variant) {
                      return (
                        <div
                          key={`def_slot_${slotIdx}`}
                          onClick={() => setIsEditingDefense(true)}
                          className="h-36 sm:h-44 rounded-2xl border-2 border-dashed border-[#D5C29E] bg-[#FAF6ED]/60 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:border-amber-400 transition-all"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#E8DEC8] flex items-center justify-center mb-1 text-[#78654E]">
                            <Plus className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold text-[#78654E] uppercase">
                            Slot {slotIdx + 1} Empty
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`def_slot_${slotIdx}`}
                        className="fantasy-plate p-2.5 rounded-2xl flex flex-col items-center text-center relative border-2 shadow-xs group"
                        style={{ borderColor: elem?.borderHex || '#D5C29E' }}
                      >
                        <span className="absolute top-1.5 left-1.5 text-[8px] font-black text-slate-500 bg-white/80 px-1 rounded">
                          #{slotIdx + 1}
                        </span>

                        {monster.awakeningStage === 'AWAKENED' && (
                          <span className="absolute top-1.5 right-1.5 text-[8px] font-black text-amber-900 bg-amber-200 px-1 rounded border border-amber-300">
                            ★ AWK
                          </span>
                        )}

                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden my-1 bg-white border shadow-2xs">
                          <MonsterAvatar variantId={variant.variantId} className="w-full h-full object-cover" />
                        </div>

                        <div className="text-xs font-black font-serif text-[#2E1F0F] truncate w-full">
                          {variant.name}
                        </div>

                        <div className="text-[10px] font-bold text-[#78654E]">
                          Lv. {monster.level}
                        </div>

                        <MonsterStarRating stars={monster.stars || 4} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Editing Selector Drawer */}
              {isEditingDefense && (
                <div className="fantasy-plate p-4 sm:p-5 rounded-2xl border-2 border-amber-400 animate-fadeIn">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-black font-serif text-[#2E1F0F]">
                        Select Defense Monsters (Click to Toggle)
                      </h4>
                      <p className="text-[11px] text-[#78654E]">
                        Selected: {selectedDefenseIds.length}/5 units
                      </p>
                    </div>

                    <button
                      onClick={handleSaveDefenseTeam}
                      disabled={isSavingDefense || selectedDefenseIds.length === 0}
                      className="px-5 py-2 rounded-xl fantasy-btn-gold text-[#2E1F0F] font-black text-xs uppercase tracking-wider cursor-pointer shadow-md font-serif disabled:opacity-50"
                    >
                      {isSavingDefense ? 'Saving...' : 'Save Defense Squad'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-60 overflow-y-auto p-1">
                    {monsters.map((m) => {
                      const v = MONSTER_VARIANTS[m.variantId];
                      if (!v) return null;
                      const isSelected = selectedDefenseIds.includes(m.instanceId);
                      const elem = ELEMENT_VISUALS[v.element];

                      return (
                        <div
                          key={m.instanceId}
                          onClick={() => handleToggleMonsterDefense(m.instanceId)}
                          className={`relative p-2 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${
                            isSelected
                              ? 'bg-amber-100 border-amber-500 shadow-md ring-2 ring-amber-400/40'
                              : 'bg-white hover:bg-slate-50 border-[#D5C29E]'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black z-10">
                              ✓
                            </div>
                          )}

                          <div className="w-10 h-10 rounded-lg overflow-hidden mb-1">
                            <MonsterAvatar variantId={v.variantId} className="w-full h-full object-cover" />
                          </div>

                          <div className="text-[10px] font-black text-[#2E1F0F] truncate w-full">
                            {v.name}
                          </div>
                          <div className="text-[9px] font-bold text-[#78654E]">
                            Lv.{m.level}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HIGHSCORES & LEADERBOARD */}
          {activeTab === 'LEADERBOARD' && (
            <div className="space-y-5">
              {/* Your Highscore Standing Card */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 border-2 border-amber-400 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 font-black font-serif flex flex-col items-center justify-center border-2 border-[#2E1F0F] shadow-sm">
                    <span className="text-[9px] uppercase leading-none font-bold">RANK</span>
                    <span className="text-lg leading-tight font-black">#{playerRank}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black font-serif text-[#2E1F0F]">
                        {profile.username || 'Your Summoner Profile'}
                      </h4>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shadow-2xs ${currentTierConfig.badgeBg}`}>
                        {currentTierConfig.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#78654E] mt-0.5">
                      <span className="font-bold text-[#92400E]">
                        Rating: {currentRating.toLocaleString()} PTS
                      </span>
                      <span>•</span>
                      <span>
                        Record: {arenaProfile?.wins ?? profile.arenaWins ?? 0}W - {arenaProfile?.losses ?? profile.arenaLosses ?? 0}L
                      </span>
                      <span>•</span>
                      <span className="font-mono text-cyan-800 font-bold">
                        ⚡ {arenaProfile?.defensePower ?? 0} Def Power
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {ratingToNextTier > 0 ? (
                    <div className="text-right">
                      <div className="text-[10px] text-[#78654E] font-bold">Next Tier: {nextTierConfig?.title}</div>
                      <div className="text-xs font-black text-amber-700 font-mono">
                        {ratingToNextTier} PTS to promote
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs font-black text-amber-700 font-serif">
                      👑 Grandmaster Apex
                    </div>
                  )}
                  <button
                    onClick={() => setActiveTab('DEFENSE')}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#D5C29E] text-xs font-bold text-[#2E1F0F] cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>My Defense Squad</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#78654E] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search summoners by name or tier..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      loadLeaderboard(e.target.value);
                    }}
                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E] text-xs font-bold text-[#2E1F0F] placeholder:text-[#A89882] focus:outline-none focus:border-amber-500 shadow-inner"
                  />
                </div>

                <button
                  onClick={() => loadLeaderboard()}
                  className="px-3.5 py-2.5 rounded-2xl bg-[#FAF6ED] hover:bg-[#F3EAD3] border border-[#D5C29E] text-xs font-bold text-[#2E1F0F] cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-amber-600" />
                </button>
              </div>

              {/* Podium of Top 3 Realm Champions */}
              {leaderboard.length >= 3 && !searchQuery && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 my-2">
                  {/* #2 Silver */}
                  <div className="fantasy-plate p-3 sm:p-4 rounded-2xl text-center border-2 border-slate-400 bg-gradient-to-t from-slate-100 to-white flex flex-col items-center order-1 sm:order-1 mt-4 shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 text-xs font-black flex items-center justify-center mb-1">
                      2
                    </div>
                    <MonsterAvatar
                      variantId={leaderboard[1].avatarVariantId}
                      className="w-12 h-12 rounded-xl border border-slate-400 mb-1.5"
                    />
                    <div className="text-xs font-black font-serif text-[#2E1F0F] truncate w-full">
                      {leaderboard[1].displayName}
                    </div>
                    <div className="text-[11px] font-black text-slate-700">
                      {leaderboard[1].rating} PTS
                    </div>
                    <span className="text-[8px] font-bold uppercase text-slate-600 mt-0.5">
                      {leaderboard[1].tier}
                    </span>
                    {leaderboard[1].userId !== profile.playerId && (
                      <button
                        onClick={() => handleChallenge(leaderboard[1].userId)}
                        disabled={isChallenging === leaderboard[1].userId}
                        className="mt-2 px-2.5 py-1 rounded-lg fantasy-btn-gold text-[#2E1F0F] font-black text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                      >
                        <Swords className="w-3 h-3 text-[#78350F]" />
                        <span>Duel</span>
                      </button>
                    )}
                  </div>

                  {/* #1 Gold Champion */}
                  <div className="fantasy-plate p-4 rounded-2xl text-center border-2 border-amber-400 bg-gradient-to-t from-amber-100 to-white flex flex-col items-center order-2 sm:order-2 shadow-md relative">
                    <Crown className="w-6 h-6 text-amber-500 fill-amber-400 absolute -top-3.5" />
                    <div className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 text-xs font-black flex items-center justify-center mb-1 mt-1">
                      1
                    </div>
                    <MonsterAvatar
                      variantId={leaderboard[0].avatarVariantId}
                      className="w-14 h-14 rounded-2xl border-2 border-amber-400 mb-1.5 shadow-sm"
                    />
                    <div className="text-sm font-black font-serif text-[#2E1F0F] truncate w-full">
                      {leaderboard[0].displayName}
                    </div>
                    <div className="text-xs font-black text-amber-900">
                      {leaderboard[0].rating} PTS
                    </div>
                    <span className="text-[9px] font-black uppercase text-amber-700 mt-0.5">
                      {leaderboard[0].tier}
                    </span>
                    {leaderboard[0].userId !== profile.playerId && (
                      <button
                        onClick={() => handleChallenge(leaderboard[0].userId)}
                        disabled={isChallenging === leaderboard[0].userId}
                        className="mt-2 px-3 py-1 rounded-lg fantasy-btn-gold text-[#2E1F0F] font-black text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                      >
                        <Swords className="w-3 h-3 text-[#78350F]" />
                        <span>Duel #1</span>
                      </button>
                    )}
                  </div>

                  {/* #3 Bronze */}
                  <div className="fantasy-plate p-3 sm:p-4 rounded-2xl text-center border-2 border-amber-700 bg-gradient-to-t from-amber-50 to-white flex flex-col items-center order-3 sm:order-3 mt-4 shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 text-xs font-black flex items-center justify-center mb-1">
                      3
                    </div>
                    <MonsterAvatar
                      variantId={leaderboard[2].avatarVariantId}
                      className="w-12 h-12 rounded-xl border border-amber-600 mb-1.5"
                    />
                    <div className="text-xs font-black font-serif text-[#2E1F0F] truncate w-full">
                      {leaderboard[2].displayName}
                    </div>
                    <div className="text-[11px] font-black text-amber-900">
                      {leaderboard[2].rating} PTS
                    </div>
                    <span className="text-[8px] font-bold uppercase text-amber-800 mt-0.5">
                      {leaderboard[2].tier}
                    </span>
                    {leaderboard[2].userId !== profile.playerId && (
                      <button
                        onClick={() => handleChallenge(leaderboard[2].userId)}
                        disabled={isChallenging === leaderboard[2].userId}
                        className="mt-2 px-2.5 py-1 rounded-lg fantasy-btn-gold text-[#2E1F0F] font-black text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                      >
                        <Swords className="w-3 h-3 text-[#78350F]" />
                        <span>Duel</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Full Ranked Table */}
              {isLoadingLeaderboard ? (
                <div className="p-8 text-center text-[#78654E]">
                  <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
                  <span className="font-serif font-bold text-sm">Gathering Realm Highscores...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((summoner, idx) => {
                    const rankNum = summoner.rank || idx + 1;
                    const tier = getArenaTier(summoner.rating);
                    const isMe = summoner.userId === profile.playerId;

                    return (
                      <div
                        key={summoner.userId}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                          isMe
                            ? 'bg-amber-100/80 border-amber-400 shadow-sm ring-1 ring-amber-400/50'
                            : 'bg-white hover:bg-slate-50 border-[#E8DEC8]'
                        }`}
                      >
                        {/* Rank & Identity */}
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                              rankNum === 1
                                ? 'bg-amber-400 text-amber-950 shadow-xs'
                                : rankNum === 2
                                ? 'bg-slate-300 text-slate-800'
                                : rankNum === 3
                                ? 'bg-amber-700 text-amber-100'
                                : 'bg-slate-100 text-slate-600 font-mono text-[11px]'
                            }`}
                          >
                            {rankNum}
                          </span>

                          <MonsterAvatar
                            variantId={summoner.avatarVariantId}
                            className="w-10 h-10 rounded-xl border border-[#D5C29E]"
                          />

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black font-serif text-[#2E1F0F]">
                                {summoner.displayName}
                              </span>
                              {isMe && (
                                <span className="text-[9px] font-black bg-amber-500 text-white px-1.5 rounded">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#78654E]">
                              Lv.{summoner.level} • {summoner.wins}W - {summoner.losses}L
                            </div>
                          </div>
                        </div>

                        {/* Defense Monsters Mini Preview */}
                        <div className="hidden sm:flex items-center gap-1">
                          {summoner.defenseMonsters.slice(0, 5).map((m, mIdx) => (
                            <div key={`lead_mon_${summoner.userId}_${mIdx}`} className="w-7 h-7 rounded-lg overflow-hidden border border-slate-200">
                              <MonsterAvatar variantId={m.variantId} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>

                        {/* Rating, Tier Badge & Quick Duel */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-black text-[#92400E] font-mono">
                              {summoner.rating.toLocaleString()} PTS
                            </div>
                            <span
                              className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${tier.badgeBg}`}
                            >
                              {tier.tier}
                            </span>
                          </div>

                          {!isMe && (
                            <button
                              onClick={() => handleChallenge(summoner.userId)}
                              disabled={isChallenging === summoner.userId}
                              className="px-2.5 py-1.5 rounded-xl fantasy-btn-gold text-[#2E1F0F] font-black text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 font-serif"
                              title={`Duel ${summoner.displayName}`}
                            >
                              <Swords className="w-3.5 h-3.5 text-[#78350F]" />
                              <span>{isChallenging === summoner.userId ? '...' : 'Duel'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BATTLE LOGS */}
          {activeTab === 'LOGS' && (
            <div className="space-y-3">
              <div className="fantasy-plate p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black font-serif text-[#2E1F0F]">
                    Recent Arena Records
                  </h4>
                  <p className="text-[11px] text-[#78654E]">
                    Tracks your recent attack challenges and defense battles against other summoners.
                  </p>
                </div>
              </div>

              {battleLogs.length === 0 ? (
                <div className="p-8 text-center text-[#78654E] bg-[#FAF6ED] rounded-2xl border border-[#D5C29E]">
                  <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2 opacity-50" />
                  <span className="text-xs font-bold">No arena battles recorded yet. Challenge a rival!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {battleLogs.map((log) => {
                    const isVictory = log.isVictory;
                    const deltaPrefix = log.ratingDelta > 0 ? '+' : '';

                    return (
                      <div
                        key={log.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                          isVictory ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                              isVictory ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                            }`}
                          >
                            {isVictory ? 'W' : 'L'}
                          </div>
                          <div>
                            <div className="text-xs font-black text-[#2E1F0F]">
                              {log.type === 'ATTACK' ? 'Attacked' : 'Defended against'} {log.opponentName}
                            </div>
                            <div className="text-[10px] text-[#78654E]">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-xs font-black font-mono ${
                              log.ratingDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {deltaPrefix}{log.ratingDelta} PTS
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 4. PINNED FOOTER: PLAYER ARENA SUMMARY                          */}
        {/* ============================================================== */}
        <div className="p-3 sm:p-4 bg-[#FAF3E3] border-t-2 border-[#2E1F0F] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#78654E]">Your Standing:</span>
            <span className="font-black text-[#2E1F0F] bg-white px-2 py-0.5 rounded-lg border border-[#D5C29E]">
              Rank #{playerRank}
            </span>
            <span className="font-black text-[#92400E]">
              {currentRating.toLocaleString()} PTS ({currentTierConfig.title})
            </span>
          </div>

          {ratingToNextTier > 0 && nextTierConfig && (
            <div className="text-[11px] text-[#78654E]">
              Next Tier ({nextTierConfig.title}):{' '}
              <span className="font-black text-amber-700">+{ratingToNextTier} PTS</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
