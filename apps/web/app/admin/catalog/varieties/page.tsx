import { connection } from "next/server"
import { Suspense } from "react"

import { FOODS } from "@workspace/seasonal/data/foods"

import { getVarietyCatalog } from "@/features/admin-catalog/server/varieties"
import { VarietyBoard } from "@/features/admin-catalog/varieties/variety-board"

export default function Page() {
  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance">식재료 목록</h1>
        <p className="max-w-[70ch] text-base text-pretty text-stone">
          카탈로그에 등록된 식재료와 지금 시세 화면에 나오는지, 아직 어느 식재료에도 잇지 않은 pending 원천 키, 제철달력 연결을 봐요. 운영 DB를 읽기 전용으로 읽어요.
        </p>
      </header>
      <Suspense fallback={<p className="text-stone">불러오는 중…</p>}>
        <Board />
      </Suspense>
    </main>
  )
}

const FOOD_NAMES = Object.fromEntries(FOODS.map((f) => [f.id, { name: f.name, category: f.category }]))

async function Board() {
  await connection()
  return <VarietyBoard {...await getVarietyCatalog()} foodNames={FOOD_NAMES} />
}
