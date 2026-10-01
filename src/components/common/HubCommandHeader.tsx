import React, { useState, useEffect } from 'react';
import {
  Flame,
  Volume2,
  VolumeX,
  ArrowRight,
  Zap,
  Sparkles,
  Coins,
  Gem,
  Mail,
  Package,
} from 'lucide-react';
import { Currencies, PlayerProfile } from '../../types';
import { User as FirebaseUser } from 'firebase/auth';
import { ActiveTab } from '../Navbar';
import { MONSTER_VARIANTS } from '../../data/monsters';
import { MonsterAvatar } from '../MonsterAvatar';
import { musicEngine } from '../../services/audio/musicEngine';

interface HubCommandHeaderProps {
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  profile: PlayerProfile;
  currentUser?: FirebaseUser | null;
  onOpenProfileModal?: (tab?: 'OVERVIEW' | 'REWARDS' | 'AVATAR' | 'MAILBOX') => void;
  onOpenAuthModal?: () => void;
  unclaimedRewardsCount?: number;
  unclaimedMailCount?: number;
}

export const HubCommandHeader: React.FC<HubCommandHeaderProps> = ({
  activeTab,
  setActiveTab,
  profile,
  currentUser,
  onOpenProfileModal,
  onOpenAuthModal,
  unclaimedRewardsCount = 0,
  unclaimedMailCount = 0,
}) => {
  const [musicState, setMusicState] = useState(musicEngine.getState());

  useEffect(() => {
    const unsub = musicEngine.subscribe((state) => {
      setMusicState({ ...state });
    });
    return unsub;
  }, []);

  const isSoundActive =
    musicState.isPlaying &&
    !musicState.isMuted &&
    musicState.volume > 0 &&
    musicState.track !== 'NONE';

  const handleToggleMusic = () => {
    musicEngine.toggleMusic();
  };

  const avatarVariant = profile?.avatarVariantId
    ? MONSTER_VARIANTS[profile.avatarVariantId]
    : null;

  const isHome = activeTab === 'HOME';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3">
      {/* Box 1: Brand Logo on HOME or HOME Navigation Button on Sub-Pages */}
      {isHome ? (
        <div className="lg:col-span-3 bg-[#FFFDF9] border-2 border-[#2E1F0F] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 border border-[#2E1F0F] flex items-center justify-center text-white shadow-xs">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <span className="font-black text-sm sm:text-base font-serif tracking-wider text-[#2E1F0F]">
              MONSTER REALMS
            </span>
          </div>
          <span className="bg-[#2E1F0F] text-amber-200 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-tight shadow-2xs">
            v1.0
          </span>
        </div>
      ) : (
        <button
          onClick={() => setActiveTab?.('HOME')}
          className="lg:col-span-3 bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl p-2.5 sm:p-3 flex items-center justify-center shadow-xs cursor-pointer transition-colors group"
          title="Return to Home Hub"
        >
          <span className="font-black text-sm sm:text-base font-serif tracking-widest text-[#2E1F0F] group-hover:scale-105 transition-transform flex items-center gap-2">
            <span className="text-amber-700">←</span>
            <span>HOME</span>
          </span>
        </button>
      )}

      {/* Box 2: Player Avatar & Level Pill */}
      <button
        onClick={() => onOpenProfileModal?.('OVERVIEW')}
        className="lg:col-span-3 bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-xs cursor-pointer transition-colors text-left group"
        title="Open Adventurer Profile & Progression"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border border-[#2E1F0F] flex items-center justify-center text-[#2E1F0F] font-black text-sm shrink-0 overflow-hidden shadow-2xs">
            {avatarVariant ? (
              <MonsterAvatar
                variantId={profile.avatarVariantId}
                element={avatarVariant.element}
                size="sm"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{profile.username?.charAt(0)?.toUpperCase() || 'D'}</span>
            )}
          </div>

          <div className="min-w-0">
            <div className="font-black text-xs sm:text-sm text-[#2E1F0F] font-serif truncate group-hover:text-amber-800 transition-colors">
              {profile.username || 'Guardian'}
            </div>
            <div className="inline-block bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] px-2 py-0.2 rounded-full text-[10px] font-black font-mono">
              Lv. {profile.accountLevel} Guardian
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {unclaimedMailCount > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onOpenProfileModal?.('MAILBOX');
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-[9px] font-black shadow-xs animate-bounce font-mono cursor-pointer"
              title={`${unclaimedMailCount} Unclaimed Gifts in Mailbox!`}
            >
              <Mail className="w-2.5 h-2.5" />
              <span>{unclaimedMailCount}</span>
            </span>
          )}
          {unclaimedRewardsCount > 0 && (
            <span
              className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"
              title={`${unclaimedRewardsCount} rewards ready`}
            />
          )}
          <div
            className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400 shadow-xs"
            title="Online & Synced"
          />
        </div>
      </button>

      {/* Box 3: Music Toggle */}
      <button
        onClick={handleToggleMusic}
        className="lg:col-span-3 bg-[#FFFDF9] hover:bg-[#FAF6ED] border-2 border-[#2E1F0F] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-xs cursor-pointer transition-colors"
        title={isSoundActive ? 'Mute Background Music' : 'Play Background Music'}
      >
        <span className="font-black text-xs sm:text-sm font-serif tracking-wide text-[#2E1F0F]">
          Music: {isSoundActive ? 'On' : 'Off'}
        </span>
        <div
          className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-colors ${
            isSoundActive
              ? 'bg-amber-100 border-[#2E1F0F] text-[#2E1F0F]'
              : 'bg-[#FAF6ED] border-[#D5C29E] text-[#78654E]'
          }`}
        >
          {isSoundActive ? <Volume2 className="w-4 h-4 text-amber-800" /> : <VolumeX className="w-4 h-4 text-rose-700" />}
        </div>
      </button>

      {/* Box 4: Cloud Account -> */}
      <button
        onClick={onOpenAuthModal}
        className="lg:col-span-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-500 hover:from-amber-500 hover:to-amber-600 border-2 border-[#2E1F0F] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-xs cursor-pointer transition-all text-[#2E1F0F] group"
        title={currentUser ? 'Cloud Account Connected' : 'Open Cloud Account & Cloud Save'}
      >
        <span className="font-black text-xs sm:text-sm font-serif tracking-wide">
          {currentUser ? 'Cloud Account' : 'Login / Account'}
        </span>
        <div className="w-6 h-6 rounded-full bg-[#2E1F0F] text-amber-300 flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0">
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </button>
    </div>
  );
};

interface HubCurrenciesMatrixProps {
  currencies: Currencies;
  className?: string;
  onOpenInventory?: () => void;
  scrollsCount?: number;
}

export const HubCurrenciesMatrix: React.FC<HubCurrenciesMatrixProps> = ({
  currencies,
  className = '',
  onOpenInventory,
  scrollsCount,
}) => {
  const formattedGold =
    currencies.gold >= 1000000
      ? `${(currencies.gold / 1000000).toFixed(1)}M`
      : currencies.gold >= 10000
      ? `${Math.floor(currencies.gold / 1000)}k`
      : currencies.gold.toLocaleString();

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {/* Energy */}
      <div
        className="bg-[#ECFDF5] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#065F46] font-black text-xs sm:text-sm shadow-xs"
        title="Energy (Stamina)"
      >
        <span className="truncate">
          Energy : {currencies.energy} / {currencies.maxEnergy}
        </span>
        <Zap className="w-4 h-4 text-[#10B981] fill-[#10B981] shrink-0" />
      </div>

      {/* Inventory (in place of SP) */}
      {onOpenInventory ? (
        <button
          type="button"
          onClick={onOpenInventory}
          className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] hover:from-[#FDE68A] hover:to-[#FCD34D] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#92400E] font-black text-xs sm:text-sm shadow-xs cursor-pointer transition-all active:scale-95 group text-left"
          title="Open Adventurer Inventory (Scrolls, Awakening Stones, Gear)"
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="truncate font-serif">Inventory</span>
            {typeof scrollsCount === 'number' && scrollsCount > 0 && (
              <span className="bg-[#B45309] text-white text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full">
                {scrollsCount}
              </span>
            )}
          </div>
          <Package className="w-4 h-4 text-[#B45309] group-hover:rotate-12 transition-transform shrink-0" />
        </button>
      ) : (
        <div
          className="bg-[#F0F9FF] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#0369A1] font-black text-xs sm:text-sm shadow-xs"
          title="Summon Points"
        >
          <span className="truncate">SP : {currencies.summonPoints}</span>
          <Sparkles className="w-4 h-4 text-[#0EA5E9] shrink-0" />
        </div>
      )}

      {/* Gold */}
      <div
        className="bg-[#FFFBEB] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#92400E] font-black text-xs sm:text-sm shadow-xs"
        title="Gold"
      >
        <span className="truncate">Gold : {formattedGold}</span>
        <Coins className="w-4 h-4 text-[#D97706] shrink-0" />
      </div>

      {/* Gems */}
      <div
        className="bg-[#FAF5FF] border-2 border-[#2E1F0F] rounded-2xl py-2.5 px-3 sm:px-4 flex items-center justify-between text-[#6B21A8] font-black text-xs sm:text-sm shadow-xs"
        title="Gems"
      >
        <span className="truncate">Gems : {currencies.gems}</span>
        <Gem className="w-4 h-4 text-[#9333EA] shrink-0" />
      </div>
    </div>
  );
};
