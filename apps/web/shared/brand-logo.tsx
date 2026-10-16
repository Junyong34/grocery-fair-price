import Image from "next/image"

import logo from "@/public/images/brand/logo-lockup.svg"
import { SITE_CONFIG } from "@/shared/meta"

/** 고운돋움 Regular를 패스로 만든 가로 로고. 모바일의 떠 있는 헤더에서는 심볼 부분만 보여 탭 공간을 확보한다. */
export function BrandLogo() {
  return (
    <span className="inline-flex h-10 w-[120px] shrink-0 overflow-hidden group-data-stuck/header:w-10 lg:group-data-stuck/header:w-[120px]">
      <Image
        src={logo}
        alt={SITE_CONFIG.name}
        width={120}
        height={40}
        unoptimized
        loading="eager"
        draggable={false}
        className="h-10 w-[120px] max-w-none shrink-0 select-none"
      />
    </span>
  )
}
