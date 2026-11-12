"use server"

import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"

import { refresh } from "next/cache"

import { seoulToday } from "@workspace/seasonal/calendar/today"
import { formatArtMeta, parseArtMeta } from "@workspace/seasonal/data/art-meta"

import { assertAdmin } from "@/features/admin-print/server/guard"

import { ART_ID, artFile } from "./paths"

// 그림 검수 판정을 그림 폴더의 art.json에 쓴다 (ADR 0006). 품종 원본과 웹 산출물은 건드리지 않는다.
// 웹에 반영하려면 pnpm foods:sync를 돌린다.
export type ArtResult = { ok: true } | { ok: false; error: string }

const pad = (value: number) => String(value).padStart(2, "0")

/** 그림을 검수 완료로 판정하거나 미검수로 되돌린다. 검수 완료에는 오늘(서울) 날짜를 적는다. */
export async function setArtReview(id: string, review: "reviewed" | "unreviewed"): Promise<ArtResult> {
  assertAdmin()
  try {
    if (!ART_ID.test(id)) throw new Error("그림 ID 형식이 아니에요.")
    const file = artFile(id, "art.json")
    const meta = parseArtMeta(JSON.parse(await readFile(/*turbopackIgnore: true*/ file, "utf8")))
    const today = seoulToday()
    const kept = { id: meta.id, name: meta.name, references: meta.references }
    const next = review === "reviewed" ? { ...kept, review, reviewedAt: `${today.year}-${pad(today.month)}-${pad(today.day)}` } : { ...kept, review }
    await writeFile(/*turbopackIgnore: true*/ file, formatArtMeta(parseArtMeta(next)))
    refresh()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/** 그림을 그리며 적은 관찰 기록(NOTES.md). 없으면 빈 글. */
export async function readArtNotes(id: string): Promise<string> {
  assertAdmin()
  if (!ART_ID.test(id)) return ""
  const file = artFile(id, "NOTES.md")
  return existsSync(/*turbopackIgnore: true*/ file) ? readFile(/*turbopackIgnore: true*/ file, "utf8") : ""
}
