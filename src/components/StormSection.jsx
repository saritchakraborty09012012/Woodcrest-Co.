import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { STORM_HOTSPOTS, PHOTO } from '../lib/data'
import { useSectionProgress, scrollToId } from '../lib/scroll'

const SCENES = [
  {
    id: 'storm',
    from: 0,
    to: 0.36,
    align: 'left',
    node: (
      <>
        <h2 className="font-display text-[clamp(36px,5.6vw,64px)] font-light leading-[0.98] tracking-[-0.02em] text-cream [text-shadow:0_4px_28px_rgba(8,10,4,0.65)]">
          Storm got it?
          <br />
          <em className="italic text-amber">We fix that too.</em>
        </h2>
        <p className="mt-3 max-w-[420px] text-[13.5px] leading-relaxed text-cream/88 [text-shadow:0_2px_14px_rgba(8,10,4,0.6)]">
          Leaning posts, snapped boards after the last storm. We diagnose what
          actually failed — concrete, hardware, or ground — and fix it right.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={() => scrollToId('#pricing')}
            className="rounded-full bg-amber px-6 py-3 text-[13px] font-semibold text-ink transition-all duration-300 hover:bg-amber-soft hover:shadow-[0_12px_36px_-10px_rgba(234,138,46,0.8)]"
          >
            Book a repair
          </button>
          <button
            onClick={() => scrollToId('#process')}
            className="text-[12.5px] text-cream/85 underline-offset-4 transition hover:text-cream hover:underline"
          >
            See repair pricing →
          </button>
        </div>
      </>
    ),
  },
  {
    id: 'post',
    from: 0.37,
    to: 0.68,
    align: 'left',
    node: (
      <>
        <h2 className="font-display text-[clamp(34px,5vw,58px)] font-light leading-[0.98] tracking-[-0.02em] text-cream [text-shadow:0_4px_28px_rgba(8,10,4,0.65)]">
          Reset the post.
          <br />
          Replace the boards.
        </h2>
        <p className="mt-3 max-w-[400px] text-[13.5px] leading-relaxed text-cream/88 [text-shadow:0_2px_14px_rgba(8,10,4,0.6)]">
          We pull the failed post, re-set it deep in fresh concrete, and hang
          new boards. The rest of the run should look like it never happened.
        </p>
      </>
    ),
  },
  {
    id: 'gate',
    from: 0.69,
    to: 1.01,
    align: 'right',
    node: (
      <>
        <h2 className="font-display text-[clamp(34px,5vw,58px)] font-light leading-[0.98] tracking-[-0.02em] text-cream [text-shadow:0_4px_28px_rgba(8,10,4,0.65)]">
          Then the gate
          <br />
          <em className="italic text-amber">that drags.</em>
        </h2>
        <p className="mt-3 ml-auto max-w-[380px] text-[13.5px] leading-relaxed text-cream/88 [text-shadow:0_2px_14px_rgba(8,10,4,0.6)]">
          New hinges, squared in the frame, latch set true. It swings like the
          day it was hung — even after the ground moved.
        </p>
      </>
    ),
  },
]

export default function StormSection() {
  const ref = useRef(null)
  const p = useSectionProgress(ref)

  let idx = 0
  for (let i = 0; i < SCENES.length; i++) {
    if (p >= SCENES[i].from && p < SCENES[i].to) idx = i
  }
  const cap = SCENES[idx]
  // pan the scene left as you scroll
  const pan = -p * 34

  return (
    <section id="repair" ref={ref} className="relative h-[320vh] bg-[#6e675c]">
      <div className="sticky top-0 sticky-vh overflow-hidden">
        <div
          className="absolute inset-y-0 -left-[10%] w-[160%]"
          style={{ transform: `translateX(${pan}%)` }}
        >
          <img
            src={PHOTO.storm}
            alt="Storm-damaged fence"
            className="size-full object-cover"
            draggable={false}
          />
          {/* hotspots ride with the pan */}
          <div className="absolute inset-0">
            {STORM_HOTSPOTS.map((h) => (
              <div
                key={h.label}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
              >
                <span className="relative grid size-5 place-items-center">
                  <span className="hotspot-ring absolute size-5 rounded-full border-2 border-amber" />
                  <span className="size-2.5 rounded-full bg-amber shadow-[0_0_14px_rgba(234,138,46,0.9)]" />
                </span>
                <span className="rounded-full bg-ink/72 px-2.5 py-1 text-[10px] font-medium text-cream/92 backdrop-blur-sm">
                  {h.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grain pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgba(12,12,8,0.62)_0%,rgba(12,12,8,0.18)_48%,rgba(12,12,8,0.42)_100%)]" />

        <div
          className={`pointer-events-none absolute bottom-14 z-10 max-w-[min(560px,calc(100vw-3rem))] px-0 md:bottom-24 ${
            cap.align === 'right' ? 'right-6 text-right md:right-14' : 'left-6 md:left-14'
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={cap.id}
              initial={{ opacity: 0, y: 30, filter: 'blur(7px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }}
              transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
              className="pointer-events-auto"
            >
              {cap.node}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* progress ticks */}
        <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2 md:right-6">
          {SCENES.map((s, i) => (
            <span
              key={s.id}
              className={`h-8 w-[3px] rounded-full transition-colors duration-500 ${
                i === idx ? 'bg-amber' : 'bg-cream/25'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
