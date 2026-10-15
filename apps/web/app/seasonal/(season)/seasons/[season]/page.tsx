import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { SEASON_COPY } from "@workspace/seasonal/data/copy"
import { isSeason, SEASONS } from "@workspace/seasonal/data/seasons"

import { SeasonDetail } from "@/features/seasonal/seasons/season-detail"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

type Params = PageProps<"/seasonal/seasons/[season]">["params"]

export function generateStaticParams() {
  return SEASONS.map((season) => ({ season }))
}

export async function generateMetadata(
  props: PageProps<"/seasonal/seasons/[season]">
): Promise<Metadata> {
  const { season } = await props.params
  if (!isSeason(season)) return {}
  const info = SEASON_COPY[season]
  return createMetadata({
    title: `${info.name}의 제철`,
    description: `${info.name}철 대표 식재료와 음식. ${info.description}`,
    path: routes.seasonal.season(season),
    ogImage: {
      title: `${info.name}의 제철`,
      subtitle: info.description,
      badge: info.name,
      season,
    },
  })
}

export default function Page(props: PageProps<"/seasonal/seasons/[season]">) {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <Season params={props.params} />
    </Suspense>
  )
}

async function Season({ params }: { params: Params }) {
  const { season } = await params
  if (!isSeason(season)) notFound()
  return <SeasonDetail season={season} />
}
