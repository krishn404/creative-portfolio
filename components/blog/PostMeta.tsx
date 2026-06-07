import { formatPostDate, formatViews } from "@/lib/blog/utils"

type PostMetaProps = {
  publishedAt?: number
  readTime?: string
  views: number
  className?: string
}

export function PostMeta({ publishedAt, readTime, views, className = "" }: PostMetaProps) {
  return (
    <p className={`blog-font-mono text-[10px] tracking-wider text-[var(--text-secondary)] ${className}`}>
      <span className="text-[var(--accent-neon)]" aria-hidden>
        ◆{" "}
      </span>
      {formatPostDate(publishedAt)}
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
