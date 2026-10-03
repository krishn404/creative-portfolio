"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { useMotionValue, useReducedMotion, useSpring } from "framer-motion"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Move } from "lucide-react"
import { galleryImages } from "@/src/data/gallery-images"
import GalleryFallback from "./GalleryFallback"
import GalleryViewer from "./GalleryViewer"
import { galleryIndexAtUv } from "@/src/lib/gallery-grid"

const GalleryCanvas = dynamic(() => import("./GalleryCanvas"), { ssr: false, loading: () => <div className="dome-canvas-loading" /> })
const mod = (value: number, length: number) => ((value % length) + length) % length

export default function DomeGallery() {
  const reducedMotion = useReducedMotion()
  const targetX = useMotionValue(0)
  const targetY = useMotionValue(0)
  const offsetX = useSpring(targetX, { stiffness: reducedMotion ? 300 : 105, damping: 23, mass: 0.5 })
  const offsetY = useSpring(targetY, { stiffness: reducedMotion ? 300 : 105, damping: 23, mass: 0.5 })
  const stageRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ pointerId: number; x: number; y: number; lastTime: number } | null>(null)
  const ignoreClick = useRef(false)
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [colorMode, setColorMode] = useState<"inverted" | "original">("inverted")

  useEffect(() => {
    const probe = document.createElement("canvas")
    const context = probe.getContext("webgl2", { failIfMajorPerformanceCaveat: true })
    if (context) context.getExtension("WEBGL_lose_context")?.loseContext()
    const supported = Boolean(context)
    requestAnimationFrame(() => setWebglSupported(supported))
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    let detach: (() => void) | null = null
    const attach = () => {
      const canvas = stage.querySelector("canvas")
      if (!canvas || detach) return
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === "mouse") return
      drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, lastTime: performance.now() }
      canvas.setPointerCapture(event.pointerId)
      setDragging(true)
    }
    const onMove = (event: PointerEvent) => {
      const current = drag.current
      if (!current || current.pointerId !== event.pointerId) return
      const dx = event.clientX - current.x
      const dy = event.clientY - current.y
      if (Math.abs(dx) + Math.abs(dy) > 3) ignoreClick.current = true
      const columns = window.innerWidth < 700 ? 7 : 11
      const rows = window.innerWidth < 700 ? 5 : 7
      targetX.set(targetX.get() - dx / Math.max(80, stage.clientWidth / columns))
      targetY.set(targetY.get() - dy / Math.max(80, stage.clientHeight / rows))
      current.x = event.clientX
      current.y = event.clientY
      current.lastTime = performance.now()
    }
    const onUp = (event: PointerEvent) => {
      if (drag.current?.pointerId !== event.pointerId) return
      drag.current = null
      setDragging(false)
      if (ignoreClick.current) window.setTimeout(() => { ignoreClick.current = false }, 80)
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const columns = window.innerWidth < 700 ? 7 : 11
      const rows = window.innerWidth < 700 ? 5 : 7
      targetX.set(targetX.get() + (event.deltaX + (event.shiftKey ? event.deltaY : 0)) / Math.max(80, stage.clientWidth / columns))
      if (!event.shiftKey) targetY.set(targetY.get() - event.deltaY / Math.max(80, stage.clientHeight / rows))
    }
    const onClick = (event: MouseEvent) => {
      if (ignoreClick.current) return
      const rect = canvas.getBoundingClientRect()
      const index = galleryIndexAtUv(
        (event.clientX - rect.left) / rect.width,
        1 - (event.clientY - rect.top) / rect.height,
        rect.width,
        rect.height,
        offsetX.get(),
        offsetY.get(),
      )
      if (index !== null) setSelectedIndex(index)
    }
    canvas.addEventListener("pointerdown", onDown)
    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerup", onUp)
    canvas.addEventListener("pointercancel", onUp)
    canvas.addEventListener("click", onClick)
    stage.addEventListener("wheel", onWheel, { passive: false })
      detach = () => {
      canvas.removeEventListener("pointerdown", onDown)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerup", onUp)
      canvas.removeEventListener("pointercancel", onUp)
      canvas.removeEventListener("click", onClick)
      stage.removeEventListener("wheel", onWheel)
      }
    }
    const observer = new MutationObserver(attach)
    observer.observe(stage, { childList: true, subtree: true })
    attach()
    return () => { observer.disconnect(); detach?.() }
  }, [targetX, targetY, offsetX, offsetY, webglSupported])

  const closeViewer = useCallback(() => setSelectedIndex(null), [])
  const stepViewer = useCallback((step: number) => setSelectedIndex((index) => index === null ? null : mod(index + step, galleryImages.length)), [])
  const nudge = (dx: number, dy: number) => {
    targetX.set(targetX.get() + dx)
    targetY.set(targetY.get() + dy)
  }

  const selected = selectedIndex === null ? null : galleryImages[selectedIndex]

  return (
    <main className="dome-page">
      <section className={`dome-stage ${dragging ? "is-dragging" : ""}`} ref={stageRef} aria-label={`Interactive ${galleryImages.length}-photograph dome gallery`} tabIndex={0} onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        if (event.key === "ArrowLeft") { event.preventDefault(); nudge(-1, 0) }
        if (event.key === "ArrowRight") { event.preventDefault(); nudge(1, 0) }
        if (event.key === "ArrowUp") { event.preventDefault(); nudge(0, -1) }
        if (event.key === "ArrowDown") { event.preventDefault(); nudge(0, 1) }
      }}>
        <header className="dome-header">
          <Link className="dome-brand" href="/" aria-label="Return to portfolio">PSYX<span> / IMAGE STUDIES</span></Link>
          <span className="dome-collection">COLLECTION 01 <i>·</i> {365} FRAMES</span>
          <button
            type="button"
            className={`dome-color-toggle ${colorMode === "original" ? "is-original" : ""}`}
            aria-pressed={colorMode === "original"}
            aria-label={`Switch to ${colorMode === "inverted" ? "original color" : "inverted grayscale"} mode`}
            onClick={() => setColorMode((mode) => mode === "inverted" ? "original" : "inverted")}
          >
            <span className="dome-color-swatch" aria-hidden="true" />
            {colorMode === "inverted" ? "INVERTED" : "ORIGINAL COLOR"}
          </button>
          <Link className="dome-back-link" href="/#selected-work">PORTFOLIO ↗</Link>
        </header>
        {webglSupported === false ? <GalleryFallback /> : webglSupported === true ? <GalleryCanvas offsetX={offsetX} offsetY={offsetY} colorMode={colorMode} /> : <div className="dome-canvas-loading" role="status">Preparing the gallery…</div>}
        <div className="dome-stage-vignette" aria-hidden="true" />
        <span className="dome-counter">{String(galleryImages.length).padStart(3, "0")} <span>PHOTOGRAPHS</span></span>
        <div className="dome-controls" aria-label="Move through gallery">
          <button type="button" aria-label="Move left" onClick={() => nudge(-1, 0)}><ArrowLeft size={16} /></button>
          <button type="button" aria-label="Move up" onClick={() => nudge(0, -1)}><ArrowUp size={16} /></button>
          <button type="button" aria-label="Move down" onClick={() => nudge(0, 1)}><ArrowDown size={16} /></button>
          <button type="button" aria-label="Move right" onClick={() => nudge(1, 0)}><ArrowRight size={16} /></button>
        </div>
        <div className="dome-drag-hint" aria-live="polite"><Move size={14} /> DRAG TO WANDER <span>·</span> SCROLL TO DRIFT</div>
      </section>
      <GalleryViewer image={selected} index={selectedIndex ?? 0} total={galleryImages.length} onClose={closeViewer} onStep={stepViewer} />
    </main>
  )
}
