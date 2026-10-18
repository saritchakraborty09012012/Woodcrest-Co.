import { useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  progressOf,
  clamp01,
  smoothstep,
  easeOutBack,
  useNearView,
  useMouseNorm,
} from '../lib/scroll'
import {
  grassSet,
  brickSet,
  shingleSet,
  asphaltTexture,
  barkTexture,
  woodSet,
} from '../lib/textures'
import {
  pbr,
  dataTex,
  tex as assetTex,
  hdri,
  applyEnvironment,
  loadModels,
  manifest,
} from '../lib/assetLibrary'
import { RealisticTree, GroundScatter } from './RealisticTree'
import Effects from './Effects'

/* ────────────────────────────── constants ────────────────────────────── */

const BAY = 7
// Big loop that wraps around the whole house (house sits at z=-44).
const YARD_CX = 0
const YARD_CZ = -20
const HALF_X = 46
const HALF_Z = 40
const CORNER = 8
const BOARDS_PER_BAY = 7

const BOARD_COLORS = ['#cb9c58', '#c1904e', '#d2a86c', '#c69552']

/* ─────────────────── realistic sky environment (HDRI) ─────────────────── */

function SkyEnv() {
  const { gl, scene } = useThree()
  useEffect(() => {
    let dispose
    let cancelled = false
    // lighting environment from the ground-inclusive noon HDRI
    hdri('noon').then((tex) => {
      if (cancelled || !tex) return
      dispose = applyEnvironment(gl, scene, tex)
    })
    // photographic sky as the visible background
    hdri('sky').then((tex) => {
      if (cancelled || !tex) return
      tex.mapping = THREE.EquirectangularReflectionMapping
      scene.background = tex
      scene.backgroundIntensity = 1.0
      scene.backgroundBlurriness = 0.0
    })
    return () => {
      cancelled = true
      scene.background = null
      if (dispose) dispose()
    }
  }, [gl, scene])
  return null
}

/* ───────────────────────────── yard geometry ──────────────────────────── */

function yardCurve() {
  const pts = []
  const seg = (x0, z0, x1, z1, n) => {
    for (let i = 0; i < n; i++) {
      const t = i / n
      pts.push(
        new THREE.Vector3(
          YARD_CX + x0 + (x1 - x0) * t,
          0,
          YARD_CZ + z0 + (z1 - z0) * t
        )
      )
    }
  }
  const arc = (cx, cz, a0, a1, n) => {
    for (let i = 0; i < n; i++) {
      const a = a0 + (a1 - a0) * (i / n)
      pts.push(
        new THREE.Vector3(
          YARD_CX + cx + Math.cos(a) * CORNER,
          0,
          YARD_CZ + cz + Math.sin(a) * CORNER
        )
      )
    }
  }
  const x = HALF_X - CORNER
  const z = HALF_Z - CORNER
  seg(-x, HALF_Z, x, HALF_Z, 12)
  arc(x, z, Math.PI / 2, 0, 5)
  seg(HALF_X, z, HALF_X, -z, 7)
  arc(x, -z, 0, -Math.PI / 2, 5)
  seg(x, -HALF_Z, -x, -HALF_Z, 12)
  arc(-x, -z, -Math.PI / 2, -Math.PI, 5)
  seg(-HALF_X, -z, -HALF_X, z, 7)
  arc(-x, z, Math.PI, Math.PI / 2, 5)
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.0)
  curve.arcLengthDivisions = 800
  return curve
}

// Total fence footage (drives the HUD counter). ~304 ft for the big loop.
export const FENCE_FT = Math.round(
  2 * (2 * HALF_X - 2 * CORNER) + 2 * (2 * HALF_Z - 2 * CORNER) + 2 * Math.PI * CORNER
)

/* ──────────────────────────── scene components ────────────────────────── */

function Lights() {
  const ref = useRef()
  useEffect(() => {
    const l = ref.current
    if (!l) return
    // cover the whole enlarged yard (±46 x, z from -60..20) + house
    l.shadow.camera.left = -80
    l.shadow.camera.right = 80
    l.shadow.camera.top = 80
    l.shadow.camera.bottom = -80
    l.shadow.camera.near = 1
    l.shadow.camera.far = 320
    l.shadow.bias = -0.0002
    l.shadow.normalBias = 0.02
    l.shadow.radius = 3
    l.shadow.mapSize.set(2048, 2048)
    l.shadow.camera.updateProjectionMatrix()
  }, [])
  return (
    <>
      {/* warm golden-hour key sun (upper-right, ~7:40am) — casts the shadows */}
      <directionalLight
        ref={ref}
        position={[70, 60, 34]}
        intensity={3.2}
        color="#fff1d6"
        castShadow
      />
      {/* cool sky bounce fill */}
      <hemisphereLight args={['#bcd8ff', '#5c8a38', 0.45]} />
      <ambientLight intensity={0.1} color="#eef3ff" />
      {/* subtle rim from behind-left */}
      <directionalLight position={[-40, 26, -46]} intensity={0.4} color="#d4e6ff" />
    </>
  )
}

function Ground() {
  const { map, normalMap, roughnessMap } = useMemo(() => pbr('grass', [30, 30]), [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[700, 700]} />
      <meshStandardMaterial
        map={map}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        normalScale={[0.9, 0.9]}
        color="#6f9440"
        roughness={1}
        metalness={0}
      />
    </mesh>
  )
}

function Driveway() {
  const { map, normalMap, roughnessMap } = useMemo(() => pbr('asphalt', [3, 14]), [])
  return (
    <group position={[22, 0.02, -8]} rotation={[0, 0.1, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 52]} />
        <meshStandardMaterial
          map={map}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
          roughness={1}
        />
      </mesh>
      {/* walkway to porch */}
      <mesh position={[-16, 0.02, 6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5.5, 20]} />
        <meshStandardMaterial
          map={map}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
          roughness={1}
        />
      </mesh>
    </group>
  )
}

function House({ position = [0, 0, -44] }) {
  const brickP = useMemo(() => pbr('brick', [7, 4]), [])
  const roofP = useMemo(() => pbr('roof', [10, 6]), [])

  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#3a4a52',
        roughness: 0.06,
        metalness: 0.55,
        envMapIntensity: 1.6,
      }),
    []
  )
  const trimMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f4f1e8', roughness: 0.55 }),
    []
  )
  const shutterMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#17171a', roughness: 0.72 }),
    []
  )
  const brickMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: brickP.map,
        normalMap: brickP.normalMap,
        roughnessMap: brickP.roughnessMap,
        aoMap: brickP.aoMap,
        normalScale: new THREE.Vector2(1.2, 1.2),
        roughness: 1,
        metalness: 0,
      }),
    [brickP]
  )
  const brickMatDouble = useMemo(
    () => new THREE.MeshStandardMaterial({ ...brickMat, side: THREE.DoubleSide }),
    [brickMat]
  )
  const roofMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: roofP.map,
        normalMap: roofP.normalMap,
        roughnessMap: roofP.roughnessMap,
        normalScale: new THREE.Vector2(1.3, 1.3),
        roughness: 1,
        metalness: 0,
      }),
    [roofP]
  )

  const gableGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-11.6, 0)
    s.lineTo(11.6, 0)
    s.lineTo(0, 8.4)
    s.closePath()
    const g = new THREE.ShapeGeometry(s)
    g.computeVertexNormals()
    return g
  }, [])

  const wingGableGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-7.9, 0)
    s.lineTo(7.9, 0)
    s.lineTo(0, 4.4)
    s.closePath()
    const g = new THREE.ShapeGeometry(s)
    g.computeVertexNormals()
    return g
  }, [])

  const windowUnit = (x, y) => (
    <group key={`${x}-${y}`} position={[x, y, 11.05]}>
      <mesh castShadow>
        <boxGeometry args={[2.7, 3.7, 0.35]} />
        <primitive object={trimMat} attach="material" />
      </mesh>
      <mesh position={[0, 0, 0.22]}>
        <planeGeometry args={[2.1, 3.1]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      <mesh position={[0, 0, 0.26]}>
        <boxGeometry args={[0.12, 3.1, 0.06]} />
        <primitive object={trimMat} attach="material" />
      </mesh>
      <mesh position={[0, 0, 0.26]}>
        <boxGeometry args={[2.1, 0.12, 0.06]} />
        <primitive object={trimMat} attach="material" />
      </mesh>
      <mesh position={[-1.72, 0, 0.16]} castShadow>
        <boxGeometry args={[0.8, 3.9, 0.22]} />
        <primitive object={shutterMat} attach="material" />
      </mesh>
      <mesh position={[1.72, 0, 0.16]} castShadow>
        <boxGeometry args={[0.8, 3.9, 0.22]} />
        <primitive object={shutterMat} attach="material" />
      </mesh>
    </group>
  )

  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[35, 1.7, 23]} />
        <meshStandardMaterial color="#cdc6b6" roughness={0.95} />
      </mesh>
      <mesh position={[0, 11, 0]} castShadow receiveShadow>
        <boxGeometry args={[34, 20, 22]} />
        <primitive object={brickMat} attach="material" />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, 24.2, s * 6.1]} rotation={[s * 0.6, 0, 0]} castShadow>
          <boxGeometry args={[36.5, 0.55, 14.9]} />
          <primitive object={roofMat} attach="material" />
        </mesh>
      ))}
      {/* gable-end triangles */}
      <mesh
        position={[17.15, 20, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
      >
        <primitive object={gableGeo} attach="geometry" />
        <primitive object={brickMatDouble} attach="material" />
      </mesh>
      <mesh position={[-17.15, 20, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow>
        <primitive object={gableGeo} attach="geometry" />
        <primitive object={brickMatDouble} attach="material" />
      </mesh>
      <mesh position={[11.5, 15, -3]} castShadow>
        <boxGeometry args={[3.2, 30, 4.2]} />
        <primitive object={brickMat} attach="material" />
      </mesh>
      <group position={[-26, 0, 2]}>
        <mesh position={[0, 5.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[15, 11, 15]} />
          <primitive object={brickMat} attach="material" />
        </mesh>
        {/* wing gable — ridge along Z */}
        {[1, -1].map((s) => (
          <mesh
            key={s}
            position={[s * 3.2, 13.3, 0]}
            rotation={[0, 0, -s * 0.64]}
            castShadow
          >
            <boxGeometry args={[7.6, 0.5, 16.4]} />
            <primitive object={roofMat} attach="material" />
          </mesh>
        ))}
        <mesh position={[0, 11, 7.95]} castShadow>
          <primitive object={wingGableGeo} attach="geometry" />
          <primitive object={brickMatDouble} attach="material" />
        </mesh>
        <mesh position={[0, 11, -7.95]} rotation={[0, Math.PI, 0]} castShadow>
          <primitive object={wingGableGeo} attach="geometry" />
          <primitive object={brickMatDouble} attach="material" />
        </mesh>
        <mesh position={[0, 5.5, 7.6]}>
          <planeGeometry args={[2.3, 3.3]} />
          <meshStandardMaterial color="#93a9b6" roughness={0.25} />
        </mesh>
      </group>
      {[-12.6, -4.4, 4.4, 12.6].flatMap((x) => [6, 15].map((y) => windowUnit(x, y)))}
      <group position={[0, 0, 11.1]}>
        <mesh position={[0, 4.4, 0]} castShadow>
          <boxGeometry args={[3.4, 7.6, 0.5]} />
          <meshStandardMaterial color="#f1ede2" roughness={0.6} />
        </mesh>
        <mesh position={[0, 4.2, 0.3]}>
          <boxGeometry args={[2.5, 6.6, 0.2]} />
          <meshStandardMaterial color="#2f4436" roughness={0.6} />
        </mesh>
        <mesh position={[0, 7.9, 0.3]}>
          <boxGeometry args={[2.7, 1.1, 0.15]} />
          <meshStandardMaterial color="#9db4c2" roughness={0.3} />
        </mesh>
      </group>
      <group position={[0, 0, 12]}>
        <mesh position={[0, 1.45, 1.8]} castShadow receiveShadow>
          <boxGeometry args={[16.4, 0.5, 5.8]} />
          <meshStandardMaterial color="#e9e3d4" roughness={0.85} />
        </mesh>
        <mesh position={[0, 9.15, 1.9]} castShadow>
          <boxGeometry args={[17.4, 0.55, 6.6]} />
          <meshStandardMaterial color="#efeade" roughness={0.8} />
        </mesh>
        <mesh position={[0, 8.75, 1.9]} castShadow>
          <boxGeometry args={[18, 0.32, 7]} />
          <meshStandardMaterial color="#e6e0d0" roughness={0.8} />
        </mesh>
        {[-7.1, -2.5, 2.5, 7.1].map((x) => (
          <mesh key={x} position={[x, 5.3, 4.2]} castShadow>
            <boxGeometry args={[0.42, 7.4, 0.42]} />
            <meshStandardMaterial color="#f3efe4" roughness={0.7} />
          </mesh>
        ))}
        <mesh position={[0, 2.85, 4.35]}>
          <boxGeometry args={[15.8, 0.2, 0.2]} />
          <meshStandardMaterial color="#f3efe4" />
        </mesh>
        <mesh position={[0, 1.95, 4.35]}>
          <boxGeometry args={[15.8, 0.16, 0.16]} />
          <meshStandardMaterial color="#f3efe4" />
        </mesh>
        {Array.from({ length: 15 }, (_, i) => -6.9 + i * 0.98).map((x) => (
          <mesh key={`b${x}`} position={[x, 2.4, 4.35]}>
            <boxGeometry args={[0.13, 1.0, 0.13]} />
            <meshStandardMaterial color="#f3efe4" />
          </mesh>
        ))}
        {[-7.9, 7.9].map((x) => (
          <mesh key={`sr${x}`} position={[x, 2.85, 1.9]}>
            <boxGeometry args={[0.2, 0.2, 4.6]} />
            <meshStandardMaterial color="#f3efe4" />
          </mesh>
        ))}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 1.1 - i * 0.4, 5.2 + i * 0.8]} receiveShadow>
            <boxGeometry args={[6.6 - i * 0.3, 0.4, 1.0]} />
            <meshStandardMaterial color="#ddd6c6" roughness={0.9} />
          </mesh>
        ))}
      </group>
      {[0, 1].map((i) => (
        <group
          key={`sw${i}`}
          position={[17.05, 6 + i * 9, -4 + i * 8]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <mesh>
            <boxGeometry args={[2.5, 3.5, 0.3]} />
            <meshStandardMaterial color="#f3efe4" />
          </mesh>
          <mesh position={[0, 0, 0.2]}>
            <planeGeometry args={[1.9, 2.9]} />
            <meshStandardMaterial color="#93a9b6" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* Load real photogrammetry assets once, cache in module scope */
let _modelsPromise = null
function useRealModels() {
  const [models, setModels] = useState(null)
  useEffect(() => {
    if (!_modelsPromise) {
      _modelsPromise = loadModels([
        'grassClump',
        'grassTall',
        'shrubA',
        'shrubB',
        'fern',
        'rockA',
        'rockB',
        'weed',
      ])
    }
    let alive = true
    _modelsPromise.then((m) => {
      if (alive) setModels(m)
    })
    return () => {
      alive = false
    }
  }, [])
  return models
}

/* Realistic tree using photographic foliage cards + real bark */
function Tree({ position, scale = 1, kind = 'deciduous', seed = 0 }) {
  return (
    <RealisticTree position={position} scale={scale} kind={kind} seed={seed} />
  )
}

/* Distant treeline: many real trees, cheaper (fewer cards) */
function Treeline() {
  const items = useMemo(() => {
    const arr = []
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2 + 0.1
      const r = 165 + ((i * 37) % 45)
      arr.push({
        p: [Math.cos(a) * r, 0, Math.sin(a) * r - 30],
        s: 0.8 + ((i * 13) % 10) / 14,
        seed: i,
        kind: i % 4 === 0 ? 'evergreen' : 'deciduous',
      })
    }
    return arr
  }, [])
  return (
    <group>
      {items.map((it, i) => (
        <RealisticTree
          key={i}
          position={it.p}
          scale={it.s}
          seed={it.seed}
          kind={it.kind}
        />
      ))}
    </group>
  )
}

/* Scattered real photogrammetry grass clumps, shrubs, weeds, rocks */
function YardScatter({ models }) {
  const items = useMemo(() => {
    if (!models) return []
    const arr = []
    const rng = (() => {
      let s = 20240917
      return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff
        return s / 0x7fffffff
      }
    })()
    const kinds = [
      ['grassClump', 0.9],
      ['grassClump', 1.1],
      ['grassTall', 0.85],
      ['shrubA', 1.0],
      ['shrubB', 0.9],
      ['fern', 1.0],
      ['weed', 1.0],
      ['rockA', 1.0],
      ['rockB', 0.8],
    ]
    // keep scatter as landscaping — around the house foundation and inside the
    // big fenced loop, but out of the house footprint and off the fence line.
    for (let i = 0; i < 240; i++) {
      const a = rng() * Math.PI * 2
      const rr = 20 + rng() * 150
      const x = Math.cos(a) * rr
      const z = Math.sin(a) * rr - 18
      // avoid house footprint (house sits ~z=-44)
      if (x > -36 && x < 22 && z > -60 && z < -26) continue
      // avoid the fence line (stay well inside the loop, off the perimeter)
      const inYard =
        x > -HALF_X + 4 && x < HALF_X - 4 && z > YARD_CZ - HALF_Z + 4 && z < YARD_CZ + HALF_Z - 4
      const nearFence =
        Math.abs(Math.abs(x) - HALF_X) < 5 || Math.abs(z - (YARD_CZ - HALF_Z)) < 5 || Math.abs(z - (YARD_CZ + HALF_Z)) < 5
      if (inYard && nearFence) continue
      const [kind, base] = kinds[Math.floor(rng() * kinds.length)]
      const scene = models[kind]
      if (!scene) continue
      arr.push({
        scene,
        p: [x, 0, z],
        r: rng() * Math.PI * 2,
        s: base * (0.75 + rng() * 0.55),
      })
    }
    // dense ground cover hugging the house foundation (foundation plantings)
    for (let i = 0; i < 26; i++) {
      const x = -34 + i * 2.2
      const z = -28.5 - Math.sin(i * 0.7) * 1.6
      const kind = i % 3 === 0 ? 'shrubA' : i % 3 === 1 ? 'shrubB' : 'fern'
      const scene = models[kind]
      if (!scene) continue
      arr.push({ scene, p: [x, 0, z], r: rng() * 6.28, s: 0.9 + rng() * 0.4 })
    }
    return arr
  }, [models])

  if (!models) return null
  return <GroundScatter items={items} />
}

/* ————— the fence that builds itself, board by board ————— */

function FenceBuild({ sectionRef }) {
  const curve = useMemo(yardCurve, [])
  const length = useMemo(() => curve.getLength(), [curve])
  const N = Math.max(24, Math.round(length / BAY))
  const totalBoards = N * BOARDS_PER_BAY
  const totalRails = N * 3

  const layout = useMemo(() => {
    const posts = []
    for (let i = 0; i < N; i++) {
      const u = i / N
      posts.push({ p: curve.getPointAt(u), t: curve.getTangentAt(u), u })
    }
    const bays = []
    for (let i = 0; i < N; i++) {
      const a = posts[i]
      const b = posts[(i + 1) % N]
      const dir = b.p.clone().sub(a.p)
      const len = dir.length()
      dir.normalize()
      bays.push({
        a,
        b,
        dir,
        len,
        angle: Math.atan2(dir.z, dir.x),
        nrm: new THREE.Vector3(-dir.z, 0, dir.x),
      })
    }
    return { posts, bays }
  }, [curve, N])

  /* geometries with pivots where the animation needs them */
  const geos = useMemo(() => {
    const post = new THREE.BoxGeometry(0.34, 5.5, 0.34)
    post.translate(0, 2.75, 0)
    const board = new THREE.BoxGeometry(1.18, 5.0, 0.16)
    board.translate(0, 2.5, 0)
    const rail = new THREE.BoxGeometry(1, 0.44, 0.16)
    const collar = new THREE.CylinderGeometry(1.05, 1.3, 0.5, 10)
    const cap = new THREE.ConeGeometry(0.3, 0.34, 4)
    cap.translate(0, 0.17, 0)
    return { post, board, rail, collar, cap }
  }, [])

  const mat = useMemo(() => {
    const f = pbr('fence', [1, 1])
    const fPost = pbr('fence', [1, 1])
    return {
      post: new THREE.MeshStandardMaterial({
        map: fPost.map,
        normalMap: fPost.normalMap,
        roughnessMap: fPost.roughnessMap,
        color: new THREE.Color('#e8c489'),
        roughness: 1,
        metalness: 0,
      }),
      rail: new THREE.MeshStandardMaterial({
        map: f.map,
        normalMap: f.normalMap,
        roughnessMap: f.roughnessMap,
        color: new THREE.Color('#e0b877'),
        roughness: 1,
        metalness: 0,
      }),
      board: new THREE.MeshStandardMaterial({
        map: f.map,
        normalMap: f.normalMap,
        roughnessMap: f.roughnessMap,
        color: new THREE.Color('#ffffff'),
        roughness: 1,
        metalness: 0,
      }),
      cap: new THREE.MeshStandardMaterial({
        map: f.map,
        color: new THREE.Color('#d8b57c'),
        roughness: 0.85,
      }),
      mulch: new THREE.MeshStandardMaterial({
        map: dataTex(manifest.textures.litter?.map, [1, 1]),
        color: new THREE.Color('#7a5a34'),
        roughness: 1,
      }),
    }
  }, [])

  const postsRef = useRef()
  const collarsRef = useRef()
  const capsRef = useRef()
  const railsRef = useRef()
  const boardsRef = useRef()
  const flagsRef = useRef()
  const dogRef = useRef()
  const state = useRef({ dp: 0 })
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tmpColor = useMemo(() => new THREE.Color(), [])

  const flags = useMemo(() => {
    const arr = []
    const colors = ['#e8772a', '#e8b92a', '#e0509a', '#e8772a', '#d9483b']
    for (let i = 0; i < 14; i++) {
      const u = (i / 14) * 0.98
      const p = curve.getPointAt(u)
      const t = curve.getTangentAt(u)
      const n = new THREE.Vector3(-t.z, 0, t.x)
      const side = i % 2 ? 1 : -1
      arr.push({
        pos: [p.x + n.x * 1.5 * side, 0, p.z + n.z * 1.5 * side],
        rot: (i * 1.7) % Math.PI,
        color: colors[i % colors.length],
        cone: i % 3 !== 2,
      })
    }
    return arr
  }, [curve])

  const stringObj = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 140; i++) {
      const p = curve.getPointAt(i / 140)
      pts.push(new THREE.Vector3(p.x, 1.35, p.z))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const m = new THREE.LineBasicMaterial({
      color: '#f6f2e6',
      transparent: true,
      opacity: 0.9,
    })
    const line = new THREE.Line(geo, m)
    line.frustumCulled = false
    return line
  }, [curve])

  /* per-instance board tints — once */
  useEffect(() => {
    const mesh = boardsRef.current
    if (!mesh) return
    for (let gk = 0; gk < totalBoards; gk++) {
      tmpColor.set(BOARD_COLORS[(gk + Math.floor(gk / 7)) % BOARD_COLORS.length])
      mesh.setColorAt(gk, tmpColor)
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [totalBoards, tmpColor])

  useFrame((s, dt) => {
    const p = progressOf(sectionRef)
    const st = state.current
    const k = Math.min(dt, 0.05)
    st.dp = THREE.MathUtils.damp(st.dp, p, 4.2, k)
    const dp = st.dp

    const posts = postsRef.current
    const collars = collarsRef.current
    const caps = capsRef.current
    const rails = railsRef.current
    const boards = boardsRef.current

    if (posts && collars && caps) {
      for (let i = 0; i < N; i++) {
        const fi = i / N
        const pp = layout.posts[i].p
        const local = smoothstep(0.065 + fi * 0.245, 0.065 + fi * 0.245 + 0.05, dp)
        const sc = Math.max(0.0001, easeOutBack(local))
        const xz = Math.max(0.0001, smoothstep(0.06 + fi * 0.245, 0.06 + fi * 0.245 + 0.02, dp))
        dummy.position.set(pp.x, 0, pp.z)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(xz, sc, xz)
        dummy.updateMatrix()
        posts.setMatrixAt(i, dummy.matrix)

        const cs = Math.max(0.0001, local)
        dummy.position.set(pp.x, 0.08, pp.z)
        dummy.scale.set(cs, cs, cs)
        dummy.updateMatrix()
        collars.setMatrixAt(i, dummy.matrix)

        const capS = Math.max(
          0.0001,
          smoothstep(0.5 + fi * 0.2, 0.57 + fi * 0.2, dp)
        )
        dummy.position.set(pp.x, 5.5, pp.z)
        dummy.rotation.set(0, Math.PI / 4, 0)
        dummy.scale.set(capS, capS, capS)
        dummy.updateMatrix()
        caps.setMatrixAt(i, dummy.matrix)
      }
      posts.instanceMatrix.needsUpdate = true
      collars.instanceMatrix.needsUpdate = true
      caps.instanceMatrix.needsUpdate = true
    }

    if (rails) {
      for (let i = 0; i < N; i++) {
        const bay = layout.bays[i]
        for (let r = 0; r < 3; r++) {
          const kk = i * 3 + r
          const start = 0.325 + (kk / totalRails) * 0.19
          const local = smoothstep(start, start + 0.028, dp)
          const len = Math.max(0.0001, bay.len * local)
          const yz = Math.max(0.0001, smoothstep(start - 0.01, start + 0.004, dp))
          dummy.position.set(
            bay.a.p.x + bay.dir.x * (len / 2),
            1.35 + r * 1.55,
            bay.a.p.z + bay.dir.z * (len / 2)
          )
          dummy.rotation.set(0, -bay.angle, 0)
          dummy.scale.set(len, yz, yz)
          dummy.updateMatrix()
          rails.setMatrixAt(kk, dummy.matrix)
        }
      }
      rails.instanceMatrix.needsUpdate = true
    }

    if (boards) {
      for (let i = 0; i < N; i++) {
        const bay = layout.bays[i]
        for (let b = 0; b < BOARDS_PER_BAY; b++) {
          const gk = i * BOARDS_PER_BAY + b
          const start = 0.545 + (gk / totalBoards) * 0.275
          const local = smoothstep(start, start + 0.016, dp)
          const xz = Math.max(0.0001, smoothstep(start - 0.01, start + 0.004, dp))
          const off = b % 2 ? 0.1 : -0.1
          const tpos = (b + 0.5) / BOARDS_PER_BAY
          dummy.position.set(
            bay.a.p.x + bay.dir.x * bay.len * tpos + bay.nrm.x * off,
            0.3,
            bay.a.p.z + bay.dir.z * bay.len * tpos + bay.nrm.z * off
          )
          dummy.rotation.set(0, -bay.angle, 0)
          dummy.scale.set(xz, Math.max(0.0001, local), xz)
          dummy.updateMatrix()
          boards.setMatrixAt(gk, dummy.matrix)
        }
      }
      boards.instanceMatrix.needsUpdate = true
    }

    const fade = 1 - smoothstep(0.62, 0.78, dp)
    if (flagsRef.current) {
      flagsRef.current.visible = fade > 0.01
      flagsRef.current.traverse((o) => {
        if (o.material) {
          o.material.transparent = true
          o.material.opacity = fade
        }
      })
    }
    stringObj.material.opacity = (1 - smoothstep(0.5, 0.66, dp)) * 0.9
    stringObj.visible = dp > 0.015 && dp < 0.7
    if (dogRef.current) {
      const sd = smoothstep(0.88, 0.96, dp)
      dogRef.current.scale.setScalar(Math.max(0.0001, sd))
      dogRef.current.visible = sd > 0.01
    }
  })

  return (
    <group>
      <instancedMesh
        ref={postsRef}
        args={[geos.post, mat.post, N]}
        castShadow
        receiveShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={collarsRef}
        args={[geos.collar, mat.mulch, N]}
        receiveShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={capsRef}
        args={[geos.cap, mat.cap, N]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={railsRef}
        args={[geos.rail, mat.rail, totalRails]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={boardsRef}
        args={[geos.board, mat.board, totalBoards]}
        castShadow
        receiveShadow
        frustumCulled={false}
      />

      <group ref={flagsRef}>
        {flags.map((f, i) => (
          <group key={i} position={f.pos} rotation={[0, f.rot, 0]}>
            {f.cone ? (
              <mesh position={[0, 0.45, 0]} castShadow>
                <coneGeometry args={[0.34, 0.9, 4]} />
                <meshStandardMaterial color={f.color} roughness={0.6} />
              </mesh>
            ) : (
              <>
                <mesh position={[0, 1.1, 0]}>
                  <cylinderGeometry args={[0.035, 0.035, 2.2, 5]} />
                  <meshStandardMaterial color="#c9c2b0" />
                </mesh>
                <mesh position={[0.16, 1.9, 0]} rotation={[0, 0, -0.25]}>
                  <planeGeometry args={[0.5, 0.7]} />
                  <meshStandardMaterial
                    color={f.color}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={0.95}
                  />
                </mesh>
              </>
            )}
          </group>
        ))}
      </group>

      <primitive object={stringObj} />

      <group ref={dogRef} position={[-7, 0, 10]} rotation={[0, 2.3, 0]} visible={false}>
        <mesh position={[0, 0.62, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.48, 1.7, 4, 10]} />
          <meshStandardMaterial color="#b07a3a" roughness={0.95} />
        </mesh>
        <mesh position={[1.35, 0.85, 0]} castShadow>
          <sphereGeometry args={[0.44, 12, 10]} />
          <meshStandardMaterial color="#b8813f" roughness={0.95} />
        </mesh>
        <mesh position={[1.78, 0.72, 0]}>
          <boxGeometry args={[0.55, 0.3, 0.32]} />
          <meshStandardMaterial color="#a06c32" roughness={0.95} />
        </mesh>
        <mesh position={[1.28, 1.2, 0.28]}>
          <boxGeometry args={[0.16, 0.34, 0.1]} />
          <meshStandardMaterial color="#8d5c28" />
        </mesh>
        <mesh position={[1.28, 1.2, -0.28]}>
          <boxGeometry args={[0.16, 0.34, 0.1]} />
          <meshStandardMaterial color="#8d5c28" />
        </mesh>
        <mesh position={[-1.2, 0.85, 0]} rotation={[0, 0, 0.9]}>
          <boxGeometry args={[0.9, 0.14, 0.14]} />
          <meshStandardMaterial color="#a06c32" />
        </mesh>
        {[0.55, -0.55].map((x) =>
          [0.3, -0.3].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.22, z]}>
              <boxGeometry args={[0.24, 0.45, 0.22]} />
              <meshStandardMaterial color="#a06c32" />
            </mesh>
          ))
        )}
      </group>
    </group>
  )
}

/* ————— camera choreography ————— */

function CameraRig({ sectionRef, mouseRef }) {
  const { camera } = useThree()
  const posCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(58, 18, 62),
        new THREE.Vector3(42, 12, 40),
        new THREE.Vector3(28, 8.5, 22),
        new THREE.Vector3(20, 8, 10),
        new THREE.Vector3(0, 40, 54),
      ]),
    []
  )
  const lookCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 5, -30),
        new THREE.Vector3(-4, 5, -38),
        new THREE.Vector3(-6, 5, -44),
        new THREE.Vector3(-4, 5, -46),
        new THREE.Vector3(0, 1, -22),
      ]),
    []
  )
  const cur = useRef({
    pos: new THREE.Vector3(58, 18, 62),
    look: new THREE.Vector3(0, 5, -30),
  })

  useFrame((s, dt) => {
    const p = clamp01(progressOf(sectionRef))
    const targetPos = posCurve.getPointAt(p)
    const targetLook = lookCurve.getPointAt(p)
    const m = mouseRef?.current ?? { x: 0, y: 0 }
    targetPos.x += m.x * 1.6
    targetPos.y += -m.y * 0.9 + Math.sin(s.clock.elapsedTime * 0.5) * 0.16
    targetLook.x += m.x * 0.8
    const k = Math.min(dt, 0.05)
    cur.current.pos.x = THREE.MathUtils.damp(cur.current.pos.x, targetPos.x, 3.4, k)
    cur.current.pos.y = THREE.MathUtils.damp(cur.current.pos.y, targetPos.y, 3.4, k)
    cur.current.pos.z = THREE.MathUtils.damp(cur.current.pos.z, targetPos.z, 3.4, k)
    cur.current.look.x = THREE.MathUtils.damp(cur.current.look.x, targetLook.x, 3.0, k)
    cur.current.look.y = THREE.MathUtils.damp(cur.current.look.y, targetLook.y, 3.0, k)
    cur.current.look.z = THREE.MathUtils.damp(cur.current.look.z, targetLook.z, 3.0, k)
    camera.position.copy(cur.current.pos)
    camera.lookAt(cur.current.look)
  })
  return null
}

/* ─────────────────────────────── the canvas ───────────────────────────── */

function YardScene({ sectionRef, mouseRef }) {
  const models = useRealModels()
  return (
    <>
      <SkyEnv />
      <fog attach="fog" args={['#cdd8e0', 160, 480]} />
      <Lights />
      <Ground />
      <Driveway />
      <House />
      <Treeline />
      <Tree position={[-40, 0, 24]} scale={1.35} seed={3} />
      <Tree position={[-30, 0, -14]} scale={1.15} seed={8} kind="evergreen" />
      <Tree position={[34, 0, -20]} scale={1.2} seed={11} />
      <Tree position={[52, 0, 6]} scale={0.95} seed={5} />
      <Tree position={[-52, 0, -6]} scale={1.05} seed={17} />
      <Tree position={[46, 0, 34]} scale={0.85} seed={21} />
      <Tree position={[-18, 0, 26]} scale={0.9} seed={30} />
      <YardScatter models={models} />
      <FenceBuild sectionRef={sectionRef} />
      <CameraRig sectionRef={sectionRef} mouseRef={mouseRef} />
      <Effects />
    </>
  )
}

export default function BuildCanvas({ sectionRef }) {
  const near = useNearView(sectionRef, '120% 0px 120% 0px')
  const mouseRef = useMouseNorm(1)
  if (!near) return null
  return (
    <Canvas
      shadows
      dpr={[1, 1.4]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.02,
        shadowMap: { type: THREE.PCFSoftShadowMap },
      }}
      camera={{ fov: 42, near: 0.5, far: 620, position: [58, 18, 62] }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <YardScene sectionRef={sectionRef} mouseRef={mouseRef} />
    </Canvas>
  )
}
