// 초안 — 사용자 검토 전. 화면 문구를 이 파일 한 곳에 모은다. 화면 코드는 문구를 직접 쓰지 않고 여기서 읽는다.
// 달별 문구는 그 달 검증 품종(foods.generated.ts)에 맞춰 썼다.

import { josa } from "es-hangul"

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
  /** 나의 식탁 요약의 범위 제목(전체·달·계절 이름을 받는다) */
  scopeTitle: (name: string | null) =>
    name ? `${name} 제철 중 맛본 것` : "올해 맛본 제철",
  /** 나의 식탁 목록 위, 검색 중일 때만 */
  searchResult: (query: string, count: number, eaten: number) =>
    `"${query}" 검색 결과 ${count}가지 · ${eaten}가지 먹음`,
  /** 나의 식탁 요약의 큰 숫자 아래 한 줄 */
  scopeProgress: (eaten: number, total: number) =>
    eaten === 0
      ? `${total}가지 모두 기다리고 있어요`
      : eaten === total
        ? "모두 맛봤어요"
        : `${total - eaten}가지 남았어요`,
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

/** 달력·포스터 PDF 내려받기 화면(/seasonal/downloads). */
export const DOWNLOADS_COPY = {
  title: "달력·포스터 내려받기",
  intro: "제철 달력과 포스터를 A4 PDF로 내려받아 집에서 인쇄해 보세요.",
  empty: "아직 준비된 인쇄물이 없어요. 곧 올려 둘게요.",
  download: "PDF 내려받기",
  share: "공유",
  shelfMeta: (count: number) => `${count}개`,
  printTips: {
    title: "인쇄 팁",
    size: "A4 용지에 \"실제 크기\"로 인쇄하세요.",
    /** 월간 달력만 */
    oneMonth: "한 달만 뽑을 땐 인쇄 창에서 그 달 쪽 번호를 고르세요.",
  },
  backToList: "‹ 달력·포스터",
  others: "다른 인쇄물",
  seeAll: "전체 보기 ›",
  thumbnailAlt: (name: string, index: number) => (index === 0 ? `${name} 미리보기` : `${name} 미리보기 ${index + 1}쪽`),
  settingsLink: "달력·포스터 PDF 내려받기",
  /** 내려받기를 누른 뒤(5-a). 브라우저 다운로드가 끝났는지는 알 수 없어 "누른 뒤" 상태다. */
  done: {
    title: "내려받았어요",
    where: "휴대폰은 \"파일\" 또는 \"다운로드\"에 있어요.",
    pcTitle: "휴대폰으로 받으셨나요?",
    pcBody: "인쇄는 PC에서 하는 게 편해요. 링크를 PC로 보내 보세요.",
    copyLink: "링크 복사",
    share: "공유하기",
    again: "다시 내려받기",
  },
  a3: { ask: "A3로 크게 뽑고 싶다면 · A3도 원해요", thanks: "알려 주셔서 고마워요. 원하는 분이 많으면 A3도 열어 둘게요." },
  /** 내린 에디션 주소(6-1) */
  withdrawn: {
    title: "이 인쇄물은 내려갔어요",
    body: (name: string) => `${josa(name, "은/는")} 더 받을 수 없어요.`,
    replacement: "같은 종류의 새 인쇄물을 받아 보세요.",
    seeAll: "다른 인쇄물 모두 보기",
  },
  /** 2a · 2b 입구 카드(1-a) */
  entry: { title: "제철 달력 · 포스터 PDF 받기", hint: "집에서 인쇄해 냉장고에 붙여 보세요" },
} as const
