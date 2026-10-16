import { downloadDir, downloadPath } from "@workspace/seasonal/print/edition"
import { KIND_PAGES, PAPER_SIZES, type PageKey, type Paper, type PrintKind } from "@workspace/seasonal/print/spec"

// 만든 PDF의 주소와 쪽 이름. 파일명 규칙은 도메인의 downloadPath 하나뿐이고, 여기서는 화면에 보일 꼴만 만든다.

/** 한 용지의 PDF 주소를 쪽 순서대로 */
export function pdfPaths(id: string, kind: PrintKind, paper: Paper): string[] {
  return KIND_PAGES[kind].map((page) => downloadPath(id, paper, page))
}

/** 용지와 쪽 자리를 비운 주소 꼴. 관리자에게 링크 규칙을 알려 줄 때 쓴다. */
export function downloadPattern(id: string): string {
  return `${downloadDir(id)}/{${PAPER_SIZES.map((paper) => paper.toLowerCase()).join("|")}}/{쪽}.pdf`
}

export const pageLabel = (page: PageKey) => (page === "all" ? "전체" : `${page}월`)
