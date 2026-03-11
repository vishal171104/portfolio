import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OceanScrollState } from './OceanScrollState';

interface TsunamiWaveProps {
  phase: 'fly-in' | 'impact' | 'wave-rise' | 'surfing';
}

const vertexShader = `
  varying vec2 vUv;
  varying float vWaveHeight;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  uniform float uScrollProgress;
  uniform float uImpactFactor;

  // Gerstner Wave Function for realistic rolling motion
  vec3 gerstnerWave(vec4 wave, vec3 p, inout vec3 tangent, inout vec3 binormal) {
      float steepness = wave.z;
      float wavelength = wave.w;
      float k = 2.0 * 3.14159 / wavelength;
      float c = sqrt(9.8 / k);
      vec2 d = normalize(wave.xy);
      float f = k * (dot(d, p.xz) - c * uTime);
      float a = steepness / k;

      tangent += vec3(
          -d.x * d.x * (steepness * sin(f)),
          d.x * (steepness * cos(f)),
          -d.x * d.y * (steepness * sin(f))
      );
      binormal += vec3(
          -d.x * d.y * (steepness * sin(f)),
          d.y * (steepness * cos(f)),
          -d.y * d.y * (steepness * sin(f))
      );
      return vec3(
          d.x * (a * cos(f)),
          a * sin(f),
          d.y * (a * cos(f))
      );
  }

  void main() {
      vUv = uv;
      vec3 gridPoint = position;
      vec3 tangent = vec3(1, 0, 0);
      vec3 binormal = vec3(0, 0, 1);
      vec3 p = gridPoint;
      
      // Base chaotic ocean waves
      p += gerstnerWave(vec4(1.0, 0.8, 0.3, 10.0), gridPoint, tangent, binormal);
      p += gerstnerWave(vec4(0.5, 1.0, 0.25, 15.0), gridPoint, tangent, binormal);
      p += gerstnerWave(vec4(-1.0, 0.3, 0.15, 8.0), gridPoint, tangent, binormal);
      
      // Create the Tsunami (Direction, Steepness, Wavelength)
      // Steepness spikes dramatically with uImpactFactor (asteroid hit) and scrollProgress
      float tsunamiSteepness = 0.5 + (uImpactFactor * 0.5) + (uScrollProgress * 0.4);
      p += gerstnerWave(vec4(0.0, 1.0, tsunamiSteepness, 50.0), gridPoint, tangent, binormal); // Massive forward-rolling wave
      
      vec3 normal = normalize(cross(binormal, tangent));
      vWaveHeight = p.y;
      vNormal = normalMatrix * normal;
      
      vec4 worldPos = modelMatrix * vec4(p, 1.0);
      vWorldPosition = worldPos.xyz;
      
      gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying float vWaveHeight; // Passed from the Vertex Shader
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  uniform vec3 uDepthColor;  // Deep Blue
  uniform vec3 uSurfaceColor; // Lighter Cyan
  uniform float uColorOffset;
  uniform float uColorMultiplier;
  uniform vec3 uCameraPos;

  void main() {
      // 1. Calculate color based on height (Darker in troughs, Lighter on peaks)
      float mixStrength = (vWaveHeight + uColorOffset) * uColorMultiplier;
      vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
      
      // 2. Add "Foam" Logic
      // If the wave is higher than a certain threshold, blend in white
      float foamThreshold = 2.0; 
      if (vWaveHeight > foamThreshold) {
          float foamStrength = smoothstep(foamThreshold, foamThreshold + 2.0, vWaveHeight);
          // High-frequency noise for foam details
          float foamNoise = fract(sin(dot(vWorldPosition.xz * 2.0 ,vec2(12.9898,78.233))) * 43758.5453);
          foamStrength *= (0.7 + 0.3 * foamNoise);
          color = mix(color, vec3(1.0, 1.0, 1.0), foamStrength); // White foam
      }
      
      // 3. Fresnel & Reflections
      vec3 viewDir = normalize(uCameraPos - vWorldPosition);
      float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 5.0);
      color += vec3(0.2, 0.4, 0.8) * fresnel * 0.5;

      gl_FragColor = vec4(color, 1.0);
  }
`;

const TsunamiWave: React.FC<TsunamiWaveProps> = ({ phase }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScrollProgress: { value: 0 },
    uImpactFactor: { value: 0 },
    uDepthColor: { value: new THREE.Color("#00081a") }, // Very dark deep ocean
    uSurfaceColor: { value: new THREE.Color("#004488") }, // Mid cyan/blue
    uColorOffset: { value: 2.0 },
    uColorMultiplier: { value: 0.2 },
    uCameraPos: { value: new THREE.Vector3() }
  }), []);

  const impactFactor = useRef(0);

  // Ultra-detail segments for M-series hardware
  const geometryArgs: [number, number, number, number] = [200, 200, 256, 256];

  const geometry = useMemo(() => {
    // 64 for high performance without geometry lockups
    const geo = new THREE.PlaneGeometry(geometryArgs[0], geometryArgs[1], geometryArgs[2], geometryArgs[3]);
    // Rotate permanently into X-Z plane on CPU so GLSL .xz variables map seamlessly
    geo.rotateX(-Math.PI / 2);
    // Important to compute vertex normals for the physics lighting calculation
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((state, delta) => {
    if (phase === 'fly-in') {
      impactFactor.current = 0;
    } else if (phase === 'impact') {
      // Spike on impact
      impactFactor.current = THREE.MathUtils.lerp(impactFactor.current, 1, 0.2);
    } else {
      // Sustain shock/tsunami steepness
      impactFactor.current = THREE.MathUtils.lerp(impactFactor.current, 1, 0.05);
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uScrollProgress.value = OceanScrollState.current;
      materialRef.current.uniforms.uImpactFactor.value = impactFactor.current;
      materialRef.current.uniforms.uCameraPos.value.copy(state.camera.position);
    }
  });

  return (
    // Z-Fighting Fix: Ensure the ocean plane is set to position.y = -5
    // Mesh is natively flat on X-Z because of geometry.rotateX
    <mesh position={[0, -5, 0]} receiveShadow geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
};

export default TsunamiWave;
