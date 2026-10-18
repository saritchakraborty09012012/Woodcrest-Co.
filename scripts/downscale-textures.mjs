/* Downscale heavy 2k textures to 1024px JPEG using headless Edge canvas. */
import { readdir, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TEXDIR = join(ROOT, 'public', 'assets', 'tex')
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const MAX = 1024
const QUALITY = 0.84

// tiny static server so <img> loads without file:// restrictions
const srv = createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0])
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end('<!doctype html><body></body>')
    return
  }
  try {
    const f = join(TEXDIR, url.slice(1))
    const buf = await readFile(f)
    res.writeHead(200, { 'Content-Type': 'image/jpeg' })
    res.end(buf)
  } catch {
    res.writeHead(404)
    res.end()
  }
})
await new Promise((r) => srv.listen(8931, '127.0.0.1', r))

const files = (await readdir(TEXDIR)).filter((f) => /\.jpe?g$/i.test(f))
const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'],
})
const page = await browser.newPage()
page.on('pageerror', () => {})
await page.goto('http://127.0.0.1:8931/', { waitUntil: 'domcontentloaded' })

let before = 0
let after = 0
for (const f of files) {
  const p = join(TEXDIR, f)
  const sz = (await stat(p)).size
  // skip already-small foliage alpha etc under 300KB
  if (sz < 300 * 1024) continue
  before += sz

  const url = 'http://127.0.0.1:8931/' + encodeURIComponent(f)
  const b64 = await page.evaluate(
    async (src, max, q) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((res, rej) => {
        img.onload = res
        img.onerror = rej
        img.src = src
      })
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, w, h)
      return c.toDataURL('image/jpeg', q).split(',')[1]
    },
    url,
    MAX,
    QUALITY
  )

  const buf = Buffer.from(b64, 'base64')
  const { writeFile } = await import('node:fs/promises')
  await writeFile(p, buf)
  after += buf.length
  console.log(`  ${f}: ${(sz / 1024).toFixed(0)}KB -> ${(buf.length / 1024).toFixed(0)}KB`)
}

await browser.close()
srv.close()
console.log(
  `DONE ${(before / 1024 / 1024).toFixed(1)}MB -> ${(after / 1024 / 1024).toFixed(1)}MB`
)
