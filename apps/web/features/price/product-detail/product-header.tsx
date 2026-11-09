"use client"

import { routes } from "@/shared/routes"
import { SearchLink } from "@/shared/shell/search-link"
import { BackButton, SubHeader } from "@/shared/shell/sub-header"

const TITLE_ID = "product-title"

/** 상품 상세 맨 위 줄: 상품 이름과 카테고리 · 품목 · 용량. 데스크톱은 ‹ 뒤로가 이 줄에 있다. 판정이 없어 담기 버튼은 두지 않는다(catalog-scale/10). */
export function ProductHeader({ name, sub }: { name: string; sub: string }) {
  return (
    <div id={TITLE_ID} className="flex items-start gap-2">
      <BackButton fallbackHref={routes.home} className="-ml-2 max-lg:hidden" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="font-heading text-[24px] leading-tight font-bold text-ink lg:text-[26px]">{name}</h1>
        <span className="text-sm text-caption">{sub}</span>
      </div>
    </div>
  )
}

/** 모바일 하위 헤더: ‹ · 🔍. 상품 이름은 본문 제목 줄이 헤더 밑으로 지나간 뒤에만 올린다(P3와 같다). */
export function ProductHeaderBar({ name }: { name: string }) {
  return (
    <SubHeader
      title={name}
      fallbackHref={routes.home}
      revealAfter={TITLE_ID}
      actions={<SearchLink href={routes.price.search} label="시세 검색" />}
    />
  )
}
