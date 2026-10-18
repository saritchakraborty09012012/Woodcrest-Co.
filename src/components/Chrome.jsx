import { useEffect, useState } from 'react'
import { scrollToId } from '../lib/scroll'

const LINKS = [
  { label: 'Install', href: '#install' },
  { label: 'Styles', href: '#styles' },
  { label: 'Repair', href: '#repair' },
  { label: 'Pricing', href: '#pricing' },
]

export function Logo({ compact = false }) {
  return (
    <button
      onClick={() => scrollToId('#install')}
      className="flex items-center gap-2.5 text-left"
      aria-label="Sample Fence Co. — back to top"
    >
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="#f4f0e6" fillOpacity="0.1" />
        <g fill="#f4f0e6">
          <path d="M7 13.6 9 9l2 4.6V24H7z" />
          <path d="M13.4 13.6 15.4 9l2 4.6V24h-4z" />
          <path d="M19.8 13.6 21.8 9l2 4.6V24h-4z" />
        </g>
        <rect x="5.4" y="15.2" width="21.2" height="1.6" rx=".5" fill="#ea8a2e" />
        <rect x="5.4" y="20.2" width="21.2" height="1.6" rx=".5" fill="#ea8a2e" />
      </svg>
      <span className="leading-none">
        <span className="block font-display text-[19px] tracking-[-0.01em] text-cream">
          Sample
        </span>
        {!compact && (
          <span className="micro mt-[3px] block text-[7.5px] text-cream/45">
            fence co. · maryland
          </span>
        )}
      </span>
    </button>
  )
}

export default function Nav() {
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        solid ? 'bg-ink/88 backdrop-blur-xl' : 'bg-ink/55 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-5 md:h-[60px] md:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <button
              key={l.href}
              onClick={() => scrollToId(l.href)}
              className="micro text-[9px] text-cream/65 transition-colors duration-300 hover:text-cream"
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => scrollToId('#contact')}
            className="rounded-full border border-cream/45 px-4 py-2 text-[10px] font-semibold tracking-[0.16em] text-cream uppercase transition-all duration-300 hover:border-amber hover:bg-amber hover:text-ink"
          >
            Book a walkthrough
          </button>
        </nav>
        <button
          onClick={() => scrollToId('#pricing')}
          className="rounded-full border border-cream/45 px-3.5 py-1.5 text-[9px] font-semibold tracking-[0.14em] text-cream uppercase md:hidden"
        >
          Price it
        </button>
      </div>
    </header>
  )
}

export function EstimateWidget() {
  const [hide, setHide] = useState(false)
  useEffect(() => {
    const on = () => {
      const contact = document.getElementById('contact')
      if (!contact) return setHide(false)
      const r = contact.getBoundingClientRect()
      setHide(r.top < window.innerHeight * 0.85)
    }
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <div
      className={`fixed bottom-5 right-5 z-40 transition-all duration-500 ${
        hide ? 'pointer-events-none translate-y-6 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="card-glass flex items-center gap-4 rounded-2xl py-2.5 pl-4 pr-2.5">
        <div className="hidden sm:block">
          <div className="text-[12px] font-semibold text-cream">Free on-site estimate</div>
          <div className="text-[10.5px] text-cream/55">15 minutes, you get a written quote.</div>
        </div>
        <button
          onClick={() => scrollToId('#contact')}
          className="rounded-xl bg-amber px-4 py-2.5 text-[12px] font-semibold text-ink transition-all duration-300 hover:bg-amber-soft hover:shadow-[0_10px_28px_-8px_rgba(234,138,46,0.8)]"
        >
          Get on the calendar
        </button>
      </div>
    </div>
  )
}
