import { Suspense } from "react"

import { IngestStatusBoard } from "@/features/admin-ingest/ingest-status-board"
import { getIngestStatus } from "@/features/admin-ingest/server/status"
import { getSeoulToday } from "@/shared/today"

export default function Page() {
  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance">수집 상태</h1>
        <p className="max-w-[70ch] text-base text-pretty text-stone">
          세 출처의 수집이 어디까지 왔는지 봐요. 운영 DB를 읽기 전용으로 읽어요. 빈 날은 다음 수집이 다시 받고, 사람이 볼 일은 알림 이슈로도 열려요.
        </p>
      </header>
      <Suspense fallback={<p className="text-stone">불러오는 중…</p>}>
        <Board />
      </Suspense>
    </main>
  )
}

async function Board() {
  const today = await getSeoulToday()
  const day = `${today.year}-${String(today.month).padStart(2, "0")}-${String(today.day).padStart(2, "0")}`
  return <IngestStatusBoard status={await getIngestStatus(day)} />
}
