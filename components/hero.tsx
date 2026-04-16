"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import localFont from "next/font/local"
import { Share_Tech_Mono } from "next/font/google"

const handwritten = localFont({
  src: "../public/font.ttf",
  display: "swap",
})

const mono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
})

export default function HeroSection() {
  const now = new Date()
  const date = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const time = now.toLocaleTimeString()

  return (
    <section className="relative w-full min-h-screen bg-background text-foreground overflow-hidden px-6 py-10">
      
      

      {/* logo + time */}
      <div className="absolute top-6 left-6 z-20">
        <p className="text-sm font-bold tracking-widest">PSYX</p>
        <p className="text-[10px] opacity-70">{date}</p>
        <p className="text-[10px] opacity-70">{time}</p>
      </div>

      {/* center image */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Image
            src="/stickers/me.png"
            alt="profile"
            width={500}
            height={600}
            priority
            className="grayscale object-contain"
          />
        </motion.div>
      </div>

    

      {/* floating labels */}
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute left-[28%] top-[40%] text-xs">Creator *</span>
        <span className="absolute left-[35%] top-[60%] text-xs">Stylist *</span>
        <span className="absolute left-[50%] top-[35%] text-xs">DJ *</span>
        <span className="absolute right-[30%] top-[40%] text-xs">Model *</span>
        <span className="absolute right-[35%] top-[60%] text-xs">Girl *</span>
      </div>

     

      {/* subtle border frame */}
      <div className="absolute inset-4 border border-pink-400 pointer-events-none" />

    </section>
  )
}