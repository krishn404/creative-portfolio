"use client"

import { useCallback, useRef, useState, type SyntheticEvent } from "react"
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { COVER_ASPECT, cropImageToBlob } from "@/lib/blog/cover-crop"

type CoverImageCropEditorProps = {
  imageSrc: string
  fileName?: string
  onConfirm: (file: File) => void
  onCancel: () => void
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      COVER_ASPECT,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function CoverImageCropEditor({
  imageSrc,
  fileName = "cover.jpg",
  onConfirm,
  onCancel,
}: CoverImageCropEditorProps) {
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onImageLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = event.currentTarget
    imageRef.current = event.currentTarget
    setCrop(centerAspectCrop(width, height))
  }, [])

  async function handleConfirm() {
    const image = imageRef.current
    if (!image || !completedCrop?.width || !completedCrop?.height) {
      setError("Select a crop area first")
      return
    }

    setProcessing(true)
    setError(null)
    try {
      const blob = await cropImageToBlob(image, completedCrop)
      const extension = blob.type === "image/png" ? "png" : "jpg"
      const file = new File([blob], fileName.replace(/\.[^.]+$/, `.${extension}`), {
        type: blob.type,
      })
      onConfirm(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to crop image")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-black bg-[var(--surface)] shadow-lg">
        <div className="border-b border-black px-4 py-3">
          <h2 className="blog-font-headline text-lg font-medium">Crop cover image</h2>
          <p className="blog-font-mono mt-1 text-[10px] tracking-wider text-[var(--text-secondary)]">
            16:9 ASPECT — DRAG TO REPOSITION
          </p>
        </div>

        <div className="p-4">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
            aspect={COVER_ASPECT}
            className="mx-auto max-h-[55vh] w-full"
          >
            <img
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-h-[55vh] w-full object-contain"
              crossOrigin="anonymous"
            />
          </ReactCrop>

          {error && (
            <p className="blog-font-mono mt-3 text-xs text-red-600" role="alert">
              // {error}
            </p>
          )}
        </div>

        <div className="flex border-t border-black">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="blog-font-mono flex-1 px-4 py-3 text-[10px] tracking-wider hover:bg-black/[0.03] disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing}
            className="blog-font-headline flex-1 border-l border-black bg-black px-4 py-3 text-sm font-medium text-white hover:bg-[var(--accent-neon)] hover:text-black disabled:opacity-50"
          >
            {processing ? "PROCESSING..." : "APPLY CROP"}
          </button>
        </div>
      </div>
    </div>
  )
}
