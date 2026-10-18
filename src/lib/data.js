/* Real photos of each fence style + job sites (Wikimedia Commons, CC/free).
   Used across Picker, Process before/after, Storm and Calculator so the site
   shows real work instead of illustrations. */
const PHOTOS = '/assets/photos'
export const TYPE_PHOTO = {
  vinyl: `${PHOTOS}/vinyl.jpg`,
  cedar: `${PHOTOS}/wood.jpg`,
  chain: `${PHOTOS}/chain.jpg`,
  horse: `${PHOTOS}/horse.jpg`,
  wire: `${PHOTOS}/wire.jpg`,
}
export const PHOTO = {
  installBefore: `${PHOTOS}/install_before.jpg`,
  installAfter: `${PHOTOS}/vinyl.jpg`,
  repairBefore: `${PHOTOS}/storm2.jpg`,
  repairAfter: `${PHOTOS}/horse.jpg`,
  storm: `${PHOTOS}/storm2.jpg`,
  stormAlt: `${PHOTOS}/storm.jpg`,
  calc: `${PHOTOS}/calc.jpg`,
}

export const FENCE_TYPES = [
  {
    id: 'vinyl',
    tab: 'White vinyl',
    name: ['White vinyl', 'privacy'],
    price: [38, 53],
    desc: 'Tall, clean, never needs paint. Hose it off once a year. No stains, no rot, no splinters.',
    privacy: 5,
    shelter: 1,
    life: '25–30 yrs',
    best: 'Backyards next to nosy neighbors, pools, HOAs, Maryland humidity.',
    chips: ['SOLID PANELS', 'UV-STABLE', 'ALUMINUM RAIL'],
    eyebrow: '6 FT · 8 FT BAYS · POPPED CAPS',
    blurb: 'Kids and pets, pools and patios, anywhere the neighbor is 8 ft away.',
  },
  {
    id: 'cedar',
    tab: 'Wood privacy',
    name: ['Cedar board-', 'on-board'],
    price: [54, 59],
    desc: 'Warm, solid, the classic backyard. Overlapping boards leave no see-through gaps as the wood shrinks. Stain every 2–3 years.',
    privacy: 5,
    shelter: 3,
    life: '15–20 yrs',
    best: 'Full privacy with a natural look, dogs that dig and jump.',
    chips: ['1×6 CEDAR', 'BOARD-ON-BOARD', '6×6 POSTS'],
    eyebrow: '6 FT · 8 FT BAYS · BOARD-ON-BOARD',
    blurb: 'Full privacy with a natural look, dogs that dig and jump.',
  },
  {
    id: 'chain',
    tab: 'Chain link',
    name: ['Galvanized', 'chain link'],
    price: [18, 28],
    desc: 'Tough, see-through, never needs paint. Wind loads right through it. It disappears against the lawn.',
    privacy: 1,
    shelter: 1,
    life: '20+ yrs',
    best: 'Kids and pets, big runs on a budget, side yards.',
    chips: ['9-GAUGE WIRE', '5×5 POSTS', 'GALVANIZED'],
    eyebrow: '4 FT · 10 FT BAYS · TOP RAIL',
    blurb: 'Kids and pets, big runs on a budget, side yards.',
  },
  {
    id: 'horse',
    tab: '3-board wood',
    name: ['Three-board', 'horse fence'],
    price: [16, 28],
    desc: 'Maryland horse country, at home. Black-stained or natural. Add wire mesh on the inside for dogs.',
    privacy: 1,
    shelter: 2,
    life: '15–20 yrs',
    best: 'Acreage, pastures, farm property lines.',
    chips: ['1×6 WHITE OAK', 'BLACK STAIN', '8 FT BAYS'],
    eyebrow: '4 FT · 8 FT BAYS · BLACK-STAIN',
    blurb: 'Acreage, pastures, farm property lines, weekend cows.',
  },
  {
    id: 'wire',
    tab: 'Wire',
    name: ['Woven wire', 'field fence'],
    price: [9, 15],
    desc: 'Miles of fence, for less. Round wood posts, stretched tight with a top strand so it stays straight for years.',
    privacy: 1,
    shelter: 1,
    life: '15–20 yrs',
    best: 'Gardens, livestock, deer pressure, long property lines.',
    chips: ['12.5 GAUGE', 'ROUND POSTS', 'TOP STRAND'],
    eyebrow: '5 FT · 12 FT BAYS · STRETCHED TIGHT',
    blurb: 'Gardens, livestock, deer pressure, long property lines.',
  },
]

export const GATE_PRICE = [450, 850]

export function estimate(typeId, lengthFt, gates, replacing) {
  const t = FENCE_TYPES.find((f) => f.id === typeId) || FENCE_TYPES[1]
  const baseLo = lengthFt * t.price[0] + gates * GATE_PRICE[0]
  const baseHi = lengthFt * t.price[1] + gates * GATE_PRICE[1]
  const factor = replacing ? 1.12 : 1
  const lo = Math.round((baseLo * factor) / 50) * 50
  const hi = Math.round((baseHi * factor) / 50) * 50
  const posts = Math.round(lengthFt / 8) + 1
  const days = Math.max(1, Math.min(4, Math.ceil(lengthFt / 160)))
  return { lo, hi, posts, days, type: t }
}

export const money = (n) =>
  '$' + Math.round(n).toLocaleString('en-US')

export const PROCESS_CARDS = [
  { title: 'Miss Utility', sub: 'Called before every dig.' },
  { title: 'Below frost line', sub: 'Posts set deep. No heaves.' },
  { title: 'Permits + HOA', sub: 'We handle the paperwork.' },
  { title: 'Written warranty', sub: 'On every install.' },
]

export const STORM_HOTSPOTS = [
  { x: 18, y: 44, label: 'Tree-downed panels' },
  { x: 41, y: 52, label: 'Leaning post — concrete failed' },
  { x: 63, y: 40, label: 'Gate dragging — hardware pulled' },
  { x: 82, y: 56, label: 'Rotted pickets' },
]
