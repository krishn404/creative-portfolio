"use client"

import { parseRichText } from "@/lib/rich-text"
import { SocialIcon } from "@/components/SocialIcon"

type RichTextProps = {
  text: string
  className?: string
  as?: "p" | "span" | "div"
}

const TOOL_ICONS = {
  photoshop: { src: "/icons/photoshop.png", size: "w-4 h-4" },
  canva: { src: "/icons/canva.png", size: "w-6 h-6" },
} as const

function InlineLink({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon?: "spotify" | "instagram"
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 mx-0.5 px-2.5 py-0.5 rounded-full border border-border bg-background align-middle text-foreground font-medium hover:bg-muted/60 transition-colors"
    >
      {icon ? <SocialIcon type={icon} className="h-4 w-4 shrink-0" /> : null}
      <span className="text-sm">{label}</span>
    </a>
  )
}

function ToolBadge({ label, tool }: { label: string; tool: keyof typeof TOOL_ICONS }) {
  const icon = TOOL_ICONS[tool]
  return (
    <span className="inline-flex items-center gap-2 mx-1 px-3 py-1 rounded-full border border-border bg-background align-middle">
      <img src={icon.src} alt={label} className={icon.size} />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </span>
  )
}

export function RichText({ text, className, as: Tag = "span" }: RichTextProps) {
  const tokens = parseRichText(text)

  return (
    <Tag className={className}>
      {tokens.map((token, index) => {
        if (token.type === "text") {
          return <span key={index}>{token.value}</span>
        }

        if (token.type === "spotify") {
          return (
            <InlineLink key={index} href={token.href} label={token.label} icon="spotify" />
          )
        }

        if (token.type === "instagram") {
          return (
            <InlineLink key={index} href={token.href} label={token.label} icon="instagram" />
          )
        }

        if (token.type === "link") {
          return <InlineLink key={index} href={token.href} label={token.label} />
        }

        return <ToolBadge key={index} label={token.label} tool={token.tool} />
      })}
    </Tag>
  )
}
