"use client"

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { SocialIcon } from "@/components/SocialIcon"
import type { SocialLinkType } from "@/lib/blog/social-link-extension"

export function SocialLinkNodeView({ node }: NodeViewProps) {
  const type = (node.attrs.type ?? "link") as SocialLinkType
  const label = (node.attrs.label as string) || "Link"
  const href = (node.attrs.href as string) || "#"

  return (
    <NodeViewWrapper as="a" href={href} target="_blank" rel="noopener noreferrer nofollow" className="social-link">
      <span
        className={`social-link social-link--${type} inline-flex items-center gap-1.5 rounded-full border border-black px-2.5 py-0.5 align-middle no-underline`}
        contentEditable={false}
      >
        {type === "spotify" || type === "instagram" ? (
          <SocialIcon type={type} className="h-4 w-4 shrink-0" />
        ) : null}
        <span className="social-link-label text-sm font-medium">{label}</span>
      </span>
    </NodeViewWrapper>
  )
}
