import { TriangleAlert } from "lucide-react"

import {
  BABY_FRUIT_STAGES,
  getProhibitedFoodsForStage,
  type BabyFruitStageId,
} from "@workspace/seasonal/data/infant-fruits"

/** 과일 목록 위 경고. 지금 월령에 먹이면 안 되는 식품을 칩으로 두고, 칩은 아래 주의 식재료 카드로 이어진다. */
export function StageWarningBanner({
  stageId,
}: {
  stageId?: BabyFruitStageId | "all"
}) {
  const stage = BABY_FRUIT_STAGES.find((s) => s.id === stageId)
  const beforeFirst = !stage || stage.id !== "12-months"
  const prohibited = getProhibitedFoodsForStage(beforeFirst ? "6-months" : "12-months")

  return (
    <aside
      className="fruits-warning-banner"
      data-tone={beforeFirst ? "danger" : "caution"}
      aria-labelledby="fruits-warning-title"
    >
      <h2 id="fruits-warning-title" className="fruits-warning-title">
        <TriangleAlert aria-hidden size={18} strokeWidth={2} />
        {beforeFirst ? "돌 전에는 먹이지 마세요" : "두 돌까지 조심하세요"}
      </h2>
      {stage?.cautionNote && <p className="fruits-warning-desc">{stage.cautionNote}</p>}
      <ul className="fruits-warning-chips">
        {prohibited.map((food) => (
          <li key={food.id}>
            <a href={`#safety-${food.id}`} className="fruits-warning-chip">
              {food.name}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
