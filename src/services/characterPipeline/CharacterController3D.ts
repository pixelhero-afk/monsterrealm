/**
 * Character Controller 3D
 * Production skeletal animation controller, state machine, and VFX coordinator for Monster Realms characters.
 */

import * as THREE from 'three';
import { Creature3DInstance, CreatureAction, MonsterAssetConfig } from './types';

export class CharacterController3D implements Creature3DInstance {
  public root: THREE.Group;
  private modelRoot: THREE.Group;
  private mixer: THREE.AnimationMixer | null = null;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private currentActionName: CreatureAction = 'idle';
  private currentClipAction: THREE.AnimationAction | null = null;
  private isCharacterAlive = true;
  private isAwakened = false;

  private config: MonsterAssetConfig;
  private baseScale: number;
  private currentScaleMultiplier = 1.0;
  private targetScaleMultiplier = 1.0;

  // Materials list for hits, fades, and emissive pulsing
  private managedMaterials: THREE.MeshToonMaterial[] = [];

  // Procedural offsets for combat impact & lunges
  private lungeOffset = new THREE.Vector3();
  private targetLunge = new THREE.Vector3();
  private flinchOffset = new THREE.Vector3();

  // Attached VFX
  private vfxGroup = new THREE.Group();
  private extraTurnRing: THREE.Mesh | null = null;
  private voidWisps: THREE.Points | null = null;
  private shadowFloorDecal: THREE.Mesh | null = null;

  // Animation restore timer
  private actionTimer = 0;
  private actionDuration = 0;
  private totalElapsed = 0;

  constructor(
    clonedScene: THREE.Group,
    animations: THREE.AnimationClip[],
    config: MonsterAssetConfig,
    isInitiallyAwakened = false,
    isInitiallyAlive = true
  ) {
    this.config = config;
    this.baseScale = config.scale;
    this.isAwakened = isInitiallyAwakened;
    this.isCharacterAlive = isInitiallyAlive;

    this.root = new THREE.Group();
    this.modelRoot = clonedScene;

    // Apply asset offsets and base scale
    this.targetScaleMultiplier = isInitiallyAwakened && config.awakenedConfig
      ? config.awakenedConfig.scaleMultiplier
      : 1.0;
    this.currentScaleMultiplier = this.targetScaleMultiplier;

    const appliedScale = this.baseScale * this.currentScaleMultiplier;
    this.modelRoot.scale.set(appliedScale, appliedScale, appliedScale);
    this.modelRoot.position.set(0, config.heightOffset, 0);
    this.modelRoot.rotation.y = config.rotationYOffset;

    this.root.add(this.modelRoot);
    this.root.add(this.vfxGroup);

    // Collect materials and ensure shadow properties
    this.modelRoot.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => {
            if ((mat as any).isMeshToonMaterial) {
              this.managedMaterials.push(mat as THREE.MeshToonMaterial);
            }
          });
        } else if ((mesh.material as any).isMeshToonMaterial) {
          this.managedMaterials.push(mesh.material as THREE.MeshToonMaterial);
        }
      }
    });

    // Setup Animation Mixer and Clips
    if (animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.modelRoot);
      for (const clip of animations) {
        const action = this.mixer.clipAction(clip);
        this.actions.set(clip.name.toLowerCase(), action);
      }
    }

    // Initialize VFX
    this.setupCharacterVFX();

    // Initial state
    if (!this.isCharacterAlive) {
      this.setAlive(false);
    } else {
      this.playAction('idle');
    }
  }

  /**
   * Initializes stylized character VFX (void mist, shadow decal, extra-turn aura)
   */
  private setupCharacterVFX(): void {
    // 1. Soft Dynamic Contact Shadow Decal on Ground
    const shadowGeo = new THREE.PlaneGeometry(1.4, 1.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x070913,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.shadowFloorDecal = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowFloorDecal.rotation.x = -Math.PI / 2;
    this.shadowFloorDecal.position.y = 0.02;
    this.vfxGroup.add(this.shadowFloorDecal);

    // 2. Extra Turn Celestial Void Ring (Activated during extra-turn events)
    const ringGeo = new THREE.TorusGeometry(0.85, 0.04, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.extraTurnRing = new THREE.Mesh(ringGeo, ringMat);
    this.extraTurnRing.rotation.x = Math.PI / 2;
    this.extraTurnRing.position.y = 0.25;
    this.vfxGroup.add(this.extraTurnRing);

    // 3. Ethereal Shadow/Element Wisps for Shadowstalker
    if (this.config.familyId === 'fam_shadowstalker') {
      const particleCount = 24;
      const particleGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * 0.9;
        positions[i * 3 + 1] = Math.random() * 0.8;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.9;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        size: 0.12,
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      });
      this.voidWisps = new THREE.Points(particleGeo, particleMat);
      this.vfxGroup.add(this.voidWisps);
    }
  }

  /**
   * Finds an animation action by target name or alias, with smart fallbacks
   */
  private findAction(targetName: string): THREE.AnimationAction | null {
    if (!this.mixer || this.actions.size === 0) return null;
    const lower = targetName.toLowerCase();

    // 1. Direct match
    if (this.actions.has(lower)) {
      return this.actions.get(lower)!;
    }

    // 2. Partial search in clip names
    for (const [name, action] of this.actions.entries()) {
      if (name.includes(lower)) {
        return action;
      }
    }

    // 3. Synonym / alias matching
    const aliasMap: Record<string, string[]> = {
      attack: ['attack', 'slash', 'punch', 'strike', 'shot', 'action', 'skill'],
      skill: ['skill', 'magic', 'special', 'attack', 'burst', 'ultimate'],
      hit: ['hit', 'damage', 'hurt', 'impact', 'flinch'],
      defeat: ['defeat', 'death', 'die', 'down', 'dead', 'fall'],
      victory: ['victory', 'win', 'cheer', 'dance', 'pose', 'joy'],
      walk: ['walk', 'run', 'move', 'jog'],
      idle: ['idle', 'stand', 'rest', 'wait', 'loop', 'pose', 'tpose'],
    };

    const synonyms = aliasMap[lower] || [];
    for (const syn of synonyms) {
      for (const [name, action] of this.actions.entries()) {
        if (name.includes(syn)) {
          return action;
        }
      }
    }

    // 4. Fallback to idle action if searching for a combat clip
    if (lower !== 'idle') {
      const idleAction = this.findAction(this.config.animations.idle || 'idle');
      if (idleAction) return idleAction;
    }

    // 5. Ultimate fallback: First available clip in the character asset
    const firstAction = this.actions.values().next().value;
    return firstAction || null;
  }

  /**
   * Triggers a combat animation state (Idle, Attack, Skill, Hit, Defeat, Victory)
   */
  public playAction(
    action: CreatureAction,
    duration = 1.0,
    skillNameOrSlot?: string | number
  ): void {
    if (!this.isCharacterAlive && action !== 'defeat') return;

    this.currentActionName = action;
    this.actionTimer = 0;
    this.actionDuration = duration;

    // Resolve animation clip name from configuration
    let clipName = this.config.animations.idle;
    let isLooping = false;

    switch (action) {
      case 'idle':
        clipName = this.config.animations.idle;
        isLooping = true;
        this.targetLunge.set(0, 0, 0);
        this.flinchOffset.set(0, 0, 0);
        break;

      case 'attack':
        clipName = this.config.animations.attack;
        isLooping = false;
        // Agile pounce lunge forward in local coordinates
        this.targetLunge.set(0, 0.15, -1.1);
        break;

      case 'skill':
        if (skillNameOrSlot === 3 && this.config.animations.skill3) {
          clipName = this.config.animations.skill3;
        } else if (skillNameOrSlot === 2 && this.config.animations.skill2) {
          clipName = this.config.animations.skill2;
        } else {
          clipName = this.config.animations.skill || this.config.animations.attack;
        }
        isLooping = false;
        this.targetLunge.set(0, 0.35, -0.6);

        // Extra Turn / Shadow Shroud visual flare
        if (this.extraTurnRing) {
          (this.extraTurnRing.material as THREE.MeshBasicMaterial).opacity = 0.95;
        }
        break;

      case 'hit':
        clipName = this.config.animations.hit || this.config.animations.idle;
        isLooping = false;
        // Recoil back
        this.flinchOffset.set((Math.random() - 0.5) * 0.15, 0.05, 0.4);
        this.flashHitReaction();
        break;

      case 'defeat':
        clipName = this.config.animations.defeat || this.config.animations.idle;
        isLooping = false;
        this.isCharacterAlive = false;
        this.targetLunge.set(0, -0.3, 0.2);
        break;

      case 'victory':
        clipName = this.config.animations.victory || this.config.animations.idle;
        isLooping = true;
        this.targetLunge.set(0, 0, 0);
        break;
    }

    const nextAction = this.findAction(clipName);
    if (nextAction && nextAction !== this.currentClipAction) {
      if (this.currentClipAction) {
        this.currentClipAction.fadeOut(0.18);
      }
      nextAction.reset();
      nextAction.setEffectiveTimeScale(action === 'idle' ? 1.0 : (1.0 / Math.max(0.4, duration * 0.8)));
      nextAction.setEffectiveWeight(1.0);
      if (!isLooping) {
        nextAction.setLoop(THREE.LoopOnce, 1);
        nextAction.clampWhenFinished = true;
      } else {
        nextAction.setLoop(THREE.LoopRepeat, Infinity);
      }
      nextAction.fadeIn(0.18);
      nextAction.play();
      this.currentClipAction = nextAction;
    }
  }

  /**
   * Brief white/emissive flash upon taking damage
   */
  private flashHitReaction(): void {
    for (const mat of this.managedMaterials) {
      const originalEmissive = mat.emissiveIntensity;
      mat.emissiveIntensity = originalEmissive + 3.0;
      setTimeout(() => {
        mat.emissiveIntensity = originalEmissive;
      }, 140);
    }
  }

  public setAwakened(awakened: boolean): void {
    this.isAwakened = awakened;
    this.targetScaleMultiplier = awakened && this.config.awakenedConfig
      ? this.config.awakenedConfig.scaleMultiplier
      : 1.0;

    const emissiveBoost = awakened && this.config.awakenedConfig
      ? this.config.awakenedConfig.emissiveMultiplier
      : 1.0;

    for (const mat of this.managedMaterials) {
      mat.emissiveIntensity = this.config.materials.emissiveIntensity * emissiveBoost;
    }
  }

  public setAlive(alive: boolean): void {
    this.isCharacterAlive = alive;
    if (!alive) {
      this.playAction('defeat', 1.5);
    } else {
      this.modelRoot.position.y = this.config.heightOffset;
      this.playAction('idle');
    }
  }

  public getAction(): CreatureAction {
    return this.currentActionName;
  }

  public isAlive(): boolean {
    return this.isCharacterAlive;
  }

  public getSocketPosition(socketName: 'head' | 'chest' | 'root' | 'weapon'): THREE.Vector3 {
    const worldPos = new THREE.Vector3();
    this.root.getWorldPosition(worldPos);

    switch (socketName) {
      case 'head':
        worldPos.y += 0.85 * this.currentScaleMultiplier;
        break;
      case 'chest':
        worldPos.y += 0.5 * this.currentScaleMultiplier;
        break;
      case 'weapon':
        worldPos.y += 0.45 * this.currentScaleMultiplier;
        worldPos.z -= 0.3;
        break;
    }
    return worldPos;
  }

  /**
   * Main per-frame update loop
   */
  public update(delta: number): void {
    // 1. Advance Skeletal Animation Mixer
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // 2. Smooth Scale Interpolation (Awakening morph)
    if (Math.abs(this.currentScaleMultiplier - this.targetScaleMultiplier) > 0.001) {
      this.currentScaleMultiplier += (this.targetScaleMultiplier - this.currentScaleMultiplier) * Math.min(1.0, delta * 5.0);
      const appliedScale = this.baseScale * this.currentScaleMultiplier;
      this.modelRoot.scale.set(appliedScale, appliedScale, appliedScale);
    }

    // 3. Combat Action Timing & Transition Back to Idle
    if (this.currentActionName !== 'idle' && this.currentActionName !== 'defeat' && this.currentActionName !== 'victory') {
      this.actionTimer += delta;
      if (this.actionTimer >= this.actionDuration) {
        this.playAction('idle');
      }
    }

    // 4. Smooth Procedural Lunge & Flinch Springs
    this.lungeOffset.lerp(this.targetLunge, Math.min(1.0, delta * 8.0));
    this.flinchOffset.lerp(new THREE.Vector3(0, 0, 0), Math.min(1.0, delta * 6.0));

    // When lunging forward for attack, return to origin after peak
    if (this.currentActionName === 'attack' && this.actionTimer > this.actionDuration * 0.45) {
      this.targetLunge.set(0, 0, 0);
    }

    this.modelRoot.position.set(
      this.flinchOffset.x,
      this.config.heightOffset + this.lungeOffset.y + this.flinchOffset.y,
      this.lungeOffset.z + this.flinchOffset.z
    );

    // 5. Update Extra Turn Ring & Void Particles
    if (this.extraTurnRing) {
      const ringMat = this.extraTurnRing.material as THREE.MeshBasicMaterial;
      if (ringMat.opacity > 0.01) {
        ringMat.opacity -= delta * 0.75;
        this.extraTurnRing.rotation.z += delta * 4.0;
        this.extraTurnRing.position.y = 0.25 + Math.sin(Date.now() * 0.005) * 0.05;
      }
    }

    if (this.voidWisps) {
      const positions = this.voidWisps.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += delta * 0.35;
        if (positions[i] > 1.2) {
          positions[i] = 0.05;
        }
      }
      this.voidWisps.geometry.attributes.position.needsUpdate = true;
    }

    // 6. Handle Defeat Dissolve
    if (!this.isCharacterAlive) {
      for (const mat of this.managedMaterials) {
        if (mat.opacity > 0.05) {
          mat.opacity = Math.max(0, mat.opacity - delta * 0.5);
          mat.transparent = true;
        }
      }
      if (this.shadowFloorDecal) {
        (this.shadowFloorDecal.material as THREE.MeshBasicMaterial).opacity = Math.max(
          0,
          (this.shadowFloorDecal.material as THREE.MeshBasicMaterial).opacity - delta * 0.5
        );
      }
    }

    this.totalElapsed += delta;
  }

  public dispose(): void {
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    this.actions.clear();

    this.root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });

    if (this.extraTurnRing) {
      this.extraTurnRing.geometry.dispose();
      (this.extraTurnRing.material as THREE.Material).dispose();
    }
    if (this.voidWisps) {
      this.voidWisps.geometry.dispose();
      (this.voidWisps.material as THREE.Material).dispose();
    }
    if (this.shadowFloorDecal) {
      this.shadowFloorDecal.geometry.dispose();
      (this.shadowFloorDecal.material as THREE.Material).dispose();
    }
  }
}
