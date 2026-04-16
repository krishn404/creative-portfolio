"use client"

import {
  ArrowUpRight,
  CalendarClock,
  ChevronDown,
  Check,
  Clock,
  Loader2,
  Mic,
  Pencil,
  Send,
  Tag,
  X,
} from "lucide-react"
import Image from "next/image"
import React, { useEffect, useMemo, useReducer, useRef, useState } from "react"
import NeumorphWrapper from './neumorph-wrapper'
import Link from 'next/link'
import { AnimatePresence, motion } from "framer-motion"
import { getCalApi } from "@calcom/embed-react"

//? need neumorph wrapper from nxttp for this component.
type FlowState = "idle" | "recording" | "processing" | "preview" | "confirm" | "success"

type ExtractedTags = {
  projectType: string
  urgency: string
  budgetSignal: string
}

const TAG_OPTIONS: Record<keyof ExtractedTags, string[]> = {
  projectType: [
    "Single cover art",
    "Creative Direction",
    "Thumbnail",
    "Promotional commercial",
    "Clothing",
    "Other",
  ],
  urgency: ["Immediate (1 day)", "1 week", "1 month", "Flexible"],
  budgetSignal: ["Low (2k-5k)", "Flexible (5k-10k)", "Sexy (20k+)"],
}

type VoiceDraft = {
  transcript: string
  tags: ExtractedTags
  audioBlob: Blob | null
  textFallback: string
  timestamp: string
}

type RecorderState = {
  flow: FlowState
  isOpen: boolean
  elapsedMs: number
  amplitude: number
  cancelIntent: boolean
  permissionDenied: boolean
  draft: VoiceDraft
}

type RecorderAction =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "START_RECORDING" }
  | { type: "TICK"; elapsedMs: number }
  | { type: "SET_AMPLITUDE"; amplitude: number }
  | { type: "SET_CANCEL_INTENT"; cancelIntent: boolean }
  | { type: "PROCESSING"; audioBlob: Blob | null }
  | { type: "SET_TRANSCRIPT"; transcript: string; tags: ExtractedTags }
  | { type: "UPDATE_TAG"; key: keyof ExtractedTags; value: string }
  | { type: "SET_TEXT_FALLBACK"; value: string }
  | { type: "SET_PERMISSION_DENIED"; denied: boolean }
  | { type: "GO_CONFIRM" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "RESET_FLOW" }

const initialTags: ExtractedTags = {
  projectType: "General design",
  urgency: "Flexible timeline",
  budgetSignal: "Unspecified",
}

const initialState: RecorderState = {
  flow: "idle",
  isOpen: false,
  elapsedMs: 0,
  amplitude: 0,
  cancelIntent: false,
  permissionDenied: false,
  draft: {
    transcript: "",
    tags: initialTags,
    audioBlob: null,
    textFallback: "",
    timestamp: "",
  },
}

function recorderReducer(state: RecorderState, action: RecorderAction): RecorderState {
  switch (action.type) {
    case "OPEN":
      return { ...state, isOpen: true, flow: "idle" }
    case "CLOSE":
      return { ...initialState }
    case "START_RECORDING":
      return { ...state, flow: "recording", elapsedMs: 0, cancelIntent: false, amplitude: 0 }
    case "TICK":
      return { ...state, elapsedMs: action.elapsedMs }
    case "SET_AMPLITUDE":
      return { ...state, amplitude: action.amplitude }
    case "SET_CANCEL_INTENT":
      return { ...state, cancelIntent: action.cancelIntent }
    case "PROCESSING":
      return {
        ...state,
        flow: "processing",
        amplitude: 0,
        draft: { ...state.draft, audioBlob: action.audioBlob, timestamp: new Date().toISOString() },
      }
    case "SET_TRANSCRIPT":
      return {
        ...state,
        flow: "preview",
        draft: { ...state.draft, transcript: action.transcript, tags: action.tags },
      }
    case "UPDATE_TAG":
      return { ...state, draft: { ...state.draft, tags: { ...state.draft.tags, [action.key]: action.value } } }
    case "SET_TEXT_FALLBACK":
      return { ...state, draft: { ...state.draft, textFallback: action.value } }
    case "SET_PERMISSION_DENIED":
      return { ...state, permissionDenied: action.denied }
    case "GO_CONFIRM":
      return { ...state, flow: "confirm" }
    case "SUBMIT_SUCCESS":
      return { ...state, flow: "success" }
    case "RESET_FLOW":
      return { ...state, flow: "idle", elapsedMs: 0, cancelIntent: false, amplitude: 0 }
    default:
      return state
  }
}

// ─── Cal.com embed loader ─────────────────────────────────────────────────────
function useCalEmbed() {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "30min" })
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" })
    })()
  }, [])
}

const ProfileCard = ({
  name,
  title,
  portfolioText,
  portfolioLink,
  statusText,
  Icon1,
  Icon2,
  SecondaryBtnText,
  subText,
  Icon3,
  sourceContext = "profile-card",
  // ── NEW: your Cal.com link, e.g. "yourname/30min"
  calLink = "",
}: {
  name: string
  title: string
  portfolioText: string
  portfolioLink: string
  statusText: string
  Icon1: React.ElementType
  Icon2: React.ElementType
  SecondaryBtnText: string
  subText: string
  Icon3: React.ElementType
  sourceContext?: string
  /** Cal.com booking link — everything after cal.com/, e.g. "yourname/30min" */
  calLink?: string
}) => {
  const icon1 = <Icon1 className='w-4' />
  const icon2 = <Icon2 className='w-4' />
  const subIcon = <Icon3 className='w-4' />
  const [currentTime, setCurrentTime] = useState('')
  const [recorderState, dispatch] = useReducer(recorderReducer, initialState)
  const [isMobile, setIsMobile] = useState(false)
  const [ctaRect, setCtaRect] = useState<DOMRect | null>(null)
  const [contactDetail, setContactDetail] = useState("")
  const [activeDropdown, setActiveDropdown] = useState<keyof ExtractedTags | null>(null)
  const [isEditingCallSlot, setIsEditingCallSlot] = useState(false)
  const [callSlotDate, setCallSlotDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [callSlotTime, setCallSlotTime] = useState("15:40")

  const primaryButtonRef = useRef<HTMLButtonElement | null>(null)
  const fallbackInputRef = useRef<HTMLTextAreaElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])
  const holdStartRef = useRef<number>(0)
  const dragStartXRef = useRef<number | null>(null)
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Initialise Cal.com embed once
  useCalEmbed()

  useEffect(() => {
    const formatTime = () =>
      new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })

    setCurrentTime(formatTime())
    const interval = setInterval(() => setCurrentTime(formatTime()), 60_000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)")
    const update = () => setIsMobile(mediaQuery.matches)
    update()
    mediaQuery.addEventListener("change", update)
    return () => mediaQuery.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (!recorderState.permissionDenied) return
    fallbackInputRef.current?.focus()
  }, [recorderState.permissionDenied])

  useEffect(() => {
    if (!recorderState.isOpen) return
    const isTypingContext = () => {
      const active = document.activeElement
      if (!(active instanceof HTMLElement)) return false
      const tag = active.tagName.toLowerCase()
      return tag === "input" || tag === "textarea" || active.isContentEditable
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingContext()) return
      if (event.key === "Escape") {
        closeModal()
      }
      if (event.code === "Space" && recorderState.flow !== "recording" && !recorderState.permissionDenied) {
        event.preventDefault()
        startRecording()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (isTypingContext()) return
      if (event.code === "Space" && recorderState.flow === "recording") {
        event.preventDefault()
        stopRecording()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [recorderState.flow, recorderState.isOpen, recorderState.permissionDenied])

  useEffect(() => {
    drawWaveform(recorderState.amplitude)
  }, [recorderState.amplitude, recorderState.isOpen])

  useEffect(
    () => () => {
      stopAudioPipelines()
    },
    []
  )

  const formattedTime = useMemo(() => {
    const seconds = Math.floor(recorderState.elapsedMs / 1000)
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0")
    const secs = String(seconds % 60).padStart(2, "0")
    return `${mins}:${secs}`
  }, [recorderState.elapsedMs])

  const modalOffsetY = ctaRect ? ctaRect.top - 260 : 60
  const modalOrigin = ctaRect
    ? `${ctaRect.left + ctaRect.width / 2}px ${ctaRect.top + ctaRect.height / 2}px`
    : "50% 50%"
  const formattedCallSlot = useMemo(() => {
    const [hourRaw, minuteRaw] = callSlotTime.split(":")
    const hour = Number(hourRaw)
    const minute = Number(minuteRaw)
    const period = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`
  }, [callSlotTime])

  function drawWaveform(amplitude: number) {
    const canvas = waveCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const mid = height / 2
    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = "rgba(204,255,51,0.75)"
    ctx.lineWidth = 2
    ctx.beginPath()

    for (let x = 0; x < width; x += 4) {
      const idle = Math.sin(x * 0.08) * 4
      const pulse = Math.sin(x * 0.1 + performance.now() * 0.006) * amplitude * 24
      const y = mid + idle + pulse
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  function extractTags(text: string): ExtractedTags {
    const normalized = text.toLowerCase()
    const projectType =
      normalized.includes("brand") || normalized.includes("logo")
        ? "Brand identity"
        : normalized.includes("poster")
          ? "Poster design"
          : normalized.includes("website") || normalized.includes("web")
            ? "Web experience"
            : "General design"

    const urgency =
      normalized.includes("urgent") || normalized.includes("asap") || normalized.includes("today")
        ? "High urgency"
        : normalized.includes("week")
          ? "This week"
          : "Flexible timeline"

    const budgetSignal =
      /\b\d{3,}\b/.test(normalized) || normalized.includes("budget")
        ? "Budget discussed"
        : "Unspecified"

    return { projectType, urgency, budgetSignal }
  }

  async function transcribeAudio(audioBlob: Blob | null) {
    const optimistic = recorderState.draft.textFallback || "Need help designing a standout visual identity."
    const fallbackTranscript = optimistic
    try {
      if (!audioBlob) throw new Error("No audio")
      const formData = new FormData()
      formData.append("audio", audioBlob, "voice-note.webm")
      formData.append("sourceContext", sourceContext)

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Transcription failed")
      const payload = (await response.json()) as { transcript?: string }
      const transcript = payload.transcript?.trim() || fallbackTranscript
      dispatch({ type: "SET_TRANSCRIPT", transcript, tags: extractTags(transcript) })
    } catch {
      dispatch({
        type: "SET_TRANSCRIPT",
        transcript: fallbackTranscript,
        tags: extractTags(fallbackTranscript),
      })
    }
  }

  function openModal() {
    if (primaryButtonRef.current) {
      setCtaRect(primaryButtonRef.current.getBoundingClientRect())
    }
    dispatch({ type: "OPEN" })
  }

  function closeModal() {
    stopAudioPipelines()
    dispatch({ type: "CLOSE" })
  }

  function stopAudioPipelines() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (timerRef.current) window.clearInterval(timerRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    audioContextRef.current?.close()
    mediaRecorderRef.current = null
    streamRef.current = null
    analyserRef.current = null
    audioContextRef.current = null
    rafRef.current = null
    timerRef.current = null
    audioChunksRef.current = []
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      const analyser = audioContextRef.current.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        const blob =
          audioChunksRef.current.length > 0 ? new Blob(audioChunksRef.current, { type: "audio/webm" }) : null
        dispatch({ type: "PROCESSING", audioBlob: blob })
        await transcribeAudio(blob)
      }

      recorder.start()
      holdStartRef.current = Date.now()
      dispatch({ type: "START_RECORDING" })

      if (navigator.vibrate) navigator.vibrate(12)

      timerRef.current = window.setInterval(() => {
        const elapsedMs = Date.now() - holdStartRef.current
        dispatch({ type: "TICK", elapsedMs })
        if (elapsedMs >= 30_000) {
          stopRecording()
        }
      }, 100)

      const sample = new Uint8Array(analyser.frequencyBinCount)
      const loop = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(sample)
        const avg = sample.reduce((sum, value) => sum + value, 0) / sample.length
        dispatch({ type: "SET_AMPLITUDE", amplitude: Math.min(1, avg / 128) })
        rafRef.current = requestAnimationFrame(loop)
      }
      loop()
    } catch {
      dispatch({ type: "SET_PERMISSION_DENIED", denied: true })
    }
  }

  function stopRecording(cancelled = false) {
    if (navigator.vibrate) navigator.vibrate(8)
    if (cancelled) {
      stopAudioPipelines()
      dispatch({ type: "RESET_FLOW" })
      return
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    } else {
      dispatch({ type: "PROCESSING", audioBlob: null })
      transcribeAudio(null)
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (timerRef.current) window.clearInterval(timerRef.current)
  }

  function onPressStart(event: React.PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStartXRef.current = event.clientX
    dispatch({ type: "SET_CANCEL_INTENT", cancelIntent: false })
    startRecording()
  }

  function onPressMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (recorderState.flow !== "recording" || dragStartXRef.current === null) return
    const deltaX = event.clientX - dragStartXRef.current
    dispatch({ type: "SET_CANCEL_INTENT", cancelIntent: Math.abs(deltaX) > 80 })
  }

  function onPressEnd(event: React.PointerEvent<HTMLButtonElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId)
    const cancelled = recorderState.cancelIntent
    dragStartXRef.current = null
    stopRecording(cancelled)
  }

  async function submitIdea() {
    const audioDataUrl =
      recorderState.draft.audioBlob !== null
        ? await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "")
            reader.onerror = () => reject(new Error("Failed to encode audio"))
            reader.readAsDataURL(recorderState.draft.audioBlob!)
          }).catch(() => "")
        : ""

    const payload = {
      transcript: recorderState.draft.transcript || recorderState.draft.textFallback,
      textFallback: recorderState.draft.textFallback,
      extractedTags: recorderState.draft.tags,
      timestamp: recorderState.draft.timestamp || new Date().toISOString(),
      sourceContext,
      contactDetail,
      callSlotDate,
      callSlotTime,
      audioCaptured: Boolean(recorderState.draft.audioBlob),
      audioDataUrl: audioDataUrl || undefined,
    }
    try {
      await fetch("/api/shared-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } catch (error) {
      console.error("Failed to save shared idea remotely", error)
    }

    window.localStorage.setItem("profile-card-last-idea", JSON.stringify(payload))
    dispatch({ type: "SUBMIT_SUCCESS" })
  }

  function renderTagDropdown(
    key: keyof ExtractedTags,
    label: string,
    value: string
  ) {
    const isOpen = activeDropdown === key
    return (
      <label className="text-xs text-white/60 relative">
        <span className="flex items-center gap-1 mb-1">
          <Tag className="w-3 h-3" />
          {label}
        </span>
        <button
          type="button"
          onClick={() => setActiveDropdown(isOpen ? null : key)}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-white text-xs flex items-center justify-between hover:bg-white/10 transition-colors"
        >
          <span className="truncate pr-2">{value}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute z-[120] mt-1 w-full rounded-lg border border-white/10 bg-[#181915] shadow-[0_10px_24px_rgba(0,0,0,0.35)] overflow-hidden"
            >
              {TAG_OPTIONS[key].map((option) => {
                const selected = option === value
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      dispatch({ type: "UPDATE_TAG", key, value: option })
                      setActiveDropdown(null)
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs transition-colors ${
                      selected
                        ? "bg-[#ccff33]/20 text-[#d7fb72]"
                        : "text-white/85 hover:bg-white/8"
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </label>
    )
  }

  // ─── Cal.com button — data attributes drive the popup ────────────────────────

  return (
    <>
      <div
        className={`w-[350px] z-10 rounded-[2.2rem] bg-transparent relative group transition-transform duration-300 ${
          recorderState.isOpen ? "scale-[0.96] blur-[1px]" : ""
        }`}
      >
      <div className="w-full  bg-[#20211e] z-20 rounded-[2.2rem] group-hover:[box-shadow:0_10px_10px_0px_#00000099]  overflow-hidden py-4 px-5 flex flex-col gap-4  transition-all duration-400 border group-hover:scale-105 duration-200">
        <div className=" flex flex-col gap-2.5">

          <div className=" w-full flex items-center justify-between text-neutral-500/50 ">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ccff33]" />
              <p className='text-xs'>{statusText}</p>
            </div>
            <div className="text-xs font-mono flex items-center gap-1">
              <Clock className='w-3' />
              {currentTime}
            </div>
          </div>

          <div className="flex items-center justify-start gap-2 ">
            <div className="w-[55px] h-[55px]  rounded-full overflow-hidden flex-shrink-0">
              <Image
                src="/pfp.jpg"
                alt="idk"
                width={500}
                height={500}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-full h-full">
              <h3>{name}</h3>
              <div className="text-xs flex items-center gap-1 text-neutral-500/70">
                <p>{title}</p>
                <p>●</p>
                <Link target='_blank' href={portfolioLink} className='flex items-center justify-center' >
                  <p className='hover:underline '>
                    {portfolioText}
                  </p>
                  <ArrowUpRight className='w-3' />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
        <NeumorphWrapper className="w-full h-max rounded-xl after:border-r-0 after:rounded-xl after:border-t bg-[#363732] after:border-white/10 cursor-pointer">
          <button
            ref={primaryButtonRef}
            onClick={openModal}
            className="w-full h-full text-xs px-3 py-2 cursor-pointer flex items-center justify-center gap-2 text-white"
          >
            <span className="text-white">{icon1}</span>
            <span className="text-white">Share your idea</span>
          </button>
        </NeumorphWrapper>

      <NeumorphWrapper className="cursor-pointer w-full h-max rounded-xl after:border-r-0 after:rounded-xl after:border-t bg-[#20211e] border-black/30">
        <button
          data-cal-namespace="30min"
          data-cal-link="psyx-czskrr/30min"
          data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
          className="w-full h-full text-xs px-3 py-2 cursor-pointer flex items-center justify-center gap-2 text-white"
        >
          <span className="text-white">{icon2}</span>
          <span className="text-white">{SecondaryBtnText}</span>
        </button>
      </NeumorphWrapper>
</div>
      </div>

      <div className="w-[99.5%] left-1/2 translate-x-[-50%] h-[50px] bg-[#CCFF33] -z-10 rounded-b-[2rem] absolute  -bottom-10 [box-shadow:0_-3px_3px_0px_#00000095_inset] -translate-y-[70px] group-hover:translate-y-0 transition-transform duration-200 flex items-end justify-center gap-2 pb-2">
        <div className="flex items-center justify-center gap-2 font-bold text-[#363732]">

          {subIcon}
          <p className=' text-xs'>{subText}</p>
        </div>
      </div>

      </div>

      <AnimatePresence>
        {recorderState.isOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-md"
              onClick={closeModal}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Share your idea"
              className={`relative z-[101] w-full ${
                isMobile
                  ? "h-[92vh] rounded-t-[2rem] bg-[#20211e] border border-white/10 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
                  : "max-w-xl rounded-[2rem] bg-[#20211e] border border-white/10 p-6 shadow-2xl"
              }`}
              initial={{
                opacity: 0,
                scale: 0.82,
                y: modalOffsetY,
                transformOrigin: modalOrigin,
              }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onPointerDown={(event) => {
                if (!isMobile) return
                dragStartXRef.current = event.clientY
              }}
              onPointerUp={(event) => {
                if (!isMobile || dragStartXRef.current === null) return
                if (event.clientY - dragStartXRef.current > 110) closeModal()
                dragStartXRef.current = null
              }}
            >
              {/* ── Header ── */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">Share your idea</p>
                  <p className="text-sm text-white/70">Voice first, text fallback</p>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close idea modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── Horizontal layout: recorder left, fields right ── */}
              <div className="flex gap-3 mb-3">

                {/* Left: recorder */}
                <div className="flex flex-col items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-3 w-[140px] flex-shrink-0">
                  <div className="w-full">
                    <div className="flex items-center justify-between text-[10px] text-white/50 mb-1.5">
                      <span>{recorderState.cancelIntent ? "← cancel" : "hold to rec"}</span>
                      <span className={recorderState.flow === "recording" ? "text-[#ccff33]" : ""}>{formattedTime}</span>
                    </div>
                    <canvas ref={waveCanvasRef} width={200} height={32} className="w-full h-8 rounded-lg bg-black/30 mb-2" />
                  </div>
                  <button
                    type="button"
                    onPointerDown={onPressStart}
                    onPointerMove={onPressMove}
                    onPointerUp={onPressEnd}
                    onPointerCancel={() => stopRecording(true)}
                    disabled={recorderState.flow === "processing"}
                    className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-200 ${
                      recorderState.flow === "recording"
                        ? recorderState.cancelIntent
                          ? "bg-red-500/25 border-red-400 text-red-300 scale-95"
                          : "bg-[#ccff33]/20 border-[#ccff33] text-[#ccff33] scale-105"
                        : "bg-white/5 border-white/20 text-white hover:scale-105"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                    aria-label="Hold to record voice"
                  >
                    {recorderState.flow === "processing"
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : <Mic className="w-5 h-5" />}
                  </button>
                </div>

                {/* Right: required fields */}
                <div className="flex flex-col gap-2 flex-1">
                  {/* Transcript preview */}
                  {(recorderState.flow === "preview" || recorderState.flow === "confirm" || recorderState.flow === "success") && (
                    <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5">
                      <p className="text-[10px] text-white/40 mb-0.5">Understood</p>
                      <p className="text-xs text-white/80 leading-snug line-clamp-2">
                        {recorderState.draft.transcript || recorderState.draft.textFallback}
                      </p>
                    </div>
                  )}

                  {/* Note — required */}
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-white/50 flex items-center gap-1">
                      Your brief <span className="text-[#ccff33]">*</span>
                    </span>
                    <textarea
                      ref={fallbackInputRef as React.RefObject<HTMLTextAreaElement>}
                      value={recorderState.draft.textFallback}
                      onChange={(e) => dispatch({ type: "SET_TEXT_FALLBACK", value: e.target.value })}
                      placeholder="Describe what you need..."
                      rows={2}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ccff33]/60 resize-none"
                    />
                  </label>

                  {/* Contact — required */}
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-white/50 flex items-center gap-1">
                      Email or IG handle <span className="text-[#ccff33]">*</span>
                    </span>
                    <input
                      value={contactDetail}
                      onChange={(e) => setContactDetail(e.target.value)}
                      placeholder="@handle or email@..."
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ccff33]/60"
                    />
                  </label>
                </div>
              </div>

              {/* ── Tags row — always visible after preview ── */}
              {(recorderState.flow === "preview" || recorderState.flow === "confirm" || recorderState.flow === "success") && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {renderTagDropdown("projectType", "Type", recorderState.draft.tags.projectType)}
                  {renderTagDropdown("urgency", "Urgency", recorderState.draft.tags.urgency)}
                  {renderTagDropdown("budgetSignal", "Budget", recorderState.draft.tags.budgetSignal)}
                </div>
              )}

              {/* ── Permission denied notice ── */}
              {recorderState.permissionDenied && (
                <p className="text-[10px] text-amber-300 mb-2">
                  Mic blocked — fill in your brief above to continue.
                </p>
              )}

              {/* ── Confirm panel (compact) ── */}
              {recorderState.flow === "confirm" && (
                <div className="flex items-center justify-between rounded-lg border border-[#ccff33]/20 bg-[#ccff33]/8 px-3 py-2 mb-3">
                  <div className="flex items-center gap-2 text-[#ddf98c]">
                    <CalendarClock className="w-3.5 h-3.5 flex-shrink-0" />
                    <button
                      type="button"
                      onClick={() => setIsEditingCallSlot((p) => !p)}
                      className="text-[11px] underline decoration-dotted"
                    >
                      Call slot: {formattedCallSlot}
                      <Pencil className="w-2.5 h-2.5 inline ml-1" />
                    </button>
                  </div>
                  <p className="text-[11px] text-[#ddf98c]/70">Reply in 6 h</p>
                </div>
              )}

              {/* ── Call slot editor ── */}
              <AnimatePresence>
                {isEditingCallSlot && recorderState.flow === "confirm" && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="grid grid-cols-2 gap-2 mb-3"
                  >
                    <NeumorphWrapper className="rounded-lg border-white/10 bg-[#2a2b26] after:border-[#47483f]">
                      <input
                        type="date"
                        value={callSlotDate}
                        onChange={(e) => setCallSlotDate(e.target.value)}
                        className="w-full rounded-lg bg-transparent px-2.5 py-2 text-xs text-white outline-none [color-scheme:dark]"
                        aria-label="Preferred call date"
                      />
                    </NeumorphWrapper>
                    <NeumorphWrapper className="rounded-lg border-white/10 bg-[#2a2b26] after:border-[#47483f]">
                      <input
                        type="time"
                        value={callSlotTime}
                        onChange={(e) => setCallSlotTime(e.target.value)}
                        className="w-full rounded-lg bg-transparent px-2.5 py-2 text-xs text-white outline-none [color-scheme:dark]"
                        aria-label="Preferred call time"
                      />
                    </NeumorphWrapper>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Success / Action row ── */}
              {recorderState.flow === "success" ? (
                <div className="rounded-xl border border-[#ccff33]/30 bg-[#ccff33]/10 p-3 text-center">
                  <Check className="w-5 h-5 mx-auto text-[#ccff33] mb-1" />
                  <p className="text-sm font-medium text-white">Idea received.</p>
                  <p className="text-xs text-white/60 mt-0.5">Response within 6 hours.</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => dispatch({ type: "GO_CONFIRM" })}
                    disabled={
                      (recorderState.flow !== "preview" && !recorderState.draft.textFallback) ||
                      !recorderState.draft.textFallback.trim() ||
                      !contactDetail.trim()
                    }
                    className="flex-1 rounded-xl bg-[#ccff33] text-[#20211e] text-sm font-semibold px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-95 transition"
                  >
                    {recorderState.flow === "preview" ? "Confirm" : "Review & send"}
                  </button>
                  <button
                    onClick={submitIdea}
                    disabled={
                      recorderState.flow !== "confirm" ||
                      !recorderState.draft.textFallback.trim() ||
                      !contactDetail.trim()
                    }
                    className="rounded-xl border border-white/15 px-3 py-2.5 text-white/85 disabled:opacity-40"
                    aria-label="Submit idea"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ProfileCard