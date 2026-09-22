import React, { useState } from 'react';
import {
  Map,
  Globe,
  Compass,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Lock,
  Unlock,
  Star,
  Flame,
  Droplets,
  Trees,
  Sun,
  Moon,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { PlayerProfile, ElementType } from '../../types';
import { CONTINENTS, PVE_STAGES, isContinentUnlocked } from '../../data/stages';
import { callDevAction } from '../../services/apiClient';

interface CampaignDevToolsTabProps {
  profile?: PlayerProfile | null;
  onStateModified: () => void;
}

export const CampaignDevToolsTab: React.FC<CampaignDevToolsTabProps> = ({
  profile,
  onStateModified,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const completedStages = Array.isArray(profile?.completedStages) ? profile.completedStages : [];
  const stageStars = profile?.stageStars || {};
  const totalStages = PVE_STAGES.length;
  const clearedCount = completedStages.length;
  const progressPercent = Math.min(100, Math.round((clearedCount / totalStages) * 100));
  const totalStars = Object.values(stageStars).reduce<number>((acc, s) => acc + (Number(s) || 0), 0);
  const maxPossibleStars = totalStages * 3;

  const getElementIcon = (element: ElementType) => {
    switch (element) {
      case 'FIRE':
        return <Flame className="w-4 h-4 text-rose-500" />;
      case 'WATER':
        return <Droplets className="w-4 h-4 text-cyan-500" />;
      case 'GRASS':
        return <Trees className="w-4 h-4 text-emerald-500" />;
      case 'LIGHT':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'DARK':
        return <Moon className="w-4 h-4 text-purple-500" />;
      default:
        return <Globe className="w-4 h-4 text-amber-500" />;
    }
  };

  const executeDevAction = async (action: string, payload?: any, successMsg?: string) => {
    try {
      setLoading(true);
      setFeedback(null);
      await callDevAction(action, payload);
      setFeedback(successMsg || `Action '${action}' executed successfully.`);
      onStateModified();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div className="p-3 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] text-xs font-bold flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Campaign Progress Status Dashboard */}
      <div className="bg-[#FAF6ED] border border-[#D5C29E] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shadow-2xs">
              <Map className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#2E1F0F] font-serif">
                Campaign Progression Engine
              </h4>
              <p className="text-[11px] text-[#78654E]">
                Continental world state, gateway boss barriers, and stage mastery
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-[#92400E] font-mono px-2.5 py-1 rounded-lg bg-[#FEF3C7] border border-[#F59E0B]/40">
            {clearedCount === totalStages ? '100% UNLOCKED' : `${clearedCount}/${totalStages} CLEARED`}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-[#5C4A34]">
            <span>Total Campaign Stages ({progressPercent}%)</span>
            <span>{clearedCount} of {totalStages} Stages Cleared</span>
          </div>
          <div className="w-full h-2.5 bg-[#E8DEC8] rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500 shadow-inner"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-mono">
          <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8]">
            <div className="text-[10px] text-[#78654E] font-sans font-bold uppercase">Stages Cleared</div>
            <div className="text-sm font-black text-[#2E1F0F]">{clearedCount} / {totalStages}</div>
          </div>
          <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8]">
            <div className="text-[10px] text-[#78654E] font-sans font-bold uppercase flex items-center justify-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-400" /> Stars
            </div>
            <div className="text-sm font-black text-amber-700">{totalStars} / {maxPossibleStars}</div>
          </div>
          <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8]">
            <div className="text-[10px] text-[#78654E] font-sans font-bold uppercase">Continents Open</div>
            <div className="text-sm font-black text-emerald-700">
              {CONTINENTS.filter((c) => isContinentUnlocked(c.continentId, completedStages)).length} / 5
            </div>
          </div>
          <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E8DEC8]">
            <div className="text-[10px] text-[#78654E] font-sans font-bold uppercase">Highest Stage</div>
            <div className="text-xs font-black text-[#2E1F0F] truncate mt-0.5">
              {profile?.highestUnlockedStage || 'stage_1_1'}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="space-y-3">
        <span className="font-bold text-[#92400E] uppercase tracking-wider text-[11px] font-serif">
          Instant Campaign Unlock Tools
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* MASTER BUTTON: UNLOCK ALL CAMPAIGN */}
          <button
            disabled={loading}
            onClick={() =>
              executeDevAction(
                'UNLOCK_ALL_CAMPAIGN',
                undefined,
                '✓ All 5 Continents and 50 Stages unlocked with 3★ mastery! Full campaign ready for testing.'
              )
            }
            className="p-4 rounded-2xl border-2 border-emerald-500/70 bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] hover:from-[#D1FAE5] hover:to-[#A7F3D0] text-[#065F46] font-bold flex items-center gap-3.5 cursor-pointer disabled:opacity-50 text-left transition-all shadow-md group hover:scale-[1.01]"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-[#064E3B] flex items-center gap-1.5">
                <span>Unlock All Campaign (50/50 Stages)</span>
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
              </div>
              <div className="text-[11px] text-[#047857] mt-0.5">
                Instantly unlocks all 5 Continents with 3★ completion. Jump directly into any map, boss, or stage!
              </div>
            </div>
          </button>

          {/* UNLOCK ALL CONTINENT GATEWAYS */}
          <button
            disabled={loading}
            onClick={() =>
              executeDevAction(
                'UNLOCK_ALL_CONTINENTS',
                undefined,
                '✓ All 5 Continent gateways unlocked! Boss barriers 1-10 through 4-10 cleared.'
              )
            }
            className="p-4 rounded-2xl border-2 border-sky-400/70 bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] hover:from-[#E0F2FE] hover:to-[#BAE6FD] text-[#0369A1] font-bold flex items-center gap-3.5 cursor-pointer disabled:opacity-50 text-left transition-all shadow-md group hover:scale-[1.01]"
          >
            <div className="w-11 h-11 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-[#0C4A6E] flex items-center gap-1.5">
                <span>Unlock All 5 Continents (Gateways)</span>
                <Unlock className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-[11px] text-[#0284C7] mt-0.5">
                Clears continent barrier bosses (1-10, 2-10, 3-10, 4-10) so all 5 realms are immediately open.
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Individual Continent Unlock Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#92400E] uppercase tracking-wider text-[11px] font-serif">
            5 Continents Status & Selective Gateway Unlocks
          </span>
          <span className="text-[10px] text-[#78654E]">
            Click any locked continent to unlock all prior chapters
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {CONTINENTS.map((continent) => {
            const isUnlocked = isContinentUnlocked(continent.continentId, completedStages);
            const continentStages = PVE_STAGES.filter((s) => s.chapter === continent.chapter);
            const clearedInContinent = continentStages.filter((s) => completedStages.includes(s.stageId)).length;
            const isFullyCleared = clearedInContinent === continentStages.length;

            return (
              <div
                key={continent.continentId}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isFullyCleared
                    ? 'bg-[#F0FDF4] border-[#86EFAC]'
                    : isUnlocked
                    ? 'bg-[#FFFDF9] border-[#D5C29E]'
                    : 'bg-[#F5F5F4] border-[#E7E5E4] opacity-80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: `${continent.colorHex}20`, borderColor: continent.colorHex }}
                  >
                    {getElementIcon(continent.element)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#2E1F0F] truncate font-serif">
                        Ch.{continent.chapter} {continent.name}
                      </span>
                      {isFullyCleared ? (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          10/10 ★★★
                        </span>
                      ) : isUnlocked ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300">
                          {clearedInContinent}/10
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-600 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Locked
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#78654E] truncate">
                      Boss: {continent.bossName}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {!isUnlocked ? (
                    <button
                      disabled={loading}
                      onClick={() =>
                        executeDevAction(
                          'UNLOCK_CONTINENT_UP_TO',
                          { chapter: continent.chapter },
                          `✓ Unlocked Chapter ${continent.chapter}: ${continent.name}!`
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-900 text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Unlock className="w-3 h-3" />
                      <span>Unlock</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Open</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Campaign Tool */}
      <div className="pt-2 border-t border-[#E8DEC8]">
        <button
          disabled={loading}
          onClick={() =>
            executeDevAction(
              'RESET_CAMPAIGN',
              undefined,
              '✓ Campaign progress reset to Stage 1-1. Roster and currencies retained.'
            )
          }
          className="w-full py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
        >
          <RotateCcw className="w-4 h-4 text-amber-700" />
          Reset Campaign Progress (Back to Stage 1-1)
        </button>
      </div>
    </div>
  );
};
