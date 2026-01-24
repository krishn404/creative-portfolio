"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useInView } from "react-intersection-observer"
import useSWR from "swr"
import { Instrument_Serif } from "next/font/google"
import type { WorkItem } from "@/lib/content"

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
})

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Position presets for polaroid cards (max 4)
const POLAROID_POSITIONS = [
  { posX: "-40%", posY: "-30%", rotation: -2 },
  { posX: "45%", posY: "-20%", rotation: 1.5 },
  { posX: "-35%", posY: "50%", rotation: -1.5 },
  { posX: "50%", posY: "55%", rotation: 1 },
]

export default function About() {
  const [isClient, setIsClient] = useState(false)
  const [containerTop, setContainerTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const { ref, inView } = useInView({ threshold: 0.1 })
  const { scrollY } = useScroll()

  // Fetch works marked for About section
  const { data: worksData } = useSWR<{ works: WorkItem[] }>("/api/works", fetcher)
  const aboutWorks = (worksData?.works ?? []).filter((w) => w.showInAbout).slice(0, 4)

  // Create all transforms at top level (max 4 items)
  const polaroid0Y = useTransform(scrollY, [containerTop + 200, containerTop + 600], [300, 0])
  const polaroid0Opacity = useTransform(scrollY, [containerTop + 100, containerTop + 400], [0, 1])
  const polaroid0Scale = useTransform(scrollY, [containerTop + 100, containerTop + 400], [0.7, 1])

  const polaroid1Y = useTransform(scrollY, [containerTop + 300, containerTop + 700], [300, 0])
  const polaroid1Opacity = useTransform(scrollY, [containerTop + 200, containerTop + 500], [0, 1])
  const polaroid1Scale = useTransform(scrollY, [containerTop + 200, containerTop + 500], [0.7, 1])

  const polaroid2Y = useTransform(scrollY, [containerTop + 400, containerTop + 800], [300, 0])
  const polaroid2Opacity = useTransform(scrollY, [containerTop + 300, containerTop + 600], [0, 1])
  const polaroid2Scale = useTransform(scrollY, [containerTop + 300, containerTop + 600], [0.7, 1])

  const polaroid3Y = useTransform(scrollY, [containerTop + 500, containerTop + 900], [300, 0])
  const polaroid3Opacity = useTransform(scrollY, [containerTop + 400, containerTop + 700], [0, 1])
  const polaroid3Scale = useTransform(scrollY, [containerTop + 400, containerTop + 700], [0.7, 1])

  const transforms = [
    { y: polaroid0Y, opacity: polaroid0Opacity, scale: polaroid0Scale },
    { y: polaroid1Y, opacity: polaroid1Opacity, scale: polaroid1Scale },
    { y: polaroid2Y, opacity: polaroid2Opacity, scale: polaroid2Scale },
    { y: polaroid3Y, opacity: polaroid3Opacity, scale: polaroid3Scale },
  ]

  useEffect(() => {
    setIsClient(true)
    if (containerRef.current) {
      setContainerTop(containerRef.current.offsetTop)
    }
  }, [])

  if (!isClient) return null

  return (
    <motion.section
      ref={(el) => {
        containerRef.current = el
        ref(el)
      }}
      className="relative min-h-[200vh] py-20 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-background transition-colors duration-300 overflow-hidden"
    >
      {/* Sticky centered content container */}
      <div className="sticky top-0 h-screen flex items-center justify-center">
        <motion.div
          className="max-w-3xl mx-auto text-center space-y-8 sm:space-y-12 z-20 pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Section label */}
          <motion.p
            className="text-xs sm:text-sm font-light tracking-[0.15em] text-muted-foreground uppercase"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
          >
            About Me
          </motion.p>

          {/* Main headline */}
          <motion.h2
            className={`${instrumentSerif.className} text-4xl sm:text-5xl md:text-6xl font-light leading-tight text-foreground`}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            I help creative brands build websites that feel trustworthy, look professional, and drive real business results
          </motion.h2>

          {/* Description text */}
          {/* <motion.div
            className="space-y-4 text-sm sm:text-base font-light text-foreground/70 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <p>Creative Head at The Blackbombay House with 3+ years of experience building visual stories.</p>
          </motion.div> */}

          {/* Credential badges */}
          {/* <motion.div
            className="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-12 pt-4"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground font-light">10+ Projects completed</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground font-light">3+ Years of Experience</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground font-light">Trusted by founders</p>
            </div>
          </motion.div> */}
        </motion.div>

        {/* Floating polaroid cards - dynamically loaded from selected works */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {aboutWorks.map((work, index) => {
            const position = POLAROID_POSITIONS[index]
            return (
              <motion.div
                key={work.id}
                className="absolute"
                style={{
                  left: position.posX,
                  top: position.posY,
                  y: transforms[index].y,
                  opacity: transforms[index].opacity,
                  scale: transforms[index].scale,
                }}
              >
                {/* Polaroid card */}
                <motion.div
                  className="bg-white rounded-sm shadow-xl overflow-hidden"
                  style={{
                    width: "220px",
                    rotate: position.rotation,
                  }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  {/* Image */}
                  <div className="w-full aspect-square overflow-hidden bg-muted">
                    <img
                      src={work.img || "/placeholder.svg"}
                      alt={work.title}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>

                  {/* Polaroid caption area */}
                  <div className="p-3 bg-white">
                    <p className="text-xs text-center text-foreground font-light tracking-wide">
                      {work.title}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.section>
  )
}
