import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { Skeleton } from "@workspace/ui/components/skeleton"

import { EditionEditor } from "@/features/admin-print/editor/edition-editor"
import { getEditionEditor } from "@/features/admin-print/server/queries"
import { routes } from "@/shared/routes"
import { getSeoulToday } from "@/shared/today"

export default function Page(props: PageProps<"/admin/edit">) {
  return (
    <main className="flex flex-col gap-6">
      <nav aria-label="이동">
        <Link href={routes.admin.root} className="text-sm text-stone underline-offset-4 hover:text-ink hover:underline">
          ← 에디션 목록
        </Link>
      </nav>
      <Suspense fallback={<Skeleton className="h-[640px] rounded-2xl" />}>
        <Editor searchParams={props.searchParams} />
      </Suspense>
    </main>
  )
}

async function Editor({ searchParams }: { searchParams: PageProps<"/admin/edit">["searchParams"] }) {
  const { id } = await searchParams
  const [data, today] = await Promise.all([typeof id === "string" ? getEditionEditor(id) : undefined, getSeoulToday()])
  if (!data) notFound()
  return <EditionEditor key={data.edition.id} saved={data.edition} build={data.build} storageReady={data.storageReady} currentYear={today.year} />
}
