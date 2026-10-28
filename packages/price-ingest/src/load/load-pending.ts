// pending_load 원본을 모두 적재한다 (pipeline 3-7 "순서", 2026-10-22 결정 B).
// 대조(reconcile)가 기록 없는 원본을 pending_load로 채운 뒤 부른다. 받은 순서대로 적재해 늦게 받은 값이 남는다.
// 파일 하나가 실패해도 다음 파일로 넘어간다. 실패한 파일은 pending_load로 남아 다음 실행이 다시 적재한다.
import type { Sql } from "./db.ts"
import { loadRawFile, type LoadOutcome } from "./load-file.ts"
import { objectKeyOf, parseRawFile } from "./raw-file.ts"
import type { ObjectStore } from "./storage.ts"
import type { DbSource } from "./types.ts"

export type PendingFailure = { storagePath: string; error: string }

export type PendingResult = { loaded: LoadOutcome[]; failed: PendingFailure[] }

// today: KST 오늘. 백필 원본(대조가 주운 것 포함)의 보존 기간을 가른다 (load-file.ts)
export async function loadPendingFiles(input: { sql: Sql; store: ObjectStore; source: DbSource; today: string }): Promise<PendingResult> {
  const pending = await input.sql<{ id: string; storage_path: string; content_sha256: string }[]>`
    select id, storage_path, content_sha256 from price.raw_object
     where source = ${input.source} and load_status = 'pending_load'
     order by fetched_at, id`

  const result: PendingResult = { loaded: [], failed: [] }
  for (const raw of pending) {
    try {
      const file = parseRawFile(await input.store.download(objectKeyOf(raw.storage_path)))
      if (file.header.source !== input.source) throw new Error("원본의 출처가 기록과 다르다")
      if (file.contentSha256 !== raw.content_sha256) throw new Error("원본 내용이 기록의 해시와 다르다")
      result.loaded.push(await loadRawFile(input.sql, Number(raw.id), file, { today: input.today }))
    } catch (error) {
      // 오류 문구에 키·주소는 없다 (Storage·DB 오류는 상태 코드·SQL 오류만 담는다)
      result.failed.push({ storagePath: raw.storage_path, error: error instanceof Error ? error.message : String(error) })
    }
  }
  return result
}
