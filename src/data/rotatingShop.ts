/**
 * 24-Hour Rotating Magic Shop Generator
 * Generates 4 items at random every 24 hours:
 * - Normal Scroll
 * - Epic Scroll (very small chance)
 * - Common Grade Equipment
 * - Stamina Refills
 * - Elemental Stones
 */

import { ShopItem, ShopItemType, RotatingShopData, ElementalDungeonType, EquipmentSlot, EquipmentItem } from '../types';
import { rollEquipmentPiece, EQUIPMENT_SET_BONUSES } from './equipment';

export const ROTATION_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 Hours

const ELEMENT_CHOICES: ElementalDungeonType[] = ['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK', 'MAGIC'];
const SLOT_CHOICES: EquipmentSlot[] = ['WEAPON', 'ARMOR', 'HELM', 'BOOTS'];

function formatEquipmentStatLabel(stat: string, value: number, isPercent: boolean): string {
  const statLabels: Record<string, string> = {
    hp: 'Health',
    attack: 'Attack',
    defense: 'Defense',
    speed: 'Speed',
    critRate: 'Crit Rate',
    critDamage: 'Crit DMG',
    accuracy: 'Accuracy',
    resistance: 'Resistance',
    healingDone: 'Healing',
    shieldingDone: 'Shielding',
  };
  const label = statLabels[stat] || stat.toUpperCase();
  const valStr = isPercent ? `+${Math.round(value * 100)}%` : `+${value}`;
  return `${label} ${valStr}`;
}

export function generateDailyShopItems(): ShopItem[] {
  const items: ShopItem[] = [];
  const chosenTypes: Set<string> = new Set();

  for (let slotIndex = 0; slotIndex < 4; slotIndex++) {
    // Determine item category for this slot
    // Epic scroll has a very small chance (~5-8% on any roll)
    const roll = Math.random();
    let type: ShopItemType = 'NORMAL_SCROLL' as any;

    if (roll < 0.06 && !chosenTypes.has('SCROLL_EPIC')) {
      type = 'SCROLL_EPIC';
    } else if (roll < 0.35 && !chosenTypes.has('SCROLL_NORMAL')) {
      type = 'SCROLL_NORMAL';
    } else if (roll < 0.60 && !chosenTypes.has('STAMINA_REFILL')) {
      type = 'STAMINA_REFILL';
    } else if (roll < 0.82 && !chosenTypes.has('ELEMENTAL_STONES')) {
      type = 'ELEMENTAL_STONES';
    } else {
      type = 'COMMON_EQUIPMENT';
    }

    chosenTypes.add(type);

    const itemId = `shop_item_${Date.now()}_${slotIndex}_${Math.random().toString(36).slice(2, 6)}`;

    switch (type) {
      case 'SCROLL_EPIC':
        items.push({
          id: itemId,
          type: 'SCROLL_EPIC',
          name: 'Epic Mystical Scroll',
          description: 'Summons a 1★ to 5★ Water, Fire, or Grass monster. (0.5% chance for a 5★ Legendary!)',
          cost: {
            currency: Math.random() < 0.5 ? 'gold' : 'gems',
            amount: Math.random() < 0.5 ? 250000 : 150,
          },
          reward: {
            scrollType: 'epic',
            scrollCount: 1,
          },
          isSold: false,
          icon: 'Scroll',
        });
        break;

      case 'SCROLL_NORMAL':
        items.push({
          id: itemId,
          type: 'SCROLL_NORMAL',
          name: 'Normal Mystical Scroll',
          description: 'Summons a 1★ to 3★ Water, Fire, or Grass monster.',
          cost: {
            currency: 'gold',
            amount: 15000,
          },
          reward: {
            scrollType: 'normal',
            scrollCount: 1,
          },
          isSold: false,
          icon: 'FileText',
        });
        break;

      case 'STAMINA_REFILL': {
        const isBig = Math.random() < 0.4;
        items.push({
          id: itemId,
          type: 'STAMINA_REFILL',
          name: isBig ? 'Large Stamina Flask (+100 ⚡)' : 'Stamina Elixir (+50 ⚡)',
          description: `Replenishes +${isBig ? 100 : 50} Energy points for dungeon and campaign battles.`,
          cost: {
            currency: 'gold',
            amount: isBig ? 35000 : 20000,
          },
          reward: {
            stamina: isBig ? 100 : 50,
          },
          isSold: false,
          icon: 'Zap',
        });
        break;
      }

      case 'ELEMENTAL_STONES': {
        const elem = ELEMENT_CHOICES[Math.floor(Math.random() * ELEMENT_CHOICES.length)];
        const isMedium = Math.random() < 0.45;
        const count = isMedium ? 2 : 5;
        items.push({
          id: itemId,
          type: 'ELEMENTAL_STONES',
          name: `${count}x ${isMedium ? 'Medium' : 'Small'} ${elem} Stones`,
          description: `Awakening stones for ${elem} monsters harvested from the elemental sanctums.`,
          cost: {
            currency: 'gold',
            amount: isMedium ? 24000 : 12000,
          },
          reward: {
            elementalStone: {
              element: elem,
              size: isMedium ? 'medium' : 'small',
              count,
            },
          },
          isSold: false,
          icon: 'Sparkles',
        });
        break;
      }

      case 'COMMON_EQUIPMENT':
      default: {
        const slot = SLOT_CHOICES[Math.floor(Math.random() * SLOT_CHOICES.length)];
        const eqItem: EquipmentItem = rollEquipmentPiece({
          slot,
          rarity: 'COMMON',
          level: 1,
        });
        const setBonus = EQUIPMENT_SET_BONUSES[eqItem.set];
        const mainStatFormatted = formatEquipmentStatLabel(
          eqItem.mainStat.stat,
          eqItem.mainStat.value,
          eqItem.mainStat.isPercent
        );
        const setBonusSnippet = setBonus ? `${setBonus.name} (${setBonus.description})` : `${eqItem.set} Set`;

        items.push({
          id: itemId,
          type: 'COMMON_EQUIPMENT',
          name: eqItem.name,
          description: `Main Stat: ${mainStatFormatted} • Set: ${setBonusSnippet}`,
          cost: {
            currency: 'gold',
            amount: 8000,
          },
          reward: {
            equipmentSlot: slot,
            equipmentItem: eqItem,
          },
          isSold: false,
          icon: 'Shield',
        });
        break;
      }
    }
  }

  return items;
}

export function syncRotatingShop(existingShop?: RotatingShopData): RotatingShopData {
  const now = Date.now();
  if (!existingShop || !existingShop.nextRotationTimestamp || now >= existingShop.nextRotationTimestamp) {
    return {
      lastRotationTimestamp: now,
      nextRotationTimestamp: now + ROTATION_INTERVAL_MS,
      items: generateDailyShopItems(),
    };
  }

  // Ensure any existing equipment item has full equipmentItem attached with stats
  existingShop.items.forEach((item) => {
    if (item.type === 'COMMON_EQUIPMENT' && !item.reward.equipmentItem) {
      const slot = item.reward.equipmentSlot || 'WEAPON';
      const eqItem = rollEquipmentPiece({ slot, rarity: 'COMMON', level: 1 });
      const setBonus = EQUIPMENT_SET_BONUSES[eqItem.set];
      const mainStatFormatted = formatEquipmentStatLabel(
        eqItem.mainStat.stat,
        eqItem.mainStat.value,
        eqItem.mainStat.isPercent
      );
      const setBonusSnippet = setBonus ? `${setBonus.name} (${setBonus.description})` : `${eqItem.set} Set`;
      item.reward.equipmentItem = eqItem;
      item.name = eqItem.name;
      item.description = `Main Stat: ${mainStatFormatted} • Set: ${setBonusSnippet}`;
    }
  });

  return existingShop;
}
