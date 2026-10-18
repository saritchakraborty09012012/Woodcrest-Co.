/* Pulls real CC0 photogrammetry assets from Poly Haven into public/assets.
   Run: node scripts/fetch-assets.mjs */
import { mkdir, writeFile, readFile, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'assets')
const exists = (p) => access(p).then(() => true, () => false)

const api = async (u) => (await fetch(u)).json()

async function dl(url, dest) {
  if (await exists(dest)) return 0
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  const buf = Buffer.from(await r.arrayBuffer())
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, buf)
  return buf.length
}

/* case-insensitive key pick */
const pick = (obj, names) => {
  const keys = Object.keys(obj)
  for (const n of names) {
    const k = keys.find((k) => k.toLowerCase() === n.toLowerCase())
    if (k) return obj[k]
  }
  return null
}

const manifest = { textures: {}, models: {}, hdri: {} }
let total = 0

/* ── 1. Photographic PBR textures ─────────────────────────────── */
const TEXTURES = [
  // id              label          res   maps
  ['red_brick', 'brick', '2k', ['Diffuse', 'nor_gl', 'Rough', 'AO']],
  ['leafy_grass', 'grass', '2k', ['Diffuse', 'nor_gl', 'Rough']],
  ['weathered_planks', 'fence', '2k', ['Diffuse', 'nor_gl', 'Rough', 'AO']],
  ['pine_bark', 'bark', '1k', ['Diffuse', 'nor_gl', 'Rough']],
  ['grey_roof_01', 'roof', '2k', ['Diffuse', 'nor_gl', 'Rough']],
  ['asphalt_01', 'asphalt', '2k', ['Diffuse', 'nor_gl', 'Rough']],
  ['forest_leaves_02', 'litter', '2k', ['Diffuse', 'nor_gl', 'Rough']],
  ['white_planks_clean', 'siding', '1k', ['Diffuse', 'nor_gl', 'Rough']],
  ['wood_planks', 'planks', '2k', ['Diffuse', 'nor_gl', 'Rough']],
]

for (const [id, label, res, maps] of TEXTURES) {
  const f = await api(`https://api.polyhaven.com/files/${id}`)
  const out = {}
  for (const m of maps) {
    const node = pick(f, [m])
    if (!node) continue
    const r = node[res] || node['1k'] || node['2k']
    if (!r) continue
    const fmt = pick(r, ['jpg', 'png'])
    if (!fmt) continue
    const file = `${label}_${m.toLowerCase()}.jpg`
    const dest = join(OUT, 'tex', file)
    const bytes = await dl(fmt.url, dest)
    total += bytes
    const short = m.toLowerCase().replace('_gl', '').replace('diffuse', 'map')
    out[short] = `assets/tex/${file}`
    process.stdout.write(`  tex ${file} ${(bytes / 1024).toFixed(0)}KB\n`)
  }
  manifest.textures[label] = out
}

/* ── 2. Foliage (real photographic leaf cards w/ alpha) ───────── */
const FOLIAGE = [
  ['tree_small_02', 'leaves', 'leaves_diff', 'leaves_alpha'],
  ['tree_small_02', 'leaves2', 'leaves_diff', 'leaves_alpha'],
  ['fir_tree_01', 'needles', 'twig_diff', 'twig_alpha'],
]
for (const [id, label, diffKey, alphaKey] of FOLIAGE) {
  const f = await api(`https://api.polyhaven.com/files/${id}`)
  const out = {}
  for (const [map, suffix] of [
    [diffKey, 'map'],
    [alphaKey, 'alpha'],
    [diffKey.replace('_diff', '_nor_gl'), 'normal'],
  ]) {
    const node = pick(f, [map])
    if (!node) continue
    const r = node['1k'] || node['2k']
    if (!r) continue
    const fmt = pick(r, ['jpg', 'png'])
    if (!fmt) continue
    const file = `${label}_${suffix}.jpg`
    const bytes = await dl(fmt.url, join(OUT, 'tex', file))
    total += bytes
    out[suffix] = `assets/tex/${file}`
    process.stdout.write(`  foliage ${file} ${(bytes / 1024).toFixed(0)}KB\n`)
  }
  manifest.textures[label] = out
}

/* ── 3. Real photogrammetry 3D models (small ones) ────────────── */
const MODELS = [
  ['grass_bermuda_01', 'grassClump', 1.0],
  ['grass_medium_01', 'grassTall', 1.0],
  ['shrub_03', 'shrubA', 1.0],
  ['shrub_04', 'shrubB', 1.0],
  ['fern_02', 'fern', 1.0],
  ['rock_07', 'rockA', 1.0],
  ['rock_09', 'rockB', 1.0],
  ['dandelion_01', 'weed', 1.0],
]

for (const [id, label] of MODELS) {
  let f
  try {
    f = await api(`https://api.polyhaven.com/files/${id}`)
  } catch {
    console.log(`  !! ${id} unavailable`)
    continue
  }
  const res = f.gltf && (f.gltf['1k'] ? '1k' : Object.keys(f.gltf)[0])
  if (!res) continue
  const entry = f.gltf[res].gltf
  const dir = join(OUT, 'models', label)
  const gltfFile = `${label}.gltf`
  const dest = join(dir, gltfFile)
  let bytes = await dl(entry.url, dest)
  total += bytes
  const rel = { file: `assets/models/${label}/${gltfFile}`, bin: null, tex: {} }
  const src = await readFile(dest, 'utf8')
  let patched = src

  for (const [name, info] of Object.entries(entry.include || {})) {
    const base = name.split('/').pop()
    const local = join(dir, base)
    const b = await dl(info.url, local)
    total += b
    patched = patched.split(name).join(base)
    if (base.endsWith('.bin')) rel.bin = `assets/models/${label}/${base}`
    else if (/\.(jpg|png)$/i.test(base)) rel.tex[base] = `assets/models/${label}/${base}`
    process.stdout.write(`    ${label}/${base} ${(b / 1024).toFixed(0)}KB\n`)
  }
  if (patched !== src) await writeFile(dest, patched)

  // report extensions
  const ext = JSON.parse(await readFile(dest, 'utf8')).extensionsUsed
  if (ext) console.log(`    ${label} extensionsUsed: ${ext.join(', ')}`)
  manifest.models[label] = rel
}

/* ── 4. HDRI environment (real photographic sky lighting) ─────── */
const HDRIS = [
  ['countrytrax_midday', 'noon'],
  ['chapel_day', 'day'],
]
for (const [id, label] of HDRIS) {
  const f = await api(`https://api.polyhaven.com/files/${id}`)
  const r = f.hdri['1k'] || f.hdri['2k']
  const fmt = pick(r, ['hdr', 'exr'])
  if (!fmt) continue
  const file = `${label}.hdr`
  const b = await dl(fmt.url, join(OUT, 'hdri', file))
  total += b
  manifest.hdri[label] = `assets/hdri/${file}`
  process.stdout.write(`  hdri ${file} ${(b / 1024).toFixed(0)}KB\n`)
}

await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`\nDONE. total ${(total / 1024 / 1024).toFixed(1)} MB`)
console.log(JSON.stringify(manifest, null, 2))
