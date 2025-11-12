"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"

export default function Contact() {
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

  const socialLinks = [
    { label: "Instagram", href: "https://instagram.com/kantcancook" },
    { label: "Pinterest", href: "https://pinterest.com/psyxyx" },
    { label: "LinkedIn", href: "https://linkedin.com/in/krishn404" },
    { label: "Email", href: "mailto:maharshikrishnakant@gmail.com" },
  ]

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
            <p className="text-lg font-light text-black/60 leading-relaxed">
              Interested in collaborating or commissioning a piece? I'd love to
              hear about your project.
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div variants={itemVariants}>
            <motion.a
              href="mailto:krishnakantmaharshi@gmail.com"
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
