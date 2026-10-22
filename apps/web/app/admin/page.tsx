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
          PDF는 이 컴퓨터의 public/downloads에 저장되고 git에는 올라가지 않아요. 저장 위치를 정하기 전까지는 에디션을 공개하지 마세요. 공개하면 운영의 내려받기 링크가 깨져요.
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
