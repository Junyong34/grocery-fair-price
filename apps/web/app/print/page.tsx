import { notFound } from "next/navigation"
import { Suspense } from "react"

import { decodeSpec, isPaper } from "@workspace/seasonal/print/spec"

import { PairingPrint } from "@/features/baby-food/pairing-print"
import { PrintDocument } from "@/features/print/print-document"
import { createMetadata } from "@/shared/meta"
import { PRINT_SCREEN_GUTTER } from "@/shared/print-screen"

import "@/features/baby-food/pairing.css"

export const metadata = createMetadata({ title: "인쇄", noIndex: true })

// 인쇄 전용 페이지. ?spec=<base64url>&paper=<A4|A3>
// 어드민과 PDF 생성기만 쓰므로 개발 서버에서만 열린다(.scratch/calendar-print/spec.md).
export default function Page(props: PageProps<"/print">) {
  if (process.env.NODE_ENV === "production") notFound()
  return (
    <Suspense fallback={null}>
      <Print searchParams={props.searchParams} />
    </Suspense>
  )
}

async function Print({ searchParams }: { searchParams: PageProps<"/print">["searchParams"] }) {
  const query = await searchParams
  const spec = typeof query.spec === "string" ? decodeSpec(query.spec) : new Error("spec 없음")
  if (spec instanceof Error) notFound()
  if (spec.kind === "baby-food-pairings") {
    const style: React.CSSProperties & { "--print-gutter": string } = { "--print-gutter": `${PRINT_SCREEN_GUTTER}px` }
    return (
      <main className="print-root pairing-edition-print" data-print-ready style={style}>
        <PairingPrint title={spec.title} />
      </main>
    )
  }
  const paper = typeof query.paper === "string" && isPaper(query.paper) ? query.paper : "A4"
  return <PrintDocument spec={spec} paper={paper} />
}
