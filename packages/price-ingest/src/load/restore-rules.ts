// 보존 기간 밖 재등록의 규칙 (pipeline 3-3 "보존 기간이 지난 행이 다시 등록되어 오면", ingest-schedule/09). 순수 함수.
// DB·원본을 읽고 쓰는 쪽은 restore.ts.
type PriceFields = {
  price_raw: number
  promo_discount: boolean | null
  promo_one_plus_one: boolean | null
  promo_from: string | null
  promo_to: string | null
}

// 정정인가: 가격·행사가 바뀌었다. 등록 시각만 바뀐 것은 정정이 아니다 (kamis.md 6-2).
// 이전 값을 모르면(그날 원본이 지워졌거나 처음 보는 키) 후보로 본다
export function isCorrection(previous: PriceFields | undefined, next: PriceFields): boolean {
  if (previous === undefined) return true
  return (
    previous.price_raw !== next.price_raw ||
    previous.promo_discount !== next.promo_discount ||
    previous.promo_one_plus_one !== next.promo_one_plus_one ||
    previous.promo_from !== next.promo_from ||
    previous.promo_to !== next.promo_to
  )
}

// KAMIS 관측값 보존 기간 안의 행(keepFrom 이후)과 밖의 행. 밖의 행은 관측값에 넣지 않는다 (3-9 보관 1)
export function splitByRetention<Row extends { obs_date: string }>(rows: readonly Row[], keepFrom: string): { kept: Row[]; outdated: Row[] } {
  return { kept: rows.filter((r) => r.obs_date >= keepFrom), outdated: rows.filter((r) => r.obs_date < keepFrom) }
}

// 한 (품종, 규격, 조사일)의 집계 한 칸 (단계 × 범위)
export type QuoteCell = { price_tier: string; scope_key: string; n: number; value: number }

const cellKey = (c: QuoteCell) => `${c.price_tier}|${c.scope_key}`

// 원본에서 다시 만든 집계로 바꿀지 (3-3 4). 지금 있는 칸 중 하나라도 다시 만든 쪽에 없거나 표본 수가 적으면 불완전이라 그대로 둔다
export function rebuildVerdict(current: readonly QuoteCell[], rebuilt: readonly QuoteCell[]): { result: "rebuilt" | "kept"; changed: boolean } {
  const next = new Map(rebuilt.map((c) => [cellKey(c), c]))
  for (const c of current) {
    const r = next.get(cellKey(c))
    if (r === undefined || r.n < c.n) return { result: "kept", changed: false }
  }
  const before = new Map(current.map((c) => [cellKey(c), c]))
  const changed =
    rebuilt.length !== current.length ||
    rebuilt.some((r) => {
      const c = before.get(cellKey(r))
      return c === undefined || c.n !== r.n || Number(c.value) !== Number(r.value)
    })
  return { result: "rebuilt", changed }
}
