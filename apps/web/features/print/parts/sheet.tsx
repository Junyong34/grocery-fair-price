import { PAPERS, type Paper, type PrintSpec } from "@workspace/seasonal/print/spec"

const FONTS = {
  "gowun-batang": "var(--font-heading)",
  pretendard: "var(--font-sans)",
} as const

/** 용지 한 장. 크기·방향·서체·배율을 CSS 변수로 내려 준다. 안쪽 길이는 모두 --u로 쓴다. */
export function Sheet({
  spec,
  paper,
  background,
  className,
  children,
}: {
  spec: PrintSpec
  paper: Paper
  background: string
  className?: string
  children: React.ReactNode
}) {
  const { width, height } = PAPERS[paper]
  const landscape = spec.orientation === "landscape"
  const style = {
    "--sheet-w": `${landscape ? height : width}mm`,
    "--sheet-h": `${landscape ? width : height}mm`,
    "--t": spec.type.scale,
    "--print-heading": FONTS[spec.type.heading],
    "--print-number": FONTS[spec.type.number],
    background,
  } as React.CSSProperties
  return (
    <section className={`print-sheet ${className ?? ""}`} data-paper={paper} data-orientation={spec.orientation} data-margin={spec.margin} style={style}>
      {children}
    </section>
  )
}
