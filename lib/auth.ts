import type { NextRequest, NextResponse } from "next/server"

export const ADMIN_COOKIE_NAME = "admin_session"

export function getAdminSessionToken() {
  const token = process.env.ADMIN_SESSION_TOKEN?.trim()
  if (!token && process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_TOKEN must be configured in production")
  }
  return token || "change-me-session"
}

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD?.trim()
  if (!password && process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_PASSWORD must be configured in production")
  }
  return password || "change-me-password"
}

export function isAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  return Boolean(cookie && cookie === getAdminSessionToken())
}

export function assertAuthenticated(request: NextRequest) {
  if (!isAuthenticated(request)) {
    throw new Error("UNAUTHORIZED")
  }
}

export function setSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE_NAME, getAdminSessionToken(), {
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
  return Boolean(password && password === getAdminPassword())
}

export function getAdminPasswordHint() {
  const pwd = getAdminPassword()
  return `${pwd.slice(0, 2)}••••${pwd.slice(-2)}`
}
