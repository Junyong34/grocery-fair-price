"use client"

import { Segmented } from "@workspace/ui/components/segmented"

import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import type { ManifestEntry } from "@workspace/seasonal/print/edition"
import { PAPER_SIZES } from "@workspace/seasonal/print/spec"

import { useHydrateSettings, useSettingsStore } from "../stores/settings-store"

const PAPER_OPTIONS = PAPER_SIZES.map((paper) => ({ value: paper, label: DOWNLOADS_COPY.paperHint[paper] }))

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`

/** 에디션 하나의 용지 고르기와 내려받기 링크. 고른 용지는 기기에 저장한다. */
export function EditionDownloads({ edition }: { edition: ManifestEntry }) {
  useHydrateSettings()
  const paper = useSettingsStore((state) => state.paper)
  const set = useSettingsStore((state) => state.set)
  const file = edition.files[paper]

  return (
    <div className="flex flex-col gap-3">
      <Segmented aria-label="용지" className="self-start" options={PAPER_OPTIONS} value={paper} onValueChange={(value) => set({ paper: value })} />
      <a href={file.path} download className="self-start rounded-full bg-ink px-4 py-2 text-sm text-canvas no-underline">
        {DOWNLOADS_COPY.all(edition.kind === "monthly" ? "monthly" : "single")}
        <span className="ml-1.5 text-xs opacity-70">{megabytes(file.bytes)}</span>
      </a>
    </div>
  )
}
