import puppeteer from 'puppeteer-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const URL = 'http://localhost:4173/'

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: 'tablet', width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: 'laptop', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  { name: 'projector', width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
]

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--enable-webgl', '--hide-scrollbars'],
})

let allErrors = []

for (const vp of VIEWPORTS) {
  const page = await browser.newPage()
  await page.setViewport(vp)
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
    if (msg.type() === 'warning' && /THREE\.(Material|WebGLRenderer)/.test(msg.text()) === false && /parameter/.test(msg.text()))
      errors.push('WARN: ' + msg.text())
  })
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message))

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {})
  await new Promise((r) => setTimeout(r, 4500))

  // top
  await page.screenshot({ path: `resp-${vp.name}-top.png` })

  // check for horizontal overflow
  const overflow = await page.evaluate(() => {
    const docW = document.documentElement.scrollWidth
    const winW = window.innerWidth
    return { docW, winW, overflow: docW > winW + 2 }
  })
  console.log(`[${vp.name}] overflow:`, overflow)

  // picker mid
  await page.evaluate(() => {
    const el = document.getElementById('styles')
    if (el) window.scrollTo(0, el.offsetTop + el.offsetHeight * 0.3)
  })
  await new Promise((r) => setTimeout(r, 1600))
  await page.screenshot({ path: `resp-${vp.name}-picker.png` })

  // process
  await page.evaluate(() => {
    const el = document.getElementById('process')
    if (el) window.scrollTo(0, el.offsetTop + 80)
  })
  await new Promise((r) => setTimeout(r, 1000))
  await page.screenshot({ path: `resp-${vp.name}-process.png` })

  // repair
  await page.evaluate(() => {
    const el = document.getElementById('repair')
    if (el) window.scrollTo(0, el.offsetTop + el.offsetHeight * 0.4)
  })
  await new Promise((r) => setTimeout(r, 1200))
  await page.screenshot({ path: `resp-${vp.name}-repair.png` })

  // pricing
  await page.evaluate(() => {
    const el = document.getElementById('pricing')
    if (el) window.scrollTo(0, el.offsetTop - 20)
  })
  await new Promise((r) => setTimeout(r, 1000))
  await page.screenshot({ path: `resp-${vp.name}-pricing.png` })

  // footer
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await new Promise((r) => setTimeout(r, 900))
  await page.screenshot({ path: `resp-${vp.name}-footer.png` })

  // build section mid (3D)
  await page.evaluate(() => {
    const el = document.getElementById('install')
    if (el) window.scrollTo(0, el.offsetTop + el.offsetHeight * 0.5)
  })
  await new Promise((r) => setTimeout(r, 2000))
  await page.screenshot({ path: `resp-${vp.name}-build.png` })

  // mobile: test hamburger menu (only below md breakpoint)
  if (vp.width < 768) {
    await page.evaluate(() => window.scrollTo(0, 0))
    await new Promise((r) => setTimeout(r, 600))
    const btn = await page.$('button[aria-label="Open menu"]')
    if (btn) {
      await btn.click()
      await new Promise((r) => setTimeout(r, 600))
      await page.screenshot({ path: `resp-${vp.name}-menu.png` })
      console.log(`[${vp.name}] hamburger: opened`)
    } else {
      console.log(`[${vp.name}] hamburger: NOT FOUND`)
    }
  }

  console.log(`[${vp.name}] errors (${errors.length}):`, errors.slice(0, 6))
  allErrors = allErrors.concat(errors.map((e) => `[${vp.name}] ${e}`))
  await page.close()
}

console.log('--- TOTAL ERRORS/WARNS:', allErrors.length, '---')
allErrors.forEach((e) => console.log(e))
await browser.close()
console.log('DONE')
