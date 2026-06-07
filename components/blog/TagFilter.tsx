"use client"

import type { BlogPost } from "@/lib/blog/utils"

type TagFilterProps = {
  tags: string[]
  activeTag: string | null
  onTagChange: (tag: string | null) => void
}

export function TagFilter({ tags, activeTag, onTagChange }: TagFilterProps) {
  const allTags = ["all", ...tags]

  return (
    <div className="flex flex-wrap gap-2">
      {allTags.map((tag) => {
        const isActive = tag === "all" ? activeTag === null : activeTag === tag
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onTagChange(tag === "all" ? null : tag)}
            className={`border border-black px-3 py-1 text-[10px] tracking-wider transition-colors ${
              isActive
                ? "blog-font-headline bg-black font-medium text-white"
                : "blog-font-mono bg-[var(--surface)] text-[var(--text-primary)] hover:bg-black hover:text-white"
            }`}
          >
            {isActive && (
              <span className="mr-1 text-[var(--accent-neon)]" aria-hidden>
                ◆
              </span>
            )}
            [{tag}]
          </button>
        )
      })}
    </div>
  )
}

export function collectTagsFromPosts(posts: BlogPost[]): string[] {
  const tagSet = new Set<string>()
  posts.forEach((post) => post.tags.forEach((t) => tagSet.add(t)))
  return Array.from(tagSet).sort()
}
