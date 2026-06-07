"use client"

import { useEffect, useState, type ReactNode } from "react"

type AdminAuthGateProps = {
  children: ReactNode
}

export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setAuthenticated(Boolean(data.authenticated)))
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false))
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      setError("Invalid password")
      return
    }
    setAuthenticated(true)
  }

  if (loading) {
    return (
      <div className="blog-font-mono flex min-h-[50vh] items-center justify-center text-sm">
        // loading...
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="relative z-10 mx-auto max-w-sm py-16">
        <h1 className="blog-font-headline mb-6 text-2xl font-semibold">ADMIN LOGIN</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="blog-font-mono w-full border border-black bg-[var(--surface)] px-3 py-2 text-sm outline-none"
          />
          {error && <p className="blog-font-mono text-xs text-red-600">// {error}</p>}
          <button
            type="submit"
            className="blog-font-headline w-full border border-black bg-black py-2 text-sm font-medium text-white hover:bg-[var(--accent-neon)] hover:text-black"
          >
            ENTER
          </button>
        </form>
      </div>
    )
  }

  return <>{children}</>
}
