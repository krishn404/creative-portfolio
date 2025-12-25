"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import useSWR from "swr"
import type { SiteContent } from "@/lib/content"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const defaultCta = "Interested in collaborating or commissioning a piece? I'd love to hear about your project."
const defaultEmail = "psyxdes@gmail.com"
const defaultSocials = [
  { label: "Instagram", href: "https://instagram.com/kantcancook" },
  { label: "Pinterest", href: "https://pinterest.com/psyxyx" },
  { label: "LinkedIn", href: "https://linkedin.com/in/krishn404" },
  { label: "Email", href: "mailto:psyxdes@gmail.com" },
]

export default function Contact() {
  const { data } = useSWR<SiteContent>("/api/content", fetcher)
  const cta = data?.contact?.cta ?? defaultCta
  const email = data?.contact?.email ?? defaultEmail
  const socialLinks = data?.contact?.socials ?? defaultSocials

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  })

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
      className="min-h-screen py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-background border-t border-border flex items-center transition-colors duration-300"
    >
      <div className="max-w-3xl mx-auto w-full text-center">
        <motion.div
          className="space-y-6 sm:space-y-8 md:space-y-12"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {/* Heading */}
          <motion.div variants={itemVariants}>
            <p className="text-[10px] sm:text-xs font-light tracking-widest uppercase text-muted-foreground mb-3 sm:mb-4">Get in Touch</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-foreground mb-3 sm:mb-4">
              Let's create together
            </h2>
            <p className="text-sm sm:text-base md:text-lg font-light text-muted-foreground leading-relaxed px-2 sm:px-4">{cta}</p>
          </motion.div>

          {/* CTA Button */}
          <motion.div variants={itemVariants}>
            <motion.a
              href={`mailto:${email}`}
              className="inline-block px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 border border-foreground rounded-full text-xs sm:text-sm font-light tracking-wide text-foreground hover:bg-foreground hover:text-background transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Send me an email
            </motion.a>
          </motion.div>

          {/* Social links */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-8">
            {socialLinks.map((link: { label: string; href: string }) => (
              <motion.a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
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
            className="pt-6 sm:pt-8 md:pt-12 border-t border-border text-[10px] sm:text-xs font-light text-muted-foreground"
          >
            <p>© 2025 Krishnakant Maharshi. All rights reserved.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
