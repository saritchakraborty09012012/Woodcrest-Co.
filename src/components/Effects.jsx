import { useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

/* Gentle filmic vignette + grain. Kept neutral so real colors survive. */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    vignette: { value: 0.85 },
    warm: { value: 0.012 },
    contrast: { value: 1.03 },
    saturation: { value: 1.12 },
    grain: { value: 0.016 },
    time: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float vignette, warm, contrast, saturation, grain, time;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      // saturation boost (keeps real photographic color lively)
      float l = dot(c.rgb, vec3(0.2126,0.7152,0.0722));
      c.rgb = mix(vec3(l), c.rgb, saturation);
      // very slight warm lift
      c.r += warm; c.g += warm*0.25; c.b -= warm*0.4;
      // contrast around mid
      c.rgb = (c.rgb - 0.5) * contrast + 0.5;
      // vignette
      vec2 uv = vUv - 0.5;
      float v = smoothstep(0.95, vignette*0.35, length(uv)*1.32);
      c.rgb *= mix(0.78, 1.0, v);
      // film grain
      float g = hash(vUv*vec2(1024.0,1024.0) + time) - 0.5;
      c.rgb += g * grain;
      gl_FragColor = vec4(clamp(c.rgb,0.0,1.0), c.a);
    }
  `,
}

export default function Effects({ quality = 'high' }) {
  const { gl, scene, camera, size } = useThree()

  const composer = useMemo(() => {
    const c = new EffectComposer(gl)
    c.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.32,
      0.7,
      0.82
    )
    c.addPass(bloom)
    const grade = new ShaderPass(GradeShader)
    c.addPass(grade)
    c.addPass(new OutputPass())
    return c
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera])

  useEffect(() => {
    const dpr = gl.getPixelRatio()
    composer.setPixelRatio(dpr)
    composer.setSize(size.width, size.height)
  }, [composer, gl, size])

  useEffect(() => {
    return () => composer.dispose()
  }, [composer])

  useFrame((state) => {
    const grade = composer.passes.find((p) => p.uniforms && p.uniforms.time)
    if (grade) grade.uniforms.time.value = state.clock.elapsedTime
    composer.render()
  }, 1)

  return null
}
