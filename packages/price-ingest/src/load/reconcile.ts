// 대조 (2026-10-22 결정 B): Storage의 최근 N일 폴더를 목록으로 읽어, 기록(raw_object)이 없는 원본을 pending_load로 채운다.
// DB가 죽어 있던 동안 올라간 파일도 여기서 찾는다. 실행 사이의 로컬 기록은 쓰지 않는다.
// 채운 기록의 ingest_run_id는 대조한 실행이 아니라 원본을 받은 실행이다 (DB 열 주석). ledger.runOfRawFile 참고.
import { registeredPaths, registerPending, runOfRawFile } from "./ledger.ts"
import { objectKeyOf, parseRawFile, storagePathOf } from "./raw-file.ts"
import type { Sql } from "./db.ts"
import type { ObjectStore } from "./storage.ts"
import { missingKeys, dayPrefix, recentDays, RECONCILE_DAYS } from "./window.ts"
import type { DbSource } from "./types.ts"

export type ReconcileInput = {
  sql: Sql
  store: ObjectStore
  source: DbSource
  today: string // KST 오늘 (YYYY-MM-DD)
  days?: number
}

export type ReconcileResult = {
  listed: number // 기간 안에서 저장소에 있던 원본 수
  registered: string[] // 이번에 pending_load로 새로 등록한 storage_path
}

export async function reconcileRawFiles(input: ReconcileInput): Promise<ReconcileResult> {
  const days = recentDays(input.today, input.days ?? RECONCILE_DAYS)
  const stored: string[] = []
  for (const day of days) {
    const keys = await input.store.list(dayPrefix(input.source, day))
    stored.push(...keys.map(storagePathOf))
  }

  const registered = await registeredPaths(input.sql, stored)
  const registeredNow: string[] = []
  for (const storagePath of missingKeys(stored, registered)) {
    const bytes = await input.store.download(objectKeyOf(storagePath))
    const file = parseRawFile(bytes)
    if (file.header.source !== input.source) throw new Error(`원본의 출처가 저장 폴더와 다르다: ${storagePath}`)
    const inserted = await registerPending(input.sql, {
      storagePath,
      header: file.header,
      contentSha256: file.contentSha256,
      bytesGz: bytes.length,
      ingestRunId: await runOfRawFile(input.sql, file.header),
    })
    if (inserted) registeredNow.push(storagePath)
  }
  return { listed: stored.length, registered: registeredNow }
}
