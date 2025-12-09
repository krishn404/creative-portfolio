import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import { isAuthenticated } from "@/lib/auth"

// Prefer non-public service role key; fall back to NEXT_PUBLIC_ for backwards compat
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.warn("Supabase URL is not set. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.")
}
if (!supabaseServiceKey) {
  console.warn("Supabase service role key is not set. Set SUPABASE_SERVICE_ROLE_KEY.")
}

let client: SupabaseClient | null = null

export function getAdminSupabase(): SupabaseClient {
  if (client) return client
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are missing (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)")
  }
  client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}

export function assertAdminAuth() {
  const cookieStore = cookies()
  const requestLike = {
    cookies: {
      get: (name: string) => cookieStore.get(name),
    },
  } as any

  if (!isAuthenticated(requestLike)) {
    throw new Error("UNAUTHORIZED")
  }
}

