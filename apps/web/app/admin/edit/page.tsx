import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { EditionEditor } from "@/features/admin-print/editor"
import { readBuilds, readEdition } from "@/features/admin-print/files"
import { routes } from "@/shared/routes"

// 에디션 편집기. ?id=<에디션 id>
export default function Page(props: PageProps<"/admin/edit">) {
  return (
    <main className="flex flex-col gap-6">
      <Link href={routes.admin.root} className="text-sm text-stone">
        ← 에디션 목록
      </Link>
      <Suspense fallback={<p className="text-sm text-caption">불러오는 중…</p>}>
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
