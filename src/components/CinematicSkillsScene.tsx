import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronDown } from 'lucide-react'

// Skills keyed to video progress (0-1) — each triggers at a specific point in the video
const SKILL_MILESTONES = [
  { at: 0.10, skill: 'Python', category: 'Languages', icon: '🐍' },
  { at: 0.17, skill: 'JavaScript', category: 'Languages', icon: '⚡' },
  { at: 0.24, skill: 'C++', category: 'Languages', icon: '⚙️' },
  { at: 0.31, skill: 'React', category: 'Frontend', icon: '⚛️' },
  { at: 0.38, skill: 'Three.js', category: '3D / WebGL', icon: '🎮' },
  { at: 0.45, skill: 'Node.js', category: 'Backend', icon: '🟢' },
  { at: 0.52, skill: 'FastAPI', category: 'Backend', icon: '🚀' },
  { at: 0.59, skill: 'MongoDB', category: 'Database', icon: '🍃' },
  { at: 0.66, skill: 'Machine Learning', category: 'AI / ML', icon: '🧠' },
  { at: 0.73, skill: 'Deep Learning', category: 'AI / ML', icon: '🔬' },
  { at: 0.80, skill: 'DistilBERT', category: 'NLP', icon: '📝' },
  { at: 0.87, skill: 'Docker', category: 'DevOps', icon: '🐳' },
]

const getPhaseLabel = (progress: number): string => {
  if (progress < 0.08) return 'ASTEROID APPROACHING'
  if (progress < 0.15) return 'IMPACT DETECTED'
  if (progress < 0.25) return 'TSUNAMI FORMING'
  if (progress < 0.35) return 'WAVE RISING'
  if (progress < 0.50) return 'SURFER SPOTTED'
  if (progress < 0.70) return 'RIDING THE WAVE'
  if (progress < 0.85) return 'PEAK PERFORMANCE'
  if (progress < 0.95) return 'SKILL MASTERY'
  return 'SEQUENCE COMPLETE'
}

interface CinematicSkillsSceneProps {
  onBack: () => void
}

const CinematicSkillsScene: React.FC<CinematicSkillsSceneProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoProgress, setVideoProgress] = useState(0)
  const [revealedSkills, setRevealedSkills] = useState<typeof SKILL_MILESTONES>([])
  const [isReady, setIsReady] = useState(false)
  const [videoDuration, setVideoDuration] = useState(0)
  const [latestSkill, setLatestSkill] = useState<string | null>(null)
  const [isScrolling, setIsScrolling] = useState(false)

  // Scroll-momentum based playback
  const scrollVelocity = useRef(0)
  const lastScrollTime = useRef(0)
  const animFrameRef = useRef<number>(0)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)

  // Handle video metadata loaded
  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration)
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsReady(true)
    }
  }, [])

  // Wheel handler: accumulate scroll velocity to drive playback
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      // Add scroll energy (clamped)
      scrollVelocity.current = Math.min(
        Math.max(scrollVelocity.current + e.deltaY * 0.0003, -0.5),
        2.0
      )
      lastScrollTime.current = Date.now()
      setIsScrolling(true)

      // Clear any existing timeout and set a new one
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', handleWheel)
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    }
  }, [])

  // Animation loop: smoothly play video using playbackRate driven by scroll
  useEffect(() => {
    if (!isReady || !videoRef.current) return

    const video = videoRef.current

    const animate = () => {
      // Decay velocity when not scrolling
      const timeSinceScroll = Date.now() - lastScrollTime.current
      if (timeSinceScroll > 100) {
        scrollVelocity.current *= 0.92 // Smooth deceleration
      }

      // Clamp velocity — only forward, no reverse
      const vel = Math.max(0, scrollVelocity.current)

      if (vel > 0.01) {
        // Set playback rate proportional to scroll velocity
        // Clamp between 0.1 and 3x speed for smoothness
        const rate = Math.min(Math.max(vel * 3, 0.1), 3.0)
        try {
          video.playbackRate = rate
          if (video.paused) video.play().catch(() => {})
        } catch (_) {}
      } else {
        // No scroll momentum — pause
        scrollVelocity.current = 0
        if (!video.paused) video.pause()
      }

      // Track video progress for skill reveals
      if (video.duration > 0) {
        setVideoProgress(video.currentTime / video.duration)
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [isReady])

  // Reveal skills based on video progress
  useEffect(() => {
    const newRevealed = SKILL_MILESTONES.filter(m => videoProgress >= m.at)
    if (newRevealed.length > revealedSkills.length) {
      const newest = newRevealed[newRevealed.length - 1]
      setLatestSkill(newest.skill)
      setTimeout(() => setLatestSkill(null), 1200)
    }
    setRevealedSkills(newRevealed)
  }, [videoProgress])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[100] bg-black overflow-hidden"
      style={{ cursor: 'ns-resize' }}
    >
      {/* ── VIDEO LAYER ── */}
      <video
        ref={videoRef}
        src="/video/asteroid_impact.mp4"
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        onLoadedMetadata={handleVideoLoaded}
        onEnded={() => {
          // Video reached end naturally
          setVideoProgress(1)
        }}
      />

      {/* ── CINEMATIC COLOR GRADE ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `linear-gradient(
          180deg,
          rgba(0,0,0,0.25) 0%,
          transparent 30%,
          transparent 70%,
          rgba(0,0,0,0.5) 100%
        )`,
      }} />

      {/* ── SCROLL PROGRESS RAIL (right edge) ── */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-[120] flex flex-col items-center">
        <div className="w-[3px] h-[45vh] rounded-full bg-white/10 overflow-hidden relative">
          <motion.div
            className="absolute top-0 left-0 w-full rounded-full"
            style={{
              height: `${videoProgress * 100}%`,
              background: 'linear-gradient(180deg, #38bdf8, #a855f7, #fbbf24)',
            }}
          />
          {/* Active scrub indicator */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 w-[10px] h-[10px] rounded-full"
            style={{
              top: `calc(${videoProgress * 100}% - 5px)`,
              background: '#38bdf8',
              border: '2px solid white',
              boxShadow: isScrolling
                ? '0 0 20px rgba(56,189,248,1), 0 0 40px rgba(56,189,248,0.5)'
                : '0 0 10px rgba(56,189,248,0.6)',
              transition: 'box-shadow 0.3s',
            }}
          />
        </div>
      </div>

      {/* ── PHASE INDICATOR (top center) ── */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[120]">
        <AnimatePresence mode="wait">
          <motion.div
            key={getPhaseLabel(videoProgress)}
            initial={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
            transition={{ duration: 0.4 }}
            className="px-8 py-3 rounded-full border border-white/10 bg-black/50 backdrop-blur-xl"
          >
            <span className="text-[0.6rem] font-black tracking-[0.5em] uppercase"
              style={{
                background: 'linear-gradient(90deg, #38bdf8, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {getPhaseLabel(videoProgress)}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── SKILL FLASH (big center watermark on new skill) ── */}
      <AnimatePresence>
        {latestSkill && (
          <motion.div
            key={latestSkill}
            initial={{ opacity: 0, scale: 2, filter: 'blur(30px)' }}
            animate={{ opacity: 0.5, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 z-[105] flex items-center justify-center pointer-events-none"
          >
            <span className="text-[5rem] md:text-[7rem] font-black uppercase tracking-tighter"
              style={{
                color: 'rgba(255,255,255,0.12)',
                textShadow: '0 0 80px rgba(56,189,248,0.3)',
              }}
            >
              {latestSkill}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SKILLS STACK (left side, builds up as video plays) ── */}
      <div className="absolute left-8 top-[12%] bottom-[18%] z-[110] flex flex-col justify-center gap-2.5 pointer-events-none max-w-[300px]">
        <AnimatePresence>
          {revealedSkills.map((m, i) => {
            const isLatest = i === revealedSkills.length - 1
            return (
              <motion.div
                key={m.skill}
                initial={{ opacity: 0, x: -50, scale: 0.8, filter: 'blur(10px)' }}
                animate={{
                  opacity: isLatest ? 1 : 0.65,
                  x: 0,
                  scale: isLatest ? 1 : 0.95,
                  filter: 'blur(0px)',
                }}
                transition={{
                  duration: 0.7,
                  type: 'spring',
                  stiffness: 90,
                  damping: 16,
                }}
                className="flex items-center gap-3"
              >
                {/* Icon orb */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 transition-all duration-300"
                  style={{
                    background: isLatest
                      ? 'rgba(56,189,248,0.15)'
                      : 'rgba(0,15,30,0.5)',
                    backdropFilter: 'blur(12px)',
                    border: isLatest
                      ? '1px solid rgba(56,189,248,0.4)'
                      : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: isLatest
                      ? '0 0 25px rgba(56,189,248,0.25)'
                      : 'none',
                  }}
                >
                  {m.icon}
                </div>
                {/* Skill card */}
                <div className="flex-1 px-4 py-2.5 rounded-xl transition-all duration-300"
                  style={{
                    background: isLatest
                      ? 'rgba(0,15,30,0.7)'
                      : 'rgba(0,8,18,0.45)',
                    backdropFilter: 'blur(16px)',
                    border: isLatest
                      ? '1px solid rgba(56,189,248,0.35)'
                      : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: isLatest
                      ? '0 0 30px rgba(56,189,248,0.12), inset 0 0 15px rgba(56,189,248,0.04)'
                      : 'none',
                  }}
                >
                  <p className="text-[0.5rem] font-bold tracking-[0.25em] uppercase mb-0.5 transition-colors duration-300"
                    style={{ color: isLatest ? '#38bdf8' : 'rgba(255,255,255,0.25)' }}
                  >
                    {m.category}
                  </p>
                  <p className="text-xs font-black tracking-[0.12em] uppercase transition-all duration-300"
                    style={{
                      color: isLatest ? '#fff' : 'rgba(255,255,255,0.6)',
                      textShadow: isLatest ? '0 0 15px rgba(56,189,248,0.5)' : 'none',
                    }}
                  >
                    {m.skill}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* ── SKILLS DECODED COUNTER (bottom right) ── */}
      <div className="absolute bottom-8 right-8 z-[120] pointer-events-none">
        <div className="px-5 py-3 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10">
          <p className="text-[0.45rem] font-black tracking-[0.4em] uppercase text-white/30 mb-1.5">
            Skills Decoded
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black"
              style={{
                background: 'linear-gradient(135deg, #38bdf8, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {revealedSkills.length.toString().padStart(2, '0')}
            </span>
            <span className="text-sm text-white/20 font-mono">
              / {SKILL_MILESTONES.length.toString().padStart(2, '0')}
            </span>
          </div>
          <div className="mt-2 w-full h-[2px] rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${(revealedSkills.length / SKILL_MILESTONES.length) * 100}%` }}
              style={{ background: 'linear-gradient(90deg, #38bdf8, #a855f7)' }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* ── SCROLL HINT (shown at start) ── */}
      <AnimatePresence>
        {videoProgress < 0.03 && isReady && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[120] flex flex-col items-center gap-3"
          >
            <span className="text-[0.6rem] font-black tracking-[0.5em] uppercase text-white/50">
              Scroll to Surf the Wave
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown size={20} className="text-white/50" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COMPLETION OVERLAY ── */}
      <AnimatePresence>
        {videoProgress >= 0.96 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-[115] bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
              className="text-center"
            >
              <div className="mb-5 text-5xl">🏄</div>
              <h3 className="text-3xl font-black tracking-tighter mb-3"
                style={{
                  background: 'linear-gradient(135deg, #38bdf8, #a855f7, #fbbf24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                All Skills Unlocked
              </h3>
              <p className="text-xs text-white/40 tracking-[0.3em] uppercase mb-8">
                {SKILL_MILESTONES.length} technologies decoded
              </p>
              <button
                onClick={onBack}
                className="px-10 py-3.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl text-xs font-black tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all pointer-events-auto"
              >
                Return to Genome
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EXIT BUTTON ── */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-[130] px-6 py-3 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl text-[0.6rem] font-black tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all flex items-center gap-3 pointer-events-auto"
      >
        <ArrowLeft size={14} />
        Exit
      </button>

      {/* ── LOADING STATE ── */}
      <AnimatePresence>
        {!isReady && (
          <motion.div
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[140] bg-black flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 rounded-full border-2 border-white/20 mx-auto mb-5"
                style={{ borderTopColor: '#38bdf8' }}
              />
              <p className="text-[0.55rem] font-black tracking-[0.5em] uppercase text-white/30">
                Loading Cinematic...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default CinematicSkillsScene
