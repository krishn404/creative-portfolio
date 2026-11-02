"use client"

import Hero from "@/components/hero"
import Gallery from "@/components/gallery"
import About from "@/components/about"
import BlogSection from "@/components/blog/BlogSection"
import Contact from "@/components/contact"
import Stickers from "@/components/stickers"
import type { BlogPostCard } from "@/lib/blog/utils"

export default function HomePage({ initialPosts = [] }: { initialPosts?: BlogPostCard[] }) {
  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Stickers />
      <Hero />
      <About />
      <Gallery />
      <BlogSection initialPosts={initialPosts} />
      <Contact />
    </main>
  )
}
