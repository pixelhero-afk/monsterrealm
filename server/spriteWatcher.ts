/**
 * Monster Realms - Automatic Character Asset File Watcher
 * 
 * Monitors public/assets/characters/ for newly added or modified PNG files.
 * Automatically triggers standardization, bounds detection, scaling, and registration.
 */

import fs from 'fs';
import path from 'path';
import { spriteStandardizer } from './spriteStandardizer';

const WATCH_DIR = path.join(process.cwd(), 'public/assets/characters');

export class SpriteWatcher {
  private watcher: fs.FSWatcher | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  public start(): void {
    if (this.isRunning) return;

    if (!fs.existsSync(WATCH_DIR)) {
      fs.mkdirSync(WATCH_DIR, { recursive: true });
    }

    try {
      console.log(`[SpriteWatcher] Initializing watcher on: ${WATCH_DIR}`);

      // Perform initial scan
      spriteStandardizer.scanAndStandardizeAll().catch((err) => {
        console.error('[SpriteWatcher] Initial scan error:', err);
      });

      this.watcher = fs.watch(
        WATCH_DIR,
        { recursive: true },
        (eventType: string, filename: string | null) => {
          if (!filename) return;

          // Normalize filename
          const norm = filename.replace(/\\/g, '/');

          // Ignore non-PNG files, hidden files, READMEs, and the standardized folder itself
          if (!/\.png$/i.test(norm)) return;
          if (norm.includes('.standardized') || norm.includes('standardized')) return;

          const fullPath = path.join(WATCH_DIR, norm);

          // Debounce rapid write events
          const existing = this.debounceTimers.get(fullPath);
          if (existing) {
            clearTimeout(existing);
          }

          const timer = setTimeout(async () => {
            this.debounceTimers.delete(fullPath);
            try {
              if (fs.existsSync(fullPath)) {
                const stat = fs.statSync(fullPath);
                // Ensure file is not 0 bytes (still writing)
                if (stat.size > 0) {
                  console.log(`[SpriteWatcher] ⚡ New/modified character asset detected: ${norm}`);
                  await spriteStandardizer.standardizeFile(fullPath, { force: true });
                }
              }
            } catch (err: any) {
              console.error(`[SpriteWatcher] Error processing detected file ${norm}:`, err.message);
            }
          }, 350);

          this.debounceTimers.set(fullPath, timer);
        }
      );

      this.isRunning = true;
      console.log('[SpriteWatcher] ✓ File watcher active and monitoring character asset folders.');
    } catch (err: any) {
      console.error('[SpriteWatcher] Failed to start filesystem watcher:', err.message);
    }
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.isRunning = false;
    console.log('[SpriteWatcher] Watcher stopped.');
  }
}

export const spriteWatcher = new SpriteWatcher();
