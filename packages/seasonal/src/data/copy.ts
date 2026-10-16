// 초안 — 사용자 검토 전. 화면 문구를 이 파일 한 곳에 모은다. 화면 코드는 문구를 직접 쓰지 않고 여기서 읽는다.
// 달별 문구는 그 달 검증 품종(foods.generated.ts)에 맞춰 썼다.

import type { Festival } from "./festivals"
import type { Month } from "./months"
import type { Season } from "./seasons"

/** 달마다 한 줄 문구(2a 월 섹션, 2b 제목). */
export const MONTH_NOTES: Record<Month, string> = {
  1: "찬 바다에서 굴과 방어가 가장 기름진 달",
  2: "봄동이 먼저 봄을 알리는 달",
  3: "냉이·달래·쑥, 들에서 봄을 캐는 달",
  4: "두릅과 미나리, 새순이 가장 연한 달",
  5: "완두콩과 참외로 초여름이 열리는 달",
  6: "매실을 담그고 햇감자를 캐는 달",
  7: "민어와 수박으로 더위를 이기는 달",
  8: "복숭아와 포도가 무르익는 한여름",
  9: "전어가 돌아오고 햇과일이 쏟아지는 달",
  10: "밤·고구마·사과, 거두어들이는 달",
  11: "배추와 무로 김장을 준비하는 달",
  12: "방어와 굴, 한 해를 닫는 기름진 바다",
}

/** 계절 이름과 한 줄 설명(3a). */
export const SEASON_COPY: Record<
  Season,
  { name: string; english: string; description: string }
> = {
  spring: {
    name: "봄",
    english: "SPRING",
    description: "들나물과 새순, 조개가 살 오르는 계절",
  },
  summer: {
    name: "여름",
    english: "SUMMER",
    description: "물 많은 과일과 보양 생선의 계절",
  },
  autumn: {
    name: "가을",
    english: "AUTUMN",
    description: "햇곡식과 과일, 살찐 생선을 거두는 계절",
  },
  winter: {
    name: "겨울",
    english: "WINTER",
    description: "찬 바다의 생선과 조개가 가장 기름진 계절",
  },
}

/** 명절 배경 설명(1g). */
export const FESTIVAL_BACKGROUNDS: Record<Festival, string> = {
  seollal: "새해 첫날. 흰 떡국을 먹으며 한 살을 더한다.",
  daeboreum:
    "새해 첫 보름달이 뜨는 날. 오곡밥과 묵은 나물을 먹고, 부럼을 깨물어 한 해의 부스럼을 막는다고 여겼다.",
  dano: "한 해 중 양기가 가장 센 날. 수리취로 떡을 빚고 매실로 제호탕을 끓였다.",
  sambok:
    "여름 가운데 가장 더운 때. 삼계탕과 팥죽으로 몸을 보하며 더위를 났다.",
  chuseok:
    "그해 거둔 햅쌀과 햇과일로 차례를 지내는 날. 송편과 토란탕을 먹는다.",
  dongji: "밤이 가장 긴 날. 붉은 팥죽으로 나쁜 기운을 막는다고 여겼다.",
}

/** 여러 화면이 함께 쓰는 짧은 문구. */
export const UI_COPY = {
  eatToggleOff: "먹었어요",
  eatToggleOn: "✓ 먹었어요",
  /** 품종 상세 먹음 기록 줄: 왼쪽 질문·안내, 오른쪽 작은 버튼(eatToggleOff/On) */
  eatDetailAsk: "올해 먹어 봤나요?",
  eatDetailDone: "올해 먹었어요",
  eatDetailHintOff: "기록하면 나의 식탁에 모여요",
  eatDetailHintOn: "나의 식탁에 기록했어요",
  /** 품종 검색 입력란(헤더 검색, 나의 식탁) */
  searchPlaceholder: "음식 이름 검색 (예: 사과, ㅅㄱ)",
  emptySearch: (query: string) =>
    `"${query}"에 맞는 제철음식이 없어요. 철자를 바꾸거나 필터를 '전체'로 바꿔 보세요.`,
  noFestivalThisMonth: "이 달의 명절 없음",
  /** 2a 이달 맨 아래: 열두 달 스크롤이 끝났을 때 */
  yearEndTitle: "열두 달을 다 둘러봤어요",
  yearEndMyTableHint: "먹은 제철을 기록하면 나의 식탁에 모여요",
  yearEndMyTableAction: "나의 식탁 보기",
  yearEndMoreTitle: "다른 방법으로 둘러보기",
  priceComingSoon: "가격 보기 · 준비 중",
  noRelatedFestival: "연결된 명절 없음",
} as const

/** 나의 식탁 행 라벨. 먹은 품종은 EAT_LABELS에서 고르고, 안 먹은 품종은 EAT_LABEL_OFF다. 어떤 음식에도 어울리게 중립적으로 쓴다. */
export const EAT_LABEL_OFF = "아직"

const EAT_LABELS = [
  "냠냠",
  "꿀맛!",
  "제철 정복",
  "올해도 먹었다",
  "또 하나 클리어",
  "배불러요",
  "잘 먹었습니다",
  "한 접시 완료",
  "입이 즐거워요",
  "제철 챙김",
] as const

/** 먹은 품종 라벨. n은 무작위 수(방금 체크) 또는 품종 id 해시(다시 열었을 때)로, 풀 길이로 나눈 나머지를 쓴다. */
export function eatLabel(n: number): string {
  return EAT_LABELS[Math.abs(n) % EAT_LABELS.length]!
}

/** 문자열 해시(안정적). 새로고침해도 같은 품종은 같은 문구가 나오게 한다. */
export function hashString(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0
  return Math.abs(h)
}
