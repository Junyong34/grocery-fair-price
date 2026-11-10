"use client"

import { useSelectedLayoutSegment } from "next/navigation"
import { useState, type ReactNode } from "react"

import {
  BABY_FRUIT_STAGES,
  getFruitsByStage,
  isStageValid,
  type BabyFruit,
} from "@workspace/seasonal/data/infant-fruits"

import { routes } from "@/shared/routes"
import { ShareButton } from "@/shared/share-button"
import { SubHeader } from "@/shared/shell/sub-header"

import { SAFETY_BADGES } from "./fruit-badges"
import { FruitCard } from "./fruit-card"
import { FruitDetailSheet } from "./fruit-detail-sheet"
import { SafetyGuideSection } from "./safety-guide-section"
import { StageTabs } from "./stage-tabs"
import { StageWarningBanner } from "./stage-warning-banner"

import "./fruits.css"

/**
 * fruits/layout.tsx가 그리는 도감. 월령은 주소의 세그먼트(/baby-food/fruits/<월령>)에서 읽는다.
 * 레이아웃에 있어 월령을 바꿔도 다시 마운트되지 않고, 이미 가진 데이터로 목록만 바꿔 그린다.
 */
export function FruitsDashboard({
  currentMonth,
  download,
}: {
  currentMonth?: number
  /** 이 도감의 PDF 내려받기 카드. 서버에서 매니페스트를 읽어 넘긴다. */
  download?: ReactNode
}) {
  const segment = useSelectedLayoutSegment()
  const [selectedFruit, setSelectedFruit] = useState<BabyFruit | null>(null)

  // 없는 월령이나 옛 주소는 페이지가 notFound·redirect로 처리하므로 도감은 그리지 않는다.
  if (segment !== null && !isStageValid(segment)) return null
  const stageId = segment ?? undefined

  const fruits = getFruitsByStage(stageId ?? "all")
  const currentStageInfo = stageId
    ? BABY_FRUIT_STAGES.find((s) => s.id === stageId)
    : undefined

  return (
    <div className="fruits-page">
      <SubHeader
        title="월령별 과일 도감"
        fallbackHref={routes.babyFood.pairings}
        revealAfter="fruits-title"
        actions={<ShareButton />}
      />

      <header className="fruits-header">
        <h1 id="fruits-title">
          {currentStageInfo
            ? `${currentStageInfo.name} 아기 과일`
            : "월령별 아기 과일 도감"}
        </h1>
        <p className="fruits-lead">
          {currentStageInfo
            ? `${currentStageInfo.subTitle} · ${currentStageInfo.summary}`
            : "언제부터 어떤 과일을 줄 수 있는지 월령별로 모았어요. 과일을 누르면 손질법과 질식 예방법을 볼 수 있어요."}
        </p>
      </header>

      {download && <div className="fruits-download">{download}</div>}

      <StageTabs activeStage={stageId ?? "all"} />

      <StageWarningBanner stageId={stageId ?? "all"} />

      <section className="fruits-grid-section" aria-labelledby="fruits-grid-title">
        <div className="fruits-grid-heading">
          <h2 id="fruits-grid-title">
            {currentStageInfo
              ? `${currentStageInfo.name}에 줄 수 있는 과일`
              : "모든 과일"}
          </h2>
          <span>{fruits.length}가지</span>
        </div>
        <ul className="fruits-legend" aria-label="표시 뜻">
          {Object.values(SAFETY_BADGES).map((badge) => (
            <li key={badge.tone}>
              <span className="fruit-badge" data-tone={badge.tone}>
                {badge.label}
              </span>
              {badge.legend}
            </li>
          ))}
        </ul>

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

      <FruitDetailSheet
        fruit={selectedFruit}
        currentMonth={currentMonth}
        onClose={() => setSelectedFruit(null)}
      />

      <SafetyGuideSection />
    </div>
  )
}
