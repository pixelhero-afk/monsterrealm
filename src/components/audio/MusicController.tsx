import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Disc,
  Sparkles,
  Swords,
  Crown,
  Flame,
  Play,
  Pause,
  ChevronDown,
  Volume1,
} from 'lucide-react';
import { musicEngine, MusicTrackId, MusicEngineState } from '../../services/audio/musicEngine';

interface MusicControllerProps {
  compact?: boolean;
}

export const MusicController: React.FC<MusicControllerProps> = ({ compact = false }) => {
  const [engineState, setEngineState] = useState<MusicEngineState>(musicEngine.getState());
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = musicEngine.subscribe((state) => {
      setEngineState({ ...state });
    });
    return unsubscribe;
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Primary Action: Clicking the main music button directly toggles music ON / OFF
  const handlePrimaryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    musicEngine.toggleMusic();
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    musicEngine.toggleMute();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    musicEngine.setVolume(vol);
  };

  const handleSelectTrack = (track: MusicTrackId) => {
    musicEngine.playTrack(track, true);
  };

  const getTrackName = (track: MusicTrackId) => {
    switch (track) {
      case 'BATTLE':
        return 'Decisive Clash (FF Battle Theme)';
      case 'BOSS':
        return 'Those Who Fight Further (FF Boss Theme)';
      case 'VICTORY':
        return 'Fanfare of Triumph (FF Victory Fanfare)';
      case 'MENU':
        return 'The Prelude (FF Crystal Theme)';
      default:
        return 'Music Paused / Off';
    }
  };

  const getTrackIcon = (track: MusicTrackId) => {
    switch (track) {
      case 'BATTLE':
        return <Swords className="w-3.5 h-3.5 text-[#DC2626]" />;
      case 'BOSS':
        return <Flame className="w-3.5 h-3.5 text-[#EA580C]" />;
      case 'VICTORY':
        return <Crown className="w-3.5 h-3.5 text-[#D97706]" />;
      case 'MENU':
        return <Sparkles className="w-3.5 h-3.5 text-[#059669]" />;
      default:
        return <Music className="w-3.5 h-3.5 text-[#78654E]" />;
    }
  };

  const isSoundActive = engineState.isPlaying && !engineState.isMuted && engineState.volume > 0 && engineState.track !== 'NONE';

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      {/* Grouped Audio & Track Button */}
      <div
        className={`flex items-center rounded-full border transition-all shadow-2xs ${
          isSoundActive
            ? 'bg-[#FEF9C3]/70 border-[#F59E0B] text-[#92400E] shadow-amber-200/50'
            : 'bg-[#FFFDF9] border-[#D5C29E] text-[#5C4A34] hover:bg-[#FAF6ED]'
        }`}
      >
        {/* Play/Mute Direct Action Button */}
        <button
          type="button"
          onClick={handlePrimaryClick}
          className="px-2.5 py-1 rounded-l-full flex items-center gap-1.5 cursor-pointer font-bold text-xs transition-colors hover:bg-black/5"
          title={isSoundActive ? 'Click to Turn Off Music' : 'Click to Play Final Fantasy Music'}
        >
          {isSoundActive ? (
            <Volume2 className="w-3.5 h-3.5 text-[#B45309] animate-pulse" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-[#DC2626]" />
          )}

          {/* Real Animated Frequency Bars when actively playing */}
          {isSoundActive && (
            <span className="flex items-end gap-0.5 h-3 px-0.5" aria-hidden="true">
              <span className="w-0.5 bg-[#D97706] rounded-full animate-music-bar-1 h-2" />
              <span className="w-0.5 bg-[#B45309] rounded-full animate-music-bar-2 h-3" />
              <span className="w-0.5 bg-[#D97706] rounded-full animate-music-bar-3 h-1.5" />
            </span>
          )}

          <span className="hidden sm:inline font-serif font-black tracking-tight">
            {isSoundActive ? 'FF Music: On' : 'Music: Off'}
          </span>
        </button>

        {/* Popover / Track Selector Arrow Toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-1.5 py-1 rounded-r-full border-l border-[#D5C29E]/60 hover:bg-black/5 cursor-pointer text-[#78654E]"
          title="Open Final Fantasy Soundtrack Menu"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-700' : ''}`} />
        </button>
      </div>

      {/* Music Settings & Final Fantasy Track Selector Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-76 sm:w-84 bg-[#FFFDF9]/98 backdrop-blur-md border border-[#D5C29E] rounded-2xl shadow-2xl p-4 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E8DEC8] mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <Disc className={`w-4 h-4 text-[#D97706] ${isSoundActive ? 'animate-spin-slow' : ''}`} />
              </div>
              <div>
                <div className="text-xs font-black font-serif text-[#2E1F0F] tracking-wide">
                  FINAL FANTASY SOUNDTRACK
                </div>
                <div className="text-[10px] text-[#78654E]">
                  Web Audio Synthesized RPG Score
                </div>
              </div>
            </div>

            {/* Quick Mute / Unmute Button */}
            <button
              onClick={handleToggleMute}
              className={`px-2 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                engineState.isMuted
                  ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              {engineState.isMuted ? (
                <>
                  <VolumeX className="w-3 h-3 text-rose-600" />
                  <span>Unmute</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 text-emerald-600" />
                  <span>Mute</span>
                </>
              )}
            </button>
          </div>

          {/* Currently Playing Track Status Banner */}
          <div className="p-2.5 rounded-xl bg-[#FAF6ED] border border-[#E8DEC8] mb-3 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-white border border-[#D5C29E] shrink-0">
                {getTrackIcon(engineState.track)}
              </div>
              <div className="min-w-0">
                <div className="text-[9px] uppercase font-bold tracking-wider text-[#92400E]">
                  {isSoundActive ? 'Now Playing' : 'Status'}
                </div>
                <div className="text-xs font-black text-[#2E1F0F] truncate font-serif">
                  {getTrackName(engineState.track)}
                </div>
              </div>
            </div>

            {/* Master Play / Pause Toggle Button */}
            {isSoundActive ? (
              <button
                onClick={() => musicEngine.toggleMusic()}
                className="px-2.5 py-1.5 rounded-lg bg-amber-100 border border-amber-300 text-[#78350F] text-[11px] font-black flex items-center gap-1 cursor-pointer hover:bg-amber-200 shrink-0"
                title="Turn Off Soundtrack"
              >
                <Pause className="w-3 h-3 fill-current" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={() => musicEngine.toggleMusic()}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer hover:bg-emerald-700 shadow-2xs shrink-0"
                title="Play Soundtrack"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Play</span>
              </button>
            )}
          </div>

          {/* Master Volume Slider */}
          <div className="space-y-1 mb-3.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#5C4A34]">
              <div className="flex items-center gap-1">
                <Volume1 className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Master Music Volume</span>
              </div>
              <span className="font-mono text-[#B45309]">
                {Math.round((engineState.isMuted ? 0 : engineState.volume) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={engineState.isMuted ? 0 : engineState.volume}
              onChange={handleVolumeChange}
              className="w-full accent-amber-600 cursor-pointer h-1.5 bg-[#E8DEC8] rounded-lg"
            />
          </div>

          {/* Track Selection Menu */}
          <div className="space-y-1.5 mb-3">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#78654E]">
              Select Final Fantasy Track
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {/* 1. Final Fantasy Battle Theme */}
              <button
                onClick={() => handleSelectTrack('BATTLE')}
                className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-all cursor-pointer border ${
                  engineState.track === 'BATTLE' && isSoundActive
                    ? 'bg-[#FEF2F2] border-[#EF4444] text-[#991B1B] font-bold shadow-2xs'
                    : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-[#E8DEC8] text-[#5C4A34]'
                }`}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <div className="p-1 rounded bg-rose-100 text-rose-700 mt-0.5 shrink-0">
                    <Swords className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black font-serif text-[#2E1F0F]">
                      Decisive Clash (FF Battle Theme)
                    </div>
                    <div className="text-[10px] text-[#78654E] truncate">
                      Galloping 16th bassline, punchy drums & heroic brass lead
                    </div>
                  </div>
                </div>
                {engineState.track === 'BATTLE' && isSoundActive && (
                  <span className="text-[9px] uppercase font-black text-[#DC2626] bg-[#FEE2E2] px-1.5 py-0.5 rounded shrink-0 ml-1">
                    Playing
                  </span>
                )}
              </button>

              {/* 2. Final Fantasy Boss Theme */}
              <button
                onClick={() => handleSelectTrack('BOSS')}
                className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-all cursor-pointer border ${
                  engineState.track === 'BOSS' && isSoundActive
                    ? 'bg-[#FFF7ED] border-[#F97316] text-[#C2410C] font-bold shadow-2xs'
                    : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-[#E8DEC8] text-[#5C4A34]'
                }`}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <div className="p-1 rounded bg-amber-100 text-amber-700 mt-0.5 shrink-0">
                    <Flame className="w-3.5 h-3.5 text-[#EA580C]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black font-serif text-[#2E1F0F]">
                      Those Who Fight Further (FF Boss Theme)
                    </div>
                    <div className="text-[10px] text-[#78654E] truncate">
                      150 BPM intense chromatic bass, double drums & soaring melody
                    </div>
                  </div>
                </div>
                {engineState.track === 'BOSS' && isSoundActive && (
                  <span className="text-[9px] uppercase font-black text-[#EA580C] bg-[#FFEDD5] px-1.5 py-0.5 rounded shrink-0 ml-1">
                    Playing
                  </span>
                )}
              </button>

              {/* 3. Final Fantasy Crystal Prelude */}
              <button
                onClick={() => handleSelectTrack('MENU')}
                className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-all cursor-pointer border ${
                  engineState.track === 'MENU' && isSoundActive
                    ? 'bg-[#ECFDF5] border-[#10B981] text-[#065F46] font-bold shadow-2xs'
                    : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-[#E8DEC8] text-[#5C4A34]'
                }`}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <div className="p-1 rounded bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black font-serif text-[#2E1F0F]">
                      The Prelude (Crystal Harp Theme)
                    </div>
                    <div className="text-[10px] text-[#78654E] truncate">
                      Cascading 16th harp arpeggios, ethereal strings & flute
                    </div>
                  </div>
                </div>
                {engineState.track === 'MENU' && isSoundActive && (
                  <span className="text-[9px] uppercase font-black text-[#059669] bg-[#D1FAE5] px-1.5 py-0.5 rounded shrink-0 ml-1">
                    Playing
                  </span>
                )}
              </button>

              {/* 4. Final Fantasy Victory Fanfare */}
              <button
                onClick={() => handleSelectTrack('VICTORY')}
                className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-all cursor-pointer border ${
                  engineState.track === 'VICTORY' && isSoundActive
                    ? 'bg-[#FFFBEB] border-[#F59E0B] text-[#78350F] font-bold shadow-2xs'
                    : 'bg-[#FFFDF9] hover:bg-[#FAF6ED] border-[#E8DEC8] text-[#5C4A34]'
                }`}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <div className="p-1 rounded bg-amber-100 text-amber-700 mt-0.5 shrink-0">
                    <Crown className="w-3.5 h-3.5 text-[#D97706]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black font-serif text-[#2E1F0F]">
                      Fanfare of Triumph (FF Victory Theme)
                    </div>
                    <div className="text-[10px] text-[#78654E] truncate">
                      Iconic Da-da-da-DAAA! fanfare, snare roll & walking march
                    </div>
                  </div>
                </div>
                {engineState.track === 'VICTORY' && isSoundActive && (
                  <span className="text-[9px] uppercase font-black text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded shrink-0 ml-1">
                    Playing
                  </span>
                )}
              </button>

              {/* Stop / Turn Off Music */}
              <button
                onClick={() => musicEngine.playTrack('NONE')}
                className="w-full p-2 rounded-xl text-left text-xs flex items-center justify-between transition-all cursor-pointer border bg-[#FFFDF9] hover:bg-[#F3F4F6] border-[#E8DEC8] text-[#78654E]"
              >
                <div className="flex items-center gap-2">
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span>Turn Off Music</span>
                </div>
                {engineState.track === 'NONE' && (
                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    Inactive
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
