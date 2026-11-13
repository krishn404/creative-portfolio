import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { LetterSignupForm } from "@/components/letter/letter-signup-form"
import { SITE_URL } from "@/lib/seo/constants"

const title = "A monthly letter from Krishna Kant Maharshi"
const description = "A monthly note on what Krishna is working on, with a small affirmation postcard inside."
const image = `${SITE_URL}/api/og?title=${encodeURIComponent("A letter from Kant")}&subtitle=${encodeURIComponent("work in progress + a monthly affirmation postcard")}`

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE_URL}/letter` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/letter`,
    title,
    description,
    images: [{ url: image, width: 1200, height: 630, alt: "A letter from Kant" }],
  },
  twitter: { card: "summary_large_image", title, description, images: [image] },
}

export default function LetterPage() {
  return (
    <main className="blog-shell min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-xl flex-col">
        <nav className="flex items-center justify-between" aria-label="Primary navigation">
          <Link href="/" className="blog-font-mono text-[10px] tracking-[0.18em] hover:underline">PSYX</Link>
          <Link href="/blog" className="blog-font-mono text-[10px] tracking-[0.14em] hover:underline">READING</Link>
        </nav>

        <section className="my-auto py-16 sm:py-24" aria-labelledby="letter-title">
          <p className="blog-font-mono mb-5 text-[10px] tracking-[0.18em] text-[var(--text-secondary)]">A MONTHLY LETTER</p>
          <h1 id="letter-title" className="blog-font-headline max-w-lg text-5xl font-semibold leading-[0.95] sm:text-6xl">
            Notes from the worktable.
          </h1>
          <p className="blog-font-body mt-7 max-w-md text-[var(--text-secondary)]">
            Once a month, I&apos;ll share what I&apos;m working on and send a short affirmation postcard.
          </p>
          <div className="mt-10 border-t border-black pt-6">
            <Suspense fallback={<div className="h-28 animate-pulse border border-black bg-white" aria-label="Loading signup form" />}>
              <LetterSignupForm />
            </Suspense>
          </div>
        </section>

        <p className="blog-font-mono text-[9px] tracking-[0.12em] text-[var(--text-secondary)]">FROM KRISHNA KANT MAHARSHI</p>
      </div>
    </main>
  )
}
