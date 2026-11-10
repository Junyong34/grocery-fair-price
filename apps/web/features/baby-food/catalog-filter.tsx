"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { Input } from "@workspace/ui/components/input"

import {
  PAIRING_CATEGORIES,
  pairingDisplayName,
  type PairingRow,
} from "@workspace/seasonal/data/infant-pairings"
import { matchPairings } from "@workspace/seasonal/search/match-pairings"

import { routes } from "@/shared/routes"

import { PairingGrid } from "./pairing-grid"

type Category = (typeof PAIRING_CATEGORIES)[number]

/** 검색어를 ?q=에 맞춘다. 공유한 주소와 뒤로 가기에서 같은 결과를 본다. */
function syncQuery(query: string) {
  const url = new URL(window.location.href)
  if (query) url.searchParams.set("q", query)
  else url.searchParams.delete("q")
  window.history.replaceState(window.history.state, "", url)
}

export function CatalogFilter({ rows }: { rows: readonly PairingRow[] }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<Category>("전체")

  // 정적 페이지라 주소의 검색어는 마운트 뒤에 읽는다.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q")
    if (initial) setQuery(initial)
  }, [])

  const search = query.trim()
  const { bases, mentions } = matchPairings(rows, search)
  const visible = bases.filter((row) => category === "전체" || row.category === category)
  const hiddenByCategory = bases.length - visible.length

  return (
    <>
      <Input
        variant="cream"
        className="text-base bg-pair-light text-pair-light-foreground [--input:var(--color-pair-light)] [--v-canvas:var(--color-pair-light)]"
        type="search"
        aria-label="재료 이름으로 찾기"
        placeholder="예: 당근, ㄷㄱ, 땅콩"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          syncQuery(event.target.value.trim())
        }}
      />
      <div className="pairing-controls my-4" role="group" aria-label="재료 종류">
        {PAIRING_CATEGORIES.map((item) => (
          <button
            type="button"
            className="pairing-pill"
            key={item}
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <p role="status" className="pairing-search-status">
        {search && visible.length > 0 && `‘${search}’ 기준 재료 ${visible.length}개`}
        {visible.length === 0 &&
          (hiddenByCategory > 0
            ? `‘${search}’는 ${category}에 없어요.`
            : mentions.length === 0 &&
              (search ? `‘${search}’에 맞는 재료가 없어요. 이름을 줄이거나 초성으로 찾아보세요.` : "이 종류에는 재료가 없어요."))}
        {search && hiddenByCategory > 0 && (
          <>
            {" "}
            <button type="button" className="pairing-inline-button" onClick={() => setCategory("전체")}>
              다른 종류에서 {hiddenByCategory}개 더 보기
            </button>
          </>
        )}
      </p>

      {visible.length > 0 && <PairingGrid rows={visible} linkTitles />}

      {mentions.length > 0 && (
        <section className="pairing-search-mentions" aria-labelledby="pairing-search-mentions-title">
          <h2 id="pairing-search-mentions-title">다른 재료 궁합표에 있어요</h2>
          <p className="pairing-note">기준 재료 표는 없지만, 아래 재료의 표에 O나 X로 적혀 있어요.</p>
          {mentions.map(({ item, in: places }) => (
            <div key={item} className="pairing-search-mention">
              <h3>{item}</h3>
              <ul>
                {places.map(({ row, sign }) => (
                  <li key={`${row.id}-${sign}`}>
                    <Link href={routes.babyFood.ingredient(row.id)} className="pairing-mention-link" data-sign={sign}>
                      <span className="pairing-mention-sign" aria-label={sign === "O" ? "잘 맞음" : "주의"}>
                        {sign}
                      </span>
                      {pairingDisplayName(row)} 표
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </>
  )
}
