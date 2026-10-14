import { notFound } from "next/navigation"
import { Suspense } from "react"

import { isSeason, SEASONS } from "@workspace/seasonal/data/seasons"

import { ScreenStub } from "@/features/seasonal/components/screen-stub"

type Params = PageProps<"/seasonal/seasons/[season]">["params"]

export function generateStaticParams() {
  return SEASONS.map((season) => ({ season }))
}

export default function Page(props: PageProps<"/seasonal/seasons/[season]">) {
  return (
    <Suspense fallback={<ScreenStub id="3a" title="계절 상세" />}>
      <Season params={props.params} />
    </Suspense>
  )
}

async function Season({ params }: { params: Params }) {
  const { season } = await params
  if (!isSeason(season)) notFound()
  return <ScreenStub id="3a" title={`계절 상세 · ${season}`} />
}
