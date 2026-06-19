"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import useSWR from "swr"
import type { SiteContent } from "@/lib/content"
import ProfileCard from "@/components/profilecard"
import { RichText } from "@/components/RichText"
import { ChefHat, PhoneCall, PlusCircle } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const defaultCta =
  "Interested in collaborating or commissioning a piece? I'd love to hear about your project."
const defaultEmail = "psyxdes@gmail.com"
const defaultSocials = [
  { label: "Instagram", href: "https://instagram.com/kantcancook" },
  { label: "Pinterest", href: "https://pinterest.com/psyxyx" },
  { label: "Email", href: "mailto:psyxdes@gmail.com" },
]

const profileInfo = {
  name: "Krishnakant Maharshi.",
  title: "Visual Artist",
  portfolioText: "kantcancook",
  portfolioLink: "https://instagram.com/kantcancook",
  statusText: "Available for work",
  Icon1: PlusCircle,
  Icon2: PhoneCall,
  SecondaryBtnText: "Book your call",
  PrimaryBtnText: "Share idea",
  subText: "Let's cook together?",
  subIcon: ChefHat,
}

export default function Contact() {
  const { data } = useSWR<SiteContent>("/api/content", fetcher)
  const cta = data?.contact?.cta ?? defaultCta
  const email = data?.contact?.email ?? defaultEmail
  const socialLinks = data?.contact?.socials ?? defaultSocials

  let bottomLinks = socialLinks.filter(
    (link) => link.label === "LinkedIn" || link.label === "Email"
  )
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
        ease: [0.23, 1, 0.82, 1] as const,
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
          <motion.div
            variants={itemVariants}
            className="text-center mb-12 md:mb-16"
          >
            <div className="inline-block px-4 py-2 rounded-full bg-muted/50 mb-6">
              <p className="text-xs sm:text-sm font-light tracking-widest uppercase text-foreground">
                Get in Touch
              </p>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4 md:mb-6">
              Let's create together
            </h2>
            <RichText
              as="p"
              text={cta}
              className="text-sm sm:text-base md:text-lg font-light text-muted-foreground leading-relaxed max-w-2xl mx-auto"
            />
          </motion.div>

          {/* Profile Card */}
          <motion.div
            variants={itemVariants}
            className="flex w-full items-center justify-center mb-12 md:mb-16"
          >
            <div className="relative">
              <ProfileCard
                name="Krishna Kant Maharshi"
                title="Visual Artist"
                portfolioText={profileInfo.portfolioText}
                portfolioLink={profileInfo.portfolioLink}
                statusText={profileInfo.statusText}
                Icon1={profileInfo.Icon1}
                Icon2={profileInfo.Icon2}
                SecondaryBtnText="Book your call"
                subText={profileInfo.subText}
                Icon3={profileInfo.subIcon}
                sourceContext="contact-page-profile-card"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
