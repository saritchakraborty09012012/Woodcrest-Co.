/* Stylized SVG yard scenes — before/after slider + storm repair story */

const CEDAR = ['#c99a5e', '#c08f52', '#d2a86c', '#c4955a', '#bb8a4c']
const WEATHERED = ['#9a9184', '#8d8476', '#a49a8c', '#948b7e', '#867d70']

function lerp(a, b, t) {
  return a + (b - a) * t
}

/* fence drawn in one-point perspective along a line */
function FenceRun({
  x0 = 505,
  y0 = 655,
  x1 = 845,
  y1 = 302,
  h0 = 235,
  h1 = 68,
  n = 22,
  palette = CEDAR,
  broken = false,
  gateAt = -1,
  leanAt = [],
  shadow = true,
}) {
  const planks = []
  const posts = []
  for (let i = 0; i < n; i++) {
    const t = i / n
    const t2 = (i + 1) / n
    const bx = lerp(x0, x1, t)
    const by = lerp(y0, y1, t)
    const h = lerp(h0, h1, t)
    const w = lerp(36, 12, t)
    const color = palette[i % palette.length]
    const isBroken = broken && (i % 7 === 3 || i % 11 === 5)
    const isLean = leanAt.includes(i)
    const isGate = gateAt >= 0 && i >= gateAt && i < gateAt + 4

    if (isBroken) {
      // stub only
      planks.push(
        <rect
          key={`stub-${i}`}
          x={bx - w / 2}
          y={by - h * 0.22}
          width={w}
          height={h * 0.22}
          fill={color}
          opacity={0.9}
        />
      )
      continue
    }
    if (isLean) {
      planks.push(
        <g key={`lean-${i}`} transform={`rotate(${14 + (i % 3) * 4} ${bx} ${by})`}>
          <rect x={bx - w / 2} y={by - h} width={w} height={h} fill={color} />
          <rect
            x={bx - w / 2}
            y={by - h}
            width={w * 0.34}
            height={h}
            fill="rgba(0,0,0,0.14)"
          />
        </g>
      )
      continue
    }
    if (isGate) {
      const sag = 8 + (i - gateAt) * 3
      planks.push(
        <g key={`gate-${i}`} transform={`rotate(${sag * 0.35} ${bx - w} ${by})`}>
          <rect x={bx - w} y={by - h * 0.94} width={w * 1.9} height={h * 0.94} fill={color} />
          <rect
            x={bx - w}
            y={by - h * 0.94}
            width={w * 1.9}
            height={h * 0.94}
            fill="none"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={Math.max(1, w * 0.08)}
          />
          <line
            x1={bx - w}
            y1={by - h * 0.85}
            x2={bx + w * 0.9}
            y2={by - h * 0.35}
            stroke="rgba(60,45,25,0.55)"
            strokeWidth={Math.max(1.2, w * 0.14)}
          />
        </g>
      )
      continue
    }
    planks.push(
      <g key={`plank-${i}`}>
        {shadow && (
          <rect
            x={bx - w / 2 + w * 0.7}
            y={by - h}
            width={w}
            height={h}
            fill="rgba(30,40,10,0.10)"
          />
        )}
        <rect x={bx - w / 2} y={by - h} width={w} height={h} fill={color} />
        <rect
          x={bx - w / 2}
          y={by - h}
          width={w * 0.3}
          height={h}
          fill="rgba(255,255,255,0.10)"
        />
        <rect
          x={bx - w / 2 + w * 0.7}
          y={by - h}
          width={w * 0.3}
          height={h}
          fill="rgba(40,25,5,0.14)"
        />
      </g>
    )
  }
  // rails (behind planks, peek at gaps)
  for (let r = 0; r < 2; r++) {
    const ry0 = y0 - h0 * (0.18 + r * 0.55)
    const ry1 = y1 - h1 * (0.18 + r * 0.55)
    posts.push(
      <line
        key={`rail-${r}`}
        x1={x0}
        y1={ry0}
        x2={x1}
        y2={ry1}
        stroke={broken ? 'rgba(110,100,88,0.85)' : 'rgba(120,85,40,0.8)'}
        strokeWidth={lerp(7, 2.4, 0.5)}
      />
    )
  }
  // posts
  const postEls = []
  for (let i = 0; i <= n; i += 4) {
    const t = i / n
    const bx = lerp(x0, x1, t)
    const by = lerp(y0, y1, t)
    const h = lerp(h0, h1, t) * 1.06
    const w = lerp(15, 5, t)
    const lean = broken && i % 8 === 4
    postEls.push(
      <g key={`post-${i}`} transform={lean ? `rotate(9 ${bx} ${by})` : undefined}>
        <rect x={bx - w / 2} y={by - h} width={w} height={h + 6} fill={broken ? '#7d7466' : '#b8854c'} />
        <rect x={bx - w / 2} y={by - h} width={w * 0.35} height={h} fill="rgba(255,255,255,0.12)" />
        <rect x={bx - w * 0.7} y={by - h - w * 0.5} width={w * 1.4} height={w * 0.55} rx={1} fill={broken ? '#6f6759' : '#c99a5e'} />
      </g>
    )
  }
  return (
    <g>
      {/* solid backing so the privacy run never see-throughs */}
      {!broken && (
        <polygon
          points={`${x0 - 20},${y0} ${x1 - 7},${y1} ${x1 - 7},${y1 - h1} ${x0 - 20},${y0 - h0}`}
          fill={palette === WEATHERED ? '#877e71' : '#b98a4e'}
        />
      )}
      {posts}
      {planks}
      {postEls}
    </g>
  )
}

function UtilityMarks() {
  // cones + pink flags + string line along the fence run
  const marks = []
  const x0 = 505
  const y0 = 655
  const x1 = 845
  const y1 = 302
  for (let i = 0; i < 12; i++) {
    const t = i / 12
    const bx = lerp(x0, x1, t) + lerp(6, 2, t) * (i % 2 ? 1 : -1)
    const by = lerp(y0, y1, t) + lerp(16, 4, t)
    const s = lerp(1, 0.32, t)
    if (i % 3 === 2) {
      marks.push(
        <g key={i}>
          <line x1={bx} y1={by} x2={bx} y2={by - 46 * s} stroke="#c9c2b0" strokeWidth={2 * s} />
          <path
            d={`M${bx} ${by - 46 * s} l${16 * s} ${7 * s} l${-16 * s} ${9 * s} z`}
            fill="#e0509a"
          />
        </g>
      )
    } else {
      marks.push(
        <g key={i}>
          <ellipse cx={bx} cy={by} rx={13 * s} ry={4.5 * s} fill="rgba(20,40,5,0.22)" />
          <path
            d={`M${bx - 11 * s} ${by} L${bx} ${by - 34 * s} L${bx + 11 * s} ${by} Z`}
            fill={i % 3 === 0 ? '#e8772a' : '#e8b92a'}
          />
        </g>
      )
    }
  }
  return (
    <g>
      <polyline
        points={`${x0},${y0 - 60} ${x1},${y1 - 18}`}
        stroke="rgba(250,246,230,0.9)"
        strokeWidth="1.6"
        fill="none"
      />
      {marks}
    </g>
  )
}

function FallenBranch() {
  return (
    <g>
      <path
        d="M300 470 C 360 430, 430 480, 505 445"
        stroke="#5d4a32"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M355 452 C 380 415, 420 415, 448 392"
        stroke="#6b5539"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {[
        [330, 448, 34],
        [392, 428, 40],
        [448, 400, 30],
        [478, 432, 26],
        [360, 470, 22],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.62} fill="#4d7a34" />
          <ellipse cx={x + r * 0.3} cy={y - r * 0.2} rx={r * 0.6} ry={r * 0.4} fill="#5f8f3f" />
        </g>
      ))}
    </g>
  )
}

function House() {
  return (
    <g transform="translate(360 168)">
      {/* body */}
      <rect x="0" y="40" width="250" height="120" fill="#a9523d" />
      <rect x="0" y="40" width="250" height="120" fill="url(#brickLines)" opacity="0.5" />
      {/* roof */}
      <polygon points="-12,42 125,-18 262,42" fill="#4b4a46" />
      <rect x="196" y="-10" width="16" height="46" fill="#96483a" />
      {/* wing */}
      <rect x="-58" y="86" width="60" height="74" fill="#a04d39" />
      <polygon points="-64,88 -28,58 8,88" fill="#4b4a46" />
      {/* windows */}
      {[
        [26, 62],
        [86, 62],
        [158, 62],
        [214, 62],
        [26, 112],
        [86, 112],
        [158, 112],
        [214, 112],
      ].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width="22" height="30" fill="#f3efe4" />
          <rect x={x + 3} y={y + 3} width="16" height="24" fill="#93a9b6" />
          <rect x={x - 6} y={y} width="5" height="30" fill="#23231f" />
          <rect x={x + 23} y={y} width="5" height="30" fill="#23231f" />
        </g>
      ))}
      {/* porch */}
      <rect x="98" y="140" width="60" height="20" fill="#e9e3d4" />
      <rect x="94" y="132" width="68" height="7" fill="#efeade" />
      <rect x="120" y="118" width="16" height="22" fill="#2f4436" />
      {[100, 114, 148, 162].map((x) => (
        <rect key={x} x={x} y="126" width="4" height="14" fill="#f3efe4" />
      ))}
    </g>
  )
}

export default function YardSVG({ variant = 'empty', className = '' }) {
  const broken = variant === 'storm'
  const palette = broken ? WEATHERED : CEDAR
  const showFence = variant !== 'empty'
  return (
    <svg
      viewBox="0 0 1200 675"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a9c8e0" />
          <stop offset="55%" stopColor="#d7e2e2" />
          <stop offset="100%" stopColor="#efe8d2" />
        </linearGradient>
        <radialGradient id="sunGlow" cx="0.22" cy="0.16" r="0.5">
          <stop offset="0%" stopColor="rgba(255,244,200,0.85)" />
          <stop offset="100%" stopColor="rgba(255,244,200,0)" />
        </radialGradient>
        <linearGradient id="lawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fbf55" />
          <stop offset="45%" stopColor="#6ba33d" />
          <stop offset="100%" stopColor="#4f8a30" />
        </linearGradient>
        <pattern id="brickLines" width="26" height="10" patternUnits="userSpaceOnUse">
          <rect width="26" height="10" fill="none" />
          <line x1="0" y1="10" x2="26" y2="10" stroke="rgba(240,230,215,0.35)" strokeWidth="1" />
          <line x1="13" y1="0" x2="13" y2="10" stroke="rgba(240,230,215,0.25)" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width="1200" height="675" fill="url(#sky)" />
      <rect width="1200" height="675" fill="url(#sunGlow)" />

      {/* far tree line */}
      <g>
        {Array.from({ length: 26 }, (_, i) => {
          const x = i * 48 + ((i * 37) % 20)
          const r = 34 + ((i * 13) % 26)
          const c = ['#3a6a28', '#2f5a20', '#467a30'][i % 3]
          return <ellipse key={i} cx={x} cy={318 - (i % 4) * 8} rx={r} ry={r * 0.72} fill={c} />
        })}
        <rect x="0" y="318" width="1200" height="34" fill="#7ea64a" />
      </g>

      <House />

      {/* lawn */}
      <rect x="0" y="340" width="1200" height="335" fill="url(#lawn)" />
      {/* mow stripes */}
      {Array.from({ length: 7 }, (_, i) => (
        <rect
          key={i}
          x="0"
          y={352 + i * 46}
          width="1200"
          height="22"
          fill={i % 2 ? 'rgba(255,255,240,0.07)' : 'rgba(30,70,10,0.07)'}
        />
      ))}
      {/* sunlit patch */}
      <ellipse cx="420" cy="520" rx="330" ry="120" fill="rgba(214,220,96,0.20)" />
      <ellipse cx="880" cy="600" rx="280" ry="90" fill="rgba(214,220,96,0.13)" />

      {variant === 'empty' && <UtilityMarks />}
      {showFence && (
        <FenceRun
          palette={palette}
          broken={broken}
          gateAt={broken ? 12 : variant === 'fixed' ? 12 : -1}
          leanAt={broken ? [5, 6, 17] : []}
        />
      )}
      {broken && <FallenBranch />}
      {variant === 'fixed' && (
        <g opacity="0.9">
          <ellipse cx="250" cy="620" rx="70" ry="14" fill="rgba(20,40,5,0.18)" />
        </g>
      )}
      {/* foreground shade */}
      <rect x="0" y="620" width="1200" height="55" fill="rgba(20,30,8,0.14)" />
    </svg>
  )
}
