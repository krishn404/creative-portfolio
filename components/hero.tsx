"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import localFont from "next/font/local"
import { Share_Tech_Mono } from "next/font/google"
import { useEffect, useState } from "react"
import ElasticMesh from "@/components/ElasticMesh"
import {
  HERO_ARTWORK_START_DELAY,
  HERO_LABEL_DURATION,
  HERO_LABEL_START_DELAY,
  HERO_LABEL_STAGGER,
  HERO_PORTRAIT_DURATION,
} from "@/components/hero-intro-timing"

const HERO_LABELS = [
  { text: "visual artist *", desktop: "left-[28%] top-[40%]" },
  { text: "music consumer *", desktop: "left-[35%] top-[60%]" },
  { text: "doom scroller *", desktop: "right-[30%] top-[40%]" },
  { text: "explorer *", desktop: "right-[35%] top-[60%]" },
]

const handwritten = localFont({
  src: "../public/font.ttf",
  display: "swap",
})

const mono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
})

export default function HeroSection() {
  const [date, setDate] = useState<string>("—")
  const [time, setTime] = useState<string>("—")

  useEffect(() => {
    const now = new Date()
    // Use an explicit locale + options to keep formatting deterministic.
    // (We still only render after mount to avoid SSR/client hydration mismatch.)
    const nextDate = new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(now)

    const nextTime = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(now)

    setDate(nextDate)
    setTime(nextTime)
  }, [])

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-background px-4 py-8 text-foreground sm:px-6 md:px-6 md:py-10">

      {/* logo + time */}
      <div className="relative z-20 mb-8 md:absolute md:left-6 md:top-6 md:mb-0">
        <Link href="/" className="text-sm font-bold tracking-widest hover:opacity-70">
          PSYX
        </Link>
        <p className="text-[10px] opacity-70" aria-live="polite">
          {date}
        </p>
        <p className="text-[10px] opacity-70">{time}</p>
      </div>

      <div className="relative z-20 mb-8 text-right md:absolute md:right-6 md:top-6 md:mb-0">
        <Link
          href="/play-ground"
          className={`${mono.className} landing-writing-nav mr-5 inline-flex min-h-10 items-center justify-end px-1 text-[10px] uppercase tracking-[0.2em] opacity-80 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black`}
        >
          Play Ground →
        </Link>
        <Link
          href="/#writing"
          className={`${mono.className} landing-writing-nav inline-flex min-h-10 items-center justify-end px-1 text-[10px] uppercase tracking-[0.2em] opacity-80 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black`}
        >
          Writing →
        </Link>
      </div>

      {/* center images */}
      <div className="relative z-10 flex justify-center md:absolute md:inset-0 md:items-center">
        <div className="flex w-full flex-col items-center justify-center">
          <div className="w-full px-4 sm:px-6 md:px-0">
            <motion.div
              initial={{ opacity: 0, filter: "blur(18px)", scale: 0.97 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              transition={{ duration: HERO_PORTRAIT_DURATION, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src="/stickers/me.png"
                alt="Portrait of Krishna Kant Maharshi"
                width={500}
                height={600}
                priority
                className="mx-auto h-auto w-full max-w-[280px] object-contain sm:max-w-[340px] md:max-w-[500px]"
              />
            </motion.div>
          </div>

          <motion.div
            className="w-full px-4 pb-2 sm:px-6 md:px-0"
            initial={{ opacity: 0, filter: "blur(18px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{
              duration: 0.9,
              delay: HERO_ARTWORK_START_DELAY,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div
              role="img"
              aria-label="Hand-drawn intro artwork for Krishna Kant Maharshi"
              className="mx-auto mt-3 aspect-[5/3] w-full max-w-[300px] sm:max-w-[360px] md:mt-4 md:max-w-[500px]"
            >
              <ElasticMesh
                image="/hero.png"
                showGrid={false}
                borderRadius={0}
                tilt={8}
                shading={0.22}
                pull={0.22}
                wobble={3}
                resolution={20}
                interaction="hover"
                className="overflow-hidden"
              />
            </div>
          </motion.div>

          <motion.div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-x-4 gap-y-2 px-4 text-center text-xs sm:max-w-md md:hidden">
            {[HERO_LABELS[0], HERO_LABELS[2], HERO_LABELS[1], HERO_LABELS[3]].map((label, index) => (
              <motion.span
                key={label.text}
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: HERO_LABEL_DURATION,
                  delay: HERO_LABEL_START_DELAY + index * HERO_LABEL_STAGGER,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {label.text}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* floating labels */}
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        {HERO_LABELS.map((label, index) => (
          <motion.span
            key={label.text}
            className={`absolute ${label.desktop} text-xs`}
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: HERO_LABEL_DURATION,
              delay: HERO_LABEL_START_DELAY + index * HERO_LABEL_STAGGER,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {label.text}
          </motion.span>
        ))}
      </div>

      <div className="relative z-20 mt-8 flex justify-center md:absolute md:bottom-8 md:left-1/2 md:mt-0 md:-translate-x-1/2">
        <Link
          href="/#selected-work"
          className={`${mono.className} inline-flex min-h-10 items-center px-1 text-[10px] uppercase tracking-[0.2em] opacity-80 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black`}
        >
          View selected work →
        </Link>
      </div>

      {/* subtle border frame */}
      <div className="pointer-events-none absolute inset-3 border border-pink-400 sm:inset-4" />

    </section>
  )
}
