"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"

export default function Gallery() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const posterData = [
    { id: 1, img: "/gallery/1.jpg", title: "Carousel Cover" },
    { id: 2, img: "/gallery/2.jpg", title: "Carousel Cover" },
    { id: 3, img: "/gallery/3.jpg", title: "Carousel Cover" },
    { id: 4, img: "/gallery/4.jpg", title: "Concept Poster" },
    { id: 5, img: "/gallery/5.jpg", title: "Concept Poster" },
    { id: 6, img: "/gallery/6.jpg", title: "Graphic T-Shirt "},
  ]

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
        ease: [0.23, 1, 0.82, 1],
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

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {posterData.map((poster) => (
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

                <div className="absolute bottom-4 left-0 right-0 text-center text-white drop-shadow-md">
                </div>
              </div>

              <div className="mt-4 flex justify-between items-baseline">
                <h3 className="text-sm font-light tracking-wide text-black">{poster.title}</h3>
                <p className="text-xs text-black/40">{poster.year}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
