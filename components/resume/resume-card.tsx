"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Instagram, RotateCcw } from "lucide-react"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const artistCards = [
  { name: "Onkar Yadav", initials: "OY", description: "Add your note about working together here.", image: undefined },
  { name: "Siyaahi", initials: "SI", description: "Add your note about working together here.", image: undefined },
  { name: "Young Mak", initials: "YM", description: "Add your note about working together here.", image: undefined },
  { name: "Drip Devta", initials: "DD", description: "Add your note about working together here.", image: undefined },
  { name: "OG Lucifer", initials: "OL", description: "Add your note about working together here.", image: undefined },
  { name: "Hyke", initials: "HY", description: "Add your note about working together here.", image: undefined },
] as const

type ResumeCardProps = { daysPosting: number }

export function ResumeCard({ daysPosting }: ResumeCardProps) {
  const [flipped, setFlipped] = useState(false)
  const titleNote = "I don't really claim the title of a traditional designer or artist. I build my work by blending outside inspiration, my own original ideas, and AI tools to make the process faster. I'm just someone who enjoys making visuals without worrying about the label."

  return (
    <div className="h-full [perspective:1800px]">
      <div
        className={`relative mx-auto h-full max-w-6xl rounded-[22px] transition-transform duration-700 ease-[cubic-bezier(.2,.75,.25,1)] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute inset-0 overflow-hidden rounded-[22px] border border-black/10 bg-[#fbfbf8] shadow-[0_1px_3px_rgb(0_0_0_/_0.04)]"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#c8c7be_0.6px,transparent_0.6px)] [background-size:5px_5px]" />
          <header className="relative flex min-h-20 items-center justify-between px-5 py-3 sm:px-7">
            <Link href="/" aria-label="Back to home" className="text-lg font-semibold tracking-[-0.12em] transition-all duration-300 hover:scale-110 hover:opacity-60 active:scale-95">K.</Link>
            <button type="button" onClick={() => setFlipped(true)} className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-black/55 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:border-black/30 hover:bg-white hover:text-black active:translate-y-0 active:scale-95">
              Flip me <RotateCcw className="size-3" />
            </button>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-black/45 sm:block sm:text-[10px]">Independent visual practice</span>
          </header>

          <section className="relative flex h-[calc(100%-8.5rem)] flex-col justify-center px-5 py-2 sm:px-10 md:px-14">
            <div className="max-w-5xl">
              <div className="mb-4 flex items-center gap-3 sm:mb-6 sm:gap-4">
                <Image src="/pfp.jpg" alt="Krishna Kant" width={64} height={64} className="size-10 rounded-full object-cover sm:size-14" priority />
                <p className="text-xs text-black/55 sm:text-sm">
                  Krishna Kant · Creative{" "}
                  <Tooltip><TooltipTrigger asChild><span className="cursor-help underline decoration-black/25 underline-offset-4">artist</span></TooltipTrigger><TooltipContent side="bottom" sideOffset={8} className="max-w-72 bg-[#242424] text-white">{titleNote}</TooltipContent></Tooltip>
                  {" "}&{" "}
                  <Tooltip><TooltipTrigger asChild><span className="cursor-help underline decoration-black/25 underline-offset-4">designer</span></TooltipTrigger><TooltipContent side="bottom" sideOffset={8} className="max-w-72 bg-[#242424] text-white">{titleNote}</TooltipContent></Tooltip>
                </p>
              </div>
              <h1 className="max-w-4xl text-balance text-[2rem] font-medium leading-[0.98] tracking-[-0.07em] sm:text-5xl md:text-6xl lg:text-7xl">Hi, I’m Krishna Kant.<br /> I make cover art, social creatives & visual stufffor artists.</h1>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs leading-5 text-black/55 sm:mt-5 sm:text-sm sm:leading-6">
                <p>Cover art, carousel posts, interview posts and creative direction.Posting at <a className="text-black underline decoration-black/25 underline-offset-4 hover:decoration-black" href="https://instagram.com/kantcancook" target="_blank" rel="noreferrer">@kantcancook</a> for {daysPosting} days straight, literally.</p>
                <p>Comfortable with Photoshop, Canva, Premiere Pro <span className="text-black/40">(still learning)</span>, and the AI ecosystem.</p>
                <p><Link className="rounded-full border border-black/10 bg-white/50 px-2.5 py-1 text-black transition-all duration-300 hover:-translate-y-0.5 hover:border-black/25 hover:bg-white active:translate-y-0" href="/blog">Artist blog</Link></p>
              </div>
            </div>
            {/* <div className="relative mt-5 sm:mt-8">
              <p className="mb-2 font-serif text-2xl tracking-[-0.05em] sm:mb-3 sm:text-3xl">Selected artists</p>
              <div className="flex w-fit max-w-full gap-1.5 overflow-hidden rounded-2xl border border-black/10 bg-black/10 p-1.5 sm:gap-2 sm:p-2">
                {artistCards.map((artist, index) => <Tooltip key={artist.name}><TooltipTrigger asChild><button type="button" aria-label={`Details for ${artist.name}`} className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-[#e5e5e1] text-[10px] font-medium transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-md active:scale-95 sm:size-14 sm:text-xs">{artist.image ? <Image src={artist.image} alt={artist.name} fill className="object-cover" sizes="56px" /> : <span className={`flex size-full items-center justify-center ${index % 2 ? "bg-[#d7d6d0]" : "bg-[#ecece7]"}`}>{artist.initials}</span>}</button></TooltipTrigger><TooltipContent side="top" sideOffset={10} className="max-w-56 bg-[#242424] px-3 py-2 text-white"><p className="font-medium">{artist.name}</p><p className="mt-0.5 text-white/70">{artist.description}</p></TooltipContent></Tooltip>)}
              </div>
            </div> */}
          </section>
          <footer className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-black/10 px-5 py-4 sm:px-7"><a href="mailto:psyxdes@gmail.com" className="group flex max-w-[82%] items-center gap-1.5 text-[11px] leading-4 text-black/65 transition hover:text-black sm:max-w-none sm:text-sm">Hit me up if you need social media creatives, thumbnails, cover art, or any other stufffff.<ArrowUpRight className="size-4 shrink-0" /></a><a aria-label="Instagram" href="https://instagram.com/kantcancook" target="_blank" rel="noreferrer" className="rounded-full border border-black/15 p-2 text-black/65"><Instagram className="size-3.5" /></a></footer>
        </div>

        <div
          className="absolute inset-0 flex flex-col overflow-hidden rounded-[22px] border border-black/10 bg-[#191919] text-[#f6f6f0] shadow-[0_1px_3px_rgb(0_0_0_/_0.04)] [transform:rotateY(180deg)]"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(#a4a39c_0.6px,transparent_0.6px)] [background-size:5px_5px]" />
          <header className="relative flex min-h-20 items-center justify-between px-5 py-3 sm:px-7"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Side B / the other stuff</span><button type="button" onClick={() => setFlipped(false)} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/65 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:border-white/40 hover:text-white active:translate-y-0 active:scale-95"><ArrowLeft className="size-3" /> Flip back</button></header>
          <section className="relative flex flex-1 flex-col justify-center px-5 sm:px-10 md:px-14">
  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
    Who's actually behind this
  </p>
  <h2 className="mt-3 max-w-4xl text-balance text-3xl font-medium leading-[1] tracking-[-0.065em] sm:text-5xl md:text-6xl">
    Not a designer. Not an artist. A web dev who couldn't stop making visuals.
  </h2>
  <p className="mt-5 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
    I'm a Computer Applications grad who's still deep in code. The visuals
    started as fun and never stopped. I take inspiration from everywhere, mix
    it with my own ideas, and let AI handle the slow parts. I don't really
    care about the label. I just like making things look good.
  </p>
  <div className="mt-7 grid max-w-3xl grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3">
    <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
      <p className="text-2xl tracking-[-0.06em] sm:text-3xl">{daysPosting}</p>
      <p className="mt-1 text-xs leading-4 text-white/55">days straight, posting daily since 01 Oct 2025</p>
    </div>
    <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
      <p className="text-2xl tracking-[-0.06em] sm:text-3xl">80K–100K</p>
      <p className="mt-1 text-xs leading-4 text-white/55">people stopping by on Instagram every month</p>
    </div>
    <div className="col-span-2 rounded-2xl border border-white/12 bg-white/5 p-4 sm:col-span-1">
      <p className="text-2xl tracking-[-0.06em] sm:text-3xl">Inspo × ideas × AI</p>
      <p className="mt-1 text-xs leading-4 text-white/55">the recipe, no title attached</p>
    </div>
  </div>
</section>
</div>
      </div>
    </div>
  )
}
