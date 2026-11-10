"use client"

import Link from "next/link"
import { useState } from "react"

import {
  BABY_FRUIT_STAGES,
  getFruitsByStage,
  type BabyFruit,
  type BabyFruitStageId,
} from "@workspace/seasonal/data/infant-fruits"

import { routes } from "@/shared/routes"
import { SubHeader } from "@/shared/shell/sub-header"

import { FruitCard } from "./fruit-card"
import { FruitDetailSheet } from "./fruit-detail-sheet"
import { FruitsNav } from "./fruits-nav"
import { SafetyGuideSection } from "./safety-guide-section"
import { StageTabs } from "./stage-tabs"
import { StageWarningBanner } from "./stage-warning-banner"

import "./fruits.css"

export function FruitsDashboard({
  stageId,
  currentMonth,
}: {
  stageId?: BabyFruitStageId
  currentMonth?: number
}) {
  const [selectedFruit, setSelectedFruit] = useState<BabyFruit | null>(null)

  const isAll = !stageId
  const fruits = getFruitsByStage(stageId ?? "all")
  const currentStageInfo = stageId
    ? BABY_FRUIT_STAGES.find((s) => s.id === stageId)
    : undefined

  return (
    <div className="fruits-page">
      <SubHeader
        title="이유식 과일 시기 도감"
        fallbackHref={routes.babyFood.pairings}
      />

      <FruitsNav current="fruits" />

      <header className="fruits-header">
        <h1>
          {currentStageInfo
            ? `${currentStageInfo.name} (${currentStageInfo.subTitle}) 아기 과일 시기`
            : "월령별 아기 과일 시기 & 주의 식재료 도감"}
        </h1>
        <p className="fruits-lead">
          {currentStageInfo
            ? currentStageInfo.summary
            : "생후 4~6개월 초기 이유식부터 24개월 완료기까지, 소아청소년과 지침에 맞춘 월령별 추천 과일과 질식 예방 손질법, 돌 전 금기 식품을 한눈에 확인하세요."}
        </p>

        <div>
          <Link
            href={routes.admin.babyFoodFruitsPrint}
            className="fruits-print-cta"
            title="냉장고 문에 자석으로 부착하는 A4 1장 요약표"
          >
            <span aria-hidden="true">📄</span>
            <span>냉장고 부착용 A4 요약표 인쇄 (PDF)</span>
          </Link>
        </div>
      </header>

      {/* 월령 탭바 */}
      <StageTabs activeStage={stageId ?? "all"} />

      {/* 동적 위험 경고 배너 */}
      <StageWarningBanner stageId={stageId ?? "all"} />

      {/* 과일 그리드 */}
      <section className="fruits-grid-section" aria-label="월령별 과일 목록">
        <div className="fruits-grid-heading">
          <h2>
            {currentStageInfo
              ? `${currentStageInfo.name}에 추천하는 과일`
              : "전체 월령 과일"}
          </h2>
          <span>총 {fruits.length}가지</span>
        </div>

        <div className="fruits-grid">
          {fruits.map((fruit) => (
            <FruitCard
              key={fruit.id}
              fruit={fruit}
              currentMonth={currentMonth}
              onSelect={setSelectedFruit}
            />
          ))}
        </div>
      </section>

      {/* 바텀시트 상세 가이드 */}
      <FruitDetailSheet
        fruit={selectedFruit}
        currentMonth={currentMonth}
        onClose={() => setSelectedFruit(null)}
      />

      {/* 하단 영유아 시기별 금지 & 주의 식재료 도감 */}
      <SafetyGuideSection />
    </div>
  )
}
