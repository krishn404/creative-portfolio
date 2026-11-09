"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { BlogPost } from "@/lib/blog/utils"
import { AdminPostRow } from "./AdminPostRow"

type AdminBlogDashboardProps = {
  initialPosts: BlogPost[]
  onDelete: (id: string) => Promise<void>
  onTogglePublish: (id: string) => Promise<unknown>
  onApplySeoBackfill: () => Promise<Record<string, unknown>>
  onRevertSeoBackfill: () => Promise<Record<string, unknown>>
}

export function AdminBlogDashboard({ initialPosts, onDelete, onTogglePublish, onApplySeoBackfill, onRevertSeoBackfill }: AdminBlogDashboardProps) {
  const posts = initialPosts
  const [isPending, startTransition] = useTransition()
  const [migrationMessage, setMigrationMessage] = useState("")
  const router = useRouter()

  function handleDelete(id: string) {
    startTransition(async () => {
      await onDelete(id)
      router.refresh()
    })
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      await onTogglePublish(id)
      router.refresh()
    })
  }

  function runSeoMigration(mode: "apply" | "revert") {
    const message = mode === "apply"
      ? "Apply the reviewed KTWK article-type, subject, Vidhu metadata and image-alt backfill? Existing migration conflicts will be skipped."
      : "Revert only unchanged records from the KTWK SEO backfill? Later manual edits will be protected as conflicts."
    if (!window.confirm(message)) return
    startTransition(async () => {
      try {
        const result = mode === "apply" ? await onApplySeoBackfill() : await onRevertSeoBackfill()
        setMigrationMessage(JSON.stringify(result))
        router.refresh()
      } catch (error) {
        setMigrationMessage(error instanceof Error ? error.message : "SEO migration failed")
      }
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

      <section className="mb-6 border border-black bg-[var(--surface)] p-4" aria-labelledby="seo-migration-title">
        <h2 id="seo-migration-title" className="blog-font-headline text-xl">KTWK SEO record backfill</h2>
        <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
          Applies the reviewed article types, verified subject names, one Vidhu Kota search listing update, and factual inline image descriptions. It is idempotent, stores before/after snapshots, and skips records changed after the migration.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" disabled={isPending} onClick={() => runSeoMigration("apply")} className="border border-black bg-black px-4 py-2 text-sm text-white disabled:opacity-50">Apply reviewed backfill</button>
          <button type="button" disabled={isPending} onClick={() => runSeoMigration("revert")} className="border border-black px-4 py-2 text-sm disabled:opacity-50">Revert safe changes</button>
        </div>
        {migrationMessage && <p className="blog-font-mono mt-3 break-words text-xs" role="status">{migrationMessage}</p>}
      </section>

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
                  No posts yet.
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
