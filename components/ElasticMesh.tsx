"use client"

import { useEffect, useRef } from "react"
import { Geometry, Mesh, Program, Renderer, Texture } from "ogl"
import styles from "./elastic-mesh.module.css"

type Interaction = "hover" | "drag"

type ElasticMeshProps = {
  image?: string
  color1?: string
  color2?: string
  highlight?: string
  showGrid?: boolean
  gridDensity?: number
  gridOpacity?: number
  gridColor?: string
  borderRadius?: number
  stiffness?: number
  damping?: number
  grabRadius?: number
  pull?: number
  wobble?: number
  tilt?: number
  shading?: number
  resolution?: number
  interaction?: Interaction
  enabled?: boolean
  className?: string
  style?: React.CSSProperties
}

const DIST = 4.6
const FIT = 0.82

const vertex = `
precision highp float;
attribute vec2 aGrid;
attribute vec2 uv;
attribute vec3 aOffset;
attribute vec3 aNormal;
uniform float uAspect;
uniform float uTilt;
uniform float uDist;
uniform float uFit;
varying vec2 vUv;
varying vec3 vNormal;
varying float vDepth;
void main() {
  vUv = uv;
  vec2 base = vec2((aGrid.x * 2.0 - 1.0) * uAspect, 1.0 - aGrid.y * 2.0);
  vec3 p = vec3(base + aOffset.xy, aOffset.z);
  float ct = cos(uTilt);
  float st = sin(uTilt);
  float ry = p.y * ct - p.z * st;
  float rz = p.y * st + p.z * ct;
  p.y = ry;
  p.z = rz;
  float persp = uDist / (uDist - p.z);
  vec2 clip = vec2(p.x / uAspect, p.y) * persp * uFit;
  vNormal = aNormal;
  vDepth = aOffset.z;
  gl_Position = vec4(clip, 0.0, 1.0);
}
`

const fragment = `
precision highp float;
varying vec2 vUv;
varying vec3 vNormal;
varying float vDepth;
uniform sampler2D tMap;
uniform float uHasImage;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uHighlight;
uniform float uShading;
uniform vec2 uRes;
uniform float uRadius;
uniform float uGrid;
uniform float uGridDensity;
uniform float uGridOpacity;
uniform vec3 uGridColor;
void main() {
  vec3 base = uHasImage > 0.5 ? texture2D(tMap, vUv).rgb : mix(uColor1, uColor2, vUv.y);
  vec3 N = normalize(vNormal);
  vec3 L = normalize(vec3(-0.35, 0.55, 0.78));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float diff = clamp(dot(N, L), 0.0, 1.0);
  float spec = pow(clamp(dot(N, H), 0.0, 1.0), 26.0);
  vec3 lit = base * (1.0 - uShading * 0.28) + base * diff * uShading * 0.55;
  lit *= clamp(1.0 + vDepth * 0.45, 0.65, 1.25);
  lit += uHighlight * spec * uShading * 0.2;
  if (uGrid > 0.5) {
    vec2 g = vUv * uGridDensity;
    vec2 w = uGridDensity / max(uRes, vec2(1.0));
    vec2 d = abs(fract(g - 0.5) - 0.5) / max(w * 1.5, vec2(0.0001));
    float line = 1.0 - clamp(min(d.x, d.y), 0.0, 1.0);
    lit = mix(lit, uGridColor, line * uGridOpacity * (0.45 + diff * 0.55));
  }
  vec2 p = (vUv - 0.5) * uRes;
  vec2 halfRes = uRes * 0.5;
  float r = min(uRadius, min(halfRes.x, halfRes.y));
  vec2 q = abs(p) - (halfRes - r);
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  float alpha = 1.0 - smoothstep(-1.25, 1.25, sd);
  if (alpha <= 0.002) discard;
  gl_FragColor = vec4(lit, alpha);
}
`

function hexToRgb(hex: string): [number, number, number] {
  let value = hex.replace("#", "").trim()
  if (value.length === 3) value = value.split("").map((character) => character + character).join("")
  const parsed = Number.parseInt(value || "000000", 16)
  return [((parsed >> 16) & 255) / 255, ((parsed >> 8) & 255) / 255, (parsed & 255) / 255]
}

export default function ElasticMesh({
  image = "",
  color1 = "#5227FF",
  color2 = "#B19EEF",
  highlight = "#ffffff",
  showGrid = true,
  gridDensity = 20,
  gridOpacity = 0.28,
  gridColor = "#ffffff",
  borderRadius = 25,
  stiffness = 0.05,
  damping = 0.2,
  grabRadius = 0.6,
  pull = 0.4,
  wobble = 5,
  tilt = 14,
  shading = 0.5,
  resolution = 25,
  interaction = "hover",
  enabled = true,
  className = "",
  style,
}: ElasticMeshProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const propsRef = useRef({ color1, color2, highlight, showGrid, gridDensity, gridOpacity, gridColor, borderRadius, stiffness, damping, grabRadius, pull, wobble, tilt, shading, interaction, enabled })
  propsRef.current = { color1, color2, highlight, showGrid, gridDensity, gridOpacity, gridColor, borderRadius, stiffness, damping, grabRadius, pull, wobble, tilt, shading, interaction, enabled }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const nodes = Math.max(6, Math.min(40, Math.round(resolution)))
    const count = nodes * nodes
    const grid = new Float32Array(count * 2)
    const uv = new Float32Array(count * 2)
    const offsets = new Float32Array(count * 3)
    const normals = new Float32Array(count * 3)
    const position = new Float32Array(count * 3)
    const velocity = new Float32Array(count * 3)
    const indices = new Uint16Array((nodes - 1) * (nodes - 1) * 6)

    for (let y = 0; y < nodes; y += 1) {
      for (let x = 0; x < nodes; x += 1) {
        const index = y * nodes + x
        grid[index * 2] = x / (nodes - 1)
        grid[index * 2 + 1] = y / (nodes - 1)
        uv[index * 2] = grid[index * 2]
        uv[index * 2 + 1] = grid[index * 2 + 1]
        normals[index * 3 + 2] = 1
      }
    }
    let triangleIndex = 0
    for (let y = 0; y < nodes - 1; y += 1) {
      for (let x = 0; x < nodes - 1; x += 1) {
        const a = y * nodes + x
        const b = a + 1
        const c = a + nodes
        const d = c + 1
        indices.set([a, c, b, b, c, d], triangleIndex)
        triangleIndex += 6
      }
    }

    const geometry = new Geometry(gl, {
      aGrid: { size: 2, data: grid },
      uv: { size: 2, data: uv },
      aOffset: { size: 3, data: offsets },
      aNormal: { size: 3, data: normals },
      index: { data: indices },
    })
    const texture = new Texture(gl, { generateMipmaps: false, flipY: false })
    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      cullFace: null,
      uniforms: {
        tMap: { value: texture }, uHasImage: { value: 0 }, uColor1: { value: hexToRgb(color1) }, uColor2: { value: hexToRgb(color2) },
        uHighlight: { value: hexToRgb(highlight) }, uShading: { value: shading }, uRes: { value: [1, 1] }, uRadius: { value: borderRadius },
        uGrid: { value: showGrid ? 1 : 0 }, uGridDensity: { value: gridDensity }, uGridOpacity: { value: gridOpacity }, uGridColor: { value: hexToRgb(gridColor) },
        uAspect: { value: 1 }, uTilt: { value: (tilt * Math.PI) / 180 }, uDist: { value: DIST }, uFit: { value: FIT },
      },
    })
    const mesh = new Mesh(gl, { geometry, program })
    if (image) {
      const imageElement = new Image()
      imageElement.src = image
      imageElement.onload = () => { texture.image = imageElement; program.uniforms.uHasImage.value = 1 }
    }

    let aspect = 1
    const resize = () => {
      const width = container.offsetWidth || 1
      const height = container.offsetHeight || 1
      renderer.setSize(width, height)
      aspect = width / height
      program.uniforms.uAspect.value = aspect
      program.uniforms.uRes.value = [width, height]
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    const pointer = { x: 0, y: 0, active: false }
    const setPointer = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect()
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = 1 - ((clientY - rect.top) / rect.height) * 2
    }
    const onMove = (event: MouseEvent) => { if (propsRef.current.interaction === "hover") { setPointer(event.clientX, event.clientY); pointer.active = true } }
    const onEnter = () => { if (propsRef.current.interaction === "hover") pointer.active = true }
    const onLeave = () => { pointer.active = false }
    const onDown = (event: MouseEvent) => { if (propsRef.current.interaction === "drag") { setPointer(event.clientX, event.clientY); pointer.active = true } }
    const onUp = () => { if (propsRef.current.interaction === "drag") pointer.active = false }
    container.addEventListener("mousemove", onMove)
    container.addEventListener("mouseenter", onEnter)
    container.addEventListener("mouseleave", onLeave)
    container.addEventListener("mousedown", onDown)
    window.addEventListener("mouseup", onUp)

    let frameId = 0
    const render = () => {
      const current = propsRef.current
      const radius = Math.max(0.08, current.grabRadius)
      const retaining = 1 - current.damping
      for (let index = 0; index < count; index += 1) {
        const offset = index * 3
        const x = grid[index * 2] * 2 - 1
        const y = 1 - grid[index * 2 + 1] * 2
        let forceX = -position[offset] * current.stiffness
        let forceY = -position[offset + 1] * current.stiffness
        let forceZ = -position[offset + 2] * current.stiffness
        if (pointer.active && current.enabled && !reduceMotion) {
          const dx = pointer.x * aspect - (x * aspect + position[offset])
          const dy = pointer.y - (y + position[offset + 1])
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < radius) {
            const strength = (1 - distance / radius) * current.pull * 0.025
            forceX += dx * strength
            forceY += dy * strength
            forceZ += strength * (2 + current.wobble * 0.12)
          }
        }
        velocity[offset] = (velocity[offset] + forceX) * retaining
        velocity[offset + 1] = (velocity[offset + 1] + forceY) * retaining
        velocity[offset + 2] = (velocity[offset + 2] + forceZ) * retaining
        position[offset] += velocity[offset]
        position[offset + 1] += velocity[offset + 1]
        position[offset + 2] += velocity[offset + 2]
        offsets[offset] = position[offset]
        offsets[offset + 1] = position[offset + 1]
        offsets[offset + 2] = position[offset + 2]
      }
      for (let index = 0; index < count; index += 1) normals[index * 3 + 2] = 1
      geometry.attributes.aOffset.needsUpdate = true
      geometry.attributes.aNormal.needsUpdate = true
      program.uniforms.uColor1.value = hexToRgb(current.color1)
      program.uniforms.uColor2.value = hexToRgb(current.color2)
      program.uniforms.uHighlight.value = hexToRgb(current.highlight)
      program.uniforms.uGrid.value = current.showGrid ? 1 : 0
      program.uniforms.uGridDensity.value = current.gridDensity
      program.uniforms.uGridOpacity.value = current.gridOpacity
      program.uniforms.uGridColor.value = hexToRgb(current.gridColor)
      program.uniforms.uRadius.value = current.borderRadius
      program.uniforms.uShading.value = current.shading
      program.uniforms.uTilt.value = (current.tilt * Math.PI) / 180
      renderer.render({ scene: mesh })
      frameId = requestAnimationFrame(render)
    }
    frameId = requestAnimationFrame(render)
    container.appendChild(gl.canvas)

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
      container.removeEventListener("mousemove", onMove)
      container.removeEventListener("mouseenter", onEnter)
      container.removeEventListener("mouseleave", onLeave)
      container.removeEventListener("mousedown", onDown)
      window.removeEventListener("mouseup", onUp)
      if (gl.canvas.parentElement === container) container.removeChild(gl.canvas)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    }
  }, [image, resolution])

  return <div ref={containerRef} className={`${styles.mesh}${className ? ` ${className}` : ""}`} style={style} />
}
