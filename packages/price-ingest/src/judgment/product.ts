// 참가격 상품 하나의 화면용 payload (catalog-scale/09). 순수 함수: 상품 요약(product_daily_summary) 행 → ProductDetail.
// 판정은 내지 않는다. 최근 조사일의 전국 판매가, 업태·판매처별 비교, 최근 조사일 추이, 기준 단위당 가격을 낸다.
// DB에서 읽고 묶음에 쓰는 쪽은 cli.ts(writeJudgment).
import { daysBetween } from "@workspace/price/format"
import { channelSchema } from "@workspace/price/schema"
import type { Channel, ProductDetail } from "@workspace/price/types"

/** 상품 요약 한 행. scope는 'national' | 'channel:<업태>' | 'seller:<seller.id>' */
export type SummaryRow = { scope: string; date: string; median: number; min: number; max: number; stores: number; promo: number }

export type ProductInput = {
  goodId: string
  name: string
  status: "surveyed" | "not_surveyed" | "merged"
  /** 품목 이름. 품목을 정하지 않았으면 참가격 소분류 이름 */
  item: string
  category: string
  totalQty: number | null
  /** 참가격 단위 코드: G, ML, EA, ... */
  totalUnit: string | null
  varietyId: string | null
  rows: readonly SummaryRow[]
  sellers: ReadonlyMap<number, { name: string; channel: string }>
}

/** 최근 조사일보다 이만큼 넘게 이른 상품은 stale (참가격은 2주마다 조사한다. 한 번 빠진 것까지는 active) */
const STALE_DAYS = 28
const TREND_POINTS = 12

const won = (n: number) => Math.round(n)
const trim = (n: number) => String(Number(n.toFixed(2)))

/** 용량 표시. 모르는 단위면 null */
export function sizeOf(qty: number | null, unit: string | null): string | null {
  if (qty === null || unit === null) return null
  if (unit === "G") return qty >= 1000 ? `${trim(qty / 1000)}kg` : `${trim(qty)}g`
  if (unit === "ML") return qty >= 1000 ? `${trim(qty / 1000)}L` : `${trim(qty)}ml`
  if (unit === "EA") return `${trim(qty)}개`
  return null
}

function perUnitOf(price: number, qty: number | null, unit: string | null): ProductDetail["perUnit"] {
  if (qty === null || qty <= 0) return null
  if (unit === "G") return { unit: "100g", price: won((price / qty) * 100) }
  if (unit === "ML") return { unit: "100ml", price: won((price / qty) * 100) }
  if (unit === "EA" && qty > 1) return { unit: "1개", price: won(price / qty) }
  return null
}

const asChannel = (value: string): Channel | null => {
  const parsed = channelSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

/** 상품 payload. 합쳐진 상품이나 전국 요약이 하나도 없는 상품은 null */
export function buildProduct(input: ProductInput, latestDay: string): ProductDetail | null {
  if (input.status === "merged") return null
  const national = input.rows.filter((r) => r.scope === "national").sort((a, b) => a.date.localeCompare(b.date))
  const last = national.at(-1)
  if (!last) return null
  const onLast = input.rows.filter((r) => r.date === last.date)

  const channels = onLast.flatMap((r) => {
    const channel = r.scope.startsWith("channel:") ? asChannel(r.scope.slice("channel:".length)) : null
    return channel ? [{ channel, median: won(r.median), min: r.min, max: r.max, stores: r.stores }] : []
  })
  const sellers = onLast.flatMap((r) => {
    if (!r.scope.startsWith("seller:")) return []
    const seller = input.sellers.get(Number(r.scope.slice("seller:".length)))
    const channel = seller ? asChannel(seller.channel) : null
    if (!seller || !channel) return []
    return [{ seller: seller.name, channel, price: won(r.median), min: r.min, max: r.max, stores: r.stores, promo: r.promo > 0 }]
  })

  const price = won(last.median)
  return {
    id: input.goodId,
    name: input.name,
    item: input.item,
    category: input.category,
    size: sizeOf(input.totalQty, input.totalUnit),
    perUnit: perUnitOf(price, input.totalQty, input.totalUnit),
    price,
    range: { min: last.min, max: last.max, stores: last.stores },
    surveyedOn: last.date,
    status: input.status === "not_surveyed" ? "discontinued" : daysBetween(last.date, latestDay) > STALE_DAYS ? "stale" : "active",
    channels: channels.sort((a, b) => a.median - b.median),
    sellers: sellers.sort((a, b) => a.price - b.price || a.seller.localeCompare(b.seller, "ko")),
    trend: national.slice(-TREND_POINTS).map((r) => ({ date: r.date, median: won(r.median), min: r.min })),
    varietyId: input.varietyId,
    basis: { source: "참가격", scope: "전국 판매점" },
  }
}
