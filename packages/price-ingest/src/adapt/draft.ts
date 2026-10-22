// 관측값 초안: 원천 응답을 우리 모양으로 바꾼 결과.
// DB 번호(id)가 아니라 원천 키와 장소 키를 담는다. 번호로 바꾸는 일은 적재 트랜잭션이 한다 (ingest-foundation/03, 2026-10-22 결정 B).
import { z } from "zod"

export const FLAGS = ["outlier", "unit_mismatch", "one_plus_one_unverified"] as const
export type Flag = (typeof FLAGS)[number]

// 임시 상한(원). 이보다 크면 이상치로 표시한다. 전날·다른 시장과 비교하는 규칙은 ②·③에서 정한다 (pipeline 5-2).
export const PRICE_UPPER_BOUND = 10_000_000

// 가격이 0 이하이거나 상한을 넘으면 이상치. 집계에서는 빼고 원본은 남긴다 (pipeline 5-2).
export function priceFlags(priceRaw: number): Flag[] {
  return priceRaw <= 0 || priceRaw > PRICE_UPPER_BOUND ? ["outlier"] : []
}

// 20261011 → 2026-10-11
export function ymdFromCompact(value: string): string {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const isoWithOffset = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/)
const flagList = z.array(z.enum(FLAGS))

const promoSchema = z.strictObject({
  discount: z.boolean().nullable(),
  onePlusOne: z.boolean().nullable(),
  from: ymd.nullable(),
  to: ymd.nullable(),
})

const observationSchema = z
  .strictObject({
    recordKind: z.literal("observation"),
    source: z.enum(["kamis", "ekape", "chamgagyeok"]),
    sourceKey: z.string().min(1),
    placeKey: z.string().min(1),
    obsDate: ymd,
    priceTier: z.literal("retail"),
    obsKind: z.enum(["quote_sample", "quote_aggregate", "shelf_price"]),
    priceRaw: z.number().int(),
    qtyRaw: z.number().positive().nullable(),
    unitRaw: z.string().nullable(),
    pricePerBase: z.number().nonnegative().nullable(),
    varietyKey: z.string().nullable(),
    specKey: z.string().nullable(),
    promo: promoSchema,
    sourceRegisteredAt: isoWithOffset.nullable(),
    flags: flagList,
  })
  .refine((draft) => (draft.varietyKey === null) === (draft.specKey === null), {
    message: "품종과 규격은 함께 있거나 함께 없어야 한다",
  })
  .refine((draft) => draft.pricePerBase === null || draft.varietyKey !== null, {
    message: "기준 단위 가격은 품종이 정해진 뒤에만 있다",
  })

// 평년 행: 관측값이 아니라 평년 기준 값이다 (pipeline 3-11, reference_observation)
const referenceSchema = z
  .strictObject({
    recordKind: z.literal("reference"),
    source: z.literal("ekape"),
    sourceKey: z.string().min(1),
    placeKey: z.string().min(1),
    refDate: ymd,
    priceRaw: z.number().int(),
    unitRaw: z.string(),
    pricePerBase: z.number().nonnegative().nullable(),
    varietyKey: z.string().nullable(),
    specKey: z.string().nullable(),
    flags: flagList,
  })
  .refine((draft) => draft.pricePerBase === null || draft.varietyKey !== null, {
    message: "기준 단위 가격은 품종이 정해진 뒤에만 있다",
  })

export const draftSchema = z.discriminatedUnion("recordKind", [observationSchema, referenceSchema])

export type Draft = z.infer<typeof draftSchema>
export type ObservationDraft = Extract<Draft, { recordKind: "observation" }>
export type ReferenceDraft = Extract<Draft, { recordKind: "reference" }>

// 같은 것을 두 번 받았는지 가르는 키 (원천 키 + 장소 + 날짜). 재수집이 중복을 만들지 않게 한다.
export function naturalKey(draft: Draft): string {
  const date = draft.recordKind === "observation" ? draft.obsDate : draft.refDate
  return [draft.recordKind, draft.source, draft.sourceKey, draft.placeKey, date].join("|")
}
