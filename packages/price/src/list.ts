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
