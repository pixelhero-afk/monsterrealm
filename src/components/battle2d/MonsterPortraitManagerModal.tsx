/**
 * Monster Portrait Manager Modal
 * Dedicated tool allowing players to upload custom PNG portrait files for every monster in the game.
 * Features individual upload, batch multi-file upload, drag-and-drop, element filtering,
 * instant live preview, and server-side persistence.
 */

import React, { useState, useEffect, useRef } from 'react';
import { MONSTER_VARIANTS, MONSTER_FAMILIES } from '../../data/monsters';
import { ELEMENT_VISUALS } from '../../data/elements';
import { MonsterVariant, ElementType } from '../../types';
import { MonsterAvatar } from '../MonsterAvatar';
import { portraitRegistry } from '../../services/character2d/portraitRegistry';
import {
  normalizeUnitName,
  normalizeElement,
} from '../../services/character2d/elementalAssetHelper';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Trash2,
  Sparkles,
  Search,
  Filter,
  Layers,
  Crown,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface MonsterPortraitManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVariantId?: string;
}

export const MonsterPortraitManagerModal: React.FC<MonsterPortraitManagerModalProps> = ({
  isOpen,
  onClose,
  initialVariantId,
}) => {
  const [selectedElement, setSelectedElement] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVariantId, setActiveVariantId] = useState<string>(initialVariantId || '');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [, setRerenderKey] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);

  // Sync with portrait registry changes
  useEffect(() => {
    const unsub = portraitRegistry.subscribe(() => {
      setRerenderKey((prev) => prev + 1);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const allVariants = Object.values(MONSTER_VARIANTS);

  // Filter list
  const filteredVariants = allVariants.filter((v) => {
    if (selectedElement === 'BOSS' && !v.isBoss) return false;
    if (selectedElement !== 'ALL' && selectedElement !== 'BOSS' && v.element !== selectedElement) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = v.name.toLowerCase().includes(q);
      const matchId = v.variantId.toLowerCase().includes(q);
      const famName = (MONSTER_FAMILIES[v.familyId]?.familyName || v.familyId).toLowerCase();
      const matchFamily = famName.includes(q);
      if (!matchName && !matchId && !matchFamily) return false;
    }
    return true;
  });

  const currentVariant: MonsterVariant =
    allVariants.find((v) => v.variantId === activeVariantId) ||
    filteredVariants[0] ||
    allVariants[0];

  const handleUploadSingle = (variantId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatusMessage({ text: 'Please select a valid image file (.png, .webp, .jpg).', type: 'error' });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        await portraitRegistry.savePortrait(variantId, dataUrl);
        const vName = MONSTER_VARIANTS[variantId]?.name || variantId;
        setStatusMessage({ text: `Successfully updated portrait for ${vName}!`, type: 'success' });
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setStatusMessage({ text: 'Error reading file.', type: 'error' });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let matchedCount = 0;
    const promises: Promise<{ id: string; dataUrl: string } | null>[] = [];

    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith('image/')) return;

      const filename = file.name.toLowerCase().replace(/\.[^/.]+$/, ''); // remove extension

      // Attempt to find matching variant
      let matchedId: string | null = null;
      for (const v of allVariants) {
        const cleanVarId = v.variantId.toLowerCase();
        const cleanName = v.name.toLowerCase().replace(/\s+/g, '_');
        const famName = (MONSTER_FAMILIES[v.familyId]?.familyName || v.familyId).toLowerCase();
        if (
          filename.includes(cleanVarId) ||
          filename === cleanVarId.replace(/^var_/, '') ||
          filename.includes(cleanName) ||
          (filename.includes(v.element.toLowerCase()) && filename.includes(famName))
        ) {
          matchedId = v.variantId;
          break;
        }
      }

      if (matchedId) {
        matchedCount++;
        const targetId = matchedId;
        promises.push(
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              resolve({ id: targetId, dataUrl: ev.target?.result as string });
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          })
        );
      }
    });

    const results = await Promise.all(promises);
    const batchObj: Record<string, string> = {};
    results.forEach((res) => {
      if (res && res.dataUrl) {
        batchObj[res.id] = res.dataUrl;
      }
    });

    if (Object.keys(batchObj).length > 0) {
      await portraitRegistry.saveBatchPortraits(batchObj);
      setStatusMessage({
        text: `Batch uploaded ${Object.keys(batchObj).length} monster portraits successfully!`,
        type: 'success',
      });
    } else {
      setStatusMessage({
        text: 'No matching monster names found in uploaded filenames. Tip: Name files like pyrosaur_fire.png, var_nekohime_grass.png, etc.',
        type: 'info',
      });
    }

    setIsUploading(false);
    if (batchInputRef.current) batchInputRef.current.value = '';
  };

  const currentPortraitUrl = portraitRegistry.getPortraitUrl(currentVariant.variantId);
  const hasCustom = portraitRegistry.hasCustomPortrait(currentVariant.variantId);

  return (
    <div className="fixed inset-0 z-50 bg-[#1E1710]/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none animate-fade-in">
      <div className="relative w-full max-w-5xl fantasy-scroll-card p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DEC8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] border border-[#F59E0B]/50 flex items-center justify-center text-[#92400E] shadow-2xs">
              <ImageIcon className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#2E1F0F] font-serif tracking-wide flex items-center gap-2">
                <span>Monster Portrait Studio</span>
                <span className="text-xs font-mono font-bold text-[#92400E] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#F59E0B]/40 shadow-2xs">
                  PNG Uploader
                </span>
              </h2>
              <p className="text-xs text-[#5C4A34] font-medium">
                Upload custom PNG portraits for all elemental variants and continental bosses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Batch Upload Button */}
            <label className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl fantasy-btn-sky text-xs font-bold cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-[#0369A1]" />
              <span>Batch Upload PNGs</span>
              <input
                ref={batchInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleBatchUpload}
                disabled={isUploading}
              />
            </label>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#FAF6ED] hover:bg-[#F3ECE0] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`mt-3 p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-2xs ${
              statusMessage.type === 'success'
                ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#166534]'
                : statusMessage.type === 'error'
                ? 'bg-[#FFE4E6] border-[#FDA4AF] text-[#9F1239]'
                : 'bg-[#E0F2FE] border-[#7DD3FC] text-[#0369A1]'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search & Element Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-[#E8DEC8]">
          {/* Element Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {['ALL', 'FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK', 'BOSS'].map((elem) => {
              const isActive = selectedElement === elem;
              return (
                <button
                  key={elem}
                  onClick={() => setSelectedElement(elem)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'fantasy-btn-gold shadow-2xs'
                      : 'fantasy-btn-ivory'
                  }`}
                >
                  {elem === 'ALL' ? 'All Monsters' : elem === 'BOSS' ? '👑 Bosses' : elem}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#78654E]" />
            <input
              type="text"
              placeholder="Search name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF6ED] border border-[#D5C29E] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#2E1F0F] placeholder-[#8C7A65] focus:outline-none focus:border-[#D97706] shadow-2xs"
            />
          </div>
        </div>

        {/* Main Content: Left Monster Grid & Right Active Monster Studio */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 overflow-hidden">
          {/* LEFT: Monster Selection Grid (7 cols) */}
          <div className="md:col-span-7 overflow-y-auto pr-1 space-y-2 max-h-[52vh] sm:max-h-[58vh]">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredVariants.map((v) => {
                const isSelected = v.variantId === currentVariant.variantId;
                const isCustom = portraitRegistry.hasCustomPortrait(v.variantId);
                const elemVis = ELEMENT_VISUALS[v.element] || ELEMENT_VISUALS.FIRE;

                return (
                  <div
                    key={v.variantId}
                    onClick={() => setActiveVariantId(v.variantId)}
                    className={`relative p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center group ${
                      isSelected
                        ? 'border-[#D97706] bg-[#FFFBEB] ring-2 ring-[#F59E0B]/50 shadow-md'
                        : 'border-[#D5C29E] bg-[#FFFDF9] hover:border-[#D97706] hover:bg-[#FAF6ED] shadow-2xs'
                    }`}
                  >
                    {/* Element badge & custom indicator */}
                    <div className="w-full flex items-center justify-between mb-1.5">
                      <span
                        className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border shadow-2xs"
                        style={{
                          borderColor: elemVis.borderHex,
                          color: elemVis.borderHex,
                          backgroundColor: `${elemVis.borderHex}15`,
                        }}
                      >
                        {v.element}
                      </span>
                      {isCustom && (
                        <span className="text-[8px] font-black text-[#166534] bg-[#DCFCE7] px-1.5 py-0.5 rounded border border-[#86EFAC] shadow-2xs">
                          CUSTOM PNG
                        </span>
                      )}
                    </div>

                    {/* Avatar Thumbnail */}
                    <div className="my-1">
                      <MonsterAvatar
                        variantId={v.variantId}
                        element={v.element}
                        size="md"
                        showAwakenedGlow={false}
                      />
                    </div>

                    <div className="text-xs font-black text-[#2E1F0F] truncate w-full mt-1">
                      {v.name}
                    </div>
                    <div className="text-[10px] font-mono text-[#78654E] truncate w-full">
                      {MONSTER_FAMILIES[v.familyId]?.familyName || v.familyId}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Active Monster Portrait Studio (5 cols) */}
          <div className="md:col-span-5 bg-[#FAF6ED] border border-[#D5C29E] rounded-2xl p-4 sm:p-5 flex flex-col justify-between overflow-y-auto shadow-2xs">
            <div className="space-y-4">
              {/* Monster Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-black uppercase px-2 py-0.5 rounded border shadow-2xs"
                      style={{
                        borderColor: ELEMENT_VISUALS[currentVariant.element]?.borderHex,
                        color: ELEMENT_VISUALS[currentVariant.element]?.borderHex,
                        backgroundColor: `${ELEMENT_VISUALS[currentVariant.element]?.borderHex}15`,
                      }}
                    >
                      {currentVariant.element}
                    </span>
                    <span className="text-[10px] font-mono text-[#78654E] font-semibold">
                      {currentVariant.rarity}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[#2E1F0F] font-serif mt-1">
                    {currentVariant.name}
                  </h3>
                  <div className="text-[10px] font-mono text-[#92400E]">
                    ID: {currentVariant.variantId}
                  </div>
                </div>

                {hasCustom && (
                  <button
                    onClick={() => {
                      portraitRegistry.clearPortrait(currentVariant.variantId);
                      setStatusMessage({
                        text: `Reset portrait to default SVG illustration for ${currentVariant.name}.`,
                        type: 'info',
                      });
                    }}
                    className="flex items-center gap-1 text-[10px] text-[#9F1239] hover:text-[#4C0519] p-1.5 rounded-lg bg-[#FFE4E6] border border-[#FDA4AF] cursor-pointer transition-colors shadow-2xs"
                    title="Clear custom portrait and restore default SVG"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Large Portrait Preview Box */}
              <div className="relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-[#D5C29E] bg-[#FFFDF9] group hover:border-[#D97706] transition-all shadow-2xs">
                <MonsterAvatar
                  variantId={currentVariant.variantId}
                  element={currentVariant.element}
                  size="xl"
                  className="shadow-md ring-4 ring-[#E8DEC8] group-hover:ring-[#F59E0B]/50 transition-all"
                />

                <div className="mt-3 text-center">
                  <div className="text-xs font-bold text-[#2E1F0F]">
                    {hasCustom ? 'Active Custom PNG Portrait' : 'Default SVG Illustration'}
                  </div>
                  <div className="text-[10px] text-[#78654E] mt-0.5">
                    Recommended ratio: 1:1 square PNG (e.g. 512×512)
                  </div>
                </div>
              </div>

              {/* Upload Drop Zone & Button */}
              <div className="space-y-2">
                <label className="w-full flex items-center justify-center gap-2 p-3 rounded-xl fantasy-btn-gold text-[#2E1F0F] font-black text-xs uppercase tracking-wider shadow-md cursor-pointer hover:scale-[1.02] transition-all">
                  <Upload className="w-4 h-4 text-[#92400E]" />
                  <span>{isUploading ? 'Uploading...' : 'Upload Portrait (.png)'}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadSingle(currentVariant.variantId, file);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>

                <div className="text-center text-[10px] text-[#78654E] font-mono">
                  Saved path:{' '}
                  <code className="text-[#5C4A34] bg-[#FFFDF9] px-1 py-0.5 rounded border border-[#E8DEC8]">
                    /assets/characters/{normalizeUnitName(currentVariant.variantId, currentVariant.name)}/{normalizeElement(currentVariant.element, currentVariant.variantId)}/PORTRAIT.png
                  </code>
                </div>
              </div>
            </div>

            {/* Quick Helper Note */}
            <div className="mt-4 pt-3 border-t border-[#E8DEC8] text-[11px] text-[#5C4A34] flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
              <span>
                Portraits dynamically update across your Roster, Party formation, Turn order meter, Combat HUD, and Codex.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E8DEC8]">
          <div className="text-xs text-[#78654E] font-mono">
            Total Monsters: <strong className="text-[#2E1F0F]">{allVariants.length}</strong> · Custom Uploaded:{' '}
            <strong className="text-[#166534]">
              {Object.keys(portraitRegistry.getAllCustomPortraits()).length}
            </strong>
          </div>

          <button
            onClick={onClose}
            className="fantasy-btn-gold px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
