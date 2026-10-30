import postgres from "postgres"
import { afterAll, describe, expect, it, vi } from "vitest"

import { connectAdmin, connectAs } from "@workspace/price-db/src/db"
import { VARIETY_SUMMARY_KEYS } from "@workspace/price/schema"

import { readVariety } from "./get-variety"
import { readVarieties } from "./list-varieties"
import { readSearchExtras } from "./search-index"

// 읽기 module의 interface(sql을 받아 검사된 값을 돌려준다)를 로컬 DB의 샘플 판정 묶음으로 확인한다.
// 화면과 같은 web_reader 롤로 읽으므로 권한 · RLS도 함께 확인된다.

const web = connectAs("web_reader")
const admin = connectAdmin()
afterAll(async () => {
  await Promise.all([web.end(), admin.end()])
})

const ROLLBACK = new Error("rollback")

// 소유자 트랜잭션 안에서 payload를 바꿔 읽고 되돌린다.
async function withChangedPayload<T>(set: string, read: (tx: postgres.TransactionSql) => Promise<T>): Promise<T> {
  let result: T | undefined
  await admin
    .begin(async (tx) => {
      await tx.unsafe(`update price.judgment_snapshot s set payload = ${set} from price.judgment_current c where s.batch_id = c.batch_id`)
      result = await read(tx)
      throw ROLLBACK
    })
    .catch((error: unknown) => {
      if (error !== ROLLBACK) throw error
    })
  return result as T
}

describe("readVarieties", () => {
  it("현재 판정 묶음의 행을 목록 키만 담아 돌려준다", async () => {
    const rows = await readVarieties(web)
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) expect(Object.keys(row).sort()).toEqual([...VARIETY_SUMMARY_KEYS].sort())
  })

  it("카테고리 순서(category.sort) · 품종 이름 순으로 돌려준다", async () => {
    const rows = await readVarieties(web)
    const order = (await web<{ name: string }[]>`select name from price.category order by sort nulls last, name`).map((c) => c.name)
    const rank = rows.map((row) => order.indexOf(row.category))
    expect(rank).toEqual([...rank].sort((a, b) => a - b))
  })

  it("모양이 어긋난 행은 빼고 로그를 남긴다", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const all = await readVarieties(web)
    const broken = all[0]!.id
    const rows = await withChangedPayload(`case when payload ->> 'id' = '${broken}' then payload - 'price' else payload end`, readVarieties)
    expect(rows.map((row) => row.id)).toEqual(all.map((row) => row.id).filter((id) => id !== broken))
    expect(error).toHaveBeenCalledWith(expect.stringContaining(broken), expect.anything())
    error.mockRestore()
  })
})

describe("readVariety", () => {
  it("품종 하나의 판정 payload 전체를 돌려준다", async () => {
    const [first] = await readVarieties(web)
    const detail = await readVariety(web, first!.id)
    expect(detail).toMatchObject(first!)
    expect(detail).toHaveProperty("trend")
    expect(detail).toHaveProperty("places")
  })

  it("없는 품종이면 null", async () => {
    expect(await readVariety(web, "no-such-variety")).toBeNull()
  })

  it("모양이 어긋나면 던진다", async () => {
    const [first] = await readVarieties(web)
    await expect(withChangedPayload(`payload - 'band'`, (tx) => readVariety(tx, first!.id))).rejects.toThrow()
  })
})

describe("readSearchExtras", () => {
  it("별칭은 품종이나 품목 하나를 가리키고, 카테고리는 보여 줄 순서대로다", async () => {
    const extras = await readSearchExtras(web)
    expect(extras.aliases.length).toBeGreaterThan(0)
    for (const alias of extras.aliases) expect(("varietyId" in alias) !== ("item" in alias)).toBe(true)
    const order = await web<{ name: string }[]>`select name from price.category order by sort nulls last, name`
    expect(extras.categories).toEqual(order.map((c) => c.name))
  })
})
