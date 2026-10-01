/**
 * Anime Cel-Shading & Stylized Material System
 * Provides multi-step toon shading, view-dependent Fresnel rim lighting,
 * and emissive rune channels for anime-inspired 3D fantasy characters.
 */

import * as THREE from 'three';
import { MonsterMaterialConfig } from './types';

// Shared Stepped Gradient Ramp for Anime Cel-Shading
let sharedGradientMap: THREE.Texture | null = null;

export function getAnimeGradientMap(): THREE.Texture {
  if (sharedGradientMap) return sharedGradientMap;

  // 3-step anime lighting ramp: Soft Shadow -> Luminous Midtone -> Crisp Highlight
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0.0, '#757b98');   // Soft cool anime shadow (retains clarity, never crushes to black)
  grad.addColorStop(0.48, '#757b98');
  grad.addColorStop(0.50, '#b8bed6');  // Anime midtone
  grad.addColorStop(0.78, '#b8bed6');
  grad.addColorStop(0.80, '#ffffff');  // Crisp key highlight
  grad.addColorStop(1.0, '#ffffff');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  sharedGradientMap = texture;
  return sharedGradientMap;
}

const textureCache = new Map<string, THREE.Texture>();
const textureLoader = new THREE.TextureLoader();

export function loadCachedTexture(url: string): THREE.Texture {
  if (textureCache.has(url)) {
    return textureCache.get(url)!;
  }
  const tex = textureLoader.load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  textureCache.set(url, tex);
  return tex;
}

/**
 * Creates or upgrades an existing Three.js material into a stylized anime cel-shaded material,
 * strictly preserving underlying diffuse textures, normal maps, UVs, transparency, and distinct material colors.
 */
export function upgradeToAnimeMaterial(
  originalMat: THREE.Material,
  config: MonsterMaterialConfig
): THREE.Material {
  const gradientMap = getAnimeGradientMap();
  const std = originalMat as THREE.MeshStandardMaterial;

  // Base texture map: retain original material diffuse map, or apply config override if specified
  let diffuseMap: THREE.Texture | null = config.diffuseTextureUrl ? loadCachedTexture(config.diffuseTextureUrl) : std.map || null;
  let emissiveMap: THREE.Texture | null = config.emissiveTextureUrl ? loadCachedTexture(config.emissiveTextureUrl) : std.emissiveMap || null;
  let normalMap: THREE.Texture | null = config.normalTextureUrl ? loadCachedTexture(config.normalTextureUrl) : std.normalMap || null;

  if (diffuseMap) {
    diffuseMap.colorSpace = THREE.SRGBColorSpace;
    diffuseMap.needsUpdate = true;
  }

  // Emissive map: retain original material emissive map, or apply config override (non-pyrosaur, non-tideguard, non-nekohime, non-floraweaver)
  if (
    config.familyId !== 'fam_nekohime' &&
    config.familyId !== 'fam_pyrosaur' &&
    config.familyId !== 'fam_tideguard' &&
    config.familyId !== 'fam_floraweaver' &&
    config.emissiveTextureUrl
  ) {
    emissiveMap = loadCachedTexture(config.emissiveTextureUrl);
  }
  if (emissiveMap) {
    emissiveMap.colorSpace = THREE.SRGBColorSpace;
  }

  // Normal map: retain original material normal map, or apply config override (non-pyrosaur, non-tideguard, non-nekohime, non-floraweaver)
  if (
    config.familyId !== 'fam_nekohime' &&
    config.familyId !== 'fam_pyrosaur' &&
    config.familyId !== 'fam_tideguard' &&
    config.familyId !== 'fam_floraweaver' &&
    config.normalTextureUrl
  ) {
    normalMap = loadCachedTexture(config.normalTextureUrl);
  }
  if (normalMap) {
    normalMap.colorSpace = THREE.NoColorSpace;
  }

  // Base color: Start with std.color or pure white
  const baseColor = new THREE.Color(0xffffff);
  if (
    std.color &&
    config.familyId !== 'fam_pyrosaur' &&
    config.familyId !== 'fam_tideguard' &&
    config.familyId !== 'fam_nekohime' &&
    config.familyId !== 'fam_floraweaver'
  ) {
    baseColor.copy(std.color);
  }

  // Dynamic elemental color adaptation
  if (config.tintColor) {
    const tint = new THREE.Color(config.tintColor);
    if (diffuseMap) {
      // For textured anime models, gently tint highlights so elemental variants look cohesive without washing out textures
      baseColor.lerp(tint, 0.35);
    } else {
      baseColor.lerp(tint, 0.70);
    }
  }

  // Emissive color & intensity
  let emissiveColor = config.emissiveColor
    ? new THREE.Color(config.emissiveColor)
    : (std.emissive ? std.emissive.clone() : new THREE.Color(0x000000));
  let emissiveIntensity = config.emissiveIntensity ?? (std.emissiveIntensity || 1.0);

  if (config.familyId === 'fam_pyrosaur') {
    const elemUpper = (config.element || 'FIRE').toUpperCase();
    const pyroColors: Record<string, { bodyEmiss: string; eyeEmiss: string; bodyIntensity: number; eyeIntensity: number }> = {
      FIRE: { bodyEmiss: '#ff4400', eyeEmiss: '#ffaa00', bodyIntensity: 2.2, eyeIntensity: 3.6 },
      WATER: { bodyEmiss: '#00b4d8', eyeEmiss: '#00f0ff', bodyIntensity: 2.3, eyeIntensity: 3.8 },
      GRASS: { bodyEmiss: '#10b981', eyeEmiss: '#84cc16', bodyIntensity: 2.2, eyeIntensity: 3.6 },
      LIGHT: { bodyEmiss: '#facc15', eyeEmiss: '#ffffff', bodyIntensity: 2.5, eyeIntensity: 4.0 },
      DARK: { bodyEmiss: '#a855f7', eyeEmiss: '#e879f9', bodyIntensity: 2.4, eyeIntensity: 3.8 },
    };
    const c = pyroColors[elemUpper] || pyroColors.FIRE;
    if (std.name === 'GoB_PM3D_Sphere3D1') {
      emissiveColor = new THREE.Color(c.eyeEmiss);
      emissiveIntensity = c.eyeIntensity;
    } else if (std.name === 'GoB_Tooth') {
      emissiveColor = new THREE.Color(0x000000);
      emissiveIntensity = 0.0;
    } else {
      emissiveColor = new THREE.Color(c.bodyEmiss);
      emissiveIntensity = c.bodyIntensity;
    }
  } else if (config.familyId === 'fam_tideguard') {
    const elemUpper = (config.element || 'WATER').toUpperCase();
    const tideColors: Record<string, { bodyEmiss: string; eyeEmiss: string; bodyIntensity: number; eyeIntensity: number }> = {
      WATER: { bodyEmiss: '#00f0ff', eyeEmiss: '#38bdf8', bodyIntensity: 2.2, eyeIntensity: 3.8 },
      FIRE: { bodyEmiss: '#ff6600', eyeEmiss: '#ffaa00', bodyIntensity: 2.2, eyeIntensity: 3.8 },
      GRASS: { bodyEmiss: '#10b981', eyeEmiss: '#4ade80', bodyIntensity: 2.2, eyeIntensity: 3.8 },
      LIGHT: { bodyEmiss: '#facc15', eyeEmiss: '#ffffff', bodyIntensity: 2.5, eyeIntensity: 4.0 },
      DARK: { bodyEmiss: '#c084fc', eyeEmiss: '#e879f9', bodyIntensity: 2.4, eyeIntensity: 3.8 },
    };
    const c = tideColors[elemUpper] || tideColors.WATER;
    if (std.name === 'Black') {
      emissiveColor = new THREE.Color(c.eyeEmiss);
      emissiveIntensity = c.eyeIntensity;
    } else {
      emissiveColor = new THREE.Color(c.bodyEmiss);
      emissiveIntensity = c.bodyIntensity;
    }
  } else if (config.familyId === 'fam_nekohime') {
    const elemUpper = (config.element || 'GRASS').toUpperCase();
    const nekoColors: Record<string, { emiss: string; intensity: number }> = {
      GRASS: { emiss: '#10b981', intensity: 1.8 },
      FIRE: { emiss: '#f97316', intensity: 1.8 },
      WATER: { emiss: '#06b6d4', intensity: 1.8 },
      LIGHT: { emiss: '#eab308', intensity: 1.8 },
      DARK: { emiss: '#a855f7', intensity: 1.8 },
    };
    const c = nekoColors[elemUpper] || nekoColors.GRASS;
    emissiveColor = new THREE.Color(c.emiss);
    emissiveIntensity = c.intensity;
  } else if (config.familyId === 'fam_floraweaver') {
    const elemUpper = (config.element || 'GRASS').toUpperCase();
    const floraColors: Record<string, { emiss: string; intensity: number }> = {
      GRASS: { emiss: '#34d399', intensity: 2.2 },
      FIRE: { emiss: '#ff5722', intensity: 2.4 },
      WATER: { emiss: '#00f0ff', intensity: 2.3 },
      LIGHT: { emiss: '#facc15', intensity: 2.5 },
      DARK: { emiss: '#c084fc', intensity: 2.3 },
    };
    const c = floraColors[elemUpper] || floraColors.GRASS;
    emissiveColor = new THREE.Color(c.emiss);
    emissiveIntensity = c.intensity;
  }

  // Construct MeshToonMaterial preserving PBR maps & UV coordinates
  const toonMat = new THREE.MeshToonMaterial({
    gradientMap,
    map: diffuseMap,
    normalMap: normalMap,
    normalScale: std.normalScale ? std.normalScale.clone() : new THREE.Vector2(1, 1),
    color: baseColor,
    emissive: emissiveColor,
    emissiveIntensity,
    emissiveMap,
    transparent: std.transparent || config.transparent || false,
    opacity: std.opacity ?? config.opacity ?? 1.0,
    alphaTest: std.alphaTest || 0.05,
    side: std.side ?? THREE.FrontSide,
  });

  applyAnimeFresnelShader(toonMat, config);

  return toonMat;
}

/**
 * Injects view-dependent Fresnel rim lighting into MeshToonMaterial
 */
export function applyAnimeFresnelShader(
  mat: THREE.MeshToonMaterial,
  config: MonsterMaterialConfig
): void {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: new THREE.Color(config.rimColor) };
    shader.uniforms.uRimIntensity = { value: config.rimIntensity };
    shader.uniforms.uRimPower = { value: config.rimPower };

    shader.fragmentShader = `
      uniform vec3 uRimColor;
      uniform float uRimIntensity;
      uniform float uRimPower;
    ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>

      // Stylized Anime Fresnel Rim Lighting (viewDir points towards camera from surface)
      #ifdef USE_NORMAL
        vec3 normalDir = normalize(vNormal);
        vec3 viewDir = normalize(-vViewPosition);
        float NdotV = max(0.0, dot(normalDir, viewDir));
        float rimFactor = pow(clamp(1.0 - NdotV, 0.0, 1.0), uRimPower);
        gl_FragColor.rgb += uRimColor * rimFactor * uRimIntensity;
      #endif
      `
    );
  };
}

/**
 * Legacy compatibility wrapper
 */
export function createAnimeToonMaterial(
  config: MonsterMaterialConfig,
  baseMap?: THREE.Texture | null
): THREE.Material {
  const dummyMat = new THREE.MeshStandardMaterial({
    map: baseMap || undefined,
  });
  return upgradeToAnimeMaterial(dummyMat, config);
}
