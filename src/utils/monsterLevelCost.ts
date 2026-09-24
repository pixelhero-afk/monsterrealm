/**
 * Monster Level Up Cost Calculation
 * Gold cost increases progressively as monster level rises:
 * Lv 1-10: 250 - 500 gold
 * Lv 11-20: 600 - 1,500 gold
 * Lv 21-30: 1,800 - 4,500 gold
 * Lv 31-40: 5,000 - 12,000 gold
 */

export function getMonsterLevelUpCost(currentLevel: number): number {
  if (currentLevel < 1) currentLevel = 1;
  // Quadratic scaling: base 250 + (level^1.55)*120 roughly matches RPG progression curve
  const scaled = Math.round(250 + Math.pow(currentLevel, 1.6) * 45);
  return Math.max(250, Math.round(scaled / 10) * 10);
}

export function getTotalLevelUpCost(currentLevel: number, count: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += getMonsterLevelUpCost(currentLevel + i);
  }
  return total;
}
