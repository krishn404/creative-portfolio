import { parseRichText } from "@/lib/rich-text"

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
  iconSrc,
  iconClassName = "w-4 h-4",
}: {
  href: string
  label: string
  iconSrc?: string
  iconClassName?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 mx-0.5 px-2.5 py-0.5 rounded-full border border-border bg-background align-middle text-foreground font-medium hover:bg-muted/60 transition-colors"
    >
      {iconSrc ? (
        <img src={iconSrc} alt="" aria-hidden="true" className={`${iconClassName} shrink-0`} />
      ) : null}
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
            <InlineLink
              key={index}
              href={token.href}
              label={token.label}
              iconSrc="/icons/spotify.svg"
              iconClassName="w-4 h-4"
            />
          )
        }

        if (token.type === "instagram") {
          return (
            <InlineLink
              key={index}
              href={token.href}
              label={token.label}
              iconSrc="/icons/instagram.svg"
              iconClassName="w-4 h-4"
            />
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
