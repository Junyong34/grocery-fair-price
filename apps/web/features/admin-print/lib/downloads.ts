import { downloadDir } from "@workspace/seasonal/print/edition"
import { PAPER_SIZES, type Paper } from "@workspace/seasonal/print/spec"

/** 어드민에 보여 줄 에디션의 다운로드 주소 꼴. 용지 자리를 비운다. */
export function downloadPattern(id: string, papers: readonly Paper[] = PAPER_SIZES): string {
  const names = papers.map((paper) => paper.toLowerCase())
  const filename = names.length === 1 ? names[0] : `{${names.join("|")}}`
  return `${downloadDir(id)}/${filename}.pdf`
}
