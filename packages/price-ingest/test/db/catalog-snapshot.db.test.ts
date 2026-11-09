// 카탈로그 가져오기·내보내기 (catalog-scale/04, ADR 0005). 모두 되돌려 샘플 데이터를 바꾸지 않는다.
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { exportSnapshot, importSnapshot, readRules } from "../../src/catalog/db.ts"
import { rulesOfSnapshot } from "../../src/catalog/rules.ts"
import { readSnapshot } from "../../src/catalog/snapshot.ts"
import type { Sql } from "../../src/load/db.ts"

import { connectLocalAdmin, connectLocalIngest, inRollback } from "./local.ts"

let admin: Sql
let ingest: Sql
const snapshot = readSnapshot()

beforeAll(async () => {
  admin = connectLocalAdmin()
  ingest = await connectLocalIngest()
})

afterAll(async () => {
  await admin.end()
  await ingest.end()
})

describe("카탈로그 사본", () => {
  it("가져온 뒤 내보내면 같은 사본이 나오고, 규칙 표가 사본의 규칙과 같다", async () => {
    await inRollback(admin, async (tx) => {
      await importSnapshot(tx, snapshot, "test")
      const exported = await exportSnapshot(tx)
      // 로컬 DB에는 샘플 시드의 분류도 있다. 사본에 있는 것만 같은지 보고, 사본에 없는 품종은 숨김으로 남는지 본다.
      // 사본에 없는 규격은 지우지 않는다 (관측값이 가리킬 수 있다. 샘플 시드의 계란 특란)
      const has = <T extends { slug: string }>(list: readonly T[]) => new Set(list.map((x) => x.slug))
      const varieties = new Map(snapshot.varieties.map((v) => [v.slug, v]))
      expect({
        ...exported,
        categories: exported.categories.filter((c) => has(snapshot.categories).has(c.slug)),
        items: exported.items.filter((i) => has(snapshot.items).has(i.slug)),
        varieties: exported.varieties
          .filter((v) => varieties.has(v.slug))
          .map((v) => ({ ...v, specs: v.specs.filter((s) => has(varieties.get(v.slug)!.specs).has(s.slug)) })),
      }).toEqual(snapshot)
      expect(exported.varieties.filter((v) => v.status === "hidden").map((v) => v.slug)).toContain("sagwa")
      const sortRules = <T extends { source: string; key: string }>(rows: T[]) => [...rows].sort((a, b) => `${a.source}:${a.key}`.localeCompare(`${b.source}:${b.key}`))
      expect(sortRules(await readRules(tx))).toEqual(sortRules(rulesOfSnapshot(snapshot)))
    })
  })

  it("바뀐 분류 단위만 변경 기록에 남기고, 같은 사본을 다시 가져오면 아무것도 바꾸지 않는다", async () => {
    await inRollback(admin, async (tx) => {
      await importSnapshot(tx, snapshot, "test")
      const edited = { ...snapshot, varieties: snapshot.varieties.map((v) => (v.slug === "apple" ? { ...v, name: "사과(부사)" } : v)) }
      const result = await importSnapshot(tx, edited, "test:edit")
      expect(result.changes.map((c) => `${c.target}:${c.targetKey}:${c.action}`)).toEqual(["variety:apple:update"])
      const [log] = await tx<{ actor: string; before: { name: string }; after: { name: string } }[]>`
        select actor, before, after from price.catalog_change where target = 'variety' and target_key = 'apple' order by id desc limit 1`
      expect(log).toMatchObject({ actor: "test:edit", before: { name: "사과" }, after: { name: "사과(부사)" } })
      expect((await importSnapshot(tx, edited, "test:again")).changes).toEqual([])
    })
  })

  it("규칙에서 빠진 원천 키는 규칙 표에서도 지운다", async () => {
    await inRollback(admin, async (tx) => {
      await importSnapshot(tx, snapshot, "test")
      await importSnapshot(tx, { ...snapshot, exceptions: [] }, "test")
      expect((await readRules(tx)).filter((r) => r.action !== "map")).toEqual([])
    })
  })

  it("ingest_writer는 가져오지 못하고 내보내기는 된다", async () => {
    await expect(inRollback(ingest, (tx) => importSnapshot(tx, snapshot, "test").then(() => {}))).rejects.toThrow(/permission denied/)
    await inRollback(ingest, async (tx) => {
      expect((await exportSnapshot(tx)).categories.length).toBeGreaterThan(0)
    })
  })
})
