"use client"

import { useState } from "react"

import { Input } from "@workspace/ui/components/input"

import { PAIRING_CATEGORIES, type PairingRow } from "@workspace/seasonal/data/infant-pairings"

import { PairingGrid } from "./pairing-grid"

export function CatalogFilter({ rows }: { rows: readonly PairingRow[] }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] =
    useState<(typeof PAIRING_CATEGORIES)[number]>("전체")
  const search = query.trim()
  const keyword = search === "달걀" ? "계란" : search
  const visible = rows.filter(
    (row) =>
      (category === "전체" || row.category === category) &&
      row.name.includes(keyword)
  )
  return (
    <>
      <Input
        variant="cream"
        className="text-base bg-pair-light text-pair-light-foreground [--input:var(--color-pair-light)] [--v-canvas:var(--color-pair-light)]"
        type="search"
        aria-label="재료 이름으로 찾기"
        placeholder="예: 당근"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
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
      {visible.length === 0 ? (
        <p role="status" className="text-caption">
          {search ? `‘${search}’에 맞는 재료가 없어요. ` : "이 종류에는 재료가 없어요. "}
          이름을 줄이거나 ‘전체’를 눌러 보세요.
        </p>
      ) : (
        <PairingGrid rows={visible} linkTitles />
      )}
    </>
  )
}
