import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import BuildCanvas, { FENCE_FT } from './BuildScene'
import { progressOf, clamp01 } from '../lib/scroll'

const CHECKLIST = [
  'Miss Utility marks the yard',
  'Posts set in concrete',
  'Rails level & fastened',
  'Braces + cap rail',
  'Cleanup & walkthrough',
]

const CAPTIONS = [
  {
    id: 'string',
    from: 0.35,
    to: 0.55,
    align: 'right',
    eyebrow: 'Day 2 · set the rails',
    title: ['Straight as', 'the string.'],
    italic: 1,
    sub: 'Every post on one string line, set plumb in concrete. That’s why the run stays straight thirty years from now.',
  },
  {
    id: 'nogaps',
    from: 0.58,
    to: 0.84,
    align: 'left',
    eyebrow: 'Day 2 · hang the boards',
    title: ['No gaps.', 'Ever.'],
    italic: 1,
    sub: 'Board-on-board privacy. When August shrinks the cedar, you still can’t see through it — and neither can the neighbor.',
  },
  {
    id: 'finished',
    from: 0.865,
    to: 1.01,
    align: 'left',
    eyebrow: 'Day 3 · final walkthrough',
    title: ['Your yard,', 'finished.'],
    italic: 1,
    sub: 'We walk the line with you, punch-list every board, and leave with the dirt hauled off. Dog not included.',
  },
]

function dayOf(p) {
  if (p < 0.34) return 1
  if (p < 0.82) return 2
  return 3
}

function feetOf(p) {
  return Math.round(FENCE_FT * clamp01((p - 0.05) / 0.83))
}

function checksOf(p) {
  return [
    p > 0.05,
    p > 0.335,
    p > 0.55,
    p > 0.845,
    p > 0.965,
  ]
}

function Hud({ sectionRef }) {
  const [ui, setUi] = useState({ day: 1, feet: 0, checks: checksOf(0) })
  useEffect(() => {
    let raf
    let last = -1
    const tick = () => {
      const p = progressOf(sectionRef)
      const feet = feetOf(p)
      const day = dayOf(p)
      if (feet !== last) {
        last = feet
        setUi({ day, feet, checks: checksOf(p) })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [sectionRef])

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
      className="hud-glass absolute left-5 top-20 w-[248px] rounded-2xl px-4 py-3.5 text-cream md:left-8 md:top-24"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="micro whitespace-nowrap text-amber">live build · {FENCE_FT} ft</div>
          <div className="mt-1 font-display text-[27px] leading-none tracking-tight">
            Day {ui.day}
          </div>
        </div>
        <div className="text-right">
          <div className="tabular font-display text-[22px] leading-none">
            {ui.feet}
            <span className="ml-0.5 text-[13px] text-cream/70">ft</span>
          </div>
          <div className="micro mt-1 text-[8px] text-cream/50">of {FENCE_FT} ft built</div>
        </div>
      </div>
      <div className="mt-3 h-px bg-cream/12" />
      <ul className="mt-3 space-y-[7px]">
        {CHECKLIST.map((c, i) => (
          <li key={c} className="flex items-center gap-2.5">
            <span
              className={`grid size-[15px] shrink-0 place-items-center rounded-full transition-all duration-500 ${
                ui.checks[i]
                  ? 'bg-amber text-ink'
                  : 'border border-cream/30 bg-transparent'
              }`}
            >
              {ui.checks[i] && (
                <svg viewBox="0 0 10 10" className="size-2.5" fill="none">
                  <path
                    d="M1.6 5.2 3.9 7.5 8.4 2.6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span
              className={`text-[11.5px] leading-tight transition-colors duration-500 ${
                ui.checks[i] ? 'text-cream/92' : 'text-cream/42'
              }`}
            >
              {c}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function Captions({ sectionRef }) {
  const [idx, setIdx] = useState(-1)
  useEffect(() => {
    let raf
    let last = -2
    const tick = () => {
      const p = progressOf(sectionRef)
      let next = -1
      for (let i = 0; i < CAPTIONS.length; i++) {
        if (p >= CAPTIONS[i].from && p < CAPTIONS[i].to) next = i
      }
      if (next !== last) {
        last = next
        setIdx(next)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [sectionRef])

  const cap = idx >= 0 ? CAPTIONS[idx] : null

  return (
    <div
      className={`pointer-events-none absolute bottom-16 z-10 max-w-[440px] md:bottom-20 ${
        cap?.align === 'right' ? 'right-6 text-right md:right-12' : 'left-6 md:left-12'
      }`}
    >
      <AnimatePresence mode="wait">
        {cap && (
          <motion.div
            key={cap.id}
            initial={{ opacity: 0, y: 26, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -18, filter: 'blur(5px)' }}
            transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="micro text-amber-soft/90 drop-shadow">{cap.eyebrow}</div>
            <h2 className="mt-2 font-display text-[clamp(34px,5vw,54px)] font-light leading-[0.98] tracking-[-0.02em] text-cream [text-shadow:0_3px_26px_rgba(10,14,4,0.55)]">
              {cap.title[0]}
              <br />
              <em className="font-normal italic text-amber-soft">
                {cap.title[1]}
              </em>
            </h2>
            <p
              className={`mt-3 max-w-[380px] text-[13px] leading-relaxed text-cream/85 [text-shadow:0_2px_14px_rgba(10,14,4,0.6)] ${
                cap.align === 'right' ? 'ml-auto' : ''
              }`}
            >
              {cap.sub}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ScrollCue() {
  const [hide, setHide] = useState(false)
  useEffect(() => {
    const on = () => setHide(window.scrollY > 260)
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <motion.div
      animate={{ opacity: hide ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      className="pointer-events-none absolute bottom-7 left-1/2 z-10 -translate-x-1/2 text-center"
    >
      <div className="micro text-cream/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
        scroll to build
      </div>
      <div className="mx-auto mt-2 h-9 w-px overflow-hidden rounded-full bg-cream/25">
        <motion.div
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="h-full w-full bg-amber"
        />
      </div>
    </motion.div>
  )
}

export default function BuildSection() {
  const ref = useRef(null)
  return (
    <section id="install" ref={ref} className="relative h-[560vh] bg-[#bcd7e8]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* static backdrop while the WebGL scene warms up / far away */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg,#8db6da 0%,#bcd6e8 38%,#d9e0cf 62%,#7aa84e 63%,#5d9638 100%)',
          }}
        />
        <BuildCanvas sectionRef={ref} />
        <div className="grain pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_10%,transparent_55%,rgba(12,16,8,0.34)_100%)]" />
        <Hud sectionRef={ref} />
        <Captions sectionRef={ref} />
        <ScrollCue />
      </div>
    </section>
  )
}
