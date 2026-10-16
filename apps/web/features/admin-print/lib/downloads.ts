import { downloadDir, downloadPath } from "@workspace/seasonal/print/edition"
import { KIND_PAGES, PAPER_SIZES, type PageKey, type Paper, type PrintKind } from "@workspace/seasonal/print/spec"

export function pdfPaths(id: string, kind: PrintKind, paper: Paper): string[] {
  return KIND_PAGES[kind].map((page) => downloadPath(id, paper, page))
}

export function downloadPattern(id: string): string {
  return `${downloadDir(id)}/{${PAPER_SIZES.map((paper) => paper.toLowerCase()).join("|")}}/{쪽}.pdf`
}

export const pageLabel = (page: PageKey) => (page === "all" ? "전체" : `${page}월`)
