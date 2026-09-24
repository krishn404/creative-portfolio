"use client"

import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { motion, useReducedMotion } from "framer-motion"

interface SpotifyStatus {
  isPlaying: boolean
  title: string
  artist: string
  album: string
  albumArt: string
  url: string
  playedAt: number | null
  progressMs: number | null
  durationMs: number | null
}

const fetcher = async (url: string): Promise<SpotifyStatus | null> => {
  const response = await fetch(url, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch music status: ${response.status}`
    )
  }

  return response.json()
}

function formatTime(ms: number | null): string {
  if (!ms) return "0:00"

  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`
}

export default function SpotifyGlassWidget() {
  const { data, error } = useSWR<SpotifyStatus | null>(
    "/api/spotify/status",
    fetcher,
    {
      /*
       * The API returns Spotify playback only. If Spotify is
       * unavailable, it prompts the user to reconnect Spotify.
       *
       * Poll frequently enough to detect when Spotify
       * becomes available again.
       */
      refreshInterval: 15000,

      /*
       * Re-check when the browser/tab becomes active.
       */
      revalidateOnFocus: true,
      revalidateOnReconnect: true,

      /*
       * Don't let SWR deduplicate requests for too long.
       */
      dedupingInterval: 0,

      /*
       * Always revalidate stale data.
       */
      revalidateIfStale: true,

      /*
       * Don't keep retrying a failed request aggressively.
       * The 15-second refresh will try again.
       */
      errorRetryCount: 1,
      errorRetryInterval: 5000,
    }
  )

  const [mounted, setMounted] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const [localProgress, setLocalProgress] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const progressIntervalRef =
    useRef<NodeJS.Timeout | null>(null)

  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    setMounted(true)

    setIsCompact(
      window.matchMedia?.("(max-width: 640px)")?.matches ??
        false
    )
  }, [])

  /*
   * Keep the progress bar moving locally between API
   * refreshes while Spotify says the track is playing.
   */
  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    if (
      data?.isPlaying &&
      data.progressMs !== null &&
      data.durationMs !== null
    ) {
      setLocalProgress(data.progressMs)

      progressIntervalRef.current = setInterval(() => {
        setLocalProgress((previous) => {
          const next = previous + 1000

          if (
            data.durationMs &&
            next >= data.durationMs
          ) {
            return data.durationMs
          }

          return next
        })
      }, 1000)
    } else {
      setLocalProgress(0)
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [
    data?.isPlaying,
    data?.progressMs,
    data?.durationMs,
  ])

  /*
   * Sync local progress whenever the API gives us
   * a newer Spotify progress value.
   */
  useEffect(() => {
    if (
      data?.progressMs !== null &&
      data?.isPlaying
    ) {
      setLocalProgress(data.progressMs)
    }
  }, [data?.progressMs, data?.isPlaying])

  if (!mounted) {
    return <SpotifyGlassSkeleton />
  }

  const hasData =
    !error &&
    !!data &&
    !!data.title

  const isPlaying =
    data?.isPlaying ?? false

  const progress = localProgress

  const duration =
    data?.durationMs ?? 0

  const progressPercent =
    duration > 0
      ? Math.min((progress / duration) * 100, 100)
      : 0

  const cardSize = isCompact
    ? "min(220px, 78vw)"
    : "240px"

  const cdSize = isCompact
    ? "min(160px, 58vw)"
    : "180px"

  const cdTopIdle = isCompact
    ? "-60px"
    : "-90px"

  const cdTopHover = isCompact
    ? "20px"
    : "30px"

  return (
    <div className="flex w-full flex-col items-start">
      <motion.a
        href={
          hasData
            ? data.url
            : "https://open.spotify.com"
        }
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block"
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.3,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="relative overflow-hidden"
          style={{
            width: cardSize,
            height: cardSize,
            borderRadius: "32px",
          }}
        >
          {/* Dynamic Background */}
          {data?.albumArt ? (
            <>
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${data.albumArt})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter:
                    "blur(20px) brightness(0.4) saturate(1.2)",
                  transform: "scale(1.1)",
                }}
              />

              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.7) 100%)",
                }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)",
              }}
            />
          )}

          {/* Glass Container */}
          <div
            className="relative h-full w-full backdrop-blur-xl"
            style={{
              borderRadius: "32px",
              border:
                "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: `
                inset 0 1px 1px rgba(255, 255, 255, 0.15),
                inset 0 -1px 1px rgba(0, 0, 0, 0.2),
                0 4px 16px rgba(0, 0, 0, 0.2),
                0 8px 32px rgba(0, 0, 0, 0.15)
              `,
              background:
                "rgba(255, 255, 255, 0.03)",
            }}
          >
            {/* Inner Highlight */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: "32px",
                border:
                  "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow:
                  "inset 0 1px 2px rgba(255, 255, 255, 0.1)",
              }}
            />

            {/* CD */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                width: cdSize,
                height: cdSize,
              }}
              animate={{
                top: isHovered
                  ? cdTopHover
                  : cdTopIdle,
              }}
              transition={{
                duration: 0.6,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <motion.div
                className="relative w-full h-full"
                animate={
                  isPlaying && !shouldReduceMotion
                    ? { rotate: 360 }
                    : { rotate: 0 }
                }
                transition={{
                  duration: 5,
                  repeat:
                    isPlaying && !shouldReduceMotion
                      ? Infinity
                      : 0,
                  ease: "linear",
                }}
                style={{
                  transformOrigin:
                    "center center",
                }}
              >
                <div
                  className="relative w-full h-full rounded-full overflow-hidden"
                  style={{
                    backgroundImage: data?.albumArt
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
                  {data?.albumArt ? (
                    <img
                      src={data.albumArt}
                      alt={`${data.album} by ${data.artist}`}
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

                  {/* Vinyl overlay */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 15%, transparent 40%, rgba(0, 0, 0, 0.2) 70%, rgba(0, 0, 0, 0.4) 100%)",
                    }}
                  />

                  {/* Vinyl grooves */}
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

                  {/* Center hole */}
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
                        background:
                          "rgba(0, 0, 0, 0.6)",
                        boxShadow:
                          "inset 0 2px 4px rgba(0, 0, 0, 0.5)",
                      }}
                    />
                  </div>

                  {!isPlaying && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundColor:
                          "rgba(0, 0, 0, 0.4)",
                        backdropFilter: "blur(1px)",
                      }}
                    />
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Progressive blur */}
            <motion.div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                bottom: 0,
                height: "120px",
                borderRadius:
                  "0 0 32px 32px",
                maskImage:
                  "linear-gradient(to top, black 0%, black 40%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to top, black 0%, black 40%, transparent 100%)",
              }}
              animate={{
                backdropFilter: isHovered
                  ? "blur(20px)"
                  : "blur(8px)",
                opacity: isHovered ? 1 : 0.6,
              }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              }}
            />

            <motion.div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                bottom: 0,
                height: "100px",
                borderRadius:
                  "0 0 32px 32px",
                maskImage:
                  "linear-gradient(to top, black 0%, transparent 70%)",
                WebkitMaskImage:
                  "linear-gradient(to top, black 0%, transparent 70%)",
              }}
              animate={{
                backdropFilter: isHovered
                  ? "blur(16px)"
                  : "blur(6px)",
                opacity: isHovered ? 0.8 : 0.4,
              }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              }}
            />

            {/* Text */}
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
              {/* Sound wave */}
              <motion.div
                className="flex items-center justify-center gap-0.5 mb-3"
                animate={{
                  opacity: isHovered ? 0 : 1,
                  height: isHovered
                    ? 0
                    : "auto",
                  marginBottom: isHovered
                    ? 0
                    : "12px",
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{
                  overflow: "hidden",
                }}
              >
                <div
                  className="w-0.5 bg-white/60 rounded-full"
                  style={{ height: "8px" }}
                />
                <div
                  className="w-0.5 bg-white/80 rounded-full"
                  style={{ height: "12px" }}
                />
                <div
                  className="w-0.5 bg-white rounded-full"
                  style={{ height: "16px" }}
                />
              </motion.div>

              {/* Track */}
              <h3
                className="text-sm font-semibold text-white mb-1 truncate px-2"
                style={{
                  lineHeight: "1.3",
                }}
              >
                {hasData
                  ? data.title
                  : "Last played"}
              </h3>

              {/* Artist */}
              <p
                className="text-xs text-white/70 font-light mb-3"
                style={{
                  lineHeight: "1.2",
                }}
              >
                {hasData
                  ? data.artist
                  : "Not playing"}
              </p>

              {/* Progress */}
              {hasData && duration > 0 && (
                <motion.div
                  className="flex items-center gap-2 px-2"
                  animate={{
                    opacity: isHovered ? 0 : 1,
                    height: isHovered
                      ? 0
                      : "auto",
                    marginTop: isHovered
                      ? 0
                      : "0px",
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
                    style={{
                      minWidth: "80px",
                    }}
                  >
                    <motion.div
                      className="h-full bg-white rounded-full absolute top-0 left-0"
                      style={{
                        boxShadow:
                          "0 0 2px rgba(255, 255, 255, 0.5)",
                      }}
                      initial={false}
                      animate={{
                        width: `${progressPercent}%`,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "linear",
                      }}
                    />
                  </div>

                  <span className="text-[10px] text-white/60 font-mono tabular-nums">
                    {formatTime(duration)}
                  </span>
                </motion.div>
              )}

              {!hasData && (
                <motion.p
                  className="text-[10px] text-white/50 mt-2"
                  animate={{
                    opacity: isHovered ? 0 : 1,
                  }}
                  transition={{
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  Not playing / Last played
                </motion.p>
              )}
            </motion.div>
          </div>
        </div>
      </motion.a>
    </div>
  )
}

function SpotifyGlassSkeleton() {
  return (
    <div className="flex w-full flex-col items-start">
      <div
        className="relative overflow-hidden animate-pulse"
        style={{
          width: "min(220px, 78vw)",
          height: "min(220px, 78vw)",
          borderRadius: "32px",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)",
          }}
        />

        <div
          className="relative h-full w-full backdrop-blur-xl"
          style={{
            borderRadius: "32px",
            border:
              "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: `
              inset 0 1px 1px rgba(255, 255, 255, 0.15),
              inset 0 -1px 1px rgba(0, 0, 0, 0.2),
              0 4px 16px rgba(0, 0, 0, 0.2),
              0 8px 32px rgba(0, 0, 0, 0.15)
            `,
            background:
              "rgba(255, 255, 255, 0.03)",
          }}
        />
      </div>
    </div>
  )
}
