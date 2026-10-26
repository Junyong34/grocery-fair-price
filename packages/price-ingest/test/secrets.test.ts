// 비밀값이 오류·로그에 남지 않는지 (ingest-schedule/02). 키와 주소는 가짜다.
import { inspect } from "node:util"

import { describe, expect, it } from "vitest"

import type { CallRecord, FetchLike } from "../src/http.ts"
import { connectIngest, DbUrlError } from "../src/load/db.ts"
import { createObjectStore } from "../src/load/storage.ts"
import {
  actionsMaskCommands,
  createRedactor,
  describeError,
  MASK,
  redactorFromEnv,
  secretVariants,
} from "../src/secrets.ts"
import { fetchChamgaPrice } from "../src/sources/chamgagyeok.ts"
import { fetchEkapeConsumerPrice } from "../src/sources/ekape.ts"
import { fetchKamisPerDay } from "../src/sources/kamis.ts"

// data.go.kr 키처럼 +·/·=가 든 가짜 키. 주소에 넣으면 %2B·%2F·%3D로 바뀐다
const KEY = "Fake+Key/0123456789abcdef=="
const SB_SECRET = "sb_secret_FAKE0123456789abcdef"
const PASSWORD = "p+a/ss=w0rd#1"
const DB_URL = `postgresql://ingest_writer.fakeref:${encodeURIComponent(PASSWORD)}@127.0.0.1:1/postgres`
const ALL = [KEY, SB_SECRET, PASSWORD, DB_URL]

// 글자 안에 비밀값이 어떤 모양으로든 남았는가
function leaked(text: string): string[] {
  return ALL.flatMap(secretVariants).filter((variant) => text.includes(variant))
}

// 오류를 찍을 때 보일 수 있는 모든 글자: 메시지, 스택, 속성까지 (console.error가 찍는 모양)
function everything(error: unknown): string {
  return [String(error), error instanceof Error ? error.stack : "", inspect(error, { depth: 5 }), JSON.stringify(error)].join("\n")
}

async function errorOf(run: () => Promise<unknown>): Promise<unknown> {
  try {
    await run()
  } catch (error) {
    return error
  }
  throw new Error("오류가 나야 하는데 성공했다")
}

describe("비밀값의 모양들", () => {
  it("그대로, 퍼센트 인코딩, 폼 인코딩, 디코딩, 접속 주소 안의 비밀번호를 모두 모은다", () => {
    expect(secretVariants(KEY)).toEqual(expect.arrayContaining([KEY, "Fake%2BKey%2F0123456789abcdef%3D%3D"]))
    expect(secretVariants(DB_URL)).toEqual(expect.arrayContaining([DB_URL, encodeURIComponent(PASSWORD), PASSWORD]))
    // 이미 인코딩된 키를 넣어 둔 경우(data.go.kr "Encoding" 키)도 원래 모양을 지운다
    expect(secretVariants(encodeURIComponent(KEY))).toContain(KEY)
    // 형식이 잘못된 주소에서도 비밀번호를 꺼낸다
    expect(secretVariants(`postgresql://u:${PASSWORD}@host:5432/db`)).toContain(PASSWORD)
  })

  it("지우개는 모든 모양을 ***로 바꾸고, 짧은 값은 건드리지 않는다", () => {
    const redact = createRedactor([KEY, DB_URL, "abc", undefined])
    const text = `url=${DB_URL} key=${encodeURIComponent(KEY)} pw=${PASSWORD} short=abc`
    expect(redact(text)).toBe(`url=${MASK} key=${MASK} pw=${MASK} short=abc`)
  })

  it("환경변수에서 수집이 쓰는 비밀값 세 개를 읽는다", () => {
    const redact = redactorFromEnv({ DATA_GO_KR_SERVICE_KEY: KEY, SUPABASE_SECRET_KEY: SB_SECRET, INGEST_DATABASE_URL: DB_URL })
    expect(leaked(redact(ALL.map((v) => `${v} ${encodeURIComponent(v)}`).join(" ")))).toEqual([])
  })

  it("Actions 가리기 명령에 인코딩 변형까지 넣는다", () => {
    expect(actionsMaskCommands([KEY])).toContain("::add-mask::Fake%2BKey%2F0123456789abcdef%3D%3D")
  })
})

describe("오류를 찍어도 비밀값이 남지 않는다", () => {
  const redact = createRedactor(ALL)

  it("형식이 잘못된 DB 주소: 주소 없는 오류로 바꾼다 (postgres의 Invalid URL은 input에 주소 전체를 담는다)", () => {
    const raw = `postgresql://ingest_writer:${PASSWORD}@127.0.0.1:5432/postgres`
    let error: unknown
    try {
      connectIngest(raw)
    } catch (caught) {
      error = caught
    }
    expect(error).toBeInstanceOf(DbUrlError)
    expect(leaked(everything(error))).toEqual([])
  })

  it("Invalid URL 오류를 그대로 찍어도 describeError가 지운다", () => {
    let error: unknown
    try {
      new URL(`postgresql://u:${PASSWORD}@:@h/db`)
    } catch (caught) {
      error = caught
    }
    expect(leaked(everything(error)).length).toBeGreaterThan(0) // 지우지 않으면 샌다
    expect(leaked(describeError(error, redact))).toEqual([])
  })

  it("DB 연결 거부", async () => {
    const sql = connectIngest(DB_URL)
    const error = await errorOf(() => sql`select 1`)
    await sql.end({ timeout: 0 })
    expect(leaked(everything(error))).toEqual([])
  })

  it("API 호출이 실패하면 원래 오류(주소·키를 담을 수 있다)를 버리고, 호출 기록에도 키가 없다", async () => {
    const throwing: FetchLike = async (url) => {
      throw new TypeError(`fetch failed: ${url}`)
    }
    const records: CallRecord[] = []
    const call = { serviceKey: KEY, fetch: throwing, onCall: (record: CallRecord) => records.push(record) }
    const errors = [
      await errorOf(() => fetchKamisPerDay(call, { fromYmd: "20261020", toYmd: "20261020", ctgryCd: "200", itemCd: "211", seCd: "01" })),
      await errorOf(() => fetchEkapeConsumerPrice(call, { standYmd: "20261020", judgeKind: "4304" })),
      await errorOf(() => fetchChamgaPrice(call, { goodInspectDay: "20261023", goodId: "1000" })),
    ]
    for (const error of errors) expect(leaked(everything(error))).toEqual([])
    expect(records).toHaveLength(3)
    expect(leaked(JSON.stringify(records))).toEqual([])
  })

  it("API가 HTTP 오류·게이트웨이 인증 오류를 주어도 오류와 호출 기록에 키가 없다", async () => {
    const gateway = `<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>SERVICE ERROR</errMsg><returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg><returnReasonCode>30</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>`
    for (const [status, body] of [[500, "Internal Server Error"], [200, gateway]] as const) {
      const records: CallRecord[] = []
      const call = { serviceKey: KEY, fetch: (async () => new Response(body, { status })) as FetchLike, onCall: (r: CallRecord) => records.push(r) }
      const error = await errorOf(() => fetchEkapeConsumerPrice(call, { standYmd: "20261020", judgeKind: "4304" }))
      expect(leaked(everything(error))).toEqual([])
      expect(leaked(JSON.stringify(records))).toEqual([])
    }
  })

  it("Storage가 실패해도 오류에 비밀 키가 없다", async () => {
    const failing = createObjectStore({
      url: "http://127.0.0.1:1",
      secretKey: SB_SECRET,
      fetch: async (url, init) => {
        throw new Error(`failed ${url} ${JSON.stringify(init.headers)}`)
      },
    })
    const refusing = createObjectStore({
      url: "http://127.0.0.1:1",
      secretKey: SB_SECRET,
      fetch: async () => new Response(`{"error":"denied","key":"${SB_SECRET}"}`, { status: 403 }),
    })
    for (const store of [failing, refusing]) {
      expect(leaked(everything(await errorOf(() => store.list("kamis/2026/10/22/"))))).toEqual([])
      expect(leaked(everything(await errorOf(() => store.upload("kamis/x.ndjson.gz", new Uint8Array([1])))))).toEqual([])
    }
  })
})
