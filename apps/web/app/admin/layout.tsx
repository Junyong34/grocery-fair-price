import { notFound } from "next/navigation"

import { adminEnabled } from "@/features/admin-print/server/guard"
import { createMetadata } from "@/shared/meta"

import "@/features/admin-print/admin.css"

export const metadata = createMetadata({ title: "인쇄물 어드민", noIndex: true })

// 인쇄물 어드민. 관리자가 자기 컴퓨터의 개발 서버에서만 쓴다. 운영 빌드에서는 404다.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!adminEnabled) notFound()
  return <div className="admin-ui mx-auto min-h-svh max-w-[1200px] bg-canvas px-6 py-8 text-ink">{children}</div>
}
