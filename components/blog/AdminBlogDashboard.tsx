"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { BlogPost } from "@/lib/blog/utils"
import { AdminPostRow } from "./AdminPostRow"

type AdminBlogDashboardProps = {
  initialPosts: BlogPost[]
  onDelete: (id: string) => Promise<void>
  onTogglePublish: (id: string) => Promise<void>
}

export function AdminBlogDashboard({ initialPosts, onDelete, onTogglePublish }: AdminBlogDashboardProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  function handleDelete(id: string) {
    startTransition(async () => {
      await onDelete(id)
      setPosts((prev) => prev.filter((p) => p.id !== id))
      router.refresh()
    })
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      await onTogglePublish(id)
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                published: !p.published,
                publishedAt: !p.published ? Date.now() : undefined,
              }
            : p,
        ),
      )
      router.refresh()
    })
  }

  return (
    <div className="relative z-10">
      <div className="mb-8 flex flex-col gap-4 border-b border-black pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin" className="blog-font-mono text-xs tracking-wider hover:underline">
            ← ADMIN
          </Link>
          <h1 className="blog-font-headline mt-2 text-3xl font-semibold">BLOG</h1>
        </div>
        <Link
          href="/admin/blog/new"
          className="blog-font-headline inline-block border border-black bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-neon)] hover:text-black"
        >
          + NEW POST
        </Link>
      </div>

      <div className="overflow-x-auto border border-black bg-[var(--surface)]">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-black">
              {["#", "TITLE", "TAGS", "STATUS", "VIEWS", "DATE", "ACTIONS"].map((h) => (
                <th
                  key={h}
                  className="blog-font-mono px-3 py-3 text-[9px] font-normal tracking-wider text-[var(--text-secondary)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={7} className="blog-font-mono px-3 py-12 text-center text-sm text-[var(--text-secondary)]">
                  // no posts yet.
                </td>
              </tr>
            ) : (
              posts.map((post, i) => (
                <AdminPostRow
                  key={post.id}
                  post={post}
                  index={i}
                  onDelete={handleDelete}
                  onTogglePublish={handleToggle}
                  busy={isPending}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
