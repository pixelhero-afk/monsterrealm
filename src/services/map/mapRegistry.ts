/**
 * Map Registry & Battlefield Environment Manager
 * Handles data-driven map background & combat battleplatform resolution,
 * asset availability probing, local overrides, and custom artwork persistence.
 */

import { BATTLE_MAPS, MapDefinition } from '../../data/maps';

type MapChangeCallback = () => void;

class MapRegistryService {
  private bgAvailabilityCache: Map<string, boolean> = new Map();
  private platformAvailabilityCache: Map<string, boolean> = new Map();
  private listeners: Set<MapChangeCallback> = new Set();
  private customMaps: Map<string, string> = new Map(); // mapId -> background url
  private customPlatforms: Map<string, string> = new Map(); // mapId -> platform url

  constructor() {
    this.loadLocalOverrides();
    this.refreshServerStatus();
  }

  private loadLocalOverrides(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedMaps = window.localStorage.getItem('mr_custom_maps');
        if (storedMaps) {
          const parsed = JSON.parse(storedMaps);
          if (parsed && typeof parsed === 'object') {
            for (const [id, url] of Object.entries(parsed)) {
              if (typeof url === 'string') {
                this.customMaps.set(id, url);
              }
            }
          }
        }

        const storedPlatforms = window.localStorage.getItem('mr_custom_platforms');
        if (storedPlatforms) {
          const parsed = JSON.parse(storedPlatforms);
          if (parsed && typeof parsed === 'object') {
            for (const [id, url] of Object.entries(parsed)) {
              if (typeof url === 'string') {
                this.customPlatforms.set(id, url);
              }
            }
          }
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  private saveLocalOverrides(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const objMaps: Record<string, string> = {};
        for (const [id, url] of this.customMaps.entries()) {
          objMaps[id] = url;
        }
        window.localStorage.setItem('mr_custom_maps', JSON.stringify(objMaps));

        const objPlatforms: Record<string, string> = {};
        for (const [id, url] of this.customPlatforms.entries()) {
          objPlatforms[id] = url;
        }
        window.localStorage.setItem('mr_custom_platforms', JSON.stringify(objPlatforms));
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  public subscribe(cb: MapChangeCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Error in map listener', err);
      }
    });
  }

  public async refreshServerStatus(): Promise<void> {
    try {
      const res = await fetch('/api/maps/status');
      if (res.ok) {
        const data = await res.json();
        if (data.status && typeof data.status === 'object') {
          for (const [id, statusInfo] of Object.entries(data.status)) {
            if (typeof statusInfo === 'object' && statusInfo !== null) {
              const info = statusInfo as { background?: boolean; platform?: boolean };
              this.bgAvailabilityCache.set(id, Boolean(info.background));
              this.platformAvailabilityCache.set(id, Boolean(info.platform));
              if (info.background && !this.customMaps.has(id)) {
                this.customMaps.set(id, `/assets/maps/${id}.png`);
              }
              if (info.platform && !this.customPlatforms.has(id)) {
                this.customPlatforms.set(id, `/assets/maps/${id}_platform.png`);
              }
            } else {
              this.bgAvailabilityCache.set(id, Boolean(statusInfo));
            }
          }
          this.notify();
        }
      }
    } catch {
      // Offline / dev mode fallback
    }
  }

  public isAvailable(mapId: string): boolean {
    if (this.customMaps.has(mapId)) return true;
    return this.bgAvailabilityCache.get(mapId) ?? false;
  }

  public isPlatformAvailable(mapId: string): boolean {
    if (this.customPlatforms.has(mapId)) return true;
    return this.platformAvailabilityCache.get(mapId) ?? false;
  }

  public getMapBackgroundUrl(mapId: string): string {
    if (this.customMaps.has(mapId)) {
      return this.customMaps.get(mapId)!;
    }
    const def = BATTLE_MAPS[mapId];
    return def ? def.backgroundUrl : `/assets/maps/${mapId}.png`;
  }

  public getMapPlatformUrl(mapId: string): string | null {
    if (this.customPlatforms.has(mapId)) {
      return this.customPlatforms.get(mapId)!;
    }
    if (this.platformAvailabilityCache.get(mapId)) {
      return `/assets/maps/${mapId}_platform.png`;
    }
    return null;
  }

  public async saveCustomMap(mapId: string, dataUrl: string): Promise<boolean> {
    this.customMaps.set(mapId, dataUrl);
    this.saveLocalOverrides();
    this.bgAvailabilityCache.set(mapId, true);
    this.notify();

    try {
      const res = await fetch('/api/maps/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapId, dataUrl }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.url) {
          this.customMaps.set(mapId, json.url);
          this.saveLocalOverrides();
        }
        return true;
      }
    } catch (err) {
      console.warn('[MapRegistry] Server background save failed, retained in local storage', err);
    }
    return true;
  }

  public async saveCustomPlatform(mapId: string, dataUrl: string): Promise<boolean> {
    this.customPlatforms.set(mapId, dataUrl);
    this.saveLocalOverrides();
    this.platformAvailabilityCache.set(mapId, true);
    this.notify();

    try {
      const res = await fetch('/api/maps/save-platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapId, dataUrl }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.url) {
          this.customPlatforms.set(mapId, json.url);
          this.saveLocalOverrides();
        }
        return true;
      }
    } catch (err) {
      console.warn('[MapRegistry] Server platform save failed, retained in local storage', err);
    }
    return true;
  }

  public clearCustomMap(mapId: string): void {
    this.customMaps.delete(mapId);
    this.saveLocalOverrides();
    this.notify();
  }

  public clearCustomPlatform(mapId: string): void {
    this.customPlatforms.delete(mapId);
    this.saveLocalOverrides();
    this.notify();
  }
}

export const mapRegistry = new MapRegistryService();
