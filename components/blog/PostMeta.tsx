import { formatPostDate, formatViews } from "@/lib/blog/utils"

type PostMetaProps = {
  publishedAt?: number
  updatedAt?: number
  readTime?: string
  views: number
  className?: string
}

export function PostMeta({ publishedAt, updatedAt, readTime, views, className = "" }: PostMetaProps) {
  const wasUpdated = Boolean(updatedAt && publishedAt && updatedAt > publishedAt + 60_000)
  return (
    <p className={`blog-font-mono text-[10px] tracking-wider text-[var(--text-secondary)] ${className}`}>
      <span className="text-[var(--accent-neon)]" aria-hidden>
        ◆{" "}
      </span>
      {formatPostDate(publishedAt)}
      {wasUpdated && <> · UPDATED {formatPostDate(updatedAt)}</>}
      {readTime && (
        <>
          {" "}
          · {readTime} READ
        </>
      )}
      {" "}
      · {formatViews(views)} VIEWS
    </p>
  )
}
