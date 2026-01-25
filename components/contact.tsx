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
  { label: "Email", href: "mailto:psyxdes@gmail.com" },
]

const cards = [
  {
    number: "01",
    title: "Send me an email",
    body: "Share what you need (posters, brand assets, social content, merch, edits). I'll reply with timeline + pricing.",
    href: "mailto:psyxdes@gmail.com",
    rotation: -1.5,
  },
  {
    number: "02",
    title: "Instagram",
    body: "DM me references + vibe. Perfect for quick questions, updates, and visual direction.",
    href: "https://instagram.com/kantcancook",
    rotation: 0.8,
  },
  {
    number: "03",
    title: "Pinterest",
    body: "Drop a board link so I can lock the style, palette, and overall mood instantly.",
    href: "https://pinterest.com/psyxyx",
    rotation: -0.7,
  },
]

export default function Contact() {
  const { data } = useSWR<SiteContent>("/api/content", fetcher)
  const cta = data?.contact?.cta ?? defaultCta
  const email = data?.contact?.email ?? defaultEmail
  const socialLinks = data?.contact?.socials ?? defaultSocials

  // Extract LinkedIn and Email for bottom links (fallback to Email if LinkedIn not available)
  let bottomLinks = socialLinks.filter(
    (link) => link.label === "LinkedIn" || link.label === "Email"
  )
  
  // If no bottom links found, at least show Email
  if (bottomLinks.length === 0) {
    bottomLinks = [{ label: "Email", href: `mailto:${email}` }]
  }

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
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
      className="min-h-screen py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-background border-t border-border transition-colors duration-300"
    >
      <div className="max-w-6xl mx-auto w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12 md:mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-muted/50 mb-6">
              <p className="text-xs sm:text-sm font-light tracking-widest uppercase text-foreground">
                Get in Touch
              </p>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4 md:mb-6">
              Let's create together
            </h2>
            <p className="text-sm sm:text-base md:text-lg font-light text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {cta}
            </p>
          </motion.div>

          {/* Cards Grid */}
          <div className="relative mb-16 md:mb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-10 relative">
              {cards.map((card, index) => (
                <motion.div
                  key={card.number}
                  variants={itemVariants}
                  className="relative"
                >
                  <motion.a
                    href={card.href}
                    target={card.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel={card.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                    className="block bg-white rounded-lg border border-border/40 shadow-sm p-6 md:p-8 h-full hover:shadow-md transition-shadow duration-300"
                    initial={{ rotate: card.rotation }}
                    animate={{ rotate: card.rotation }}
                    whileHover={{
                      y: -6,
                      rotate: card.rotation + (card.rotation > 0 ? -0.4 : 0.4),
                      transition: { duration: 0.25, ease: "easeOut" },
                    }}
                  >
                    <div className="mb-4">
                      <span className="text-xs sm:text-sm font-light text-muted-foreground">
                        {card.number}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 md:mb-4">
                      {card.title}
                    </h3>
                    <p className="text-sm sm:text-base font-light text-muted-foreground leading-relaxed">
                      {card.body}
                    </p>
                  </motion.a>

                  {/* Curved Arrow Connector */}
                  {index < cards.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 lg:-right-5 z-0 pointer-events-none w-12 lg:w-16">
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 64 40"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-muted-foreground/20"
                        preserveAspectRatio="none"
                      >
                        <path
                          d={index === 0 
                            ? "M 0 20 Q 32 8, 64 20" 
                            : "M 0 20 Q 32 32, 64 20"
                          }
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          fill="none"
                        />
                        {/* Arrow head */}
                        <path
                          d="M 58 18 L 64 20 L 58 22"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom Links */}
          {bottomLinks.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm font-light"
            >
              {bottomLinks.map((link) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel={link.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                  whileHover={{ x: 2 }}
                >
                  {link.label}
                </motion.a>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
