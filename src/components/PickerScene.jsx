import { useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useNearView, smoothstep, clamp01, progressOf } from '../lib/scroll'

/* ————— textures ————— */

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}

function fieldGrass() {
  const [c, ctx] = makeCanvas(512, 512)
  ctx.fillStyle = '#69a03c'
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(255,255,230,0.07)' : 'rgba(30,70,10,0.06)'
    ctx.fillRect(0, (i * 512) / 10, 512, 512 / 10)
  }
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const r = 26 + Math.random() * 80
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(196,208,90,0.22)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.repeat.set(10, 10)
  return t
}

function chainTexture() {
  const [c, ctx] = makeCanvas(128, 128)
  ctx.clearRect(0, 0, 128, 128)
  ctx.strokeStyle = 'rgba(235,238,240,0.98)'
  ctx.lineWidth = 2.4
  for (let i = -128; i < 256; i += 18) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + 128, 128)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(i, 128)
    ctx.lineTo(i + 128, 0)
    ctx.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function wireTexture() {
  const [c, ctx] = makeCanvas(128, 96)
  ctx.clearRect(0, 0, 128, 96)
  ctx.strokeStyle = 'rgba(110,118,110,0.95)'
  ctx.lineWidth = 1.7
  for (let x = 0; x <= 128; x += 16) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 96)
    ctx.stroke()
  }
  for (let y = 0; y <= 96; y += 12) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(128, y)
    ctx.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/* ————— layout constants ————— */

const BAYS = 13
const BAY_LEN = 8
const SPAN = BAYS * BAY_LEN
const SLOPE = -0.14 // z = -x * SLOPE magnitude along the run
const LINE_ANGLE = Math.atan2(0.14, 1) // yaw of the fence line
const BOARDS_PER_BAY = 7
const MAX_RAILS = BAYS * 5

/* ————— field furniture ————— */

function Field() {
  const tex = useMemo(fieldGrass, [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[560, 560]} />
        <meshStandardMaterial map={tex} color="#9cc462" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, LINE_ANGLE]} position={[0, 0.02, 0]}>
        <planeGeometry args={[SPAN + 40, 7.5]} />
        <meshStandardMaterial color="#78a944" roughness={1} />
      </mesh>
    </group>
  )
}

function WhiteFarmhouse() {
  return (
    <group position={[-48, 0, -36]} scale={1.15}>
      <mesh position={[0, 6, 0]} castShadow receiveShadow>
        <boxGeometry args={[26, 12, 14]} />
        <meshStandardMaterial color="#efece1" roughness={0.85} />
      </mesh>
      <mesh position={[0, 12.2, 0]} castShadow>
        <boxGeometry args={[26.4, 3.6, 14.4]} />
        <meshStandardMaterial color="#e9e5d8" roughness={0.85} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, 15.2, s * 3.9]} rotation={[s * 0.62, 0, 0]} castShadow>
          <boxGeometry args={[28, 0.5, 10.6]} />
          <meshStandardMaterial color="#3f4448" roughness={0.9} />
        </mesh>
      ))}
      {[-9, -3, 3, 9].map((x) =>
        [3.4, 8.4].map((y) => (
          <group key={`${x}-${y}`} position={[x, y, 7.05]}>
            <mesh>
              <boxGeometry args={[2.2, 3.1, 0.3]} />
              <meshStandardMaterial color="#f7f4ea" />
            </mesh>
            <mesh position={[0, 0, 0.18]}>
              <planeGeometry args={[1.7, 2.5]} />
              <meshStandardMaterial color="#8fa4b0" roughness={0.3} />
            </mesh>
          </group>
        ))
      )}
      <mesh position={[0, 3.4, 7.1]} castShadow>
        <boxGeometry args={[2.6, 6, 0.4]} />
        <meshStandardMaterial color="#28402f" roughness={0.6} />
      </mesh>
    </group>
  )
}

function RedBarn() {
  return (
    <group position={[54, 0, -60]}>
      <mesh position={[0, 6, 0]} castShadow receiveShadow>
        <boxGeometry args={[22, 12, 16]} />
        <meshStandardMaterial color="#a03d32" roughness={0.9} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, 14.6, s * 4.4]} rotation={[s * 0.64, 0, 0]} castShadow>
          <boxGeometry args={[24, 0.5, 12]} />
          <meshStandardMaterial color="#8f3428" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 6, 8.05]}>
        <planeGeometry args={[5, 8]} />
        <meshStandardMaterial color="#f0ece0" />
      </mesh>
      <mesh position={[0, 10.2, 8.1]}>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial color="#f0ece0" />
      </mesh>
      <group position={[-17, 0, 3]}>
        <mesh position={[0, 8, 0]} castShadow>
          <cylinderGeometry args={[3.4, 3.4, 16, 14]} />
          <meshStandardMaterial color="#c9c3b4" roughness={0.9} />
        </mesh>
        <mesh position={[0, 16, 0]} castShadow>
          <sphereGeometry args={[3.5, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#9aa094" roughness={0.85} />
        </mesh>
      </group>
    </group>
  )
}

function TreeRow() {
  const items = useMemo(() => {
    const arr = []
    for (let i = 0; i < 30; i++) {
      arr.push({
        x: -175 + i * 12 + ((i * 37) % 9),
        z: -135 - ((i * 53) % 26),
        s: (1.15 + ((i * 17) % 10) / 10) * 0.92,
        c: ['#3a6a28', '#467a30', '#2f5a20'][i % 3],
      })
    }
    return arr
  }, [])
  return (
    <group>
      {items.map((t, i) => (
        <mesh key={i} position={[t.x, 10 * t.s, t.z]} scale={t.s}>
          <icosahedronGeometry args={[11, 1]} />
          <meshStandardMaterial color={t.c} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  )
}

/* ————— one fence type, morphable in/out ————— */

function FenceLayer({ type, phaseRef, mode }) {
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tmp = useMemo(() => new THREE.Color(), [])

  const geos = useMemo(() => {
    const post = new THREE.BoxGeometry(0.38, 5.8, 0.38)
    post.translate(0, 2.9, 0)
    const postSm = new THREE.BoxGeometry(0.3, 5.1, 0.3)
    postSm.translate(0, 2.55, 0)
    const roundPost = new THREE.CylinderGeometry(0.26, 0.3, 5.0, 8)
    roundPost.translate(0, 2.5, 0)
    const board = new THREE.BoxGeometry(1.2, 5.4, 0.16)
    board.translate(0, 2.7, 0)
    const panel = new THREE.BoxGeometry(1, 5.3, 0.14)
    panel.translate(0, 2.65, 0)
    const rail = new THREE.BoxGeometry(1, 0.48, 0.15)
    const cap = new THREE.ConeGeometry(0.32, 0.34, 4)
    cap.translate(0, 0.17, 0)
    return { post, postSm, roundPost, board, panel, rail, cap }
  }, [])

  const mats = useMemo(() => {
    const cTex = chainTexture()
    cTex.repeat.set(BAYS * 2.4, 1.7)
    const wTex = wireTexture()
    wTex.repeat.set(BAYS * 3.4, 1.5)
    return {
      light: new THREE.MeshStandardMaterial({ color: '#f4f2ec', roughness: 0.45 }),
      cap: new THREE.MeshStandardMaterial({ color: '#e6e2d6', roughness: 0.5 }),
      cedar: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.88 }),
      dark: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 }),
      chain: new THREE.MeshStandardMaterial({
        map: cTex,
        transparent: true,
        alphaTest: 0.3,
        side: THREE.DoubleSide,
        roughness: 0.4,
        metalness: 0.65,
        color: '#e2e7e7',
      }),
      wire: new THREE.MeshStandardMaterial({
        map: wTex,
        transparent: true,
        alphaTest: 0.3,
        side: THREE.DoubleSide,
        roughness: 0.5,
        metalness: 0.35,
        color: '#c2c9bd',
      }),
    }
  }, [])

  const cedarPalette = useMemo(
    () => ['#cb9c58', '#c1904e', '#d2a86c', '#c69552'].map((c) => new THREE.Color(c)),
    []
  )

  const postGeo =
    type === 'wire' ? geos.roundPost : type === 'chain' ? geos.postSm : geos.post

  const isHorse = type === 'horse'
  const isWire = type === 'wire'
  const isChain = type === 'chain'
  const isCedar = type === 'cedar'
  const isVinyl = type === 'vinyl'
  const railRows = isHorse ? 3 : isWire ? 5 : 1

  const postsRef = useRef()
  const railsRef = useRef()
  const boardsRef = useRef()
  const panelsRef = useRef()
  const capsRef = useRef()
  const meshRef = useRef()

  /* board tints once */
  useEffect(() => {
    const m = boardsRef.current
    if (!m) return
    for (let gk = 0; gk < BAYS * BOARDS_PER_BAY; gk++) {
      m.setColorAt(gk, cedarPalette[gk % cedarPalette.length])
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [cedarPalette])

  useFrame(() => {
    const ph = clamp01(phaseRef.current)
    const rv = mode === 'in' ? ph : 1
    const hide = mode === 'out' ? ph : 0
    const op = smoothstep(0, 0.35, rv) * (1 - hide)

    Object.values(mats).forEach((m) => {
      const keepAlpha = m.map != null
      m.transparent = true
      m.opacity = op
      m.depthWrite = op > 0.55 && !keepAlpha
    })
    const sink = hide * 1.6
    const rise = (1 - rv) * -0.7

    const posts = postsRef.current
    if (posts) {
      for (let i = 0; i < BAYS + 1; i++) {
        const fi = i / (BAYS + 1)
        const s = Math.max(0.0001, smoothstep(fi * 0.45, fi * 0.45 + 0.5, rv))
        const xz = Math.max(0.0001, smoothstep(fi * 0.45 - 0.04, fi * 0.45 + 0.08, rv))
        const x = -SPAN / 2 + i * BAY_LEN
        dummy.position.set(x, rise - sink, x * SLOPE)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(xz, s, xz)
        dummy.updateMatrix()
        posts.setMatrixAt(i, dummy.matrix)
        if (isHorse) tmp.set('#2a2622')
        else if (isWire) tmp.set('#9a8a68')
        else if (isChain) tmp.set('#c8cccb')
        else if (isCedar) tmp.set('#c49a60')
        else tmp.set('#f4f2ec')
        posts.setColorAt(i, tmp)
      }
      posts.instanceMatrix.needsUpdate = true
      if (posts.instanceColor) posts.instanceColor.needsUpdate = true
    }

    const rails = railsRef.current
    if (rails) {
      rails.visible = isHorse || isWire || isChain
      if (rails.visible) {
        let idx = 0
        for (let i = 0; i < BAYS; i++) {
          const x0 = -SPAN / 2 + i * BAY_LEN
          const cx = x0 + BAY_LEN / 2
          for (let r = 0; r < railRows; r++) {
            const fi = idx / (BAYS * railRows)
            const s = Math.max(0.0001, smoothstep(fi * 0.5, fi * 0.5 + 0.45, rv))
            const yz = Math.max(0.0001, smoothstep(fi * 0.5 - 0.04, fi * 0.5 + 0.06, rv))
            const y = isHorse ? 1.25 + r * 1.55 : isWire ? 0.7 + r * 0.92 : 4.85
            dummy.position.set(cx, y + rise - sink, cx * SLOPE)
            dummy.rotation.set(0, LINE_ANGLE, 0)
            dummy.scale.set(BAY_LEN * s, yz, yz)
            dummy.updateMatrix()
            rails.setMatrixAt(idx, dummy.matrix)
            if (isHorse) tmp.set('#2a2622')
            else if (isWire) tmp.set('#a8b0a2')
            else tmp.set('#c8cccb')
            rails.setColorAt(idx, tmp)
            idx++
          }
        }
        rails.count = BAYS * railRows
        rails.instanceMatrix.needsUpdate = true
        if (rails.instanceColor) rails.instanceColor.needsUpdate = true
      }
    }

    const boards = boardsRef.current
    if (boards) {
      boards.visible = isCedar
      if (boards.visible) {
        const total = BAYS * BOARDS_PER_BAY
        for (let i = 0; i < BAYS; i++) {
          const x0 = -SPAN / 2 + i * BAY_LEN
          const z0 = x0 * SLOPE
          for (let b = 0; b < BOARDS_PER_BAY; b++) {
            const gk = i * BOARDS_PER_BAY + b
            const fi = gk / total
            const s = Math.max(0.0001, smoothstep(fi * 0.55, fi * 0.55 + 0.4, rv))
            const xz = Math.max(0.0001, smoothstep(fi * 0.55 - 0.04, fi * 0.55 + 0.06, rv))
            const t = (b + 0.5) / BOARDS_PER_BAY
            const off = b % 2 ? 0.1 : -0.1
            dummy.position.set(
              x0 + Math.cos(LINE_ANGLE) * BAY_LEN * t,
              0.25 + rise - sink + off * 0.0,
              z0 - Math.sin(LINE_ANGLE) * BAY_LEN * t + off
            )
            dummy.rotation.set(0, LINE_ANGLE, 0)
            dummy.scale.set(xz, s, xz)
            dummy.updateMatrix()
            boards.setMatrixAt(gk, dummy.matrix)
          }
        }
        boards.instanceMatrix.needsUpdate = true
      }
    }

    const panels = panelsRef.current
    if (panels) {
      panels.visible = isVinyl
      if (panels.visible) {
        for (let i = 0; i < BAYS; i++) {
          const cx = -SPAN / 2 + i * BAY_LEN + BAY_LEN / 2
          const fi = i / BAYS
          const s = Math.max(0.0001, smoothstep(fi * 0.5, fi * 0.5 + 0.45, rv))
          dummy.position.set(cx, rise - sink, cx * SLOPE)
          dummy.rotation.set(0, LINE_ANGLE, 0)
          dummy.scale.set(BAY_LEN * 0.985, s, Math.max(0.0001, smoothstep(fi * 0.5 - 0.04, fi * 0.5 + 0.06, rv)))
          dummy.updateMatrix()
          panels.setMatrixAt(i, dummy.matrix)
        }
        panels.instanceMatrix.needsUpdate = true
      }
    }

    const caps = capsRef.current
    if (caps) {
      caps.visible = isVinyl || isCedar
      if (caps.visible) {
        for (let i = 0; i < BAYS + 1; i++) {
          const fi = i / (BAYS + 1)
          const s = Math.max(0.0001, smoothstep(fi * 0.45 + 0.4, fi * 0.45 + 0.65, rv))
          const x = -SPAN / 2 + i * BAY_LEN
          dummy.position.set(x, 5.75 + rise - sink, x * SLOPE)
          dummy.rotation.set(0, Math.PI / 4, 0)
          dummy.scale.set(s, s, s)
          dummy.updateMatrix()
          caps.setMatrixAt(i, dummy.matrix)
        }
        caps.instanceMatrix.needsUpdate = true
      }
    }

    const mesh = meshRef.current
    if (mesh) {
      const show = isChain || isWire
      mesh.visible = show
      if (show) {
        const s = Math.max(0.0001, smoothstep(0.05, 0.65, rv))
        mesh.scale.set(s, Math.max(0.0001, s * (1 - hide * 0.5)), 1)
        mesh.position.y = (isChain ? 2.5 : 2.35) + rise - sink * 0.5
      }
    }
  })

  return (
    <group>
      <instancedMesh
        ref={postsRef}
        args={[postGeo, mats.light, BAYS + 1]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={railsRef}
        args={[geos.rail, mats.dark, MAX_RAILS]}
        castShadow
        frustumCulled={false}
        visible={false}
      />
      <instancedMesh
        ref={boardsRef}
        args={[geos.board, mats.cedar, BAYS * BOARDS_PER_BAY]}
        castShadow
        receiveShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={panelsRef}
        args={[geos.panel, mats.light, BAYS]}
        castShadow
        receiveShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={capsRef}
        args={[geos.cap, mats.cap, BAYS + 1]}
        castShadow
        frustumCulled={false}
      />
      <group rotation={[0, LINE_ANGLE, 0]}>
        <mesh ref={meshRef} castShadow>
          <planeGeometry args={[SPAN, isChain ? 4.7 : 4.3]} />
          <primitive object={isWire ? mats.wire : mats.chain} attach="material" />
        </mesh>
      </group>
    </group>
  )
}

/* ————— morph rig ————— */

function FenceRig({ activeId }) {
  const [pair, setPair] = useState({ current: activeId, previous: null })
  const phase = useRef(1)

  useEffect(() => {
    phase.current = 0
    setPair((p) =>
      p.current === activeId ? p : { current: activeId, previous: p.current }
    )
  }, [activeId])

  useFrame((_, dt) => {
    phase.current = Math.min(1, phase.current + Math.min(dt, 0.05) / 0.85)
    if (phase.current >= 1 && pair.previous) {
      setPair((p) => ({ current: p.current, previous: null }))
    }
  })

  return (
    <group>
      {pair.previous && (
        <FenceLayer
          key={`prev-${pair.previous}`}
          type={pair.previous}
          phaseRef={phase}
          mode="out"
        />
      )}
      <FenceLayer
        key={`cur-${pair.current}`}
        type={pair.current}
        phaseRef={phase}
        mode="in"
      />
    </group>
  )
}

/* ————— camera ————— */

function PickerCamera({ sectionRef }) {
  const { camera } = useThree()
  const cur = useRef(new THREE.Vector3(6, 7.8, 42))
  const look = useRef(new THREE.Vector3(-4, 3.6, -16))
  useFrame((s, dt) => {
    const p = clamp01(progressOf(sectionRef))
    const k = Math.min(dt, 0.05)
    const tx = 6 + p * 4
    const ty = 7.8 - p * 1.2
    const tz = 42 - p * 9
    const lx = -4 + p * 6
    const ly = 3.6 - p * 0.5
    const lz = -16 - p * 6
    cur.current.x = THREE.MathUtils.damp(cur.current.x, tx, 3, k)
    cur.current.y = THREE.MathUtils.damp(cur.current.y, ty, 3, k)
    cur.current.z = THREE.MathUtils.damp(cur.current.z, tz, 3, k)
    look.current.x = THREE.MathUtils.damp(look.current.x, lx, 3, k)
    look.current.y = THREE.MathUtils.damp(look.current.y, ly, 3, k)
    look.current.z = THREE.MathUtils.damp(look.current.z, lz, 3, k)
    camera.position.set(
      cur.current.x + Math.sin(s.clock.elapsedTime * 0.22) * 0.55,
      cur.current.y + Math.sin(s.clock.elapsedTime * 0.4) * 0.2,
      cur.current.z
    )
    camera.lookAt(look.current)
  })
  return null
}

/* ————— canvas ————— */

function Scene({ activeId, sectionRef }) {
  return (
    <>
      <hemisphereLight args={['#dbeaff', '#6f9a42', 0.9]} />
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[40, 48, 26]}
        intensity={2.3}
        color="#fff4de"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={60}
        shadow-camera-bottom={-40}
        shadow-camera-far={190}
        shadow-bias={-0.0004}
        shadow-normalBias={0.5}
      />
      <fog attach="fog" args={['#e6e8da', 130, 330]} />
      <mesh renderOrder={-10}>
        <sphereGeometry args={[440, 24, 16]} />
        <meshBasicMaterial
          color="#dde7ee"
          side={THREE.BackSide}
          fog={false}
          depthWrite={false}
        />
      </mesh>
      <Field />
      <WhiteFarmhouse />
      <RedBarn />
      <TreeRow />
      <FenceRig activeId={activeId} />
      <PickerCamera sectionRef={sectionRef} />
    </>
  )
}

export default function PickerCanvas({ activeId, sectionRef }) {
  const near = useNearView(sectionRef, '80% 0px 80% 0px')
  if (!near) return null
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 42, near: 0.5, far: 520, position: [6, 7.8, 42] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Scene activeId={activeId} sectionRef={sectionRef} />
    </Canvas>
  )
}
