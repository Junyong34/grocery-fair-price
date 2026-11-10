"use client"

import Link from "next/link"

import { BottomSheet } from "@workspace/ui/components/bottom-sheet"
import { PAIRINGS } from "@workspace/seasonal/data/infant-pairings"
import {
  isBabyFruitSeasonal,
  type BabyFruit,
} from "@workspace/seasonal/data/infant-fruits"

import { routes } from "@/shared/routes"
import { FRUIT_GUIDE_ART } from "../data"
import { IngredientArt } from "../ingredient-art"
import { firstStageLabel, SAFETY_BADGES } from "./fruit-badges"

/** 재료 궁합표에 기준 재료로 있는 id. 없는 과일은 궁합 링크를 두지 않는다(404 방지). */
const PAIRING_IDS = new Set(PAIRINGS.map((row) => row.id))

export function FruitDetailSheet({
  fruit,
  currentMonth,
  onClose,
}: {
  fruit: BabyFruit | null
  currentMonth?: number
  onClose: () => void
}) {
  if (!fruit) return null

  const isSeasonal = currentMonth
    ? isBabyFruitSeasonal(fruit, currentMonth)
    : false
  const badge = SAFETY_BADGES[fruit.safetyStatus]
  const foodId = fruit.seasonalFoodId

  return (
    <BottomSheet
      open={Boolean(fruit)}
      onClose={onClose}
      title={
        <div className="fruit-sheet-hero">
          <IngredientArt name={fruit.name} src={FRUIT_GUIDE_ART[fruit.id]} />
          <div className="fruit-sheet-meta">
            <span className="fruit-sheet-title">{fruit.name}</span>
            <div className="fruit-sheet-badges">
              <span className="fruit-badge" data-tone={badge.tone}>
                {badge.label}
              </span>
              {isSeasonal && (
                <span className="fruit-badge" data-tone="season">
                  이달 제철
                </span>
              )}
              <span className="fruit-sheet-stage">{firstStageLabel(fruit)}</span>
            </div>
          </div>
        </div>
      }
    >
      <div className="fruit-sheet-content">
        {fruit.cuttingGuide && fruit.chokingRisk && (
          <section className="fruit-sheet-block" data-tone="danger">
            <h3>질식 예방 손질</h3>
            <p>{fruit.cuttingGuide}</p>
          </section>
        )}

        <section className="fruit-sheet-block">
          <h3>손질과 조리</h3>
          <p>{fruit.prepMethod}</p>
        </section>

        {fruit.cuttingGuide && !fruit.chokingRisk && (
          <section className="fruit-sheet-block">
            <h3>먹일 때 참고</h3>
            <p>{fruit.cuttingGuide}</p>
          </section>
        )}

        {fruit.allergyNote && (
          <section className="fruit-sheet-block">
            <h3>알레르기와 주의</h3>
            <p>{fruit.allergyNote}</p>
          </section>
        )}

        {foodId && (
          <nav className="fruit-sheet-links" aria-label={`${fruit.name} 더 보기`}>
            <Link
              href={routes.seasonal.food(foodId)}
              className="fruit-sheet-link"
              onClick={onClose}
            >
              {fruit.name} 제철 시기 보기
            </Link>
            {PAIRING_IDS.has(foodId) && (
              <Link
                href={routes.babyFood.ingredient(foodId)}
                className="fruit-sheet-link"
                onClick={onClose}
              >
                {fruit.name} 이유식 궁합 보기
              </Link>
            )}
          </nav>
        )}
      </div>
    </BottomSheet>
  )
}
