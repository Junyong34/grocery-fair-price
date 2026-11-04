import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import { editionName } from "@workspace/seasonal/print/listing"

import { EditionShelf } from "@/features/seasonal/downloads/downloads-view"
import { EditionDetail } from "@/features/seasonal/downloads/edition-detail"
import { WithdrawnNotice } from "@/features/seasonal/downloads/withdrawn-notice"
import { DOWNLOADS, findEdition, findWithdrawn } from "@/shared/downloads-manifest"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { editionSeoTitle } from "@/shared/seo/titles"
import { SubHeader } from "@/shared/shell/sub-header"

type Params = PageProps<"/seasonal/downloads/[edition]">["params"]

/** 게시된 에디션이 없을 때 넣는 자리. Cache Components는 빈 목록을 빌드 오류로 막는다. 에디션 id는 "종류-번호"라 겹치지 않는다. */
const NO_EDITION = "none"

// 내린 에디션도 만든다. 옛 링크로 오면 안내 페이지(6-1)를 보인다.
export function generateStaticParams() {
  const ids = [...DOWNLOADS.editions, ...DOWNLOADS.withdrawn].map((edition) => edition.id)
  return (ids.length > 0 ? ids : [NO_EDITION]).map((edition) => ({ edition }))
}

export async function generateMetadata(props: PageProps<"/seasonal/downloads/[edition]">): Promise<Metadata> {
  const id = (await props.params).edition
  const withdrawn = findWithdrawn(id)
  if (withdrawn) return createMetadata({ title: DOWNLOADS_COPY.withdrawn.title, description: DOWNLOADS_COPY.withdrawn.body(editionName(withdrawn)), path: routes.seasonal.download(id), noIndex: true })
  const edition = findEdition(id)
  if (!edition) return {}
  const name = editionName(edition)
  return createMetadata({
    title: editionSeoTitle(name),
    description: `${name} 무료 다운로드. ${edition.description} A4 PDF ${edition.pages}쪽을 회원가입 없이 내려받아 인쇄하세요.`,
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
  const id = (await params).edition
  const withdrawn = findWithdrawn(id)
  if (withdrawn) return <WithdrawnNotice edition={withdrawn} />
  const edition = findEdition(id)
  if (!edition) notFound()
  const others = DOWNLOADS.editions.filter((other) => other.id !== edition.id)
  return (
    <article className="mx-auto flex max-w-[560px] flex-col gap-4 pt-6 pb-12 lg:pt-8">
      <JsonLd data={breadcrumb([{ name: "제철 음식 달력", path: routes.seasonal.root }, { name: DOWNLOADS_COPY.title, path: routes.seasonal.downloads }, { name: editionName(edition), path: routes.seasonal.download(edition.id) }])} />
      {/* 공유는 본문 버튼 줄에 있어 맨 위 줄에는 두지 않는다. */}
      <SubHeader title={editionName(edition)} fallbackHref={routes.seasonal.downloads} />
      <Link href={routes.seasonal.downloads} className="self-start px-[18px] text-sm text-stone max-lg:hidden">
        {DOWNLOADS_COPY.backToList}
      </Link>
      <div className="px-[18px]">
        <EditionDetail edition={edition} placement="page" title={<h1 className="font-heading text-[28px] leading-tight font-bold text-ink">{editionName(edition)}</h1>} />
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
