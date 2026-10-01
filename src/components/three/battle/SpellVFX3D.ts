/**
 * 3D Spell & Combat Special Graphics Engine for Battle
 * Produces real 3D special graphics for every monster and each of their attacks:
 * - Pyrosaur: shoots real streaming fire streams, fiery combustion explosions, raining volcanic magma boulders, and apocalyptic hellfire meteors!
 * - Tideguard: surging tidal wave crests with razor coral spikes, spinning protective hydro barrier domes, and deep-sea abyssal geysers!
 * - Floraweaver: rapid emerald briar darts, sacred blooming lotus healing mandalas, and Ancient World Tree emerald shockwaves!
 * - Luminary: concentrated piercing celestial laser beams, golden dawn sunlight pillars with astrolabes, and orbital celestial supernovas!
 * - Shadowstalker: dual void shadow crescent blades with phantom lunges, swirling nether stealth vortexes, and eclipse singularity executions!
 * Plus universal elemental fallbacks so all combatants display high-fidelity 3D effects.
 */

import * as THREE from 'three';
import { ElementType } from '../../../types';

export interface SpellLaunchOptions {
  familyId?: string; // 'fam_pyrosaur' | 'fam_tideguard' | 'fam_floraweaver' | 'fam_luminary' | 'fam_shadowstalker'
  skillName?: string;
  slot?: 1 | 2 | 3;
  element: ElementType;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  allTargets?: THREE.Vector3[];
  isAoe?: boolean;
  isSelfOrAllyBuff?: boolean;
  duration?: number;
  onImpact?: () => void;
}

interface ActiveVFX {
  id: string;
  rootGroup: THREE.Group;
  progress: number;
  duration: number;
  hasImpacted: boolean;
  onImpact?: () => void;
  update: (delta: number, progress: number) => void;
  dispose: () => void;
}

export function createSpellManager(scene: THREE.Scene) {
  const activeVFXList: ActiveVFX[] = [];

  // Helper to safely dispose a Three.js hierarchy
  const disposeHierarchy = (obj: THREE.Object3D) => {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else if (m.material) {
          m.material.dispose();
        }
      }
      if ((child as THREE.Light).isLight) {
        const light = child as THREE.Light;
        light.dispose?.();
      }
    });
  };

  /**
   * Main entry point to launch special combat graphics
   */
  const launchSpell = (
    optionsOrElement: SpellLaunchOptions | ElementType,
    legacyStartPos?: THREE.Vector3,
    legacyTargetPos?: THREE.Vector3,
    legacyIsAoe?: boolean,
    legacyDuration?: number,
    legacyOnImpact?: () => void
  ) => {
    let options: SpellLaunchOptions;
    if (typeof optionsOrElement === 'string') {
      options = {
        element: optionsOrElement,
        startPos: legacyStartPos || new THREE.Vector3(0, 1, 0),
        targetPos: legacyTargetPos || new THREE.Vector3(0, 1, 0),
        isAoe: legacyIsAoe,
        duration: legacyDuration || 0.65,
        onImpact: legacyOnImpact,
      };
    } else {
      options = optionsOrElement;
    }

    const family = (options.familyId || '').toLowerCase();
    const skill = (options.skillName || '').toLowerCase();
    const element = options.element;

    // Route to monster-specific combat graphics with element fallback to signature sets
    if (element === 'WATER') {
      launchTideguardGraphics(options);
    } else if (element === 'FIRE') {
      launchPyrosaurGraphics(options);
    } else if (element === 'GRASS') {
      launchFloraweaverGraphics(options);
    } else if (element === 'LIGHT') {
      launchLuminaryGraphics(options);
    } else if (element === 'DARK') {
      launchShadowstalkerGraphics(options);
    } else if (
      family.includes('tideguard') ||
      skill.includes('coral') ||
      skill.includes('tidal') ||
      skill.includes('abyssal') ||
      skill.includes('frost') ||
      skill.includes('glacial')
    ) {
      launchTideguardGraphics(options);
    } else if (
      family.includes('floraweaver') ||
      skill.includes('briar') ||
      skill.includes('blossom') ||
      skill.includes('sylvan') ||
      skill.includes('bramble') ||
      skill.includes('thorn')
    ) {
      launchFloraweaverGraphics(options);
    } else if (
      family.includes('luminary') ||
      skill.includes('radiant') ||
      skill.includes('dawn') ||
      skill.includes('supernova') ||
      skill.includes('solar')
    ) {
      launchLuminaryGraphics(options);
    } else if (
      family.includes('shadowstalker') ||
      skill.includes('umbral') ||
      skill.includes('shroud') ||
      skill.includes('eclipse') ||
      skill.includes('void') ||
      skill.includes('dusk')
    ) {
      launchShadowstalkerGraphics(options);
    } else if (
      family.includes('pyrosaur') ||
      skill.includes('flame') ||
      skill.includes('volcanic') ||
      skill.includes('infernal')
    ) {
      launchPyrosaurGraphics(options);
    } else {
      launchElementalFallbackGraphics(options);
    }
  };

  // =========================================================================
  // 1. PYROSAUR: FIERY FLAME GRAPHICS ("Pyrosaur Shoots Fire")
  // =========================================================================
  const launchPyrosaurGraphics = (opts: SpellLaunchOptions) => {
    const root = new THREE.Group();
    scene.add(root);

    const slot = opts.slot || 1;
    const duration = opts.duration || (slot === 3 ? 1.25 : slot === 2 ? 0.95 : 0.65);
    const forwardDir = opts.targetPos.clone().sub(opts.startPos).normalize();
    const startMouth = opts.startPos.clone().add(new THREE.Vector3(0, 1.45, 0)).addScaledVector(forwardDir, 0.6);
    const targetChest = opts.targetPos.clone().add(new THREE.Vector3(0, 1.1, 0));

    // Warm dynamic point light illuminating the scene
    const flameLight = new THREE.PointLight(0xff5500, 3.5, 14);
    flameLight.position.copy(startMouth);
    root.add(flameLight);

    if (slot === 1) {
      // ---------------------------------------------------------------------
      // SKILL 1: "FLAME CLAW" -> PYROSAUR SHOOTS A STREAM OF FIRE & FIREBALLS
      // ---------------------------------------------------------------------
      // 1. Muzzle flame blast cone at Pyrosaur's mouth
      const muzzleGeo = new THREE.ConeGeometry(0.35, 0.9, 8);
      const muzzleMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.9,
      });
      const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
      muzzle.position.copy(startMouth);
      const dir = targetChest.clone().sub(startMouth).normalize();
      muzzle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      root.add(muzzle);

      // 2. Main flying fire stream: 3 rapid rotating flaming fireballs with fiery spines
      const fireProjectiles: {
        mesh: THREE.Group;
        offsetRatio: number;
        embers: THREE.Mesh[];
      }[] = [];

      for (let i = 0; i < 3; i++) {
        const fireProj = new THREE.Group();

        // Glowing core
        const coreGeo = new THREE.SphereGeometry(0.28, 8, 8);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        fireProj.add(core);

        // Flaming outer envelope
        const flameGeo = new THREE.DodecahedronGeometry(0.42, 0);
        const flameMat = new THREE.MeshBasicMaterial({
          color: 0xff3b00,
          wireframe: true,
          transparent: true,
          opacity: 0.85,
        });
        const flameEnvelope = new THREE.Mesh(flameGeo, flameMat);
        fireProj.add(flameEnvelope);

        // Trailing burning embers
        const embers: THREE.Mesh[] = [];
        for (let j = 0; j < 5; j++) {
          const emberGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.05, 4, 4);
          const emberMat = new THREE.MeshBasicMaterial({
            color: j % 2 === 0 ? 0xff6600 : 0xffcc00,
            transparent: true,
            opacity: 0.9,
          });
          const ember = new THREE.Mesh(emberGeo, emberMat);
          ember.position.set((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, -(j + 1) * 0.25);
          fireProj.add(ember);
          embers.push(ember);
        }

        root.add(fireProj);
        fireProjectiles.push({
          mesh: fireProj,
          offsetRatio: i * 0.12,
          embers,
        });
      }

      // 3. Impact detonation explosion group (ignites on contact)
      const impactGroup = new THREE.Group();
      impactGroup.position.copy(targetChest);
      impactGroup.visible = false;
      root.add(impactGroup);

      // Expanding combustion fireball
      const boomSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.95 })
      );
      impactGroup.add(boomSphere);

      // Fiery ground scorch ring
      const scorchRing = new THREE.Mesh(
        new THREE.RingGeometry(0.2, 0.9, 16),
        new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
      );
      scorchRing.rotation.x = Math.PI / 2;
      scorchRing.position.y = -targetChest.y + 0.08;
      impactGroup.add(scorchRing);

      // Flying explosion fire sparks
      const sparks: { mesh: THREE.Mesh; vel: THREE.Vector3 }[] = [];
      for (let s = 0; s < 12; s++) {
        const spark = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 4, 4),
          new THREE.MeshBasicMaterial({ color: s % 3 === 0 ? 0xffffff : 0xff7700 })
        );
        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * 4.5,
          Math.random() * 3.5 + 0.5,
          (Math.random() - 0.5) * 4.5
        );
        impactGroup.add(spark);
        sparks.push({ mesh: spark, vel });
      }

      activeVFXList.push({
        id: Math.random().toString(36),
        rootGroup: root,
        progress: 0,
        duration,
        hasImpacted: false,
        onImpact: opts.onImpact,
        update: (delta, t) => {
          // Fade muzzle flame rapidly
          if (t < 0.3) {
            muzzle.scale.setScalar(1 + t * 4);
            muzzleMat.opacity = 0.9 * (1 - t / 0.3);
          } else {
            muzzle.visible = false;
          }

          // Move fireballs along the trajectory with arc and rapid spin
          fireProjectiles.forEach((proj, idx) => {
            const adjustedT = Math.max(0, Math.min(1, (t - proj.offsetRatio) / (0.65 - proj.offsetRatio)));
            if (adjustedT <= 0) {
              proj.mesh.visible = false;
              return;
            }
            proj.mesh.visible = adjustedT < 0.98;

            const arc = Math.sin(adjustedT * Math.PI) * 0.6;
            proj.mesh.position.lerpVectors(startMouth, targetChest, adjustedT);
            proj.mesh.position.y += arc;

            // Continuous flaming rotation
            proj.mesh.rotation.x += delta * 12;
            proj.mesh.rotation.y += delta * 15;
            proj.mesh.rotation.z += delta * 10;

            // Jitter embers
            proj.embers.forEach((ember, ej) => {
              ember.position.x += (Math.random() - 0.5) * 0.05;
              ember.position.y += (Math.random() - 0.5) * 0.05;
              ember.scale.setScalar(Math.max(0.2, 1 - adjustedT * 0.8));
            });
          });

          // Move flame light with the lead projectile
          if (t < 0.6) {
            flameLight.position.lerpVectors(startMouth, targetChest, t / 0.6);
            flameLight.intensity = 3.5 + Math.sin(t * 30) * 1.5;
          } else {
            flameLight.position.copy(targetChest);
            flameLight.intensity = Math.max(0, 5.0 * (1 - (t - 0.6) / 0.4));
          }

          // On impact (around t = 0.6)
          if (t >= 0.58) {
            impactGroup.visible = true;
            const expT = (t - 0.58) / 0.42;

            // Expanding and fading combustion fireball
            boomSphere.scale.setScalar(0.4 + expT * 2.8);
            (boomSphere.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - expT * 1.3);

            // Scorch ring expansion
            scorchRing.scale.setScalar(1 + expT * 1.6);
            (scorchRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 * (1 - expT));

            // Spray sparks
            sparks.forEach((s) => {
              s.mesh.position.addScaledVector(s.vel, delta);
              s.vel.y -= delta * 6.5; // gravity
              s.mesh.scale.setScalar(Math.max(0, 1 - expT));
            });
          }
        },
        dispose: () => {
          scene.remove(root);
          disposeHierarchy(root);
        },
      });
    } else if (slot === 2) {
      // ---------------------------------------------------------------------
      // SKILL 2: "VOLCANIC BURST" -> ERUPTING MAGMA BOMBS & GROUND FIRE GEYSERS
      // ---------------------------------------------------------------------
      const targets = opts.allTargets && opts.allTargets.length > 0 ? opts.allTargets : [targetChest];

      // 4 Volcanic Magma Boulders launching in parabolic arcs
      const boulders: {
        mesh: THREE.Mesh;
        target: THREE.Vector3;
        trail: THREE.Mesh[];
      }[] = [];

      targets.slice(0, 5).forEach((tgt, idx) => {
        const bGeo = new THREE.DodecahedronGeometry(0.35 + idx * 0.04, 0);
        const bMat = new THREE.MeshStandardMaterial({
          color: 0x271306,
          emissive: 0xff3b00,
          emissiveIntensity: 1.8,
          roughness: 0.8,
        });
        const boulder = new THREE.Mesh(bGeo, bMat);
        boulder.position.copy(startMouth);
        root.add(boulder);

        // Trailing smoke/fire puffs
        const trail: THREE.Mesh[] = [];
        for (let j = 0; j < 4; j++) {
          const tMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 4, 4),
            new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.7 })
          );
          root.add(tMesh);
          trail.push(tMesh);
        }

        boulders.push({ mesh: boulder, target: tgt.clone().add(new THREE.Vector3(0, 0.2, 0)), trail });
      });

      // Erupting magma geysers under each target
      const geysers: {
        column: THREE.Mesh;
        fissure: THREE.Mesh;
        target: THREE.Vector3;
      }[] = [];

      targets.forEach((tgt) => {
        const fGeo = new THREE.RingGeometry(0.3, 1.2, 16);
        const fMat = new THREE.MeshBasicMaterial({
          color: 0xff3b00,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const fissure = new THREE.Mesh(fGeo, fMat);
        fissure.rotation.x = Math.PI / 2;
        fissure.position.set(tgt.x, 0.05, tgt.z);
        fissure.visible = false;
        root.add(fissure);

        // Vertical erupting magma pillar
        const colGeo = new THREE.CylinderGeometry(0.15, 0.65, 3.2, 8);
        const colMat = new THREE.MeshBasicMaterial({
          color: 0xffaa00,
          transparent: true,
          opacity: 0.85,
        });
        const column = new THREE.Mesh(colGeo, colMat);
        column.position.set(tgt.x, 1.6, tgt.z);
        column.visible = false;
        root.add(column);

        geysers.push({ column, fissure, target: tgt });
      });

      activeVFXList.push({
        id: Math.random().toString(36),
        rootGroup: root,
        progress: 0,
        duration,
        hasImpacted: false,
        onImpact: opts.onImpact,
        update: (delta, t) => {
          // Fly boulders in steep arcs
          if (t < 0.6) {
            const bT = t / 0.6;
            boulders.forEach((b, bIdx) => {
              const arc = Math.sin(bT * Math.PI) * (2.8 + bIdx * 0.4);
              b.mesh.position.lerpVectors(startMouth, b.target, bT);
              b.mesh.position.y += arc;
              b.mesh.rotation.x += delta * 8;
              b.mesh.rotation.y += delta * 10;

              // Position trail
              b.trail.forEach((tr, trIdx) => {
                tr.position.lerpVectors(b.mesh.position, startMouth, (trIdx + 1) * 0.08);
                (tr.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - trIdx * 0.2);
              });
            });
            flameLight.intensity = 4.0;
          } else {
            boulders.forEach((b) => {
              b.mesh.visible = false;
              b.trail.forEach((tr) => (tr.visible = false));
            });

            // Erupt geysers
            const gT = (t - 0.6) / 0.4;
            geysers.forEach((g) => {
              g.fissure.visible = true;
              g.column.visible = true;
              g.column.scale.set(1 + Math.sin(gT * Math.PI) * 0.4, Math.sin(gT * Math.PI) * 1.2, 1);
              (g.column.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1 - gT * 0.8));
              (g.fissure.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1 - gT));
            });

            flameLight.intensity = Math.max(0, 6.0 * (1 - gT));
          }
        },
        dispose: () => {
          scene.remove(root);
          disposeHierarchy(root);
        },
      });
    } else {
      // ---------------------------------------------------------------------
      // SKILL 3: "INFERNAL CATACLYSM" -> APOCALYPTIC GIANT METEOR & HELLFIRE BEAM
      // ---------------------------------------------------------------------
      // 1. Concentrated dragonfire breath beam from Pyrosaur mouth to sky/target
      const beamGeo = new THREE.CylinderGeometry(0.12, 0.35, 6.0, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xff3b00,
        transparent: true,
        opacity: 0.9,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.lerpVectors(startMouth, targetChest, 0.5);
      const bDir = targetChest.clone().sub(startMouth).normalize();
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bDir);
      root.add(beam);

      // 2. Colossal burning jagged meteor dropping from high sky
      const meteorStart = targetChest.clone().add(new THREE.Vector3(1.5, 12.0, -2.5));
      const meteorGeo = new THREE.DodecahedronGeometry(1.2, 1);
      const meteorMat = new THREE.MeshStandardMaterial({
        color: 0x1f1008,
        emissive: 0xff3b00,
        emissiveIntensity: 2.5,
        roughness: 0.6,
      });
      const meteor = new THREE.Mesh(meteorGeo, meteorMat);
      meteor.position.copy(meteorStart);
      root.add(meteor);

      // Outer plasma fire aura on the meteor
      const meteorAura = new THREE.Mesh(
        new THREE.SphereGeometry(1.4, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff8800, wireframe: true, transparent: true, opacity: 0.7 })
      );
      meteor.add(meteorAura);

      // Trailing fireball plume
      const plumes: THREE.Mesh[] = [];
      for (let p = 0; p < 6; p++) {
        const pl = new THREE.Mesh(
          new THREE.SphereGeometry(0.35 + p * 0.15, 6, 6),
          new THREE.MeshBasicMaterial({ color: p % 2 === 0 ? 0xff3300 : 0xff9900, transparent: true, opacity: 0.8 })
        );
        root.add(pl);
        plumes.push(pl);
      }

      // 3. Cataclysmic shockwaves and fireball on impact
      const shockwave = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 3.5, 32),
        new THREE.MeshBasicMaterial({ color: 0xffe066, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
      );
      shockwave.rotation.x = Math.PI / 2;
      shockwave.position.set(targetChest.x, 0.08, targetChest.z);
      shockwave.visible = false;
      root.add(shockwave);

      const fireDome = new THREE.Mesh(
        new THREE.SphereGeometry(2.0, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.9 })
      );
      fireDome.position.set(targetChest.x, 1.2, targetChest.z);
      fireDome.visible = false;
      root.add(fireDome);

      activeVFXList.push({
        id: Math.random().toString(36),
        rootGroup: root,
        progress: 0,
        duration,
        hasImpacted: false,
        onImpact: opts.onImpact,
        update: (delta, t) => {
          // Phase 1: Dragonfire beam charging & Meteor plummeting (t < 0.65)
          if (t < 0.65) {
            const mT = t / 0.65;
            meteor.position.lerpVectors(meteorStart, targetChest, mT * mT); // accelerate
            meteor.rotation.x += delta * 6;
            meteor.rotation.y += delta * 9;

            beam.scale.set(1 + Math.sin(t * 30) * 0.3, 1, 1);
            beamMat.opacity = 0.9 * (1 - mT * 0.4);

            plumes.forEach((pl, idx) => {
              pl.position.lerpVectors(meteor.position, meteorStart, (idx + 1) * 0.08);
              (pl.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - idx * 0.14);
            });

            flameLight.position.copy(meteor.position);
            flameLight.intensity = 5.0 + mT * 5.0;
          } else {
            // Phase 2: Cataclysmic Explosion (t >= 0.65)
            beam.visible = false;
            meteor.visible = false;
            plumes.forEach((p) => (p.visible = false));

            shockwave.visible = true;
            fireDome.visible = true;

            const expT = (t - 0.65) / 0.35;
            shockwave.scale.setScalar(1 + expT * 3.2);
            (shockwave.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.95 * (1 - expT));

            fireDome.scale.setScalar(1 + expT * 1.8);
            (fireDome.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1 - expT * 1.1));

            flameLight.position.copy(targetChest);
            flameLight.intensity = Math.max(0, 10.0 * (1 - expT));
          }
        },
        dispose: () => {
          scene.remove(root);
          disposeHierarchy(root);
        },
      });
    }
  };

  // =========================================================================
  // 2. TIDEGUARD: SURGING TIDAL WAVES & CORAL SHIELDS
  // =========================================================================
  const launchTideguardGraphics = (opts: SpellLaunchOptions) => {
    const root = new THREE.Group();
    scene.add(root);

    const slot = opts.slot || 1;
    const duration = opts.duration || (slot === 3 ? 1.2 : slot === 2 ? 0.9 : 0.65);
    const startShield = opts.startPos.clone().add(new THREE.Vector3(0, 1.2, 0.4));
    const targetPos = opts.targetPos.clone().add(new THREE.Vector3(0, 1.0, 0));

    const waterLight = new THREE.PointLight(0x06b6d4, 3.2, 12);
    waterLight.position.copy(startShield);
    root.add(waterLight);

    if (slot === 1) {
      // SKILL 1: "CORAL STRIKE" -> Rushing Tidal Wave Surge & Cyan Coral Spears
      const waveGeo = new THREE.TorusGeometry(0.9, 0.18, 8, 24, Math.PI);
      const waveMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
      });
      const wave = new THREE.Mesh(waveGeo, waveMat);
      wave.rotation.x = Math.PI / 2;
      root.add(wave);

      // 3 Crystalline cyan coral spikes piercing forward
      const coralGeo = new THREE.ConeGeometry(0.18, 0.9, 5);
      const coralMat = new THREE.MeshStandardMaterial({
        color: 0x67e8f9,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.5,
        roughness: 0.2,
      });
      const spikes: THREE.Mesh[] = [];
      for (let i = -1; i <= 1; i++) {
        const spike = new THREE.Mesh(coralGeo, coralMat);
        spike.rotation.x = Math.PI / 2;
        spike.position.x = i * 0.45;
        root.add(spike);
        spikes.push(spike);
      }

      // Splashing impact ripples
      const splashRing = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 1.8, 24),
        new THREE.MeshBasicMaterial({ color: 0x67e8f9, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
      );
      splashRing.rotation.x = Math.PI / 2;
      splashRing.position.set(targetPos.x, 0.1, targetPos.z);
      splashRing.visible = false;
      root.add(splashRing);

      activeVFXList.push({
        id: Math.random().toString(36),
        rootGroup: root,
        progress: 0,
        duration,
        hasImpacted: false,
        onImpact: opts.onImpact,
        update: (_delta, t) => {
          if (t < 0.65) {
            const wT = t / 0.65;
            const currentPos = new THREE.Vector3().lerpVectors(startShield, targetPos, wT);
            wave.position.copy(currentPos);
            spikes.forEach((s, idx) => {
              s.position.set(currentPos.x + (idx - 1) * 0.4, currentPos.y, currentPos.z);
            });
            waterLight.position.copy(currentPos);
          } else {
            wave.visible = false;
            spikes.forEach((s) => (s.visible = false));
            splashRing.visible = true;
            const sT = (t - 0.65) / 0.35;
            splashRing.scale.setScalar(1 + sT * 2.2);
            (splashRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1 - sT));
            waterLight.intensity = Math.max(0, 4.0 * (1 - sT));
          }
        },
        dispose: () => {
          scene.remove(root);
          disposeHierarchy(root);
        },
      });
    } else if (slot === 2) {
      // SKILL 2: "TIDAL BASTION" -> Swirling Domed Water Barrier & Iridescent Bubbles
      const domeGeo = new THREE.SphereGeometry(3.6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
        roughness: 0.1,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.set(opts.startPos.x, 0, opts.startPos.z);
      root.add(dome);

      // Swirling hydro ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(3.2, 0.12, 8, 32),
        new THREE.MeshBasicMaterial({ color: 0x67e8f9 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(opts.startPos.x, 1.2, opts.startPos.z);
      root.add(ring);

      activeVFXList.push({
        id: Math.random().toString(36),
        rootGroup: root,
        progress: 0,
        duration,
        hasImpacted: false,
        onImpact: opts.onImpact,
        update: (delta, t) => {
          ring.rotation.z += delta * 5;
          dome.rotation.y += delta * 2;
          const pulse = 1 + Math.sin(t * Math.PI) * 0.15;
          dome.scale.set(pulse, pulse, pulse);
          (dome.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.5 * (1 - t * 0.9));
        },
        dispose: () => {
          scene.remove(root);
          disposeHierarchy(root);
        },
      });
    } else {
      // SKILL 3: "ABYSSAL RESURGENCE" -> Deep Sea Whirlpool & Cleansing Water Geysers
      const targets = opts.allTargets && opts.allTargets.length > 0 ? opts.allTargets : [opts.startPos];
      const geysers: THREE.Mesh[] = [];

      targets.forEach((tgt) => {
        const col = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.85, 3.8, 8),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 })
        );
        col.position.set(tgt.x, 1.9, tgt.z);
        root.add(col);
        geysers.push(col);
      });

      activeVFXList.push({
        id: Math.random().toString(36),
        rootGroup: root,
        progress: 0,
        duration,
        hasImpacted: false,
        onImpact: opts.onImpact,
        update: (_delta, t) => {
          geysers.forEach((g) => {
            g.scale.set(1 + Math.sin(t * Math.PI) * 0.5, Math.sin(t * Math.PI) * 1.3, 1);
            (g.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1 - t));
          });
        },
        dispose: () => {
          scene.remove(root);
          disposeHierarchy(root);
        },
      });
    }
  };

  // =========================================================================
  // 3. FLORAWEAVER: EMERALD BRIAR DARTS & BLOOMING LOTUS
  // =========================================================================
  const launchFloraweaverGraphics = (opts: SpellLaunchOptions) => {
    const root = new THREE.Group();
    scene.add(root);

    const slot = opts.slot || 1;
    const duration = opts.duration || (slot === 3 ? 1.25 : slot === 2 ? 0.95 : 0.65);
    const startHands = opts.startPos.clone().add(new THREE.Vector3(0, 1.4, 0.2));
    const targetPos = opts.targetPos.clone().add(new THREE.Vector3(0, 1.0, 0));

    const sylvanLight = new THREE.PointLight(0x22c55e, 3.0, 12);
    sylvanLight.position.copy(startHands);
    root.add(sylvanLight);

    if (slot === 1) {
      // SKILL 1: "BRIAR DART" -> Spiral Volley of 3 Emerald Needle Darts & Rose Petals
      const darts: { mesh: THREE.Group; offset: number }[] = [];
      for (let i = 0; i < 3; i++) {
        const dartGrp = new THREE.Group();
        // Needle thorn
        const needle = new THREE.Mesh(
          new THREE.ConeGeometry(0.12, 0.8, 5),
          new THREE.MeshStandardMaterial({ color: 0x15803d, emissive: 0x22c55e, emissiveIntensity: 1.8 })
        );
        needle.rotation.x = Math.PI / 2;
        dartGrp.add(needle);

        // Petal wings
        for (let p = 0; p < 3; p++) {
          const petal = new THREE.Mesh(
            new THREE.ConeGeometry(0.14, 0.4, 4),
            new THREE.MeshBasicMaterial({ color: 0xf472b6 })
          );
          petal.rotation.z = (p * Math.PI * 2) / 3;
          petal.position.z = -0.2;
          dartGrp.add(petal);
        }

        root.add(dartGrp);
        darts.push({ mesh: dartGrp, offset: i * 0.12 });
      }

      // Petal impact burst
      const burstPetals: { mesh: THREE.Mesh; vel: THREE.Vector3 }[] = [];
      for (let bp = 0; bp < 10; bp++) {
        const p = new THREE.Mesh(
          new THREE.ConeGeometry(0.12, 0.35, 4),
          new THREE.MeshBasicMaterial({ color: bp % 2 === 0 ? 0xf472b6 : 0x4ade80 })
        );
        p.visible = false;
        p.position.copy(targetPos);
        root.add(p);
        burstPetals.push({
          mesh: p,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            Math.random() * 3 + 1,
            (Math.random() - 0.5) * 4
          ),
        });
      }

      activeVFXList.push({
        id: Math.random().toString(36),
        rootGroup: root,
        progress: 0,
        duration,
        hasImpacted: false,
        onImpact: opts.onImpact,
        update: (delta, t) => {
          darts.forEach((d) => {
            const dT = Math.max(0, Math.min(1, (t - d.offset) / (0.65 - d.offset)));
            if (dT <= 0) {
              d.mesh.visible = false;
              return;
            }
            d.mesh.visible = dT < 0.98;
            d.mesh.position.lerpVectors(startHands, targetPos, dT);
            d.mesh.rotation.z += delta * 15;
          });

          if (t >= 0.6) {
            const expT = (t - 0.6) / 0.4;
            burstPetals.forEach((bp) => {
              bp.mesh.visible = true;
              bp.mesh.position.addScaledVector(bp.vel, delta);
              bp.vel.y -= delta * 5;
              bp.mesh.scale.setScalar(Math.max(0, 1 - expT));
            });
            sylvanLight.position.copy(targetPos);
            sylvanLight.intensity = Math.max(0, 4.0 * (1 - expT));
          }
        },
        dispose: () => {
          scene.remove(root);
          disposeHierarchy(root);
        },
      });
    } else if (slot === 2) {
      // SKILL 2: "BLOSSOM SPRING" -> Blooming Sacred Lotus Mandala Beneath Allies
      const targets = opts.allTargets && opts.allTargets.length > 0 ? opts.allTargets : [opts.startPos];
      const mandalas: THREE.Group[] = [];

      targets.forEach((tgt) => {
        const mGrp = new THREE.Group();
        mGrp.position.set(tgt.x, 0.08, tgt.z);

        // 8 Blooming petals
        for (let p = 0; p < 8; p++) {
          const petal = new THREE.Mesh(
            new THREE.ConeGeometry(0.35, 1.1, 4),
            new THREE.MeshBasicMaterial({ color: 0xf472b6, side: THREE.DoubleSide })
          );
          petal.rotation.x = Math.PI / 2.2;
          petal.rotation.z = (p * Math.PI * 2) / 8;
          mGrp.add(petal);
        }

        const centerRing = new THREE.Mesh(
          new THREE.RingGeometry(0.1, 0.6, 16),
          new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide })
        );
        centerRing.rotation.x = Math.PI / 2;
        mGrp.add(centerRing);

        root.add(mGrp);
        mandalas.push(mGrp);
      });

      activeVFXList.push({
        id: Math.random().toString(36),
        rootGroup: root,
        progress: 0,
        duration,
        hasImpacted: false,
        onImpact: opts.onImpact,
        update: (delta, t) => {
          mandalas.forEach((m) => {
            m.rotation.y += delta * 1.5;
            const scale = Math.sin(t * Math.PI) * 1.4;
            m.scale.set(scale, scale, scale);
          });
        },
        dispose: () => {
          scene.remove(root);
          disposeHierarchy(root);
        },
      });
    } else {
      // SKILL 3: "SYLVAN REJUVENATION" -> Ancient World Tree Emerald Shockwave
      const wave = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 6.0, 32),
        new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
      );
      wave.rotation.x = Math.PI / 2;
      wave.position.set(opts.startPos.x, 0.1, opts.startPos.z);
      root.add(wave);

      activeVFXList.push({
        id: Math.random().toString(36),
        rootGroup: root,
        progress: 0,
        duration,
        hasImpacted: false,
        onImpact: opts.onImpact,
        update: (_delta, t) => {
          wave.scale.setScalar(1 + t * 2.5);
          (wave.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1 - t));
        },
        dispose: () => {
          scene.remove(root);
          disposeHierarchy(root);
        },
      });
    }
  };

  // =========================================================================
  // 4. LUMINARY: CELESTIAL RADIANT BEAMS & SUPERNOVAS
  // =========================================================================
  const launchLuminaryGraphics = (opts: SpellLaunchOptions) => {
    const root = new THREE.Group();
    scene.add(root);

    const slot = opts.slot || 1;
    const duration = opts.duration || (slot === 3 ? 1.3 : slot === 2 ? 0.9 : 0.65);
    const startChest = opts.startPos.clone().add(new THREE.Vector3(0, 1.8, 0.1));
    const targetPos = opts.targetPos.clone().add(new THREE.Vector3(0, 1.1, 0));

    const solarLight = new THREE.PointLight(0xfbbf24, 4.0, 15);
    solarLight.position.copy(startChest);
    root.add(solarLight);

    if (slot === 1) {
      // SKILL 1: "RADIANT BEAM" -> Piercing Celestial Solar Laser Beam
      const dist = startChest.distanceTo(targetPos);
      const beamGeo = new THREE.CylinderGeometry(0.16, 0.16, dist, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.lerpVectors(startChest, targetPos, 0.5);
      const dir = targetPos.clone().sub(startChest).normalize();
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      root.add(beam);

      // Outer golden solar corona sheath
      const sheath = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, dist, 8),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.6 })
      );
      sheath.position.copy(beam.position);
      sheath.quaternion.copy(beam.quaternion);
      root.add(sheath);

      // Starburst flare on impact
      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.65),
        new THREE.MeshBasicMaterial({ color: 0xfffbeb })
      );
      star.position.copy(targetPos);
      star.visible = false;
      root.add(star);

      activeVFXList.push({
        id: Math.random().toString(36),
        rootGroup: root,
        progress: 0,
        duration,
        hasImpacted: false,
        onImpact: opts.onImpact,
        update: (_delta, t) => {
          if (t < 0.7) {
            beam.scale.set(1 + Math.sin(t * 40) * 0.3, 1, 1);
            sheath.scale.set(1 + Math.cos(t * 40) * 0.4, 1, 1);
            star.visible = true;
            star.scale.setScalar(1 + Math.sin(t * 30) * 0.5);
          } else {
            const fT = (t - 0.7) / 0.3;
            beamMat.opacity = Math.max(0, 0.95 * (1 - fT));
            (sheath.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.6 * (1 - fT));
            star.scale.setScalar(Math.max(0, 1.5 * (1 - fT)));
            solarLight.intensity = Math.max(0, 4.0 * (1 - fT));
          }
        },
        dispose: () => {
          scene.remove(root);
          disposeHierarchy(root);
        },
      });
    } else if (slot === 2) {
      // SKILL 2: "DAWN CHORUS" -> Golden Sunlight Pillars Descending on Allies
      const targets = opts.allTargets && opts.allTargets.length > 0 ? opts.allTargets : [opts.startPos];
      const pillars: THREE.Mesh[] = [];

      targets.forEach((tgt) => {
        const pGeo = new THREE.CylinderGeometry(0.4, 0.4, 8.0, 8);
        const pMat = new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0.75,
        });
        const pillar = new THREE.Mesh(pGeo, pMat);
        pillar.position.set(tgt.x, 4.0, tgt.z);
        root.add(pillar);
        pillars.push(pillar);
      });

      activeVFXList.push({
        id: Math.random().toString(36),
        rootGroup: root,
        progress: 0,
        duration,
        hasImpacted: false,
        onImpact: opts.onImpact,
        update: (_delta, t) => {
          pillars.forEach((p) => {
            (p.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.75 * (1 - t));
          });
        },
        dispose: () => {
          scene.remove(root);
          disposeHierarchy(root);
        },
      });
    } else {
      // SKILL 3: "CELESTIAL SUPERNOVA" -> Giant Pulsing Sun & Blinding Solar Detonation
      const sunGeo = new THREE.SphereGeometry(1.5, 12, 12);
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const sun = new THREE.Mesh(sunGeo, sunMat);
      sun.position.set(targetPos.x, 5.0, targetPos.z);
      root.add(sun);

      const corona = new THREE.Mesh(
        new THREE.SphereGeometry(2.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true, transparent: true, opacity: 0.8 })
      );
      sun.add(corona);

      const novaRing = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 4.5, 32),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
      );
      novaRing.rotation.x = Math.PI / 2;
      novaRing.position.set(targetPos.x, 0.1, targetPos.z);
      novaRing.visible = false;
      root.add(novaRing);

      activeVFXList.push({
        id: Math.random().toString(36),
        rootGroup: root,
        progress: 0,
        duration,
        hasImpacted: false,
        onImpact: opts.onImpact,
        update: (_delta, t) => {
          if (t < 0.6) {
            const pT = t / 0.6;
            const pulse = 1 + Math.sin(pT * Math.PI * 4) * 0.3;
            sun.scale.set(pulse, pulse, pulse);
            solarLight.intensity = 5.0 + pT * 6.0;
          } else {
            sun.visible = false;
            novaRing.visible = true;
            const eT = (t - 0.6) / 0.4;
            novaRing.scale.setScalar(1 + eT * 2.8);
            (novaRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.95 * (1 - eT));
            solarLight.intensity = Math.max(0, 10.0 * (1 - eT));
          }
        },
        dispose: () => {
          scene.remove(root);
          disposeHierarchy(root);
        },
      });
    }
  };

  // =========================================================================
  // 5. SHADOWSTALKER: UMBRAL VOID BLADES & ECLIPSE EXECUTION
  // =========================================================================
  const launchShadowstalkerGraphics = (opts: SpellLaunchOptions) => {
    const root = new THREE.Group();
    scene.add(root);

    const slot = opts.slot || 1;
    const duration = opts.duration || (slot === 3 ? 1.25 : slot === 2 ? 0.9 : 0.65);
    const startMaw = opts.startPos.clone().add(new THREE.Vector3(0, 1.1, 0.5));
    const targetPos = opts.targetPos.clone().add(new THREE.Vector3(0, 1.0, 0));

    const voidLight = new THREE.PointLight(0xa855f7, 3.5, 12);
    voidLight.position.copy(startMaw);
    root.add(voidLight);

    if (slot === 1) {
      // SKILL 1: "UMBRAL FANG" -> Dual Void Crescent Scythe Blades
      const blades: THREE.Mesh[] = [];
      for (let i = 0; i < 2; i++) {
        const bGeo = new THREE.TorusGeometry(0.65, 0.08, 4, 16, Math.PI);
        const bMat = new THREE.MeshStandardMaterial({
          color: 0x581c87,
          emissive: 0xa855f7,
          emissiveIntensity: 2.2,
          roughness: 0.2,
        });
        const blade = new THREE.Mesh(bGeo, bMat);
        blade.rotation.x = Math.PI / 2;
        blade.rotation.y = i === 0 ? 0.4 : -0.4;
        root.add(blade);
        blades.push(blade);
      }

      activeVFXList.push({
        id: Math.random().toString(36),
        rootGroup: root,
        progress: 0,
        duration,
        hasImpacted: false,
        onImpact: opts.onImpact,
        update: (delta, t) => {
          if (t < 0.65) {
            const bT = t / 0.65;
            blades.forEach((b, idx) => {
              b.position.lerpVectors(startMaw, targetPos, bT);
              b.rotation.z += delta * (idx === 0 ? 12 : -12);
            });
            voidLight.position.lerpVectors(startMaw, targetPos, bT);
          } else {
            blades.forEach((b) => (b.visible = false));
            voidLight.intensity = Math.max(0, 4.0 * (1 - (t - 0.65) / 0.35));
          }
        },
        dispose: () => {
          scene.remove(root);
          disposeHierarchy(root);
        },
      });
    } else if (slot === 2) {
      // SKILL 2: "NETHER SHROUD" -> Swirling Vortex of Dark Fog & Eye Particles
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(1.8, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x1e1b4b, wireframe: true, transparent: true, opacity: 0.75 })
      );
      cloud.position.copy(opts.startPos).add(new THREE.Vector3(0, 1.2, 0));
      root.add(cloud);

      activeVFXList.push({
        id: Math.random().toString(36),
        rootGroup: root,
        progress: 0,
        duration,
        hasImpacted: false,
        onImpact: opts.onImpact,
        update: (delta, t) => {
          cloud.rotation.y += delta * 4;
          cloud.rotation.z += delta * 2;
          const s = 1 + Math.sin(t * Math.PI) * 0.4;
          cloud.scale.set(s, s, s);
          (cloud.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.75 * (1 - t));
        },
        dispose: () => {
          scene.remove(root);
          disposeHierarchy(root);
        },
      });
    } else {
      // SKILL 3: "ECLIPSE EXECUTION" -> Cross-Cutting Execution Scythes & Dark Singularity
      const rift = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 2.2, 24),
        new THREE.MeshBasicMaterial({ color: 0x3b0764, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
      );
      rift.rotation.x = Math.PI / 2;
      rift.position.set(targetPos.x, 0.08, targetPos.z);
      root.add(rift);

      const cross1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 3.2, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x7e22ce, emissive: 0xc084fc, emissiveIntensity: 2.0 })
      );
      cross1.rotation.z = Math.PI / 4;
      cross1.position.set(targetPos.x, 1.2, targetPos.z);
      root.add(cross1);

      const cross2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 3.2, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x7e22ce, emissive: 0xc084fc, emissiveIntensity: 2.0 })
      );
      cross2.rotation.z = -Math.PI / 4;
      cross2.position.set(targetPos.x, 1.2, targetPos.z);
      root.add(cross2);

      activeVFXList.push({
        id: Math.random().toString(36),
        rootGroup: root,
        progress: 0,
        duration,
        hasImpacted: false,
        onImpact: opts.onImpact,
        update: (_delta, t) => {
          cross1.scale.setScalar(Math.sin(t * Math.PI) * 1.3);
          cross2.scale.setScalar(Math.sin(t * Math.PI) * 1.3);
          (rift.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1 - t));
        },
        dispose: () => {
          scene.remove(root);
          disposeHierarchy(root);
        },
      });
    }
  };

  // =========================================================================
  // 6. UNIVERSAL ELEMENTAL FALLBACKS
  // =========================================================================
  const launchElementalFallbackGraphics = (opts: SpellLaunchOptions) => {
    const root = new THREE.Group();
    scene.add(root);

    const duration = opts.duration || 0.65;
    const start = opts.startPos.clone().add(new THREE.Vector3(0, 1.2, 0));
    const target = opts.targetPos.clone().add(new THREE.Vector3(0, 1.0, 0));

    let projColor = 0xffa500;
    if (opts.element === 'WATER') projColor = 0x38bdf8;
    else if (opts.element === 'GRASS') projColor = 0x22c55e;
    else if (opts.element === 'LIGHT') projColor = 0xfef08a;
    else if (opts.element === 'DARK') projColor = 0x9333ea;

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      new THREE.MeshBasicMaterial({ color: projColor })
    );
    root.add(orb);

    activeVFXList.push({
      id: Math.random().toString(36),
      rootGroup: root,
      progress: 0,
      duration,
      hasImpacted: false,
      onImpact: opts.onImpact,
      update: (_delta, t) => {
        orb.position.lerpVectors(start, target, t);
        orb.position.y += Math.sin(t * Math.PI) * 0.8;
      },
      dispose: () => {
        scene.remove(root);
        disposeHierarchy(root);
      },
    });
  };

  // =========================================================================
  // UPDATE LOOP & CLEANUP
  // =========================================================================
  const update = (delta: number) => {
    for (let i = activeVFXList.length - 1; i >= 0; i--) {
      const vfx = activeVFXList[i];
      vfx.progress += delta / vfx.duration;

      const p = Math.min(1, Math.max(0, vfx.progress));
      vfx.update(delta, p);

      if (vfx.progress >= 0.55 && !vfx.hasImpacted) {
        vfx.hasImpacted = true;
        vfx.onImpact?.();
      }

      if (vfx.progress >= 1.0) {
        vfx.dispose();
        activeVFXList.splice(i, 1);
      }
    }
  };

  const clear = () => {
    activeVFXList.forEach((v) => v.dispose());
    activeVFXList.length = 0;
  };

  return {
    launchSpell,
    update,
    clear,
  };
}
