/**
 * Monster Realms - Unified Monsters & Party Hub
 * Consolidates Party Formation, Monsters & Equipment Roster, and Monster Codex
 * Styled with the arcade RPG command center HUD matching HOME and PVE.
 */

import React, { useState } from 'react';
import {
  Users,
  Shield,
  BookOpen,
  Flame,
} from 'lucide-react';
import { Currencies, EquipmentItem, PlayerMonster, PlayerProfile, PvEStage } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { ActiveTab } from './Navbar';
import { PartyView } from './PartyView';
import { MonstersView } from './MonstersView';
import { CodexView } from './CodexView';
import { SynthesisChamber } from './SynthesisChamber';
import { HubCommandHeader, HubCurrenciesMatrix } from './common/HubCommandHeader';
import { GoogleAdSenseBanner } from './ads/GoogleAdSenseBanner';

export type MonstersSubTab = 'PARTY' | 'ROSTER' | 'FUSION' | 'CODEX';

interface MonstersHubProps {
  monsters: PlayerMonster[];
  equipment: EquipmentItem[];
  profile: PlayerProfile;
  stages: PvEStage[];
  currencies: Currencies;
  currentUser?: FirebaseUser | null;
  initialSubTab?: MonstersSubTab;
  onSaveParty: (newPartyIds: string[]) => Promise<void>;
  onDeployBattle: (stage: PvEStage) => void;
  onNavigateToCampaign: () => void;
  onRefresh?: () => void;
  setActiveTab?: (tab: ActiveTab) => void;
  onOpenProfileModal?: (tab?: 'OVERVIEW' | 'REWARDS' | 'AVATAR' | 'MAILBOX') => void;
  onOpenAuthModal?: () => void;
}

export const MonstersHub: React.FC<MonstersHubProps> = ({
  monsters,
  equipment,
  profile,
  stages,
  currencies,
  currentUser,
  initialSubTab = 'PARTY',
  onSaveParty,
  onDeployBattle,
  onNavigateToCampaign,
  onRefresh,
  setActiveTab,
  onOpenProfileModal,
  onOpenAuthModal,
}) => {
  const [subTab, setSubTab] = useState<MonstersSubTab>(initialSubTab);

  // Sync subTab if initialSubTab prop changes externally
  React.useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const activePartyCount = profile.activeParty?.length || 0;
  const totalMonstersCount = monsters.length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-3.5 sm:space-y-4 relative z-10">
      {/* ═══════════════════════════════════════════════════════════════
          ROW 1: TOP HEADER (HOME, Player Profile, Music Toggle, Cloud Account)
          ═══════════════════════════════════════════════════════════════ */}
      <HubCommandHeader
        activeTab="MONSTERS"
        setActiveTab={setActiveTab}
        profile={profile}
        currentUser={currentUser}
        onOpenProfileModal={onOpenProfileModal}
        onOpenAuthModal={onOpenAuthModal}
      />

      {/* ═══════════════════════════════════════════════════════════════
          ROW 2: SUB-NAVIGATION BUTTONS & CURRENCIES MATRIX
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 items-stretch">
        {/* Left Half: Subnav Grid (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-2">
          {/* Row 2a: Party | Roster | Codex | (placeholder) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setSubTab('PARTY')}
              className={`py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                subTab === 'PARTY'
                  ? 'bg-[#FFFDF9] border-[3px] border-[#F59E0B] text-[#2E1F0F] ring-2 ring-amber-300/40 font-black'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F]'
              }`}
            >
              <Users className="w-4 h-4 text-amber-700" />
              <span>Party ({activePartyCount}/5)</span>
            </button>

            <button
              onClick={() => setSubTab('ROSTER')}
              className={`py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                subTab === 'ROSTER'
                  ? 'bg-[#FFFDF9] border-[3px] border-[#F59E0B] text-[#2E1F0F] ring-2 ring-amber-300/40 font-black'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F]'
              }`}
            >
              <Shield className="w-4 h-4 text-blue-700" />
              <span>Roster ({totalMonstersCount})</span>
            </button>

            <button
              onClick={() => setSubTab('FUSION')}
              className={`py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                subTab === 'FUSION'
                  ? 'bg-[#FFFDF9] border-[3px] border-[#F59E0B] text-[#2E1F0F] ring-2 ring-amber-300/40 font-black'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F]'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-600" />
              <span>Fusion</span>
            </button>

            <button
              onClick={() => setSubTab('CODEX')}
              className={`py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                subTab === 'CODEX'
                  ? 'bg-[#FFFDF9] border-[3px] border-[#F59E0B] text-[#2E1F0F] ring-2 ring-amber-300/40 font-black'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] text-[#2E1F0F]'
              }`}
            >
              <BookOpen className="w-4 h-4 text-purple-700" />
              <span>Codex</span>
            </button>
          </div>

          {/* Row 2b: Placeholder slots matching arcade HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="py-2.5 px-3 rounded-2xl bg-[#E2EEF5]/40 border-2 border-dashed border-[#B0C4D0] pointer-events-none" />
            <div className="py-2.5 px-3 rounded-2xl bg-[#E2EEF5]/40 border-2 border-dashed border-[#B0C4D0] pointer-events-none" />
            <div className="py-2.5 px-3 rounded-2xl bg-[#E2EEF5]/40 border-2 border-dashed border-[#B0C4D0] hidden sm:block pointer-events-none" />
            <div className="py-2.5 px-3 rounded-2xl bg-[#E2EEF5]/40 border-2 border-dashed border-[#B0C4D0] hidden sm:block pointer-events-none" />
          </div>
        </div>

        {/* Right Half: 2x2 Currencies Matrix (5 cols) */}
        <div className="lg:col-span-5">
          <HubCurrenciesMatrix currencies={currencies} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 3: MAIN VIEW CONTAINER (Framed Box with 2px Dark Border)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-3xl sm:rounded-[32px] p-3 sm:p-5 shadow-sm min-h-[500px]">
        {subTab === 'PARTY' && (
          <PartyView
            monsters={monsters}
            equipment={equipment}
            profile={profile}
            stages={stages}
            onSaveParty={onSaveParty}
            onDeployBattle={onDeployBattle}
            onNavigateToCampaign={onNavigateToCampaign}
            onRefreshData={onRefresh}
            onNavigateToFusion={() => setSubTab('FUSION')}
          />
        )}

        {subTab === 'ROSTER' && (
          <MonstersView
            monsters={monsters}
            profile={profile}
            equipment={equipment}
            onSelectMonster={() => {}}
            onRefresh={onRefresh || (() => {})}
          />
        )}

        {subTab === 'FUSION' && (
          <SynthesisChamber
            monsters={monsters}
            currencies={currencies}
            profile={profile}
            currentUser={currentUser}
            onRefresh={onRefresh || (() => {})}
            setActiveTab={setActiveTab || (() => {})}
            onOpenProfileModal={onOpenProfileModal}
            onOpenAuthModal={onOpenAuthModal}
            onSwitchToSummon={() => setActiveTab?.('SUMMON')}
          />
        )}

        {subTab === 'CODEX' && (
          <CodexView
            ownedMonsters={monsters}
            onSelectVariant={() => {}}
          />
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 4: GOOGLE ADSENSE SPONSORED BANNER
          ═══════════════════════════════════════════════════════════════ */}
      <GoogleAdSenseBanner />
    </div>
  );
};
