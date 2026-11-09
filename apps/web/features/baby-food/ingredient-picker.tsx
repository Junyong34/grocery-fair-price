"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Input } from "@workspace/ui/components/input"

import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"

import { routes } from "@/shared/routes"
import { SubHeader } from "@/shared/shell/sub-header"

import { PAIRING_CATEGORIES, PAIRINGS } from "./data"
import { IngredientArt } from "./pairing-grid"

export function IngredientPicker({
  selected,
}: {
  selected: readonly string[]
}) {
  const router = useRouter()
  const [names, setNames] = useState(selected)
  const [query, setQuery] = useState("")
  const [category, setCategory] =
    useState<(typeof PAIRING_CATEGORIES)[number]>("전체")
  const search = query.trim()
  const keyword = search === "달걀" ? "계란" : search
  const visible = PAIRINGS.filter(
    (row) =>
      (category === "전체" || row.category === category) &&
      row.name.includes(keyword)
  )

  function toggle(name: string) {
    setNames((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    )
  }

  return (
    <div className="pairing-page">
      <SubHeader title="이유식 재료 선택" fallbackHref={routes.babyFood.pairings} />
      <div className="pairing-intro">
        <h1>오늘은 어떤 큐브를 함께 줄까요?</h1>
        <Link className="pairing-pill" href={routes.babyFood.pairings}>
          전체 궁합표 보기
        </Link>
      </div>
      <p className="pairing-lead">{INFANT_PAIRING_COPY.picker}</p>
      <form
        className="pairing-picker"
        onSubmit={(event) => {
          event.preventDefault()
          if (names.length)
            router.push(
              routes.babyFood.withSelection(routes.babyFood.result, names)
            )
        }}
      >
        <aside className="pairing-selection">
          <h2 className="font-heading text-xl">
            함께 쓸 재료 <span aria-live="polite">{names.length}개</span>
          </h2>
          <div className="pairing-controls">
            {names.map((name) => (
              <button
                key={name}
                type="button"
                className="pairing-pill"
                aria-label={`${name} 선택 해제`}
                onClick={() => toggle(name)}
              >
                {name} ×
              </button>
            ))}
          </div>
          <button
            className="pairing-pill pairing-primary"
            type="submit"
            disabled={!names.length}
          >
            선택한 궁합표 보기 →
          </button>
        </aside>
        <div className="min-w-0">
          <Input
            variant="cream"
            className="text-base bg-pair-light text-pair-light-foreground [--input:var(--color-pair-light)] [--v-canvas:var(--color-pair-light)]"
            type="search"
            placeholder="재료 이름으로 찾아보세요"
            aria-label="재료 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="pairing-controls my-4" aria-label="재료 카테고리">
            {PAIRING_CATEGORIES.map((item) => (
              <button
                key={item}
                className="pairing-pill"
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="pairing-options">
            {visible.map(({ name }) => (
              <button
                key={name}
                type="button"
                className="pairing-option"
                aria-pressed={names.includes(name)}
                onClick={() => toggle(name)}
              >
                <IngredientArt name={name} />
                {name}
              </button>
            ))}
          </div>
          {visible.length === 0 && (
            <p role="status" className="text-caption">
              해당 재료가 없어요. 이름이나 카테고리를 바꿔 보세요.
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
