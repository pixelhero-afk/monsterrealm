/**
 * Asset Validation Service
 * Development-time diagnostic validation checks to guarantee asset integrity,
 * unique model assignments, valid materials/textures, and prevent silent regressions.
 */

import { MonsterAssetConfig } from './types';
import { MONSTER_ASSET_REGISTRY } from './monsterAssetRegistry';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface ValidationReport {
  familyId: string;
  monsterName: string;
  modelUrl: string;
  isValid: boolean;
  meshCount: number;
  materialCount: number;
  textureCount: number;
  availableAnimations: string[];
  missingAnimations: string[];
  errors: string[];
  warnings: string[];
}

/**
 * Validates that no two distinct monster families unintentionally share the same model file.
 */
export function checkDuplicateModelAssignments(
  registry: Record<string, MonsterAssetConfig> = MONSTER_ASSET_REGISTRY
): { hasDuplicates: boolean; duplicates: string[] } {
  const modelToFamily = new Map<string, string[]>();
  const duplicateErrors: string[] = [];

  for (const config of Object.values(registry)) {
    if (!config.modelUrl) continue;
    const existing = modelToFamily.get(config.modelUrl) || [];
    existing.push(config.familyId);
    modelToFamily.set(config.modelUrl, existing);
  }

  for (const [url, families] of modelToFamily.entries()) {
    if (families.length > 1) {
      const msg = `[AssetValidation] ERROR: Shared model detected! Families [${families.join(', ')}] both reference "${url}". Every monster must have a unique model.`;
      duplicateErrors.push(msg);
      console.error(msg);
    }
  }

  return {
    hasDuplicates: duplicateErrors.length > 0,
    duplicates: duplicateErrors,
  };
}

/**
 * Validates a loaded GLTF asset against a monster configuration.
 */
export function validateLoadedGLTF(
  gltf: GLTF,
  config: MonsterAssetConfig
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  let meshCount = 0;
  const materialsSet = new Set<string>();
  const texturesSet = new Set<string>();

  gltf.scene.traverse((obj) => {
    if ((obj as any).isMesh) {
      meshCount++;
      const mesh = obj as any;
      if (mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          materialsSet.add(m.uuid || m.name);
          if (m.map) texturesSet.add(m.map.uuid || 'map');
          if (m.normalMap) texturesSet.add(m.normalMap.uuid || 'normalMap');
          if (m.emissiveMap) texturesSet.add(m.emissiveMap.uuid || 'emissiveMap');
          if (m.roughnessMap) texturesSet.add(m.roughnessMap.uuid || 'roughnessMap');
          if (m.metalnessMap) texturesSet.add(m.metalnessMap.uuid || 'metalnessMap');
        }
      }
    }
  });

  if (meshCount === 0) {
    errors.push(`No meshes found in model ${config.modelUrl}`);
  }

  // Check animations
  const availableClips = (gltf.animations || []).map((a) => a.name);
  const lowerClips = new Set(availableClips.map((c) => c.toLowerCase()));
  const missingAnimations: string[] = [];

  const requiredAnims = [
    config.animations.idle,
    config.animations.attack,
  ];

  for (const req of requiredAnims) {
    if (req && !lowerClips.has(req.toLowerCase())) {
      // Check partial match
      const hasPartial = Array.from(lowerClips).some((c) => c.includes(req.toLowerCase()));
      if (!hasPartial) {
        missingAnimations.push(req);
        warnings.push(`Animation "${req}" not found in model clips [${availableClips.join(', ')}]`);
      }
    }
  }

  const isValid = errors.length === 0;

  if (isValid) {
    console.log(
      `[AssetValidation] OK: ${config.name} -> ${config.modelUrl} (materials: ${materialsSet.size}, textures: ${texturesSet.size}, clips: ${availableClips.length})`
    );
  } else {
    console.error(
      `[AssetValidation] ERROR: ${config.name} model failed validation at ${config.modelUrl}:`,
      errors
    );
  }

  return {
    familyId: config.familyId,
    monsterName: config.name,
    modelUrl: config.modelUrl,
    isValid,
    meshCount,
    materialCount: materialsSet.size,
    textureCount: texturesSet.size,
    availableAnimations: availableClips,
    missingAnimations,
    errors,
    warnings,
  };
}

/**
 * Checks all registry models for existence and logs development diagnostic overview.
 */
export async function runDevelopmentAssetValidation(): Promise<Record<string, boolean>> {
  console.log('[AssetValidation] Starting Monster Realms 3D Asset Integrity Audit...');

  // 1. Check for duplicate model assignments across families
  const duplicateCheck = checkDuplicateModelAssignments();
  if (duplicateCheck.hasDuplicates) {
    console.error('[AssetValidation] Integrity check failed due to duplicate model assignments!');
  } else {
    console.log('[AssetValidation] PASS: Unique model files verified across all monster families.');
  }

  // 2. Check each registered family URL
  const results: Record<string, boolean> = {};

  for (const config of Object.values(MONSTER_ASSET_REGISTRY)) {
    if (!config.modelUrl) {
      results[config.familyId] = false;
      continue;
    }
    try {
      const response = await fetch(config.modelUrl, { method: 'HEAD' });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || contentType.includes('text/html')) {
        console.error(
          `[AssetValidation] ERROR: ${config.name} model URL unreachable or returned HTML (${response.status}) at "${config.modelUrl}"`
        );
        results[config.familyId] = false;
      } else {
        results[config.familyId] = true;
      }
    } catch (e) {
      console.error(
        `[AssetValidation] ERROR: Failed network check for ${config.name} at "${config.modelUrl}":`,
        e
      );
      results[config.familyId] = false;
    }
  }

  return results;
}
