import { notFound } from "next/navigation"

import { AdminShell } from "@/features/admin-shell/admin-shell"
import { adminEnabled } from "@/features/admin-print/server/guard"
import { createMetadata } from "@/shared/meta"

import "@/features/admin-print/admin.css"

export const metadata = createMetadata({ title: "어드민", noIndex: true })

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!adminEnabled) notFound()
  return <AdminShell>{children}</AdminShell>
}
