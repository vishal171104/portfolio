import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { ArrowLeft, ChevronDown, Github, Linkedin, Mail, FileText } from 'lucide-react';
import * as THREE from 'three';
import { DEEP_DIVES, DIVE_ORDER, DiveConfig } from '../../data/deep_dives';

// ─────────────────────────────────────────────────────────────────────────────
// Scroll-driven cinematic, one per domain — and each domain is a DIFFERENT
// place, not a recolor:
//   skills      → molecule stations spiralling DOWN a DNA ribbon
//   experience  → portal gates you fly through over a metro grid
//   projects    → monolith slabs in a descending gallery corridor
//   education   → gyroscope rings sinking into a glowing core
// All paths descend: scrolling down travels DOWN, like any website.
// Scroll state is per-mount (no module globals) and drives camera + HTML in
// the same rAF so the two layers can never drift apart.
// ─────────────────────────────────────────────────────────────────────────────

interface ScrollState { target: number; current: number }

const SCROLL_PER_CHAPTER = 1200;
const UP = new THREE.Vector3(0, 1, 0);

const FONT_BOLD = '/fonts/JetBrainsMono-Bold.ttf';
const FONT_REG = '/fonts/JetBrainsMono-Regular.ttf';

// Every journey loses altitude as it progresses — wheel-down goes down.
function buildWaypoints(kind: DiveConfig['path'], n: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    switch (kind) {
      case 'helix': { // skills — descending spiral
        const a = i * Math.PI * 0.85;
        pts.push(new THREE.Vector3(Math.cos(a) * 14, -i * 9, Math.sin(a) * 14));
        break;
      }
      case 'road': // experience — gently sinking highway
        pts.push(new THREE.Vector3(Math.sin(i * 0.9) * 7, -i * 3.5, -i * 26));
        break;
      case 'zigzag': // projects — gallery corridor stepping down
        pts.push(new THREE.Vector3(i % 2 === 0 ? -10 : 10, -i * 4, -i * 24));
        break;
      case 'orbit': { // education — sinking into the core
        const a = i * 1.9;
        pts.push(new THREE.Vector3(Math.cos(a) * 16, -i * 10, Math.sin(a) * 16));
        break;
      }
    }
  }
  return pts;
}

// Camera framing differs per world: gates are flown THROUGH nearly head-on,
// monoliths are viewed from the corridor, spirals from slightly outside.
const CAM_OFFSET: Record<DiveConfig['path'], { back: number; side: number; up: number }> = {
  helix: { back: 10, side: 4.5, up: 3.0 },
  road: { back: 12, side: 1.4, up: 2.4 },
  zigzag: { back: 11, side: 5.0, up: 2.0 },
  orbit: { back: 11, side: 4.0, up: 3.5 },
};

// Dwell briefly at each station: settle, read, release.
function dwell(f: number): number {
  const i = Math.round(f);
  const d = f - i;
  return i + Math.sign(d) * d * d * 2;
}

const CameraRig = ({ scroll, curve, chapters, path }: {
  scroll: ScrollState; curve: THREE.CatmullRomCurve3; chapters: number; path: DiveConfig['path'];
}) => {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const off = CAM_OFFSET[path];

  useFrame(() => {
    const f = dwell(scroll.current * (chapters - 1));
    const t = THREE.MathUtils.clamp(f / (chapters - 1), 0, 1);

    const pos = curve.getPoint(t);
    const tan = curve.getTangent(t).normalize();
    const side = new THREE.Vector3().crossVectors(tan, UP).normalize();

    const camPos = pos.clone()
      .addScaledVector(tan, -off.back)
      .addScaledVector(side, off.side)
      .add(new THREE.Vector3(0, off.up, 0));
    const look = pos.clone().addScaledVector(tan, 5);

    if (!initialized.current) {
      camera.position.copy(camPos.clone().addScaledVector(tan, -14).add(new THREE.Vector3(0, 5, 0)));
      lookTarget.current.copy(look);
      initialized.current = true;
    }

    camera.position.lerp(camPos, 0.06);
    lookTarget.current.lerp(look, 0.08);
    camera.lookAt(lookTarget.current);
  });
  return null;
};

// Shared per-station activation logic
function useProximity(scroll: ScrollState, index: number, chapters: number) {
  const value = useRef(0);
  useFrame(() => {
    const f = scroll.current * (chapters - 1);
    value.current = THREE.MathUtils.clamp(1 - Math.abs(f - index), 0, 1);
  });
  return value;
}

// Giant headline floating where the journey begins — the first thing seen.
const IntroHeadline = ({ curve, text, accent }: { curve: THREE.CatmullRomCurve3; text: string; accent: string }) => {
  const pos = useMemo(() => {
    const p = curve.getPoint(0);
    const tan = curve.getTangent(0).normalize();
    // High and slightly ahead — clears the first station's own signage
    return p.clone().addScaledVector(tan, 8).add(new THREE.Vector3(0, 14.5, 0));
  }, [curve]);
  return (
    <Suspense fallback={null}>
      <Text position={pos} fontSize={2.4} color={accent} anchorX="center" anchorY="middle" font={FONT_BOLD} maxWidth={26} textAlign="center" letterSpacing={0.12}>
        {text}
        <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.85} />
      </Text>
    </Suspense>
  );
};

// ── SKILLS: neuron — icosa soma, portal ring, chips wired to the core by
// glowing synapses that brighten as the station activates ───────────────────
const MoleculeStation = ({ position, accent, title, chips, index, scroll, chapters }: StationProps) => {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const chipsGroup = useRef<THREE.Group>(null);
  const synapseMat = useRef<THREE.LineBasicMaterial>(null);
  const prox = useProximity(scroll, index, chapters);

  // Line pairs from the soma to each chip — the skill graph made literal
  const synapses = useMemo(() => {
    const pts: number[] = [];
    chips.forEach((_, ci) => {
      const a = (ci / chips.length) * Math.PI * 2;
      pts.push(0, 0, 0, Math.cos(a) * 4.4, -0.4 + Math.sin(ci * 1.7) * 0.9, Math.sin(a) * 4.4);
    });
    return new Float32Array(pts);
  }, [chips]);

  useFrame((state) => {
    const p = prox.current;
    const tm = state.clock.getElapsedTime();
    if (ring.current) {
      ring.current.rotation.z = tm * 0.25 + index;
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + p * 0.75;
      ring.current.scale.setScalar(1 + p * 0.18);
    }
    if (core.current) {
      core.current.rotation.y = tm * 0.6;
      core.current.rotation.x = tm * 0.3;
      (core.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + p * 2.6;
    }
    if (light.current) light.current.intensity = p * 60;
    if (chipsGroup.current) {
      chipsGroup.current.rotation.y = tm * 0.22;
      chipsGroup.current.visible = p > 0.05;
    }
    if (synapseMat.current) synapseMat.current.opacity = 0.1 + p * 0.55;
    if (group.current) group.current.position.y = position.y + Math.sin(tm * 0.9 + index * 2) * 0.35;
  });

  return (
    <group ref={group} position={position}>
      <mesh ref={ring}>
        <torusGeometry args={[6.2, 0.07, 12, 96]} />
        <meshBasicMaterial color={accent} transparent opacity={0.3} toneMapped={false} />
      </mesh>
      <mesh ref={core}>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshStandardMaterial color="#0a0a12" emissive={accent} emissiveIntensity={0.4} roughness={0.25} metalness={0.6} flatShading />
      </mesh>
      <pointLight ref={light} color={accent} intensity={0} distance={40} decay={2} />
      <Suspense fallback={null}>
        <Text position={[0, 7.6, 0]} fontSize={1.1} color="#ffffff" anchorX="center" anchorY="bottom" font={FONT_BOLD} maxWidth={18} textAlign="center">
          {title}
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </Text>
        <group ref={chipsGroup}>
          {/* synapses rotate with the chips they feed */}
          <lineSegments>
            <bufferGeometry><bufferAttribute attach="attributes-position" args={[synapses, 3]} /></bufferGeometry>
            <lineBasicMaterial ref={synapseMat} color={accent} transparent opacity={0.1} toneMapped={false} />
          </lineSegments>
          {chips.map((chip, ci) => {
            const a = (ci / chips.length) * Math.PI * 2;
            return (
              <Text key={chip} position={[Math.cos(a) * 4.4, -0.4 + Math.sin(ci * 1.7) * 0.9, Math.sin(a) * 4.4]} rotation={[0, -a + Math.PI / 2, 0]} fontSize={0.52} color={accent} anchorX="center" anchorY="middle" font={FONT_REG}>
                {chip}
                <meshBasicMaterial color={accent} toneMapped={false} />
              </Text>
            );
          })}
        </group>
      </Suspense>
    </group>
  );
};

// ── EXPERIENCE: portal gate — a frame you fly through, year on the lintel ───
const GateStation = ({ position, accent, title, kicker, place, chips, index, scroll, chapters, facing }: StationProps) => {
  const group = useRef<THREE.Group>(null);
  const frameMat = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const prox = useProximity(scroll, index, chapters);
  const year = (kicker ?? '').slice(0, 4);

  useEffect(() => {
    if (group.current && facing) group.current.lookAt(facing);
  }, [facing]);

  useFrame(() => {
    const p = prox.current;
    if (frameMat.current) frameMat.current.emissiveIntensity = 0.3 + p * 2.4;
    if (light.current) light.current.intensity = p * 70;
  });

  const bar: [number, number, number] = [11, 0.55, 0.55];
  const pillar: [number, number, number] = [0.55, 12, 0.55];

  return (
    <group ref={group} position={position}>
      {/* lintel + pillars */}
      <mesh position={[0, 6, 0]}>
        <boxGeometry args={bar} />
        <meshStandardMaterial ref={frameMat} color="#0b0714" emissive={accent} emissiveIntensity={0.3} roughness={0.35} metalness={0.7} />
      </mesh>
      {[-5.5, 5.5].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={pillar} />
          <meshStandardMaterial color="#0b0714" emissive={accent} emissiveIntensity={0.3} roughness={0.35} metalness={0.7} />
        </mesh>
      ))}
      <pointLight ref={light} color={accent} intensity={0} distance={45} decay={2} />
      <Suspense fallback={null}>
        {/* Big year floating above, company stamped on the lintel like a
            station sign, role beneath it — reads like arriving somewhere. */}
        <Text position={[0, 8.6, 0]} fontSize={2.1} color={accent} anchorX="center" anchorY="bottom" font={FONT_BOLD}>
          {year}
          <meshBasicMaterial color={accent} toneMapped={false} />
        </Text>
        {place && (
          <Text position={[0, 6.75, 0.4]} fontSize={0.95} color="#ffffff" anchorX="center" anchorY="bottom" font={FONT_BOLD} letterSpacing={0.15}>
            {place}
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </Text>
        )}
        <Text position={[0, 5.1, 0.4]} fontSize={0.55} color={accent} anchorX="center" anchorY="bottom" font={FONT_REG} maxWidth={14} textAlign="center">
          {title}
          <meshBasicMaterial color={accent} toneMapped={false} />
        </Text>
        {/* tech stamped along the pillars */}
        {chips.slice(0, 3).map((chip, ci) => (
          <Text key={chip} position={[ci % 2 === 0 ? -5.5 : 5.5, 2.5 - ci * 2.2, 0.5]} rotation={[0, 0, ci % 2 === 0 ? Math.PI / 2 : -Math.PI / 2]} fontSize={0.5} color={accent} anchorX="center" anchorY="middle" font={FONT_REG}>
            {chip}
            <meshBasicMaterial color={accent} toneMapped={false} />
          </Text>
        ))}
      </Suspense>
    </group>
  );
};

// Primitive totems — instantly readable symbols of what each project IS.
const ProjectTotem = ({ kind, accent }: { kind?: string; accent: string }) => {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.getElapsedTime() * 0.5;
      group.current.position.y = 6.6 + Math.sin(state.clock.getElapsedTime() * 1.1) * 0.25;
    }
  });
  const mat = <meshStandardMaterial color="#0d0a04" emissive={accent} emissiveIntensity={1.3} roughness={0.35} metalness={0.5} />;
  return (
    <group ref={group} position={[0, 6.6, 0]}>
      {kind === 'cards' && ( // classifier: three tickets fanned into sorted stacks
        <group>
          {[-0.9, 0, 0.9].map((x, i) => (
            <mesh key={i} position={[x, i * 0.12, i * -0.12]} rotation={[0, 0, (i - 1) * 0.35]}>
              <boxGeometry args={[1.15, 1.7, 0.06]} />
              {mat}
            </mesh>
          ))}
        </group>
      )}
      {kind === 'dumbbell' && ( // RankGym: the most honest gym icon there is
        <group rotation={[0, 0, Math.PI / 14]}>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.14, 0.14, 2.6, 12]} />{mat}</mesh>
          <mesh position={[-1.3, 0, 0]}><sphereGeometry args={[0.52, 16, 16]} />{mat}</mesh>
          <mesh position={[1.3, 0, 0]}><sphereGeometry args={[0.52, 16, 16]} />{mat}</mesh>
        </group>
      )}
      {kind === 'crates' && ( // MaligaiKadai: stocked inventory crates
        <group>
          <mesh position={[-0.55, -0.5, 0]}><boxGeometry args={[1, 1, 1]} />{mat}</mesh>
          <mesh position={[0.6, -0.5, 0.15]}><boxGeometry args={[1, 1, 1]} />{mat}</mesh>
          <mesh position={[0, 0.55, 0.05]} rotation={[0, 0.5, 0]}><boxGeometry args={[1, 1, 1]} />{mat}</mesh>
        </group>
      )}
      {kind === 'pin' && ( // Vehicle Tracking: a live map pin
        <group>
          <mesh position={[0, 0.45, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.55, 1.5, 20]} />{mat}</mesh>
          <mesh position={[0, 1.2, 0]}><sphereGeometry args={[0.55, 18, 18]} />{mat}</mesh>
          <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.7, 0.85, 24]} />
            <meshBasicMaterial color={accent} transparent opacity={0.5} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
};

// ── PROJECTS: monolith slab — a standing stone with the blueprint on it ─────
const MonolithStation = ({ position, accent, title, chips, metric, sculpture, index, scroll, chapters, facing }: StationProps) => {
  const group = useRef<THREE.Group>(null);
  const faceMat = useRef<THREE.MeshBasicMaterial>(null);
  const slabMat = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const prox = useProximity(scroll, index, chapters);

  useEffect(() => {
    if (group.current && facing) {
      group.current.lookAt(facing);
      group.current.rotateY(index % 2 === 0 ? 0.12 : -0.12); // slight gallery angle
    }
  }, [facing, index]);

  useFrame((state) => {
    const p = prox.current;
    const tm = state.clock.getElapsedTime();
    if (faceMat.current) faceMat.current.opacity = 0.05 + p * 0.16;
    if (slabMat.current) slabMat.current.emissiveIntensity = 0.15 + p * 1.4;
    if (light.current) light.current.intensity = p * 55;
    if (group.current) group.current.position.y = position.y + Math.sin(tm * 0.7 + index * 2.4) * 0.3;
  });

  return (
    <group ref={group} position={position}>
      {/* the slab */}
      <mesh>
        <boxGeometry args={[7, 9.5, 0.5]} />
        <meshStandardMaterial ref={slabMat} color="#0d0a04" emissive={accent} emissiveIntensity={0.15} roughness={0.4} metalness={0.65} />
      </mesh>
      {/* glowing screen face */}
      <mesh position={[0, 0, 0.28]}>
        <planeGeometry args={[6.2, 8.7]} />
        <meshBasicMaterial ref={faceMat} color={accent} transparent opacity={0.05} toneMapped={false} />
      </mesh>
      <pointLight ref={light} color={accent} intensity={0} distance={42} decay={2} position={[0, 0, 4]} />
      <ProjectTotem kind={sculpture} accent={accent} />
      <Suspense fallback={null}>
        <Text position={[0, 2.9, 0.35]} fontSize={0.78} color="#ffffff" anchorX="center" anchorY="middle" font={FONT_BOLD} maxWidth={5.6} textAlign="center">
          {title}
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </Text>
        {metric && (
          <Text position={[0, 1.5, 0.35]} fontSize={0.5} color={accent} anchorX="center" anchorY="middle" font={FONT_BOLD} maxWidth={5.6} textAlign="center">
            {metric}
            <meshBasicMaterial color={accent} toneMapped={false} />
          </Text>
        )}
        {chips.slice(0, 4).map((chip, ci) => (
          <Text key={chip} position={[0, -0.6 - ci * 0.85, 0.35]} fontSize={0.44} color="#ffffffcc" anchorX="center" anchorY="middle" font={FONT_REG} maxWidth={5.6}>
            {chip}
          </Text>
        ))}
      </Suspense>
    </group>
  );
};

// ── EDUCATION: gyroscope of learning — nested rings around an OPEN BOOK; the
// final station wears the graduation cap ─────────────────────────────────────
const GyroStation = ({ position, accent, title, chips, index, scroll, chapters, isLast }: StationProps) => {
  const group = useRef<THREE.Group>(null);
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);
  const book = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const chipsGroup = useRef<THREE.Group>(null);
  const capGroup = useRef<THREE.Group>(null);
  const prox = useProximity(scroll, index, chapters);

  useFrame((state) => {
    const p = prox.current;
    const tm = state.clock.getElapsedTime();
    if (r1.current) { r1.current.rotation.x = tm * 0.5; (r1.current.material as THREE.MeshBasicMaterial).opacity = 0.2 + p * 0.8; }
    if (r2.current) { r2.current.rotation.y = tm * 0.65; r2.current.rotation.z = Math.PI / 3; (r2.current.material as THREE.MeshBasicMaterial).opacity = 0.2 + p * 0.65; }
    if (r3.current) { r3.current.rotation.z = tm * 0.4; r3.current.rotation.x = Math.PI / 2.4; (r3.current.material as THREE.MeshBasicMaterial).opacity = 0.2 + p * 0.5; }
    if (book.current) {
      book.current.rotation.y = tm * 0.45;
      book.current.children.forEach((half) => {
        const m = (half as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (m?.emissiveIntensity !== undefined) m.emissiveIntensity = 0.5 + p * 2.2;
      });
    }
    if (capGroup.current) {
      capGroup.current.rotation.y = -tm * 0.35;
      capGroup.current.position.y = 8.9 + Math.sin(tm * 1.2) * 0.25;
    }
    if (light.current) light.current.intensity = p * 65;
    if (chipsGroup.current) {
      chipsGroup.current.rotation.y = -tm * 0.18;
      chipsGroup.current.visible = p > 0.05;
    }
    if (group.current) group.current.position.y = position.y + Math.sin(tm * 0.8 + index * 1.8) * 0.35;
  });

  return (
    <group ref={group} position={position}>
      <mesh ref={r1}><torusGeometry args={[5.4, 0.06, 10, 80]} /><meshBasicMaterial color={accent} transparent opacity={0.25} toneMapped={false} /></mesh>
      <mesh ref={r2}><torusGeometry args={[4.3, 0.06, 10, 80]} /><meshBasicMaterial color={accent} transparent opacity={0.25} toneMapped={false} /></mesh>
      <mesh ref={r3}><torusGeometry args={[3.2, 0.06, 10, 80]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.2} toneMapped={false} /></mesh>
      {/* open book: two pages meeting at the spine */}
      <group ref={book}>
        <mesh position={[-0.62, 0, 0]} rotation={[0, 0, 0.42]}>
          <boxGeometry args={[1.3, 0.08, 1.7]} />
          <meshStandardMaterial color="#04120a" emissive={accent} emissiveIntensity={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.62, 0, 0]} rotation={[0, 0, -0.42]}>
          <boxGeometry args={[1.3, 0.08, 1.7]} />
          <meshStandardMaterial color="#04120a" emissive={accent} emissiveIntensity={0.5} roughness={0.4} />
        </mesh>
      </group>
      {/* the graduation cap crowns the final chapter */}
      {isLast && (
        <group ref={capGroup} position={[0, 8.9, 0]}>
          <mesh><boxGeometry args={[2.1, 0.12, 2.1]} /><meshStandardMaterial color="#04120a" emissive={accent} emissiveIntensity={1.2} roughness={0.4} /></mesh>
          <mesh position={[0, -0.4, 0]}><boxGeometry args={[0.95, 0.7, 0.95]} /><meshStandardMaterial color="#04120a" emissive={accent} emissiveIntensity={0.8} roughness={0.4} /></mesh>
          <mesh position={[0.9, -0.45, 0.9]}><sphereGeometry args={[0.14, 10, 10]} /><meshBasicMaterial color={accent} toneMapped={false} /></mesh>
        </group>
      )}
      <pointLight ref={light} color={accent} intensity={0} distance={42} decay={2} />
      <Suspense fallback={null}>
        <Text position={[0, 7.2, 0]} fontSize={1.05} color="#ffffff" anchorX="center" anchorY="bottom" font={FONT_BOLD} maxWidth={17} textAlign="center">
          {title}
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </Text>
        <group ref={chipsGroup}>
          {chips.map((chip, ci) => {
            const a = (ci / chips.length) * Math.PI * 2;
            return (
              <Text key={chip} position={[Math.cos(a) * 6.6, -0.2, Math.sin(a) * 6.6]} rotation={[0, -a + Math.PI / 2, 0]} fontSize={0.5} color={accent} anchorX="center" anchorY="middle" font={FONT_REG}>
                {chip}
                <meshBasicMaterial color={accent} toneMapped={false} />
              </Text>
            );
          })}
        </group>
      </Suspense>
    </group>
  );
};

interface StationProps {
  position: THREE.Vector3;
  accent: string;
  title: string;
  kicker?: string;
  metric?: string;
  place?: string;
  sculpture?: string;
  isLast?: boolean;
  chips: string[];
  index: number;
  scroll: ScrollState;
  chapters: number;
  facing?: THREE.Vector3;
}

const STATION_BY_DOMAIN: Record<string, React.FC<StationProps>> = {
  skills: MoleculeStation,
  experience: GateStation,
  projects: MonolithStation,
  education: GyroStation,
};

// ── Per-domain environments ──────────────────────────────────────────────────

// skills: two point-strands winding around the camera path — the DNA ribbon
const DnaRibbon = ({ curve, accent }: { curve: THREE.CatmullRomCurve3; accent: string }) => {
  const [a, b] = useMemo(() => {
    const n = 360;
    const s1 = new Float32Array(n * 3);
    const s2 = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const p = curve.getPoint(t);
      const tan = curve.getTangent(t).normalize();
      const side = new THREE.Vector3().crossVectors(tan, UP).normalize();
      const up = new THREE.Vector3().crossVectors(side, tan).normalize();
      const ang = t * Math.PI * 14;
      const o1 = side.clone().multiplyScalar(Math.cos(ang) * 7).addScaledVector(up, Math.sin(ang) * 7);
      s1.set([p.x + o1.x, p.y + o1.y, p.z + o1.z], i * 3);
      s2.set([p.x - o1.x, p.y - o1.y, p.z - o1.z], i * 3);
    }
    return [s1, s2];
  }, [curve]);
  return (
    <>
      {[a, b].map((arr, i) => (
        <points key={i}>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[arr, 3]} /></bufferGeometry>
          <pointsMaterial color={i === 0 ? accent : '#ffffff'} size={0.22} transparent opacity={i === 0 ? 0.7 : 0.35} sizeAttenuation />
        </points>
      ))}
    </>
  );
};

// experience: endless metro grid below the highway
const MetroGrid = ({ accent, minY }: { accent: string; minY: number }) => (
  <group position={[0, minY - 10, -40]}>
    <gridHelper args={[520, 52, accent, '#131018']} />
  </group>
);

// experience: the career road itself — two dotted edge lines flanking the
// path plus milepost columns, so the journey reads as a travelled road.
const CareerRoad = ({ curve, accent }: { curve: THREE.CatmullRomCurve3; accent: string }) => {
  const [left, right, posts] = useMemo(() => {
    const n = 240;
    const l = new Float32Array(n * 3);
    const r = new Float32Array(n * 3);
    const postList: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const p = curve.getPoint(t);
      const tan = curve.getTangent(t).normalize();
      const side = new THREE.Vector3().crossVectors(tan, UP).normalize();
      const lo = p.clone().addScaledVector(side, -2.6);
      const ro = p.clone().addScaledVector(side, 2.6);
      l.set([lo.x, lo.y - 1.2, lo.z], i * 3);
      r.set([ro.x, ro.y - 1.2, ro.z], i * 3);
      if (i % 24 === 12) postList.push(p.clone().addScaledVector(side, i % 48 === 12 ? 4.2 : -4.2));
    }
    return [l, r, postList];
  }, [curve]);
  return (
    <group>
      {[left, right].map((arr, i) => (
        <points key={i}>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[arr, 3]} /></bufferGeometry>
          <pointsMaterial color={accent} size={0.16} transparent opacity={0.55} sizeAttenuation />
        </points>
      ))}
      {posts.map((p, i) => (
        <mesh key={i} position={[p.x, p.y - 0.4, p.z]}>
          <boxGeometry args={[0.16, 1.5, 0.16]} />
          <meshStandardMaterial color="#0b0714" emissive={accent} emissiveIntensity={0.5} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
};

// projects: rows of dim pillars flanking the corridor
const GalleryPillars = ({ curve, accent }: { curve: THREE.CatmullRomCurve3; accent: string }) => {
  const pillars = useMemo(() => {
    const out: { pos: THREE.Vector3; h: number }[] = [];
    for (let i = 0; i < 26; i++) {
      const t = i / 25;
      const p = curve.getPoint(t);
      const tan = curve.getTangent(t).normalize();
      const side = new THREE.Vector3().crossVectors(tan, UP).normalize();
      const w = 20 + (i % 3) * 4;
      out.push({ pos: p.clone().addScaledVector(side, w), h: 14 + (i % 4) * 5 });
      out.push({ pos: p.clone().addScaledVector(side, -w), h: 16 + (i % 3) * 6 });
    }
    return out;
  }, [curve]);
  return (
    <group>
      {pillars.map((pl, i) => (
        <mesh key={i} position={[pl.pos.x, pl.pos.y - 2, pl.pos.z]}>
          <boxGeometry args={[1.1, pl.h, 1.1]} />
          <meshStandardMaterial color="#0a0803" emissive={accent} emissiveIntensity={0.08} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

// education: the well — an enclosing shell and the molten core waiting below
const GravityWell = ({ accent, end }: { accent: string; end: THREE.Vector3 }) => (
  <group>
    <mesh>
      <sphereGeometry args={[150, 24, 24]} />
      <meshBasicMaterial color={accent} transparent opacity={0.05} side={THREE.BackSide} />
    </mesh>
    <mesh position={[end.x, end.y - 45, end.z]}>
      <sphereGeometry args={[24, 32, 32]} />
      <meshStandardMaterial color="#031007" emissive={accent} emissiveIntensity={1.6} roughness={0.6} />
    </mesh>
  </group>
);

const PathTrail = ({ curve, accent }: { curve: THREE.CatmullRomCurve3; accent: string }) => {
  const geom = useMemo(() => new THREE.BufferGeometry().setFromPoints(curve.getPoints(220)), [curve]);
  return (
    <points geometry={geom}>
      <pointsMaterial color={accent} size={0.18} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
};

const AmbientDust = ({ curve, accent }: { curve: THREE.CatmullRomCurve3; accent: string }) => {
  const positions = useMemo(() => {
    const arr = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      const p = curve.getPoint(Math.random());
      arr[i * 3] = p.x + (Math.random() - 0.5) * 36;
      arr[i * 3 + 1] = p.y + (Math.random() - 0.5) * 26;
      arr[i * 3 + 2] = p.z + (Math.random() - 0.5) * 36;
    }
    return arr;
  }, [curve]);
  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.getElapsedTime() * 0.008;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color={accent} size={0.14} transparent opacity={0.35} sizeAttenuation />
    </points>
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
  const Station = STATION_BY_DOMAIN[config.id] ?? MoleculeStation;

  // The camera dollies along the curve THROUGH the waypoints — so monoliths
  // must stand BESIDE the walkway (alternating like gallery pieces), or the
  // camera flies straight into the slab. Other worlds keep stations on-path.
  const stationPositions = useMemo(() => waypoints.map((w, i) => {
    if (config.id !== 'projects') return w;
    const t = THREE.MathUtils.clamp(i / Math.max(1, N - 1), 0, 1);
    const tan = curve.getTangent(t).normalize();
    const side = new THREE.Vector3().crossVectors(tan, UP).normalize();
    return w.clone().addScaledVector(side, i % 2 === 0 ? -8.5 : 8.5);
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

      {/* ── 3D JOURNEY ── */}
      <Canvas gl={{ antialias: false, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }} dpr={[1, 1.5]}>
        <color attach="background" args={['#03040a']} />
        <fog attach="fog" args={['#03040a', 30, 140]} />
        <ambientLight intensity={0.25} />

        <CameraRig scroll={scroll} curve={curve} chapters={N} path={config.path} />
        <Stars radius={160} depth={60} count={4000} factor={3.5} saturation={0} fade speed={0.4} />
        <PathTrail curve={curve} accent={config.accent} />
        <AmbientDust curve={curve} accent={config.accent} />

        {/* Domain-specific world */}
        {config.id === 'skills' && <DnaRibbon curve={curve} accent={config.accent} />}
        {config.id === 'experience' && (
          <>
            <MetroGrid accent={config.accent} minY={waypoints[N - 1].y} />
            <CareerRoad curve={curve} accent={config.accent} />
          </>
        )}
        {config.id === 'projects' && <GalleryPillars curve={curve} accent={config.accent} />}
        {config.id === 'education' && <GravityWell accent={config.accent} end={waypoints[N - 1]} />}
        <IntroHeadline curve={curve} text={config.intro} accent={config.accent} />

        {chapters.map((ch, i) => (
          <Station
            key={i}
            position={stationPositions[i]}
            accent={config.accent}
            title={ch.title}
            kicker={ch.kicker}
            metric={ch.metric}
            place={ch.place}
            sculpture={ch.sculpture}
            isLast={i === N - 1}
            chips={ch.chips}
            index={i}
            scroll={scroll}
            chapters={N}
            // Monoliths face the walkway they flank; gates face down-path so
            // the camera flies through them.
            facing={config.id === 'projects'
              ? waypoints[i]
              : (waypoints[i + 1] ?? waypoints[i].clone().add(waypoints[i].clone().sub(waypoints[i - 1] ?? waypoints[i])))}
          />
        ))}

        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={0.22} luminanceSmoothing={0.9} intensity={1.25} radius={0.55} mipmapBlur />
          <Noise opacity={0.035} />
          <Vignette offset={0.32} darkness={0.85} />
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

      {/* ── Chapter cards ── */}
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

      {/* ── Completion: a sequence report that hands off to the next strand ── */}
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
                  {/* The whole genome has been read — quiet sign-off, no sales pitch */}
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
