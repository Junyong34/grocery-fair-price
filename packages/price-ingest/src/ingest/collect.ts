// 출처별로 API를 불러 원본 파일 재료를 모은다 (pipeline 5-1 수집 일정, 3-7 원본 파일 단위).
// 원본 파일은 한 번 실행에서 같은 기능·같은 대상 기간으로 받은 것을 하나로 묶는다 (2026-10-26 결정).
// 행은 받은 그대로(계약 스키마를 통과한 값) 호출 순서대로 잇는다. 호출 기록의 행 수가 행을 호출로 되돌리는 열쇠다.
import type { CallOptions, CallRecord, FetchLike } from "../http.ts"
import type { Json } from "../load/raw-file.ts"
import { isFoodProduct } from "../load/chamga.ts"
import {
  CHAMGA_ENDPOINT,
  fetchChamgaPrice,
  fetchChamgaProduct,
  fetchChamgaStore,
} from "../sources/chamgagyeok.ts"
import { EKAPE_ENDPOINT, fetchEkapeConsumerPrice } from "../sources/ekape.ts"
import { KAMIS_ENDPOINT, fetchKamisPerDayAll } from "../sources/kamis.ts"
import { callWithPolicy, CallBudget, SourceStopped, type Sleep, type StopReason } from "./calls.ts"
import { KAMIS_ITEMS } from "./kamis-items.ts"

export type CollectedFile = {
  endpoint: string
  label: string // 원본 파일 이름의 묶음 라벨. 같은 라벨·같은 대상 기간이면 같은 대상이다 (중복 판정)
  targetFrom: string | null
  targetTo: string | null
  rows: Json[]
  requests: CallRecord[]
}

export type Collected = {
  files: CollectedFile[]
  failedCalls: number // 다시 불러도 실패한 논리 호출 수 (출처는 계속 받는다)
  stop: StopReason | null // 출처를 멈춘 이유. 멈추기 전에 받은 것은 files에 있다
}

export type CollectContext = {
  serviceKey: string
  fetch?: FetchLike
  budget: CallBudget
  sleep: Sleep
  delays?: readonly number[]
}

// YYYY-MM-DD → YYYYMMDD
const compact = (day: string) => day.replaceAll("-", "")

export function addDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
}

// 한 파일의 호출들을 모은다. 실패한 호출은 세고 넘어가며, 출처를 멈출 오류면 멈춘 이유를 남긴다.
class FileBuilder {
  readonly file: CollectedFile
  failedCalls = 0
  stop: StopReason | null = null
  private readonly ctx: CollectContext

  constructor(ctx: CollectContext, file: Omit<CollectedFile, "rows" | "requests">) {
    this.ctx = ctx
    this.file = { ...file, rows: [], requests: [] }
  }

  private call(): CallOptions {
    return {
      serviceKey: this.ctx.serviceKey,
      fetch: this.ctx.fetch,
      onCall: (record) => {
        this.file.requests.push(record)
        this.ctx.budget.count()
      },
    }
  }

  // 받은 행을 파일에 더하고 돌려준다. 실패했거나 멈췄으면 null
  async add<Row extends object>(fetchRows: (call: CallOptions) => Promise<Row[]>): Promise<Row[] | null> {
    if (this.stop) return null
    try {
      const rows = await callWithPolicy(() => fetchRows(this.call()), this.ctx)
      this.file.rows.push(...(rows as unknown as Json[]))
      return rows
    } catch (error) {
      if (error instanceof SourceStopped) this.stop = error.reason
      else this.failedCalls += 1
      return null
    }
  }

  result(): Collected {
    return { files: [this.file], failedCalls: this.failedCalls, stop: this.stop }
  }
}

// KAMIS: 기준일 D의 D-3~D-1을 품목마다 기간 호출 한 번 (소매 01, 140개 품목)
export async function collectKamis(ctx: CollectContext, day: string): Promise<Collected> {
  const from = addDays(day, -3)
  const to = addDays(day, -1)
  const builder = new FileBuilder(ctx, { endpoint: KAMIS_ENDPOINT, label: "daily", targetFrom: from, targetTo: to })
  for (const item of KAMIS_ITEMS) {
    await builder.add((call) =>
      fetchKamisPerDayAll(call, { fromYmd: compact(from), toYmd: compact(to), ctgryCd: item.ctgryCd, itemCd: item.itemCd, seCd: "01" }),
    )
    if (builder.stop) break
  }
  return builder.result()
}

// 축평원 축종 7개 (ekape.md 2장). itemCd 없이 축종 단위로 부른다 (ekape.md 1장)
export const EKAPE_JUDGE_KINDS = ["4301", "4304", "4401", "4402", "9901", "9903", "9908"] as const

// 축평원: 기준일 D의 D-1, D-2, D-3 × 축종 7개 (하루 21회)
export async function collectEkape(ctx: CollectContext, day: string): Promise<Collected> {
  const builder = new FileBuilder(ctx, {
    endpoint: EKAPE_ENDPOINT,
    label: "daily",
    targetFrom: addDays(day, -3),
    targetTo: addDays(day, -1),
  })
  for (const offset of [-1, -2, -3]) {
    for (const judgeKind of EKAPE_JUDGE_KINDS) {
      await builder.add((call) => fetchEkapeConsumerPrice(call, { standYmd: compact(addDays(day, offset)), judgeKind }))
      if (builder.stop) return builder.result()
    }
  }
  return builder.result()
}

// 참가격: 점포·상품 마스터를 먼저 받고(06 Answer 1), 조사일마다 식품 상품 가격을 상품마다 받는다 (chamgagyeok.md 8장).
// 조사일 하나가 가격 파일 하나다. 어느 조사일을 받을지는 chamga-schedule.ts가 정한다 (10).
export async function collectChamga(ctx: CollectContext, surveyDays: readonly string[]): Promise<Collected> {
  if (surveyDays.length === 0) return { files: [], failedCalls: 0, stop: null }
  const stores = new FileBuilder(ctx, { endpoint: CHAMGA_ENDPOINT.store, label: "store-master", targetFrom: null, targetTo: null })
  await stores.add((call) => fetchChamgaStore(call, {}))
  const products = new FileBuilder(ctx, { endpoint: CHAMGA_ENDPOINT.product, label: "product-master", targetFrom: null, targetTo: null })
  const productRows = stores.stop ? null : await products.add((call) => fetchChamgaProduct(call, {}))
  // 상품 마스터가 없으면 부를 상품을 모른다. 가격은 받지 않는다
  const goods = (productRows ?? []).filter(isFoodProduct).map((product) => product.goodId)

  const parts = [stores, products]
  for (const surveyDay of surveyDays) {
    if (parts.some((part) => part.stop)) break
    const prices = new FileBuilder(ctx, { endpoint: CHAMGA_ENDPOINT.price, label: "price", targetFrom: surveyDay, targetTo: surveyDay })
    parts.push(prices)
    for (const goodId of goods) {
      await prices.add((call) => fetchChamgaPrice(call, { goodInspectDay: compact(surveyDay), goodId }))
      if (prices.stop) break
    }
  }
  return {
    files: parts.map((part) => part.file).filter((file) => file.requests.length > 0),
    failedCalls: parts.reduce((sum, part) => sum + part.failedCalls, 0),
    stop: parts.find((part) => part.stop)?.stop ?? null,
  }
}

// 조사일 감지용 상품: 여러 업태가 취급하는 3개 (chamgagyeok.md 5-4). 1000 팔도 왕뚜껑, 1395 CJ 콩나물, 1075 CJ 계란 15개
export const CHAMGA_PROBE_GOODS = ["1000", "1395", "1075"] as const

export type Detection = { found: boolean; failedCalls: number; stop: StopReason | null }

// 조사일에 가격이 들어왔는가: 감지 상품 셋 중 하나라도 행이 있으면 그렇다. 찾으면 남은 상품은 부르지 않는다.
// 감지 응답은 원본으로 남기지 않는다. 찾으면 같은 날 전체 수집이 같은 행을 다시 받는다.
export async function detectChamgaSurvey(ctx: CollectContext, surveyDay: string): Promise<Detection> {
  const probe = new FileBuilder(ctx, { endpoint: CHAMGA_ENDPOINT.price, label: "probe", targetFrom: surveyDay, targetTo: surveyDay })
  for (const goodId of CHAMGA_PROBE_GOODS) {
    const rows = await probe.add((call) => fetchChamgaPrice(call, { goodInspectDay: compact(surveyDay), goodId }))
    if (rows && rows.length > 0) return { found: true, failedCalls: probe.failedCalls, stop: null }
    if (probe.stop) break
  }
  return { found: false, failedCalls: probe.failedCalls, stop: probe.stop }
}

// 참가격: surveyDays를 주면 그 조사일들을 받는다(과거분 채우기 12). 주지 않으면 자동 모드(감지·완료 규칙, 10)
export type CollectRequest = { source: "kamis" | "ekape"; day: string } | { source: "chamga"; surveyDays?: readonly string[] }

export function collect(ctx: CollectContext, request: CollectRequest): Promise<Collected> {
  switch (request.source) {
    case "kamis":
      return collectKamis(ctx, request.day)
    case "ekape":
      return collectEkape(ctx, request.day)
    case "chamga":
      return collectChamga(ctx, request.surveyDays ?? [])
  }
}
