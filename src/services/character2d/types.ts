/**
 * 2D Combat Monster Visual System - Types
 * Supports 5 dedicated combat artwork states per monster: IDLE, ATTACK, HURT, DEAD, VICTORY.
 */

export type MonsterCombatVisualState = 'IDLE' | 'ATTACK' | 'HURT' | 'DEFEATED' | 'DEAD' | 'VICTORY';

export interface Monster2DVisualStates {
  idle: string;
  attack: string;
  hurt: string;
  defeated: string;
  dead: string;
  victory: string;
}

export interface Monster2DConfig {
  familyId: string;
  variantId?: string;
  element?: string;
  name: string;
  states: Monster2DVisualStates;
  scale?: number;
  heightOffset?: number;
}

export interface MissingCombatAssetReport {
  monsterName: string;
  state: MonsterCombatVisualState;
  expectedUrl: string;
}
