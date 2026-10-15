import { Leaf, Snowflake, Sprout, Sun } from "lucide-react"

import { SEASON_COPY } from "@workspace/seasonal/data/copy"
import { MONTHS } from "@workspace/seasonal/data/months"
import {
  SEASONS,
  SEASON_MONTHS,
  type Season,
} from "@workspace/seasonal/data/seasons"
import { cn } from "@workspace/ui/lib/utils"

export const metadata = { title: "계절 태그 비교" }

// 품종 상세 제목 옆 계절 태그(봄·여름·가을·겨울) 후보. 딸기(12~4월: 봄·겨울)와 밤(9·10월: 가을)으로 본다.
const SAMPLES = [
  { name: "딸기", months: [12, 1, 2, 3, 4] },
  { name: "밤", months: [9, 10] },
] as const

const COLOR: Record<Season, string> = {
  spring: "var(--color-season-spring)",
  summer: "var(--color-season-summer)",
  autumn: "var(--color-season-autumn)",
  winter: "var(--color-season-winter)",
}
const ICON = {
  spring: Sprout,
  summer: Sun,
  autumn: Leaf,
  winter: Snowflake,
} as const

const seasonsOf = (months: readonly number[]) =>
  SEASONS.filter((season) =>
    months.some((month) => SEASON_MONTHS[season].includes(month))
  )

const VARIANTS = [
  {
    id: "now",
    name: "지금",
    note: "검은 테두리 네모 + 아래 3px 계절색 띠. 서류 칸처럼 딱딱하다.",
  },
  {
    id: "tint",
    name: "A. 계절색 옅은 알약",
    note: "계절색 12% 바탕에 계절색 점과 글자. 테두리 없이 부드럽게.",
  },
  {
    id: "icon",
    name: "B. 아이콘 + 계절색 글자 (적용)",
    note: "새싹·해·잎·눈송이 아이콘. 글만 읽지 않아도 계절이 보인다.",
  },
  {
    id: "bar",
    name: "C. 달 막대에 합치기",
    note: "태그를 없애고 12달 막대 아래 계절 구간 이름을 둔다. 제철 달이 든 계절만 진하게.",
  },
] as const

export default function Page() {
  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-8 p-6">
      <h1 className="font-heading text-3xl">계절 태그 비교</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {VARIANTS.map((variant) => (
          <section
            key={variant.id}
            className="flex flex-col gap-4 rounded-lg border border-hairline p-5"
          >
            <div>
              <h2 className="font-semibold">{variant.name}</h2>
              <p className="text-sm text-stone">{variant.note}</p>
            </div>
            {SAMPLES.map((sample) => (
              <div
                key={sample.name}
                className="flex flex-col gap-3 border-t border-hairline pt-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-heading text-3xl font-bold">
                    {sample.name}
                  </span>
                  {variant.id !== "bar" &&
                    seasonsOf(sample.months).map((season) => (
                      <Tag key={season} season={season} variant={variant.id} />
                    ))}
                </div>
                <Bar
                  months={sample.months}
                  withSeasons={variant.id === "bar"}
                />
              </div>
            ))}
          </section>
        ))}
      </div>
    </main>
  )
}

function Tag({
  season,
  variant,
}: {
  season: Season
  variant: "now" | "tint" | "icon"
}) {
  const name = SEASON_COPY[season].name
  // 이전 모양(적용 전 SeasonTag)
  if (variant === "now")
    return (
      <span
        className="inline-block rounded-[3px] border border-ink px-2.5 py-[3px] text-xs leading-none tracking-[.1em] text-ink"
        style={{ boxShadow: `inset 0 -3px 0 ${COLOR[season]}` }}
      >
        {name}
      </span>
    )
  if (variant === "tint")
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs leading-none font-semibold"
        style={{
          background: `color-mix(in oklab, ${COLOR[season]} 14%, transparent)`,
          color: COLOR[season],
        }}
      >
        <span
          className="size-1.5 rounded-full"
          style={{ background: COLOR[season] }}
        />
        {name}
      </span>
    )
  const Icon = ICON[season]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs leading-none font-semibold"
      style={{
        color: COLOR[season],
        borderColor: `color-mix(in oklab, ${COLOR[season]} 35%, transparent)`,
      }}
    >
      <Icon aria-hidden size={13} strokeWidth={2} />
      {name}
    </span>
  )
}

/** 상세의 12달 막대. withSeasons면 아래에 계절 구간(겨울은 12·1·2월이라 양 끝으로 나뉜다)을 둔다. */
function Bar({
  months,
  withSeasons,
}: {
  months: readonly number[]
  withSeasons: boolean
}) {
  const inSeason = seasonsOf(months)
  const seasonOfMonth = (month: number) =>
    SEASONS.find((season) => SEASON_MONTHS[season].includes(month))!
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-12 gap-0.5">
        {MONTHS.map((month) => (
          <span
            key={month}
            className={cn(
              "h-1.5 rounded-full",
              months.includes(month) ? "bg-gold" : "bg-hairline"
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-12 text-center text-[10px] text-ash tabular-nums">
        {MONTHS.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
      {withSeasons && (
        <div className="grid grid-cols-12 gap-0.5 text-[11px] font-semibold">
          {MONTHS.map((month) => {
            const season = seasonOfMonth(month)
            const on = inSeason.includes(season)
            // 계절 이름은 그 계절 가운데 달 칸에만 쓴다(겨울은 1월).
            const middle = SEASON_MONTHS[season][1] === month
            return (
              <span
                key={month}
                className="border-t-2 pt-1 text-center"
                style={{
                  borderColor: on ? COLOR[season] : "var(--color-hairline)",
                  color: on ? COLOR[season] : "var(--color-ash)",
                }}
              >
                {middle ? SEASON_COPY[season].name : ""}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
