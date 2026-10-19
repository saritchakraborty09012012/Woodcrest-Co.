import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FENCE_TYPES, estimate, money, TYPE_PHOTO } from '../lib/data'
import { scrollToId } from '../lib/scroll'

/* live photo preview of the selected fence style */
function FencePreview({ typeId }) {
  const type = FENCE_TYPES.find((f) => f.id === typeId)
  return (
    <div className="relative aspect-[16/7] w-full overflow-hidden rounded-2xl bg-sand">
      <AnimatePresence mode="wait">
        <motion.img
          key={typeId}
          src={TYPE_PHOTO[typeId]}
          alt={`${type?.tab} fence`}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
          className="absolute inset-0 size-full object-cover"
          draggable={false}
        />
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 to-transparent" />
      <div className="absolute bottom-2 left-3 micro text-[8.5px] text-cream/85">
        {type?.tab} · real install
      </div>
    </div>
  )
}

function useTween(value, dur = 450) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef(0)
  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    cancelAnimationFrame(rafRef.current)
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur)
      const ease = 1 - Math.pow(1 - t, 3)
      const v = from + (value - from) * ease
      setDisplay(v)
      fromRef.current = v
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, dur])
  return display
}

export default function Calculator() {
  const [typeId, setTypeId] = useState('cedar')
  const [length, setLength] = useState(150)
  const [gates, setGates] = useState(1)
  const [replacing, setReplacing] = useState(false)

  const est = estimate(typeId, length, gates, replacing)
  const lo = useTween(est.lo)
  const hi = useTween(est.hi)
  const posts = useTween(est.posts, 350)
  const days = useTween(est.days, 350)

  const trackPct = ((length - 50) / (400 - 50)) * 100

  return (
    <section id="pricing" className="relative scroll-mt-16 bg-cream pb-24 pt-16 md:pb-28 md:pt-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div className="micro text-amber-deep">instant estimator</div>
          <h2 className="mt-2 max-w-[720px] font-display text-[clamp(38px,6vw,68px)] font-light leading-[0.96] tracking-[-0.025em]">
            Price your fence
            <br />
            in <em className="italic text-amber-deep">twenty seconds.</em>
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* controls */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 0.61, 0.36, 1] }}
            className="rounded-[26px] bg-white p-5 shadow-[0_30px_80px_-40px_rgba(24,24,12,0.35)] sm:p-7 md:p-9"
          >
            <div className="rounded-2xl bg-cream/70 p-3">
              <FencePreview typeId={typeId} />
            </div>

            <div className="mt-7">
              <div className="micro text-muted-2">style</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {FENCE_TYPES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTypeId(f.id)}
                    className={`rounded-full px-4 py-2 text-[12px] font-medium transition-all duration-300 ${
                      typeId === f.id
                        ? 'bg-amber text-ink shadow-[0_8px_22px_-8px_rgba(234,138,46,0.9)]'
                        : 'bg-cream text-muted hover:bg-sand hover:text-ink'
                    }`}
                  >
                    {f.tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-baseline justify-between">
                <label htmlFor="len" className="micro text-muted-2">
                  fence total length
                </label>
                <span className="tabular font-display text-[22px]">{length} ft</span>
              </div>
              <input
                id="len"
                type="range"
                min="50"
                max="400"
                step="5"
                value={length}
                onChange={(e) => setLength(+e.target.value)}
                className="fence-range mt-4 w-full"
                style={{
                  background: `linear-gradient(90deg,#ea8a2e ${trackPct}%, #e2dcc9 ${trackPct}%)`,
                }}
              />
              <p className="mt-2 text-[11.5px] text-muted">
                Walk the run with a tape, or pace it off — we’ll measure it
                exact on site anyway.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
              <div>
                <div className="micro text-muted-2">style gates</div>
                <div className="mt-2 flex items-center gap-4">
                  <button
                    onClick={() => setGates((g) => Math.max(0, g - 1))}
                    aria-label="Fewer gates"
                    className="grid size-8 place-items-center rounded-full border border-ink/15 text-ink transition hover:border-ink/40"
                  >
                    −
                  </button>
                  <span className="tabular font-display text-[20px] w-6 text-center">{gates}</span>
                  <button
                    onClick={() => setGates((g) => Math.min(6, g + 1))}
                    aria-label="More gates"
                    className="grid size-8 place-items-center rounded-full border border-ink/15 text-ink transition hover:border-ink/40"
                  >
                    +
                  </button>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2.5 text-[12.5px] text-ink/80">
                <input
                  type="checkbox"
                  checked={replacing}
                  onChange={(e) => setReplacing(e.target.checked)}
                  className="size-4 accent-amber"
                />
                We’re tearing out an old fence
              </label>
            </div>
          </motion.div>

          {/* estimate card */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
            className="card-glass flex flex-col rounded-[26px] p-5 text-cream sm:p-7 md:p-9"
          >
            <div className="micro text-[9px] text-amber">
              typical estimate · {est.type.tab} · {length} ft{replacing ? ' · tear-out' : ''}
            </div>
            <div className="tabular mt-3 font-display text-[clamp(30px,3.6vw,44px)] leading-none tracking-[-0.02em]">
              {money(lo)} – {money(hi)}
            </div>
            <p className="mt-2 text-[12px] text-cream/55">
              Typical installed range, materials + labor.
            </p>

            <div className="my-7 h-px bg-cream/12" />

            <div className="grid grid-cols-3 gap-3">
              {[
                { v: Math.round(posts), l: 'posts' },
                { v: gates, l: gates === 1 ? 'gate' : 'gates' },
                { v: `${Math.round(days)}-${Math.round(days) + 1}`, l: 'days on site' },
              ].map((s) => (
                <div key={s.l}>
                  <div className="tabular font-display text-[26px] leading-none">{s.v}</div>
                  <div className="micro mt-1.5 text-[8px] text-cream/45">{s.l}</div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[12.5px] leading-relaxed text-cream/70">
              {est.type.blurb}
            </p>

            <button
              onClick={() => scrollToId('#contact')}
              className="mt-7 w-full rounded-2xl bg-amber py-4 text-[13.5px] font-semibold text-ink transition-all duration-300 hover:bg-amber-soft hover:shadow-[0_16px_44px_-12px_rgba(234,138,46,0.85)]"
            >
              Book my free walkthrough
            </button>

            <p className="mt-4 text-center text-[10.5px] leading-relaxed text-cream/45">
              Ballpark pricing. The real quote comes after a free on-site
              measure — rock, grade and permits move the number.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
