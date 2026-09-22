/**
 * Monster Portrait Asset Registry & Management Service
 * Manages custom uploaded PNG portraits for every monster in Monster Realms.
 * Syncs with local storage and backend `/api/portraits/` endpoints.
 */

import { ElementType } from '../../types';
import {
  getElementalPortraitPath,
  normalizeElement,
  normalizeUnitName,
} from './elementalAssetHelper';
import { CANONICAL_CHARACTER_ASSETS } from './monsterAssetManifest';

type PortraitListener = () => void;

const CANONICAL_PYROSAUR_ELEMS = ['fire', 'water', 'grass', 'light', 'dark'];
const CANONICAL_NEKOHIME_ELEMS = ['grass', 'fire', 'water', 'light', 'dark'];
const CANONICAL_FLORAWEAVER_ELEMS = ['grass', 'fire', 'water', 'dark', 'light'];

class PortraitRegistryService {
  private customPortraits: Map<string, string> = new Map(); // variantId or path -> dataUrl or serverUrl
  private serverAvailability: Map<string, boolean> = new Map();
  private listeners: Set<PortraitListener> = new Set();

  constructor() {
    this.seedCanonicalAssets();
    this.loadLocalOverrides();
    this.refreshServerStatus();
  }

  private seedCanonicalAssets(): void {
    // Only mark confirmed permanent assets that exist on disk as available
    CANONICAL_PYROSAUR_ELEMS.forEach(elem => {
      this.serverAvailability.set(`/assets/characters/pyrosaur/${elem}/PORTRAIT.png`, true);
      this.serverAvailability.set(`/assets/characters/pyrosaur/${elem}/portrait.png`, true);
      this.serverAvailability.set(`pyrosaur_${elem}`, true);
      this.serverAvailability.set(`var_pyrosaur_${elem}`, true);
    });
    this.serverAvailability.set('fam_pyrosaur', true);
    this.serverAvailability.set('pyrosaur', true);

    CANONICAL_NEKOHIME_ELEMS.forEach(elem => {
      this.serverAvailability.set(`/assets/characters/nekohime/${elem}/PORTRAIT.png`, true);
      this.serverAvailability.set(`/assets/characters/nekohime/${elem}/portrait.png`, true);
      this.serverAvailability.set(`nekohime_${elem}`, true);
      this.serverAvailability.set(`var_nekohime_${elem}`, true);
    });
    this.serverAvailability.set('fam_nekohime', true);
    this.serverAvailability.set('nekohime', true);

    CANONICAL_FLORAWEAVER_ELEMS.forEach(elem => {
      this.serverAvailability.set(`/assets/characters/floraweaver/${elem}/PORTRAIT.png`, true);
      this.serverAvailability.set(`/assets/characters/floraweaver/${elem}/portrait.png`, true);
      this.serverAvailability.set(`floraweaver_${elem}`, true);
      this.serverAvailability.set(`var_floraweaver_${elem}`, true);
    });
    this.serverAvailability.set('fam_floraweaver', true);
    this.serverAvailability.set('floraweaver', true);

    // Ensure Tideguard Water is definitively marked as available
    this.serverAvailability.set('/assets/characters/tideguard/water/PORTRAIT.png', true);
    this.serverAvailability.set('/assets/characters/tideguard/water/portrait.png', true);
    this.serverAvailability.set('tideguard_water', true);
    this.serverAvailability.set('var_tideguard_water', true);
    this.serverAvailability.set('fam_tideguard', true);
    this.serverAvailability.set('tideguard', true);
  }

  private loadLocalOverrides(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('mr_custom_monster_portraits');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            for (const [id, url] of Object.entries(parsed)) {
              if (typeof url === 'string') {
                this.customPortraits.set(id.toLowerCase(), url);
              }
            }
          }
          // Never allow local storage to override canonical portrait paths
          const canonicalKeys = [
            'fam_pyrosaur', 'pyrosaur',
            'var_pyrosaur_fire', 'pyrosaur_fire',
            'var_pyrosaur_water', 'pyrosaur_water',
            'var_pyrosaur_grass', 'pyrosaur_grass',
            'var_pyrosaur_light', 'pyrosaur_light',
            'var_pyrosaur_dark', 'pyrosaur_dark',
            'fam_nekohime', 'nekohime',
            'var_nekohime_grass', 'nekohime_grass',
            'var_nekohime_fire', 'nekohime_fire',
            'var_nekohime_water', 'nekohime_water',
            'var_nekohime_light', 'nekohime_light',
            'var_nekohime_dark', 'nekohime_dark',
            'fam_floraweaver', 'floraweaver',
            'var_floraweaver_grass', 'floraweaver_grass',
            'var_floraweaver_fire', 'floraweaver_fire',
            'var_floraweaver_water', 'floraweaver_water',
            'var_floraweaver_dark', 'floraweaver_dark',
            'var_floraweaver_light', 'floraweaver_light',
            'fam_tideguard', 'tideguard',
            'var_tideguard_water', 'tideguard_water'
          ];
          canonicalKeys.forEach(k => this.customPortraits.delete(k));
        }
      }
    } catch (err) {
      console.warn('[PortraitRegistry] Failed to load local overrides', err);
    }
  }

  private saveLocalOverrides(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const obj: Record<string, string> = {};
        for (const [id, url] of this.customPortraits.entries()) {
          obj[id] = url;
        }
        window.localStorage.setItem('mr_custom_monster_portraits', JSON.stringify(obj));
      }
    } catch (err) {
      console.warn('[PortraitRegistry] Failed to save local overrides', err);
    }
  }

  public subscribe(cb: PortraitListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('[PortraitRegistry] Listener error', err);
      }
    });
  }

  public async refreshServerStatus(): Promise<void> {
    try {
      const res = await fetch('/api/portraits/status');
      if (res.ok) {
        const data = await res.json();
        if (data.status && typeof data.status === 'object') {
          for (const [id, isPresent] of Object.entries(data.status)) {
            const cleanId = id.toLowerCase();
            this.serverAvailability.set(cleanId, Boolean(isPresent));
            if (isPresent && !this.customPortraits.has(cleanId)) {
              if (cleanId.startsWith('/assets/')) {
                this.customPortraits.set(cleanId, cleanId);
              }
            }
          }
          this.notify();
        }
      }
    } catch {
      // Offline / client-mode fallback
    }

    // Also inspect elemental endpoints
    try {
      const elemRes = await fetch('/api/characters/elemental-status');
      if (elemRes.ok) {
        const elemData = await elemRes.json();
        if (elemData.units && typeof elemData.units === 'object') {
          for (const [unit, elements] of Object.entries(elemData.units)) {
            if (typeof elements === 'object' && elements !== null) {
              for (const [elem, info] of Object.entries(elements as Record<string, { portrait: boolean; status: boolean; idle: boolean }>)) {
                const portPathUpper = `/assets/characters/${unit}/${elem}/PORTRAIT.png`;
                const portPathLower = `/assets/characters/${unit}/${elem}/portrait.png`;
                const idlePath = `/assets/characters/${unit}/${elem}/IDLE.png`;
                const hasPortrait = Boolean(info.portrait);
                this.serverAvailability.set(portPathUpper, hasPortrait);
                this.serverAvailability.set(portPathLower, hasPortrait);
                this.serverAvailability.set(`${unit}_${elem}`, hasPortrait);
                this.serverAvailability.set(`var_${unit}_${elem}`, hasPortrait);
                this.serverAvailability.set(idlePath, Boolean(info.status || info.idle));
              }
            }
          }
          this.notify();
        }
      }
    } catch {
      // Offline
    }
  }

  public getPortraitUrl(
    variantId?: string,
    element?: ElementType | string,
    unitName?: string
  ): string | null {
    if (!variantId && !unitName) return null;
    const cleanId = (variantId || '').toLowerCase();

    // 0. CANONICAL ASSET MANDATE: Guaranteed permanent assets always use canonical directory
    const resolvedUnit = normalizeUnitName(variantId, unitName);
    const resolvedElem = normalizeElement(element, variantId);

    if (resolvedUnit === 'nekohime' && CANONICAL_NEKOHIME_ELEMS.includes(resolvedElem)) {
      return `/assets/characters/nekohime/${resolvedElem}/PORTRAIT.png`;
    }

    if (resolvedUnit === 'pyrosaur' && CANONICAL_PYROSAUR_ELEMS.includes(resolvedElem)) {
      return `/assets/characters/pyrosaur/${resolvedElem}/PORTRAIT.png`;
    }

    if (resolvedUnit === 'floraweaver' && CANONICAL_FLORAWEAVER_ELEMS.includes(resolvedElem)) {
      return `/assets/characters/floraweaver/${resolvedElem}/PORTRAIT.png`;
    }

    if (resolvedUnit === 'tideguard' && resolvedElem === 'water') {
      return '/assets/characters/tideguard/water/PORTRAIT.png';
    }

    // 1. Direct user custom override
    if (this.customPortraits.has(cleanId)) {
      return this.customPortraits.get(cleanId)!;
    }

    // 2. Stripped prefix match (e.g. pyrosaur_fire)
    const stripped = cleanId.replace(/^var_/, '');
    if (this.customPortraits.has(stripped)) {
      return this.customPortraits.get(stripped)!;
    }

    // 3. Canonical Elemental Path: /assets/characters/[unitName]/[element]/PORTRAIT.png
    const elementalPath = getElementalPortraitPath(resolvedUnit, resolvedElem);
    const elementalPathLower = `/assets/characters/${resolvedUnit}/${resolvedElem}/portrait.png`;

    if (this.customPortraits.has(elementalPath)) {
      return this.customPortraits.get(elementalPath)!;
    }
    if (this.customPortraits.has(elementalPathLower)) {
      return this.customPortraits.get(elementalPathLower)!;
    }

    // Check server availability for the elemental portrait
    if (this.serverAvailability.get(elementalPath) === true) {
      return elementalPath;
    }
    if (this.serverAvailability.get(elementalPathLower) === true) {
      return elementalPathLower;
    }
    if (
      this.serverAvailability.get(`${resolvedUnit}_${resolvedElem}`) === true ||
      this.serverAvailability.get(`var_${resolvedUnit}_${resolvedElem}`) === true
    ) {
      return elementalPath;
    }

    // 4. Authoritative Canonical Manifest - variant-specific only!
    // Never substitute a different element's portrait (e.g. Pyrosaur Fire for Pyrosaur Water)
    const variantKey = `var_${resolvedUnit}_${resolvedElem}`;
    const manifestEntry =
      CANONICAL_CHARACTER_ASSETS[cleanId] ||
      CANONICAL_CHARACTER_ASSETS[stripped] ||
      CANONICAL_CHARACTER_ASSETS[variantKey];

    if (manifestEntry?.portrait) {
      const entryElem = normalizeElement(undefined, manifestEntry.id);
      if (entryElem === resolvedElem) {
        if (
          this.serverAvailability.get(manifestEntry.portrait) === true ||
          (resolvedUnit === 'nekohime' && CANONICAL_NEKOHIME_ELEMS.includes(resolvedElem)) ||
          (resolvedUnit === 'pyrosaur' && CANONICAL_PYROSAUR_ELEMS.includes(resolvedElem)) ||
          (resolvedUnit === 'floraweaver' && CANONICAL_FLORAWEAVER_ELEMS.includes(resolvedElem)) ||
          (resolvedUnit === 'tideguard' && resolvedElem === 'water')
        ) {
          return manifestEntry.portrait;
        }
      }
    }

    // 5. Explicit check for permanent canonical assets on disk
    if (resolvedUnit === 'nekohime' && CANONICAL_NEKOHIME_ELEMS.includes(resolvedElem)) {
      return `/assets/characters/nekohime/${resolvedElem}/PORTRAIT.png`;
    }

    if (resolvedUnit === 'pyrosaur' && CANONICAL_PYROSAUR_ELEMS.includes(resolvedElem)) {
      return `/assets/characters/pyrosaur/${resolvedElem}/PORTRAIT.png`;
    }

    if (resolvedUnit === 'floraweaver' && CANONICAL_FLORAWEAVER_ELEMS.includes(resolvedElem)) {
      return `/assets/characters/floraweaver/${resolvedElem}/PORTRAIT.png`;
    }

    if (resolvedUnit === 'tideguard' && resolvedElem === 'water') {
      return '/assets/characters/tideguard/water/PORTRAIT.png';
    }

    return null;
  }

  public hasCustomPortrait(variantId?: string, element?: ElementType | string): boolean {
    return Boolean(this.getPortraitUrl(variantId, element));
  }

  public clearUnitElement(unit: string, elem: string): void {
    const u = unit.toLowerCase();
    const e = elem.toLowerCase();
    this.customPortraits.delete(`${u}_${e}`);
    this.customPortraits.delete(`var_${u}_${e}`);
    this.customPortraits.delete(`/assets/characters/${u}/${e}/PORTRAIT.png`);
    this.customPortraits.delete(`/assets/characters/${u}/${e}/portrait.png`);
    this.serverAvailability.set(`/assets/characters/${u}/${e}/PORTRAIT.png`, false);
    this.serverAvailability.set(`/assets/characters/${u}/${e}/portrait.png`, false);
    this.serverAvailability.set(`${u}_${e}`, false);
    this.serverAvailability.set(`var_${u}_${e}`, false);
    this.saveLocalOverrides();
    this.notify();
  }

  public async savePortrait(variantId: string, dataUrl: string): Promise<string> {
    const cleanId = variantId.toLowerCase();
    this.customPortraits.set(cleanId, dataUrl);
    this.saveLocalOverrides();
    this.notify();

    try {
      const res = await fetch('/api/portraits/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: cleanId, dataUrl }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.url) {
          this.customPortraits.set(cleanId, json.url);
          this.serverAvailability.set(cleanId, true);
          this.saveLocalOverrides();
          this.notify();
          return json.url;
        }
      }
    } catch (err) {
      console.warn('[PortraitRegistry] Server save failed, cached in localStorage', err);
    }
    return dataUrl;
  }

  public async saveBatchPortraits(portraits: Record<string, string>): Promise<string[]> {
    const saved: string[] = [];
    for (const [id, dataUrl] of Object.entries(portraits)) {
      const cleanId = id.toLowerCase();
      this.customPortraits.set(cleanId, dataUrl);
      saved.push(cleanId);
    }
    this.saveLocalOverrides();
    this.notify();

    try {
      const res = await fetch('/api/portraits/save-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portraits }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.savedPortraits && Array.isArray(json.savedPortraits)) {
          json.savedPortraits.forEach((cleanId: string) => {
            this.serverAvailability.set(cleanId, true);
          });
        }
      }
    } catch (err) {
      console.warn('[PortraitRegistry] Server batch save failed', err);
    }
    return saved;
  }

  public clearPortrait(variantId: string): void {
    const cleanId = variantId.toLowerCase();
    this.customPortraits.delete(cleanId);
    this.customPortraits.delete(cleanId.replace(/^var_/, ''));
    this.saveLocalOverrides();
    this.notify();
  }

  public getAllCustomPortraits(): Record<string, string> {
    const res: Record<string, string> = {};
    this.customPortraits.forEach((val, key) => {
      res[key] = val;
    });
    return res;
  }
}

export const portraitRegistry = new PortraitRegistryService();
