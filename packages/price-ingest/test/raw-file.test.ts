import { gzipSync } from "node:zlib"
import { describe, expect, it } from "vitest"

import { buildRawFile, callKeyOf, parseRawFile, rawObjectKey, sha256Hex } from "../src/load/raw-file.ts"

const HEADER = {
  source: "kamis" as const,
  endpoint: "perDay/price",
  fetchedAt: "2026-10-21T16:30:00Z",
  requests: [{ itemCd: "211", pageNo: 1 }],
  callCount: 1,
  targetFrom: "2026-10-21",
  targetTo: "2026-10-21",
  contractBaseline: "baseline:2026-10-22T06:11:08Z",
  adapterVersion: "p4-03",
}

const ROWS = [{ exmn_ymd: "20261021", exmn_dd_prc: "8110" }, { exmn_ymd: "20261021", exmn_dd_prc: "7000" }]

describe("원본 파일 (줄 단위 JSON, gzip)", () => {
  it("만든 파일을 다시 읽으면 헤더와 행이 그대로 나온다", () => {
    const built = buildRawFile(HEADER, ROWS)
    const parsed = parseRawFile(built.bytes)
    expect(parsed.header).toEqual({ ...HEADER, rowCount: 2 })
    expect(parsed.rows).toEqual(ROWS)
    expect(parsed.sha256).toBe(built.sha256)
  })

  it("같은 입력이면 같은 바이트가 나온다 (내용 해시가 안정적이다)", () => {
    expect(buildRawFile(HEADER, ROWS).sha256).toBe(buildRawFile(HEADER, ROWS).sha256)
  })

  it("저장된 바이트의 해시는 저장 전 파일의 해시다", () => {
    const built = buildRawFile(HEADER, ROWS)
    expect(sha256Hex(built.bytes)).toBe(built.sha256)
  })

  it("헤더의 행 수와 실제 행 수가 다르면 읽기를 거부한다", () => {
    const text = [JSON.stringify({ ...HEADER, rowCount: 3 }), JSON.stringify(ROWS[0])].join("\n") + "\n"
    expect(() => parseRawFile(gzipSync(text))).toThrow("행 수")
  })

  it("빈 파일은 읽지 못한다", () => {
    expect(() => parseRawFile(gzipSync(""))).toThrow()
  })
})

describe("원본 객체 키", () => {
  it("출처/연/월/일/호출키.ndjson.gz 모양이다 (버킷 raw 안)", () => {
    expect(rawObjectKey("kamis", "2026-10-22", "perday-abc123")).toBe("kamis/2026/10/22/perday-abc123.ndjson.gz")
  })

  it("호출 키는 라벨과 내용 해시 앞 12자리로 만든다 (내용이 같으면 같은 키)", () => {
    expect(callKeyOf("perday", "0123456789abcdef")).toBe("perday-0123456789ab")
  })
})
