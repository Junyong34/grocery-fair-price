// 품종 카탈로그: 운영 DB의 분류 표와 매핑의 원본 (ingest-foundation/08).
// 사람이 읽는 표는 grocery-price/docs/30-data/variety-list.md이고, 테스트가 둘이 같은지 본다.
//
// 원천 키 표기 (규격마다):
//   KAMIS  `품목-품종-등급` (구분 01 소매만). 품종 `*`는 철마다 바뀌는 코드 (배추·무)
//   축평원 `축종-품목코드-구분명`
//   참가격 goodId (신선식품만, 가공식품은 품종에 잇지 않는다)

export type CategoryDef = { slug: string; name: string }
export type ItemDef = { slug: string; name: string; category: string }

export type SpecDef = {
  slug: string
  name: string
  kamis?: readonly string[]
  ekape?: readonly string[]
  chamga?: readonly number[]
}

// 기준 단위 (variety-list.md 규칙 5)
export type BaseUnit = "100g" | "1kg" | "1개" | "30구" | "1L"

export type VarietyDef = {
  slug: string
  name: string
  item: string
  unit: BaseUnit
  specs: readonly SpecDef[] // 첫째가 기본 규격
  seasonal?: readonly string[] // packages/seasonal의 품종 id
}

export const BASE_UNITS: Record<BaseUnit, { base_unit: "g" | "ea" | "ml"; base_unit_qty: number }> = {
  "100g": { base_unit: "g", base_unit_qty: 100 },
  "1kg": { base_unit: "g", base_unit_qty: 1000 },
  "1개": { base_unit: "ea", base_unit_qty: 1 },
  "30구": { base_unit: "ea", base_unit_qty: 30 },
  "1L": { base_unit: "ml", base_unit_qty: 1000 },
}

export const CATEGORIES: readonly CategoryDef[] = [
  { slug: "grain", name: "쌀·잡곡·견과" },
  { slug: "vegetable", name: "채소" },
  { slug: "fruit", name: "과일" },
  { slug: "meat", name: "정육·계란" },
  { slug: "seafood", name: "수산" },
  { slug: "dried", name: "건어물·양념" },
]

export const ITEMS: readonly ItemDef[] = [
  { slug: "rice", name: "쌀", category: "grain" },
  { slug: "grains", name: "잡곡", category: "grain" },
  { slug: "nuts", name: "견과", category: "grain" },
  { slug: "napa-cabbage", name: "배추", category: "vegetable" },
  { slug: "cabbage", name: "양배추", category: "vegetable" },
  { slug: "leafy", name: "잎채소", category: "vegetable" },
  { slug: "root", name: "뿌리채소", category: "vegetable" },
  { slug: "seasoning-veg", name: "양념채소", category: "vegetable" },
  { slug: "pepper", name: "고추", category: "vegetable" },
  { slug: "fruit-veg", name: "열매채소", category: "vegetable" },
  { slug: "mushroom", name: "버섯", category: "vegetable" },
  { slug: "namul", name: "나물", category: "vegetable" },
  { slug: "apple", name: "사과", category: "fruit" },
  { slug: "pear", name: "배", category: "fruit" },
  { slug: "peach", name: "복숭아", category: "fruit" },
  { slug: "grape", name: "포도", category: "fruit" },
  { slug: "citrus", name: "감귤", category: "fruit" },
  { slug: "persimmon", name: "감", category: "fruit" },
  { slug: "melon", name: "참외·수박", category: "fruit" },
  { slug: "kiwi", name: "키위", category: "fruit" },
  { slug: "imported-fruit", name: "수입과일", category: "fruit" },
  { slug: "beef", name: "소고기", category: "meat" },
  { slug: "pork", name: "돼지고기", category: "meat" },
  { slug: "chicken", name: "닭고기", category: "meat" },
  { slug: "egg", name: "계란", category: "meat" },
  { slug: "milk", name: "우유", category: "meat" },
  { slug: "mackerel", name: "고등어", category: "seafood" },
  { slug: "fish", name: "생선", category: "seafood" },
  { slug: "squid-octopus", name: "오징어·문어", category: "seafood" },
  { slug: "crustacean", name: "갑각류", category: "seafood" },
  { slug: "shellfish", name: "조개", category: "seafood" },
  { slug: "dried-seafood", name: "건어물", category: "dried" },
  { slug: "seasoning", name: "양념", category: "dried" },
]

// ── 규격 도우미 ─────────────────────────────────────────────

type Keys = Omit<SpecDef, "slug" | "name">

// 규격을 가르지 않는 품종
const one = (keys: Keys): SpecDef[] => [{ slug: "default", name: "기본", ...keys }]

// 상품(04)·중품(05). codes는 `품목-품종`, 참가격은 상품에 둔다
const grades = (codes: readonly string[], chamga?: readonly number[]): SpecDef[] => [
  { slug: "top", name: "상품", kamis: codes.map((c) => `${c}-04`), ...(chamga ? { chamga } : {}) },
  { slug: "mid", name: "중품", kamis: codes.map((c) => `${c}-05`) },
]

// 한우 부위: KAMIS 등급 1=1++, 2=1+, 3=1. 축평원은 1+·1등급만
const hanwoo = (cut: string, chamga?: { plus: number; one: number }): SpecDef[] => [
  { slug: "grade-1plus", name: "1+등급", kamis: [`4301-${cut}-2`], ekape: [`4301-${cut}-1+등급`], ...(chamga ? { chamga: [chamga.plus] } : {}) },
  { slug: "grade-1pp", name: "1++등급", kamis: [`4301-${cut}-1`] },
  { slug: "grade-1", name: "1등급", kamis: [`4301-${cut}-3`], ekape: [`4301-${cut}-1등급`], ...(chamga ? { chamga: [chamga.one] } : {}) },
]

// ── 품종 ────────────────────────────────────────────────────

export const VARIETIES: readonly VarietyDef[] = [
  // 쌀·잡곡·견과
  { slug: "rice", name: "쌀", item: "rice", unit: "1kg", seasonal: ["rice"], specs: [
    { slug: "regular", name: "일반", kamis: ["111-01-04", "111-10-04"], chamga: [1568, 1569, 1570, 1571, 1572, 1739, 1782, 1783, 1784, 1785] },
    { slug: "new-crop", name: "햅쌀", kamis: ["111-05-04", "111-11-04"] },
  ] },
  { slug: "glutinous-rice", name: "찹쌀", item: "rice", unit: "1kg", seasonal: ["glutinous-rice"], specs: one({ kamis: ["112-01-04"] }) },
  { slug: "brown-rice", name: "현미", item: "rice", unit: "1kg", specs: one({ kamis: ["115-01-04"], chamga: [1576, 1578, 1819] }) },
  { slug: "mixed-grains", name: "혼합곡", item: "grains", unit: "1kg", specs: one({ kamis: ["113-01-04"] }) },
  { slug: "barley", name: "보리쌀", item: "grains", unit: "1kg", seasonal: ["barley"], specs: one({ kamis: ["121-04-04"] }) },
  { slug: "soybean", name: "콩", item: "grains", unit: "100g", specs: one({ kamis: ["141-01-04"] }) },
  { slug: "red-bean", name: "팥", item: "grains", unit: "100g", seasonal: ["red-bean"], specs: one({ kamis: ["142-00-04"] }) },
  { slug: "mung-bean", name: "녹두", item: "grains", unit: "100g", seasonal: ["mung-bean"], specs: one({ kamis: ["143-00-04"] }) },
  // 참가격 볶음참깨(1738·1786~1789)는 원산지가 없어 아직 잇지 않는다
  { slug: "sesame-kr", name: "참깨(국산)", item: "nuts", unit: "100g", seasonal: ["sesame-seed"], specs: one({ kamis: ["312-01-04"] }) },
  { slug: "sesame-cn", name: "참깨(중국)", item: "nuts", unit: "100g", seasonal: ["sesame-seed"], specs: one({ kamis: ["312-02-05"] }) },
  { slug: "peanut-kr", name: "땅콩(국산)", item: "nuts", unit: "100g", seasonal: ["peanut"], specs: one({ kamis: ["314-01-04"] }) },
  { slug: "peanut-imported", name: "땅콩(수입)", item: "nuts", unit: "100g", seasonal: ["peanut"], specs: one({ kamis: ["314-02-05"] }) },
  { slug: "walnut-imported", name: "호두(수입)", item: "nuts", unit: "100g", seasonal: ["walnut"], specs: one({ kamis: ["318-00-05"] }) },
  { slug: "almond-imported", name: "아몬드(수입)", item: "nuts", unit: "100g", specs: one({ kamis: ["319-00-05"] }) },

  // 채소
  { slug: "napa-cabbage", name: "배추", item: "napa-cabbage", unit: "1개", seasonal: ["napa-cabbage"], specs: grades(["211-*"], [302]) },
  { slug: "baby-napa-cabbage", name: "알배기배추", item: "napa-cabbage", unit: "1개", specs: grades(["279-00"]) },
  { slug: "eolgari-cabbage", name: "얼갈이배추", item: "napa-cabbage", unit: "100g", seasonal: ["eolgari-cabbage"], specs: one({ kamis: ["215-00-04"] }) },
  { slug: "cabbage", name: "양배추", item: "cabbage", unit: "1개", seasonal: ["cabbage"], specs: grades(["212-00"], [1039]) },
  { slug: "spinach", name: "시금치", item: "leafy", unit: "100g", seasonal: ["spinach"], specs: one({ kamis: ["213-00-04"], chamga: [927] }) },
  { slug: "lettuce", name: "상추", item: "leafy", unit: "100g", seasonal: ["lettuce"], specs: [
    { slug: "red", name: "적", kamis: ["214-01-04"], chamga: [1037] },
    { slug: "green", name: "청", kamis: ["214-02-04"] },
  ] },
  { slug: "perilla-leaf", name: "깻잎", item: "leafy", unit: "100g", specs: one({ kamis: ["253-00-04"], chamga: [1036] }) },
  { slug: "water-dropwort", name: "미나리", item: "leafy", unit: "100g", seasonal: ["water-dropwort"], specs: one({ kamis: ["252-00-04"] }) },
  { slug: "garlic-chive", name: "부추", item: "leafy", unit: "100g", seasonal: ["garlic-chive"], specs: one({ kamis: ["254-00-04"] }) },
  { slug: "young-radish", name: "열무", item: "leafy", unit: "100g", seasonal: ["young-radish"], specs: one({ kamis: ["233-00-04"] }) },
  { slug: "radish", name: "무", item: "root", unit: "1개", seasonal: ["radish"], specs: grades(["231-*"], [309]) },
  { slug: "carrot", name: "당근", item: "root", unit: "100g", seasonal: ["carrot"], specs: grades(["232-01"], [928]) },
  { slug: "potato", name: "감자", item: "root", unit: "100g", seasonal: ["potato"], specs: grades(["152-01"], [929]) },
  { slug: "sweet-potato", name: "고구마", item: "root", unit: "100g", seasonal: ["sweet-potato"], specs: grades(["151-00"], [930, 943]) },
  { slug: "ginger", name: "생강", item: "root", unit: "100g", seasonal: ["ginger"], specs: one({ kamis: ["247-00-04"] }) },
  { slug: "onion", name: "양파", item: "seasoning-veg", unit: "100g", seasonal: ["onion"], specs: one({ kamis: ["245-00-04"], chamga: [295] }) },
  { slug: "green-onion", name: "대파", item: "seasoning-veg", unit: "100g", seasonal: ["green-onion"], specs: one({ kamis: ["246-00-04"], chamga: [935] }) },
  { slug: "scallion", name: "쪽파", item: "seasoning-veg", unit: "100g", seasonal: ["scallion"], specs: one({ kamis: ["246-02-04"], chamga: [1040] }) },
  { slug: "peeled-garlic-kr", name: "깐마늘(국산)", item: "seasoning-veg", unit: "100g", seasonal: ["garlic"], specs: grades(["258-01"], [936]) },
  { slug: "green-chili", name: "풋고추", item: "pepper", unit: "100g", specs: one({ kamis: ["242-00-04"], chamga: [933] }) },
  { slug: "cheongyang-chili", name: "청양고추", item: "pepper", unit: "100g", specs: grades(["242-03"]) },
  { slug: "shishito-pepper", name: "꽈리고추", item: "pepper", unit: "100g", seasonal: ["shishito-pepper"], specs: one({ kamis: ["242-02-04"] }) },
  { slug: "cucumber-chili", name: "오이맛고추", item: "pepper", unit: "100g", specs: one({ kamis: ["242-04-04"] }) },
  { slug: "red-chili", name: "홍고추", item: "pepper", unit: "100g", seasonal: ["red-chili"], specs: one({ kamis: ["243-00-04"] }) },
  { slug: "cucumber", name: "오이", item: "fruit-veg", unit: "1개", seasonal: ["cucumber"], specs: [
    { slug: "dadagi", name: "다다기", kamis: ["223-02-04"], chamga: [945] },
    { slug: "gasi", name: "가시", kamis: ["223-01-04"] },
    { slug: "chwicheong", name: "취청", kamis: ["223-03-04"] },
    { slug: "dadagi-mid", name: "다다기 중품", kamis: ["223-02-05"] },
  ] },
  { slug: "korean-zucchini", name: "애호박", item: "fruit-veg", unit: "1개", seasonal: ["korean-zucchini"], specs: one({ kamis: ["224-01-04"], chamga: [934] }) },
  { slug: "zucchini", name: "쥬키니", item: "fruit-veg", unit: "1개", specs: one({ kamis: ["224-02-04"] }) },
  { slug: "eggplant", name: "가지", item: "fruit-veg", unit: "1개", seasonal: ["eggplant"], specs: one({ kamis: ["251-00-04"] }) },
  { slug: "tomato", name: "토마토", item: "fruit-veg", unit: "100g", seasonal: ["tomato"], specs: one({ kamis: ["225-00-04"] }) },
  { slug: "cherry-tomato", name: "방울토마토", item: "fruit-veg", unit: "100g", seasonal: ["cherry-tomato"], specs: one({ kamis: ["422-01-04"] }) },
  { slug: "date-cherry-tomato", name: "대추방울토마토", item: "fruit-veg", unit: "100g", specs: one({ kamis: ["422-02-04"] }) },
  { slug: "bell-pepper", name: "피망", item: "fruit-veg", unit: "100g", seasonal: ["bell-pepper"], specs: one({ kamis: ["255-00-04"] }) },
  { slug: "paprika", name: "파프리카", item: "fruit-veg", unit: "1개", seasonal: ["paprika"], specs: grades(["256-00"]) },
  { slug: "broccoli", name: "브로콜리", item: "fruit-veg", unit: "1개", seasonal: ["broccoli"], specs: one({ kamis: ["280-00-04"] }) },
  { slug: "oyster-mushroom", name: "느타리버섯", item: "mushroom", unit: "100g", specs: one({ kamis: ["315-00-04"], chamga: [944] }) },
  { slug: "baby-oyster-mushroom", name: "애느타리버섯", item: "mushroom", unit: "100g", specs: one({ kamis: ["315-01-04"] }) },
  { slug: "enoki-mushroom", name: "팽이버섯", item: "mushroom", unit: "100g", specs: one({ kamis: ["316-00-04"] }) },
  { slug: "king-oyster-mushroom", name: "새송이버섯", item: "mushroom", unit: "100g", specs: grades(["317-00"]) },
  { slug: "button-mushroom", name: "양송이버섯", item: "mushroom", unit: "100g", specs: one({ chamga: [931] }) },
  { slug: "bean-sprouts", name: "콩나물", item: "namul", unit: "100g", specs: one({ chamga: [1395, 1623] }) },

  // 과일
  { slug: "apple", name: "사과", item: "apple", unit: "1개", seasonal: ["apple"], specs: grades(["411-07", "411-08"]) },
  { slug: "pear", name: "배", item: "pear", unit: "1개", seasonal: ["pear"], specs: grades(["412-01"]) },
  { slug: "peach", name: "복숭아", item: "peach", unit: "1개", seasonal: ["peach"], specs: grades(["413-01"]) },
  { slug: "campbell-grape", name: "캠벨얼리", item: "grape", unit: "100g", seasonal: ["green-grape"], specs: one({ kamis: ["414-01-24"] }) },
  { slug: "kyoho-grape", name: "거봉", item: "grape", unit: "100g", specs: one({ kamis: ["414-02-24"] }) },
  { slug: "shine-muscat", name: "샤인머스켓", item: "grape", unit: "100g", specs: one({ kamis: ["414-12-24"] }) },
  { slug: "mandarin", name: "감귤", item: "citrus", unit: "1개", seasonal: ["mandarin"], specs: [
    { slug: "open-m", name: "노지 M", kamis: ["415-01-15"] },
    { slug: "open-s", name: "노지 S", kamis: ["415-01-16"] },
    { slug: "greenhouse-m", name: "시설 M", kamis: ["415-02-15"] },
    { slug: "greenhouse-s", name: "시설 S", kamis: ["415-02-16"] },
  ] },
  { slug: "sweet-persimmon", name: "단감", item: "persimmon", unit: "1개", seasonal: ["persimmon"], specs: grades(["416-00"]) },
  { slug: "watermelon", name: "수박", item: "melon", unit: "1개", seasonal: ["watermelon"], specs: grades(["221-00"]) },
  { slug: "oriental-melon", name: "참외", item: "melon", unit: "1개", seasonal: ["oriental-melon"], specs: grades(["222-00"]) },
  { slug: "melon", name: "멜론", item: "melon", unit: "1개", seasonal: ["melon"], specs: one({ kamis: ["257-00-04"] }) },
  // KAMIS 2026-09-01부터 키위 437. 그 전 참다래 419는 잇지 않는다
  { slug: "gold-kiwi", name: "골드키위", item: "kiwi", unit: "1개", seasonal: ["kiwi"], specs: grades(["437-01"]) },
  { slug: "banana", name: "바나나", item: "imported-fruit", unit: "100g", specs: grades(["418-02"]) },
  { slug: "pineapple", name: "파인애플", item: "imported-fruit", unit: "1개", specs: grades(["420-02"]) },
  { slug: "orange", name: "오렌지", item: "imported-fruit", unit: "1개", specs: one({ kamis: ["421-06-05"] }) },
  { slug: "lemon", name: "레몬", item: "imported-fruit", unit: "1개", specs: grades(["424-00"]) },
  { slug: "cherry", name: "체리", item: "imported-fruit", unit: "100g", seasonal: ["cherry"], specs: one({ kamis: ["425-00-04"] }) },
  { slug: "mango", name: "망고", item: "imported-fruit", unit: "1개", specs: one({ kamis: ["428-00-04"] }) },
  { slug: "frozen-blueberry", name: "블루베리(냉동)", item: "imported-fruit", unit: "100g", seasonal: ["blueberry"], specs: one({ kamis: ["429-02-04"] }) },
  { slug: "avocado", name: "아보카도", item: "imported-fruit", unit: "1개", specs: one({ kamis: ["430-00-04"] }) },

  // 정육·계란
  { slug: "hanwoo-tenderloin", name: "한우 안심", item: "beef", unit: "100g", specs: hanwoo("21") },
  { slug: "hanwoo-sirloin", name: "한우 등심", item: "beef", unit: "100g", specs: hanwoo("22", { plus: 248, one: 50 }) },
  { slug: "hanwoo-round", name: "한우 설도", item: "beef", unit: "100g", specs: hanwoo("36") },
  { slug: "hanwoo-brisket", name: "한우 양지", item: "beef", unit: "100g", specs: hanwoo("40") },
  { slug: "hanwoo-ribs", name: "한우 갈비", item: "beef", unit: "100g", specs: hanwoo("50") },
  { slug: "hanwoo-bulgogi", name: "한우 불고기", item: "beef", unit: "100g", specs: [
    { slug: "grade-1plus", name: "1+등급", chamga: [247] },
    { slug: "grade-1", name: "1등급", chamga: [157] },
  ] },
  { slug: "us-beef-ribs", name: "미국산 갈비", item: "beef", unit: "100g", specs: one({ kamis: ["4401-31-1"], ekape: ["4401-31-미국산"] }) },
  { slug: "au-beef-ribs", name: "호주산 갈비", item: "beef", unit: "100g", specs: one({ kamis: ["4401-31-2"], ekape: ["4401-31-호주산"] }) },
  { slug: "us-beef-rib-finger", name: "미국산 갈비살", item: "beef", unit: "100g", specs: one({ kamis: ["4401-37-1"], ekape: ["4401-37-미국산"] }) },
  { slug: "au-beef-rib-finger", name: "호주산 갈비살", item: "beef", unit: "100g", specs: one({ kamis: ["4401-37-2"] }) },
  { slug: "us-beef-brisket", name: "미국산 양지", item: "beef", unit: "100g", specs: one({ ekape: ["4401-29-미국산"] }) },
  { slug: "au-beef-brisket", name: "호주산 양지", item: "beef", unit: "100g", specs: one({ ekape: ["4401-29-호주산"] }) },
  { slug: "us-chuck-eye-roll", name: "미국산 척아이롤", item: "beef", unit: "100g", specs: [
    { slug: "chilled", name: "냉장", ekape: ["4401-62-미국산"] },
    { slug: "frozen", name: "냉동", ekape: ["4401-68-미국산"] },
  ] },
  { slug: "au-chuck-eye-roll", name: "호주산 척아이롤", item: "beef", unit: "100g", specs: [
    { slug: "chilled", name: "냉장", ekape: ["4401-62-호주산"] },
    { slug: "frozen", name: "냉동", ekape: ["4401-68-호주산"] },
  ] },
  { slug: "pork-belly", name: "삼겹살", item: "pork", unit: "100g", specs: one({ kamis: ["4304-27-1"], ekape: ["4304-27-구분없음"], chamga: [246] }) },
  { slug: "pork-neck", name: "목심", item: "pork", unit: "100g", specs: one({ kamis: ["4304-68-1"], ekape: ["4304-68-구분없음"], chamga: [1120] }) },
  { slug: "pork-shoulder", name: "앞다리", item: "pork", unit: "100g", specs: one({ kamis: ["4304-25-1"], ekape: ["4304-25-구분없음"] }) },
  { slug: "pork-ribs", name: "돼지갈비", item: "pork", unit: "100g", specs: one({ kamis: ["4304-28-1"], ekape: ["4304-28-구분없음"] }) },
  { slug: "imported-pork-belly", name: "수입 삼겹살", item: "pork", unit: "100g", specs: one({ kamis: ["4402-27-1"], ekape: ["4402-27-구분없음"] }) },
  { slug: "broiler", name: "닭(육계)", item: "chicken", unit: "100g", specs: [
    { slug: "per-kg", name: "kg 단위", kamis: ["9901-99-1"], ekape: ["9901-99-구분없음"], chamga: [1626] },
    { slug: "size-9", name: "9호", kamis: ["9901-02-1"] },
    { slug: "size-10", name: "10호", kamis: ["9901-03-1"] },
    { slug: "size-11", name: "11호", kamis: ["9901-04-1"] },
    { slug: "size-12", name: "12호", kamis: ["9901-05-1"] },
  ] },
  { slug: "native-chicken", name: "토종닭", item: "chicken", unit: "100g", specs: one({ kamis: ["9901-01-1"], chamga: [144] }) },
  { slug: "egg", name: "계란", item: "egg", unit: "30구", specs: [
    { slug: "regular", name: "일반란", kamis: ["9903-21-1", "9903-23-1"], ekape: ["9903-23-일반란"], chamga: [1072, 1073, 1075, 1594, 1595, 1596, 1597, 1598, 1599, 1624] },
    { slug: "graded", name: "등급란", kamis: ["9903-21-2", "9903-23-2"] },
  ] },
  { slug: "milk", name: "우유", item: "milk", unit: "1L", specs: one({ kamis: ["9908-01-1"], ekape: ["9908-01-구분없음"] }) },

  // 수산
  { slug: "mackerel-kr", name: "고등어(국산)", item: "mackerel", unit: "1개", seasonal: ["mackerel"], specs: [
    { slug: "chilled", name: "냉장", kamis: ["611-05-20"], chamga: [924] },
    { slug: "salted", name: "염장", kamis: ["611-03-30"] },
  ] },
  { slug: "mackerel-imported", name: "고등어(수입)", item: "mackerel", unit: "1개", seasonal: ["mackerel"], specs: [
    { slug: "salted", name: "염장", kamis: ["611-08-20"] },
  ] },
  { slug: "mackerel-fillet-kr", name: "고등어필렛(국산)", item: "mackerel", unit: "100g", specs: one({ kamis: ["662-01-30"] }) },
  { slug: "mackerel-fillet-imported", name: "고등어필렛(수입)", item: "mackerel", unit: "100g", specs: one({ kamis: ["662-00-30"] }) },
  { slug: "hairtail-kr", name: "갈치(국산)", item: "fish", unit: "1개", seasonal: ["hairtail"], specs: [
    { slug: "chilled-m", name: "냉장 중", kamis: ["613-03-21"], chamga: [921] },
    { slug: "chilled-l", name: "냉장 대", kamis: ["613-03-20"] },
    { slug: "chilled-s", name: "냉장 소", kamis: ["613-03-22"] },
    { slug: "frozen-m", name: "냉동 중", kamis: ["613-04-21"], chamga: [939] },
  ] },
  { slug: "yellow-croaker", name: "참조기", item: "fish", unit: "1개", seasonal: ["yellow-croaker"], specs: [
    { slug: "chilled", name: "냉장", kamis: ["614-05-21"], chamga: [940] },
    { slug: "frozen", name: "냉동", kamis: ["614-06-21"] },
  ] },
  { slug: "gulbi", name: "굴비", item: "fish", unit: "1개", specs: one({ kamis: ["614-07-21"] }) },
  { slug: "imported-croaker", name: "부세(수입)", item: "fish", unit: "1개", specs: one({ kamis: ["649-04-30"], chamga: [1122] }) },
  { slug: "pollock", name: "명태", item: "fish", unit: "1개", seasonal: ["pollock"], specs: [
    { slug: "large", name: "대", kamis: ["615-04-20"] },
    { slug: "medium", name: "중", kamis: ["615-04-21"] },
  ] },
  { slug: "frozen-processed-pollock", name: "명태(냉동가공)", item: "fish", unit: "100g", seasonal: ["pollock"], specs: one({ kamis: ["615-05-21"] }) },
  { slug: "spanish-mackerel", name: "삼치", item: "fish", unit: "1개", seasonal: ["spanish-mackerel"], specs: one({ kamis: ["616-01-20"] }) },
  { slug: "imported-saury", name: "꽁치(수입)", item: "fish", unit: "1개", seasonal: ["saury"], specs: one({ kamis: ["612-01-30"] }) },
  { slug: "salmon", name: "연어", item: "fish", unit: "100g", specs: one({ chamga: [1589, 1590, 1592, 1716, 1717] }) },
  { slug: "coastal-squid", name: "오징어(연근해)", item: "squid-octopus", unit: "1개", seasonal: ["squid"], specs: [
    { slug: "chilled-l", name: "냉장 대", kamis: ["619-03-20"], chamga: [925] },
    { slug: "chilled-m", name: "냉장 중", kamis: ["619-03-21"] },
    { slug: "frozen-l", name: "냉동 대", kamis: ["619-04-20"], chamga: [941] },
  ] },
  { slug: "ocean-squid", name: "오징어(원양)", item: "squid-octopus", unit: "1개", seasonal: ["squid"], specs: [
    { slug: "frozen-m", name: "냉동 중", kamis: ["619-05-21"] },
    { slug: "frozen-s", name: "냉동 소", kamis: ["619-05-22"] },
  ] },
  { slug: "imported-long-arm-octopus", name: "낙지(수입)", item: "squid-octopus", unit: "100g", seasonal: ["long-arm-octopus"], specs: one({ kamis: ["664-00-30"] }) },
  { slug: "whiteleg-shrimp", name: "흰다리새우(수입)", item: "crustacean", unit: "1개", specs: one({ kamis: ["654-01-30"], chamga: [1790] }) },
  { slug: "fleshy-prawn", name: "대하", item: "crustacean", unit: "100g", seasonal: ["shrimp"], specs: one({ chamga: [1791] }) },
  { slug: "blue-crab", name: "꽃게", item: "crustacean", unit: "100g", seasonal: ["blue-crab"], specs: [
    { slug: "frozen", name: "냉동", kamis: ["656-00-30"] },
    { slug: "female-chilled", name: "암꽃게 냉장", kamis: ["656-04-30"] },
    { slug: "male-chilled", name: "수꽃게 냉장", kamis: ["656-05-30"] },
  ] },
  { slug: "abalone", name: "전복", item: "shellfish", unit: "1개", seasonal: ["abalone"], specs: one({ kamis: ["653-00-30"] }) },
  { slug: "mussel", name: "홍합", item: "shellfish", unit: "100g", seasonal: ["mussel"], specs: one({ kamis: ["658-02-30"] }) },
  { slug: "shucked-mussel", name: "깐홍합", item: "shellfish", unit: "100g", specs: one({ kamis: ["658-01-30"] }) },
  { slug: "manila-clam", name: "바지락", item: "shellfish", unit: "100g", seasonal: ["manila-clam"], specs: one({ kamis: ["661-00-30"] }) },
  { slug: "cockle", name: "새꼬막", item: "shellfish", unit: "100g", seasonal: ["cockle"], specs: one({ kamis: ["665-00-30"] }) },

  // 건어물·양념
  { slug: "dried-anchovy", name: "마른멸치", item: "dried-seafood", unit: "100g", specs: [
    { slug: "medium", name: "중멸", kamis: ["638-00-28"] },
    { slug: "large", name: "대멸", kamis: ["638-00-27"] },
    { slug: "small", name: "세멸", kamis: ["638-00-29"] },
  ] },
  { slug: "dried-squid", name: "마른오징어", item: "dried-seafood", unit: "1개", specs: one({ kamis: ["640-00-30"] }) },
  { slug: "dried-laver", name: "마른김", item: "dried-seafood", unit: "1개", specs: one({ kamis: ["641-00-30"] }) },
  { slug: "roasted-laver", name: "구운김", item: "dried-seafood", unit: "1개", specs: one({ kamis: ["641-01-30"] }) },
  { slug: "dried-seaweed", name: "마른미역", item: "dried-seafood", unit: "100g", specs: one({ kamis: ["642-00-30"] }) },
  { slug: "dried-kelp", name: "건다시마", item: "dried-seafood", unit: "100g", specs: one({ kamis: ["660-01-30"] }) },
  { slug: "dried-red-chili", name: "건고추", item: "seasoning", unit: "100g", specs: one({ kamis: ["241-00-04"] }) },
  { slug: "chili-powder-kr", name: "고춧가루(국산)", item: "seasoning", unit: "100g", specs: one({ kamis: ["248-00-04"] }) },
  { slug: "chili-powder-cn", name: "고춧가루(중국)", item: "seasoning", unit: "100g", specs: one({ kamis: ["248-01-04"] }) },
  { slug: "salted-shrimp", name: "새우젓", item: "seasoning", unit: "100g", specs: one({ kamis: ["650-00-30"] }) },
  { slug: "anchovy-sauce", name: "멸치액젓", item: "seasoning", unit: "100g", specs: one({ kamis: ["651-00-30"] }) },
  { slug: "sea-salt", name: "천일염", item: "seasoning", unit: "1kg", specs: one({ kamis: ["652-00-30"] }) },
]
