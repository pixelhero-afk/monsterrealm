/**
 * Monster Realms - Unified Monsters & Party Hub
 * Consolidates Party Formation, Monsters & Equipment Roster, and Monster Codex
 * under a single unified navigation interface.
 */

import React, { useState } from 'react';
import {
  Users,
  Shield,
  BookOpen,
  Sparkles,
  Swords,
  Crown,
  Layers,
} from 'lucide-react';
import { EquipmentItem, PlayerMonster, PlayerProfile, PvEStage } from '../types';
import { PartyView } from './PartyView';
import { MonstersView } from './MonstersView';
import { CodexView } from './CodexView';

export type MonstersSubTab = 'PARTY' | 'ROSTER' | 'CODEX';

interface MonstersHubProps {
  monsters: PlayerMonster[];
  equipment: EquipmentItem[];
  profile: PlayerProfile;
  stages: PvEStage[];
  initialSubTab?: MonstersSubTab;
  onSaveParty: (newPartyIds: string[]) => Promise<void>;
  onDeployBattle: (stage: PvEStage) => void;
  onNavigateToCampaign: () => void;
  onRefreshData: () => void;
}

export const MonstersHub: React.FC<MonstersHubProps> = ({
  monsters,
  equipment,
  profile,
  stages,
  initialSubTab = 'PARTY',
  onSaveParty,
  onDeployBattle,
  onNavigateToCampaign,
  onRefreshData,
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
    <div className="space-y-4">
      {/* Sub-Navigation Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3">
        <div className="bg-[#FFFDF9]/90 backdrop-blur-md border-2 border-[#D8C7A5] rounded-2xl p-2 sm:p-2.5 shadow-[0_4px_20px_rgba(160,118,55,0.08)] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Section Title & Highlights */}
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm ring-1 ring-amber-300 shrink-0">
              {subTab === 'PARTY' && <Users className="w-4 h-4" />}
              {subTab === 'ROSTER' && <Shield className="w-4 h-4" />}
              {subTab === 'CODEX' && <BookOpen className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-black text-sm sm:text-base text-[#4A3215]">
                  {subTab === 'PARTY' && 'Party Formation'}
                  {subTab === 'ROSTER' && 'Monsters & Equipment'}
                  {subTab === 'CODEX' && 'Monster Codex'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#92400E] bg-[#FEF3C7] border border-[#FCD34D] px-2 py-0.5 rounded-full shadow-2xs">
                  {subTab === 'PARTY' && `${activePartyCount}/5 Deployed`}
                  {subTab === 'ROSTER' && `${totalMonstersCount} Owned`}
                  {subTab === 'CODEX' && 'Bestiary'}
                </span>
              </div>
              <p className="text-[11px] text-[#78634B] hidden sm:block">
                {subTab === 'PARTY' && 'Manage your active 5v5 combat squad, lead skills, and elemental synergies.'}
                {subTab === 'ROSTER' && 'Level up creatures, awaken potential, and equip 4-slot gear sets.'}
                {subTab === 'CODEX' && 'Explore monster lore, elemental variants, and complete skill compendiums.'}
              </p>
            </div>
          </div>

          {/* Segmented Control Buttons */}
          <div className="flex items-center gap-1 bg-[#F5EBD7] p-1 rounded-xl border border-[#D5C29E] w-full sm:w-auto overflow-x-auto scrollbar-none">
            {/* 1. Party Formation */}
            <button
              onClick={() => setSubTab('PARTY')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                subTab === 'PARTY'
                  ? 'bg-gradient-to-b from-[#FFFDF9] to-[#FDF8EE] text-[#78350F] shadow-sm border border-[#D5C29E] ring-1 ring-amber-400/40'
                  : 'text-[#78634B] hover:text-[#4A3215] hover:bg-[#EFE2C8]/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-700" />
              <span>Party</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                subTab === 'PARTY' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#E8DCC0] text-[#78634B]'
              }`}>
                {activePartyCount}/5
              </span>
            </button>

            {/* 2. Monster Roster & Equipment */}
            <button
              onClick={() => setSubTab('ROSTER')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                subTab === 'ROSTER'
                  ? 'bg-gradient-to-b from-[#FFFDF9] to-[#FDF8EE] text-[#78350F] shadow-sm border border-[#D5C29E] ring-1 ring-amber-400/40'
                  : 'text-[#78634B] hover:text-[#4A3215] hover:bg-[#EFE2C8]/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              <span>Monsters</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                subTab === 'ROSTER' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#E8DCC0] text-[#78634B]'
              }`}>
                {totalMonstersCount}
              </span>
            </button>

            {/* 3. Monster Codex */}
            <button
              onClick={() => setSubTab('CODEX')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                subTab === 'CODEX'
                  ? 'bg-gradient-to-b from-[#FFFDF9] to-[#FDF8EE] text-[#78350F] shadow-sm border border-[#D5C29E] ring-1 ring-amber-400/40'
                  : 'text-[#78634B] hover:text-[#4A3215] hover:bg-[#EFE2C8]/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>Codex</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Active Sub-View */}
      <div>
        {subTab === 'PARTY' && (
          <PartyView
            monsters={monsters}
            profile={profile}
            stages={stages}
            onSaveParty={onSaveParty}
            onDeployBattle={onDeployBattle}
            onNavigateToCampaign={onNavigateToCampaign}
          />
        )}

        {subTab === 'ROSTER' && (
          <MonstersView
            monsters={monsters}
            equipment={equipment}
            profile={profile}
            onRefresh={onRefreshData}
          />
        )}

        {subTab === 'CODEX' && <CodexView />}
      </div>
    </div>
  );
};
