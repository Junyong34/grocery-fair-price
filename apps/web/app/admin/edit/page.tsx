import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { Skeleton } from "@workspace/ui/components/skeleton"

import { EditionEditor } from "@/features/admin-print/editor"
import { readBuilds, readEdition } from "@/features/admin-print/files"
import { routes } from "@/shared/routes"

// 에디션 편집기. ?id=<에디션 id>
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
  const edition = typeof id === "string" ? await readEdition(id) : undefined
  if (!edition) notFound()
  const build = (await readBuilds())[edition.id]
  return <EditionEditor key={edition.id} saved={edition} build={build} />
}
