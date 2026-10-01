/**
 * Unit Availability & Disabled Units Service
 * Manages unit disable/enable status across Monster Realms.
 * Disabled units cannot be assigned to party, deployed to battle, or obtained via the summon gate.
 */

import { MONSTER_VARIANTS } from '../data/monsters';

class UnitAvailabilityService {
  private disabledIds: Set<string> = new Set();
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
        console.error('Error notifying unit availability listener:', err);
      }
    });
  }

  public async init(): Promise<void> {
    try {
      const res = await fetch('/api/units/disabled');
      if (res.ok) {
        const data = await res.json();
        if (data.disabledVariantIds && Array.isArray(data.disabledVariantIds)) {
          this.disabledIds = new Set(data.disabledVariantIds);
          this.applyToInMemoryVariants();
        }
        this.isLoaded = true;
        this.notify();
      }
    } catch (err) {
      console.warn('Could not load disabled units from server:', err);
    }
  }

  private applyToInMemoryVariants(): void {
    Object.values(MONSTER_VARIANTS).forEach((v) => {
      v.disabled = this.disabledIds.has(v.variantId);
    });
  }

  public isUnitDisabled(variantId: string): boolean {
    return this.disabledIds.has(variantId);
  }

  public getDisabledCount(): number {
    return this.disabledIds.size;
  }

  public getDisabledIds(): string[] {
    return Array.from(this.disabledIds);
  }

  public async toggleUnitDisabled(variantId: string): Promise<boolean> {
    const isCurrentlyDisabled = this.disabledIds.has(variantId);
    const shouldDisable = !isCurrentlyDisabled;
    return this.setUnitDisabled(variantId, shouldDisable);
  }

  public async setUnitDisabled(variantId: string, disabled: boolean): Promise<boolean> {
    const res = await fetch('/api/units/disabled/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player_default',
      },
      body: JSON.stringify({ variantId, disabled }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update unit status' }));
      throw new Error(err.error || 'Failed to update unit status');
    }

    const data = await res.json();
    if (data.disabledVariantIds && Array.isArray(data.disabledVariantIds)) {
      this.disabledIds = new Set(data.disabledVariantIds);
    } else {
      if (disabled) {
        this.disabledIds.add(variantId);
      } else {
        this.disabledIds.delete(variantId);
      }
    }

    this.applyToInMemoryVariants();
    this.notify();
    return this.disabledIds.has(variantId);
  }

  public async bulkSetDisabled(variantIds: string[], disabled: boolean): Promise<void> {
    const res = await fetch('/api/units/disabled/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player_default',
      },
      body: JSON.stringify({ variantIds, disabled }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to bulk update unit status' }));
      throw new Error(err.error || 'Failed to bulk update unit status');
    }

    const data = await res.json();
    if (data.disabledVariantIds && Array.isArray(data.disabledVariantIds)) {
      this.disabledIds = new Set(data.disabledVariantIds);
    }

    this.applyToInMemoryVariants();
    this.notify();
  }
}

export const unitAvailabilityService = new UnitAvailabilityService();
