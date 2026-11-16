// 인쇄물이 그리는 데이터와 그 해시. 만든 PDF가 옛것인지(에디션 생성 기록의 dataHash) 이 해시로 판단한다.
// 종류마다 렌더러가 import하는 데이터 모듈을 PRINT_DATA_MODULES에 적는다. 렌더러가 새 데이터 모듈을 읽기 시작했는데
// 여기 없으면 apps/web/features/print/print-inputs.test.ts가 실패한다(렌더러의 import를 따라가 비교한다).
//
// 모듈이 내보내는 값 가운데 함수가 아닌 것(상수·표·Set)을 통째로 해시한다. 함수 안의 계산 규칙이 바뀐 것은 코드 변경이라 여기서 잡지 않는다.
// 공휴일은 전 연도 데이터라 사양의 해 것만 넣는다. 그림 SVG의 획 자체는 보지 않는다(그림 유무만 drawn-foods로 본다).
import * as holidays from "../calendar/holidays"
import * as copy from "../data/copy"
import * as drawnFoods from "../data/drawn-foods.generated"
import * as familiarity from "../data/food-familiarity"
import * as foodSizes from "../data/food-sizes"
import * as foods from "../data/foods"
import * as foodRows from "../data/foods.generated"
import * as infantArt from "../data/infant-art"
import * as infantFruits from "../data/infant-fruits"
import * as infantPairings from "../data/infant-pairings"
import * as months from "../data/months"
import * as seasons from "../data/seasons"
import { stableHash, type PrintKind, type PrintSpec } from "./spec"

/** 해시에 넣을 수 있는 데이터 모듈. 키는 packages/seasonal/src 아래 경로(확장자 없음)다. */
const MODULES = {
  "data/copy": copy,
  "data/drawn-foods.generated": drawnFoods,
  "data/food-familiarity": familiarity,
  "data/food-sizes": foodSizes,
  "data/foods": foods,
  "data/foods.generated": foodRows,
  "data/infant-art": infantArt,
  "data/infant-fruits": infantFruits,
  "data/infant-pairings": infantPairings,
  "data/months": months,
  "data/seasons": seasons,
} as const

/** 공휴일은 모듈을 통째로 넣지 않고 사양의 해 것만 넣는다. */
const HOLIDAYS = "calendar/holidays"

export type PrintDataModule = keyof typeof MODULES | typeof HOLIDAYS

const SEASONAL: readonly PrintDataModule[] = [
  HOLIDAYS,
  "data/drawn-foods.generated",
  "data/food-familiarity",
  "data/food-sizes",
  "data/foods",
  "data/foods.generated",
  "data/months",
  "data/seasons",
]

/** 인쇄물 종류마다 렌더러가 읽는 데이터 모듈. */
export const PRINT_DATA_MODULES: Readonly<Record<PrintKind, readonly PrintDataModule[]>> = {
  monthly: SEASONAL,
  "year-sheet": SEASONAL,
  "season-poster": SEASONAL,
  "month-poster": SEASONAL,
  "baby-food-pairings": [
    "data/copy",
    "data/drawn-foods.generated",
    "data/foods",
    "data/foods.generated",
    "data/infant-art",
    "data/infant-pairings",
    "data/months",
    "data/seasons",
  ],
  "baby-food-fruits": ["data/copy", "data/foods.generated", "data/infant-art", "data/infant-fruits"],
}

/** 이 사양의 인쇄물이 그리는 데이터의 해시. 사양이 같아도 이 값이 바뀌면 이미 만든 PDF에는 옛 데이터가 남아 있다. */
export function printDataHash(spec: PrintSpec): string {
  const year = "year" in spec ? spec.year : undefined
  return stableHash(
    Object.fromEntries(
      PRINT_DATA_MODULES[spec.kind].map((name) => [
        name,
        name === HOLIDAYS ? holidaysOf(year) : dataOf(MODULES[name]),
      ])
    )
  )
}

function holidaysOf(year: number | undefined) {
  if (year === undefined) return null
  return Array.from({ length: 12 }, (_, i) => holidays.holidaysInMonth(year, i + 1))
}

/** 모듈이 내보내는 값 가운데 함수가 아닌 것. Set·Map은 내용이 해시에 들어가도록 배열로 바꾼다. */
function dataOf(module: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(module)
      .filter(([, value]) => typeof value !== "function")
      .map(([key, value]) => [key, plain(value)])
  )
}

function plain(value: unknown): unknown {
  if (value instanceof Set) return [...value].map(plain).sort()
  if (value instanceof Map) return [...value.entries()].map(([key, item]) => [plain(key), plain(item)])
  if (Array.isArray(value)) return value.map(plain)
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, typeof item === "function" ? null : plain(item)])
    )
  return value
}
