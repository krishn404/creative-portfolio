"use client"

import type { BlogPost } from "@/lib/blog/utils"
import { PostCard } from "./PostCard"

type PostGridProps = {
  posts: BlogPost[]
  isLoading?: boolean
}

export function PostGrid({ posts, isLoading = false }: PostGridProps) {
  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="blog-font-mono py-16 text-center text-sm text-[var(--text-secondary)]">
          // loading posts...
        </p>
      ) : posts.length === 0 ? (
        <p className="blog-font-mono py-16 text-center text-sm text-[var(--text-secondary)]">
          // no posts yet.
        </p>
      ) : (
        posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)
      )}
    </div>
  )
}
