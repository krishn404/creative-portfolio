"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { ImageIcon, X } from "lucide-react"
import {
  getCoverPreviewUrl,
  MAX_UPLOAD_BYTES,
  uploadFileToCloudinary,
} from "@/lib/cloudinary-upload"

type CoverImageUploadProps = {
  value?: string
  onChange: (url: string | undefined) => void
}

export function CoverImageUpload({ value, onChange }: CoverImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return

      setUploading(true)
      setError(null)
      try {
        const { secureUrl } = await uploadFileToCloudinary(file)
        onChange(secureUrl)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed")
      } finally {
        setUploading(false)
      }
    },
    [onChange],
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif"] },
    maxFiles: 1,
    maxSize: MAX_UPLOAD_BYTES,
    disabled: uploading,
    noKeyboard: true,
    onDropRejected: (rejections) => {
      const code = rejections[0]?.errors[0]?.code
      if (code === "file-too-large") {
        setError(`Image must be under ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB`)
        return
      }
      setError("Only image files are supported")
    },
  })

  return (
    <div className="space-y-2">
      <label className="blog-font-mono block text-[10px] tracking-wider text-[var(--text-secondary)]">
        COVER IMAGE
      </label>
      <input {...getInputProps()} className="sr-only" tabIndex={-1} />

      {value ? (
        <div className="relative border border-black bg-[var(--surface)]">
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <img
              src={getCoverPreviewUrl(value)}
              alt="Cover preview"
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="flex border-t border-black">
            <button
              type="button"
              onClick={open}
              disabled={uploading}
              className="blog-font-mono flex-1 px-3 py-2 text-[10px] tracking-wider hover:bg-black hover:text-white disabled:opacity-50"
            >
              {uploading ? "UPLOADING..." : "REPLACE"}
            </button>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              disabled={uploading}
              className="border-l border-black px-3 py-2 hover:bg-black hover:text-white disabled:opacity-50"
              aria-label="Remove cover image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`cursor-pointer border border-dashed border-black bg-[var(--surface)] p-8 text-center transition-colors ${
            isDragActive ? "bg-[var(--accent-neon)]/20" : "hover:bg-black/[0.03]"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <ImageIcon className="mx-auto mb-3 h-8 w-8 text-[var(--text-secondary)]" />
          <p className="blog-font-headline text-sm font-medium">
            {uploading ? "Uploading..." : isDragActive ? "Drop image here" : "Drop or click to upload"}
          </p>
          <p className="blog-font-mono mt-1 text-[9px] tracking-wider text-[var(--text-secondary)]">
            PNG, JPG, WEBP — max {MAX_UPLOAD_BYTES / (1024 * 1024)}MB
          </p>
        </div>
      )}

      {error && <p className="blog-font-mono text-xs text-red-600">// {error}</p>}
    </div>
  )
}
