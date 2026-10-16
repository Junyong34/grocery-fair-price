import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import type { DownloadManifest, ManifestEntry } from "@workspace/seasonal/print/edition"
import { PRINT_KIND_LABELS } from "@workspace/seasonal/print/spec"

import manifest from "@/public/downloads/manifest.json"

import { EditionDownloads } from "./edition-downloads"

// 관리자가 어드민에서 만들어 올린 PDF 목록. public/downloads/manifest.json을 빌드 때 읽는다.
const { editions } = manifest as DownloadManifest

const GROUPS = [
  { title: DOWNLOADS_COPY.calendars, kinds: ["monthly", "year-sheet"] },
  { title: DOWNLOADS_COPY.posters, kinds: ["season-poster", "month-poster"] },
] as const satisfies readonly { title: string; kinds: readonly ManifestEntry["kind"][] }[]

export function DownloadsView() {
  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-8 px-[18px] pt-6 pb-12 lg:px-6 lg:pt-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold text-ink lg:text-3xl">{DOWNLOADS_COPY.title}</h1>
        <p className="text-sm text-stone">{DOWNLOADS_COPY.intro}</p>
      </header>
      {editions.length === 0 && <p className="text-sm text-caption">{DOWNLOADS_COPY.empty}</p>}
      {GROUPS.map(({ title, kinds }) => {
        const entries = editions.filter((edition) => (kinds as readonly string[]).includes(edition.kind))
        if (entries.length === 0) return null
        return (
          <section key={title} className="flex flex-col gap-3">
            <h2 className="font-heading text-lg text-ink">{title}</h2>
            <ul className="flex flex-col gap-3">
              {entries.map((edition) => (
                <li key={edition.id} className="flex flex-col gap-3 rounded-xl bg-surface p-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-caption">{PRINT_KIND_LABELS[edition.kind]}</span>
                    <span className="font-heading text-lg text-ink">{edition.title}</span>
                    {edition.description && <span className="text-sm text-stone">{edition.description}</span>}
                  </div>
                  <EditionDownloads edition={edition} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
