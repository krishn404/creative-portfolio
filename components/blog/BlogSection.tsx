"use client"

import useSWR from "swr"
import type { BlogPostCard } from "@/lib/blog/utils"
import { BlogListing } from "./BlogListing"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function BlogSection({ initialPosts = [] }: { initialPosts?: BlogPostCard[] }) {
  const { data, isLoading } = useSWR<{ posts: BlogPostCard[] }>("/api/blog", fetcher, {
    revalidateOnFocus: false,
    fallbackData: { posts: initialPosts },
  })

  const posts = (data?.posts ?? []).slice(0, 6)

  return (
    <section
      id="writing"
      className="blog-shell relative scroll-mt-16 border-t border-black px-4 py-10 sm:px-6 sm:py-14"
    >
      <div className="relative z-10 mx-auto max-w-5xl">
        <BlogListing posts={posts} linkTitleToBlog titleAs="h2" isLoading={isLoading && initialPosts.length === 0} />
      </div>
    </section>
  )
}
