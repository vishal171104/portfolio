import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Stars, Sparkles } from '@react-three/drei'

export const Constellations = () => {
    const pointsRef = useRef<THREE.Points>(null)
    const linesRef = useRef<THREE.LineSegments>(null)
    
    const count = 150
    const [positions, connections] = useMemo(() => {
        const pos = new Float32Array(count * 3)
        const con = []
        for (let i = 0; i < count; i++) {
            const r = 20 + Math.random() * 40
            const theta = Math.random() * Math.PI * 2
            const phi = Math.random() * Math.PI
            
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
            pos[i * 3 + 2] = r * Math.cos(phi)
            
            for (let j = 0; j < i; j++) {
                const dx = pos[i * 3] - pos[j * 3]
                const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
                const dz = pos[i * 3 + 2] - pos[j * 3 + 2]
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
                if (dist < 12) {
                    con.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])
                    con.push(pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2])
                }
            }
        }
        return [pos, new Float32Array(con)]
    }, [])

    useFrame((state) => {
        const t = state.clock.getElapsedTime() * 0.02
        if (pointsRef.current) pointsRef.current.rotation.y = t
        if (linesRef.current) linesRef.current.rotation.y = t
    })

    return (
        <group>
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                </bufferGeometry>
                <pointsMaterial size={0.15} color="#38bdf8" transparent opacity={0.3} sizeAttenuation />
            </points>
            <lineSegments ref={linesRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[connections, 3]} />
                </bufferGeometry>
                <lineBasicMaterial color="#38bdf8" transparent opacity={0.05} />
            </lineSegments>
        </group>
    )
}

export const Nebulae = () => {
    const nebulae = useMemo(() => [
        { pos: [20, 10, -30], color: '#38bdf8', scale: 20 },
        { pos: [-25, -15, -20], color: '#a855f7', scale: 25 },
        { pos: [10, -25, -40], color: '#fbbf24', scale: 15 },
    ], [])

    return (
        <group>
            {nebulae.map((n, i) => (
                <mesh key={i} position={n.pos as any}>
                    <sphereGeometry args={[n.scale, 32, 32]} />
                    <meshBasicMaterial color={n.color} transparent opacity={0.02} side={THREE.BackSide} />
                </mesh>
            ))}
        </group>
    )
}

const Universe: React.FC = () => {
  return (
    <>
        <Stars radius={150} depth={50} count={6000} factor={4} saturation={0} fade speed={0.5} />
        <Sparkles count={300} size={2} speed={0.3} opacity={0.1} scale={50} color="#38bdf8" />
        <Constellations />
        <Nebulae />
    </>
  )
}

export default Universe

