import * as THREE from "three"
import type { GalleryImage } from "@/src/data/gallery-images"

export const GALLERY_ATLAS_COLUMNS = 20
export const GALLERY_ATLAS_ROWS = 19
export const GALLERY_ATLAS_CELL = 160

/** One bounded Cloudinary-backed atlas for all 364 photographs. */
export class GalleryImageLoader {
  readonly canvas = document.createElement("canvas")
  readonly texture: THREE.CanvasTexture
  private readonly context: CanvasRenderingContext2D
  private queue: number[] = []
  private active = 0
  private activeImages = new Set<HTMLImageElement>()
  private disposed = false
  private listeners = new Set<() => void>()

  constructor(private readonly images: GalleryImage[], private readonly concurrency = 8) {
    this.canvas.width = GALLERY_ATLAS_COLUMNS * GALLERY_ATLAS_CELL
    this.canvas.height = GALLERY_ATLAS_ROWS * GALLERY_ATLAS_CELL
    const context = this.canvas.getContext("2d", { alpha: false })
    if (!context) throw new Error("Canvas 2D is unavailable")
    this.context = context
    context.fillStyle = "#0a0a0a"
    context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.texture = new THREE.CanvasTexture(this.canvas)
    // The fullscreen shader performs an explicit sRGB-to-linear conversion.
    this.texture.colorSpace = THREE.NoColorSpace
    this.texture.anisotropy = 2
    this.texture.generateMipmaps = false
    this.texture.minFilter = THREE.LinearFilter
    this.texture.magFilter = THREE.LinearFilter
    this.queue = this.visibleFirstOrder()
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  load() {
    this.pump()
  }

  dispose() {
    this.disposed = true
    this.queue = []
    this.activeImages.forEach((image) => {
      image.onload = null
      image.onerror = null
      image.src = ""
    })
    this.activeImages.clear()
    this.listeners.clear()
    this.texture.dispose()
  }

  private visibleFirstOrder() {
    const first: number[] = []
    const seen = new Set<number>()
    for (let radius = 0; radius <= 10; radius++) {
      for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
          if (Math.max(Math.abs(x), Math.abs(y)) !== radius) continue
          const index = ((x + y * 17) % this.images.length + this.images.length) % this.images.length
          if (!seen.has(index)) {
            seen.add(index)
            first.push(index)
          }
        }
      }
    }
    for (let index = 0; index < this.images.length; index++) {
      if (!seen.has(index)) first.push(index)
    }
    return first
  }

  private pump() {
    while (!this.disposed && this.active < this.concurrency && this.queue.length > 0) {
      const index = this.queue.shift()
      if (index !== undefined) this.loadImage(index)
    }
  }

  private loadImage(index: number) {
    const imageData = this.images[index]
    if (!imageData) return
    this.active += 1
    const image = new Image()
    this.activeImages.add(image)
    image.crossOrigin = "anonymous"
    image.decoding = "async"

    const finish = () => {
      image.onload = null
      image.onerror = null
      image.src = ""
      this.activeImages.delete(image)
      this.active -= 1
      this.listeners.forEach((listener) => listener())
      this.pump()
    }

    image.onload = () => {
      if (!this.disposed) this.paint(index, image)
      finish()
    }
    image.onerror = finish
    // Every delivery URL is generated from the Cloudinary manifest; no local path fallback.
    image.src = imageData.variants[320]
  }

  private paint(index: number, image: HTMLImageElement) {
    const x = (index % GALLERY_ATLAS_COLUMNS) * GALLERY_ATLAS_CELL
    const y = Math.floor(index / GALLERY_ATLAS_COLUMNS) * GALLERY_ATLAS_CELL
    const sourceRatio = image.naturalWidth / Math.max(image.naturalHeight, 1)
    const sourceWidth = sourceRatio > 1 ? image.naturalHeight : image.naturalWidth
    const sourceHeight = sourceRatio > 1 ? image.naturalHeight : image.naturalWidth
    const sourceX = (image.naturalWidth - sourceWidth) / 2
    const sourceY = (image.naturalHeight - sourceHeight) / 2
    this.context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, GALLERY_ATLAS_CELL, GALLERY_ATLAS_CELL)
    this.texture.needsUpdate = true
  }
}
