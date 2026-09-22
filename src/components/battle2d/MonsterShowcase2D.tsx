/**
 * 2D Monster Showcase Component
 * Displays high-resolution 2D artwork for monsters in the roster, party, and collection views.
 * Allows quick-testing of all 5 combat states (IDLE, ATTACK, HURT, DEAD, VICTORY)
 * and direct launching into the 2D Sprite Studio / Slicer.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ElementType } from '../../types';
import { ELEMENT_VISUALS } from '../../data/elements';
import { monster2DRegistry, resolveFamilyKey } from '../../services/character2d/monster2DRegistry';
import { portraitRegistry } from '../../services/character2d/portraitRegistry';
import { normalizeUnitName, normalizeElement } from '../../services/character2d/elementalAssetHelper';
import { MonsterCombatVisualState } from '../../services/character2d/types';
import { AlertTriangle, FolderOpen, Copy, Check } from 'lucide-react';

interface MonsterShowcase2DProps {
  variantId: string;
  element: ElementType;
  isAwakened?: boolean;
  className?: string;
  showDirectoryInfo?: boolean;
  onOpenSpriteStudio?: (familyId: string, state: MonsterCombatVisualState) => void;
}

const STATES: MonsterCombatVisualState[] = ['IDLE', 'ATTACK', 'HURT', 'DEAD', 'VICTORY'];
const EXPECTED_FILES = [
  'IDLE.png',
  'ATTACK.png',
  'HURT.png',
  'DEAD.png',
  'VICTORY.png',
  'PORTRAIT.png',
];

export const MonsterShowcase2D: React.FC<MonsterShowcase2DProps> = ({
  variantId,
  element,
  isAwakened,
  className = '',
  showDirectoryInfo = false,
  onOpenSpriteStudio,
}) => {
  const [activeState, setActiveState] = useState<MonsterCombatVisualState>('IDLE');
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const [isMissing, setIsMissing] = useState<boolean>(false);
  const [testAnimation, setTestAnimation] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const familyKey = resolveFamilyKey(variantId);
  const monsterName = monster2DRegistry.getMonsterName(variantId);
  const elemVisual = ELEMENT_VISUALS[element] || ELEMENT_VISUALS.FIRE;

  const unit = normalizeUnitName(variantId, monsterName);
  const elem = normalizeElement(element, variantId);
  const directoryPath = `public/assets/characters/${unit}/${elem}/`;
  const activeFileName = `${activeState}.png`;

  useEffect(() => {
    const update = () => {
      const url = monster2DRegistry.getStateUrl(variantId, activeState, element);
      setAssetUrl(url);

      if (!url) {
        setIsMissing(true);
      } else {
        const cached = monster2DRegistry.isAvailable(url);
        if (cached === false) {
          setIsMissing(true);
        } else if (cached === true) {
          setIsMissing(false);
        } else {
          monster2DRegistry.preloadState(url).then((ok) => {
            setIsMissing(!ok);
          });
        }
      }
    };

    update();
    const unsub = monster2DRegistry.subscribe(update);
    const unsubPortrait = portraitRegistry.subscribe(update);
    return () => {
      unsub();
      unsubPortrait();
    };
  }, [variantId, activeState, element]);

  const triggerAnimationTest = (st: MonsterCombatVisualState) => {
    setActiveState(st);
    setTestAnimation(true);
    setTimeout(() => setTestAnimation(false), 700);
  };

  const handleCopyDirectory = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(directoryPath);
      } else {
        const el = document.createElement('textarea');
        el.value = directoryPath;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [directoryPath]);

  const checkFileAvailable = (fileName: string): boolean => {
    const filePath = `/assets/characters/${unit}/${elem}/${fileName}`;
    const filePathLower = `/assets/characters/${unit}/${elem}/${fileName.toLowerCase()}`;
    if (monster2DRegistry.isAvailable(filePath) === true || monster2DRegistry.isAvailable(filePathLower) === true) {
      return true;
    }
    if (activeFileName === fileName && !isMissing && assetUrl) {
      return true;
    }
    return false;
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-[#D5C29E] bg-[#FAF6ED] p-5 sm:p-6 shadow-md flex flex-col items-center justify-between ${className}`}
      style={{ minHeight: '340px' }}
    >
      {/* Elemental Aura Glow in Background */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: elemVisual.color }}
      />

      {/* Top Banner: State indicator */}
      <div className="w-full flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full ring-1 ring-[#D5C29E]"
            style={{ backgroundColor: elemVisual.color }}
          />
          <span className="text-xs font-black tracking-wider uppercase text-[#5C4A34] font-serif">
            2D Character Visual • {activeState}
          </span>
        </div>
      </div>

      {/* Center 2D Artwork Display */}
      <div className="relative z-10 my-4 flex items-center justify-center w-full min-h-[190px]">
        {isMissing || !assetUrl ? (
          <div
            className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#FFFDF9] border-2 border-dashed border-[#F59E0B] text-[#92400E] text-center max-w-xs shadow-md select-none"
            title="VISUAL ASSET NOT YET ASSIGNED"
          >
            <AlertTriangle className="w-6 h-6 text-[#D97706] mb-1.5 animate-pulse" />
            <div className="font-mono text-xs uppercase font-bold text-[#B45309] tracking-wider">
              VISUAL ASSET NOT YET ASSIGNED
            </div>
            <div className="font-mono text-sm font-black text-[#2E1F0F] mt-1">
              Character: {monsterName}
            </div>
            <div className="font-mono text-xs font-black text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#F59E0B]/40 mt-1.5">
              State: {activeState}
            </div>
            <div className="font-mono text-xs text-[#B45309] mt-1">
              Asset: NOT ASSIGNED
            </div>
          </div>
        ) : (
          <img
            src={assetUrl}
            alt={`${monsterName} ${activeState}`}
            referrerPolicy="no-referrer"
            className={`max-h-52 max-w-full object-contain drop-shadow-md filter transition-all ${
              testAnimation
                ? activeState === 'ATTACK'
                  ? 'scale-125 -translate-y-4 duration-150'
                  : activeState === 'HURT'
                  ? 'animate-hit-tremor'
                  : activeState === 'DEAD'
                  ? 'translate-y-3'
                  : activeState === 'VICTORY'
                  ? 'scale-115 -translate-y-3'
                  : 'animate-monster-breathe'
                : 'animate-monster-breathe'
            }`}
          />
        )}
      </div>

      {/* 5-State Selector Pills */}
      <div className="relative z-10 w-full flex items-center justify-center gap-1.5 flex-wrap pt-2 border-t border-[#E8DEC8]">
        {STATES.map((st) => (
          <button
            key={st}
            onClick={() => triggerAnimationTest(st)}
            className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeState === st
                ? 'fantasy-btn-gold text-[#2E1F0F] shadow-sm ring-1 ring-[#F59E0B]'
                : 'bg-[#FFFDF9] border border-[#D5C29E] text-[#78654E] hover:text-[#2E1F0F] hover:bg-[#F5EDE0]'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Directory of where used files are saved */}
      {showDirectoryInfo && (
        <div className="w-full mt-3 pt-3 border-t border-[#E8DEC8] flex flex-col gap-2 relative z-10 text-left">
          {/* Header with Title and Copy button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#5C4A34]">
              <FolderOpen className="w-3.5 h-3.5 text-[#B45309]" />
              <span className="font-serif uppercase tracking-wider">Asset Directory</span>
            </div>
            <button
              type="button"
              onClick={handleCopyDirectory}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF6ED] hover:bg-[#F3ECE0] border border-[#D5C29E] text-[11px] font-mono font-bold text-[#78654E] hover:text-[#2E1F0F] transition-all cursor-pointer shadow-2xs"
              title="Copy directory path to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-[#B45309]" />
                  <span>Copy Path</span>
                </>
              )}
            </button>
          </div>

          {/* Directory Path Card */}
          <div className="w-full rounded-2xl bg-[#FFFDF9] border border-[#E8DEC8] p-3 space-y-2 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-[#8C7355] tracking-wider">
                Saved Folder:
              </span>
              <code className="font-mono text-xs font-bold text-[#2E1F0F] bg-[#FAF6ED] px-2 py-0.5 rounded border border-[#E8DEC8] select-all break-all">
                {directoryPath}
              </code>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#F2ECE1] text-xs">
              <span className="text-[10px] uppercase font-bold text-[#8C7355] tracking-wider">
                Active State File:
              </span>
              <div className="flex items-center gap-1.5">
                <code className="font-mono text-xs font-bold text-[#92400E]">
                  {activeFileName}
                </code>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    !isMissing && assetUrl
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {!isMissing && assetUrl ? 'Active' : 'Missing'}
                </span>
              </div>
            </div>

            {/* Expected Files Checklist */}
            <div className="pt-2 border-t border-[#F2ECE1]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold text-[#8C7355] tracking-wider">
                  Files in this Directory:
                </span>
                <span className="text-[10px] text-[#A89278] font-mono">PNG format</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {EXPECTED_FILES.map((fileName) => {
                  const isCurrentState =
                    fileName.startsWith(activeState) || (activeState === 'DEAD' && fileName === 'DEAD.png');
                  const isAvailable = checkFileAvailable(fileName);
                  return (
                    <div
                      key={fileName}
                      className={`flex items-center justify-between px-2 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                        isCurrentState
                          ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E] font-bold shadow-2xs ring-1 ring-[#F59E0B]/50'
                          : 'bg-[#FAF6ED] border-[#E8DEC8] text-[#5C4A34]'
                      }`}
                    >
                      <span className="truncate">{fileName}</span>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ml-1 ${
                          isAvailable ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-slate-300'
                        }`}
                        title={isAvailable ? `${fileName} detected and available` : `${fileName} unassigned / not found`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
