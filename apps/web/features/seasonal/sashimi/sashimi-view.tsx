import { SASHIMI_COPY } from "@workspace/seasonal/data/copy"
import type { Month } from "@workspace/seasonal/data/months"

// 제철 회 화면(.scratch/sashimi/spec.md 3장). 이슈 04에서 달 칩 · 카드 목록 · 안내 문구를 채운다.
export function SashimiView({ month }: { month: Month }) {
  return (
    <main className="mx-auto max-w-[720px] px-[18px] py-6">
      <h1 className="font-heading text-2xl">{SASHIMI_COPY.pageTitle(month)}</h1>
    </main>
  )
}
