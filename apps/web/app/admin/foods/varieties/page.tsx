import { connection } from "next/server"
import { Suspense } from "react"

import { FoodBoard } from "@/features/admin-foods/foods/food-board"
import { listFoods } from "@/features/admin-foods/server/foods"

export default function Page() {
  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance">품종 편집</h1>
        <p className="max-w-[60ch] text-base text-pretty text-stone">
          품종의 표시명, 별칭, 카테고리, 제철 달, 근거, 연결된 그림을 고쳐요. 품종 ID는 주소와 먹음 기록의 키라 바꾸지 않고, 품종을 지우지도 않아요. 달력에서 빼려면 제철 미검증으로 내려요.
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
  const { rows, artIds } = await listFoods()
  return <FoodBoard rows={rows} artIds={artIds} />
}
