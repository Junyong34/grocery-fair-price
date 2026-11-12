// 품종 원본(food-registry.json)의 형식과, 원본에서 제철달력 목록을 뽑는 함수.
// 품종의 표시명·별칭·카테고리·제철 달·근거는 food-registry.json 한 곳에서 고친다 (ADR 0006).
// 파일을 읽지 않는다. 읽는 쪽(scripts/build-foods.mjs, 테스트, 어드민)이 JSON을 넘긴다.
import { z } from "zod"

const months = z
  .array(z.number().int().min(1).max(12))
  .refine((list) => list.every((month, i) => i === 0 || list[i - 1]! < month), "달은 겹치지 않는 오름차순이어야 한다")

const evidence = z.strictObject({
  /** 근거 출처. URL이거나 저장소·prototypes 안의 자료 경로다. 옛 자료에서 옮긴 품종은 비어 있을 수 있다. */
  sources: z.array(z.string().min(1)),
  /** 출처를 확인한 날(YYYY-MM-DD). 옛 자료에서 옮긴 품종은 없다. */
  checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  /** 달을 그렇게 정한 사유. 제철 보정으로 고친 품종에 있다. */
  reason: z.string().min(1).optional(),
  /** 출처가 적은 생산·출하 시기 요약. */
  market: z.string().min(1).optional(),
  /** 근거에 붙는 단서. */
  note: z.string().min(1).optional(),
})

const entry = z.strictObject({
  /** 표시명. */
  name: z.string().min(1),
  /** 검색에 쓰는 다른 이름. */
  aliases: z.array(z.string().min(1)),
  category: z.enum(["채소", "과일", "버섯", "곡물·견과", "수산"]),
  /** 제철 달. */
  months,
  /** 대표 달. 제철 달 가운데 고른다. */
  peak: months,
  /** 제철 검증 상태. verified만 제철달력에 나온다. */
  season: z.enum(["verified", "unverified"]),
  /** 제철 달의 근거 갈래. survey: 조사로 검증, foodnuri: 정보누리 생산시기, mof: 해양수산부 자료, user: 사용자가 준 자료. */
  basis: z.enum(["survey", "foodnuri", "mof", "user"]),
  /** 그림 ID. 품종 ID와 다를 때만 적는다. */
  art: z.string().regex(/^[a-z0-9-]+$/).optional(),
  /** 국내산·자연산 같은 조건이 붙는 제철이면 true. */
  conditional: z.literal(true).optional(),
  evidence,
})

const registry = z.record(z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/), entry).superRefine((foods, context) => {
  const idByName = new Map<string, string>()
  for (const [id, food] of Object.entries(foods)) {
    const issue = (message: string) => context.addIssue({ code: "custom", message: `${id}: ${message}`, path: [id] })
    if (food.peak.some((month) => !food.months.includes(month))) issue("대표 달이 제철 달 밖에 있다")
    if (food.season === "verified" && food.months.length === 0) issue("제철 검증된 품종에 제철 달이 없다")
    const same = idByName.get(food.name)
    if (same) issue(`표시명 "${food.name}"이 ${same}와 겹친다`)
    idByName.set(food.name, id)
  }
})

export type FoodEntry = z.infer<typeof entry>
/** 품종 ID → 품종. */
export type FoodRegistry = z.infer<typeof registry>

/** 품종 원본을 검사해 돌려준다. 형식이 틀리면 어느 품종이 왜 틀렸는지 담아 던진다. */
export function parseFoodRegistry(json: unknown): FoodRegistry {
  return registry.parse(json)
}

/** 품종 원본을 파일에 쓸 글로 만든다. 품종 ID순, 달 배열은 한 줄. 쓰는 쪽이 모두 이것을 써야 diff에 바뀐 품종만 보인다. */
export function formatFoodRegistry(foods: FoodRegistry): string {
  const sorted = Object.fromEntries(Object.entries(foods).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
  const text = JSON.stringify(sorted, null, 2)
  return `${text.replace(/\[\n\s+(\d+(?:,\n\s+\d+)*)\n\s+\]/g, (_, list: string) => `[${list.replace(/,\n\s+/g, ", ")}]`)}\n`
}

/** 품종이 쓰는 그림의 ID. */
export function artIdOf(id: string, food: FoodEntry): string {
  return food.art ?? id
}

/** 제철달력에 나오는 품종 목록(foods.generated.ts의 FOOD_ROWS). 제철 검증된 품종만, 이름 가나다순. */
export function seasonalRows(foods: FoodRegistry) {
  return Object.entries(foods)
    .filter(([, food]) => food.season === "verified")
    .map(([id, food]) => ({
      id,
      name: food.name,
      aliases: food.aliases,
      category: food.category,
      months: food.months,
      peak: food.peak,
      // core: 처음부터 조사로 제철을 검증한 품종. 대표를 고를 때 앞에 둔다.
      core: food.basis === "survey",
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"))
}
