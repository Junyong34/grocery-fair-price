// 저장 샘플 응답(grocery-price/reference/public-data/samples/)을 읽어 원천 행으로 바꾼다.
// 테스트 데이터용이다. 정식 어댑터와 행 단위 검증은 수집 패키지(ingest-foundation/03, p4/03)가 만든다.
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { XMLParser } from "fast-xml-parser"

export const SAMPLES_DIR = fileURLToPath(
  new URL("../../../grocery-price/reference/public-data/samples/", import.meta.url),
)

export type SampleFile = {
  path: string // samples/ 기준 상대 경로
  text: string
  sha256: string
  bytes: number
  fetchedAt: string // manifest.tsv의 호출 시각 (UTC)
  request: string // manifest.tsv의 요청 URL (serviceKey는 이미 가려져 있다)
}

let manifest: Map<string, { fetchedAt: string; request: string }> | undefined

function readManifest() {
  if (manifest) return manifest
  manifest = new Map()
  const lines = readFileSync(SAMPLES_DIR + "manifest.tsv", "utf8").trim().split("\n").slice(1)
  for (const line of lines) {
    const [file, , , fetchedAt, request] = line.split("\t")
    if (file && fetchedAt && request) manifest.set(file, { fetchedAt, request })
  }
  return manifest
}

export function readSample(path: string): SampleFile {
  const text = readFileSync(SAMPLES_DIR + path, "utf8")
  const entry = readManifest().get(path)
  if (!entry) throw new Error(`manifest.tsv에 없는 샘플: ${path}`)
  return {
    path,
    text,
    sha256: createHash("sha256").update(text).digest("hex"),
    bytes: Buffer.byteLength(text),
    ...entry,
  }
}

const xml = new XMLParser({ parseTagValue: false, isArray: (name) => name === "item" || name.endsWith("VO") })

function ymd(value: string): string {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}

// ── KAMIS perDay/price ────────────────────────────────────────────────

export type KamisRow = {
  exmn_ymd: string
  se_cd: string
  ctgry_cd: string
  item_cd: string
  item_nm: string
  vrty_cd: string
  vrty_nm: string
  grd_cd: string
  grd_nm: string
  sgg_cd: string
  sgg_nm: string
  mrkt_cd: string | null
  mrkt_nm: string | null
  unit: string
  unit_sz: string
  exmn_dd_prc: string
  orgnl_reg_dt: string | null
}

export function parseKamis(file: SampleFile): KamisRow[] {
  const body = JSON.parse(file.text) as { response: { body: { items: { item: KamisRow[] } } } }
  return body.response.body.items.item
}

export const kamisDate = (row: KamisRow) => ymd(row.exmn_ymd)

// ── 축평원 consumerPriceDaily ──────────────────────────────────────────

export type EkapeRow = {
  standYmd: string // 날짜 또는 '평년'
  judgeKind: string
  judgeKindNm: string
  itemCd: string
  itemNm: string
  grdNm: string
  ntslPrc: string
  unit: string
}

export function parseEkape(file: SampleFile): EkapeRow[] {
  const body = xml.parse(file.text) as { response: { body: { items: { item: EkapeRow[] } } } }
  return body.response.body.items.item
}

// 평년 행의 기준일은 요청의 standYmd다 (pipeline.md 3-3).
export function ekapeRequestDate(file: SampleFile): string {
  const m = /standYmd=(\d{8})/.exec(file.request)
  if (!m?.[1]) throw new Error(`요청에 standYmd가 없다: ${file.path}`)
  return ymd(m[1])
}

// ── 참가격 ────────────────────────────────────────────────────────────

export type ChamgaPriceRow = {
  goodInspectDay: string
  entpId: string
  goodId: string
  goodPrice: string
  plusoneYn?: string
  goodDcYn?: string
  goodDcStartDay?: string
  goodDcEndDay?: string
  inputDttm: string
}

export type ChamgaProduct = {
  goodId: string
  goodName: string
  productEntpCode?: string
  goodTotalCnt: string
  goodTotalDivCode: string
  goodSmlclsCode: string
  detailMean?: string
}

export type ChamgaStore = {
  entpId: string
  entpName: string
  entpTypeCode: string
  entpAreaCode: string
  areaDetailCode?: string
  roadAddrBasic?: string
  plmkAddrBasic?: string
  xMapCoord?: string
  yMapCoord?: string
}

type ChamgaBody = { response: { result: Record<string, unknown[] | undefined> } }

function chamgaRows<T>(file: SampleFile, tag: string): T[] {
  const body = xml.parse(file.text) as ChamgaBody
  return (body.response.result[tag] ?? []) as T[]
}

export const parseChamgaPrices = (file: SampleFile) =>
  chamgaRows<ChamgaPriceRow>(file, "iros.openapi.service.vo.goodPriceVO")
export const parseChamgaProducts = (file: SampleFile) => chamgaRows<ChamgaProduct>(file, "item")
export const parseChamgaStores = (file: SampleFile) =>
  chamgaRows<ChamgaStore>(file, "iros.openapi.service.vo.entpInfoVO")

export const chamgaDate = (row: ChamgaPriceRow) => ymd(row.goodInspectDay)

// 참가격 Y/N 플래그. 태그가 없으면 모름(null) (pipeline.md 3-0 "없는 값은 null").
export function yn(value: string | undefined): boolean | null {
  if (value === "Y") return true
  if (value === "N") return false
  return null
}
