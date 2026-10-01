/**
 * Monster Realms - Automatic Character PNG Standardization Engine
 * 
 * Automatically detects, validates, scales, centers, and standardizes all
 * character artwork PNGs into a 1024x1024 standard canvas with transparent background.
 * Preserves 100% of original source files in public/assets/characters/.
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export interface SpriteStandardizerResult {
  id: string; // e.g. "pyrosaur_fire_ATTACK"
  sourcePath: string; // e.g. "public/assets/characters/pyrosaur/fire/ATTACK.png"
  relPath: string; // e.g. "pyrosaur/fire/ATTACK.png"
  standardizedPath: string; // e.g. "public/assets/standardized/characters/pyrosaur/fire/ATTACK.png"
  standardizedUrl: string; // e.g. "/assets/standardized/characters/pyrosaur/fire/ATTACK.png"
  monster: string; // e.g. "pyrosaur"
  element: string; // e.g. "fire"
  state: string; // "IDLE" | "ATTACK" | "HURT" | "DEAD" | "VICTORY" | "PORTRAIT"
  originalWidth: number;
  originalHeight: number;
  visibleBounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
  standardizedWidth: number; // 1024
  standardizedHeight: number; // 1024
  visibleScaledWidth: number;
  visibleScaledHeight: number;
  scaleApplied: number;
  hasTransparency: boolean;
  transparencyAutoKeyed?: boolean;
  status: 'READY' | 'WARNING' | 'ERROR';
  warnings: string[];
  processedAt: number;
  sourceMtime: number;
  sourceSize: number;
}

export interface StandardizerManifest {
  version: string;
  lastUpdated: number;
  targetCanvas: { width: number; height: number };
  targetHeightPercent: number;
  sprites: Record<string, SpriteStandardizerResult>;
}

const CANONICAL_DIR = path.join(process.cwd(), 'public/assets/characters');
const STANDARDIZED_DIR = path.join(process.cwd(), 'public/assets/standardized/characters');
const MANIFEST_PATH = path.join(process.cwd(), 'public/assets/standardized/manifest.json');

const CANVAS_SIZE = 1024;
const COMBAT_TARGET_HEIGHT_PCT = 0.85; // 85% of canvas height (~870px)
const COMBAT_MAX_WIDTH_PCT = 0.88; // 88% max width (~900px)
const PORTRAIT_TARGET_PCT = 0.86;

const KNOWN_STATES: Record<string, string> = {
  idle: 'IDLE',
  attack: 'ATTACK',
  hurt: 'HURT',
  dead: 'DEAD',
  defeated: 'DEAD',
  victory: 'VICTORY',
  portrait: 'PORTRAIT',
};

const MONSTER_NAME_ALIASES: Record<string, string> = {
  pysaur: 'pyrosaur',
  pyro: 'pyrosaur',
  neko: 'nekohime',
  hime: 'nekohime',
  shadow: 'shadowstalker',
  stalker: 'shadowstalker',
  tide: 'tideguard',
  guard: 'tideguard',
  flora: 'floraweaver',
  weaver: 'floraweaver',
};

export class SpriteStandardizer {
  private manifest: StandardizerManifest;

  constructor() {
    this.manifest = this.loadManifest();
  }

  private loadManifest(): StandardizerManifest {
    try {
      if (fs.existsSync(MANIFEST_PATH)) {
        const raw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[Standardizer] Could not load manifest, creating new:', e);
    }
    return {
      version: '1.0.0',
      lastUpdated: Date.now(),
      targetCanvas: { width: CANVAS_SIZE, height: CANVAS_SIZE },
      targetHeightPercent: COMBAT_TARGET_HEIGHT_PCT,
      sprites: {},
    };
  }

  public saveManifest(): void {
    try {
      const dir = path.dirname(MANIFEST_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.manifest.lastUpdated = Date.now();
      fs.writeFileSync(MANIFEST_PATH, JSON.stringify(this.manifest, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Standardizer] Failed to save manifest:', e);
    }
  }

  public getManifest(): StandardizerManifest {
    return this.manifest;
  }

  public removeSprite(relPath: string): boolean {
    const norm = relPath.replace(/\\/g, '/').toLowerCase();
    const keysToDelete: string[] = [];
    for (const [id, sprite] of Object.entries(this.manifest.sprites)) {
      const spriteNorm = sprite.relPath.replace(/\\/g, '/').toLowerCase();
      if (spriteNorm === norm || spriteNorm.endsWith(norm) || norm.endsWith(spriteNorm)) {
        keysToDelete.push(id);
      }
    }
    keysToDelete.forEach((k) => delete this.manifest.sprites[k]);
    if (keysToDelete.length > 0) {
      this.saveManifest();
      return true;
    }
    return false;
  }

  public removeCharacterSprites(monster: string, element: string): number {
    const cleanM = monster.toLowerCase().trim();
    const cleanE = element.toLowerCase().trim();
    const keysToDelete: string[] = [];
    for (const [id, sprite] of Object.entries(this.manifest.sprites)) {
      if (sprite.monster.toLowerCase() === cleanM && sprite.element.toLowerCase() === cleanE) {
        keysToDelete.push(id);
      }
    }
    keysToDelete.forEach((k) => delete this.manifest.sprites[k]);
    if (keysToDelete.length > 0) {
      this.saveManifest();
    }
    return keysToDelete.length;
  }

  /**
   * Determine monster, element, and state from relative path
   * e.g. "pyrosaur/fire/ATTACK.png" or "characters/nekohime/grass/idle.png"
   */
  public parsePathInfo(filePath: string): {
    monster: string;
    element: string;
    state: string;
    relPath: string;
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const normalized = filePath.replace(/\\/g, '/');
    let sub = normalized;
    const marker = 'public/assets/characters/';
    const idx = normalized.indexOf(marker);
    if (idx !== -1) {
      sub = normalized.substring(idx + marker.length);
    }

    const parts = sub.split('/').filter(Boolean);
    if (parts.length < 3) {
      return {
        monster: parts[0] || 'unknown',
        element: parts[1] || 'unknown',
        state: 'UNKNOWN',
        relPath: sub,
        valid: false,
        errors: ['Path must be in the format: public/assets/characters/{monster}/{element}/{STATE}.png'],
      };
    }

    const rawMonster = parts[0].toLowerCase();
    const monster = MONSTER_NAME_ALIASES[rawMonster] || rawMonster;
    const element = parts[1].toLowerCase();
    const filename = parts[parts.length - 1];
    const basename = path.basename(filename, path.extname(filename)).toLowerCase();

    const state = KNOWN_STATES[basename] || basename.toUpperCase();

    if (!KNOWN_STATES[basename]) {
      errors.push(`Unrecognized state filename "${filename}". Expected one of: PORTRAIT, IDLE, ATTACK, HURT, DEAD, VICTORY.`);
    }

    return {
      monster,
      element,
      state,
      relPath: `${monster}/${element}/${state}.png`,
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Process a single PNG file into 1024x1024 standardized format
   */
  public async standardizeFile(
    sourceFilePath: string,
    options: { force?: boolean } = {}
  ): Promise<SpriteStandardizerResult> {
    const warnings: string[] = [];

    if (!fs.existsSync(sourceFilePath)) {
      throw new Error(`Source file does not exist: ${sourceFilePath}`);
    }

    const stat = fs.statSync(sourceFilePath);
    if (stat.size === 0) {
      throw new Error(`Source file is empty (0 bytes): ${sourceFilePath}`);
    }

    const info = this.parsePathInfo(sourceFilePath);
    const spriteId = `${info.monster}_${info.element}_${info.state}`.toLowerCase();

    // Check if up-to-date in manifest
    const cached = this.manifest.sprites[spriteId];
    if (
      !options.force &&
      cached &&
      cached.sourceMtime === stat.mtimeMs &&
      cached.sourceSize === stat.size &&
      fs.existsSync(cached.standardizedPath)
    ) {
      return cached;
    }

    // Read metadata with sharp
    let image = sharp(sourceFilePath);
    const meta = await image.metadata();

    if (!meta.width || !meta.height) {
      throw new Error(`Unable to read image dimensions for ${sourceFilePath}`);
    }

    const originalWidth = meta.width;
    const originalHeight = meta.height;

    // Extract raw RGBA pixel data to find true visible character bounds
    const { data, info: rawInfo } = await image.raw().toBuffer({ resolveWithObject: true });
    const channels = rawInfo.channels;

    let minX = rawInfo.width;
    let minY = rawInfo.height;
    let maxX = -1;
    let maxY = -1;
    let hasTransparency = meta.hasAlpha || channels === 4;
    let nonOpaqueCount = 0;

    // Scan pixels for non-transparent bounding box (alpha > 15)
    for (let y = 0; y < rawInfo.height; y++) {
      for (let x = 0; x < rawInfo.width; x++) {
        const idx = (y * rawInfo.width + x) * channels;
        const alpha = channels === 4 ? data[idx + 3] : 255;
        if (alpha < 250) {
          nonOpaqueCount++;
        }
        if (alpha > 15) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    let transparencyAutoKeyed = false;

    // If image has no transparency (or 100% opaque), check if it has a solid background color
    if (!hasTransparency || nonOpaqueCount < 10) {
      warnings.push('No transparent background detected in source image.');
      // Check corners for uniform solid color (e.g. pure white, pure black)
      const tl = [data[0], data[1], data[2]];
      const trIdx = (rawInfo.width - 1) * channels;
      const tr = [data[trIdx], data[trIdx + 1], data[trIdx + 2]];
      const blIdx = ((rawInfo.height - 1) * rawInfo.width) * channels;
      const bl = [data[blIdx], data[blIdx + 1], data[blIdx + 2]];

      const isCornerMatch =
        Math.abs(tl[0] - tr[0]) < 10 &&
        Math.abs(tl[1] - tr[1]) < 10 &&
        Math.abs(tl[2] - tr[2]) < 10 &&
        Math.abs(tl[0] - bl[0]) < 10 &&
        Math.abs(tl[1] - bl[1]) < 10 &&
        Math.abs(tl[2] - bl[2]) < 10;

      if (isCornerMatch && (tl[0] > 240 || tl[0] < 15)) {
        // Automatically key out this solid background
        const bgR = tl[0], bgG = tl[1], bgB = tl[2];
        const keyedBuffer = Buffer.from(data);
        for (let i = 0; i < keyedBuffer.length; i += channels) {
          const r = keyedBuffer[i];
          const g = keyedBuffer[i + 1];
          const b = keyedBuffer[i + 2];
          if (Math.abs(r - bgR) < 18 && Math.abs(g - bgG) < 18 && Math.abs(b - bgB) < 18) {
            if (channels === 4) {
              keyedBuffer[i + 3] = 0;
            }
          }
        }
        image = sharp(keyedBuffer, {
          raw: { width: rawInfo.width, height: rawInfo.height, channels: channels as 3 | 4 },
        });
        hasTransparency = true;
        transparencyAutoKeyed = true;
        warnings.push(`Auto-keyed solid background color (rgb: ${bgR}, ${bgG}, ${bgB}).`);
      }
    }

    // If completely empty or invalid bounds, fallback to full image
    if (maxX < minX || maxY < minY) {
      minX = 0;
      minY = 0;
      maxX = originalWidth - 1;
      maxY = originalHeight - 1;
      warnings.push('Visible character bounds could not be determined. Using full image area.');
    }

    const charWidth = maxX - minX + 1;
    const charHeight = maxY - minY + 1;

    // Target scale calculation:
    // For combat states: target visible character to ~85% of canvas height (870.4px)
    // Constrain width to 88% (900px) so wide stances/tails/wings are never cropped.
    const isPortrait = info.state === 'PORTRAIT';
    const targetHeight = isPortrait ? CANVAS_SIZE * PORTRAIT_TARGET_PCT : CANVAS_SIZE * COMBAT_TARGET_HEIGHT_PCT;
    const targetMaxWidth = CANVAS_SIZE * COMBAT_MAX_WIDTH_PCT;

    const scale = Math.min(targetHeight / charHeight, targetMaxWidth / charWidth);
    const visibleScaledWidth = Math.max(1, Math.round(charWidth * scale));
    const visibleScaledHeight = Math.max(1, Math.round(charHeight * scale));

    // Extract exactly the visible character area from source
    const croppedBuffer = await sharp(sourceFilePath)
      .extract({ left: minX, top: minY, width: charWidth, height: charHeight })
      .resize(visibleScaledWidth, visibleScaledHeight, {
        fit: 'contain',
        kernel: sharp.kernel.lanczos3,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    // Center in 1024x1024 canvas
    const left = Math.round((CANVAS_SIZE - visibleScaledWidth) / 2);
    const top = Math.round((CANVAS_SIZE - visibleScaledHeight) / 2);

    // Composite onto 1024x1024 transparent canvas
    const standardizedBuffer = await sharp({
      create: {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: croppedBuffer, top: Math.max(0, top), left: Math.max(0, left) }])
      .png({ compressionLevel: 8 })
      .toBuffer();

    // Ensure output directory exists
    const outRelDir = path.join(info.monster, info.element);
    const outFullDir = path.join(STANDARDIZED_DIR, outRelDir);
    if (!fs.existsSync(outFullDir)) {
      fs.mkdirSync(outFullDir, { recursive: true });
    }

    const outFilename = `${info.state}.png`;
    const standardizedPath = path.join(outFullDir, outFilename);
    fs.writeFileSync(standardizedPath, standardizedBuffer);

    const standardizedUrl = `/assets/standardized/characters/${info.monster}/${info.element}/${outFilename}`;

    const result: SpriteStandardizerResult = {
      id: spriteId,
      sourcePath: sourceFilePath,
      relPath: `${info.monster}/${info.element}/${info.state}.png`,
      standardizedPath,
      standardizedUrl,
      monster: info.monster,
      element: info.element,
      state: info.state,
      originalWidth,
      originalHeight,
      visibleBounds: {
        minX,
        minY,
        maxX,
        maxY,
        width: charWidth,
        height: charHeight,
      },
      standardizedWidth: CANVAS_SIZE,
      standardizedHeight: CANVAS_SIZE,
      visibleScaledWidth,
      visibleScaledHeight,
      scaleApplied: Number(scale.toFixed(3)),
      hasTransparency,
      transparencyAutoKeyed,
      status: warnings.length > 0 ? 'WARNING' : 'READY',
      warnings,
      processedAt: Date.now(),
      sourceMtime: stat.mtimeMs,
      sourceSize: stat.size,
    };

    this.manifest.sprites[spriteId] = result;
    this.saveManifest();

    console.log(
      `[Standardizer] ✓ Standardized ${info.monster}/${info.element}/${info.state}: ` +
        `orig(${originalWidth}x${originalHeight}) -> bounds(${charWidth}x${charHeight}) -> scale(${scale.toFixed(2)}) -> 1024x1024`
    );

    return result;
  }

  /**
   * Scan entire public/assets/characters folder and standardize all PNGs
   */
  public async scanAndStandardizeAll(options: { force?: boolean } = {}): Promise<SpriteStandardizerResult[]> {
    const results: SpriteStandardizerResult[] = [];
    if (!fs.existsSync(CANONICAL_DIR)) {
      console.warn(`[Standardizer] Canonical directory does not exist: ${CANONICAL_DIR}`);
      return results;
    }

    const scanDirectory = (dir: string): string[] => {
      let files: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          // Skip standardized dir if inside
          if (entry.name === '.standardized' || entry.name === 'standardized') continue;
          files = files.concat(scanDirectory(fullPath));
        } else if (entry.isFile() && /\.png$/i.test(entry.name)) {
          files.push(fullPath);
        }
      }
      return files;
    };

    const pngFiles = scanDirectory(CANONICAL_DIR);
    console.log(`[Standardizer] Found ${pngFiles.length} character PNGs to check in ${CANONICAL_DIR}`);

    for (const f of pngFiles) {
      try {
        const res = await this.standardizeFile(f, options);
        results.push(res);
      } catch (err: any) {
        console.error(`[Standardizer] Error standardizing ${f}:`, err.message);
      }
    }

    return results;
  }
}

export const spriteStandardizer = new SpriteStandardizer();
