import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface LogLine {
  text: string
  color: string
}

const BOOT_SEQUENCE: Array<{ delay: number; text: string; color: string }> = [
  { delay: 0,    text: '> INITIALIZING GENOME_OS v4.2...',                        color: '#38bdf8' },
  { delay: 500,  text: '> LOADING ENTITY: Vishal_S_I...',                         color: '#38bdf8' },
  { delay: 1000, text: '  >> Location:    VIT Vellore, India',                    color: '#ffffff' },
  { delay: 1300, text: '  >> Role:        CS + AI/ML Engineer',                   color: '#ffffff' },
  { delay: 1700, text: '> TRAIT_SCAN: running...',                                color: '#38bdf8' },
  { delay: 2100, text: '  >> problem_solver .................. [ACTIVE]',          color: '#22c55e' },
  { delay: 2400, text: '  >> systems_architect ............... [ACTIVE]',          color: '#22c55e' },
  { delay: 2700, text: '  >> ml_researcher ................... [ACTIVE]',          color: '#22c55e' },
  { delay: 3000, text: '  >> fullstack_builder ............... [ACTIVE]',          color: '#22c55e' },
  { delay: 3500, text: '> ACADEMIC_CORE:',                                         color: '#38bdf8' },
  { delay: 3800, text: '  >> B.Tech CSE — VIT Vellore (2022–2026)',                color: '#ffffff' },
  { delay: 4100, text: '  >> IELTS: 7.0 (C1)',                                     color: '#ffffff' },
  { delay: 4400, text: '  >> CGPA: 7.57 ...................... [STABLE]',           color: '#fbbf24' },
  { delay: 4900, text: '> EXPERIENCE_NODES: [4 internships detected]',            color: '#38bdf8' },
  { delay: 5200, text: '  >> [Digit7]      AI/ML Intern        — CV evaluation',  color: '#a855f7' },
  { delay: 5500, text: '  >> [SST · NRL]   Full-Stack Intern   — Node.js APIs',   color: '#a855f7' },
  { delay: 5800, text: '  >> [NUS]         ML Academic Intern  — regression',     color: '#a855f7' },
  { delay: 6100, text: '  >> [GreenOrange] Frontend Intern     — 87% accuracy',   color: '#a855f7' },
  { delay: 6500, text: '> PROJECT_BLUEPRINTS: compiling...',                      color: '#38bdf8' },
  { delay: 6800, text: '  >> TicketAI      — 96.5% acc, F1 0.96   [VERIFIED]',    color: '#fbbf24' },
  { delay: 7100, text: '  >> RankGym       — Gamified iOS Fitness [VERIFIED]',    color: '#fbbf24' },
  { delay: 7400, text: '  >> MaligaiKadai  — Retail Management    [VERIFIED]',    color: '#fbbf24' },
  { delay: 7900, text: '> INTEGRITY_CHECK: running genome tests...',              color: '#38bdf8' },
  { delay: 8200, text: '  >> 27 skill_modules loaded ........... [OK]',           color: '#22c55e' },
  { delay: 8500, text: '  >> 4  internship_nodes persisted ...... [OK]',          color: '#22c55e' },
  { delay: 8800, text: '  >> 12 project_blueprints verified ..... [OK]',          color: '#22c55e' },
  { delay: 9200, text: '> ──────────────────────────────────────────────────',    color: '#38bdf8' },
  { delay: 9600, text: '> GENOME_STABLE — READY FOR DEPLOYMENT ✓',               color: '#38bdf8' },
]

interface MutationLogProps {
  onClose: () => void
}

const MutationLog: React.FC<MutationLogProps> = ({ onClose }) => {
  const [lines, setLines] = useState<LogLine[]>([])
  const [cursorVisible, setCursorVisible] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setLines([])
    setIsComplete(false)

    BOOT_SEQUENCE.forEach((entry, i) => {
      const t = setTimeout(() => {
        setLines(prev => [...prev, { text: entry.text, color: entry.color }])
        if (i === BOOT_SEQUENCE.length - 1) setIsComplete(true)
      }, entry.delay)
      timersRef.current.push(t)
    })

    const cursorInterval = setInterval(() => setCursorVisible(v => !v), 530)
    return () => {
      timersRef.current.forEach(clearTimeout)
      clearInterval(cursorInterval)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-16"
      style={{ backdropFilter: 'blur(24px)', background: 'rgba(0,2,8,0.92)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 24 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-3xl rounded-3xl overflow-hidden border border-white/10"
        style={{
          background: 'rgba(1, 3, 10, 0.99)',
          boxShadow:
            '0 0 0 1px rgba(56,189,248,0.08), 0 0 80px rgba(56,189,248,0.12), 0 0 200px rgba(56,189,248,0.06)',
          maxHeight: '80vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* CRT scanlines */}
        <div
          className="absolute inset-0 pointer-events-none z-20 opacity-30"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          }}
        />

        {/* Ambient glow bar at top */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none z-20"
          style={{ background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)' }}
        />

        {/* Title bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/8">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-[0_0_6px_#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#fbbf24] shadow-[0_0_6px_#fbbf24]" />
            <div className="w-3 h-3 rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e]" />
          </div>
          <span className="flex-1 text-center text-[0.55rem] font-black tracking-[0.5em] uppercase text-white/25">
            GENOME_OS — MUTATION_LOG v4.2
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white/30 hover:text-white"
          >
            <X size={13} />
          </button>
        </div>

        {/* Terminal output */}
        <div
          className="overflow-y-auto px-8 py-6 space-y-[5px] relative z-10"
          style={{ maxHeight: 'calc(80vh - 56px)', scrollbarWidth: 'none' }}
        >
          <AnimatePresence>
            {lines.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
                className="text-[0.72rem] leading-relaxed whitespace-pre select-text"
                style={{
                  color: line.color,
                  fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
                  textShadow: `0 0 8px ${line.color}55`,
                }}
              >
                {line.text}
              </motion.p>
            ))}
          </AnimatePresence>

          {/* Cursor */}
          <p
            className="text-[0.72rem] h-4"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: '#38bdf8',
              textShadow: '0 0 8px #38bdf8',
            }}
          >
            {isComplete ? '> _\u00a0' : cursorVisible ? '█' : '\u00a0'}
          </p>

          <div ref={bottomRef} />
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to top, rgba(1,3,10,1), transparent)',
          }}
        />
      </motion.div>
    </motion.div>
  )
}

export default MutationLog
