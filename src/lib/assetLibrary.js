/* Real-world CC0 assets from Poly Haven (downloaded by scripts/fetch-assets.mjs).
   Central loader: textures get correct color space + repeats; models via GLTF;
   HDRI via RGBELoader -> PMREM environment. */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import manifest from '../assets/manifest.json'

const A = 'public/'
const url = (p) => '/' + p // served from site root

const texLoader = new THREE.TextureLoader()
const gltfLoader = new GLTFLoader()
const rgbeLoader = new RGBELoader()

const cache = new Map()
function cached(key, make) {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key)
}

/* ── textures ── */
export function tex(map, { repeat = [1, 1], srgb = true, aniso = 8, flipY = true } = {}) {
  const key = `t:${map}:${repeat}:${srgb}`
  return cached(key, () => {
    const t = texLoader.load(url(map))
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
    t.anisotropy = aniso
    t.flipY = flipY
    if (srgb) t.colorSpace = THREE.SRGBColorSpace
    return t
  })
}

/* non-color maps (normal / rough / ao) */
export function dataTex(map, repeat = [1, 1]) {
  return tex(map, { repeat, srgb: false })
}

/* Full PBR set for a manifest label */
export function pbr(label, repeat = [1, 1]) {
  const t = manifest.textures[label]
  if (!t) return { map: null }
  return {
    map: t.map ? tex(t.map, { repeat }) : null,
    normalMap: t.nor ? dataTex(t.nor, repeat) : null,
    roughnessMap: t.rough ? dataTex(t.rough, repeat) : null,
    aoMap: t.ao ? dataTex(t.ao, repeat) : null,
  }
}

/* Foliage card material (real photographic leaves w/ alpha) */
export function foliageMat(label, repeat = [1, 1], opts = {}) {
  const t = manifest.textures[label]
  if (!t) return null
  const map = tex(t.map, { repeat })
  const alphaMap = t.alpha ? tex(t.alpha, { repeat, srgb: false }) : null
  const normalMap = t.normal ? dataTex(t.normal, repeat) : null
  return new THREE.MeshStandardMaterial({
    map,
    alphaMap,
    normalMap,
    transparent: false,
    alphaTest: opts.alphaTest ?? 0.5,
    side: THREE.DoubleSide,
    roughness: opts.roughness ?? 0.85,
    metalness: 0,
    normalScale: new THREE.Vector2(1, 1),
    color: opts.color ?? 0xffffff,
    ...opts.extra,
  })
}

/* ── GLTF models ── */
export function model(label) {
  return cached(`m:${label}`, () => {
    const m = manifest.models[label]
    if (!m) return null
    return new Promise((resolve) => {
      gltfLoader.load(
        url(m.file),
        (g) => resolve(g.scene),
        undefined,
        (e) => {
          console.warn('model load failed', label, e)
          resolve(null)
        }
      )
    })
  })
}

/* Load several models, return plain clone-ready scenes */
export async function loadModels(labels) {
  const out = {}
  await Promise.all(
    labels.map(async (l) => {
      const s = await model(l)
      out[l] = s
    })
  )
  return out
}

/* ── HDRI environment ── */
export function hdri(label = 'noon') {
  return cached(`h:${label}`, () => {
    const m = manifest.hdri[label]
    if (!m) return null
    return new Promise((resolve) => {
      rgbeLoader.load(
        url(m),
        (tex) => {
          tex.mapping = THREE.EquirectangularReflectionMapping
          resolve(tex)
        },
        undefined,
        () => resolve(null)
      )
    })
  })
}

export function applyEnvironment(renderer, scene, hdriTex) {
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromEquirectangular(hdriTex).texture
  scene.environment = env
  scene.environmentIntensity = 1.0
  return () => {
    scene.environment = null
    env.dispose()
    pmrem.dispose()
  }
}

export { manifest }
