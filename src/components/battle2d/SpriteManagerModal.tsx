/**
 * 2D Monster Sprite Studio & 5-State Sheet Slicer Modal
 * Enables viewing, testing, individual uploading, and automated 5-pose sheet slicing
 * for NekoHime, Shadowstalker, Free Dancer, and all monster families.
 * Automatically persists to local storage and the server disk (public/assets/characters/).
 */

import React, { useState, useRef, useEffect } from 'react';
import { MONSTER_2D_REGISTRY, monster2DRegistry, resolveFamilyKey } from '../../services/character2d/monster2DRegistry';
import { MonsterCombatVisualState } from '../../services/character2d/types';
import { MONSTER_VARIANTS, MONSTER_FAMILIES } from '../../data/monsters';
import {
  X,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Scissors,
  Sparkles,
  Play,
  RotateCcw,
  Layers,
  Save,
  Filter,
} from 'lucide-react';

interface SpriteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFamilyId?: string;
  initialState?: MonsterCombatVisualState;
}

const ALL_STATES: MonsterCombatVisualState[] = ['IDLE', 'ATTACK', 'HURT', 'DEAD', 'VICTORY'];
const ELEMENT_COLORS: Record<string, { bg: string; text: string }> = {
  FIRE: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  WATER: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  GRASS: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  LIGHT: { bg: 'bg-amber-500/20', text: 'text-amber-300' },
  DARK: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
};

/**
 * Automatically removes solid white, solid dark, or checkerboard background pixels from a canvas,
 * converting them into true alpha=0 transparency.
 */
function stripCanvasBackground(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  if (w <= 0 || h <= 0) return;

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const total = w * h;
  const isBg = new Uint8Array(total);
  const queue = new Int32Array(total * 2);
  let qHead = 0;
  let qTail = 0;

  for (let x = 0; x < w; x++) {
    queue[qTail++] = x;
    queue[qTail++] = 0;
    queue[qTail++] = x;
    queue[qTail++] = h - 1;
  }
  for (let y = 0; y < h; y++) {
    queue[qTail++] = 0;
    queue[qTail++] = y;
    queue[qTail++] = w - 1;
    queue[qTail++] = y;
  }

  while (qHead < qTail) {
    const x = queue[qHead++];
    const y = queue[qHead++];
    const idx = y * w + x;
    if (isBg[idx]) continue;

    const pIdx = idx * 4;
    const r = data[pIdx];
    const g = data[pIdx + 1];
    const b = data[pIdx + 2];
    const a = data[pIdx + 3];

    // Already transparent
    if (a === 0) {
      isBg[idx] = 1;
      if (x > 0 && !isBg[idx - 1]) {
        queue[qTail++] = x - 1;
        queue[qTail++] = y;
      }
      if (x < w - 1 && !isBg[idx + 1]) {
        queue[qTail++] = x + 1;
        queue[qTail++] = y;
      }
      if (y > 0 && !isBg[idx - w]) {
        queue[qTail++] = x;
        queue[qTail++] = y - 1;
      }
      if (y < h - 1 && !isBg[idx + w]) {
        queue[qTail++] = x;
        queue[qTail++] = y + 1;
      }
      continue;
    }

    const diff = Math.max(r, g, b) - Math.min(r, g, b);
    const isNeutral = diff <= 16;
    const isNearWhite = r > 246 && g > 246 && b > 246 && diff <= 22;

    if (!isNeutral && !isNearWhite) continue;

    isBg[idx] = 1;

    if (x > 0 && !isBg[idx - 1]) {
      queue[qTail++] = x - 1;
      queue[qTail++] = y;
    }
    if (x < w - 1 && !isBg[idx + 1]) {
      queue[qTail++] = x + 1;
      queue[qTail++] = y;
    }
    if (y > 0 && !isBg[idx - w]) {
      queue[qTail++] = x;
      queue[qTail++] = y - 1;
    }
    if (y < h - 1 && !isBg[idx + w]) {
      queue[qTail++] = x;
      queue[qTail++] = y + 1;
    }
  }

  for (let i = 0; i < total; i++) {
    if (isBg[i]) {
      data[i * 4 + 3] = 0;
    }
  }

  // Defringe adjacent boundary
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (isBg[idx]) continue;
      const neighborsBg =
        isBg[idx - 1] || isBg[idx + 1] || isBg[idx - w] || isBg[idx + w];
      if (neighborsBg) {
        const pIdx = idx * 4;
        const diff =
          Math.max(data[pIdx], data[pIdx + 1], data[pIdx + 2]) -
          Math.min(data[pIdx], data[pIdx + 1], data[pIdx + 2]);
        if (diff <= 12) {
          data[pIdx + 3] = 0;
        } else if (diff <= 22) {
          data[pIdx + 3] = Math.min(data[pIdx + 3], Math.round(diff * 11));
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

export const SpriteManagerModal: React.FC<SpriteManagerModalProps> = ({
  isOpen,
  onClose,
  initialFamilyId = 'var_nekohime_grass',
  initialState = 'IDLE',
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(initialFamilyId);
  const [familyFilter, setFamilyFilter] = useState<string>('ALL');
  const [elementFilter, setElementFilter] = useState<string>('ALL');
  const [activePreviewState, setActivePreviewState] = useState<MonsterCombatVisualState>(initialState);
  const [previewAnimation, setPreviewAnimation] = useState<MonsterCombatVisualState | null>(null);

  // Sprite Sheet Slicer State
  const [sheetImageSrc, setSheetImageSrc] = useState<string | null>(null);
  const [slicedSprites, setSlicedSprites] = useState<Record<MonsterCombatVisualState, string | null>>({
    IDLE: null,
    ATTACK: null,
    HURT: null,
    DEAD: null,
    VICTORY: null,
  });
  const [isProcessingSheet, setIsProcessingSheet] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleStateInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetState, setUploadTargetState] = useState<MonsterCombatVisualState>('IDLE');

  // Keep state updated on open
  useEffect(() => {
    if (isOpen) {
      setSelectedUnitId(initialFamilyId);
      setActivePreviewState(initialState);
      setStatusMessage(null);
    }
  }, [isOpen, initialFamilyId, initialState]);

  if (!isOpen) return null;

  const currentConfig = monster2DRegistry.getConfig(selectedUnitId) || MONSTER_2D_REGISTRY[selectedUnitId] || MONSTER_2D_REGISTRY.fam_nekohime;

  const filteredVariants = Object.values(MONSTER_VARIANTS).filter((v) => {
    if (familyFilter !== 'ALL' && v.familyId !== familyFilter) return false;
    if (elementFilter !== 'ALL' && v.element !== elementFilter) return false;
    return true;
  });

  // Handle Sheet Upload & Automated 5-Panel Slicing
  const handleSheetFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please select an image file (PNG, JPG, WebP).' });
      return;
    }

    setIsProcessingSheet(true);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setSheetImageSrc(src);

      // Load into offscreen Image to perform auto slicing
      const img = new Image();
      img.onload = () => {
        slice5PanelSheet(img);
      };
      img.onerror = () => {
        setIsProcessingSheet(false);
        setStatusMessage({ type: 'error', text: 'Failed to process sheet image.' });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  /**
   * Slices 5-panel sprite sheet layout:
   * Panel 1 (Top-Left): FIGHTING IDLE (x: 0%..50%, y: 0%..38%)
   * Panel 2 (Top-Right): ATTACK (x: 50%..100%, y: 0%..38%)
   * Panel 3 (Mid-Left): HURT (x: 0%..50%, y: 38%..72%)
   * Panel 4 (Mid-Right): VICTORY (x: 50%..100%, y: 38%..72%)
   * Panel 5 (Bottom): DEFEATED / DEAD (x: 5%..95%, y: 72%..96%)
   */
  const slice5PanelSheet = (img: HTMLImageElement) => {
    try {
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      const crops: Record<
        MonsterCombatVisualState,
        { sx: number; sy: number; sw: number; sh: number }
      > = {
        IDLE: {
          sx: 0,
          sy: Math.floor(h * 0.05),
          sw: Math.floor(w * 0.48),
          sh: Math.floor(h * 0.33),
        },
        ATTACK: {
          sx: Math.floor(w * 0.5),
          sy: Math.floor(h * 0.05),
          sw: Math.floor(w * 0.5),
          sh: Math.floor(h * 0.33),
        },
        HURT: {
          sx: 0,
          sy: Math.floor(h * 0.38),
          sw: Math.floor(w * 0.48),
          sh: Math.floor(h * 0.34),
        },
        VICTORY: {
          sx: Math.floor(w * 0.5),
          sy: Math.floor(h * 0.38),
          sw: Math.floor(w * 0.5),
          sh: Math.floor(h * 0.34),
        },
        DEFEATED: {
          sx: Math.floor(w * 0.08),
          sy: Math.floor(h * 0.73),
          sw: Math.floor(w * 0.84),
          sh: Math.floor(h * 0.23),
        },
        DEAD: {
          sx: Math.floor(w * 0.08),
          sy: Math.floor(h * 0.73),
          sw: Math.floor(w * 0.84),
          sh: Math.floor(h * 0.23),
        },
      };

      const results: Record<MonsterCombatVisualState, string> = {
        IDLE: '',
        ATTACK: '',
        HURT: '',
        DEFEATED: '',
        DEAD: '',
        VICTORY: '',
      };

      for (const st of ALL_STATES) {
        const crop = crops[st];
        const canvas = document.createElement('canvas');
        canvas.width = crop.sw;
        canvas.height = crop.sh;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            img,
            crop.sx,
            crop.sy,
            crop.sw,
            crop.sh,
            0,
            0,
            crop.sw,
            crop.sh
          );
          // Automatically remove solid/checkerboard backgrounds to ensure true transparency
          stripCanvasBackground(canvas);
          results[st] = canvas.toDataURL('image/png');
        }
      }

      setSlicedSprites(results);
      setIsProcessingSheet(false);
      setStatusMessage({
        type: 'success',
        text: 'Sprite sheet successfully sliced into all 5 states! Review previews below.',
      });
    } catch (err) {
      console.error('Slice error:', err);
      setIsProcessingSheet(false);
      setStatusMessage({ type: 'error', text: 'Error slicing sprite sheet.' });
    }
  };

  // Apply all sliced states to selected family
  const handleApplyAllSlices = async () => {
    const statesToSave: Record<string, string> = {};
    for (const st of ALL_STATES) {
      if (slicedSprites[st]) {
        statesToSave[st.toLowerCase()] = slicedSprites[st]!;
      }
    }

    // 1. Set in registry and browser storage
    monster2DRegistry.setCustomSpriteSet(selectedUnitId, statesToSave);

    // 2. Persist to server disk (both classic endpoint and canonical elemental endpoint)
    const selectedVariant = MONSTER_VARIANTS[selectedUnitId];
    if (selectedVariant?.element) {
      for (const [st, dataUrl] of Object.entries(statesToSave)) {
        fetch('/api/characters/elemental-save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unitName: selectedVariant.name,
            element: selectedVariant.element,
            state: st.toLowerCase(),
            dataUrl,
          }),
        }).catch(() => {});
      }
    }

    try {
      const res = await fetch('/api/sprites/save-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: selectedUnitId,
          states: statesToSave,
        }),
      });

      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: `All 5 states for ${currentConfig.name} saved to game & assets disk!`,
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: `Saved to game session! (Server response: ${res.status})`,
        });
      }
    } catch (e) {
      setStatusMessage({
        type: 'success',
        text: `Saved to game session storage!`,
      });
    }
  };

  // Handle Single State File Upload
  const handleSingleStateSelected = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawDataUrl = e.target?.result as string;

      // Process uploaded single image to strip any solid/checkerboard background
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        let dataUrl = rawDataUrl;
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          stripCanvasBackground(canvas);
          dataUrl = canvas.toDataURL('image/png');
        }

        monster2DRegistry.setCustomStateUrl(selectedUnitId, uploadTargetState, dataUrl);

        // Persist to server (both classic endpoint and canonical elemental endpoint)
        const selectedVariant = MONSTER_VARIANTS[selectedUnitId];
        if (selectedVariant?.element) {
          fetch('/api/characters/elemental-save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              unitName: selectedVariant.name,
              element: selectedVariant.element,
              state: uploadTargetState.toLowerCase(),
              dataUrl,
            }),
          }).catch(() => {});
        }

        try {
          await fetch('/api/sprites/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              unitId: selectedUnitId,
              state: uploadTargetState.toLowerCase(),
              dataUrl,
            }),
          });
        } catch (err) {
          // ok in client fallback
        }

        setStatusMessage({
          type: 'success',
          text: `Updated ${currentConfig.name} [${uploadTargetState}] sprite with transparent background!`,
        });
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Reset Custom Sprites
  const handleReset = () => {
    monster2DRegistry.clearCustomSprite(selectedUnitId);
    setSheetImageSrc(null);
    setSlicedSprites({ IDLE: null, ATTACK: null, HURT: null, DEAD: null, VICTORY: null });
    setStatusMessage({ type: 'success', text: `Reset ${currentConfig.name} to default asset paths.` });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1710]/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] fantasy-scroll-card shadow-2xl flex flex-col overflow-hidden text-[#2E1F0F]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DEC8] bg-[#FAF6ED]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] border border-[#F59E0B]/50 flex items-center justify-center text-[#92400E] shadow-2xs">
              <Layers className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#2E1F0F] font-serif tracking-wide">
                2D Monster Sprite Studio & Auto-Slicer
              </h2>
              <p className="text-xs text-[#5C4A34] font-medium">
                5 Dedicated Combat States: IDLE • ATTACK • HURT • DEAD • VICTORY
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#78654E] hover:text-[#2E1F0F] bg-[#FFFDF9] hover:bg-[#FAF6ED] border border-[#D5C29E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-[#DCFCE7] text-[#166534] border-b border-[#86EFAC]'
                : 'bg-[#FFE4E6] text-[#9F1239] border-b border-[#FDA4AF]'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#9F1239] shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Monster Selection Chips & Filters */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-[#78654E] flex items-center gap-1.5 font-serif">
                <Filter className="w-3.5 h-3.5 text-[#D97706]" />
                Select Monster Unit ({filteredVariants.length} Available)
              </label>

              {/* Element Filter */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] font-bold text-[#78654E] mr-1">Element:</span>
                {['ALL', 'FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK'].map((el) => {
                  const isElSelected = elementFilter === el;
                  return (
                    <button
                      key={el}
                      onClick={() => setElementFilter(el)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        isElSelected
                          ? 'fantasy-btn-gold shadow-2xs'
                          : 'fantasy-btn-ivory'
                      }`}
                    >
                      {el}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Family Filter */}
            <div className="flex items-center gap-1.5 flex-wrap pb-1 border-b border-[#E8DEC8]">
              <span className="text-[11px] font-bold text-[#78654E] mr-1">Family:</span>
              <button
                onClick={() => setFamilyFilter('ALL')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  familyFilter === 'ALL'
                    ? 'bg-[#D97706] text-white shadow-2xs'
                    : 'bg-[#FAF6ED] text-[#78654E] hover:bg-[#F3ECE0] border border-[#D5C29E]'
                }`}
              >
                All
              </button>
              {Object.entries(MONSTER_FAMILIES).map(([famId, fam]) => (
                <button
                  key={famId}
                  onClick={() => setFamilyFilter(famId)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    familyFilter === famId
                      ? 'bg-[#D97706] text-white shadow-2xs'
                      : 'bg-[#FAF6ED] text-[#78654E] hover:bg-[#F3ECE0] border border-[#D5C29E]'
                  }`}
                >
                  {fam.familyName}
                </button>
              ))}
            </div>

            {/* Unit Buttons */}
            <div className="flex items-center gap-2 flex-wrap max-h-36 overflow-y-auto pr-1">
              {filteredVariants.map((v) => {
                const isSelected = v.variantId === selectedUnitId;
                const elColor = ELEMENT_COLORS[v.element] || ELEMENT_COLORS.FIRE;

                return (
                  <button
                    key={v.variantId}
                    onClick={() => setSelectedUnitId(v.variantId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isSelected
                        ? 'border-[#D97706] bg-[#FFFBEB] ring-2 ring-[#F59E0B]/50 text-[#92400E] shadow-sm'
                        : 'border-[#D5C29E] bg-[#FFFDF9] hover:bg-[#FAF6ED] text-[#5C4A34]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      v.element === 'FIRE' ? 'bg-orange-500' :
                      v.element === 'WATER' ? 'bg-cyan-500' :
                      v.element === 'GRASS' ? 'bg-emerald-500' :
                      v.element === 'LIGHT' ? 'bg-amber-500' : 'bg-purple-500'
                    }`} />
                    <span>{v.name}</span>
                    <span className={`text-[9px] font-black px-1 rounded uppercase ${elColor.bg} ${elColor.text}`}>
                      {v.element}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slicer & Upload Banner */}
          <div className="p-4 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E] shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-[#D97706]" />
                  <span className="text-sm font-black text-[#2E1F0F] font-serif">
                    5-Panel Sprite Sheet Auto-Slicer
                  </span>
                </div>
                <p className="text-xs text-[#5C4A34] mt-0.5 font-medium">
                  Upload a 5-panel sprite sheet (Fighting Idle, Attack, Hurt, Victory, Defeated).
                  The slicer automatically extracts and configures all 5 poses!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleSheetFileSelected(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="fantasy-btn-gold flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide shadow cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Sprite Sheet</span>
                </button>

                <button
                  onClick={handleReset}
                  className="fantasy-btn-ivory flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  title="Reset to default paths"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sliced Output Preview Bar */}
            {slicedSprites.IDLE && (
              <div className="mt-4 pt-4 border-t border-[#E8DEC8]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#166534] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Sliced Slices Ready for {currentConfig.name}
                  </span>
                  <button
                    onClick={handleApplyAllSlices}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-black tracking-wide shadow-md transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Apply & Save All 5 States</span>
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {ALL_STATES.map((st) => (
                    <div
                      key={st}
                      className="flex flex-col items-center p-2 rounded-xl bg-[#FFFDF9] border border-[#D5C29E] shadow-2xs"
                    >
                      <span className="text-[10px] font-black text-[#5C4A34] mb-1">{st}</span>
                      <div className="w-full h-20 bg-[#FAF6ED] rounded-lg flex items-center justify-center overflow-hidden">
                        {slicedSprites[st] ? (
                          <img
                            src={slicedSprites[st]!}
                            alt={st}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] text-[#8C7A65]">Pending</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current 5-State Combat Visual Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-black uppercase tracking-wider text-[#78654E] font-serif">
                Combat State Assets ({currentConfig.name})
              </label>
              <span className="text-xs text-[#78654E]">
                Click any state to preview animation or attach individual artwork
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {ALL_STATES.map((st) => {
                const url = monster2DRegistry.getStateUrl(selectedUnitId, st);
                const isLoaded = Boolean(url && monster2DRegistry.isAvailable(url) !== false);
                const isSelected = activePreviewState === st;

                return (
                  <div
                    key={st}
                    onClick={() => setActivePreviewState(st)}
                    className={`relative p-3 rounded-2xl border flex flex-col items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFFBEB] border-[#D97706] ring-2 ring-[#F59E0B]/50 shadow-md'
                        : 'bg-[#FFFDF9] border-[#D5C29E] hover:border-[#D97706] shadow-2xs'
                    }`}
                  >
                    {/* State Tag & Status Badge */}
                    <div className="w-full flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-[#2E1F0F] font-serif">{st}</span>
                      {isLoaded ? (
                        <span className="w-2 h-2 rounded-full bg-[#16A34A]" title="Ready" />
                      ) : (
                        <span
                          className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse"
                          title="Missing asset"
                        />
                      )}
                    </div>

                    {/* Image / Missing Box */}
                    <div className="w-full h-28 rounded-xl bg-[#FAF6ED] border border-[#E8DEC8] flex items-center justify-center overflow-hidden mb-2 relative">
                      {url ? (
                        <img
                          src={url}
                          alt={st}
                          className="max-h-full max-w-full object-contain p-1"
                        />
                      ) : (
                        <div className="text-center p-2 text-[#D97706] text-[10px] font-mono leading-tight">
                          <AlertTriangle className="w-4 h-4 mx-auto mb-1 opacity-80" />
                          <div>Missing</div>
                          <div>{st}</div>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadTargetState(st);
                        singleStateInputRef.current?.click();
                      }}
                      className="w-full py-1.5 rounded-lg fantasy-btn-ivory text-[#2E1F0F] text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3 text-[#D97706]" />
                      <span>Upload {st}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hidden file input for single state */}
          <input
            ref={singleStateInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleSingleStateSelected(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {/* Live Animation Preview Studio */}
          <div className="p-4 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E] flex flex-col items-center shadow-2xs">
            <div className="w-full flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-[#78654E] flex items-center gap-1.5 font-serif">
                <Play className="w-3.5 h-3.5 text-[#D97706]" />
                Combat Animation Test: {activePreviewState}
              </span>
              <div className="flex items-center gap-1.5">
                {ALL_STATES.map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setActivePreviewState(st);
                      setPreviewAnimation(st);
                      setTimeout(() => setPreviewAnimation(null), 800);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      activePreviewState === st
                        ? 'fantasy-btn-gold shadow-2xs'
                        : 'fantasy-btn-ivory'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-48 h-48 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] flex items-center justify-center relative overflow-hidden shadow-2xs">
              {monster2DRegistry.getStateUrl(selectedUnitId, activePreviewState) ? (
                <img
                  src={monster2DRegistry.getStateUrl(selectedUnitId, activePreviewState)!}
                  alt={activePreviewState}
                  className={`max-h-40 max-w-40 object-contain drop-shadow-md transition-all ${
                    previewAnimation === 'ATTACK'
                      ? 'scale-125 -translate-y-4 duration-150'
                      : previewAnimation === 'HURT'
                      ? 'animate-hit-tremor brightness-125 saturate-150'
                      : previewAnimation === 'DEAD'
                      ? 'translate-y-3'
                      : previewAnimation === 'VICTORY'
                      ? 'scale-110 -translate-y-2'
                      : 'animate-pulse'
                  }`}
                />
              ) : (
                <div className="text-center font-mono text-xs text-[#92400E] p-2">
                  <div className="text-[10px] uppercase font-bold text-[#D97706]">
                    Missing combat asset:
                  </div>
                  <div className="font-bold text-[#2E1F0F] mt-0.5">
                    Monster: {currentConfig.name}
                  </div>
                  <div className="mt-0.5 text-[#B45309]">State: {activePreviewState}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8DEC8] bg-[#FAF6ED]/80 flex items-center justify-between">
          <div className="text-xs text-[#78654E]">
            Selected: <strong className="text-[#2E1F0F]">{currentConfig.name}</strong> • State:{' '}
            <strong className="text-[#D97706]">{activePreviewState}</strong>
          </div>
          <button
            onClick={onClose}
            className="fantasy-btn-gold px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
