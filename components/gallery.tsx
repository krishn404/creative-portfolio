"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import type { CSSProperties, WheelEvent } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import useSWR from "swr"
import { ArrowLeft, ArrowRight, Minus, Plus, X } from "lucide-react"
import type { MediaAsset, WorkItem } from "@/lib/content"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const categories = ["All", "Posters", "Thumbnails", "Graphic Clothing"] as const
type Category = (typeof categories)[number]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const getWorkMedia = (work: WorkItem): MediaAsset[] => {
  const media = work.media?.filter((asset) => asset.type === "image" && asset.url) ?? []
  if (media.length > 0) {
    return [...media].sort((a, b) => a.order - b.order)
  }
  return work.img ? [{ url: work.img, type: "image", order: 0 }] : []
}

const getCloudinaryPlaceholder = (url: string) => {
  if (!url.includes("/upload/")) return url
  return url.replace("/upload/", "/upload/f_auto,q_10,w_96,e_blur:800/")
}

function ProgressiveImage({
  src,
  alt,
  className,
  imgClassName,
  imageStyle,
  priority = false,
  onClick,
  onWheel,
  draggable = false,
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  imageStyle?: CSSProperties
  priority?: boolean
  onClick?: () => void
  onWheel?: (event: WheelEvent<HTMLDivElement>) => void
  draggable?: boolean
}) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
  }, [src])

  return (
    <div className={`relative overflow-hidden bg-muted ${className ?? ""}`} onClick={onClick} onWheel={onWheel}>
      <img
        src={getCloudinaryPlaceholder(src)}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full scale-110 object-cover blur-2xl transition-opacity duration-300 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-br from-muted via-muted/70 to-background/10 transition-opacity duration-300 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
      />
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={draggable}
        onLoad={() => setLoaded(true)}
        style={imageStyle}
        className={`relative h-full w-full transition duration-500 ${loaded ? "opacity-100" : "opacity-0"} ${
          imgClassName ?? "object-cover"
        }`}
      />
    </div>
  )
}

export default function Gallery() {
  const { data, isLoading } = useSWR<{ works: WorkItem[] }>("/api/works", fetcher)
  const works = data?.works || []
  const [category, setCategory] = useState<Category>("All")
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null)
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [hoveredWorkId, setHoveredWorkId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [isHydrated, setIsHydrated] = useState(false)
  const scrollPositionRef = useRef(0)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const filtered = useMemo(
    () => (category === "All" ? works : works.filter((work: WorkItem) => work.category === category)),
    [category, works],
  )

  const selectedWork = useMemo(
    () => filtered.find((work) => work.id === selectedWorkId) ?? works.find((work) => work.id === selectedWorkId) ?? null,
    [filtered, selectedWorkId, works],
  )

  const selectedMedia = useMemo(() => (selectedWork ? getWorkMedia(selectedWork) : []), [selectedWork])

  const getDisplayMedia = (work: WorkItem, isHovered: boolean): string => {
    const media = getWorkMedia(work)
    if (isHovered && media.length > 1) {
      return media[1].url
    }
    return media[0]?.url || work.img
  }

  const getWorkNumber = useCallback(
    (work: WorkItem): number => {
      const index = filtered.findIndex((item) => item.id === work.id)
      return index >= 0 ? index + 1 : works.findIndex((item) => item.id === work.id) + 1
    },
    [filtered, works],
  )

  const resetViewerState = useCallback(() => {
    setActiveMediaIndex(0)
    setZoom(1)
  }, [])

  const closeModalState = useCallback(() => {
    setSelectedWorkId(null)
    resetViewerState()
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current)
    })
  }, [resetViewerState])

  const openWork = useCallback(
    (work: WorkItem, index = 0) => {
      scrollPositionRef.current = window.scrollY
      setSelectedWorkId(work.id)
      setActiveMediaIndex(index)
      setZoom(1)
      window.history.pushState({ galleryModal: true, workId: work.id }, "", `#work-${work.id}`)
    },
    [],
  )

  const closeWork = useCallback(() => {
    if (window.history.state?.galleryModal) {
      window.history.back()
      return
    }
    closeModalState()
  }, [closeModalState])

  const goToMedia = useCallback(
    (index: number) => {
      if (!selectedMedia.length) return
      setActiveMediaIndex((index + selectedMedia.length) % selectedMedia.length)
      setZoom(1)
    },
    [selectedMedia.length],
  )

  const goToNextMedia = useCallback(() => {
    if (selectedMedia.length <= 1) return
    goToMedia(activeMediaIndex + 1)
  }, [activeMediaIndex, goToMedia, selectedMedia.length])

  const goToPreviousMedia = useCallback(() => {
    if (selectedMedia.length <= 1) return
    goToMedia(activeMediaIndex - 1)
  }, [activeMediaIndex, goToMedia, selectedMedia.length])

  useEffect(() => {
    if (!selectedWork) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.body.classList.add("hide-page-blur")

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        closeWork()
      }

      if (event.key === "ArrowRight") {
        event.preventDefault()
        goToNextMedia()
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault()
        goToPreviousMedia()
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault()
        setZoom((current) => clamp(Number((current + 0.25).toFixed(2)), 1, 3))
      }

      if (event.key === "-") {
        event.preventDefault()
        setZoom((current) => clamp(Number((current - 0.25).toFixed(2)), 1, 3))
      }
    }

    const handlePopState = () => {
      closeModalState()
    }

    document.addEventListener("keydown", handleKeyDown)
    window.addEventListener("popstate", handlePopState)

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.classList.remove("hide-page-blur")
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [closeModalState, closeWork, goToNextMedia, goToPreviousMedia, selectedWork])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.23, 1, 0.82, 1] as const,
      },
    },
  }

  return (
    <>
      <section ref={ref} className="min-h-screen bg-background px-4 py-12 transition-colors duration-300 md:py-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            className="mb-10 space-y-3 md:mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs font-light uppercase tracking-widest text-muted-foreground">Selected works</p>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-light tracking-tight text-foreground md:text-4xl lg:text-5xl">
                  Poster Collection
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                  Browse the work without leaving the page. Open any project for a full viewer, keyboard navigation, and
                  inline details.
                </p>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "project" : "projects"}
              </p>
            </div>
          </motion.div>

          <div className="mb-8 flex flex-wrap gap-2.5">
            {categories.map((cat) => (
              <motion.button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full border px-4 py-2 text-xs transition sm:text-sm ${
                  category === cat
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-foreground hover:border-foreground/40 hover:bg-muted/50"
                }`}
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -2 }}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Loading works...</p>
          ) : (
            <motion.div
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
            >
              {filtered.length === 0 ? (
                <p className="col-span-full text-muted-foreground">No works yet. Check back soon.</p>
              ) : (
                filtered.map((work: WorkItem) => (
                  <motion.button
                    key={work.id}
                    type="button"
                    variants={itemVariants}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className="group cursor-pointer text-left"
                    onClick={() => openWork(work)}
                    onMouseEnter={() => setHoveredWorkId(work.id)}
                    onMouseLeave={() => setHoveredWorkId(null)}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-500 group-hover:shadow-lg">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={hoveredWorkId === work.id ? "hover" : "default"}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.35 }}
                          className="absolute inset-0"
                        >
                          <ProgressiveImage
                            src={getDisplayMedia(work, hoveredWorkId === work.id)}
                            alt={work.title}
                            priority={false}
                            className="h-full w-full"
                            imgClassName="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                          />
                        </motion.div>
                      </AnimatePresence>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/75">
                            {work.category ?? "Selected Work"}
                          </p>
                          <h3 className="mt-1 line-clamp-1 text-base font-medium text-white">{work.title}</h3>
                        </div>
                        {work.year ? <p className="shrink-0 text-sm text-white/85">{work.year}</p> : null}
                      </div>

                      {getWorkMedia(work).length > 1 ? (
                        <div className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
                          {getWorkMedia(work).length} images
                        </div>
                      ) : null}
                    </div>
                  </motion.button>
                ))
              )}
            </motion.div>
          )}
        </div>
      </section>

      {isHydrated &&
        typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selectedWork ? (
              <>
                <motion.button
                  type="button"
                  aria-label="Close work overlay"
                  className="fixed inset-0 z-[110] bg-black/55"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  onClick={closeWork}
                />

                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label={selectedWork.title}
                  className="fixed inset-0 z-[120] p-3 md:p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                >
                  <div
                    className="flex h-full flex-col overflow-hidden rounded-[28px] border border-border/70 bg-background shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 md:px-6">
                      <button
                        type="button"
                        onClick={closeWork}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>

                      <div className="hidden text-center md:block">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Open Work</p>
                        <p className="text-sm text-foreground">
                          {activeMediaIndex + 1} / {Math.max(selectedMedia.length, 1)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={closeWork}
                        aria-label="Close modal"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-muted"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
                      <aside className="overflow-y-auto border-b border-border/70 bg-card/60 p-5 lg:border-b-0 lg:border-r lg:p-6">
                        <div className="space-y-6 lg:sticky lg:top-0">
                          <div className="space-y-3">
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                              Work {String(getWorkNumber(selectedWork)).padStart(2, "0")}
                            </p>
                            <div className="space-y-2">
                              <h3 className="text-2xl font-light tracking-tight text-foreground">{selectedWork.title}</h3>
                              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                {selectedWork.year ? <span>{selectedWork.year}</span> : null}
                                {selectedWork.category ? <span>{selectedWork.category}</span> : null}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Gallery</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedMedia.length} {selectedMedia.length === 1 ? "image" : "images"}
                              </p>
                            </div>
                            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-3">
                              {selectedMedia.map((asset, index) => (
                                <button
                                  key={`${asset.url}-${index}`}
                                  type="button"
                                  onClick={() => goToMedia(index)}
                                  className={`overflow-hidden rounded-xl border transition ${
                                    index === activeMediaIndex
                                      ? "border-foreground shadow-md"
                                      : "border-border hover:border-foreground/40"
                                  }`}
                                >
                                  <ProgressiveImage
                                    src={asset.url}
                                    alt={`${selectedWork.title} thumbnail ${index + 1}`}
                                    className="aspect-square"
                                    imgClassName="h-full w-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </aside>

                      <div className="relative flex min-h-0 flex-col bg-muted/20">
                        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 md:px-6">
                          <div className="text-sm text-muted-foreground">
                            {selectedMedia.length > 1 ? "Use arrows, swipe, or thumbnails to navigate." : "Single artwork view."}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setZoom((current) => clamp(Number((current - 0.25).toFixed(2)), 1, 3))}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background transition hover:bg-muted"
                              aria-label="Zoom out"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <div className="min-w-14 text-center text-sm text-foreground">{Math.round(zoom * 100)}%</div>
                            <button
                              type="button"
                              onClick={() => setZoom((current) => clamp(Number((current + 0.25).toFixed(2)), 1, 3))}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background transition hover:bg-muted"
                              aria-label="Zoom in"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="relative min-h-0 flex-1">
                          {selectedMedia.length > 1 ? (
                            <>
                              <button
                                type="button"
                                onClick={goToPreviousMedia}
                                className="absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60"
                                aria-label="Previous image"
                              >
                                <ArrowLeft className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                onClick={goToNextMedia}
                                className="absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60"
                                aria-label="Next image"
                              >
                                <ArrowRight className="h-5 w-5" />
                              </button>
                            </>
                          ) : null}

                          <div
                            className="flex h-full items-center justify-center overflow-auto p-4 md:p-8"
                            onTouchStart={(event) => {
                              const touch = event.touches[0]
                              touchStartRef.current = { x: touch.clientX, y: touch.clientY }
                            }}
                            onTouchEnd={(event) => {
                              const start = touchStartRef.current
                              if (!start) return
                              const touch = event.changedTouches[0]
                              const deltaX = touch.clientX - start.x
                              const deltaY = touch.clientY - start.y
                              if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
                                if (deltaX < 0) goToNextMedia()
                                if (deltaX > 0) goToPreviousMedia()
                              }
                              touchStartRef.current = null
                            }}
                          >
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={selectedMedia[activeMediaIndex]?.url ?? selectedWork.img}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.22 }}
                                className="flex h-full w-full items-center justify-center"
                              >
                                <ProgressiveImage
                                  src={selectedMedia[activeMediaIndex]?.url ?? selectedWork.img}
                                  alt={`${selectedWork.title} image ${activeMediaIndex + 1}`}
                                  className="flex max-h-full w-full items-center justify-center rounded-2xl"
                                  imgClassName="mx-auto max-h-full w-auto max-w-full object-contain transition-transform duration-200"
                                  imageStyle={{ transform: `scale(${zoom})` }}
                                  onClick={() => setZoom((current) => (current > 1 ? 1 : 2))}
                                  onWheel={(event) => {
                                    event.preventDefault()
                                    const direction = event.deltaY > 0 ? -0.2 : 0.2
                                    setZoom((current) => clamp(Number((current + direction).toFixed(2)), 1, 3))
                                  }}
                                />
                              </motion.div>
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            ) : null}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}
