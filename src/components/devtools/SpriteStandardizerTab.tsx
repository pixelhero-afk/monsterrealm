/**
 * Sprite Standardizer Tab
 * Real-time monitoring and controls for automatic character PNG standardization.
 */

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileImage,
  Layers,
  Eye,
  Sliders,
  Maximize2,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { monster2DRegistry } from '../../services/character2d/monster2DRegistry';
import { portraitRegistry } from '../../services/character2d/portraitRegistry';

interface SpriteItem {
  id: string;
  monster: string;
  element: string;
  state: string;
  relPath: string;
  originalWidth: number;
  originalHeight: number;
  visibleBounds: {
    minX: number;
    minY: number;
    width: number;
    height: number;
  };
  standardizedWidth: number;
  standardizedHeight: number;
  visibleScaledWidth: number;
  visibleScaledHeight: number;
  scaleApplied: number;
  hasTransparency: boolean;
  transparencyAutoKeyed?: boolean;
  status: 'READY' | 'WARNING' | 'ERROR';
  warnings: string[];
  processedAt: number;
  standardizedUrl: string;
}

interface StandardizerStatusResponse {
  success: boolean;
  total: number;
  readyCount: number;
  warningCount: number;
  errorCount: number;
  manifest: {
    targetCanvas: { width: number; height: number };
    targetHeightPercent: number;
    sprites: Record<string, SpriteItem>;
  };
}

export const SpriteStandardizerTab: React.FC = () => {
  const [data, setData] = useState<StandardizerStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reprocessing, setReprocessing] = useState<boolean>(false);
  const [filterMonster, setFilterMonster] = useState<string>('ALL');
  const [filterState, setFilterState] = useState<string>('ALL');
  const [selectedSprite, setSelectedSprite] = useState<SpriteItem | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/standardizer/status');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch standardizer status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleReprocessAll = async () => {
    try {
      setReprocessing(true);
      const res = await fetch('/api/standardizer/reprocess', { method: 'POST' });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error('Failed to reprocess sprites:', err);
    } finally {
      setReprocessing(false);
    }
  };

  const handleDeleteSprite = async (sprite: SpriteItem) => {
    const filename = sprite.relPath.split('/').pop() || '';
    if (!confirm(`Are you sure you want to delete ${filename} for ${sprite.monster.toUpperCase()} (${sprite.element.toUpperCase()})?\n\nThis permanently removes the PNG file from disk.`)) {
      return;
    }

    try {
      const res = await fetch('/api/characters/sprites/delete-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit: sprite.monster,
          element: sprite.element,
          filename,
        }),
      });
      if (res.ok) {
        if (selectedSprite?.id === sprite.id) {
          setSelectedSprite(null);
        }
        if (filename.toLowerCase().includes('portrait')) {
          portraitRegistry.clearUnitElement(sprite.monster, sprite.element);
        }
        await fetchStatus();
        await Promise.all([
          monster2DRegistry.refreshServerStatus(),
          portraitRegistry.refreshServerStatus(),
        ]);
      } else {
        const err = await res.json();
        alert(`Failed to delete sprite: ${err.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleResetMonsterSprites = async (monsterName: string) => {
    if (!confirm(`Are you sure you want to reset and delete all sprites for ${monsterName.toUpperCase()} across all elements?\n\nThis will remove all detected PNG sprite files for this monster.`)) {
      return;
    }

    try {
      // Find all elements this monster has
      const targetSprites = spritesList.filter((s) => s.monster.toLowerCase() === monsterName.toLowerCase());
      const elements = Array.from(new Set(targetSprites.map((s) => s.element.toLowerCase())));
      if (elements.length === 0) {
        elements.push('fire', 'water', 'grass', 'light', 'dark');
      }

      for (const elem of elements) {
        await fetch('/api/characters/sprites/reset-character', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unit: monsterName, element: elem }),
        });
        monster2DRegistry.clearUnitElement(monsterName, elem);
        portraitRegistry.clearUnitElement(monsterName, elem);
      }

      setSelectedSprite(null);
      await fetchStatus();
      await Promise.all([
        monster2DRegistry.refreshServerStatus(),
        portraitRegistry.refreshServerStatus(),
      ]);
    } catch (e: any) {
      alert(`Error resetting sprites: ${e.message}`);
    }
  };

  const spritesList: SpriteItem[] = data?.manifest?.sprites
    ? Object.values(data.manifest.sprites)
    : [];

  const monsters = Array.from(new Set(spritesList.map((s) => s.monster))).sort();
  const states = Array.from(new Set(spritesList.map((s) => s.state))).sort();

  const filteredSprites = spritesList.filter((s) => {
    if (filterMonster !== 'ALL' && s.monster !== filterMonster) return false;
    if (filterState !== 'ALL' && s.state !== filterState) return false;
    return true;
  });

  const getElementBadgeColor = (elem: string) => {
    switch (elem.toLowerCase()) {
      case 'fire':
        return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
      case 'water':
        return 'bg-cyan-500/15 text-cyan-700 border-cyan-500/30';
      case 'grass':
        return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';
      case 'light':
        return 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30';
      case 'dark':
        return 'bg-purple-500/15 text-purple-700 border-purple-500/30';
      default:
        return 'bg-slate-500/15 text-slate-700 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#FFFDF9] via-[#FAF6ED] to-[#F5EEDD] border border-[#D5C29E] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-sm font-black text-[#2E1F0F] font-serif">
                Automatic PNG Detection & Standardization Engine
              </h4>
            </div>
            <p className="text-[12px] text-[#5C4A34]">
              Monitors <code className="bg-[#ECE0C8] px-1 py-0.5 rounded text-[11px] font-mono">public/assets/characters/</code> in real time.
              All dropped artwork is automatically parsed, bounds-scanned, scaled to 85% height, centered, and rendered onto 1024×1024 transparent canvas.
            </p>
          </div>

          <button
            onClick={handleReprocessAll}
            disabled={reprocessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E1F0F] hover:bg-[#47321A] text-[#FAF6ED] text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 whitespace-nowrap self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin' : ''}`} />
            <span>{reprocessing ? 'Reprocessing...' : 'Scan & Reprocess All'}</span>
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#E8DEC8]">
          <div className="bg-[#FFFDF9] p-2.5 rounded-lg border border-[#E8DEC8]">
            <span className="text-[10px] text-[#78654E] uppercase font-bold tracking-wider">Total Detected</span>
            <div className="text-lg font-black text-[#2E1F0F]">{data?.total || 0}</div>
          </div>
          <div className="bg-[#FFFDF9] p-2.5 rounded-lg border border-[#E8DEC8]">
            <span className="text-[10px] text-[#78654E] uppercase font-bold tracking-wider">Canvas Standard</span>
            <div className="text-lg font-black text-emerald-700">1024 × 1024</div>
          </div>
          <div className="bg-[#FFFDF9] p-2.5 rounded-lg border border-[#E8DEC8]">
            <span className="text-[10px] text-[#78654E] uppercase font-bold tracking-wider">Perceived Height</span>
            <div className="text-lg font-black text-cyan-700">85% (~870px)</div>
          </div>
          <div className="bg-[#FFFDF9] p-2.5 rounded-lg border border-[#E8DEC8]">
            <span className="text-[10px] text-[#78654E] uppercase font-bold tracking-wider">Status Ready</span>
            <div className="text-lg font-black text-emerald-600">
              {data?.readyCount || 0} / {data?.total || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FAF6ED] p-2.5 rounded-lg border border-[#E8DEC8]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#5C4A34]">Filter Monster:</span>
          <select
            value={filterMonster}
            onChange={(e) => setFilterMonster(e.target.value)}
            className="text-xs bg-white border border-[#D5C29E] rounded px-2 py-1 text-[#2E1F0F] font-medium"
          >
            <option value="ALL">All Monsters ({spritesList.length})</option>
            {monsters.map((m) => (
              <option key={m} value={m}>
                {m.toUpperCase()}
              </option>
            ))}
          </select>

          <span className="text-[11px] font-bold text-[#5C4A34] ml-2">State:</span>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="text-xs bg-white border border-[#D5C29E] rounded px-2 py-1 text-[#2E1F0F] font-medium"
          >
            <option value="ALL">All States</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Reset Monster Sprites Button */}
          {filterMonster !== 'ALL' && (
            <button
              type="button"
              onClick={() => handleResetMonsterSprites(filterMonster)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs ml-1"
              title={`Delete all sprites for ${filterMonster.toUpperCase()}`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-600" />
              <span>Reset {filterMonster.toUpperCase()}</span>
            </button>
          )}
        </div>

        <span className="text-[11px] text-[#78654E]">
          Showing <b>{filteredSprites.length}</b> standardized files
        </span>
      </div>

      {/* Sprites Table / Cards */}
      {loading && !data ? (
        <div className="py-12 text-center text-[#78654E] text-xs">
          Loading standardizer status...
        </div>
      ) : filteredSprites.length === 0 ? (
        <div className="py-10 text-center bg-[#FFFDF9] border border-dashed border-[#D5C29E] rounded-xl text-xs text-[#78654E]">
          No character PNGs match the current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
          {filteredSprites.map((sprite) => (
            <div
              key={sprite.id}
              onClick={() => setSelectedSprite(sprite)}
              className={`p-3 rounded-xl border bg-[#FFFDF9] hover:bg-[#FAF6ED] transition-all cursor-pointer shadow-xs flex items-start gap-3 ${
                selectedSprite?.id === sprite.id
                  ? 'border-amber-500 ring-2 ring-amber-500/20'
                  : 'border-[#E8DEC8]'
              }`}
            >
              {/* Preview Thumbnail on transparent checker */}
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#D5C29E] flex-shrink-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:8px_8px] bg-slate-100 flex items-center justify-center">
                <img
                  src={sprite.standardizedUrl}
                  alt={sprite.id}
                  className="w-full h-full object-contain pointer-events-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `/assets/characters/${sprite.relPath}`;
                  }}
                />
                <span className="absolute bottom-0.5 right-0.5 bg-black/75 text-[8px] text-white px-1 rounded font-mono">
                  1024²
                </span>
              </div>

              {/* Metadata Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black text-[#2E1F0F] truncate uppercase">
                    {sprite.monster}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getElementBadgeColor(
                        sprite.element
                      )}`}
                    >
                      {sprite.element}
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300">
                      {sprite.state}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSprite(sprite);
                      }}
                      className="p-1 rounded hover:bg-red-50 text-red-600 border border-transparent hover:border-red-200 transition-colors ml-0.5"
                      title={`Delete ${sprite.relPath} from disk`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-[#5C4A34] font-mono grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1">
                  <div>
                    <span className="text-[#78654E]">Source: </span>
                    <b>
                      {sprite.originalWidth}×{sprite.originalHeight}
                    </b>
                  </div>
                  <div>
                    <span className="text-[#78654E]">Scale: </span>
                    <b className="text-cyan-800">{sprite.scaleApplied}x</b>
                  </div>
                  <div>
                    <span className="text-[#78654E]">Visible: </span>
                    <b>
                      {sprite.visibleBounds.width}×{sprite.visibleBounds.height}
                    </b>
                  </div>
                  <div>
                    <span className="text-[#78654E]">Alpha: </span>
                    <b className={sprite.hasTransparency ? 'text-emerald-700' : 'text-amber-700'}>
                      {sprite.hasTransparency ? 'YES' : 'NONE'}
                    </b>
                  </div>
                </div>

                {sprite.warnings.length > 0 && (
                  <div className="text-[10px] text-amber-700 bg-amber-50 rounded p-1 border border-amber-200 truncate mt-1">
                    ⚠️ {sprite.warnings[0]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Sprite Inspector Modal */}
      {selectedSprite && (
        <div className="p-3.5 bg-[#FAF6ED] rounded-xl border border-[#D5C29E] space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-black text-[#2E1F0F] uppercase flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-700" />
              Inspecting: {selectedSprite.monster} - {selectedSprite.element} - {selectedSprite.state}
            </h5>
            <button
              onClick={() => setSelectedSprite(null)}
              className="text-[10px] text-[#78654E] hover:text-[#2E1F0F] font-bold"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Visual comparison */}
            <div className="flex items-center justify-center p-3 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:10px_10px] bg-slate-100 rounded-lg border border-[#D5C29E] h-48">
              <img
                src={selectedSprite.standardizedUrl}
                alt="standardized full"
                className="max-h-full max-w-full object-contain drop-shadow-md"
              />
            </div>

            {/* Metric checklist */}
            <div className="space-y-1.5 text-[11px] text-[#5C4A34]">
              <div className="flex justify-between border-b border-[#E8DEC8] pb-1">
                <span>Canonical Path:</span>
                <span className="font-mono text-[10px] truncate max-w-[200px]">
                  {selectedSprite.relPath}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#E8DEC8] pb-1">
                <span>Original Dimensions:</span>
                <b className="font-mono">
                  {selectedSprite.originalWidth} × {selectedSprite.originalHeight} px
                </b>
              </div>
              <div className="flex justify-between border-b border-[#E8DEC8] pb-1">
                <span>Visible Bounds Detected:</span>
                <b className="font-mono">
                  {selectedSprite.visibleBounds.width} × {selectedSprite.visibleBounds.height} px
                </b>
              </div>
              <div className="flex justify-between border-b border-[#E8DEC8] pb-1">
                <span>Scale Applied:</span>
                <b className="font-mono text-cyan-800">{selectedSprite.scaleApplied}x</b>
              </div>
              <div className="flex justify-between border-b border-[#E8DEC8] pb-1">
                <span>Standard Canvas:</span>
                <b className="font-mono text-emerald-800">
                  {selectedSprite.standardizedWidth} × {selectedSprite.standardizedHeight} px
                </b>
              </div>
              <div className="flex justify-between border-b border-[#E8DEC8] pb-1">
                <span>Centered Bounds:</span>
                <b className="font-mono">
                  {selectedSprite.visibleScaledWidth} × {selectedSprite.visibleScaledHeight} px
                </b>
              </div>
              <div className="flex justify-between">
                <span>Transparent Background:</span>
                <b className={selectedSprite.hasTransparency ? 'text-emerald-700' : 'text-amber-700'}>
                  {selectedSprite.hasTransparency ? '✓ Transparent' : '⚠️ Solid / Missing'}
                </b>
              </div>
            </div>
          </div>

          {/* Inspector Action Buttons */}
          <div className="pt-2 border-t border-[#E8DEC8] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleDeleteSprite(selectedSprite)}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete This Sprite File</span>
            </button>

            <button
              type="button"
              onClick={() => handleResetMonsterSprites(selectedSprite.monster)}
              className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-600" />
              <span>Reset All {selectedSprite.monster.toUpperCase()} Sprites</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
