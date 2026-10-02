"use client"

import Image from "next/image"
import { useAnimate, useReducedMotion, motion } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import type { AnimationPlaybackControls } from "framer-motion"
import type { PosterData } from "./poster-data"
import styles from "./poster-intro.module.css"

const EASE = [0.22, 1, 0.36, 1] as const

type PosterCardProps = {
  poster: PosterData
  priority?: boolean
}

export function PortraitCard({ className = "" }: { className?: string }) {
  return (
    <motion.div className={`${styles.portraitCard} ${className}`} data-portrait>
      <Image
        src="/pfp.jpg"
        alt="Illustrated portrait of Krishna Kant Maharshi"
        fill
        priority
        sizes="(max-width: 640px) 82px, 112px"
        className={styles.portraitImage}
      />
    </motion.div>
  )
}

export function PosterCard({ poster, priority = false }: PosterCardProps) {
  return (
    <motion.article
      className={styles.posterCard}
      data-poster-id={poster.id}
      style={{
        "--poster-column": poster.gridPosition.column,
        "--poster-row": poster.gridPosition.row,
      } as React.CSSProperties}
      aria-label={poster.alt}
    >
      <Image
        src={poster.image}
        alt={poster.alt}
        fill
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        sizes="(max-width: 640px) 44vw, 28vw"
        className={styles.posterImage}
      />
    </motion.article>
  )
}

export function PosterGallery({ posters }: { posters: PosterData[] }) {
  return (
    <div className={styles.posterGallery} aria-label="Selected poster and campaign work">
      {posters.map((poster, index) => (
        <PosterCard key={poster.id} poster={poster} priority={index < 3} />
      ))}
    </div>
  )
}

export function PosterStack({ posters }: { posters: PosterData[] }) {
  return (
    <div className={styles.posterStage}>
      <PosterGallery posters={posters} />
    </div>
  )
}

export function PosterOutro({ visible }: { visible: boolean }) {
  return (
    <motion.p className={styles.outroCopy} data-outro-copy aria-live="polite" aria-hidden={!visible}>
      TYSM YALL
    </motion.p>
  )
}

export default function PosterIntro({ posters }: { posters: PosterData[] }) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const prefersReducedMotion = useReducedMotion()
  const [canReplay, setCanReplay] = useState(false)
  const sequenceId = useRef(0)
  const timers = useRef(new Map<ReturnType<typeof setTimeout>, () => void>())

  const runSequence = useCallback(async () => {
    const root = scope.current
    if (!root) return
    const currentSequence = ++sequenceId.current
    setCanReplay(false)

    const portrait = root.querySelector<HTMLElement>("[data-portrait]")
    const introCopy = root.querySelector<HTMLElement>("[data-intro-copy]")
    const outroCopy = root.querySelector<HTMLElement>("[data-outro-copy]")
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-poster-id]"))
    if (!portrait || !introCopy || !outroCopy) return

    const play = (element: Element, values: Record<string, number>, options: Record<string, unknown>) => {
      const controls = animate(element, values, options as never) as AnimationPlaybackControls
      return controls.finished.catch(() => undefined)
    }
    const waitUntil = (time: number, start: number) => new Promise<void>((resolve) => {
      const remaining = Math.max(0, time - (performance.now() - start))
      let timer: ReturnType<typeof setTimeout>
      const finish = () => {
        timers.current.delete(timer)
        resolve()
      }
      timer = setTimeout(finish, remaining)
      timers.current.set(timer, finish)
    })
    const animateCards = (getValues: (index: number) => Record<string, number>, options: Record<string, unknown>) =>
      Promise.all(cards.map((card, index) => play(card, getValues(index), {
        ease: EASE,
        delay: index * 0.014,
        ...options,
      })))

    const start = performance.now()
    await Promise.all([
      play(portrait, { opacity: 0, scale: 0.78, x: 0, y: 0 }, { duration: 0 }),
      play(introCopy, { opacity: 0, y: 8 }, { duration: 0 }),
      play(outroCopy, { opacity: 0, y: 8 }, { duration: 0 }),
      ...cards.map((card) => play(card, { opacity: 0, scale: 1, x: 0, y: 0, rotate: 0 }, { duration: 0 })),
    ])
    if (currentSequence !== sequenceId.current) return

    const portraitRect = portrait.getBoundingClientRect()
    const portraitCenter = {
      x: portraitRect.left + portraitRect.width / 2,
      y: portraitRect.top + portraitRect.height / 2,
    }
    const stackTargets = cards.map((card, index) => {
      const poster = posters[index]
      const rect = card.getBoundingClientRect()
      return {
        x: portraitCenter.x - (rect.left + rect.width / 2) + poster.stackPosition.x,
        y: portraitCenter.y - (rect.top + rect.height / 2) + poster.stackPosition.y,
        rotate: poster.stackPosition.rotate,
        scale: poster.stackPosition.scale,
      }
    })

    const initialTargets = cards.map((card, index) => {
      const rect = card.getBoundingClientRect()
      return {
        x: portraitCenter.x - (rect.left + rect.width / 2) + posters[index].initialPosition.x,
        y: portraitCenter.y - (rect.top + rect.height / 2) + posters[index].initialPosition.y,
        rotate: 0,
        scale: 0.34,
      }
    })

    await animateCards((index) => ({ ...initialTargets[index], opacity: 0 }), { duration: 0 })
    if (currentSequence !== sequenceId.current) return

    if (prefersReducedMotion) {
      await Promise.all([
        play(portrait, { opacity: 1, scale: 1, x: 0, y: 0 }, { duration: 0 }),
        play(introCopy, { opacity: 0 }, { duration: 0 }),
        play(outroCopy, { opacity: 1 }, { duration: 0 }),
        ...cards.map((card) => play(card, { opacity: 0 }, { duration: 0 })),
      ])
      setCanReplay(true)
      return
    }

    // Scene 1 — portrait and title arrive together on the black field.
    void play(portrait, { opacity: 1, scale: 1, x: 0, y: 0 }, { duration: 0.68, ease: EASE })
    void play(introCopy, { opacity: 1, y: 0 }, { duration: 0.44, delay: 0.14, ease: EASE })
    await waitUntil(800, start)
    if (currentSequence !== sequenceId.current) return

    // Scene 2 — six prints gather into a loose physical stack behind the portrait.
    await animateCards((index) => ({ ...stackTargets[index], opacity: 1 }), {
      type: "spring",
      stiffness: 105,
      damping: 19,
      duration: 0.72,
    })
    await waitUntil(1800, start)
    if (currentSequence !== sequenceId.current) return

    // Scene 3 — the stack opens into a three-column gallery.
    void play(introCopy, { opacity: 0, y: -12 }, { duration: 0.25, ease: EASE })
    void play(portrait, { opacity: 1, scale: 0.72, x: root.clientWidth * 0.34, y: -root.clientHeight * 0.34 }, {
      duration: 0.8,
      ease: EASE,
    })
    await animateCards(() => ({ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }), {
      duration: 0.72,
      ease: EASE,
    })
    await waitUntil(2700, start)
    if (currentSequence !== sequenceId.current) return

    // Scene 4 — a near-still wall of work, with only a few columns breathing.
    const driftAnimations = cards.map((card, index) => play(card,
      { y: index % 3 === 1 ? -5 : index % 3 === 2 ? 4 : 0 },
      { duration: 1.35, delay: index % 3 === 1 ? 0.12 : 0, ease: EASE, repeat: 1, repeatType: "reverse" },
    ))
    await waitUntil(5500, start)
    if (currentSequence !== sequenceId.current) return
    void Promise.all(driftAnimations)

    // Scene 5 — every poster folds toward the portrait's center point.
    void play(portrait, { opacity: 1, scale: 0.78, x: 0, y: 0 }, { duration: 0.72, ease: EASE })
    await animateCards((index) => ({ ...stackTargets[index], opacity: 0.92 }), {
      type: "spring",
      stiffness: 115,
      damping: 21,
      duration: 0.68,
    })
    await waitUntil(6700, start)
    if (currentSequence !== sequenceId.current) return

    // Scene 6 — clear the deck and settle on the thank-you frame.
    await Promise.all([
      animateCards(() => ({ opacity: 0, scale: 0.34 }), { duration: 0.28, ease: EASE }),
      play(portrait, { opacity: 1, scale: 1, x: 0, y: 0 }, { duration: 0.54, ease: EASE }),
      play(outroCopy, { opacity: 1, y: 0 }, { duration: 0.5, delay: 0.14, ease: EASE }),
    ])
    await waitUntil(8000, start)
    if (currentSequence === sequenceId.current) setCanReplay(true)
  }, [animate, posters, prefersReducedMotion, scope])

  const runSequenceRef = useRef(runSequence)
  runSequenceRef.current = runSequence

  useEffect(() => {
    void runSequenceRef.current()
    return () => {
      sequenceId.current += 1
      timers.current.forEach((finish, timer) => {
        clearTimeout(timer)
        finish()
      })
      timers.current.clear()
    }
  }, [])

  return (
    <main className={styles.canvas} ref={scope} aria-label="365 days, 365 posters portfolio intro">
      <h1 className={styles.srOnly}>365 days, 365 posters by Krishna Kant Maharshi</h1>
      <PosterStack posters={posters} />

      <div className={styles.portraitAnchor}>
        <PortraitCard className={styles.heroPortrait} />
      </div>
      <motion.div className={styles.introCopy} data-intro-copy aria-hidden="true">
        <span>365 DAYS</span>
        <span>365 POSTERS</span>
      </motion.div>
      <PosterOutro visible={canReplay} />

      {canReplay && !prefersReducedMotion && (
        <button className={styles.replayButton} onClick={() => void runSequence()} type="button">
          REPLAY
        </button>
      )}
    </main>
  )
}
