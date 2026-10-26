// KAMIS 조사 시장의 유형. mrkt_nm으로 가르고 결과를 시장 코드에 붙여 저장한다 (kamis.md 5-1, pipeline 3-2).
// 코드 모양으로는 가를 수 없다. 운영자가 고친 유형(type_source = 'operator')은 적재가 덮지 않는다.
import { KAMIS_OFFICIAL_MARKET_CODES } from "./kamis-market-codes.ts"

export type MarketType = "traditional" | "large_retail" | "wholesale" | "eco_channel" | "online" | "other"

// 도시 이름만 있는 시장 17곳 (코드표). 시도 단위 코드로 보인다 (kamis.md 5-1 "도시 이름만")
const CITY_ONLY_CODES = new Set([
  "0110200", "0210000", "0220000", "0230000", "0240100", "0250100", "0260100", "0311100", "0321100",
  "0321400", "0331100", "0331200", "0351100", "0351200", "0361100", "0381100", "0391100",
])
// 가락소매: 실명이지만 가락 도매시장 안의 소매 점포로 보인다. 운영자가 정할 때까지 other (kamis.md 5-1 예외)
const GARAK_RETAIL = "1000006"

// 위에서부터 먼저 맞는 규칙 (kamis.md 5-1 표의 순서)
export function kamisMarketType(code: string, name: string): MarketType {
  if (/^[A-Z]+[0-9]*['`]?-유통$/.test(name)) return "large_retail"
  if (/^[A-Z]+-(SSM|백화점|대형마트|생협|전문점|직매장|슈퍼마켓|온라인)$/.test(name) || name === "R-마트") return "eco_channel"
  if (name.endsWith("도매")) return "wholesale"
  if (/^온라인몰[A-Z]$/.test(name) || name === "옥션") return "online"
  if (CITY_ONLY_CODES.has(code) || code === GARAK_RETAIL) return "other"
  return "traditional"
}

export function isOfficialKamisMarket(code: string): boolean {
  return KAMIS_OFFICIAL_MARKET_CODES.has(code)
}
