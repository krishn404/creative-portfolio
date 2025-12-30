"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import Image from "next/image"
import { useIsMobile } from "@/hooks/use-mobile"

interface StickerPosition {
  x: number // percentage
  y: number // percentage
  rotation: number // degrees
  scale: number
}

// Predefined positions for each sticker (10 stickers total)
const STICKER_POSITIONS: StickerPosition[] = [
  { x: 28, y: 10, rotation: -8, scale: 0.8 },   // 1.png
  { x: 65, y: 15, rotation: 12, scale: 0.7 },  // 2.png
  { x: 72, y: 35, rotation: -5, scale: 0.9 },  // 3.png
  { x: 88, y: 15, rotation: 15, scale: 0.75 },  // 4.png
  { x: 28, y: 60, rotation: -12, scale: 0.85 }, // 5.png
  { x: 78, y: 65, rotation: 8, scale: 2.0 },    // 6.png
  { x: 15, y: 80, rotation: 10, scale: 1.1 }
]

interface StickerProps {
  src: string
  index: number
  position: StickerPosition
}

function Sticker({ src, index, position }: StickerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const stickerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  
  // Responsive scale: reduce by 30% on mobile to prevent overlap while maintaining visibility
  const responsiveScale = isMobile ? position.scale * 0.7 : position.scale
  
  // Update scale when mobile state changes
  useEffect(() => {
    const currentScale = isMobile ? position.scale * 0.4 : position.scale
    // The scale will be applied through the animate prop, which will update on re-render
  }, [isMobile, position.scale])
  
  // Convert percentage to pixel values (relative to viewport, but will scroll with page)
  const getPixelPosition = useCallback(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 }
    // Use viewport dimensions for positioning, but stickers will scroll naturally with absolute positioning
    return {
      x: (position.x / 100) * window.innerWidth,
      y: (position.y / 100) * window.innerHeight,
    }
  }, [position])

  // Get center position for intro animation
  const getCenterPosition = useCallback(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 }
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }
  }, [])

  // Initialize at center for intro animation
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  // Animate from center to final position on mount
  useEffect(() => {
    const centerPos = getCenterPosition()
    const finalPos = getPixelPosition()
    
    // Start at center
    x.set(centerPos.x)
    y.set(centerPos.y)
    
    // Animate to final position with stagger
    const timer = setTimeout(() => {
      x.set(finalPos.x)
      y.set(finalPos.y)
    }, 600 + index * 150) // Stagger delay: 600ms base + 150ms per sticker
    
    return () => clearTimeout(timer)
  }, [getPixelPosition, getCenterPosition, x, y, index])
  
  // Spring animations for fluid movement - softer for intro, then tighter for drag
  const [isIntroComplete, setIsIntroComplete] = useState(false)
  const springConfig = isIntroComplete 
    ? { damping: 25, stiffness: 300, mass: 0.5 } // Tighter for precise dragging
    : { damping: 30, stiffness: 200, mass: 0.8 } // Softer for intro animation
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)
  
  // Mark intro as complete after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIntroComplete(true)
    }, 600 + (STICKER_POSITIONS.length * 150) + 1200) // Base delay + stagger + animation duration
    
    return () => clearTimeout(timer)
  }, [])
  
  // Rotation with subtle spring - start at 0, animate to final rotation
  const rotation = useMotionValue(0)
  const springRotation = useSpring(rotation, { damping: 20, stiffness: 200 })
  
  // Animate rotation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      rotation.set(position.rotation)
    }, 600 + index * 150) // Same stagger as position animation
    
    return () => clearTimeout(timer)
  }, [rotation, position.rotation, index])
  
  // Scale on hover - use motion value for transform (responsive)
  const hoverState = useMotionValue(0)
  const hoverScale = useTransform(
    hoverState,
    [0, 1],
    [responsiveScale, responsiveScale * 1.05]
  )
  
  // Update hover state when isHovered changes
  useEffect(() => {
    hoverState.set(isHovered ? 1 : 0)
  }, [isHovered, hoverState])

  // Handle drag start (only on hover and hold)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isHovered) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    
    const startX = e.clientX
    const startY = e.clientY
    const startOffsetX = x.get()
    const startOffsetY = y.get()

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault()
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      
      // Precise, direct movement - no inertia, fluid and low-latency
      x.set(startOffsetX + deltaX)
      y.set(startOffsetY + deltaY)
    }

    const handlePointerUp = () => {
      setIsDragging(false)
      document.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("pointerup", handlePointerUp)
    }

    document.addEventListener("pointermove", handlePointerMove, { passive: false })
    document.addEventListener("pointerup", handlePointerUp)
  }, [isHovered, x, y])

  // Update position on window resize only (scroll handled by absolute positioning)
  useEffect(() => {
    const handleResize = () => {
      const newPos = getPixelPosition()
      if (!isDragging) {
        x.set(newPos.x)
        y.set(newPos.y)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [getPixelPosition, isDragging, x, y])

  return (
    <motion.div
      ref={stickerRef}
      className="absolute pointer-events-auto select-none touch-none"
      style={{
        x: springX,
        y: springY,
        rotate: springRotation,
        scale: hoverScale,
        zIndex: isDragging ? 1000 : 1, // Higher z-index only when dragging
      }}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onPointerDown={handlePointerDown}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ 
        opacity: 1, 
        scale: responsiveScale,
        transition: { 
          duration: 0.8,
          delay: 0.4 + index * 0.15,
          ease: [0.23, 1, 0.32, 1]
        }
      }}
      whileHover={{
        scale: responsiveScale * 1.05,
        transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
      }}
      drag={false} // Disable default drag, using custom implementation
      dragElastic={0}
      dragMomentum={false}
    >
      <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24">
        <Image
          src={src}
          alt={`Sticker ${index + 1}`}
          fill
          className="object-contain drop-shadow-sm"
          draggable={false}
          priority={index < 3} // Prioritize first 3 stickers
        />
      </div>
    </motion.div>
  )
}

export default function Stickers() {
  const [mounted, setMounted] = useState(false)
  const stickerCount = STICKER_POSITIONS.length
  const stickerPaths = Array.from({ length: stickerCount }, (_, i) => `/stickers/${i + 1}.png`)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1] min-h-screen">
      {stickerPaths.map((path, index) => {
        const position = STICKER_POSITIONS[index]
        if (!position) return null
        return (
          <Sticker
            key={index}
            src={path}
            index={index}
            position={position}
          />
        )
      })}
    </div>
  )
}

