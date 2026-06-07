"use client"

import { useEffect, type ReactNode } from "react"

export function AdminBlurGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.classList.add("hide-admin-blur")
    return () => {
      document.body.classList.remove("hide-admin-blur")
    }
  }, [])

  return <>{children}</>
}
