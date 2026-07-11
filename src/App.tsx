import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, Stars } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette, Noise } from '@react-three/postprocessing'
import * as THREE from 'three'
import { 
  Code2, BrainCircuit, Layers, GraduationCap, X, 
  Terminal, Activity, ShieldCheck, Database, Cpu, Mail, Github, ArrowLeft, Linkedin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Universe from './components/ThreeScene/Universe'
import DNAHelix from './components/ThreeScene/DNAHelix'
// Static import on purpose — see the comment at the render site: React.lazy
// deadlocks the R3F canvas init in production builds.
import DeepDive from './components/ThreeScene/DeepDive'
import MutationLog from './components/MutationLog'
import CustomCursor from './components/CustomCursor'

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isMobile
}

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
        { label: 'AI/ML', value: 'NLP, Computer Vision, DistilBERT' },
        { label: 'Full-Stack', value: 'React, Next.js, Node, FastAPI' },
        { label: 'Languages', value: 'Python, JS, Java, C++, Dart' }
    ]
  },
  {
    id:'experience', label:'Experience', color:'#a855f7', icon: Layers,
    subtitle:'Evolutionary Path',
    directive: {
        title: "Navigating the frontier of applied research.",
        desc: "Bridging the gap between theoretical machine learning and production-ready applications."
    },
    stats: { count: 4, label: 'Internships' },
    details: [
        { label: 'Digit7', value: 'AI/ML Intern — Computer Vision' },
        { label: 'SST · NRL', value: 'Full-Stack Dev Intern' },
        { label: 'NUS', value: 'ML Academic Intern' },
        { label: 'GreenOrange', value: 'Frontend Intern' }
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
        { label: 'TicketAI', value: 'NLP Support Classifier — 96.5%' },
        { label: 'RankGym', value: 'Gamified iOS Fitness App' },
        { label: 'Retail', value: 'MaligaiKadai Management System' }
    ]
  },
  {
    id:'education', label:'Education', color:'#22c55e', icon: GraduationCap,
    subtitle:'Academic Base',
    directive: {
        title: "Establishing the foundation of computational intelligence.",
        desc: "Mastering the fundamentals of computer science and specialized intelligent systems."
    },
    stats: { count: 7.57, label: 'CGPA' },
    details: [
        { label: 'VIT Vellore', value: 'B.Tech CSE (2022-26)' },
        { label: 'Scores', value: 'CGPA 7.57 · IELTS 7.0 (C1)' }
    ]
  },
];

const PROJECTS = [
  {
    id: 'ticketai', seq: 'BLUEPRINT_001',
    name: 'AI Ticket Classifier', type: 'NLP Support Triage',
    stack: ['Python', 'FastAPI', 'DistilBERT'],
    status: 'SEQUENCE_VERIFIED', metric: '96.5% accuracy',
    desc: 'End-to-end NLP pipeline benchmarking TF-IDF, SVM, DistilBERT & Sentence-BERT; deployed with confidence-based human-in-the-loop routing (Macro F1: 0.96).',
  },
  {
    id: 'rankgym', seq: 'BLUEPRINT_002',
    name: 'RankGym', type: 'Gamified iOS Fitness App',
    stack: ['Next.js 15', 'TypeScript', 'HealthKit'],
    status: 'SEQUENCE_VERIFIED', metric: 'E→S rank RPG',
    desc: 'Workout tracking as an RPG — daily quests, XP, streaks and rank progression; Apple HealthKit sync via Capacitor with fully local data.',
  },
  {
    id: 'maligaikadai', seq: 'BLUEPRINT_003',
    name: 'MaligaiKadai', type: 'Retail Management System',
    stack: ['React.js', 'FastAPI', 'MongoDB'],
    status: 'SEQUENCE_VERIFIED', metric: 'Live inventory',
    desc: 'Normalised schemas for products, suppliers and transactions; automated invoice generation and real-time inventory reconciliation via REST APIs.',
  },
  {
    id: 'vehicletrack', seq: 'BLUEPRINT_004',
    name: 'Vehicle Tracking', type: 'Logistics Dashboard',
    stack: ['React.js', 'Node.js', 'REST APIs'],
    status: 'SEQUENCE_VERIFIED', metric: 'Real-time telemetry',
    desc: 'Real-time backend APIs with interactive frontend visualisations for logistics tracking; modular pipeline design under latency constraints.',
  },
]

const EXPERIENCE_TIMELINE = [
  {
    id: 'digit7', period: '2026',
    company: 'Digit7', fullName: 'Digit7 India Pvt. Ltd.',
    role: 'AI/ML Intern — Computer Vision', highlight: 'CV evaluation',
    tech: ['Computer Vision', 'Model Evaluation', 'Python'],
    desc: 'Evaluated annotation quality and model outputs for a cashierless retail CV system; designed targeted protocols that surfaced occlusion failure modes invisible to aggregate metrics.',
  },
  {
    id: 'sst', period: '2025',
    company: 'SST Cloud', fullName: 'SST Cloud Solutions — Client: National Rugby League (AU)',
    role: 'Full-Stack Dev Intern', highlight: 'Production APIs',
    tech: ['Node.js', 'Express.js', 'React.js'],
    desc: 'Built scalable REST APIs and integrated React frontends for a live production system; resolved Level-2 production issues via log-driven root-cause analysis.',
  },
  {
    id: 'nus', period: '2024',
    company: 'NUS', fullName: 'NUS School of Computing, Singapore',
    role: 'ML Academic Intern', highlight: '>60% variance',
    tech: ['Python', 'Scikit-learn', 'Regression'],
    desc: 'Built Ridge, Lasso and gradient-boosted models for profit-margin prediction across ~3,000 retail transactions; 3 engineered ratio features explained most of the variance.',
  },
  {
    id: 'greenorange', period: '2024',
    company: 'GreenOrange', fullName: 'GreenOrange Information Technology',
    role: 'Frontend Intern', highlight: '87% accuracy',
    tech: ['Flutter', 'Dart', 'FastAPI'],
    desc: 'Built Flutter mobile UI integrated with FastAPI backend services; shipped ML-backed features reaching 87% model accuracy in production.',
  },
]

// Per-domain label for the detail panel's launch button — every domain now has
// its own scroll-driven Deep Dive cinematic.
const DIVE_CTA: Record<string, string> = {
  skills: '🧬 Launch Neural Dive',
  experience: '🚀 Ride the Timeline',
  projects: '⚙️ Enter the Foundry',
  education: '🎓 Visit the Core',
}

const SKILLS_TECH = [
  { category: 'AI ∕ ML',         color: '#38bdf8', skills: ['NLP', 'Computer Vision', 'DistilBERT', 'Scikit-learn', 'TF-IDF', 'SVM'] },
  { category: 'Frontend',        color: '#22c55e', skills: ['React.js', 'Next.js', 'TypeScript', 'Flutter', 'Tailwind', 'Framer Motion'] },
  { category: 'Backend',         color: '#a855f7', skills: ['Node.js', 'Express.js', 'FastAPI', 'REST APIs', 'Firebase'] },
  { category: 'Languages',       color: '#fbbf24', skills: ['Python', 'JavaScript', 'Java', 'C++', 'Dart', 'SQL'] },
  { category: 'Cloud ∕ DevOps',  color: '#f87171', skills: ['AWS SageMaker', 'Docker', 'Git', 'MongoDB', 'Supabase'] },
]

// Pulls its child toward the cursor while hovered and springs back on leave.
// Strength is the fraction of the cursor's offset-from-center applied.
// The OUTER div stays put and owns measurement + mouse events; only the inner
// div translates — measuring the moving element would feed back into itself.
const Magnetic = ({ children, strength = 0.3, className }: { children: React.ReactNode; strength?: number; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        setOffset({
          x: (e.clientX - r.left - r.width / 2) * strength,
          y: (e.clientY - r.top - r.height / 2) * strength,
        })
      }}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
    >
      <motion.div
        animate={{ x: offset.x, y: offset.y }}
        transition={{ type: 'spring', stiffness: 220, damping: 16, mass: 0.4 }}
      >
        {children}
      </motion.div>
    </div>
  )
}

// Scrambles through genome-flavoured glyphs before locking each letter in,
// left to right — the name literally "decodes" on arrival.
const DecodeText = ({ text }: { text: string }) => {
  const [display, setDisplay] = useState(text)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const GLYPHS = 'ACGTACGT<>/\\|=~'
    const DURATION_MS = 1500
    // Elapsed-time based (not frame-counted) so throttled timers in background
    // tabs still finish the decode on schedule.
    const start = performance.now()
    const id = setInterval(() => {
      const progress = (performance.now() - start) / DURATION_MS
      setDisplay(text.split('').map((ch, i) => {
        if (ch === ' ') return ' '
        // Each letter locks in once the sweep passes its position
        return (i / text.length) < (progress * 1.3 - 0.15)
          ? ch
          : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      }).join(''))
      if (progress >= 1) {
        setDisplay(text)
        clearInterval(id)
      }
    }, 40)
    return () => clearInterval(id)
  }, [text])
  return <>{display}</>
}

const CinematicCamera = ({ stage, scrollProgress, mouse }: { stage: string, scrollProgress: number, mouse: { x: number, y: number } }) => {
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

        // Cursor parallax: the camera leans a few units toward the pointer while
        // still LOOKING at the un-shifted target, so the scene visibly shifts
        // perspective instead of just rotating. Strongest on the hero.
        const parallax = stage === 'hero' ? 4 : stage === 'decoded' ? 1.5 : 0
        const lookY = targetY
        targetX += mouse.x * parallax
        targetY += -mouse.y * parallax * 0.75

        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.04)
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.04)
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.04)
        camera.lookAt(0, lookY, 0)
    })
    return null
}

const App: React.FC = () => {
  const [viewStage, setViewStage] = useState<'hero' | 'scanning' | 'decoded' | 'detail' | 'cinematic'>('hero')
  const [activeDomain, setActiveDomain] = useState<string | null>(null)
  const [scanLogs, setScanLogs] = useState<string[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showTerminal, setShowTerminal] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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
        if (i === logs.length - 1) setTimeout(() => {
          // Guarded: if the user already navigated past the scan (fast clicks
          // into detail or a dive), this stale timer must not yank them back.
          setViewStage(v => v === 'scanning' ? 'decoded' : v)
        }, 1200)
      }, i * 600)
    })
  }

  return (
    <div className="fixed inset-0 select-none bg-black text-white font-sans overflow-hidden">

      <CustomCursor />

      {/* ── UNIFIED 3D ENGINE ── */}
      <div className="absolute inset-0 z-0">
        <Canvas
          gl={{ antialias: false, alpha: false }}
          dpr={[1, 1.5]}
          frameloop={viewStage === 'cinematic' ? 'never' : 'always'}
        >
            <PerspectiveCamera makeDefault position={[0, 0, 40]} fov={35} />
            <CinematicCamera stage={viewStage} scrollProgress={scrollProgress} mouse={mousePos} />
            
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={3} color="#38bdf8" />
            <pointLight position={[-10, -10, -10]} intensity={2} color="#a855f7" />

            <Universe onSelectDomain={(id) => {
                if (viewStage === 'hero') {
                    setActiveDomain(id);
                    setViewStage('detail');
                    const index = DOMAINS.findIndex(d => d.id === id);
                    if (index !== -1) setScrollProgress(index / 3);
                }
            }} />
            <DNAHelix 
                isScanning={viewStage === 'scanning'}
                isDecoded={viewStage === 'decoded' || viewStage === 'detail'}
                activeDomainId={activeDomain}
                onHoverDomain={(id) => {
                    // Hover highlighting only makes sense while browsing the
                    // decoded helix; during detail/cinematic activeDomain also
                    // gates+keys those views, so stray hover events (incl. the
                    // null on pointer-out) must not rewrite it.
                    if (viewStage === 'decoded' && id) setActiveDomain(id)
                }}
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
      <div className="relative z-10 w-full h-full pointer-events-none flex flex-col items-center justify-center p-4 md:p-8">

        {/* RECRUITER HUD */}
        <nav className="fixed top-4 right-4 md:top-8 md:right-8 z-[100] flex gap-2 md:gap-4 pointer-events-auto">
            {[
                { label: 'Resume', icon: Activity, href: '/Vishal_S_I_Resume.pdf', download: true },
                { label: 'GitHub', icon: Github, href: 'https://github.com/vishal171104' }
            ].map(link => (
                <Magnetic key={link.label} strength={0.35}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer" {...(link.download ? { download: 'Vishal_S_I_Resume.pdf' } : {})} className="px-3 py-1.5 md:px-6 md:py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl text-[0.5rem] md:text-[0.6rem] font-black tracking-[0.2em] md:tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all flex items-center gap-2 md:gap-3">
                        <link.icon size={12} /> {link.label}
                    </a>
                </Magnetic>
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
                    className="flex flex-col items-center pointer-events-auto pt-20 md:pt-0 px-2"
                >
                    <div className="mb-4 md:mb-6 px-4 md:px-6 py-1.5 md:py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-center">
                        <p className="text-[0.45rem] md:text-[0.6rem] font-black tracking-[0.3em] md:tracking-[0.5em] text-primary uppercase animate-pulse">
                            System Ready for Analysis
                        </p>
                    </div>
                    <h1
                        className="text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black tracking-tighter text-center bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent leading-[0.85] md:leading-[0.8] transition-transform duration-300 ease-out will-change-transform"
                        style={{
                            transform: `perspective(1000px) rotateX(${mousePos.y * -6}deg) rotateY(${mousePos.x * 6}deg) translateZ(0)`
                        }}
                    >
                        <DecodeText text="VISHAL S I" />
                    </h1>
                    <p className="mt-4 md:mt-8 text-sm md:text-xl font-serif italic text-white/40 tracking-[0.2em] md:tracking-[0.3em] text-center">
                        Encoded in My DNA
                    </p>

                    <Magnetic strength={0.22} className="mt-10 md:mt-20">
                        <button
                            onClick={startScan}
                            className="group relative py-4 px-10 md:py-6 md:px-20 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-xl transition-all hover:bg-primary/20 hover:border-primary/40 active:scale-95 shadow-[0_0_50px_rgba(56,189,248,0.1)]"
                        >
                            <div className="absolute inset-0 rounded-full blur-2xl bg-primary/20 group-hover:bg-primary/40 transition-all" />
                            <span className="relative text-xs md:text-sm font-black tracking-[0.3em] md:tracking-[0.5em] text-primary transition-all group-hover:tracking-[0.7em] uppercase">
                                Decode My Genome
                            </span>
                        </button>
                    </Magnetic>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="mt-10 md:mt-20 flex flex-col items-center gap-3 md:gap-4 text-white/20 select-none"
                    >
                        <div className="w-1 h-10 md:h-12 rounded-full bg-gradient-to-b from-primary/20 to-transparent relative overflow-hidden">
                            <motion.div
                                animate={{ y: [0, 48, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="w-full h-1/3 bg-primary/40 rounded-full"
                            />
                        </div>
                        <span className="text-[0.45rem] md:text-[0.5rem] font-black tracking-[0.3em] md:tracking-[0.5em] uppercase">Scroll to Sequence</span>
                    </motion.div>

                    <div className="mt-12 md:mt-24 flex gap-8 md:gap-12 pointer-events-auto">
                        <a href="https://github.com/vishal171104" target="_blank" rel="noopener noreferrer">
                            <Github size={20} className="text-white/20 hover:text-primary transition-colors cursor-pointer" />
                        </a>
                        <a href="https://linkedin.com/in/vishal-si" target="_blank" rel="noopener noreferrer">
                            <Linkedin size={20} className="text-white/20 hover:text-primary transition-colors cursor-pointer" />
                        </a>
                        <button
                            onClick={() => setShowTerminal(true)}
                            title="Open Mutation Log"
                            className="group relative"
                        >
                            <Terminal size={20} className="text-white/20 hover:text-[#38bdf8] transition-all group-hover:drop-shadow-[0_0_8px_#38bdf8] cursor-pointer" />
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[0.45rem] font-black tracking-[0.3em] uppercase text-white/40 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                Mutation Log
                            </span>
                        </button>
                        <a href="mailto:vishal171104@gmail.com">
                            <Mail size={20} className="text-white/20 hover:text-primary transition-colors cursor-pointer" />
                        </a>
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
                <div className="absolute inset-0 flex flex-col md:flex-row items-stretch md:items-center justify-start md:justify-between px-4 pt-24 pb-36 md:p-24 pointer-events-auto md:pointer-events-none gap-4 md:gap-0 overflow-y-auto md:overflow-visible">
                    <div className="flex flex-col gap-4 md:gap-10 w-full md:w-[24vw]">
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
                    <div className="flex flex-col gap-4 md:gap-10 w-full md:w-[24vw]">
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
                className="fixed bottom-0 left-0 right-0 z-50 p-2 md:p-8 flex justify-center pointer-events-none"
            >
                <div className="w-full max-w-5xl px-3 py-3 md:px-16 md:py-8 rounded-t-2xl md:rounded-t-[4rem] bg-black/80 border-t border-x border-white/10 backdrop-blur-3xl flex items-center justify-between gap-2 pointer-events-auto shadow-[0_-20px_100px_rgba(0,0,0,0.8)] overflow-x-auto">
                    <div className="flex items-center gap-2 md:gap-8 pr-2 md:pr-16 border-r border-white/10 shrink-0">
                        <div className="p-2 md:p-4 rounded-full bg-primary/10 border border-primary/20">
                            <ShieldCheck size={16} className="text-primary md:hidden" />
                            <ShieldCheck size={24} className="text-primary hidden md:block" />
                        </div>
                        <div>
                            <p className="text-[0.45rem] md:text-[0.6rem] font-black tracking-widest text-primary uppercase mb-0.5 md:mb-1">Status</p>
                            <p className="text-[0.6rem] md:text-lg font-mono text-white/90 whitespace-nowrap">GENOME_STABLE_V4.2</p>
                        </div>
                    </div>

                    <div className="flex gap-3 md:gap-16 flex-1 justify-center shrink-0">
                        {[
                            { label: 'Built', value: '12', icon: Database },
                            { label: 'Internships', value: '04', icon: Cpu },
                            { label: 'CGPA', value: '7.57', icon: Activity },
                            { label: 'Coding', value: '4Y', icon: Terminal }
                        ].map((stat, i) => (
                            <div key={i} className="text-center group cursor-help">
                                <p className="text-[0.4rem] md:text-[0.5rem] font-black tracking-[0.15em] md:tracking-[0.3em] text-white/30 uppercase group-hover:text-white transition-colors mb-1 md:mb-2 whitespace-nowrap">{stat.label}</p>
                                <p className="text-sm md:text-2xl font-black font-serif italic transition-transform group-hover:scale-110 group-hover:text-primary">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="pl-2 md:pl-16 border-l border-white/10 shrink-0">
                         <button
                            onClick={() => { setViewStage('hero'); setActiveDomain(null); }}
                            className="p-2.5 md:p-5 rounded-full border border-white/10 hover:border-white/40 bg-white/5 transition-all text-white/30 hover:text-white"
                         >
                            <X size={16} className="md:hidden" />
                            <X size={20} className="hidden md:block" />
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
                className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-8 md:p-24"
            >
                {(() => {
                    const domain = DOMAINS.find(d => d.id === activeDomain);
                    if (!domain) return null;

                    return (
                        <motion.div
                            layoutId={`card-${activeDomain}`}
                            className="relative w-full max-w-6xl max-h-[90vh] md:h-[75vh] rounded-[1.5rem] md:rounded-[4rem] bg-white/5 border border-white/20 shadow-3xl p-5 sm:p-10 md:p-20 flex items-start md:items-center overflow-y-auto md:overflow-hidden backdrop-blur-3xl"
                        >
                            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />

                            <button
                                onClick={() => setViewStage('decoded')}
                                className="absolute top-4 right-4 md:top-12 md:right-12 p-3 md:p-5 rounded-full border border-white/10 hover:bg-white hover:text-black transition-all group z-20 bg-black/40 backdrop-blur-xl"
                            >
                                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform md:hidden" />
                                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform hidden md:block" />
                            </button>

                            <div className="grid md:grid-cols-2 gap-8 md:gap-24 w-full relative z-10">
                                <div>
                                    <div className="flex items-center gap-4 md:gap-8 mb-6 md:mb-12 pr-12 md:pr-0">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-white/5 border border-white/10 shadow-2xl shrink-0"
                                        >
                                            <domain.icon size={24} className="md:hidden" style={{ color: domain.color }} />
                                            <domain.icon size={40} className="hidden md:block" style={{ color: domain.color }} />
                                        </motion.div>
                                        <div>
                                            <h2 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-2">
                                                {domain.label}
                                            </h2>
                                            <p className="text-[0.6rem] md:text-sm font-serif italic text-white/30 tracking-[0.2em] md:tracking-[0.4em] uppercase">
                                                Sequence Manifest DECODE_0{DOMAINS.indexOf(domain) + 1}
                                            </p>
                                        </div>
                                    </div>
                                    {domain.id === 'projects' ? (
                                        <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: '44vh', scrollbarWidth: 'none' }}>
                                            {PROJECTS.map((proj, i) => (
                                                <motion.div
                                                    key={proj.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="group relative p-5 rounded-2xl border border-[#fbbf24]/10 bg-black/50 hover:border-[#fbbf24]/35 transition-all overflow-hidden"
                                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                                >
                                                    <div className="absolute top-0 right-0 w-20 h-20 opacity-[0.06] pointer-events-none"
                                                        style={{ background: 'radial-gradient(circle at top right, #fbbf24, transparent)' }} />
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="text-[0.45rem] tracking-[0.4em] text-[#fbbf2466] uppercase mb-0.5">{proj.seq}</p>
                                                            <p className="text-sm font-black text-white tracking-wider leading-tight">{proj.name}</p>
                                                            <p className="text-[0.6rem] text-white/35 italic">{proj.type}</p>
                                                        </div>
                                                        <span className="text-[0.42rem] font-black tracking-[0.2em] px-2 py-1 rounded border border-[#22c55e]/30 text-[#22c55e] shrink-0 ml-3">
                                                            ✓ {proj.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-[0.62rem] text-white/45 leading-relaxed mb-3">{proj.desc}</p>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex gap-1.5 flex-wrap">
                                                            {proj.stack.map((s: string) => (
                                                                <span key={s} className="text-[0.48rem] px-2 py-0.5 rounded border border-[#fbbf24]/20 text-[#fbbf2477] font-black tracking-wider">{s}</span>
                                                            ))}
                                                        </div>
                                                        <span className="text-[0.55rem] text-[#38bdf8] font-black shrink-0">{proj.metric}</span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : domain.id === 'experience' ? (
                                        <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: '44vh', scrollbarWidth: 'none' }}>
                                            {EXPERIENCE_TIMELINE.map((exp, i) => (
                                                <motion.div
                                                    key={exp.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.12 }}
                                                    className="relative flex gap-4 p-5 rounded-2xl border border-[#a855f7]/10 bg-black/50 hover:border-[#a855f7]/30 transition-all overflow-hidden"
                                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                                >
                                                    <div className="absolute top-0 right-0 w-20 h-20 opacity-[0.05] pointer-events-none"
                                                        style={{ background: 'radial-gradient(circle at top right, #a855f7, transparent)' }} />
                                                    {/* Year orb + timeline line */}
                                                    <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                                                        <div className="w-9 h-9 rounded-full border border-[#a855f7]/40 bg-[#a855f7]/10 flex items-center justify-center text-[0.5rem] font-black" style={{ color: '#a855f7' }}>
                                                            {exp.period}
                                                        </div>
                                                        {i < EXPERIENCE_TIMELINE.length - 1 && (
                                                            <div className="flex-1 w-px bg-[#a855f7]/15 my-1" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between mb-1">
                                                            <div>
                                                                <p className="text-sm font-black text-white leading-tight">{exp.role}</p>
                                                                <p className="text-[0.58rem] font-black tracking-wider" style={{ color: '#a855f7' }}>
                                                                    {exp.company} &mdash; <span className="text-white/30 font-normal">{exp.fullName}</span>
                                                                </p>
                                                            </div>
                                                            <span className="text-[0.5rem] font-black text-[#38bdf8] shrink-0 ml-2">{exp.highlight}</span>
                                                        </div>
                                                        <p className="text-[0.62rem] text-white/40 leading-relaxed mb-2.5">{exp.desc}</p>
                                                        <div className="flex gap-1.5 flex-wrap">
                                                            {exp.tech.map((t: string) => (
                                                                <span key={t} className="text-[0.48rem] px-2 py-0.5 rounded border border-[#a855f7]/20 font-black tracking-wider" style={{ color: '#a855f755' }}>  {t}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : domain.id === 'skills' ? (
                                        <div className="space-y-5 overflow-y-auto pr-1" style={{ maxHeight: '44vh', scrollbarWidth: 'none' }}>
                                            {SKILLS_TECH.map((group, gi) => (
                                                <motion.div
                                                    key={group.category}
                                                    initial={{ opacity: 0, x: -16 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: gi * 0.08 }}
                                                >
                                                    <p className="text-[0.5rem] font-black tracking-[0.4em] uppercase mb-2.5" style={{ color: group.color + 'aa' }}>
                                                        {group.category}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {group.skills.map((sk: string, ki: number) => (
                                                            <motion.span
                                                                key={sk}
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                transition={{ delay: gi * 0.08 + ki * 0.04 }}
                                                                whileHover={{ scale: 1.08, y: -2 }}
                                                                className="px-3 py-1.5 rounded-full text-[0.6rem] font-black tracking-wider border cursor-default transition-shadow"
                                                                style={{
                                                                    borderColor: group.color + '33',
                                                                    color: group.color,
                                                                    background: group.color + '11',
                                                                    boxShadow: `0 0 0 0 ${group.color}00`,
                                                                }}
                                                            >
                                                                {sk}
                                                            </motion.span>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
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
                                    )}
                                </div>
                                <div className="flex flex-col justify-center gap-5 md:gap-10">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="p-6 md:p-12 rounded-[1.5rem] md:rounded-[3.5rem] border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm"
                                    >
                                        <p className="text-[0.55rem] md:text-[0.7rem] font-black tracking-[0.4em] md:tracking-[0.6em] text-white/30 uppercase mb-3 md:mb-6 leading-none">Prime Directive</p>
                                        <h4 className="text-xl md:text-3xl font-black mb-3 md:mb-6 leading-tight">{domain.directive.title}</h4>
                                        <p className="text-sm md:text-lg text-white/40 leading-relaxed font-serif italic">
                                            {domain.directive.desc}
                                        </p>
                                    </motion.div>
                                    <motion.button
                                        layoutId={`btn-${activeDomain}`}
                                        onClick={() => setViewStage('cinematic')}
                                        className="w-full py-4 md:py-8 rounded-[1.25rem] md:rounded-[2rem] text-[0.65rem] md:text-base font-black tracking-[0.3em] md:tracking-[0.6em] uppercase transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] text-black hover:!bg-white cursor-pointer"
                                        style={{ background: domain.color }}
                                    >
                                        {DIVE_CTA[domain.id] ?? 'Launch Deep Dive'}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })()}
            </motion.div>
        )}
      </AnimatePresence>

      {/*
        ── SCROLL-DRIVEN DEEP DIVE (one cinematic per domain) ──
        Deliberately NOT wrapped in AnimatePresence OR Suspense/lazy. Both were tried
        (on the previous ocean scene) and both break R3F scenes in production builds:
        - AnimatePresence left the resolved child stuck mid-exit (display:none).
        - React.lazy + Suspense deadlocked R3F's canvas init: the boundary mounts the
          subtree hidden, react-use-measure reports 0×0, the GL context is never
          created, and the scene stays permanently black (canvas stuck at 300×150).
        A static import simply works. DeepDive fades itself in via CSS.
      */}
      {viewStage === 'cinematic' && activeDomain && (
        <DeepDive
          key={activeDomain}
          domain={activeDomain}
          onBack={() => {
            setViewStage('detail');
          }}
          onNext={(nextId) => {
            // Chain into the next domain's dive — key remounts with fresh state
            setActiveDomain(nextId);
            const index = DOMAINS.findIndex(d => d.id === nextId);
            if (index !== -1) setScrollProgress(index / 3);
          }}
        />
      )}

      {/* ── MUTATION LOG TERMINAL ── */}
      <AnimatePresence>
        {showTerminal && (
          <MutationLog onClose={() => setShowTerminal(false)} />
        )}
      </AnimatePresence>

    </div>
  )
}

const ModuleCard = ({ domain, activeDomain, setViewStage, setActiveDomain, scrollProgress }: any) => {
    const index = DOMAINS.findIndex(d => d.id === domain.id)
    const normalizedScroll = scrollProgress * 3
    const distanceFromActive = Math.abs(normalizedScroll - index)
    const isMobile = useIsMobile()

    // Cards on left or right
    const isLeft = domain.id === 'skills' || domain.id === 'experience'
    const isActive = activeDomain === domain.id

    // On mobile the deck is a plain scrollable stack — skip the scroll-linked
    // 3D float/offset transforms, which assume desktop's wheel-driven scrollProgress.
    const animate = isMobile
        ? { opacity: 1, x: 0, y: 0, scale: 1, rotateY: 0 }
        : {
            opacity: activeDomain && !isActive ? 0.05 : (1 - distanceFromActive * 0.4),
            x: isActive ? (isLeft ? '20%' : '-20%') : 0,
            y: (normalizedScroll - index) * 80, // Match visual 3D flow
            scale: isActive ? 1.1 : (1 - distanceFromActive * 0.1),
            rotateY: isActive ? (isLeft ? 360 : -360) : 0,
            perspective: 1000
        }

    return (
        <motion.div
            layoutId={`card-${domain.id}`}
            initial={{ opacity: 0, x: isMobile ? 0 : (isLeft ? -100 : 100) }}
            animate={animate}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className={cn(
                "relative pointer-events-auto p-5 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] bg-black/40 border border-white/10 backdrop-blur-3xl transition-all duration-500 overflow-hidden group cursor-pointer",
                isActive && "border-white/30 bg-black/60 shadow-[0_0_60px_rgba(255,255,255,0.05)]",
                !isMobile && distanceFromActive > 1 && !isActive && "pointer-events-none" // Disable interaction if far from focus
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
            onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
                e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
            }}
        >
            {/* Cursor spotlight: a soft pool of the domain's colour that follows the pointer */}
            <div
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[inherit]"
                style={{ background: `radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), ${domain.color}18, transparent 65%)` }}
            />
            {/* Idle float wrapper */}
            <div style={{ animation: isMobile ? undefined : `cardFloat ${3.5 + index * 0.6}s ease-in-out infinite` }}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4 md:gap-6 mb-5 md:mb-8">
                <div className="p-3 md:p-5 rounded-2xl bg-white/5 border border-white/10 shadow-xl" style={{ color: domain.color }}>
                    <domain.icon size={20} className="md:hidden" />
                    <domain.icon size={24} className="hidden md:block" />
                </div>
                <div>
                    <h3 className="text-lg md:text-2xl font-black tracking-widest uppercase mb-1 leading-none">{domain.label}</h3>
                    <p className="text-[0.5rem] md:text-[0.6rem] tracking-[0.3em] md:tracking-[0.4em] uppercase text-white/30 font-bold">{domain.subtitle}</p>
                </div>
            </div>

            <div className="space-y-4 md:space-y-6">
                {domain.details.map((detail: any, j: number) => (
                    <div key={j} className="group/item">
                        <p className="text-[0.55rem] md:text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em] md:tracking-[0.4em] mb-1.5 md:mb-2 group-hover/item:text-white/40 transition-colors">{detail.label}</p>
                        <p className="text-[0.8rem] md:text-[0.9rem] text-white/60 font-serif italic leading-snug group-hover/item:text-white transition-colors">{detail.value}</p>
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
                className="mt-6 md:mt-10 w-full py-3 md:py-4 rounded-2xl border border-white/5 bg-white/5 text-[0.55rem] md:text-[0.6rem] font-black tracking-[0.3em] md:tracking-[0.5em] uppercase hover:bg-white hover:text-black transition-all"
            >
                View Sequence
            </motion.button>
            </div>{/* end float wrapper */}
        </motion.div>
    )
}

export default App
