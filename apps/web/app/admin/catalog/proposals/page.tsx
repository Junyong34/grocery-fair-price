import { connection } from "next/server"
import { Suspense } from "react"

import { ProposalBoard } from "@/features/admin-catalog/proposals/proposal-board"
import { getProposalBoard } from "@/features/admin-catalog/server/proposals"

export default function Page() {
  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance">제안 검토</h1>
        <p className="max-w-[70ch] text-base text-pretty text-stone">
          로컬 에이전트(/catalog-propose)가 pending 원천 키·상품마다 쓴 분류 제안을 보고 적용하거나 반려해요. 적용하면 카탈로그와 가격 매핑이 바로 바뀌고, 적용한 제안은 되돌릴 수 있어요.
        </p>
      </header>
      <Suspense fallback={<p className="text-stone">불러오는 중…</p>}>
        <Board />
      </Suspense>
    </main>
  )
}

async function Board() {
  await connection()
  return <ProposalBoard {...await getProposalBoard()} />
}
