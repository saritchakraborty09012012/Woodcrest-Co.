import puppeteer from 'puppeteer-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--enable-webgl', '--window-size=1440,900'],
})

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

const errors = []
const warnings = []
page.on('console', (msg) => {
  const t = msg.type()
  const text = msg.text()
  if (t === 'error') errors.push(text)
  else if (t === 'warning' && !text.includes('THREE.WebGLRenderer')) warnings.push(text)
})
page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message))

await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 60000 })
// wait for WebGL canvas to mount + first frames
await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {})
await new Promise((r) => setTimeout(r, 5000))

// scroll all the way down in steps (lets every section mount & animate)
const height = await page.evaluate(() => document.body.scrollHeight)
console.log('scrollHeight:', height)

for (let y = 0; y < height; y += 700) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y)
  await new Promise((r) => setTimeout(r, 260))
}
await new Promise((r) => setTimeout(r, 1200))

// click through fence tabs
await page.evaluate(() => {
  const el = document.getElementById('styles')
  if (el) window.scrollTo(0, el.offsetTop + 200)
})
await new Promise((r) => setTimeout(r, 900))
const tabs = await page.$$('#styles button')
console.log('tabs found:', tabs.length)
for (let i = 0; i < Math.min(tabs.length, 5); i++) {
  try {
    await tabs[i].click()
    await new Promise((r) => setTimeout(r, 700))
  } catch (e) {
    console.log('click fail', i, e.message)
  }
}

// drag the before/after slider
await page.evaluate(() => {
  const el = document.getElementById('process')
  if (el) window.scrollTo(0, el.offsetTop + 120)
})
await new Promise((r) => setTimeout(r, 700))
const slider = await page.$('[role="slider"]')
if (slider) {
  const box = await slider.boundingBox()
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x - 220, box.y + box.height / 2, { steps: 12 })
    await page.mouse.up()
    console.log('slider dragged')
  }
}

// calculator interactions
await page.evaluate(() => {
  const el = document.getElementById('pricing')
  if (el) window.scrollTo(0, el.offsetTop - 60)
})
await new Promise((r) => setTimeout(r, 700))
await page.evaluate(() => {
  const range = document.querySelector('#len')
  if (range) {
    range.value = 260
    range.dispatchEvent(new Event('input', { bubbles: true }))
    range.dispatchEvent(new Event('change', { bubbles: true }))
  }
})
await new Promise((r) => setTimeout(r, 600))

// back to top for final shot
await page.evaluate(() => window.scrollTo(0, 0))
await new Promise((r) => setTimeout(r, 1500))
await page.screenshot({ path: 'shot-top.png' })
await page.evaluate(() => {
  const el = document.getElementById('install')
  window.scrollTo(0, el.offsetTop + el.offsetHeight * 0.55)
})
await new Promise((r) => setTimeout(r, 2000))
await page.screenshot({ path: 'shot-build.png' })
await page.evaluate(() => {
  const el = document.getElementById('styles')
  window.scrollTo(0, el.offsetTop + 400)
})
await new Promise((r) => setTimeout(r, 2000))
await page.screenshot({ path: 'shot-styles.png' })
await page.evaluate(() => {
  const el = document.getElementById('process')
  window.scrollTo(0, el.offsetTop + 100)
})
await new Promise((r) => setTimeout(r, 1200))
await page.screenshot({ path: 'shot-process.png' })
await page.evaluate(() => {
  const el = document.getElementById('repair')
  if (el) window.scrollTo(0, el.offsetTop + el.offsetHeight * 0.35)
})
await new Promise((r) => setTimeout(r, 1200))
await page.screenshot({ path: 'shot-repair.png' })
await page.evaluate(() => {
  const el = document.getElementById('pricing')
  window.scrollTo(0, el.offsetTop - 40)
})
await new Promise((r) => setTimeout(r, 1200))
await page.screenshot({ path: 'shot-pricing.png' })

console.log('--- ERRORS (' + errors.length + ') ---')
errors.slice(0, 20).forEach((e) => console.log(e))
console.log('--- WARNINGS (' + warnings.length + ') ---')
warnings.slice(0, 8).forEach((w) => console.log(w))

await browser.close()
console.log('DONE')
