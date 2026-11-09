// 카탈로그를 바꾼 뒤 가격 쪽을 맞춘다 (ingest-foundation/09·10, catalog-scale/08).
//   refreshMappings: 규칙대로 매핑을 맞추고, 출처마다 관측값을 다시 매핑하고, 관측값이 있는 날의 일자 요약을 다시 계산한다.
//     보존 기간 밖(KAMIS 90일 넘음)의 관측값은 지워져 다시 매핑할 수 없다 (catalog-evolution/03 "재계산 범위와 한계")
//   refreshJudgment: 평소가(182일)와 판정 묶음을 다시 낸다. 새 품종이 다음 정기 배치를 기다리지 않고 화면에 나온다
import { writeJudgment } from "../judgment/cli.ts"
import { recomputeDailyQuote } from "../load/daily-quote.ts"
import type { Tx } from "../load/db.ts"
import { lockSource } from "../load/observation.ts"
import { remapObservations } from "../load/variety.ts"
import { seoulToday } from "../load/window.ts"
import { writeUsual } from "../usual/cli.ts"

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

// 판정 묶음 검사(MIN_KEEP_RATIO)에 걸리면 묶음은 failed로 남고 화면은 지금 묶음을 그대로 읽는다
export async function refreshJudgment(tx: Tx) {
  const usual = await writeUsual(tx, { days: 182 })
  const judgment = await writeJudgment(tx, { trigger: "catalog" })
  return { usual, judgment }
}
