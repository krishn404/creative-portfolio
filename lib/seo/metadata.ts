import type { Metadata } from "next"
import {
  CREATOR_INSTAGRAM,
  CREATOR_NAME,
  DEFAULT_OG_IMAGE,
  PRIMARY_KEYWORDS,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/constants"

const defaultTitle = "kantcancook | Graphic Designer & Creative Developer"
const defaultDescription =
  "Official portfolio of kantcancook (psyx), a graphic designer, creative developer, and visual artist building experimental digital experiences."

export function buildMetadata({
  title,
  description,
  path = "/",
}: {
  title?: string
  description?: string
  path?: string
} = {}): Metadata {
  const resolvedTitle = title ?? defaultTitle
  const resolvedDescription = description ?? defaultDescription
  const canonical = new URL(path, SITE_URL).toString()
  const ogImage = new URL(DEFAULT_OG_IMAGE, SITE_URL).toString()

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: defaultTitle,
      template: "%s | kantcancook",
    },
    description: resolvedDescription,
    applicationName: SITE_NAME,
    alternates: {
      canonical,
    },
    keywords: [...PRIMARY_KEYWORDS],
    creator: CREATOR_NAME,
    publisher: CREATOR_NAME,
    category: "art and design portfolio",
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      title: resolvedTitle,
      description: resolvedDescription,
      siteName: SITE_NAME,
      locale: "en_US",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "kantcancook portfolio preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      creator: "@kantcancook",
      images: [ogImage],
    },
    other: {
      "profile:username": "kantcancook",
      "og:see_also": CREATOR_INSTAGRAM,
    },
  }
}

export function buildSeoPageMetadata(): Metadata {
  const canonical = SITE_URL
  const ogImage = new URL(DEFAULT_OG_IMAGE, SITE_URL).toString()

  const description =
    "Hidden SEO identity context for kantcancook (psyx) and the official portfolio at art.krixnx.xyz."

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: "SEO Identity | kantcancook",
      template: "%s | kantcancook",
    },
    description,
    applicationName: SITE_NAME,
    alternates: {
      canonical,
    },
    keywords: [...PRIMARY_KEYWORDS],
    creator: CREATOR_NAME,
    publisher: CREATOR_NAME,
    category: "art and design portfolio",
    robots: {
      index: true,
      follow: true,
      nocache: false,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title: "kantcancook portfolio (psyx)",
      description,
      siteName: SITE_NAME,
      locale: "en_US",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "kantcancook SEO identity",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "kantcancook portfolio (psyx)",
      description,
      creator: "@kantcancook",
      images: [ogImage],
    },
    other: {
      "profile:username": "kantcancook",
      "og:see_also": CREATOR_INSTAGRAM,
    },
  }
}
