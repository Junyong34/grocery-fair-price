import { isBuildCurrent, type BuildRecord, type Edition } from "@workspace/seasonal/print/edition"

// 저장할 때 비공개 R2(ADR 0003)에 무엇을 할지. 공개로 바뀔 때만 올린다.
// 내리거나 지울 때는 R2를 그대로 둔다. 배포 전에는 운영 목록에 아직 있어서, 바로 지우면 그 사이 내려받기가 깨진다.
// 남은 객체는 배포 뒤 어드민의 "R2 정리"가 지운다. 공개 중에 옵션을 바꾸면 PDF를 다시 만들 때 같은 키에 덮어쓴다.

export type StorageAction = "upload" | "none"
export type SavePlan = { storage: StorageAction } | { error: string }

export function savePlan(
  saved: Edition,
  next: Edition,
  { build, storageReady }: { build: BuildRecord | undefined; storageReady: boolean },
): SavePlan {
  if (next.status !== "published" || saved.status === "published") return { storage: "none" }
  if (!build) return { error: "PDF를 만든 뒤 공개하세요." }
  if (!isBuildCurrent(next.spec, build)) return { error: "지금 옵션으로 PDF를 다시 만든 뒤 공개하세요." }
  if (!storageReady) return { error: "R2 쓰기 키(R2_WRITE_*)가 없어 공개할 수 없어요." }
  return { storage: "upload" }
}
