import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { UnsubscribeConfirmation } from "@/components/letter/unsubscribe-confirmation"

export const metadata: Metadata = {
  title: { absolute: "Unsubscribe | Krishna Kant Maharshi" },
  robots: { index: false, follow: false },
}

export default function UnsubscribePage() {
  return (
    <main className="blog-shell min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-xl flex-col">
        <nav className="flex items-center justify-between" aria-label="Primary navigation">
          <Link href="/" className="blog-font-mono text-[10px] tracking-[0.18em] hover:underline">PSYX</Link>
          <Link href="/letter" className="blog-font-mono text-[10px] tracking-[0.14em] hover:underline">THE LETTER</Link>
        </nav>
        <section className="my-auto py-16 sm:py-24" aria-labelledby="unsubscribe-title">
          <p className="blog-font-mono mb-5 text-[10px] tracking-[0.18em] text-[var(--text-secondary)]">MONTHLY LETTER</p>
          <h1 id="unsubscribe-title" className="blog-font-headline text-4xl font-semibold leading-[0.95] sm:text-5xl">Leave the list?</h1>
          <div className="mt-8 border-t border-black pt-6">
            <Suspense fallback={<div className="h-28 animate-pulse border border-black bg-white" aria-label="Loading unsubscribe form" />}>
              <UnsubscribeConfirmation />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  )
}
