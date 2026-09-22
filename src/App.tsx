/**
 * Monster Realms - Main Application Entry
 * Full-featured browser RPG with 5v5 turn-meter combat, monster progression,
 * equipment set crafting, summoning gate, lore codex, and in-game dev tools.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Navbar } from './components/Navbar';
import { HomeHub } from './components/HomeHub';
import { PveHub } from './components/PveHub';
import { MonstersHub } from './components/MonstersHub';
import { BattleView } from './components/BattleView';
import { SummonView } from './components/SummonView';
import { SynthesisChamber } from './components/SynthesisChamber';
import { DevToolsModal } from './components/DevToolsModal';
import { TutorialOverlay } from './components/TutorialOverlay';
import {
  EquipmentItem,
  FriendPublicProfile,
  PlayerMonster,
  PlayerProfile,
  PvEStage,
  SummonBanner,
  isDevAccount,
} from './types';
import {
  fetchPlayerProfile,
  initializeStarterAccount,
  restorePlayerState,
  savePlayerParty,
  setActivePlayerId,
  setActivePlayerEmail,
} from './services/apiClient';
import { createStarterAccount } from './services/starterTeam';
import { PVE_STAGES } from './data/stages';
import { SUMMON_BANNERS } from './data/banners';
import { FantasySkyBackdrop } from './components/FantasySkyBackdrop';
import { AuthModal } from './components/auth/AuthModal';
import { FriendsView } from './components/social/FriendsView';
import { PlayerProfileModal } from './components/profile/PlayerProfileModal';
import { getUnclaimedRewards } from './services/accountProgression';
import {
  loadGameFromCloud,
  onAuthChanged,
  saveGameToCloud,
  listenIncomingRequests,
} from './services/firebase';
import { User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('HOME');
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [monsters, setMonsters] = useState<PlayerMonster[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [banners, setBanners] = useState<SummonBanner[]>(SUMMON_BANNERS);
  const [stages, setStages] = useState<PvEStage[]>(PVE_STAGES);

  // Auth & Cloud Save State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  // Profile & Level Progression Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [profileModalTab, setProfileModalTab] = useState<'OVERVIEW' | 'REWARDS' | 'AVATAR'>('OVERVIEW');

  const unclaimedRewardsCount = profile ? getUnclaimedRewards(profile).length : 0;

  const handleOpenProfileModal = (tab: 'OVERVIEW' | 'REWARDS' | 'AVATAR' = 'OVERVIEW') => {
    setProfileModalTab(tab);
    setIsProfileModalOpen(true);
  };

  // Active battle stage
  const [activeBattleStage, setActiveBattleStage] = useState<PvEStage | null>(null);

  // Dev tools modal
  const [isDevToolsOpen, setIsDevToolsOpen] = useState<boolean>(false);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Fetch player profile from server or initialize starter account
  const loadPlayerData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorNotice(null);
      const data = await fetchPlayerProfile();
      setProfile(data.profile);
      setMonsters(data.monsters);
      setEquipment(data.equipment);
      if (data.banners && data.banners.length > 0) setBanners(data.banners);
      if (data.stages && data.stages.length > 0) setStages(data.stages);
    } catch (err: any) {
      console.warn('Initial server fetch returned error, initializing starter team...', err);
      try {
        const initData = await initializeStarterAccount();
        setProfile(initData.profile);
        setMonsters(initData.monsters);
        setEquipment(initData.equipment);
      } catch (localErr) {
        // Fallback to client-side starter data generator if server is in cold start
        const fallback = createStarterAccount('Adventurer');
        setProfile(fallback.profile);
        setMonsters(fallback.monsters);
        setEquipment(fallback.equipment);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        setActivePlayerId(user.uid);
        setActivePlayerEmail(user.email);
        try {
          // Attempt to load cloud save for this account
          const cloudSave = await loadGameFromCloud(user.uid);
          if (cloudSave && cloudSave.profile && cloudSave.monsters) {
            await restorePlayerState({
              profile: cloudSave.profile,
              monsters: cloudSave.monsters,
              equipment: cloudSave.equipment || [],
            });
            setProfile(cloudSave.profile);
            setMonsters(cloudSave.monsters);
            setEquipment(cloudSave.equipment || []);
            if (cloudSave.stages && cloudSave.stages.length > 0) {
              setStages(cloudSave.stages);
            }
            setLastSavedAt(cloudSave.savedAt || new Date().toISOString());
          } else {
            loadPlayerData();
          }
        } catch (err) {
          console.error('Error hydrating cloud save on auth change:', err);
          loadPlayerData();
        }
      } else {
        setActivePlayerId('player_default');
        setActivePlayerEmail('');
        loadPlayerData();
      }
    });

    return () => unsubscribe();
  }, [loadPlayerData]);

  // Listen for incoming friend requests count
  useEffect(() => {
    if (!currentUser) {
      setPendingRequestsCount(0);
      return;
    }

    const unsubRequests = listenIncomingRequests(currentUser.uid, (list) => {
      setPendingRequestsCount(list.length);
    });

    return () => unsubRequests();
  }, [currentUser]);

  // Save game to Firebase Cloud
  const handleSaveToCloud = async () => {
    if (!currentUser || !profile) return;
    try {
      setIsSavingCloud(true);
      await saveGameToCloud(currentUser.uid, profile, monsters, equipment, stages);
      setLastSavedAt(new Date().toISOString());
    } catch (err) {
      console.error('Failed to save to cloud:', err);
      throw err;
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Load game from Firebase Cloud
  const handleLoadFromCloud = async () => {
    if (!currentUser) return;
    try {
      setIsSavingCloud(true);
      const cloudSave = await loadGameFromCloud(currentUser.uid);
      if (cloudSave && cloudSave.profile) {
        await restorePlayerState({
          profile: cloudSave.profile,
          monsters: cloudSave.monsters,
          equipment: cloudSave.equipment || [],
        });
        setProfile(cloudSave.profile);
        setMonsters(cloudSave.monsters);
        setEquipment(cloudSave.equipment || []);
        if (cloudSave.stages && cloudSave.stages.length > 0) {
          setStages(cloudSave.stages);
        }
        setLastSavedAt(cloudSave.savedAt);
      }
    } catch (err) {
      console.error('Failed to load from cloud:', err);
      throw err;
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Claim Gift Reward (+100 Gold, +10 SP)
  const handleClaimGiftReward = (gold: number, sp: number) => {
    if (!profile) return;
    const updatedCurrencies = {
      ...profile.currencies,
      gold: (profile.currencies.gold || 0) + gold,
      summonPoints: (profile.currencies.summonPoints || 0) + sp,
    };
    setProfile({
      ...profile,
      currencies: updatedCurrencies,
    });
  };

  // Launch Sparring Match against Friend's team
  const handleSparBattle = (friend: FriendPublicProfile) => {
    const defenseParty = friend.defenseParty && friend.defenseParty.length > 0
      ? friend.defenseParty
      : monsters.slice(0, 5);

    const sparStage: PvEStage = {
      stageId: `spar_${friend.userId}_${Date.now()}`,
      continentId: 'sparring_arena',
      chapter: 1,
      stageNumber: 1,
      name: `Sparring: ${friend.displayName}`,
      element: friend.leadMonster?.element || 'FIRE',
      energyCost: 0,
      recommendedPower: 1000,
      description: `Friendly sparring match against ${friend.displayName}'s active team formation.`,
      enemyVariants: defenseParty.map((m, idx) => ({
        variantId: m.variantId,
        level: m.level,
        slotIndex: idx,
        awakeningStage: m.awakeningStage,
      })),
      firstClearRewards: {
        gold: 150,
        gems: 10,
        summonPoints: 20,
      },
      repeatRewards: {
        gold: 100,
        exp: 50,
      },
    };

    setActiveBattleStage(sparStage);
    setActiveTab('BATTLE');
  };

  // Handle stage selection from Home Hub
  const handleSelectStage = (stage: PvEStage) => {
    setActiveBattleStage(stage);
    setActiveTab('BATTLE');
  };

  // Handle battle completion
  const handleExitBattle = (isVictory: boolean) => {
    loadPlayerData();
    setActiveTab('PVE');
    setActiveBattleStage(null);
  };

  // Active Party Monsters (strictly resolved from profile.activeParty, in exact selected order)
  const activePartyMonsters: PlayerMonster[] = React.useMemo(() => {
    if (!profile?.activeParty || profile.activeParty.length === 0) {
      return monsters.slice(0, 5);
    }
    const resolved = profile.activeParty
      .map((id) => monsters.find((m) => m.instanceId === id))
      .filter((m): m is PlayerMonster => !!m);
    return resolved;
  }, [profile?.activeParty, monsters]);

  // Handle saving party configuration
  const handleSaveParty = async (newPartyIds: string[]) => {
    if (profile) {
      setProfile({
        ...profile,
        activeParty: newPartyIds,
        updatedAt: Date.now(),
      });
    }
    await savePlayerParty(newPartyIds);
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-4">
        <FantasySkyBackdrop />
        <div className="relative z-10 p-8 rounded-3xl fantasy-plate text-center max-w-sm w-full shadow-2xl">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-amber-300/40" />
            <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
          </div>
          <h1 className="text-2xl font-black font-serif text-[#5B3912] tracking-wider">
            MONSTER REALMS
          </h1>
          <p className="text-xs text-[#78634B] mt-2 leading-relaxed">
            Attuning realm portals, elemental monsters, and celestial tactical arena...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-4">
        <FantasySkyBackdrop />
        <div className="relative z-10 max-w-md w-full p-8 rounded-3xl fantasy-plate text-center space-y-4 shadow-2xl">
          <h2 className="text-xl font-black font-serif text-[#991B1B]">Session Connection</h2>
          <p className="text-xs text-[#78634B]">
            {errorNotice || 'Unable to establish game session. Click below to initialize a fresh adventurer squad.'}
          </p>
          <button
            onClick={() => loadPlayerData()}
            className="w-full py-3 rounded-2xl fantasy-btn-gold text-xs uppercase tracking-wider cursor-pointer"
          >
            Enter Monster Realms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative text-[#3E3022] font-sans selection:bg-amber-300 selection:text-amber-950 flex flex-col">
      {/* High-Fantasy Sky Backdrop (Granblue / Genshin Atmosphere) */}
      <FantasySkyBackdrop />

      {/* Top RPG Status & Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          // If leaving battle tab, clear selected stage
          if (activeTab === 'BATTLE' && tab !== 'BATTLE') {
            setActiveBattleStage(null);
          }
          setActiveTab(tab);
        }}
        profile={profile}
        currencies={profile.currencies}
        openDevTools={
          isDevAccount(profile?.username) || isDevAccount(currentUser?.email)
            ? () => setIsDevToolsOpen(true)
            : undefined
        }
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        pendingRequestsCount={pendingRequestsCount}
        onOpenProfileModal={handleOpenProfileModal}
        unclaimedRewardsCount={unclaimedRewardsCount}
      />

      {/* Main View Area (Extra bottom padding on mobile to clear the sticky bottom navigation) */}
      <main className="flex-1 pb-24 md:pb-16">
        {activeTab === 'HOME' && (
          <HomeHub
            profile={profile}
            monsters={monsters}
            stages={stages}
            currencies={profile.currencies}
            currentUser={currentUser}
            setActiveTab={setActiveTab}
            onOpenProfileModal={handleOpenProfileModal}
          />
        )}

        {(activeTab === 'PVE' || activeTab === 'CAMPAIGN') && (
          <PveHub
            profile={profile}
            monsters={monsters}
            stages={stages}
            onSelectStageForBattle={handleSelectStage}
            initialSubTab="CAMPAIGN"
          />
        )}

        {activeTab === 'BATTLE' && (
          <BattleView
            playerMonsters={activePartyMonsters}
            currentStage={activeBattleStage || stages[0]}
            onExitBattle={handleExitBattle}
          />
        )}

        {(activeTab === 'MONSTERS' || activeTab === 'PARTY' || activeTab === 'CODEX') && (
          <MonstersHub
            monsters={monsters}
            equipment={equipment}
            profile={profile}
            stages={stages}
            onSaveParty={handleSaveParty}
            onDeployBattle={handleSelectStage}
            onRefresh={loadPlayerData}
            initialSubTab={
              activeTab === 'PARTY'
                ? 'PARTY'
                : activeTab === 'CODEX'
                ? 'CODEX'
                : 'ROSTER'
            }
            onNavigateToCampaign={() => setActiveTab('PVE')}
          />
        )}

        {activeTab === 'SUMMON' && (
          <SummonView
            banners={banners}
            currencies={profile.currencies}
            monsters={monsters}
            profile={profile}
            onRefresh={loadPlayerData}
            onNavigateToFusion={() => setActiveTab('FUSION')}
          />
        )}

        {(activeTab === 'FUSION' || activeTab === 'SYNTHESIS') && (
          <SynthesisChamber
            monsters={monsters}
            currencies={profile.currencies}
            profile={profile}
            onRefresh={loadPlayerData}
            onSwitchToSummon={() => setActiveTab('SUMMON')}
          />
        )}

        {activeTab === 'FRIENDS' && (
          <FriendsView
            currentUser={currentUser}
            profile={profile}
            monsters={monsters}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onSparBattle={handleSparBattle}
            onClaimGiftReward={handleClaimGiftReward}
          />
        )}
      </main>

      {/* Tutorial Guidance Overlay (Persistent with prominent SKIP TUTORIAL) */}
      <TutorialOverlay
        tutorialState={profile.tutorialState}
        onUpdateTutorial={loadPlayerData}
        onNavigateToTab={setActiveTab}
      />

      {/* Developer Tools & Sandbox Modal - Strictly restricted to Dean or deanvantessel@gmail.com */}
      {(isDevAccount(profile?.username) || isDevAccount(currentUser?.email)) && (
        <DevToolsModal
          isOpen={isDevToolsOpen}
          onClose={() => setIsDevToolsOpen(false)}
          onStateModified={loadPlayerData}
          profile={profile}
          currentUser={currentUser}
        />
      )}

      {/* Account & Cloud Save Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        profile={profile}
        onSaveToCloud={handleSaveToCloud}
        onLoadFromCloud={handleLoadFromCloud}
        isSaving={isSavingCloud}
        lastSavedAt={lastSavedAt}
      />

      {/* Adventurer Profile, Avatar Selection & Level Progression Rewards Modal */}
      {isProfileModalOpen && profile && (
        <PlayerProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profile={profile}
          monsters={monsters}
          onProfileUpdated={(updatedProfile) => {
            setProfile(updatedProfile);
          }}
          initialTab={profileModalTab}
        />
      )}
    </div>
  );
}
