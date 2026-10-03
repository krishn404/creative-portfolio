import HomePage from "@/components/home-page"
import { JsonLd } from "@/components/seo/JsonLd"
import { buildPortfolioJsonLd } from "@/lib/seo/schema"
import { convex } from "@/lib/convex"
import { api } from "@/convex/_generated/api"
import { toBlogPostCard, type BlogPostCard, type BlogPost } from "@/lib/blog/utils"

export const revalidate = 3600

export default async function Home() {
  let posts: BlogPostCard[] = []
  try {
    const published = await convex.query(api.posts.getPublishedPosts) as BlogPost[]
    posts = published.slice(0, 6).map(toBlogPostCard)
  } catch (error) {
    console.error("Failed to load homepage writing:", error)
  }
  return (
    <>
      <JsonLd data={buildPortfolioJsonLd()} />
      <HomePage initialPosts={posts} />
    </>
  )
}
