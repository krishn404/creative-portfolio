"use client"

import { useEffect, useState, useRef } from "react"
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

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatTime(ms: number | null): string {
  if (!ms) return "0:00"
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export default function SpotifyGlassWidget() {
  const { data, error } = useSWR<SpotifyStatus | null>("/api/spotify/status", fetcher, {
    refreshInterval: 1000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  const [mounted, setMounted] = useState(false)
  const [localProgress, setLocalProgress] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)

    if (data?.isPlaying && data.progressMs !== null && data.durationMs !== null) {
      setLocalProgress(data.progressMs)

      progressIntervalRef.current = setInterval(() => {
        setLocalProgress((prev) => {
          const next = prev + 1000
          if (data.durationMs && next >= data.durationMs) return data.durationMs
          return next
        })
      }, 1000)
    } else {
      setLocalProgress(0)
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [data?.isPlaying, data?.progressMs, data?.durationMs])

  useEffect(() => {
    if (data?.progressMs !== null && data?.isPlaying) {
      setLocalProgress(data.progressMs)
    }
  }, [data?.progressMs, data?.isPlaying])

  if (!mounted) return <SpotifyGlassSkeleton />

  const hasData = !error && !!data
  const isPlaying = data?.isPlaying ?? false
  const progress = localProgress
  const duration = data?.durationMs ?? 0
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs text-gray-400 mb-3 font-light tracking-wide">Currently Listening</p>

      <motion.a
        href={hasData ? data!.url : "https://open.spotify.com"}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="relative overflow-visible"
          style={{
            width: "240px",
            borderRadius: "24px",
          }}
        >
          <div
            className="relative bg-white/60 dark:bg-white/5 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            style={{
              borderRadius: "24px",
              padding: "20px",
              paddingTop: "24px",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: "24px",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.3)",
              }}
            />

            <div className="relative mb-6" style={{ marginTop: "-8px" }}>
              <div
                className="relative mx-auto"
                style={{
                  width: "180px",
                  height: "180px",
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
                    repeat: isPlaying && !shouldReduceMotion ? Infinity : 0,
                    ease: "linear",
                  }}
                  style={{
                    transformOrigin: "center center",
                  }}
                >
                  <div
                    className="relative w-full h-full rounded-full overflow-hidden"
                    style={{
                      // ✅ FIX: use backgroundImage instead of background shorthand
                      backgroundImage: data?.albumArt
                        ? "none"
                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",

                      boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.1)",
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
                            "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255, 255, 255, 0.05) 10px, rgba(255, 255, 255, 0.05) 20px)",
                        }}
                      />
                    )}

                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.15) 15%, transparent 40%, rgba(0, 0, 0, 0.1) 70%, rgba(0, 0, 0, 0.2) 100%)",
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
                            rgba(0, 0, 0, 0.06) 2px,
                            rgba(0, 0, 0, 0.06) 3px,
                            transparent 3px,
                            transparent 5px
                          )
                        `,
                        maskImage:
                          "radial-gradient(circle, transparent 18%, black 20%, black 82%, transparent 85%)",
                        WebkitMaskImage:
                          "radial-gradient(circle, transparent 18%, black 20%, black 82%, transparent 85%)",
                        opacity: 0.6,
                      }}
                    />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="absolute rounded-full"
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundImage:
                            "radial-gradient(circle, transparent 60%, rgba(0, 0, 0, 0.2) 65%, rgba(0, 0, 0, 0.15) 70%, transparent 75%)",
                        }}
                      />
                      <div
                        className="relative rounded-full bg-gray-900/30 dark:bg-gray-100/20"
                        style={{
                          width: "28px",
                          height: "28px",
                          boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.3)",
                        }}
                      />
                    </div>

                    {!isPlaying && (
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.35)",
                          backdropFilter: "blur(1px)",
                        }}
                      />
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p
                className="text-xs text-gray-500 dark:text-gray-400 font-light"
                style={{ lineHeight: "1.2" }}
              >
                {hasData ? data!.artist : "Not playing"}
              </p>

              <h3
                className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate px-2"
                style={{ lineHeight: "1.3" }}
              >
                {hasData ? data!.title : "Last played"}
              </h3>

              {hasData && duration > 0 && (
                <div className="flex items-center gap-2 px-2 mt-3">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono tabular-nums">
                    {formatTime(progress)}
                  </span>

                  <div
                    className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative"
                    style={{ minWidth: "80px" }}
                  >
                    <motion.div
                      className="h-full bg-gray-900 dark:bg-gray-100 rounded-full absolute top-0 left-0"
                      style={{
                        boxShadow:
                          "0 0 6px rgba(0, 0, 0, 0.4), 0 0 2px rgba(0, 0, 0, 0.2)",
                        filter: "drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))",
                      }}
                      initial={false}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.3, ease: "linear" }}
                    />
                  </div>

                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono tabular-nums">
                    {formatTime(duration)}
                  </span>
                </div>
              )}

              {!hasData && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                  Not playing / Last played
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.a>
    </div>
  )
}

function SpotifyGlassSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <p className="text-xs text-gray-400 mb-3 font-light tracking-wide">Currently Listening</p>

      <div
        className="relative bg-white/60 dark:bg-white/5 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-pulse"
        style={{
          width: "240px",
          borderRadius: "24px",
          padding: "20px",
          paddingTop: "24px",
          height: "320px",
        }}
      />
    </div>
  )
}
