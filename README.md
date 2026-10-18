# Sample Fence Co. — 3D Fence Website

A photorealistic, scroll-driven marketing site for a residential fencing company. Built as a **heavy sample / demo** — the whole brand is generic on purpose (name, phone, email, license are all placeholders).

Watch a backyard fence go up **board by board in 3D**, browse five real fence styles with real photos, drag a before/after slider, explore storm-damage hotspots, and price a full install in twenty seconds.

**Live stack:** React 19 · Vite 6 · Tailwind CSS 4 · three.js / React Three Fiber · Framer Motion · Lenis

---

## Features

| Section | What it does |
|---|---|
| **Scroll-pinned 3D build** (`#install`) | A full backyard scene assembles itself as you scroll — day 1 → day 3. Dog, trees, HDRI sky, real PBR materials, live HUD (posts set, panels hung, footage installed, captions). |
| **Fence selector** (`#styles`) | Five styles — white vinyl, cedar board-on-board, galvanized chain link, three-board horse, woven wire. Each has a real photo, price/ft, privacy & shelter ratings, lifespan, and chips. Scroll or tap; scroll position and buttons stay in sync. |
| **Process + before/after** (`#process`) | Drag-the-line slider between messy yard and finished fence. Install & repair modes, process cards (Miss Utility, frost line, permits/HOA, written warranty). |
| **Storm repair** (`#repair`) | Damaged-fence photo with interactive hotspots (tree-downed panels, leaning posts, etc.). |
| **Pricing calculator** (`#pricing`) | Style + length (ft) + gates + tear-out → instant low/high estimate, post count, crew days. Real per-ft numbers per style. |
| **Floating estimate widget** | Persistent "Free on-site estimate" pill; hides itself when the footer is in view. |
| **Footer / contact** (`#contact`) | Big CTA, hours, phone, email, link columns, watermark. |

**Under the hood**

- **Lenis** smooth scrolling drives every scroll-linked animation.
- **1 unit = 1 foot** — fence length, post spacing, HUD footage all match the calculator.
- Fence follows a closed Catmull-Rom yard curve (`yardCurve()`), not a plain rectangle.
- Canvas loops never touch React state (refs only) — no re-render thrash.
- Lazy-mounted WebGL canvases via `useNearView` (only the visible section renders 3D).
- Tailwind v4 design tokens (`--color-ink`, `--color-cream`, `--color-amber`, Fraunces + Inter) in `src/index.css`.

---

## Quick start

```bash
# 1. install
npm install

# 2. dev server (http://localhost:5173)
npm run dev

# 3. production build
npm run build

# 4. preview the build (http://localhost:4173)
npm run preview

# 5. or serve dist/ with Express
npm start          # http://localhost:4173
```

Node 18+ recommended. No API keys or env vars required.

---

## Project structure

```
├── public/
│   ├── assets/
│   │   ├── hdri/          # CC0 HDRIs (Poly Haven) — sky / lighting
│   │   ├── models/        # CC0 GLTFs — grass, shrubs, ferns, rocks, weeds
│   │   ├── photos/        # Real fence / job-site photos (Wikimedia Commons)
│   │   ├── tex/           # PBR texture sets (diffuse / normal / rough / ao)
│   │   └── manifest.json  # Asset index (also mirrored in src/assets/)
│   └── favicon.svg
├── src/
│   ├── assets/manifest.json   # imported by JS (Vite-safe path)
│   ├── components/
│   │   ├── BuildSection.jsx   # scroll-pinned 3D install (HUD, captions)
│   │   ├── BuildScene.jsx     # R3F scene: yard, fence, house, sky, camera path
│   │   ├── RealisticTree.jsx  # procedural trees (instanced canopies + scatter)
│   │   ├── PickerSection.jsx  # "Pick your fence" scroll selector
│   │   ├── PickerScene.jsx    # small per-style 3D previews
│   │   ├── ProcessSection.jsx # before/after drag slider
│   │   ├── StormSection.jsx   # storm damage + hotspots
│   │   ├── Calculator.jsx     # live pricing calculator
│   │   ├── Chrome.jsx         # nav, logo, floating estimate widget
│   │   ├── Footer.jsx
│   │   ├── Effects.jsx        # post-processing / sky env
│   │   └── SceneArt.jsx
│   ├── lib/
│   │   ├── assetLibrary.js    # texture / PBR / GLTF / HDRI loaders + cache
│   │   ├── data.js            # fence types, photos, estimate(), process copy
│   │   ├── scroll.js          # Lenis singleton, useSectionProgress, scrollTo*
│   │   └── textures.js        # procedural canvas textures
│   ├── App.jsx
│   ├── index.css              # Tailwind v4 @theme tokens
│   └── main.jsx
├── scripts/                   # one-off asset fetch / prep tools
│   ├── fetch-assets.mjs       # downloads Poly Haven models & writes manifest
│   ├── fetch-sky.mjs          # downloads HDRIs
│   ├── fetch-photos.mjs       # downloads Wikimedia fence photos
│   ├── downscale-textures.mjs # resizes large maps
│   └── patch-house.mjs
├── smoke.mjs                  # headless Edge/Puppeteer screenshot pass
├── server.js                  # Express static server for dist/
└── vite.config.js
```

---

## Assets & licensing

- **3D models & HDRIs** — [Poly Haven](https://polyhaven.com), CC0.
- **Fence / job-site photos** — [Wikimedia Commons](https://commons.wikimedia.org), free / CC licenses. Downloaded by `scripts/fetch-photos.mjs`.
- **Fonts** — [Fraunces](https://fonts.google.com/specimen/Fraunces) + [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts.
- **Brand** — intentionally generic **Sample Fence Co.** All contact details (`+91 98765 43210`, `hello@samplefence.example`, license `#00000`) are fake placeholders. Swap `src/components/Footer.jsx`, `Chrome.jsx`, and `index.html` to rebrand.

Heavy binary assets (~41 MB under `public/assets/`) are committed so `npm run build` works out of the box.

---

## Scripts reference

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server, HMR, port **5173** |
| `npm run build` | Production build → `dist/` (three.js & motion split into separate chunks) |
| `npm run preview` | Serve the production build, port **4173** |
| `npm start` | Express static server for `dist/`, port **4173** (`PORT` env overridable) |
| `node smoke.mjs` | Headless Chromium/Edge pass — loads the site, scrolls every section, drags the slider, writes `shot-*.png` screenshots to the project root. Requires Edge or Chrome; tweak the `executablePath` in `smoke.mjs` if needed. |
| `node scripts/fetch-*.mjs` | Re-download or refresh assets (network required; rewrites `manifest.json`) |

---

## Pricing model (demo)

Per-foot installed ranges live in `src/lib/data.js`:

| Style | $/ft installed |
|---|---|
| White vinyl privacy | 38 – 53 |
| Cedar board-on-board | 54 – 59 |
| Galvanized chain link | 18 – 28 |
| Three-board horse | 16 – 28 |
| Woven wire field | 9 – 15 |

Gates add **$450 – $850** each. Tear-out / replace multiplies by **1.12**. Totals round to the nearest $50. `estimate(lengthFt, gates, replacing)` also returns post count and estimated crew days.

---

## Browser support

Modern evergreen browsers with **WebGL2** (Chrome, Edge, Firefox, Safari 16+). Respect for `prefers-reduced-motion` is built into the CSS and scroll behaviour.

---

## License

[MIT](./LICENSE) — free to use, modify, and learn from. Asset licenses above still apply to the binary files in `public/assets/`.
