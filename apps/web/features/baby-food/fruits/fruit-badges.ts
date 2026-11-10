import {
  BABY_FRUIT_STAGES,
  type BabyFruit,
  type FruitSafetyStatus,
} from "@workspace/seasonal/data/infant-fruits"

/** 과일 안전 상태 배지. 카드·시트·범례가 같은 이름과 색을 쓴다(색은 fruits.css의 data-tone). */
export const SAFETY_BADGES: Record<
  FruitSafetyStatus,
  { label: string; tone: "safe" | "neutral" | "caution"; legend: string }
> = {
  safe: { label: "권장", tone: "safe", legend: "소아과 지침이 권하는 과일" },
  conventional: { label: "육아 관행", tone: "neutral", legend: "흔히 먹이지만 근거는 적은 과일" },
  caution: { label: "손질 주의", tone: "caution", legend: "질식·알레르기 손질이 꼭 필요한 과일" },
}

/** 카드 아래 "언제부터" 한 줄. 돌 이후 단계는 "돌부터"로 읽는다. */
export function firstStageLabel(fruit: BabyFruit): string {
  if (fruit.firstStage === "12-months") return "돌부터"
  const stage = BABY_FRUIT_STAGES.find((s) => s.id === fruit.firstStage)
  return stage ? `${stage.name}부터` : ""
}
