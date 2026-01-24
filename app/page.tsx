"use client"

import Hero from "@/components/hero"
import Gallery from "@/components/gallery"
import About from "@/components/about"
import Contact from "@/components/contact"
import Stickers from "@/components/stickers"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Stickers />
      <Hero />
      <About />
      <Gallery />
      <Contact />
    </main>
  )
}
