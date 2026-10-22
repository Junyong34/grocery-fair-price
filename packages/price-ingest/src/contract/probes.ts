// 실측 항목 16개: 출처마다 명세의 코드 체계를 빠짐없이 덮도록 고른다.
// 날짜는 과거의 고정일이라 실행할 때마다 값이 같다 (건수 비교가 흔들리지 않는다).
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import type { CallOptions } from "../http.ts"
import type { ProbeBaseline } from "./compare.ts"
import { listAt } from "../response.ts"
import { checkWith } from "../validate.ts"
import {
  CHAMGA_ROW_PATH,
  chamgaPriceSchema,
  chamgaProductSchema,
  chamgaStandardSchema,
  chamgaStoreSchema,
  fetchChamgaPriceRaw,
  fetchChamgaProductRaw,
  fetchChamgaStandardRaw,
  fetchChamgaStoreRaw,
} from "../sources/chamgagyeok.ts"
import { EKAPE_ROW_PATH, ekapeConsumerPriceSchema, fetchEkapeConsumerPriceRaw } from "../sources/ekape.ts"
import { KAMIS_ROW_PATH, fetchKamisPerDayRaw, kamisPerDaySchema } from "../sources/kamis.ts"

export const BASELINE_FILE = fileURLToPath(new URL("../../baseline/contract-baseline.json", import.meta.url))

const KAMIS_DAY = "20260928" // 월요일
const EKAPE_DAY = "20261011" // 일요일 (축평원은 주말에도 값이 있다)
const CHAMGA_DAY = "20260925" // 금요일 조사일
const EKAPE_JUDGE_KINDS = ["4301", "4304", "4401", "4402", "9901", "9903", "9908"] as const
const CHAMGA_CLASS_CODES = ["AL", "UT", "AR", "BU"] as const

export type Probe = {
  id: string
  fetchRaw: (call: CallOptions) => Promise<unknown>
  // 계약 스키마 검사 결과 줄 목록 (비어 있으면 통과)
  check: (raw: unknown) => string[]
  rows: (raw: unknown) => Record<string, unknown>[]
  // 코드 필드별로 관측된 값 목록
  codes: (raw: unknown) => Record<string, string[]>
}

export type Baseline = {
  capturedAt: string
  note: string
  probes: Record<string, ProbeBaseline>
}

export function readBaseline(): Baseline {
  try {
    return JSON.parse(readFileSync(BASELINE_FILE, "utf8")) as Baseline
  } catch {
    throw new Error("기준 파일(baseline/contract-baseline.json)을 읽을 수 없다. pnpm contract:baseline으로 먼저 만든다")
  }
}

// 실측 호출기: 호출 수를 세고, 주소에 붙는 키는 여기서만 다룬다.
export function createLiveCall(serviceKey: string): { call: CallOptions; calls: () => number } {
  let count = 0
  const call: CallOptions = {
    serviceKey,
    timeoutMs: 30_000,
    fetch: (url, init) => {
      count += 1
      return fetch(url, init)
    },
  }
  return { call, calls: () => count }
}

function codeSets(rows: Record<string, unknown>[], keys: readonly string[]): Record<string, string[]> {
  return Object.fromEntries(
    keys.map((key) => {
      const values = new Set(rows.map((row) => row[key]).filter((value): value is string => typeof value === "string"))
      return [key, [...values].sort()]
    }),
  )
}

function kamisProbe(id: string, ctgryCd: string, itemCd: string): Probe {
  const query = { fromYmd: KAMIS_DAY, toYmd: KAMIS_DAY, ctgryCd, itemCd, seCd: "01" } as const
  return {
    id,
    fetchRaw: (call) => fetchKamisPerDayRaw(call, query),
    check: (raw) => checkWith(kamisPerDaySchema, raw),
    rows: (raw) => listAt(raw, KAMIS_ROW_PATH),
    codes: (raw) =>
      codeSets(listAt(raw, KAMIS_ROW_PATH), ["se_cd", "ctgry_cd", "item_cd", "vrty_cd", "grd_cd", "unit"]),
  }
}

function ekapeProbe(judgeKind: string): Probe {
  const query = { standYmd: EKAPE_DAY, judgeKind }
  return {
    id: `ekape.consumerPriceDaily.${judgeKind}`,
    fetchRaw: (call) => fetchEkapeConsumerPriceRaw(call, query),
    check: (raw) => checkWith(ekapeConsumerPriceSchema, raw),
    rows: (raw) => listAt(raw, EKAPE_ROW_PATH),
    codes: (raw) => codeSets(listAt(raw, EKAPE_ROW_PATH), ["judgeKind", "itemCd", "grdNm", "unit"]),
  }
}

function chamgaStandardProbe(classCode: string): Probe {
  const path = CHAMGA_ROW_PATH.standard
  return {
    id: `chamgagyeok.standard.${classCode}`,
    fetchRaw: (call) => fetchChamgaStandardRaw(call, { classCode }),
    check: (raw) => checkWith(chamgaStandardSchema, raw),
    rows: (raw) => listAt(raw, path),
    codes: (raw) => codeSets(listAt(raw, path), ["code"]),
  }
}

const chamgaStoreProbe: Probe = {
  id: "chamgagyeok.store.all",
  fetchRaw: (call) => fetchChamgaStoreRaw(call, {}),
  check: (raw) => checkWith(chamgaStoreSchema, raw),
  rows: (raw) => listAt(raw, CHAMGA_ROW_PATH.store),
  codes: (raw) => codeSets(listAt(raw, CHAMGA_ROW_PATH.store), ["entpTypeCode", "entpAreaCode"]),
}

const chamgaProductProbe: Probe = {
  id: "chamgagyeok.product.all",
  fetchRaw: (call) => fetchChamgaProductRaw(call, {}),
  check: (raw) => checkWith(chamgaProductSchema, raw),
  rows: (raw) => listAt(raw, CHAMGA_ROW_PATH.product),
  codes: (raw) =>
    codeSets(listAt(raw, CHAMGA_ROW_PATH.product), ["goodSmlclsCode", "goodTotalDivCode", "goodUnitDivCode"]),
}

const chamgaPriceProbe: Probe = {
  id: "chamgagyeok.price.good-1000",
  fetchRaw: (call) => fetchChamgaPriceRaw(call, { goodInspectDay: CHAMGA_DAY, goodId: "1000" }),
  check: (raw) => checkWith(chamgaPriceSchema, raw),
  rows: (raw) => listAt(raw, CHAMGA_ROW_PATH.price),
  codes: (raw) => codeSets(listAt(raw, CHAMGA_ROW_PATH.price), ["goodDcYn", "plusoneYn"]),
}

export const PROBES: Probe[] = [
  kamisProbe("kamis.perDay.vegetable-baechu-retail", "200", "211"),
  kamisProbe("kamis.perDay.livestock-sogogi-retail", "500", "4301"),
  ...EKAPE_JUDGE_KINDS.map((judgeKind) => ekapeProbe(judgeKind)),
  ...CHAMGA_CLASS_CODES.map((classCode) => chamgaStandardProbe(classCode)),
  chamgaStoreProbe,
  chamgaProductProbe,
  chamgaPriceProbe,
]
