/**
 * Continent Sovereign Overlord Boss 3D Regalia & Procedural Ornaments
 * Adds grand, visually distinct, bespoke 3D features to each Continental Chapter Boss (1-10 through 5-10):
 * - Ignis Sovereign (Ch 1-10): Obsidian Magma Caldera Crown, Twin Volcanic Shoulder Vents, Chest Magma Core, Orbiting Magma Comets, Magma Ground Ring.
 * - Leviathan Sovereign (Ch 2-10): Oceanic Coral Trident Horns, Giant Nautilus Pauldrons, Abyssal Heart Core, Dual Spinning Hydro Rings.
 * - Yggdrasil Ancient (Ch 3-10): Grand World-Tree Antlers, Floating Celtic Leyline Halo, Ironbark Carapace, Orbiting Emerald Wisps.
 * - Solar Archon (Ch 4-10): Sunburst Coronal Crown, Hexa-Wing Seraphic Array, Triple Concentric Counter-Rotating Solar Halos, Heart of Dawn.
 * - Void Sovereign (Ch 5-10): Abyssal Dread Horns, Quad Void Serpentine Tails, Spinning Event Horizon Torus, Singularity Core, Orbiting Void Orbs.
 */

import * as THREE from 'three';

export interface BossRegaliaParams {
  variantId: string;
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  wingsGroup: THREE.Group;
  auraGroup: THREE.Group;
  isAwakened: boolean;
}

export function applyBossRegalia({
  variantId,
  root,
  bodyGroup,
  headGroup,
  leftArmGroup,
  rightArmGroup,
  wingsGroup,
  auraGroup,
}: BossRegaliaParams): ((delta: number, time: number) => void) | null {
  const isIgnis = variantId === 'var_boss_pyrosaur_ignis';
  const isLeviathan = variantId === 'var_boss_tideguard_leviathan';
  const isYggdrasil = variantId === 'var_boss_floraweaver_yggdrasil';
  const isSolarArchon = variantId === 'var_boss_luminary_archon';
  const isVoid = variantId === 'var_boss_shadowstalker_void';

  if (!isIgnis && !isLeviathan && !isYggdrasil && !isSolarArchon && !isVoid) {
    return null;
  }

  // Bosses are imposing, colossal entities
  root.scale.multiplyScalar(1.22);

  const animators: Array<(delta: number, time: number) => void> = [];

  // =========================================================================
  // 1. IGNIS SOVEREIGN (Chapter 1-10 Apex Boss)
  // =========================================================================
  if (isIgnis) {
    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.35,
      metalness: 0.85,
    });
    const magmaMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xef4444,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    const lavaCoreMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf97316,
      emissiveIntensity: 3.0,
      roughness: 0.1,
    });

    // Obsidian Magma Caldera Crown on Head
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, 0.42, 0.1);
    const spikeHeights = [0.45, 0.65, 0.85, 0.65, 0.45];
    const spikeX = [-0.3, -0.15, 0, 0.15, 0.3];
    spikeHeights.forEach((h, i) => {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, h, 5), obsidianMat);
      spike.position.set(spikeX[i], h / 2, 0);
      spike.rotation.z = -spikeX[i] * 0.4;
      crownGroup.add(spike);

      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, h * 0.35, 4), magmaMat);
      tip.position.set(spikeX[i], h * 0.8, 0);
      tip.rotation.z = -spikeX[i] * 0.4;
      crownGroup.add(tip);
    });
    headGroup.add(crownGroup);

    // Twin Volcanic Lava Chimneys on Shoulders
    const ventL = new THREE.Group();
    ventL.position.set(-0.55, 1.4, -0.25);
    ventL.rotation.set(-0.25, 0, -0.2);
    const chimneyL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.65, 6), obsidianMat);
    const coreL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), lavaCoreMat);
    coreL.position.y = 0.28;
    ventL.add(chimneyL, coreL);

    const ventR = new THREE.Group();
    ventR.position.set(0.55, 1.4, -0.25);
    ventR.rotation.set(-0.25, 0, 0.2);
    const chimneyR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.65, 6), obsidianMat);
    const coreR = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), lavaCoreMat);
    coreR.position.y = 0.28;
    ventR.add(chimneyR, coreR);

    bodyGroup.add(ventL, ventR);

    // Chest Magma Heart Octahedron
    const heart = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), lavaCoreMat);
    heart.position.set(0, 1.05, 0.48);
    bodyGroup.add(heart);

    // 3 Orbiting Magma Comets
    const cometsGroup = new THREE.Group();
    auraGroup.add(cometsGroup);
    const cometCount = 3;
    const cometMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < cometCount; i++) {
      const comet = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16), magmaMat);
      cometMeshes.push(comet);
      cometsGroup.add(comet);
    }

    // Ground Magma Runic Caldera Ring
    const groundRing = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 1.75, 32),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
    );
    groundRing.rotation.x = -Math.PI / 2;
    groundRing.position.y = 0.03;
    auraGroup.add(groundRing);

    animators.push((delta, time) => {
      // Pulse magma core
      const pulse = 2.5 + Math.sin(time * 4) * 0.8;
      lavaCoreMat.emissiveIntensity = pulse;
      heart.rotation.y += delta * 1.5;
      heart.rotation.x += delta * 0.8;

      // Orbit comets
      cometMeshes.forEach((mesh, idx) => {
        const angle = time * 1.6 + (idx * Math.PI * 2) / cometCount;
        const radius = 1.7 + idx * 0.2;
        mesh.position.set(
          Math.cos(angle) * radius,
          0.8 + Math.sin(angle * 2) * 0.35 + idx * 0.3,
          Math.sin(angle) * radius
        );
        mesh.rotation.y += delta * 3;
      });

      groundRing.rotation.z += delta * 0.3;
    });
  }

  // =========================================================================
  // 2. LEVIATHAN SOVEREIGN (Chapter 2-10 Apex Boss)
  // =========================================================================
  if (isLeviathan) {
    const coralMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      metalness: 0.4,
    });
    const hydroMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x06b6d4,
      emissiveIntensity: 2.4,
      transparent: true,
      opacity: 0.88,
    });
    const pearlMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.8,
      roughness: 0.1,
    });

    // Deep-Sea Coral Trident Horns on Head
    const crestGroup = new THREE.Group();
    crestGroup.position.set(0, 0.45, 0.1);
    const centerTrident = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.9, 5), coralMat);
    centerTrident.position.y = 0.45;
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.7, 4), hydroMat);
    hornL.position.set(-0.28, 0.35, -0.05);
    hornL.rotation.z = 0.4;
    const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.7, 4), hydroMat);
    hornR.position.set(0.28, 0.35, -0.05);
    hornR.rotation.z = -0.4;
    crestGroup.add(centerTrident, hornL, hornR);
    headGroup.add(crestGroup);

    // Titanic Nautilus Shell Pauldrons on Shoulders
    const pauldronL = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.14, 8, 16), coralMat);
    pauldronL.position.set(-0.85, 1.25, 0);
    pauldronL.rotation.set(0, Math.PI / 2, 0.3);
    const pauldronR = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.14, 8, 16), coralMat);
    pauldronR.position.set(0.85, 1.25, 0);
    pauldronR.rotation.set(0, -Math.PI / 2, -0.3);
    bodyGroup.add(pauldronL, pauldronR);

    // Abyssal Heart Core
    const abyssalPearl = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), pearlMat);
    abyssalPearl.position.set(0, 1.1, 0.45);
    bodyGroup.add(abyssalPearl);

    // Dual Spinning Hydro Rings
    const hydroRingsGroup = new THREE.Group();
    auraGroup.add(hydroRingsGroup);
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.05, 8, 36), hydroMat);
    ring1.rotation.set(0.4, 0, 0.3);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.04, 8, 36), coralMat);
    ring2.rotation.set(-0.5, 0, -0.4);
    hydroRingsGroup.add(ring1, ring2);

    // 4 Orbiting Hydro Orbs
    const hydroOrbs: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), pearlMat);
      hydroOrbs.push(orb);
      auraGroup.add(orb);
    }

    animators.push((delta, time) => {
      ring1.rotation.z += delta * 1.8;
      ring2.rotation.z -= delta * 1.5;

      const pulse = 2.2 + Math.sin(time * 3) * 0.6;
      pearlMat.emissiveIntensity = pulse;

      hydroOrbs.forEach((orb, idx) => {
        const a = time * 1.4 + (idx * Math.PI) / 2;
        orb.position.set(
          Math.sin(a) * 1.8,
          0.7 + Math.cos(a * 2) * 0.4,
          Math.cos(a) * 1.8
        );
      });
    });
  }

  // =========================================================================
  // 3. YGGDRASIL ANCIENT (Chapter 3-10 Apex Boss)
  // =========================================================================
  if (isYggdrasil) {
    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x3f2e1a,
      roughness: 0.9,
    });
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x16a34a,
      emissiveIntensity: 2.2,
      roughness: 0.3,
    });
    const goldBloomMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.6,
      roughness: 0.2,
    });

    // World-Tree Branching Antlers on Head
    const antlerGroup = new THREE.Group();
    antlerGroup.position.set(0, 0.5, 0.05);

    [-1, 1].forEach((side) => {
      const mainBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.9, 5), barkMat);
      mainBeam.position.set(side * 0.35, 0.45, 0);
      mainBeam.rotation.set(-0.2, 0, side * 0.6);
      antlerGroup.add(mainBeam);

      const branch1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.55, 5), barkMat);
      branch1.position.set(side * 0.6, 0.75, 0.05);
      branch1.rotation.set(-0.3, 0, side * 0.9);
      antlerGroup.add(branch1);

      // Blossom gems
      const blossom1 = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), goldBloomMat);
      blossom1.position.set(side * 0.5, 0.85, 0);
      const blossom2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14), leafMat);
      blossom2.position.set(side * 0.8, 0.95, 0.1);
      antlerGroup.add(blossom1, blossom2);
    });
    headGroup.add(antlerGroup);

    // Floating Celtic Leyline Halo behind Upper Torso
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.06, 8, 36), leafMat);
    halo.position.set(0, 1.35, -0.35);
    bodyGroup.add(halo);

    // 4 Orbiting Leyline Spirit Wisps
    const wisps: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const w = new THREE.Mesh(new THREE.OctahedronGeometry(0.15), goldBloomMat);
      wisps.push(w);
      auraGroup.add(w);
    }

    animators.push((delta, time) => {
      halo.rotation.z += delta * 0.7;
      halo.scale.setScalar(1 + Math.sin(time * 2.5) * 0.05);

      wisps.forEach((wisp, idx) => {
        const a = time * 1.2 + (idx * Math.PI) / 2;
        wisp.position.set(
          Math.cos(a) * 1.75,
          1.1 + Math.sin(a * 3) * 0.35,
          Math.sin(a) * 1.75
        );
        wisp.rotation.y += delta * 2.5;
        wisp.rotation.x += delta * 1.5;
      });
    });
  }

  // =========================================================================
  // 4. SOLAR ARCHON (Chapter 4-10 Apex Boss)
  // =========================================================================
  if (isSolarArchon) {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      metalness: 0.9,
      roughness: 0.2,
    });
    const sunMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.8,
      roughness: 0.1,
    });
    const whiteCoreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfef08a,
      emissiveIntensity: 3.5,
      roughness: 0.0,
    });

    // Sunburst Coronal Crown
    const sunburstCrown = new THREE.Group();
    sunburstCrown.position.set(0, 0.45, 0.05);
    for (let i = 0; i < 7; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 6;
      const ray = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.45 + (i % 2) * 0.2, 4), sunMat);
      ray.position.set(Math.cos(angle) * 0.35, Math.sin(angle) * 0.35 + 0.15, 0);
      ray.rotation.z = angle - Math.PI / 2;
      sunburstCrown.add(ray);
    }
    headGroup.add(sunburstCrown);

    // Heart of Dawn Core
    const sunCore = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), whiteCoreMat);
    sunCore.position.set(0, 1.15, 0.42);
    bodyGroup.add(sunCore);

    // Triple Concentric Counter-Rotating Solar Halos behind back
    const haloGroup = new THREE.Group();
    haloGroup.position.set(0, 1.45, -0.4);
    auraGroup.add(haloGroup);

    const halo1 = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.04, 6, 32), goldMat);
    const halo2 = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.035, 6, 36), sunMat);
    const halo3 = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.03, 6, 40), goldMat);

    // 8 Solar Ray Spikes on outer halo
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.35, 4), sunMat);
      spike.position.set(Math.cos(a) * 1.55, Math.sin(a) * 1.55, 0);
      spike.rotation.z = a - Math.PI / 2;
      halo3.add(spike);
    }
    haloGroup.add(halo1, halo2, halo3);

    // Hexa-Wing Array (4 additional wings mounted to wingsGroup)
    [-1, 1].forEach((side) => {
      // High wing
      const wingH = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.05), sunMat);
      wingH.position.set(side * 0.8, 1.6, -0.2);
      wingH.rotation.set(-0.2, side * 0.4, side * 0.7);
      wingsGroup.add(wingH);

      // Low wing
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.95, 0.04), goldMat);
      wingL.position.set(side * 0.7, 0.5, -0.2);
      wingL.rotation.set(0.3, side * 0.3, side * 1.2);
      wingsGroup.add(wingL);
    });

    animators.push((delta, time) => {
      halo1.rotation.z += delta * 1.2;
      halo2.rotation.z -= delta * 1.6;
      halo3.rotation.z += delta * 0.8;

      const pulse = 3.0 + Math.sin(time * 5) * 0.8;
      whiteCoreMat.emissiveIntensity = pulse;
    });
  }

  // =========================================================================
  // 5. VOID SOVEREIGN (Chapter 5-10 Apex Boss)
  // =========================================================================
  if (isVoid) {
    const voidMat = new THREE.MeshStandardMaterial({
      color: 0x0f0a1e,
      roughness: 0.2,
      metalness: 0.9,
    });
    const singularityMat = new THREE.MeshStandardMaterial({
      color: 0x7e22ce,
      emissive: 0xf43f5e,
      emissiveIntensity: 3.2,
      roughness: 0.1,
    });
    const darkDiskMat = new THREE.MeshStandardMaterial({
      color: 0x2e1065,
      emissive: 0x9333ea,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.85,
    });

    // Abyssal Dread Horns on Head
    const hornsGroup = new THREE.Group();
    hornsGroup.position.set(0, 0.35, 0.2);
    [-1, 1].forEach((side) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.85, 5), voidMat);
      horn.position.set(side * 0.28, 0.4, 0);
      horn.rotation.set(0.4, 0, side * 0.35);

      const hornTip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.35, 4), singularityMat);
      hornTip.position.set(side * 0.38, 0.7, 0.12);
      hornTip.rotation.set(0.4, 0, side * 0.35);

      hornsGroup.add(horn, hornTip);
    });
    headGroup.add(hornsGroup);

    // Singularity Core in Chest
    const singularityCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24), singularityMat);
    singularityCore.position.set(0, 0.85, 0.55);
    bodyGroup.add(singularityCore);

    // Spinning Event Horizon Accretion Torus behind back
    const eventHorizon = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.12, 8, 36), darkDiskMat);
    eventHorizon.position.set(0, 1.2, -0.6);
    eventHorizon.rotation.set(0.6, 0.3, 0);
    auraGroup.add(eventHorizon);

    // 2 Extra Serpentine Void Tails (making 4 tails total)
    [-1, 1].forEach((side) => {
      const extraTail = new THREE.Group();
      extraTail.position.set(side * 0.3, 0.9, -0.7);
      for (let i = 0; i < 4; i++) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.06 - i * 0.01, 0.04, 0.35, 5), voidMat);
        seg.rotation.x = -Math.PI / 3;
        seg.rotation.y = side * 0.4;
        seg.position.set(side * 0.1 * i, 0.2 + i * 0.2, -0.1 - i * 0.25);
        extraTail.add(seg);
      }
      const cry = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), singularityMat);
      cry.position.set(side * 0.35, 1.1, -1.0);
      extraTail.add(cry);
      bodyGroup.add(extraTail);
    });

    // 3 Orbiting Singularity Spheres
    const voidOrbs: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), singularityMat);
      voidOrbs.push(orb);
      auraGroup.add(orb);
    }

    animators.push((delta, time) => {
      eventHorizon.rotation.z += delta * 2.8;
      singularityCore.rotation.y += delta * 2.0;
      singularityCore.rotation.x += delta * 1.2;

      voidOrbs.forEach((orb, idx) => {
        const a = time * 2.0 + (idx * Math.PI * 2) / 3;
        orb.position.set(
          Math.sin(a) * 1.8,
          0.8 + Math.cos(a * 2) * 0.35,
          Math.cos(a) * 1.8
        );
      });
    });
  }

  // Return master animator
  return (delta: number, time: number) => {
    animators.forEach((fn) => fn(delta, time));
  };
}
