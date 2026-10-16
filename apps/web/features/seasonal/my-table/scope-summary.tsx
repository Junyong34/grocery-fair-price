"use client"

import { SEASON_COPY, UI_COPY } from "@workspace/seasonal/data/copy"
import {
  monthTallies,
  seasonTallies,
  type Scope,
  type Tally,
} from "@workspace/seasonal/data/eaten-stats"
import { MONTHS, type Month } from "@workspace/seasonal/data/months"
import {
  SEASONS,
  seasonOfMonth,
  type Season,
} from "@workspace/seasonal/data/seasons"
import { AnimatedNumber } from "@workspace/ui/components/animated-number"
import { cn } from "@workspace/ui/lib/utils"

import {
  SEASON_ICON,
  SEASON_TEXT_CLASS,
} from "@/features/seasonal/components/season-tag"

export type FilterMode = "month" | "season"

/** 계절 막대·진행률 채움색. */
const SEASON_FILL: Record<Season, string> = {
  spring: "bg-season-spring",
  summer: "bg-season-summer",
  autumn: "bg-season-autumn",
  winter: "bg-season-winter",
}

/**
 * 계절을 고르면 요약 판 오른쪽 위에 그 계절색 빛이 번진다.
 * 판 전체를 물들이면 canvas와 구분이 사라져서(가을 gold가 특히) 판은 흰 바탕을 지킨다.
 */
const SEASON_GLOW: Record<Season, string> = {
  spring: "[--glow:var(--color-season-spring)]",
  summer: "[--glow:var(--color-season-summer)]",
  autumn: "[--glow:var(--color-season-autumn)]",
  winter: "[--glow:var(--color-season-winter)]",
}

const MOTION = "transition-[width,height,opacity,background-color] duration-400 ease-out motion-reduce:transition-none"

/** 범위 이름. 전체면 null, 달이면 "10월", 계절이면 "가을". */
export function scopeName(scope: Scope): string | null {
  if (scope === null) return null
  return typeof scope === "number" ? `${scope}월` : SEASON_COPY[scope].name
}

/** 범위 진행률 채움색. 계절이면 계절색, 아니면 gold. */
export function scopeFill(scope: Scope): string {
  return typeof scope === "string" ? SEASON_FILL[scope] : "bg-gold"
}

/** 얇은 진행률 막대. */
export function Meter({
  tally,
  fill,
  className,
}: {
  tally: Tally
  fill: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "block h-[5px] overflow-hidden rounded-full bg-hairline",
        className
      )}
    >
      <span
        className={cn("block h-full rounded-full", fill, MOTION)}
        style={{ width: `${tally.total ? (tally.eaten / tally.total) * 100 : 0}%` }}
      />
    </span>
  )
}

/**
 * 나의 식탁 요약. 지금 고른 범위(전체·달·계절)의 숫자와 진행률을 크게 보이고,
 * 아래 차트는 필터 방식(월별 12칸, 계절별 4칸)을 따른다. 차트 칸을 누르면 그 범위로 목록을 거른다.
 */
export function ScopeSummary({
  ref,
  year,
  thisMonth,
  mode,
  scope,
  scopeTally,
  yearTally,
  eaten,
  onScope,
}: {
  ref: React.Ref<HTMLParagraphElement>
  year: number
  thisMonth: number
  mode: FilterMode
  scope: Scope
  scopeTally: Tally
  yearTally: Tally
  eaten: ReadonlySet<string>
  onScope: (scope: Scope) => void
}) {
  const name = scopeName(scope)
  return (
    <aside
      aria-label="올해 기록 요약"
      className="relative isolate flex flex-col overflow-hidden rounded-2xl bg-surface p-5 shadow-[0_1px_2px_color-mix(in_oklab,var(--color-espresso)_8%,transparent)] lg:sticky lg:top-20 lg:self-start lg:p-6"
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_100%_0%,color-mix(in_oklab,var(--glow)_16%,transparent),transparent_70%)] transition-opacity duration-500 motion-reduce:transition-none",
          typeof scope === "string" ? cn(SEASON_GLOW[scope], "opacity-100") : "opacity-0"
        )}
      />
      <div className="flex min-h-6 items-center justify-between gap-2 text-sm text-stone">
        <span>나의 식탁 · {year}</span>
        {scope !== null && (
          <button
            type="button"
            onClick={() => onScope(null)}
            className="rounded-sm text-xs text-caption tabular-nums underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-gold"
          >
            올해 전체 {yearTally.eaten}/{yearTally.total} 보기
          </button>
        )}
      </div>

      <p
        key={name}
        className="mt-4 flex items-center gap-1.5 font-heading text-[17px] font-bold text-ink motion-safe:animate-fade-in"
      >
        {typeof scope === "string" && (
          <SeasonIcon season={scope} />
        )}
        {UI_COPY.scopeTitle(name)}
      </p>
      <p ref={ref} className="mt-1 flex items-baseline gap-1.5">
        <AnimatedNumber
          value={scopeTally.eaten}
          // 올라가는 동안에도 정수만 보인다(기본 형식은 소수 셋째 자리까지 그려 폭이 흔들린다).
          format={{ maximumFractionDigits: 0 }}
          className="font-number text-[60px] leading-none tabular-nums lg:text-[76px]"
        />
        <span className="font-number text-xl text-caption tabular-nums">
          / {scopeTally.total}
        </span>
      </p>
      <p className="mt-2 text-sm text-stone">
        {UI_COPY.scopeProgress(scopeTally.eaten, scopeTally.total)}
      </p>
      <div
        role="progressbar"
        aria-label={`${name ?? "올해"} 먹은 제철 비율`}
        aria-valuemin={0}
        aria-valuemax={scopeTally.total}
        aria-valuenow={scopeTally.eaten}
        className="mt-3"
      >
        <Meter tally={scopeTally} fill={scopeFill(scope)} />
      </div>

      <div key={mode} className="mt-6 motion-safe:animate-fade-in">
        {mode === "month" ? (
          <MonthChart
            thisMonth={thisMonth}
            selected={typeof scope === "number" ? scope : null}
            eaten={eaten}
            onSelect={onScope}
          />
        ) : (
          <SeasonChart
            thisSeason={seasonOfMonth(thisMonth)}
            selected={typeof scope === "string" ? scope : null}
            eaten={eaten}
            onSelect={onScope}
          />
        )}
      </div>
    </aside>
  )
}

function SeasonIcon({ season, size = 15 }: { season: Season; size?: number }) {
  const Icon = SEASON_ICON[season]
  return (
    <Icon
      aria-hidden
      size={size}
      strokeWidth={2}
      className={SEASON_TEXT_CLASS[season]}
    />
  )
}

/**
 * 월별 막대 12개. 막대 전체 높이는 그 달의 제철 품종 수(가장 많은 달이 가득),
 * 안쪽 채움은 그 가운데 먹은 수다. 누르면 그 달로 거르고, 고른 달을 다시 누르면 전체로 돌아간다.
 */
function MonthChart({
  thisMonth,
  selected,
  eaten,
  onSelect,
}: {
  thisMonth: number
  selected: Month | null
  eaten: ReadonlySet<string>
  onSelect: (scope: Scope) => void
}) {
  const tallies = monthTallies(eaten)
  const max = Math.max(...tallies.map((t) => t.total))
  return (
    <div>
      <div role="group" aria-label="달마다 먹은 제철 수" className="grid grid-cols-12 gap-1">
        {MONTHS.map((month, i) => {
          const t = tallies[i]!
          const on = selected === month
          const dim = selected !== null && !on
          return (
            <button
              key={month}
              type="button"
              aria-pressed={on}
              aria-label={`${month}월 제철 ${t.total}가지 중 ${t.eaten}가지 먹음`}
              onClick={() => onSelect(on ? null : month)}
              className="group flex flex-col items-center gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <span className="flex h-[72px] w-full items-end lg:h-[88px]">
                <span
                  className={cn(
                    "relative w-full overflow-hidden rounded-t-[3px]",
                    MOTION,
                    on ? "bg-gold-pale/45" : "bg-hairline group-hover:bg-silver/70",
                    dim && "opacity-40"
                  )}
                  style={{ height: `${Math.max(8, (t.total / max) * 100)}%` }}
                >
                  <span
                    className={cn(
                      "absolute inset-x-0 bottom-0",
                      MOTION,
                      on ? "bg-gold" : "bg-gold-soft"
                    )}
                    style={{ height: `${t.total ? (t.eaten / t.total) * 100 : 0}%` }}
                  />
                </span>
              </span>
              <span
                className={cn(
                  "text-[11px] leading-none text-caption tabular-nums transition-colors",
                  (on || month === thisMonth) && "font-semibold text-ink"
                )}
              >
                {month}
              </span>
              <span
                aria-hidden
                className={cn(
                  "size-1 rounded-full",
                  month === thisMonth ? "bg-ink" : "bg-transparent"
                )}
              />
            </button>
          )
        })}
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-caption">
        <Legend swatch="bg-gold-soft">먹음</Legend>
        <Legend swatch="bg-hairline">그 달 제철</Legend>
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className="size-1 rounded-full bg-ink" />
          이번 달
        </span>
      </p>
    </div>
  )
}

function Legend({
  swatch,
  children,
}: {
  swatch: string
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden className={cn("size-2 rounded-[2px]", swatch)} />
      {children}
    </span>
  )
}

/** 계절 4칸. 칸마다 아이콘·이름, 먹은 수 / 제철 수, 계절색 진행률. 누르면 그 계절로 거른다. */
function SeasonChart({
  thisSeason,
  selected,
  eaten,
  onSelect,
}: {
  thisSeason: Season
  selected: Season | null
  eaten: ReadonlySet<string>
  onSelect: (scope: Scope) => void
}) {
  const tallies = seasonTallies(eaten)
  return (
    <div role="group" aria-label="계절마다 먹은 제철 수" className="grid grid-cols-2 gap-2 min-[560px]:grid-cols-4 lg:grid-cols-2">
      {SEASONS.map((season) => {
        const t = tallies[season]
        const on = selected === season
        return (
          <button
            key={season}
            type="button"
            aria-pressed={on}
            aria-label={`${SEASON_COPY[season].name} 제철 ${t.total}가지 중 ${t.eaten}가지 먹음`}
            onClick={() => onSelect(on ? null : season)}
            className={cn(
              "flex flex-col gap-2 rounded-xl border p-3 text-left transition-[background-color,border-color,opacity,transform] duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold motion-reduce:transition-none",
              on
                ? "border-current/0 bg-surface shadow-[0_1px_3px_color-mix(in_oklab,var(--color-espresso)_12%,transparent)]"
                : "border-hairline bg-canvas/50 hover:bg-canvas",
              selected !== null && !on && "opacity-55"
            )}
          >
            <span className="flex items-center justify-between gap-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold",
                  SEASON_TEXT_CLASS[season]
                )}
              >
                <SeasonIcon season={season} size={13} />
                {SEASON_COPY[season].name}
              </span>
              {season === thisSeason && (
                <span className="text-[10px] text-caption">지금</span>
              )}
            </span>
            <span className="font-number text-2xl leading-none tabular-nums">
              {t.eaten}
              <span className="text-sm text-caption"> / {t.total}</span>
            </span>
            <Meter tally={t} fill={SEASON_FILL[season]} className="h-1" />
          </button>
        )
      })}
    </div>
  )
}
