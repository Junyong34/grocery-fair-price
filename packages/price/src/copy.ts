// 가격 화면 문구를 이 파일 한 곳에 모은다. 화면 코드는 문구를 직접 쓰지 않고 여기서 읽는다.
// 용어는 grocery-price/GLOSSARY.md(시세 · 평소가 · 판정 · 품종)를 따른다.

import { josa } from "es-hangul"

import { monthDay, signedPct } from "./format"
import type { MarketType, QuoteBasis, Verdict, VerdictKind } from "./types"

/** 판정 한 마디. */
export const VERDICT_WORD: Record<VerdictKind, string> = {
  cheap: "싸요",
  normal: "보통",
  pricey: "비싸요",
  none: "판정 전",
}

/** P4 판정별 묶음 제목. 이 순서로 늘어놓는다. */
export const VERDICT_GROUPS: readonly { kind: VerdictKind; title: string }[] = [
  { kind: "cheap", title: "지금 싸요" },
  { kind: "normal", title: "보통이에요" },
  { kind: "pricey", title: "평소보다 비싸요" },
  { kind: "none", title: "판정 전" },
]

/** 목록 칩: "보통 +8%". 판정 전이면 "판정 전". */
export function verdictChip(verdict: Verdict): string {
  const word = VERDICT_WORD[verdict.kind]
  return verdict.pct == null ? word : `${word} ${signedPct(verdict.pct)}`
}

/** 판정 카드의 두 번째 줄: "평소보다 8% 높아요". */
export function verdictDiff(pct: number): string {
  if (pct === 0) return "평소와 같아요"
  return `평소보다 ${Math.abs(pct)}% ${pct > 0 ? "높아요" : "낮아요"}`
}

type Particle = Parameters<typeof josa>[1]

/** 이름의 받침에 맞는 조사만. "삼겹살(국산)"처럼 괄호가 붙은 이름은 괄호 앞 글자로 고른다. */
export function josaOf(name: string, particle: Particle): string {
  const head = name.replace(/\s*\([^)]*\)$/, "")
  return josa(head, particle).slice(head.length)
}

/** 이름 뒤에 받침에 맞는 조사를 붙인다: 배추 → "배추를". */
export function withJosa(name: string, particle: Particle): string {
  return name + josaOf(name, particle)
}

/** 업태 이름 */
export const MARKET_TYPE_NAME: Record<MarketType, string> = {
  large_retail: "대형마트",
  traditional: "전통시장",
}

/** 화면 맨 아래 근거 한 줄: "전국 조사 시장 45곳 · 10/23 조사 (KAMIS)" */
export function basisLine(basis: QuoteBasis, surveyedOn: string, n: number): string {
  return `${basis.scope} ${n}곳 · ${monthDay(surveyedOn)} 조사 (${basis.source})`
}

/** 목록 시세의 출처. 목록 행은 모두 KAMIS 전국 조사 시장 시세다. */
export const LIST_BASIS: QuoteBasis = { source: "KAMIS", scope: "전국 조사 시장" }

/** 목록 아래 근거 한 줄: "시세는 10/23 조사 · KAMIS 전국 조사 시장" */
export function listBasisLine(basis: QuoteBasis, surveyedOn: string): string {
  return `시세는 ${monthDay(surveyedOn)} 조사 · ${basis.source} ${basis.scope}`
}

export const PRICE_COPY = {
  home: {
    title: ["지금 사도 될까?", "품종을 검색해 보세요"],
    searchPlaceholder: "배추, 삼겹살, 고등어…",
    recent: "최근 본 품종",
    clearRecent: "지우기",
    featured: "자주 사는 품종",
  },
  /** 목록 위 설명 한 줄 */
  hint: [
    { term: "시세", text: "오늘 조사한 곳들의 중간값" },
    { term: "평소", text: "이맘때 보통 가격" },
  ],
  row: {
    usual: (usual: string) => `평소 ${usual}`,
    noUsual: "평소가 없음",
    add: (name: string) => `${name} 담기`,
    remove: (name: string) => `${name} 빼기`,
  },
  toast: {
    added: (name: string) => `${withJosa(name, "을/를")} 담았어요`,
    removed: (name: string) => `${withJosa(name, "을/를")} 뺐어요`,
    openList: "목록 보기",
  },
  search: {
    placeholder: "품종 이름이나 초성",
    label: "품종 검색",
    cancel: "취소",
    item: (item: string) => `품목 "${item}" · 어떤 ${item}인가요?`,
    alias: (alias: string) => `"${alias}"${josaOf(alias, "은/는")} 이 품종으로 찾았어요`,
    typo: (query: string) => `"${query}"에 맞는 품종이 없어요. 혹시 이 품종인가요?`,
    noResult: (query: string) => `"${query}"${josaOf(query, "은/는")} 아직 판정하지 않아요`,
    tipsTitle: "이렇게 찾아보세요",
    tips: [
      { how: "품종 이름", example: "애호박, 삼겹살" },
      { how: "초성", example: "ㅇㅎㅂ" },
      { how: "품목 이름", example: "호박, 소고기" },
    ],
    browse: "카테고리에서 둘러보기",
    category: (category: string) => `${category} 품종`,
  },
  detail: {
    back: "뒤로",
    add: "+ 담기",
    added: "✓ 담음",
    nowPrice: "지금 시세",
    nowPriceNote: (surveyedOn: string, n: number) => `${monthDay(surveyedOn)} 조사한 ${n}곳 가격의 중간값`,
    usual: "평소가",
    usualNote: "이맘때 보통 이 정도예요",
    noUsual: "평소가를 낼 만큼 시세가 아직 쌓이지 않았어요",
    usualPending: "계산 중",
    usualPendingNote: "시세가 쌓이면 보여 줘요",
    stale: (surveyedOn: string, ago: string) => `마지막 조사 ${monthDay(surveyedOn)} · ${ago}`,
    staleNote: "최근 조사가 없어 지금과 다를 수 있어요",
    fewSamples: (n: number) => `조사한 곳이 ${n}곳뿐이라 참고만 하세요`,
    rangeTitle: (surveyedOn: string, n: number) => `${monthDay(surveyedOn)} 조사한 ${n}곳의 시세 범위`,
    rangeLow: "싼 곳",
    rangeHigh: "비싼 곳",
    rangeUsual: (usual: string) => `평소가 ${usual} · 평소 범위`,
    rangePin: (price: string) => `시세 ${price}`,
    rangeMine: (price: string) => `내가 본 ${price}`,
    placesTitle: "어디서 얼마에 팔까",
    placesSub: (surveyedOn: string) => `시세 · ${monthDay(surveyedOn)} 조사`,
    typeMedian: (type: string) => `${type} 중간값`,
    martsTitle: "대형마트 · 체인별",
    marketsTitle: "전통시장",
    cheapFirst: "싼 순",
    samePrice: "전국 같은 값",
    places: (n: number) => `${n}곳`,
    showAllMarkets: (n: number) => `전통시장 ${n}곳 모두 보기`,
    showFewerMarkets: "접기",
    placesNote: (national: string) => `막대의 점선은 전국 중간값(${national}원). 매장에서 본 가격을 여기 견주어 보세요.`,
    why: "왜 이 판정일까?",
    whyNoUsual: "가격 흐름 보기",
    trendTitle: "가격 추이",
    trendSub: (unit: string) => `시세 · ${unit}`,
    trendTabs: [
      { value: "1m", label: "1개월", days: 30 },
      { value: "3m", label: "3개월", days: 91 },
      { value: "6m", label: "6개월", days: 182 },
    ],
    legend: {
      price: "시세",
      band: "평소 범위",
      usual: "평소가",
      forecast: "평년 흐름으로 본 예상",
      pricey: "평소보다 비쌌던 날",
      cheap: "쌌던 날",
    },
    forecastNote: "예상은 평년의 같은 시기 흐름을 지금 시세에 이어 붙인 것이에요. 날씨·작황에 따라 크게 달라질 수 있어요.",
    noUsualTrendNote: "평소가가 생기면 평소 범위와 판정이 함께 보여요.",
    today: "오늘",
    shelfTitle: "판매처별 가격",
    shelfSub: (unit: string) => `${unit} 기준`,
    shelfGroupQuote: (surveyedOn: string) => `시세 · ${monthDay(surveyedOn)} 조사`,
    shelfGroupShelf: (surveyedOn: string) => `판매가 · 참가격 ${monthDay(surveyedOn)} 조사`,
    shelfLag: (shelfOn: string, quoteOn: string, days: number) =>
      `판매가는 참가격 ${monthDay(shelfOn)} 조사라 시세(${monthDay(quoteOn)})보다 ${days}일 앞선 값이에요.`,
    promo: "행사",
    marketDotsTitle: "조사 시장별 시세",
    marketDotsSub: (surveyedOn: string, unit: string) => `${monthDay(surveyedOn)} 조사 · ${unit}`,
    marketDotsMedian: "가운데 값",
    marketDotsNote: "대형마트 이름은 KAMIS가 B · C · E처럼 가려서 줘요. 같은 체인은 전국이 같은 값인 경우가 많아요.",
    dotLegend: { quote: "시세", shelf: "판매가", market: "조사 시장 한 곳", band: "평소 범위 (보통)" },
    myPrice: "내가 본 가격 적기",
    myPriceTitle: "매장에서 본 가격",
    myPriceHint: (unit: string) => `${unit} 가격을 적으면 평소가와 견줘 볼게요. 저장하지 않아요.`,
    myPriceApply: "판정 보기",
    myPriceClear: "지우기",
    myPriceVerdict: (price: string) => `내가 본 ${price}원은`,
  },
  basket: {
    title: "담은 품종",
    edit: "편집",
    done: "완료",
    changed: (n: number, names: string) => `담은 뒤 판정이 바뀐 품종 ${n}개 · ${names}`,
    changedRow: (date: string, before: string, now: string) => `${monthDay(date)}에 담을 때 ${before} → 지금 ${now}`,
    columns: ["품종", "판정", "시세 · 평소"],
    addMore: "+ 품종 더 담기",
    emptyTitle: "아직 담은 품종이 없어요",
    emptyBody: "살 품종을 담아 두면 판정을 한 번에 볼 수 있어요",
    emptyAction: "품종 검색해서 담기",
  },
} as const
