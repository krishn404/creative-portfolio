import type { Metadata } from "next"
import Link from "next/link"
import { JsonLd } from "@/components/seo/JsonLd"
import {
  CREATOR_GITHUB,
  CREATOR_INSTAGRAM,
  CREATOR_LINKEDIN,
  CREATOR_PINTEREST,
  CREATOR_PROFILE_PATH,
  SITE_URL,
} from "@/lib/seo/constants"
import { buildCreatorProfileJsonLd } from "@/lib/seo/schema"

const profileUrl = `${SITE_URL}${CREATOR_PROFILE_PATH}`
const description =
  "Official profile of Krishna Kant Maharshi, also known as kantcancook and psyx: visual designer, creative, and host of KTWK — Kezual Talks w Kant."

export const metadata: Metadata = {
  title: { absolute: "Krishna Kant Maharshi — kantcancook / psyx" },
  description,
  alternates: { canonical: profileUrl },
  openGraph: {
    type: "profile",
    url: profileUrl,
    title: "Krishna Kant Maharshi — kantcancook / psyx",
    description,
    images: [{
      url: `${SITE_URL}/api/og?title=Krishna%20Kant%20Maharshi&subtitle=kantcancook%20%2F%20psyx`,
      width: 1200,
      height: 630,
      alt: "Krishna Kant Maharshi, also known as kantcancook and psyx",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Krishna Kant Maharshi — kantcancook / psyx",
    description,
  },
}

const profiles = [
  { label: "Instagram — kantcancook", href: CREATOR_INSTAGRAM },
  { label: "LinkedIn — Krishna Kant Maharshi", href: CREATOR_LINKEDIN },
  { label: "GitHub — krishn404", href: CREATOR_GITHUB },
  { label: "Pinterest — psyxyx", href: CREATOR_PINTEREST },
]

export default function CreatorProfilePage() {
  return (
    <>
      <JsonLd data={buildCreatorProfileJsonLd()} />
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-20">
        <nav aria-label="Breadcrumb" className="mb-10 text-sm text-muted-foreground">
          <Link href="/" className="underline underline-offset-4">Portfolio</Link>
          <span aria-hidden="true"> / </span>
          <span>Krishna Kant Maharshi</span>
        </nav>

        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Official creator profile</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">Krishna Kant Maharshi</h1>
        <p className="mt-5 text-xl leading-relaxed text-muted-foreground">
          Also known as <strong className="text-foreground">kantcancook</strong> and <strong className="text-foreground">psyx</strong>.
          Visual designer and creative working across music, film, culture, apparel, campaigns, and editorial projects.
        </p>

        <section aria-labelledby="work-heading" className="mt-12 border-t border-border pt-8">
          <h2 id="work-heading" className="text-2xl font-semibold">Work and writing</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            This is the verified identity behind the portfolio at art.krixnx.xyz and the host of
            {" "}<Link href="/blog" className="font-medium text-foreground underline underline-offset-4">KTWK Blog — Kezual Talks w Kant</Link>,
            an interview and writing series about artists, music, and culture.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm">
            <Link href="/#selected-work" className="underline underline-offset-4">Selected portfolio work</Link>
            <Link href="/about-ktwk" className="underline underline-offset-4">About KTWK</Link>
            <Link href="/blog" className="underline underline-offset-4">All KTWK articles</Link>
          </div>
        </section>

        <section aria-labelledby="profiles-heading" className="mt-12 border-t border-border pt-8">
          <h2 id="profiles-heading" className="text-2xl font-semibold">Verified profiles</h2>
          <ul className="mt-5 space-y-3">
            {profiles.map((profile) => (
              <li key={profile.href}>
                <a href={profile.href} rel="me external noopener noreferrer" className="underline underline-offset-4">
                  {profile.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  )
}
