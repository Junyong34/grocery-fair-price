// Supabase Storage 클라이언트 (원본 파일 보관). 비밀 키(sb_secret_…)로만 쓴다 (pipeline 3-0 "키").
// 오류 메시지에는 주소와 키를 넣지 않는다. 상태 코드만 남긴다.
// 여기서 다루는 키는 버킷 안의 객체 키다 (raw/를 뺀 것). DB의 storage_path는 raw-file.storagePathOf로 만든다.
import { RAW_BUCKET } from "./raw-file.ts"

export type ObjectStore = {
  // 올렸으면 uploaded, 같은 키가 이미 있으면 exists (409)
  upload: (key: string, bytes: Uint8Array) => Promise<"uploaded" | "exists">
  // 폴더 아래 .ndjson.gz 객체 키 목록 (전체 키)
  list: (prefix: string) => Promise<string[]>
  download: (key: string) => Promise<Uint8Array>
  remove: (keys: string[]) => Promise<void>
}

export class StorageError extends Error {
  status: number
  constructor(operation: string, status: number) {
    super(`Storage ${operation} 실패 (HTTP ${status})`)
    this.name = "StorageError"
    this.status = status
  }
}

type StorageFetch = (url: string, init: RequestInit) => Promise<Response>

export type StorageOptions = {
  url: string
  secretKey: string
  bucket?: string
  fetch?: StorageFetch
  timeoutMs?: number
}

export function createObjectStore(options: StorageOptions): ObjectStore {
  const bucket = options.bucket ?? RAW_BUCKET
  const base = options.url.replace(/\/$/, "")
  const send: StorageFetch = options.fetch ?? ((url, init) => fetch(url, init))
  const auth = { apikey: options.secretKey, authorization: `Bearer ${options.secretKey}` }
  const timeoutMs = options.timeoutMs ?? 30_000

  async function call(operation: string, url: string, init: RequestInit): Promise<Response> {
    try {
      return await send(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
    } catch {
      throw new StorageError(operation, 0)
    }
  }

  return {
    async upload(key, bytes) {
      const response = await call("업로드", `${base}/storage/v1/object/${bucket}/${key}`, {
        method: "POST",
        headers: { ...auth, "content-type": "application/gzip", "x-upsert": "false" },
        body: Buffer.from(bytes),
      })
      if (response.ok) return "uploaded"
      // 중복은 HTTP 400에 본문 code KeyAlreadyExists로 온다 (로컬 실측). 409로 오는 판도 함께 본다.
      const body = await response.text()
      if (response.status === 409 || body.includes("KeyAlreadyExists")) return "exists"
      throw new StorageError("업로드", response.status)
    },

    async list(prefix) {
      const response = await call("목록", `${base}/storage/v1/object/list/${bucket}`, {
        method: "POST",
        headers: { ...auth, "content-type": "application/json" },
        body: JSON.stringify({ prefix, limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } }),
      })
      if (!response.ok) throw new StorageError("목록", response.status)
      const items = (await response.json()) as { name: string }[]
      return items
        .filter((item) => item.name.endsWith(".ndjson.gz"))
        .map((item) => (item.name.startsWith(prefix) ? item.name : `${prefix}${item.name}`))
    },

    async download(key) {
      const response = await call("내려받기", `${base}/storage/v1/object/${bucket}/${key}`, { headers: auth })
      if (!response.ok) throw new StorageError("내려받기", response.status)
      return new Uint8Array(await response.arrayBuffer())
    },

    async remove(keys) {
      if (keys.length === 0) return
      const response = await call("삭제", `${base}/storage/v1/object/${bucket}`, {
        method: "DELETE",
        headers: { ...auth, "content-type": "application/json" },
        body: JSON.stringify({ prefixes: keys }),
      })
      if (!response.ok) throw new StorageError("삭제", response.status)
    },
  }
}
