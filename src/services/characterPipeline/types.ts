/**
 * Monster Character Asset Pipeline Types
 * Defines the contract for production 3D character models, materials, rigs, and animations.
 */

import * as THREE from 'three';
import { ElementType, AwakeningStage } from '../../types';

export type CreatureAction = 'idle' | 'attack' | 'skill' | 'hit' | 'defeat' | 'victory';

export interface Creature3DInstance {
  root: THREE.Group;
  update: (delta: number) => void;
  playAction: (action: CreatureAction, duration?: number, skillNameOrSlot?: string | number) => void;
  setAwakened: (awakened: boolean) => void;
  setAlive: (alive: boolean) => void;
  getAction: () => CreatureAction;
  isAlive: () => boolean;
  dispose: () => void;
  getSocketPosition?: (socketName: 'head' | 'chest' | 'root' | 'weapon') => THREE.Vector3;
}

export interface MonsterAnimationConfig {
  idle: string;
  walk?: string;
  attack: string;
  skill?: string;
  skill2?: string;
  skill3?: string;
  hit?: string;
  defeat?: string;
  victory?: string;
}

export interface MonsterMaterialConfig {
  familyId?: string;
  element?: ElementType;
  celShading: boolean;
  diffuseTextureUrl?: string;
  normalTextureUrl?: string;
  roughnessTextureUrl?: string;
  metalnessTextureUrl?: string;
  emissiveTextureUrl?: string;
  emissiveColor: string;
  emissiveIntensity: number;
  rimColor: string;
  rimPower: number;
  rimIntensity: number;
  roughness: number;
  metalness: number;
  tintColor?: string;
  opacity?: number;
  transparent?: boolean;
}

export interface MonsterAssetConfig {
  familyId: string;
  name: string;
  modelUrl: string;
  scale: number;
  heightOffset: number;
  rotationYOffset: number;
  materials: MonsterMaterialConfig;
  animations: MonsterAnimationConfig;
  awakenedConfig?: {
    scaleMultiplier: number;
    emissiveMultiplier: number;
    extraAuraColor?: string;
  };
}
