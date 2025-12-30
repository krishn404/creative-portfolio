"use client"
import React from "react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import useSWR from "swr"
import Image from "next/image"
import { SiCanva } from "react-icons/si"
import type { SiteContent } from "@/lib/content"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Brand color definitions - subtle dark badges with colored icons
const BRAND_COLORS = {
  Photoshop: {
    backgroundColor: "rgba(0, 162, 255, 0.44)",
    textColor: "#FFFFFF",
    iconColor: "#31A8FF", // Brand color for icon
  },
  Canva: {
    backgroundColor: "linear-gradient(90deg, #00C6C8 0%, #3A7BD5 50%, #7F2EEA 100%)",
    textColor: "#FFFFFF",
  },
  CapCut: {
    backgroundColor: "rgba(52, 50, 50, 0.56)",
    textColor: "#FFFFFF"
  },
} as const

// Official brand icon components
function PhotoshopIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={className}
      style={style}
    >
      <path fill="#03A9F4" d="M6,10c0-2.209,1.791-4,4-4h28c2.209,0,4,1.791,4,4v28c0,2.209-1.791,4-4,4H10c-2.209,0-4-1.791-4-4V10z"></path>
      <path fill="#020F16" d="M20.016,19.174h-2.002v4.434h1.973c0.547,0,0.97-0.179,1.27-0.537s0.449-0.879,0.449-1.563c0-0.71-0.153-1.274-0.459-1.694S20.53,19.181,20.016,19.174z"></path>
      <path fill="#020F16" d="M9,9v30h30V9H9z M23.365,24.789C22.539,25.597,21.393,26,19.928,26h-1.914v5h-2.871V16.781h4.844c1.406,0,2.528,0.437,3.364,1.309s1.255,2.005,1.255,3.398S24.192,23.981,23.365,24.789z M32.682,30.336c-0.709,0.573-1.641,0.859-2.793,0.859c-0.775,0-1.459-0.151-2.051-0.454s-1.057-0.725-1.392-1.265s-0.503-1.123-0.503-1.748h2.627c0.014,0.481,0.125,0.843,0.337,1.084s0.558,0.361,1.04,0.361c0.742,0,1.113-0.335,1.113-1.006c0-0.234-0.112-0.451-0.337-0.649S30,27.052,29.225,26.713c-1.139-0.462-1.922-0.94-2.349-1.436s-0.64-1.11-0.64-1.846c0-0.925,0.334-1.688,1.001-2.29s1.552-0.903,2.651-0.903c1.158,0,2.086,0.3,2.783,0.898s1.045,1.403,1.045,2.412h-2.764c0-0.859-0.357-1.289-1.074-1.289c-0.293,0-0.533,0.091-0.723,0.273s-0.283,0.437-0.283,0.762c0,0.234,0.104,0.441,0.313,0.62s0.699,0.435,1.475,0.767c1.127,0.417,1.922,0.881,2.388,1.392s0.698,1.174,0.698,1.987C33.746,29.005,33.391,29.763,32.682,30.336z"></path>
    </svg>
  )
}


function CapCutIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`${className} flex items-center justify-center`} style={style}>
      <Image
        src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/capcut-icon.png"
        alt="CapCut"
        width={16}
        height={16}
        className="w-4 h-4 flex-shrink-0"
        style={{ 
          objectFit: "contain",
          filter: style?.color ? `drop-shadow(0 0 2px ${style.color})` : undefined,
        }}
        unoptimized
      />
    </div>
  )
}

const defaultHeadline = "Building stories through design and creativity"
const defaultParagraph =
  "I am the Creative Head at The Blackbombay House, a music production company where I craft visual narratives that bridge sound and sight. My journey in creative work is driven by curiosity constantly exploring how ideas transform into compelling visuals that resonate. I work across social media, branding, and storytelling, using tools like Photoshop for detailed image work, CapCut for video editing, and Canva for quick, effective designs. Each project becomes a learning experience, a chance to refine my craft and discover new ways to communicate through design. I believe in the power of visual storytelling to connect with people, whether it's through a carefully composed poster, a dynamic social media campaign, or a video that captures a moment. My approach is hands-on and iterative, always questioning, always improving, always curious about what's possible when creativity meets intention."

// Enhanced creative paragraph with more personality and tool mentions
const creativeParagraph =
  "I'm a creative explorer at heart, constantly curious about how ideas take shape. At The Blackbombay House, I weave visual stories that connect music with imagery, crafting narratives that feel both intentional and spontaneous. My process is hands-on I dive into Photoshop for intricate image work, experiment with CapCut to bring motion to static concepts, and leverage Canva for rapid ideation and client presentations. Each project teaches me something new, whether it's discovering an unexpected color combination, finding the perfect rhythm in a video edit, or learning how a simple design choice can amplify a message. I'm fascinated by the intersection of craft and curiosity, where technical skill meets creative intuition. My work spans social media campaigns, brand identities, and visual storytelling each piece a small experiment in communication. I believe the best creative work happens when you're willing to question, iterate, and stay open to what emerges in the process."

// Inline badge component for tools - button-like, matches text height with brand colors
function InlineBadge({
  icon: Icon,
  brand,
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  brand: keyof typeof BRAND_COLORS
  children: React.ReactNode
}) {
  const brandColors = BRAND_COLORS[brand]

  return (
    <motion.button
      type="button"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 mx-1 rounded-sm border-0 text-sm font-normal shadow-none hover:opacity-80 transition-all duration-200 align-middle"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      style={{
        lineHeight: "inherit",
        background: brandColors.backgroundColor,
        color: brandColors.textColor,
        backdropFilter: "blur(8px)",
      }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: brandColors.iconColor }} />
      <span className="font-normal leading-none" style={{ color: brandColors.textColor }}>
        {children}
      </span>
    </motion.button>
  )
}

// Parse paragraph and replace tool names with badges
function parseParagraphWithBadges(text: string): (string | React.ReactElement)[] {
  const parts: (string | React.ReactElement)[] = []
  let lastIndex = 0

  // Define tool mappings with brand icons
  const tools = [
    { name: "Photoshop", icon: PhotoshopIcon, brand: "Photoshop" as const },
    { name: "CapCut", icon: CapCutIcon, brand: "CapCut" as const },
    { name: "Canva", icon: SiCanva, brand: "Canva" as const },
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
        <InlineBadge
          key={`badge-${keyCounter++}-${match.index}`}
          icon={tool.icon}
          brand={tool.brand}
        >
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
