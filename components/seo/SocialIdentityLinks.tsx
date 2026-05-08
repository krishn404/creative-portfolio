import { CREATOR_INSTAGRAM } from "@/lib/seo/constants"
import type { CSSProperties } from "react"

const hiddenAnchorStyle: CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "-1px",
  border: 0,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
}

export function SocialIdentityLinks() {
  return (
    <div aria-hidden="true" style={hiddenAnchorStyle}>
      <a href={CREATOR_INSTAGRAM} rel="me external nofollow noopener noreferrer">
        Official Instagram profile of kantcancook
      </a>
    </div>
  )
}
