import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'

let lenisInstance = null

export function getLenis() {
  return lenisInstance
}

/** Synchronous 0..1 progress of a tall pinned section (no React state — safe to call per frame). */
export function progressOf(ref) {
  const el = ref?.current
  if (!el) return 0
  const rect = el.getBoundingClientRect()
  const total = rect.height - window.innerHeight
  if (total <= 0) return 0
  return Math.min(1, Math.max(0, -rect.top / total))
}

export const clamp01 = (v) => Math.min(1, Math.max(0, v))
export const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a || 1e-6))
  return t * t * (3 - 2 * t)
}
export const easeOutBack = (t) => {
  const c1 = 1.20158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    })
    lenisInstance = lenis
    let raf
    const loop = (time) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      lenisInstance = null
    }
  }, [])
}

export function scrollToId(id) {
  const el = document.querySelector(id)
  if (!el) return
  if (lenisInstance) lenisInstance.scrollTo(el, { offset: -10, duration: 1.6 })
  else el.scrollIntoView({ behavior: 'smooth' })
}

/** Scroll to a fractional position (0..1) within a tall pinned section. */
export function scrollToSectionFrac(el, frac) {
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY
  const total = el.offsetHeight - window.innerHeight
  const y = top + total * clamp01(frac)
  if (lenisInstance) lenisInstance.scrollTo(y, { duration: 1.2 })
  else window.scrollTo({ top: y, behavior: 'smooth' })
}

/** Live scroll-progress of a tall section: 0 when its top hits viewport top, 1 when bottom hits viewport bottom. */
export function useSectionProgress(ref) {
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      if (total <= 0) return
      const next = Math.min(1, Math.max(0, -rect.top / total))
      setP((prev) => (Math.abs(prev - next) > 0.0008 ? next : prev))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    tick()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref])
  return p
}

/** True while the element is anywhere near the viewport (lazy-mount canvases). */
export function useNearView(ref, rootMargin = '60% 0px 60% 0px') {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin])
  return near
}

export function useInView(ref, threshold = 0.25) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSeen(true)
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, threshold])
  return seen
}

export function useMouseNorm(strength = 1) {
  const ref = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const onMove = (e) => {
      ref.current.x = ((e.clientX / window.innerWidth) * 2 - 1) * strength
      ref.current.y = ((e.clientY / window.innerHeight) * 2 - 1) * strength
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [strength])
  return ref
}
