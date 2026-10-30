import Link from "next/link"
import { connection } from "next/server"
import { Suspense } from "react"

import { AdminBoard, AdminBoardSkeleton } from "@/features/admin-print/board/admin-board"
import { getEditionBoard } from "@/features/admin-print/server/queries"
import { routes } from "@/shared/routes"

export default function Page() {
  return (
    <main className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance">인쇄물 에디션</h1>
        <p className="max-w-[60ch] text-base text-pretty text-stone">
          PDF는 이 컴퓨터의 public/downloads에 만들어지고 git에는 올라가지 않아요. 공개하면 비공개 R2에 올리고, 내리면 지워요. 사용자 목록(manifest.json)과 썸네일은 커밋해 배포해야 운영에 보여요.
        </p>
        <Link href={routes.admin.wireframes} className="self-start text-sm text-stone underline underline-offset-4 hover:text-ink">
          인쇄물 와이어프레임 보기
        </Link>
      </header>
      <Suspense fallback={<AdminBoardSkeleton />}>
        <Board />
      </Suspense>
    </main>
  )
}

async function Board() {
  await connection()
  return <AdminBoard {...await getEditionBoard()} />
}
