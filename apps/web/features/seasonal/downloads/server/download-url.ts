import "server-only"

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { downloadPath, objectKey, type ManifestEntry } from "@workspace/seasonal/print/edition"
import { attachmentDisposition } from "@workspace/seasonal/print/listing"
import type { PublishedPaper } from "@workspace/seasonal/print/spec"

/** 서명 링크 수명(초). 링크가 퍼져도 이 뒤에는 받을 수 없다(ADR 0003). */
const SIGNED_URL_SECONDS = 60

/**
 * 내려받기 주소가 넘겨 줄 PDF 주소. 저장소를 못 쓰면 null(503).
 * R2 읽기 키가 있으면 비공개 버킷의 짧은 서명 링크다(ADR 0003). 키가 없으면 개발 서버는 어드민이 생성한 로컬 파일(public/downloads)로 넘긴다.
 */
export async function downloadUrl(edition: ManifestEntry, paper: PublishedPaper): Promise<string | null> {
  const r2 = reader()
  if (r2) {
    const command = new GetObjectCommand({
      Bucket: r2.bucket,
      Key: objectKey(edition.id, paper),
      ResponseContentDisposition: attachmentDisposition(edition, paper),
    })
    return getSignedUrl(r2.client, command, { expiresIn: SIGNED_URL_SECONDS })
  }
  if (process.env.NODE_ENV !== "production") return downloadPath(edition.id, paper)
  console.error("downloads: R2 읽기 키(R2_ACCOUNT_ID, R2_BUCKET, R2_READ_ACCESS_KEY_ID, R2_READ_SECRET_ACCESS_KEY)가 없어 내려받기를 막았다")
  return null
}

let cached: { client: S3Client; bucket: string } | null | undefined

/** 읽기 전용 키로 만든 R2 클라이언트. 키가 하나라도 없으면 null. 서명은 서버에서 계산만 하고 R2를 부르지 않는다. */
function reader() {
  if (cached !== undefined) return cached
  const { R2_ACCOUNT_ID, R2_BUCKET, R2_READ_ACCESS_KEY_ID, R2_READ_SECRET_ACCESS_KEY } = process.env
  cached =
    R2_ACCOUNT_ID && R2_BUCKET && R2_READ_ACCESS_KEY_ID && R2_READ_SECRET_ACCESS_KEY
      ? {
          bucket: R2_BUCKET,
          client: new S3Client({
            region: "auto",
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId: R2_READ_ACCESS_KEY_ID, secretAccessKey: R2_READ_SECRET_ACCESS_KEY },
          }),
        }
      : null
  return cached
}
