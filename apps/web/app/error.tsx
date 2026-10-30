"use client"

import Link from "next/link"
import { useEffect } from "react"
import { CloudAlert } from "lucide-react"

import { routes } from "@/shared/routes"
import { StatusView, statusAction } from "@/shared/status-view"

// 화면을 그리다 난 오류. 영역 레이아웃(셸)까지 대신하므로 셸 없이 본문만 보인다.
// 셸 자체의 오류가 여기서 다시 나지 않도록 셸을 씌우지 않는다. 루트 레이아웃 오류는 Next 기본 화면이 받는다.
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <main id="main">
      <StatusView
        Icon={CloudAlert}
        title="화면을 불러오지 못했어요"
        body="잠시 뒤 다시 시도해 보세요. 계속 안 되면 시세 홈에서 다시 들어와 주세요."
      >
        <button type="button" onClick={retry} className={statusAction.primary}>
          다시 시도
        </button>
        <Link href={routes.home} className={statusAction.secondary}>
          시세 홈으로
        </Link>
      </StatusView>
    </main>
  )
}
