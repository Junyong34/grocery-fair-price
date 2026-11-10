"use client"

import Link from "next/link"

import { BottomSheet } from "@workspace/ui/components/bottom-sheet"
import {
  isBabyFruitSeasonal,
  type BabyFruit,
} from "@workspace/seasonal/data/infant-fruits"

import { routes } from "@/shared/routes"
import { FRUIT_GUIDE_ART } from "../data"
import { IngredientArt } from "../ingredient-art"

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

  const badgeConfig = {
    safe: { label: "안전 (권장)", className: "badge-safe" },
    conventional: { label: "관행 (참고)", className: "badge-conventional" },
    caution: { label: "주의 (손질필수)", className: "badge-caution" },
  }[fruit.safetyStatus]

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
              <span className={`fruit-badge ${badgeConfig.className}`}>
                {badgeConfig.label}
              </span>
              {isSeasonal && (
                <span className="fruit-badge badge-seasonal">🌿 이번 달 제철</span>
              )}
            </div>
          </div>
        </div>
      }
    >
      <div className="fruit-sheet-content">
        <div className="fruit-sheet-block">
          <h4>🥣 권장 손질 및 조리법</h4>
          <p>{fruit.prepMethod}</p>
        </div>

        {fruit.cuttingGuide && (
          <div
            className={`fruit-sheet-block ${
              fruit.chokingRisk ? "block-alert" : ""
            }`}
          >
            <h4>
              {fruit.chokingRisk
                ? "🚨 질식 예방 커팅 가이드 (필독)"
                : "✂️ 핑거푸드 커팅 가이드"}
            </h4>
            <p>{fruit.cuttingGuide}</p>
          </div>
        )}

        {fruit.allergyNote && (
          <div className="fruit-sheet-block">
            <h4>💡 알레르기 및 주의사항</h4>
            <p>{fruit.allergyNote}</p>
          </div>
        )}

        <div className="fruit-sheet-links">
          {fruit.seasonalFoodId && (
            <>
              <Link
                href={routes.seasonal.food(fruit.seasonalFoodId)}
                className="fruit-sheet-link-btn"
                onClick={onClose}
              >
                <span>🌿 {fruit.name} 제철 달력 보기</span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href={routes.babyFood.ingredient(fruit.seasonalFoodId)}
                className="fruit-sheet-link-btn"
                onClick={onClose}
              >
                <span>🥣 {fruit.name} 이유식 재료 궁합 보기</span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href={routes.price.variety(fruit.seasonalFoodId)}
                className="fruit-sheet-link-btn"
                onClick={onClose}
              >
                <span>🛒 {fruit.name} 마트 장보기 시세 확인</span>
                <span aria-hidden="true">→</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}
