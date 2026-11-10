import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { Suspense } from "react"

import {
  BABY_FRUIT_STAGES,
  getFruitsByStage,
  isStageValid,
  type BabyFruitStageId,
} from "@workspace/seasonal/data/infant-fruits"

import { FruitsDashboard } from "@/features/baby-food/fruits/fruits-dashboard"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { babyFoodFruitsStageSeo } from "@/shared/seo/titles"
import { getSeoulToday } from "@/shared/today"

type Props = PageProps<"/baby-food/fruits/[stage]">

export function generateStaticParams() {
  return [
    ...BABY_FRUIT_STAGES.map(({ id }) => ({ stage: id })),
    { stage: "12-23-months" },
    { stage: "24-months" },
  ]
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { stage } = await props.params
  if (stage === "12-23-months" || stage === "24-months") return {}
  if (!isStageValid(stage)) return {}
  const stageInfo = BABY_FRUIT_STAGES.find((s) => s.id === stage)
  if (!stageInfo) return {}

  const fruits = getFruitsByStage(stage as BabyFruitStageId)
  const seo = babyFoodFruitsStageSeo(
    stageInfo.monthRange,
    stageInfo.subTitle,
    fruits.map((f) => f.name),
  )

  return createMetadata({
    ...seo,
    path: routes.babyFood.fruitsStage(stage),
    ogImage: {
      title: `${stageInfo.monthRange} 아기 과일 시기`,
      badge: "이유식",
    },
  })
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy />}>
      <StageContent params={props.params} />
    </Suspense>
  )
}

async function StageContent({ params }: { params: Props["params"] }) {
  const { stage } = await params
  if (stage === "12-23-months" || stage === "24-months") {
    permanentRedirect(routes.babyFood.fruitsStage("12-months"))
  }
  if (!isStageValid(stage)) notFound()

  const stageInfo = BABY_FRUIT_STAGES.find((s) => s.id === stage)
  if (!stageInfo) notFound()

  const today = await getSeoulToday()

  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: "제철달력", path: routes.seasonal.root },
          { name: "이유식 재료 궁합표", path: routes.babyFood.pairings },
          { name: "월령별 과일 시기 도감", path: routes.babyFood.fruits },
          {
            name: `${stageInfo.name} 아기 과일`,
            path: routes.babyFood.fruitsStage(stage),
          },
        ])}
      />
      <FruitsDashboard
        stageId={stage as BabyFruitStageId}
        currentMonth={today.month}
      />
    </>
  )
}
