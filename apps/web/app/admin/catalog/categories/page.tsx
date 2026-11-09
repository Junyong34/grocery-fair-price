import { connection } from "next/server"
import { Suspense } from "react"

import { CategoryBoard } from "@/features/admin-catalog/categories/category-board"
import { listCategories } from "@/features/admin-catalog/server/categories"
import { ownerDbLabel } from "@/features/admin-catalog/server/owner-db"

export default function Page() {
  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance">카테고리</h1>
        <p className="max-w-[60ch] text-base text-pretty text-stone">
          장보기 동선 기준의 최상위 분류예요. 이름과 순서를 고치고, 품목이 없는 카테고리는 지울 수 있어요. slug는 만든 뒤 바꾸지 않아요. 바꾼 뒤에는 저장소 사본을 다시 내보내 커밋하세요.
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
  return <CategoryBoard rows={await listCategories()} dbLabel={ownerDbLabel()} />
}
