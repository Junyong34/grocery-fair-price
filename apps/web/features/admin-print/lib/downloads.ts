import { downloadDir } from "@workspace/seasonal/print/edition"
import { PAPER_SIZES } from "@workspace/seasonal/print/spec"

/** 어드민에 보여 줄 에디션의 다운로드 주소 꼴. 용지 자리를 비운다. */
export function downloadPattern(id: string): string {
  return `${downloadDir(id)}/{${PAPER_SIZES.map((paper) => paper.toLowerCase()).join("|")}}.pdf`
}
