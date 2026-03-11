import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AsteroidImpactProps {
  phase: 'fly-in' | 'impact' | 'wave-rise' | 'surfing';
}

const AsteroidImpact: React.FC<AsteroidImpactProps> = ({ phase }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const groupRef = useRef<THREE.Group>(null);

  const startY = 120;
  const impactY = -2;

  useFrame((state) => {
    if (!meshRef.current) return;

    // Spin
    meshRef.current.rotation.x += 0.02;
    meshRef.current.rotation.y += 0.04;

    if (phase === 'fly-in') {
      // Park above screen
      meshRef.current.position.set(0, startY, -60);
      if (lightRef.current) lightRef.current.intensity = 0;
    } else if (phase === 'impact') {
      // Descend toward ocean
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        impactY,
        0.08
      );
      // Light flicker
      if (lightRef.current && meshRef.current.position.y > 0) {
        const flicker = 1.0 + Math.sin(state.clock.elapsedTime * 20) * 0.3;
        lightRef.current.intensity = 25 * flicker;
      } else if (lightRef.current) {
        lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 0, 0.3);
      }
    } else {
      // Sink and fade light
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, -60, 0.05);
      if (lightRef.current) {
        lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 0, 0.1);
      }
    }
  });

  if (phase === 'wave-rise' && meshRef.current && meshRef.current.position.y < -40) return null;

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} position={[0, startY, -60]}>
        <icosahedronGeometry args={[3, 2]} />
        <meshStandardMaterial
          color="#1a1a2e"
          emissive="#ff2200"
          emissiveIntensity={2}
          roughness={0.9}
          metalness={0.3}
        />
        <pointLight
          ref={lightRef}
          color="#ff5500"
          intensity={0}
          distance={150}
          decay={1.5}
        />
      </mesh>
    </group>
  );
};

export default AsteroidImpact;
