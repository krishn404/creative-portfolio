"use client"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import useSWR from "swr"
import type { SiteContent } from "@/lib/content"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const defaultHeadline = "Building stories through design and creativity"
const defaultParagraphs = [
  "I am the Creative Head at The Blackbombay House, a music production company where I manage and create visual work across different areas like social media, branding, video editing, and storytelling.",
  "My work includes graphic design, writing copy and scripts, basic video editing, and leading creative campaigns that connect with people. I enjoy shaping ideas into visuals that tell clear and engaging stories.",
]
const defaultTags = ["Creative Direction", "Graphic Design", "Video Editing", "Copywriting", "Social Media Creatives"]

export default function About() {
  const { data } = useSWR<SiteContent>("/api/content", fetcher)
  const headline = data?.about?.headline ?? defaultHeadline
  const paragraphs = data?.about?.paragraphs ?? defaultParagraphs
  const tags = data?.about?.tags ?? defaultTags

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
    <section
      ref={ref}
      className="min-h-screen py-12 md:py-20 px-4 bg-background flex items-center transition-colors duration-300"
    >
      <div className="max-w-4xl mx-auto w-full">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {/* Left column - Title */}
          <motion.div variants={itemVariants}>
            <p className="text-xs font-light tracking-widest uppercase text-muted-foreground mb-4">About</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight tracking-tight text-foreground">
              {headline}
            </h2>
          </motion.div>

          {/* Right column - Description */}
          <motion.div variants={itemVariants} className="space-y-6">
            {paragraphs.map((paragraph: string, idx: number) => (
              <p key={idx} className="text-base md:text-lg font-light leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
            <div className="pt-4 space-y-3">
              <p className="text-sm font-light text-muted-foreground">Open for collaboration and creative roles.</p>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-block px-3 md:px-4 py-1.5 md:py-2 border border-border rounded-full text-xs font-light tracking-wide hover:border-foreground/50 transition-colors cursor-pointer"
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
