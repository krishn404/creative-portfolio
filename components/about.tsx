"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { Instrument_Serif } from "next/font/google"

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
})

const UNSPLASH = [
  "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1526481280695-3c687fd643ed?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=900&q=80",
]

// ✅ your exact positions
const POS = [
  { x: "-202%", y: "-15%", r: -2, label: "Toronto is home" },
  { x: "70%", y: "-62%", r: 1.5, label: "Coffee is my fuel" },
  { x: "-200%", y: "-48%", r: -1.5, label: "Design brain" },
  { x: "64%", y: "-21%", r: 1, label: "Late nights" },
]

export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => setHydrated(true), [])

  const { scrollYProgress } = useScroll({
    target: hydrated ? sectionRef : undefined,
    offset: ["start start", "end end"],
    layoutEffect: false,
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

          <h2
            className={`${instrumentSerif.className} text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-bold leading-tight text-foreground relative inline-block`}
          >
            <span className="relative">
              I’m someone who makes visual stuff like music covers, graphics for clothing,
              and designs for corporate social media pages. Most days I’m jumping between
              posters, layouts, typography, and color palettes, while doing basic video
              edits when something needs motion. Currently I’m into making chaotic, dark
              visuals with gritty textures, bold type, and a slightly raw vibe.
            </span>
          </h2>


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
        </div>

        <div className="absolute inset-0 z-20 pointer-events-none">
          {UNSPLASH.map((src, i) => (
            <motion.div
              key={src}
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
                    rotate: POS[i].r,
                  }}
                >
                  <div className="w-full aspect-square bg-muted overflow-hidden">
                    <img
                      src={src}
                      alt={POS[i].label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-2 sm:p-3 bg-white">
                    <p className="text-[11px] sm:text-xs text-center text-foreground font-light tracking-wide">
                      {POS[i].label}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
