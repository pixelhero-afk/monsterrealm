/**
 * Monster Realms - Core Type Definitions
 * Original browser-based monster-collection RPG
 */

export type ElementType = 'FIRE' | 'WATER' | 'GRASS' | 'LIGHT' | 'DARK';

export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type MonsterRole =
  | 'TANK'
  | 'DAMAGE'
  | 'SUPPORT'
  | 'HEALER'
  | 'CONTROL'
  | 'ASSASSIN'
  | 'BRUISER'
  | 'HYBRID'
  | 'DISRUPTOR'
  | 'BUFFER'
  | 'TACTICIAN'
  | 'EXECUTE';

export type AwakeningStage = 'BASE' | 'AWAKENED' | 'GREATER_AWAKENED' | 'ASCENDED';

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;     // e.g. 0.15 for 15%
  critDamage: number;   // e.g. 1.50 for 150%
  accuracy: number;     // e.g. 0.15 for 15%
  resistance: number;   // e.g. 0.15 for 15%
  healingDone?: number;   // e.g. 0.15 for +15% healing done
  shieldingDone?: number; // e.g. 0.15 for +15% shielding done
}

export type StatKey = keyof BaseStats;

export type EquipmentSlot = 'HELM' | 'BOOTS' | 'ARMOR' | 'WEAPON' | 'ACCESSORY' | 'RELIC';

export type EquipmentSetType =
  | 'SWIFT'        // +25% Base Speed (4 pieces)
  | 'FATAL'        // +35% Base Attack (4 pieces)
  | 'ENERGY'       // +15% Base HP (2 pieces)
  | 'GUARD'        // +15% Base Defense (2 pieces)
  | 'BLADE'        // +12% Crit Rate (2 pieces)
  | 'FOCUS'        // +20% Accuracy (2 pieces)
  | 'DESTRUCTION'  // +40% Crit Damage (4 pieces)
  | 'LIFE'         // +20% Healing Done (2 pieces)
  | 'BASTION';     // +25% Shielding Done (2 pieces)

export interface EquipmentItem {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: Rarity;
  level: number;       // 1 to 15
  mainStat: {
    stat: StatKey;
    value: number;
    isPercent: boolean;
  };
  subStats: Array<{
    stat: StatKey;
    value: number;
    isPercent: boolean;
  }>;
  set: EquipmentSetType;
  equippedToInstanceId?: string;
}

export type SkillTargetType =
  | 'SINGLE_ENEMY'
  | 'ALL_ENEMIES'
  | 'SINGLE_ALLY'
  | 'ALL_ALLIES'
  | 'SELF'
  | 'RANDOM_ENEMY';

export type StatusEffectType =
  // Buffs
  | 'ATTACK_UP'
  | 'DEFENSE_UP'
  | 'SPEED_UP'
  | 'CRIT_RATE_UP'
  | 'SHIELD'
  | 'CONTINUOUS_HEAL'
  | 'IMMUNITY'
  | 'STEALTH'
  | 'DOUBLE_ATTACK'
  // Debuffs / Control
  | 'ATTACK_DOWN'
  | 'DEFENSE_DOWN'
  | 'SPEED_DOWN'
  | 'STUN'
  | 'FREEZE'
  | 'SLEEP'
  | 'SILENCE'
  | 'TAUNT'
  | 'CONTINUOUS_DAMAGE' // Poison / Burn
  | 'BLIND';

export interface StatusEffect {
  id: string;
  type: StatusEffectType;
  name: string;
  isBuff: boolean;
  duration: number;        // Turns remaining
  value?: number;          // E.g. Shield amount or stat modifier %
  sourceParticipantId: string;
  icon?: string;
}

export interface SkillEffect {
  type:
    | 'DAMAGE'
    | 'HEAL'
    | 'SHIELD'
    | 'APPLY_STATUS'
    | 'CLEANSE'
    | 'TURN_METER_BOOST'
    | 'TURN_METER_REDUCE'
    | 'EXTRA_TURN'
    | 'DOUBLE_ATTACK'
    | 'RESET_COOLDOWN'
    | 'DISPEL';
  multiplier?: number;       // Skill scaling against Attack, HP, or Defense
  scalingStat?: 'attack' | 'hp' | 'defense';
  hits?: number;             // Multi-hit count
  chance?: number;           // Proc chance 0 to 1
  statusEffect?: StatusEffectType;
  statusDuration?: number;
  statusValue?: number;
  turnMeterDelta?: number;   // e.g. 0.25 = +25% or -25%
  dispelCount?: number;      // e.g. 1 or all
  description?: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  cooldown: number;          // Max cooldown turns (0 = basic attack)
  targetType: SkillTargetType;
  effects: SkillEffect[];
  isPassive?: boolean;
}

export interface AwakeningBonus {
  stage: AwakeningStage;
  title: string;
  visualTitle: string;
  statMultipliers: Partial<Record<StatKey, number>>; // e.g. { attack: 1.15, speed: 5 }
  unlockedSkillId?: string;
  enhancedSkillId?: {
    originalSkillId: string;
    newSkillId: string;
  };
  newPassiveId?: string;
  description: string;
}

export interface MonsterFamily {
  familyId: string;
  familyName: string;
  lore: string;
  rarity: Rarity;
  stars?: number;
  availableElements: ElementType[];
  silhouetteTheme: string;
}

export interface MonsterVariant {
  variantId: string;
  familyId: string;
  name: string;
  element: ElementType;
  rarity: Rarity;
  stars?: number;
  primaryRole: MonsterRole;
  secondaryRole?: MonsterRole;
  lore: string;
  baseStats: BaseStats;
  growthPerLevel: Partial<BaseStats>;
  skills: string[];            // Array of Skill IDs (Basic, S2, S3, etc.)
  passiveSkillId?: string;
  awakeningStages: AwakeningBonus[];
  artwork: {
    baseAvatar: string;
    awakenedAvatar: string;
    colorHex: string;
    accentHex: string;
  };
  isBoss?: boolean;            // True for Continental Chapter Boss Overlords
  isObtainable?: boolean;      // False for Campaign Bosses (cannot be summoned or owned by players)
  disabled?: boolean;          // True when unit is disabled via DevTools (cannot be used in party, battle, or summon gate)
}

export interface PlayerMonster {
  instanceId: string;
  variantId: string;
  playerId: string;
  level: number;
  experience: number;
  awakeningStage: AwakeningStage;
  equipmentIds: string[];      // IDs of equipped EquipmentItems
  skillLevels: Record<string, number>;
  locked: boolean;
  acquiredAt: number;
  stars?: number;              // Current star level (1 to 10)
}

// Combat Specific Models
export interface BattleParticipant {
  id: string;
  instanceId?: string;
  variantId: string;
  name: string;
  element: ElementType;
  team: 'PLAYER' | 'ENEMY';
  slotIndex: number;          // 0 to 4 in 5v5
  level: number;
  stars?: number;             // Current star level (1 to 10)
  awakeningStage: AwakeningStage;
  stats: BaseStats;           // Current effective battle stats
  maxHp: number;
  currentHp: number;
  turnMeter: number;          // 0 to 100+
  isAlive: boolean;
  skills: Array<{
    definitionId: string;
    currentCooldown: number;
  }>;
  passiveSkillId?: string;
  activeEffects: StatusEffect[];
  artwork: {
    avatar: string;
    colorHex: string;
    accentHex: string;
  };
}

export interface BattleLogEntry {
  id: string;
  turnCount: number;
  sourceId: string;
  sourceName: string;
  targetId?: string;
  targetName?: string;
  skillName?: string;
  actionType: 'SKILL' | 'DAMAGE' | 'HEAL' | 'BUFF' | 'DEBUFF' | 'DEATH' | 'TURN_METER' | 'REVIVE';
  damage?: number;
  isCrit?: boolean;
  elementAdvantage?: 'ADVANTAGE' | 'DISADVANTAGE' | 'NEUTRAL';
  message: string;
  timestamp: number;
}

export interface ActionContext {
  actionId: string;
  actorId: string;
  skillId: string;
  triggerSource?: string;
  extraTurnDepth: number;
  skillsUsedInChain: string[];
  triggeredEffects: string[];
  resolvedEffects: string[];
  killedTargetIds: string[];
}

export interface ExecutedActionRecord {
  id: string;
  actorId: string;
  targetId?: string | null;
  allTargetIds?: string[];
  killedTargetIds?: string[];
  skillId: string;
  skillName: string;
  slot: 1 | 2 | 3;
  element: ElementType;
  isCrit?: boolean;
  isExtraTurn?: boolean;
  isDoubleAttack?: boolean;
  damage?: number;
  isAoe?: boolean;
  isAllyBuff?: boolean;
  timestamp: number;
}

export interface BattleAction {
  sourceId: string;
  skillId: string;
  targetId: string;
}

export interface BattleState {
  battleId: string;
  partySize?: number; // Snapshot of active party size at battle start
  turnCount: number;
  currentActorId: string | null;
  phase: 'SELECTING_ACTION' | 'EXECUTING_ACTION' | 'VICTORY' | 'DEFEAT';
  playerTeam: BattleParticipant[];
  enemyTeam: BattleParticipant[];
  turnOrderPreview: string[]; // Participant IDs in order of expected turns
  combatLog: BattleLogEntry[];
  isAuto: boolean;
  battleSpeed: 1 | 2 | 3;
  seed: number;
  currentExtraTurnDepth?: number;
  consecutiveActionsCount?: number;
  activeActionContext?: ActionContext | null;
  loopDetectionCount?: number;
  lastStateFingerprint?: string;
  lastExecutedAction?: ExecutedActionRecord | null;
}

// Currencies & Account
export interface Currencies {
  gold: number;
  energy: number;
  maxEnergy: number;
  summonPoints: number;
  gems: number;
  lastEnergyRegenTimestamp: number;
}

export interface TutorialState {
  isCompleted: boolean;
  isSkipped: boolean;
  currentStep: number;
  stepName: string;
}

export interface AccountLevelReward {
  level: number;
  gems: number;
  description?: string;
}

export interface PlayerProfile {
  playerId: string;
  username: string;
  accountLevel: number;
  experience: number;
  avatarVariantId: string;
  currencies: Currencies;
  tutorialState: TutorialState;
  completedStages: string[]; // IDs of stages cleared with victory
  stageStars: Record<string, number>; // stageId -> stars earned (1-3)
  highestUnlockedStage: string;
  activeParty?: string[]; // IDs of 5 active PlayerMonster instances
  maxEquipmentSlots?: number; // Equipment bag capacity: default 60, expandable in +10 increments up to 200 with 500 gems
  hasChangedName?: boolean; // True if player has used their 1 free name change
  nameChangesCount?: number; // Total number of name changes performed
  claimedLevelRewards?: number[]; // List of account levels whose reward has been claimed
  createdAt: number;
  updatedAt: number;
}

// Continent & World Map Models
export interface Continent {
  continentId: string;
  chapter: number;
  name: string;
  subtitle: string;
  element: ElementType;
  description: string;
  bossName: string;
  bossStageId: string; // e.g. "stage_1_10"
  totalStages: number; // 10
  colorHex: string;
  accentHex: string;
  bgGradient: string;
  coordinates: { x: number; y: number };
}

// Summoning Models
export interface SummonBanner {
  bannerId: string;
  name: string;
  description: string;
  featuredVariantIds: string[];
  rates: {
    common: number;     // 1-star (e.g. 0.35)
    uncommon?: number;   // 2-star (e.g. 0.30)
    rare: number;       // 3-star (e.g. 0.24)
    epic: number;       // 4-star (e.g. 0.09)
    legendary: number;  // 5-star (e.g. 0.02)
  };
  probabilities?: Record<string, number>;
  cost: {
    type: 'SUMMON_POINTS' | 'GEMS';
    amount: number;
  };
  pityThreshold: number; // Guaranteed Epic/Legendary threshold
}

export interface SummonResult {
  instance: PlayerMonster;
  variant: MonsterVariant;
  isNew: boolean;
  isDuplicate: boolean;
  duplicateCompensation?: {
    gold: number;
    shards: number;
  };
}

// PvE Stages
export interface PvEStage {
  stageId: string;
  chapter: number;
  stageNumber: number;
  continentId: string;
  element?: ElementType;
  isBossStage?: boolean;
  bossTitle?: string;
  name: string;
  description: string;
  energyCost: number;
  recommendedPower: number;
  enemyVariants: Array<{
    variantId: string;
    level: number;
    slotIndex: number;
    awakeningStage?: AwakeningStage;
  }>;
  firstClearRewards: {
    gold: number;
    gems: number;
    summonPoints: number;
  };
  repeatRewards: {
    gold: number;
    exp: number;
  };
}

// Social & Friends
export interface FriendLeadMonster {
  variantId: string;
  name: string;
  level: number;
  stars?: number;
  element: ElementType;
  awakeningStage: AwakeningStage;
}

export interface FriendPublicProfile {
  userId: string;
  displayName: string;
  friendCode: string;
  level: number;
  avatarVariantId?: string;
  leadMonster?: FriendLeadMonster;
  defenseParty?: PlayerMonster[];
  role?: 'owner' | 'admin' | 'player';
  lastActive: string;
  createdAt: string;
}

export interface FriendRecord {
  friendUserId: string;
  friendCode: string;
  displayName: string;
  level: number;
  avatarVariantId?: string;
  leadMonster?: FriendLeadMonster;
  lastGiftSentAt?: number;
  lastGiftClaimedAt?: number;
  addedAt: string;
}

export interface FriendRequestRecord {
  requestId: string;
  fromUserId: string;
  fromDisplayName: string;
  fromFriendCode: string;
  fromLeadMonster?: FriendLeadMonster;
  fromLevel: number;
  toUserId: string;
  toFriendCode?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

export interface CloudSaveState {
  userId: string;
  profile: PlayerProfile;
  monsters: PlayerMonster[];
  equipment: EquipmentItem[];
  stages?: PvEStage[];
  saveVersion: number;
  savedAt: string;
}

/**
 * Checks if a given account or user identifier is authorized for owner / developer tools.
 * Granted to the account named "Dean" or email "deanvantessel@gmail.com".
 */
export function isDevAccount(identifier?: string | null): boolean {
  if (!identifier) return false;
  const clean = identifier.trim().toLowerCase();
  return clean === 'dean' || clean === 'deanvantessel@gmail.com';
}
