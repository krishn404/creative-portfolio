import { NextRequest, NextResponse } from "next/server"
import { isPasswordValid, setSessionCookie } from "@/lib/auth"
import { readContent } from "@/lib/content"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const password = body?.password as string | undefined

  if (!isPasswordValid(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  }

  // prime content file on first login to avoid race conditions
  await readContent()

  const response = NextResponse.json({ ok: true })
  setSessionCookie(response)
  return response
}
