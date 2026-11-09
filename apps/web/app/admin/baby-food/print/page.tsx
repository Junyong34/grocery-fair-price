import Link from "next/link"

import { PairingPrint } from "@/features/baby-food/pairing-print"
import { routes } from "@/shared/routes"

import "@/features/baby-food/pairing.css"
import "@/features/print/print.css"

export default function Page() {
  return (
    <main>
      <header className="pairing-print-toolbar mb-5 grid gap-3">
        <Link
          href={routes.admin.root}
          className="w-fit text-sm underline underline-offset-4"
        >
          ← 인쇄물 어드민
        </Link>
        <h1 className="font-heading text-3xl font-bold">
          이유식 재료 궁합표 미리보기
        </h1>
        <p className="text-sm text-stone">
          A4 세로 3장 · 목록 길이에 맞춰 재료별 표를 고르게 배치했어요.
        </p>
        <form method="post" action={routes.admin.babyFoodPdf}>
          <button type="submit" className="pairing-pill pairing-primary">
            PDF 생성 및 내려받기
          </button>
        </form>
      </header>
      <PairingPrint />
    </main>
  )
}
