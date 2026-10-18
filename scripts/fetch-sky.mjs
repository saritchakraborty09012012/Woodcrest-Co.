import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'assets')
const api = async (u) => (await fetch(u)).json()
const pick = (obj, names) => {
  for (const n of names) {
    const k = Object.keys(obj).find((k) => k.toLowerCase() === n.toLowerCase())
    if (k) return obj[k]
  }
  return null
}

// bright day sky, no ground — used as scene background
const id = 'kloofendal_38d_partly_cloudy_puresky'
const f = await api(`https://api.polyhaven.com/files/${id}`)
const r = f.hdri['1k'] || f.hdri['2k']
const fmt = pick(r, ['hdr', 'exr'])
const buf = Buffer.from(await (await fetch(fmt.url)).arrayBuffer())
await mkdir(join(OUT, 'hdri'), { recursive: true })
await writeFile(join(OUT, 'hdri', 'sky.hdr'), buf)
console.log(`sky.hdr ${(buf.length / 1024).toFixed(0)}KB`)

const mpath = join(OUT, 'manifest.json')
const m = JSON.parse(await readFile(mpath, 'utf8'))
m.hdri = m.hdri || {}
m.hdri.sky = 'assets/hdri/sky.hdr'
await writeFile(mpath, JSON.stringify(m, null, 2))
console.log('manifest updated:', m.hdri)
