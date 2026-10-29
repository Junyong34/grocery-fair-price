import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import { editionName } from "@workspace/seasonal/print/listing"

import { EditionShelf } from "@/features/seasonal/downloads/downloads-view"
import { EditionDetail } from "@/features/seasonal/downloads/edition-detail"
import { DOWNLOADS, findEdition } from "@/shared/downloads-manifest"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

type Params = PageProps<"/seasonal/downloads/[edition]">["params"]

/** 게시된 에디션이 없을 때 넣는 자리. Cache Components는 빈 목록을 빌드 오류로 막는다. 에디션 id는 "종류-번호"라 겹치지 않는다. */
const NO_EDITION = "none"

export function generateStaticParams() {
  const ids = DOWNLOADS.editions.map((edition) => edition.id)
  return (ids.length > 0 ? ids : [NO_EDITION]).map((edition) => ({ edition }))
}

export async function generateMetadata(props: PageProps<"/seasonal/downloads/[edition]">): Promise<Metadata> {
  const edition = findEdition((await props.params).edition)
  if (!edition) return {}
  const name = editionName(edition)
  return createMetadata({
    title: `${name} PDF`,
    description: edition.description,
    path: routes.seasonal.download(edition.id),
    ogImage: { title: name, subtitle: edition.description, badge: "PDF" },
  })
}

// 주소로 직접 열거나 공유받은 링크로 들어오면 보이는 전체 페이지(3-P). 목록에서 누르면 @sheet가 가로챈다.
export default function Page(props: PageProps<"/seasonal/downloads/[edition]">) {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <Edition params={props.params} />
    </Suspense>
  )
}

async function Edition({ params }: { params: Params }) {
  const edition = findEdition((await params).edition)
  if (!edition) notFound()
  const others = DOWNLOADS.editions.filter((other) => other.id !== edition.id)
  return (
    <article className="mx-auto flex max-w-[560px] flex-col gap-4 pt-6 pb-12 lg:pt-10">
      {/* 공유는 본문 버튼 줄에 있어 맨 위 줄에는 두지 않는다. */}
      <Link href={routes.seasonal.downloads} className="self-start px-[18px] text-sm text-stone">
        {DOWNLOADS_COPY.backToList}
      </Link>
      <div className="px-[18px]">
        <EditionDetail edition={edition} title={<h1 className="font-heading text-[28px] leading-tight font-bold text-ink">{editionName(edition)}</h1>} />
      </div>
      {others.length > 0 && (
        <section aria-labelledby="others" className="mt-4 flex flex-col gap-3">
          <h2 id="others" className="flex items-baseline justify-between px-[18px] font-heading text-lg text-ink">
            {DOWNLOADS_COPY.others}
            <Link href={routes.seasonal.downloads} className="font-sans text-xs text-stone">
              {DOWNLOADS_COPY.seeAll}
            </Link>
          </h2>
          <EditionShelf editions={others} fullNames />
        </section>
      )}
    </article>
  )
}
