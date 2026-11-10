// 카탈로그를 바꾼 뒤 가격 쪽을 맞춘다 (ingest-foundation/09·10, catalog-scale/08).
//   refreshMappings: 규칙대로 매핑을 맞추고, 출처마다 관측값을 다시 매핑하고, 관측값이 있는 날의 일자 요약을 다시 계산한다.
//     보존 기간 밖(KAMIS 90일 넘음)의 관측값은 지워져 다시 매핑할 수 없다 (catalog-evolution/03 "재계산 범위와 한계")
// 평소가·판정 묶음을 다시 내는 일은 제안 결정(decide.ts)이 한다.
import { recomputeDailyQuote } from "../load/daily-quote.ts"
import type { Tx } from "../load/db.ts"
import { lockSource } from "../load/observation.ts"
import { remapObservations } from "../load/variety.ts"
import { seoulToday } from "../load/window.ts"

import { applyMappings } from "./apply.ts"

// 적재와 겹치지 않게 출처 lock을 잡는다
export async function refreshMappings(tx: Tx) {
  const mappings = await applyMappings(tx)
  const remapped: Record<string, number> = {}
  for (const source of ["kamis", "ekape", "chamga"] as const) {
    await lockSource(tx, source)
    remapped[source] = await remapObservations(tx, source)
  }
  const days = async (kind: string) =>
    (await tx<{ day: string }[]>`select distinct obs_date::text as day from price.observation where obs_kind = any(${kind.split(",")})`).map(
      (r) => r.day,
    )
  const today = seoulToday()
  const dailyQuote = {
    quote: await recomputeDailyQuote(tx, "quote", await days("quote_sample,quote_aggregate"), today),
    shelf_price: await recomputeDailyQuote(tx, "shelf_price", await days("shelf_price"), today),
  }
  return { ...mappings, remapped, dailyQuote }
}
