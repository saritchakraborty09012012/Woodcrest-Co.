import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { pbr, tex } from '../lib/assetLibrary'

/* Deterministic RNG so trees look the same every render */
function makeRng(seed) {
  let s = seed * 9301 + 49297 + 11
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/* Build canopy blob transforms for a tree. Deciduous: a cluster of
   deformed spheres forming a broad crown. Evergreen: stacked cones. */
function buildCanopy({ kind, h, rng, count }) {
  const dummy = new THREE.Object3D()
  const mats = []
  const push = (x, y, z, sx, sy, sz, rx, ry, rz) => {
    dummy.position.set(x, y, z)
    dummy.rotation.set(rx, ry, rz)
    dummy.scale.set(sx, sy, sz)
    dummy.updateMatrix()
    mats.push(dummy.matrix.clone())
  }

  if (kind === 'evergreen') {
    // stacked cone segments (narrow at top) — instanced cones
    const segs = 6
    for (let i = 0; i < segs; i++) {
      const t = i / (segs - 1)
      const y = 4 + t * (h - 5)
      const rad = (5.2 - t * 4.6) * (0.9 + rng() * 0.2)
      const sy = (h / segs) * (1.15 - t * 0.25)
      push(
        (rng() - 0.5) * 0.5,
        y,
        (rng() - 0.5) * 0.5,
        rad,
        sy,
        rad,
        0,
        rng() * Math.PI,
        0
      )
    }
  } else {
    // broad crown: ellipsoid blobs biased to a shell
    const cy = h * 0.72
    for (let i = 0; i < count; i++) {
      const theta = rng() * Math.PI * 2
      const phi = Math.acos(2 * rng() - 1)
      const shell = 0.4 + Math.pow(rng(), 0.5) * 0.6
      const rr = 4.6 * shell
      const x = Math.sin(phi) * Math.cos(theta) * rr * 1.25
      const y = cy + Math.cos(phi) * rr * 0.85
      const z = Math.sin(phi) * Math.sin(theta) * rr * 1.25
      const s = 2.2 + rng() * 2.2
      push(
        x,
        y,
        z,
        s * (1.0 + rng() * 0.3),
        s * (0.75 + rng() * 0.3),
        s * (1.0 + rng() * 0.3),
        (rng() - 0.5) * 0.5,
        rng() * Math.PI,
        (rng() - 0.5) * 0.5
      )
    }
  }
  return mats
}

/* A tree: real bark trunk/branches + a solid textured canopy (no alpha).
   The canopy uses the leaf photo as a repeating color/normal map on
   deformed spheres, giving volume without flat panel artifacts. */
export function RealisticTree({ position, scale = 1, seed = 0, kind = 'deciduous' }) {
  const evergreen = kind === 'evergreen'
  const rng = useMemo(() => makeRng(seed + 1), [seed])
  const h = useMemo(
    () => (evergreen ? 20 + rng() * 6 : 15 + rng() * 7),
    [evergreen, rng]
  )
  const trunkR = useMemo(
    () => (evergreen ? 0.55 + rng() * 0.25 : 0.75 + rng() * 0.4),
    [evergreen, rng]
  )

  const bark = useMemo(() => {
    const p = pbr('bark', [1, 3])
    return new THREE.MeshStandardMaterial({
      map: p.map,
      normalMap: p.normalMap,
      roughnessMap: p.roughMap,
      roughness: 1,
      metalness: 0,
    })
  }, [])

  const leafMat = useMemo(() => {
    const label = evergreen ? 'needles' : seed % 2 ? 'leaves' : 'leaves2'
    const m = manifestLeaf(label)
    // normal map only for surface detail — the color map has a black
    // background (made for alpha cards) so we skip it on solid geometry
    const normalMap = m?.normal ? tex(m.normal, { repeat: [2, 2], srgb: false }) : null
    // realistic foliage greens with slight per-tree variation
    const greens = evergreen
      ? ['#33502a', '#3c5c30', '#2c4524']
      : ['#4a6633', '#58753c', '#425c2e', '#647f42']
    const color = greens[seed % greens.length]
    return new THREE.MeshStandardMaterial({
      normalMap,
      roughness: 0.95,
      metalness: 0,
      color,
      normalScale: new THREE.Vector2(0.9, 0.9),
      flatShading: false,
    })
  }, [evergreen, seed])

  const canopyMatrices = useMemo(
    () =>
      buildCanopy({
        kind,
        h,
        rng: makeRng(seed * 17 + 3),
        count: evergreen ? 0 : 16,
      }),
    [kind, h, seed, evergreen]
  )

  const branches = useMemo(() => {
    if (evergreen) return []
    const r = makeRng(seed * 7 + 5)
    const arr = []
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + r() * 0.5
      arr.push({
        rot: [0, a, 0.5 + r() * 0.4],
        len: 3.5 + r() * 2.5,
        y: h * (0.42 + r() * 0.34),
      })
    }
    return arr
  }, [h, evergreen, seed])

  const canopyRef = useRef()
  useEffect(() => {
    const mesh = canopyRef.current
    if (!mesh || !canopyMatrices.length) return
    for (let i = 0; i < canopyMatrices.length; i++) {
      mesh.setMatrixAt(i, canopyMatrices[i])
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [canopyMatrices])

  // sphere base geometry; cones for evergreen
  const canopyGeo = useMemo(() => {
    if (evergreen) return new THREE.ConeGeometry(1, 1, 10, 4)
    return new THREE.IcosahedronGeometry(1, 2)
  }, [evergreen])

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, h / 2, 0]} castShadow material={bark}>
        <cylinderGeometry args={[trunkR * 0.6, trunkR, h, 12]} />
      </mesh>
      {branches.map((b, i) => (
        <mesh
          key={i}
          position={[0, b.y, 0]}
          rotation={b.rot}
          castShadow
          material={bark}
        >
          <cylinderGeometry args={[0.16, 0.4, b.len, 6]} />
        </mesh>
      ))}
      {leafMat && canopyMatrices.length > 0 && (
        <instancedMesh
          ref={canopyRef}
          args={[canopyGeo, leafMat, canopyMatrices.length]}
          castShadow
          frustumCulled={false}
        />
      )}
    </group>
  )
}

/* helper: pull leaf texture paths from the manifest */
import manifest from '../assets/manifest.json'
function manifestLeaf(label) {
  return manifest.textures[label] ?? null
}

/* Real photogrammetry ground scatter (grass clumps, shrubs, ferns, rocks)
   loaded as GLTF clones, scattered on a plane. */
export function GroundScatter({ items }) {
  return (
    <group>
      {items.map((it, i) =>
        it.scene ? (
          <primitive
            key={i}
            object={it.scene.clone(true)}
            position={it.p}
            rotation={it.rot ?? [0, it.r ?? 0, 0]}
            scale={it.s}
          />
        ) : null
      )}
    </group>
  )
}
