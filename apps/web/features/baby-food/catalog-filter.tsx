"use client"

import { useState } from "react"

import { Input } from "@workspace/ui/components/input"

import { PAIRING_CATEGORIES, type PairingRow } from "./data"
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
        aria-label="전체 표 기준 재료 찾기"
        placeholder="표에서 기준 재료 찾기 · 예: 당근"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="pairing-controls my-4" aria-label="전체 표 카테고리">
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
          해당 재료가 없어요. 이름이나 카테고리를 바꿔 보세요.
        </p>
      ) : (
        <PairingGrid rows={visible} />
      )}
    </>
  )
}
