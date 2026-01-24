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
    iconColor: "#FFFFFF",
  },
  CapCut: {
    backgroundColor: "rgba(52, 50, 50, 0.56)",
    textColor: "#FFFFFF",
    iconColor: "#FFFFFF"
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

const defaultHeadline = "Creative Visual Storyteller"

const services = [
  "Video Editing",
  "Graphic Tees Design", 
  "Music Posters",
  "Corporate Designs"
]

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
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section
      ref={ref}
      className="relative min-h-screen py-20 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-background flex items-center transition-colors duration-300 overflow-hidden"
    >
      {/* Minimal animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full bg-gradient-to-tl from-secondary/5 to-transparent"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10">
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
                staggerChildren: 0.1
              },
            },
          }}
          className="text-center space-y-12 sm:space-y-16"
        >
          {/* Minimal section label */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.8,
                  ease: [0.23, 1, 0.32, 1],
                },
              },
            }}
          >
            <p className="text-xs font-light tracking-[0.2em] uppercase text-muted-foreground">
              About Me
            </p>
          </motion.div>

          {/* Main headline with emphasis */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 1,
                  delay: 0.2,
                  ease: [0.23, 1, 0.32, 1],
                },
              },
            }}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight">
              I <span className="font-medium text-primary">edit videos</span>,{" "}
              <span className="font-medium text-primary">design</span> graphics,{" "}
              <span className="font-medium text-primary">create</span> posters
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-light text-foreground/70">
              Creative Head at The BlackbombayHouse
            </p>
          </motion.div>

          {/* Services grid with animation */}
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  duration: 1,
                  delay: 0.4,
                  staggerChildren: 0.15
                },
              },
            }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-2xl mx-auto"
          >
            {services.map((service, index) => (
              <motion.div
                key={service}
                variants={{
                  hidden: { opacity: 0, scale: 0.9, y: 20 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: {
                      duration: 0.6,
                      ease: [0.23, 1, 0.32, 1],
                    },
                  },
                }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg blur-sm group-hover:blur-md transition-all duration-300" />
                <div className="relative bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6 text-center">
                  <p className="text-sm sm:text-base font-light text-foreground">
                    {service}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Minimal CTA */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.8,
                  delay: 0.8,
                  ease: [0.23, 1, 0.32, 1],
                },
              },
            }}
            className="pt-8"
          >
            <p className="text-sm font-light text-muted-foreground">
              Open for creative collaborations
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
