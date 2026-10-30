// 판정 payload를 읽을 때 모양을 검사하는 스키마(ADR 0004). types.ts의 타입과 같은 모양이고, 둘이 서로 대입되는지는 schema.test.ts가 컴파일로 확인한다.
// 알 수 없는 키는 버린다(zod 객체의 기본). 목록은 payload에서 무거운 키를 뺀 jsonb를 varietySummarySchema로 읽는다.
import { z } from "zod"

const verdictSchema = z.object({
  kind: z.enum(["cheap", "normal", "pricey", "none"]),
  pct: z.number().nullable(),
})

export const varietySummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  item: z.string(),
  category: z.string(),
  spec: z.string().nullable(),
  baseUnit: z.string(),
  price: z.number(),
  usual: z.number().nullable(),
  verdict: verdictSchema,
  surveyedOn: z.string(),
  sampleSize: z.number(),
  stale: z.boolean(),
  meetsMinN: z.boolean().nullable(),
  basis: z.object({ source: z.string(), scope: z.string() }),
})

const marketTypeSchema = z.enum(["large_retail", "traditional"])

export const varietyDetailSchema = varietySummarySchema.extend({
  band: z.object({ lower: z.number(), upper: z.number() }),
  priceSpread: z.literal("brand").optional(),
  range: z.object({ min: z.number(), max: z.number(), n: z.number() }),
  marketTypes: z.array(z.object({ type: marketTypeSchema, median: z.number(), n: z.number() })).readonly(),
  places: z
    .array(
      z.object({
        type: marketTypeSchema,
        name: z.string(),
        region: z.string().nullable(),
        price: z.number(),
        samples: z.array(z.number()).readonly(),
      }),
    )
    .readonly(),
  trend: z.array(z.object({ date: z.string(), price: z.number().nullable(), usual: z.number().nullable() })).readonly(),
  forecast: z.array(z.object({ date: z.string(), price: z.number(), low: z.number(), high: z.number() })).readonly(),
  shelf: z
    .object({
      surveyedOn: z.string(),
      prices: z.array(z.object({ seller: z.string(), price: z.number(), promo: z.string().nullable() })).readonly(),
    })
    .nullable(),
})

export const searchIndexSchema = z.object({
  varieties: z.array(z.object({ id: z.string(), name: z.string(), item: z.string(), category: z.string() })).readonly(),
  aliases: z
    .array(z.union([z.object({ text: z.string(), varietyId: z.string() }), z.object({ text: z.string(), item: z.string() })]))
    .readonly(),
  categories: z.array(z.string()).readonly(),
})
