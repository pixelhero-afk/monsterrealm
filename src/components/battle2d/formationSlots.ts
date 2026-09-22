/**
 * Formation Slot Positioning System
 * Computes balanced tactical positions for 1 to 5 units for both Player and Enemy teams.
 * Adheres to variable formations:
 * - 1 Unit: Central balanced position
 * - 2 Units: Two vertically balanced positions
 * - 3 Units: Balanced triangle formation (2 Back, 1 Front)
 * - 4 Units: Balanced diamond/quad formation (2 Back, 2 Front)
 * - 5 Units: Full classic 3 Back + 2 Front formation
 */

export interface FormationSlot {
  slotKey: string;
  name: string;
  row: 'BACK' | 'FRONT';
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  scale: number;
  zIndex: number;
}

export const PLAYER_FORMATIONS: Record<number, FormationSlot[]> = {
  1: [
    { slotKey: 'P1', name: 'Center Vanguard', row: 'FRONT', x: 26, y: 50, scale: 1.08, zIndex: 22 },
  ],
  2: [
    { slotKey: 'P1', name: 'Vanguard Top', row: 'FRONT', x: 26, y: 38, scale: 1.04, zIndex: 20 },
    { slotKey: 'P2', name: 'Vanguard Bottom', row: 'FRONT', x: 26, y: 62, scale: 1.04, zIndex: 22 },
  ],
  3: [
    { slotKey: 'P1', name: 'Back Top', row: 'BACK', x: 18, y: 35, scale: 0.94, zIndex: 14 },
    { slotKey: 'P2', name: 'Front Vanguard', row: 'FRONT', x: 30, y: 50, scale: 1.06, zIndex: 24 },
    { slotKey: 'P3', name: 'Back Bottom', row: 'BACK', x: 18, y: 65, scale: 0.94, zIndex: 16 },
  ],
  4: [
    { slotKey: 'P1', name: 'Back Top', row: 'BACK', x: 18, y: 32, scale: 0.94, zIndex: 14 },
    { slotKey: 'P2', name: 'Front Top', row: 'FRONT', x: 31, y: 38, scale: 1.04, zIndex: 22 },
    { slotKey: 'P3', name: 'Front Bottom', row: 'FRONT', x: 31, y: 62, scale: 1.04, zIndex: 24 },
    { slotKey: 'P4', name: 'Back Bottom', row: 'BACK', x: 18, y: 68, scale: 0.94, zIndex: 16 },
  ],
  5: [
    { slotKey: 'P1', name: 'Back Top', row: 'BACK', x: 19, y: 26, scale: 0.92, zIndex: 12 },
    { slotKey: 'P2', name: 'Back Mid', row: 'BACK', x: 14, y: 50, scale: 0.92, zIndex: 14 },
    { slotKey: 'P3', name: 'Back Bottom', row: 'BACK', x: 19, y: 74, scale: 0.92, zIndex: 16 },
    { slotKey: 'P4', name: 'Front Top', row: 'FRONT', x: 34, y: 36, scale: 1.04, zIndex: 24 },
    { slotKey: 'P5', name: 'Front Bottom', row: 'FRONT', x: 34, y: 64, scale: 1.04, zIndex: 26 },
  ],
};

export const ENEMY_FORMATIONS: Record<number, FormationSlot[]> = {
  1: [
    { slotKey: 'E1', name: 'Center Vanguard', row: 'FRONT', x: 74, y: 50, scale: 1.08, zIndex: 22 },
  ],
  2: [
    { slotKey: 'E1', name: 'Vanguard Top', row: 'FRONT', x: 74, y: 38, scale: 1.04, zIndex: 20 },
    { slotKey: 'E2', name: 'Vanguard Bottom', row: 'FRONT', x: 74, y: 62, scale: 1.04, zIndex: 22 },
  ],
  3: [
    { slotKey: 'E1', name: 'Back Top', row: 'BACK', x: 82, y: 35, scale: 0.94, zIndex: 14 },
    { slotKey: 'E2', name: 'Front Vanguard', row: 'FRONT', x: 70, y: 50, scale: 1.06, zIndex: 24 },
    { slotKey: 'E3', name: 'Back Bottom', row: 'BACK', x: 82, y: 65, scale: 0.94, zIndex: 16 },
  ],
  4: [
    { slotKey: 'E1', name: 'Back Top', row: 'BACK', x: 82, y: 32, scale: 0.94, zIndex: 14 },
    { slotKey: 'E2', name: 'Front Top', row: 'FRONT', x: 69, y: 38, scale: 1.04, zIndex: 22 },
    { slotKey: 'E3', name: 'Front Bottom', row: 'FRONT', x: 69, y: 62, scale: 1.04, zIndex: 24 },
    { slotKey: 'E4', name: 'Back Bottom', row: 'BACK', x: 82, y: 68, scale: 0.94, zIndex: 16 },
  ],
  5: [
    { slotKey: 'E1', name: 'Back Top', row: 'BACK', x: 81, y: 26, scale: 0.92, zIndex: 12 },
    { slotKey: 'E2', name: 'Back Mid', row: 'BACK', x: 86, y: 50, scale: 0.92, zIndex: 14 },
    { slotKey: 'E3', name: 'Back Bottom', row: 'BACK', x: 81, y: 74, scale: 0.92, zIndex: 16 },
    { slotKey: 'E4', name: 'Front Top', row: 'FRONT', x: 66, y: 36, scale: 1.04, zIndex: 24 },
    { slotKey: 'E5', name: 'Front Bottom', row: 'FRONT', x: 66, y: 64, scale: 1.04, zIndex: 26 },
  ],
};

// Default 5v5 slots for backward compatibility
export const PLAYER_FORMATION_SLOTS: FormationSlot[] = PLAYER_FORMATIONS[5];
export const ENEMY_FORMATION_SLOTS: FormationSlot[] = ENEMY_FORMATIONS[5];

/**
 * Retrieve the active balanced formation slots for a given unit count (1-5)
 */
export function getFormationSlots(count: number, isPlayer: boolean): FormationSlot[] {
  const safeCount = Math.max(1, Math.min(5, count || 1));
  const formations = isPlayer ? PLAYER_FORMATIONS : ENEMY_FORMATIONS;
  return formations[safeCount] || formations[5];
}
