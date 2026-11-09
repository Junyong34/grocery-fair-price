"use server"

import { refresh } from "next/cache"
import type postgres from "postgres"

import { moveOrder, parseCategoryInput, renumber } from "../lib/category"
import { listCategories } from "./categories"
import { ownerDb } from "./owner-db"

// 카테고리 쓰기 (ADR 0005). 한 번의 쓰기는 한 트랜잭션이고, 바뀐 행마다 catalog_change에 전후 값을 남긴다.
// slug는 만든 뒤 바꾸지 않는다: 사본(snapshot.json)과 가져오기가 slug로 같은 카테고리를 찾는다.
export type CategoryResult = { ok: true } | { ok: false; error: string }

type Tx = postgres.TransactionSql
type Snapshot = { slug: string; name: string; sort: number | null }

const failure = (error: unknown): CategoryResult => ({ ok: false, error: error instanceof Error ? error.message : String(error) })

async function log(tx: Tx, slug: string, action: "insert" | "update" | "delete", before: Snapshot | null, after: Snapshot | null) {
  await tx`
    insert into price.catalog_change (actor, target, target_key, action, before, after)
    values ('admin', 'category', ${slug}, ${action}, ${before === null ? null : tx.json(before)}, ${after === null ? null : tx.json(after)})`
}

async function rowOf(tx: Tx, id: number): Promise<(Snapshot & { id: number }) | undefined> {
  const [row] = await tx<(Snapshot & { id: number })[]>`select id, slug, name, sort from price.category where id = ${id} for update`
  return row
}

async function setSorts(tx: Tx, changes: readonly { id: number; sort: number }[]) {
  for (const c of changes) {
    const before = await rowOf(tx, c.id)
    if (!before || before.sort === c.sort) continue
    await tx`update price.category set sort = ${c.sort} where id = ${c.id}`
    await log(tx, before.slug, "update", { slug: before.slug, name: before.name, sort: before.sort }, { slug: before.slug, name: before.name, sort: c.sort })
  }
}

export async function createCategory(input: { slug: string; name: string }): Promise<CategoryResult> {
  const parsed = parseCategoryInput(input)
  if (!parsed.ok) return parsed
  try {
    await ownerDb().begin(async (tx) => {
      const [taken] = await tx`select 1 from price.category where slug = ${parsed.value.slug}`
      if (taken) throw new Error(`이미 있는 slug예요: ${parsed.value.slug}`)
      const [last] = await tx<{ max: number | null }[]>`select max(sort)::int as max from price.category`
      const after = { ...parsed.value, sort: (last?.max ?? 0) + 1 }
      await tx`insert into price.category (slug, name, sort) values (${after.slug}, ${after.name}, ${after.sort})`
      await log(tx, after.slug, "insert", null, after)
    })
  } catch (error) {
    return failure(error)
  }
  refresh()
  return { ok: true }
}

export async function renameCategory(id: number, name: string): Promise<CategoryResult> {
  try {
    await ownerDb().begin(async (tx) => {
      const before = await rowOf(tx, id)
      if (!before) throw new Error("없는 카테고리예요.")
      const parsed = parseCategoryInput({ slug: before.slug, name })
      if (!parsed.ok) throw new Error(parsed.error)
      if (parsed.value.name === before.name) return
      await tx`update price.category set name = ${parsed.value.name} where id = ${id}`
      await log(tx, before.slug, "update", { slug: before.slug, name: before.name, sort: before.sort }, { slug: before.slug, name: parsed.value.name, sort: before.sort })
    })
  } catch (error) {
    return failure(error)
  }
  refresh()
  return { ok: true }
}

export async function moveCategory(id: number, direction: "up" | "down"): Promise<CategoryResult> {
  try {
    const rows = await listCategories()
    await ownerDb().begin((tx) => setSorts(tx, moveOrder(rows, id, direction)))
  } catch (error) {
    return failure(error)
  }
  refresh()
  return { ok: true }
}

// 보정: 비었거나 겹친 순서를 지금 보이는 순서대로 1부터 다시 매긴다
export async function renumberCategories(): Promise<CategoryResult> {
  try {
    const rows = await listCategories()
    await ownerDb().begin((tx) => setSorts(tx, renumber(rows)))
  } catch (error) {
    return failure(error)
  }
  refresh()
  return { ok: true }
}

// 품목이 하나라도 있으면 지우지 않는다 (품목·품종·관측값이 가리킨다). 품목을 먼저 다른 카테고리로 옮긴다
export async function deleteCategory(id: number): Promise<CategoryResult> {
  try {
    await ownerDb().begin(async (tx) => {
      const before = await rowOf(tx, id)
      if (!before) throw new Error("없는 카테고리예요.")
      const [used] = await tx<{ n: number }[]>`select count(*)::int as n from price.item where category_id = ${id}`
      if (used!.n > 0) throw new Error(`품목 ${used!.n}개가 이 카테고리에 있어 지울 수 없어요. 품목을 먼저 옮기세요.`)
      await tx`delete from price.category where id = ${id}`
      await log(tx, before.slug, "delete", { slug: before.slug, name: before.name, sort: before.sort }, null)
    })
  } catch (error) {
    return failure(error)
  }
  refresh()
  return { ok: true }
}
