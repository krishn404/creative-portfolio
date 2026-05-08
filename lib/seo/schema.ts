import {
  CREATOR_ALIASES,
  CREATOR_INSTAGRAM,
  CREATOR_NAME,
  KNOWS_ABOUT,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/constants"

type JsonLd = Record<string, unknown>

export function buildPortfolioJsonLd(): JsonLd[] {
  const personId = `${SITE_URL}#person`
  const websiteId = `${SITE_URL}#website`
  const profilePageId = `${SITE_URL}#profile`
  const galleryPageId = `${SITE_URL}#gallery`

  return [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": personId,
      name: CREATOR_NAME,
      alternateName: [...CREATOR_ALIASES],
      url: SITE_URL,
      image: `${SITE_URL}/api/og?title=kantcancook%20Artist`,
      sameAs: [CREATOR_INSTAGRAM, SITE_URL],
      jobTitle: ["Graphic Designer", "Creative Developer", "Visual Artist"],
      knowsAbout: [...KNOWS_ABOUT],
      mainEntityOfPage: profilePageId,
    },
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "@id": profilePageId,
      url: SITE_URL,
      name: `${CREATOR_NAME} profile`,
      isPartOf: { "@id": websiteId },
      mainEntity: { "@id": personId },
      about: { "@id": personId },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": websiteId,
      url: SITE_URL,
      name: SITE_NAME,
      description: "Official portfolio website for kantcancook.",
      publisher: { "@id": personId },
      author: { "@id": personId },
      creator: { "@id": personId },
      inLanguage: "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": galleryPageId,
      url: SITE_URL,
      name: "Selected visual works",
      isPartOf: { "@id": websiteId },
      about: { "@id": personId },
      creator: { "@id": personId },
      mainEntity: {
        "@type": "ImageGallery",
        "@id": `${SITE_URL}#image-gallery`,
        name: "kantcancook image gallery",
        url: SITE_URL,
        creator: { "@id": personId },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id": `${SITE_URL}#creative-work`,
      name: "kantcancook portfolio works",
      author: { "@id": personId },
      creator: { "@id": personId },
      url: SITE_URL,
      isPartOf: { "@id": websiteId },
      about: ["experimental visual design", "digital art", "creative coding"],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${SITE_URL}#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Who is kantcancook?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "kantcancook, also known as psyx, is a graphic designer, creative developer, and visual artist.",
          },
        },
        {
          "@type": "Question",
          name: "What is the official website of kantcancook?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The official portfolio website is https://art.krixnx.xyz.",
          },
        },
        {
          "@type": "Question",
          name: "What is the official Instagram of kantcancook?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The official Instagram profile is https://instagram.com/kantcancook.",
          },
        },
      ],
    },
  ]
}
