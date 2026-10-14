import { notFound } from "next/navigation"
import { Suspense } from "react"

import { FESTIVALS, isFestival } from "@workspace/seasonal/data/festivals"

import { FestivalView } from "@/features/seasonal/festivals/festival-view"

type Params = PageProps<"/seasonal/festivals/[festival]">["params"]

export function generateStaticParams() {
  return FESTIVALS.map(({ slug }) => ({ festival: slug }))
}

export default function Page(
  props: PageProps<"/seasonal/festivals/[festival]">
) {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <Festival params={props.params} />
    </Suspense>
  )
}

async function Festival({ params }: { params: Params }) {
  const { festival } = await params
  if (!isFestival(festival)) notFound()
  return <FestivalView slug={festival} />
}
