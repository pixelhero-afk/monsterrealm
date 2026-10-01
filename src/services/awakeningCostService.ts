/**
 * Awakening Cost Service
 * Synchronizes custom unit awakening material requirements with the backend API
 * and keeps client-side calculations and UI components reactive in real-time.
 */

import { MonsterVariant } from '../types';
import {
  AwakeningCost,
  getAwakeningCost,
  getDefaultAwakeningCost,
  setAwakeningCostOverride,
  setAllAwakeningCostOverrides,
  getAllAwakeningCostOverrides,
} from '../data/elementalDungeons';

class AwakeningCostService {
  private listeners: Set<() => void> = new Set();
  private isLoaded = false;
  private overrides: Record<string, AwakeningCost> = {};

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
        console.error('Error notifying awakeningCostService listener:', err);
      }
    });
  }

  public async init(): Promise<void> {
    try {
      const res = await fetch('/api/awakening/costs');
      if (res.ok) {
        const data = await res.json();
        if (data.overrides && typeof data.overrides === 'object') {
          this.overrides = data.overrides;
          setAllAwakeningCostOverrides(this.overrides);
        }
        this.isLoaded = true;
        this.notify();
      }
    } catch (err) {
      console.warn('Could not load awakening cost overrides from server:', err);
    }
  }

  public getOverrides(): Record<string, AwakeningCost> {
    return { ...this.overrides };
  }

  public isOverridden(variantId: string): boolean {
    return Boolean(this.overrides[variantId]);
  }

  public getCost(variant: MonsterVariant): AwakeningCost {
    return getAwakeningCost(variant);
  }

  public getDefaultCost(variant: MonsterVariant): AwakeningCost {
    return getDefaultAwakeningCost(variant);
  }

  public async saveUnitCost(variantId: string, cost: AwakeningCost): Promise<void> {
    const res = await fetch('/api/awakening/cost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player_default',
      },
      body: JSON.stringify({ variantId, cost }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update awakening cost' }));
      throw new Error(err.error || 'Failed to update awakening cost');
    }

    const data = await res.json();
    if (data.overrides) {
      this.overrides = data.overrides;
      setAllAwakeningCostOverrides(this.overrides);
    } else {
      this.overrides[variantId] = cost;
      setAwakeningCostOverride(variantId, cost);
    }

    this.notify();
  }

  public async resetUnitCost(variantId: string): Promise<void> {
    const res = await fetch('/api/awakening/cost/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player_default',
      },
      body: JSON.stringify({ variantId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to reset awakening cost' }));
      throw new Error(err.error || 'Failed to reset awakening cost');
    }

    const data = await res.json();
    if (data.overrides) {
      this.overrides = data.overrides;
      setAllAwakeningCostOverrides(this.overrides);
    } else {
      delete this.overrides[variantId];
      setAwakeningCostOverride(variantId, null);
    }

    this.notify();
  }

  public async resetAllCosts(): Promise<void> {
    const res = await fetch('/api/awakening/cost/reset-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player_default',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to reset all awakening costs' }));
      throw new Error(err.error || 'Failed to reset all awakening costs');
    }

    this.overrides = {};
    setAllAwakeningCostOverrides({});
    this.notify();
  }

  public async bulkSetCosts(overrides: Record<string, AwakeningCost>): Promise<void> {
    const res = await fetch('/api/awakening/cost/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-id': 'player_default',
      },
      body: JSON.stringify({ overrides }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to apply bulk awakening costs' }));
      throw new Error(err.error || 'Failed to apply bulk awakening costs');
    }

    const data = await res.json();
    if (data.overrides) {
      this.overrides = data.overrides;
      setAllAwakeningCostOverrides(this.overrides);
    }
    this.notify();
  }
}

export const awakeningCostService = new AwakeningCostService();
