/**
 * Battle Sprite Transparency Service
 * Automatically detects and makes white/near-white backgrounds invisible for combat sprites,
 * guaranteeing that only the character silhouette appears seamlessly on the battlefield.
 */

import { useState, useEffect } from 'react';

// In-memory cache for processed transparent data URLs to ensure 0ms instantaneous re-renders
const transparentSpriteCache = new Map<string, string>();
const processingPromises = new Map<string, Promise<string>>();

/**
 * Checks if an RGB color qualifies as a white or studio off-white background pixel
 */
function isWhiteOrStudioBackground(r: number, g: number, b: number, a: number): boolean {
  // If already transparent or semi-transparent, treat as non-opaque background
  if (a < 30) return true;

  // Pure or near pure white (RGB >= 205)
  if (r >= 205 && g >= 205 && b >= 205) {
    return true;
  }

  // Light neutral / studio gray / off-white compression backdrop (e.g. RGB [233, 233, 233])
  const avg = (r + g + b) / 3;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const colorVariance = max - min;

  // Very light with low color saturation
  if (avg >= 210 && colorVariance < 32) {
    return true;
  }

  return false;
}

/**
 * Performs perimeter-seeded flood-fill to turn exterior white background pixels transparent (alpha = 0).
 * Strictly preserves internal white details (such as eyes, teeth, white fur markings, or belly patterns)
 * because the fill strictly propagates from the outer image borders inwards.
 */
export function removeWhiteBackgroundFromCanvas(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || canvas.width === 0 || canvas.height === 0) return false;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 1. First examine perimeter pixels to determine if the image actually has an opaque white background
  let transparentBorderCount = 0;
  let whiteBorderCount = 0;
  const sampleStep = Math.max(1, Math.floor(Math.min(w, h) / 60));
  let totalBorderSamples = 0;

  for (let x = 0; x < w; x += sampleStep) {
    const topIdx = x * 4;
    const botIdx = ((h - 1) * w + x) * 4;
    totalBorderSamples += 2;

    if (data[topIdx + 3] < 30) transparentBorderCount++;
    else if (isWhiteOrStudioBackground(data[topIdx], data[topIdx + 1], data[topIdx + 2], data[topIdx + 3])) whiteBorderCount++;

    if (data[botIdx + 3] < 30) transparentBorderCount++;
    else if (isWhiteOrStudioBackground(data[botIdx], data[botIdx + 1], data[botIdx + 2], data[botIdx + 3])) whiteBorderCount++;
  }

  for (let y = 0; y < h; y += sampleStep) {
    const leftIdx = (y * w) * 4;
    const rightIdx = (y * w + (w - 1)) * 4;
    totalBorderSamples += 2;

    if (data[leftIdx + 3] < 30) transparentBorderCount++;
    else if (isWhiteOrStudioBackground(data[leftIdx], data[leftIdx + 1], data[leftIdx + 2], data[leftIdx + 3])) whiteBorderCount++;

    if (data[rightIdx + 3] < 30) transparentBorderCount++;
    else if (isWhiteOrStudioBackground(data[rightIdx], data[rightIdx + 1], data[rightIdx + 2], data[rightIdx + 3])) whiteBorderCount++;
  }

  // If the image already has mostly transparent borders (> 65%), it's already a clean cutout
  if (transparentBorderCount > totalBorderSamples * 0.65) {
    return false;
  }

  // If there are hardly any white borders (< 15%), it's not a white-background sprite
  if (whiteBorderCount < totalBorderSamples * 0.15 && transparentBorderCount === 0) {
    // Might be another solid color, but user specifically asked for white background
    // If whiteBorderCount > 0, we still clean connected white edge regions
  }

  // 2. Flood-fill from all 4 borders
  const totalPixels = w * h;
  const visited = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let queueHead = 0;
  let queueTail = 0;

  // Seed top and bottom borders
  for (let x = 0; x < w; x++) {
    const top = x;
    const bot = (h - 1) * w + x;
    const topIdx = top * 4;
    const botIdx = bot * 4;

    if (!visited[top] && isWhiteOrStudioBackground(data[topIdx], data[topIdx + 1], data[topIdx + 2], data[topIdx + 3])) {
      visited[top] = 1;
      queue[queueTail++] = top;
    }
    if (!visited[bot] && isWhiteOrStudioBackground(data[botIdx], data[botIdx + 1], data[botIdx + 2], data[botIdx + 3])) {
      visited[bot] = 1;
      queue[queueTail++] = bot;
    }
  }

  // Seed left and right borders
  for (let y = 0; y < h; y++) {
    const left = y * w;
    const right = y * w + (w - 1);
    const leftIdx = left * 4;
    const rightIdx = right * 4;

    if (!visited[left] && isWhiteOrStudioBackground(data[leftIdx], data[leftIdx + 1], data[leftIdx + 2], data[leftIdx + 3])) {
      visited[left] = 1;
      queue[queueTail++] = left;
    }
    if (!visited[right] && isWhiteOrStudioBackground(data[rightIdx], data[rightIdx + 1], data[rightIdx + 2], data[rightIdx + 3])) {
      visited[right] = 1;
      queue[queueTail++] = right;
    }
  }

  if (queueTail === 0) {
    return false;
  }

  // Process queue (BFS)
  while (queueHead < queueTail) {
    const curr = queue[queueHead++];
    const px = curr % w;
    const py = Math.floor(curr / w);

    // Make pixel fully transparent
    const idx = curr * 4;
    data[idx + 3] = 0;

    // Check 4-connected neighbors
    // Left
    if (px > 0) {
      const n = curr - 1;
      if (!visited[n]) {
        visited[n] = 1;
        const nIdx = n * 4;
        if (isWhiteOrStudioBackground(data[nIdx], data[nIdx + 1], data[nIdx + 2], data[nIdx + 3])) {
          queue[queueTail++] = n;
        }
      }
    }
    // Right
    if (px < w - 1) {
      const n = curr + 1;
      if (!visited[n]) {
        visited[n] = 1;
        const nIdx = n * 4;
        if (isWhiteOrStudioBackground(data[nIdx], data[nIdx + 1], data[nIdx + 2], data[nIdx + 3])) {
          queue[queueTail++] = n;
        }
      }
    }
    // Up
    if (py > 0) {
      const n = curr - w;
      if (!visited[n]) {
        visited[n] = 1;
        const nIdx = n * 4;
        if (isWhiteOrStudioBackground(data[nIdx], data[nIdx + 1], data[nIdx + 2], data[nIdx + 3])) {
          queue[queueTail++] = n;
        }
      }
    }
    // Down
    if (py < h - 1) {
      const n = curr + w;
      if (!visited[n]) {
        visited[n] = 1;
        const nIdx = n * 4;
        if (isWhiteOrStudioBackground(data[nIdx], data[nIdx + 1], data[nIdx + 2], data[nIdx + 3])) {
          queue[queueTail++] = n;
        }
      }
    }
  }

  // 3. Edge anti-aliasing & matte de-fringing pass:
  // For pixels adjacent to transparent background, soften high luminance fringes so no white outline persists
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const idx = p * 4;
      const alpha = data[idx + 3];

      if (alpha > 0) {
        // Check if adjacent to a pixel made transparent
        const hasTransparentNeighbor =
          data[(p - 1) * 4 + 3] === 0 ||
          data[(p + 1) * 4 + 3] === 0 ||
          data[(p - w) * 4 + 3] === 0 ||
          data[(p + w) * 4 + 3] === 0;

        if (hasTransparentNeighbor) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const avg = (r + g + b) / 3;

          // If adjacent pixel is very light (white fringe), fade alpha and decontaminate
          if (avg > 195) {
            const factor = Math.max(0, Math.min(1, (255 - avg) / 60));
            data[idx + 3] = Math.round(alpha * factor);
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return true;
}

/**
 * Processes an image URL and returns a transparent PNG Data URL
 */
export async function processBattleSpriteUrl(url: string): Promise<string> {
  if (!url) return url;

  // Check memory cache
  if (transparentSpriteCache.has(url)) {
    return transparentSpriteCache.get(url)!;
  }

  // Avoid duplicate concurrent processing of same URL
  if (processingPromises.has(url)) {
    return processingPromises.get(url)!;
  }

  const promise = new Promise<string>((resolve) => {
    // If it's already an SVG or empty, return as is
    if (url.startsWith('data:image/svg+xml')) {
      transparentSpriteCache.set(url, url);
      resolve(url);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      try {
        if (!img.naturalWidth || !img.naturalHeight) {
          transparentSpriteCache.set(url, url);
          resolve(url);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          transparentSpriteCache.set(url, url);
          resolve(url);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const modified = removeWhiteBackgroundFromCanvas(canvas);

        if (modified) {
          const transparentDataUrl = canvas.toDataURL('image/png');
          transparentSpriteCache.set(url, transparentDataUrl);
          resolve(transparentDataUrl);
        } else {
          // Already transparent or unaffected
          transparentSpriteCache.set(url, url);
          resolve(url);
        }
      } catch (err) {
        console.warn('[BattleSpriteTransparency] Processing error, using original asset:', err);
        transparentSpriteCache.set(url, url);
        resolve(url);
      }
    };

    img.onerror = () => {
      // If load fails, resolve original URL so standard fallback can handle it
      transparentSpriteCache.set(url, url);
      resolve(url);
    };

    img.src = url;
  });

  processingPromises.set(url, promise);

  try {
    const result = await promise;
    return result;
  } finally {
    processingPromises.delete(url);
  }
}

/**
 * React Hook that automatically guarantees combat sprites have transparent backgrounds during battle
 */
export function useBattleTransparentSprite(assetUrl: string | null): string | null {
  // If already in cache, initialize with the transparent version immediately
  const initial = assetUrl ? transparentSpriteCache.get(assetUrl) || assetUrl : null;
  const [spriteUrl, setSpriteUrl] = useState<string | null>(initial);

  useEffect(() => {
    if (!assetUrl) {
      setSpriteUrl(null);
      return;
    }

    // If already cached, sync immediately
    if (transparentSpriteCache.has(assetUrl)) {
      setSpriteUrl(transparentSpriteCache.get(assetUrl)!);
      return;
    }

    let isMounted = true;
    processBattleSpriteUrl(assetUrl).then((processed) => {
      if (isMounted) {
        setSpriteUrl(processed);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [assetUrl]);

  return spriteUrl;
}
