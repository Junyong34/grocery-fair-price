"use client"

import Link from "next/link"

import { HeroButton } from "@workspace/ui/components/hero-button"

/**
 * 관련 명절 링크. cojeev hero-button 종이 접힘(paper-fold): 달력 한 장을 넘기듯 귀퉁이가 접힌 gold 카드. 비교 페이지 festival-buttons는 2026-10-16에 지웠다(`git show 22520eb:apps/web/app/examples/festival-buttons/page.tsx`)
 * HeroButton asChild는 자식을 React.Children.only로 읽는다. 서버 컴포넌트가 넘긴 Link는 빌드(프리렌더) 때 지연 참조로 와서 거기서 깨지므로,
 * Link를 이 클라이언트 컴포넌트 안에서 만든다.
 */
export function FestivalLink({ href, name }: { href: string; name: string }) {
  return (
    <HeroButton
      asChild
      appearance="paper-fold"
      size="sm"
      // sm(48px)도 시트 안에서는 커서 한 단계 더 줄인다. 접힌 귀퉁이·화살표도 같이 줄인다.
      className="h-10! min-w-0! gap-2.5! px-4! text-sm! [&_.v-hero-button\_\_arrow]:h-5! [&_.v-hero-button\_\_arrow]:w-7! [&_.v-hero-button\_\_paint>i:first-child]:size-4!"
    >
      <Link href={href} className="no-underline">
        {name}
      </Link>
    </HeroButton>
  )
}
