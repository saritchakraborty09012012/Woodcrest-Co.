import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FENCE_TYPES, TYPE_PHOTO } from '../lib/data'
import { scrollToId, scrollToSectionFrac, useSectionProgress } from '../lib/scroll'

function Dots({ n }) {
  return (
    <div className="flex gap-[3px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`size-[7px] rounded-full ${
            i < n ? 'bg-amber' : 'bg-cream/22'
          }`}
        />
      ))}
    </div>
  )
}

function SpecCard({ type }) {
  return (
    <AnimatePresence mode="wait">
      <motion.article
        key={type.id}
        initial={{ opacity: 0, y: 26, filter: 'blur(5px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -18, filter: 'blur(4px)' }}
        transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
        className="card-glass w-[min(340px,86vw)] rounded-[26px] p-6 text-cream"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="micro pt-1 text-[8.5px] text-cream/45">{type.eyebrow}</div>
          <div className="text-right leading-none">
            <div className="tabular font-display text-[26px] tracking-tight">
              ${type.price[0]}–{type.price[1]}
            </div>
            <div className="micro mt-1 text-[8px] text-cream/45">per ft · installed</div>
          </div>
        </div>

        <h3 className="mt-3 font-display text-[34px] leading-[0.95] tracking-[-0.02em]">
          {type.name[0]}
          <br />
          {type.name[1]}
        </h3>

        <p className="mt-3 text-[12.5px] leading-relaxed text-cream/70">{type.desc}</p>

        <div className="mt-5 grid grid-cols-[1fr_1fr_auto] items-end gap-3">
          <div>
            <div className="micro text-[8px] text-cream/45">privacy</div>
            <div className="mt-1.5">
              <Dots n={type.privacy} />
            </div>
          </div>
          <div>
            <div className="micro text-[8px] text-cream/45">sun shelter</div>
            <div className="mt-1.5">
              <Dots n={type.shelter} />
            </div>
          </div>
          <div className="text-right">
            <div className="micro text-[8px] text-cream/45">lifespan</div>
            <div className="mt-1 text-[13px] font-semibold">{type.life}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {type.chips.map((c) => (
            <span
              key={c}
              className="rounded-full bg-amber/18 px-2 py-[3px] text-[8.5px] font-semibold tracking-[0.14em] text-amber-soft"
            >
              {c}
            </span>
          ))}
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-cream/78">
          <span className="font-semibold text-cream">Best for: </span>
          {type.best}
        </p>

        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={() => scrollToId('#pricing')}
            className="rounded-full bg-amber px-5 py-2.5 text-[12.5px] font-semibold text-ink transition-all duration-300 hover:bg-amber-soft hover:shadow-[0_10px_30px_-8px_rgba(234,138,46,0.7)]"
          >
            Price this fence
          </button>
          <button
            onClick={() => scrollToId('#process')}
            className="text-[12px] text-cream/70 underline-offset-4 transition hover:text-cream hover:underline"
          >
            See it built ↗
          </button>
        </div>
      </motion.article>
    </AnimatePresence>
  )
}

export default function PickerSection() {
  const ref = useRef(null)
  const p = useSectionProgress(ref)
  const N = FENCE_TYPES.length
  const idx = Math.min(N - 1, Math.floor(p * N))
  const type = FENCE_TYPES[idx]

  // buttons jump to that type's scroll segment (so scroll + buttons stay in sync)
  const go = (i) => scrollToSectionFrac(ref.current, (i + 0.5) / N)

  return (
    <section
      id="styles"
      ref={ref}
      className="relative bg-[#2a2a22]"
      style={{ height: `${N * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* real photo of the selected fence style, cross-fading between types */}
        <AnimatePresence mode="sync">
          <motion.div
            key={type.id}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.7 }, scale: { duration: 6, ease: 'linear' } }}
            className="absolute inset-0"
          >
            <img
              src={TYPE_PHOTO[type.id]}
              alt={`${type.tab} fence`}
              className="size-full object-cover"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>
        <div className="grain pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgba(12,12,8,0.72)_0%,rgba(12,12,8,0.28)_46%,rgba(12,12,8,0.15)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-ink/55 via-ink/20 to-transparent" />

        {/* copy stack */}
        <div className="pointer-events-none absolute inset-0 flex flex-col px-6 pt-20 md:px-12 md:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
            className="pointer-events-auto max-w-[640px]"
          >
            <div className="micro text-amber">fence selector — five styles — real maryland prices</div>
            <h2 className="mt-2 font-display text-[clamp(42px,7vw,76px)] font-light leading-[0.94] tracking-[-0.025em] text-cream [text-shadow:0_4px_30px_rgba(10,14,4,0.45)]">
              Pick your fence.
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {FENCE_TYPES.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => go(i)}
                  className={`rounded-full px-4 py-2 text-[12px] font-medium transition-all duration-300 ${
                    idx === i
                      ? 'bg-amber text-ink shadow-[0_8px_26px_-8px_rgba(234,138,46,0.85)]'
                      : 'border border-cream/35 bg-ink/25 text-cream/85 backdrop-blur-md hover:border-cream/70 hover:text-cream'
                  }`}
                >
                  {f.tab}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="pointer-events-none mt-auto mb-10 flex items-end justify-between gap-6">
            <div className="pointer-events-auto">
              <SpecCard type={type} />
            </div>
            <div className="hidden shrink-0 text-right lg:block">
              <div className="micro text-cream/70 [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
                scroll or tap a style — real photos of our work
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
