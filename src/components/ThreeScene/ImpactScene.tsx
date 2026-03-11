import React, { useRef, useState, useEffect } from 'react'
import { Float, Text, Sparkles, Html } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'

interface ImpactSceneProps {
    domainId: string;
    onBack: () => void;
}

const ImpactScene: React.FC<ImpactSceneProps> = ({ onBack }) => {
    const [phase, setPhase] = useState<'falling' | 'impact' | 'tsunami' | 'surfing'>('falling')
    const [visibleSkills, setVisibleSkills] = useState<string[]>([])
    const [isExiting, setIsExiting] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    const skills = ['Python', 'React', 'FastAPI', 'Machine Learning', 'Deep Learning', 'MongoDB', 'Node.js', 'Three.js']

    useEffect(() => {
        const timeouts = [
            setTimeout(() => setPhase('impact'), 2000),
            setTimeout(() => setPhase('tsunami'), 4000),
            setTimeout(() => setPhase('surfing'), 6000) // Surfer typically appears around 6s in these AI videos
        ]
        return () => timeouts.forEach(clearTimeout)
    }, [])

    useEffect(() => {
        if (phase === 'surfing') {
            const interval = setInterval(() => {
                setVisibleSkills(prev => {
                    if (prev.length >= skills.length) return prev
                    return [...prev, skills[prev.length]]
                })
            }, 500)
            return () => clearInterval(interval)
        }
    }, [phase])

    const handleVideoEnd = () => {
        setIsExiting(true)
        setTimeout(onBack, 500) // Match exit animation duration
    }

    return (
        <group>
            {/* ── CINEMATIC VIDEO BACKGROUND ── */}
            <Html fullscreen style={{ pointerEvents: 'none', zIndex: 999 }}>
                <AnimatePresence>
                    {!isExiting && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            className="fixed inset-0 bg-black overflow-hidden"
                        >
                            <video 
                                ref={videoRef}
                                src="/video/asteroid_impact.mp4"
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                                onEnded={handleVideoEnd}
                            />
                            {/* Cinematic color grading overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent mix-blend-overlay" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </Html>

            {/* ── ATMOSPHERIC OVERLAYS ── */}
            {!isExiting && <Sparkles count={400} scale={50} size={6} speed={1.5} color="#fff" />}
            
            {/* ── INTERACTIVE SKILLS (Over the Video) ── */}
            {phase === 'surfing' && !isExiting && (
                <group position={[0, 0, -15]}>
                    {visibleSkills.map((skill, i) => (
                        <Float 
                            key={skill} 
                            speed={6} 
                            rotationIntensity={1.5} 
                            floatIntensity={2} 
                            position={[ 
                                (i % 2 === 0 ? -1 : 1) * (15 + (i * 1.5)), 
                                6 - (i % 3) * 5, 
                                -10 - i * 4 
                            ]}
                        >
                           <group>
                               <Text
                                    fontSize={4}
                                    color="#fff"
                                    anchorX="center"
                                    anchorY="middle"
                                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKbxmc_A.woff"
                                    outlineWidth={0.05}
                                    outlineColor="#000"
                               >
                                   {skill}
                               </Text>
                               {/* Underline Energy */}
                               <mesh position={[0, -1.2, -0.1]}>
                                   <planeGeometry args={[skill.length * 1.8, 0.2]} />
                                   <meshBasicMaterial color="#38bdf8" />
                               </mesh>
                           </group>
                        </Float>
                    ))}
                </group>
            )}

            <ambientLight intensity={1.5} />
        </group>
    )
}

export default ImpactScene



