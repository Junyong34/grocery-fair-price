import "server-only"

import { readFile } from "node:fs/promises"
import path from "node:path"

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { downloadPath, objectKey } from "@workspace/seasonal/print/edition"
import { PAPER_SIZES, PUBLISHED_PAPERS } from "@workspace/seasonal/print/spec"

import { PUBLIC_DIR } from "./files"

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

/** 이 에디션의 객체를 모두 지운다. 공개하지 않은 용지 키도 지운다(없으면 그냥 넘어간다). */
export async function removeEditionObjects(id: string) {
  const r2 = required()
  await Promise.all(PAPER_SIZES.map((paper) => r2.client.send(new DeleteObjectCommand({ Bucket: r2.bucket, Key: objectKey(id, paper) }))))
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
