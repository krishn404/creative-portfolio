"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"

export default function About() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: [0.23, 1, 0.82, 1],
      },
    },
  }

  return (
    <section ref={ref} className="min-h-screen py-20 px-4 bg-white flex items-center">
      <div className="max-w-4xl mx-auto w-full">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-12"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {/* Left column - Title */}
          <motion.div variants={itemVariants}>
            <p className="text-xs font-light tracking-widest uppercase text-black/50 mb-4">About</p>
            <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight text-black">
              Building stories through design and creativity
            </h2>
          </motion.div>

          {/* Right column - Description */}
          <motion.div variants={itemVariants} className="space-y-6">
          <p className="text-lg font-light leading-relaxed text-black/70">
                I am the Creative Head at{" "}
                <a
                  href="https://instagram.com/theblackbombayhouse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black font-medium underline hover:text-black/90"
                >
                  The Blackbombay House
                </a>
                , a music production company where I manage and create visual work across different areas like social media, branding,
                video editing, and storytelling.
              </p>

            <p className="text-lg font-light leading-relaxed text-black/70">
              My work includes graphic design, writing copy and scripts, basic video editing, and leading creative
              campaigns that connect with people. I enjoy shaping ideas into visuals that tell clear and engaging
              stories.
            </p>
            <div className="pt-4">
              <p className="text-sm font-light text-black/50 mb-3">
                Open for freelance, collaboration, and creative roles in design, content, and media.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-block px-4 py-2 border border-black/20 rounded-full text-xs font-light tracking-wide hover:border-black/50 transition-colors cursor-pointer">
                  Creative Direction
                </span>
                <span className="inline-block px-4 py-2 border border-black/20 rounded-full text-xs font-light tracking-wide hover:border-black/50 transition-colors cursor-pointer">
                  Graphic Design
                </span>
                <span className="inline-block px-4 py-2 border border-black/20 rounded-full text-xs font-light tracking-wide hover:border-black/50 transition-colors cursor-pointer">
                  Video Editing
                </span>
                <span className="inline-block px-4 py-2 border border-black/20 rounded-full text-xs font-light tracking-wide hover:border-black/50 transition-colors cursor-pointer">
                  Copywriting
                </span>
                <span className="inline-block px-4 py-2 border border-black/20 rounded-full text-xs font-light tracking-wide hover:border-black/50 transition-colors cursor-pointer">
                  Social Media Creatives
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
