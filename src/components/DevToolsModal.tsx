/**
 * Developer Sandbox & Testing Console
 * Live testing panel to execute unit test suite, manipulate test state,
 * grant resources, and inspect battle architecture.
 */

import React, { useState } from 'react';
import {
  Wrench,
  Coins,
  Sparkles,
  ArrowUpCircle,
  Award,
  RotateCcw,
  X,
  PlusCircle,
  BookOpen,
  Map,
  Globe,
  Compass,
  Zap,
  Megaphone,
  Gift,
  Crown,
} from 'lucide-react';
import { callDevAction } from '../services/apiClient';
import { UnitCreatorTab } from './devtools/UnitCreatorTab';
import { UnitRegistryTab } from './devtools/UnitRegistryTab';
import { SpriteStandardizerTab } from './devtools/SpriteStandardizerTab';
import { CampaignDevToolsTab } from './devtools/CampaignDevToolsTab';
import { AwakeningCostsTab } from './devtools/AwakeningCostsTab';
import { NewsEditorTab } from './devtools/NewsEditorTab';
import { BannerEditorTab } from './devtools/BannerEditorTab';
import { EventGifterTab } from './devtools/EventGifterTab';
import { PlayerProfile, isDevAccount } from '../types';
import { User } from 'firebase/auth';

interface DevToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStateModified: () => void;
  profile?: PlayerProfile | null;
  currentUser?: User | null;
  initialTab?: DevToolsTab;
}

export type DevToolsTab =
  | 'NEWS'
  | 'BANNERS'
  | 'GIFTER'
  | 'CREATOR'
  | 'STATE'
  | 'REGISTRY'
  | 'STANDARDIZER'
  | 'CAMPAIGN'
  | 'AWAKENING';

export const DevToolsModal: React.FC<DevToolsModalProps> = ({
  isOpen,
  onClose,
  onStateModified,
  profile,
  currentUser,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<DevToolsTab>(initialTab || 'NEWS');
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  const isAuthorized = isDevAccount(profile?.username) || isDevAccount(currentUser?.email);
  if (!isOpen || !isAuthorized) return null;

  const handleAction = async (action: string, payload?: any) => {
    try {
      setLoadingAction(true);
      setActionFeedback(null);
      const res = await callDevAction(action, payload);
      if (res?.error) {
        setActionFeedback(`✗ ${res.error}`);
        return;
      }
      if (action === 'UNLOCK_ALL_CAMPAIGN') {
        setActionFeedback('✓ Successfully unlocked all 5 continents and 50 stages with 3★ mastery!');
      } else if (action === 'UNLOCK_ALL_CONTINENTS') {
        setActionFeedback('✓ Successfully unlocked gateways to all 5 continents!');
      } else if (action === 'RESET_CAMPAIGN') {
        setActionFeedback('✓ Reset campaign progression back to Stage 1-1.');
      } else if (action === 'ADD_ACCOUNT_EXP') {
        setActionFeedback('✓ Added +500 Account EXP! Check your profile level & rewards.');
      } else if (action === 'SET_ACCOUNT_LEVEL') {
        setActionFeedback(`✓ Set Account Level to ${payload?.level || 5}! Gems ready to claim.`);
      } else if (action === 'RESET_NAME_CHANGE') {
        setActionFeedback('✓ Reset profile name change status to FREE (0 gems).');
      } else if (action === 'COMPLETE_DAILY_MISSIONS') {
        setActionFeedback('✓ Completed all 4 daily missions and ready to claim 100 Gems!');
      } else if (action === 'FAST_FORWARD_PLAYTIME') {
        setActionFeedback('✓ Fast-forwarded playtime by 1 hour (3600s)!');
      } else if (action === 'RESET_DAILY_MISSIONS') {
        setActionFeedback('✓ Reset daily missions state to initial clean slate.');
      } else if (action === 'GRANT_ELEMENTAL_STONES') {
        setActionFeedback('✓ Granted +100 Small, +50 Medium, +25 Huge stones for all 6 Elements + 500,000 Gold!');
      } else {
        setActionFeedback(`Executed: ${action}`);
      }
      onStateModified();
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1E1710]/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-4xl w-full fantasy-scroll-card p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DEC8]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/50 flex items-center justify-center text-[#92400E] shadow-2xs">
              <Wrench className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#2E1F0F] font-serif">
                Developer Sandbox & Tools
              </h3>
              <p className="text-[11px] text-[#5C4A34] font-medium">
                Unit Creation, Live Sprite Registries, Campaign State & State Controls
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#FFFDF9] hover:bg-[#FAF6ED] border border-[#D5C29E] text-[#78654E] hover:text-[#2E1F0F] cursor-pointer shadow-2xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 py-2.5 border-b border-[#E8DEC8] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('NEWS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'NEWS'
                ? 'bg-amber-600 text-white shadow-sm font-black'
                : 'bg-[#FAF6ED] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E]'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-300" />
            <span>News & Updates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BANNERS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'BANNERS'
                ? 'bg-purple-600 text-white shadow-sm font-black'
                : 'bg-[#FAF6ED] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>Summon Banners</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GIFTER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'GIFTER'
                ? 'bg-emerald-600 text-white shadow-sm font-black'
                : 'bg-[#FAF6ED] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E]'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-emerald-300" />
            <span>Event Gifter</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CREATOR')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'CREATOR'
                ? 'bg-[#2E1F0F] text-[#FFFDF9] shadow-sm font-black'
                : 'bg-[#FAF6ED] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E]'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
            <span>Add New Unit</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REGISTRY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'REGISTRY'
                ? 'bg-[#2E1F0F] text-[#FFFDF9] shadow-sm font-black'
                : 'bg-[#FAF6ED] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Unit Registry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STANDARDIZER')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'STANDARDIZER'
                ? 'bg-[#2E1F0F] text-[#FFFDF9] shadow-sm font-black'
                : 'bg-[#FAF6ED] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Sprite Standardizer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AWAKENING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'AWAKENING'
                ? 'bg-[#2E1F0F] text-[#FFFDF9] shadow-sm font-black'
                : 'bg-[#FAF6ED] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Awakening</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CAMPAIGN')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'CAMPAIGN'
                ? 'bg-[#2E1F0F] text-[#FFFDF9] shadow-sm font-black'
                : 'bg-[#FAF6ED] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E]'
            }`}
          >
            <Map className="w-3.5 h-3.5 text-emerald-400" />
            <span>Campaign</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STATE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'STATE'
                ? 'bg-[#2E1F0F] text-[#FFFDF9] shadow-sm font-black'
                : 'bg-[#FAF6ED] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E]'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Sandbox State</span>
          </button>
        </div>

        {/* Feedback Message */}
        {actionFeedback && (
          <div className="my-2 p-2.5 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/60 text-[#92400E] text-xs font-semibold shadow-2xs">
            {actionFeedback}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-3 pr-1 text-xs">
          {activeTab === 'NEWS' && (
            <NewsEditorTab onNewsModified={onStateModified} />
          )}

          {activeTab === 'BANNERS' && (
            <BannerEditorTab onBannersModified={onStateModified} />
          )}

          {activeTab === 'GIFTER' && (
            <EventGifterTab
              currentUserProfile={profile}
              onGiftsDispatched={onStateModified}
            />
          )}

          {activeTab === 'AWAKENING' && (
            <AwakeningCostsTab onStateModified={onStateModified} />
          )}

          {activeTab === 'STANDARDIZER' && <SpriteStandardizerTab />}

          {activeTab === 'CAMPAIGN' && (
            <CampaignDevToolsTab
              profile={profile}
              onStateModified={onStateModified}
            />
          )}

          {activeTab === 'CREATOR' && (
            <UnitCreatorTab
              onUnitCreated={() => {
                onStateModified();
              }}
              onNavigateToParty={() => {
                onStateModified();
                onClose();
              }}
            />
          )}

          {activeTab === 'REGISTRY' && (
            <UnitRegistryTab
              onRosterUpdated={() => {
                onStateModified();
              }}
            />
          )}

          {activeTab === 'STATE' && (
            <div className="space-y-6">
              {/* Section: Sandbox State Manipulators */}
              <div className="space-y-3">
                <span className="font-bold text-[#92400E] uppercase tracking-wider text-[11px] font-serif">
                  Instant State Injection Tools
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    disabled={loadingAction}
                    onClick={() => handleAction('ADD_CURRENCY')}
                    className="p-3 rounded-2xl border border-[#D5C29E] bg-[#FFFDF9] hover:bg-[#FAF6ED] text-[#2E1F0F] font-bold flex items-center gap-2.5 cursor-pointer disabled:opacity-50 text-left transition-colors shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] border border-[#F59E0B]/40 flex items-center justify-center shrink-0">
                      <Coins className="w-4 h-4 text-[#D97706]" />
                    </div>
                    <div>
                      <div className="text-[#2E1F0F] font-bold">Add Currencies & Refill</div>
                      <div className="text-[10px] text-[#78654E]">+100k Gold, +2k Gems, +1k SP, Refill Stamina (⚡100)</div>
                    </div>
                  </button>

                  <button
                    disabled={loadingAction}
                    onClick={() => handleAction('GRANT_ELEMENTAL_STONES')}
                    className="p-3 rounded-2xl border border-amber-300 bg-[#FFFDF9] hover:bg-amber-50/50 text-[#2E1F0F] font-bold flex items-center gap-2.5 cursor-pointer disabled:opacity-50 text-left transition-colors shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <div className="text-[#2E1F0F] font-bold">Grant Awakening Stones</div>
                      <div className="text-[10px] text-[#78654E]">+100 Small, +50 Med, +25 Huge for all 6 Elements + 500k Gold</div>
                    </div>
                  </button>

                  <button
                    disabled={loadingAction}
                    onClick={() => handleAction('SET_ENERGY', { energy: 10 })}
                    className="p-3 rounded-2xl border border-[#D5C29E] bg-[#FFFDF9] hover:bg-[#FAF6ED] text-[#2E1F0F] font-bold flex items-center gap-2.5 cursor-pointer disabled:opacity-50 text-left transition-colors shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <div className="text-[#2E1F0F] font-bold">Set Stamina / Energy to 10</div>
                      <div className="text-[10px] text-[#78654E]">Test stamina consumption & low energy state</div>
                    </div>
                  </button>

                  <button
                    disabled={loadingAction}
                    onClick={() => handleAction('ADD_SYNTHESIS_CATALYSTS')}
                    className="p-3 rounded-2xl border border-[#D5C29E] bg-[#FFFDF9] hover:bg-[#FAF6ED] text-[#2E1F0F] font-bold flex items-center gap-2.5 cursor-pointer disabled:opacity-50 text-left transition-colors shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-300 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-purple-700" />
                    </div>
                    <div>
                      <div className="text-[#2E1F0F] font-bold">Add Synthesis Catalysts</div>
                      <div className="text-[10px] text-[#78654E]">Inject matching 1★, 2★, 3★ pairs + Gold</div>
                    </div>
                  </button>

                  <button
                    disabled={loadingAction}
                    onClick={() => handleAction('COMPLETE_DAILY_MISSIONS')}
                    className="p-3 rounded-2xl border border-[#F59E0B] bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#92400E] font-black flex items-center gap-2.5 cursor-pointer disabled:opacity-50 text-left transition-colors shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-200 border border-amber-400 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4 text-amber-800" />
                    </div>
                    <div>
                      <div className="text-[#2E1F0F] font-bold">Complete All Daily Missions</div>
                      <div className="text-[10px] text-[#78654E]">Finishes 3 Battles, Summon, and 1h Playtime</div>
                    </div>
                  </button>

                  <button
                    disabled={loadingAction}
                    onClick={() => handleAction('FAST_FORWARD_PLAYTIME', { seconds: 3600 })}
                    className="p-3 rounded-2xl border border-[#D5C29E] bg-[#FFFDF9] hover:bg-[#FAF6ED] text-[#2E1F0F] font-bold flex items-center gap-2.5 cursor-pointer disabled:opacity-50 text-left transition-colors shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-300 flex items-center justify-center shrink-0">
                      <Compass className="w-4 h-4 text-blue-700" />
                    </div>
                    <div>
                      <div className="text-[#2E1F0F] font-bold">Fast-Forward Playtime (+1 Hour)</div>
                      <div className="text-[10px] text-[#78654E]">Completes the 1 hour active playtime quest</div>
                    </div>
                  </button>

                  <button
                    disabled={loadingAction}
                    onClick={() => handleAction('RESET_DAILY_MISSIONS')}
                    className="p-3 rounded-2xl border border-[#D5C29E] bg-[#FFFDF9] hover:bg-[#FAF6ED] text-[#2E1F0F] font-bold flex items-center gap-2.5 cursor-pointer disabled:opacity-50 text-left transition-colors shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-300 flex items-center justify-center shrink-0">
                      <RotateCcw className="w-4 h-4 text-stone-700" />
                    </div>
                    <div>
                      <div className="text-[#2E1F0F] font-bold">Reset Daily Missions</div>
                      <div className="text-[10px] text-[#78654E]">Reset today's missions back to 0 progress</div>
                    </div>
                  </button>

                  <button
                    disabled={loadingAction}
                    onClick={() => handleAction('MAX_ALL_MONSTERS')}
                    className="p-3 rounded-2xl border border-[#D5C29E] bg-[#FFFDF9] hover:bg-[#FAF6ED] text-[#2E1F0F] font-bold flex items-center gap-2.5 cursor-pointer disabled:opacity-50 text-left transition-colors shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] border border-[#7DD3FC] flex items-center justify-center shrink-0">
                      <ArrowUpCircle className="w-4 h-4 text-[#0284C7]" />
                    </div>
                    <div>
                      <div className="text-[#2E1F0F] font-bold">Max All Roster Levels</div>
                      <div className="text-[10px] text-[#78654E]">Set all owned monsters to Level 30</div>
                    </div>
                  </button>

                  <button
                    disabled={loadingAction}
                    onClick={() => handleAction('AWAKEN_ALL_MONSTERS')}
                    className="p-3 rounded-2xl border border-[#D5C29E] bg-[#FFFDF9] hover:bg-[#FAF6ED] text-[#2E1F0F] font-bold flex items-center gap-2.5 cursor-pointer disabled:opacity-50 text-left transition-colors shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F3E8FF] border border-[#D8B4FE] flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4 text-[#7C3AED]" />
                    </div>
                    <div>
                      <div className="text-[#2E1F0F] font-bold">Awaken All Roster</div>
                      <div className="text-[10px] text-[#78654E]">Unlock awakened forms & skills</div>
                    </div>
                  </button>

                  <button
                    disabled={loadingAction}
                    onClick={() => handleAction('UNLOCK_ALL_VARIANTS')}
                    className="p-3 rounded-2xl border border-[#D5C29E] bg-[#FFFDF9] hover:bg-[#FAF6ED] text-[#2E1F0F] font-bold flex items-center gap-2.5 cursor-pointer disabled:opacity-50 text-left transition-colors shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] border border-[#86EFAC] flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-[#16A34A]" />
                    </div>
                    <div>
                      <div className="text-[#2E1F0F] font-bold">Unlock All 5 Variants</div>
                      <div className="text-[10px] text-[#78654E]">Add any missing prototype monsters</div>
                    </div>
                  </button>

                  {/* Account Progression Cheats */}
                  <button
                    disabled={loadingAction}
                    onClick={() => handleAction('ADD_ACCOUNT_EXP', { amount: 500 })}
                    className="p-3 rounded-2xl border border-[#D5C29E] bg-[#FFFDF9] hover:bg-[#FAF6ED] text-[#2E1F0F] font-bold flex items-center gap-2.5 cursor-pointer disabled:opacity-50 text-left transition-colors shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                      <ArrowUpCircle className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <div className="text-[#2E1F0F] font-bold">+500 Account EXP</div>
                      <div className="text-[10px] text-[#78654E]">Trigger account level up & gem rewards</div>
                    </div>
                  </button>

                  <button
                    disabled={loadingAction}
                    onClick={() => handleAction('SET_ACCOUNT_LEVEL', { level: 5 })}
                    className="p-3 rounded-2xl border border-[#D5C29E] bg-[#FFFDF9] hover:bg-[#FAF6ED] text-[#2E1F0F] font-bold flex items-center gap-2.5 cursor-pointer disabled:opacity-50 text-left transition-colors shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-200 border border-amber-400 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4 text-amber-900" />
                    </div>
                    <div>
                      <div className="text-[#2E1F0F] font-bold">Set Account to Lv. 5</div>
                      <div className="text-[10px] text-[#78654E]">Unlock Lv 2-4 (50g) and Lv 5 (100g) rewards</div>
                    </div>
                  </button>

                  <button
                    disabled={loadingAction}
                    onClick={() => handleAction('RESET_NAME_CHANGE')}
                    className="p-3 rounded-2xl border border-[#D5C29E] bg-[#FFFDF9] hover:bg-[#FAF6ED] text-[#2E1F0F] font-bold flex items-center gap-2.5 cursor-pointer disabled:opacity-50 text-left transition-colors shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
                      <RotateCcw className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <div className="text-[#2E1F0F] font-bold">Reset Name Change Free</div>
                      <div className="text-[10px] text-[#78654E]">Reset hasChangedName to test free rename</div>
                    </div>
                  </button>

                  <button
                    disabled={loadingAction}
                    onClick={() => handleAction('UNLOCK_ALL_CAMPAIGN')}
                    className="p-3 rounded-2xl border-2 border-emerald-500/60 bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#065F46] font-bold flex items-center gap-2.5 cursor-pointer disabled:opacity-50 text-left transition-colors shadow-2xs col-span-1 sm:col-span-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[#064E3B] font-black flex items-center gap-1.5">
                        <span>Unlock All Campaign (50/50 Stages)</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      </div>
                      <div className="text-[10px] text-[#047857]">
                        Unlock all 5 continents, 50 stages with 3★ mastery, & clear all boss barriers
                      </div>
                    </div>
                  </button>

                  <button
                    disabled={loadingAction}
                    onClick={() => handleAction('UNLOCK_ALL_CONTINENTS')}
                    className="p-3 rounded-2xl border border-[#7DD3FC] bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#0369A1] font-bold flex items-center gap-2.5 cursor-pointer disabled:opacity-50 text-left transition-colors shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[#0C4A6E] font-bold">Unlock 5 Continents</div>
                      <div className="text-[10px] text-[#0284C7]">Clear continent boss gateways 1-10 to 4-10</div>
                    </div>
                  </button>

                  <button
                    disabled={loadingAction}
                    onClick={() => handleAction('RESET_CAMPAIGN')}
                    className="p-3 rounded-2xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold flex items-center gap-2.5 cursor-pointer disabled:opacity-50 text-left transition-colors shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-200 border border-amber-400 text-amber-900 flex items-center justify-center shrink-0">
                      <RotateCcw className="w-4 h-4 text-amber-800" />
                    </div>
                    <div>
                      <div className="text-amber-950 font-bold">Reset Campaign Progress</div>
                      <div className="text-[10px] text-amber-800">Return world map to Stage 1-1</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Section 3: Reset Account */}
              <div className="pt-2 border-t border-[#E8DEC8]">
                <button
                  disabled={loadingAction}
                  onClick={() => handleAction('RESET_ACCOUNT')}
                  className="w-full py-2.5 rounded-xl border border-[#FDA4AF] bg-[#FFE4E6] hover:bg-[#FECDD3] text-[#9F1239] font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Account to Fresh Starter Team (5 Monsters)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
