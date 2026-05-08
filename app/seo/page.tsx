import { buildPortfolioJsonLd } from "@/lib/seo/schema"
import { buildSeoPageMetadata } from "@/lib/seo/metadata"
import { HiddenSemanticLayer } from "@/components/seo/HiddenSemanticLayer"
import { JsonLd } from "@/components/seo/JsonLd"
import { SocialIdentityLinks } from "@/components/seo/SocialIdentityLinks"

export const metadata = buildSeoPageMetadata()

export default function SeoPage() {
  const schema = buildPortfolioJsonLd()

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Keep the visible UI minimal; all identity enrichment is hidden. */}
      <JsonLd data={schema} />
      <SocialIdentityLinks />
      <HiddenSemanticLayer />
    </main>
  )
}

