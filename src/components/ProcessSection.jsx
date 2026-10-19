import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { PHOTO } from '../lib/data'
import { PROCESS_CARDS } from '../lib/data'

function BeforeAfter({ mode }) {
  const boxRef = useRef(null)
  const [pos, setPos] = useState(78)
  const [dragging, setDragging] = useState(false)
  const [hinted, setHinted] = useState(false)

  // first-view sweep
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || hinted) return
        setHinted(true)
        const start = performance.now()
        const from = 78
        const to = 52
        const dur = 1400
        const tick = (now) => {
          const t = Math.min(1, (now - start) / dur)
          const ease = 1 - Math.pow(1 - t, 3)
          setPos(from + (to - from) * ease)
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        io.disconnect()
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hinted])

  const setFromClientX = useCallback((clientX) => {
    const el = boxRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const p = ((clientX - r.left) / r.width) * 100
    setPos(Math.min(96, Math.max(4, p)))
  }, [])

  const onPointerDown = (e) => {
    e.preventDefault()
    setDragging(true)
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setFromClientX(e.clientX)
  }
  const onPointerMove = (e) => {
    if (!dragging) return
    setFromClientX(e.clientX)
  }
  const endDrag = () => setDragging(false)

  const beforeLabel = mode === 'repair' ? 'storm · mon 6:12 am' : 'day 1 · 7:40 am'
  const afterLabel = mode === 'repair' ? 'after · tue 4:35 pm' : 'after · day 3'
  const beforeSrc = mode === 'repair' ? PHOTO.repairBefore : PHOTO.installBefore
  const afterSrc = mode === 'repair' ? PHOTO.repairAfter : PHOTO.installAfter

  return (
    <div
      ref={boxRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="relative aspect-[4/3] w-full cursor-ew-resize touch-none overflow-hidden rounded-[18px] bg-[#3a352c] shadow-[0_40px_110px_-40px_rgba(20,24,10,0.55)] select-none sm:aspect-[16/9] sm:rounded-[28px]"
    >
      <img
        src={beforeSrc}
        alt={beforeLabel}
        draggable={false}
        className="absolute inset-0 size-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
      >
        <img
          src={afterSrc}
          alt={afterLabel}
          draggable={false}
          className="absolute inset-0 size-full object-cover"
        />
      </div>

      {/* labels */}
      <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/72 px-2.5 py-1.5 backdrop-blur-sm sm:left-4 sm:top-4 sm:px-3">
        <span className="micro text-[8.5px] text-cream/90 sm:text-[9px]">{beforeLabel}</span>
      </div>
      <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-amber px-2.5 py-1.5 sm:right-4 sm:top-4 sm:px-3">
        <span className="micro text-[8.5px] text-ink sm:text-[9px]">{afterLabel}</span>
      </div>

      {/* handle */}
      <div
        className="pointer-events-none absolute inset-y-0 z-10"
        style={{ left: `${pos}%` }}
      >
        <div className="h-full w-[2px] -translate-x-1/2 bg-cream/95 shadow-[0_0_18px_rgba(0,0,0,0.35)]" />
        <div
          role="slider"
          aria-label="Drag to compare before and after"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setPos((p) => Math.max(4, p - 3))
            if (e.key === 'ArrowRight') setPos((p) => Math.min(96, p + 3))
          }}
          className="pointer-events-auto absolute top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-cream text-ink shadow-[0_10px_30px_rgba(10,14,4,0.45)] outline-none ring-amber/0 transition focus-visible:ring-4 focus-visible:ring-amber/60 sm:size-12"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 7 4 12l4 5M16 7l4 5-4 5M4 12h16" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function ProcessSection() {
  const [mode, setMode] = useState('install')

  return (
    <section id="process" className="relative scroll-mt-16 bg-cream pb-20 pt-14 md:pb-24 md:pt-20">
      {/* process cards */}
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-y-8 border-y border-ink/10 py-8 md:grid-cols-4 md:divide-x md:divide-ink/8">
          {PROCESS_CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 0.61, 0.36, 1] }}
              className="px-0 md:px-6"
            >
              <h3 className="font-display text-[21px] tracking-tight text-ink">{c.title}</h3>
              <p className="mt-1 text-[12.5px] text-muted">{c.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* drag the line */}
      <div className="mx-auto mt-14 max-w-5xl px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
            className="font-display text-[clamp(34px,5vw,52px)] font-light leading-none tracking-[-0.02em]"
          >
            Drag the line.
          </motion.h2>
          <div className="flex rounded-full bg-white p-1 shadow-[0_6px_24px_-12px_rgba(20,20,10,0.4)]">
            {[
              { id: 'install', label: 'New install' },
              { id: 'repair', label: 'Repair' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`rounded-full px-4 py-2 text-[12px] font-medium transition-all duration-300 ${
                  mode === m.id
                    ? 'bg-ink text-cream'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <BeforeAfter key={mode} mode={mode} />
        <p className="mt-4 text-center text-[12px] text-muted">
          {mode === 'install'
            ? 'Drag the handle — same yard, same camera, three days apart.'
            : 'Monday’s storm damage on the left. Tuesday afternoon on the right.'}
        </p>
      </div>
    </section>
  )
}
