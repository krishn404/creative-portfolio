import Link from "next/link"
import type { BlogPost } from "@/lib/blog/utils"
import { PostGrid } from "./PostGrid"

type BlogListingProps = {
  posts: BlogPost[]
  linkTitleToBlog?: boolean
  titleAs?: "h1" | "h2"
  isLoading?: boolean
}

export function BlogListing({
  posts,
  linkTitleToBlog = false,
  titleAs: TitleTag = "h1",
  isLoading = false,
}: BlogListingProps) {
  const title = (
    <TitleTag className="blog-font-headline glitch text-5xl font-semibold sm:text-7xl md:text-8xl lg:text-[96px]">
      Off the Record.
    </TitleTag>
  )

  return (
    <>
      <p className="blog-font-mono text-[10px] tracking-[0.2em] text-[var(--text-secondary)]">[BLOG]</p>
      <hr className="my-4 border-black" />
      {linkTitleToBlog ? (
        <Link href="/blog" className="blog-writing-link block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">
          {title}
        </Link>
      ) : (
        title
      )}
      <hr className="my-8 border-black" />
      <PostGrid posts={posts} isLoading={isLoading} />
    </>
  )
}
