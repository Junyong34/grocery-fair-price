import { Geist, Geist_Mono, Roboto } from "next/font/google"

import "./globals.css"
import { Providers } from "@/shared/providers"
import { cn } from "@workspace/ui/lib/utils";

const roboto = Roboto({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      data-mode="light"
      className={cn("antialiased", fontMono.variable, "font-sans", roboto.variable)}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
