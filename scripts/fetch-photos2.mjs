import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'assets', 'photos')
await mkdir(OUT, { recursive: true })
const W = 1600
const fp = (name, w = W) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${w}`

const items = [
  // storm / damage — real, dramatic
  ['storm2', 'Storm_Damage_-_Broken_Fence_(17464953456).jpg'],
  ['storm3', 'Fallen_Tree_on_Fence_(7516109708).jpg'],
  ['storm4', 'Fallen_tree,_broken_fence.jpg'],
  ['storm5', 'Fence_damage_at_Kirchwarft,_Hallig_Hooge_caused_by_a_storm.jpg'],
  // broken / rotted (repair before)
  ['broken3', 'Broken_fence_-_geograph.org.uk_-_581440.jpg'],
  ['broken4', 'A_broken_fence_-_geograph.org.uk_-_1080827.jpg'],
  // clean yards / houses with fence (install before/after)
  ['yard1', 'Harvey_LA_back_yard_2.jpg'],
  ['yard2', 'Uptown_New_Orleans_Back_yard_off_Magazine_December_2020.jpg'],
  ['yard3', 'A_Parkdale_Front_Yard_(3)_(4726922060).jpg'],
  // horse / pasture fence
  ['horse2', 'Old_Wood_Fence,_Castle_Crags,_CA_2000_(6309694571).jpg'],
  ['horse3', 'Fence_and_pasture_in_East_Texas.jpg'],
]

const results = []
for (const [label, name] of items) {
  try {
    const res = await fetch(fp(name), { redirect: 'follow' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    await writeFile(join(OUT, `${label}.jpg`), buf)
    results.push(`${label}.jpg  ${(buf.length / 1024).toFixed(0)}KB`)
  } catch (e) {
    results.push(`FAIL ${label}: ${e.message}`)
  }
}
console.log(results.join('\n'))
