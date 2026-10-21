import { sheetSize, type Paper, type PrintSpec } from "@workspace/seasonal/print/spec"

import { PRINT_SCREEN_GUTTER } from "@/shared/print-screen"

const MM_TO_PX = 96 / 25.4

export function previewFrame(paper: Paper, orientation: PrintSpec["orientation"]): { width: number; height: number } {
  const sheet = sheetSize(paper, orientation)
  return { width: sheet.width * MM_TO_PX + PRINT_SCREEN_GUTTER * 2, height: sheet.height * MM_TO_PX + PRINT_SCREEN_GUTTER * 2 }
}
