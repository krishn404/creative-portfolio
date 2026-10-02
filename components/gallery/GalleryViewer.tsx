"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowDownToLine, ArrowLeft, ArrowRight, X } from "lucide-react"
import type { GalleryImage } from "@/src/data/gallery-images"

type Props = { image: GalleryImage | null; index: number; total: number; onClose: () => void; onStep: (step: number) => void }

function FullResolutionImage({ image }: { image: GalleryImage }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  return (
    <div className="dome-viewer-image-wrap">
      {loading ? <span className="dome-viewer-loading" role="status">Loading full-resolution image…</span> : null}
      {error ? <span className="dome-viewer-loading" role="status">Couldn’t load this original image.</span> : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- Load the untransformed JPG only after an explicit image selection. */}
      <img src={image.src} alt={image.alt || `Photograph ${image.id}`} onLoad={() => setLoading(false)} onError={() => { setLoading(false); setError(true) }} />
    </div>
  )
}

export default function GalleryViewer({ image, index, total, onClose, onStep }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!image) return
    const previous = document.activeElement as HTMLElement | null
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (event.key === "ArrowRight") onStep(1)
      if (event.key === "ArrowLeft") onStep(-1)
      if (event.key === "Tab") {
        const controls = viewerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
        if (!controls?.length) return
        event.preventDefault()
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) last.focus()
        else if (!event.shiftKey && document.activeElement === last) first.focus()
        else if (document.activeElement === closeRef.current) (event.shiftKey ? controls[controls.length - 2] ?? first : first).focus()
      }
    }
    window.addEventListener("keydown", keydown)
    return () => {
      window.removeEventListener("keydown", keydown)
      document.body.style.overflow = oldOverflow
      previous?.focus()
    }
  }, [image, onClose, onStep])

  return (
    <AnimatePresence>
      {image ? (
        <motion.div ref={viewerRef} className="dome-viewer" role="dialog" aria-modal="true" aria-label={image.alt || `Photograph ${image.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" className="dome-viewer-backdrop" aria-label="Close photograph viewer" onClick={onClose} />
          <div className="dome-viewer-toolbar">
            <span>{String(index + 1).padStart(3, "0")} <span className="dome-viewer-count">/ {total}</span></span>
            <div>
              <a href={image.src} download aria-label="Download original JPG"><ArrowDownToLine size={17} /> <span>Original JPG</span></a>
              <button ref={closeRef} type="button" onClick={onClose} aria-label="Close viewer"><X size={19} /></button>
            </div>
          </div>
          <button type="button" className="dome-viewer-arrow dome-viewer-prev" aria-label="Previous photograph" onClick={() => onStep(-1)}><ArrowLeft /></button>
          <FullResolutionImage image={image} key={image.id} />
          <button type="button" className="dome-viewer-arrow dome-viewer-next" aria-label="Next photograph" onClick={() => onStep(1)}><ArrowRight /></button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
