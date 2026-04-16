"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useReducedMotion } from "framer-motion"

interface TrackData {
  title: string
  artist: string
  albumArt: string
  durationMs?: number // Optional: total track duration in milliseconds
  spotifyUrl?: string // Optional: link to track
}

interface StandaloneCDPlayerProps {
  track: TrackData
  isPlaying?: boolean // Optional: control play/pause externally
  onPlayPause?: (playing: boolean) => void // Optional: callback for play/pause
  autoPlay?: boolean // Optional: start playing automatically
}

function formatTime(ms: number | null): string {
  if (!ms) return "0:00"
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export default function StandaloneCDPlayer({
  track,
  isPlaying: externalIsPlaying,
  onPlayPause,
  autoPlay = false
}: StandaloneCDPlayerProps) {
  const [mounted, setMounted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [localProgress, setLocalProgress] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const shouldReduceMotion = useReducedMotion()

  // Use external isPlaying if provided, otherwise use internal state
  const currentIsPlaying = externalIsPlaying !== undefined ? externalIsPlaying : isPlaying
  const duration = track.durationMs ?? 180000 // Default 3 minutes if not provided

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle play/pause
  useEffect(() => {
    if (externalIsPlaying !== undefined) {
      setIsPlaying(externalIsPlaying)
    }
  }, [externalIsPlaying])

  // Progress timer
  useEffect(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)

    if (currentIsPlaying && duration > 0) {
      progressIntervalRef.current = setInterval(() => {
        setLocalProgress((prev) => {
          const next = prev + 1000
          if (next >= duration) {
            // Auto-pause when finished
            if (onPlayPause) {
              onPlayPause(false)
            } else {
              setIsPlaying(false)
            }
            return duration
          }
          return next
        })
      }, 1000)
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [currentIsPlaying, duration, onPlayPause])

  const handlePlayPause = () => {
    const newState = !currentIsPlaying
    if (onPlayPause) {
      onPlayPause(newState)
    } else {
      setIsPlaying(newState)
    }
  }

  if (!mounted) return <CDPlayerSkeleton />

  const progress = localProgress
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="group relative block cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handlePlayPause}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="relative overflow-hidden"
          style={{
            width: "240px",
            height: "240px",
            borderRadius: "32px",
          }}
        >
          {/* Dynamic Background Layer */}
          {track.albumArt ? (
            <>
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${track.albumArt})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(20px) brightness(0.4) saturate(1.2)",
                  transform: "scale(1.1)",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.7) 100%)",
                }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)",
              }}
            />
          )}

          {/* macOS Liquid Glass Container */}
          <div
            className="relative h-full w-full backdrop-blur-xl"
            style={{
              borderRadius: "32px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: `
                inset 0 1px 1px rgba(255, 255, 255, 0.15),
                inset 0 -1px 1px rgba(0, 0, 0, 0.2),
                0 4px 16px rgba(0, 0, 0, 0.2),
                0 8px 32px rgba(0, 0, 0, 0.15)
              `,
              background: "rgba(255, 255, 255, 0.03)",
            }}
          >
            {/* Inner highlight */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: "32px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.1)",
              }}
            />

            {/* CD Container - Positioned higher, clipped by overflow */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                width: "180px",
                height: "180px",
              }}
              animate={{
                top: isHovered ? "30px" : "-90px",
              }}
              transition={{
                duration: 0.6,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <motion.div
                className="relative w-full h-full"
                animate={
                  currentIsPlaying && !shouldReduceMotion
                    ? { rotate: 360 }
                    : { rotate: 0 }
                }
                transition={{
                  duration: 5,
                  repeat: currentIsPlaying && !shouldReduceMotion ? Infinity : 0,
                  ease: "linear",
                }}
                style={{
                  transformOrigin: "center center",
                }}
              >
                <div
                  className="relative w-full h-full rounded-full overflow-hidden"
                  style={{
                    backgroundImage: track.albumArt
                      ? "none"
                      : "linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    boxShadow: `
                      inset 0 0 20px rgba(0, 0, 0, 0.3),
                      0 4px 12px rgba(0, 0, 0, 0.3),
                      0 0 0 1px rgba(0, 0, 0, 0.2)
                    `,
                  }}
                >
                  {track.albumArt ? (
                    <img
                      src={track.albumArt}
                      alt={`${track.title} by ${track.artist}`}
                      className="absolute inset-0 w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255, 255, 255, 0.03) 10px, rgba(255, 255, 255, 0.03) 20px)",
                      }}
                    />
                  )}

                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 15%, transparent 40%, rgba(0, 0, 0, 0.2) 70%, rgba(0, 0, 0, 0.4) 100%)",
                    }}
                  />

                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundImage: `
                        repeating-radial-gradient(
                          circle,
                          transparent 0px,
                          transparent 2px,
                          rgba(0, 0, 0, 0.08) 2px,
                          rgba(0, 0, 0, 0.08) 3px,
                          transparent 3px,
                          transparent 5px
                        )
                      `,
                      maskImage:
                        "radial-gradient(circle, transparent 18%, black 20%, black 82%, transparent 85%)",
                      WebkitMaskImage:
                        "radial-gradient(circle, transparent 18%, black 20%, black 82%, transparent 85%)",
                      opacity: 0.7,
                    }}
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: "40px",
                        height: "40px",
                        backgroundImage:
                          "radial-gradient(circle, transparent 60%, rgba(0, 0, 0, 0.3) 65%, rgba(0, 0, 0, 0.25) 70%, transparent 75%)",
                      }}
                    />
                    <div
                      className="relative rounded-full"
                      style={{
                        width: "28px",
                        height: "28px",
                        background: "rgba(0, 0, 0, 0.6)",
                        boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.5)",
                      }}
                    />
                  </div>

                  {!currentIsPlaying && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        backdropFilter: "blur(1px)",
                      }}
                    />
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Progressive blur overlay behind text on hover */}
            <motion.div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                bottom: 0,
                height: "120px",
                borderRadius: "0 0 32px 32px",
                maskImage: "linear-gradient(to top, black 0%, black 40%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to top, black 0%, black 40%, transparent 100%)",
              }}
              animate={{
                backdropFilter: isHovered ? "blur(20px)" : "blur(8px)",
                opacity: isHovered ? 1 : 0.6,
              }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
            
            {/* Additional progressive blur layer for smoother transition */}
            <motion.div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                bottom: 0,
                height: "100px",
                borderRadius: "0 0 32px 32px",
                maskImage: "linear-gradient(to top, black 0%, transparent 70%)",
                WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 70%)",
              }}
              animate={{
                backdropFilter: isHovered ? "blur(16px)" : "blur(6px)",
                opacity: isHovered ? 0.8 : 0.4,
              }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              }}
            />

            {/* Text Content - Animated on hover */}
            <motion.div
              className="absolute left-0 right-0 text-center z-10"
              style={{
                padding: "0 16px",
                bottom: 0,
              }}
              animate={{
                bottom: isHovered ? "8px" : "12px",
              }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              {/* Sound wave icon - fades out on hover */}
              <motion.div
                className="flex items-center justify-center gap-0.5 mb-3"
                animate={{
                  opacity: isHovered ? 0 : 1,
                  height: isHovered ? 0 : "auto",
                  marginBottom: isHovered ? 0 : "12px",
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{
                  overflow: "hidden",
                }}
              >
                <div className="w-0.5 bg-white/60 rounded-full" style={{ height: "8px" }} />
                <div className="w-0.5 bg-white/80 rounded-full" style={{ height: "12px" }} />
                <div className="w-0.5 bg-white rounded-full" style={{ height: "16px" }} />
              </motion.div>

              {/* Track name - primary */}
              <h3
                className="text-sm font-semibold text-white mb-1 truncate px-2"
                style={{ lineHeight: "1.3" }}
              >
                {track.title}
              </h3>

              {/* Artist name - secondary */}
              <p
                className="text-xs text-white/70 font-light mb-3"
                style={{ lineHeight: "1.2" }}
              >
                {track.artist}
              </p>

              {/* Progress bar and time - fades out on hover */}
              {duration > 0 && (
                <motion.div
                  className="flex items-center gap-2 px-2"
                  animate={{
                    opacity: isHovered ? 0 : 1,
                    height: isHovered ? 0 : "auto",
                    marginTop: isHovered ? 0 : "0px",
                  }}
                  transition={{
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  style={{
                    overflow: "hidden",
                  }}
                >
                  <span className="text-[10px] text-white/60 font-mono tabular-nums">
                    {formatTime(progress)}
                  </span>

                  <div
                    className="flex-1 h-px bg-white/20 rounded-full overflow-hidden relative"
                    style={{ minWidth: "80px" }}
                  >
                    <motion.div
                      className="h-full bg-white rounded-full absolute top-0 left-0"
                      style={{
                        boxShadow: "0 0 2px rgba(255, 255, 255, 0.5)",
                      }}
                      initial={false}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.3, ease: "linear" }}
                    />
                  </div>

                  <span className="text-[10px] text-white/60 font-mono tabular-nums">
                    {formatTime(duration)}
                  </span>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function CDPlayerSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative overflow-hidden animate-pulse"
        style={{
          width: "240px",
          height: "240px",
          borderRadius: "32px",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)",
          }}
        />
        <div
          className="relative h-full w-full backdrop-blur-xl"
          style={{
            borderRadius: "32px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: `
              inset 0 1px 1px rgba(255, 255, 255, 0.15),
              inset 0 -1px 1px rgba(0, 0, 0, 0.2),
              0 4px 16px rgba(0, 0, 0, 0.2),
              0 8px 32px rgba(0, 0, 0, 0.15)
            `,
            background: "rgba(255, 255, 255, 0.03)",
          }}
        />
      </div>
    </div>
  )
}

