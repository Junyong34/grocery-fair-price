"use client"

import {
  isBabyFruitSeasonal,
  type BabyFruit,
} from "@workspace/seasonal/data/infant-fruits"

import { FRUIT_GUIDE_ART } from "../data"
import { IngredientArt } from "../ingredient-art"

export function FruitCard({
  fruit,
  currentMonth,
  onSelect,
}: {
  fruit: BabyFruit
  currentMonth?: number
  onSelect: (fruit: BabyFruit) => void
}) {
  const isSeasonal = currentMonth
    ? isBabyFruitSeasonal(fruit, currentMonth)
    : false

  const badgeConfig = {
    safe: { label: "안전 (권장)", className: "badge-safe" },
    conventional: { label: "관행 (참고)", className: "badge-conventional" },
    caution: { label: "주의 (손질필수)", className: "badge-caution" },
  }[fruit.safetyStatus]

  return (
    <button
      type="button"
      className="fruit-card"
      onClick={() => onSelect(fruit)}
      aria-label={`${fruit.name} 이유식 손질법 및 주의사항 보기`}
    >
      <div className="fruit-card-top">
        <span className={`fruit-badge ${badgeConfig.className}`}>
          {badgeConfig.label}
        </span>
        {isSeasonal && (
          <span className="fruit-badge badge-seasonal">🌿 이달 제철</span>
        )}
      </div>

      <div className="fruit-card-art">
        <IngredientArt name={fruit.name} src={FRUIT_GUIDE_ART[fruit.id]} />
      </div>

      <div className="fruit-card-info">
        <h3 className="fruit-card-name">{fruit.name}</h3>
        <p className="fruit-card-prep">{fruit.prepMethod}</p>
        <span className="fruit-card-tag">{fruit.stages[0]?.replace("-months", "개월~") ?? "권장"}</span>
      </div>
    </button>
  )
}
