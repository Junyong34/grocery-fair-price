import Link from "next/link"
import { SearchX } from "lucide-react"

import { routes } from "@/shared/routes"
import { StatusView, statusAction } from "@/shared/status-view"

/** 404 본문. 셸 없는 루트 404(app/not-found.tsx)와 제철 영역 404(app/seasonal/not-found.tsx)가 같이 쓴다. */
export function NotFoundView() {
  return (
    <StatusView
      Icon={SearchX}
      title="페이지를 찾을 수 없어요"
      body="주소가 바뀌었거나 없는 페이지예요. 시세나 제철달력에서 다시 찾아 보세요."
    >
      <Link href={routes.home} className={statusAction.primary}>
        오늘 시세 보기
      </Link>
      <Link href={routes.seasonal.root} className={statusAction.secondary}>
        제철달력 보기
      </Link>
    </StatusView>
  )
}
