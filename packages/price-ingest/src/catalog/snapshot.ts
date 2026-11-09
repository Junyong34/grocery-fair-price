// 저장소의 카탈로그 사본 snapshot.json을 읽는다 (ADR 0005). 원본은 운영 DB이고, catalog export가 이 파일을 쓴다.
// 로컬 DB를 채우고(catalog import) 테스트가 실측 코드표·variety-list.md와 맞는지 볼 때 쓴다.
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { z } from "zod"

import type { CatalogSnapshot } from "./types.ts"

export const SNAPSHOT_PATH = fileURLToPath(new URL("./snapshot.json", import.meta.url))

const slug = z.string().regex(/^[a-z0-9-]+$/)
const spec = z.strictObject({
  slug,
  name: z.string().min(1),
  kamis: z.array(z.string().regex(/^\d+-(\d+|\*)-\w+$/)).optional(),
  ekape: z.array(z.string().min(1)).optional(),
  chamga: z.array(z.number().int().positive()).optional(),
})
export const snapshotSchema = z.strictObject({
  categories: z.array(z.strictObject({ slug, name: z.string().min(1) })),
  items: z.array(z.strictObject({ slug, name: z.string().min(1), category: slug })),
  varieties: z.array(
    z.strictObject({
      slug,
      name: z.string().min(1),
      item: slug,
      unit: z.enum(["100g", "1kg", "10kg", "1개", "30구", "1L"]),
      status: z.literal("hidden").optional(),
      spread: z.literal("brand").optional(),
      seasonal: z.array(slug).optional(),
      specs: z.array(spec).min(1),
    }),
  ),
  exceptions: z.array(
    z.strictObject({
      source: z.enum(["kamis", "ekape", "chamga"]),
      key: z.string().min(1),
      action: z.enum(["ignore", "hold"]),
      reason: z.string().min(1),
    }),
  ),
})

export function parseSnapshot(text: string): CatalogSnapshot {
  return snapshotSchema.parse(JSON.parse(text))
}

export function readSnapshot(path = SNAPSHOT_PATH): CatalogSnapshot {
  return parseSnapshot(readFileSync(path, "utf8"))
}

export function formatSnapshot(snapshot: CatalogSnapshot): string {
  return JSON.stringify(snapshot, null, 2) + "\n"
}
