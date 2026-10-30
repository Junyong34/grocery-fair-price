import type { PrintKind } from "@workspace/seasonal/print/spec"

import { getSeoulToday } from "@/shared/today"

import { CreateEditionForm } from "./create-edition-form"

/** 새 에디션 폼. 연도 선택의 기준인 올해(서울)는 서버에서 정해 넘긴다. 부르는 쪽은 <Suspense> 안에 있어야 한다(getSeoulToday). */
export async function NewEditionForm({ nextIds }: { nextIds: Record<PrintKind, string> }) {
  const { year } = await getSeoulToday()
  return <CreateEditionForm nextIds={nextIds} currentYear={year} />
}
