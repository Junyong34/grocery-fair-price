import Link from "next/link"

import { routes } from "@/shared/routes"

import { ScreenStub } from "@/features/seasonal/components/screen-stub"

export default function Page() {
  return (
    <ScreenStub id="1h" title="나의 식탁">
      <Link className="text-sm underline" href={routes.seasonal.food("apple")}>
        사과 상세 열기 (시트)
      </Link>
    </ScreenStub>
  )
}
