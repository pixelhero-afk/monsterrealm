/**
 * Custom Units Management Service
 * Manages dynamically created units and families in DevTools,
 * syncing with backend persistence and the in-memory Monster Realms registries.
 */

import { MonsterFamily, MonsterVariant, PlayerMonster } from '../types';
import { MONSTER_FAMILIES, MONSTER_VARIANTS } from '../data/monsters';
import { monster2DRegistry } from './character2d/monster2DRegistry';

export interface CreateUnitPayload {
  family: MonsterFamily | { familyId: string };
  variant: MonsterVariant;
  autoGrantToRoster?: boolean;
  startingLevel?: number;
  startingStars?: number;
}

export interface CustomUnitsStore {
  families: MonsterFamily[];
  variants: MonsterVariant[];
}

class CustomUnitsService {
  private customFamilies: Map<string, MonsterFamily> = new Map();
  private customVariants: Map<string, MonsterVariant> = new Map();
  private listeners: Set<() => void> = new Set();
  private isLoaded = false;

  constructor() {
    this.init();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Error notifying custom unit listener:', err);
      }
    });
  }

  public async init(): Promise<void> {
    if (this.isLoaded) return;
    try {
      const res = await fetch('/api/units/custom');
      if (res.ok) {
        const data = await res.json();
        if (data.families && Array.isArray(data.families)) {
          data.families.forEach((fam: MonsterFamily) => {
            this.registerFamilyInMemory(fam);
          });
        }
        if (data.variants && Array.isArray(data.variants)) {
          data.variants.forEach((v: MonsterVariant) => {
            this.registerVariantInMemory(v);
          });
        }
        this.isLoaded = true;
        this.notify();
      }
    } catch (err) {
      console.warn('Could not load custom units from server:', err);
    }
  }

  public registerFamilyInMemory(family: MonsterFamily): void {
    this.customFamilies.set(family.familyId, family);
    MONSTER_FAMILIES[family.familyId] = family;
  }

  public registerVariantInMemory(variant: MonsterVariant): void {
    this.customVariants.set(variant.variantId, variant);
    MONSTER_VARIANTS[variant.variantId] = variant;
    // Register into 2D Monster Sprite registry
    monster2DRegistry.registerVariantConfig(variant);
  }

  public getCustomFamilies(): MonsterFamily[] {
    return Array.from(this.customFamilies.values());
  }

  public getCustomVariants(): MonsterVariant[] {
    return Array.from(this.customVariants.values());
  }

  public isCustomVariant(variantId: string): boolean {
    return this.customVariants.has(variantId);
  }

  public async createUnit(payload: CreateUnitPayload): Promise<{
    success: boolean;
    family: MonsterFamily;
    variant: MonsterVariant;
    newMonster?: PlayerMonster;
    message?: string;
    directory?: string;
  }> {
    const res = await fetch('/api/units/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player_default',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create unit' }));
      throw new Error(err.error || 'Failed to create unit');
    }

    const data = await res.json();
    if (data.family && data.family.familyId) {
      this.registerFamilyInMemory(data.family);
    }
    if (data.variant && data.variant.variantId) {
      this.registerVariantInMemory(data.variant);
    }

    this.notify();
    return data;
  }

  public async grantUnit(
    variantId: string,
    level: number = 15,
    stars?: number
  ): Promise<{ success: boolean; monster: PlayerMonster }> {
    const res = await fetch('/api/units/grant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player_default',
      },
      body: JSON.stringify({ variantId, level, stars }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to grant unit' }));
      throw new Error(err.error || 'Failed to grant unit');
    }

    return res.json();
  }

  public async deleteCustomUnit(variantId: string): Promise<boolean> {
    const res = await fetch(`/api/units/custom/${encodeURIComponent(variantId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player_default',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete unit' }));
      throw new Error(err.error || 'Failed to delete unit');
    }

    this.customVariants.delete(variantId);
    delete MONSTER_VARIANTS[variantId];
    this.notify();
    return true;
  }
}

export const customUnitsService = new CustomUnitsService();
