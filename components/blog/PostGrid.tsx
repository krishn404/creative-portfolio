"use client"

import { useMemo, useState } from "react"
import type { BlogPost } from "@/lib/blog/utils"
import { PostCard } from "./PostCard"
import { TagFilter, collectTagsFromPosts } from "./TagFilter"

type PostGridProps = {
  posts: BlogPost[]
  isLoading?: boolean
}

export function PostGrid({ posts, isLoading = false }: PostGridProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const tags = useMemo(() => collectTagsFromPosts(posts), [posts])

  const filtered = useMemo(() => {
    if (!activeTag) return posts
    return posts.filter((p) => p.tags.includes(activeTag))
  }, [posts, activeTag])

  return (
    <div className="space-y-6">
      <TagFilter tags={tags} activeTag={activeTag} onTagChange={setActiveTag} />
      <hr className="border-black" />
      {isLoading ? (
        <p className="blog-font-mono py-16 text-center text-sm text-[var(--text-secondary)]">
          // loading posts...
        </p>
      ) : filtered.length === 0 ? (
        <p className="blog-font-mono py-16 text-center text-sm text-[var(--text-secondary)]">
          {posts.length === 0 ? "// no posts yet." : "// no posts found."}
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
