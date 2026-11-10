import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import type { ManifestEntry } from "@workspace/seasonal/print/edition"
import { editionMeta, editionName, editionsOfYear, editionYears, shelvesOf, yearlessEditions } from "@workspace/seasonal/print/listing"

import { EditionThumbnail, ThumbnailMat } from "@/shared/downloads/edition-thumbnail"
import { DOWNLOADS } from "@/shared/downloads-manifest"
import { routes } from "@/shared/routes"
import { SubHeader } from "@/shared/shell/sub-header"

import { YearFilter } from "./year-filter"

/** 달력만 연도별로 고른다. 포스터와 이유식 자료는 모든 연도에서 그대로 보인다. */
export function DownloadsView() {
  const { editions } = DOWNLOADS
  const calendars = editions.filter((edition) => edition.year !== undefined)
  const yearless = yearlessEditions(editions)
  const posters = yearless.filter(({ kind }) => kind === "season-poster" || kind === "month-poster")
  const babyFood = yearless.filter(({ kind }) => kind === "baby-food-pairings" || kind === "baby-food-fruits")
  return (
    <div className="bg-canvas">
      <div className="mx-auto flex max-w-[960px] flex-col gap-14 px-7 pt-10 pb-16 lg:gap-16 lg:px-10 lg:pt-14 lg:pb-20">
        <header className="flex flex-col items-start gap-4">
          <SubHeader title={DOWNLOADS_COPY.format} fallbackHref={routes.seasonal.root} revealAfter="downloads-title" />
          <p className="rounded-full bg-gold-wash px-3 py-1 text-xs font-semibold text-gold-deep">{DOWNLOADS_COPY.format}</p>
          <h1 id="downloads-title" className="font-heading text-3xl leading-tight font-bold text-ink [overflow-wrap:anywhere] lg:text-4xl">
            {DOWNLOADS_COPY.title}
          </h1>
          <p className="max-w-prose text-sm leading-relaxed text-stone">{DOWNLOADS_COPY.intro} {DOWNLOADS_COPY.free}</p>
        </header>

        {editions.length === 0 && <p className="text-sm text-caption">{DOWNLOADS_COPY.empty}</p>}
        {calendars.length > 0 && (
          <DownloadSection id="calendars" copy={DOWNLOADS_COPY.sections.calendars}>
            <YearFilter panels={editionYears(calendars).map((year) => ({
              year,
              content: <EditionCards editions={editionsOfYear(calendars, year)} eagerThumbnails />,
            }))} />
          </DownloadSection>
        )}
        {posters.length > 0 && (
          <DownloadSection id="posters" copy={DOWNLOADS_COPY.sections.posters}>
            <EditionCards editions={posters} />
          </DownloadSection>
        )}
        {babyFood.length > 0 && (
          <DownloadSection id="baby-food" copy={DOWNLOADS_COPY.sections.babyFood}>
            <EditionCards editions={babyFood} />
          </DownloadSection>
        )}

        <section aria-labelledby="download-guide" className="flex flex-col items-start gap-6 rounded-2xl bg-surface p-7 lg:p-9">
          <h2 id="download-guide" className="font-heading text-xl font-bold text-ink">{DOWNLOADS_COPY.guide.title}</h2>
          <dl className="grid gap-5 md:grid-cols-2 md:gap-8">
            {DOWNLOADS_COPY.guide.items.map(({ question, answer }) => (
              <div key={question} className="flex flex-col gap-1.5">
                <dt className="text-sm font-semibold text-ink">{question}</dt>
                <dd className="text-sm leading-relaxed text-stone">{answer}</dd>
              </div>
            ))}
          </dl>
          <Link href={routes.seasonal.months} className="text-sm text-ink underline underline-offset-4">{DOWNLOADS_COPY.guide.browse}</Link>
        </section>
      </div>
    </div>
  )
}

function DownloadSection({ id, copy, children }: { id: string; copy: { title: string; description: string }; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 id={id} className="font-heading text-2xl font-bold text-ink">{copy.title}</h2>
        <p className="text-sm leading-relaxed text-stone">{copy.description}</p>
      </div>
      {children}
    </section>
  )
}

function EditionCards({ editions, eagerThumbnails }: { editions: readonly ManifestEntry[]; eagerThumbnails?: boolean }) {
  return (
    <ul className="grid gap-5 md:grid-cols-2 md:gap-6">
      {shelvesOf(editions).flatMap(({ editions }) => editions).map((edition) => (
        <li key={edition.id} className="min-w-0">
          <Link
            href={routes.seasonal.download(edition.id)}
            className="group grid h-full grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-2xl border border-hairline bg-surface p-5 text-ink no-underline [overflow-wrap:anywhere] hover:border-gold-pale focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep sm:gap-6 sm:p-6"
          >
            <ThumbnailMat className="aspect-[4/5] w-16 rounded-lg p-2 sm:w-22">
              {edition.thumbnails[0] && (
                <EditionThumbnail thumbnail={edition.thumbnails[0]} name={edition.title} decorative priority={eagerThumbnails} className="max-h-full w-auto max-w-full" />
              )}
            </ThumbnailMat>
            <div className="flex min-w-0 flex-col gap-2.5">
              <div className="flex flex-col gap-1">
                <h3 className="text-[15px] leading-snug font-semibold sm:text-base">{edition.title}</h3>
                <p className="text-[13px] leading-snug text-stone">{edition.description}</p>
              </div>
              <p className="text-xs text-stone tabular-nums">{editionMeta(edition).slice(0, 2).join(" · ")}</p>
              <span className="flex items-center gap-1 text-xs font-semibold text-gold-deep group-hover:underline">
                {DOWNLOADS_COPY.previewDownload}
                <ChevronRight aria-hidden size={14} strokeWidth={2} className="shrink-0 rtl:rotate-180" />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

/**
 * 가로로 넘겨 보는 줄. 칸 폭을 화면보다 조금 좁게 잡아 끝 칸이 잘려 보이게 한다(더 있다는 표시). 데스크톱은 넘기지 않고 네 칸.
 * 상세의 "다른 인쇄물"에는 종류까지 붙여 보여 준다.
 */
export function EditionShelf({ editions }: { editions: readonly ManifestEntry[] }) {
  return (
    <ul className="flex snap-x snap-mandatory scroll-px-[18px] gap-3 overflow-x-auto px-[18px] pb-1 [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-6">
      {editions.map((edition) => (
        <li key={edition.id} className="w-[38%] max-w-[180px] shrink-0 snap-start lg:w-auto lg:max-w-none">
          <Link href={routes.seasonal.download(edition.id)} className="flex flex-col gap-2 text-ink no-underline">
            {edition.thumbnails[0] && (
              // 세로·가로 용지가 섞여도 칸 높이가 같도록 받침 비율을 고정하고 종이를 가운데에 둔다.
              <ThumbnailMat className="aspect-[4/5] p-[12%]">
                <EditionThumbnail thumbnail={edition.thumbnails[0]} name={editionName(edition)} decorative className="max-h-full w-auto max-w-full" />
              </ThumbnailMat>
            )}
            <span className="text-[13px] leading-snug font-semibold">{editionName(edition)}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
