/**
 * Map Manager & Arena Background / Platform Studio Modal
 * Allows switching battlefield environments and uploading custom Background and Battleplatform PNGs for each campaign map.
 */

import React, { useState, useEffect } from 'react';
import { BATTLE_MAPS, MapDefinition } from '../../data/maps';
import { mapRegistry } from '../../services/map/mapRegistry';
import { X, Image as ImageIcon, Upload, Check, Layers, Trash2, Sparkles } from 'lucide-react';

interface MapManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMapId?: string;
  onSelectMap?: (mapId: string) => void;
}

export const MapManagerModal: React.FC<MapManagerModalProps> = ({
  isOpen,
  onClose,
  activeMapId = 'forest_shrine',
  onSelectMap,
}) => {
  const [selectedMapId, setSelectedMapId] = useState<string>(activeMapId);
  const [isUploadingBg, setIsUploadingBg] = useState<boolean>(false);
  const [isUploadingPlatform, setIsUploadingPlatform] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [, setRerenderKey] = useState<number>(0);

  useEffect(() => {
    if (activeMapId) {
      setSelectedMapId(activeMapId);
    }
  }, [activeMapId]);

  useEffect(() => {
    const unsub = mapRegistry.subscribe(() => {
      setRerenderKey((k) => k + 1);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const currentDef: MapDefinition = BATTLE_MAPS[selectedMapId] || BATTLE_MAPS.forest_shrine;
  const currentBgUrl = mapRegistry.getMapBackgroundUrl(selectedMapId);
  const currentPlatformUrl = mapRegistry.getMapPlatformUrl(selectedMapId);
  const hasCustomBg = mapRegistry.isAvailable(selectedMapId);
  const hasCustomPlatform = mapRegistry.isPlatformAvailable(selectedMapId);

  const handleUploadBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage('Please select an image file (.png, .jpg, .webp).');
      return;
    }

    setIsUploadingBg(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        await mapRegistry.saveCustomMap(selectedMapId, dataUrl);
        setStatusMessage(`Successfully set custom background for ${currentDef.name}!`);
        setIsUploadingBg(false);
      }
    };
    reader.onerror = () => {
      setStatusMessage('Failed to read image file.');
      setIsUploadingBg(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUploadPlatform = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage('Please select an image file (.png, .jpg, .webp).');
      return;
    }

    setIsUploadingPlatform(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        await mapRegistry.saveCustomPlatform(selectedMapId, dataUrl);
        setStatusMessage(`Successfully set custom battleplatform for ${currentDef.name}!`);
        setIsUploadingPlatform(false);
      }
    };
    reader.onerror = () => {
      setStatusMessage('Failed to read image file.');
      setIsUploadingPlatform(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1E1710]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none animate-fade-in">
      <div className="relative w-full max-w-3xl fantasy-scroll-card p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DEC8]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FEF3C7] border border-[#F59E0B]/50 flex items-center justify-center text-[#92400E] shadow-2xs">
              <Layers className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#2E1F0F] font-serif tracking-wide flex items-center gap-2">
                <span>Campaign Map & Platform Studio</span>
                <span className="text-[10px] font-mono text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#F59E0B]/40 shadow-2xs">
                  Custom Art
                </span>
              </h3>
              <p className="text-xs text-[#5C4A34]">
                Upload background scenery and combat battleplatform artwork for each campaign environment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#FAF6ED] hover:bg-[#F3ECE0] text-[#78654E] hover:text-[#2E1F0F] border border-[#D5C29E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Selection Grid */}
        <div className="my-4">
          <div className="text-xs font-bold text-[#78654E] uppercase tracking-wider mb-2">
            Select Campaign Map to Customize
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.values(BATTLE_MAPS).map((m) => {
              const isSelected = m.id === selectedMapId;
              const hasCustomB = mapRegistry.isAvailable(m.id);
              const hasCustomP = mapRegistry.isPlatformAvailable(m.id);

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMapId(m.id)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#D97706] bg-[#FFFBEB] shadow-md ring-2 ring-[#F59E0B]/50'
                      : 'border-[#D5C29E] bg-[#FFFDF9] hover:border-[#D97706] hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border shadow-2xs"
                      style={{
                        borderColor: m.palette.glowHex,
                        color: m.palette.glowHex,
                        backgroundColor: `${m.palette.glowHex}15`,
                      }}
                    >
                      {m.element}
                    </span>
                    <div className="flex items-center gap-1">
                      {hasCustomB && (
                        <span className="text-[8px] font-bold text-[#166534] bg-[#DCFCE7] px-1 rounded border border-[#86EFAC]" title="Custom background PNG active">
                          BG
                        </span>
                      )}
                      {hasCustomP && (
                        <span className="text-[8px] font-bold text-[#0369A1] bg-[#E0F2FE] px-1 rounded border border-[#7DD3FC]" title="Custom battleplatform PNG active">
                          PLATFORM
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-black text-[#2E1F0F] truncate">{m.name}</div>
                  <div className="text-[10px] text-[#78654E] truncate">{m.subtitle}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="mb-4 text-xs font-semibold text-[#166534] bg-[#DCFCE7] p-2.5 rounded-xl border border-[#86EFAC] flex items-center justify-between shadow-2xs">
            <span>{statusMessage}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-[#166534] hover:text-[#052E16] text-xs cursor-pointer ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Map Detail & Two-Panel Upload (Background + Battleplatform) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF6ED] border border-[#D5C29E] space-y-4 shadow-2xs">
          <div className="border-b border-[#E8DEC8] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-[#2E1F0F] font-serif">{currentDef.name}</span>
              <span className="text-xs text-[#92400E] font-semibold">({currentDef.subtitle})</span>
            </div>
            <p className="text-xs text-[#5C4A34] mt-0.5">{currentDef.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. MAP BACKGROUND PANEL */}
            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] space-y-3 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase text-[#92400E] tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#D97706]" />
                    1. Arena Background Art
                  </span>
                  {hasCustomBg && (
                    <button
                      onClick={() => {
                        mapRegistry.clearCustomMap(selectedMapId);
                        setStatusMessage(`Reset ${currentDef.name} background to default artwork.`);
                      }}
                      className="text-[10px] text-[#9F1239] hover:text-[#4C0519] flex items-center gap-1 p-1 bg-[#FFE4E6] rounded border border-[#FDA4AF] cursor-pointer"
                      title="Clear custom background"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                {/* Preview Thumbnail */}
                <div className="relative h-28 rounded-xl overflow-hidden border border-[#D5C29E] bg-[#FAF6ED] flex items-center justify-center">
                  <img
                    src={currentBgUrl}
                    alt={`${currentDef.name} background`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-white drop-shadow truncate">
                      {hasCustomBg ? 'Custom PNG Active' : 'Default Asset'}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-[#8C7A65] mt-2 truncate">
                  Target: <code className="text-[#5C4A34]">/assets/maps/{selectedMapId}.png</code>
                </div>
              </div>

              <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl fantasy-btn-gold text-xs font-bold cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#92400E]" />
                <span>{isUploadingBg ? 'Uploading...' : 'Upload Background (.png)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadBg}
                  disabled={isUploadingBg}
                />
              </label>
            </div>

            {/* 2. BATTLEPLATFORM STAGE PANEL */}
            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#D5C29E] space-y-3 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase text-[#0369A1] tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#0284C7]" />
                    2. Battleplatform Stage
                  </span>
                  {hasCustomPlatform && (
                    <button
                      onClick={() => {
                        mapRegistry.clearCustomPlatform(selectedMapId);
                        setStatusMessage(`Reset ${currentDef.name} battleplatform to procedural stage.`);
                      }}
                      className="text-[10px] text-[#9F1239] hover:text-[#4C0519] flex items-center gap-1 p-1 bg-[#FFE4E6] rounded border border-[#FDA4AF] cursor-pointer"
                      title="Clear custom battleplatform"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                {/* Preview Thumbnail */}
                <div className="relative h-28 rounded-xl overflow-hidden border border-[#D5C29E] bg-[#FAF6ED] flex items-center justify-center p-2">
                  {currentPlatformUrl ? (
                    <img
                      src={currentPlatformUrl}
                      alt={`${currentDef.name} battleplatform`}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-[#8C7A65] text-xs flex flex-col items-center gap-1">
                      <Layers className="w-6 h-6 text-[#A89884]" />
                      <span>Default Procedural SVG Stage Active</span>
                    </div>
                  )}
                  <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#5C4A34] font-semibold truncate">
                      {hasCustomPlatform ? 'Custom PNG Active' : 'Procedural Stage'}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-[#8C7A65] mt-2 truncate">
                  Target: <code className="text-[#5C4A34]">/assets/maps/{selectedMapId}_platform.png</code>
                </div>
              </div>

              <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl fantasy-btn-sky text-xs font-bold cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#0369A1]" />
                <span>{isUploadingPlatform ? 'Uploading...' : 'Upload Battleplatform (.png)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadPlatform}
                  disabled={isUploadingPlatform}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between gap-2.5 mt-5 pt-3 border-t border-[#E8DEC8]">
          <div className="text-[11px] text-[#5C4A34] flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Changes immediately persist and apply across the Campaign Map & 2D Combat Arena.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="fantasy-btn-ivory px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
              Close
            </button>
            {onSelectMap && (
              <button
                onClick={() => {
                  onSelectMap(selectedMapId);
                  onClose();
                }}
                className="fantasy-btn-gold flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Apply Map</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
