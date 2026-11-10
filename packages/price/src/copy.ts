// 가격 화면 문구를 이 파일 한 곳에 모은다. 화면 코드는 문구를 직접 쓰지 않고 여기서 읽는다.
// 용어는 grocery-price/GLOSSARY.md(시세 · 평소가 · 판정 · 품종)를 따른다.

import { josa } from "es-hangul"

import { monthDay, signedPct, won } from "./format"
import { latestSurveyedOn } from "./list"
import type { Channel, MarketType, QuoteBasis, Verdict, VerdictKind } from "./types"

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

/** 참가격 업태 이름 (상품 화면) */
export const CHANNEL_NAME: Record<Channel, string> = {
  large_mart: "대형마트",
  ssm: "기업형 슈퍼",
  department: "백화점",
  convenience: "편의점",
}

/**
 * 시세가 여러 곳의 중간값이 아니라 출처가 낸 평균 한 건인가(축평원 "전국 평균").
 * 수집(price-ingest judgment/build.ts)이 정하는 scope 문구로 가른다. 이때 표본 수 1은 "1곳"이 아니다.
 */
export function isAverageBasis(basis: QuoteBasis): boolean {
  return basis.scope.endsWith("평균")
}

/**
 * 목록 아래 근거 한 줄. 조사일이 다르면 범위로 쓰고, 출처는 처음 나온 순서대로 한 번씩 쓴다.
 * 빈 목록이면 null. 행별 조사일도 시세 옆에 표시한다.
 */
export function listBasisLine(
  rows: readonly { surveyedOn: string; basis: QuoteBasis }[]
): string | null {
  const surveyedOn = latestSurveyedOn(rows)
  if (surveyedOn == null) return null
  const earliest = rows.reduce(
    (day, row) => (row.surveyedOn < day ? row.surveyedOn : day),
    surveyedOn
  )
  const dates =
    earliest === surveyedOn
      ? monthDay(surveyedOn)
      : `${monthDay(earliest)}~${monthDay(surveyedOn)}`
  const sources = [
    ...new Set(rows.map(({ basis }) => `${basis.source} ${basis.scope}`)),
  ]
  return `조사일 ${dates} · ${sources.join(" · ")}`
}

/** 목록 하단은 출처 이름만 표시한다. 조사 범위와 날짜는 안내 popover·행에서 확인한다. */
export function listSourceLine(
  rows: readonly { basis: QuoteBasis }[]
): string | null {
  const sources = [...new Set(rows.map(({ basis }) => basis.source))]
  return sources.length ? `출처: ${sources.join(" · ")}` : null
}

export const PRICE_COPY = {
  home: {
    title: ["지금 사도 될까?", "식재료를 검색해 보세요"],
    searchPlaceholder: "배추, 삼겹살, 고등어…",
    recent: "최근 본 시세",
    clearRecent: "시세 기록 지우기",
    featured: "자주 사는 식재료",
    priceInfo: "시세·판정 안내",
  },
  /** P3 품종 상세 아래, 같은 카테고리의 다른 품종 목록 */
  related: {
    title: (category: string) => `다른 ${category} 시세`,
  },
  /** 상품 목록(/products)과 상품 카테고리 페이지. 검색 없이 링크만 따라 모든 상품 상세에 닿는 길이다. */
  catalog: {
    title: "상품 가격 비교",
    lead: "라면·우유·과자 같은 포장 상품의 전국 판매가를 카테고리별로 모았어요. 상품을 고르면 판매처별 가격을 견줄 수 있어요.",
    categoryTitle: (category: string) => `${category} 가격 비교`,
    count: (n: number) => `상품 ${n}개`,
    /** 상품 묶음 설명. 식재료 시세와 달리 판정이 없다는 것을 알린다(GLOSSARY: 상품 · 판매가) */
    productsNote: "참가격이 조사한 전국 판매가예요 · 판정은 하지 않아요",
    varieties: (category: string) => `${category} 시세`,
    varietiesNote: "이맘때 평소 가격과 견줘 싼지 비싼지 알려 드려요",
    /** 카테고리 페이지 아래, 다른 카테고리로 가는 목록 */
    others: "다른 상품 카테고리",
    /** 시세 메인의 상품 카테고리 묶음 */
    homeTitle: "상품 판매가",
    homeNote: "포장 상품은 판매처별 가격을 견줘요",
    homeAll: "상품 카테고리 모두 보기",
    /** P3 품종 상세 아래, 이 품종의 시세로 쓰이는 상품 묶음 */
    varietyProducts: (name: string) => `${name} 상품 판매가`,
    /** P3 품종 상세 아래, 그 카테고리 페이지로 가는 링크 */
    categoryLink: (category: string) => `${category} 상품 판매가 보기`,
  },
  /** P3 품종 상세 아래, 같은 id의 제철 품종 상세로 가는 링크 */
  seasonLink: (name: string) => `${name} 제철 시기 보기`,
  /** 목록 위 설명 한 줄 */
  hint: [
    { term: "시세", text: "최근 조사 가격" },
    { term: "평소가", text: "이맘때 보통 가격" },
  ],
  judgmentHint: "최근 조사 가격을 최대 세 건까지 평소가와 비교해요. 평소가가 없으면 판정하지 않아요.",
  row: {
    usual: (usual: string) => `평소 ${usual}`,
    noUsual: "평소가 없음",
    add: (name: string) => `${name} 담기`,
    remove: (name: string) => `${name} 빼기`,
    stale: "오래됨",
  },
  toast: {
    added: (name: string) => `${withJosa(name, "을/를")} 담았어요`,
    removed: (name: string) => `${withJosa(name, "을/를")} 뺐어요`,
    openList: "목록 보기",
  },
  search: {
    placeholder: "배추, 삼겹살, ㅂㅊ…",
    label: "시세 검색",
    item: (item: string) => `어떤 ${item}인가요?`,
    alias: (alias: string) =>
      `"${alias}"${josaOf(alias, "은/는")} 이 이름으로 찾았어요`,
    typo: (query: string) =>
      `"${query}"에 맞는 식재료가 없어요. 혹시 이걸 찾으셨나요?`,
    // 검색은 시세를 모으는 품종 목록(searchIndex) 안에서만 찾는다. 없는 이유는 판정이 아니라 목록에 없어서다.
    noResult: (query: string) => `"${query}" 검색 결과가 없어요`,
    // 오타 · 아무 글자일 때도 틀리지 않게 "~일 수 있어요". 특정 품종을 넣겠다는 약속은 하지 않는다(요청을 받는 경로가 없다).
    // 문장마다 한 줄로 그린다(375에서 문장 중간이 끊기지 않게).
    noResultHint: ["아직 시세를 모으지 않는 식재료일 수 있어요.", "시세를 내는 식재료는 계속 늘려 갈게요."],
    tipsTitle: "이렇게 찾아보세요",
    tips: [
      { how: "이름", example: "애호박, 호박, 삼겹살" },
      { how: "초성", example: "ㅇㅎㅂ" },
    ],
    browse: "카테고리에서 둘러보기",
    category: (category: string) => `${category} 시세`,
    // 식재료(판정 있음) 아래 상품 묶음 제목. 상품은 판정 대신 판매가를 보인다 (catalog-scale/10)
    products: "상품 판매가",
    productsCount: (n: number) => `${n}개`,
    productsMore: (n: number) => `상품 ${n}개 더 보기`,
  },
  // 참가격 상품 상세 (catalog-scale/10). 판정이 없다: 지금이 비싼 시기인지가 아니라 어디서 싸게 파는지를 견준다
  product: {
    nationalPrice: "전국 판매가",
    nationalNote: (surveyedOn: string, stores: number) => `${monthDay(surveyedOn)} 조사한 ${stores}곳 가격의 중간값`,
    perUnit: (unit: string, price: number) => `${unit}당 ${won(price)}원`,
    range: (min: number, max: number) => `최저 ${won(min)}원 ~ 최고 ${won(max)}원`,
    noVerdict: "이 상품은 판매처별 가격을 비교할 수 있어요.",
    /** 판매가가 시세로 쓰이는 상품(품종이 있는 상품)의 판정 안내 */
    verdictOnVariety: (name: string) => `판정은 아래 ‘${name}’ 시세에서 봐요`,
    /** 품종은 있지만 아직 판정이 없는 상품 */
    noVerdictYet: "아직 판정할 수 없어 판매처별 가격만 보여드려요.",
    stale: (surveyedOn: string) => `마지막 조사 ${monthDay(surveyedOn)}`,
    staleNote: "최근 조사에서 빠져 지금 가격과 다를 수 있어요",
    discontinued: "참가격이 더 조사하지 않는 상품이에요",
    channelsTitle: "매장 유형별 판매가",
    sellersTitle: "어디서 얼마에 팔까",
    sellersSub: (surveyedOn: string) => `${monthDay(surveyedOn)} 조사 · 싼 순`,
    stores: (n: number) => `${n}곳`,
    storesRange: (min: number, max: number) => `점포마다 ${won(min)}~${won(max)}원`,
    promo: "행사",
    sellersNote: "점 = 이 판매처 중간값, 점선 = 전국 판매가",
    trendTitle: "최근 조사 가격",
    trendLegend: { median: "전국 판매가", min: "조사 최저가" },
    basis: (stores: number, surveyedOn: string) => `참가격 전국 판매점 ${stores}곳 · ${monthDay(surveyedOn)} 조사`,
    /** 최근 조사 가격: 첫 조사 대비 전국 판매가 변화 한 줄 */
    trendChange: (change: number) =>
      change === 0 ? "첫 조사와 같아요" : `첫 조사보다 ${won(Math.abs(change))}원 ${change < 0 ? "내렸어요" : "올랐어요"}`,
    trendStatsTitle: "전국 판매가 요약",
    trendStats: { high: "기간 최고", average: "기간 평균", low: "기간 최저" },
    /** 추이 그림의 대체 텍스트 */
    trendSummary: (s: {
      from: string
      to: string
      count: number
      first: number
      last: number
      high: number
      low: number
      average: number
      lastMin: number
    }) => {
      const period = `${monthDay(s.from)}부터 ${monthDay(s.to)}까지 ${s.count}회 조사했어요.`
      const change =
        s.first === s.last
          ? `첫 조사와 마지막 조사 모두 전국 판매가는 ${won(s.last)}원이었어요.`
          : `전국 판매가는 첫 조사에서 ${won(s.first)}원, 마지막 조사에서 ${won(s.last)}원이었어요.`
      return `${period} ${change} 전국 판매가의 기간 최고 ${won(s.high)}원, 최저 ${won(s.low)}원, 평균 ${won(s.average)}원이에요. 마지막 조사의 최저가는 ${won(s.lastMin)}원이에요.`
    },
    /** 이 상품 판매가가 시세로 쓰이는 품종 */
    varietyTitle: "이 판매가가 쓰이는 시세",
    /** 같은 품목의 다른 상품 */
    relatedTitle: (item: string) => `다른 ${item} 판매가`,
    relatedNote: (unit: string | null) => (unit ? `${unit}당 가격이 싼 순` : "판매가 싼 순"),
    relatedAll: (item: string) => `‘${item}’ 검색 결과에서 모두 보기`,
    /** 상품 상세 아래, 이 상품의 카테고리 페이지로 가는 링크 */
    categoryLink: (category: string) => `${category} 상품 모두 보기`,
    discontinuedShort: "조사 중단",
  },
  detail: {
    back: "뒤로",
    /** 페이지 맨 아래 요약 문장 옆, 데이터 출처 안내(/settings/sources)로 가는 링크 */
    sourcesLink: "데이터 출처",
    add: "+ 담기",
    added: "✓ 담음",
    nowPrice: "지금 시세",
    nowPriceNote: (surveyedOn: string, n: number, basis: QuoteBasis) =>
      isAverageBasis(basis)
        ? `${monthDay(surveyedOn)} 조사한 ${basis.scope} 가격`
        : `${monthDay(surveyedOn)} 조사한 ${n}곳 가격의 중간값`,
    usual: "평소가",
    usualNote: "이맘때 보통 이 정도예요",
    noUsual: "평소가가 없어 시세만 보여드려요",
    verdictBasis:
      "최근 조사 최대 세 건을 각각 그날의 평소가와 비교해요. 그 차이의 중간값으로 판정해요.",
    usualPending: "자료 없음",
    usualPendingNote: "조사된 시세와 가격 흐름은 볼 수 있어요",
    stale: (surveyedOn: string, ago: string) =>
      `마지막 조사 ${monthDay(surveyedOn)} · ${ago}`,
    /** stale의 "N주 전"을 채우기 전(정적 셸)에 보이는 글 */
    staleOn: (surveyedOn: string) => `마지막 조사 ${monthDay(surveyedOn)}`,
    staleNote: "최근 조사가 없어 지금과 다를 수 있어요",
    /** 표본 적음: 그날 조사한 곳이 같은 규격의 평소(최근 182일 중앙값)의 절반에 못 미침. 절대 수가 아니라 평소 대비라 "N곳뿐"이라 쓰지 않는다. */
    fewSamples: (n: number) => `평소보다 적은 ${n}곳 조사`,
    /** 판정 전이면 판정 이야기를 빼고 시세만 말한다. */
    fewSamplesNote: (judged: boolean) => (judged ? "실제 시세와 다를 수 있어 판정은 참고로만 봐 주세요" : "실제 시세와 다를 수 있어요"),
    rangeTitle: (surveyedOn: string, n: number, basis: QuoteBasis) =>
      isAverageBasis(basis)
        ? `${monthDay(surveyedOn)} 조사한 ${basis.scope} 가격`
        : `${monthDay(surveyedOn)} 조사한 ${n}곳의 시세 범위`,
    rangeLow: "싼 곳",
    rangeHigh: "비싼 곳",
    rangeUsual: (usual: string) => `평소가 ${usual} · 평소 범위`,
    rangePin: (price: string, basis: QuoteBasis) => `${isAverageBasis(basis) ? basis.scope : "시세"} ${price}원`,
    rangeMine: (price: string) => `내가 본 ${price}`,
    placesTitle: "어디서 얼마에 팔까",
    placesSub: (surveyedOn: string) => `시세 · ${monthDay(surveyedOn)} 조사`,
    typeMedian: (type: string) => `${type} 중간값`,
    martsTitle: "대형마트 · 체인별",
    marketsTitle: "전통시장",
    cheapFirst: "싼 순",
    samePrice: (n: number) => `조사한 ${n}곳 가격이 같아요`,
    places: (n: number) => `${n}곳`,
    showAllMarkets: (n: number) => `전통시장 ${n}곳 모두 보기`,
    showFewerMarkets: "접기",
    placesNote: (national: string, basis: QuoteBasis) =>
      `막대의 점선은 ${isAverageBasis(basis) ? basis.scope : "전국 중간값"}(${national}원). 매장에서 본 가격을 여기 견주어 보세요.`,
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
    forecastNote:
      "예상은 평년의 같은 시기 흐름을 지금 시세에 이어 붙인 것이에요. 날씨·작황에 따라 크게 달라질 수 있어요.",
    noUsualTrendNote: "평소가가 생기면 평소 범위와 판정이 함께 보여요.",
    today: "오늘",
    shelfTitle: "판매처별 가격",
    shelfSub: (unit: string) => `${unit} 기준`,
    shelfGroupQuote: (surveyedOn: string) =>
      `시세 · ${monthDay(surveyedOn)} 조사`,
    shelfGroupShelf: (surveyedOn: string) =>
      `판매가 · 참가격 ${monthDay(surveyedOn)} 조사`,
    shelfLag: (shelfOn: string, quoteOn: string, days: number) =>
      `판매가는 참가격 ${monthDay(shelfOn)} 조사라 시세(${monthDay(quoteOn)})보다 ${days}일 앞선 값이에요.`,
    promo: "행사",
    marketDotsTitle: "조사 시장별 시세",
    marketDotsSub: (surveyedOn: string, unit: string) =>
      `${monthDay(surveyedOn)} 조사 · ${unit}`,
    marketDotsMedian: "가운데 값",
    marketDotsNote:
      "KAMIS는 대형마트 이름을 B·C·E 같은 기호로 표시해요. 같은 체인의 조사 가격이 모두 같은 경우도 있어요.",
    dotLegend: {
      quote: "시세",
      shelf: "판매가",
      market: "조사 시장 한 곳",
      band: "평소 범위 (보통)",
    },
    myPrice: "내가 본 가격 적기",
    myPriceUnit: (unit: string) => `${unit} 기준`,
    myPriceTitle: "내가 본 가격",
    myPricePlaceholder: (example: string) => `예: ${example}`,
    myPriceWon: "원",
    myPriceHint:
      "기준 단위로 입력해 주세요. 입력한 가격은 이 화면에서만 비교해요.",
    myPriceApply: "비교하기",
    myPriceClose: "닫기",
    myPriceClear: "내가 본 가격 지우기",
    myPriceClearShort: "지우기",
    myPriceEdit: "다시 적기",
    myPriceLabel: (unit: string) => `내가 본 가격 · ${unit}`,
    myPriceAgainstUsual: (diff: string, usual: string) =>
      `${diff} · 평소가 ${usual}원`,
  },
  basket: {
    title: "장바구니",
    edit: "편집",
    done: "완료",
    changed: (n: number, names: string) =>
      `담은 뒤 판정이 바뀐 식재료 ${n}개 · ${names}`,
    changedRow: (date: string, before: string, now: string) =>
      `${monthDay(date)}에 담을 때 ${before} → 지금 ${now}`,
    columns: ["식재료", "판정", "시세 · 평소"],
    addMore: "+ 더 담기",
    emptyTitle: "장바구니가 비어 있어요",
    emptyBody: "살 식재료를 담아 두면 판정을 한 번에 볼 수 있어요",
    emptyAction: "검색해서 담기",
    clearAll: "모두 빼기",
  },
} as const
