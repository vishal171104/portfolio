import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { ArrowLeft, ChevronDown, Github, Linkedin, Mail, FileText } from 'lucide-react';
import * as THREE from 'three';
import { DEEP_DIVES, DIVE_ORDER, DiveConfig } from '../../data/deep_dives';

// ─────────────────────────────────────────────────────────────────────────────
// Scroll-driven cinematic, travelled from INSIDE the DNA — deliberately SPARSE.
// Design rules that keep it professional:
//   · exactly one text layer — the HTML chapter cards; the 3D never speaks
//   · one focal object per chapter, centred in a "replication bubble"
//   · a quiet helix: few beads, thin rungs, deep fog, restrained bloom
// The two backbones keep real B-DNA's asymmetric groove offset; base-pair
// rungs use the textbook A-T / G-C colour pairs — quietly correct.
// Scroll state is per-mount and drives camera + HTML from one rAF.
// ─────────────────────────────────────────────────────────────────────────────

interface ScrollState { target: number; current: number }

const SCROLL_PER_CHAPTER = 1200;
const UP = new THREE.Vector3(0, 1, 0);

// Every journey loses altitude as it progresses — wheel-down goes down.
// All four are GENTLE arcs: the helix walls provide the drama, so the camera
// path must stay orderly or the loops pile into visual noise. Curvature and
// descent rate differ subtly per domain; the real differentiation is accent
// colour + station content.
function buildWaypoints(kind: DiveConfig['path'], n: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    switch (kind) {
      case 'helix':
        pts.push(new THREE.Vector3(Math.sin(i * 0.75) * 6, -i * 7, -i * 22));
        break;
      case 'road':
        pts.push(new THREE.Vector3(Math.sin(i * 0.9) * 7, -i * 3.5, -i * 26));
        break;
      case 'zigzag':
        pts.push(new THREE.Vector3(i % 2 === 0 ? -5 : 5, -i * 4, -i * 24));
        break;
      case 'orbit':
        pts.push(new THREE.Vector3(Math.cos(i * 0.8) * 6 - 6, -i * 8, -i * 22));
        break;
    }
  }
  return pts;
}

// Textbook base colours: adenine/thymine, guanine/cytosine.
const BASE_COLORS: Record<string, THREE.Color> = {
  A: new THREE.Color('#4f9dff'),
  T: new THREE.Color('#ffd24f'),
  G: new THREE.Color('#4fff88'),
  C: new THREE.Color('#ff5f6b'),
};
const BASE_PAIRS: Array<[keyof typeof BASE_COLORS, keyof typeof BASE_COLORS]> =
  [['A', 'T'], ['T', 'A'], ['G', 'C'], ['C', 'G']];

const TUNNEL_RADIUS = 12;
// Real strands aren't 180° apart — this offset carves the major/minor grooves.
const GROOVE_OFFSET = 2.2;

function frameAt(curve: THREE.CatmullRomCurve3, t: number) {
  const tan = curve.getTangent(t).normalize();
  let side = new THREE.Vector3().crossVectors(tan, UP);
  if (side.lengthSq() < 1e-4) side = new THREE.Vector3(1, 0, 0);
  side.normalize();
  const up2 = new THREE.Vector3().crossVectors(side, tan).normalize();
  return { tan, side, up2 };
}

// Replication-bubble factor: strands part gently around each chapter.
function bulgeAt(t: number, stationTs: number[]) {
  let b = 0;
  for (const st of stationTs) {
    const d = (t - st) / 0.06;
    b = Math.max(b, Math.exp(-d * d));
  }
  return 1 + b * 0.7;
}

function dwell(f: number): number {
  const i = Math.round(f);
  const d = f - i;
  return i + Math.sign(d) * d * d * 2;
}

const CameraRig = ({ scroll, curve, chapters }: {
  scroll: ScrollState; curve: THREE.CatmullRomCurve3; chapters: number;
}) => {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame(() => {
    const f = dwell(scroll.current * (chapters - 1));
    const t = THREE.MathUtils.clamp(f / (chapters - 1), 0, 1);

    const pos = curve.getPoint(t);
    const { tan, side } = frameAt(curve, t);

    const camPos = pos.clone()
      .addScaledVector(tan, -10)
      .addScaledVector(side, 2.2)
      .add(new THREE.Vector3(0, 1.6, 0));
    const look = pos.clone().addScaledVector(tan, 5);

    if (!initialized.current) {
      camera.position.copy(camPos.clone().addScaledVector(tan, -12).add(new THREE.Vector3(0, 3, 0)));
      lookTarget.current.copy(look);
      initialized.current = true;
    }

    camera.position.lerp(camPos, 0.06);
    lookTarget.current.lerp(look, 0.08);
    camera.lookAt(lookTarget.current);
  });
  return null;
};

// ── The quiet helix ──────────────────────────────────────────────────────────
const HelixTunnel = ({ curve, accent, stationTs }: {
  curve: THREE.CatmullRomCurve3; accent: string; stationTs: number[];
}) => {
  const beadsRef = useRef<THREE.InstancedMesh>(null);
  const rungARef = useRef<THREE.InstancedMesh>(null);
  const rungBRef = useRef<THREE.InstancedMesh>(null);

  const { beadCount, beadMatrices, rungs } = useMemo(() => {
    const SEG = 240;
    const turns = 8 + stationTs.length;
    const dummy = new THREE.Object3D();
    const beadMatrices: THREE.Matrix4[] = [];
    const strandPts: [THREE.Vector3, THREE.Vector3][] = [];

    for (let i = 0; i < SEG; i++) {
      const t = i / (SEG - 1);
      const { side, up2 } = frameAt(curve, t);
      const center = curve.getPoint(t);
      const r = TUNNEL_RADIUS * bulgeAt(t, stationTs);
      const th = t * turns * Math.PI * 2;
      const pA = center.clone()
        .addScaledVector(side, Math.cos(th) * r)
        .addScaledVector(up2, Math.sin(th) * r);
      const pB = center.clone()
        .addScaledVector(side, Math.cos(th + GROOVE_OFFSET) * r)
        .addScaledVector(up2, Math.sin(th + GROOVE_OFFSET) * r);
      strandPts.push([pA, pB]);
      for (const p of [pA, pB]) {
        dummy.position.copy(p);
        dummy.scale.setScalar(0.45);
        dummy.updateMatrix();
        beadMatrices.push(dummy.matrix.clone());
      }
    }

    // Thin base-pair rungs, absent inside the bubbles — the open reading frame.
    // The exclusion zone is generous: a rung crossing near the camera's dwell
    // point reads as clutter, so none may exist close to a chapter.
    const rungs: { mA: THREE.Matrix4; mB: THREE.Matrix4; cA: THREE.Color; cB: THREE.Color }[] = [];
    const STEP = 10;
    for (let i = 0; i < SEG; i += STEP) {
      const t = i / (SEG - 1);
      if (stationTs.some((st) => Math.abs(t - st) < 0.09)) continue;
      const [pA, pB] = strandPts[i];
      const mid = pA.clone().add(pB).multiplyScalar(0.5);
      const pair = BASE_PAIRS[(i / STEP + Math.floor(i * 0.37)) % 4];
      const make = (from: THREE.Vector3, to: THREE.Vector3) => {
        const dir = to.clone().sub(from);
        const len = dir.length();
        dummy.position.copy(from.clone().add(to).multiplyScalar(0.5));
        dummy.quaternion.setFromUnitVectors(UP, dir.normalize());
        dummy.scale.set(1, len, 1);
        dummy.updateMatrix();
        return dummy.matrix.clone();
      };
      rungs.push({
        mA: make(pA, mid), mB: make(mid, pB),
        cA: BASE_COLORS[pair[0]], cB: BASE_COLORS[pair[1]],
      });
    }

    return { beadCount: beadMatrices.length, beadMatrices, rungs };
  }, [curve, stationTs]);

  useEffect(() => {
    if (beadsRef.current) {
      beadMatrices.forEach((m, i) => beadsRef.current!.setMatrixAt(i, m));
      beadsRef.current.instanceMatrix.needsUpdate = true;
    }
    const fill = (mesh: THREE.InstancedMesh | null, key: 'mA' | 'mB', ckey: 'cA' | 'cB') => {
      if (!mesh) return;
      rungs.forEach((r, i) => {
        mesh.setMatrixAt(i, r[key]);
        mesh.setColorAt(i, r[ckey]);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };
    fill(rungARef.current, 'mA', 'cA');
    fill(rungBRef.current, 'mB', 'cB');
  }, [beadMatrices, rungs]);

  return (
    <group>
      <instancedMesh ref={beadsRef} args={[undefined, undefined, beadCount]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color="#0a0c16" emissive={accent} emissiveIntensity={0.4} roughness={0.4} metalness={0.35} />
      </instancedMesh>
      <instancedMesh ref={rungARef} args={[undefined, undefined, rungs.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.11, 0.11, 1, 8]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.3} />
      </instancedMesh>
      <instancedMesh ref={rungBRef} args={[undefined, undefined, rungs.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.11, 0.11, 1, 8]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.3} />
      </instancedMesh>
    </group>
  );
};

// ── One station template: a soft halo + the domain's single signature object.
// No 3D text anywhere — the HTML card carries every word. ────────────────────

function useProximity(scroll: ScrollState, index: number, chapters: number) {
  const value = useRef(0);
  useFrame(() => {
    const f = scroll.current * (chapters - 1);
    value.current = THREE.MathUtils.clamp(1 - Math.abs(f - index), 0, 1);
  });
  return value;
}

// Primitive totems for projects — small, readable silhouettes.
const ProjectTotem = ({ kind, accent }: { kind?: string; accent: string }) => {
  const mat = <meshStandardMaterial color="#0d0a04" emissive={accent} emissiveIntensity={1.1} roughness={0.35} metalness={0.5} />;
  return (
    <group>
      {kind === 'cards' && (
        <group>
          {[-0.9, 0, 0.9].map((x, i) => (
            <mesh key={i} position={[x, i * 0.12, i * -0.12]} rotation={[0, 0, (i - 1) * 0.35]}>
              <boxGeometry args={[1.15, 1.7, 0.06]} />
              {mat}
            </mesh>
          ))}
        </group>
      )}
      {kind === 'dumbbell' && (
        <group rotation={[0, 0, Math.PI / 14]}>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.14, 0.14, 2.6, 12]} />{mat}</mesh>
          <mesh position={[-1.3, 0, 0]}><sphereGeometry args={[0.52, 16, 16]} />{mat}</mesh>
          <mesh position={[1.3, 0, 0]}><sphereGeometry args={[0.52, 16, 16]} />{mat}</mesh>
        </group>
      )}
      {kind === 'crates' && (
        <group>
          <mesh position={[-0.55, -0.5, 0]}><boxGeometry args={[1, 1, 1]} />{mat}</mesh>
          <mesh position={[0.6, -0.5, 0.15]}><boxGeometry args={[1, 1, 1]} />{mat}</mesh>
          <mesh position={[0, 0.55, 0.05]} rotation={[0, 0.5, 0]}><boxGeometry args={[1, 1, 1]} />{mat}</mesh>
        </group>
      )}
      {kind === 'pin' && (
        <group>
          <mesh position={[0, 0.45, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.55, 1.5, 20]} />{mat}</mesh>
          <mesh position={[0, 1.2, 0]}><sphereGeometry args={[0.55, 18, 18]} />{mat}</mesh>
        </group>
      )}
    </group>
  );
};

interface StationProps {
  domainId: string;
  position: THREE.Vector3;
  accent: string;
  sculpture?: string;
  isLast?: boolean;
  index: number;
  scroll: ScrollState;
  chapters: number;
  facing?: THREE.Vector3;
}

const CleanStation = ({ domainId, position, accent, sculpture, isLast, index, scroll, chapters, facing }: StationProps) => {
  const root = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const obj = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const prox = useProximity(scroll, index, chapters);
  const isGate = domainId === 'experience';

  useEffect(() => {
    if (isGate && root.current && facing) root.current.lookAt(facing);
  }, [isGate, facing]);

  useFrame((state) => {
    const p = prox.current;
    const tm = state.clock.getElapsedTime();
    if (halo.current) {
      const m = halo.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.12 + p * 0.55;
      halo.current.rotation.z = tm * 0.15;
    }
    if (light.current) light.current.intensity = p * 42;
    if (obj.current) {
      obj.current.rotation.y = tm * 0.35;
      obj.current.position.y = (isGate ? 0 : 1.9) + Math.sin(tm * 0.9 + index * 2) * 0.2;
      const s = 0.92 + p * 0.14;
      obj.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={root} position={position}>
      {/* halo: a pedestal disc for objects, the frame itself for gates */}
      {!isGate && (
        <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.4, 0.045, 10, 90]} />
          <meshBasicMaterial color={accent} transparent opacity={0.12} toneMapped={false} />
        </mesh>
      )}
      <pointLight ref={light} color={accent} intensity={0} distance={34} decay={2} />

      {isGate ? (
        // experience: one slender gate, flown straight through
        <group>
          {[-4.2, 4.2].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <boxGeometry args={[0.26, 8.6, 0.26]} />
              <meshStandardMaterial color="#0b0714" emissive={accent} emissiveIntensity={0.5} roughness={0.4} metalness={0.6} />
            </mesh>
          ))}
          <mesh position={[0, 4.3, 0]}>
            <boxGeometry args={[8.7, 0.26, 0.26]} />
            <meshStandardMaterial color="#0b0714" emissive={accent} emissiveIntensity={0.5} roughness={0.4} metalness={0.6} />
          </mesh>
        </group>
      ) : (
        <group ref={obj} position={[0, 1.9, 0]}>
          {domainId === 'skills' && (
            <group>
              <mesh>
                <icosahedronGeometry args={[1.15, 1]} />
                <meshStandardMaterial color="#0a0a12" emissive={accent} emissiveIntensity={1.2} roughness={0.25} metalness={0.6} flatShading />
              </mesh>
              {/* six silent satellites — capability without clutter */}
              {Array.from({ length: 6 }, (_, i) => {
                const a = (i / 6) * Math.PI * 2;
                return (
                  <mesh key={i} position={[Math.cos(a) * 2.5, Math.sin(i * 2.1) * 0.5, Math.sin(a) * 2.5]}>
                    <sphereGeometry args={[0.14, 10, 10]} />
                    <meshBasicMaterial color={accent} toneMapped={false} />
                  </mesh>
                );
              })}
            </group>
          )}
          {domainId === 'projects' && <ProjectTotem kind={sculpture} accent={accent} />}
          {domainId === 'education' && (
            <group>
              <mesh position={[-0.62, 0, 0]} rotation={[0, 0, 0.42]}>
                <boxGeometry args={[1.3, 0.08, 1.7]} />
                <meshStandardMaterial color="#04120a" emissive={accent} emissiveIntensity={1.1} roughness={0.4} />
              </mesh>
              <mesh position={[0.62, 0, 0]} rotation={[0, 0, -0.42]}>
                <boxGeometry args={[1.3, 0.08, 1.7]} />
                <meshStandardMaterial color="#04120a" emissive={accent} emissiveIntensity={1.1} roughness={0.4} />
              </mesh>
              {isLast && (
                <group position={[0, 1.5, 0]}>
                  <mesh><boxGeometry args={[1.7, 0.1, 1.7]} /><meshStandardMaterial color="#04120a" emissive={accent} emissiveIntensity={1} roughness={0.4} /></mesh>
                  <mesh position={[0, -0.32, 0]}><boxGeometry args={[0.75, 0.55, 0.75]} /><meshStandardMaterial color="#04120a" emissive={accent} emissiveIntensity={0.7} roughness={0.4} /></mesh>
                </group>
              )}
            </group>
          )}
        </group>
      )}
    </group>
  );
};

interface DeepDiveProps {
  domain: string;
  onBack: () => void;
  onNext: (nextId: string) => void;
}

const DeepDive: React.FC<DeepDiveProps> = ({ domain, onBack, onNext }) => {
  const config = DEEP_DIVES[domain] ?? DEEP_DIVES.skills;
  const chapters = config.chapters;
  const N = chapters.length;
  const nextId = DIVE_ORDER[DIVE_ORDER.indexOf(config.id) + 1] ?? null;
  const nextName = nextId ? DEEP_DIVES[nextId].name : null;

  const scroll = useMemo<ScrollState>(() => ({ target: 0, current: 0 }), []);
  const accumulator = useRef(0);
  const [showCompletion, setShowCompletion] = useState(false);

  const waypoints = useMemo(() => buildWaypoints(config.path, N), [config.path, N]);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(waypoints, false, 'catmullrom', 0.4), [waypoints]);
  const stationTs = useMemo(() => chapters.map((_, i) => i / Math.max(1, N - 1)), [chapters, N]);

  // Gates sit on-axis (flown through); every other signature object steps
  // aside so the camera never clips it while passing.
  const stationPositions = useMemo(() => waypoints.map((w, i) => {
    if (config.id === 'experience') return w;
    const t = THREE.MathUtils.clamp(i / Math.max(1, N - 1), 0, 1);
    const { side } = frameAt(curve, t);
    return w.clone().addScaledVector(side, -4.2);
  }), [waypoints, curve, config.id, N]);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const TOTAL = SCROLL_PER_CHAPTER * (N - 1);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      accumulator.current = THREE.MathUtils.clamp(accumulator.current + e.deltaY, 0, TOTAL);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        accumulator.current = Math.min(accumulator.current + 300, TOTAL);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        accumulator.current = Math.max(accumulator.current - 300, 0);
      }
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      accumulator.current = THREE.MathUtils.clamp(
        accumulator.current + (touchY - e.touches[0].clientY) * 2.5, 0, TOTAL);
      touchY = e.touches[0].clientY;
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    let raf = 0;
    const tick = () => {
      scroll.target = accumulator.current / TOTAL;
      scroll.current += (scroll.target - scroll.current) * 0.075;

      const f = scroll.current * (N - 1);

      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const s = THREE.MathUtils.clamp(1 - Math.abs(f - i) * 1.7, 0, 1);
        el.style.opacity = s.toFixed(3);
        el.style.transform = `translateY(${(1 - s) * 28}px)`;
        el.style.pointerEvents = s > 0.5 ? 'auto' : 'none';
      });
      dotRefs.current.forEach((el, i) => {
        if (!el) return;
        const active = f >= i - 0.35;
        el.style.background = active ? config.accent : 'rgba(255,255,255,0.15)';
        el.style.boxShadow = active ? `0 0 10px ${config.accent}` : 'none';
      });
      if (barRef.current) barRef.current.style.height = `${scroll.current * 100}%`;
      if (counterRef.current) counterRef.current.innerText = String(Math.min(N, Math.max(1, Math.round(f) + 1))).padStart(2, '0');
      if (hintRef.current) hintRef.current.style.opacity = scroll.current < 0.02 ? '1' : '0';

      setShowCompletion(scroll.current > 0.985);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      cancelAnimationFrame(raf);
    };
  }, [N, scroll, config.accent]);

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden animate-scene-fade-in" style={{ cursor: 'ns-resize' }}>

      {/* ── 3D: the quiet interior of the genome ── */}
      <Canvas gl={{ antialias: false, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }} dpr={[1, 1.5]}>
        <color attach="background" args={['#030409']} />
        <fog attach="fog" args={['#030409', 22, 85]} />
        <ambientLight intensity={0.22} />

        <CameraRig scroll={scroll} curve={curve} chapters={N} />
        <HelixTunnel curve={curve} accent={config.accent} stationTs={stationTs} />

        {chapters.map((ch, i) => (
          <CleanStation
            key={i}
            domainId={config.id}
            position={stationPositions[i]}
            accent={config.accent}
            sculpture={ch.sculpture}
            isLast={i === N - 1}
            index={i}
            scroll={scroll}
            chapters={N}
            facing={waypoints[i + 1] ?? waypoints[i].clone().add(waypoints[i].clone().sub(waypoints[i - 1] ?? waypoints[i]))}
          />
        ))}

        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.9} intensity={0.85} radius={0.5} mipmapBlur />
          <Noise opacity={0.02} />
          <Vignette offset={0.3} darkness={0.82} />
        </EffectComposer>
      </Canvas>

      {/* ── HUD: domain pill ── */}
      <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 z-[120]">
        <div className="px-5 py-2 md:px-8 md:py-3 rounded-full border border-white/10 bg-black/60 backdrop-blur-xl flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: config.accent }} />
          <span className="text-[0.45rem] md:text-[0.6rem] font-black tracking-[0.3em] md:tracking-[0.5em] uppercase whitespace-nowrap" style={{ color: config.accent }}>
            {config.name}
          </span>
          <span className="text-[0.45rem] md:text-[0.6rem] font-black tracking-[0.3em] text-white/40">
            <span ref={counterRef}>01</span>&thinsp;/&thinsp;{String(N).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* ── Progress rail ── */}
      <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-[120] flex flex-col items-center gap-3">
        <div className="relative w-px h-40 md:h-56 bg-white/10 overflow-hidden rounded-full">
          <div ref={barRef} className="absolute top-0 left-0 w-full rounded-full" style={{ height: '0%', background: config.accent, boxShadow: `0 0 8px ${config.accent}` }} />
        </div>
        <div className="flex flex-col gap-2.5">
          {chapters.map((_, i) => (
            <div key={i} ref={(el) => { dotRefs.current[i] = el }} className="w-1.5 h-1.5 rounded-full transition-colors duration-300" style={{ background: 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>
      </div>

      {/* ── Chapter cards — the single text layer ── */}
      {chapters.map((ch, i) => (
        <div
          key={i}
          ref={(el) => { cardRefs.current[i] = el }}
          className="absolute left-4 right-4 bottom-6 md:left-14 md:right-auto md:bottom-14 md:max-w-md z-[110] will-change-transform"
          style={{ opacity: i === 0 ? 1 : 0 }}
        >
          <div className="p-5 md:p-8 rounded-3xl bg-black/55 border border-white/10 backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-[0.5rem] md:text-[0.55rem] font-black tracking-[0.35em] uppercase" style={{ color: config.accent }}>
                {ch.kicker}
              </p>
              {ch.metric && (
                <span className="shrink-0 text-[0.5rem] md:text-[0.55rem] font-black tracking-widest px-2.5 py-1 rounded-full border" style={{ color: config.accent, borderColor: config.accent + '44', background: config.accent + '11' }}>
                  {ch.metric}
                </span>
              )}
            </div>
            <h3 className="text-xl md:text-3xl font-black tracking-tight leading-tight mb-2.5 text-white">
              {ch.title}
            </h3>
            <p className="text-[0.72rem] md:text-[0.8rem] leading-relaxed text-white/50 mb-4">
              {ch.body}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ch.chips.map((chip) => (
                <span key={chip} className="text-[0.5rem] md:text-[0.55rem] font-black tracking-wider px-2.5 py-1 rounded-full border border-white/10 text-white/60 bg-white/5">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* ── Scroll hint ── */}
      <div ref={hintRef} className="absolute bottom-28 md:bottom-10 left-1/2 -translate-x-1/2 z-[105] flex flex-col items-center gap-2 transition-opacity duration-700 pointer-events-none">
        <span className="text-[0.45rem] md:text-[0.6rem] font-black tracking-[0.4em] md:tracking-[0.6em] uppercase text-white/50">
          Scroll to descend
        </span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
          <ChevronDown size={18} style={{ color: config.accent }} />
        </motion.div>
      </div>

      {/* ── Completion: sequence report → next strand ── */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[150] bg-black/80 backdrop-blur-lg flex items-center justify-center"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
              className="text-center px-6 max-w-xl"
            >
              <p className="text-[0.55rem] md:text-[0.65rem] font-black tracking-[0.5em] uppercase mb-4" style={{ color: config.accent }}>
                &gt; sequence report
              </p>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-3 text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(90deg, #fff, ${config.accent})` }}>
                {config.completion.headline}
              </h2>
              <p className="text-[0.7rem] md:text-sm font-mono text-white/45 mb-10 tracking-wider">
                {config.completion.sub}
              </p>

              {nextId ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => onNext(nextId)}
                    className="group px-9 py-4 rounded-full text-black hover:bg-white transition-colors font-black tracking-[0.3em] uppercase text-[0.68rem] flex items-center gap-3"
                    style={{ background: config.accent }}
                  >
                    Next strand — {nextName}
                    <span className="transition-transform group-hover:translate-x-1">▸</span>
                  </button>
                  <button
                    onClick={onBack}
                    className="px-9 py-4 rounded-full border border-white/20 hover:bg-white hover:text-black transition-colors font-black tracking-[0.3em] uppercase text-[0.68rem]"
                  >
                    Return to DNA
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-8">
                  <div className="flex items-center gap-8">
                    <a href="https://github.com/vishal171104" target="_blank" rel="noopener noreferrer" title="GitHub">
                      <Github size={22} className="text-white/40 hover:text-white transition-colors" />
                    </a>
                    <a href="https://linkedin.com/in/vishal-si" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                      <Linkedin size={22} className="text-white/40 hover:text-white transition-colors" />
                    </a>
                    <a href="mailto:vishal171104@gmail.com" title="Email">
                      <Mail size={22} className="text-white/40 hover:text-white transition-colors" />
                    </a>
                    <a href="/Vishal_S_I_Resume.pdf" download="Vishal_S_I_Resume.pdf" title="Resume">
                      <FileText size={22} className="text-white/40 hover:text-white transition-colors" />
                    </a>
                  </div>
                  <button
                    onClick={onBack}
                    className="px-9 py-4 rounded-full border border-white/20 hover:bg-white hover:text-black transition-colors font-black tracking-[0.3em] uppercase text-[0.68rem]"
                  >
                    Return to DNA
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Exit ── */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 md:top-8 md:left-8 z-[130] p-3 md:p-4 rounded-full border border-white/10 bg-black/40 hover:bg-white hover:text-black transition-all flex items-center justify-center"
      >
        <ArrowLeft size={20} />
      </button>
    </div>
  );
};

export default DeepDive;
