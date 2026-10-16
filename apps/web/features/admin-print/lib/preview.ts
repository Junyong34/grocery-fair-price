import { PAPERS, type Paper, type PrintSpec } from "@workspace/seasonal/print/spec"

const MM_TO_PX = 96 / 25.4
/** /print는 화면에서 용지 둘레에 이만큼(px) 여백을 둔다(features/print/print.css의 .print-root). */
const PRINT_SCREEN_GUTTER = 24

/** 미리보기 iframe이 담을 /print 화면 한 장의 크기(px). 용지에 둘레 여백을 더한다. */
export function previewFrame(paper: Paper, orientation: PrintSpec["orientation"]): { width: number; height: number } {
  const { width, height } = PAPERS[paper]
  const sheet = orientation === "landscape" ? { width: height, height: width } : { width, height }
  return { width: sheet.width * MM_TO_PX + PRINT_SCREEN_GUTTER * 2, height: sheet.height * MM_TO_PX + PRINT_SCREEN_GUTTER * 2 }
}
