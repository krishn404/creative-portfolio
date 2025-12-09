"use client"

import { useState, useEffect } from "react"
import { motion, Variants } from "framer-motion"
import { useInView } from "react-intersection-observer"
import Image from "next/image"
import localFont from "next/font/local"
import { Share_Tech_Mono } from "next/font/google"

const retroFont = localFont({
  src: "../public/font.ttf",
  display: "swap",
})

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
})

export default function HeroSection() {
  const [stackComplete, setStackComplete] = useState(false)
  const [greeting, setGreeting] = useState("")

  const popFast = (delay = 0): Variants => ({
    hidden: { opacity: 0, scale: 0.9, rotate: -2, y: 12 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 520,
        damping: 28,
        mass: 0.7,
        delay,
      },
    },
  })

  // dynamic greeting
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 4) setGreeting("You should sleep")
    else if (hour < 6) setGreeting("You didn't sleep or woke early?")
    else if (hour < 12) setGreeting("Good morning")
    else if (hour < 18) setGreeting("Good afternoon")
    else setGreeting("Good evening")
  }, [])

  // fast-cut pop-in on load
  useEffect(() => {
    const id = setTimeout(() => setStackComplete(true), 90)
    return () => clearTimeout(id)
  }, [])


  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  })


  return (
    
    <section className="relative min-h-screen flex items-center justify-center bg-white overflow-hidden select-none">
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        variants={popFast(0.05)}
        initial="hidden"
        animate={stackComplete ? "visible" : "hidden"}
      >
        <Image
          src="/desktop.png"
          alt="Retro desktop illustration"
          priority
          width={1400}
          height={1100}
          className="w-[min(60vw,680px)] mt-[10px] h-auto drop-shadow-2xl"
        />
      </motion.div>

      <motion.div
        className="absolute left-6 md:left-12 mt-[150px] -translate-y-1/2 z-20 text-left"
        variants={popFast(0.08)}
        initial="hidden"
        animate={stackComplete ? "visible" : "hidden"}
      >
        <div
          className={`${retroFont.className} text-black  tracking-widest leading-tight space-y-2 drop-shadow-[2px_2px_0_rgba(0,0,0,0.12)] rotate-1 md:rotate-2`}
        >
          <p className="text-5xl md:text-7xl">Here's My</p>
          <p className="text-4xl md:text-5xl">Digital Creative</p>
          <p className="text-4xl md:text-8xl"> Portfolio</p>
        </div>
      </motion.div>
      
      <motion.div
        ref={ref}
        initial="hidden"
        animate={stackComplete && inView ? "visible" : "hidden"}
        className="max-w-2xl text-center absolute z-10 top-12 left-1/2 -translate-x-1/2"
      >
        <motion.div  className="mb-6">
          <p className="text-sm font-light tracking-widest text-black/50 uppercase">
            {greeting}
          </p>
        </motion.div>
        
      </motion.div>
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-black/40 z-20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
      >
        <p className="text-xs uppercase tracking-widest mb-3">Scroll</p>
        <div className="w-px h-12 bg-black/20 relative overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-full h-full bg-black/50"
            animate={{ y: ["-100%", "100%"] }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>
      <motion.div
        className={`${shareTechMono.className} absolute right-6 md:right-12 top-1/2 -translate-y-1/2 text-right text-black/80 space-y-3 z-20 font-semibold`}
        variants={popFast(0.11)}
        initial="hidden"
        animate={stackComplete ? "visible" : "hidden"}
      >
        <p className="text-base md:text-2xl font-bold tracking-widest">MUSIC COVER</p>
        <p className="text-base md:text-2xl font-bold tracking-widest">VISUAL ARTIST</p>
        <p className="text-base md:text-2xl font-bold tracking-widest">POMOTIONAL POSTERS</p>
        <p className="text-base md:text-2xl font-bold tracking-widest">OPEN FOR COMMISSIONS</p>
      </motion.div>
      <motion.div
        className="absolute bottom-25 left-11 text-xs md:text-sm text-black/20 z-20"
        variants={popFast(0.16)}
        initial="hidden"
        animate={stackComplete ? "visible" : "hidden"}
      >
        This site is developed by me 
        <br/>(Yes, I'm a developer too)
      </motion.div>
    </section>
  )
}