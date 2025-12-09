"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import type { SiteContent } from "@/lib/content"
import { getBrowserSupabase } from "@/lib/supabase/client"

const defaultHeadline = "Building stories through design and creativity"
const defaultParagraphs = [
  "I am the Creative Head at The Blackbombay House, a music production company where I manage and create visual work across different areas like social media, branding, video editing, and storytelling.",
  "My work includes graphic design, writing copy and scripts, basic video editing, and leading creative campaigns that connect with people. I enjoy shaping ideas into visuals that tell clear and engaging stories.",
]
const defaultTags = ["Creative Direction", "Graphic Design", "Video Editing", "Copywriting", "Social Media Creatives"]

export default function About() {
  const [headline, setHeadline] = useState(defaultHeadline)
  const [paragraphs, setParagraphs] = useState<string[]>(defaultParagraphs)
  const [tags, setTags] = useState<string[]>(defaultTags)

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/content", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load about")
        const data = (await res.json()) as SiteContent
        setHeadline(data.about?.headline ?? defaultHeadline)
        setParagraphs(Array.isArray(data.about?.paragraphs) ? data.about.paragraphs : defaultParagraphs)
        setTags(Array.isArray(data.about?.tags) ? data.about.tags : defaultTags)
      } catch (err) {
        console.error(err)
      }
    }
    const supabase = getBrowserSupabase()
    const channel = supabase
      .channel("public-about")
      .on("postgres_changes", { event: "*", schema: "public", table: "content" }, load)
      .subscribe()

    load()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

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
            <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight text-black">{headline}</h2>
          </motion.div>

          {/* Right column - Description */}
          <motion.div variants={itemVariants} className="space-y-6">
            {paragraphs.map((paragraph, idx) => (
              <p key={idx} className="text-lg font-light leading-relaxed text-black/70">
                {paragraph}
              </p>
            ))}
            <div className="pt-4 space-y-3">
              <p className="text-sm font-light text-black/50">Open for collaboration and creative roles.</p>
              <div className="flex flex-wrap gap-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-4 py-2 border border-black/20 rounded-full text-xs font-light tracking-wide hover:border-black/50 transition-colors cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
