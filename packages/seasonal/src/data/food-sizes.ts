/**
 * 품종별 그림 크기 배율. 기본은 1이고, 작아 보이는 품종만 적는다.
 * 일러스트마다 상자 안 여백이 달라 같은 크기여도 작게 보이는 그림을 키울 때 쓴다.
 * 배치(layout/scatter)가 기본 크기에 곱하므로 모든 판에 같은 값이 적용된다.
 */
export const FOOD_SCALE: Readonly<Record<string, number>> = {
  // 가늘고 길어 작아 보이는 생선·뿌리·나물(처음 값. 화면을 보고 고쳐 가며 조정한다)
  pollock: 1.25,
  "spanish-mackerel": 1.25,
  saury: 1.25,
  burdock: 1.2,
  deodeok: 1.2,
  mugwort: 1.2,
  "wild-chive": 1.2,
  "shepherds-purse": 1.2,
}

export function foodScale(id: string): number {
  return FOOD_SCALE[id] ?? 1
}
