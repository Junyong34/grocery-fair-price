"use client"

import { Button } from "@workspace/ui/components/button"
import { openBottomSheet } from "@workspace/ui/components/bottom-sheet"
import { withJosa } from "@workspace/price/copy"

import { SettingWhere } from "./setting-section"

/**
 * 기기에 쌓인 기록 하나를 지우는 행. 누르면 확인 시트를 띄우고, "지우기"를 고를 때만 onClear를 부른다.
 * count가 0이면 지울 것이 없어 버튼을 끈다. 불러오기 전(null)에는 개수를 숨긴다.
 */
export function ClearRow({
  label,
  where,
  count,
  onClear,
}: {
  label: string
  where: string
  count: number | null
  onClear: () => void
}) {
  const confirm = async () => {
    const ok = await openBottomSheet<boolean>(
      { title: `${withJosa(label, "을/를")} 지울까요?`, description: "이 기기에 저장된 기록이라 지우면 되돌릴 수 없어요." },
      (choose) => (
        <>
          <Button variant="danger" fullWidth onClick={() => choose(true)}>
            지우기
          </Button>
          <Button variant="outline" fullWidth onClick={() => choose(false)}>
            취소
          </Button>
        </>
      )
    )
    if (ok) onClear()
  }
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="flex flex-col">
        <span className="text-[15px] text-ink">
          {label}
          <SettingWhere>{where}</SettingWhere>
        </span>
        {count !== null && <span className="text-xs text-stone">{count}개 저장됨</span>}
      </span>
      <Button variant="outline" size="sm" disabled={count === 0} onClick={confirm}>
        지우기
      </Button>
    </div>
  )
}
