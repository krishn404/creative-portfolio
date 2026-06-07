import type React from "react"
import type { Metadata } from "next"
import { Archivo, DM_Sans, Geist, Geist_Mono, Instrument_Serif, Space_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import GradualBlur from "@/components/GradualBlur"
import { buildMetadata } from "@/lib/seo/metadata"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: ["400"] })

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-archivo",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-sans",
})

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
})

export const metadata: Metadata = {
  ...buildMetadata(),
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`relative min-h-screen font-sans antialiased ${archivo.variable} ${dmSans.variable} ${spaceMono.variable}`}
      >
        {children}
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
        <Analytics />
      </body>
    </html>
  )
}
