"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
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

  const handlePrevious = () => {
    if (!selectedWork?.media) return
    setCarouselIndex((prev) => (prev === 0 ? selectedWork.media!.length - 1 : prev - 1))
  }

  const handleNext = () => {
    if (!selectedWork?.media) return
    setCarouselIndex((prev) => (prev === selectedWork.media!.length - 1 ? 0 : prev + 1))
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

          <div className="flex flex-wrap gap-2 md:gap-3 mb-6">
            {["All", "Posters", "Thumbnails", "Graphic Clothing"].map((cat) => (
              <motion.button
                key={cat}
                onClick={() => setCategory(cat as any)}
                className={`px-3 py-2 text-xs md:text-sm rounded-full border transition ${
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
                
                {/* Modal content with sleek animation */}
                <motion.div
                  className="fixed top-1/2 left-1/2 z-50 w-full max-w-5xl max-h-[95vh] -translate-x-1/2 -translate-y-1/2 p-0 bg-background/95 backdrop-blur-lg border-0 rounded-lg shadow-2xl overflow-hidden"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: [0.23, 1, 0.32, 1],
                    opacity: { duration: 0.3 }
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative w-full h-full flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 z-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
                      onClick={handleCloseModal}
                    >
                      <X className="w-5 h-5" />
                    </Button>

                    <div className="relative flex-1 flex items-center justify-center p-8">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={carouselIndex}
                          src={selectedWork.media?.[carouselIndex]?.url || selectedWork.img}
                          alt={`${selectedWork.title} - ${carouselIndex + 1}`}
                          className="max-w-full max-h-[70vh] object-contain rounded-lg"
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.3 }}
                        />
                      </AnimatePresence>

                      {selectedWork.media && selectedWork.media.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
                            onClick={handlePrevious}
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
                            onClick={handleNext}
                          >
                            <ChevronRight className="w-6 h-6" />
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="p-6 border-t border-border/50">
                      <div className="flex items-baseline justify-between mb-4">
                        <h3 className="text-2xl font-light tracking-wide">{selectedWork.title}</h3>
                        <p className="text-sm text-muted-foreground">{selectedWork.year}</p>
                      </div>

                      {selectedWork.media && selectedWork.media.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {selectedWork.media.map((asset, index) => (
                            <button
                              key={index}
                              onClick={() => setCarouselIndex(index)}
                              className={`relative w-16 h-16 rounded-md overflow-hidden border-2 transition flex-shrink-0 ${
                                carouselIndex === index ? "border-foreground" : "border-border/50 hover:border-border"
                              }`}
                            >
                              <img
                                src={asset.url || "/placeholder.svg"}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      {selectedWork.media && selectedWork.media.length > 1 && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          {carouselIndex + 1} / {selectedWork.media.length}
                        </p>
                      )}
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
