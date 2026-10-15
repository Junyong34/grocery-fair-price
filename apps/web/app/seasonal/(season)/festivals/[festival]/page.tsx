import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { FESTIVALS, isFestival } from "@workspace/seasonal/data/festivals"
import { seasonOfMonth } from "@workspace/seasonal/data/seasons"

import { FestivalView } from "@/features/seasonal/festivals/festival-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

type Params = PageProps<"/seasonal/festivals/[festival]">["params"]

export function generateStaticParams() {
  return FESTIVALS.map(({ slug }) => ({ festival: slug }))
}

export async function generateMetadata(
  props: PageProps<"/seasonal/festivals/[festival]">
): Promise<Metadata> {
  const { festival: slug } = await props.params
  if (!isFestival(slug)) return {}
  const item = FESTIVALS.find((festival) => festival.slug === slug)!
  return createMetadata({
    title: `${item.name} 제철 음식`,
    description: `${item.name}(${item.period})에 즐기는 전통 음식과 제철 식재료 이야기.`,
    path: routes.seasonal.festival(slug),
    ogImage: {
      title: `${item.name} 제철 절식`,
      subtitle: `${item.traditionalDishes.join(" · ")}`,
      badge: "명절 절식",
      season: seasonOfMonth(item.month),
    },
  })
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
