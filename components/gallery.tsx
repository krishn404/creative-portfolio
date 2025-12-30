"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { WorkItem } from "@/lib/content"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function Gallery() {
  const { data, isLoading } = useSWR<{ works: WorkItem[] }>("/api/works", fetcher)
  const works = data?.works || []
  const [category, setCategory] = useState<"All" | "Posters" | "Thumbnails" | "Graphic Clothing">("All")
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [hoveredWorkId, setHoveredWorkId] = useState<string | null>(null)

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const filtered = category === "All" ? works : works.filter((w: WorkItem) => w.category === category)

  const getDisplayMedia = (work: WorkItem, isHovered: boolean): string => {
    const media = work.media || [{ url: work.img, type: "image" as const, order: 0 }]
    if (isHovered && media.length > 1) {
      return media[1].url
    }
    return media[0]?.url || work.img
  }

  const handleWorkClick = (work: WorkItem) => {
    setSelectedWork(work)
    setCarouselIndex(0)
  }

  const handleCloseModal = useCallback(() => {
    setSelectedWork(null)
    setCarouselIndex(0)
  }, [])

  // Prevent body scroll and handle ESC key when modal is open
  useEffect(() => {
    if (selectedWork) {
      document.body.style.overflow = "hidden"
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          handleCloseModal()
        }
      }
      document.addEventListener("keydown", handleEscape)
      return () => {
        document.body.style.overflow = ""
        document.removeEventListener("keydown", handleEscape)
      }
    }
  }, [selectedWork, handleCloseModal])

  // Get the index of the selected work in the filtered list for numbering
  const getWorkNumber = (work: WorkItem): number => {
    const filtered = category === "All" ? works : works.filter((w: WorkItem) => w.category === category)
    return filtered.findIndex((w) => w.id === work.id) + 1
  }

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
      <section ref={ref} className="min-h-screen py-12 md:py-20 px-4 bg-background transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs font-light tracking-widest uppercase text-muted-foreground mb-2">Selected works</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-foreground">
              Poster Collection
            </h2>
          </motion.div>

          <div className="flex flex-wrap gap-2 sm:gap-2.5 md:gap-3 mb-6">
            {["All", "Posters", "Thumbnails", "Graphic Clothing"].map((cat) => (
              <motion.button
                key={cat}
                onClick={() => setCategory(cat as any)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs md:text-sm rounded-full border transition ${
                  category === cat
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-foreground hover:border-foreground/40"
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
              variants={containerVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
            >
              {filtered.length === 0 ? (
                <p className="text-muted-foreground col-span-full">No works yet. Check back soon.</p>
              ) : (
                filtered.map((poster: WorkItem) => (
                  <motion.div
                    key={poster.id}
                    variants={itemVariants}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className="group cursor-pointer"
                    onClick={() => handleWorkClick(poster)}
                    onMouseEnter={() => setHoveredWorkId(poster.id)}
                    onMouseLeave={() => setHoveredWorkId(null)}
                  >
                    <div className="aspect-square rounded-sm shadow-sm border border-border overflow-hidden transition-shadow duration-500 group-hover:shadow-md relative">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={hoveredWorkId === poster.id ? "hover" : "default"}
                          src={getDisplayMedia(poster, hoveredWorkId === poster.id)}
                          alt={poster.title}
                          className="w-full h-full object-cover"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4 }}
                        />
                      </AnimatePresence>

                      <motion.div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500" />

                      {poster.media && poster.media.length > 1 && (
                        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                          {poster.media.length} items
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex justify-between items-baseline gap-2">
                      <h3 className="text-sm font-light tracking-wide text-foreground line-clamp-1">{poster.title}</h3>
                      <p className="text-xs text-muted-foreground shrink-0">{poster.year}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </div>
      </section>

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selectedWork && (
              <>
                {/* Custom overlay with complete blur */}
                <motion.div
                  className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  onClick={handleCloseModal}
                />
                
                {/* Modal content - Reference UI layout */}
                <motion.div
                  className="fixed inset-0 z-50 w-full h-full bg-background overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative w-full h-full grid grid-cols-1 lg:grid-cols-2">
                    {/* Left Column - Post Number, Description */}
                    <div className="relative bg-background flex flex-col p-6 sm:p-8 md:p-12 lg:p-16">
                      {/* Post Number - Top Left */}
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mb-auto"
                      >
                        <p className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-serif text-foreground/20 leading-none">
                          {getWorkNumber(selectedWork)}
                        </p>
                      </motion.div>

                      {/* Description Section - Bottom Left */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mt-auto space-y-4 sm:space-y-6"
                      >
                        <div className="space-y-2">
                          <h2 className="text-xl sm:text-2xl md:text-3xl font-light tracking-wide text-foreground">
                            {selectedWork.title}
                          </h2>
                          {selectedWork.year && (
                            <p className="text-sm sm:text-base text-muted-foreground font-light">
                              {selectedWork.year}
                            </p>
                          )}
                          {selectedWork.category && (
                            <p className="text-xs sm:text-sm text-muted-foreground font-light uppercase tracking-wider">
                              {selectedWork.category}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    </div>

                    {/* Right Column - Image Gallery */}
                    <div className="relative bg-muted/30 overflow-y-auto">
                      {/* Analog Close Button - Top Center (Reference Style) */}
                      <motion.button
                        onClick={handleCloseModal}
                        className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 z-20 px-6 py-2 text-xs sm:text-sm font-light tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground transition-all duration-200"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ opacity: 1 }}
                      >
                        Close
                      </motion.button>

                      {/* Image Gallery Grid */}
                      <div className="p-6 sm:p-8 md:p-12 lg:p-16 pt-20 sm:pt-24">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          {selectedWork.media && selectedWork.media.length > 0 ? (
                            selectedWork.media.map((asset, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.1 * index, ease: [0.23, 1, 0.32, 1] }}
                                className="relative group cursor-pointer"
                                onClick={() => {
                                  // Optional: Open image in fullscreen or lightbox
                                  window.open(asset.url, "_blank")
                                }}
                              >
                                <div className="aspect-square sm:aspect-[4/5] overflow-hidden bg-muted border border-border/30 hover:border-foreground/40 transition-colors duration-300">
                                  <img
                                    src={asset.url || selectedWork.img}
                                    alt={`${selectedWork.title} - ${index + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                  />
                                </div>
                                {selectedWork.media && selectedWork.media.length > 1 && (
                                  <div className="absolute top-2 right-2 bg-background/95 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-light text-muted-foreground border border-border/50">
                                    {index + 1}/{selectedWork.media.length}
                                  </div>
                                )}
                              </motion.div>
                            ))
                          ) : (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="aspect-square sm:aspect-[4/5] overflow-hidden bg-muted border border-border/30"
                            >
                              <img
                                src={selectedWork.img}
                                alt={selectedWork.title}
                                className="w-full h-full object-cover"
                              />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
