import Link from "next/link"
import { Suspense } from "react"

import { FruitsPrint } from "@/features/baby-food/fruits/fruits-print"
import { routes } from "@/shared/routes"

import "@/features/print/print.css"
import "@/features/baby-food/fruits/fruits-print.css"

type Props = {
  searchParams: Promise<{ orientation?: string }>
}

export default function Page({ searchParams }: Props) {
  return (
    <Suspense>
      <Preview searchParams={searchParams} />
    </Suspense>
  )
}

async function Preview({ searchParams }: Props) {
  const { orientation: paramOrientation } = await searchParams
  const orientation =
    paramOrientation === "landscape" ? "landscape" : "portrait"

  return (
    <main style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header className="pairing-print-toolbar mb-5 grid gap-3">
        <Link
          href={routes.admin.root}
          className="w-fit text-sm underline underline-offset-4"
        >
          ← 인쇄물 어드민
        </Link>
        <h1 className="font-heading text-3xl font-bold">
          월령별 아기 과일 시기 A4 인쇄 미리보기
        </h1>
        <p className="text-sm text-stone">
          냉장고 문 부착용 A4 1장 · 월령별 처음 줄 수 있는 과일과 금지·주의 식재료를 담았어요.
        </p>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">용지 방향:</span>
          <Link
            href={`${routes.admin.babyFoodFruitsPrint}?orientation=portrait`}
            className={`px-3 py-1.5 rounded-md text-sm border ${
              orientation === "portrait"
                ? "bg-foreground text-background font-bold border-foreground"
                : "bg-background text-foreground border-hairline"
            }`}
          >
            세로형 (Portrait)
          </Link>
          <Link
            href={`${routes.admin.babyFoodFruitsPrint}?orientation=landscape`}
            className={`px-3 py-1.5 rounded-md text-sm border ${
              orientation === "landscape"
                ? "bg-foreground text-background font-bold border-foreground"
                : "bg-background text-foreground border-hairline"
            }`}
          >
            가로형 (Landscape)
          </Link>
        </div>

        <form method="post" action={routes.admin.babyFoodFruitsPdf}>
          <input type="hidden" name="orientation" value={orientation} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forest text-canvas font-semibold text-sm hover:bg-forest/90 transition-colors"
          >
            <span>A4 {orientation === "portrait" ? "세로형" : "가로형"} PDF 생성 및 내려받기</span>
          </button>
        </form>
      </header>

      <FruitsPrint orientation={orientation} />
    </main>
  )
}
