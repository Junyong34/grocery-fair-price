import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { dishNames } from "@workspace/seasonal/data/dishes"
import { festivalOf, FESTIVALS, isFestival } from "@workspace/seasonal/data/festivals"
import { seasonOfMonth } from "@workspace/seasonal/data/seasons"

import { FestivalView } from "@/features/seasonal/festivals/festival-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { festivalSeo } from "@/shared/seo/titles"

type Params = PageProps<"/seasonal/festivals/[festival]">["params"]

export function generateStaticParams() {
  return FESTIVALS.map(({ slug }) => ({ festival: slug }))
}

export async function generateMetadata(
  props: PageProps<"/seasonal/festivals/[festival]">
): Promise<Metadata> {
  const { festival: slug } = await props.params
  if (!isFestival(slug)) return {}
  const item = festivalOf(slug)
  return createMetadata({
    ...festivalSeo(slug),
    path: routes.seasonal.festival(slug),
    ogImage: {
      title: `${item.name} 제철 절식`,
      subtitle: dishNames(item.traditionalDishes).join(" · "),
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
  return (
    <>
      {/* /seasonal/festivals는 페이지 없이 proxy가 보내므로 중간 단계를 두지 않는다. 명절은 Event 마크업 조건(예매 가능한 장소)에 맞지 않아 쓰지 않는다. */}
      <JsonLd data={breadcrumb([{ name: festivalSeo(festival).title, path: routes.seasonal.festival(festival) }])} />
      <FestivalView slug={festival} />
    </>
  )
}
