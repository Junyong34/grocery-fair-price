"use client"

import { useEffect, useState, useTransition } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import { routes } from "@/shared/routes"

import { filterArts, isShown, type ArtFilter, type ArtRow } from "../lib/art-view"
import { readArtNotes, setArtReview } from "../server/art-actions"

type Props = { rows: readonly ArtRow[]; broken: readonly string[]; failed: readonly string[] }

const FILTERS: readonly { value: ArtFilter; label: string }[] = [
  { value: "unreviewed", label: "미검수" },
  { value: "reviewed", label: "검수 완료" },
  { value: "all", label: "전체" },
]

const CARD = "rounded-2xl bg-surface shadow-[inset_0_0_0_1px_var(--color-hairline)]"

// 그림 목록(왼쪽)과 고른 그림의 상세 · 판정(오른쪽). 판정은 그림 폴더의 art.json만 바꾼다.
export function ArtBoard({ rows, broken, failed }: Props) {
  const [filter, setFilter] = useState<ArtFilter>(rows.some((art) => art.review === "unreviewed") ? "unreviewed" : "all")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const shown = filterArts(rows, filter, query)
  const selected = rows.find((art) => art.id === selectedId) ?? shown[0]
  const count = (value: ArtFilter) => (value === "all" ? rows.length : rows.filter((art) => art.review === value).length)

  return (
    <section className="flex flex-col gap-6">
      {broken.length > 0 && (
        <p className="rounded-xl bg-gold-wash px-4 py-3 text-sm text-espresso">art.json을 읽지 못한 그림 {broken.length}개: {broken.join(", ")}</p>
      )}
      {failed.length > 0 && (
        <p className="rounded-xl bg-gold-wash px-4 py-3 text-sm text-espresso">미리보기를 그리지 못한 그림 {failed.length}개: {failed.join(" / ")}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="검수 상태" className="flex gap-1.5">
          {FILTERS.map((item) => (
            <Button key={item.value} size="sm" variant={filter === item.value ? "default" : "outline"} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>
              {item.label} {count(item.value)}
            </Button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm text-stone">
          찾기
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름이나 그림 ID" autoComplete="off" className="w-56" />
        </label>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
        {shown.length === 0 ? (
          <p className="text-sm text-stone">{filter === "unreviewed" && !query ? "미검수 그림이 없어요." : "조건에 맞는 그림이 없어요."}</p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2">
            {shown.map((art) => (
              <li key={art.id}>
                <button
                  type="button"
                  aria-pressed={art.id === selected?.id}
                  onClick={() => setSelectedId(art.id)}
                  className={`${CARD} flex w-full flex-col items-center gap-1 p-2 text-center transition-colors hover:bg-mat aria-pressed:bg-gold-wash`}
                >
                  {/* 어드민 전용 미리보기라 next/image 최적화를 거치지 않는다. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={routes.admin.foodPreview(art.id, "color")} alt="" width={96} height={96} loading="lazy" className="size-24" />
                  <span className="w-full truncate text-sm font-semibold">{art.name}</span>
                  <span className="text-xs text-stone">{art.review === "reviewed" ? "검수 완료" : "미검수"}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {selected && <ArtDetail key={selected.id} art={selected} />}
      </div>
    </section>
  )
}

function ArtDetail({ art }: { art: ArtRow }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    void readArtNotes(art.id).then((text) => live && setNotes(text))
    return () => {
      live = false
    }
  }, [art.id])

  const reviewed = art.review === "reviewed"
  const shown = isShown(art.uses)
  const judge = (review: "reviewed" | "unreviewed") =>
    start(async () => {
      const result = await setArtReview(art.id, review)
      setError(result.ok ? null : result.error)
    })

  return (
    <aside className={`${CARD} sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col gap-4 overflow-y-auto p-5`}>
      <header className="flex flex-col gap-1">
        <h2 className="font-heading text-2xl font-bold">{art.name}</h2>
        <p className="text-sm text-stone">
          그림 ID <code>{art.id}</code> · {reviewed ? `검수 완료${art.reviewedAt ? ` (${art.reviewedAt})` : " (날짜 기록 없음)"}` : "미검수"}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {(["color", "motion"] as const).map((variant) => (
          <figure key={variant} className="flex flex-col items-center gap-1 rounded-xl bg-canvas p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={routes.admin.foodPreview(art.id, variant)} alt={`${art.name} ${variant === "color" ? "정지 그림" : "움직임"}`} className="aspect-square w-full" />
            <figcaption className="text-xs text-stone">{variant === "color" ? "정지 그림" : "움직임"}</figcaption>
          </figure>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {reviewed ? (
          <Button variant="outline" disabled={pending} onClick={() => judge("unreviewed")}>
            미검수로 되돌리기
          </Button>
        ) : (
          <Button disabled={pending} onClick={() => judge("reviewed")}>
            검수 완료
          </Button>
        )}
        {reviewed && shown && <p className="text-xs text-stone">화면이 쓰는 그림이에요. 미검수로 되돌리면 다음 웹 반영(pnpm foods:sync)이 이 그림에서 멈춰요.</p>}
        <p role="status" aria-live="polite" className="text-sm text-error">
          {error}
        </p>
      </div>

      <section className="flex flex-col gap-1.5 text-sm">
        <h3 className="font-semibold">가리키는 화면</h3>
        {art.uses.seasonal.length === 0 && art.uses.infant.length === 0 && <p className="text-stone">아직 어느 화면도 쓰지 않아요. 검수를 마쳐도 웹에는 나가지 않아요.</p>}
        {art.uses.seasonal.map((food) => (
          <p key={food.id}>
            {food.verified ? "제철달력" : "제철 미검증(달력에 안 나옴)"} · {food.name} <code className="text-stone">{food.id}</code>
          </p>
        ))}
        {art.uses.infant.length > 0 && <p>이유식 · {art.uses.infant.join(", ")}</p>}
      </section>

      {art.references.length > 0 && (
        <section className="flex flex-col gap-1.5 text-sm">
          <h3 className="font-semibold">참고 자료</h3>
          <ul className="list-disc pl-5 text-stone">
            {art.references.map((reference) => (
              <li key={reference} className="break-all">
                {reference}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-1.5 text-sm">
        <h3 className="font-semibold">관찰 기록 (NOTES.md)</h3>
        {notes === null ? <p className="text-stone">불러오는 중…</p> : notes ? <pre className="font-sans text-sm whitespace-pre-wrap text-stone">{notes}</pre> : <p className="text-stone">기록이 없어요.</p>}
      </section>
    </aside>
  )
}
