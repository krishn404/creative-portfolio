"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/", label: "HOME" },
  { href: "/blog", label: "WRITING" },
]

export function BlogHeader() {
  const pathname = usePathname()

  return (
    <header className="relative z-10 border-b border-black bg-[var(--surface)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="blog-font-mono text-[10px] tracking-[0.2em] text-[var(--text-primary)] hover:underline"
        >
          PSYX
        </Link>
        <nav className="flex items-center gap-6">
          {links.map((link) => {
            const active =
              link.href === "/blog"
                ? pathname === "/blog" || pathname.startsWith("/blog/")
                : pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`blog-section-label text-[10px] sm:text-xs ${
                  active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                }`}
              >
                {active && (
                  <span className="mr-1 text-[var(--accent-neon)]" aria-hidden>
                    ◆
                  </span>
                )}
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
