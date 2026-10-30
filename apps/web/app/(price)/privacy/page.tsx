import { PrivacyView } from "@/features/legal/privacy/privacy-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

export const metadata = createMetadata({
  title: "개인정보 처리방침",
  description: "장볼날이 모으는 이용 기록(Google Analytics), 보관 기간, 국외 이전, 거부 방법을 알려 드려요.",
  path: routes.privacy,
})

// 개인정보 처리방침. 앱 전체 문서지만 셸(헤더 · 하단 내비)이 있어야 다른 화면으로 돌아갈 수 있어 가격 그룹에 둔다.
export default function Page() {
  return <PrivacyView />
}
