import { Suspense } from "react"

import { editionName } from "@workspace/seasonal/print/listing"

import { DetailSheet } from "@/features/seasonal/components/detail-sheet"
import { EditionDetail } from "@/features/seasonal/downloads/edition-detail"
import { findEdition } from "@/shared/downloads-manifest"

// 메타데이터도 전체 페이지와 같다(품종 시트와 같은 이유).
export { generateMetadata, generateStaticParams } from "../../../downloads/[edition]/page"

type Params = PageProps<"/seasonal/downloads/[edition]">["params"]

// 내려받기 목록에서 에디션을 누르면 페이지 대신 이 시트가 뜬다(인터셉팅 라우트).
export default function Page(props: PageProps<"/seasonal/downloads/[edition]">) {
  return (
    <Suspense>
      <Sheet params={props.params} />
    </Suspense>
  )
}

async function Sheet({ params }: { params: Params }) {
  const edition = findEdition((await params).edition)
  if (!edition) return null
  // 공유는 아래 버튼 줄에 있어 제목 줄에는 두지 않는다.
  return (
    <DetailSheet title={editionName(edition)} action={null}>
      <EditionDetail edition={edition} />
    </DetailSheet>
  )
}
