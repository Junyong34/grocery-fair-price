import { Settings } from "lucide-react"
import Link from "next/link"

import { routes } from "@/shared/routes"

/** 헤더의 ⚙. 어느 화면에서 눌러도 같은 설정 화면(/settings)으로 간다(.scratch/shell-unify/spec.md 5장). */
export function SettingsLink() {
  return (
    <Link
      href={routes.settings.root}
      aria-label="설정"
      className="inline-flex size-10 items-center justify-center rounded-full text-ink no-underline hover:bg-gold-wash focus-visible:outline-2 focus-visible:outline-ring"
    >
      <Settings aria-hidden size={20} strokeWidth={1.6} />
    </Link>
  )
}
