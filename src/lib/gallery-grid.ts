import { galleryImages } from "@/src/data/gallery-images"

export const GRID_DENSITY = 6.4
export const INVERTED_LENS_STRENGTH = 0.58
export const GUTTER_SIZE = 0.055
export const CORNER_RADIUS = 0.11
export const IMAGE_STRIDE = 17

export function galleryIndexAtUv(uvX: number, uvY: number, width: number, height: number, offsetX: number, offsetY: number) {
  const aspect = width / Math.max(height, 1)
  const pX = (uvX - 0.5) * aspect
  const pY = uvY - 0.5
  const radius = Math.hypot(pX, pY)
  const warped = 1 / (1 + INVERTED_LENS_STRENGTH * radius * radius)
  const gridX = pX * warped * GRID_DENSITY + 0.5 + offsetX
  const gridY = pY * warped * GRID_DENSITY + 0.5 + offsetY
  const localX = ((gridX % 1) + 1) % 1
  const localY = ((gridY % 1) + 1) % 1
  if (localX < GUTTER_SIZE || localX > 1 - GUTTER_SIZE || localY < GUTTER_SIZE || localY > 1 - GUTTER_SIZE) return null
  const cellX = Math.floor(gridX)
  const cellY = Math.floor(gridY)
  return (((cellX + cellY * IMAGE_STRIDE) % galleryImages.length) + galleryImages.length) % galleryImages.length
}
