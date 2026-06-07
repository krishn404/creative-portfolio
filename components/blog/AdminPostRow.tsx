"use client"

import Link from "next/link"
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import type { BlogPost } from "@/lib/blog/utils"
import { formatPostDate } from "@/lib/blog/utils"

type AdminPostRowProps = {
  post: BlogPost
  index: number
  onDelete: (id: string) => void
  onTogglePublish: (id: string) => void
  busy?: boolean
}

export function AdminPostRow({ post, index, onDelete, onTogglePublish, busy }: AdminPostRowProps) {
  const number = String(index + 1).padStart(2, "0")

  return (
    <tr className="border-b border-black">
      <td className="blog-font-mono px-3 py-4 text-xs text-[var(--text-secondary)]">{number}</td>
      <td className="px-3 py-4">
        <Link
          href={`/admin/blog/${post.id}`}
          className="blog-font-headline text-sm font-medium hover:underline"
        >
          {post.title}
        </Link>
      </td>
      <td className="px-3 py-4">
        <div className="flex flex-wrap gap-1">
          {post.tags.map((tag) => (
            <span key={tag} className="blog-font-mono text-[9px]">
              [{tag}]
            </span>
          ))}
        </div>
      </td>
      <td className="px-3 py-4">
        {post.published ? (
          <span className="blog-font-mono inline-block bg-[var(--accent-neon)] px-2 py-0.5 text-[9px] text-black">
            LIVE
          </span>
        ) : (
          <span className="blog-font-mono inline-block border border-dashed border-black px-2 py-0.5 text-[9px] text-[var(--text-secondary)]">
            DRAFT
          </span>
        )}
      </td>
      <td className="blog-font-mono px-3 py-4 text-xs">{post.views.toLocaleString()}</td>
      <td className="blog-font-mono px-3 py-4 text-xs text-[var(--text-secondary)]">
        {formatPostDate(post.publishedAt)}
      </td>
      <td className="px-3 py-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/blog/${post.id}`}
            className="border border-black p-1.5 hover:bg-black hover:text-white"
            aria-label="Edit post"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (confirm(`Delete "${post.title}"? This cannot be undone.`)) {
                onDelete(post.id)
              }
            }}
            className="border border-black p-1.5 hover:bg-black hover:text-white disabled:opacity-50"
            aria-label="Delete post"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onTogglePublish(post.id)}
            className="border border-black p-1.5 hover:bg-[var(--accent-neon)] disabled:opacity-50"
            aria-label={post.published ? "Unpublish" : "Publish"}
          >
            {post.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
      </td>
    </tr>
  )
}
