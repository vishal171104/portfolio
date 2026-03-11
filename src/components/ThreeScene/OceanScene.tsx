import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import * as THREE from 'three';

import CinematicController from './CinematicController';
import AsteroidImpact from './AsteroidImpact';
import TsunamiWave from './TsunamiWave';
import Surfer from './Surfer';
import SkillParticles from './SkillParticles';
import { SKILLS_REGISTRY } from '../../data/skills_registry';
import { OceanScrollState } from './OceanScrollState';

type Phase = 'fly-in' | 'impact' | 'wave-rise' | 'surfing';

interface OceanSceneProps {
  onBack: () => void;
}

const TOTAL_SCROLL = 5000;

const OceanScene: React.FC<OceanSceneProps> = ({ onBack }) => {
  const [phase, setPhase] = useState<Phase>('fly-in');
  const [showCompletion, setShowCompletion] = useState(false);
  
  const scrollAccumulator = useRef(0);
  const animFrameRef = useRef<number>(0);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const sceneOpacityRef = useRef<HTMLDivElement>(null);

  // Cinematic sequence orchestration on mount
  useEffect(() => {
    console.log("OCEAN SCENE MOUNTED, STARTING SEQUENCE");
    const sequence = [
      setTimeout(() => { console.log("PHASE -> impact"); setPhase('impact'); }, 500),
      setTimeout(() => { console.log("PHASE -> wave-rise"); setPhase('wave-rise'); }, 1000),
      setTimeout(() => { console.log("PHASE -> surfing"); setPhase('surfing'); }, 2000)
    ];
    return () => {
        console.log("OCEAN SCENE UNMOUNTED");
        sequence.forEach(clearTimeout);
    };
  }, []);

  // Scroll logic (active in wave-rise and surfing phases)
  useEffect(() => {
    if (phase === 'fly-in' || phase === 'impact') return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollAccumulator.current = Math.max(0, Math.min(
        scrollAccumulator.current + e.deltaY,
        TOTAL_SCROLL
      ));
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollAccumulator.current = Math.min(scrollAccumulator.current + 200, TOTAL_SCROLL);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollAccumulator.current = Math.max(scrollAccumulator.current - 200, 0);
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const dy = touchStartY - e.touches[0].clientY;
      scrollAccumulator.current = Math.max(0, Math.min(scrollAccumulator.current + dy * 3, TOTAL_SCROLL));
      touchStartY = e.touches[0].clientY;
    };

    const animate = () => {
      OceanScrollState.target = scrollAccumulator.current / TOTAL_SCROLL;
      // Fast snap lerp for responsiveness to global mutable state (bypassing React)
      OceanScrollState.current += (OceanScrollState.target - OceanScrollState.current) * 0.15;
      
      const sp = OceanScrollState.current;

      // Update RAW DOM refs for HUD to prevent 60FPS React re-renders
      if (progressTextRef.current) {
        progressTextRef.current.innerText = Math.floor(sp * 100).toString();
      }
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${sp * 100}%`;
      }
      if (sceneOpacityRef.current) {
        sceneOpacityRef.current.style.opacity = Math.min(1, phase === 'surfing' ? sp * 5 + 0.1 : 1).toString();
      }

      // De-coupled React state only for one-off completion menu trigger
      if (sp >= 0.98) {
          setShowCompletion(true);
      } else {
          setShowCompletion(false);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      className="fixed inset-0 z-[100] bg-black overflow-hidden"
      style={{ cursor: (phase === 'surfing' || phase === 'wave-rise') ? 'ns-resize' : 'default' }}
    >
      {/* ── 3D CANVAS ── */}
      <Canvas gl={{ antialias: false, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }} dpr={[1, 2]}>
        
        {/* Environment Lights */}
        <ambientLight intensity={0.1} color="#001133" />
        <directionalLight 
           position={[100, 100, -50]} 
           intensity={2.5} 
           color="#b3d4ff" // Bright cinematic moonlight
           castShadow 
           shadow-mapSize={[2048, 2048]}
           shadow-camera-far={200}
           shadow-camera-left={-100}
           shadow-camera-right={100}
           shadow-camera-top={100}
           shadow-camera-bottom={-100}
        />
        <pointLight position={[0, 10, 30]} intensity={1.5} color="#00aaff" /> {/* Front dramatic fill */}

        {/* Scene Components (reading scroll from global state) */}
        <CinematicController phase={phase} />
        <AsteroidImpact phase={phase} />
        <TsunamiWave phase={phase} />
        <Surfer phase={phase} />
        <SkillParticles phase={phase} />

        {/* Cinematic Post Processing */}
        <EffectComposer multisampling={0}>
          <Bloom
             luminanceThreshold={0.3}
             luminanceSmoothing={0.9} 
             intensity={1.5} 
             radius={0.5}
             mipmapBlur
          />
          <Noise opacity={0.04} />
          <Vignette offset={0.4} darkness={0.8} />
        </EffectComposer>
        
        {/* Background deep dark ocean void */}
        <color attach="background" args={['#010308']} />
        <fog attach="fog" args={['#010308', 40, 180]} />
      </Canvas>

      {/* ── UI OVERLAYS (Outside Canvas) ── */}

      {/* Phase Indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[120]">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20 }}
            className="px-8 py-3 rounded-full border border-white/10 bg-black/60 backdrop-blur-xl"
          >
            <span className="text-[0.6rem] font-black tracking-[0.5em] uppercase text-[#38bdf8]">
              {phase === 'fly-in' && 'INITIATING DIVE...'}
              {phase === 'impact' && 'ASTEROID IMPACT DETECTED'}
              {phase === 'wave-rise' && 'TSUNAMI SWELLING'}
              {phase === 'surfing' && 'WAVE RIDE INITIATED'}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Scroll Hint */}
      <AnimatePresence>
        {(phase === 'surfing' || phase === 'wave-rise') && OceanScrollState.current < 0.05 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[120] flex flex-col items-center gap-3"
          >
            <span className="text-[0.6rem] font-black tracking-[0.6em] uppercase text-white/50">
              Scroll to Surf Sequence
            </span>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
              <ChevronDown size={20} className="text-[#38bdf8]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress HUD */}
      {(phase === 'surfing' || phase === 'wave-rise') && (
        <div className="absolute right-8 bottom-8 z-[120] px-6 py-4 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 flex flex-col items-end gap-2">
           <p className="text-[0.5rem] font-black tracking-[0.4em] uppercase text-white/30">Completion</p>
           <p className="text-3xl font-black text-[#38bdf8]">
              <span ref={progressTextRef}>{Math.floor(OceanScrollState.current * 100)}</span><span className="text-lg opacity-50">%</span>
           </p>
           <div className="w-[120px] h-1 bg-white/10 rounded-full overflow-hidden mt-1">
              <div 
                 ref={progressBarRef}
                 className="h-full bg-gradient-to-r from-[#38bdf8] to-[#fbbf24] rounded-full" 
                 style={{ width: `${OceanScrollState.current * 100}%` }}
              />
           </div>
        </div>
      )}

      {/* Completion Menu */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[150] bg-black/80 backdrop-blur-lg flex items-center justify-center pointer-events-auto"
          >
            <div className="text-center">
              <span className="text-6xl mb-6 block">🌊</span>
              <h2 className="text-5xl font-black tracking-tighter uppercase mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] to-[#a855f7]">
                Sequence Complete
              </h2>
              <p className="text-sm font-serif italic text-white/50 mb-10 tracking-widest">
                Genome synchronization finished
              </p>
              <button
                onClick={onBack}
                className="px-10 py-4 rounded-full border border-white/20 hover:bg-white hover:text-black transition-colors font-black tracking-[0.4em] uppercase text-[0.7rem]"
              >
                Return to DNA
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Button */}
      <button
        onClick={onBack}
        className="absolute top-8 left-8 z-[130] p-4 rounded-full border border-white/10 bg-black/40 hover:bg-white hover:text-black transition-all flex items-center justify-center"
      >
        <ArrowLeft size={20} />
      </button>

    </motion.div>
  );
};

export default OceanScene;
