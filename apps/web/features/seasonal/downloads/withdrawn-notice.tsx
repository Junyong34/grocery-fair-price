import Link from "next/link"

import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import type { WithdrawnEntry } from "@workspace/seasonal/print/edition"
import { editionMeta, editionName, replacementFor } from "@workspace/seasonal/print/listing"

import { DOWNLOADS } from "@/shared/downloads-manifest"
import { routes } from "@/shared/routes"

import { EditionThumbnail } from "../components/edition-thumbnail"

/** 내린 에디션 주소로 왔을 때(6-1). 같은 종류의 최신 에디션을 안내한다. 다른 해 달력으로 말없이 넘기지 않는다. */
export function WithdrawnNotice({ edition }: { edition: WithdrawnEntry }) {
  const replacement = replacementFor(edition, DOWNLOADS.editions)
  return (
    <div className="mx-auto flex max-w-[480px] flex-col items-center gap-2 px-[18px] pt-14 pb-12 text-center">
      <h1 className="font-heading text-2xl font-bold text-ink">{DOWNLOADS_COPY.withdrawn.title}</h1>
      <p className="text-sm text-stone">
        {DOWNLOADS_COPY.withdrawn.body(editionName(edition))}
        {replacement && (
          <>
            <br />
            {DOWNLOADS_COPY.withdrawn.replacement}
          </>
        )}
      </p>
      {replacement && (
        <Link
          href={routes.seasonal.download(replacement.id)}
          className="mt-5 flex w-full items-center gap-4 rounded-2xl border border-hairline bg-canvas p-3 text-left text-ink no-underline hover:border-gold-pale"
        >
          {replacement.thumbnails[0] && <EditionThumbnail thumbnail={replacement.thumbnails[0]} name={editionName(replacement)} className="w-16 shrink-0" />}
          <span className="flex flex-col gap-0.5">
            <span className="font-semibold">{editionName(replacement)}</span>
            <span className="text-[13px] text-stone">{editionMeta(replacement).join(" · ")}</span>
          </span>
        </Link>
      )}
      <Link href={routes.seasonal.downloads} className="mt-3 inline-flex h-11 items-center rounded-full border border-hairline px-5 text-sm text-ink no-underline">
        {DOWNLOADS_COPY.withdrawn.seeAll}
      </Link>
    </div>
  )
}
