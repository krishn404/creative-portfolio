"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import Hero from "@/components/hero"
import Gallery from "@/components/gallery"
import About from "@/components/about"
import Contact from "@/components/contact"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50">
        <ThemeToggle />
      </div>
      <Hero />
      <Gallery />
      <About />
      <Contact />
    </main>
  )
}
