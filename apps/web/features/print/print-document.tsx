import type { Paper, PrintKind, PrintSpec } from "@workspace/seasonal/print/spec"

import { PRINT_SCREEN_GUTTER } from "@/shared/print-screen"

import { MonthPoster } from "./month-poster"
import { MonthlySheets } from "./monthly"
import { SeasonPoster } from "./season-poster"
import { YearSheet } from "./year-sheet"

import "./print.css"

type KindProps<K extends PrintKind> = { spec: Extract<PrintSpec, { kind: K }>; paper: Paper }

const KIND_COMPONENTS: { [K in PrintKind]: (props: KindProps<K>) => React.ReactNode } = {
  monthly: MonthlySheets,
  "year-sheet": YearSheet,
  "season-poster": SeasonPoster,
  "month-poster": MonthPoster,
}

/** 인쇄 사양 하나를 용지 시트로 그린다. 미리보기 iframe과 PDF 생성기가 같은 화면을 연다. */
export function PrintDocument({ spec, paper }: { spec: PrintSpec; paper: Paper }) {
  const Component = KIND_COMPONENTS[spec.kind] as (props: KindProps<PrintKind>) => React.ReactNode
  return (
    <main className="print-root" data-print-ready style={{ "--print-gutter": `${PRINT_SCREEN_GUTTER}px` } as React.CSSProperties}>
      <Component spec={spec} paper={paper} />
    </main>
  )
}
