import { routes } from "@/shared/routes"
import { SearchLink } from "@/shared/shell/search-link"
import { BackButton, SubHeader } from "@/shared/shell/sub-header"

const TITLE_ID = "product-title"

/** 상품 이름과 카테고리 · 품목 · 용량. 데스크톱은 이 줄에 뒤로 버튼을 둔다. */
export function ProductHeader({ name, sub }: { name: string; sub: string }) {
  return (
    <header className="flex items-start gap-2">
      <BackButton fallbackHref={routes.home} className="-ms-2 max-lg:hidden" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-sm font-semibold text-stone">상품 판매가</p>
        <h1
          id={TITLE_ID}
          className="font-heading text-3xl leading-[1.25] font-bold tracking-[-0.015em] text-balance [overflow-wrap:anywhere] break-keep text-ink lg:text-4xl"
        >
          {name}
        </h1>
        {sub && (
          <p className="text-sm leading-relaxed [overflow-wrap:anywhere] break-keep text-caption">
            {sub}
          </p>
        )}
      </div>
    </header>
  )
}

/** 모바일 하위 헤더. 상품 이름은 본문 제목이 헤더 아래로 지나간 뒤에 올린다. */
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
