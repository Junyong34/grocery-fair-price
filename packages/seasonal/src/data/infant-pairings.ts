// 이유식 재료 궁합표. .scratch/infant-food-pairing/image-analysis.md 2절의 전사다. O·X는 원본의 분류이고, 의학적 사실로 쓰지 않는다.
// 재료가 쓰는 그림 ID는 infant-art.json(PAIRING_ART_IDS)에, 참고 링크(PAIRING_REFERENCES)는 apps/web/features/baby-food/data.ts에 있다.

import { INFANT_PAIRING_COPY } from "./copy"

export type IngredientCategory = "채소" | "과일" | "육류·수산" | "기타"

export type PairingRow = {
  /** 재료별 페이지 주소(/baby-food/pairings/[id])의 영문 id. 제철 품종 id와 같다. */
  id: string
  name: string
  category: IngredientCategory
  good: readonly string[]
  bad: readonly string[]
}

export const PAIRINGS: readonly PairingRow[] = [
  {
    id: "potato",
    name: "감자",
    good: ["고구마", "마", "양송이버섯", "애호박", "치즈", "우유"],
    bad: ["바나나", "사과", "자몽", "파인애플", "흰살생선"],
    category: "채소",
  },
  {
    id: "sweet-potato",
    name: "고구마",
    good: ["감자", "브로콜리", "당근", "사과", "밤", "비트", "양배추"],
    bad: ["땅콩", "소고기"],
    category: "채소",
  },
  {
    id: "carrot",
    name: "당근",
    good: ["고구마", "양파", "시금치", "계란", "올리브유"],
    bad: ["무", "양배추", "오이"],
    category: "채소",
  },
  {
    id: "korean-zucchini",
    name: "애호박",
    good: ["감자", "계란"],
    bad: [],
    category: "채소",
  },
  {
    id: "soybean",
    name: "콩",
    good: ["다시마"],
    bad: ["치즈"],
    category: "기타",
  },
  {
    id: "cabbage",
    name: "양배추",
    good: [
      "게",
      "고구마",
      "브로콜리",
      "사과",
      "아몬드",
      "우유",
      "자몽",
      "치즈",
      "파인애플",
      "호두",
      "흰살생선",
    ],
    bad: ["당근"],
    category: "채소",
  },
  {
    id: "broccoli",
    name: "브로콜리/콜리플라워",
    good: ["양파", "고구마", "치즈", "호두", "아몬드", "게"],
    bad: ["당근"],
    category: "채소",
  },
  {
    id: "spinach",
    name: "시금치",
    good: [
      "당근",
      "양파",
      "바나나",
      "사과",
      "계란",
      "참깨",
      "두유",
      "우유",
      "조개",
    ],
    bad: ["멸치", "두부", "근대"],
    category: "채소",
  },
  {
    id: "sweet-pumpkin",
    name: "단호박",
    good: ["계란", "양파", "팥", "현미"],
    bad: [],
    category: "채소",
  },
  {
    id: "onion",
    name: "양파",
    good: [
      "당근",
      "사과",
      "시금치",
      "양배추",
      "오미자",
      "치즈",
      "콩나물",
      "호박",
    ],
    bad: [],
    category: "채소",
  },
  {
    id: "cucumber",
    name: "오이",
    good: ["계란"],
    bad: ["무", "당근", "땅콩"],
    category: "채소",
  },
  { id: "napa-cabbage", name: "배추", good: ["무"], bad: [], category: "채소" },
  {
    id: "burdock",
    name: "우엉",
    good: ["파프리카"],
    bad: [],
    category: "채소",
  },
  {
    id: "apple",
    name: "사과",
    good: ["고구마", "양배추", "양파", "바나나", "키위", "셀러리", "당근"],
    bad: [],
    category: "과일",
  },
  {
    id: "strawberry",
    name: "딸기",
    good: ["바나나", "사과", "파프리카", "치즈", "우유"],
    bad: [],
    category: "과일",
  },
  {
    id: "banana",
    name: "바나나",
    good: [
      "우유",
      "호박",
      "멜론",
      "아보카도",
      "파인애플",
      "키위",
      "복숭아",
      "옥수수",
      "시금치",
      "브로콜리",
    ],
    bad: ["감자"],
    category: "과일",
  },
  {
    id: "blueberry",
    name: "블루베리",
    good: ["바나나"],
    bad: ["우유"],
    category: "과일",
  },
  {
    id: "beef",
    name: "소고기",
    good: [
      "브로콜리",
      "시금치",
      "비타민",
      "애호박",
      "당근",
      "키위",
      "양배추",
      "표고버섯",
      "팽이버섯",
      "새송이버섯",
      "콩나물",
      "아욱",
      "무",
      "배",
      "두부",
      "참기름",
    ],
    bad: ["부추", "밤", "고구마"],
    category: "육류·수산",
  },
  {
    id: "chicken",
    name: "닭고기",
    good: [
      "브로콜리",
      "시금치",
      "당근",
      "양파",
      "키위",
      "단호박",
      "고구마",
      "파프리카",
      "밤",
      "청경채",
      "비트",
      "콩나물",
      "부추",
      "대추",
      "녹두",
      "표고버섯",
      "팽이버섯",
    ],
    bad: ["자두", "검은깨", "미나리"],
    category: "육류·수산",
  },
  {
    id: "pork",
    name: "돼지고기",
    good: [
      "감자",
      "표고버섯",
      "무",
      "키위",
      "마늘",
      "부추",
      "깻잎",
      "사과",
      "양파",
      "전복",
    ],
    bad: ["버터", "도라지"],
    category: "육류·수산",
  },
  {
    id: "white-fish-fillet",
    name: "흰살생선",
    good: ["두부", "당근", "브로콜리", "양배추", "양파", "완두콩"],
    bad: ["옥수수"],
    category: "육류·수산",
  },
  {
    id: "salmon",
    name: "연어",
    good: ["양파", "파프리카"],
    bad: [],
    category: "육류·수산",
  },
  {
    id: "anchovy",
    name: "멸치",
    good: ["달걀노른자", "연어", "우유", "표고버섯"],
    bad: ["시금치"],
    category: "육류·수산",
  },
  {
    id: "crab-meat",
    name: "게살",
    good: ["부추", "브로콜리", "양파", "오이", "파프리카"],
    bad: ["땅콩", "감", "귤", "팥", "찹쌀"],
    category: "육류·수산",
  },
  {
    id: "shrimp",
    name: "새우",
    good: ["아욱", "완두콩", "표고버섯", "애호박"],
    bad: ["옥수수"],
    category: "육류·수산",
  },
  {
    id: "manila-clam",
    name: "조개",
    good: ["시금치"],
    bad: ["옥수수"],
    category: "육류·수산",
  },
  {
    id: "wakame",
    name: "미역",
    good: ["두부", "콩"],
    bad: ["파"],
    category: "기타",
  },
  {
    id: "cheese",
    name: "치즈",
    good: ["브로콜리", "양파", "감자", "단호박"],
    bad: ["콩"],
    category: "기타",
  },
  {
    id: "egg",
    name: "계란",
    good: [
      "단호박",
      "당근",
      "미역",
      "시금치",
      "애호박",
      "오이",
      "청경채",
      "토마토",
      "피망",
      "브로콜리",
    ],
    bad: ["두유", "감"],
    category: "기타",
  },
  {
    id: "tofu",
    name: "두부",
    good: ["김", "미역", "비타민", "흰살생선"],
    bad: ["시금치", "치즈"],
    category: "기타",
  },
  {
    id: "milk",
    name: "우유",
    good: [
      "감자",
      "고구마",
      "단호박",
      "딸기",
      "시금치",
      "양배추",
      "양파",
      "옥수수",
      "토마토",
    ],
    bad: ["땅콩", "설탕", "시금치", "고구마", "마"],
    category: "기타",
  },
]

export const PAIRING_SHEETS = [
  { title: "채소", rows: PAIRINGS.slice(0, 9) },
  { title: "채소·과일", rows: PAIRINGS.slice(9, 17) },
  { title: "육류·수산·기타", rows: PAIRINGS.slice(17) },
]

export const PAIRING_CATEGORIES = [
  "전체",
  "채소",
  "과일",
  "육류·수산",
  "기타",
] as const

export type PairingSign = "O" | "X"

/** 다른 기준 재료 표에서 이 재료가 나온 곳. base 표에서 sign으로 적혀 있다는 뜻이다. */
export type PairingMention = { base: string; sign: PairingSign }

/** 사람이 쓴 본문 없이 색인할 최소 관계 수(O + X + 역참조). */
export const PAIRING_INDEX_MIN_RELATIONS = 5

export function findPairing(id: string): PairingRow | undefined {
  return PAIRINGS.find((row) => row.id === id)
}

/** 기준 재료 이름을 표 안의 재료 이름으로 나눈다. "브로콜리/콜리플라워"는 둘 다로, "게살"은 "게"도 함께 찾는다. */
export function termsOf(name: string): readonly string[] {
  if (name === "게살") return ["게살", "게"]
  return name.split("/")
}

/** 표 안의 상대 재료 이름(item)이 사용자가 고른 기준 재료 목록(selected)에 해당하는지 확인한다. */
export function matchesSelectedIngredient(
  item: string,
  selected: readonly string[]
): boolean {
  for (const chosen of selected) {
    if (chosen === item || termsOf(chosen).includes(item)) return true
  }
  return false
}

export type InfantPairingVerdictKind =
  | "conflict"
  | "myth-enzyme"
  | "myth-oxalate"
  | "myth-digestion"
  | "myth-sugar"
  | "myth-general"
  | "synergy-iron"
  | "synergy-fat"
  | "synergy-calcium"
  | "good-general"

export type InfantPairingExplanation = {
  kind: InfantPairingVerdictKind
  milkConflict: boolean
  cautions: readonly string[]
}

const ENZYME_MYTH_SET = new Set(["당근", "오이", "무", "양배추", "브로콜리", "브로콜리/콜리플라워"])
const OXALATE_FOODS = new Set(["시금치", "근대", "마"])
const CALCIUM_FOODS = new Set(["두부", "멸치", "우유", "치즈", "시금치", "근대"])
const DIGESTION_MYTH_PAIRS = new Set([
  "고구마+소고기",
  "고구마+땅콩",
  "밤+소고기",
  "감자+바나나",
  "감자+사과",
  "감자+흰살생선",
  "옥수수+흰살생선",
  "새우+옥수수",
  "옥수수+조개",
])

const MEAT_IRON_FOODS = new Set(["소고기", "닭고기", "돼지고기"])
const VITAMIN_C_FOODS = new Set([
  "브로콜리",
  "브로콜리/콜리플라워",
  "시금치",
  "비타민",
  "파프리카",
  "피망",
  "청경채",
  "양배추",
  "사과",
  "키위",
  "딸기",
])
const FAT_SOLUBLE_FOODS = new Set(["당근", "단호박", "애호박", "토마토", "시금치", "브로콜리", "브로콜리/콜리플라워"])
const LIPID_FOODS = new Set(["계란", "달걀노른자", "올리브유", "참기름", "치즈", "우유", "소고기", "아보카도"])
const CALCIUM_SYNERGY_FOODS = new Set(["멸치", "두부", "콩", "우유", "치즈"])
const VITAMIN_D_IODINE_FOODS = new Set(["달걀노른자", "연어", "표고버섯", "미역", "김", "다시마"])

const ALLERGEN_INGREDIENTS = new Set([
  "계란",
  "달걀노른자",
  "우유",
  "치즈",
  "두부",
  "두유",
  "콩",
  "콩나물",
  "땅콩",
  "호두",
  "아몬드",
  "참깨",
  "검은깨",
  "게",
  "게살",
  "새우",
  "조개",
  "전복",
  "흰살생선",
  "연어",
  "멸치",
  "복숭아",
  "키위",
  "자두",
  "딸기",
  "소고기",
  "돼지고기",
  "닭고기",
])

const CHOKING_INGREDIENTS = new Set([
  "땅콩",
  "호두",
  "아몬드",
  "밤",
  "완두콩",
  "옥수수",
  "콩",
  "팥",
  "블루베리",
  "팽이버섯",
])

const SODIUM_INGREDIENTS = new Set(["멸치", "치즈", "김", "미역", "다시마", "게", "게살", "조개", "새우"])
const NITRATE_INGREDIENTS = new Set(["시금치", "근대", "비트"])
const ACID_SPICE_INGREDIENTS = new Set(["자몽", "파인애플", "오미자", "마늘", "키위", "귤"])

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("+")
}

function expandIngredients(base: string, name: string): string[] {
  const list = base === "브로콜리/콜리플라워" ? ["브로콜리", name] : [base, name]
  return Array.from(new Set(list))
}

/** 원본 표에서 우유 항목 안의 O·X 중복(고구마·시금치)인지 확인한다. */
export function isMilkDuplicateConflict(base: string, name: string): boolean {
  return (
    (base === "우유" && (name === "고구마" || name === "시금치")) ||
    (name === "우유" && (base === "고구마" || base === "시금치"))
  )
}

/** 기준 재료(base)와 상대 재료(name)의 O·X 표기에 대한 영양학·이유식 해석과 주의 태그를 돌려준다. */
export function explainInfantPairing(
  base: string,
  name: string,
  sign: PairingSign
): InfantPairingExplanation {
  const milkConflict = isMilkDuplicateConflict(base, name)
  const items = expandIngredients(base, name)
  const key = pairKey(base, name)

  let kind: InfantPairingVerdictKind
  if (milkConflict) {
    kind = "conflict"
  } else if (sign === "X") {
    if (ENZYME_MYTH_SET.has(base) && ENZYME_MYTH_SET.has(name)) {
      kind = "myth-enzyme"
    } else if (
      (OXALATE_FOODS.has(base) && CALCIUM_FOODS.has(name)) ||
      (OXALATE_FOODS.has(name) && CALCIUM_FOODS.has(base))
    ) {
      kind = "myth-oxalate"
    } else if (DIGESTION_MYTH_PAIRS.has(key)) {
      kind = "myth-digestion"
    } else if (base === "우유" && name === "설탕") {
      kind = "myth-sugar"
    } else {
      kind = "myth-general"
    }
  } else {
    if (
      (MEAT_IRON_FOODS.has(base) && VITAMIN_C_FOODS.has(name)) ||
      (MEAT_IRON_FOODS.has(name) && VITAMIN_C_FOODS.has(base))
    ) {
      kind = "synergy-iron"
    } else if (
      (FAT_SOLUBLE_FOODS.has(base) && LIPID_FOODS.has(name)) ||
      (FAT_SOLUBLE_FOODS.has(name) && LIPID_FOODS.has(base))
    ) {
      kind = "synergy-fat"
    } else if (
      (CALCIUM_SYNERGY_FOODS.has(base) && VITAMIN_D_IODINE_FOODS.has(name)) ||
      (CALCIUM_SYNERGY_FOODS.has(name) && VITAMIN_D_IODINE_FOODS.has(base))
    ) {
      kind = "synergy-calcium"
    } else {
      kind = "good-general"
    }
  }

  const cautions: string[] = []
  const allergens = items.filter((item) => ALLERGEN_INGREDIENTS.has(item))
  if (allergens.length > 0) cautions.push(`allergen:${allergens.join("·")}`)

  const choking = items.filter((item) => CHOKING_INGREDIENTS.has(item))
  if (choking.length > 0) cautions.push(`choking:${choking.join("·")}`)

  const sodium = items.filter((item) => SODIUM_INGREDIENTS.has(item))
  if (sodium.length > 0) cautions.push(`sodium:${sodium.join("·")}`)

  if (items.includes("우유") || items.includes("두유")) {
    cautions.push("milkAge")
  }

  const nitrates = items.filter((item) => NITRATE_INGREDIENTS.has(item))
  if (nitrates.length > 0) cautions.push(`nitrate:${nitrates.join("·")}`)

  const acids = items.filter((item) => ACID_SPICE_INGREDIENTS.has(item))
  if (acids.length > 0) cautions.push(`acidity:${acids.join("·")}`)

  return { kind, milkConflict, cautions }
}

/** 다른 기준 재료 표에서 name이 O나 X로 나온 곳. 표 순서대로, 한 표에서 O·X 양쪽이면 둘 다 돌려준다. */
export function pairingMentions(name: string): PairingMention[] {
  const terms = termsOf(name)
  const mentions: PairingMention[] = []
  for (const row of PAIRINGS) {
    if (row.name === name) continue
    if (row.good.some((item) => terms.includes(item)))
      mentions.push({ base: row.name, sign: "O" })
    if (row.bad.some((item) => terms.includes(item)))
      mentions.push({ base: row.name, sign: "X" })
  }
  return mentions
}

export function pairingRelationCount(row: PairingRow): number {
  return row.good.length + row.bad.length + pairingMentions(row.name).length
}

/** 재료별 페이지를 색인할지. 관계가 적으면 얇은 페이지라 noindex로 두되, 사람이 쓴 본문이 있으면 색인한다. */
export function isPairingIndexable(
  row: PairingRow,
  { hasCopy }: { hasCopy: boolean }
): boolean {
  return hasCopy || pairingRelationCount(row) >= PAIRING_INDEX_MIN_RELATIONS
}

/** 표 안의 재료 이름(item)으로 기준 재료를 찾는다. "브로콜리"·"콜리플라워"는 broccoli 표다. */
export function findPairingByName(item: string): PairingRow | undefined {
  return PAIRINGS.find((row) => termsOf(row.name).includes(item))
}

/** 본문에 함께 적는 별칭. 검색어("달걀 이유식", "대구살 이유식")를 받는다. */
const PAIRING_ALIASES: Readonly<Partial<Record<string, string>>> = {
  egg: "달걀",
  "white-fish-fillet": "대구·가자미 등",
}

/** 화면과 제목에 쓰는 이름. "브로콜리/콜리플라워"는 "브로콜리·콜리플라워"로, alias면 "계란(달걀)"처럼 별칭을 붙인다. */
export function pairingDisplayName(
  row: PairingRow,
  { alias = false }: { alias?: boolean } = {}
): string {
  const name = row.name.replaceAll("/", "·")
  const extra = alias ? PAIRING_ALIASES[row.id] : undefined
  return extra ? `${name}(${extra})` : name
}

/** 재료별 페이지의 색인 여부. 사람이 쓴 본문은 INFANT_PAIRING_COPY.ingredients(04)에 있다. */
export function isPairingPageIndexable(row: PairingRow): boolean {
  return isPairingIndexable(row, {
    hasCopy: row.id in INFANT_PAIRING_COPY.ingredients,
  })
}

/** 색인하고 sitemap에 넣는 재료별 페이지. */
export const INDEXABLE_PAIRINGS: readonly PairingRow[] = PAIRINGS.filter(
  isPairingPageIndexable
)
