"use client"

import { useState, useTransition } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"

import { CATEGORIES, FIELD, lines, MonthPicker } from "../components/month-picker"
import { CARD, Publish } from "../components/publish"
import type { FoodRow } from "../server/foods"
import { saveFood } from "../server/use-actions"

type Props = { rows: readonly FoodRow[]; /** 그림 원본이 없는 기기에서는 null. 그림 ID를 직접 적는다. */ artIds: readonly string[] | null }
type SeasonFilter = "all" | "verified" | "unverified"

const SEASON_LABEL = { verified: "제철 검증", unverified: "제철 미검증" } as const

// 품종 목록(왼쪽)과 고른 품종의 편집 폼(오른쪽). 저장은 품종 원본 파일만 고치고, 화면에는 "웹에 반영" 뒤에 나온다.
export function FoodBoard({ rows, artIds }: Props) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [season, setSeason] = useState<SeasonFilter>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const needle = query.trim().toLowerCase()
  const shown = rows.filter(
    (food) =>
      (!category || food.category === category) &&
      (season === "all" || food.season === season) &&
      (!needle || food.name.toLowerCase().includes(needle) || food.id.includes(needle) || food.aliases.some((alias) => alias.toLowerCase().includes(needle))),
  )
  const selected = rows.find((food) => food.id === selectedId) ?? shown[0]

  return (
    <section className="flex flex-col gap-6">
      <Publish />

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="제철 검증 상태" className="flex gap-1.5">
          {(["all", "verified", "unverified"] as const).map((value) => (
            <Button key={value} size="sm" variant={season === value ? "default" : "outline"} aria-pressed={season === value} onClick={() => setSeason(value)}>
              {value === "all" ? "전체" : SEASON_LABEL[value]} {value === "all" ? rows.length : rows.filter((food) => food.season === value).length}
            </Button>
          ))}
        </div>
        <NativeSelect aria-label="카테고리" value={category} onChange={(event) => setCategory(event.target.value)} className="w-36">
          <NativeSelectOption value="">모든 카테고리</NativeSelectOption>
          {CATEGORIES.map((item) => (
            <NativeSelectOption key={item} value={item}>
              {item}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <label className="ml-auto flex items-center gap-2 text-sm text-stone">
          찾기
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 별칭, 품종 ID" autoComplete="off" className="w-56" />
        </label>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_28rem]">
        {shown.length === 0 ? (
          <p className="text-sm text-stone">조건에 맞는 품종이 없어요.</p>
        ) : (
          <ul className={`${CARD} flex max-h-[calc(100dvh-14rem)] flex-col divide-y divide-hairline overflow-y-auto`}>
            {shown.map((food) => (
              <li key={food.id}>
                <button
                  type="button"
                  aria-pressed={food.id === selected?.id}
                  onClick={() => setSelectedId(food.id)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_5rem_minmax(0,9rem)_5.5rem] items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-mat aria-pressed:bg-gold-wash"
                >
                  <span className="truncate">
                    <span className="font-semibold">{food.name}</span> <code className="text-xs text-stone">{food.id}</code>
                  </span>
                  <span className="text-stone">{food.category}</span>
                  <span className="truncate text-stone tabular-nums">{food.months.length ? `${food.months.join(" · ")}월` : "달 없음"}</span>
                  <span className={food.season === "verified" ? "text-stone" : "font-semibold text-espresso"}>{SEASON_LABEL[food.season]}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {selected && <FoodForm key={selected.id} food={selected} artIds={artIds} />}
      </div>
    </section>
  )
}

function FoodForm({ food, artIds }: { food: FoodRow; artIds: Props["artIds"] }) {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null)
  const [name, setName] = useState(food.name)
  const [aliases, setAliases] = useState(food.aliases.join(", "))
  const [category, setCategory] = useState(food.category)
  const [months, setMonths] = useState<number[]>([...food.months])
  const [peak, setPeak] = useState<number[]>([...food.peak])
  const [season, setSeason] = useState(food.season)
  const [art, setArt] = useState(food.art ?? food.id)
  const [sources, setSources] = useState("")
  const [checkedAt, setCheckedAt] = useState("")
  const [reason, setReason] = useState("")

  const shownPeak = peak.filter((month) => months.includes(month))
  const monthsChanged = months.join() !== food.months.join() || shownPeak.join() !== food.peak.join()
  const needsEvidence = monthsChanged || (season === "verified" && food.season !== "verified")
  const hasEvidence = lines(sources).length > 0 && checkedAt !== ""

  return (
    <form
      className={`${CARD} sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col gap-4 overflow-y-auto p-5`}
      onSubmit={(event) => {
        event.preventDefault()
        start(async () => {
          const result = await saveFood(food.id, { name, aliases: lines(aliases), category, months, peak: shownPeak, season, art, newSources: lines(sources), checkedAt, reason })
          setMessage(result.ok ? { tone: "ok", text: result.message } : { tone: "error", text: result.error })
          // 저장한 근거는 위의 근거 목록에 나오므로 입력 칸을 비운다.
          if (result.ok) {
            setSources("")
            setCheckedAt("")
            setReason("")
          }
        })
      }}
    >
      <header className="flex flex-col gap-1">
        <h2 className="font-heading text-2xl font-bold">{food.name}</h2>
        <p className="text-sm text-stone">
          품종 ID <code>{food.id}</code> (바꿀 수 없어요)
        </p>
      </header>

      <label className={FIELD}>
        <span className="text-stone">표시명</span>
        <Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="off" required />
      </label>
      <label className={FIELD}>
        <span className="text-stone">별칭 (쉼표로 구분, 검색에 써요)</span>
        <Input value={aliases} onChange={(event) => setAliases(event.target.value)} autoComplete="off" />
      </label>
      <label className={FIELD}>
        <span className="text-stone">카테고리</span>
        <NativeSelect value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>
          {CATEGORIES.map((item) => (
            <NativeSelectOption key={item} value={item}>
              {item}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </label>
      <label className={FIELD}>
        <span className="text-stone">제철 검증 상태</span>
        <NativeSelect value={season} onChange={(event) => setSeason(event.target.value as typeof season)}>
          <NativeSelectOption value="verified">제철 검증 (제철달력에 나와요)</NativeSelectOption>
          <NativeSelectOption value="unverified">제철 미검증 (제철달력에서 빠져요)</NativeSelectOption>
        </NativeSelect>
      </label>
      <MonthPicker label="제철 달" value={months} onChange={setMonths} />
      <MonthPicker label="대표 달" value={shownPeak} allowed={months} onChange={setPeak} />
      <label className={FIELD}>
        <span className="text-stone">연결된 그림 (그림 ID)</span>
        {artIds ? (
          <NativeSelect value={art} onChange={(event) => setArt(event.target.value)}>
            {!artIds.includes(art) && <NativeSelectOption value={art}>{art} (그림 원본 없음)</NativeSelectOption>}
            {artIds.map((id) => (
              <NativeSelectOption key={id} value={id}>
                {id}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        ) : (
          <Input value={art} onChange={(event) => setArt(event.target.value)} autoComplete="off" />
        )}
      </label>

      <section className="flex flex-col gap-3 rounded-xl bg-canvas p-3">
        <h3 className="text-sm font-semibold">근거</h3>
        <dl className="grid gap-1 text-xs text-stone">
          {food.evidence.sources.length === 0 && <dd>적어 둔 출처가 없어요.</dd>}
          {food.evidence.sources.map((source) => (
            <dd key={source} className="break-all">
              {source}
            </dd>
          ))}
          {food.evidence.checkedAt && <dd>확인일 {food.evidence.checkedAt}</dd>}
          {food.evidence.reason && <dd>사유: {food.evidence.reason}</dd>}
          {food.evidence.market && <dd>시기 요약: {food.evidence.market}</dd>}
          {food.evidence.note && <dd>단서: {food.evidence.note}</dd>}
        </dl>
        <label className={FIELD}>
          <span className="text-stone">더할 출처 (한 줄에 하나. 이전 출처는 남아요)</span>
          <textarea value={sources} onChange={(event) => setSources(event.target.value)} rows={2} className="rounded-lg bg-surface p-2 text-sm shadow-[inset_0_0_0_1px_var(--color-hairline)]" />
        </label>
        <label className={FIELD}>
          <span className="text-stone">확인일</span>
          <Input type="date" value={checkedAt} onChange={(event) => setCheckedAt(event.target.value)} />
        </label>
        <label className={FIELD}>
          <span className="text-stone">사유 (달을 그렇게 정한 까닭. 비우면 이전 사유를 둬요)</span>
          <Input value={reason} onChange={(event) => setReason(event.target.value)} autoComplete="off" />
        </label>
        {needsEvidence && !hasEvidence && (
          <p className="rounded-lg bg-gold-wash px-3 py-2 text-xs text-espresso">
            {monthsChanged ? "제철 달이나 대표 달을 바꿨어요." : "제철 검증으로 올리려고 해요."} 출처와 확인일을 적어야 저장할 수 있어요.
          </p>
        )}
      </section>

      <Button type="submit" disabled={pending || (needsEvidence && !hasEvidence)}>
        저장
      </Button>
      <p role="status" aria-live="polite" className={message?.tone === "error" ? "text-sm text-error" : "text-sm text-stone"}>
        {message?.text}
      </p>
    </form>
  )
}
