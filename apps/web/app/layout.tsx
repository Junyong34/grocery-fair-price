import type { Metadata } from "next"
import { Gowun_Batang } from "next/font/google"

import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css"
import "./globals.css"
import { createMetadata, SITE_CONFIG, siteUrl } from "@/shared/meta"
import { Providers } from "@/shared/providers"
import { cn } from "@workspace/ui/lib/utils"

// 사이트 기본 메타데이터. 페이지는 createMetadata로 덮어쓰고, 탭 제목 꼬리는 여기 template이 붙인다.
// 파비콘(favicon.ico, icon.svg, apple-icon.png)은 app/ 파일 규칙으로 Next가 넣는다.
export const metadata: Metadata = {
  ...createMetadata(),
  metadataBase: new URL(siteUrl()),
  title: { default: SITE_CONFIG.titleDefault, template: SITE_CONFIG.titleTemplate },
  applicationName: SITE_CONFIG.name,
}

// 제목(계절명, 달별 문구)용 명조. 한글 글리프가 많아 미리 불러오지 않고 unicode-range로 필요한 조각만 받는다.
// 본문 Pretendard는 위 CSS(동적 서브셋)로, 큰 숫자는 cojeev display 서체로 쓴다. 연결은 packages/ui globals.css.
const serifKo = Gowun_Batang({
  weight: ["400", "700"],
  variable: "--font-serif-ko",
  preload: false,
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" data-mode="light" className={cn("antialiased font-sans", serifKo.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
