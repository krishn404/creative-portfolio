import { cookies } from "next/headers"
import type { NextRequest, NextResponse } from "next/server"

export const ADMIN_COOKIE_NAME = "admin_session"

const sessionToken = process.env.ADMIN_SESSION_TOKEN || "change-me-session"
const adminPassword = process.env.ADMIN_PASSWORD || "change-me-password"

export function isAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  return Boolean(cookie && cookie === sessionToken)
}

export function assertAuthenticated(request: NextRequest) {
  if (!isAuthenticated(request)) {
    throw new Error("UNAUTHORIZED")
  }
}

export function setSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  })
}

export function isPasswordValid(password?: string | null) {
  return Boolean(password && password === adminPassword)
}

export function getAdminPasswordHint() {
  const pwd = adminPassword
  return `${pwd.slice(0, 2)}••••${pwd.slice(-2)}`
}

