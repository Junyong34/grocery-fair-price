import "server-only"

import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"

import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { downloadPath, objectKey, staleObjectKeys, type DownloadManifest } from "@workspace/seasonal/print/edition"
import { PUBLISHED_PAPERS } from "@workspace/seasonal/print/spec"

import { MANIFEST, PUBLIC_DIR } from "./files"

// 비공개 R2 버킷에 공개 에디션의 PDF를 올리고 지운다(ADR 0003). 쓰기 키는 운영자 로컬 .env에만 있다.
// 엔드포인트 · 리전은 읽기 쪽(features/seasonal/downloads/server/download-url.ts)과 같다.

export function storageReady(): boolean {
  return writer() !== null
}

/** 생성기가 public/downloads에 쓴 공개 용지 PDF를 같은 경로의 키로 올린다. 다시 올리면 덮어쓴다. */
export async function uploadEdition(id: string) {
  const r2 = required()
  for (const paper of PUBLISHED_PAPERS) {
    const body = await readFile(path.join(PUBLIC_DIR, downloadPath(id, paper)))
    await r2.client.send(new PutObjectCommand({ Bucket: r2.bucket, Key: objectKey(id, paper), Body: body, ContentType: "application/pdf" }))
  }
}

/**
 * 지워도 되는 키. 이 컴퓨터의 매니페스트와 푸시한 매니페스트(origin/main) 어느 쪽에도 공개로 없는 객체다.
 * 배포가 끝났는지는 알 수 없으므로, 확인 창이 "배포가 끝난 뒤" 누르라고 안내한다.
 */
export async function staleKeys(): Promise<string[]> {
  const [local, pushed, keys] = await Promise.all([readFile(MANIFEST, "utf8").then(JSON.parse) as Promise<DownloadManifest>, pushedManifest(), listKeys()])
  return staleObjectKeys(keys, { editions: [...local.editions, ...pushed.editions] })
}

export async function deleteObjects(keys: readonly string[]) {
  const r2 = required()
  for (const key of keys) await r2.client.send(new DeleteObjectCommand({ Bucket: r2.bucket, Key: key }))
}

async function listKeys(): Promise<string[]> {
  const r2 = required()
  const keys: string[] = []
  let token: string | undefined
  do {
    const page = await r2.client.send(new ListObjectsV2Command({ Bucket: r2.bucket, ContinuationToken: token }))
    keys.push(...(page.Contents ?? []).flatMap((object) => (object.Key ? [object.Key] : [])))
    token = page.NextContinuationToken
  } while (token)
  return keys
}

const git = promisify(execFile)

/** 푸시한 매니페스트. 아직 푸시한 적이 없으면 빈 목록이다. */
async function pushedManifest(): Promise<DownloadManifest> {
  const file = path.relative(await gitRoot(), MANIFEST)
  const shown = await git("git", ["show", `origin/main:${file}`], { cwd: path.dirname(MANIFEST) }).catch(() => undefined)
  return shown ? JSON.parse(shown.stdout) : { editions: [], withdrawn: [] }
}

async function gitRoot() {
  return (await git("git", ["rev-parse", "--show-toplevel"], { cwd: path.dirname(MANIFEST) })).stdout.trim()
}

let cached: { client: S3Client; bucket: string } | null | undefined

function writer() {
  if (cached !== undefined) return cached
  const { R2_ACCOUNT_ID, R2_BUCKET, R2_WRITE_ACCESS_KEY_ID, R2_WRITE_SECRET_ACCESS_KEY } = process.env
  cached =
    R2_ACCOUNT_ID && R2_BUCKET && R2_WRITE_ACCESS_KEY_ID && R2_WRITE_SECRET_ACCESS_KEY
      ? {
          bucket: R2_BUCKET,
          client: new S3Client({
            region: "auto",
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId: R2_WRITE_ACCESS_KEY_ID, secretAccessKey: R2_WRITE_SECRET_ACCESS_KEY },
          }),
        }
      : null
  return cached
}

function required() {
  const r2 = writer()
  if (!r2) throw new Error("R2 쓰기 키(R2_ACCOUNT_ID, R2_BUCKET, R2_WRITE_*)가 없다")
  return r2
}
