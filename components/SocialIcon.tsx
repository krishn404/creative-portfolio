import { FaInstagram, FaSpotify } from "react-icons/fa6"

type SocialIconProps = {
  type: "spotify" | "instagram"
  className?: string
}

export function SocialIcon({ type, className = "h-4 w-4 shrink-0" }: SocialIconProps) {
  if (type === "spotify") {
    return <FaSpotify className={className} aria-hidden="true" />
  }

  return <FaInstagram className={className} aria-hidden="true" />
}
