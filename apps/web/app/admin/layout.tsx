import { notFound } from "next/navigation"

import { adminEnabled } from "@/features/admin-print/server/guard"
import { createMetadata } from "@/shared/meta"

import "@/features/admin-print/admin.css"

export const metadata = createMetadata({ title: "인쇄물 어드민", noIndex: true })

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!adminEnabled) notFound()
  return <div className="admin-ui mx-auto min-h-svh max-w-[1200px] bg-canvas px-6 py-8 text-ink">{children}</div>
}
