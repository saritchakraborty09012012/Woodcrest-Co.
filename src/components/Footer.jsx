import { motion } from 'framer-motion'
import { Logo } from './Chrome'
import { scrollToId } from '../lib/scroll'

const COLUMNS = [
  {
    title: 'Services',
    items: ['New installs', 'Storm repairs', 'Gate rebuilds', 'Decks & rails'],
  },
  {
    title: 'Fence styles',
    items: ['White vinyl privacy', 'Cedar board-on-board', 'Galvanized chain link', 'Three-board horse', 'Woven wire field'],
  },
  {
    title: 'Company',
    items: ['About Sample', 'Written warranty', 'Careers', 'Service areas'],
  },
]

export default function Footer() {
  return (
    <footer id="contact" className="relative scroll-mt-16 overflow-hidden bg-ink pt-24 text-cream">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <h2 className="font-display text-[clamp(40px,6vw,72px)] font-light leading-[0.95] tracking-[-0.025em]">
              Let’s walk
              <br />
              your <em className="italic text-amber">line.</em>
            </h2>
            <p className="mt-5 max-w-[420px] text-[14px] leading-relaxed text-cream/65">
              Fifteen minutes on site, a written number in your hand. Serving
              central Maryland — Anne Arundel, Howard, Baltimore, Harford and
              the Eastern Shore.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="tel:+919876543210"
                className="rounded-full bg-amber px-6 py-3.5 text-[13px] font-semibold text-ink transition-all duration-300 hover:bg-amber-soft"
              >
                +91 98765 43210
              </a>
              <button
                onClick={() => scrollToId('#pricing')}
                className="rounded-full border border-cream/30 px-6 py-3.5 text-[13px] font-medium text-cream transition-all duration-300 hover:border-cream"
              >
                Price it first
              </button>
            </div>
            <p className="mt-6 text-[12.5px] text-cream/45">
              Mon–Fri 7:30a–5p · Sat by appointment · hello@samplefence.example
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col, i) => (
              <motion.div
                key={col.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.08 * i }}
              >
                <div className="micro text-cream/40">{col.title}</div>
                <ul className="mt-4 space-y-2.5">
                  {col.items.map((it) => (
                    <li key={it}>
                      <button
                        onClick={() => scrollToId('#styles')}
                        className="text-left text-[13px] text-cream/75 transition-colors hover:text-amber"
                      >
                        {it}
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-20 flex flex-wrap items-center justify-between gap-6 border-t border-cream/10 py-8">
          <Logo />
          <div className="micro text-[8.5px] text-cream/35">
            © 2026 sample fence co. · license #00000 · sample demo
          </div>
        </div>
      </div>

      {/* watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none overflow-hidden"
      >
        <div className="translate-y-[28%] text-center font-display text-[clamp(90px,20vw,280px)] leading-none tracking-[-0.04em] text-cream/[0.045]">
          Sample
        </div>
      </div>
    </footer>
  )
}
