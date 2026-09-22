/**
 * 3D Creature Generator & Animation System
 * Uses the production Character Model Pipeline (GLB/glTF, Skeletal Rigging, Anime Cel-Shading)
 * to instantiate genuine 3D characters for Battle, Showcase, and Summoning.
 */

import * as THREE from 'three';
import { ElementType } from '../../../types';
import { characterModelLoader } from '../../../services/characterPipeline/CharacterModelLoader';
import { CreatureAction, Creature3DInstance } from '../../../services/characterPipeline/types';

export type { CreatureAction, Creature3DInstance };

/**
 * Detects skill slot (1 = Basic Attack, 2 = Special Ability, 3 = Ultimate Cataclysm / Supernova)
 * from skill name, ID, or action string.
 */
export function detectSkillSlot(nameOrSlot?: string | number): 1 | 2 | 3 {
  if (typeof nameOrSlot === 'number') {
    return nameOrSlot === 3 ? 3 : nameOrSlot === 2 ? 2 : 1;
  }
  const s = (nameOrSlot || '').toLowerCase();
  // Skill 3 - Ultimates
  if (
    s.includes('cataclysm') ||
    s.includes('resurgence') ||
    s.includes('rejuvenation') ||
    s.includes('supernova') ||
    s.includes('execution') ||
    s.includes('eclipse') ||
    s.includes('kagura') ||
    s.includes('cataclysmic') ||
    s.includes('paw') ||
    s.includes('skill3') ||
    s.includes('ultimate')
  ) {
    return 3;
  }
  // Skill 2 - Signature Specials / Shields / Buffs / Shrouds
  if (
    s.includes('burst') ||
    s.includes('bastion') ||
    s.includes('spring') ||
    s.includes('chorus') ||
    s.includes('shroud') ||
    s.includes('nether shroud') ||
    s.includes('charm') ||
    s.includes('catnip') ||
    s.includes('purr') ||
    s.includes('skill2')
  ) {
    return 2;
  }
  // Skill 1 - Basic Strikes / Claws / Darts / Beams / Fangs / Scratches
  return 1;
}

/**
 * Creates a production 3D Monster Creature based on variantId and element
 * using the reusable 3D model asset pipeline.
 */
export function createMonster3D(
  variantId: string,
  element: ElementType,
  isAwakenedInitial: boolean = false,
  isAliveInitial: boolean = true
): Creature3DInstance {
  return characterModelLoader.createMonsterInstance(
    variantId,
    isAwakenedInitial,
    isAliveInitial,
    element
  );
}
