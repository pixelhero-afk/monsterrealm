/**
 * 2D Monster Sprite Fitting & Normalization Engine
 * Ensures all combat artwork states (Idle, Attack, Hurt, Dead, Victory)
 * have consistent perceived character sizing, proper foot ground alignment,
 * and horizontal centering without distortion, compensating for transparent padding.
 */

export interface CharacterBounds {
  minX: number; // 0 to 1 normalized
  minY: number;
  maxX: number;
  maxY: number;
  contentWidth: number;
  contentHeight: number;
  baselineY: number; // ground contact (feet)
}

export interface SpriteFittingTransform {
  scale: number;
  translateX: number; // percentage of container or px
  translateY: number;
  groundShadowWidth: number; // px for ground shadow
  groundShadowOpacity: number;
}

// In-memory cache for detected image bounds so detection runs only once per URL
const BOUNDS_CACHE = new Map<string, CharacterBounds>();

// Curated baseline specifications for standard roster monsters
// Ensures instantaneous zero-latency rendering with mathematically exact scales
export const MONSTER_FITTING_PROFILES: Record<
  string,
  Record<
    string,
    {
      targetScale: number;
      groundOffsetPx: number; // adjustments to align feet with the ground line
      shadowWidthPx: number;
      isLyingDown?: boolean;
    }
  >
> = {
  fam_pyrosaur: {
    IDLE: { targetScale: 1.0, groundOffsetPx: 0, shadowWidthPx: 96 },
    ATTACK: { targetScale: 1.0, groundOffsetPx: 0, shadowWidthPx: 104 },
    HURT: { targetScale: 1.0, groundOffsetPx: 0, shadowWidthPx: 96 },
    DEAD: { targetScale: 0.95, groundOffsetPx: 2, shadowWidthPx: 120, isLyingDown: true },
    VICTORY: { targetScale: 1.05, groundOffsetPx: 0, shadowWidthPx: 98 },
  },
  fam_nekohime: {
    IDLE: { targetScale: 1.0, groundOffsetPx: 0, shadowWidthPx: 80 },
    ATTACK: { targetScale: 1.0, groundOffsetPx: 0, shadowWidthPx: 90 },
    HURT: { targetScale: 1.0, groundOffsetPx: 0, shadowWidthPx: 80 },
    DEAD: { targetScale: 0.95, groundOffsetPx: 4, shadowWidthPx: 125, isLyingDown: true },
    VICTORY: { targetScale: 1.02, groundOffsetPx: 0, shadowWidthPx: 84 },
  },
};

/**
 * Detect visible character bounds by inspecting non-transparent pixels in an HTMLImageElement
 */
export function detectVisibleBounds(img: HTMLImageElement): CharacterBounds {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || !img.naturalWidth || !img.naturalHeight) {
      return fallbackBounds();
    }

    // Use a downsampled canvas for ultra-fast scanning (max 120px)
    const scanW = Math.min(120, img.naturalWidth);
    const scanH = Math.round((scanW / img.naturalWidth) * img.naturalHeight);
    canvas.width = scanW;
    canvas.height = scanH;

    ctx.drawImage(img, 0, 0, scanW, scanH);
    const imgData = ctx.getImageData(0, 0, scanW, scanH);
    const data = imgData.data;

    let minX = scanW;
    let minY = scanH;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < scanH; y++) {
      for (let x = 0; x < scanW; x++) {
        const idx = (y * scanW + x) * 4;
        const alpha = data[idx + 3];
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Treat white/near-white studio backdrop pixels as non-character background
        const isWhiteBg = (r > 215 && g > 215 && b > 215) || ((r + g + b) / 3 > 220 && Math.max(r, g, b) - Math.min(r, g, b) < 28);

        // Alpha threshold: ignore faint anti-aliasing halos and white backgrounds
        if (alpha > 18 && !isWhiteBg) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      return fallbackBounds();
    }

    return {
      minX: minX / scanW,
      minY: minY / scanH,
      maxX: maxX / scanW,
      maxY: maxY / scanH,
      contentWidth: (maxX - minX + 1) / scanW,
      contentHeight: (maxY - minY + 1) / scanH,
      baselineY: maxY / scanH,
    };
  } catch (err) {
    return fallbackBounds();
  }
}

function fallbackBounds(): CharacterBounds {
  return {
    minX: 0.05,
    minY: 0.05,
    maxX: 0.95,
    maxY: 0.98,
    contentWidth: 0.9,
    contentHeight: 0.93,
    baselineY: 0.98,
  };
}

/**
 * Compute sprite transform to fit cleanly in the 130px x 150px unit window
 */
export function calculateSpriteFitting(
  familyKey: string,
  state: string,
  detectedBounds?: CharacterBounds | null
): SpriteFittingTransform {
  const profile = MONSTER_FITTING_PROFILES[familyKey]?.[state];

  // Base values
  const baseScale = profile?.targetScale ?? 1.0;
  const isLyingDown = profile?.isLyingDown ?? state === 'DEAD';
  const shadowWidth = profile?.shadowWidthPx ?? (isLyingDown ? 120 : 88);

  if (!detectedBounds) {
    return {
      scale: baseScale,
      translateX: 0,
      translateY: profile?.groundOffsetPx ?? 0,
      groundShadowWidth: shadowWidth,
      groundShadowOpacity: isLyingDown ? 0.8 : 0.65,
    };
  }

  // If bounds are known, compensate for excessive transparent padding
  // Normal character content should occupy ~80-88% of vertical container
  const expectedContentHeight = isLyingDown ? 0.55 : 0.84;
  let paddingCompensation = 1.0;

  if (detectedBounds.contentHeight > 0.1 && detectedBounds.contentHeight < 0.75 && !isLyingDown) {
    paddingCompensation = Math.min(1.35, expectedContentHeight / detectedBounds.contentHeight);
  }

  // Calculate vertical alignment so feet align to the bottom
  const bottomPadding = 1.0 - detectedBounds.baselineY;
  const verticalShiftPx = bottomPadding * 50; // Shift down slightly if feet are floating

  return {
    scale: baseScale * paddingCompensation,
    translateX: 0,
    translateY: (profile?.groundOffsetPx ?? 0) + verticalShiftPx,
    groundShadowWidth: shadowWidth,
    groundShadowOpacity: isLyingDown ? 0.8 : 0.65,
  };
}
