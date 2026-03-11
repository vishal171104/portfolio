import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { SKILLS_REGISTRY } from '../../data/skills_registry';
import { getWaveHeight } from './waveMath';
import { OceanScrollState } from './OceanScrollState';

const DynamicParticleLabel = ({
  skill,
  targetZ,
  isCrest,
  isActive
}: {
  skill: any,
  targetZ: number,
  isCrest: boolean,
  isActive: boolean
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Map scroll position to X position
  const mapScrollToX = (pos: number) => THREE.MathUtils.lerp(-30, 30, pos);
  const x = mapScrollToX(skill.scrollPos);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const sp = OceanScrollState.current;
    const waveY = getWaveHeight(x, targetZ, time, 1.0, sp) - 5;
    const floatOffset = isCrest ? 1.5 : 0.5; // Crest texts float slightly higher
    groupRef.current.position.y = waveY + floatOffset;
  });

  if (isCrest) {
    return (
      <group ref={groupRef} position={[x, 0, targetZ]}>
        <Text
          fontSize={isActive ? 2.5 : 2}
          color={isActive ? "#ffffff" : "#a855f7"} // Pulse white when hit
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKbxmc_A.woff"
          outlineWidth={isActive ? 0.1 : 0.05}
          outlineColor="#38bdf8"
        >
          {skill.name}
        </Text>
        <Text
          position={[0, -2, 0]}
          fontSize={0.8}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
        >
          {skill.detail}
        </Text>
        {isActive && (
            <pointLight color="#38bdf8" intensity={10} distance={20} decay={2} />
        )}
      </group>
    );
  }

  return (
    <group ref={groupRef} position={[x, 0, targetZ]}>
      <Text
        fontSize={1.2}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.8}
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {skill.name}
      </Text>
    </group>
  );
};

interface SkillParticlesProps {
  phase: 'fly-in' | 'impact' | 'wave-rise' | 'surfing';
}

const SkillParticles: React.FC<SkillParticlesProps> = ({ phase }) => {
  const mistInstancedRef = useRef<THREE.InstancedMesh>(null);
  const crestGroupRef = useRef<THREE.Group>(null);
  const foamGroupRef = useRef<THREE.Group>(null);
  
  const [activeSplash, setActiveSplash] = useState<string | null>(null);

  // Generate Mist Particles (Tools)
  const mistData = useMemo(() => {
    const data = [];
    const numParticles = 200;
    for (let i = 0; i < numParticles; i++) {
        // Distribute mist near the top of the wave broadly
        const x = (Math.random() - 0.5) * 80;
        const y = 10 + Math.random() * 8; // High up
        const z = (Math.random() - 0.5) * 10;
        data.push({ x, y, z, offset: Math.random() * Math.PI * 2 });
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Map scroll position to X position for crest and foam skills
  // Surfer goes from x=-30 (at scroll=0) to x=30 (at scroll=1)
  const mapScrollToX = (pos: number) => THREE.MathUtils.lerp(-30, 30, pos);

  useFrame((state) => {
    if (phase === 'fly-in') return;
    const time = state.clock.getElapsedTime();

    // Animate Mist InstancedMesh
    if (mistInstancedRef.current) {
        mistData.forEach((p, i) => {
            // Mist swirling
            const dx = Math.sin(time + p.offset) * 2;
            const dy = Math.cos(time * 0.5 + p.offset) * 1;
            dummy.position.set(p.x + dx, p.y + dy, p.z);
            dummy.scale.setScalar(0.2 + Math.random() * 0.3);
            dummy.updateMatrix();
            mistInstancedRef.current!.setMatrixAt(i, dummy.matrix);
        });
        mistInstancedRef.current.instanceMatrix.needsUpdate = true;
    }

    // Activate splashes when surfer crosses a skill's X point
    const currentX = mapScrollToX(OceanScrollState.current);
    
    let closestSkill = null;
    let minDiff = 1000;

    SKILLS_REGISTRY.wave_layers.crest_skills_high_impact.forEach(skill => {
        const skillX = mapScrollToX(skill.scrollPos);
        const diff = Math.abs(currentX - skillX);
        if (diff < 5 && diff < minDiff) {
            minDiff = diff;
            closestSkill = skill.name;
        }
    });

    if (closestSkill !== activeSplash) {
        setActiveSplash(closestSkill);
    }
  });

  if (phase === 'fly-in') return null;

  return (
    <group>
      {/* ── MIST PARTICLES (Instanced Mesh for Performance) ── */}
      <instancedMesh ref={mistInstancedRef} args={[undefined, undefined, mistData.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>

      {/* ── CREST SKILLS (High Impact - Huge 3D Text) ── */}
      <group ref={crestGroupRef}>
        {SKILLS_REGISTRY.wave_layers.crest_skills_high_impact.map((skill) => (
           <DynamicParticleLabel
              key={skill.name}
              skill={skill}
              targetZ={0} // Crest Z position
              isCrest={true}
              isActive={activeSplash === skill.name}
           />
        ))}
      </group>

      {/* ── SURFACE FOAM SKILLS (Supporting) ── */}
      <group ref={foamGroupRef}>
        {SKILLS_REGISTRY.wave_layers.surface_foam_supporting.map((skill) => (
           <DynamicParticleLabel
              key={skill.name}
              skill={skill}
              targetZ={3} // Foam Z position
              isCrest={false}
              isActive={false}
           />
        ))}
      </group>
      
    </group>
  );
};

export default SkillParticles;
