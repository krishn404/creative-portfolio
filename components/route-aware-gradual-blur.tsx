"use client"

import { usePathname } from "next/navigation"
import GradualBlur from "@/components/GradualBlur"

export default function RouteAwareGradualBlur() {
  const pathname = usePathname()

  if (pathname === "/play-ground" || pathname?.startsWith("/play-ground/")) {
    return null
  }

  return (
    <GradualBlur
      target="page"
      position="bottom"
      height="6rem"
      strength={2}
      divCount={5}
      curve="bezier"
      exponential
      opacity={1}
      zIndex={50}
    />
  )
}
