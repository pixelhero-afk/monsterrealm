/**
 * Character Sprite Manager & Reset Modal
 * Allows developers to inspect, individually delete, or completely reset
 * character sprite files in public/assets/characters/<unit>/<element>/.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  RefreshCw,
  Folder,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MonsterVariant } from '../../types';
import { monster2DRegistry } from '../../services/character2d/monster2DRegistry';
import { portraitRegistry } from '../../services/character2d/portraitRegistry';

interface SpriteFile {
  filename: string;
  state: string;
  size: number;
  formattedSize: string;
  isZeroByte: boolean;
  mtime: number;
  url: string;
}

interface CharacterSpriteManagerModalProps {
  variant: MonsterVariant;
  isOpen: boolean;
  onClose: () => void;
  onSpritesChanged?: () => void;
}

export const CharacterSpriteManagerModal: React.FC<CharacterSpriteManagerModalProps> = ({
  variant,
  isOpen,
  onClose,
  onSpritesChanged,
}) => {
  const [files, setFiles] = useState<SpriteFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmResetAll, setConfirmResetAll] = useState<boolean>(false);

  const unitSlug = (variant.familyId ? variant.familyId.replace(/^fam_/, '') : variant.variantId.replace(/^var_/, '').split('_')[0]).toLowerCase();
  const elemSlug = variant.element.toLowerCase();
  const canonicalDir = `public/assets/characters/${unitSlug}/${elemSlug}/`;

  const fetchSpriteFiles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/characters/sprites/${unitSlug}/${elemSlug}`);
      if (res.ok) {
        const json = await res.json();
        setFiles(json.files || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch character sprites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setConfirmResetAll(false);
      setFeedback(null);
      fetchSpriteFiles();
    }
  }, [isOpen, unitSlug, elemSlug]);

  if (!isOpen) return null;

  const handleDeleteSingleFile = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename} for ${variant.name}?`)) {
      return;
    }
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await fetch('/api/characters/sprites/delete-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit: unitSlug,
          element: elemSlug,
          filename,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: `Successfully deleted ${filename}` });
        if (filename.toLowerCase().includes('portrait')) {
          portraitRegistry.clearUnitElement(unitSlug, elemSlug);
        }
        await fetchSpriteFiles();
        await Promise.all([
          monster2DRegistry.refreshServerStatus(),
          portraitRegistry.refreshServerStatus(),
        ]);
        onSpritesChanged?.();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to delete sprite' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetAllSprites = async () => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await fetch('/api/characters/sprites/reset-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit: unitSlug,
          element: elemSlug,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: `Reset complete! Deleted ${data.count} sprite file(s) for ${variant.name}.`,
        });
        setConfirmResetAll(false);
        monster2DRegistry.clearUnitElement(unitSlug, elemSlug);
        portraitRegistry.clearUnitElement(unitSlug, elemSlug);
        await fetchSpriteFiles();
        await Promise.all([
          monster2DRegistry.refreshServerStatus(),
          portraitRegistry.refreshServerStatus(),
        ]);
        onSpritesChanged?.();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to reset character sprites' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-[#1E1710]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="max-w-2xl w-full bg-[#FFFDF9] border border-[#D5C29E] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E8DEC8] bg-[#FAF6ED]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-800">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#2E1F0F] font-serif">
                  {variant.name} Sprites
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2E1F0F] text-[#FFFDF9] uppercase">
                  {variant.element}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#78654E] flex items-center gap-1 mt-0.5">
                <Folder className="w-3 h-3" />
                <span>{canonicalDir}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white hover:bg-[#FAF6ED] border border-[#D5C29E] text-[#78654E] hover:text-[#2E1F0F] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar with Reset Button */}
        <div className="p-3.5 bg-[#FAF6ED]/70 border-b border-[#E8DEC8] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5C4A34]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              <b>{files.length}</b> sprite file{files.length === 1 ? '' : 's'} on disk
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchSpriteFiles}
              disabled={loading || actionLoading}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-[#D5C29E] text-[#5C4A34] hover:text-[#2E1F0F] text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Refresh sprite list from disk"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {files.length > 0 && !confirmResetAll && (
              <button
                type="button"
                onClick={() => setConfirmResetAll(true)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Sprites</span>
              </button>
            )}
          </div>
        </div>

        {/* Confirmation dialog banner */}
        {confirmResetAll && (
          <div className="p-3 bg-red-50 border-b border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-red-800 font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                Delete all <b>{files.length}</b> sprite files for {variant.name}? This removes all PNG files in <code>{canonicalDir}</code>.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetAllSprites}
                disabled={actionLoading}
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer shadow-2xs"
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete All'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetAll(false)}
                className="px-2.5 py-1 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Feedback message */}
        {feedback && (
          <div
            className={`p-3 text-xs font-semibold border-b flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Sprites Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && files.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#78654E]">
              Scanning {canonicalDir}...
            </div>
          ) : files.length === 0 ? (
            <div className="py-12 px-4 text-center bg-[#FAF6ED] rounded-xl border border-dashed border-[#D5C29E] space-y-2">
              <ImageIcon className="w-8 h-8 text-[#A89880] mx-auto" />
              <h4 className="text-sm font-bold text-[#2E1F0F]">No Sprites Found</h4>
              <p className="text-xs text-[#78654E] max-w-md mx-auto">
                No <code>.png</code> files currently exist in <code>{canonicalDir}</code>.
              </p>
              <p className="text-[11px] text-[#5C4A34] pt-2">
                Drop files named <b>IDLE.png</b>, <b>ATTACK.png</b>, <b>HURT.png</b>, <b>DEAD.png</b>, <b>VICTORY.png</b>, or <b>PORTRAIT.png</b> into this folder to populate battle visuals.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {files.map((file) => {
                const isZeroByte = file.isZeroByte || file.size === 0;
                return (
                  <div
                    key={file.filename}
                    className="p-3 bg-[#FAF6ED] rounded-xl border border-[#E8DEC8] flex items-center justify-between gap-3 shadow-2xs hover:border-[#D5C29E] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Thumbnail Preview */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#D5C29E] bg-slate-100 flex items-center justify-center shrink-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:6px_6px]">
                        {isZeroByte ? (
                          <FileQuestion className="w-6 h-6 text-amber-600" />
                        ) : (
                          <img
                            src={`${file.url}?t=${file.mtime}`}
                            alt={file.filename}
                            className="w-full h-full object-contain pointer-events-none"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>

                      {/* File Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-[#2E1F0F] font-mono truncate">
                            {file.filename}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#2E1F0F] text-[#FFFDF9]">
                            {file.state}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#78654E] flex items-center gap-2 mt-0.5">
                          {isZeroByte ? (
                            <span className="text-amber-700 font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              <span>0 B (Empty)</span>
                            </span>
                          ) : (
                            <span className="font-mono">{file.formattedSize}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete Individual Sprite Button */}
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleDeleteSingleFile(file.filename)}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 hover:border-red-300 border border-transparent cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                      title={`Delete ${file.filename}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="p-3 bg-[#FAF6ED] border-t border-[#E8DEC8] flex items-center justify-between text-[11px] text-[#78654E]">
          <span>
            Standard States: <code>IDLE</code>, <code>ATTACK</code>, <code>HURT</code>, <code>DEAD</code>, <code>VICTORY</code>, <code>PORTRAIT</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white border border-[#D5C29E] text-[#2E1F0F] font-bold hover:bg-[#FAF6ED] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
