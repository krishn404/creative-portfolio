"use client"
import React from "react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import useSWR from "swr"
import { Layers, Video, Sparkles } from "lucide-react"
import type { SiteContent } from "@/lib/content"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const defaultHeadline = "Building stories through design and creativity"
const defaultParagraph =
  "I am the Creative Head at The Blackbombay House, a music production company where I craft visual narratives that bridge sound and sight. My journey in creative work is driven by curiosity constantly exploring how ideas transform into compelling visuals that resonate. I work across social media, branding, and storytelling, using tools like Photoshop for detailed image work, CapCut for video editing, and Canva for quick, effective designs. Each project becomes a learning experience, a chance to refine my craft and discover new ways to communicate through design. I believe in the power of visual storytelling to connect with people, whether it's through a carefully composed poster, a dynamic social media campaign, or a video that captures a moment. My approach is hands-on and iterative, always questioning, always improving, always curious about what's possible when creativity meets intention."

// Enhanced creative paragraph with more personality and tool mentions
const creativeParagraph =
  "I'm a creative explorer at heart, constantly curious about how ideas take shape. At The Blackbombay House, I weave visual stories that connect music with imagery, crafting narratives that feel both intentional and spontaneous. My process is hands-on I dive into Photoshop for intricate image work, experiment with CapCut to bring motion to static concepts, and leverage Canva for rapid ideation and client presentations. Each project teaches me something new, whether it's discovering an unexpected color combination, finding the perfect rhythm in a video edit, or learning how a simple design choice can amplify a message. I'm fascinated by the intersection of craft and curiosity, where technical skill meets creative intuition. My work spans social media campaigns, brand identities, and visual storytelling each piece a small experiment in communication. I believe the best creative work happens when you're willing to question, iterate, and stay open to what emerges in the process."

// Inline badge component for tools - button-like, matches text height
function InlineBadge({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      className="inline-flex items-center gap-1 px-2 py-1 mx-1 rounded-sm bg-background border border-foreground/30 text-xs font-medium text-foreground shadow-sm hover:shadow-md hover:border-foreground/50 hover:bg-muted/20 transition-all duration-200 align-middle"
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      style={{ lineHeight: "inherit" }}
    >
      <Icon className="w-3 h-3 text-foreground/80 flex-shrink-0" />
      <span className="font-medium leading-none">{children}</span>
    </motion.button>
  )
}

// Parse paragraph and replace tool names with badges
function parseParagraphWithBadges(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = []
  let lastIndex = 0

  // Define tool mappings
  const tools = [
    { name: "Photoshop", icon: Layers },
    { name: "CapCut", icon: Video },
    { name: "Canva", icon: Sparkles },
  ]

  // Create a combined regex that matches all tools (escape special chars)
  const toolNames = tools.map(t => t.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")
  const regex = new RegExp(`\\b(${toolNames})\\b`, "gi")
  
  let match
  let keyCounter = 0

  // Reset regex lastIndex to avoid issues with global regex
  regex.lastIndex = 0

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index)
      if (textBefore) {
        parts.push(textBefore)
      }
    }

    // Find the tool and create badge
    const matchedText = match[1] // Use captured group
    const tool = tools.find(t => t.name.toLowerCase() === matchedText.toLowerCase())
    
    if (tool) {
      parts.push(
        <InlineBadge key={`badge-${keyCounter++}-${match.index}`} icon={tool.icon}>
          {tool.name}
        </InlineBadge>
      )
    } else {
      parts.push(matchedText)
    }

    lastIndex = regex.lastIndex

    // Prevent infinite loop
    if (regex.lastIndex === 0) {
      break
    }
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex)
    if (remainingText) {
      parts.push(remainingText)
    }
  }

  // If no matches found, return original text
  return parts.length > 0 ? parts : [text]
}

export default function About() {
  const { data } = useSWR<SiteContent>("/api/content", fetcher)
  const headline = data?.about?.headline ?? defaultHeadline
  // Always use the creative paragraph that includes tool names for badges
  // This ensures badges are always visible
  const paragraphText = creativeParagraph
  const parsedContent = parseParagraphWithBadges(paragraphText)

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section
      ref={ref}
      className="relative min-h-screen py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-background flex items-center transition-colors duration-300 overflow-hidden"
    >
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-0 w-px h-32 bg-gradient-to-b from-transparent via-border/30 to-transparent" />
        <div className="absolute bottom-1/4 right-0 w-px h-32 bg-gradient-to-b from-transparent via-border/30 to-transparent" />
        {/* Floating accent dots */}
        <motion.div
          className="absolute top-1/3 right-1/4 w-1 h-1 rounded-full bg-foreground/20"
          animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/4 w-1 h-1 rounded-full bg-foreground/20"
          animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="max-w-3xl mx-auto w-full relative z-10">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                duration: 1.2,
                ease: [0.23, 1, 0.32, 1],
              },
            },
          }}
          className="space-y-8 sm:space-y-10 md:space-y-12"
        >
          {/* Section label */}
          <motion.div
            variants={{
              hidden: { opacity: 0, filter: "blur(10px)", y: 10 },
              visible: {
                opacity: 1,
                filter: "blur(0px)",
                y: 0,
                transition: {
                  duration: 0.8,
                  delay: 0.2,
                  ease: [0.23, 1, 0.32, 1],
                },
              },
            }}
            className="flex items-center gap-3"
          >
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-border/50" />
            <p className="text-[10px] sm:text-xs font-light tracking-widest uppercase text-muted-foreground">
              About
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
          </motion.div>

          {/* Headline */}
          <motion.h2
            variants={{
              hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
              visible: {
                opacity: 1,
                filter: "blur(0px)",
                y: 0,
                transition: {
                  duration: 1,
                  delay: 0.3,
                  ease: [0.23, 1, 0.32, 1],
                },
              },
            }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light leading-tight tracking-tight text-foreground"
          >
            {headline}
          </motion.h2>

          {/* Main paragraph with inline badges */}
          <motion.div
            variants={{
              hidden: { opacity: 0, filter: "blur(12px)" },
              visible: {
                opacity: 1,
                filter: "blur(0px)",
                transition: {
                  duration: 1.4,
                  delay: 0.5,
                  ease: [0.23, 1, 0.32, 1],
                },
              },
            }}
            className="text-sm sm:text-base md:text-lg font-light leading-relaxed sm:leading-loose text-foreground/90"
          >
            <p className="max-w-none inline">
              {parsedContent.map((part, index) => {
                if (typeof part === "string") {
                  return <span key={`text-${index}`}>{part}</span>
                }
                // Badge component - inline with text
                return <React.Fragment key={part.key || `badge-${index}`}>{part}</React.Fragment>
              })}
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            variants={{
              hidden: { opacity: 0, filter: "blur(8px)" },
              visible: {
                opacity: 1,
                filter: "blur(0px)",
                transition: {
                  duration: 0.8,
                  delay: 0.7,
                  ease: [0.23, 1, 0.32, 1],
                },
              },
            }}
            className="pt-4 sm:pt-6"
          >
            <p className="text-xs sm:text-sm font-light text-muted-foreground">
              Open for collaboration and creative roles.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
