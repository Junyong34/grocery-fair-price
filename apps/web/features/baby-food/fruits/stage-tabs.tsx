import Link from "next/link"

import {
  BABY_FRUIT_STAGES,
  type BabyFruitStageId,
} from "@workspace/seasonal/data/infant-fruits"

import { routes } from "@/shared/routes"

/** 월령 고르기. 주소가 바뀌는 링크라 탭(tablist)이 아니라 내비게이션과 aria-current로 둔다. */
export function StageTabs({
  activeStage,
}: {
  activeStage?: BabyFruitStageId | "all"
}) {
  const current = activeStage ?? "all"
  const items = [
    { id: "all", href: routes.babyFood.fruits, name: "전체", sub: "4개월~돌 이후" },
    ...BABY_FRUIT_STAGES.map((stage) => ({
      id: stage.id,
      href: routes.babyFood.fruitsStage(stage.id),
      name: stage.name,
      sub: stage.subTitle,
    })),
  ]

  return (
    <nav className="fruits-stage-tabs-wrap" aria-label="월령 고르기">
      <div className="fruits-stage-tabs">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="fruits-stage-pill"
            aria-current={current === item.id ? "page" : undefined}
            scroll={false}
          >
            <span>{item.name}</span>
            <small>{item.sub}</small>
          </Link>
        ))}
      </div>
    </nav>
  )
}
