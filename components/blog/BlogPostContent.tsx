"use client"

import { useEffect, useRef } from "react"
import { createRoot, type Root } from "react-dom/client"
import { SocialIcon } from "@/components/SocialIcon"

type BlogPostContentProps = {
  html: string
  className?: string
}

export function BlogPostContent({ html, className }: BlogPostContentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rootsRef = useRef<Root[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    rootsRef.current.forEach((root) => root.unmount())
    rootsRef.current = []

    container.querySelectorAll<HTMLElement>("[data-social-icon]").forEach((element) => {
      const type = element.dataset.socialIcon
      if (type !== "spotify" && type !== "instagram") return

      const root = createRoot(element)
      root.render(<SocialIcon type={type} className="h-4 w-4 shrink-0" />)
      rootsRef.current.push(root)
    })

    return () => {
      rootsRef.current.forEach((root) => root.unmount())
      rootsRef.current = []
    }
  }, [html])

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
