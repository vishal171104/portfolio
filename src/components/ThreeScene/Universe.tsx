import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Stars, Sparkles, Html } from '@react-three/drei'

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

export const Nebulae = ({ onSelectDomain }: { onSelectDomain?: (id: string) => void }) => {
    const groupRef = useRef<THREE.Group>(null)
    const [hovered, setHovered] = React.useState<number | null>(null)
    const [absorbing, setAbsorbing] = React.useState<number | null>(null)
    
    const nebulae = useMemo(() => [
        { id: 'skills', title: 'Skills Orb', pos: [20, 10, -30], color: '#38bdf8', scale: 20 },
        { id: 'experience', title: 'Experience Orb', pos: [-25, -15, -20], color: '#a855f7', scale: 25 },
        { id: 'projects', title: 'Projects Orb', pos: [10, -25, -40], color: '#fbbf24', scale: 15 },
        { id: 'education', title: 'Education Orb', pos: [-5, 25, -35], color: '#22c55e', scale: 18 },
    ], [])

    useFrame((state, delta) => {
        if (groupRef.current && absorbing === null) {
            groupRef.current.rotation.y += delta * 0.05
        }
    })

    return (
        <group ref={groupRef}>
            {nebulae.map((n, i) => (
                <Orb 
                    key={i} 
                    {...n} 
                    isHovered={hovered === i}
                    isAbsorbing={absorbing === i}
                    othersAbsorbing={absorbing !== null && absorbing !== i}
                    onHover={(state: boolean) => setHovered(state ? i : null)}
                    onClick={() => {
                        if (absorbing !== null) return
                        setAbsorbing(i)
                        setTimeout(() => {
                            onSelectDomain?.(n.id)
                            setAbsorbing(null)
                        }, 1000)
                    }}
                />
            ))}
        </group>
    )
}

const Orb = ({ id, title, pos, color, scale, isHovered, isAbsorbing, othersAbsorbing, onHover, onClick }: any) => {
    const meshRef = useRef<THREE.Mesh>(null)
    const [currentScale, setCurrentScale] = React.useState(scale)

    useFrame((state, delta) => {
        if (!meshRef.current) return
        
        let targetScale = scale
        if (isAbsorbing) targetScale = 200 // Absorb screen
        else if (othersAbsorbing) targetScale = 0
        else if (isHovered) targetScale = scale * 1.5 // Swell on hover

        meshRef.current.scale.lerp(new THREE.Vector3(targetScale/scale, targetScale/scale, targetScale/scale), 0.05)
        
        if (!isAbsorbing) {
             meshRef.current.position.y += Math.sin(state.clock.elapsedTime + pos[0]) * 0.02
        }
    })

    return (
        <mesh 
            ref={meshRef} 
            position={pos as any}
            onPointerOver={(e) => { e.stopPropagation(); onHover(true) }}
            onPointerOut={(e) => { e.stopPropagation(); onHover(false) }}
            onClick={(e) => { e.stopPropagation(); onClick() }}
        >
            <sphereGeometry args={[scale, 32, 32]} />
            <meshBasicMaterial color={color} transparent opacity={isAbsorbing ? 0.8 : (isHovered ? 0.4 : 0.1)} side={THREE.BackSide} />
            
            {!isAbsorbing && !othersAbsorbing && (
                <Html center distanceFactor={15}>
                    <div className={`p-4 rounded-full backdrop-blur-md border transition-all ${isHovered ? 'bg-white/10 opacity-100' : 'bg-transparent border-transparent opacity-50'}`} style={{ borderColor: isHovered ? color : 'transparent' }}>
                        <p className="text-xl font-black uppercase tracking-widest text-white/80">{title}</p>
                    </div>
                </Html>
            )}
        </mesh>
    )
}

const Universe: React.FC<{ onSelectDomain?: (id: string) => void }> = ({ onSelectDomain }) => {
  return (
    <>
        <Stars radius={150} depth={50} count={6000} factor={4} saturation={0} fade speed={0.5} />
        <Sparkles count={300} size={2} speed={0.3} opacity={0.1} scale={50} color="#38bdf8" />
        <Constellations />
        <Nebulae onSelectDomain={onSelectDomain} />
    </>
  )
}

export default Universe

