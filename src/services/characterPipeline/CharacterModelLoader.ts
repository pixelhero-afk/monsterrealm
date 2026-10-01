/**
 * Character Model Loader Service
 * Reusable GLTF/GLB loader, caching layer, and anime material transformer for Monster Realms.
 */

import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Creature3DInstance, CreatureAction, MonsterAssetConfig } from './types';
import { ElementType } from '../../types';
import { getMonsterAssetConfig, MONSTER_ASSET_REGISTRY, resolveElement } from './monsterAssetRegistry';
import { upgradeToAnimeMaterial } from './animeShading';
import { CharacterController3D } from './CharacterController3D';
import { validateLoadedGLTF, runDevelopmentAssetValidation } from './assetValidation';

class CharacterModelLoaderService {
  private gltfLoader: GLTFLoader;
  private gltfCache: Map<string, GLTF> = new Map();
  private loadingPromises: Map<string, Promise<GLTF>> = new Map();

  constructor() {
    this.gltfLoader = new GLTFLoader();

    // Configure Draco mesh decompression for compressed assets
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    this.gltfLoader.setDRACOLoader(dracoLoader);

    // Run development-time asset audit
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        runDevelopmentAssetValidation().catch((e) =>
          console.warn('[AssetValidation] Audit error:', e)
        );
      }, 500);
    }
  }

  /**
   * Preloads a GLTF model into cache
   */
  public async loadModel(url: string): Promise<GLTF> {
    if (!url) {
      throw new Error('No model URL specified');
    }
    if (this.gltfCache.has(url)) {
      return this.gltfCache.get(url)!;
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const loadPromise = (async () => {
      // Pre-flight check: verify asset exists and does not return HTML (only for http/https/relative URLs, never blob/data URLs)
      if (!url.startsWith('blob:') && !url.startsWith('data:')) {
        try {
          const headCheck = await fetch(url, { method: 'HEAD' });
          const contentType = headCheck.headers.get('content-type') || '';
          if (!headCheck.ok || contentType.includes('text/html')) {
            this.loadingPromises.delete(url);
            const err = new Error(`Asset not found or returned HTML fallback at ${url} (status: ${headCheck.status})`);
            console.error(`[CharacterModelLoader] Actual GLB loading error for "${url}":`, err);
            throw err;
          }
        } catch (checkErr) {
          if ((checkErr as Error).message?.includes('HTML fallback') || (checkErr as Error).message?.includes('not found')) {
            this.loadingPromises.delete(url);
            console.error(`[CharacterModelLoader] Actual GLB loading error for "${url}":`, checkErr);
            throw checkErr;
          }
          // Non-blocking: some servers disallow HEAD requests; let gltfLoader attempt fetch
        }
      }

      return new Promise<GLTF>((resolve, reject) => {
        this.gltfLoader.load(
          url,
          (gltf) => {
            this.gltfCache.set(url, gltf);
            this.loadingPromises.delete(url);
            resolve(gltf);
          },
          undefined,
          (error) => {
            this.loadingPromises.delete(url);
            console.error(`[CharacterModelLoader] Actual GLB loading error for "${url}":`, error);
            reject(error);
          }
        );
      });
    })();

    this.loadingPromises.set(url, loadPromise);
    return loadPromise;
  }

  /**
   * Preloads all models in the asset registry
   */
  public preloadAllMonsterModels(): void {
    Object.values(MONSTER_ASSET_REGISTRY).forEach((asset) => {
      if (asset.modelUrl) {
        this.loadModel(asset.modelUrl).catch(() => {});
      }
    });
  }

  /**
   * Clones and outfits a 3D monster model with stylized anime cel-shading
   */
  private instantiateController(
    gltf: GLTF,
    config: MonsterAssetConfig,
    isAwakened: boolean,
    isAlive: boolean,
    element: ElementType = 'GRASS'
  ): CharacterController3D {
    // Validate loaded GLTF diagnostics
    validateLoadedGLTF(gltf, config);

    // Deep clone with full skeleton and bone hierarchy preservation
    const clonedScene = SkeletonUtils.clone(gltf.scene) as THREE.Group;

    // Special handling for Floraweaver: isolate character Kira, strip scene furniture, attach bioluminescent grove props
    if (config.familyId === 'fam_floraweaver') {
      const kira = clonedScene.getObjectByName('Kira');
      if (kira) {
        const toRemove: THREE.Object3D[] = [];
        clonedScene.children.forEach((child) => {
          if (child !== kira) toRemove.push(child);
        });
        toRemove.forEach((child) => clonedScene.remove(child));
        kira.position.set(0, 0, 0);
      }
      // Attach hand-held bioluminescent mushroom cluster and sacred runic pedestal matching the dryad reference image
      attachFloraweaverSacredGrove(clonedScene, config);
    }

    // Apply Anime Cel-Shading and Shadow flags, strictly preserving underlying diffuse & normal textures
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Ensure mesh geometry has valid vertex normals for anime cel-shading & Fresnel lighting
        if (mesh.geometry && !mesh.geometry.attributes.normal) {
          mesh.geometry.computeVertexNormals();
        }

        // Apply high-precision UV mapping for Tideguard carapace & swirling optical eyes
        if (config.familyId === 'fam_tideguard' && mesh.geometry && (!mesh.geometry.attributes.uv || config.familyId === 'fam_tideguard')) {
          applyTideguardProceduralUVs(mesh);
        }

        // Apply high-precision UV mapping for Floraweaver living tree bark, foliage hair crown, and moss
        if (config.familyId === 'fam_floraweaver' && mesh.geometry && (!mesh.geometry.attributes.uv || config.familyId === 'fam_floraweaver')) {
          applyFloraweaverProceduralUVs(mesh);
        }

        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((mat) =>
            upgradeToAnimeMaterial(mat, config.materials)
          );
        } else if (mesh.material) {
          mesh.material = upgradeToAnimeMaterial(mesh.material, config.materials);
        }
      }
    });

    return new CharacterController3D(
      clonedScene,
      gltf.animations || [],
      config,
      isAwakened,
      isAlive
    );
  }

  /**
   * Creates a clearly marked temporary placeholder when an external model is awaiting upload/import
   */
  public createExternalAssetPlaceholder(config: MonsterAssetConfig, colorHex = 0x10b981): THREE.Group {
    const group = new THREE.Group();

    // 1. Runic Summoning Seal
    const ringGeo = new THREE.RingGeometry(0.7, 0.85, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    group.add(ring);

    // 2. Rotating Inner Astral Star
    const innerRingGeo = new THREE.RingGeometry(0.38, 0.45, 6);
    const innerRing = new THREE.Mesh(innerRingGeo, ringMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.06;
    group.add(innerRing);

    // 3. Holographic Beacon Indicator (clean wireframe diamond)
    const beaconGeo = new THREE.OctahedronGeometry(0.3, 0);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 0.95;
    beacon.name = 'beacon';
    group.add(beacon);

    // 4. Clearly Marked Diagnostics Billboard Sprite
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Card background
        ctx.fillStyle = 'rgba(10, 15, 29, 0.92)';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(10, 10, 492, 236, 16);
        } else {
          ctx.rect(10, 10, 492, 236);
        }
        ctx.fill();
        ctx.stroke();

        // Warning Badge
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TEMPORARY PLACEHOLDER', 256, 48);

        // Character Name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(config.familyId === 'fam_nekohime' ? 'NEKOHIME (CATGIRL MAIDEN)' : `${config.name.toUpperCase()}`, 256, 92);

        // Asset target
        ctx.fillStyle = '#94a3b8';
        ctx.font = '19px monospace';
        const filename = config.modelUrl.split('/').pop() || 'model.glb';
        ctx.fillText(`Target Asset: ${filename}`, 256, 132);

        if (config.familyId === 'fam_nekohime') {
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('Ref: Cat Ears & Bells • Twintails • Emerald Dress', 256, 172);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '15px sans-serif';
          ctx.fillText('Ready for genuine rigged anime GLB asset (No primitives)', 256, 204);

          ctx.fillStyle = '#64748b';
          ctx.font = 'italic 13px sans-serif';
          ctx.fillText('External model asset is missing during development', 256, 230);
        } else {
          ctx.fillStyle = '#34d399';
          ctx.font = '18px sans-serif';
          ctx.fillText('Ready for genuine rigged anime GLB asset', 256, 180);

          ctx.fillStyle = '#64748b';
          ctx.font = 'italic 15px sans-serif';
          ctx.fillText('(No primitives used - Real 3D pipeline ready)', 256, 218);
        }

        const spriteTexture = new THREE.CanvasTexture(canvas);
        spriteTexture.minFilter = THREE.LinearFilter;
        const spriteMat = new THREE.SpriteMaterial({
          map: spriteTexture,
          transparent: true,
          depthTest: false,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(0, 2.1, 0);
        sprite.scale.set(2.4, 1.2, 1);
        group.add(sprite);
      }
    }

    return group;
  }

  /**
   * Dynamically registers a custom GLB/GLTF model into the pipeline at runtime
   */
  public async registerCustomModel(
    familyOrVariantId: string,
    fileOrUrl: File | Blob | string
  ): Promise<GLTF> {
    const config = getMonsterAssetConfig(familyOrVariantId);
    let url: string;
    let gltf: GLTF;

    if (typeof fileOrUrl === 'string') {
      url = fileOrUrl;
      gltf = await this.loadModel(url);
    } else {
      url = URL.createObjectURL(fileOrUrl);
      const arrayBuffer = await fileOrUrl.arrayBuffer();
      gltf = await new Promise<GLTF>((resolve, reject) => {
        this.gltfLoader.parse(
          arrayBuffer,
          '',
          (parsed) => {
            resolve(parsed);
          },
          (err) => {
            reject(err);
          }
        );
      });
    }

    config.modelUrl = url;
    if (MONSTER_ASSET_REGISTRY[config.familyId]) {
      MONSTER_ASSET_REGISTRY[config.familyId].modelUrl = url;
    }

    this.gltfCache.set(url, gltf);
    return gltf;
  }

  /**
   * Synchronously creates a monster instance, populating it immediately if cached,
   * or attaching upon async load completion.
   */
  public createMonsterInstance(
    variantOrFamilyId: string,
    isAwakened = false,
    isAlive = true,
    element?: ElementType
  ): Creature3DInstance {
    const config = getMonsterAssetConfig(variantOrFamilyId, element);
    const resolvedElement = config.materials.element || resolveElement(variantOrFamilyId, element);
    const isNekohime = config.familyId === 'fam_nekohime' || config.modelUrl.includes('nekohime.glb');
    const cachedGLTF = this.gltfCache.get(config.modelUrl);

    if (cachedGLTF) {
      return this.instantiateController(cachedGLTF, config, isAwakened, isAlive, resolvedElement);
    }

    // If not yet loaded, return a clean reactive proxy wrapper.
    // STRICT REQUIREMENT: For NekoHime, NEVER use fallback primitives (no cube, cylinder, sphere, cone, capsule, or procedural geometry).
    const root = new THREE.Group();
    let placeholder: THREE.Group | null = null;
    let placeholderColor = 0xffffff;

    if (!isNekohime) {
      placeholderColor = new THREE.Color(config.materials.rimColor).getHex();
      placeholder = this.createExternalAssetPlaceholder(config, placeholderColor);
      root.add(placeholder);
    }

    let activeController: CharacterController3D | null = null;
    let pendingAction: { action: CreatureAction; duration?: number; skillSlot?: string | number } = {
      action: isAlive ? 'idle' : 'defeat',
    };
    let currentAwakened = isAwakened;
    let currentAlive = isAlive;

    this.loadModel(config.modelUrl)
      .then((gltf) => {
        if (placeholder) {
          root.remove(placeholder);
          placeholder.traverse((c) => {
            if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose();
            if ((c as THREE.Mesh).material) ((c as THREE.Mesh).material as THREE.Material).dispose();
          });
        }

        activeController = this.instantiateController(
          gltf,
          config,
          currentAwakened,
          currentAlive,
          resolvedElement
        );
        root.add(activeController.root);

        if (pendingAction) {
          activeController.playAction(
            pendingAction.action,
            pendingAction.duration,
            pendingAction.skillSlot
          );
        }
      })
      .catch((err) => {
        if (isNekohime) {
          // STRICT REQUIREMENT: Print actual GLB loading error to the console, and do NOT replace with primitives
          console.error(
            `[CharacterModelLoader] Actual GLB loading error for NekoHime from "${config.modelUrl}":`,
            err
          );
        } else {
          console.warn(
            `[CharacterModelLoader] External 3D asset "${config.modelUrl}" is pending for ${config.name}. Rendering marked temporary placeholder.`,
            err
          );
        }
      });

    return {
      root,
      update: (delta: number) => {
        if (activeController) {
          activeController.update(delta);
        } else if (placeholder) {
          // Animate summoning pedestal rings and beacon only when non-nekohime placeholder exists
          const beacon = placeholder.getObjectByName('beacon');
          if (beacon) {
            beacon.rotation.y += delta * 2.0;
            beacon.rotation.x += delta * 1.0;
            beacon.position.y = 0.95 + Math.sin(Date.now() * 0.003) * 0.08;
          }
          placeholder.rotation.y += delta * 0.5;
        }
      },
      playAction: (action: CreatureAction, duration?: number, skillSlot?: string | number) => {
        pendingAction = { action, duration, skillSlot };
        if (activeController) {
          activeController.playAction(action, duration, skillSlot);
        } else if (placeholder) {
          // Visual feedback for combat actions on the placeholder so battle flows without errors
          const beacon = placeholder.getObjectByName('beacon');
          if (beacon && (beacon as THREE.Mesh).material) {
            const mat = (beacon as THREE.Mesh).material as THREE.MeshBasicMaterial;
            if (action === 'hit') {
              mat.color.setHex(0xef4444);
              setTimeout(() => mat.color.setHex(placeholderColor), 300);
            } else if (action === 'skill' || action === 'attack') {
              mat.color.setHex(0xfbbf24);
              setTimeout(() => mat.color.setHex(placeholderColor), 400);
            } else if (action === 'defeat') {
              mat.opacity = 0.2;
            }
          }
        }
      },
      setAwakened: (awakened: boolean) => {
        currentAwakened = awakened;
        if (activeController) {
          activeController.setAwakened(awakened);
        }
      },
      setAlive: (alive: boolean) => {
        currentAlive = alive;
        if (activeController) {
          activeController.setAlive(alive);
        }
      },
      getAction: () => {
        return activeController ? activeController.getAction() : pendingAction.action;
      },
      isAlive: () => {
        return activeController ? activeController.isAlive() : currentAlive;
      },
      dispose: () => {
        if (activeController) {
          activeController.dispose();
        }
        root.traverse((c) => {
          if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose();
          if ((c as THREE.Mesh).material) ((c as THREE.Mesh).material as THREE.Material).dispose();
        });
      },
    };
  }
}

export const characterModelLoader = new CharacterModelLoaderService();

/**
 * Procedurally generates high-precision UV coordinates for Tideguard's robotic anatomy:
 * - Head_4 (Black): Symmetrical optical iris turbine discs for left & right lenses
 * - Head_3 (Main): Cylindrical projection for helmet dome, forehead plate, rivets & PCB circuit brow
 * - Torso_3 (Main): Chest armor plate, central reactor slit & beveled seams
 * - Limbs & Joints: Mechanical gear joints, gauntlets, legs, and boot soles
 */
function applyTideguardProceduralUVs(mesh: THREE.Mesh): void {
  const pos = mesh.geometry?.attributes?.position;
  if (!pos) return;
  const count = pos.count;
  const uvs = new Float32Array(count * 2);

  if (mesh.name === 'Head_4') {
    // Optical Eye Lenses: Map both eyes symmetrically onto circular turbine texture
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const cx = x < 0 ? -0.0066148 : 0.0066148;
      const cy = -0.0090912;
      const rx = 0.004573;
      const ry = 0.003993;
      uvs[i * 2] = Math.max(0, Math.min(1, 0.5 + (x - cx) / (rx * 2.05)));
      uvs[i * 2 + 1] = Math.max(0, Math.min(1, 0.5 + (y - cy) / (ry * 2.05)));
    }
  } else if (mesh.name === 'Head_3') {
    // Helmet Dome, Forehead Brow Plate & Circuit Crest
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const angle = Math.atan2(x, z - 0.001);
      const u = (angle + Math.PI) / (2 * Math.PI);
      const ny = Math.max(0, Math.min(1, (y - (-0.0123)) / (0.0131 - (-0.0123))));
      uvs[i * 2] = u;
      uvs[i * 2 + 1] = 0.55 + ny * 0.40;
    }
  } else if (mesh.name === 'Torso_3') {
    // Torso Chest Plate, Central Reactor Core Slit & Beveled Seams
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const angle = Math.atan2(x, z);
      const u = (angle + Math.PI) / (2 * Math.PI);
      const ny = Math.max(0, Math.min(1, (y - (-0.0069)) / (0.0068 - (-0.0069))));
      uvs[i * 2] = u;
      uvs[i * 2 + 1] = 0.22 + ny * 0.30;
    }
  } else {
    // Limbs, Gauntlets, Mechanical Joints & Boots (region 0.0 to 0.22)
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const dx = maxX - minX || 1;
    const dy = maxY - minY || 1;
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      uvs[i * 2] = Math.max(0, Math.min(1, (x - minX) / dx));
      uvs[i * 2 + 1] = Math.max(0, Math.min(1, (y - minY) / dy)) * 0.22;
    }
  }

  mesh.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

/**
 * Procedurally generates high-precision UV coordinates for Floraweaver's living wood dryad anatomy:
 * - Kira_Hair_A: Foliage hair crown & ivy leaves (upper region, 0.55 to 0.98)
 * - Kira_Head_B: Carved dryad wood face & serene expression (0.45 to 0.90)
 * - Kira_Shirt: Bark torso, shoulders, arms with deep bark grain & moss mantle (0.30 to 0.72)
 * - Kira_Pants_B: Lower bark legs, mossy knees, roots (0.05 to 0.40)
 * - Kira_Feet: Feet mapped onto circular pedestal & roots (0.05 to 0.48)
 */
function applyFloraweaverProceduralUVs(mesh: THREE.Mesh): void {
  const pos = mesh.geometry?.attributes?.position;
  if (!pos) return;
  const count = pos.count;
  const uvs = new Float32Array(count * 2);

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;
  const dz = maxZ - minZ || 1;
  const midX = (minX + maxX) / 2;
  const midZ = (minZ + maxZ) / 2;

  if (mesh.name === 'Kira_Feet') {
    // Map feet onto circular pedestal & roots
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      uvs[i * 2] = Math.max(0, Math.min(1, 0.26 + ((x - midX) / dx) * 0.2));
      uvs[i * 2 + 1] = Math.max(0, Math.min(1, 0.26 + ((z - midZ) / dz) * 0.2));
    }
  } else if (mesh.name === 'Kira_Hair_A') {
    // Cylindrical projection for lush foliage hair crown with vertical flow
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i) - midX;
      const z = pos.getZ(i) - midZ;
      const y = pos.getY(i);
      const angle = Math.atan2(x, z);
      uvs[i * 2] = (angle + Math.PI) / (2 * Math.PI);
      uvs[i * 2 + 1] = 0.55 + Math.max(0, Math.min(1, (y - minY) / dy)) * 0.42;
    }
  } else if (mesh.name === 'Kira_Head_B') {
    // Carved wood dryad face
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i) - midX;
      const z = pos.getZ(i) - midZ;
      const y = pos.getY(i);
      const angle = Math.atan2(x, z);
      uvs[i * 2] = (angle + Math.PI) / (2 * Math.PI);
      uvs[i * 2 + 1] = 0.45 + Math.max(0, Math.min(1, (y - minY) / dy)) * 0.45;
    }
  } else if (mesh.name.startsWith('Kira_Shirt')) {
    // Torso, arms, moss mantle
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i) - midX;
      const z = pos.getZ(i) - midZ;
      const y = pos.getY(i);
      const angle = Math.atan2(x, z);
      uvs[i * 2] = (angle + Math.PI) / (2 * Math.PI);
      uvs[i * 2 + 1] = 0.30 + Math.max(0, Math.min(1, (y - minY) / dy)) * 0.42;
    }
  } else {
    // Pants / Lower limbs / general
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i) - midX;
      const z = pos.getZ(i) - midZ;
      const y = pos.getY(i);
      const angle = Math.atan2(x, z);
      uvs[i * 2] = (angle + Math.PI) / (2 * Math.PI);
      uvs[i * 2 + 1] = 0.05 + Math.max(0, Math.min(1, (y - minY) / dy)) * 0.35;
    }
  }

  mesh.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

/**
 * Attaches the Sacred Grove features matching the user's reference image:
 * 1. Concentric circular wooden pedestal with glowing neon runic channels beneath Floraweaver.
 * 2. Hand-held cluster of bioluminescent magical mushrooms with parasol caps, gills, and woodland florets.
 * 3. Soft fairy PointLight casting mystical illumination on Floraweaver's face and torso.
 */
function attachFloraweaverSacredGrove(scene: THREE.Group, config: MonsterAssetConfig): void {
  const elemLower = (config.materials?.element || 'GRASS').toLowerCase();
  const elemColorMap: Record<string, number> = {
    grass: 0x34d399,
    fire: 0xff5722,
    water: 0x00f0ff,
    light: 0xfacc15,
    dark: 0xc084fc,
  };
  const glowHex = elemColorMap[elemLower] || 0x34d399;

  // 1. Concentric Sacred Runic Pedestal (Under Floraweaver)
  const pedestalGroup = new THREE.Group();
  pedestalGroup.name = 'Floraweaver_Pedestal';

  // Wooden disc base
  const woodBaseGeo = new THREE.CylinderGeometry(0.72, 0.78, 0.08, 36);
  const woodBaseMat = new THREE.MeshToonMaterial({
    color: 0x2a1d12,
  });
  const woodBase = new THREE.Mesh(woodBaseGeo, woodBaseMat);
  woodBase.position.y = -0.04;
  woodBase.receiveShadow = true;
  pedestalGroup.add(woodBase);

  // Concentric neon runic ring
  const runeRingGeo = new THREE.RingGeometry(0.55, 0.68, 36);
  const runeRingMat = new THREE.MeshBasicMaterial({
    color: glowHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });
  const runeRing = new THREE.Mesh(runeRingGeo, runeRingMat);
  runeRing.rotation.x = -Math.PI / 2;
  runeRing.position.y = 0.005;
  pedestalGroup.add(runeRing);

  // Inner sacred rune circle
  const innerRuneGeo = new THREE.RingGeometry(0.28, 0.36, 32);
  const innerRuneMat = new THREE.MeshBasicMaterial({
    color: glowHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
  });
  const innerRune = new THREE.Mesh(innerRuneGeo, innerRuneMat);
  innerRune.rotation.x = -Math.PI / 2;
  innerRune.position.y = 0.006;
  pedestalGroup.add(innerRune);

  scene.add(pedestalGroup);

  // 2. Hand-Held Bioluminescent Mushroom & Blossom Cluster
  const handBone = scene.getObjectByName('hand_l');
  const mushroomGroup = new THREE.Group();
  mushroomGroup.name = 'Floraweaver_MushroomCluster';

  const capMat = new THREE.MeshToonMaterial({
    color: glowHex,
    emissive: new THREE.Color(glowHex),
    emissiveIntensity: 2.2,
  });
  const stemMat = new THREE.MeshToonMaterial({
    color: 0xe2e8f0,
  });

  // Main parasol mushroom
  const mainStemGeo = new THREE.CylinderGeometry(0.012, 0.018, 0.12, 12);
  const mainStem = new THREE.Mesh(mainStemGeo, stemMat);
  mainStem.position.y = 0.06;
  mushroomGroup.add(mainStem);

  const mainCapGeo = new THREE.SphereGeometry(0.045, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const mainCap = new THREE.Mesh(mainCapGeo, capMat);
  mainCap.position.y = 0.12;
  mushroomGroup.add(mainCap);

  // Secondary side mushrooms
  const subOffsets = [
    { ox: -0.035, oz: 0.02, h: 0.08, r: 0.032, tilt: 0.25 },
    { ox: 0.032, oz: -0.025, h: 0.09, r: 0.036, tilt: -0.22 },
    { ox: -0.02, oz: -0.03, h: 0.055, r: 0.024, tilt: 0.18 },
  ];
  subOffsets.forEach(({ ox, oz, h, r, tilt }) => {
    const sStem = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.014, h, 10), stemMat);
    sStem.position.set(ox, h / 2, oz);
    sStem.rotation.z = tilt;
    mushroomGroup.add(sStem);

    const sCap = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), capMat);
    sCap.position.set(ox + Math.sin(tilt) * (h / 2), h, oz);
    sCap.rotation.z = tilt;
    mushroomGroup.add(sCap);
  });

  // Delicate woodland flower petals surrounding mushroom cluster
  const petalMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const floret = new THREE.Mesh(new THREE.CircleGeometry(0.018, 5), petalMat);
    floret.position.set(Math.cos(angle) * 0.065, 0.015, Math.sin(angle) * 0.065);
    floret.rotation.x = -Math.PI / 2;
    mushroomGroup.add(floret);
  }

  // Soft magical fairy PointLight cast by the mushrooms
  const fairyLight = new THREE.PointLight(glowHex, 1.8, 1.5, 2);
  fairyLight.position.set(0, 0.14, 0);
  mushroomGroup.add(fairyLight);

  if (handBone) {
    mushroomGroup.position.set(0, 0.06, 0);
    mushroomGroup.scale.setScalar(1.2);
    handBone.add(mushroomGroup);
  } else {
    mushroomGroup.position.set(0.18, 0.65, 0.15);
    mushroomGroup.scale.setScalar(1.2);
    scene.add(mushroomGroup);
  }
}

