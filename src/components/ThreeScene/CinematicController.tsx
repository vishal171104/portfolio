import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { OceanScrollState } from './OceanScrollState';

interface CinematicControllerProps {
  phase: 'fly-in' | 'impact' | 'wave-rise' | 'surfing';
}

const CinematicController: React.FC<CinematicControllerProps> = ({ phase }) => {
  const { camera } = useThree();
  const hasWarped = useRef(false);

  useEffect(() => {
    // Determine target position based on phase and scroll
    if (phase === 'fly-in' && !hasWarped.current) {
      hasWarped.current = true;
      
      // Start near DNA view
      camera.position.set(0, 20, 50);
      
      // Target LookAt (Starting point of the surfer at scroll=0)
      const lookTarget = new THREE.Vector3(-30, 2, 0);
      
      // Cinematic Warp Effect
      gsap.to(camera.position, {
        x: -15,
        y: 20,
        z: 100, // Ocean far view matching the useFrame manual lerp start point
        duration: 2.0,
        ease: "expo.inOut",
        onUpdate: () => {
          camera.lookAt(lookTarget);
        }
      });
    }
  }, [phase, camera]);

  useFrame(() => {
    if (phase === 'fly-in') return;
      
    if (phase === 'surfing' || phase === 'wave-rise') {
      // Scroll-driven camera mapping
      // Surfer rides along X: lerp(-30, 30)
      const sp = OceanScrollState.current;
      const surferX = THREE.MathUtils.lerp(-30, 30, sp);
      // We want to smoothly track the surfer horizontally, slightly offset, moving forward slightly
      const camX = THREE.MathUtils.lerp(-15, 15, sp);
      const camZ = THREE.MathUtils.lerp(100, 40, sp); // Push in closer
      const camY = THREE.MathUtils.lerp(20, 5, sp); // Sweep lower as we ride
      
      // Once GSAP warp finishes, manual camera lerp takes over
      const targetPos = new THREE.Vector3(camX, camY, camZ);
      const targetLook = new THREE.Vector3(surferX, 2, 0);

      // Smoothly interpolate camera position and look target
      camera.position.lerp(targetPos, 0.05);
      
      // We handle lookAt manually for smoother rotation
      const currentLook = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).add(camera.position);
      currentLook.lerp(targetLook, 0.05);
      camera.lookAt(currentLook);
    } else {
      // Impact phase lookAt
      camera.lookAt(0, 0, 0);
    }
  });

  return null;
};

export default CinematicController;
