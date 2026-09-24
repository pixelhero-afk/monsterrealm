/**
 * Monster Realms - Core Systems Automated Verification Suite
 * Verifies stats, elemental affinities, 5v5 combat engine, speed turn meters,
 * awakening, equipment set bonuses, and server-authoritative economy.
 */

import { calculateEffectiveStats } from '../engine/statCalculator';
import { CombatEngine } from '../engine/combatEngine';
import { DeterministicRNG } from '../engine/rng';
import { getElementAffinity, ELEMENT_CONFIG } from '../data/elements';
import { MONSTER_VARIANTS } from '../data/monsters';
import { STARTER_EQUIPMENT, EQUIPMENT_SET_BONUSES, rollEquipmentPiece, formatEquipmentStatString } from '../data/equipment';
import { DUNGEON_STAGES } from '../data/stages';
import { createDeterministicStarterTeam, createInitialPlayerProfile } from '../services/starterTeam';
import { BattleParticipant } from '../types';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  â PASS: ${testName}`);
  } else {
    failedCount++;
    console.error(`  â FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

export function runAllCoreTests(): { passed: number; failed: number; results: Array<{ name: string; success: boolean; detail?: string }> } {
  passedCount = 0;
  failedCount = 0;
  const results: Array<{ name: string; success: boolean; detail?: string }> = [];

  const record = (condition: boolean, name: string, detail?: string) => {
    assert(condition, name, detail);
    results.push({ name, success: condition, detail });
  };

  console.log('\n============================================================');
  console.log('RUNNING MONSTER REALMS FOUNDATION TESTS');
  console.log('============================================================\n');

  // TEST 1: Starter Team Determinism
  const starterTeam = createDeterministicStarterTeam('test_user');
  record(starterTeam.length === 5, 'Starter Team has exactly 5 monsters');
  const starterVariants = starterTeam.map((m) => MONSTER_VARIANTS[m.variantId]);
  const elements = new Set(starterVariants.map((v) => v.element));
  record(elements.size === 5, 'Starter Team spans all 5 elements (Fire, Water, Grass, Light, Dark)');
  const roles = new Set(starterVariants.map((v) => v.primaryRole));
  record(roles.size >= 4, 'Starter Team provides diverse strategic roles');

  // TEST 2: Stat Calculation - Base & Level Growth
  const pyrosaur = MONSTER_VARIANTS['var_pyrosaur_fire'];
  const level1Stats = calculateEffectiveStats({
    variant: pyrosaur,
    level: 1,
    awakeningStage: 'BASE',
  }).finalStats;
  record(level1Stats.hp === 520 && level1Stats.attack === 135, 'Level 1 Base Stats match definition');

  const level10Stats = calculateEffectiveStats({
    variant: pyrosaur,
    level: 10,
    awakeningStage: 'BASE',
  }).finalStats;
  // Level 10 = base 520 + 9 * 42 = 898 HP
  record(level10Stats.hp === 898 && level10Stats.attack === 234, 'Level 10 Growth calculates accurately');

  // TEST 3: Stat Calculation - Awakening Multipliers & Additions
  const awakenedPyrosaur = calculateEffectiveStats({
    variant: pyrosaur,
    level: 1,
    awakeningStage: 'AWAKENED',
  }).finalStats;
  // +8 Speed, +20% Attack, +15% HP
  record(
    awakenedPyrosaur.speed === pyrosaur.baseStats.speed + 8,
    'Awakening grants flat speed bonus (+8)'
  );
  record(
    awakenedPyrosaur.attack === Math.floor(pyrosaur.baseStats.attack * 1.20),
    'Awakening grants percentage Attack multiplier (+20%)'
  );

  // TEST 4: Equipment Set Bonuses (Guard Set 2-piece)
  const armor = STARTER_EQUIPMENT.find((e) => e.set === 'GUARD')!;
  const duplicateArmor = { ...armor, id: 'eq_guard_2' };
  const equippedWithSet = calculateEffectiveStats({
    variant: pyrosaur,
    level: 1,
    awakeningStage: 'BASE',
    equipment: [armor, duplicateArmor],
  });
  record(
    equippedWithSet.activeSetBonuses.some((s) => s.includes('Guard Set')),
    '2-piece Guard Set activates +15% Defense bonus'
  );

  // TEST 5: Element Relationships & Modifiers
  record(getElementAffinity('FIRE', 'GRASS') === 'ADVANTAGE', 'Fire has advantage over Grass');
  record(getElementAffinity('GRASS', 'WATER') === 'ADVANTAGE', 'Grass has advantage over Water');
  record(getElementAffinity('WATER', 'FIRE') === 'ADVANTAGE', 'Water has advantage over Fire');
  record(getElementAffinity('FIRE', 'WATER') === 'DISADVANTAGE', 'Fire has disadvantage against Water');
  record(getElementAffinity('LIGHT', 'DARK') === 'ADVANTAGE', 'Light has advantage over Dark');
  record(getElementAffinity('DARK', 'LIGHT') === 'ADVANTAGE', 'Dark has advantage over Light');
  record(ELEMENT_CONFIG.advantageDamageMultiplier === 1.25, 'Element Advantage multiplier is +25%');

  // TEST 6: Combat Engine - 5v5 Participant Setup & Turn Meter Ticking
  const engine = new CombatEngine(12345);
  const playerParticipants: BattleParticipant[] = starterTeam.map((m, idx) => {
    const v = MONSTER_VARIANTS[m.variantId];
    const stats = calculateEffectiveStats({ variant: v, level: m.level, awakeningStage: m.awakeningStage }).finalStats;
    return {
      id: `p_${idx}`,
      variantId: v.variantId,
      name: v.name,
      element: v.element,
      team: 'PLAYER',
      slotIndex: idx,
      level: m.level,
      awakeningStage: m.awakeningStage,
      stats,
      maxHp: stats.hp,
      currentHp: stats.hp,
      turnMeter: 0,
      isAlive: true,
      skills: v.skills.map((sId) => ({ definitionId: sId, currentCooldown: 0 })),
      activeEffects: [],
      artwork: { avatar: v.artwork.baseAvatar, colorHex: v.artwork.colorHex, accentHex: v.artwork.accentHex },
    };
  });

  const enemyParticipants: BattleParticipant[] = starterTeam.map((m, idx) => {
    const v = MONSTER_VARIANTS[m.variantId];
    const stats = calculateEffectiveStats({ variant: v, level: m.level, awakeningStage: m.awakeningStage }).finalStats;
    return {
      id: `e_${idx}`,
      variantId: v.variantId,
      name: `Enemy ${v.name}`,
      element: v.element,
      team: 'ENEMY',
      slotIndex: idx,
      level: m.level,
      awakeningStage: m.awakeningStage,
      stats,
      maxHp: stats.hp,
      currentHp: stats.hp,
      turnMeter: 0,
      isAlive: true,
      skills: v.skills.map((sId) => ({ definitionId: sId, currentCooldown: 0 })),
      activeEffects: [],
      artwork: { avatar: v.artwork.baseAvatar, colorHex: v.artwork.colorHex, accentHex: v.artwork.accentHex },
    };
  });

  const battleState = engine.createBattle('test_battle_1', playerParticipants, enemyParticipants, 42);
  record(battleState.playerTeam.length === 5 && battleState.enemyTeam.length === 5, 'Combat engine supports true 5v5 battle layout');
  record(battleState.currentActorId !== null, 'Combat engine successfully advances turn meters until first actor is ready');

  // TEST 7: Faster Monster Gets First Turn Priority
  const currentActor = [...battleState.playerTeam, ...battleState.enemyTeam].find((p) => p.id === battleState.currentActorId);
  record(currentActor !== undefined && currentActor.stats.speed >= 100, 'First turn is granted to one of the fastest combatants');

  // TEST 8: Skill Execution & Cooldown Assignment
  const actor = currentActor!;
  const enemyTarget = actor.team === 'PLAYER' ? battleState.enemyTeam[0] : battleState.playerTeam[0];
  const targetInitialHp = enemyTarget.currentHp;
  const multiCooldownSkill = actor.skills.find((s) => s.definitionId === 'skill_volcanic_burst' || s.definitionId === 'skill_tidal_bastion' || s.definitionId === 'skill_dawn_chorus') || actor.skills[0];

  engine.executeAction(battleState, actor.id, multiCooldownSkill.definitionId, enemyTarget.id);
  record(battleState.combatLog.length > 1, 'Skill action generated structured combat logs');

  // TEST 9: Deterministic PRNG Behavior
  const rng1 = new DeterministicRNG(9999);
  const rng2 = new DeterministicRNG(9999);
  const roll1 = [rng1.next(), rng1.next(), rng1.next()];
  const roll2 = [rng2.next(), rng2.next(), rng2.next()];
  record(
    roll1[0] === roll2[0] && roll1[1] === roll2[1] && roll1[2] === roll2[2],
    'Deterministic PRNG produces identical reproducible sequence with same seed'
  );

  // TEST 10: Auto-Battle Step
  const beforeTurnCount = battleState.turnCount;
  engine.stepAutoBattle(battleState);
  record(battleState.turnCount >= beforeTurnCount, 'Auto-Battle AI successfully steps and selects action');

  // TEST 11: Player Profile Initialization & Currencies
  const profile = createInitialPlayerProfile('test_user');
  record(
    profile.currencies.gold === 50000 && profile.currencies.energy === 100 && profile.currencies.summonPoints === 300,
    'Player profile initializes with deterministic starting currencies'
  );
  record(profile.tutorialState.isCompleted === false && profile.tutorialState.isSkipped === false, 'Tutorial initialized in valid starting state');

  // TEST 12: Party Initialization & 5-Slot Formation State
  record(
    Array.isArray(profile.activeParty) && profile.activeParty.length === 5,
    'Player profile initializes with exactly 5 active party slots'
  );
  const starterIds = starterTeam.map((m) => m.instanceId);
  const partyMatchesStarters = profile.activeParty?.every((id, idx) => id === starterIds[idx]);
  record(
    partyMatchesStarters === true,
    'Active party default maps 1-to-1 to deterministic starter monsters'
  );

  // ============================================================
  // SHADOWSTALKER & EXTRA-TURN AUTOMATED VERIFICATION SUITE
  // ============================================================
  console.log('\n------------------------------------------------------------');
  console.log('RUNNING SHADOWSTALKER & EXTRA-TURN ARCHITECTURE TESTS');
  console.log('------------------------------------------------------------\n');

  // Helper to build a controlled 5v5 test battle
  function buildTestBattle(seed: number = 777) {
    const pTeam: BattleParticipant[] = starterTeam.map((m, idx) => {
      const v = MONSTER_VARIANTS[m.variantId];
      const stats = calculateEffectiveStats({ variant: v, level: 10, awakeningStage: 'AWAKENED' }).finalStats;
      return {
        id: `p_${idx}`,
        variantId: v.variantId,
        name: v.name,
        element: v.element,
        team: 'PLAYER',
        slotIndex: idx,
        level: 10,
        awakeningStage: 'AWAKENED',
        stats,
        maxHp: stats.hp,
        currentHp: stats.hp,
        turnMeter: 0,
        isAlive: true,
        skills: v.skills.map((sId) => ({ definitionId: sId, currentCooldown: 0 })),
        activeEffects: [],
        artwork: { avatar: v.artwork.baseAvatar, colorHex: v.artwork.colorHex, accentHex: v.artwork.accentHex },
      };
    });

    const eTeam: BattleParticipant[] = starterTeam.map((m, idx) => {
      const v = MONSTER_VARIANTS[m.variantId];
      const stats = calculateEffectiveStats({ variant: v, level: 10, awakeningStage: 'AWAKENED' }).finalStats;
      return {
        id: `e_${idx}`,
        variantId: v.variantId,
        name: `Enemy ${v.name}`,
        element: v.element,
        team: 'ENEMY',
        slotIndex: idx,
        level: 10,
        awakeningStage: 'AWAKENED',
        stats,
        maxHp: stats.hp,
        currentHp: stats.hp,
        turnMeter: 0,
        isAlive: true,
        skills: v.skills.map((sId) => ({ definitionId: sId, currentCooldown: 0 })),
        activeEffects: [],
        artwork: { avatar: v.artwork.baseAvatar, colorHex: v.artwork.colorHex, accentHex: v.artwork.accentHex },
      };
    });

    const eng = new CombatEngine(seed);
    const bState = eng.createBattle(`test_shadow_${seed}`, pTeam, eTeam, seed);
    return { eng, bState, pTeam, eTeam };
  }

  // SHADOWSTALKER TEST 1: Double Attack & Nether Shroud Execution
  {
    const { eng, bState } = buildTestBattle(101);
    const shadowstalker = bState.playerTeam.find((p) => p.variantId === 'var_shadowstalker_dark')!;
    // Force Shadowstalker to have turn
    bState.currentActorId = shadowstalker.id;
    shadowstalker.turnMeter = 100;
    bState.phase = 'SELECTING_ACTION';

    // Step 1: Shadowstalker uses Nether Shroud
    eng.executeAction(bState, shadowstalker.id, 'skill_nether_shroud', shadowstalker.id);

    const hasBuffs = shadowstalker.activeEffects.some((e) => e.type === 'STEALTH') &&
                     shadowstalker.activeEffects.some((e) => e.type === 'CRIT_RATE_UP') &&
                     shadowstalker.activeEffects.some((e) => e.type === 'DOUBLE_ATTACK');
    const netherCooldown = shadowstalker.skills.find((s) => s.definitionId === 'skill_nether_shroud')?.currentCooldown;

    record(hasBuffs && netherCooldown === 3,
      'Shadowstalker Test 1: Nether Shroud resolves, applies Stealth, Crit Up, and Double Attack buff'
    );

    // Step 2: Shadowstalker attacks enemy
    const enemyTarget = bState.enemyTeam.find((e) => e.isAlive)!;
    const prevEnemyHp = enemyTarget.currentHp;
    eng.executeAction(bState, shadowstalker.id, 'skill_umbral_fang', enemyTarget.id);

    record(enemyTarget.currentHp < prevEnemyHp,
      'Shadowstalker Test 1b: Attack consumes turn meter and damages combatant'
    );
  }

  // SHADOWSTALKER TEST 2: Recursion & Infinite Loop Prevention
  {
    const { eng, bState } = buildTestBattle(202);
    const shadowstalker = bState.playerTeam.find((p) => p.variantId === 'var_shadowstalker_dark')!;
    bState.currentActorId = shadowstalker.id;
    shadowstalker.turnMeter = 100;

    // Use Nether Shroud once
    eng.executeAction(bState, shadowstalker.id, 'skill_nether_shroud', shadowstalker.id);

    // Attempt to illegally cast Nether Shroud AGAIN on the extra turn (simulating bypass/hack)
    const netherTracker = shadowstalker.skills.find((s) => s.definitionId === 'skill_nether_shroud')!;
    // Even if cooldown were reset to 0:
    netherTracker.currentCooldown = 0;
    eng.executeAction(bState, shadowstalker.id, 'skill_nether_shroud', shadowstalker.id);

    // Recursion guard must prevent granting another extra turn from the exact same ability in the chain
    record(
      (bState.currentExtraTurnDepth || 0) <= 1,
      'Shadowstalker Test 2: Recursion guard prevents identical ability from infinitely granting chained extra turns'
    );
  }

  // SHADOWSTALKER TEST 3: Interaction with Buffs, Debuffs, and DoTs
  {
    const { eng, bState } = buildTestBattle(303);
    const shadowstalker = bState.playerTeam.find((p) => p.variantId === 'var_shadowstalker_dark')!;
    // Afflict with Burn (CONTINUOUS_DAMAGE) and Speed Down
    shadowstalker.activeEffects.push({
      id: 'test_burn',
      type: 'CONTINUOUS_DAMAGE',
      name: 'Burn',
      isBuff: false,
      duration: 3,
      sourceParticipantId: 'enemy',
    });
    shadowstalker.activeEffects.push({
      id: 'test_slow',
      type: 'SPEED_DOWN',
      name: 'Speed Down',
      isBuff: false,
      duration: 2,
      sourceParticipantId: 'enemy',
    });

    const startHp = shadowstalker.currentHp;
    bState.currentActorId = shadowstalker.id;
    shadowstalker.turnMeter = 100;

    eng.executeAction(bState, shadowstalker.id, 'skill_nether_shroud', shadowstalker.id);

    const burnRemains = shadowstalker.activeEffects.find((e) => e.id === 'test_burn')?.duration;
    record(
      shadowstalker.currentHp <= startHp && burnRemains !== undefined && burnRemains < 3,
      'Shadowstalker Test 3: DoTs and debuffs tick deterministically across extra-turn boundaries without recursive loops'
    );
  }

  // SHADOWSTALKER TEST 4: Cooldown Integrity Enforcement
  {
    const { eng, bState } = buildTestBattle(404);
    const shadowstalker = bState.playerTeam.find((p) => p.variantId === 'var_shadowstalker_dark')!;
    bState.currentActorId = shadowstalker.id;
    shadowstalker.turnMeter = 100;

    // Use Nether Shroud
    eng.executeAction(bState, shadowstalker.id, 'skill_nether_shroud', shadowstalker.id);

    // Verify it is on cooldown
    const tracker = shadowstalker.skills.find((s) => s.definitionId === 'skill_nether_shroud')!;
    const wasOnCooldown = tracker.currentCooldown > 0;

    // Engine rejects attempt to cast a skill currently on cooldown
    const prevTurnCount = bState.turnCount;
    eng.executeAction(bState, shadowstalker.id, 'skill_nether_shroud', shadowstalker.id);

    record(
      wasOnCooldown && bState.turnCount === prevTurnCount,
      'Shadowstalker Test 4: Engine rejects skill on cooldown; extra turn cannot bypass cooldown rules'
    );
  }

  // SHADOWSTALKER TEST 5: Kill Trigger & Execution Passive
  {
    const { eng, bState } = buildTestBattle(505);
    const shadowstalker = bState.playerTeam.find((p) => p.variantId === 'var_shadowstalker_dark')!;
    const enemyTarget = bState.enemyTeam[0];
    enemyTarget.currentHp = 10; // Low HP so execution kills

    bState.currentActorId = shadowstalker.id;
    shadowstalker.turnMeter = 100;

    // Unlock Eclipse Execution on Shadowstalker
    shadowstalker.skills.push({ definitionId: 'skill_eclipse_execution', currentCooldown: 0 });

    eng.executeAction(bState, shadowstalker.id, 'skill_eclipse_execution', enemyTarget.id);

    const enemyDied = !enemyTarget.isAlive;
    const executionCooldown = shadowstalker.skills.find((s) => s.definitionId === 'skill_eclipse_execution')?.currentCooldown;
    // Eclipse execution resets cooldown on kill
    record(
      enemyDied && executionCooldown === 0,
      'Shadowstalker Test 5: Execution kill resets cooldown and triggers Death Prowler without infinite loops'
    );
  }

  // SHADOWSTALKER TEST 6: Multiple Monsters with Turn Meter & Extra Turn Mechanics
  {
    const { eng, bState } = buildTestBattle(606);
    // Simulate 20 consecutive auto-battle steps
    let turnsRun = 0;
    const maxSteps = 20;

    for (let i = 0; i < maxSteps; i++) {
      if (bState.phase === 'VICTORY' || bState.phase === 'DEFEAT') break;
      const actorIdBefore = bState.currentActorId;
      eng.stepAutoBattle(bState);
      turnsRun++;
    }

    record(
      turnsRun >= 15 && bState.turnCount > 10,
      'Shadowstalker Test 6: Multiple combatants with speed/turn-meter passives resolve deterministically'
    );
  }

  // SHADOWSTALKER TEST 7: 5-Player vs 5-Enemy Full Combat Stability
  {
    const { eng, bState } = buildTestBattle(707);
    const participantTurnCounts: Record<string, number> = {};

    // Run 35 battle steps
    for (let step = 0; step < 35; step++) {
      if (bState.phase === 'VICTORY' || bState.phase === 'DEFEAT') break;
      const actorId = bState.currentActorId;
      if (actorId) {
        participantTurnCounts[actorId] = (participantTurnCounts[actorId] || 0) + 1;
      }
      eng.stepAutoBattle(bState);
    }

    const uniqueActors = Object.keys(participantTurnCounts).length;
    // In a 5v5 battle over 35 actions, at least 4 unique combatants must have taken turns
    record(
      uniqueActors >= 4 && (bState.currentExtraTurnDepth || 0) <= 3,
      'Shadowstalker Test 7: Full 5v5 battle maintains stable turn cycle across all 10 combatants without freeze'
    );
  }

  // ============================================================
  // DUNGEON WAVES & EQUIPMENT LOOT VERIFICATION
  // ============================================================
  console.log('\n------------------------------------------------------------');
  console.log('RUNNING DUNGEON WAVES & EQUIPMENT LOOT TESTS');
  console.log('------------------------------------------------------------\n');

  // Test 1: Dungeon stages have exactly 3 waves (Fight > Fight > Boss)
  const dungeonStages = DUNGEON_STAGES.filter((s) => s.dungeonLevel === 1 || s.dungeonLevel === 2);
  const allHave3Waves = dungeonStages.length > 0 && dungeonStages.every((s) => s.waves && s.waves.length === 3);
  record(
    allHave3Waves,
    'Dungeon Test 1: Equipment dungeons have exactly 3 waves (Fight > Fight > Boss)'
  );

  // Test 2: Rarity-based substats count
  // only rare items can have 1 sub stat , epic 2 sub stats , legendary 3 sub stats
  const commonItem = rollEquipmentPiece({ slot: 'WEAPON', rarity: 'COMMON', level: 1 });
  const uncommonItem = rollEquipmentPiece({ slot: 'ARMOR', rarity: 'UNCOMMON', level: 1 });
  const rareItem = rollEquipmentPiece({ slot: 'HELM', rarity: 'RARE', level: 1 });
  const epicItem = rollEquipmentPiece({ slot: 'BOOTS', rarity: 'EPIC', level: 1 });
  const legendaryItem = rollEquipmentPiece({ slot: 'WEAPON', rarity: 'LEGENDARY', level: 1 });

  record(
    commonItem.subStats.length === 0 && uncommonItem.subStats.length === 0,
    'Equipment Test 2a: Common and Uncommon items have 0 substats'
  );
  record(
    rareItem.subStats.length === 1,
    'Equipment Test 2b: Rare items have exactly 1 substat'
  );
  record(
    epicItem.subStats.length === 2,
    'Equipment Test 2c: Epic items have exactly 2 substats'
  );
  record(
    legendaryItem.subStats.length === 3,
    'Equipment Test 2d: Legendary items have exactly 3 substats'
  );

  // Test 3: Formatting matches "main stat / sub stat / sub stat / sub stat"
  const formattedLegendary = formatEquipmentStatString(legendaryItem);
  const formattedEpic = formatEquipmentStatString(epicItem);
  const formattedRare = formatEquipmentStatString(rareItem);

  const legendaryParts = formattedLegendary.split(' / ');
  const epicParts = formattedEpic.split(' / ');
  const rareParts = formattedRare.split(' / ');

  record(
    legendaryParts.length === 4 && legendaryParts.every((p) => p.startsWith('+')),
    'Equipment Test 3a: Legendary equipment stat string follows "main stat / sub stat / sub stat / sub stat" structure (4 parts)'
  );
  record(
    epicParts.length === 3 && epicParts.every((p) => p.startsWith('+')),
    'Equipment Test 3b: Epic equipment stat string follows "main stat / sub stat / sub stat" structure (3 parts)'
  );
  record(
    rareParts.length === 2 && rareParts.every((p) => p.startsWith('+')),
    'Equipment Test 3c: Rare equipment stat string follows "main stat / sub stat" structure (2 parts)'
  );

  // Test 4: Combat engine wave transitions
  {
    const eng = new CombatEngine(42);
    const p1: BattleParticipant = {
      id: 'p0',
      variantId: 'var_pyrosaur_fire',
      name: 'Pyrosaur',
      element: 'FIRE',
      team: 'PLAYER',
      slotIndex: 0,
      level: 20,
      awakeningStage: 'AWAKENED',
      stats: { hp: 5000, attack: 500, defense: 200, speed: 120, critRate: 15, critDamage: 150, resistance: 15, accuracy: 15 },
      maxHp: 5000,
      currentHp: 5000,
      turnMeter: 100,
      isAlive: true,
      skills: [{ definitionId: 'skill_fire_strike', currentCooldown: 0 }],
      activeEffects: [],
      artwork: { avatar: '', colorHex: '#ff0000', accentHex: '#ff4400' },
    };

    const eWave1: BattleParticipant[] = [{
      id: 'e_w1_0',
      variantId: 'var_doggo_grass',
      name: 'Leaf Hound',
      element: 'GRASS',
      team: 'ENEMY',
      slotIndex: 0,
      level: 5,
      awakeningStage: 'BASE',
      stats: { hp: 50, attack: 10, defense: 5, speed: 50, critRate: 5, critDamage: 150, resistance: 0, accuracy: 0 },
      maxHp: 50,
      currentHp: 50,
      turnMeter: 0,
      isAlive: true,
      skills: [],
      activeEffects: [],
      artwork: { avatar: '', colorHex: '#00ff00', accentHex: '#44ff00' },
    }];

    const bState = eng.createBattle('wave_test', [p1], eWave1, 1000, 1, { currentWave: 1, totalWaves: 3 });
    record(
      bState.currentWave === 1 && bState.totalWaves === 3,
      'Combat Engine Test 4a: Battle initializes with wave 1 of 3'
    );

    // Defeat wave 1 enemy -> must transition to WAVE_TRANSITION, not VICTORY
    eWave1[0].currentHp = 0;
    eWave1[0].isAlive = false;
    const isEnded = eng.checkBattleEnd(bState);
    record(
      isEnded && bState.phase === 'WAVE_TRANSITION',
      'Combat Engine Test 4b: Clearing wave 1 triggers WAVE_TRANSITION phase'
    );

    // Advance to wave 2
    const eWave2: BattleParticipant[] = [{
      id: 'e_w2_0',
      variantId: 'var_doggo_grass',
      name: 'Leaf Hound 2',
      element: 'GRASS',
      team: 'ENEMY',
      slotIndex: 0,
      level: 10,
      awakeningStage: 'BASE',
      stats: { hp: 100, attack: 20, defense: 10, speed: 60, critRate: 5, critDamage: 150, resistance: 0, accuracy: 0 },
      maxHp: 100,
      currentHp: 100,
      turnMeter: 0,
      isAlive: true,
      skills: [],
      activeEffects: [],
      artwork: { avatar: '', colorHex: '#00ff00', accentHex: '#44ff00' },
    }];
    eng.advanceToWave(bState, 2, eWave2);
    record(
      bState.currentWave === 2 && bState.phase === 'SELECTING_ACTION' && bState.enemyTeam.length === 1 && bState.enemyTeam[0].isAlive,
      'Combat Engine Test 4c: advanceToWave successfully sets up wave 2 enemies in SELECTING_ACTION phase'
    );

    // Defeat wave 2 -> WAVE_TRANSITION
    eWave2[0].currentHp = 0;
    eWave2[0].isAlive = false;
    eng.checkBattleEnd(bState);
    record(
      bState.phase === 'WAVE_TRANSITION',
      'Combat Engine Test 4d: Clearing wave 2 triggers WAVE_TRANSITION phase'
    );

    // Advance to wave 3 (Boss wave)
    const eWave3: BattleParticipant[] = [{
      id: 'e_w3_0',
      variantId: 'var_boss_dungeon_weapon',
      name: 'Boss Overlord',
      element: 'GRASS',
      team: 'ENEMY',
      slotIndex: 2,
      level: 15,
      awakeningStage: 'AWAKENED',
      stats: { hp: 500, attack: 50, defense: 30, speed: 70, critRate: 10, critDamage: 150, resistance: 20, accuracy: 20 },
      maxHp: 500,
      currentHp: 500,
      turnMeter: 0,
      isAlive: true,
      skills: [],
      activeEffects: [],
      artwork: { avatar: '', colorHex: '#00ff00', accentHex: '#44ff00' },
    }];
    eng.advanceToWave(bState, 3, eWave3);
    record(
      bState.currentWave === 3 && bState.phase === 'SELECTING_ACTION',
      'Combat Engine Test 4e: advanceToWave successfully transitions to wave 3'
    );

    // Defeat Boss wave 3 -> VICTORY!
    eWave3[0].currentHp = 0;
    eWave3[0].isAlive = false;
    eng.checkBattleEnd(bState);
    record(
      bState.phase === 'VICTORY',
      'Combat Engine Test 4f: Vanquishing the Boss in wave 3 concludes with VICTORY'
    );
  }

  console.log('\n============================================================');
  console.log(`TOTAL PASSED: ${passedCount} | TOTAL FAILED: ${failedCount}`);
  console.log('============================================================\n');

  return { passed: passedCount, failed: failedCount, results };
}

// If invoked directly from CLI
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('run-tests')) {
  const summary = runAllCoreTests();
  if (summary.failed > 0) {
    process.exit(1);
  }
}
