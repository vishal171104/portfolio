import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, Stars } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette, Noise } from '@react-three/postprocessing'
import * as THREE from 'three'
import { 
  Code2, BrainCircuit, Layers, GraduationCap, X, 
  Terminal, Activity, ShieldCheck, Database, Cpu, Mail, Github, ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Universe from './components/ThreeScene/Universe'
import DNAHelix from './components/ThreeScene/DNAHelix'
import OceanScene from './components/ThreeScene/OceanScene'

// --- DATA ---
const DOMAINS = [
  {
    id:'skills', label:'Skills', color:'#38bdf8', icon: Code2,
    subtitle:'Technical genome',
    directive: {
        title: "Encoding intelligence into scalable architecture.",
        desc: "Transforming complex logic into high-performance, maintainable software systems."
    },
    stats: { count: 24, label: 'Techs' },
    details: [
        { label: 'AI/ML', value: 'DistilBERT, Scikit-learn, FastAPI' },
        { label: 'Full-Stack', value: 'React, Node, Go, MongoDB' },
        { label: 'Languages', value: 'Python, JS, C++, Dart' }
    ]
  },
  {
    id:'experience', label:'Experience', color:'#a855f7', icon: Layers,
    subtitle:'Evolutionary Path',
    directive: {
        title: "Navigating the frontier of applied research.",
        desc: "Bridging the gap between theoretical machine learning and production-ready applications."
    },
    stats: { count: 3, label: 'Internships' },
    details: [
        { label: 'NRL', value: 'Software Dev Intern' },
        { label: 'NUS', value: 'ML Research Intern' },
        { label: 'GreenOrange', value: 'Backend Intern' }
    ]
  },
  {
    id:'projects', label:'Projects', color:'#fbbf24', icon: BrainCircuit,
    subtitle:'Manifested Code',
    directive: {
        title: "Architecture for tomorrow, built today.",
        desc: "Engineering robust full-stack solutions with a focus on user-centric design and performance."
    },
    stats: { count: 12, label: 'Built' },
    details: [
        { label: 'EMYBOT', value: 'NLP Empathy Bot' },
        { label: 'Tracking', value: 'IoT Vehicle Dashboard' },
        { label: 'Commerce', value: 'Smart Grocery System' }
    ]
  },
  {
    id:'education', label:'Education', color:'#22c55e', icon: GraduationCap,
    subtitle:'Academic Base',
    directive: {
        title: "Establishing the foundation of computational intelligence.",
        desc: "Mastering the fundamentals of computer science and specialized intelligent systems."
    },
    stats: { count: 7.55, label: 'CGPA' },
    details: [
        { label: 'VIT Vellore', value: 'B.Tech CSE (2022-26)' },
        { label: 'Spec', value: 'Intelligence Systems' }
    ]
  },
];

const CinematicCamera = ({ stage, scrollProgress }: { stage: string, scrollProgress: number }) => {
    const { camera } = useThree()
    useFrame((state) => {
        let targetZ = 30
        let targetY = 0
        let targetX = 0
        
        if (stage === 'scanning') {
            targetZ = 20
            targetY = Math.sin(state.clock.elapsedTime) * 1.5
        } else if (stage === 'decoded') {
            targetZ = 28
            targetX = 8
            // Match the DNAHelix height (80) with some padding
            targetY = (scrollProgress - 0.5) * 70 
        } else if (stage === 'detail') {
            targetZ = 15
            targetX = -4
            targetY = (scrollProgress - 0.5) * 70
        }

        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.04)
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.04)
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.04)
        camera.lookAt(0, targetY, 0)
    })
    return null
}

const App: React.FC = () => {
  const [viewStage, setViewStage] = useState<'hero' | 'scanning' | 'decoded' | 'detail' | 'cinematic'>('hero')
  const [activeDomain, setActiveDomain] = useState<string | null>(null)
  const [scanLogs, setScanLogs] = useState<string[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [scrollProgress, setScrollProgress] = useState(0)
  const [cinematicSkills, setCinematicSkills] = useState<string[]>([])
  const [cinematicExiting, setCinematicExiting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const SKILLS_LIST = ['Python', 'React', 'FastAPI', 'Machine Learning', 'Deep Learning', 'MongoDB', 'Node.js', 'Three.js']

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
        setMousePos({ 
            x: (e.clientX / window.innerWidth) - 0.5, 
            y: (e.clientY / window.innerHeight) - 0.5 
        })
    }

    const handleScroll = (e: WheelEvent) => {
        if (viewStage === 'decoded' || viewStage === 'detail') {
            setScrollProgress(prev => {
                const sensitivity = 0.001
                const next = prev + e.deltaY * sensitivity
                return Math.min(Math.max(next, 0), 1)
            })
        }
    }

    window.addEventListener('mousemove', handleMouse)
    window.addEventListener('wheel', handleScroll)
    return () => {
        window.removeEventListener('mousemove', handleMouse)
        window.removeEventListener('wheel', handleScroll)
    }
  }, [viewStage])

  // Sync active domain with scroll
  useEffect(() => {
    if (viewStage === 'decoded') {
        const index = Math.min(Math.floor(scrollProgress * 3.99), 3)
        setActiveDomain(DOMAINS[index].id)
    }
  }, [scrollProgress, viewStage])

  const startScan = () => {
    setViewStage('scanning')
    setScanLogs([])
    const logs = [
      "ESTABLISHING NEURAL LINK...",
      "SCANNING GENOME STRANDS...",
      "BLUE: SKILL MODULES IDENTIFIED",
      "PURPLE: EXPERIENCE NODES PERSISTED",
      "GOLD: PROJECT BLUEPRINTS VERIFIED",
      "GREEN: ACADEMIC CORE STABLE",
      "GENOME DECODED - AXIS LOCKED"
    ]
    logs.forEach((log, i) => {
      setTimeout(() => {
        setScanLogs(prev => [...prev, log].slice(-4))
        if (i === logs.length - 1) setTimeout(() => setViewStage('decoded'), 1200)
      }, i * 600)
    })
  }

  return (
    <div className="fixed inset-0 select-none bg-black text-white font-sans overflow-hidden">
      
      {/* ── UNIFIED 3D ENGINE ── */}
      <div className="absolute inset-0 z-0">
        <Canvas gl={{ antialias: false, alpha: false }} dpr={[1, 2]}>
            <PerspectiveCamera makeDefault position={[0, 0, 40]} fov={35} />
            <CinematicCamera stage={viewStage} scrollProgress={scrollProgress} />
            
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={3} color="#38bdf8" />
            <pointLight position={[-10, -10, -10]} intensity={2} color="#a855f7" />

            <Universe />
            <DNAHelix 
                isScanning={viewStage === 'scanning'}
                isDecoded={viewStage === 'decoded' || viewStage === 'detail'}
                activeDomainId={activeDomain}
                onHoverDomain={setActiveDomain}
                onSelectDomain={(id) => {
                    setActiveDomain(id);
                    setViewStage('detail');
                    const index = DOMAINS.findIndex(d => d.id === id);
                    if (index !== -1) setScrollProgress(index / 3);
                }}
                scrollProgress={scrollProgress}
            />

            <EffectComposer enableNormalPass={false}>
                <Bloom luminanceThreshold={1} mipmapBlur intensity={1.2} radius={0.3} />
                <Noise opacity={0.05} />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>
        </Canvas>
      </div>

      {/* ── OVERLAY UI ── */}
      <div className="relative z-10 w-full h-full pointer-events-none flex flex-col items-center justify-center p-8">
        
        {/* RECRUITER HUD */}
        <nav className="fixed top-8 right-8 z-[100] flex gap-4 pointer-events-auto">
            {[
                { label: 'Resume', icon: Activity, href: '#' },
                { label: 'GitHub', icon: Github, href: 'https://github.com/vishal171104' }
            ].map(link => (
                <a key={link.label} href={link.href} className="px-6 py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl text-[0.6rem] font-black tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all flex items-center gap-3">
                    <link.icon size={12} /> {link.label}
                </a>
            ))}
        </nav>

        {/* HERO HEADER */}
        <AnimatePresence>
            {viewStage === 'hero' && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="flex flex-col items-center pointer-events-auto"
                >
                    <div className="mb-6 px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                        <p className="text-[0.6rem] font-black tracking-[0.5em] text-primary uppercase animate-pulse">
                            System Ready for Analysis
                        </p>
                    </div>
                    <h1 className="text-8xl md:text-[10rem] font-black tracking-tighter text-center bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent leading-[0.8]">
                        VISHAL S I
                    </h1>
                    <p className="mt-8 text-xl font-serif italic text-white/40 tracking-[0.3em]">
                        Encoded in My DNA
                    </p>
                    
                    <button 
                        onClick={startScan}
                        className="mt-20 group relative py-6 px-20 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-xl transition-all hover:bg-primary/20 hover:border-primary/40 active:scale-95 shadow-[0_0_50px_rgba(56,189,248,0.1)]"
                    >
                        <div className="absolute inset-0 rounded-full blur-2xl bg-primary/20 group-hover:bg-primary/40 transition-all" />
                        <span className="relative text-sm font-black tracking-[0.5em] text-primary transition-all group-hover:tracking-[0.7em] uppercase">
                            Decode My Genome
                        </span>
                    </button>
                    
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="mt-20 flex flex-col items-center gap-4 text-white/20 select-none"
                    >
                        <div className="w-1 h-12 rounded-full bg-gradient-to-b from-primary/20 to-transparent relative overflow-hidden">
                            <motion.div 
                                animate={{ y: [0, 48, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="w-full h-1/3 bg-primary/40 rounded-full"
                            />
                        </div>
                        <span className="text-[0.5rem] font-black tracking-[0.5em] uppercase">Scroll to Sequence</span>
                    </motion.div>

                    <div className="mt-24 flex gap-12 opacity-20">
                        <Github size={20} className="hover:text-primary transition-colors cursor-pointer" />
                        <Terminal size={20} className="hover:text-primary transition-colors cursor-pointer" />
                        <Mail size={20} className="hover:text-primary transition-colors cursor-pointer" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* SCANNING LOGS */}
        <AnimatePresence>
            {viewStage === 'scanning' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-1 gap-4 w-[25vw]">
                        {scanLogs.map((log, i) => (
                            <motion.div 
                                key={log}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1 - (scanLogs.length - 1 - i) * 0.3, x: 0 }}
                                className="flex items-center gap-4 py-4 px-8 rounded-2xl bg-white/5 border-l-4 border-primary backdrop-blur-xl"
                            >
                                <Activity size={16} className="text-primary animate-pulse" />
                                <span className="text-[0.7rem] font-mono tracking-[0.2em] uppercase text-primary/80 leading-none">
                                    {log}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </AnimatePresence>

        {/* DECODED STATE: FLOATING MODULES */}
        <AnimatePresence>


            {(viewStage === 'decoded' || viewStage === 'detail') && (
                <div className="absolute inset-0 flex items-center justify-between p-24 pointer-events-none">
                    <div className="flex flex-col gap-10 w-[24vw]">
                        {DOMAINS.slice(0, 2).map((domain) => (
                            <ModuleCard 
                                key={domain.id} 
                                domain={domain} 
                                activeDomain={activeDomain} 
                                setViewStage={setViewStage} 
                                setActiveDomain={setActiveDomain} 
                                scrollProgress={scrollProgress}
                            />
                        ))}
                    </div>
                    <div className="flex flex-col gap-10 w-[24vw]">
                        {DOMAINS.slice(2, 4).map((domain) => (
                            <ModuleCard 
                                key={domain.id} 
                                domain={domain} 
                                activeDomain={activeDomain} 
                                setViewStage={setViewStage} 
                                setActiveDomain={setActiveDomain} 
                                scrollProgress={scrollProgress}
                            />
                        ))}
                    </div>
                </div>
            )}
        </AnimatePresence>
      </div>

      {/* ── GENOME STATISTICS HUD ── */}
      <AnimatePresence>
        {viewStage !== 'scanning' && (
            <motion.div 
                initial={{ y: 150 }}
                animate={{ y: 0 }}
                className="fixed bottom-0 left-0 right-0 z-50 p-8 flex justify-center pointer-events-none"
            >
                <div className="w-full max-w-5xl px-16 py-8 rounded-t-[4rem] bg-black/80 border-t border-x border-white/10 backdrop-blur-3xl flex items-center justify-between pointer-events-auto shadow-[0_-20px_100px_rgba(0,0,0,0.8)]">
                    <div className="flex items-center gap-8 pr-16 border-r border-white/10">
                        <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                            <ShieldCheck size={24} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-[0.6rem] font-black tracking-widest text-primary uppercase mb-1">Status</p>
                            <p className="text-lg font-mono text-white/90">GENOME_STABLE_V4.2</p>
                        </div>
                    </div>

                    <div className="flex gap-16 flex-1 justify-center">
                        {[
                            { label: 'Built', value: '12', icon: Database },
                            { label: 'Internships', value: '03', icon: Cpu },
                            { label: 'CGPA', value: '7.55', icon: Activity },
                            { label: 'Coding', value: '4Y', icon: Terminal }
                        ].map((stat, i) => (
                            <div key={i} className="text-center group cursor-help">
                                <p className="text-[0.5rem] font-black tracking-[0.3em] text-white/30 uppercase group-hover:text-white transition-colors mb-2">{stat.label}</p>
                                <p className="text-2xl font-black font-serif italic transition-transform group-hover:scale-110 group-hover:text-primary">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="pl-16 border-l border-white/10">
                         <button 
                            onClick={() => { setViewStage('hero'); setActiveDomain(null); }}
                            className="p-5 rounded-full border border-white/10 hover:border-white/40 bg-white/5 transition-all text-white/30 hover:text-white"
                         >
                            <X size={20} />
                         </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* DETAIL VIEW OVERLAY */}
      <AnimatePresence>
        {viewStage === 'detail' && activeDomain && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-center justify-center p-24"
            >
                {(() => {
                    const domain = DOMAINS.find(d => d.id === activeDomain);
                    if (!domain) return null;
                    
                    return (
                        <motion.div 
                            layoutId={`card-${activeDomain}`}
                            className="relative w-full max-w-6xl h-[75vh] rounded-[4rem] bg-white/5 border border-white/20 shadow-3xl p-20 flex items-center overflow-hidden backdrop-blur-3xl"
                        >
                            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
                            
                            <button 
                                onClick={() => setViewStage('decoded')}
                                className="absolute top-12 right-12 p-5 rounded-full border border-white/10 hover:bg-white hover:text-black transition-all group"
                            >
                                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                            
                            <div className="grid md:grid-cols-2 gap-24 w-full relative z-10">
                                <div>
                                    <div className="flex items-center gap-8 mb-12">
                                        <motion.div 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 shadow-2xl"
                                        >
                                            <domain.icon size={40} style={{ color: domain.color }} />
                                        </motion.div>
                                        <div>
                                            <h2 className="text-7xl font-black uppercase tracking-tighter leading-none mb-2">
                                                {domain.label}
                                            </h2>
                                            <p className="text-sm font-serif italic text-white/30 tracking-[0.4em] uppercase">
                                                Sequence Manifest DECODE_0{DOMAINS.indexOf(domain) + 1}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-10 rounded-[2.5rem] bg-white/5 border border-white/5 space-y-8 backdrop-blur-xl">
                                        {domain.details.map((det, i) => (
                                            <motion.div 
                                                key={i} 
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="group"
                                            >
                                                <p className="text-[0.7rem] font-black text-primary uppercase tracking-[0.5em] mb-3 opacity-50 group-hover:opacity-100 transition-opacity">{det.label}</p>
                                                <p className="text-2xl text-white/90 leading-relaxed font-serif italic group-hover:text-white transition-colors">{det.value}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center gap-10">
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="p-12 rounded-[3.5rem] border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm"
                                    >
                                        <p className="text-[0.7rem] font-black tracking-[0.6em] text-white/30 uppercase mb-6 leading-none">Prime Directive</p>
                                        <h4 className="text-3xl font-black mb-6 leading-tight">{domain.directive.title}</h4>
                                        <p className="text-lg text-white/40 leading-relaxed font-serif italic">
                                            {domain.directive.desc}
                                        </p>
                                    </motion.div>
                                    <motion.button 
                                        layoutId={`btn-${activeDomain}`}
                                        className="w-full py-8 rounded-[2rem] bg-white text-black font-black tracking-[0.6em] uppercase hover:bg-primary hover:text-white transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
                                    >
                                        Full Genome Audit
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })()}
            </motion.div>
        )}
      </AnimatePresence>

      {/* ── SCROLL-DRIVEN CINEMATIC OCEAN SURFER SCENE ── */}
      {/* Simulation removed for now:
      <AnimatePresence>
        {viewStage === 'cinematic' && (
          <OceanScene
            onBack={() => {
              setViewStage('decoded');
            }}
          />
        )}
      </AnimatePresence>
      */}

    </div>
  )
}

const ModuleCard = ({ domain, activeDomain, setViewStage, setActiveDomain, scrollProgress }: any) => {
    const index = DOMAINS.findIndex(d => d.id === domain.id)
    const normalizedScroll = scrollProgress * 3
    const distanceFromActive = Math.abs(normalizedScroll - index)
    
    // Cards on left or right
    const isLeft = domain.id === 'skills' || domain.id === 'experience'
    const isActive = activeDomain === domain.id

    return (
        <motion.div
            layoutId={`card-${domain.id}`}
            initial={{ opacity: 0, x: isLeft ? -100 : 100 }}
            animate={{ 
                opacity: activeDomain && !isActive ? 0.05 : (1 - distanceFromActive * 0.4), 
                x: isActive ? (isLeft ? '20%' : '-20%') : 0,
                y: (normalizedScroll - index) * 80, // Match visual 3D flow
                scale: isActive ? 1.1 : (1 - distanceFromActive * 0.1),
                rotateY: isActive ? (isLeft ? 360 : -360) : 0,
                perspective: 1000
            }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className={cn(
                "relative pointer-events-auto p-10 rounded-[2.5rem] bg-black/40 border border-white/10 backdrop-blur-3xl transition-all duration-500 overflow-hidden group cursor-pointer",
                isActive && "border-white/30 bg-black/60 shadow-[0_0_60px_rgba(255,255,255,0.05)]",
                distanceFromActive > 1 && !isActive && "pointer-events-none" // Disable interaction if far from focus
            )}
            style={{ 
                boxShadow: isActive ? `0 0 50px ${domain.color}20` : "",
                zIndex: isActive ? 100 : 10
            }}
            onClick={() => {
                setActiveDomain(domain.id)
                // If it's already active, go to detail
                if (isActive) {
                    setViewStage('detail')
                }
            }}
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-6 mb-8">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 shadow-xl" style={{ color: domain.color }}>
                    <domain.icon size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-black tracking-widest uppercase mb-1 leading-none">{domain.label}</h3>
                    <p className="text-[0.6rem] tracking-[0.4em] uppercase text-white/30 font-bold">{domain.subtitle}</p>
                </div>
            </div>
            
            <div className="space-y-6">
                {domain.details.map((detail: any, j: number) => (
                    <div key={j} className="group/item">
                        <p className="text-[0.6rem] font-black text-white/20 uppercase tracking-[0.4em] mb-2 group-hover/item:text-white/40 transition-colors">{detail.label}</p>
                        <p className="text-[0.9rem] text-white/60 font-serif italic leading-snug group-hover/item:text-white transition-colors">{detail.value}</p>
                    </div>
                ))}
            </div>

            <motion.button 
                layoutId={`btn-${domain.id}`}
                onClick={(e) => { 
                    e.stopPropagation();
                    setActiveDomain(domain.id); 
                    setViewStage('detail');
                }}
                className="mt-10 w-full py-4 rounded-2xl border border-white/5 bg-white/5 text-[0.6rem] font-black tracking-[0.5em] uppercase hover:bg-white hover:text-black transition-all"
            >
                View Sequence
            </motion.button>
        </motion.div>
    )
}

export default App
