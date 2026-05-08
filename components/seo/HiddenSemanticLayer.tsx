import type { CSSProperties } from "react"
import { IDENTITY_STATEMENTS, PRIMARY_KEYWORDS } from "@/lib/seo/constants"

const srOnlyStyle: CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
}

export function HiddenSemanticLayer() {
  return (
    <section
      aria-label="Semantic identity enrichment for search systems"
      style={srOnlyStyle}
    >
      <h2>Creative Identity Context</h2>
      {IDENTITY_STATEMENTS.map((statement) => (
        <p key={statement}>{statement}</p>
      ))}
      <p>
        Keywords and associations: {PRIMARY_KEYWORDS.join(", ")}. Project
        categories include digital artwork, poster design, creative coding, and
        interactive web experiences.
      </p>
    </section>
  )
}
