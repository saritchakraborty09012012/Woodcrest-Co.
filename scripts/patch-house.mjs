import { readFileSync, writeFileSync } from 'node:fs'

const p = 'src/components/BuildScene.jsx'
let s = readFileSync(p, 'utf8')
const before = s

s = s.replaceAll(
  '<meshStandardMaterial map={brick} roughness={0.92} />',
  '<primitive object={brickMat} attach="material" />'
)
s = s.replaceAll(
  '<meshStandardMaterial map={brick} roughness={0.92} side={THREE.DoubleSide} />',
  '<primitive object={brickMatDouble} attach="material" />'
)
s = s.replaceAll(
  '<meshStandardMaterial color="#4b4a46" roughness={0.95} />',
  '<primitive object={roofMat} attach="material" />'
)

// add the double-sided brick material after brickMat definition
const anchor = '  const roofMat = useMemo('
const inject = `  const brickMatDouble = useMemo(
    () => new THREE.MeshStandardMaterial({ ...brickMat, side: THREE.DoubleSide }),
    [brickMat]
  )
`
s = s.replace(anchor, inject + anchor)

writeFileSync(p, s)
console.log('brickMat:', (s.match(/brickMat/g) || []).length)
console.log('roofMat:', (s.match(/roofMat/g) || []).length)
console.log('changed:', before !== s)
