import { Skeleton, SkeletonGroup } from "@workspace/ui/components/skeleton"

import { NewEditionForm } from "../new-edition/new-edition-form"
import type { EditionBoardData } from "../server/queries"
import { EditionBoard } from "./edition-board"

const LAYOUT = "grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px]"

export function AdminBoard({ editions, nextIds }: EditionBoardData) {
  return (
    <div className={LAYOUT}>
      <section aria-label="에디션 목록" className="min-w-0">
        <EditionBoard editions={editions} />
      </section>
      <aside aria-label="새 에디션" className="lg:sticky lg:top-6">
        <NewEditionForm nextIds={nextIds} />
      </aside>
    </div>
  )
}

export function AdminBoardSkeleton() {
  return (
    <div className={LAYOUT}>
      <SkeletonGroup aria-label="에디션 불러오는 중">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </SkeletonGroup>
      <Skeleton className="h-[520px] rounded-3xl" />
    </div>
  )
}
