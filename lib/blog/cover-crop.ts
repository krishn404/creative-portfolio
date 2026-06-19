import type { PixelCrop } from "react-image-crop"

export const COVER_ASPECT = 16 / 9

export type CoverCrop = {
  x: number
  y: number
  width: number
  height: number
}

export function pixelCropToRelative(
  crop: PixelCrop,
  imageWidth: number,
  imageHeight: number,
): CoverCrop {
  return {
    x: crop.x / imageWidth,
    y: crop.y / imageHeight,
    width: crop.width / imageWidth,
    height: crop.height / imageHeight,
  }
}

export function relativeCropToPixel(
  crop: CoverCrop,
  imageWidth: number,
  imageHeight: number,
): PixelCrop {
  return {
    unit: "px",
    x: Math.round(crop.x * imageWidth),
    y: Math.round(crop.y * imageHeight),
    width: Math.round(crop.width * imageWidth),
    height: Math.round(crop.height * imageHeight),
  }
}

export async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to load image for cropping"))
    image.src = src
  })
}

export async function cropImageToBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  mimeType = "image/jpeg",
  quality = 0.92,
): Promise<Blob> {
  const canvas = document.createElement("canvas")
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  canvas.width = Math.round(crop.width * scaleX)
  canvas.height = Math.round(crop.height * scaleY)

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is not supported")

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export cropped image"))
          return
        }
        resolve(blob)
      },
      mimeType,
      quality,
    )
  })
}

export function coverCropToObjectPosition(crop: CoverCrop): string {
  const centerX = (crop.x + crop.width / 2) * 100
  const centerY = (crop.y + crop.height / 2) * 100
  return `${centerX}% ${centerY}%`
}

export function coverCropToBackgroundSize(crop: CoverCrop): string {
  const widthPercent = (1 / crop.width) * 100
  const heightPercent = (1 / crop.height) * 100
  return `${widthPercent}% ${heightPercent}%`
}
