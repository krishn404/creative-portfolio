"use client"

import Hero from "@/components/hero"
import Gallery from "@/components/gallery"
import About from "@/components/about"
import Contact from "@/components/contact"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <Gallery />
      <About />
      <Contact />
    </main>
  )
}
