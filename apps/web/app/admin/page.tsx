import { connection } from "next/server"
import { Suspense } from "react"

import { ArticleHeadings } from "@workspace/ui/components/article-headings"
import { Empty, EmptyDescription, EmptyTitle } from "@workspace/ui/components/empty"
import { Skeleton, SkeletonGroup } from "@workspace/ui/components/skeleton"

import { nextEditionId } from "@workspace/seasonal/print/edition"
import { PRINT_KIND_LABELS, PRINT_KINDS, specHash } from "@workspace/seasonal/print/spec"

import { listEditions, readBuilds } from "@/features/admin-print/files"
import { NewEditionForm } from "@/features/admin-print/new-edition-form"
import { routes } from "@/shared/routes"

export default function Page() {
  return (
    <main className="flex flex-col gap-10">
      <header className="flex max-w-[60ch] flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-balance">인쇄물 에디션</h1>
        <p className="text-sm text-pretty text-stone">
          PDF는 이 컴퓨터의 public/downloads에 저장되고 git에는 올라가지 않아요. 저장 위치를 정하기 전까지는 에디션을 공개하지 마세요. 공개하면 운영의 내려받기 링크가 깨져요.
        </p>
      </header>
      <Suspense fallback={<ListSkeleton />}>
        <Editions />
      </Suspense>
    </main>
  )
}

async function Editions() {
  // 파일을 고칠 때마다 다시 읽는다.
  await connection()
  const [editions, builds] = await Promise.all([listEditions(), readBuilds()])
  const ids = editions.map((edition) => edition.id)
  const nextIds = Object.fromEntries(PRINT_KINDS.map((kind) => [kind, nextEditionId(kind, ids)])) as Record<(typeof PRINT_KINDS)[number], string>

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="flex flex-col gap-8" aria-label="에디션 목록">
        {editions.length === 0 && (
          <Empty className="rounded-2xl bg-surface">
            <EmptyTitle>아직 에디션이 없어요</EmptyTitle>
            <EmptyDescription>오른쪽에서 종류를 고르고 이름을 붙이면 첫 에디션이 생겨요.</EmptyDescription>
          </Empty>
        )}
        {PRINT_KINDS.map((kind) => {
          const items = editions
            .filter((edition) => edition.spec.kind === kind)
            .map((edition) => {
              const build = builds[edition.id]
              const generated = build && build.specHash === specHash(edition.spec) ? `${build.generatedAt.slice(0, 10)} 생성` : "생성 필요"
              return {
                id: edition.id,
                title: edition.title,
                meta: `${edition.status === "published" ? "공개" : "초안"} · ${generated} · ${edition.id}`,
                href: routes.admin.edition(edition.id),
              }
            })
          if (items.length === 0) return null
          // 머리줄 오른쪽의 영어 개수 표시("1 entry")는 숨기고 개수를 이름 옆에 적는다.
          return (
            <ArticleHeadings
              key={kind}
              items={items}
              label={`${PRINT_KIND_LABELS[kind]} · ${items.length}`}
              size="sm"
              headingLevel={2}
              className="[&_.v-article-headings\_\_header>span:last-child]:hidden"
            />
          )
        })}
      </section>
      <aside className="lg:sticky lg:top-8">
        <NewEditionForm nextIds={nextIds} />
      </aside>
    </div>
  )
}

function ListSkeleton() {
  return (
    <SkeletonGroup aria-label="에디션 불러오는 중" className="max-w-[640px]">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
    </SkeletonGroup>
  )
}
