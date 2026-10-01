/**
 * 3D 5v5 Battle Canvas & Combat Director
 * Renders all 10 physical 3D monsters in real-time within the 3D Volcanic Ruins Arena.
 * Coordinates 3D animations (idle, attack lunge, skill cast, hit flinch, defeat),
 * 3D spell projectiles, dynamic camera framing, raycast targeting, and floating HUDs.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BattleParticipant, ElementType, ExecutedActionRecord } from '../../../types';
import { createBattleArena, BattleArenaInstance, PLAYER_FORMATION, ENEMY_FORMATION } from './BattleArena3D';
import { createMonster3D, Creature3DInstance } from '../creatures/createCreatureMesh';
import { createSpellManager } from './SpellVFX3D';
import { Swords, Sparkles, FolderUp, CheckCircle2 } from 'lucide-react';
import { BuffDebuffIcon } from '../../battle/BuffDebuffIcon';
import { characterModelLoader } from '../../../services/characterPipeline/CharacterModelLoader';

interface BattleCanvas3DProps {
  playerTeam: BattleParticipant[];
  enemyTeam: BattleParticipant[];
  currentActorId: string | null;
  selectedTargetId: string | null;
  onSelectTarget: (targetId: string) => void;
  latestAction: ExecutedActionRecord | null;
}

export const BattleCanvas3D: React.FC<BattleCanvas3DProps> = ({
  playerTeam,
  enemyTeam,
  currentActorId,
  selectedTargetId,
  onSelectTarget,
  latestAction,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const arenaRef = useRef<BattleArenaInstance | null>(null);
  const playerCreaturesRef = useRef<Map<string, Creature3DInstance>>(new Map());
  const enemyCreaturesRef = useRef<Map<string, Creature3DInstance>>(new Map());
  const spellManagerRef = useRef<ReturnType<typeof createSpellManager> | null>(null);
  const prevActionIdRef = useRef<string>('');
  const teamsRef = useRef({ playerTeam, enemyTeam });
  teamsRef.current = { playerTeam, enemyTeam };
  const [overheadCoords, setOverheadCoords] = useState<Record<string, { x: number; y: number }>>({});
  const [extraTurnNotice, setExtraTurnNotice] = useState<{ id: string; name: string } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [assetMountedNotice, setAssetMountedNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDropGLB = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.glb') && !lowerName.endsWith('.gltf')) return;

    try {
      setAssetMountedNotice(`Mounting "${file.name}"...`);
      await characterModelLoader.registerCustomModel('fam_nekohime', file);
      const arena = arenaRef.current;
      if (!arena) return;

      const refreshTeamModels = (
        team: BattleParticipant[],
        creatureMap: Map<string, Creature3DInstance>,
        formations: typeof PLAYER_FORMATION,
        teamTag: 'PLAYER' | 'ENEMY'
      ) => {
        team.forEach((p, idx) => {
          if ((p.variantId || '').toLowerCase().includes('nekohime')) {
            const old = creatureMap.get(p.id);
            if (old) {
              arena.scene.remove(old.root);
              old.dispose();
            }
            const form = formations[idx] || formations[0];
            const creature = createMonster3D(p.variantId, p.element, p.awakeningStage !== 'BASE', p.isAlive);
            creature.root.position.set(form.x, form.y, form.z);
            creature.root.rotation.y = form.rotationY;
            creature.root.userData = { id: p.id, team: teamTag, baseRotationY: form.rotationY };
            arena.scene.add(creature.root);
            creatureMap.set(p.id, creature);
          }
        });
      };

      refreshTeamModels(teamsRef.current.playerTeam, playerCreaturesRef.current, PLAYER_FORMATION, 'PLAYER');
      refreshTeamModels(teamsRef.current.enemyTeam, enemyCreaturesRef.current, ENEMY_FORMATION, 'ENEMY');

      setAssetMountedNotice(`Mounted 3D character "${file.name}" for NekoHime in Battle!`);
      setTimeout(() => setAssetMountedNotice(null), 5000);
    } catch (err) {
      console.error('Failed to load model into battle:', err);
      setAssetMountedNotice(`Mount error: ${(err as Error).message}`);
      setTimeout(() => setAssetMountedNotice(null), 4000);
    }
  };

  // Initialize 3D Arena & Monsters
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const arena = createBattleArena(container);
    arenaRef.current = arena;

    const spellManager = createSpellManager(arena.scene);
    spellManagerRef.current = spellManager;

    const playerMap = new Map<string, Creature3DInstance>();
    const enemyMap = new Map<string, Creature3DInstance>();

    // Spawn 5 Player 3D Monsters
    playerTeam.forEach((p, idx) => {
      const form = PLAYER_FORMATION[idx] || PLAYER_FORMATION[0];
      const creature = createMonster3D(p.variantId, p.element, p.awakeningStage !== 'BASE', p.isAlive);
      creature.root.position.set(form.x, form.y, form.z);
      creature.root.rotation.y = form.rotationY;
      creature.root.userData = { id: p.id, team: 'PLAYER', baseRotationY: form.rotationY };
      arena.scene.add(creature.root);
      playerMap.set(p.id, creature);
    });

    // Spawn 5 Enemy 3D Monsters
    enemyTeam.forEach((e, idx) => {
      const form = ENEMY_FORMATION[idx] || ENEMY_FORMATION[0];
      const creature = createMonster3D(e.variantId, e.element, e.awakeningStage !== 'BASE', e.isAlive);
      if (e.variantId && e.variantId.includes('boss')) {
        creature.root.scale.multiplyScalar(1.25);
      }
      creature.root.position.set(form.x, form.y, form.z);
      creature.root.rotation.y = form.rotationY;
      creature.root.userData = { id: e.id, team: 'ENEMY', baseRotationY: form.rotationY };
      arena.scene.add(creature.root);
      enemyMap.set(e.id, creature);
    });

    playerCreaturesRef.current = playerMap;
    enemyCreaturesRef.current = enemyMap;

    // Direct Raycasting Click on 3D Monsters
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClickCanvas = (evt: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, arena.camera);
      // Only target living monsters
      const enemyRoots = Array.from(enemyMap.values())
        .filter((c) => c.isAlive() && c.root.visible)
        .map((c) => c.root);
      const intersects = raycaster.intersectObjects(enemyRoots, true);

      if (intersects.length > 0) {
        let topObj: THREE.Object3D | null = intersects[0].object;
        while (topObj && !topObj.userData.id && topObj.parent) {
          topObj = topObj.parent;
        }
        if (topObj && topObj.userData.id) {
          onSelectTarget(topObj.userData.id);
        }
      }
    };

    container.addEventListener('click', onClickCanvas);

    // Animation & Render Loop
    let lastTime = performance.now();
    let animId = 0;

    const animate = () => {
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Continuously synchronize life and alive status directly from current team state
      const currentTeams = teamsRef.current;
      currentTeams.playerTeam.forEach((p, idx) => {
        const c = playerMap.get(p.id);
        const alive = p.isAlive && p.currentHp > 0;
        if (c) c.setAlive(alive);
        const ped = arena.playerPedestals[idx];
        if (ped) ped.visible = alive;
      });

      currentTeams.enemyTeam.forEach((e, idx) => {
        const c = enemyMap.get(e.id);
        const alive = e.isAlive && e.currentHp > 0;
        if (c) c.setAlive(alive);
        const ped = arena.enemyPedestals[idx];
        if (ped) ped.visible = alive;
      });

      // Update all 10 creatures and smoothly ease back to formation facing angles when idle
      playerMap.forEach((c) => {
        c.update(delta);
        if (c.isAlive() && c.getAction() === 'idle') {
          const baseRot = c.root.userData.baseRotationY ?? 0;
          c.root.rotation.y = THREE.MathUtils.lerp(c.root.rotation.y, baseRot, delta * 3.5);
        }
      });

      enemyMap.forEach((c) => {
        c.update(delta);
        if (c.isAlive() && c.getAction() === 'idle') {
          const baseRot = c.root.userData.baseRotationY ?? Math.PI;
          c.root.rotation.y = THREE.MathUtils.lerp(c.root.rotation.y, baseRot, delta * 3.5);
        }
      });

      // Update 3D Spells
      spellManager.update(delta);

      // Update Arena, Particles & Camera
      arena.update(delta);

      // Continuously project 3D creature heads to 2D screen coords for overhead buff/debuff badges
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        const nextCoords: Record<string, { x: number; y: number }> = {};
        const tempPos = new THREE.Vector3();

        const computeScreenCoord = (participant: BattleParticipant, creatureMap: Map<string, Creature3DInstance>) => {
          if (!participant.isAlive || participant.currentHp <= 0 || participant.activeEffects.length === 0) return;
          const creature = creatureMap.get(participant.id);
          if (!creature || !creature.root) return;

          creature.root.getWorldPosition(tempPos);
          tempPos.y += 2.6; // Overhead position directly above monster head
          tempPos.project(arena.camera);

          if (tempPos.z > -1.0 && tempPos.z < 1.0) {
            const screenX = ((tempPos.x + 1) / 2) * w;
            const screenY = ((-tempPos.y + 1) / 2) * h;
            nextCoords[participant.id] = { x: screenX, y: screenY };
          }
        };

        currentTeams.playerTeam.forEach((p) => computeScreenCoord(p, playerMap));
        currentTeams.enemyTeam.forEach((e) => computeScreenCoord(e, enemyMap));

        setOverheadCoords(nextCoords);
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    // Responsive Canvas Resizing
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !arena) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        arena.camera.aspect = w / h;
        arena.camera.updateProjectionMatrix();
        arena.renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener('click', onClickCanvas);
      playerMap.forEach((c) => c.dispose());
      enemyMap.forEach((c) => c.dispose());
      arena.dispose();
    };
  }, []);

  // Synchronize Monster Life / Defeat States & Pedestals
  useEffect(() => {
    playerTeam.forEach((p, idx) => {
      const c = playerCreaturesRef.current.get(p.id);
      if (c) c.setAlive(p.isAlive);
      const ped = arenaRef.current?.playerPedestals[idx];
      if (ped) ped.visible = p.isAlive;
    });
    enemyTeam.forEach((e, idx) => {
      const c = enemyCreaturesRef.current.get(e.id);
      if (c) c.setAlive(e.isAlive);
      const ped = arenaRef.current?.enemyPedestals[idx];
      if (ped) ped.visible = e.isAlive;
    });
  }, [playerTeam, enemyTeam]);

  // Synchronize Active Pedestal Halos
  useEffect(() => {
    const arena = arenaRef.current;
    if (!arena) return;

    // Highlight active player pedestal or enemy pedestal (only when alive)
    playerTeam.forEach((p, idx) => {
      const ped = arena.playerPedestals[idx];
      if (ped) {
        ped.visible = p.isAlive;
        ped.scale.setScalar(p.id === currentActorId ? 1.25 : 1.0);
      }
    });

    enemyTeam.forEach((e, idx) => {
      const ped = arena.enemyPedestals[idx];
      if (ped) {
        ped.visible = e.isAlive;
        ped.scale.setScalar(e.id === currentActorId ? 1.25 : e.id === selectedTargetId ? 1.15 : 1.0);
      }
    });
  }, [currentActorId, selectedTargetId, playerTeam, enemyTeam]);

  // Handle Combat Actions (3D Attack Lunges, 3D Spells, Camera Zoom, Hit Flinch)
  useEffect(() => {
    if (!latestAction) return;
    if (latestAction.id && latestAction.id === prevActionIdRef.current) return;
    if (latestAction.id) prevActionIdRef.current = latestAction.id;

    const { actorId, targetId, skillName, slot, element, allTargetIds, isAoe, isAllyBuff, isExtraTurn } = latestAction;
    const isPlayerActor = playerTeam.some((p) => p.id === actorId);

    const actorCreature = isPlayerActor
      ? playerCreaturesRef.current.get(actorId)
      : enemyCreaturesRef.current.get(actorId);

    const targetCreature = targetId
      ? playerCreaturesRef.current.get(targetId) || enemyCreaturesRef.current.get(targetId)
      : null;

    const actorParticipant = [...playerTeam, ...enemyTeam].find((p) => p.id === actorId);

    if (isExtraTurn && actorParticipant) {
      setExtraTurnNotice({ id: actorId, name: actorParticipant.name });
      setTimeout(() => {
        setExtraTurnNotice(null);
      }, 1800);
    }

    if (actorCreature) {
      const isSkill = slot > 1;
      const duration = slot === 3 ? 1.35 : slot === 2 ? 1.1 : 0.8;

      const actorParticipant = [...playerTeam, ...enemyTeam].find((p) => p.id === actorId);
      const varId = (actorParticipant?.variantId || '').toLowerCase();
      const famId = varId.includes('pyrosaur')
        ? 'fam_pyrosaur'
        : varId.includes('tideguard')
        ? 'fam_tideguard'
        : varId.includes('floraweaver')
        ? 'fam_floraweaver'
        : varId.includes('luminary')
        ? 'fam_luminary'
        : varId.includes('shadowstalker')
        ? 'fam_shadowstalker'
        : undefined;

      const livingAllies = isPlayerActor
        ? (playerTeam
            .filter((p) => p.isAlive)
            .map((p) => playerCreaturesRef.current.get(p.id)?.root.position)
            .filter(Boolean) as THREE.Vector3[])
        : (enemyTeam
            .filter((e) => e.isAlive)
            .map((e) => enemyCreaturesRef.current.get(e.id)?.root.position)
            .filter(Boolean) as THREE.Vector3[]);

      const livingEnemies = isPlayerActor
        ? (enemyTeam
            .filter((e) => e.isAlive)
            .map((e) => enemyCreaturesRef.current.get(e.id)?.root.position)
            .filter(Boolean) as THREE.Vector3[])
        : (playerTeam
            .filter((p) => p.isAlive)
            .map((p) => playerCreaturesRef.current.get(p.id)?.root.position)
            .filter(Boolean) as THREE.Vector3[]);

      // Turn attacker to directly face target during strike
      if (targetCreature) {
        const actorPos = actorCreature.root.position;
        const targetPos = targetCreature.root.position;
        const targetAngle = Math.atan2(targetPos.x - actorPos.x, targetPos.z - actorPos.z);
        actorCreature.root.rotation.y = targetAngle;
      }

      actorCreature.playAction(isSkill ? 'skill' : 'attack', duration, skillName);

      // Camera Dynamic Framing during Skill
      const arena = arenaRef.current;
      if (arena && isSkill) {
        const actorPos = actorCreature.root.position;
        arena.setCameraTarget(
          new THREE.Vector3(actorPos.x * 0.4, 4.2, actorPos.z + (isPlayerActor ? 5.2 : -5.2)),
          new THREE.Vector3(actorPos.x, 1.2, actorPos.z),
          4.0
        );
        setTimeout(() => {
          if (arenaRef.current) arenaRef.current.resetCamera();
        }, 1150);
      }

      // Launch 3D Monster-Specific Special Graphics
      if (spellManagerRef.current) {
        const startPos = actorCreature.root.position;
        const defaultTargetPos = isAllyBuff
          ? actorCreature.root.position
          : livingEnemies[0] || (isPlayerActor ? new THREE.Vector3(0, 0, -3) : new THREE.Vector3(0, 0, 3));
        const endPos = targetCreature ? targetCreature.root.position : defaultTargetPos;

        // Collect all target positions
        const allTargetPositions =
          allTargetIds && allTargetIds.length > 0
            ? (allTargetIds
                .map((id) => (playerCreaturesRef.current.get(id) || enemyCreaturesRef.current.get(id))?.root.position)
                .filter(Boolean) as THREE.Vector3[])
            : isAllyBuff
            ? livingAllies
            : livingEnemies;

        spellManagerRef.current.launchSpell({
          familyId: famId,
          skillName,
          slot,
          element: actorParticipant?.element || element,
          startPos,
          targetPos: endPos,
          allTargets: allTargetPositions.length > 0 ? allTargetPositions : (isAllyBuff ? livingAllies : livingEnemies),
          isAoe: isAoe ?? (isSkill && !isAllyBuff),
          isSelfOrAllyBuff: isAllyBuff,
          duration: slot === 3 ? 1.2 : slot === 2 ? 0.95 : 0.65,
          onImpact: () => {
            // Trigger target hit reaction flinch on impact
            if (targetCreature && targetCreature.isAlive()) {
              targetCreature.playAction('hit', 0.55);
            } else if (!isAllyBuff && slot >= 2) {
              // AoE hit reaction on all living opposing creatures
              const enemyTeamMap = isPlayerActor ? enemyCreaturesRef.current : playerCreaturesRef.current;
              enemyTeamMap.forEach((c) => {
                if (c.isAlive()) c.playAction('hit', 0.55);
              });
            }
          },
        });
      }
    }
  }, [latestAction, playerTeam, enemyTeam]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingFile(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleDropGLB(file);
      }}
      className={`relative w-full h-[400px] sm:h-[480px] md:h-[540px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl select-none ${
        isDraggingFile ? 'ring-2 ring-emerald-400 border-emerald-500' : ''
      }`}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-pointer" />

      {/* Hidden File Input for External GLB Asset Loading */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".glb,.gltf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleDropGLB(file);
        }}
      />

      {/* Drag & Drop Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center pointer-events-none text-emerald-400">
          <FolderUp className="w-12 h-12 mb-2 animate-bounce" />
          <p className="font-bold text-sm">Drop 3D Character GLB into 5v5 Battle</p>
          <p className="text-xs text-slate-400">Will dynamically mount for NekoHime</p>
        </div>
      )}

      {/* Asset Mount Notice */}
      {assetMountedNotice && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border border-emerald-500/80 px-4 py-1.5 rounded-full text-xs font-bold text-emerald-300 shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{assetMountedNotice}</span>
        </div>
      )}

      {/* Dynamic 3D Target Selection Banner */}
      <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-full text-xs font-bold text-slate-300 shadow-xl flex items-center gap-2 pointer-events-none">
        <Swords className="w-3.5 h-3.5 text-amber-400" />
        <span>Click 3D enemies to direct attacks</span>
      </div>

      {/* Extra Turn Cinematic Visual Indicator */}
      {extraTurnNotice && (
        <div className="absolute top-3 right-3 z-30 pointer-events-none animate-pulse">
          <div className="bg-gradient-to-r from-purple-950/95 to-slate-950/95 border-2 border-purple-400/90 px-3.5 py-1.5 rounded-full shadow-[0_0_25px_rgba(168,85,247,0.75)] text-xs font-black text-purple-200 tracking-wider flex items-center gap-2 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-spin" />
            <span>EXTRA TURN • {extraTurnNotice.name.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* 3D Monster Overhead Buff & Debuff Badges with Turn Counters */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {[...playerTeam, ...enemyTeam].map((participant) => {
          const coords = overheadCoords[participant.id];
          if (!coords || !participant.isAlive || participant.activeEffects.length === 0) {
            return null;
          }

          return (
            <div
              key={`overhead-${participant.id}`}
              className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 rounded-lg bg-slate-950/90 border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all duration-75"
              style={{
                left: `${coords.x}px`,
                top: `${coords.y}px`,
              }}
            >
              {participant.activeEffects.map((eff, i) => (
                <BuffDebuffIcon key={eff.id || `${eff.type}-${i}`} effect={eff} size="sm" />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
