import { redirect } from "next/navigation"

import { routes } from "@/shared/routes"

// 서비스 메인. 지금은 제철 메인으로 보낸다(307, 임시 이동이라 브라우저가 기억하지 않는다).
// 식재료 가격 비교 메인이 생기면 이 파일을 그 화면으로 바꾼다.
export default function Page() {
  redirect(routes.seasonal.root)
}
