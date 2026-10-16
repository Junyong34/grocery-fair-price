"use client"

import { useState } from "react"

import { Skeleton } from "@workspace/ui/components/skeleton"

import type { Paper, PrintSpec } from "@workspace/seasonal/print/spec"

import { PREVIEW_MAX_WIDTH } from "../constants"
import { useElementWidth } from "../hooks/use-element-width"
import { previewFrame } from "../lib/preview"

export function PrintPreview({ src, paper, orientation }: { src: string; paper: Paper; orientation: PrintSpec["orientation"] }) {
  const [loaded, setLoaded] = useState<string>()
  const [box, width] = useElementWidth<HTMLDivElement>(PREVIEW_MAX_WIDTH)
  const frame = previewFrame(paper, orientation)
  return (
    <div ref={box} className="relative w-full overflow-hidden rounded-2xl bg-hairline" style={{ maxWidth: PREVIEW_MAX_WIDTH, aspectRatio: `${frame.width} / ${frame.height}` }}>
      {loaded !== src && <Skeleton className="absolute inset-6 rounded-none" />}
      <iframe title="인쇄 미리보기" src={src} onLoad={() => setLoaded(src)} style={{ width: frame.width, height: frame.height, zoom: width / frame.width }} className="border-0" />
    </div>
  )
}
