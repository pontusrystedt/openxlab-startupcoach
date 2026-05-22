import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OpenX Lab Coaching",
  description: "AI-stödd startupcoaching vid Ideon Science Park",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv" className="h-full">
      <body className={`${geist.className} min-h-full bg-gray-50`}>
        {children}
      </body>
    </html>
  )
}
