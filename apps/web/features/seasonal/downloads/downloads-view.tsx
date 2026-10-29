import Link from "next/link"

import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import type { ManifestEntry } from "@workspace/seasonal/print/edition"
import { editionName, shelvesOf } from "@workspace/seasonal/print/listing"
import { PRINT_KIND_LABELS } from "@workspace/seasonal/print/spec"

import { DOWNLOADS } from "@/shared/downloads-manifest"
import { routes } from "@/shared/routes"

import { EditionThumbnail } from "../components/edition-thumbnail"

/** 내려받기 목록(2-C): 종류별 가로 줄. 칸을 누르면 상세가 시트로 뜬다(@sheet/(.)downloads/[edition]). */
export function DownloadsView() {
  const shelves = shelvesOf(DOWNLOADS.editions)
  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-8 pt-6 pb-12 lg:pt-10">
      <header className="flex flex-col gap-2 px-[18px] lg:px-6">
        <h1 className="font-heading text-2xl font-bold text-ink lg:text-3xl">{DOWNLOADS_COPY.title}</h1>
        <p className="text-sm text-stone">{DOWNLOADS_COPY.intro}</p>
      </header>
      {shelves.length === 0 && <p className="px-[18px] text-sm text-caption lg:px-6">{DOWNLOADS_COPY.empty}</p>}
      {shelves.map(({ kind, editions }) => (
        <section key={kind} aria-labelledby={`shelf-${kind}`} className="flex flex-col gap-3">
          <h2 id={`shelf-${kind}`} className="flex items-baseline justify-between px-[18px] font-heading text-lg text-ink lg:px-6">
            {PRINT_KIND_LABELS[kind]}
            <span className="font-sans text-xs text-caption">{DOWNLOADS_COPY.shelfMeta(editions.length)}</span>
          </h2>
          <EditionShelf editions={editions} />
        </section>
      ))}
    </div>
  )
}

/**
 * 가로로 넘겨 보는 줄. 칸 폭을 화면보다 조금 좁게 잡아 끝 칸이 잘려 보이게 한다(더 있다는 표시). 데스크톱은 넘기지 않고 네 칸.
 * 칸 이름은 제목만 쓴다(종류는 줄 제목). 종류가 섞인 줄(상세의 "다른 인쇄물")은 fullNames로 종류까지 쓴다.
 */
export function EditionShelf({ editions, fullNames = false }: { editions: readonly ManifestEntry[]; fullNames?: boolean }) {
  return (
    <ul className="flex snap-x snap-mandatory scroll-px-[18px] gap-3 overflow-x-auto px-[18px] pb-1 [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-6">
      {editions.map((edition) => (
        <li key={edition.id} className="w-[38%] max-w-[180px] shrink-0 snap-start lg:w-auto lg:max-w-none">
          <Link href={routes.seasonal.download(edition.id)} className="flex flex-col gap-2 text-ink no-underline">
            {edition.thumbnails[0] && <EditionThumbnail thumbnail={edition.thumbnails[0]} name={editionName(edition)} />}
            <span className="text-[13px] leading-snug font-semibold">{fullNames ? editionName(edition) : edition.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
