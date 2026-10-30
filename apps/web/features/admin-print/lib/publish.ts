import { isBuildCurrent, type BuildRecord, type Edition } from "@workspace/seasonal/print/edition"

// 저장할 때 비공개 R2(ADR 0003)에 무엇을 할지. 공개로 바뀔 때 올리고, 공개에서 빠질 때 지운다.
// 공개 중인 에디션의 옵션을 바꾸면 R2에는 옛 PDF가 남고, PDF를 다시 만들 때 같은 키에 덮어쓴다.

export type StorageAction = "upload" | "delete" | "none"
export type SavePlan = { storage: StorageAction } | { error: string }

export function savePlan(
  saved: Edition,
  next: Edition,
  { build, storageReady }: { build: BuildRecord | undefined; storageReady: boolean },
): SavePlan {
  const storage = storageAction(saved, next)
  if (storage === "upload" && !build) return { error: "PDF를 만든 뒤 공개하세요." }
  if (storage === "upload" && !isBuildCurrent(next.spec, build)) return { error: "지금 옵션으로 PDF를 다시 만든 뒤 공개하세요." }
  if (storage !== "none" && !storageReady) return { error: "R2 쓰기 키(R2_WRITE_*)가 없어 공개 상태를 바꿀 수 없어요." }
  return { storage }
}

function storageAction(saved: Edition, next: Edition): StorageAction {
  const was = saved.status === "published"
  const is = next.status === "published"
  return is && !was ? "upload" : was && !is ? "delete" : "none"
}
