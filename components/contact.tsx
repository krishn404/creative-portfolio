"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import type { SiteContent } from "@/lib/content"
import { getBrowserSupabase } from "@/lib/supabase/client"

const defaultCta = "Interested in collaborating or commissioning a piece? I'd love to hear about your project."
const defaultEmail = "psyxdes@gmail.com"
const defaultSocials = [
  { label: "Instagram", href: "https://instagram.com/kantcancook" },
  { label: "Pinterest", href: "https://pinterest.com/psyxyx" },
  { label: "LinkedIn", href: "https://linkedin.com/in/krishn404" },
  { label: "Email", href: "mailto:psyxdes@gmail.com" },
]

export default function Contact() {
  const [cta, setCta] = useState(defaultCta)
  const [email, setEmail] = useState(defaultEmail)
  const [socialLinks, setSocialLinks] = useState<{ label: string; href: string }[]>(defaultSocials)

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/content", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load contact")
        const data = (await res.json()) as SiteContent
        setCta(data.contact?.cta ?? defaultCta)
        setEmail(data.contact?.email ?? defaultEmail)
        setSocialLinks(Array.isArray(data.contact?.socials) ? data.contact.socials : defaultSocials)
      } catch (err) {
        console.error(err)
      }
    }
    const supabase = getBrowserSupabase()
    const channel = supabase
      .channel("public-contact")
      .on("postgres_changes", { event: "*", schema: "public", table: "content" }, load)
      .subscribe()

    load()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.23, 1, 0.82, 1],
      },
    },
  }

  return (
    <section
      ref={ref}
      className="min-h-screen py-20 px-4 bg-white border-t border-black/5 flex items-center"
    >
      <div className="max-w-3xl mx-auto w-full text-center">
        <motion.div
          className="space-y-12"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {/* Heading */}
          <motion.div variants={itemVariants}>
            <p className="text-xs font-light tracking-widest uppercase text-black/50 mb-4">
              Get in Touch
            </p>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-black mb-4">
              Let's create together
            </h2>
            <p className="text-lg font-light text-black/60 leading-relaxed">{cta}</p>
          </motion.div>

          {/* CTA Button */}
          <motion.div variants={itemVariants}>
            <motion.a
              href={`mailto:${email}`}
              className="inline-block px-8 py-3 border border-black rounded-full text-sm font-light tracking-wide text-black hover:bg-black hover:text-white transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Send me an email
            </motion.a>
          </motion.div>

          {/* Social links */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-8"
          >
            {socialLinks.map((link) => (
              <motion.a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-light text-black/50 hover:text-black transition-colors"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                {link.label}
              </motion.a>
            ))}
          </motion.div>

          {/* Footer */}
          <motion.div
            variants={itemVariants}
            className="pt-12 border-t border-black/5 text-xs font-light text-black/40"
          >
            <p>© 2025 Krishnakant Maharshi. All rights reserved.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
