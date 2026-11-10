import Link from "next/link"

import {
  BABY_FRUIT_STAGES,
  type BabyFruitStageId,
} from "@workspace/seasonal/data/infant-fruits"

import { routes } from "@/shared/routes"

export function StageTabs({
  activeStage,
}: {
  activeStage?: BabyFruitStageId | "all"
}) {
  const current = activeStage ?? "all"

  return (
    <div className="fruits-stage-tabs-wrap">
      <div className="fruits-stage-tabs" role="tablist" aria-label="이유식 월령 선택">
        <Link
          href={routes.babyFood.fruits}
          className="fruits-stage-pill"
          data-active={current === "all"}
          role="tab"
          aria-selected={current === "all"}
        >
          <span>전체 보기</span>
          <small>초기~두 돌</small>
        </Link>
        {BABY_FRUIT_STAGES.map((stage) => {
          const isActive = current === stage.id
          return (
            <Link
              key={stage.id}
              href={routes.babyFood.fruitsStage(stage.id)}
              className="fruits-stage-pill"
              data-active={isActive}
              role="tab"
              aria-selected={isActive}
            >
              <span>{stage.name}</span>
              <small>{stage.subTitle}</small>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
