"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import type { BlogPost } from "@/lib/blog/utils"
import { formatViews } from "@/lib/blog/utils"

type PostCardProps = {
  post: BlogPost
  index: number
}

export function PostCard({ post, index }: PostCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const number = String(index + 1).padStart(2, "0")

  return (
    <motion.article
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.4, delay: index * 0.07, ease: [0.23, 1, 0.32, 1] }
      }
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group block border border-black bg-[var(--surface)] p-5 sm:p-6 blog-card-hover transition-shadow"
      >
        <div className="flex gap-4 sm:gap-6">
          <span className="blog-font-mono shrink-0 text-xs text-[var(--text-secondary)]">{number}</span>
          <div className="min-w-0 flex-1">
            <h2 className="blog-font-headline text-xl font-medium sm:text-2xl">{post.title}</h2>
            <p className="blog-font-body mt-2 text-base text-[var(--text-secondary)] line-clamp-2">
              {post.excerpt}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="blog-font-mono border border-black px-2 py-0.5 text-[9px] tracking-wider"
                >
                  [{tag}]
                </span>
              ))}
              <span className="blog-font-mono text-[9px] tracking-wider text-[var(--text-secondary)]">
                · {post.readTime ?? "1 MIN"} · {formatViews(post.views)} VIEWS
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
