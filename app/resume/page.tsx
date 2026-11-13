import type { Metadata } from "next"
import { ResumeCard } from "@/components/resume/resume-card"

export const metadata: Metadata = {
  title: "Resume — Krishna Kant",
  description: "Krishna Kant is a graphic designer and visual artist based in India.",
}

function daysSinceOctoberFirst2025() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date())
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value)
  const today = Date.UTC(part("year"), part("month") - 1, part("day"))
  return Math.max(1, Math.floor((today - Date.UTC(2025, 9, 1)) / 86_400_000) + 1)
}

export default function ResumePage() {
  return (
    <main className="h-svh overflow-hidden bg-[#f7f7f3] px-3 py-3 text-[#161616] sm:px-5 sm:py-5">
      <ResumeCard daysPosting={daysSinceOctoberFirst2025()} />
    </main>
  )
}
