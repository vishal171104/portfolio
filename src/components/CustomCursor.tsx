import React, { useEffect, useRef, useState } from 'react'

// Desktop-only genome cursor: a core dot that tracks the pointer 1:1 and a
// trailing ring that lerps behind it like a molecule being dragged through
// fluid. The ring swells + turns cyan over interactive elements, contracts on
// press, and both fade out when the pointer leaves the window. Touch devices
// and reduced-motion users keep the native cursor (component renders nothing).
const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const target = useRef({ x: -100, y: -100 })
  const ring = useRef({ x: -100, y: -100 })
  const hovering = useRef(false)
  const pressed = useRef(false)
  const visible = useRef(false)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return

    setEnabled(true)
    document.documentElement.classList.add('custom-cursor')

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX
      target.current.y = e.clientY
      visible.current = true
    }
    const onOver = (e: MouseEvent) => {
      hovering.current = !!(e.target as HTMLElement).closest?.(
        'a, button, [role="button"], .cursor-pointer, .cursor-help'
      )
    }
    const onDown = () => { pressed.current = true }
    const onUp = () => { pressed.current = false }
    const onLeaveWindow = (e: MouseEvent) => {
      if (!e.relatedTarget) visible.current = false
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.addEventListener('mouseout', onLeaveWindow)

    let raf = 0
    const loop = () => {
      // Ring drifts toward the pointer — the lag is the whole aesthetic
      ring.current.x += (target.current.x - ring.current.x) * 0.16
      ring.current.y += (target.current.y - ring.current.y) * 0.16

      const dot = dotRef.current
      const rg = ringRef.current
      if (dot) {
        dot.style.opacity = visible.current ? '1' : '0'
        dot.style.transform =
          `translate3d(${target.current.x}px, ${target.current.y}px, 0) translate(-50%,-50%) scale(${pressed.current ? 0.5 : 1})`
      }
      if (rg) {
        const scale = pressed.current ? 0.8 : hovering.current ? 1.9 : 1
        rg.style.opacity = visible.current ? '1' : '0'
        rg.style.transform =
          `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%,-50%) scale(${scale})`
        rg.style.borderColor = hovering.current ? 'rgba(56,189,248,0.95)' : 'rgba(255,255,255,0.3)'
        rg.style.boxShadow = hovering.current
          ? '0 0 24px rgba(56,189,248,0.35), inset 0 0 12px rgba(56,189,248,0.15)'
          : '0 0 16px rgba(56,189,248,0.1)'
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      document.documentElement.classList.remove('custom-cursor')
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.removeEventListener('mouseout', onLeaveWindow)
      cancelAnimationFrame(raf)
    }
  }, [])

  if (!enabled) return null
  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] w-2 h-2 rounded-full bg-white pointer-events-none mix-blend-difference"
        style={{ opacity: 0, transition: 'opacity .3s' }}
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[9999] w-10 h-10 rounded-full border pointer-events-none"
        style={{ opacity: 0, transition: 'opacity .3s, border-color .25s, box-shadow .25s' }}
      />
    </>
  )
}

export default CustomCursor
