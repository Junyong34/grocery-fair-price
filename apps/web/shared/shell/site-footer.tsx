import Link from "next/link"

import { SITE_CONFIG } from "@/shared/meta"
import { routes } from "@/shared/routes"

const linkClassName = "inline-flex min-h-11 items-center underline underline-offset-4 hover:text-ink"

export function SiteFooter() {
  return (
    <footer className="pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-6">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-2 px-[18px] pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8 lg:px-6">
        <p className="font-heading text-base font-bold text-ink">{SITE_CONFIG.name}</p>
        <nav aria-label="사이트 정보" className="flex flex-wrap gap-x-6 text-sm text-caption">
          <Link href={routes.settings.sources} className={linkClassName}>
            데이터 출처
          </Link>
          <Link href={routes.privacy} className={linkClassName}>
            개인정보 처리방침
          </Link>
        </nav>
      </div>
    </footer>
  )
}
