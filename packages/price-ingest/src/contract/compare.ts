// 기준(baseline)과 실측을 비교한다. 실패와 경고를 나눈다.
//   실패: 타입이 바뀜, 코드가 사라짐, 건수가 허용 범위를 벗어남
//   경고: 필드 경로가 생기거나 사라짐 (선택 필드는 데이터에 따라 있다 없다 한다), 새 코드가 생김
// 필드 이름·필수 여부의 엄격한 검사는 계약 스키마(strict)가 맡는다.
import type { Shape } from "./shape.ts"

export type ProbeBaseline = {
  shape: Shape
  codes: Record<string, string[]>
  rowCount: number
}

export type Verdict = {
  failures: string[]
  warnings: string[]
}

// 건수는 기준의 ±10% (최소 3건) 안이면 같다고 본다. 축산·상품 수는 날마다 조금 달라진다 (chamgagyeok.md 0장).
const COUNT_TOLERANCE = 0.1
const COUNT_MIN_SLACK = 3

export function compareProbe(id: string, live: ProbeBaseline, base: ProbeBaseline | undefined): Verdict {
  if (!base) {
    return { failures: [`${id}: 기준이 없다. pnpm contract:baseline으로 먼저 만든다`], warnings: [] }
  }
  const failures: string[] = []
  const warnings: string[] = []

  for (const [path, types] of Object.entries(base.shape)) {
    const now = live.shape[path]
    if (!now) {
      warnings.push(`${id}: 사라진 필드 ${path} (${types.join("|")})`)
    } else if (types.join("|") !== now.join("|")) {
      failures.push(`${id}: 타입 변경 ${path} ${types.join("|")} → ${now.join("|")}`)
    }
  }
  for (const path of Object.keys(live.shape)) {
    if (!base.shape[path]) warnings.push(`${id}: 새 필드 ${path} (${(live.shape[path] ?? []).join("|")})`)
  }

  for (const [key, baseValues] of Object.entries(base.codes)) {
    const liveValues = live.codes[key] ?? []
    const removed = baseValues.filter((value) => !liveValues.includes(value))
    const added = liveValues.filter((value) => !baseValues.includes(value))
    if (removed.length > 0) failures.push(`${id}: 사라진 코드 ${key}: ${removed.join(", ")}`)
    if (added.length > 0) warnings.push(`${id}: 새 코드 ${key}: ${added.join(", ")}`)
  }

  const allowed = Math.max(COUNT_MIN_SLACK, Math.round(base.rowCount * COUNT_TOLERANCE))
  if (Math.abs(live.rowCount - base.rowCount) > allowed) {
    failures.push(`${id}: 건수 차이 큼. 기준 ${base.rowCount} → 실측 ${live.rowCount} (허용 ±${allowed})`)
  }

  return { failures, warnings }
}
