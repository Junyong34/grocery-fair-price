import Image from "next/image"

import logo from "@/public/images/brand/logo-symbol.svg"

/** 문구 없는 공통 브랜드 심볼. SVG를 그대로 제공해 작은 헤더에서도 선명하게 보인다. */
export function BrandLogo() {
  return (
    <Image
      src={logo}
      alt="제철달력"
      width={40}
      height={40}
      unoptimized
      loading="eager"
      draggable={false}
      className="size-10 shrink-0 select-none"
    />
  )
}
