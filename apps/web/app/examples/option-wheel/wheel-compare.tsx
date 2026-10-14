"use client"

import { useState } from "react"

import { OptionWheel, type OptionWheelItem } from "@workspace/ui/components/option-wheel"

import { SEASON_COPY } from "@workspace/seasonal/data/copy"
import { seasonOfMonth } from "@workspace/seasonal/data/seasons"

const LABELS = { heading: "달 이동", listbox: "달 이동", previous: "이전 달", next: "다음 달" }

export function WheelCompare({ counts }: { counts: readonly number[] }) {
  const items: OptionWheelItem[] = [
    { id: "now", label: "지금 · 10월", description: "맨 위 이번 달 장면" },
    ...counts.map((count, i) => ({
      id: String(i + 1),
      label: `${i + 1}월`,
      description: `${SEASON_COPY[seasonOfMonth(i + 1)].name} · ${count}가지`,
    })),
  ]
  const [index, setIndex] = useState(0)
  return (
    <div className="flex flex-wrap gap-10">
      {(["arc", "reel"] as const).map((presentation) => (
        <figure key={presentation} className="flex w-[280px] flex-col gap-2">
          <figcaption className="font-semibold">{presentation}</figcaption>
          <OptionWheel
            items={items}
            selectedIndex={index}
            onSelectionChange={setIndex}
            presentation={presentation}
            labels={LABELS}
          />
        </figure>
      ))}
    </div>
  )
}
