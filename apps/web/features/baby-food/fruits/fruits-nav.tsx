import Link from "next/link"

import { routes } from "@/shared/routes"

export function FruitsNav({ current }: { current: "fruits" | "pairings" }) {
  return (
    <nav className="fruits-subnav" aria-label="이유식 서비스 탭">
      <Link
        href={routes.babyFood.pairings}
        className="fruits-nav-tab"
        data-active={current === "pairings"}
      >
        이유식 재료 궁합표
      </Link>
      <Link
        href={routes.babyFood.fruits}
        className="fruits-nav-tab"
        data-active={current === "fruits"}
      >
        월령별 과일 시기 도감
      </Link>
    </nav>
  )
}
