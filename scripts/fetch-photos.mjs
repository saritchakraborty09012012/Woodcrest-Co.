import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'assets', 'photos')
await mkdir(OUT, { recursive: true })

// Curated real photos from Wikimedia Commons (CC / free). Special:FilePath serves
// the file at a given width via redirect.
const W = 1600
const fp = (name, w = W) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${w}`

const items = [
  // fence types (picker)
  ['vinyl', 'White_Vinyl_Fence.jpg'],
  ['wood', 'Curious_dog_peeking_through_a_wooden_fence_in_a_sunny_backyard.jpg'],
  ['chain', 'Chainlink_fence_Fence_Barrier.jpg'],
  ['horse', 'A_horse_farm_in_Lexington,_Kentucky.jpg'],
  ['wire', 'Stock_fence_and_barbed_wire,_Channonz_Hall_-_geograph.org.uk_-_2231047.jpg'],
  // process before/after — new install
  ['install_after', 'Westside_wooden_fence,_Carrollton,_New_Orleans_March_2026.jpg'],
  ['install_before', 'Carrollton_New_Orleans_Backyard_05.jpg'],
  // process before/after — repair
  ['repair_before', 'Broken_fence_by_the_B4040_-_geograph.org.uk_-_1746964.jpg'],
  ['repair_after', 'Classic_wooden_house_and_fence,_Auckland_-_0604.jpg'],
  // storm section — storm-damaged fence
  ['storm', 'Wooden_fence_in_East_Texas_after_snowstorm.jpg'],
  // calculator preview
  ['calc', 'House_with_Fence_-_Along_Cedar_Hill_X-Road_-_Victoria_-_BC_-_Canada_(8561382564).jpg'],
  // extras / backups
  ['wood2', 'Westside_wooden_fence,_Carrollton,_New_Orleans_March_2026.jpg'],
  ['broken2', 'Broken,_rusted_fence_-_geograph.org.uk_-_1336580.jpg'],
]

const results = []
for (const [label, name] of items) {
  try {
    const res = await fetch(fp(name), { redirect: 'follow' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const type = res.headers.get('content-type') || 'image/jpeg'
    const ext = type.includes('png') ? 'png' : 'jpg'
    const buf = Buffer.from(await res.arrayBuffer())
    await writeFile(join(OUT, `${label}.${ext}`), buf)
    results.push(`${label}.${ext}  ${(buf.length / 1024).toFixed(0)}KB  <- ${name}`)
  } catch (e) {
    results.push(`FAIL ${label}: ${e.message}  <- ${name}`)
  }
}
console.log(results.join('\n'))
