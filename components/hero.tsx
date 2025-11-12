"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import LightRays from './LightRays';

export default function HeroSection() {
  const [stackComplete, setStackComplete] = useState(false)
  const [greeting, setGreeting] = useState("")
  const [currentProfile, setCurrentProfile] = useState(0)

  const profiles = [
    "design visual narratives",
    "craft compelling copy",
    "edit dynamic videos",
    "direct creative campaigns"
  ]

  // dynamic greeting
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 4) setGreeting("You should sleep")
    else if (hour < 6) setGreeting("You didn't sleep or woke early?")
    else if (hour < 12) setGreeting("Good morning")
    else if (hour < 18) setGreeting("Good afternoon")
    else setGreeting("Good evening")
  }, [])

  // rotating profiles
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProfile((prev) => (prev + 1) % profiles.length)
    }, 3000) // Change every 3 seconds

    return () => clearInterval(interval)
  }, [profiles.length])

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  })

  // posters stack temporarily disabled
  /*
  const posters = [
    { id: 1, color: "bg-blue-100", title: "Poster 01" },
    { id: 2, color: "bg-emerald-100", title: "Poster 02" },
    { id: 3, color: "bg-amber-100", title: "Poster 03" },
    { id: 4, color: "bg-rose-100", title: "Poster 04" },
    { id: 5, color: "bg-violet-100", title: "Poster 05" },
  ]
  */

  useEffect(() => {
    // immediately mark as complete since posters are disabled
    setStackComplete(true)
  }, [])

  const heroContentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut",
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.23, 1, 0.82, 1] },
    },
  }

  // const icons = [
  //   { label: "About", icon: "○" },
  //   { label: "Posters", icon: "◻" },
  //   { label: "Shop", icon: "◈" },
  //   { label: "Contact", icon: "↗" },
  // ]

  return (
    
    <section className="relative min-h-screen flex items-center justify-center bg-white overflow-hidden">
      {/* LightRays Background */}
      <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <LightRays
          raysOrigin="top-center"
          raysColor="#00ffff"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
        />
      </div>

      {/* subtle grid background */}
      <div className="absolute inset-0 opacity-5 z-[1]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 24%, rgba(0,0,0,.05) 25%, rgba(0,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.05) 75%, rgba(0,0,0,.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0,0,0,.05) 25%, rgba(0,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.05) 75%, rgba(0,0,0,.05) 76%, transparent 77%, transparent)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* temporarily disabled poster stack */}
      {/*
      <motion.div
        className="relative w-64 h-80"
        animate={stackComplete ? "fadeOut" : "visible"}
        variants={stackContainerVariants}
        initial="visible"
      >
        {posters.map((poster, index) => (
          <motion.div
            key={poster.id}
            custom={index}
            initial="hidden"
            animate="slideUp"
            variants={posterVariants}
            className={`absolute inset-0 ${poster.color} rounded-md shadow-md border border-black/5 flex items-center justify-center`}
          >
            <div className="text-3xl font-light tracking-tight text-black/30">
              {poster.title}
            </div>
          </motion.div>
        ))}
      </motion.div>
      */}

      {/* Hero text + icons */}
      <motion.div
        ref={ref}
        initial="hidden"
        animate={stackComplete && inView ? "visible" : "hidden"}
        variants={heroContentVariants}
        className="max-w-2xl text-center absolute z-10"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <p className="text-sm font-light tracking-widest text-black/50 uppercase">
            {greeting}
          </p>
        </motion.div>

        <motion.h1 variants={itemVariants} className="mb-12">
          <span className="text-5xl md:text-6xl font-light leading-tight tracking-tight text-balance text-black">
          Hello, I'm Krishna Kant
          </span>
          <br />
          <div className="text-2xl md:text-3xl font-light text-black/60 mt-4 flex items-center justify-center">
            <div className="flex items-center">
              <span className="mr-2">I</span>
              <div className="relative h-[36px] md:h-[44px] w-[280px] md:w-[340px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentProfile}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                    className="absolute left-0 whitespace-nowrap"
                  >
                    {profiles[currentProfile]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.h1>

        {/* <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12 border-t border-black/10"
        >
          {icons.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-3">
              <div className="text-2xl text-black/30">{item.icon}</div>
              <p className="text-xs font-light tracking-widest uppercase text-black/50">
                {item.label}
              </p>
            </div>
          ))}
        </motion.div> */}
      </motion.div>
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-black/40"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
      >
        <p className="text-xs uppercase tracking-widest mb-3">Scroll</p>
        <div className="w-[1px] h-12 bg-black/20 relative overflow-hidden">
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
    </section>
  )
}