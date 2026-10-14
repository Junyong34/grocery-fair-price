import { notFound } from "next/navigation"
import { Suspense } from "react"

import { isSeason, SEASONS } from "@workspace/seasonal/data/seasons"

import { SeasonDetail } from "@/features/seasonal/seasons/season-detail"

type Params = PageProps<"/seasonal/seasons/[season]">["params"]

export function generateStaticParams() {
  return SEASONS.map((season) => ({ season }))
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
