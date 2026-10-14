import Link from "next/link"

import { SEASONS } from "@workspace/seasonal/data/seasons"

import { routes } from "@/shared/routes"

import { ScreenStub } from "@/features/seasonal/components/screen-stub"

export default function Page() {
  return (
    <ScreenStub id="3a" title="계절 · 4장 히어로">
      <ul className="flex gap-3 text-sm">
        {SEASONS.map((season) => (
          <li key={season}>
            <Link href={routes.seasonal.season(season)}>{season}</Link>
          </li>
        ))}
      </ul>
    </ScreenStub>
  )
}
