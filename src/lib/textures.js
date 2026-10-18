import * as THREE from 'three'

/* ───────────────────────── shared helpers ───────────────────────── */

export function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}

export function finish(c, repeat = [1, 1], srgb = true) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat[0], repeat[1])
  t.anisotropy = 8
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  return t
}

/* Sobel height canvas -> normal map CanvasTexture */
export function normalFromHeight(heightCanvas, strength = 2.0) {
  const w = heightCanvas.width
  const h = heightCanvas.height
  const src = heightCanvas.getContext('2d').getImageData(0, 0, w, h).data
  const [nc, nctx] = makeCanvas(w, h)
  const out = nctx.createImageData(w, h)
  const at = (x, y) => {
    x = (x + w) % w
    y = (y + h) % h
    return src[(y * w + x) * 4] / 255
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1)) -
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1))
      const dy = (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1)) -
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1))
      let nx = dx * strength
      let ny = dy * strength
      const nz = 1
      const len = Math.hypot(nx, ny, nz)
      nx /= len
      ny /= len
      const i = (y * w + x) * 4
      out.data[i] = (nx * 0.5 + 0.5) * 255
      out.data[i + 1] = (ny * 0.5 + 0.5) * 255
      out.data[i + 2] = (nz / len / 1 + 0.5) * 255
      out.data[i + 3] = 255
    }
  }
  nctx.putImageData(out, 0, 0)
  const t = new THREE.CanvasTexture(nc)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

function rng(seed) {
  let s = seed || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/* ───────────────────────── grass (mowing stripes) ───────────────────────── */

export function grassSet(repeat = [16, 16]) {
  const S = 512
  const [c, ctx] = makeCanvas(S, S)
  const [hc, hctx] = makeCanvas(S, S)
  const r = rng(7)

  // base lawn
  ctx.fillStyle = '#4f7d2e'
  ctx.fillRect(0, 0, S, S)
  hctx.fillStyle = '#808080'
  hctx.fillRect(0, 0, S, S)

  // mowing stripes: alternating light/dark bands
  const bands = 8
  const bh = S / bands
  for (let i = 0; i < bands; i++) {
    const light = i % 2 === 0
    ctx.fillStyle = light ? 'rgba(120,168,70,0.20)' : 'rgba(30,60,18,0.20)'
    ctx.fillRect(0, i * bh, S, bh)
  }

  // blade noise
  const img = ctx.getImageData(0, 0, S, S)
  const himg = hctx.getImageData(0, 0, S, S)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 34
    img.data[i] += n * 0.7
    img.data[i + 1] += n
    img.data[i + 2] += n * 0.5
    const hn = (r() - 0.5) * 90
    himg.data[i] += hn
    himg.data[i + 1] += hn
    himg.data[i + 2] += hn
  }
  ctx.putImageData(img, 0, 0)
  hctx.putImageData(himg, 0, 0)

  // clover / dry patches / flowers
  for (let i = 0; i < 60; i++) {
    const x = r() * S
    const y = r() * S
    const rad = 8 + r() * 46
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
    const kind = r()
    if (kind > 0.7) {
      g.addColorStop(0, 'rgba(200,214,150,0.18)') // dry/light
      g.addColorStop(1, 'rgba(0,0,0,0)')
    } else {
      g.addColorStop(0, 'rgba(40,86,26,0.16)') // lush
      g.addColorStop(1, 'rgba(0,0,0,0)')
    }
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, rad, 0, Math.PI * 2)
    ctx.fill()
  }
  // tiny white clover flowers
  for (let i = 0; i < 130; i++) {
    const x = r() * S
    const y = r() * S
    ctx.fillStyle = `rgba(238,244,228,${0.25 + r() * 0.4})`
    ctx.beginPath()
    ctx.arc(x, y, 0.8 + r() * 0.8, 0, Math.PI * 2)
    ctx.fill()
  }

  const map = finish(c, repeat)
  const normal = normalFromHeight(hc, 1.4)
  normal.repeat.set(repeat[0], repeat[1])
  return { map, normal }
}

/* ───────────────────────── brick (+ normal) ───────────────────────── */

export function brickSet(repeat = [4, 3]) {
  const S = 512
  const [c, ctx] = makeCanvas(S, S)
  const [hc, hctx] = makeCanvas(S, S)
  const r = rng(21)
  ctx.fillStyle = '#cfc7b4' // mortar base
  ctx.fillRect(0, 0, S, S)
  hctx.fillStyle = '#ffffff'
  hctx.fillRect(0, 0, S, S)

  const bw = 42
  const bh = 18
  const mortar = 2.5
  for (let row = 0; row < Math.ceil(S / bh); row++) {
    const off = row % 2 ? bw / 2 : 0
    for (let col = -1; col < Math.ceil(S / bw) + 1; col++) {
      const x = col * bw + off
      const y = row * bh
      const v = 0.72 + r() * 0.5
      const rr = Math.min(255, 172 * v)
      const gg = Math.min(255, 74 * v * (0.9 + r() * 0.2))
      const bb = Math.min(255, 56 * v * (0.9 + r() * 0.2))
      ctx.fillStyle = `rgb(${rr | 0},${gg | 0},${bb | 0})`
      ctx.fillRect(x + mortar, y + mortar, bw - mortar * 2, bh - mortar * 2)
      // brick height (recessed mortar = low)
      const bv = 120 + r() * 40
      hctx.fillStyle = `rgb(${bv | 0},${bv | 0},${bv | 0})`
      hctx.fillRect(x + mortar, y + mortar, bw - mortar * 2, bh - mortar * 2)
      // subtle brick face noise
      for (let k = 0; k < 12; k++) {
        ctx.fillStyle = `rgba(0,0,0,${0.02 + r() * 0.05})`
        ctx.fillRect(x + mortar + r() * (bw - mortar * 2), y + mortar + r() * (bh - mortar * 2), 2, 2)
      }
    }
  }
  const map = finish(c, repeat)
  const normal = normalFromHeight(hc, 2.4)
  normal.repeat.set(repeat[0], repeat[1])
  return { map, normal }
}

/* ───────────────────────── asphalt shingle roof ───────────────────────── */

export function shingleSet(repeat = [10, 6]) {
  const S = 256
  const [c, ctx] = makeCanvas(S, S)
  const [hc, hctx] = makeCanvas(S, S)
  const r = rng(55)
  ctx.fillStyle = '#3a3a38'
  ctx.fillRect(0, 0, S, S)
  hctx.fillStyle = '#909090'
  hctx.fillRect(0, 0, S, S)
  const rows = 10
  const rh = S / rows
  for (let row = 0; row < rows; row++) {
    const y = row * rh
    const off = (row % 2) * 12
    for (let x = -12; x < S; x += 24) {
      const v = 0.7 + r() * 0.55
      ctx.fillStyle = `rgb(${(58 * v) | 0},${(58 * v) | 0},${(56 * v) | 0})`
      ctx.fillRect(x + off + 1, y + 1, 22, rh - 2)
      // shingle edge shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(x + off + 1, y + rh - 3, 22, 2)
      const hv = 90 + r() * 50
      hctx.fillStyle = `rgb(${hv | 0},${hv | 0},${hv | 0})`
      hctx.fillRect(x + off + 1, y + 1, 22, rh - 2)
      hctx.fillStyle = 'rgba(0,0,0,0.5)'
      hctx.fillRect(x + off + 1, y + rh - 2, 22, 2)
      // granules
      for (let k = 0; k < 8; k++) {
        ctx.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.04})`
        ctx.fillRect(x + off + 1 + r() * 22, y + 1 + r() * (rh - 2), 1, 1)
      }
    }
  }
  const map = finish(c, repeat)
  const normal = normalFromHeight(hc, 1.6)
  normal.repeat.set(repeat[0], repeat[1])
  return { map, normal }
}

/* ───────────────────────── asphalt driveway ───────────────────────── */

export function asphaltTexture(repeat = [6, 6]) {
  const S = 256
  const [c, ctx] = makeCanvas(S, S)
  const r = rng(88)
  ctx.fillStyle = '#4a4a4c'
  ctx.fillRect(0, 0, S, S)
  const img = ctx.getImageData(0, 0, S, S)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 26
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},255,${r() * 0.05})`
    ctx.fillRect(r() * S, r() * S, 1.5, 1.5)
  }
  return finish(c, repeat)
}

/* ───────────────────────── bark ───────────────────────── */

export function barkTexture(repeat = [2, 5]) {
  const S = 128
  const [c, ctx] = makeCanvas(S, S)
  const [hc, hctx] = makeCanvas(S, S)
  const r = rng(33)
  ctx.fillStyle = '#6b5540'
  ctx.fillRect(0, 0, S, S)
  hctx.fillStyle = '#707070'
  hctx.fillRect(0, 0, S, S)
  for (let i = 0; i < 46; i++) {
    const x = r() * S
    const wdt = 2 + r() * 5
    ctx.fillStyle = `rgba(${(40 + r() * 30) | 0},${(30 + r() * 22) | 0},${(20 + r() * 16) | 0},${0.4 + r() * 0.4})`
    ctx.fillRect(x, 0, wdt, S)
    const hv = 40 + r() * 60
    hctx.fillStyle = `rgb(${hv | 0},${hv | 0},${hv | 0})`
    hctx.fillRect(x, 0, wdt, S)
  }
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.1 + r() * 0.15})`
    ctx.fillRect(r() * S, r() * S, 1, 2 + r() * 6)
  }
  const map = finish(c, repeat)
  const normal = normalFromHeight(hc, 2.2)
  normal.repeat.set(repeat[0], repeat[1])
  return { map, normal }
}

/* ───────────────────────── wood grain (fence) ───────────────────────── */

export function woodSet(repeat = [1, 1], tint = '#ffffff') {
  const S = 256
  const [c, ctx] = makeCanvas(S, S)
  const [hc, hctx] = makeCanvas(S, S)
  const r = rng(Math.floor(Math.random() * 10000) + 1)
  ctx.fillStyle = tint
  ctx.fillRect(0, 0, S, S)
  hctx.fillStyle = '#808080'
  hctx.fillRect(0, 0, S, S)
  // vertical grain
  for (let i = 0; i < 90; i++) {
    const x = r() * S
    const dark = r() > 0.5
    ctx.strokeStyle = dark
      ? `rgba(90,60,28,${0.05 + r() * 0.12})`
      : `rgba(255,235,190,${0.04 + r() * 0.08})`
    ctx.lineWidth = 0.6 + r() * 1.4
    ctx.beginPath()
    ctx.moveTo(x, 0)
    let xx = x
    for (let y = 0; y <= S; y += 16) {
      xx += (r() - 0.5) * 3
      ctx.lineTo(xx, y)
    }
    ctx.stroke()
  }
  // knots
  for (let i = 0; i < 3; i++) {
    const x = r() * S
    const y = r() * S
    const rad = 4 + r() * 8
    for (let k = rad; k > 0; k -= 1.5) {
      ctx.strokeStyle = `rgba(70,44,20,${0.25 + r() * 0.2})`
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.ellipse(x, y, k, k * (0.5 + r() * 0.4), r() * 3, 0, Math.PI * 2)
      ctx.stroke()
    }
    const hv = 40
    hctx.fillStyle = `rgb(${hv},${hv},${hv})`
    hctx.beginPath()
    hctx.arc(x, y, rad, 0, Math.PI * 2)
    hctx.fill()
  }
  // height grain
  const himg = hctx.getImageData(0, 0, S, S)
  for (let i = 0; i < himg.data.length; i += 4) {
    const n = (r() - 0.5) * 40
    himg.data[i] += n
    himg.data[i + 1] += n
    himg.data[i + 2] += n
  }
  hctx.putImageData(himg, 0, 0)
  const map = finish(c, repeat)
  const normal = normalFromHeight(hc, 1.3)
  normal.repeat.set(repeat[0], repeat[1])
  return { map, normal }
}

/* ───────────────────────── sky with soft clouds ───────────────────────── */

export function skyTexture(withClouds = true) {
  const W = 1024
  const H = 512
  const [c, ctx] = makeCanvas(W, H)
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0.0, '#5f9ad4') // zenith
  g.addColorStop(0.32, '#8fbfe2')
  g.addColorStop(0.52, '#bcd8ea')
  g.addColorStop(0.72, '#dfe4dc') // horizon haze
  g.addColorStop(0.85, '#e8e2cf')
  g.addColorStop(1.0, '#cfd0c0') // below horizon
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  if (withClouds) {
    const r = rng(19)
    // soft clouds via layered blobs
    for (let i = 0; i < 26; i++) {
      const cx = r() * W
      const cy = 40 + r() * (H * 0.5)
      const scale = 0.5 + r() * 1.3
      const puffs = 5 + Math.floor(r() * 6)
      for (let p = 0; p < puffs; p++) {
        const px = cx + (r() - 0.5) * 120 * scale
        const py = cy + (r() - 0.5) * 26 * scale
        const pr = (14 + r() * 30) * scale
        const grd = ctx.createRadialGradient(px, py, 0, px, py, pr)
        const a = 0.10 + r() * 0.16
        grd.addColorStop(0, `rgba(255,255,255,${a})`)
        grd.addColorStop(0.6, `rgba(255,255,255,${a * 0.5})`)
        grd.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(px, py, pr, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    // warm sun glow (upper-right, matching light dir)
    const sun = ctx.createRadialGradient(W * 0.72, H * 0.2, 0, W * 0.72, H * 0.2, 240)
    sun.addColorStop(0, 'rgba(255,244,214,0.9)')
    sun.addColorStop(0.25, 'rgba(255,238,200,0.4)')
    sun.addColorStop(1, 'rgba(255,238,200,0)')
    ctx.fillStyle = sun
    ctx.fillRect(0, 0, W, H)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.mapping = THREE.EquirectangularReflectionMapping
  return t
}

/* ───────────────────────── foliage (leaf-cluster alpha card) ───────────────── */

export function foliageTexture(tone = 0) {
  const S = 256
  const [c, ctx] = makeCanvas(S, S)
  ctx.clearRect(0, 0, S, S)
  const r = rng(101 + tone * 7)
  const base = [
    ['#3f7a26', '#579c33', '#6fb445'],
    ['#4c8a2c', '#63a53a', '#7cc050'],
    ['#336a20', '#497f2b', '#5e9a37'],
  ][tone % 3]

  // draw many overlapping leaf blobs forming a rounded canopy silhouette
  const cx = S / 2
  const cy = S / 2
  const R = S * 0.42
  for (let i = 0; i < 520; i++) {
    // sample within an ellipse, denser near center
    const ang = r() * Math.PI * 2
    const rad = Math.pow(r(), 0.6) * R
    const x = cx + Math.cos(ang) * rad
    const y = cy + Math.sin(ang) * rad * 0.92
    const col = base[Math.floor(r() * base.length)]
    ctx.fillStyle = col
    const sz = 3 + r() * 7
    ctx.beginPath()
    ctx.ellipse(x, y, sz, sz * (0.55 + r() * 0.5), r() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  // rim highlight (sunlit top)
  for (let i = 0; i < 160; i++) {
    const ang = -Math.PI * 0.5 + (r() - 0.5) * Math.PI * 1.1
    const rad = R * (0.6 + r() * 0.4)
    const x = cx + Math.cos(ang) * rad
    const y = cy + Math.sin(ang) * rad * 0.92
    ctx.fillStyle = `rgba(150,196,90,${0.1 + r() * 0.2})`
    const sz = 3 + r() * 5
    ctx.beginPath()
    ctx.ellipse(x, y, sz, sz * 0.7, r() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  // soft shadow interior
  const sh = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R)
  sh.addColorStop(0, 'rgba(20,50,12,0.28)')
  sh.addColorStop(1, 'rgba(20,50,12,0)')
  ctx.fillStyle = sh
  ctx.fillRect(0, 0, S, S)

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

/* pine/evergreen needle cluster */
export function needleTexture() {
  const S = 256
  const [c, ctx] = makeCanvas(S, S)
  ctx.clearRect(0, 0, S, S)
  const r = rng(311)
  const cx = S / 2
  const cy = S / 2
  const R = S * 0.46
  for (let i = 0; i < 900; i++) {
    const ang = r() * Math.PI * 2
    const rad = Math.pow(r(), 0.5) * R
    const x = cx + Math.cos(ang) * rad
    const y = cy + Math.sin(ang) * rad
    const g = 40 + r() * 40
    ctx.strokeStyle = `rgba(${(g * 0.4) | 0},${g | 0},${(g * 0.4) | 0},${0.5 + r() * 0.5})`
    ctx.lineWidth = 0.8 + r()
    ctx.beginPath()
    const a2 = ang + (r() - 0.5) * 0.6
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a2) * (4 + r() * 7), y + Math.sin(a2) * (4 + r() * 7))
    ctx.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/* ───────────────────────── wood-plank siding (barn/farmhouse) ───────────────── */

export function plankSet(repeat = [6, 4], base = '#a03d32') {
  const S = 256
  const [c, ctx] = makeCanvas(S, S)
  const r = rng(77)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, S, S)
  const planks = 8
  const ph = S / planks
  for (let i = 0; i < planks; i++) {
    const v = 0.8 + r() * 0.4
    ctx.fillStyle = `rgba(0,0,0,${(1 - v) * 0.35})`
    ctx.fillRect(0, i * ph, S, ph)
    // plank gap
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillRect(0, i * ph, S, 1.5)
  }
  return finish(c, repeat)
}

/* ───────────────────────── generic color texture (for simple surfaces) ───────── */

export function solidTexture(color, repeat = [1, 1], rough = true) {
  const S = 64
  const [c, ctx] = makeCanvas(S, S)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, S, S)
  if (rough) {
    const r = rng(Math.floor(Math.random() * 999) + 1)
    const img = ctx.getImageData(0, 0, S, S)
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (r() - 0.5) * 16
      img.data[i] += n
      img.data[i + 1] += n
      img.data[i + 2] += n
    }
    ctx.putImageData(img, 0, 0)
  }
  return finish(c, repeat)
}
