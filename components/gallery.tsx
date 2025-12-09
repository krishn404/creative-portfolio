"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import type { WorkItem, SiteContent } from "@/lib/content"
import { getBrowserSupabase } from "@/lib/supabase/client"

export default function Gallery() {
  const [works, setWorks] = useState<WorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<"All" | "Posters" | "Thumbnails" | "Graphic Clothing">("All")

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/content", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load works")
        const data = (await res.json()) as SiteContent
        setWorks(data.works)
      } catch (err) {
        console.error(err)
        setWorks([])
      } finally {
        setLoading(false)
      }
    }

    const supabase = getBrowserSupabase()
    const channel = supabase
      .channel("public-gallery")
      .on("postgres_changes", { event: "*", schema: "public", table: "works" }, load)
      .subscribe()

    load()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filtered = category === "All" ? works : works.filter((w) => w.category === category)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.23, 1, 0.82, 1] as const,
      },
    },
  }

  return (
    <section ref={ref} className="min-h-screen py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-xs font-light tracking-widest uppercase text-black/50 mb-2">Selected works</p>
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-black">Poster Collection</h2>
        </motion.div>

        <div className="flex gap-3 mb-6">
          {["All", "Posters", "Thumbnails", "Graphic Clothing"].map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setCategory(cat as any)}
              className={`px-3 py-2 text-sm rounded-full border transition ${
                category === cat ? "border-black bg-black text-white" : "border-black/10 text-black hover:border-black/40"
              }`}
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -2 }}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <p className="text-black/60">Loading works...</p>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            {filtered.length === 0 ? (
              <p className="text-black/50">No works yet. Check back soon.</p>
            ) : (
              filtered.map((poster) => (
                <motion.div
                  key={poster.id}
                  variants={itemVariants}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group cursor-pointer"
                >
                  <div className="aspect-square rounded-sm shadow-sm border border-black/5 overflow-hidden transition-shadow duration-500 group-hover:shadow-md relative">
                    <motion.img
                      src={poster.img}
                      alt={poster.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    <motion.div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                  </div>

                  <div className="mt-4 flex justify-between items-baseline">
                    <h3 className="text-sm font-light tracking-wide text-black">{poster.title}</h3>
                    <p className="text-xs text-black/40">{poster.year}</p>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}
