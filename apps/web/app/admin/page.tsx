import Link from "next/link"
import { connection } from "next/server"
import { Suspense } from "react"

import { Button } from "@workspace/ui/components/button"

import { specHash, PRINT_KIND_LABELS, PRINT_KINDS } from "@workspace/seasonal/print/spec"

import { createEdition } from "@/features/admin-print/actions"
import { listEditions, readBuilds } from "@/features/admin-print/files"
import { routes } from "@/shared/routes"

export default function Page() {
  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl">인쇄물 에디션</h1>
        <p className="text-sm text-stone">
          만든 PDF는 public/downloads에 저장되고 git에는 올라가지 않는다(용량). 저장 위치를 정하기 전까지는 에디션을 공개하지 않는다. 공개하면 운영의 내려받기 링크가 깨진다.
        </p>
      </header>
      <form action={createEdition} className="flex flex-wrap items-end gap-3 rounded-lg border border-hairline p-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-caption">종류</span>
          <select name="kind" className="rounded-md border border-hairline bg-surface px-2 py-1.5">
            {PRINT_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {PRINT_KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption">id(영문 소문자·숫자·하이픈)</span>
          <input name="id" required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="rounded-md border border-hairline bg-surface px-2 py-1.5" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption">이름</span>
          <input name="title" required className="rounded-md border border-hairline bg-surface px-2 py-1.5" />
        </label>
        <Button type="submit">새 에디션</Button>
      </form>
      <Suspense fallback={<p className="text-sm text-caption">불러오는 중…</p>}>
        <EditionList />
      </Suspense>
    </main>
  )
}

async function EditionList() {
  // 파일을 고칠 때마다 다시 읽는다.
  await connection()
  const [editions, builds] = await Promise.all([listEditions(), readBuilds()])
  if (editions.length === 0) return <p className="text-sm text-caption">에디션이 없다.</p>
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {editions.map((edition) => {
        const build = builds[edition.id]
        const stale = !build || build.specHash !== specHash(edition.spec)
        return (
          <li key={edition.id}>
            <Link href={routes.admin.edition(edition.id)} className="flex flex-col gap-1 rounded-lg border border-hairline bg-surface p-4 hover:border-stone">
              <span className="text-xs text-caption">{PRINT_KIND_LABELS[edition.spec.kind]}</span>
              <span className="font-heading text-lg">{edition.title}</span>
              <span className="text-xs text-stone">
                {edition.status === "published" ? "공개" : "초안"} · {stale ? "생성 필요" : `생성 ${build.generatedAt.slice(0, 10)}`}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
