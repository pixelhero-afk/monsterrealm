/**
 * 3D Battle Arena Environment (Celestial Floating Sanctuary)
 * Sunlit fantasy amphitheater high in the clouds with floating sky islands,
 * cascading waterfalls, distant castle spires, ancient carved balustrades,
 * sun-bleached limestone flagstones with gold filigree inlays, and cinematic anime lighting.
 * Matches the visual reference from the Genshin/Star Rail anime RPG aesthetic.
 */

import * as THREE from 'three';

export interface FormationPosition {
  x: number;
  y: number;
  z: number;
  rotationY: number;
}

export interface BattleArenaInstance {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  playerPedestals: THREE.Group[];
  enemyPedestals: THREE.Group[];
  update: (delta: number) => void;
  setCameraTarget: (pos: THREE.Vector3, lookAtPos: THREE.Vector3, duration?: number) => void;
  resetCamera: () => void;
  dispose: () => void;
}

// 5v5 Formation Layout (Player in Foreground facing North-East, Enemy across Arena facing South-West)
// Staggered battle line matching the exact camera and character spacing in the reference image
export const PLAYER_FORMATION: FormationPosition[] = [
  { x: -5.4, y: 0, z: 2.5, rotationY: Math.PI - 0.72 },  // Left rear (Pyrosaur)
  { x: -2.8, y: 0, z: 3.6, rotationY: Math.PI - 0.38 },  // Left front (Tideguard)
  { x: 0.0, y: 0, z: 2.8, rotationY: Math.PI },          // Center vanguard (Floraweaver / Nekohime)
  { x: 2.8, y: 0, z: 3.6, rotationY: Math.PI + 0.38 },   // Right front (Luminary)
  { x: 5.4, y: 0, z: 2.5, rotationY: Math.PI + 0.72 },   // Right rear (Shadowstalker)
];

export const ENEMY_FORMATION: FormationPosition[] = [
  { x: -5.2, y: 0, z: -2.4, rotationY: 0.72 },   // Enemy rear left
  { x: -2.7, y: 0, z: -3.8, rotationY: 0.38 },   // Enemy front left
  { x: 0.0, y: 0, z: -3.0, rotationY: 0.0 },     // Enemy center
  { x: 2.7, y: 0, z: -3.8, rotationY: -0.38 },  // Enemy front right
  { x: 5.2, y: 0, z: -2.4, rotationY: -0.72 },  // Enemy rear right
];

export function createBattleArena(container: HTMLElement): BattleArenaInstance {
  const scene = new THREE.Scene();

  // Vibrant anime sky color & atmospheric mist
  scene.background = new THREE.Color(0x70b5fa);
  scene.fog = new THREE.FogExp2(0xa0d2fc, 0.012);

  const width = container.clientWidth || 800;
  const height = container.clientHeight || 500;

  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 200);
  // Isometric Tactical Camera matching the reference image perspective
  const defaultCamPos = new THREE.Vector3(0, 9.2, 15.6);
  const defaultLookAt = new THREE.Vector3(0, 0.8, -0.3);
  camera.position.copy(defaultCamPos);
  camera.lookAt(defaultLookAt);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  container.appendChild(renderer.domElement);

  // =========================================================================
  // CINEMATIC ANIME LIGHTING
  // =========================================================================
  // Radiant Sky Ambient Light (Cool blue anime shadow tint)
  const ambientLight = new THREE.AmbientLight(0x90cdf4, 1.4);
  scene.add(ambientLight);

  // Warm Golden Directional Sun Light
  const sunLight = new THREE.DirectionalLight(0xfffaec, 2.8);
  sunLight.position.set(12, 22, 15);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 1.0;
  sunLight.shadow.camera.far = 45;
  sunLight.shadow.camera.left = -12;
  sunLight.shadow.camera.right = 12;
  sunLight.shadow.camera.top = 12;
  sunLight.shadow.camera.bottom = -12;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  // Warm Floor Bounce Light (simulating sun reflection from limestone arena)
  const groundBounce = new THREE.DirectionalLight(0xfef08a, 0.6);
  groundBounce.position.set(0, -10, 0);
  scene.add(groundBounce);

  // Soft Horizon Rim Fill
  const horizonRim = new THREE.DirectionalLight(0x60a5fa, 0.8);
  horizonRim.position.set(-15, 6, -18);
  scene.add(horizonRim);

  // =========================================================================
  // ENVIRONMENT: SUNLIT CELESTIAL SKY SANCTUARY
  // =========================================================================

  // 1. Ancient Circular Stone Arena Platform
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xd8dce3,
    roughness: 0.72,
    metalness: 0.08,
  });

  const arenaGeo = new THREE.CylinderGeometry(10.5, 11.2, 1.4, 48);
  const arenaMesh = new THREE.Mesh(arenaGeo, stoneMat);
  arenaMesh.position.y = -0.7;
  arenaMesh.receiveShadow = true;
  scene.add(arenaMesh);

  // Ornate Paved Outer Ring
  const outerBorderGeo = new THREE.TorusGeometry(10.4, 0.18, 12, 48);
  const borderStoneMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.5,
    metalness: 0.2,
  });
  const outerBorder = new THREE.Mesh(outerBorderGeo, borderStoneMat);
  outerBorder.rotation.x = Math.PI / 2;
  outerBorder.position.y = 0.03;
  outerBorder.receiveShadow = true;
  scene.add(outerBorder);

  // Concentric Radial Gold Filigree Inlay (as seen in the reference image)
  const goldInlayMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.35,
    metalness: 0.85,
  });

  const goldRing1Geo = new THREE.RingGeometry(6.2, 6.32, 48);
  const goldRing1 = new THREE.Mesh(goldRing1Geo, goldInlayMat);
  goldRing1.rotation.x = -Math.PI / 2;
  goldRing1.position.y = 0.02;
  goldRing1.receiveShadow = true;
  scene.add(goldRing1);

  const goldRing2Geo = new THREE.RingGeometry(2.4, 2.5, 36);
  const goldRing2 = new THREE.Mesh(goldRing2Geo, goldInlayMat);
  goldRing2.rotation.x = -Math.PI / 2;
  goldRing2.position.y = 0.025;
  goldRing2.receiveShadow = true;
  scene.add(goldRing2);

  // Central Sunburst Astrolabe Inlay
  const sunCenterGeo = new THREE.CircleGeometry(1.6, 24);
  const sunCenterMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.45,
    metalness: 0.4,
  });
  const sunCenter = new THREE.Mesh(sunCenterGeo, sunCenterMat);
  sunCenter.rotation.x = -Math.PI / 2;
  sunCenter.position.y = 0.03;
  sunCenter.receiveShadow = true;
  scene.add(sunCenter);

  // 12 Radial Filigree Lines connecting central astrolabe to outer ring
  const lineMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.4,
    metalness: 0.7,
  });
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const spokeGeo = new THREE.BoxGeometry(0.08, 0.02, 3.7);
    const spoke = new THREE.Mesh(spokeGeo, lineMat);
    spoke.position.set(Math.cos(angle) * 4.3, 0.022, Math.sin(angle) * 4.3);
    spoke.rotation.y = -angle;
    spoke.receiveShadow = true;
    scene.add(spoke);
  }

  // 2. Classical Curved Stone Balustrades / Railing with Balusters
  const balustradeGroup = new THREE.Group();
  const balusterGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.85, 8);
  const balustradeRailMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.65,
    metalness: 0.1,
  });

  // Perimeter Posts and Railings along the back and sides
  for (let i = -14; i <= 14; i++) {
    // Only along the rear half and flanks to keep foreground open for player camera
    const angle = Math.PI * 0.5 + (i / 28) * Math.PI * 1.05;
    const rad = 10.3;
    const bx = Math.cos(angle) * rad;
    const bz = Math.sin(angle) * rad;

    const baluster = new THREE.Mesh(balusterGeo, balustradeRailMat);
    baluster.position.set(bx, 0.45, bz);
    baluster.castShadow = true;
    baluster.receiveShadow = true;
    balustradeGroup.add(baluster);

    // Decorative larger pillar posts every 4 balusters
    if (i % 4 === 0) {
      const pillarPostGeo = new THREE.BoxGeometry(0.5, 1.1, 0.5);
      const pillarPost = new THREE.Mesh(pillarPostGeo, balustradeRailMat);
      pillarPost.position.set(bx, 0.55, bz);
      pillarPost.castShadow = true;
      pillarPost.receiveShadow = true;

      // Golden orbs on top of pillars
      const orbGeo = new THREE.SphereGeometry(0.16, 12, 12);
      const orb = new THREE.Mesh(orbGeo, goldInlayMat);
      orb.position.set(bx, 1.25, bz);
      balustradeGroup.add(pillarPost, orb);
    }
  }

  // Top Curved Handrail
  const topRailGeo = new THREE.TorusGeometry(10.3, 0.12, 8, 48, Math.PI * 1.05);
  const topRail = new THREE.Mesh(topRailGeo, balustradeRailMat);
  topRail.rotation.x = Math.PI / 2;
  topRail.rotation.z = -Math.PI * 0.025;
  topRail.position.set(0, 0.95, 0);
  topRail.castShadow = true;
  balustradeGroup.add(topRail);
  scene.add(balustradeGroup);

  // 3. Ancient Ruined Marble Columns & Spires Flanking the Arena
  const marbleColumnMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.55,
    metalness: 0.15,
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.3,
    metalness: 0.9,
  });

  const columnPositions = [
    { x: -11.5, z: -3.5, h: 7.2 },
    { x: -9.8, z: -7.5, h: 5.5 },
    { x: 11.5, z: -3.5, h: 7.8 },
    { x: 9.8, z: -7.5, h: 6.0 },
    { x: -12.2, z: 2.5, h: 4.8 },
    { x: 12.2, z: 2.5, h: 5.2 },
  ];

  columnPositions.forEach((col) => {
    const colGroup = new THREE.Group();
    // Base Plinth
    const plinthGeo = new THREE.BoxGeometry(1.2, 0.6, 1.2);
    const plinth = new THREE.Mesh(plinthGeo, marbleColumnMat);
    plinth.position.y = 0.3;
    colGroup.add(plinth);

    // Fluted Column Shaft
    const shaftGeo = new THREE.CylinderGeometry(0.48, 0.54, col.h, 16);
    const shaft = new THREE.Mesh(shaftGeo, marbleColumnMat);
    shaft.position.y = 0.6 + col.h / 2;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    colGroup.add(shaft);

    // Gold Capital Crown
    const capGeo = new THREE.CylinderGeometry(0.68, 0.48, 0.45, 12);
    const cap = new THREE.Mesh(capGeo, goldTrimMat);
    cap.position.y = 0.6 + col.h + 0.22;
    colGroup.add(cap);

    colGroup.position.set(col.x, 0, col.z);
    scene.add(colGroup);
  });

  // 4. Lush Green Fantasy Foliage (Cypress Trees, Flowering Shrubs & Hanging Vines)
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.8,
  });
  const foliageLightMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    roughness: 0.75,
  });
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.9,
  });

  const treePositions = [
    { x: -13.0, z: -5.0, s: 1.2 },
    { x: -11.5, z: -9.5, s: 1.4 },
    { x: 13.0, z: -5.0, s: 1.3 },
    { x: 11.5, z: -9.5, s: 1.5 },
    { x: -8.0, z: -11.0, s: 1.1 },
    { x: 8.0, z: -11.0, s: 1.2 },
  ];

  treePositions.forEach((tree) => {
    const treeGroup = new THREE.Group();
    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.25 * tree.s, 0.35 * tree.s, 3.5 * tree.s, 6);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.75 * tree.s;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Tiered Conical Cypress Foliage
    for (let t = 0; t < 3; t++) {
      const coneGeo = new THREE.ConeGeometry((1.4 - t * 0.25) * tree.s, 2.2 * tree.s, 7);
      const cone = new THREE.Mesh(coneGeo, t % 2 === 0 ? foliageMat : foliageLightMat);
      cone.position.y = (2.6 + t * 1.4) * tree.s;
      cone.castShadow = true;
      cone.receiveShadow = true;
      treeGroup.add(cone);
    }

    treeGroup.position.set(tree.x, 0, tree.z);
    scene.add(treeGroup);
  });

  // 5. Majestic Distant Floating Sky Islands with Fantasy Castles & Waterfalls
  const islandRockMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.9,
  });
  const islandGrassMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.75,
  });
  const waterfallMat = new THREE.MeshBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.88,
  });
  const castleMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.5,
    metalness: 0.2,
  });
  const castleRoofMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.4,
  });

  // Floating Island 1: Center background majestic castle island
  const island1 = new THREE.Group();
  const rock1Geo = new THREE.ConeGeometry(8, 10, 8);
  const rock1 = new THREE.Mesh(rock1Geo, islandRockMat);
  rock1.rotation.x = Math.PI;
  rock1.position.y = -5;
  island1.add(rock1);

  const grass1Geo = new THREE.CylinderGeometry(8.2, 7.8, 0.8, 8);
  const grass1 = new THREE.Mesh(grass1Geo, islandGrassMat);
  grass1.position.y = 0.4;
  island1.add(grass1);

  // Fantasy Castle Spires on Center Island
  const mainSpireGeo = new THREE.CylinderGeometry(1.2, 1.4, 8, 8);
  const mainSpire = new THREE.Mesh(mainSpireGeo, castleMat);
  mainSpire.position.set(0, 4.4, 0);
  island1.add(mainSpire);

  const mainRoofGeo = new THREE.ConeGeometry(1.8, 4.5, 8);
  const mainRoof = new THREE.Mesh(mainRoofGeo, castleRoofMat);
  mainRoof.position.set(0, 10.4, 0);
  island1.add(mainRoof);

  // Flanking Turrets
  [-2.8, 2.8].forEach((tx) => {
    const turretGeo = new THREE.CylinderGeometry(0.8, 0.9, 5.5, 6);
    const turret = new THREE.Mesh(turretGeo, castleMat);
    turret.position.set(tx, 3.2, 1.2);
    const turretRoofGeo = new THREE.ConeGeometry(1.1, 3.0, 6);
    const turretRoof = new THREE.Mesh(turretRoofGeo, castleRoofMat);
    turretRoof.position.set(tx, 7.2, 1.2);
    island1.add(turret, turretRoof);
  });

  // Cascading Waterfall streaming down from island
  const waterGeo = new THREE.PlaneGeometry(1.6, 12);
  const waterfall = new THREE.Mesh(waterGeo, waterfallMat);
  waterfall.position.set(0, -6, 4.5);
  island1.add(waterfall);

  island1.position.set(0, 8, -42);
  scene.add(island1);

  // Floating Island 2: Left sky island with waterfall
  const island2 = new THREE.Group();
  const rock2Geo = new THREE.ConeGeometry(5.5, 7, 7);
  const rock2 = new THREE.Mesh(rock2Geo, islandRockMat);
  rock2.rotation.x = Math.PI;
  rock2.position.y = -3.5;
  const grass2Geo = new THREE.CylinderGeometry(5.7, 5.3, 0.6, 7);
  const grass2 = new THREE.Mesh(grass2Geo, islandGrassMat);
  grass2.position.y = 0.3;
  island2.add(rock2, grass2);

  const tower2Geo = new THREE.CylinderGeometry(0.9, 1.1, 4.5, 6);
  const tower2 = new THREE.Mesh(tower2Geo, castleMat);
  tower2.position.set(0, 2.5, 0);
  const roof2Geo = new THREE.ConeGeometry(1.3, 2.6, 6);
  const roof2 = new THREE.Mesh(roof2Geo, castleRoofMat);
  roof2.position.set(0, 5.8, 0);
  island2.add(tower2, roof2);

  const water2Geo = new THREE.PlaneGeometry(1.2, 8);
  const waterfall2 = new THREE.Mesh(water2Geo, waterfallMat);
  waterfall2.position.set(1.5, -4, 3.2);
  island2.add(waterfall2);

  island2.position.set(-28, 4, -36);
  scene.add(island2);

  // Floating Island 3: Right sky island with ruins
  const island3 = new THREE.Group();
  const rock3Geo = new THREE.ConeGeometry(6, 8, 7);
  const rock3 = new THREE.Mesh(rock3Geo, islandRockMat);
  rock3.rotation.x = Math.PI;
  rock3.position.y = -4;
  const grass3Geo = new THREE.CylinderGeometry(6.2, 5.8, 0.6, 7);
  const grass3 = new THREE.Mesh(grass3Geo, islandGrassMat);
  grass3.position.y = 0.3;
  island3.add(rock3, grass3);

  const tower3Geo = new THREE.CylinderGeometry(1.0, 1.2, 5, 6);
  const tower3 = new THREE.Mesh(tower3Geo, castleMat);
  tower3.position.set(0, 2.8, 0);
  const roof3Geo = new THREE.ConeGeometry(1.4, 3.0, 6);
  const roof3 = new THREE.Mesh(roof3Geo, castleRoofMat);
  roof3.position.set(0, 6.5, 0);
  island3.add(tower3, roof3);

  island3.position.set(28, 6, -34);
  scene.add(island3);

  // 6. Stylized Volumetric Clouds in the Background Sky
  const cloudMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.82,
  });

  const cloudGroup = new THREE.Group();
  const cloudPositions = [
    { x: -18, y: 12, z: -35, s: 4 },
    { x: 16, y: 14, z: -38, s: 5 },
    { x: 2, y: 18, z: -45, s: 6 },
    { x: -32, y: 8, z: -30, s: 4.5 },
    { x: 30, y: 10, z: -32, s: 4 },
  ];

  cloudPositions.forEach((cp) => {
    const singleCloud = new THREE.Group();
    for (let c = 0; c < 5; c++) {
      const puffGeo = new THREE.SphereGeometry(1.5 * cp.s * (0.6 + Math.random() * 0.4), 8, 8);
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(
        (c - 2) * 1.4 * cp.s + Math.random() * 0.5,
        (Math.random() - 0.5) * 0.8 * cp.s,
        (Math.random() - 0.5) * 0.8 * cp.s
      );
      singleCloud.add(puff);
    }
    singleCloud.position.set(cp.x, cp.y, cp.z);
    cloudGroup.add(singleCloud);
  });
  scene.add(cloudGroup);

  // 7. Ambient Floating Starlight / Sunlit Motes (Golden Fantasy Dandelion Dust)
  const particleCount = 90;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSpeeds = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 22;
    particlePositions[i * 3 + 1] = 0.5 + Math.random() * 7;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 22;
    particleSpeeds[i] = 0.25 + Math.random() * 0.6;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0xfef08a,
    size: 0.16,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });
  const particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  // =========================================================================
  // 10 3D CELESTIAL PEDESTALS (Subtle contact rings under monsters)
  // =========================================================================
  const createPedestal = (isPlayer: boolean) => {
    const group = new THREE.Group();

    // Subtle Flat Contact Shadow Ring
    const shadowGeo = new THREE.CircleGeometry(0.85, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.35,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    group.add(shadow);

    // Glowing Concentric Celestial Halo Ring
    const ringGeo = new THREE.TorusGeometry(0.82, 0.025, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: isPlayer ? 0x38bdf8 : 0xf43f5e,
      transparent: true,
      opacity: 0.7,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    return group;
  };

  const playerPedestals: THREE.Group[] = [];
  PLAYER_FORMATION.forEach((pos) => {
    const p = createPedestal(true);
    p.position.set(pos.x, pos.y, pos.z);
    scene.add(p);
    playerPedestals.push(p);
  });

  const enemyPedestals: THREE.Group[] = [];
  ENEMY_FORMATION.forEach((pos) => {
    const p = createPedestal(false);
    p.position.set(pos.x, pos.y, pos.z);
    scene.add(p);
    enemyPedestals.push(p);
  });

  // =========================================================================
  // DYNAMIC CAMERA CONTROLLER
  // =========================================================================
  let targetCamPos = defaultCamPos.clone();
  let targetLookAt = defaultLookAt.clone();
  let camLerpSpeed = 3.0;

  const setCameraTarget = (pos: THREE.Vector3, lookAtPos: THREE.Vector3, speed: number = 3.0) => {
    targetCamPos.copy(pos);
    targetLookAt.copy(lookAtPos);
    camLerpSpeed = speed;
  };

  const resetCamera = () => {
    targetCamPos.copy(defaultCamPos);
    targetLookAt.copy(defaultLookAt);
    camLerpSpeed = 2.5;
  };

  let clockTime = 0;
  const currentLookAt = defaultLookAt.clone();

  const update = (delta: number) => {
    clockTime += delta;

    // Smooth Camera Transition
    camera.position.lerp(targetCamPos, delta * camLerpSpeed);
    currentLookAt.lerp(targetLookAt, delta * camLerpSpeed);
    camera.lookAt(currentLookAt);

    // Gently drift floating clouds
    cloudGroup.children.forEach((cloud, idx) => {
      cloud.position.x += Math.sin(clockTime * 0.15 + idx) * 0.008;
    });

    // Animate Rising Sunlit Motes
    const pos = particleGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 1] += particleSpeeds[i] * delta;
      pos[i * 3] += Math.sin(clockTime + i) * 0.005;
      if (pos[i * 3 + 1] > 8) {
        pos[i * 3 + 1] = 0.5;
        pos[i * 3] = (Math.random() - 0.5) * 22;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 22;
      }
    }
    particleGeo.attributes.position.needsUpdate = true;

    // Render Scene
    renderer.render(scene, camera);
  };

  const dispose = () => {
    renderer.dispose();
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
  };

  return {
    scene,
    camera,
    renderer,
    playerPedestals,
    enemyPedestals,
    update,
    setCameraTarget,
    resetCamera,
    dispose,
  };
}

