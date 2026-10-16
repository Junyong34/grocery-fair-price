import { connection } from "next/server"
import { Suspense } from "react"

import { Skeleton, SkeletonGroup } from "@workspace/ui/components/skeleton"

import { nextEditionId } from "@workspace/seasonal/print/edition"
import { PRINT_KINDS, specHash, type PrintKind } from "@workspace/seasonal/print/spec"

import { EditionBoard } from "@/features/admin-print/edition-board"
import { listEditions, readBuilds } from "@/features/admin-print/files"
import { NewEditionForm } from "@/features/admin-print/new-edition-form"

export default function Page() {
  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-hairline pb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-balance">인쇄물 에디션</h1>
        <p className="max-w-[65ch] text-sm text-pretty text-stone">
          PDF는 이 컴퓨터의 public/downloads에 저장되고 git에는 올라가지 않아요. 저장 위치를 정하기 전까지는 에디션을 공개하지 마세요. 공개하면 운영의 내려받기 링크가 깨져요.
        </p>
      </header>
      <Suspense fallback={<BoardSkeleton />}>
        <Board />
      </Suspense>
    </main>
  )
}

async function Board() {
  // 파일을 고칠 때마다 다시 읽는다.
  await connection()
  const [editions, builds] = await Promise.all([listEditions(), readBuilds()])
  const ids = editions.map((edition) => edition.id)
  const nextIds = Object.fromEntries(PRINT_KINDS.map((kind) => [kind, nextEditionId(kind, ids)])) as Record<PrintKind, string>
  const summaries = editions.map((edition) => {
    const build = builds[edition.id]
    return {
      id: edition.id,
      kind: edition.spec.kind,
      title: edition.title,
      published: edition.status === "published",
      generatedAt: build && build.specHash === specHash(edition.spec) ? build.generatedAt.slice(0, 10) : null,
    }
  })
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside aria-label="새 에디션" className="order-2 rounded-3xl bg-surface-grey/60 p-3 lg:sticky lg:top-6 lg:order-none">
        <NewEditionForm nextIds={nextIds} />
      </aside>
      <section aria-label="에디션 목록" className="order-1 min-w-0 lg:order-none">
        <EditionBoard editions={summaries} />
      </section>
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Skeleton className="h-[520px] rounded-3xl" />
      <SkeletonGroup aria-label="에디션 불러오는 중">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </SkeletonGroup>
    </div>
  )
}
