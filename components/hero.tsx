"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import localFont from "next/font/local"
import { Share_Tech_Mono } from "next/font/google"
import { useEffect, useState } from "react"

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
          href="/blog"
          className={`${mono.className} text-[10px] uppercase tracking-[0.2em] opacity-80 transition-opacity hover:opacity-100`}
        >
          Writing →
        </Link>
      </div>

      {/* center images */}
      <div className="relative z-10 flex justify-center md:absolute md:inset-0 md:items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex w-full flex-col items-center justify-center"
        >
          <div className="w-full px-4 sm:px-6 md:px-0">
            <Image
              src="/stickers/me.png"
              alt="profile"
              width={500}
              height={600}
              priority
              className="mx-auto h-auto w-full max-w-[280px] object-contain sm:max-w-[340px] md:max-w-[500px]"
            />
          </div>

          <div className="w-full px-4 pb-2 sm:px-6 md:px-0">
            <Image
              src="/hero.png"
              alt="hero"
              width={500}
              height={300}
              className="mx-auto mt-3 h-auto w-full max-w-[300px] object-contain sm:max-w-[360px] md:mt-4 md:max-w-[500px]"
            />
          </div>

          <div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-x-4 gap-y-2 px-4 text-center text-xs sm:max-w-md md:hidden">
            <span>visual artist *</span>
            <span>doom scroller *</span>
            <span>music consumer *</span>
            <span>explorer *</span>
          </div>
        </motion.div>
      </div>

      {/* floating labels */}
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <span className="absolute left-[28%] top-[40%] text-xs">visual artist *</span>
        <span className="absolute left-[35%] top-[60%] text-xs">music consumer *</span>
        <span className="absolute right-[30%] top-[40%] text-xs">doom scroller *</span>
        <span className="absolute right-[35%] top-[60%] text-xs">explorer *</span>
      </div>

      {/* subtle border frame */}
      <div className="pointer-events-none absolute inset-3 border border-pink-400 sm:inset-4" />

    </section>
  )
}
