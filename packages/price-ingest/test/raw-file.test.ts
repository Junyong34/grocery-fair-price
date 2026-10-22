import { gzipSync } from "node:zlib"
import { describe, expect, it } from "vitest"

import {
  buildRawFile,
  callKeyOf,
  objectKeyOf,
  parseRawFile,
  rawObjectKey,
  sha256Hex,
  storagePathOf,
  type RawHeaderInput,
} from "../src/load/raw-file.ts"

const HEADER: RawHeaderInput = {
  source: "kamis",
  endpoint: "perDay/price",
  job: "daily",
  ingestRunId: 7,
  runStartedAt: "2026-10-21T21:30:00Z",
  fetchedAt: "2026-10-21T21:30:05Z",
  requests: [
    { endpoint: "perDay/price", params: { pageNo: "1" }, httpStatus: 200, resultCode: "0", rowCount: 2 },
  ],
  targetFrom: "2026-10-21",
  targetTo: "2026-10-21",
  contractBaseline: "baseline:2026-10-22T06:11:08Z",
  adapterVersion: "2026-10-22.1",
}

const ROWS = [{ exmn_ymd: "20261021", exmn_dd_prc: "8110" }, { exmn_ymd: "20261021", exmn_dd_prc: "7000" }]

describe("원본 파일 (줄 단위 JSON, gzip)", () => {
  it("만든 파일을 다시 읽으면 헤더와 행이 그대로 나온다. 호출 수와 행 수는 헤더에 채워진다", () => {
    const built = buildRawFile(HEADER, ROWS)
    const parsed = parseRawFile(built.bytes)
    expect(parsed.header).toEqual({ ...HEADER, callCount: 1, rowCount: 2 })
    expect(parsed.rows).toEqual(ROWS)
    expect(parsed.contentSha256).toBe(built.contentSha256)
  })

  it("같은 입력이면 같은 바이트가 나온다", () => {
    expect(sha256Hex(buildRawFile(HEADER, ROWS).bytes)).toBe(sha256Hex(buildRawFile(HEADER, ROWS).bytes))
  })

  it("내용 해시는 행만으로 낸다: 받은 시각·호출 기록이 달라도 행이 같으면 같다 (duplicate 판정, 3-7)", () => {
    const later = buildRawFile({ ...HEADER, fetchedAt: "2026-10-22T21:30:05Z", ingestRunId: 8, requests: [] }, ROWS)
    expect(later.contentSha256).toBe(buildRawFile(HEADER, ROWS).contentSha256)
  })

  it("행이 다르면 내용 해시가 다르다", () => {
    expect(buildRawFile(HEADER, [ROWS[0]!]).contentSha256).not.toBe(buildRawFile(HEADER, ROWS).contentSha256)
  })

  it("내용 해시는 압축 전 행 줄의 SHA-256이다 (DB 열 주석)", () => {
    const text = ROWS.map((row) => `${JSON.stringify(row)}\n`).join("")
    expect(buildRawFile(HEADER, ROWS).contentSha256).toBe(sha256Hex(text))
  })

  it("헤더의 행 수와 실제 행 수가 다르면 읽기를 거부한다", () => {
    const header = { ...HEADER, callCount: 1, rowCount: 3 }
    const text = [JSON.stringify(header), JSON.stringify(ROWS[0])].join("\n") + "\n"
    expect(() => parseRawFile(gzipSync(text))).toThrow("행 수")
  })

  it("받은 실행 번호가 없어도(DB가 안 되었을 때) 읽힌다", () => {
    const parsed = parseRawFile(buildRawFile({ ...HEADER, ingestRunId: null }, ROWS).bytes)
    expect(parsed.header.ingestRunId).toBeNull()
  })

  it("빈 파일은 읽지 못한다", () => {
    expect(() => parseRawFile(gzipSync(""))).toThrow()
  })
})

describe("원본 객체 키와 storage_path", () => {
  it("객체 키는 버킷 안의 출처/연/월/일/호출키.ndjson.gz다", () => {
    expect(rawObjectKey("kamis", "2026-10-22", "perday-x")).toBe("kamis/2026/10/22/perday-x.ndjson.gz")
  })

  it("storage_path는 버킷 이름 raw/를 앞에 붙인다 (DB 열 주석, pipeline 3-7)", () => {
    const key = rawObjectKey("kamis", "2026-10-22", "perday-x")
    expect(storagePathOf(key)).toBe("raw/kamis/2026/10/22/perday-x.ndjson.gz")
    expect(objectKeyOf(storagePathOf(key))).toBe(key)
  })

  it("raw/로 시작하지 않는 storage_path는 객체 키로 바꾸지 않는다", () => {
    expect(() => objectKeyOf("kamis/2026/10/22/a.ndjson.gz")).toThrow("raw/")
  })

  it("호출 키는 라벨과 받은 시각(밀리초까지)이다. 다시 받으면 다른 키가 된다", () => {
    expect(callKeyOf("perday-200-211", "2026-10-21T21:30:05.123Z")).toBe("perday-200-211-20261021T213005123Z")
    expect(callKeyOf("perday-200-211", "2026-10-21T21:30:05Z")).not.toBe(
      callKeyOf("perday-200-211", "2026-10-22T21:30:05Z"),
    )
  })

  it("호출 키 라벨에는 영소문자·숫자·하이픈만 쓴다", () => {
    expect(() => callKeyOf("Perday/200", "2026-10-21T21:30:05Z")).toThrow("라벨")
  })
})
