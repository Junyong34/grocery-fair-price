// 품종 목록을 다루는 순수 함수(P1 · P2 · P4).

/** 목록에서 가장 최근 조사일. 근거 한 줄("시세는 10/23 조사")에 쓴다. 빈 목록이면 null. */
export function latestSurveyedOn(rows: readonly { surveyedOn: string }[]): string | null {
  return rows.reduce<string | null>((latest, row) => (latest == null || row.surveyedOn > latest ? row.surveyedOn : latest), null)
}

/** ids 순서대로 행을 고른다. 목록에 없는 id(지운 품종 등)는 건너뛴다. */
export function pickByIds<T extends { id: string }>(rows: readonly T[], ids: readonly string[]): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]))
  return ids.flatMap((id) => {
    const row = byId.get(id)
    return row ? [row] : []
  })
}

/**
 * 같은 카테고리의 다른 품종 limit개(P3 아래 "다른 품종"). 그 품종 바로 다음부터 목록 끝에서 처음으로 돌아가며 고른다.
 * 맨 앞 몇 개만 고르면 모든 상세가 같은 품종으로만 이어지므로, 품종마다 이웃을 달리해 카테고리 안 모든 상세가 서로 이어지게 한다.
 * 목록에 없는 id면 빈 배열.
 */
export function relatedInCategory<T extends { id: string; category: string }>(rows: readonly T[], id: string, limit: number): T[] {
  const category = rows.find((row) => row.id === id)?.category
  if (category == null) return []
  const same = rows.filter((row) => row.category === category)
  const at = same.findIndex((row) => row.id === id)
  return [...same.slice(at + 1), ...same.slice(0, at)].slice(0, limit)
}
