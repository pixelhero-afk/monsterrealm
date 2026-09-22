/**
 * 3D Summoning Chamber & Sequential Monster Reveal
 * Features:
 * - Real-time 3D animated Leyline Summoning Circle on the altar.
 * - Monsters emerge / pop out of the circle 1-by-1 with upward arc & victory animations.
 * - Epic / Legendary pulls trigger an extra cool GREEN LIGHTNING storm effect:
 *   crackling 3D emerald lightning bolts, dramatic neon green altar flash, and shockwaves!
 * - Interactive 360-degree creature drag inspection, Auto-advance, and Skip All controls.
 * - Concludes with a clean manifest summary of all summoned monsters.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ElementType, MonsterVariant, SummonResult } from '../../types';
import { createMonster3D, Creature3DInstance } from './creatures/createCreatureMesh';
import { ELEMENT_VISUALS } from '../../data/elements';
import { monster2DRegistry } from '../../services/character2d/monster2DRegistry';
import {
  Sparkles,
  Zap,
  Swords,
  Shield,
  RotateCw,
  ChevronRight,
  FastForward,
  Play,
  Pause,
  Crown,
  Award,
  Flame,
} from 'lucide-react';
import { MonsterCard } from '../MonsterCard';

interface SummonReveal3DProps {
  results: SummonResult[];
  onComplete: () => void;
  onSummonAgain?: (count: number) => void;
}

export const SummonReveal3D: React.FC<SummonReveal3DProps> = ({
  results,
  onComplete,
  onSummonAgain,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [greenLightningActive, setGreenLightningActive] = useState<boolean>(false);
  const [selectedInspectMonster, setSelectedInspectMonster] = useState<MonsterVariant | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const creatureRef = useRef<Creature3DInstance | null>(null);
  const lightningGroupRef = useRef<THREE.Group | null>(null);
  const greenLightRef = useRef<THREE.PointLight | null>(null);
  const altarGroupRef = useRef<THREE.Group | null>(null);
  const ringsRef = useRef<THREE.Mesh[]>([]);
  const popAnimRef = useRef<{ active: boolean; progress: number }>({ active: false, progress: 0 });

  const currentResult = results[currentIndex] || results[0];
  const currentVariant = currentResult?.variant;
  const isEpicOrLegendary =
    currentVariant?.rarity === 'EPIC' || currentVariant?.rarity === 'LEGENDARY';

  // Spawn new monster into 3D scene
  const spawnMonsterInScene = useCallback(
    (variant: MonsterVariant) => {
      const scene = sceneRef.current;
      if (!scene) return;

      // Clean up previous creature
      if (creatureRef.current) {
        scene.remove(creatureRef.current.root);
        creatureRef.current.dispose();
        creatureRef.current = null;
      }

      // Check for green lightning for Epic or Legendary
      const isHighTier = variant.rarity === 'EPIC' || variant.rarity === 'LEGENDARY';
      if (isHighTier) {
        setGreenLightningActive(true);
        setTimeout(() => setGreenLightningActive(false), 2400);
      } else {
        setGreenLightningActive(false);
      }

      // Create new creature
      const creature = createMonster3D(variant.variantId, variant.element, false);
      // Start emerging from down inside the summoning circle
      creature.root.position.set(0, -1.2, 0);
      creature.root.scale.set(0.1, 0.1, 0.1);
      scene.add(creature.root);
      creatureRef.current = creature;

      // Start pop-out animation
      popAnimRef.current = { active: true, progress: 0 };
    },
    []
  );

  // Advance to next monster
  const handleNext = useCallback(() => {
    if (currentIndex + 1 < results.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (results[nextIdx]) {
        spawnMonsterInScene(results[nextIdx].variant);
      }
    } else {
      setIsFinished(true);
    }
  }, [currentIndex, results, spawnMonsterInScene]);

  // Skip all to finish
  const handleSkipAll = () => {
    setIsFinished(true);
  };

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlay || isFinished) return;
    const timer = setTimeout(() => {
      handleNext();
    }, isEpicOrLegendary ? 3600 : 2600);

    return () => clearTimeout(timer);
  }, [isAutoPlay, currentIndex, isFinished, isEpicOrLegendary, handleNext]);

  // Keyboard navigation (Space or Enter to advance)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (!isFinished) {
          handleNext();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNext, isFinished]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isFinished) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060814);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 2.0, 5.4);
    camera.lookAt(0, 0.9, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0x334155, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    sunLight.position.set(4, 8, 5);
    scene.add(sunLight);

    // Dynamic Altar Spot Light
    const spotLight = new THREE.SpotLight(0xa855f7, 4.5, 14, Math.PI / 3, 0.5);
    spotLight.position.set(0, 6.5, 0);
    scene.add(spotLight);

    // Green Lightning Flash Light
    const greenPointLight = new THREE.PointLight(0x22c55e, 0, 18, 1.2);
    greenPointLight.position.set(0, 2.5, 0);
    scene.add(greenPointLight);
    greenLightRef.current = greenPointLight;

    // 3D Summoning Altar Group
    const altarGroup = new THREE.Group();
    altarGroupRef.current = altarGroup;

    // Basalt Pedestal
    const altarBaseGeo = new THREE.CylinderGeometry(2.0, 2.4, 0.35, 48);
    const altarBaseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.7,
    });
    const altarBase = new THREE.Mesh(altarBaseGeo, altarBaseMat);
    altarBase.position.y = -0.18;
    altarGroup.add(altarBase);

    // Outer Concentric Glowing Rune Ring
    const ring1Geo = new THREE.TorusGeometry(1.8, 0.04, 8, 48);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 0.02;
    altarGroup.add(ring1);

    // Middle Concentric Ring (Opposite rotation)
    const ring2Geo = new THREE.TorusGeometry(1.25, 0.035, 8, 36);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = 0.03;
    altarGroup.add(ring2);

    // Inner Leyline Ring
    const ring3Geo = new THREE.TorusGeometry(0.7, 0.025, 6, 24);
    const ring3Mat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.x = Math.PI / 2;
    ring3.position.y = 0.04;
    altarGroup.add(ring3);

    ringsRef.current = [ring1, ring2, ring3];

    // Rune Nodes around outer ring
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const nodeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 8);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xa855f7 : 0x38bdf8,
      });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(Math.cos(angle) * 1.8, 0.03, Math.sin(angle) * 1.8);
      altarGroup.add(node);
    }

    scene.add(altarGroup);

    // Leyline Vertical Particle Pillar
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.2 + Math.random() * 1.5;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = Math.random() * 4.0;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xc084fc,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 3D Green Lightning Group
    const lightningGroup = new THREE.Group();
    scene.add(lightningGroup);
    lightningGroupRef.current = lightningGroup;

    // Interactive Drag Rotation
    let isDragging = false;
    let prevMouseX = 0;
    let targetRotY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      targetRotY += (e.clientX - prevMouseX) * 0.012;
      prevMouseX = e.clientX;
    };
    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Spawn first monster
    if (results[0]) {
      spawnMonsterInScene(results[0].variant);
    }

    let lastTime = performance.now();
    let animId = 0;
    let lightningTimer = 0;

    const animate = () => {
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Rotate Summoning Rings
      if (altarGroupRef.current) {
        altarGroupRef.current.rotation.y += delta * 0.4;
      }
      if (ringsRef.current[1]) {
        ringsRef.current[1].rotation.z -= delta * 0.8;
      }
      if (ringsRef.current[2]) {
        ringsRef.current[2].rotation.z += delta * 1.2;
      }

      // Swirl Leyline particles
      const pos = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3 + 1] += delta * 1.5;
        if (pos[i * 3 + 1] > 4.0) {
          pos[i * 3 + 1] = 0.05;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Monster Pop-Out Animation Logic
      if (popAnimRef.current.active && creatureRef.current) {
        popAnimRef.current.progress += delta * 2.2; // ~0.45s pop duration
        const p = Math.min(1, popAnimRef.current.progress);

        // Elastic / overshoot bounce formula
        const popY = -1.2 + (p < 0.7 ? (p / 0.7) * 1.5 : 1.5 - ((p - 0.7) / 0.3) * 0.3);
        const popScale = Math.min(1, p * 1.25);

        creatureRef.current.root.position.y = popY;
        creatureRef.current.root.scale.set(popScale, popScale, popScale);

        if (p >= 1) {
          popAnimRef.current.active = false;
          creatureRef.current.root.position.y = 0;
          creatureRef.current.root.scale.set(1, 1, 1);
          creatureRef.current.playAction('victory', 1.5);
        }
      }

      // Green Lightning Generator (Triggered during Epic/Legendary emergence)
      if (greenLightningActive && lightningGroupRef.current && greenLightRef.current) {
        lightningTimer += delta;
        if (lightningTimer > 0.08) {
          lightningTimer = 0;

          // Clear previous lightning lines
          while (lightningGroupRef.current.children.length > 0) {
            const child = lightningGroupRef.current.children[0] as THREE.Line;
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
            lightningGroupRef.current.remove(child);
          }

          // Generate 2 to 4 crackling jagged green lightning bolts
          const boltCount = Math.floor(Math.random() * 3) + 2;
          for (let b = 0; b < boltCount; b++) {
            const points: THREE.Vector3[] = [];
            const startX = (Math.random() - 0.5) * 2.0;
            const startZ = (Math.random() - 0.5) * 2.0;
            const targetX = (Math.random() - 0.5) * 1.0;
            const targetZ = (Math.random() - 0.5) * 1.0;

            const segments = 8;
            for (let s = 0; s <= segments; s++) {
              const t = s / segments;
              const curX = THREE.MathUtils.lerp(startX, targetX, t) + (Math.random() - 0.5) * 0.35;
              const curY = THREE.MathUtils.lerp(5.5, 0.05, t);
              const curZ = THREE.MathUtils.lerp(startZ, targetZ, t) + (Math.random() - 0.5) * 0.35;
              points.push(new THREE.Vector3(curX, curY, curZ));
            }

            const boltGeo = new THREE.BufferGeometry().setFromPoints(points);
            const boltMat = new THREE.LineBasicMaterial({
              color: b % 2 === 0 ? 0x22c55e : 0x86efac,
              linewidth: 3,
              transparent: true,
              opacity: 0.95,
              blending: THREE.AdditiveBlending,
            });
            const boltLine = new THREE.Line(boltGeo, boltMat);
            lightningGroupRef.current.add(boltLine);
          }

          // Strobe green light
          greenLightRef.current.intensity = 8.0 + Math.random() * 6.0;
        }
      } else {
        if (greenLightRef.current) {
          greenLightRef.current.intensity = 0;
        }
        if (lightningGroupRef.current && lightningGroupRef.current.children.length > 0) {
          while (lightningGroupRef.current.children.length > 0) {
            const child = lightningGroupRef.current.children[0] as THREE.Line;
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
            lightningGroupRef.current.remove(child);
          }
        }
      }

      // Smooth Creature rotation
      if (creatureRef.current) {
        creatureRef.current.root.rotation.y = THREE.MathUtils.lerp(
          creatureRef.current.root.rotation.y,
          targetRotY,
          delta * 8
        );
        creatureRef.current.update(delta);
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (creatureRef.current) {
        creatureRef.current.dispose();
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [results, isFinished, greenLightningActive, spawnMonsterInScene]);

  // If sequential summoning is finished, show the complete Manifest Summary
  if (isFinished) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in my-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400">
                <Sparkles className="w-4 h-4" />
                Astral Summoning Manifest
              </div>
              <h2 className="text-2xl font-black text-slate-100 font-serif">
                Acquired Creatures ({results.length})
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {onSummonAgain && (
                <>
                  <button
                    onClick={() => onSummonAgain(1)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer transition-colors"
                  >
                    Summon 1x
                  </button>
                  <button
                    onClick={() => onSummonAgain(10)}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-black text-white cursor-pointer shadow-lg shadow-violet-950 transition-colors"
                  >
                    Summon 10x
                  </button>
                </>
              )}
              <button
                onClick={onComplete}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer"
              >
                Return to Altar Gate
              </button>
            </div>
          </div>

          {/* Summon Results Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {results.map((res, i) => {
              const isHigh = res.variant.rarity === 'EPIC' || res.variant.rarity === 'LEGENDARY';

              return (
                <div
                  key={`${res.instance.instanceId}_${i}`}
                  onClick={() => setSelectedInspectMonster(res.variant)}
                  className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center group hover:scale-105 ${
                    isHigh
                      ? 'bg-gradient-to-b from-emerald-950/40 to-slate-950 border-emerald-400/80 ring-1 ring-emerald-400/60 shadow-lg shadow-emerald-950/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {res.isNew && (
                    <span className="absolute -top-2 right-2 bg-emerald-500 text-slate-950 font-black text-[8px] px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
                      NEW!
                    </span>
                  )}

                  <MonsterCard
                    variant={res.variant}
                    level={1}
                    size="sm"
                    showStats={false}
                    className="w-full pointer-events-none"
                  />

                  {isHigh && (
                    <div className="mt-1 text-[9px] font-black text-emerald-400 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      <span>{res.variant.rarity}</span>
                    </div>
                  )}

                  <div className="mt-1 text-[9px] text-slate-400 group-hover:text-cyan-300 transition-colors">
                    Tap to inspect
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center text-xs text-slate-500">
            All summoned monsters and duplicate compensations have been deposited to your Monster Box and inventory.
          </div>
        </div>

        {/* Monster Quick Inspect Popup */}
        {selectedInspectMonster && (
          <div
            className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSelectedInspectMonster(null)}
          >
            <div
              className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-left space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-400">
                    {selectedInspectMonster.element} • {selectedInspectMonster.rarity}
                  </span>
                  <h3 className="text-xl font-black text-slate-100 font-serif">
                    {selectedInspectMonster.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedInspectMonster(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-serif">
                {selectedInspectMonster.lore}
              </p>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">HP</div>
                  <div className="font-bold text-rose-300 font-mono">
                    {selectedInspectMonster.baseStats.hp}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">ATK</div>
                  <div className="font-bold text-amber-300 font-mono">
                    {selectedInspectMonster.baseStats.attack}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">SPD</div>
                  <div className="font-bold text-emerald-300 font-mono">
                    {selectedInspectMonster.baseStats.speed}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedInspectMonster(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const elementVisual = ELEMENT_VISUALS[currentVariant?.element || 'FIRE'];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-3 sm:p-4 select-none"
    >
      {/* Green Lightning Flash Overlay */}
      {greenLightningActive && (
        <div className="absolute inset-0 bg-emerald-500/20 z-40 pointer-events-none animate-pulse" />
      )}

      {/* Top Banner & Progression Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between gap-4 mb-2 z-10">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-black text-amber-400 tracking-wider">
            Summon {currentIndex + 1} / {results.length}
          </span>
          {/* Progress Indicators */}
          <div className="flex items-center gap-1.5">
            {results.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'w-6 bg-amber-400 ring-2 ring-amber-400/50'
                    : idx < currentIndex
                    ? 'w-2 bg-slate-600'
                    : 'w-2 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isAutoPlay
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            Auto
          </button>

          <button
            onClick={handleSkipAll}
            className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <FastForward className="w-3.5 h-3.5" />
            Skip
          </button>
        </div>
      </div>

      {/* 3D Altar Stage Canvas */}
      <div
        className={`relative w-full max-w-2xl h-[380px] sm:h-[440px] rounded-3xl overflow-hidden border shadow-[0_0_80px_rgba(0,0,0,0.9)] transition-colors duration-500 ${
          greenLightningActive
            ? 'border-emerald-400/90 shadow-emerald-950/80 ring-2 ring-emerald-400'
            : 'border-slate-800 bg-slate-900/40'
        }`}
      >
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Green Lightning Announcement Banner */}
        {greenLightningActive && (
          <div className="absolute top-4 inset-x-4 z-20 flex justify-center pointer-events-none">
            <div className="px-5 py-2 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 border-2 border-emerald-400 text-emerald-200 font-black text-xs sm:text-sm tracking-widest uppercase shadow-2xl flex items-center gap-2 animate-pulse">
              <Zap className="w-4 h-4 text-emerald-300 animate-bounce" />
              <span>⚡ {currentVariant?.rarity} ANOMALY! GREEN LIGHTNING STRIKE! ⚡</span>
              <Zap className="w-4 h-4 text-emerald-300 animate-bounce" />
            </div>
          </div>
        )}

        {/* 3D Drag Rotator Hint */}
        <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-3 py-1 rounded-full text-[10px] font-bold text-slate-300 shadow-lg flex items-center gap-1.5 pointer-events-none">
          <RotateCw className="w-3 h-3 text-cyan-400" />
          <span>Drag creature to inspect 360°</span>
        </div>

        {/* Element Aura Indicator */}
        <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-3 py-1 rounded-full text-[10px] font-bold text-slate-300 shadow-lg pointer-events-none flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: elementVisual.borderHex }}
          />
          <span>{currentVariant?.element} Leyline</span>
        </div>
      </div>

      {/* Monster Details Card (Appears as the monster emerges) */}
      {currentVariant && (
        <div
          onClick={handleNext}
          className={`mt-3 w-full max-w-2xl bg-slate-900/95 border rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer transition-all hover:scale-[1.01] ${
            isEpicOrLegendary
              ? 'border-emerald-500/80 shadow-emerald-950/60'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          {/* Primary 2D Monster Artwork Display */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 relative shadow-inner">
            <img
              src={monster2DRegistry.getStateUrl(currentVariant.variantId, 'IDLE')}
              alt={currentVariant.name}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain filter drop-shadow-md"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <span
                className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase border"
                style={{
                  backgroundColor: `${elementVisual.borderHex}22`,
                  borderColor: elementVisual.borderHex,
                  color: elementVisual.borderHex,
                }}
              >
                {currentVariant.element}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${
                  isEpicOrLegendary
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-amber-300'
                }`}
              >
                {currentVariant.rarity}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 border border-slate-700 text-slate-300">
                {currentVariant.primaryRole}
              </span>
              {currentResult.isNew && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-slate-950 animate-bounce">
                  ★ NEW DISCOVERY!
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-serif">
              {currentVariant.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-md line-clamp-1 sm:line-clamp-2">
              {currentVariant.lore}
            </p>

            {/* Base Stats Row */}
            <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-xs text-slate-300 font-mono">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                HP: {currentVariant.baseStats.hp}
              </span>
              <span className="flex items-center gap-1">
                <Swords className="w-3.5 h-3.5 text-amber-400" />
                ATK: {currentVariant.baseStats.attack}
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                SPD: {currentVariant.baseStats.speed}
              </span>
            </div>

            {currentResult.isDuplicate && currentResult.duplicateCompensation && (
              <div className="mt-1.5 text-[10px] text-amber-300/90 font-semibold">
                Duplicate Conversion: +{currentResult.duplicateCompensation.gold} Gold & {currentResult.duplicateCompensation.shards} Awakening Shards
              </div>
            )}
          </div>

          {/* Action CTA Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl active:scale-95 transition-all cursor-pointer border border-amber-300 whitespace-nowrap flex items-center justify-center gap-1.5"
          >
            <span>{currentIndex + 1 < results.length ? 'Next Summon' : 'View Summary'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
