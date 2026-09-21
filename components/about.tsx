"use client"

import { Instrument_Serif } from "next/font/google"
import { motion, useReducedMotion } from "framer-motion"
import SpotifyGlassWidget from "@/components/spotify-glass-widget"
import LogoLoop, { type LogoItem } from "@/components/LogoLoop"

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
})

const headlineLines = [
  "I make visuals for things I care about music, film, culture, people, and the weird ideas that live somewhere in between.",
]

const disciplines = ["Posters", "Cover Art", "Campaigns", "Identity", "Visual Direction", "Writing"]

const workedFor: LogoItem[] = [
  { src: "/marquee/tbh.png", alt: "TBH", title: "TBH" },
  { src: "/marquee/bypolar.png", alt: "Bypolar", title: "Bypolar" },
  // { src: "/marquee/dl91.png", alt: "DL91", title: "DL91" },
  { src: "/marquee/montage.png", alt: "Montage", title: "Montage" },
  // { src: "/marquee/oriole.png", alt: "Oriole", title: "Oriole" },
]

export default function About() {
  const reduceMotion = useReducedMotion()

  return (
    <section aria-labelledby="about-statement" className="bg-background px-5 py-24 sm:px-6 sm:py-32 lg:px-12 lg:py-40">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-y-12 lg:grid-cols-12 lg:items-start lg:gap-x-10 lg:gap-y-6">
        <aside className="flex flex-col gap-10 lg:col-span-3 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-2">
          <div className="flex items-center gap-3 lg:block">
            <img
              src="/pfp.jpg"
              alt="Krishna Kant Maharshi"
              className="h-14 w-14 shrink-0 rounded-full object-cover lg:mb-4 lg:h-16 lg:w-16"
            />
            <div>
              <p className="text-base font-medium leading-tight text-foreground">Krishna</p>
              <p className="mt-1 max-w-48 text-sm leading-snug text-muted-foreground">
              Creative practitioner working in film, music, apparel, corporate and editorial.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">Now listening</p>
            <SpotifyGlassWidget />
          </div>
        </aside>

        <div className="lg:col-start-4 lg:col-span-9 lg:row-span-2 lg:max-w-[56.25rem]">
          <h2
            id="about-statement"
            className={`${instrumentSerif.className} text-[clamp(2.8rem,7vw,6rem)] leading-[0.99] tracking-[-0.02em] text-foreground`}
          >
            {headlineLines.map((line, index) => (
              <span key={line} className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.38, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h2>

          <div className="mt-8 flex flex-wrap gap-x-2 gap-y-1 text-base text-foreground/80 sm:text-lg">
            {disciplines.map((discipline, index) => (
              <a
                key={discipline}
                href="#selected-work"
                className="rounded-sm transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                {discipline}
                {index < disciplines.length - 1 && <span className="ml-2 text-muted-foreground">·</span>}
              </a>
            ))}
          </div>

          <p className="mt-12 max-w-[65ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            I build visual worlds for releases, campaigns, and people with something to say. The work moves between image-making, design, and direction. It is made to feel specific, immediate, and lived-in.
          </p>

          <div className="mt-12">
            <p className="mb-4 text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
              I have worked for
            </p>
            <div className="relative overflow-hidden">
              <LogoLoop
                logos={workedFor}
                speed={70}
                direction="left"
                logoHeight={64}
                gap={56}
                hoverSpeed={0}
                scaleOnHover
                fadeOut
                fadeOutColor="#ffffff"
                ariaLabel="People and teams I have worked for"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
