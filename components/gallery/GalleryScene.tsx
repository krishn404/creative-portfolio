"use client"

/* R3F owns this shader material and its uniforms; in-place GPU state updates are intentional. */
/* eslint react-hooks/immutability: "off" */

import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import type { MotionValue } from "framer-motion"
import { galleryImages } from "@/src/data/gallery-images"
import { GUTTER_SIZE, GRID_DENSITY, INVERTED_LENS_STRENGTH, IMAGE_STRIDE } from "@/src/lib/gallery-grid"
import {
  GALLERY_ATLAS_CELL,
  GALLERY_ATLAS_COLUMNS,
  GALLERY_ATLAS_ROWS,
  GalleryImageLoader,
} from "@/src/lib/gallery-image-loader"

const CORNER_RADIUS = 0.11

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uAtlas;
  uniform vec2 uResolution;
  uniform vec2 uOffset;
  uniform vec2 uAtlasGrid;
  uniform float uLensStrength;
  uniform float uGridDensity;
  uniform float uImageCount;
  uniform float uGutter;
  uniform float uCornerRadius;
  uniform float uColorMode;
  varying vec2 vUv;

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = (vUv - vec2(0.5)) * vec2(aspect, 1.0);
    float radius = length(p);
    float warpedRadius = radius / (1.0 + uLensStrength * radius * radius);
    vec2 lensPoint = radius > 0.00001 ? p * (warpedRadius / radius) : vec2(0.0);

    // This inverse radial map compresses source coordinates toward the rim,
    // making the outer tiles visibly larger while keeping the center calm.
    vec2 gridPoint = lensPoint * uGridDensity + vec2(0.5) + uOffset;
    vec2 cell = floor(gridPoint);
    vec2 localUv = fract(gridPoint);
    float gutter = uGutter;
    float radiusInCell = uCornerRadius;
    vec2 roundedBox = abs(localUv - vec2(0.5)) - vec2(0.5 - gutter - radiusInCell);
    float cornerDistance = length(max(roundedBox, vec2(0.0))) + min(max(roundedBox.x, roundedBox.y), 0.0) - radiusInCell;
    float roundedMask = 1.0 - smoothstep(-0.0015, 0.0015, cornerDistance);
    float insideGutters = step(gutter, localUv.x) * step(gutter, localUv.y)
      * step(localUv.x, 1.0 - gutter) * step(localUv.y, 1.0 - gutter);

    float imageIndex = mod(cell.x + cell.y * ${IMAGE_STRIDE.toFixed(1)}, uImageCount);
    float atlasX = mod(imageIndex, uAtlasGrid.x);
    float atlasY = floor(imageIndex / uAtlasGrid.x);
    vec2 imageUv = clamp((localUv - vec2(gutter)) / (1.0 - 2.0 * gutter), 0.0, 1.0);
    vec2 cellInset = vec2(0.5 / ${GALLERY_ATLAS_CELL.toFixed(1)}) / uAtlasGrid;
    imageUv = mix(cellInset * uAtlasGrid, vec2(1.0) - cellInset * uAtlasGrid, imageUv);
    vec2 atlasUv = (vec2(atlasX, uAtlasGrid.y - 1.0 - atlasY) + vec2(imageUv.x, imageUv.y)) / uAtlasGrid;

    vec3 sampled = texture2D(uAtlas, atlasUv).rgb;
    vec3 displayColor = sampled;
    if (uColorMode < 0.5) {
      vec3 linearColor = pow(max(sampled, vec3(0.0)), vec3(2.2));
      float gray = dot(linearColor, vec3(0.2126, 0.7152, 0.0722));
      gray = clamp((gray - 0.5) * 1.48 + 0.5, 0.0, 1.0);
      displayColor = vec3(pow(gray, 1.0 / 2.2));
    }
    float visible = roundedMask * insideGutters;
    gl_FragColor = vec4(mix(vec3(0.0392), displayColor, visible), 1.0);
  }
`

type Props = {
  offsetX: MotionValue<number>
  offsetY: MotionValue<number>
  colorMode: "inverted" | "original"
}

export default function GalleryScene({ offsetX, offsetY, colorMode }: Props) {
  const loaderRef = useRef<GalleryImageLoader | null>(null)
  const { invalidate, size } = useThree()
  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 2), [])
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uAtlas: { value: null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uOffset: { value: new THREE.Vector2(0, 0) },
      uAtlasGrid: { value: new THREE.Vector2(GALLERY_ATLAS_COLUMNS, GALLERY_ATLAS_ROWS) },
      uLensStrength: { value: INVERTED_LENS_STRENGTH },
      uGridDensity: { value: GRID_DENSITY },
      uImageCount: { value: galleryImages.length },
      uGutter: { value: GUTTER_SIZE },
      uCornerRadius: { value: CORNER_RADIUS },
      uColorMode: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  }), [])

  useEffect(() => {
    const loader = new GalleryImageLoader(galleryImages)
    loaderRef.current = loader
    material.uniforms.uAtlas.value = loader.texture
    const unsubscribe = loader.subscribe(invalidate)
    loader.load()
    invalidate()
    return () => {
      unsubscribe()
      loader.dispose()
      loaderRef.current = null
      material.dispose()
      geometry.dispose()
    }
  }, [geometry, invalidate, material])

  useEffect(() => {
    material.uniforms.uColorMode.value = colorMode === "original" ? 1 : 0
    invalidate()
  }, [colorMode, invalidate, material])

  useEffect(() => {
    const stopX = offsetX.on("change", invalidate)
    const stopY = offsetY.on("change", invalidate)
    return () => { stopX(); stopY() }
  }, [invalidate, offsetX, offsetY])

  useFrame(() => {
    material.uniforms.uResolution.value.set(size.width, size.height)
    material.uniforms.uOffset.value.set(offsetX.get(), offsetY.get())
  })

  return (
    <mesh
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  )
}
