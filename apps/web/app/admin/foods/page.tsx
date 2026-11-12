import { connection } from "next/server"
import { Suspense } from "react"

import { ArtBoard } from "@/features/admin-foods/arts/art-board"
import { listArts } from "@/features/admin-foods/server/arts"

export default function Page() {
  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance">그림 검수</h1>
        <p className="max-w-[60ch] text-base text-pretty text-stone">
          그림 원본에서 바로 그린 미리보기예요. 실물과 닮았는지, 같은 시리즈로 보이는지 확인하고 검수를 판정하세요. 검수를 마치고 용도(제철 · 이유식)를 정한 그림만 웹에 나가요. 저장은 파일만 고치고, “웹에 반영”을 눌러야 화면에 나와요.
        </p>
      </header>
      <Suspense fallback={<p className="text-stone">그림을 그리는 중…</p>}>
        <Board />
      </Suspense>
    </main>
  )
}

async function Board() {
  await connection()
  const list = await listArts()
  if (!list.available) {
    return (
      <p className="rounded-xl bg-mat px-4 py-3 text-sm text-stone">
        이 기기에는 그림 원본(prototypes/seasonal-food)이 없어요. 그림 검수는 원본이 있는 기기에서 해요.
      </p>
    )
  }
  return <ArtBoard rows={list.rows} broken={list.broken} failed={list.failed} foods={list.foods} infantKeys={list.infantKeys} />
}
