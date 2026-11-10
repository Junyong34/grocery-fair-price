import {
  getProhibitedFoodsForStage,
  type BabyFruitStageId,
} from "@workspace/seasonal/data/infant-fruits"

export function StageWarningBanner({
  stageId,
}: {
  stageId?: BabyFruitStageId | "all"
}) {
  const isAll = !stageId || stageId === "all"
  const isUnder12m =
    stageId === "4-5-months" ||
    stageId === "6-months" ||
    stageId === "7-8-months" ||
    stageId === "9-11-months"

  const prohibited = isAll
    ? getProhibitedFoodsForStage("6-months")
    : getProhibitedFoodsForStage(stageId)

  return (
    <div
      className={`fruits-warning-banner ${
        isUnder12m || isAll ? "banner-danger" : ""
      }`}
      role="alert"
    >
      <div
        className={`fruits-warning-title ${
          isUnder12m || isAll ? "" : "title-caution"
        }`}
      >
        <span aria-hidden="true">⚠️</span>
        <span>
          {isUnder12m || isAll
            ? "돌 전(12개월 미만) 아기에게 절대 주면 안 되는 식품"
            : "두 돌 및 영유아기(만 5세 미만) 강력 주의 식품"}
        </span>
      </div>
      <p className="fruits-warning-desc">
        {isUnder12m || isAll
          ? "꿀(영아 보툴리누스증 마비 위험), 생우유(신장 과부하 및 빈혈), 생과일주스(비만 및 밥 거부), 날음식은 돌 전에 절대 먹이면 안 됩니다."
          : "통견과류와 통포도는 만 4~5세까지 기도 폐쇄(질식) 위험 1위입니다. 첨가당(설탕·시럽)은 두 돌까지 0g을 권장합니다."}
      </p>
      <div className="fruits-warning-chips">
        {prohibited.map((food) => (
          <span key={food.id} className="fruits-warning-chip">
            🚫 {food.name}
          </span>
        ))}
      </div>
    </div>
  )
}
