// 초안 — 사용자 검토 전. 화면 문구를 이 파일 한 곳에 모은다. 화면 코드는 문구를 직접 쓰지 않고 여기서 읽는다.
// 달별 문구는 그 달 검증 품종(foods.generated.ts)에 맞춰 썼다.

import { josa } from "es-hangul"

import type { Festival } from "./festivals"
import type { FoodCategory, FoodId } from "./foods"
import type { MonthDayId, MonthDayKind } from "./month-days"
import type { Month } from "./months"
import type { Season } from "./seasons"

/** 시세·제철 공통 셸의 모바일 홈 화면 설치 안내. */
export const INSTALL_COPY = {
  label: "홈 화면 설치 안내",
  title: "장볼날을 홈 화면에",
  description: "시세와 제철달력을 바로 열어보세요.",
  install: "홈 화면에 추가",
  ios: "Safari의 공유 메뉴에서 ‘홈 화면에 추가’를 선택하세요.",
  browser:
    "브라우저 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하세요. 메뉴가 없다면 Chrome이나 Safari에서 열어주세요.",
  close: "설치 안내 일주일 동안 닫기",
  confirmed: "홈 화면에 추가했어요",
  failed: "설치창을 열지 못했어요. 브라우저 메뉴에서 홈 화면에 추가해 주세요.",
} as const

/** 카테고리를 화면에 쓰는 이름과 주제 조사("생선·해산물은"). 수산은 검색어 모양("11월 제철 생선")에 맞춰 풀어 쓴다. */
const CATEGORY_WORDS: Record<FoodCategory, { label: string; topic: string }> = {
  채소: { label: "채소", topic: "채소는" },
  과일: { label: "과일", topic: "과일은" },
  수산: { label: "생선·해산물", topic: "생선·해산물은" },
  버섯: { label: "버섯", topic: "버섯은" },
  "곡물·견과": { label: "곡물·견과", topic: "곡물·견과는" },
}

/** 2b 월별 화면의 카테고리 소제목(h2)과 그 아래 첫 문장. names는 앞 몇 품종, n은 묶음 품종 수. */
export const MONTH_CATEGORY_COPY = {
  heading: (month: number, category: FoodCategory) => `${month}월 제철 ${CATEGORY_WORDS[category].label}`,
  lead: (month: number, category: FoodCategory, names: readonly string[], n: number) =>
    `${month}월에 제철인 ${CATEGORY_WORDS[category].topic} ${names.join("·")}${n > names.length ? ` 등 ${n}가지예요.` : ` ${n}가지예요.`}`,
} as const

/** 달마다 한 줄 문구(2a 월 섹션, 2b 제목). */
export const MONTH_NOTES: Record<Month, string> = {
  1: "무를 푹 끓여 차리는 새해 첫 밥상",
  2: "봄동 한 포기 무쳐 놓고 기다리는 봄",
  3: "냉이와 달래를 다듬는 손끝에 봄 향기",
  4: "살짝 데친 두릅을 나눠 먹는 봄날",
  5: "완두콩을 까다 보면 어느새 초여름",
  6: "매실 담근 병 옆으로 햇감자 찌는 김",
  7: "열무김치에 밥 비비고 수박 한 조각",
  8: "잘 익은 복숭아를 깎아 먹는 오후",
  9: "햇과일을 한 소쿠리 들여놓는 가을",
  10: "밤을 까고 고구마를 찌는 저녁",
  11: "배추와 무를 다듬으며 겨울 채비",
  12: "따뜻한 방에서 귤을 까며 보내는 한 해",
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
  /** 달력 아래 "이달의 절기·명절" 카드(month-days.ts) */
  monthDaysTitle: "이달의 절기·명절",
  noMonthDay: "이달은 이름난 절기나 명절이 없어요",
  /** 명절 줄의 설명. 전통 음식 이름 몇 가지를 받는다 */
  festivalDayNote: (dishes: readonly string[]) => `${dishes.join("·")} 먹는 날`,
  /** 2a 이달 맨 아래: 열두 달 스크롤이 끝났을 때 */
  yearEndTitle: "열두 달을 다 둘러봤어요",
  yearEndMyTableHint: "먹은 제철을 기록하면 나의 식탁에 모여요",
  yearEndMyTableAction: "나의 식탁 보기",
  yearEndMoreTitle: "다른 방법으로 둘러보기",
  /** 1i 품종 상세: 아직 시세 데이터가 없는 품종일 때 시세 버튼 자리에 두는 안내와 품종 허브(/prices) 링크 */
  priceUnavailable: (name: string) => `${name} 시세는 아직 준비 중이에요`,
  priceHubLink: "다른 품종 시세 보기",
  /** 1i 품종 상세에서 같은 품종의 시세 화면(/prices/<id>)으로 가는 버튼 */
  priceLink: (name: string) => `${name} 오늘 시세 보기`,
  noRelatedFestival: "연결된 명절 없음",
  /** 나의 식탁 요약의 범위 제목(전체·달·계절 이름을 받는다) */
  scopeTitle: (name: string | null) =>
    name ? `${name} 제철 중 맛본 것` : "올해 맛본 제철",
  /** 나의 식탁 요약의 큰 숫자 아래 한 줄 */
  scopeProgress: (eaten: number, total: number) =>
    eaten === 0
      ? `${total}가지 모두 기다리고 있어요`
      : eaten === total
        ? "모두 맛봤어요"
        : `${total - eaten}가지 남았어요`,
} as const

/** 나의 식탁의 목록 필터. 요약 카드의 시기 기준 집계와 구분한다. */
export const MY_TABLE_COPY = {
  allCategories: "전체 카테고리",
  categoryTitle: "카테고리 선택",
  categoryDescription: "목록에서 볼 카테고리를 하나 선택하세요.",
  clearCategory: "카테고리 전체 보기",
  clearQuery: "검색어 지우기",
  clearScope: "전체 시기 보기",
  emptySearchHint: "음식 이름, 다른 이름이나 초성으로 다시 검색해 보세요.",
  emptyFilterHint: "검색어를 지우거나 선택한 시기·카테고리를 바꿔 보세요.",
  emptyScopeHint: "다른 시기나 카테고리를 선택해 보세요.",
  emptyTitle: (query: string, filtered: boolean) => {
    const term = query.trim()
    if (!term) return "선택한 조건에 맞는 품종이 없어요"
    return filtered
      ? `선택한 조건에서 "${term}"을 찾지 못했어요`
      : `"${term}" 검색 결과가 없어요`
  },
  listResult: (
    scope: string | null,
    category: FoodCategory | null,
    query: string,
    count: number,
    eaten: number
  ) => {
    const conditions = [scope ?? "전체 시기", category ?? "전체 카테고리"]
    if (query.trim()) conditions.push(`"${query.trim()}" 검색 결과`)
    return `${conditions.join(" · ")} ${count}가지 · 먹음 ${eaten}가지`
  },
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
  title: "제철 음식 달력 무료 다운로드",
  intro: "월별 제철 음식을 담은 달력을 무료로 받아 보세요. 원하는 인쇄물을 골라 A4 PDF로 내려받고, 집에서 인쇄해 냉장고에 붙여 두세요.",
  free: "회원가입 없이 무료로 내려받을 수 있어요.",
  guide: {
    title: "제철달력 다운로드·인쇄 안내",
    items: [
      { question: "어떻게 무료로 다운로드하나요?", answer: '원하는 달력을 누르고 미리보기를 확인한 뒤 "PDF 무료 다운로드"를 누르세요. 회원가입이나 결제 없이 PDF를 받을 수 있어요.' },
      { question: "어떤 달력을 고르면 되나요?", answer: "월간 달력은 한 달씩 넘겨 보고, 연간 달력은 열두 달을 한 장으로 볼 수 있어요. 각 인쇄물에 표시된 연도와 쪽 수를 확인해 골라 주세요." },
      { question: "집에서 인쇄할 수 있나요?", answer: 'A4 용지에 "실제 크기"로 인쇄하세요. 월간 달력에서 한 달만 필요하다면 인쇄 창에서 해당 쪽 번호를 고르면 돼요. 휴대폰으로 받은 PDF도 PC로 옮겨 인쇄할 수 있어요.' },
    ],
    browse: "화면으로 월별 제철 음식 보기",
  },
  empty: "아직 준비된 인쇄물이 없어요. 곧 올려 둘게요.",
  yearFilter: "연도",
  yearLabel: (year: number) => `${year}년`,
  yearEmpty: (year: number) => `${year}년 인쇄물은 아직 없어요. 다른 연도를 골라 보세요.`,
  download: "PDF 무료 다운로드",
  share: "공유",
  shelfMeta: (count: number) => `${count}개`,
  printTips: {
    title: "인쇄 팁",
    size: 'A4 용지에 "실제 크기"로 인쇄하세요.',
    /** 월간 달력만 */
    oneMonth: "한 달만 뽑을 땐 인쇄 창에서 그 달 쪽 번호를 고르세요.",
  },
  backToList: "‹ 달력·포스터",
  others: "다른 인쇄물",
  seeAll: "전체 보기 ›",
  thumbnailAlt: (name: string, index: number) =>
    index === 0 ? `${name} 미리보기` : `${name} 미리보기 ${index + 1}쪽`,
  /** 내려받기를 누른 뒤(5-a). 브라우저 다운로드가 끝났는지는 알 수 없어 "누른 뒤" 상태다. */
  done: {
    title: "내려받았어요",
    where: '휴대폰은 "파일" 또는 "다운로드"에 있어요.',
    pcTitle: "휴대폰으로 받으셨나요?",
    pcBody: "인쇄는 PC에서 하는 게 편해요. 링크를 PC로 보내 보세요.",
    copyLink: "링크 복사",
    share: "공유하기",
    again: "다시 내려받기",
  },
  a3: {
    ask: "A3로 크게 뽑고 싶다면 · A3도 원해요",
    thanks: "알려 주셔서 고마워요. 원하는 분이 많으면 A3도 열어 둘게요.",
  },
  /** 내린 에디션 주소(6-1) */
  withdrawn: {
    title: "이 인쇄물은 내려갔어요",
    body: (name: string) => `${josa(name, "은/는")} 더 받을 수 없어요.`,
    replacement: "같은 종류의 새 인쇄물을 받아 보세요.",
    seeAll: "다른 인쇄물 모두 보기",
  },
  /** 2a · 2b 입구 카드(1-a) */
  entry: {
    title: "제철 음식 달력 무료 다운로드",
    hint: "집에서 인쇄해 냉장고에 붙여 보세요",
  },
} as const

/** "이달의 절기·명절" 줄의 종류 태그 */
export const MONTH_DAY_KIND_LABELS: Record<MonthDayKind, string> = {
  festival: "명절",
  "solar-term": "절기",
  custom: "세시",
}

/** "이달의 절기·명절" 줄의 한 줄 설명(명절은 UI_COPY.festivalDayNote로 전통 음식을 적는다). */
export const MONTH_DAY_NOTES: Record<Exclude<MonthDayId, Festival>, string> = {
  sohan: "한 해 가운데 가장 춥다는 때",
  daehan: "큰 추위라는 이름의 겨울 마지막 절기",
  ipchun: "봄이 시작되는 날",
  gyeongchip: "개구리가 겨울잠에서 깨어나는 때",
  chunbun: "낮과 밤의 길이가 같아지는 날",
  hansik: "불을 피우지 않고 찬 음식을 먹던 날",
  ipha: "여름이 시작되는 날",
  dano: "창포물에 머리를 감던 수릿날",
  haji: "낮이 가장 긴 날",
  chobok: "삼복더위가 시작되는 날",
  jungbok: "삼복더위의 한가운데",
  malbok: "삼복더위의 마지막 고비",
  ipchu: "가을이 시작되는 날",
  chilseok: "견우와 직녀가 만나는 날",
  cheoseo: "더위가 물러가고 선선해지는 때",
  chubun: "이날부터 밤이 낮보다 길어지는 날",
  ipdong: "겨울이 시작되는 날, 김장을 준비할 때",
}

/**
 * 제철 회 화면(.scratch/sashimi/spec.md). 첨부 「월별 제철 회 총정리」 원문을 다듬은 초안이고, 추가 품종은 새로 썼다.
 * 설명은 품종마다 하나라 여러 달에 나와도 계절을 단정하지 않는다. 효능·산지는 단정하지 않는다.
 */
export const SASHIMI_COPY = {
  tab: "제철 회",
  pageTitle: (month: number) => `${month}월 제철 회`,
  count: (n: number) => `${n}종`,
  /** 그 달이 추천 달인 품종 카드의 표시. 나머지는 제철 범위에 그 달이 들어 있는 품종이다. */
  pick: "이달 추천",
  notice: "추천 시기는 참고용이에요. 지역과 자연산·양식 여부에 따라 달라요.",
  monthTitles: {
    1: "겨울 바다의 쫀득한 회",
    2: "담백한 흰살과 고소한 겨울 생선",
    3: "봄을 여는 볼락과 참돔",
    4: "도다리와 가자미가 오르는 봄",
    5: "고소함이 오르는 늦봄 회",
    6: "초여름 바다의 담백한 회",
    7: "더위에 즐기는 장어와 민어",
    8: "한여름 단단한 부시리와 갯장어",
    9: "가을 전어와 기름진 생선",
    10: "가을 깊어 살 오른 횟감",
    11: "늦가을 귀한 바리류 회",
    12: "방어와 복어의 겨울 별미",
  } satisfies Record<Month, string>,
  descriptions: {
    // 첨부 품종
    pufferfish: "담백하고 쫄깃한 식감",
    "roughscale-flounder": "단단하고 쫀득한 고급 횟감",
    searobin: "은은한 단맛과 부드러운 살결",
    "marbled-rockfish": "탄탄한 육질과 깊은 감칠맛",
    lumpfish: "겨울에 즐기는 별미 생선",
    herring: "기름진 살과 고소한 풍미",
    skate: "특유의 향과 진한 감칠맛",
    cod: "부드럽고 담백한 흰살 생선",
    halfbeak: "깔끔한 단맛과 섬세한 식감",
    "redlip-mullet": "지방이 올라 고소한 맛",
    "olive-flounder": "탄력 있는 육질과 은은한 감칠맛",
    "red-rockfish": "부드러운 살과 진한 감칠맛",
    "korean-rockfish": "탱글하고 쫄깃한 식감",
    "red-seabream": "은은한 단맛과 부드러운 육질",
    "gray-rockfish": "담백하면서 고소한 풍미",
    "spanish-mackerel": "부드러운 살과 풍부한 지방",
    mullet: "담백하고 쫄깃한 맛",
    "spring-flounder": "담백하고 부드러운 흰살 생선",
    ganjaemi: "오독한 식감과 특유의 감칠맛",
    "yellowfin-flounder": "쫀득한 육질과 은은한 단맛",
    "atka-mackerel": "지방이 있어 고소하고 진한 맛",
    "sixbar-sandperch": "담백하고 순한 흰살 생선",
    anchovy: "갓 잡았을 때 고소하고 부드러운 회",
    sardinella: "지방이 올라 고소하고 진한 맛",
    "pearl-spot-chromis": "제주에서 즐겨 먹는 고소한 별미",
    "sea-bass": "담백하고 깔끔한 흰살 생선",
    "chicken-grunt": "기름이 올라 고소한 고급 횟감",
    borimyeol: "섬세하고 담백한 흰살 생선",
    "conger-eel": "부드럽고 고소한 별미",
    "horse-mackerel": "지방이 올라 진하고 고소한 맛",
    blackfish: "쫀득한 식감과 은은한 단맛",
    hairtail: "부드러운 살과 고소한 풍미",
    "pike-conger": "탄력 있는 육질과 담백한 맛",
    "yellowstripe-jack": "단단한 식감과 균형 잡힌 감칠맛",
    "gizzard-shad": "뼈째 썰어 고소하게 먹는 회",
    mackerel: "기름지고 진한 감칠맛",
    "rock-bream": "단단한 육질과 깊은 풍미",
    "black-scraper": "담백하고 부드러운 식감",
    goedorachi: "쫄깃한 식감의 독특한 별미",
    "longtail-blackfish": "탄탄한 육질과 깊은 감칠맛",
    rabbitfish: "독특한 향이 있는 별미",
    "stone-flounder": "쫀득한 식감과 은은한 단맛",
    "longtooth-grouper": "깊고 진한 감칠맛의 고급 횟감",
    goby: "담백하고 부드러운 별미",
    "red-spotted-grouper": "탄력 있는 살과 풍부한 감칠맛",
    "banded-grouper": "단단한 육질과 깔끔한 맛",
    "black-seabream": "담백하면서 고소한 풍미",
    yellowtail: "지방이 풍부해 진하고 고소한 맛",
    // 추가 품종
    squid: "투명한 살의 달큰하고 쫄깃한 회",
    "east-sea-hanchi": "부드럽고 단맛이 도는 한치회",
    "jeju-hanchi": "얇게 썰어 먹는 연하고 단 회",
    "long-arm-octopus": "산낙지로 즐기는 쫄깃한 식감",
    "webfoot-octopus": "살짝 데친 숙회로 쫄깃하게",
    croaker: "부드럽고 차진 여름 보양식",
    pomfret: "뼈째 썰어 고소한 회",
  } satisfies Partial<Record<FoodId, string>> as Readonly<
    Partial<Record<FoodId, string>>
  >,
} as const
