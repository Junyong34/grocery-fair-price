"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Input } from "@workspace/ui/components/input"

import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"
import { PAIRING_CATEGORIES, PAIRINGS } from "@workspace/seasonal/data/infant-pairings"

import { routes } from "@/shared/routes"
import { SubHeader } from "@/shared/shell/sub-header"

import { IngredientArt } from "./ingredient-art"

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
        <Link className="pairing-pill pairing-secondary" href={routes.babyFood.pairings}>
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
          {names.length === 0 && (
            <p className="text-sm text-caption">재료를 누르면 여기에 담겨요.</p>
          )}
          <div className="pairing-controls">
            {names.map((name) => (
              <button
                key={name}
                type="button"
                className="pairing-pill pairing-chosen"
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
            고른 재료 궁합 보기
          </button>
        </aside>
        <div className="min-w-0">
          <Input
            variant="cream"
            className="text-base bg-pair-light text-pair-light-foreground [--input:var(--color-pair-light)] [--v-canvas:var(--color-pair-light)]"
            type="search"
            placeholder="예: 당근"
            aria-label="재료 이름으로 찾기"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="pairing-controls my-4" role="group" aria-label="재료 종류">
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
              {search ? `‘${search}’에 맞는 재료가 없어요. ` : "이 종류에는 재료가 없어요. "}
              이름을 줄이거나 ‘전체’를 눌러 보세요.
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
