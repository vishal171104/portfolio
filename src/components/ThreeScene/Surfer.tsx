import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { SKILLS_REGISTRY } from '../../data/skills_registry';
import { getWaveHeight } from './waveMath';
import { OceanScrollState } from './OceanScrollState';

interface SurferProps {
  phase: 'fly-in' | 'impact' | 'wave-rise' | 'surfing';
}

const SurferWake = ({ phase }: { phase: string }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 300; // Drastically reduced for performance
  
  const [positions, opacities] = useMemo(() => {
    const p = new Float32Array(particleCount * 3);
    const o = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      p[i * 3] = (Math.random() - 0.5) * 4; // Spray width
      p[i * 3 + 1] = (Math.random() - 0.5) * 1; // Spray height
      p[i * 3 + 2] = Math.random() * -15; // Train length behind board
      o[i] = Math.random();
    }
    return [p, o];
  }, []);

  useFrame(() => {
    if (!pointsRef.current || phase === 'fly-in') return;
    
    const positionsAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const opacitiesAttr = pointsRef.current.geometry.attributes.opacity as THREE.BufferAttribute;
    
    for (let i = 0; i < particleCount; i++) {
        // Move wake backward relative to board
        positionsAttr.array[i * 3 + 2] -= 0.6; 
        
        // Disperse outward based on distance behind board
        const distBehind = -positionsAttr.array[i * 3 + 2];
        const drift = distBehind * 0.02;
        positionsAttr.array[i * 3] += (positionsAttr.array[i * 3] > 0 ? drift : -drift);
        
        opacitiesAttr.array[i] -= 0.015; // Fade out
        
        // Reset particle if faded
        if (opacitiesAttr.array[i] <= 0) {
            positionsAttr.array[i * 3] = (Math.random() - 0.5) * 1.5; // Spawn tight near tail
            positionsAttr.array[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
            positionsAttr.array[i * 3 + 2] = 0; // Board tail
            opacitiesAttr.array[i] = 1.0;
        }
    }
    
    positionsAttr.needsUpdate = true;
    opacitiesAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} position={[0, -0.2, -1]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-opacity" args={[opacities, 1]} />
      </bufferGeometry>
      <pointsMaterial 
          size={1.5} 
          color="#dcfaff" // Cyan/white spray
          transparent 
          opacity={0.5} 
          blending={THREE.AdditiveBlending} 
          depthWrite={false} 
      />
    </points>
  );
};

const Surfer: React.FC<SurferProps> = ({ phase }) => {
  const groupRef = useRef<THREE.Group>(null);
  const boardRef = useRef<THREE.Mesh>(null);
  
  const milestones = SKILLS_REGISTRY.milestones;
  
  const [activeMilestone, setActiveMilestone] = React.useState<any>(null);

  useFrame((state) => {
    if (!groupRef.current || phase === 'fly-in') return;

    const sp = OceanScrollState.current;
    
    // De-couple React Milestone text state into a manually throttled state trigger
    const currentMilestone = milestones.find(m => Math.abs(sp - m.scrollPos) < 0.1) || null;
    if (activeMilestone !== currentMilestone) {
        setActiveMilestone(currentMilestone);
    }

    const targetX = THREE.MathUtils.lerp(-30, 30, sp);
    
    const time = state.clock.getElapsedTime();
    const targetZ = 4 + Math.cos(time * 2) * 1.0; // Pushing up and down the face slightly
    
    // Wave height calculated directly from Gerstner Math
    // Note: the ocean mesh is placed at y=-5, so we add an offset of -5
    const waveY = getWaveHeight(targetX, targetZ, time, 1.0, sp) - 5;
    
    // Surfer should wobble/drop as they carve the wave face
    const carvingWobbleY = Math.sin(time * 3 + sp * 20) * 1.5;
    
    const targetY = waveY + carvingWobbleY - 0.2; // Surface exact offset

    // Position interpolation (snappy for immediate scrolling, but smooth)
    groupRef.current.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.15);

    // Dynamic rotation (carving physics)
    // Board tilts based on vertical velocity vs horizontal travel
    const leanForward = -0.4 + Math.sin(time * 2) * 0.1;
    const carveAngle = -Math.PI / 2 + 0.3 + Math.cos(time * 3) * 0.15;
    
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, leanForward, 0.1); 
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, carveAngle, 0.1); 
    groupRef.current.rotation.z = Math.sin(sp * Math.PI) * -0.2; // Bank into the turn globally
  });

  if (phase === 'fly-in') {
    return null;
  }

  function smoothstep(min: number, max: number, value: number) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
  }

  // Modern abstract art material parameters for the surrogate shape
  // Very high metalness/roughness for a sleek, premium polished vibe
  const silverMaterialParams = {
    color: '#e0e0e0',
    metalness: 0.9,
    roughness: 0.15,
    envMapIntensity: 1.5,
  };

  const carbonMaterialParams = {
    color: '#111111',
    metalness: 0.8,
    roughness: 0.4,
  };

  return (
    <group ref={groupRef}>
      {/* ── HIGH-END ABSTRACT SURROGATE ── */}
      <group>
        {/* Sleek metallic Surfboard */}
        <mesh ref={boardRef} position={[0, -0.1, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.3, 2.5, 4, 32]} />
          <meshStandardMaterial {...silverMaterialParams} />
        </mesh>
        
        {/* Glow engine / energy stripe down the board */}
        <mesh position={[0, 0, 0]}>
           <capsuleGeometry args={[0.32, 2.0, 4, 16]} />
           <meshBasicMaterial color="#00eeff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* Abstract Surfer Body (Sleek Carbon Fiber look) */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <capsuleGeometry args={[0.2, 1.0, 16, 32]} />
          <meshStandardMaterial {...carbonMaterialParams} />
        </mesh>
        
        {/* Head/Helmet - Glowing glass orb */}
        <mesh position={[0, 1.6, 0]} castShadow>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshPhysicalMaterial 
             color="#ffffff" 
             metalness={0.1} 
             roughness={0.0} 
             transmission={0.9} 
             thickness={0.5} 
             emissive="#38bdf8"
             emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* ── DYNAMIC MILESTONE BADGE ── */}
      {activeMilestone && (
        <group position={[0, 3.5, 0]} rotation={[0, Math.PI / 2, 0]}>
          <Text
            fontSize={0.5}
            color="#fbbf24"
            anchorX="center"
            anchorY="bottom"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKbxmc_A.woff"
          >
            {`${activeMilestone.icon} ${activeMilestone.label}`}
            <meshBasicMaterial color="#fbbf24" toneMapped={false} /> {/* Ensures bloom grabs it naturally */}
          </Text>
          <Text
            position={[0, -0.6, 0]}
            fontSize={0.3}
            color="#ffffff"
            anchorX="center"
            anchorY="top"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKbxmc_A.woff"
          >
            {activeMilestone.detail}
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </Text>
        </group>
      )}
      
      {/* DYNAMIC SURF WAKE PARTICLES */}
      <SurferWake phase={phase} />

      {/* Board aura light */}
      <pointLight color="#00eeff" intensity={5} distance={10} decay={2} />
    </group>
  );
};

export default Surfer;
