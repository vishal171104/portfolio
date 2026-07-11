import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Points, PointMaterial, Html } from '@react-three/drei'

interface DNAHelixProps {
  count?: number;
  radius?: number;
  height?: number;
  turns?: number;
  interactive?: boolean;
  activeDomainId?: string | null;
  onHoverDomain?: (id: string | null) => void;
  onSelectDomain?: (id: string) => void;
  isScanning?: boolean;
  isDecoded?: boolean;
  scrollProgress?: number;
}

const DOMAIN_COLORS: Record<string, string> = {
  skills: '#38bdf8',     // Blue
  experience: '#a855f7', // Purple
  projects: '#fbbf24',   // Gold
  education: '#22c55e',  // Green
}

const DOMAIN_IDS = ['skills', 'experience', 'projects', 'education']

// Number of full twists the double helix makes across its height in the decoded (vertical) state.
const DECODED_TURNS = 3
const DECODED_RADIUS = 1.8

const DNAHelix: React.FC<DNAHelixProps> = ({ 
  count = 200, 
  radius = 4, 
  height = 80, 
  turns = 5, 
  interactive = true,
  activeDomainId,
  onHoverDomain,
  onSelectDomain,
  isScanning = false,
  isDecoded = false,
  scrollProgress = 0
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(-0.2)
  
  const transitionProgress = useRef(0)
  const particleRef = useRef<THREE.Points>(null)

  useEffect(() => {
    if (isScanning) setScanProgress(-0.2)
  }, [isScanning])

  const points = useMemo(() => {
    const list = []
    for (let i = 0; i < count; i++) {
        const t = i / (count - 1)
        const domainIndex = Math.floor(t * 4)
        const domainId = DOMAIN_IDS[domainIndex]
        const color = DOMAIN_COLORS[domainId]
        list.push({ id: `s1-${i}`, domainId, color, strand: 1, t })
        list.push({ id: `s2-${i}`, domainId, color, strand: 2, t })
    }
    return list
  }, [count])

  const particleData = useMemo(() => {
    const positions = new Float32Array(300 * 3)
    const offsets = new Float32Array(300)
    for (let i = 0; i < 300; i++) offsets[i] = Math.random()
    return { positions, offsets }
  }, [])

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime()
    const mix = transitionProgress.current
    
    // Smooth transition
    transitionProgress.current = THREE.MathUtils.lerp(transitionProgress.current, isDecoded ? 1 : 0, 0.04)

    if (groupRef.current) {
        // "Breathing" biological scale shifts
        const breath = 1 + Math.sin(time * 0.8) * 0.05
        groupRef.current.scale.set(breath, breath, breath)

        if (!isDecoded) {
            groupRef.current.rotation.y += 0.005
            groupRef.current.rotation.z = Math.sin(time * 0.3) * 0.06
        } else {
            // Decoded vertical axis rotation (influenced by scroll)
            const scrollRotation = scrollProgress * Math.PI * 2
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, Math.PI / 4 + scrollRotation, 0.03)
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, Math.sin(scrollProgress * 10) * 0.1, 0.05)
        }

        if (interactive && !isDecoded) {
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, (state.pointer.y * Math.PI) / 10, 0.05)
        }
    }

    if (isScanning && scanProgress < 1.1) {
      setScanProgress(p => p + delta * 0.5)
    }

    // Update Particles
    if (particleRef.current) {
        const pos = particleRef.current.geometry.attributes.position.array as Float32Array
        for (let i = 0; i < 300; i++) {
            const t = (particleData.offsets[i] + time * 0.05) % 1
            const strand = i % 2 === 0 ? 1 : 2
            const angle = t * Math.PI * 2 * turns + (strand === 2 ? Math.PI : 0)
            
            const rEffect = radius * (1 - mix * 0.2)
            const x = Math.cos(angle) * rEffect
            const y = (t - 0.5) * height
            const z = Math.sin(angle) * rEffect

            // Vertical genome Axis decoded position — twisting double helix, not a flat ladder
            const dAngle = t * Math.PI * 2 * DECODED_TURNS + (strand === 2 ? Math.PI : 0)
            const dR = DECODED_RADIUS * 0.5 * (1 - mix * 0.5)
            const dX = Math.cos(dAngle) * dR
            const dY = (t - 0.5) * (height * 1.2)
            const dZ = Math.sin(dAngle) * dR

            pos[i * 3] = THREE.MathUtils.lerp(x, dX, mix)
            pos[i * 3 + 1] = THREE.MathUtils.lerp(y, dY, mix)
            pos[i * 3 + 2] = THREE.MathUtils.lerp(z, dZ, mix)
        }
        particleRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <group ref={groupRef}>
      <Points ref={particleRef}>
        <PointMaterial 
            transparent 
            vertexColors 
            size={0.08} 
            sizeAttenuation 
            depthWrite={false} 
            blending={THREE.AdditiveBlending}
            color="#fff" 
            opacity={0.3}
        />
      </Points>

      {/* Sequential Scanner Beam with Chromatic Aberration */}
      {isScanning && scanProgress > -0.1 && scanProgress < 1 && (
        <group position={[0, (scanProgress - 0.5) * height, 0]}>
           {/* Red channel (aberration) */}
           <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
             <ringGeometry args={[radius - 0.8, radius + 4.2, 64]} />
             <meshBasicMaterial color="#ff0044" transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
           </mesh>
           {/* Main Cyan beam */}
           <mesh rotation={[Math.PI / 2, 0, 0]}>
             <ringGeometry args={[radius - 1, radius + 4, 64]} />
             <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
           </mesh>
           {/* Blue channel (aberration) */}
           <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
             <ringGeometry args={[radius - 1.2, radius + 3.8, 64]} />
             <meshBasicMaterial color="#0044ff" transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
           </mesh>

           <pointLight color="#38bdf8" intensity={4} distance={15} />
           <pointLight position={[0, 0.5, 0]} color="#ff0044" intensity={2} distance={10} />
           <pointLight position={[0, -0.5, 0]} color="#0044ff" intensity={2} distance={10} />
        </group>
      )}

      {points.map((p) => (
        <Atom 
           key={p.id} 
           p={p} 
           isDecoded={isDecoded} 
           transitionProgress={transitionProgress}
           radius={radius}
           height={height}
           turns={turns}
           hoveredNode={hoveredNode}
           activeDomainId={activeDomainId}
           isScanning={isScanning}
           scanProgress={scanProgress}
           setHoveredNode={setHoveredNode}
           onHoverDomain={onHoverDomain}
           onSelectDomain={onSelectDomain}
           scrollProgress={scrollProgress}
        />
      ))}

      <Rungs 
        points={points} 
        isDecoded={isDecoded} 
        transitionProgress={transitionProgress} 
        radius={radius} 
        height={height} 
        turns={turns}
        activeDomainId={activeDomainId}
        isScanning={isScanning}
        scanProgress={scanProgress}
        scrollProgress={scrollProgress}
      />
    </group>
  )
}

const Atom = ({ p, isDecoded, transitionProgress, radius, height, turns, hoveredNode, activeDomainId, isScanning, scanProgress, setHoveredNode, onHoverDomain, onSelectDomain, scrollProgress }: any) => {
    const meshRef = useRef<THREE.Group>(null)
    
    useFrame(() => {
        if (!meshRef.current) return
        
        const mix = transitionProgress.current
        const t = p.t
        const angle = t * Math.PI * 2 * turns + (p.strand === 2 ? Math.PI : 0)
        
        const hX = Math.cos(angle) * (radius * (1 - mix * 0.4))
        const hY = (t - 0.5) * height
        const hZ = Math.sin(angle) * (radius * (1 - mix * 0.4))
        
        // Decoded state — genuine twisting double helix (not a flat ladder)
        const dAngle = t * Math.PI * 2 * DECODED_TURNS + (p.strand === 2 ? Math.PI : 0)
        const dX = Math.cos(dAngle) * DECODED_RADIUS
        const dY = (t - 0.5) * (height * 1.2)
        const dZ = Math.sin(dAngle) * DECODED_RADIUS
        
        meshRef.current.position.x = THREE.MathUtils.lerp(hX, dX, mix)
        meshRef.current.position.y = THREE.MathUtils.lerp(hY, dY, mix)
        meshRef.current.position.z = THREE.MathUtils.lerp(hZ, dZ, mix)

        // Pulse logic
        const domainIndex = DOMAIN_IDS.indexOf(p.domainId)
        const isScrollActive = Math.abs(scrollProgress * (DOMAIN_IDS.length - 1) - domainIndex) < 0.15
        const isActive = activeDomainId === p.domainId || isScrollActive

        if (isActive) {
            const s = 1.3 + Math.sin(Date.now() * 0.008) * 0.2
            meshRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1)
        } else {
            meshRef.current.scale.lerp(new THREE.Vector3(1,1,1), 0.1)
        }
    })

    const domainIndex = DOMAIN_IDS.indexOf(p.domainId)
    const isScrollActive = Math.abs(scrollProgress * (DOMAIN_IDS.length - 1) - domainIndex) < 0.15
    const isHovered = hoveredNode === p.id || activeDomainId === p.domainId || isScrollActive
    const isScanReached = isScanning && scanProgress > p.t
    const isScanningRow = isScanning && Math.abs(p.t - scanProgress) < 0.05

    return (
        <group
            ref={meshRef}
            onPointerOver={(e) => {
                e.stopPropagation()
                setHoveredNode(p.id)
                onHoverDomain?.(p.domainId)
            }}
            onPointerOut={() => {
                setHoveredNode(null)
                onHoverDomain?.(null)
            }}
            onClick={() => onSelectDomain?.(p.domainId)}
        >
            {/* Invisible larger hit-target so hovering the thin helix strand is forgiving */}
            <mesh>
                <sphereGeometry args={[0.9, 8, 8]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <mesh>
                <sphereGeometry args={[isHovered ? 0.6 : 0.3, 16, 16]} />
                <meshPhongMaterial
                    color={isScanningRow ? '#fff' : (isScanReached || isDecoded ? p.color : '#222')}
                    emissive={isScanningRow ? '#fff' : (isScanReached || isDecoded ? p.color : '#111')}
                    emissiveIntensity={isHovered || isScanningRow ? 8 : (isScanReached || isDecoded ? 2 : 0.2)}
                    shininess={100}
                    transparent
                    opacity={isDecoded ? 1 : (isScanReached || isScanning ? 1 : 0.3)}
                />
            </mesh>
        </group>
    )
}

const Rungs = ({ points, isDecoded, transitionProgress, radius, height, turns, activeDomainId, isScanning, scanProgress }: any) => {
    const rungsRefs = useRef<THREE.Group>(null)
    
    useFrame(() => {
        if (!rungsRefs.current) return
        const mix = transitionProgress.current
        
        rungsRefs.current.children.forEach((child: any, i) => {
            const t = (i * 8) / (points.length / 2 - 1)
            const angle = t * Math.PI * 2 * turns
            
            const isScanReached = isScanning && scanProgress > t
            child.visible = isDecoded || isScanReached || (isScanning && Math.abs(t - scanProgress) < 0.1)

            const hStart = new THREE.Vector3(Math.cos(angle) * (radius * (1 - mix*0.4)), (t - 0.5) * height, Math.sin(angle) * (radius * (1 - mix*0.4)))
            const hEnd = new THREE.Vector3(Math.cos(angle + Math.PI) * (radius * (1 - mix*0.4)), (t - 0.5) * height, Math.sin(angle + Math.PI) * (radius * (1 - mix*0.4)))
            
            const dAngle = t * Math.PI * 2 * DECODED_TURNS
            const dY = (t - 0.5) * (height * 1.2)
            const dStart = new THREE.Vector3(Math.cos(dAngle) * DECODED_RADIUS, dY, Math.sin(dAngle) * DECODED_RADIUS)
            const dEnd = new THREE.Vector3(Math.cos(dAngle + Math.PI) * DECODED_RADIUS, dY, Math.sin(dAngle + Math.PI) * DECODED_RADIUS)
            
            const start = new THREE.Vector3().lerpVectors(hStart, dStart, mix)
            const end = new THREE.Vector3().lerpVectors(hEnd, dEnd, mix)
            
            child.position.copy(start.clone().add(end).multiplyScalar(0.5))
            child.lookAt(end)
            child.scale.set(1, 1, start.distanceTo(end))
        })
    })

    const rComponents = []
    for (let i = 0; i < points.length; i += 16) { 
        const domainIndex = Math.floor((i / points.length) * 4)
        const domainId = DOMAIN_IDS[domainIndex]
        const color = DOMAIN_COLORS[domainId]
        
        rComponents.push(
            <mesh key={i}>
                <boxGeometry args={[0.08, 0.08, 1]} />
                <meshPhongMaterial color={color} transparent opacity={0.4} emissive={color} emissiveIntensity={0.5} />
            </mesh>
        )
    }

    return <group ref={rungsRefs}>{rComponents}</group>
}

export default DNAHelix

