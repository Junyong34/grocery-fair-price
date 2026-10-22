import Link from "next/link"

import { WireframeGallery } from "@/features/admin-print/wireframes/wireframe-gallery"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

export const metadata = createMetadata({ title: "인쇄물 와이어프레임", noIndex: true })

export default function Page() {
  return (
    <main className="flex flex-col gap-10">
      <nav aria-label="이동">
        <Link href={routes.admin.root} className="text-sm text-stone underline-offset-4 hover:text-ink hover:underline">
          ← 에디션 목록
        </Link>
      </nav>
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance">인쇄물 와이어프레임</h1>
        <p className="max-w-[60ch] text-base text-pretty text-stone">
          종류마다 구조 안을 모았어요. 그림은 X 박스, 달력은 칸 격자, 글은 막대로 그려요. 근거가 된 시장 조사는 .scratch/calendar-print/research/market.md에 있어요.
        </p>
      </header>
      <WireframeGallery />
    </main>
  )
}
