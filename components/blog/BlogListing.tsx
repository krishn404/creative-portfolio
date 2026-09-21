import Link from "next/link"
import type { BlogPost } from "@/lib/blog/utils"
import { BLOG_DESCRIPTION, BLOG_NAME } from "@/lib/seo/constants"
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
      {BLOG_NAME}.
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
      <p className="blog-font-body mt-6 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
        {BLOG_DESCRIPTION}
      </p>
      <hr className="my-8 border-black" />
      <PostGrid posts={posts} isLoading={isLoading} />
    </>
  )
}
