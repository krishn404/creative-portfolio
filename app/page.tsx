import HomePage from "@/components/home-page"
import { JsonLd } from "@/components/seo/JsonLd"
import { buildPortfolioJsonLd } from "@/lib/seo/schema"

export default function Home() {
  return (
    <>
      <JsonLd data={buildPortfolioJsonLd()} />
      <HomePage />
    </>
  )
}
