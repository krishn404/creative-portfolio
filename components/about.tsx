"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { Instrument_Serif } from "next/font/google"
import useSWR from "swr"
import type { WorkItem } from "@/lib/content"
import SpotifyGlassWidget from "@/components/spotify-glass-widget"

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
})

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Helper function to get image URL from work item
const getImageUrl = (work: WorkItem): string => {
  if (work.media && work.media.length > 0) {
    return work.media[0].url
  }
  return work.img
}

// Helper function to shuffle array and get random items
const getRandomItems = <T,>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// ✅ your exact positions
const POS = [
  { x: "-202%", y: "-15%", r: -2 },
  { x: "70%", y: "-62%", r: 1.5 },
  { x: "-200%", y: "-48%", r: -1.5 },
  { x: "64%", y: "-21%", r: 1 },
]

export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [hydrated, setHydrated] = useState(false)

  // Fetch works from API
  const { data, isLoading } = useSWR<{ works: WorkItem[] }>("/api/works", fetcher)
  
  // Get 4 random poster images
  const posterImages = useMemo(() => {
    if (!data?.works || data.works.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.log("About: No works data available", { data, isLoading })
      }
      return []
    }
    
    // Filter for Posters category (API already returns only published works)
    // Make category matching case-insensitive and handle variations
    const posters = data.works.filter((work) => {
      const category = work.category?.toLowerCase() || ""
      return category === "posters"
    })
    
    if (posters.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.log("About: No posters found", {
          totalWorks: data.works.length,
          categories: data.works.map(w => w.category),
        })
      }
      return []
    }
    
    // Get random posters (up to 4, or all if less than 4)
    const count = Math.min(4, posters.length)
    const randomPosters = getRandomItems(posters, count)
    
    const images = randomPosters.map((poster) => {
      const imageUrl = getImageUrl(poster)
      if (!imageUrl) {
        console.warn(`About: No image URL found for poster: ${poster.title}`, poster)
      }
      return {
        url: imageUrl,
        label: poster.title,
      }
    }).filter((poster) => poster.url) // Filter out any with missing URLs
    
    if (process.env.NODE_ENV === "development") {
      console.log("About: Selected poster images", { count: images.length, images })
    }
    
    return images
  }, [data, isLoading])

  useEffect(() => setHydrated(true), [])

  const { scrollYProgress } = useScroll({
    target: hydrated ? sectionRef : undefined,
    offset: ["start start", "end end"],
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.35,
  })

  /**
   * ✅ NO DEAD END:
   * last card ends at 1.00 exactly
   * so when last card exits -> section ends -> next section starts immediately
   */
  const showStart = 0.02

  const ranges: [number, number][] = [
    [showStart + 0.00, 0.55],
    [showStart + 0.08, 0.70],
    [showStart + 0.16, 0.85],
    [showStart + 0.24, 1.00], // ✅ last finishes at end of section
  ]

  const makeCardY = (range: [number, number]) =>
    useTransform(smoothProgress, range, ["110vh", "-130vh"])

  const makeCardO = (range: [number, number]) =>
    useTransform(
      smoothProgress,
      [range[0], range[0] + 0.04, range[1] - 0.04, range[1]],
      [0, 1, 1, 0]
    )

  const makeCardS = (range: [number, number]) =>
    useTransform(smoothProgress, [range[0], range[0] + 0.06], [0.92, 1])

  const cards = ranges.map((r) => ({
    y: makeCardY(r),
    o: makeCardO(r),
    s: makeCardS(r),
  }))

  return (
    <section
      ref={sectionRef}
      className="relative bg-background"
      style={{ height: "160vh" }} // ✅ shorter overall scroll
    >
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="relative z-10 max-w-5xl mx-auto text-center px-4 space-y-8">
          <div className="inline-block px-4 py-2 rounded-full bg-muted/50">
            <p className="text-sm sm:text-base font-light text-foreground">
              Hi, I am Krishna
            </p>
          </div>

          <section className="max-w-4xl mx-auto px-4">
  <h1
    className={`${instrumentSerif.className}
    text-4xl sm:text-5xl md:text-6xl
    font-semibold leading-tight text-foreground`}
  >
    I work in visuals across music, brands, and apparel.
  </h1>

  <p className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
    My work spans music covers, corporate visuals, and apparel including shirts,
    tees, and bottomwear, alongside freelance projects while managing all Design
    direction at
    <span className="text-foreground font-medium"> The BlackBombay House</span>.
    For major artworks and core visual direction I work primarily in
    <span className="inline-flex items-center gap-2 mx-1 px-3 py-1 rounded-full border border-border bg-background align-middle">
      <img src="/icons/photoshop.png" alt="Photoshop" className="w-4 h-4" />
      <span className="text-sm font-medium text-foreground">Photoshop</span>
    </span>
    and for structured design needs like corporate assets, carousels, and rapid
    layouts I rely on
    <span className="inline-flex items-center gap-2 mx-1 px-3 py-1 rounded-full border border-border bg-background align-middle">
      <img src="/icons/canva.png" alt="Canva" className="w-6 h-6" />
      <span className="text-sm font-medium text-foreground">Canva</span>
    </span>.
    Visually, my work operates between chaos and darker aesthetics, driven by raw
    textures and deliberate imperfection, while staying open to continuous
    experimentation.
  </p>
</section>


          {/* <div className="flex flex-wrap gap-3 justify-center">
            <span className="px-4 py-2 rounded-full bg-muted/50 text-sm">
              10+ Projects completed
            </span>
            <span className="px-4 py-2 rounded-full bg-muted/50 text-sm">
              3+ Years of Experience
            </span>
            <span className="px-4 py-2 rounded-full bg-muted/50 text-sm">
              Trusted by founders
            </span>
          </div> */}

          <div className="mt-8 max-w-md mx-auto">
            <SpotifyGlassWidget />
          </div>
        </div>

        <div className="absolute inset-0 z-20 pointer-events-none">
          {!isLoading && posterImages.length > 0 && posterImages.map((poster, i) => {
            // Safety check for POS array
            if (i >= POS.length) return null
            
            return (
              <motion.div
                key={poster.url || `poster-${i}`}
                className="absolute left-1/2 top-1/2"
                style={{
                  x: POS[i].x,
                  y: POS[i].y,
                  zIndex: 30 + i,
                }}
              >
                <motion.div
                  style={{
                    y: cards[i].y,
                    opacity: cards[i].o,
                    scale: cards[i].s,
                  }}
                >
                  <div
                    className="bg-white rounded-xl shadow-lg border border-border/20 overflow-hidden"
                    style={{
                      width: "clamp(150px, 14vw, 210px)",
                      rotate: `${POS[i].r}deg`,
                    }}
                  >
                    <div className="w-full aspect-square bg-muted overflow-hidden">
                      <img
                        src={poster.url}
                        alt={poster.label}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          console.error(`Failed to load image: ${poster.url}`)
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>

                    <div className="p-2 sm:p-3 bg-white">
                      <p className="text-[11px] sm:text-xs text-center text-foreground font-light tracking-wide">
                        {poster.label}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
