"use client"

import {
  isBabyFruitSeasonal,
  type BabyFruit,
} from "@workspace/seasonal/data/infant-fruits"

import { FRUIT_GUIDE_ART } from "../data"
import { IngredientArt } from "../ingredient-art"
import { firstStageLabel, SAFETY_BADGES } from "./fruit-badges"

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
  const badge = SAFETY_BADGES[fruit.safetyStatus]

  return (
    <button
      type="button"
      className="fruit-card"
      onClick={() => onSelect(fruit)}
      aria-haspopup="dialog"
    >
      <div className="fruit-card-badges">
        <span className="fruit-badge" data-tone={badge.tone}>
          {badge.label}
        </span>
        {isSeasonal && (
          <span className="fruit-badge" data-tone="season">
            이달 제철
          </span>
        )}
      </div>

      <div className="fruit-card-art">
        <IngredientArt name={fruit.name} src={FRUIT_GUIDE_ART[fruit.id]} />
      </div>

      <div className="fruit-card-info">
        <h3 className="fruit-card-name">{fruit.name}</h3>
        <p className="fruit-card-stage">{firstStageLabel(fruit)}</p>
        <p className="fruit-card-prep">{fruit.prepMethod}</p>
      </div>
    </button>
  )
}
