import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { Suspense } from "react"

import {
  BABY_FRUIT_STAGES,
  getFruitsByStage,
  isStageValid,
  type BabyFruitStageId,
} from "@workspace/seasonal/data/infant-fruits"

import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { breadcrumb, JsonLd } from "@/shared/seo/json-ld"
import { babyFoodFruitsStageSeo } from "@/shared/seo/titles"

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

/** 도감 본문은 ../layout.tsx가 그린다. 페이지는 주소 검증과 메타데이터·구조화 데이터만 맡는다. */
export default function Page(props: Props) {
  return (
    <Suspense fallback={null}>
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

  return (
    <JsonLd
      data={breadcrumb([
        { name: "제철달력", path: routes.seasonal.root },
        { name: "월령별 과일 도감", path: routes.babyFood.fruits },
        {
          name: `${stageInfo.name} 아기 과일`,
          path: routes.babyFood.fruitsStage(stage),
        },
      ])}
    />
  )
}
