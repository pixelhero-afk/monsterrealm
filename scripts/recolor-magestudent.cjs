/**
 * Recolor script for Mage Student elemental variants
 * Converts Light Mage Student sprites into Water, Fire, Grass, and Dark variants
 * Preserves skin tones, facial features, and line-art while transforming
 * robes, wizard hat, hair, magical particles, staff, and arcane crystals.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  h /= 360;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [
    Math.max(0, Math.min(255, Math.round(r * 255))),
    Math.max(0, Math.min(255, Math.round(g * 255))),
    Math.max(0, Math.min(255, Math.round(b * 255)))
  ];
}

function isSkinTone(r, g, b, h, s, l) {
  // Fair skin tone detection (face, hands, neck)
  if (l >= 0.60 && l <= 0.98 && h >= 12 && h <= 36 && s >= 0.14 && s <= 0.60) {
    if (r > g && g > b && (r - g) >= 8 && (g - b) >= 4) {
      return true;
    }
  }
  // Soft cheek blush / lips
  if (l >= 0.52 && l <= 0.82 && (h <= 14 || h >= 348) && s >= 0.28 && s <= 0.70) {
    if (r > g && r > b) {
      return true;
    }
  }
  return false;
}

const ELEMENT_PROFILES = {
  water: {
    name: 'WATER',
    primaryHue: 208,    // Azure & sapphire for robes, wizard hat, and hair
    secondaryHue: 185,  // Cyan / aquamarine for magic sparks and staff crystal
    hueShift: 165,
    satBoost: 1.15,
    tintNeutral: 0.16,
  },
  fire: {
    name: 'FIRE',
    primaryHue: 8,      // Crimson & ruby flame for robes, hat, and hair
    secondaryHue: 34,   // Blazing amber / flame orange for magic glow and crystal
    hueShift: 325,
    satBoost: 1.20,
    tintNeutral: 0.16,
  },
  grass: {
    name: 'GRASS',
    primaryHue: 138,    // Sylvan emerald & jade for robes, hat, and hair
    secondaryHue: 88,   // Vibrant lime & spring blossom for magic sparks and crystal
    hueShift: 95,
    satBoost: 1.15,
    tintNeutral: 0.16,
  },
  dark: {
    name: 'DARK',
    primaryHue: 278,    // Abyssal violet & royal purple for robes, hat, and hair
    secondaryHue: 312,  // Orchid & magenta arcane void glow for magic and crystal
    hueShift: 235,
    satBoost: 1.15,
    tintNeutral: 0.18,
  },
};

async function recolorImage(inputPath, outputPath, elementKey) {
  const profile = ELEMENT_PROFILES[elementKey];
  const image = sharp(inputPath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const outData = Buffer.from(data);

  for (let i = 0; i < outData.length; i += 4) {
    const a = outData[i + 3];
    if (a < 15) continue; // Skip transparency

    const r = outData[i];
    const g = outData[i + 1];
    const b = outData[i + 2];
    const [h, s, l] = rgbToHsl(r, g, b);

    // Keep deep shadows and ink outlines crisp
    if (l < 0.12) continue;

    // Protect fair anime skin tone
    if (isSkinTone(r, g, b, h, s, l)) {
      if (elementKey === 'dark') {
        // Slightly paler/cooler mystical complexion for dark mage
        const [nr, ng, nb] = hslToRgb(h + 4, s * 0.90, Math.min(1, l * 1.02));
        outData[i] = nr;
        outData[i + 1] = ng;
        outData[i + 2] = nb;
      }
      continue;
    }

    if (s > 0.08) {
      let newH = h;
      let newS = s;
      let newL = l;

      // Golden / amber / yellow tones in Light Mage (hair, hat, cape, trims, stars)
      if ((h >= 20 && h <= 80) || (h >= 10 && h < 20 && l > 0.35)) {
        newH = (profile.primaryHue + (h - 45) * 0.60 + 360) % 360;
        newS = Math.min(1, s * profile.satBoost);
      } else if (h >= 160 && h <= 230) {
        // Magic sparks / crystal gems
        newH = profile.secondaryHue;
        newS = Math.min(1, s * 1.25);
      } else {
        newH = (h + profile.hueShift + 360) % 360;
      }

      const [nr, ng, nb] = hslToRgb(newH, newS, newL);
      outData[i] = nr;
      outData[i + 1] = ng;
      outData[i + 2] = nb;
    } else if (l > 0.20 && l < 0.85) {
      // Shaded clothes, neutral fabrics: subtle element tint
      const [nr, ng, nb] = hslToRgb(profile.primaryHue, profile.tintNeutral, l);
      outData[i] = nr;
      outData[i + 1] = ng;
      outData[i + 2] = nb;
    }
  }

  await sharp(outData, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

async function main() {
  const baseDir = path.join(process.cwd(), 'public/assets/characters/magestudent');
  const lightDir = path.join(baseDir, 'light');
  const spriteFiles = ['PORTRAIT.png', 'IDLE.png', 'ATTACK.png', 'HURT.png', 'DEAD.png', 'VICTORY.png'];

  const targetElements = ['water', 'fire', 'grass', 'dark'];

  console.log('Starting Mage Student asset recoloring...');

  for (const elem of targetElements) {
    const elemDir = path.join(baseDir, elem);
    if (!fs.existsSync(elemDir)) {
      fs.mkdirSync(elemDir, { recursive: true });
    }

    console.log(`Processing element: ${elem.toUpperCase()} -> ${elemDir}`);

    for (const file of spriteFiles) {
      const srcPath = path.join(lightDir, file);
      const destPath = path.join(elemDir, file);

      if (!fs.existsSync(srcPath)) {
        console.warn(`Source file not found: ${srcPath}`);
        continue;
      }

      await recolorImage(srcPath, destPath, elem);
      const stats = fs.statSync(destPath);
      console.log(`  ✓ Created ${elem}/${file} (${stats.size} bytes)`);
    }
  }

  console.log('All Mage Student elemental sprites successfully created!');
}

main().catch((err) => {
  console.error('Recoloring error:', err);
  process.exit(1);
});
