/**
 * Character Asset Startup Diagnostics & Integrity Validator
 * Validates that all canonical character PNG assets exist and reports exact status.
 *
 * Example Console Output:
 * Character Assets
 * Pyrosaur
 * ✓ IDLE
 * ✓ ATTACK
 * ✓ HURT
 * ✓ DEFEATED
 * ✓ VICTORY
 *
 * If an asset is missing:
 * MISSING:
 *  /assets/characters/nekohime/HURT.png
 */

import { CANONICAL_CHARACTER_ASSETS } from './monsterAssetManifest';

export interface AssetCheckResult {
  path: string;
  exists: boolean;
  state: string;
}

export interface MonsterAssetReport {
  id: string;
  name: string;
  portrait: { path: string; exists: boolean };
  states: Record<string, AssetCheckResult>;
  allValid: boolean;
}

const probedCache = new Map<string, boolean>();

/**
 * Check if an image URL is accessible via fetch HEAD or Image probe.
 */
export async function verifyAssetExists(url: string): Promise<boolean> {
  if (!url) return false;
  if (probedCache.has(url)) return probedCache.get(url)!;

  try {
    // Try HEAD request first
    const res = await fetch(url, { method: 'HEAD' });
    if (res.ok) {
      probedCache.set(url, true);
      return true;
    }
  } catch {
    // Fall back to Image probe
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      probedCache.set(url, true);
      resolve(true);
    };
    img.onerror = () => {
      probedCache.set(url, false);
      resolve(false);
    };
    img.src = url;
  });
}

/**
 * Runs startup diagnostics for all canonical character assets.
 * Prints clean, formatted summary to the console.
 */
export async function runCharacterAssetDiagnostics(): Promise<MonsterAssetReport[]> {
  const reports: MonsterAssetReport[] = [];
  const missingList: string[] = [];

  console.log('%c[Monster Realms] Character Assets Diagnostic Check...', 'font-weight: bold; color: #f59e0b;');

  for (const entry of Object.values(CANONICAL_CHARACTER_ASSETS)) {
    const stateKeys: Array<'idle' | 'attack' | 'hurt' | 'defeated' | 'victory'> = [
      'idle',
      'attack',
      'hurt',
      'defeated',
      'victory',
    ];

    const statesReport: Record<string, AssetCheckResult> = {};
    let monsterValid = true;

    // Check combat states
    for (const st of stateKeys) {
      const p = entry.visuals[st];
      const exists = await verifyAssetExists(p);
      const upperState = st.toUpperCase();
      statesReport[upperState] = { path: p, exists, state: upperState };
      if (!exists) {
        monsterValid = false;
        missingList.push(p);
      }
    }

    // Check portrait
    const portraitExists = await verifyAssetExists(entry.portrait);

    const report: MonsterAssetReport = {
      id: entry.id,
      name: entry.name,
      portrait: { path: entry.portrait, exists: portraitExists },
      states: statesReport,
      allValid: monsterValid,
    };
    reports.push(report);

    // Formatted output
    const lines = [`${entry.name}`];
    for (const [state, res] of Object.entries(statesReport)) {
      lines.push(`  ${res.exists ? '✓' : '✗'} ${state}`);
    }
    console.log(lines.join('\n'));
  }

  if (missingList.length > 0) {
    console.warn(
      `%c[Monster Realms] MISSING ASSETS:\n${missingList.map((m) => ` ${m}`).join('\n')}`,
      'color: #ef4444; font-weight: bold;'
    );
  } else {
    console.log('%c[Monster Realms] All character combat assets verified intact!', 'color: #10b981; font-weight: bold;');
  }

  return reports;
}
